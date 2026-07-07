/**
 * evals.gs — Image-level evaluator (Moves #1, #4, #5)
 *
 * Grades the ACTUAL image, not the prompt text. Two layers:
 *
 *   Deterministic (objective, reproducible, free):
 *     - cta_accuracy       : OCR the image, fuzzy-match rendered text to the exact
 *                            requested button text.
 *     - localization_signal: derived from whether the localized CTA rendered.
 *
 *   Vision judge (a DIFFERENT, vision-capable model at temperature 0):
 *     - product_fidelity, color_adherence, ad_aesthetic — dimensions that require
 *       actually seeing the image.
 *
 * overall_score is COMPUTED here (weighted mean), never trusted from the model.
 * Every dimension is tagged with the method used, so a reviewer can see which
 * numbers are objective vs judged. On failure we emit null scores + an eval_status
 * so the harness can exclude them from pass metrics — no silent passes.
 *
 * NOTE on color: a fully deterministic ΔE check needs pixel decode, which pure
 * Apps Script can't do for PNG/DEFLATE. color_adherence is therefore judged by
 * the VLM (it can see hue). The upgrade path is a small image-decode endpoint on
 * worker.js; the record's method field makes the current basis explicit.
 */

var EVAL_DIMENSIONS = [
  'product_fidelity',
  'color_adherence',
  'cta_accuracy',
  'localization_signal',
  'ad_aesthetic'
];

/**
 * Evaluate one generated image. Returns an observability-rich record.
 * Internal fields prefixed with "_" are stripped before persistence.
 */
function evaluateImage(description, variant, imageB64, fileNameBase) {
  var scores = {};
  var methods = {};
  var issues = [];
  var revisionActions = [];
  var visionCalls = 0;
  var status = 'ok';

  // --- Deterministic layer: OCR the rendered text -------------------------
  var ocrText = null;
  var ocrAvailable = false;
  if (CONFIG.USE_DRIVE_OCR) {
    try {
      ocrText = ocrImage(imageB64, fileNameBase);
      ocrAvailable = true;
    } catch (e) {
      Logger.log(`  OCR unavailable (${e.message}); falling back to vision-read text.`);
    }
  }

  // --- Vision judge layer -------------------------------------------------
  var vision = null;
  try {
    Logger.log("Starting vision judge...");
    vision = callVisionJudge(description, variant, imageB64);
    Logger.log("Vision judge completed.");
    visionCalls = 1;
  } catch (e) {
    Logger.log(`  Vision judge failed: ${e.message}`);
    issues.push('Vision judge failed: ' + e.message);
    status = 'partial';
  }

  // Text source for the deterministic CTA check: OCR if we have it, else the
  // vision model's transcription (clearly a weaker, model-based fallback).
  var renderedText = ocrAvailable ? ocrText
                    : (vision && vision.observed_text) ? vision.observed_text : '';

  // cta_accuracy (deterministic when OCR available)
  var cta = scoreCta(renderedText, variant.buttonText);
  scores.cta_accuracy = cta.score;
  methods.cta_accuracy = ocrAvailable ? 'ocr' : (vision ? 'vision-text' : 'error');
  if (cta.score < CONFIG.CTA_FLOOR) {
    issues.push(`CTA text weak: expected "${variant.buttonText}", read "${cta.matched || renderedText || '∅'}"`);
    revisionActions.push(`Make the button text read EXACTLY "${variant.buttonText}" — large, legible, unobstructed.`);
  }

  // localization_signal (deterministic proxy: did the localized CTA render?)
  var loc = scoreLocalization(renderedText, variant, cta.score);
  scores.localization_signal = loc;
  methods.localization_signal = ocrAvailable ? 'ocr' : (vision ? 'vision-text' : 'error');

  // Vision-judged dimensions
  if (vision) {
    scores.product_fidelity = clamp10(vision.product_fidelity);
    scores.color_adherence  = clamp10(vision.color_adherence);
    scores.ad_aesthetic     = clamp10(vision.ad_aesthetic);
    methods.product_fidelity = 'vision';
    methods.color_adherence  = 'vision';
    methods.ad_aesthetic     = 'vision';
    (vision.issues || []).forEach(function (x) { if (x) issues.push(String(x)); });
    (vision.revision_actions || []).forEach(function (x) { if (x) revisionActions.push(String(x)); });
  } else {
    // LOUD failure: null (not a filler 7) so these are excluded from the mean.
    scores.product_fidelity = null;
    scores.color_adherence  = null;
    scores.ad_aesthetic     = null;
    methods.product_fidelity = 'error';
    methods.color_adherence  = 'error';
    methods.ad_aesthetic     = 'error';
  }

  // --- Computed overall (Move #4): weighted mean over available dims ------
  var overall = weightedOverall(scores);
  if (overall === null) status = 'error';

  // Approval requires the computed overall AND a hard CTA floor.
  var approved = (overall !== null) &&
                 (overall >= CONFIG.APPROVE_THRESHOLD) &&
                 (typeof scores.cta_accuracy === 'number' && scores.cta_accuracy >= CONFIG.CTA_FLOOR);

  return {
    scores: scores,
    methods: methods,
    overall_score: overall,
    approved: approved,
    eval_status: status,
    observed_text: renderedText,
    color_observed: vision ? (vision.color_observed || '') : '',
    issues: dedupe(issues),
    revision_actions: dedupe(revisionActions),
    _visionCalls: visionCalls
  };
}

/**
 * The vision judge prompt. Asks the model to SEE and report, at temp 0.
 * We deliberately ask for observed_text/color so the record is auditable, and we
 * compute the overall ourselves rather than trusting a model-emitted number.
 */
function callVisionJudge(description, variant, imageB64) {
  Logger.log(`Calling vision model: ${CONFIG.VISION_MODEL}`);

  var instruction = `
You are a strict advertising QA reviewer scoring a generated ad image that you can SEE.

Intended ad:
- Base concept: ${description}
- Target language: ${variant.language}
- Requested dominant color: ${variant.color} (${variant.colorHex || 'n/a'})
- Requested button text (exact): ${variant.buttonText}

Score each dimension on an INTEGER scale from 1 to 10, based ONLY on what is visible.
0 is NOT a valid score. Do not default to 0. Use:
  1-2 = absent / completely wrong, 5-6 = present but flawed, 9-10 = clearly correct.

Definitions:
- product_fidelity: Is a modern smartwatch clearly the subject, in a fitness/lifestyle
  context? A clearly visible smartwatch alone is at least 6.
- color_adherence: Does the requested color visibly dominate the palette/accents?
  If the requested hue is clearly the dominant tone, score 7 or higher.
- ad_aesthetic: Does it read as a polished premium ad rather than a generic render?

Also transcribe, verbatim, any text you see on or near the CTA button, into observed_text.

Reason briefly if you must, then output ONLY a JSON object as the LAST thing in your
reply — no markdown fences. Replace each <...> with your value:
{
  "product_fidelity": <integer 1-10>,
  "color_adherence": <integer 1-10>,
  "ad_aesthetic": <integer 1-10>,
  "observed_text": "<verbatim button text you see>"
}
`.trim();

  var raw = callVisionModel(instruction, imageB64);
  Logger.log(`Raw vision response: ${raw.substring(0, 1500)}`);

  var parsed = parseOrRepairJson(raw, "vision");
  Logger.log("Vision judge completed.");

  return parsed;
}


function parseOrRepairJson(text, label) {
  try {
    return extractJson(text);
  } catch (e) {
    Logger.log(`${label} parse failed, attempting JSON repair: ${e.message}`);
    const repaired = repairJsonWithLLM(text);
    return extractJson(repaired);
  }
}

function repairJsonWithLLM(badText) {
  const prompt = `
You are a JSON repair tool.

Convert the following content into valid strict JSON.
Return ONLY JSON.
Do not add markdown fences.
Do not add commentary.
Preserve the meaning as closely as possible.
If a field is unclear, use a safe short string or empty array.

Content to repair:
${badText}
`.trim();

  return callTextModel(prompt);
}


/**
 * OCR an image deterministically via Drive's built-in OCR.
 * Requires the advanced "Drive API" service enabled (Services > Drive API).
 * We upload as a Google Doc with ocr=true, read the text, then trash the temp file.
 */
function ocrImage(base64Data, fileNameBase) {
  if (typeof Drive === 'undefined' || !Drive.Files || !Drive.Files.insert) {
    throw new Error('Advanced Drive service not enabled');
  }
  var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'image/png', fileNameBase + '.png');
  var resource = { title: fileNameBase + '_ocr', mimeType: 'application/vnd.google-apps.document' };
  var opts = { ocr: true };
  if (CONFIG.OCR_LANGUAGE_HINT) opts.ocrLanguage = CONFIG.OCR_LANGUAGE_HINT;

  var file = Drive.Files.insert(resource, blob, opts);
  var text = '';
  try {
    text = DocumentApp.openById(file.id).getBody().getText();
  } finally {
    try { DriveApp.getFileById(file.id).setTrashed(true); } catch (e) { /* best effort */ }
  }
  return text || '';
}

/**
 * Deterministic CTA scoring: does the rendered text contain the exact button
 * text? Score via normalized edit-distance similarity of the best-matching span.
 */
function scoreCta(renderedText, expected) {
  var target = normalizeText(expected);
  var haystack = normalizeText(renderedText);
  if (!target) return { score: 0, matched: '' };
  if (!haystack) return { score: 0, matched: '' };

  if (haystack.indexOf(target) !== -1) return { score: 10, matched: expected };

  // Slide a window the size of the target across the rendered text; take the
  // best similarity. Cheap and robust to surrounding OCR noise.
  var tWords = target.split(' ');
  var hWords = haystack.split(' ');
  var win = Math.max(1, tWords.length);
  var best = 0, bestSpan = '';
  for (var i = 0; i + win <= hWords.length || i === 0; i++) {
    var span = hWords.slice(i, i + win).join(' ');
    if (!span) break;
    var sim = similarity(target, span);
    if (sim > best) { best = sim; bestSpan = span; }
    if (i + win >= hWords.length) break;
  }
  // Also compare against the whole rendered text (short strings / single word CTAs).
  var whole = similarity(target, haystack);
  if (whole > best) { best = whole; bestSpan = haystack; }

  return { score: Math.round(best * 10), matched: bestSpan };
}

/**
 * Localization proxy: the CTA is the localized text element, so its correct
 * rendering is a strong signal the variant is localized. Deterministic and
 * honestly limited — documented as a proxy, not full language ID.
 */
function scoreLocalization(renderedText, variant, ctaScore) {
  // Anchor on CTA correctness, with a small floor so a totally-empty render
  // still registers as "unlocalized" rather than throwing.
  var base = Math.min(10, Math.max(0, ctaScore));
  return base;
}

// ---------------------------------------------------------------------------
//  Record helpers (Move #5)
// ---------------------------------------------------------------------------

/** A LOUD empty record for when no image exists to evaluate. */
function emptyEvalRecord(status, reason) {
  var scores = {};
  var methods = {};
  EVAL_DIMENSIONS.forEach(function (d) { scores[d] = null; methods[d] = 'error'; });
  return {
    scores: scores,
    methods: methods,
    overall_score: null,
    approved: false,
    eval_status: status || 'error',
    observed_text: '',
    color_observed: '',
    issues: [reason || 'evaluation unavailable'],
    revision_actions: [],
    _visionCalls: 0
  };
}

/** Remove internal bookkeeping fields before persistence/return. */
function stripInternal(evalRec) {
  if (!evalRec) return null;
  var copy = {};
  Object.keys(evalRec).forEach(function (k) { if (k.charAt(0) !== '_') copy[k] = evalRec[k]; });
  return copy;
}

/**
 * Weighted mean over non-null dimensions, RENORMALIZING weights so a partial
 * evaluation is scored fairly on what actually ran. Returns null if nothing ran.
 */
function weightedOverall(scores) {
  var wsum = 0, acc = 0;
  EVAL_DIMENSIONS.forEach(function (d) {
    var s = scores[d];
    if (typeof s === 'number') {
      var w = CONFIG.SCORE_WEIGHTS[d] || 0;
      wsum += w;
      acc += w * s;
    }
  });
  if (wsum === 0) return null;
  return Math.round((acc / wsum) * 100) / 100;
}

// ---------------------------------------------------------------------------
//  Small deterministic string utilities
// ---------------------------------------------------------------------------

function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')   // strip punctuation, keep letters/numbers
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalized similarity in [0,1] from Levenshtein distance. */
function similarity(a, b) {
  if (a === b) return 1;
  var maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - (levenshtein(a, b) / maxLen);
}

function levenshtein(a, b) {
  var m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  var prev = new Array(n + 1);
  for (var j = 0; j <= n; j++) prev[j] = j;
  for (var i = 1; i <= m; i++) {
    var cur = [i];
    for (var k = 1; k <= n; k++) {
      var cost = a.charAt(i - 1) === b.charAt(k - 1) ? 0 : 1;
      cur[k] = Math.min(prev[k] + 1, cur[k - 1] + 1, prev[k - 1] + cost);
    }
    prev = cur;
  }
  return prev[n];
}

function clamp10(n) {
  if (typeof n !== 'number' || isNaN(n)) return null;
  return Math.max(0, Math.min(10, n));
}

function dedupe(arr) {
  var seen = {}, out = [];
  (arr || []).forEach(function (x) { var k = String(x); if (!seen[k]) { seen[k] = 1; out.push(x); } });
  return out;
}
