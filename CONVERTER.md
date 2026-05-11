# 🔄 Universal Converter Guide

Sarva-Varadi includes a powerful CLI converter that transforms test results from popular frameworks into beautiful, interactive reports.

## Table of Contents

- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Supported Formats](#supported-formats)
- [Format Detection](#format-detection)
- [Usage Examples](#usage-examples)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Quick Start

```bash
# Install globally
npm install -g @sarva-varadi/core

# Convert any test results
sarva-varadi generate --input test-results.xml --output sarva-report

# Open the report
open sarva-report/index.html  # macOS
start sarva-report/index.html # Windows
xdg-open sarva-report/index.html # Linux
```

## How It Works

Sarva-Varadi uses a **two-phase smart conversion** process:

### Phase 1: Format Detection
The converter auto-detects the format by analyzing the file structure:

1. **Parse the file** (XML → JSON or JSON → Object)
2. **Analyze structure** to identify format
3. **Skip conversion** if already in Sarva-Varadi format
4. **Select appropriate converter** for the detected format

### Phase 2: Conversion & Report Generation
1. **Convert** test results to standardized Sarva-Varadi format
2. **Archive** results in history folder for trend tracking
3. **Generate** both `index.html` (latest) and `trends.html` (historical)

**Key Benefit:** If you're already using Sarva-Varadi adapters, the converter skips the conversion step entirely, making it efficient to re-generate reports from existing data.

## Supported Formats

### ✅ JUnit XML

**Source:** Maven Surefire, Gradle test reports, Ant JUnit

**File structure:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="TestSuite" tests="4" failures="1" skipped="1" time="12.456">
    <testcase name="testName" classname="com.example.TestClass" time="2.123">
      <!-- Passed test -->
    </testcase>
    <testcase name="testFailure" classname="com.example.TestClass" time="1.567">
      <failure message="Assertion failed" type="AssertionError">
        Stack trace here...
      </failure>
    </testcase>
    <testcase name="testSkipped" classname="com.example.TestClass" time="0.0">
      <skipped message="Test disabled"/>
    </testcase>
  </testsuite>
</testsuites>
```

**Typical locations:**
- Maven: `target/surefire-reports/TEST-*.xml`
- Gradle: `build/test-results/test/TEST-*.xml`

**What's converted:**
- ✅ Test name and class name → `fullName`
- ✅ Pass/Fail/Skip status
- ✅ Duration (converted from seconds to milliseconds)
- ✅ Failure messages and stack traces
- ✅ System output (`<system-out>`, `<system-err>`)

### ✅ TestNG XML

**Source:** TestNG framework output

**File structure:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<testng-results>
  <suite name="Suite Name" duration-ms="15678">
    <test name="Test Group" duration-ms="8234">
      <class name="com.example.TestClass">
        <test-method name="testMethod" status="PASS" duration-ms="1234" started-at="1715338800000">
        </test-method>
        <test-method name="testFailed" status="FAIL" duration-ms="1567" started-at="1715338801234">
          <exception class="java.lang.AssertionError">
            <message>Expected 200 but got 500</message>
            <full-stacktrace>Stack trace here...</full-stacktrace>
          </exception>
        </test-method>
      </class>
    </test>
  </suite>
</testng-results>
```

**Typical location:**
- `test-output/testng-results.xml`

**What's converted:**
- ✅ Test method name and class → `fullName`
- ✅ Status mapping (PASS/FAIL/SKIP)
- ✅ Duration and timestamps (milliseconds)
- ✅ Exception details with stack traces
- ✅ Test parameters (if present)

### ✅ Cucumber JSON

**Source:** Cucumber JSON formatter

**File structure:**
```json
[
  {
    "name": "Feature Name",
    "type": "feature",
    "tags": [{"name": "@smoke"}],
    "elements": [
      {
        "name": "Scenario Name",
        "type": "scenario",
        "steps": [
          {
            "keyword": "Given ",
            "name": "I am on the page",
            "result": {
              "status": "passed",
              "duration": 1234567890
            }
          },
          {
            "keyword": "Then ",
            "name": "I should see results",
            "result": {
              "status": "failed",
              "duration": 567890123,
              "error_message": "AssertionError: Expected true but got false"
            }
          }
        ]
      }
    ]
  }
]
```

**How to generate:**
```bash
# Cucumber JS
cucumber-js --format json:cucumber-report.json

# Cucumber Ruby
cucumber --format json --out cucumber-report.json
```

**What's converted:**
- ✅ Feature + Scenario → `fullName`
- ✅ Step-by-step execution details
- ✅ Pass/Fail status per scenario
- ✅ Duration (converted from nanoseconds)
- ✅ Tags → Labels
- ✅ Error messages from failed steps

### ✅ Sarva-Varadi JSON (Native)

**Source:** Playwright/Selenium adapters, or previous converter output

**File structure:**
```json
[
  {
    "uuid": "abc123",
    "tool": "playwright",
    "name": "Login Test",
    "fullName": "Login Test - chromium",
    "status": "passed",
    "stage": "finished",
    "start": 1715338800000,
    "stop": 1715338802345,
    "duration": 2345,
    "steps": [],
    "attachments": []
  }
]
```

**What happens:**
- ⚡ **No conversion** - direct pass-through
- ✅ Skips conversion overhead
- ✅ Still generates reports with history tracking

## Format Detection

The converter uses these detection rules:

| Format | Detection Logic |
|--------|----------------|
| **Sarva-Varadi** | Array with objects containing `tool`, `name`, `fullName`, `status`, `duration`, `start` fields |
| **JUnit** | Root element `testsuites` or `testsuite` (after XML parsing) |
| **TestNG** | Root element `testng-results`, `testng`, or `suite` with `test` child |
| **Cucumber** | Array with objects containing `type: "feature"` and `elements` array |

**No configuration needed** - just point to your file and let the converter handle it.

## Usage Examples

### Basic Conversion

```bash
# JUnit
sarva-varadi generate --input target/surefire-reports/TEST-*.xml --output reports

# TestNG
sarva-varadi generate --input test-output/testng-results.xml --output reports

# Cucumber
sarva-varadi generate --input cucumber-report.json --output reports

# With custom title
sarva-varadi generate -i junit.xml -o reports --title "Nightly Regression Tests"
```

### Local Package Usage

```bash
# If installed locally in your project
npx sarva-varadi generate -i test-results.xml -o sarva-report
```

### Using in package.json Scripts

```json
{
  "scripts": {
    "test": "mvn test",
    "report": "sarva-varadi generate -i target/surefire-reports/TEST-*.xml -o sarva-report",
    "test:report": "npm run test && npm run report"
  }
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests with Sarva-Varadi Report

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Tests
        run: mvn test
      
      - name: Install Sarva-Varadi
        run: npm install -g @sarva-varadi/core
      
      - name: Generate Report
        if: always()
        run: |
          sarva-varadi generate \
            --input target/surefire-reports/TEST-*.xml \
            --output sarva-report \
            --title "CI Test Report"
      
      - name: Upload Report Artifact
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-report
          path: sarva-report/
          retention-days: 30
      
      - name: Deploy to GitHub Pages
        if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./sarva-report
```

### GitLab CI

```yaml
test:
  stage: test
  script:
    - mvn test
    - npm install -g @sarva-varadi/core
    - sarva-varadi generate -i target/surefire-reports/TEST-*.xml -o sarva-report
  artifacts:
    when: always
    paths:
      - sarva-report/
    expire_in: 30 days
  pages:
    paths:
      - sarva-report
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    stages {
        stage('Test') {
            steps {
                sh 'mvn test'
            }
        }
        
        stage('Generate Report') {
            steps {
                sh '''
                    npm install -g @sarva-varadi/core
                    sarva-varadi generate \
                        -i target/surefire-reports/TEST-*.xml \
                        -o sarva-report
                '''
            }
        }
    }
    
    post {
        always {
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'sarva-report',
                reportFiles: 'index.html',
                reportName: 'Sarva-Varadi Report'
            ])
        }
    }
}
```

### CircleCI

```yaml
version: 2.1

jobs:
  test:
    docker:
      - image: cimg/openjdk:11-node
    steps:
      - checkout
      - run:
          name: Run Tests
          command: mvn test
      - run:
          name: Generate Report
          command: |
            npm install -g @sarva-varadi/core
            sarva-varadi generate -i target/surefire-reports/TEST-*.xml -o sarva-report
      - store_artifacts:
          path: sarva-report
          destination: test-report
```

## Troubleshooting

### Issue: "Unable to detect test results format"

**Cause:** The file structure doesn't match any supported format.

**Solution:**
1. Verify the file is valid XML/JSON
2. Check the root element name
3. Ensure the file is complete (not truncated)

### Issue: "Input file not found"

**Cause:** Wrong path or file doesn't exist yet.

**Solution:**
```bash
# Check if file exists
ls -la target/surefire-reports/

# Use absolute path
sarva-varadi generate -i /full/path/to/test-results.xml -o reports

# Use glob patterns carefully
sarva-varadi generate -i "target/surefire-reports/TEST-*.xml" -o reports
```

### Issue: Missing test names or "Unknown Test"

**Cause:** Source format doesn't include required fields.

**Solution:** Check your test framework configuration:

**JUnit/Maven:**
```xml
<!-- pom.xml -->
<plugin>
  <artifactId>maven-surefire-plugin</artifactId>
  <version>2.22.2</version>
  <configuration>
    <reportFormat>xml</reportFormat>
  </configuration>
</plugin>
```

**TestNG:**
```xml
<!-- testng.xml -->
<suite name="Test Suite">
  <test name="Test Group">
    <classes>
      <class name="com.example.TestClass"/>
    </classes>
  </test>
</suite>
```

### Issue: Stack traces showing "[object Object]"

**Cause:** XML parser handling of complex nested structures.

**Solution:** This is a known limitation. For better stack traces, consider:
1. Using native adapters (Playwright/Selenium)
2. Simplifying error messages in your tests
3. Opening an issue with a sample file for improvement

### Issue: Duration shows as 0 or incorrect

**Cause:** Different frameworks use different time units.

**Solution:** The converter handles:
- JUnit: seconds → milliseconds (multiply by 1000)
- TestNG: milliseconds (direct)
- Cucumber: nanoseconds → milliseconds (divide by 1,000,000)

If still incorrect, check your framework's time reporting configuration.

## Advanced Tips

### Combining Multiple Files

```bash
# Merge XML files first (JUnit only)
cat target/surefire-reports/TEST-*.xml > merged-results.xml
sarva-varadi generate -i merged-results.xml -o reports
```

### Custom History Retention

The converter uses default history settings. To customize, create a config file:

```javascript
// sarva-varadi.config.js
module.exports = {
  history: {
    enabled: true,
    maxRuns: 50,        // Keep last 50 runs
    retentionDays: 180, // Keep 6 months of data
  },
  trends: {
    enabled: true,
    showInMainReport: true,
  },
};
```

Then modify the CLI to support config files (feature coming soon).

### Programmatic Usage

Instead of CLI, use the converter programmatically:

```javascript
const { SmartConverter, ReportGenerator } = require('@sarva-varadi/core');
const fs = require('fs');

// Read and parse your file
const data = JSON.parse(fs.readFileSync('test-results.json', 'utf-8'));

// Convert
const results = SmartConverter.convert(data);

// Generate report
const generator = new ReportGenerator({
  outputFolder: 'sarva-report',
  title: 'My Custom Report',
  history: { enabled: true, maxRuns: 30 },
});

await generator.generateReport(results, {
  id: `run-${Date.now()}`,
  tool: results[0]?.tool || 'junit',
  timestamp: Date.now(),
  duration: results.reduce((sum, r) => sum + r.duration, 0),
});
```

## Migration Path

### Phase 1: Use Converter (Quick Win)
Start using Sarva-Varadi reports immediately without changing test code:
```bash
sarva-varadi generate -i junit.xml -o reports
```

### Phase 2: Add Native Adapter (Full Features)
Migrate to native adapters for screenshots, videos, and richer data:

**Playwright:**
```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [['@sarva-varadi/playwright', { outputFolder: 'sarva-report' }]],
});
```

**Selenium:**
```java
// Add Sarva-Varadi listener
@Listeners(SarvaVaradiListener.class)
public class MyTests { ... }
```

### Phase 3: Customize & Extend
Add notifications, custom labels, links, and more.

---

**Questions or issues?** Open an issue on [GitHub](https://github.com/yoggit/sarva-varadi/issues)
