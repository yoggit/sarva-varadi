# Sarva-Varadi Selenium Demo

This demo project shows how to integrate **Sarva-Varadi** with **Selenium WebDriver + TestNG** for comprehensive test reporting with rich HTML reports and trend analysis.

## 🚀 Features

- ✅ **Automatic test result capture** via TestNG listener
- ✅ **Flaky test detection** with automatic retry tracking
- ✅ **WebDriver action capture** (clicks, navigation, form inputs)
- ✅ **Configurable screenshot capture** (always, on-failure, never)
- ✅ **Browser information** (Chrome, Firefox, Edge)
- ✅ **Sensitive data masking** (passwords, tokens)
- ✅ **Rich HTML reports** with trends and history

## 📦 Setup

### 1. Add Maven Dependencies

```xml
<dependencies>
    <!-- Selenium WebDriver -->
    <dependency>
        <groupId>org.seleniumhq.selenium</groupId>
        <artifactId>selenium-java</artifactId>
        <version>4.16.1</version>
    </dependency>

    <!-- TestNG -->
    <dependency>
        <groupId>org.testng</groupId>
        <artifactId>testng</artifactId>
        <version>7.8.0</version>
        <scope>test</scope>
    </dependency>

    <!-- Jackson for JSON -->
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
        <version>2.15.2</version>
    </dependency>
</dependencies>
```

### 2. Copy Sarva-Varadi Files to Your Project

Copy these files to your `src/test/java` directory:
- `SarvaVaradiSeleniumListener.java`
- `SarvaVaradiWebDriverListener.java`
- `SarvaVaradiRetryAnalyzer.java`
- `SarvaVaradiConfig.java`

### 3. Create Configuration File

Copy `sarva-varadi.properties` to your project root or `src/test/resources/`:

```properties
# Screenshot capture mode: always, on-failure, never
sarva.screenshot=on-failure

# Sensitive data masking: true, false
sarva.maskSensitiveData=false

# Output directories
sarva.outputDir=sarva-varadi-results
sarva.screenshotDir=sarva-varadi-results/screenshots

# Retry count for flaky test detection
sarva.maxRetryCount=2
```

### 4. Configure TestNG

Create `src/test/resources/testng.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE suite SYSTEM "https://testng.org/testng-1.0.dtd">
<suite name="Selenium Test Suite">
    <listeners>
        <listener class-name="io.github.yoggit.sarvavaradi.SarvaVaradiSeleniumListener"/>
    </listeners>
    
    <test name="Selenium Tests">
        <classes>
            <class name="com.example.selenium.tests.LoginTest">
                <methods>
                    <include name=".*" />
                </methods>
            </class>
        </classes>
    </test>
</suite>
```

### 5. Annotate Your Tests with Retry Analyzer

```java
package com.example.selenium.tests;

import io.github.yoggit.sarvavaradi.SarvaVaradiRetryAnalyzer;
import io.github.yoggit.sarvavaradi.SarvaVaradiWebDriverListener;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.events.EventFiringDecorator;
import org.testng.annotations.*;

public class LoginTest {
    
    private WebDriver driver;
    
    @BeforeMethod
    public void setup() {
        WebDriver baseDriver = new ChromeDriver();
        
        // Wrap driver with event listener for action capture
        SarvaVaradiWebDriverListener listener = new SarvaVaradiWebDriverListener(baseDriver);
        driver = new EventFiringDecorator(listener).decorate(baseDriver);
    }
    
    @Test(retryAnalyzer = SarvaVaradiRetryAnalyzer.class)
    public void testSuccessfulLogin() {
        driver.get("https://example.com/login");
        // Your test code
    }
    
    @AfterMethod
    public void teardown() {
        if (driver != null) {
            driver.quit();
        }
    }
}
```

## 🏃 Running Tests

### Run tests with Maven:

```bash
mvn clean test
```

### Generate Sarva-Varadi report:

```bash
npx sarva-varadi convert \
  --input sarva-varadi-results/test-results.json \
  --output sarva-report \
  --format testng-selenium
```

### Open the report:

```bash
open sarva-report/index.html
```

## 📊 Sample Reports

This demo includes 3 sample result files with different test outcomes:

1. **test-results-all-pass.json** - All 5 tests passing (100% pass rate)
2. **test-results-mixed.json** - Mixed results: 2 passed, 2 failed, 1 skipped (40% pass rate)
3. **test-results-with-flaky.json** - With flaky tests: 3 passed, 2 flaky, 1 failed (50% pass rate)

Generate reports from samples:

```bash
# All pass scenario
npm run report:all-pass

# Mixed results
npm run report:mixed

# With flaky tests
npm run report
```

## 📸 Screenshot Capture Configuration

**Two ways to configure** (just like Playwright):

### Option 1: Configuration File (Recommended)

Edit `sarva-varadi.properties`:
```properties
# Change this value and it applies to all runs
sarva.screenshot=always
```

Then just run:
```bash
mvn test
```

### Option 2: Command Line Override

Override the config file for specific runs:
```bash
# Temporary override - use 'always' for this run only
mvn test -Dsarva.screenshot=always

# Temporary override - disable screenshots for this run
mvn test -Dsarva.screenshot=never
```

**Screenshot modes:**
- `on-failure` (default) - Only capture on test failure/broken
- `always` - Capture at test end for all tests (pass/fail/skip)
- `never` - Disable screenshot capture completely

**Screenshot naming:**
- Test end (pass): `end-<testname>-passed-<timestamp>.png`
- Test end (fail): `end-<testname>-failed-<timestamp>.png`
- Test end (skip): `end-<testname>-skipped-<timestamp>.png`
- On error: `error-<counter>-<timestamp>.png`

## 🔒 Sensitive Data Masking

### Option 1: Configuration File (Recommended)

Edit `sarva-varadi.properties`:
```properties
sarva.maskSensitiveData=true
```

### Option 2: Command Line Override

```bash
mvn test -Dsarva.maskSensitiveData=true
```

When enabled, fields matching these patterns are masked:
- Input type="password"
- Fields with names: password, pwd, secret, token, apikey, api_key, auth

**All settings work together:**
- Config file sets defaults
- Command line overrides config file
- Mix and match as needed

## 🎯 What Gets Captured

### Test Information
- Test name, class, and method
- Status (passed/failed/skipped/flaky)
- Duration and timestamps
- Retry count for flaky detection

### Browser Information
- Browser name (Chrome, Firefox, Edge)
- Browser version
- Platform (Windows, macOS, Linux)

### WebDriver Actions
- Navigation (GET, URL changes)
- Element interactions (click, sendKeys)
- Element searches (findElement)
- Screenshots on failure

### Error Details
- Exception messages
- Stack traces
- Screenshots attached to failed tests

## 📈 Trend Analysis

Sarva-Varadi automatically tracks test history across multiple runs:

- Pass rate trends over time
- Flaky test identification
- Performance degradation detection
- Test failure patterns

## 🔧 Advanced Configuration

### Custom Output Directory

```java
// In your listener, modify OUTPUT_DIR constant
private static final String OUTPUT_DIR = "custom-results";
```

### Custom Retry Count

```java
// In SarvaVaradiRetryAnalyzer.java
private static final int MAX_RETRY_COUNT = 3; // Default is 2
```

### Screenshot Directory

```java
// In SarvaVaradiWebDriverListener.java
private static final String SCREENSHOT_DIR = "custom-screenshots";
```

### Screenshot Capture Mode at Runtime

```bash
# Different screenshot modes for different environments
mvn test -Dsarva.screenshot=always      # CI/CD with visual regression
mvn test -Dsarva.screenshot=on-failure  # Local development (default)
mvn test -Dsarva.screenshot=never       # Performance testing
```

## 🐛 Troubleshooting

### Tests not being captured

✅ **Solution**: Ensure `SarvaVaradiSeleniumListener` is configured in testng.xml or via `@Listeners` annotation

### Flaky tests not detected

✅ **Solution**: Add `retryAnalyzer = SarvaVaradiRetryAnalyzer.class` to your `@Test` annotation

### WebDriver actions not logged

✅ **Solution**: Wrap your WebDriver with `EventFiringDecorator` and `SarvaVaradiWebDriverListener`

### Screenshots not captured

✅ **Solution**: Ensure your WebDriver implements `TakesScreenshot` interface (most modern drivers do)

## 📚 Complete Example

See the full working example in the demo project structure:

```
demo-selenium/
├── pom.xml
├── package.json
├── src/test/java/
│   └── io/github/yoggit/sarvavaradi/
│       ├── SarvaVaradiSeleniumListener.java
│       ├── SarvaVaradiWebDriverListener.java
│       └── SarvaVaradiRetryAnalyzer.java
└── sarva-varadi-results/
    ├── test-results-all-pass.json
    ├── test-results-mixed.json
    └── test-results-with-flaky.json
```

## 🔗 Related Documentation

- [Main README](../README.md) - Full framework documentation
- [NOTIFICATIONS.md](../NOTIFICATIONS.md) - Set up Slack/Teams/Email alerts
- [CONVERTER.md](../CONVERTER.md) - Convert other formats to Sarva-Varadi

---

Made with 🧪 by [Sarva-Varadi](https://github.com/yoggit/sarva-varadi)
