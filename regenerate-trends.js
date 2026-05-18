const { TrendsGenerator } = require('./packages/core/dist/generators/trends-generator');
const { HistoryManager } = require('./packages/core/dist/history-manager');
const fs = require('fs');
const path = require('path');

/**
 * Regenerates trends.html from existing history without creating new runs
 */
function regenerateTrends(reportDir, title) {
  console.log(`  📊 Regenerating trends for: ${reportDir}`);

  const historyDir = path.join(reportDir, 'history');

  if (!fs.existsSync(historyDir)) {
    console.log(`  ⚠️  No history directory found, skipping`);
    return;
  }

  // Debug: Check what folders exist and which have valid data
  const folders = fs.readdirSync(historyDir).filter(f => {
    const stat = fs.statSync(path.join(historyDir, f));
    return stat.isDirectory();
  });
  console.log(`  📁 Found ${folders.length} history folders in filesystem`);

  const validFolders = folders.filter(f => {
    const dataFile = path.join(historyDir, f, 'data.json');
    return fs.existsSync(dataFile);
  });
  console.log(`  ✓ ${validFolders.length} folders have valid data.json`);
  console.log(`  📂 Sample folders: ${folders.slice(0, 5).join(', ')}`);

  // Load existing history
  const historyManager = new HistoryManager(reportDir, { enabled: true, maxRuns: 20 });
  const history = historyManager.loadHistory();

  if (!history || !history.runs || history.runs.length === 0) {
    console.log(`  ⚠️  No history runs found, skipping`);
    return;
  }

  console.log(`  ✓ Found ${history.runs.length} historical runs`);
  console.log(`  📊 Run IDs: ${history.runs.map(r => r.id).slice(0, 5).join(', ')}${history.runs.length > 5 ? '...' : ''}`);

  // Get the latest run metadata
  const latestRun = history.runs.reduce((latest, run) =>
    run.timestamp > latest.timestamp ? run : latest
  );

  const metadata = {
    id: latestRun.id,
    timestamp: latestRun.timestamp,
    duration: latestRun.duration,
    tool: 'regenerated',
    environment: latestRun.environment || {}
  };

  // Generate trends HTML
  const trendsGenerator = new TrendsGenerator({
    title: title || 'Test Trends',
    history: {
      enabled: true,
      maxRuns: 20,
      retentionDays: 90,
      trackPerTest: true
    },
    trends: {
      enabled: true,
      showInMainReport: true
    }
  });
  const trendsHtml = trendsGenerator.generate(history, metadata);

  // Write trends.html
  const trendsPath = path.join(reportDir, 'trends.html');
  fs.writeFileSync(trendsPath, trendsHtml);

  console.log(`  ✅ Regenerated ${trendsPath}`);
}

// Main
console.log('\n🔄 Regenerating trends from merged history...\n');

const frameworks = [
  { dir: 'demo-playwright/sarva-report', title: 'Playwright Test Trends' },
  { dir: 'demo-selenium/sarva-report', title: 'Selenium (TestNG) Test Trends' },
  { dir: 'demo-restassured/sarva-report', title: 'RestAssured (TestNG) API Test Trends' },
  { dir: 'demo-restassured-junit/sarva-report', title: 'RestAssured (JUnit 5) API Test Trends' },
];

frameworks.forEach(({ dir, title }) => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    regenerateTrends(fullPath, title);
  } else {
    console.log(`  ⚠️  Directory not found: ${dir}`);
  }
});

console.log('\n✅ Trends regeneration complete\n');
