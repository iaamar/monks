/**
 * evalHarness.gs — Eval harness (Moves #3, #4, #5)
 *
 * Turns "run it once and eyeball the logs" into a repeatable measurement:
 *   - GOLDEN_DATASET : a fixed, versioned set of cases with expected properties.
 *   - runEvals()     : generate + score every case, persist per-iteration rows,
 *                      and emit an aggregate scorecard (per-dim means, pass rate,
 *                      avg iterations / latency / call counts) keyed by run_id and
 *                      model versions — so any change becomes a measurable A/B.
 *   - calibrateJudge(): compare the vision judge's overall_score to human labels
 *                      (Pearson r + MAE) before trusting the gate.
 *
 * Everything lands in one spreadsheet (auto-created if RESULTS_SHEET_ID is empty):
 *   sheets: eval_runs | run_summary | human_labels
 */

/**
 * Fresh-slate helpers for a clean run.
 *
 *   resetResults()      : wipe eval_runs / run_summary / human_labels data rows
 *                         (keeps headers) in the CURRENT results spreadsheet.
 *   newResultsSheet()   : forget the cached spreadsheet so the next runEvals()
 *                         creates a brand-new one (old data left untouched).
 *   cleanRunEvals()     : resetResults() then runEvals(), one click.
 */
function resetResults() {
  var ss = getResultsSpreadsheet();
  ['eval_runs', 'run_summary', 'human_labels'].forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (sh && sh.getLastRow() > 1) {
      sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent();
    }
  });
  Logger.log('Cleared data rows (headers kept) in ' + ss.getUrl());
  return ss.getUrl();
}

function newResultsSheet() {
  PropertiesService.getScriptProperties().deleteProperty('RESULTS_SHEET_ID');
  Logger.log('Forgot cached RESULTS_SHEET_ID. Next runEvals() will create a fresh spreadsheet.');
}

function cleanRunEvals() {
  resetResults();
  return runEvals();
}

/**
 * Fixed evaluation set. Keep this small, versioned, and stable — changing it
 * changes what your metrics mean. `expected` fields are the ground truth the
 * deterministic checks (and reviewers) compare against.
 */
var GOLDEN_DATASET = [
  {
    id: 'sw-es-oceanblue',
    description: 'A vibrant ad for a modern smartwatch, featuring a sleek design and a fitness-focused lifestyle background.',
    variant: { language: 'Spanish', color: 'Ocean Blue',   colorHex: '#1CA9C9', buttonText: 'Comprar Ahora' }
  },
  {
    id: 'sw-fr-sunsetorange',
    description: 'A vibrant ad for a modern smartwatch, featuring a sleek design and a fitness-focused lifestyle background.',
    variant: { language: 'French',  color: 'Sunset Orange', colorHex: '#FD5E53', buttonText: 'Acheter Maintenant' }
  },
  {
    id: 'sw-de-forestgreen',
    description: 'A vibrant ad for a modern smartwatch, featuring a sleek design and a fitness-focused lifestyle background.',
    variant: { language: 'German',  color: 'Forest Green',  colorHex: '#228B22', buttonText: 'Jetzt Kaufen' }
  },
  {
    id: 'sw-ja-crimson',
    description: 'A vibrant ad for a modern smartwatch, featuring a sleek design and a fitness-focused lifestyle background.',
    variant: { language: 'Japanese', color: 'Crimson Red',  colorHex: '#DC143C', buttonText: '今すぐ購入' }
  },
  {
    id: 'sw-en-royalpurple',
    description: 'A minimalist ad for a premium smartwatch, focused on all-day battery and workout tracking.',
    variant: { language: 'English',  color: 'Royal Purple',  colorHex: '#7851A9', buttonText: 'Shop Now' }
  }
];

/**
 * Run the full evaluation. Returns the aggregate scorecard and writes all rows
 * to the results spreadsheet. This is the function to run to compare changes.
 */
function runEvals() {
  var runId = 'run_' + Utilities.formatDate(new Date(), 'UTC', "yyyyMMdd'T'HHmmss'Z'");
  var ss = getResultsSpreadsheet();
  var rowsSheet = getOrCreateSheet(ss, 'eval_runs', EVAL_RUN_HEADERS);

  Logger.log(`=== runEvals ${runId} | ${GOLDEN_DATASET.length} cases | ${CONFIG.PIPELINE_VERSION} ===`);

  var perCase = [];
  for (var i = 0; i < GOLDEN_DATASET.length; i++) {
    var c = GOLDEN_DATASET[i];
    var rec;
    try {
      rec = generateSingleVariant(c.description, c.variant, i);
    } catch (e) {
      Logger.log(`Case ${c.id} crashed: ${e}`);
      rec = { variant: c.variant, error: String(e.message || e), iterations: [], approved: false,
              cost: { textCalls: 0, visionCalls: 0, imageCalls: 0 }, latencyMs: 0, totalIterations: 0 };
    }
    rec._caseId = c.id;
    perCase.push(rec);
    writeCaseRows(rowsSheet, runId, c, rec);
    SpreadsheetApp.flush();
  }

  var scorecard = buildScorecard(runId, perCase);
  writeSummaryRow(ss, scorecard);

  Logger.log('=== SCORECARD ===');
  Logger.log(JSON.stringify(scorecard, null, 2));
  Logger.log(`Results: ${ss.getUrl()}`);
  return scorecard;
}

/** Aggregate a run into a scorecard. Nulls are excluded from means (Move #5). */
function buildScorecard(runId, perCase) {
  var dimSums = {}, dimCounts = {};
  EVAL_DIMENSIONS.forEach(function (d) { dimSums[d] = 0; dimCounts[d] = 0; });

  var overallSum = 0, overallCount = 0;
  var passes = 0, evaluated = 0, errors = 0;
  var iterSum = 0, latencySum = 0;
  var textCalls = 0, visionCalls = 0, imageCalls = 0;

  perCase.forEach(function (rec) {
    iterSum += rec.totalIterations || 0;
    latencySum += rec.latencyMs || 0;
    if (rec.cost) { textCalls += rec.cost.textCalls; visionCalls += rec.cost.visionCalls; imageCalls += rec.cost.imageCalls; }

    var ev = rec.finalEvaluation;
    if (!ev || ev.eval_status === 'error') { errors++; return; }
    evaluated++;
    if (rec.approved) passes++;
    if (typeof ev.overall_score === 'number') { overallSum += ev.overall_score; overallCount++; }
    EVAL_DIMENSIONS.forEach(function (d) {
      var s = ev.scores ? ev.scores[d] : null;
      if (typeof s === 'number') { dimSums[d] += s; dimCounts[d] += 1; }
    });
  });

  var dimMeans = {};
  EVAL_DIMENSIONS.forEach(function (d) {
    dimMeans[d] = dimCounts[d] ? round2(dimSums[d] / dimCounts[d]) : null;
  });

  var n = perCase.length;
  return {
    run_id: runId,
    timestamp: new Date().toISOString(),
    pipeline_version: CONFIG.PIPELINE_VERSION,
    text_model: CONFIG.TEXT_MODEL,
    vision_model: CONFIG.VISION_MODEL,
    image_model: CONFIG.IMAGE_MODEL,
    n_cases: n,
    n_evaluated: evaluated,
    n_errors: errors,
    pass_rate: evaluated ? round2(passes / evaluated) : 0,
    mean_overall: overallCount ? round2(overallSum / overallCount) : null,
    dimension_means: dimMeans,
    avg_iterations: n ? round2(iterSum / n) : 0,
    avg_latency_ms: n ? Math.round(latencySum / n) : 0,
    total_text_calls: textCalls,
    total_vision_calls: visionCalls,
    total_image_calls: imageCalls
  };
}

/**
 * calibrateJudge — is the vision judge trustworthy? Compares its overall_score
 * to human labels for matching (case_id, iteration) rows. Reports Pearson r and
 * mean absolute error. An uncalibrated LLM judge should not gate anything.
 *
 * Fill the `human_labels` sheet first (seedHumanLabelsTemplate builds it), then
 * pass the run_id you scored (defaults to the most recent run in eval_runs).
 */
function calibrateJudge(runId) {
  var ss = getResultsSpreadsheet();
  var runsSheet = ss.getSheetByName('eval_runs');
  var labelsSheet = ss.getSheetByName('human_labels');
  if (!runsSheet || !labelsSheet) throw new Error('Need eval_runs and human_labels sheets. Run runEvals() and seedHumanLabelsTemplate() first.');

  var runs = sheetToObjects(runsSheet);
  if (!runId) {
    // latest run_id present in eval_runs
    runs.forEach(function (r) { if (!runId || r.run_id > runId) runId = r.run_id; });
  }
  var judgeByKey = {};
  runs.forEach(function (r) {
    if (r.run_id === runId) judgeByKey[r.case_id + '|' + r.iteration] = Number(r.overall_score);
  });

  var labels = sheetToObjects(labelsSheet);
  var judge = [], human = [];
  labels.forEach(function (l) {
    var key = l.case_id + '|' + l.iteration;
    var j = judgeByKey[key];
    var h = Number(l.human_overall);
    if (typeof j === 'number' && !isNaN(j) && !isNaN(h)) { judge.push(j); human.push(h); }
  });

  if (judge.length < 2) throw new Error(`Not enough paired labels for run ${runId} (found ${judge.length}). Fill human_labels.`);

  var report = {
    run_id: runId,
    n_pairs: judge.length,
    pearson_r: round2(pearson(judge, human)),
    mean_abs_error: round2(meanAbsError(judge, human)),
    judge_mean: round2(mean(judge)),
    human_mean: round2(mean(human))
  };
  report.verdict = report.pearson_r >= 0.7 && report.mean_abs_error <= 1.5
    ? 'ACCEPTABLE — judge tracks humans; gating is justified.'
    : 'WEAK — recalibrate weights/threshold or swap judge before trusting the gate.';

  Logger.log('=== JUDGE CALIBRATION ===');
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

/** Create the human_labels sheet pre-filled with the (case_id, iteration) keys to score. */
function seedHumanLabelsTemplate(runId) {
  var ss = getResultsSpreadsheet();
  var runsSheet = ss.getSheetByName('eval_runs');
  if (!runsSheet) throw new Error('Run runEvals() first.');
  var runs = sheetToObjects(runsSheet);
  if (!runId) runs.forEach(function (r) { if (!runId || r.run_id > runId) runId = r.run_id; });

  var labels = getOrCreateSheet(ss, 'human_labels', ['case_id', 'iteration', 'language', 'fileUrl', 'human_overall', 'notes']);
  runs.filter(function (r) { return r.run_id === runId; }).forEach(function (r) {
    labels.appendRow([r.case_id, r.iteration, r.language, r.fileUrl, '', '']);
  });
  Logger.log(`Seeded human_labels for ${runId}. Fill the human_overall column (1-10), then run calibrateJudge('${runId}').`);
  return ss.getUrl();
}

// ===========================================================================
//  Spreadsheet persistence
// ===========================================================================

var EVAL_RUN_HEADERS = [
  'run_id', 'timestamp', 'pipeline_version', 'text_model', 'vision_model', 'image_model',
  'case_id', 'language', 'color', 'expected_cta', 'iteration', 'winning',
  'overall_score', 'approved', 'eval_status',
  'product_fidelity', 'color_adherence', 'cta_accuracy', 'localization_signal', 'ad_aesthetic',
  'cta_method', 'observed_text', 'issues', 'latency_ms', 'fileUrl'
];

function writeCaseRows(sheet, runId, caseDef, rec) {
  var ts = new Date().toISOString();
  var iters = rec.iterations && rec.iterations.length ? rec.iterations
            : [{ iteration: 0, evaluation: rec.finalEvaluation || null }];

  iters.forEach(function (it) {
    var ev = it.evaluation || {};
    var s = ev.scores || {};
    var isWinning = (rec.winningIteration === it.iteration);
    sheet.appendRow([
      runId, ts, CONFIG.PIPELINE_VERSION, CONFIG.TEXT_MODEL, CONFIG.VISION_MODEL, CONFIG.IMAGE_MODEL,
      caseDef.id, caseDef.variant.language, caseDef.variant.color, caseDef.variant.buttonText,
      it.iteration, isWinning,
      numOrBlank(ev.overall_score), ev.approved === true, ev.eval_status || (rec.error ? 'error' : ''),
      numOrBlank(s.product_fidelity), numOrBlank(s.color_adherence), numOrBlank(s.cta_accuracy),
      numOrBlank(s.localization_signal), numOrBlank(s.ad_aesthetic),
      (ev.methods && ev.methods.cta_accuracy) || '',
      truncate(ev.observed_text || '', 200),
      truncate(((ev.issues || []).join(' | ')), 400),
      isWinning ? (rec.latencyMs || '') : '',
      isWinning ? (rec.fileUrl || '') : ''
    ]);
  });
}

function writeSummaryRow(ss, sc) {
  var headers = ['run_id', 'timestamp', 'pipeline_version', 'text_model', 'vision_model', 'image_model',
                 'n_cases', 'n_evaluated', 'n_errors', 'pass_rate', 'mean_overall',
                 'product_fidelity', 'color_adherence', 'cta_accuracy', 'localization_signal', 'ad_aesthetic',
                 'avg_iterations', 'avg_latency_ms', 'total_text_calls', 'total_vision_calls', 'total_image_calls'];
  var sheet = getOrCreateSheet(ss, 'run_summary', headers);
  var d = sc.dimension_means || {};
  sheet.appendRow([
    sc.run_id, sc.timestamp, sc.pipeline_version, sc.text_model, sc.vision_model, sc.image_model,
    sc.n_cases, sc.n_evaluated, sc.n_errors, sc.pass_rate, numOrBlank(sc.mean_overall),
    numOrBlank(d.product_fidelity), numOrBlank(d.color_adherence), numOrBlank(d.cta_accuracy),
    numOrBlank(d.localization_signal), numOrBlank(d.ad_aesthetic),
    sc.avg_iterations, sc.avg_latency_ms, sc.total_text_calls, sc.total_vision_calls, sc.total_image_calls
  ]);
}

function getResultsSpreadsheet() {
  var id = PropertiesService.getScriptProperties().getProperty('RESULTS_SHEET_ID') || CONFIG.RESULTS_SHEET_ID;
  if (id) return SpreadsheetApp.openById(id);
  var ss = SpreadsheetApp.create('Ad Generator — Eval Results');
  PropertiesService.getScriptProperties().setProperty('RESULTS_SHEET_ID', ss.getId());
  Logger.log(`Created results spreadsheet: ${ss.getUrl()}`);
  return ss;
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function sheetToObjects(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  return values.slice(1).map(function (row) {
    var o = {};
    headers.forEach(function (h, i) { o[h] = row[i]; });
    return o;
  });
}

// ===========================================================================
//  Stats + formatting helpers
// ===========================================================================

function mean(xs) { return xs.reduce(function (a, b) { return a + b; }, 0) / xs.length; }
function round2(n) { return Math.round(n * 100) / 100; }
function numOrBlank(n) { return (typeof n === 'number' && !isNaN(n)) ? n : ''; }
function truncate(s, n) { s = String(s || ''); return s.length > n ? s.substring(0, n) + '…' : s; }

function meanAbsError(a, b) {
  var s = 0; for (var i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length;
}

function pearson(a, b) {
  var n = a.length, ma = mean(a), mb = mean(b);
  var num = 0, da = 0, db = 0;
  for (var i = 0; i < n; i++) {
    var xa = a[i] - ma, xb = b[i] - mb;
    num += xa * xb; da += xa * xa; db += xb * xb;
  }
  if (da === 0 || db === 0) return 0;
  return num / Math.sqrt(da * db);
}
