
/**
 * Google Apps Script — AI Ad Variant Generator (evals-driven)
 *
 * Core pipeline: strategy/prompt -> image -> EVALUATE IMAGE -> revise loop -> save.
 *
 * The evaluator, judge, and eval harness live in:
 *   - evals.gs        (image-level evaluator + vision judge + observability)
 *   - evalHarness.gs  (golden dataset + runEvals runner + scorecard + calibration)
 *
 * Design note (why this differs from a naive version):
 *   We no longer grade the *prompt text*. We generate the image, then measure the
 *   *actual artifact* with a mix of deterministic checks (OCR of rendered CTA text)
 *   and a vision judge (color/product/aesthetic). Low scores feed a revise loop
 *   instead of gating work away. Everything is scored on a fixed dataset and logged.
 */

const CONFIG = {
  // --- Vertex AI (GCP project, OAuth — no API key to manage or leak) --------
  // The Apps Script project's running user needs the "Vertex AI User"
  // (roles/aiplatform.user) IAM role on this project, and the Vertex AI API
  // ("aiplatform.googleapis.com") must be enabled on it. Billing (your $300
  // credit) attaches directly to this project, not to a key.
  VERTEX_PROJECT_ID: 'project-6a7f1c1d-7b43-4da8-94c',
  VERTEX_REGION: 'us-central1',

  // --- Models (Vertex AI Model Garden — publishers/google/models/*) --------
  // Generator (writes the creative strategy + image prompt).
  TEXT_MODEL: 'gemini-2.5-flash',
  // Judge — a strong multimodal model that actually SEES the image.
  VISION_MODEL: 'gemini-2.5-flash',
  // Image model (:predict). Verify this exact id is available in your region
  // via the Vertex Model Garden UI — Imagen resource ids can differ from the
  // AI-Studio ids (e.g. imagen-3.0-generate-002, imagen-4.0-generate-001).
  IMAGE_MODEL: 'imagen-3.0-generate-002',

  // Minimum gap between text/vision calls (generous Gemini quota).
  MIN_CALL_INTERVAL_MS: 3000,
  // Minimum gap between IMAGE calls — new-project Imagen quota is tiny.
  // Your first full run succeeded with ~16-18s natural spacing, so 30s has
  // margin. If "Quota exceeded" persists even at 30s, the cap is effectively
  // per-DAY (not per-minute) and only a quota increase / reset will fix it.
  MIN_IMAGE_INTERVAL_MS: 30000,

  // --- Revise loop (Move #2) ------------------------------------------------
  MAX_REVISIONS: 2,          // up to MAX_REVISIONS+1 images per variant
  APPROVE_THRESHOLD: 7.0,    // overall_score needed to pass
  CTA_FLOOR: 6,              // hard constraint: CTA must render acceptably

  // --- Judge scoring (Move #4) ----------------------------------------------
  // Weights for the deterministic overall_score. Must be keyed by dimension.
  SCORE_WEIGHTS: {
    product_fidelity: 0.25,
    color_adherence: 0.20,
    cta_accuracy: 0.25,
    localization_signal: 0.15,
    ad_aesthetic: 0.15
  },
  JUDGE_TEMPERATURE: 0,      // deterministic judging for reproducibility

  // --- Evaluation plumbing --------------------------------------------------
  USE_DRIVE_OCR: true,       // requires the advanced "Drive API" service enabled
  OCR_LANGUAGE_HINT: '',     // '' = auto; deterministic CTA check is language-agnostic

  // --- Harness / observability (Move #3, #5) --------------------------------
  RESULTS_SHEET_ID: '',      // '' = auto-create a spreadsheet and log its URL
  PIPELINE_VERSION: 'v2-evals-driven',

  MAX_RETRIES: 3
};

/**
 * Demo entry point: generate the three canonical variants once and log results.
 * For measured, dataset-driven runs use runEvals() in evalHarness.gs.
 */
function myFunction() {
  const initialDescription =
    "A vibrant ad for a modern smartwatch, featuring a sleek design and a fitness-focused lifestyle background.";

  const variants = [
    { language: "Spanish", color: "Ocean Blue",    colorHex: "#1CA9C9", buttonText: "Comprar Ahora" },
    { language: "French",  color: "Sunset Orange",  colorHex: "#FD5E53", buttonText: "Acheter Maintenant" },
    { language: "German",  color: "Forest Green",   colorHex: "#228B22", buttonText: "Jetzt Kaufen" }
  ];

  const results = [];
  for (let i = 0; i < variants.length; i++) {
    try {
      results.push(generateSingleVariant(initialDescription, variants[i], i));
    } catch (e) {
      Logger.log(`Variant ${i + 1} (${variants[i].language}) FAILED: ${e}`);
      results.push({ variant: variants[i], error: String(e.message || e), fileUrl: null });
    }
  }

  Logger.log("Workflow Complete. Results:");
  Logger.log(JSON.stringify(results, null, 2));
  return results;
}

/**
 * Generate one ad variant with a CLOSED revise loop (Move #2).
 *
 * Each iteration: generate image -> evaluate the image -> if it clears the bar,
 * stop; otherwise fold the evaluator's feedback into a revised prompt and retry.
 * We always keep the best-scoring iteration, even if none pass (best-of-N).
 *
 * Returns a rich record (used by the harness for scoring + persistence).
 */
function generateSingleVariant(description, variant, index) {
  Logger.log(`--- Variant ${index + 1}: ${variant.language} / ${variant.color} ---`);

  const cost = { textCalls: 0, visionCalls: 0, imageCalls: 0 };
  const t0 = Date.now();

  // Initial creative strategy + prompt (no self-eval theatre; the image is judged).
  const gen = safeGenerateStrategyAndPrompt(description, variant);
  cost.textCalls++;
  let currentPrompt = gen.prompt;
  let plan = gen.plan;
  const usedFallbackGeneration = !!gen._usedFallback; // Move #5: surface silent-fallback rate, don't hide it
  let revisionFailures = 0;

  const iterations = [];
  let best = null;

  for (let iter = 0; iter <= CONFIG.MAX_REVISIONS; iter++) {
    const iterRecord = { iteration: iter, prompt: currentPrompt, plan: plan };

    // --- Generate the artifact ---
    let imageB64 = null, imageError = null;
    try {
      imageB64 = generateImage(currentPrompt);
      cost.imageCalls++;
    } catch (e) {
      imageError = String(e.message || e);
      Logger.log(`  iter ${iter}: image generation failed: ${imageError}`);
    }
    iterRecord.imageError = imageError;

    // --- Evaluate the artifact (Move #1 + #4 + #5) ---
    let evalRec;
    if (imageB64) {
      const fileBase = `Ad_${index + 1}_${variant.language}_${variant.color.replace(/\s+/g, '_')}_it${iter}`;
      evalRec = evaluateImage(description, variant, imageB64, fileBase);
      cost.visionCalls += evalRec._visionCalls || 0;
    } else {
      // No image => an explicit, LOUD failure. Never a silent pass. (Move #5)
      evalRec = emptyEvalRecord('error', 'No image produced for evaluation');
    }
    iterRecord.evaluation = evalRec;

    Logger.log(`  iter ${iter}: overall=${fmt(evalRec.overall_score)} approved=${evalRec.approved} status=${evalRec.eval_status}`);

    // --- Persist the artifact only if this iteration is the best so far ---
    if (best === null || score(evalRec) > score(best.evaluation)) {
      best = { iteration: iter, prompt: currentPrompt, plan: plan, imageB64: imageB64, evaluation: evalRec };
    }
    iterations.push(iterRecord);

    if (evalRec.approved) break;                     // cleared the bar -> done
    if (iter === CONFIG.MAX_REVISIONS) break;        // out of budget
    if (!imageB64) break;                            // can't revise toward nothing

    // --- Close the loop: revise using the evaluator's feedback (Move #2) ---
    try {
      const revised = revisePrompt(description, variant, currentPrompt, evalRec);
      cost.textCalls++;
      currentPrompt = revised.prompt;
      plan = revised.plan || plan;
      Logger.log(`  iter ${iter}: revised prompt using ${((evalRec.revision_actions || []).length)} action(s).`);
    } catch (e) {
      revisionFailures++;
      Logger.log(`  iter ${iter}: revision failed (${e.message}); stopping loop.`);
      break;
    }
  }

  // Save only the winning image to Drive. Failures are logged LOUDLY (Move #5) —
  // a generated-but-unsaved image was previously invisible.
  let fileUrl = null, saveError = null;
  if (best && best.imageB64) {
    try {
      const fileName = `Ad_Variant_${index + 1}_${variant.language}_${variant.color.replace(/\s+/g, '_')}.png`;
      fileUrl = saveImageToDrive(best.imageB64, fileName);
      Logger.log(`  saved winning image (iter ${best.iteration}): ${fileUrl}`);
    } catch (e) {
      saveError = String(e.message || e);
      Logger.log(`  IMAGE SAVE FAILED: ${saveError}`);
    }
  } else {
    Logger.log(`  no image to save (best.imageB64 is empty)`);
  }

  return {
    variant: variant,
    pipeline_version: CONFIG.PIPELINE_VERSION,
    plan: best ? best.plan : plan,
    prompt: best ? best.prompt : currentPrompt,
    finalEvaluation: best ? stripInternal(best.evaluation) : null,
    winningIteration: best ? best.iteration : null,
    totalIterations: iterations.length,
    iterations: iterations.map(function (it) {
      return { iteration: it.iteration, prompt: it.prompt, evaluation: stripInternal(it.evaluation), imageError: it.imageError };
    }),
    approved: best ? best.evaluation.approved : false,
    fileUrl: fileUrl,
    saveError: saveError,
    cost: cost,
    usedFallbackGeneration: usedFallbackGeneration,
    revisionFailures: revisionFailures,
    latencyMs: Date.now() - t0
  };
}

/** Numeric sort key for "best iteration"; nulls rank lowest. */
function score(evalRec) {
  return (evalRec && typeof evalRec.overall_score === 'number') ? evalRec.overall_score : -1;
}
function fmt(n) { return (typeof n === 'number') ? n.toFixed(2) : String(n); }

/**
 * Generate the creative strategy + image prompt. Fallback preserves core
 * requirements if the LLM call fails (but the image is still judged downstream).
 */
function safeGenerateStrategyAndPrompt(description, variant) {
  try {
    const raw = callTextModel(buildSingleShotPrompt(description, variant));
    const parsed = extractJson(raw);
    if (!parsed.prompt) throw new Error('Generation returned no prompt');
    parsed._usedFallback = false;
    return parsed;
  } catch (e) {
    Logger.log(`Strategy generation failed, using fallback: ${e.message}`);
    return {
      _usedFallback: true,
      plan: {
        visual_focus: "Premium smartwatch hero shot",
        layout_strategy: "Central product focus with ad-like composition",
        language_strategy: `Localize for ${variant.language}`,
        color_strategy: `Use ${variant.color} as the dominant palette`,
        cta_strategy: `Include CTA text: ${variant.buttonText}`,
        must_keep: ["smartwatch", "fitness lifestyle background", "premium ad aesthetic"],
        risks: ["text rendering may be inconsistent"]
      },
      prompt:
        `A high-quality product advertisement for a modern smartwatch. ` +
        `Base concept: ${description}. ` +
        `Localized for ${variant.language}-speaking audiences. ` +
        `Use a ${variant.color} (${variant.colorHex || ''}) color palette throughout the scene and design accents. ` +
        `Include a clearly legible call-to-action button with the exact text "${variant.buttonText}". ` +
        `Sleek industrial design, premium materials, clean composition, fitness lifestyle context, ` +
        `polished lighting, sharp commercial photography, high detail, premium branding aesthetic.`
    };
  }
}

/**
 * Fold evaluator feedback into a revised prompt (Move #2). This is the step the
 * old design was missing: revision_actions actually get consumed here.
 */
function revisePrompt(description, variant, currentPrompt, evalRec) {
  const feedback = {
    scores: evalRec.scores,
    major_issues: evalRec.issues || [],
    revision_actions: evalRec.revision_actions || [],
    observed_button_text: evalRec.observed_text || ''
  };

  const prompt = `
You are an expert image-prompt engineer improving an advertising prompt that
UNDERPERFORMED when its image was evaluated.

Base ad description:
"${description}"

Target variant:
- Language: ${variant.language}
- Color Scheme: ${variant.color} (${variant.colorHex || 'n/a'})
- Button Text (EXACT): "${variant.buttonText}"

Current prompt:
"${currentPrompt}"

Evaluation of the CURRENT generated image (weakest areas need the most change):
${JSON.stringify(feedback, null, 2)}

Rewrite the prompt to directly fix the issues above. Prioritize the lowest scores.
If the CTA text was wrong or unreadable, make the button text unmistakable and exact.
If color was off, name the color explicitly and describe where it dominates.
Keep smartwatch + fitness identity intact.

Return ONLY valid JSON, no markdown fences, in this schema:
{
  "plan": {
    "visual_focus": "string",
    "layout_strategy": "string",
    "language_strategy": "string",
    "color_strategy": "string",
    "cta_strategy": "string",
    "must_keep": ["string"],
    "risks": ["string"]
  },
  "prompt": "string"
}
`.trim();

  const parsed = extractJson(callTextModel(prompt));
  if (!parsed.prompt) throw new Error('Revision returned no prompt');
  return parsed;
}

/** Constructs the initial generation prompt. */
function buildSingleShotPrompt(description, v) {
  return `
You are a creative strategist and expert image-prompt engineer for marketing.

Base ad description:
"${description}"

Target variant:
- Language: ${v.language}
- Color Scheme: ${v.color} (${v.colorHex || 'n/a'})
- Button Text (EXACT): "${v.buttonText}"

Task:
1. Create a creative strategy for this ad variation.
2. Write ONE final, high-quality image-generation prompt for a product ad.

Requirements:
- Preserve smartwatch identity and fitness lifestyle from the base description.
- Use ${v.color} as the dominant visual palette.
- Contextualize tone/styling for ${v.language}-speaking audiences.
- Include a clearly legible CTA button with EXACT text: "${v.buttonText}".
- Premium, polished ad creative aesthetic.

Return ONLY valid JSON, no markdown fences, in this schema:
{
  "plan": {
    "visual_focus": "string",
    "layout_strategy": "string",
    "language_strategy": "string",
    "color_strategy": "string",
    "cta_strategy": "string",
    "must_keep": ["string"],
    "risks": ["string"]
  },
  "prompt": "string"
}
`.trim();
}

// ===========================================================================
//  Vertex AI transport (Advanced Service — auth handled by Apps Script)
// ===========================================================================
//
// Requires: Services (+) -> add "Vertex AI API" advanced service in the editor,
// and the Vertex AI API enabled + billed on CONFIG.VERTEX_PROJECT_ID.
// No API key, no manual OAuth header — VertexAI.* calls are authenticated
// automatically using the script's own identity/scopes.

// Proactive rate limiting: space out calls so we stay under quota instead of
// firing immediately and reacting to 429s after the fact. Persisted in
// CacheService so it holds across calls within (and shortly across) a run.
// Separate cache keys so image calls (tight Imagen quota) can be throttled far
// more aggressively than text/vision calls (generous Gemini quota).
var _RATE_LIMIT_CACHE_KEY = 'vertex_last_call_at';
var _IMAGE_RATE_LIMIT_CACHE_KEY = 'vertex_last_image_at';

function throttleApiCall(minInterval, cacheKey) {
  minInterval = minInterval || CONFIG.MIN_CALL_INTERVAL_MS || 6000;
  cacheKey = cacheKey || _RATE_LIMIT_CACHE_KEY;
  const cache = CacheService.getScriptCache();
  const last = Number(cache.get(cacheKey) || 0);
  const now = Date.now();
  const elapsed = now - last;
  if (last && elapsed < minInterval) {
    const wait = minInterval - elapsed;
    Logger.log(`Throttling: waiting ${Math.round(wait / 1000)}s to stay under quota...`);
    Utilities.sleep(wait);
  }
  cache.put(cacheKey, String(Date.now()), 600);
}

/** Builds the publisher-model resource path the Advanced Service methods expect. */
function vertexModelPath(model) {
  return `projects/${CONFIG.VERTEX_PROJECT_ID}/locations/${CONFIG.VERTEX_REGION}/publishers/google/models/${model}`;
}

/**
 * Retries an Advanced Service call on transient errors. The VertexAI service
 * throws plain JS exceptions (no HTTP status code to inspect), so we classify
 * by message content instead: RESOURCE_EXHAUSTED/429 = quota, UNAVAILABLE/503,
 * INTERNAL/500 = transient; anything else (bad model id, PERMISSION_DENIED,
 * INVALID_ARGUMENT) is permanent and thrown immediately.
 */
function callVertexWithRetry(fn, maxRetries, throttleMs, throttleKey) {
  let lastError = "";
  for (let i = 0; i < maxRetries; i++) {
    throttleApiCall(throttleMs, throttleKey);
    try {
      return fn();
    } catch (e) {
      const msg = String(e.message || e);
      lastError = msg;
      // "Quota exceeded" / RESOURCE_EXHAUSTED per-minute caps DO clear with a
      // long enough wait, so treat them as transient (retry with backoff).
      const transient = /RESOURCE_EXHAUSTED|Quota exceeded|429|UNAVAILABLE|503|INTERNAL|500/i.test(msg);
      if (!transient) throw e; // permanent (bad model id, PERMISSION_DENIED, INVALID_ARGUMENT)
      if (i < maxRetries - 1) {
        const wait = 30000 * Math.pow(2, i); // 30s, 60s — long enough to clear a per-minute cap
        Logger.log(`Vertex call transient error, backing off ${Math.round(wait / 1000)}s: ${msg.substring(0, 150)}`);
        Utilities.sleep(wait);
      }
    }
  }
  throw new Error(`Vertex call failed after ${maxRetries} attempts. Last: ${lastError}`);
}

/**
 * Gemini text generation (generator + revision) via Vertex AI. Forces JSON output.
 *
 * thinkingBudget:0 disables Gemini 2.5's internal "thinking" tokens, which
 * otherwise draw from the SAME maxOutputTokens budget as the visible answer —
 * with thinking on, a long nested-JSON response can get silently truncated
 * before the closing brace, which extractJson then reports as "no JSON found".
 * maxOutputTokens is also raised well above the schema's expected size for headroom.
 */
function callTextModel(prompt) {
  return vertexGenerateContent(
    CONFIG.TEXT_MODEL,
    [{ text: prompt }],
    {
      temperature: 0.7,
      maxOutputTokens: 3000,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 }
    }
  );
}

/**
 * Gemini vision judge (Move #4) via Vertex AI. Sends the base64 PNG inline
 * (no hosting needed). temperature 0 + JSON response for reproducible scoring.
 * Same thinking-budget fix applied for consistency, though its short schema
 * made it less likely to truncate in practice.
 */
function callVisionModel(instruction, imageB64) {
  return vertexGenerateContent(
    CONFIG.VISION_MODEL,
    [
      { text: instruction },
      { inline_data: { mime_type: "image/png", data: imageB64 } }
    ],
    {
      temperature: CONFIG.JUDGE_TEMPERATURE,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 }
    }
  );
}

/** Shared Vertex generateContent caller (Advanced Service). Returns the concatenated text of the first candidate. */
function vertexGenerateContent(model, parts, generationConfig) {
  const request = { contents: [{ role: "user", parts: parts }], generationConfig: generationConfig || {} };
  const endpoint = vertexModelPath(model);

  const response = callVertexWithRetry(function () {
    return VertexAI.Projects.Locations.Publishers.Models.generateContent(request, endpoint);
  }, CONFIG.MAX_RETRIES);

  // Surface safety blocks / empty candidates loudly instead of returning junk.
  const cand = response.candidates && response.candidates[0];
  if (!cand) {
    const reason = response.promptFeedback && response.promptFeedback.blockReason;
    throw new Error(`Vertex returned no candidate${reason ? ' (blocked: ' + reason + ')' : ''}: ${JSON.stringify(response).substring(0, 400)}`);
  }
  const out = (cand.content && cand.content.parts || [])
    .map(function (p) { return p.text || ""; }).join("");
  if (!out) throw new Error(`Unexpected Vertex response format (finishReason=${cand.finishReason}): ${JSON.stringify(response).substring(0, 400)}`);
  return out.trim();
}

/** Imagen image generation via Vertex AI's Advanced Service predict() (returns base64 PNG). */
function generateImage(prompt) {
  const request = {
    instances: [{ prompt: prompt }],
    parameters: { sampleCount: 1, aspectRatio: "1:1" }
  };
  const endpoint = vertexModelPath(CONFIG.IMAGE_MODEL);

  const response = callVertexWithRetry(function () {
    return VertexAI.Projects.Locations.Publishers.Models.predict(request, endpoint);
  }, CONFIG.MAX_RETRIES, CONFIG.MIN_IMAGE_INTERVAL_MS, _IMAGE_RATE_LIMIT_CACHE_KEY);

  const pred = response.predictions && response.predictions[0];
  const b64 = pred && (pred.bytesBase64Encoded || pred.b64_json);
  if (b64) return b64;
  throw new Error(`Unexpected Imagen response format: ${JSON.stringify(response).substring(0, 500)}`);
}

/**
 * Vertex AI has no simple public "list my available models" REST call like
 * AI Studio's — publisher models (Gemini, Imagen) are discovered via the
 * Model Garden UI instead: https://console.cloud.google.com/vertex-ai/model-garden
 * (filter by project/region to confirm exact resource ids and regional
 * availability before setting CONFIG.TEXT_MODEL / VISION_MODEL / IMAGE_MODEL).
 */

/**
 * Smoke test: one cheap text call + one cheap Imagen call, each reported
 * pass/fail independently. Use this to check OAuth scope / IAM role / billing
 * status without burning a full runEvals() (which does ~15+ calls).
 *
 * Requires: Vertex AI API enabled on CONFIG.VERTEX_PROJECT_ID, the running
 * user granted "Vertex AI User" (roles/aiplatform.user) on that project, and
 * the "https://www.googleapis.com/auth/cloud-platform" scope declared in the
 * Apps Script manifest (appsscript.json -> oauthScopes).
 */
function testVertexConnection() {
  Logger.log(`--- Testing Vertex AI text/vision (project=${CONFIG.VERTEX_PROJECT_ID}, region=${CONFIG.VERTEX_REGION}) ---`);
  try {
    const out = callTextModel('Reply with exactly this JSON: {"ok": true}');
    Logger.log(`TEXT OK: ${out.substring(0, 200)}`);
  } catch (e) {
    Logger.log(`TEXT FAILED: ${e.message}`);
  }

  Logger.log('--- Testing Vertex AI Imagen (requires billing on the project) ---');
  try {
    const b64 = generateImage('a single red circle on a white background, minimalist');
    Logger.log(`IMAGE OK: received ${b64.length} base64 chars (billing is active)`);
  } catch (e) {
    Logger.log(`IMAGE FAILED: ${e.message}`);
  }
}

/** Extract JSON from model output robustly (strips fences, isolates the object). */
function extractJson(text) {
  const cleaned = String(text)
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try { return JSON.parse(cleaned); } catch (e) { /* fall through */ }

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("No JSON object found in model response");
  }
  const jsonStr = cleaned.substring(first, last + 1);
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`JSON parse failed: ${e.message}. Extracted: ${jsonStr.substring(0, 1000)}`);
  }
}

/** Save base64 PNG to Drive; returns the file URL. */
function saveImageToDrive(base64Data, fileName) {
  const decoded = Utilities.base64Decode(base64Data);
  if (!decoded || decoded.length === 0) throw new Error(`Decoded image is empty for ${fileName}`);
  const blob = Utilities.newBlob(decoded, "image/png", fileName);
  return DriveApp.createFile(blob).getUrl();
}


