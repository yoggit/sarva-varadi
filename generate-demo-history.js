const { TestNGSeleniumConverter } = require('./packages/core/dist/converters/testng-selenium-converter');
const { TestNGListenerConverter } = require('./packages/core/dist/converters/testng-listener-converter');
const { ReportGenerator } = require('./packages/core/dist/generators/report-generator');
const fs = require('fs');
const path = require('path');

console.log('🔄 Generating demo historical runs...\n');

// Load the TestNG test data
const seleniumTestNG = JSON.parse(fs.readFileSync('demo-selenium/sarva-report/history/2026-05-11T15-32-23/data.json', 'utf8'));
const restAssuredTestNG = JSON.parse(fs.readFileSync('demo-restassured/sarva-report/history/2026-05-11T15-32-23/data.json', 'utf8'));

// Historical timestamps (3 days ago, 2 days ago, 1 day ago)
const baseTime = Date.now();
const historicalTimestamps = [
  baseTime - 3 * 24 * 60 * 60 * 1000,
  baseTime - 2 * 24 * 60 * 60 * 1000,
  baseTime - 1 * 24 * 60 * 60 * 1000
];

// Function to adjust timestamps
function adjustTimestamps(tests, newBaseTime) {
  const originalStart = tests[0].startTime;
  const offset = newBaseTime - originalStart;

  return tests.map(test => ({
    ...test,
    startTime: test.startTime + offset,
    endTime: test.endTime + offset,
    actions: test.actions?.map(action => ({
      ...action,
      timestamp: action.timestamp + offset
    })),
    apiCalls: test.apiCalls?.map(call => ({
      ...call,
      startTime: call.startTime + offset,
      endTime: call.endTime + offset
    }))
  }));
}

// Generate 3 historical runs
historicalTimestamps.forEach((timestamp, index) => {
  const runId = `demo-${Date.now()}-${index}`;
  const runDate = new Date(timestamp).toISOString().split('T')[0];
  console.log(`\n📅 Generating historical run ${index + 1}: ${runDate}`);

  // Selenium
  console.log('  🔄 Converting Selenium...');
  const seleniumConverter = new TestNGSeleniumConverter();
  const seleniumAdjusted = adjustTimestamps(seleniumTestNG, timestamp);
  const seleniumResults = seleniumConverter.convert(seleniumAdjusted);

  const seleniumRunDir = path.join(__dirname, `demo-selenium/sarva-report/history/${runId}`);
  fs.mkdirSync(seleniumRunDir, { recursive: true });
  fs.writeFileSync(
    path.join(seleniumRunDir, 'data.json'),
    JSON.stringify(seleniumResults, null, 2)
  );
  console.log(`  ✅ Selenium: ${seleniumResults.length} tests`);

  // RestAssured
  console.log('  🔄 Converting RestAssured...');
  const restAssuredConverter = new TestNGListenerConverter();
  const restAssuredAdjusted = adjustTimestamps(restAssuredTestNG, timestamp);
  const restAssuredResults = restAssuredConverter.convert(restAssuredAdjusted);

  const restAssuredRunDir = path.join(__dirname, `demo-restassured/sarva-report/history/${runId}`);
  fs.mkdirSync(restAssuredRunDir, { recursive: true });
  fs.writeFileSync(
    path.join(restAssuredRunDir, 'data.json'),
    JSON.stringify(restAssuredResults, null, 2)
  );
  console.log(`  ✅ RestAssured: ${restAssuredResults.length} tests`);
});

console.log('\n✅ Demo historical runs generated!');
console.log('\n📊 Summary:');
console.log('  - 3 historical Sarva-Varadi runs will be committed to git');
console.log('  - TestNG data files kept for CI to convert with current timestamp');
console.log('  - CI will add new runs each time it executes\n');
