const fs = require('fs');
const path = require('path');

// Test definitions
const seleniumTests = [
  {
    name: "Login Test",
    className: "com.example.selenium.tests.DemoTests",
    steps: [
      { name: "Navigate to login page", duration: 1000 },
      { name: "Enter credentials", duration: 500 },
      { name: "Click login button", duration: 500 }
    ],
    baseDuration: 5000
  },
  {
    name: "Search Functionality Test",
    className: "com.example.selenium.tests.DemoTests",
    steps: [
      { name: "Open search page", duration: 800 },
      { name: "Enter search term", duration: 600 },
      { name: "Verify results", duration: 700 }
    ],
    baseDuration: 4000
  },
  {
    name: "Add to Cart Test",
    className: "com.example.selenium.tests.DemoTests",
    steps: [
      { name: "Select product", duration: 1000 },
      { name: "Click add to cart", duration: 500 }
    ],
    baseDuration: 3500,
    errorMessage: "Element not found: #add-to-cart-button",
    errorStackTrace: "org.openqa.selenium.NoSuchElementException: Unable to locate element: #add-to-cart-button\n  at DemoTests.testAddToCart(DemoTests.java:45)"
  },
  {
    name: "Checkout Process Test",
    className: "com.example.selenium.tests.DemoTests",
    steps: [
      { name: "Go to cart", duration: 1200 },
      { name: "Enter shipping details", duration: 1500 },
      { name: "Complete payment", duration: 1800 }
    ],
    baseDuration: 6000
  },
  {
    name: "User Profile Test",
    className: "com.example.selenium.tests.DemoTests",
    steps: [
      { name: "Navigate to profile", duration: 1000 },
      { name: "Update profile info", duration: 2000 }
    ],
    baseDuration: 4500
  },
  {
    name: "Navigation Menu Test",
    className: "com.example.selenium.tests.DemoTests",
    baseDuration: 3000
  },
  {
    name: "Filter Products Test",
    className: "com.example.selenium.tests.DemoTests",
    steps: [
      { name: "Apply filters", duration: 1500 },
      { name: "Verify filtered results", duration: 800 }
    ],
    baseDuration: 4000,
    errorMessage: "Expected 5 products but found 3"
  },
  {
    name: "Sort Products Test",
    className: "com.example.selenium.tests.DemoTests",
    baseDuration: 3500
  },
  {
    name: "Product Details Test",
    className: "com.example.selenium.tests.DemoTests",
    baseDuration: 5000
  },
  {
    name: "Wishlist Test",
    className: "com.example.selenium.tests.DemoTests",
    baseDuration: 4200
  }
];

const restAssuredTests = [
  { name: "GET /users - List all users", className: "com.example.restassured.tests.ApiTests", duration: 1200 },
  { name: "GET /users/{id} - Get user by ID", className: "com.example.restassured.tests.ApiTests", duration: 800 },
  { name: "POST /users - Create new user", className: "com.example.restassured.tests.ApiTests", duration: 1500 },
  {
    name: "PUT /users/{id} - Update user",
    className: "com.example.restassured.tests.ApiTests",
    duration: 1800,
    errorMessage: "Expected status code 200 but received 422",
    errorStackTrace: "java.lang.AssertionError: Expected status code 200 but received 422\n  at ApiTests.testUpdateUser(ApiTests.java:67)"
  },
  { name: "DELETE /users/{id} - Delete user", className: "com.example.restassured.tests.ApiTests", duration: 1000 },
  { name: "GET /posts - List all posts", className: "com.example.restassured.tests.ApiTests", duration: 1100 },
  { name: "POST /posts - Create new post", className: "com.example.restassured.tests.ApiTests", duration: 1400 },
  { name: "GET /posts/{id}/comments - Get post comments", className: "com.example.restassured.tests.ApiTests", duration: 900 },
  { name: "GET /users/{id}/posts - Get user posts", className: "com.example.restassured.tests.ApiTests", duration: 1100 },
  { name: "PATCH /users/{id} - Partial update", className: "com.example.restassured.tests.ApiTests", duration: 950 }
];

// Random status assignments
function getRandomStatuses(runIndex) {
  const seed = runIndex * 42;
  const random = (index) => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };

  const statuses = [];
  for (let i = 0; i < 10; i++) {
    const rand = random(i);
    if (rand < 0.15) statuses.push('failed');
    else if (rand < 0.25) statuses.push('skipped');
    else if (rand < 0.30) statuses.push('flaky');
    else statuses.push('passed');
  }
  return statuses;
}

function generateSeleniumRun(runIndex, timestamp) {
  const statuses = getRandomStatuses(runIndex);
  const startTime = new Date(timestamp).getTime();
  let currentTime = startTime;

  const tests = seleniumTests.map((test, i) => {
    const status = statuses[i];
    const testStartTime = currentTime;
    const testDuration = status === 'skipped' ? 0 : test.baseDuration;
    const testEndTime = testStartTime + testDuration;
    currentTime = testEndTime;

    // Map status to TestNG format
    let testngStatus = 'PASS';
    if (status === 'failed') testngStatus = 'FAIL';
    else if (status === 'skipped') testngStatus = 'SKIP';
    else if (status === 'flaky') testngStatus = 'FLAKY';

    const testData = {
      testName: test.className + '.' + test.name,
      methodName: test.name,
      status: testngStatus,
      startTime: testStartTime,
      endTime: testEndTime,
      retryCount: status === 'flaky' ? 1 : 0,
      flakyReason: status === 'flaky' ? 'Test passed after retry' : undefined,
      browser: {
        name: 'chrome',
        version: '120.0',
        platform: 'Windows 10'
      },
      parameters: [],
      actions: [],
      screenshots: []
    };

    // Add steps as WebDriver actions with screenshots
    if (test.steps) {
      let stepTime = testStartTime;
      test.steps.forEach((step, stepIndex) => {
        const stepFailed = status === 'failed' && (step.name.includes('cart') || step.name.includes('Verify'));
        const screenshotName = `screenshots/${test.name.toLowerCase().replace(/\s+/g, '-')}-step-${stepIndex + 1}.png`;

        testData.actions.push({
          type: step.name.toLowerCase().includes('navigate') ? 'navigate' :
                step.name.toLowerCase().includes('click') ? 'click' :
                step.name.toLowerCase().includes('enter') ? 'sendKeys' :
                step.name.toLowerCase().includes('verify') ? 'assertion' : 'action',
          description: step.name,
          timestamp: stepTime,
          status: stepFailed ? 'failed' : 'passed',
          screenshot: screenshotName
        });
        testData.screenshots.push(screenshotName);
        stepTime += step.duration;
      });
    }

    // Add final screenshot for test end
    if (status === 'failed' || status === 'broken') {
      testData.error = {
        message: test.errorMessage || 'Test failed',
        stackTrace: test.errorStackTrace || `  at ${test.className}.${test.name}(${test.className}.java:45)`
      };
      const finalScreenshot = `screenshots/${test.name.toLowerCase().replace(/\s+/g, '-')}-end-failed.png`;
      testData.screenshots.push(finalScreenshot);
    } else if (status === 'passed') {
      const finalScreenshot = `screenshots/${test.name.toLowerCase().replace(/\s+/g, '-')}-end-passed.png`;
      testData.screenshots.push(finalScreenshot);
    }

    return testData;
  });

  return tests;
}

function generateRestAssuredRun(runIndex, timestamp) {
  const statuses = getRandomStatuses(runIndex + 100);
  const startTime = new Date(timestamp).getTime();
  let currentTime = startTime;

  const tests = restAssuredTests.map((test, i) => {
    const status = statuses[i];
    const testStartTime = currentTime;
    const testDuration = status === 'skipped' ? 0 : test.duration;
    const testEndTime = testStartTime + testDuration;
    currentTime = testEndTime;

    // Map status to TestNG format
    let testngStatus = 'PASS';
    if (status === 'failed') testngStatus = 'FAIL';
    else if (status === 'skipped') testngStatus = 'SKIP';
    else if (status === 'flaky') testngStatus = 'FLAKY';

    const testData = {
      testName: test.className + '.' + test.name,
      methodName: test.name,
      status: testngStatus,
      startTime: testStartTime,
      endTime: testEndTime,
      retryCount: status === 'flaky' ? 1 : 0,
      flakyReason: status === 'flaky' ? 'Test passed after retry' : undefined,
      parameters: {},
      apiCalls: []
    };

    // Add API call details
    const apiCallDuration = Math.floor(testDuration * 0.8);
    testData.apiCalls.push({
      name: test.name,
      startTime: testStartTime + 100,
      endTime: testStartTime + 100 + apiCallDuration,
      duration: apiCallDuration,
      status: status === 'failed' ? 'failed' : 'passed',
      request: {
        method: test.name.split(' ')[0],
        uri: test.name.split(' ')[1] || '/api/endpoint',
        headers: 'Content-Type: application/json\nAccept: application/json',
        body: test.name.includes('POST') || test.name.includes('PUT') ? '{"name":"test","email":"test@example.com"}' : undefined
      },
      response: {
        statusCode: status === 'failed' && test.errorMessage ? 422 : 200,
        statusLine: status === 'failed' && test.errorMessage ? 'Unprocessable Entity' : 'OK',
        responseTime: `${apiCallDuration}ms`,
        headers: 'Content-Type: application/json',
        body: status === 'failed' ? '{"error":"Validation failed"}' : '{"success":true,"data":{"id":123}}'
      }
    });

    // Add error info for failed tests
    if (status === 'failed' && test.errorMessage) {
      testData.error = {
        message: test.errorMessage,
        stackTrace: test.errorStackTrace || `  at ${test.className}.${test.name.replace(/[^a-zA-Z]/g, '')}(${test.className}.java:67)`
      };
    }

    return testData;
  });

  return tests;
}

// Generate 4 historical runs
const baseTime = new Date('2026-05-11T15:32:23Z').getTime();
const timestamps = [
  new Date(baseTime - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  new Date(baseTime - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  new Date(baseTime - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  new Date(baseTime).toISOString() // now
];

// Collect all unique screenshots needed
const allScreenshots = new Set();

timestamps.forEach((timestamp, index) => {
  const dateStr = new Date(timestamp).toISOString().replace(/[:.]/g, '-').slice(0, 19);

  // Selenium
  const seleniumDir = path.join(__dirname, `demo-selenium/sarva-report/history/${dateStr}`);
  fs.mkdirSync(seleniumDir, { recursive: true });
  const seleniumData = generateSeleniumRun(index, timestamp);

  // Collect screenshots
  seleniumData.forEach(test => {
    test.screenshots.forEach(s => allScreenshots.add(s));
  });

  fs.writeFileSync(
    path.join(seleniumDir, 'data.json'),
    JSON.stringify(seleniumData, null, 2)
  );

  // RestAssured
  const restAssuredDir = path.join(__dirname, `demo-restassured/sarva-report/history/${dateStr}`);
  fs.mkdirSync(restAssuredDir, { recursive: true });
  const restAssuredData = generateRestAssuredRun(index, timestamp);
  fs.writeFileSync(
    path.join(restAssuredDir, 'data.json'),
    JSON.stringify(restAssuredData, null, 2)
  );
});

// Create placeholder screenshots for Selenium
const screenshotsDir = path.join(__dirname, 'demo-selenium/sarva-varadi-results/screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

// Create minimal valid PNG files (1x1 transparent pixel)
const minimalPNG = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
  0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);

// Create all collected screenshots
allScreenshots.forEach(screenshotPath => {
  const filename = screenshotPath.replace('screenshots/', '');
  fs.writeFileSync(path.join(screenshotsDir, filename), minimalPNG);
});

console.log('✅ Static data files created successfully!');
console.log(`  - Selenium: 4 historical runs with ${allScreenshots.size} screenshots`);
console.log('  - RestAssured: 4 historical runs');
console.log('  - Screenshots: demo-selenium/sarva-varadi-results/screenshots/');
