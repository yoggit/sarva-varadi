/**
 * Regenerates index.html for all local demo sarva-reports using
 * their existing history and latest-run test data.
 * Run after a core build to pick up new HTML/JS changes.
 */
const fs   = require('fs');
const path = require('path');

const { HTMLGenerator } = require('../packages/core/dist/generators/html-generator');

const DEMOS = [
  { dir: 'demo-playwright/sarva-report',          title: 'Sarva-Varadi: Playwright Report',           frameworkLabel: 'Playwright' },
  { dir: 'demo-selenium/sarva-report',            title: 'Sarva-Varadi: Selenium Report',             frameworkLabel: 'Selenium' },
  { dir: 'demo-restassured/sarva-report',         title: 'Sarva-Varadi: Rest-Assured Report',         frameworkLabel: 'RestAssured' },
  { dir: 'demo-restassured-junit/sarva-report',   title: 'Sarva-Varadi: RestAssured JUnit Report',    frameworkLabel: 'RestAssured JUnit' },
  { dir: 'demo-selenium-cucumber/sarva-report',   title: 'Sarva-Varadi: Selenium Cucumber Report',    frameworkLabel: 'Selenium-Cucumber' },
  { dir: 'demo-restassured-cucumber/sarva-report',title: 'Sarva-Varadi: RestAssured Cucumber Report', frameworkLabel: 'RestAssured-Cucumber' },
];

const ROOT = path.join(__dirname, '..');

function loadHistory(reportDir) {
  const runsJson = path.join(reportDir, 'history', 'runs.json');
  if (!fs.existsSync(runsJson)) return { runs: [], testHistory: [] };
  try {
    return JSON.parse(fs.readFileSync(runsJson, 'utf8'));
  } catch { return { runs: [], testHistory: [] }; }
}

function loadLatestTests(reportDir, latestRunId) {
  const dataJson = path.join(reportDir, 'history', latestRunId, 'data.json');
  if (!fs.existsSync(dataJson)) return [];
  try {
    return JSON.parse(fs.readFileSync(dataJson, 'utf8'));
  } catch { return []; }
}

for (const demo of DEMOS) {
  const reportDir = path.join(ROOT, demo.dir);
  if (!fs.existsSync(reportDir)) {
    console.log(`  skip  ${demo.dir} (not found)`);
    continue;
  }

  const history = loadHistory(reportDir);
  const latestRun = history.runs && history.runs[0];

  if (!latestRun) {
    console.log(`  skip  ${demo.dir} (no history)`);
    continue;
  }

  const tests = loadLatestTests(reportDir, latestRun.id);
  const metadata = {
    id:          latestRun.id,
    timestamp:   latestRun.timestamp,
    duration:    latestRun.duration,
    environment: latestRun.environment || {},
  };

  const generator = new HTMLGenerator({
    outputFolder:      reportDir,
    outputFile:        'index.html',
    title:             demo.title,
    frameworkLabel:    demo.frameworkLabel,
    history:           { enabled: true, maxRuns: 180, retentionDays: 90, trackPerTest: true },
    trends:            { enabled: true, showInMainReport: true },
    links:             {},
    notifications:     { enabled: false },
    embedAttachments:  true,
  });

  const html = generator.generate(tests, metadata, {
    runs:        history.runs        || [],
    testHistory: history.testHistory || [],
  });

  const outPath = path.join(reportDir, 'index.html');
  fs.writeFileSync(outPath, html);
  console.log(`  ✓  ${demo.dir}  (${history.runs.length} runs, ${tests.length} tests)`);
}

console.log('\nDone. Open demo-index.html in your browser to verify.');
