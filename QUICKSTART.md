# 🚀 Sarva-Varadi Quick Start

Get started with Sarva-Varadi in 2 minutes! Choose your framework below:

**📑 Quick Navigation:**
- [🎭 Playwright](#-playwright-quick-start)
- [🌐 Selenium](#-selenium-quick-start)
- [🔌 RestAssured (TestNG)](#-restassured-testng-quick-start)
- [🔌 RestAssured (JUnit 5)](#-restassured-junit-5-quick-start)

---

## 🎭 Playwright Quick Start

<details open>
<summary><b>Click to expand Playwright setup</b></summary>

### Installation

```bash
npm install --save-dev @sarva-varadi/core @sarva-varadi/playwright
```

### Basic Configuration

Add to your `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['list'],
    ['@sarva-varadi/playwright', {
      outputFolder: 'sarva-report',
      title: 'My Test Report',
    }]
  ],
  
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
});
```

### Run Tests

```bash
npx playwright test
```

### View Report

```bash
# Windows
start sarva-report/index.html

# macOS
open sarva-report/index.html

# Linux
xdg-open sarva-report/index.html
```

### Advanced Configuration

```typescript
export default defineConfig({
  reporter: [
    ['@sarva-varadi/playwright', {
      outputFolder: 'test-reports',      // Custom folder
      title: 'E2E Tests',                // Custom title
      
      history: {
        enabled: true,                   // Track history
        maxRuns: 30,                     // Keep last 30 runs
        retentionDays: 90,               // Auto-delete after 90 days
      },
      
      trends: {
        enabled: true,                   // Generate trends.html
        showInMainReport: true,          // Mini-trend widget in main report
      },
      
      notifications: {
        enabled: true,
        slack: {
          enabled: true,
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: '#test-results',
        },
      },
    }]
  ],
});
```

</details>

---

## 🌐 Selenium Quick Start

<details>
<summary><b>Click to expand Selenium setup</b></summary>

### Installation

```bash
npm install --save-dev @sarva-varadi/core @sarva-varadi/selenium
```

### Copy TestNG Listener Files

1. Copy the Sarva-Varadi listener files to your test project:
   - `SarvaVaradiSeleniumListener.java`
   - `SarvaVaradiWebDriverListener.java`
   - `SarvaVaradiRetryAnalyzer.java`

2. Place them in `src/test/java/io/github/yoggit/sarvavaradi/`

### Configure testng.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE suite SYSTEM "https://testng.org/testng-1.0.dtd">
<suite name="Selenium Test Suite">
    <listeners>
        <listener class-name="io.github.yoggit.sarvavaradi.SarvaVaradiSeleniumListener"/>
    </listeners>
    
    <test name="Selenium Tests">
        <classes>
            <class name="com.example.selenium.tests.LoginTest"/>
        </classes>
    </test>
</suite>
```

### Write Your Test

```java
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
        SarvaVaradiWebDriverListener listener = new SarvaVaradiWebDriverListener(baseDriver);
        driver = new EventFiringDecorator(listener).decorate(baseDriver);
    }
    
    @Test(retryAnalyzer = SarvaVaradiRetryAnalyzer.class)
    public void testLogin() {
        driver.get("https://example.com/login");
        // Your test code
    }
    
    @AfterMethod
    public void teardown() {
        if (driver != null) driver.quit();
    }
}
```

### Run Tests & Generate Report

```bash
# Run tests
mvn clean test

# Generate Sarva-Varadi report
npx sarva-varadi convert \
  --input sarva-varadi-results/test-results.json \
  --output sarva-report \
  --format testng-selenium
```

### View Report

```bash
# Windows
start sarva-report/index.html

# macOS
open sarva-report/index.html

# Linux
xdg-open sarva-report/index.html
```

### Add to package.json (Optional)

```json
{
  "scripts": {
    "test": "mvn clean test",
    "report": "npx sarva-varadi convert --input sarva-varadi-results/test-results.json --output sarva-report --format testng-selenium",
    "test:report": "npm run test && npm run report"
  }
}
```

</details>

---

## 🔌 RestAssured (TestNG) Quick Start

<details>
<summary><b>Click to expand RestAssured (TestNG) setup</b></summary>

> For the full step-by-step guide see [RestAssured (TestNG) + Maven Integration Guide](README.md#restassured-maven-guide).

### Step 1 — Add JitPack repo + dependency to `pom.xml`

```xml
<repositories>
    <repository>
        <id>jitpack.io</id>
        <url>https://jitpack.io</url>
    </repository>
</repositories>

<dependencies>
    <dependency>
        <groupId>com.github.yoggit.sarva-varadi</groupId>
        <artifactId>sarva-varadi-restassured</artifactId>
        <version>v2.1.1</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### Step 2 — Add listener to `testng.xml`

```xml
<suite name="API Test Suite">
    <listeners>
        <listener class-name="io.github.yoggit.sarvavaradi.SarvaVaradiListener"/>
    </listeners>
    <test name="API Tests">
        <classes>
            <class name="com.example.tests.UserApiTest"/>
        </classes>
    </test>
</suite>
```

### Step 3 — Add request capture filter to your test setup

```java
@BeforeClass
public void setup() {
    RestAssured.baseURI = "https://api.example.com";
    RestAssured.filters(new RestAssuredRequestCapture());
}
```

### Step 4 — Run tests

```bash
mvn clean test
```

Report generated at `sarva-report/index.html`.

```bash
open sarva-report/index.html   # macOS
start sarva-report/index.html  # Windows
xdg-open sarva-report/index.html  # Linux
```

</details>

---

## 🔌 RestAssured (JUnit 5) Quick Start

<details>
<summary><b>Click to expand RestAssured (JUnit 5) setup</b></summary>

> For the full step-by-step guide see [RestAssured (JUnit 5) + Maven Integration Guide](README.md#restassured-junit-maven-guide).
>
> HTTP steps are captured **automatically** — no extra wiring beyond Step 3.

### Step 1 — Add JitPack repo + dependency to `pom.xml`

```xml
<repositories>
    <repository>
        <id>jitpack.io</id>
        <url>https://jitpack.io</url>
    </repository>
</repositories>

<dependencies>
    <dependency>
        <groupId>com.github.yoggit.sarva-varadi</groupId>
        <artifactId>sarva-varadi-restassured-junit</artifactId>
        <version>v2.1.1</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### Step 2 — Add Surefire plugin + report generation to `pom.xml`

See the [full guide](README.md#restassured-junit-maven-guide) for the complete plugin configuration.

### Step 3 — Add `@ExtendWith` to your base test class

```java
import io.github.yoggit.sarvavaradi.SarvaVaradiJUnit5Extension;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(SarvaVaradiJUnit5Extension.class)
public abstract class BaseTest { }
```

That's it — HTTP request/response steps are captured automatically for every test that extends `BaseTest`.

### Run tests

```bash
mvn clean test
```

Report generated at `sarva-report/index.html`.

```bash
open sarva-report/index.html   # macOS
start sarva-report/index.html  # Windows
xdg-open sarva-report/index.html  # Linux
```

</details>

---

## 📊 You Get Two Reports

All frameworks generate the same beautiful reports:

1. **`index.html`** - Latest test run results
2. **`trends.html`** - Historical trends dashboard

## 📖 Full Documentation

- [README.md](README.md) - Complete features and configuration
- [NOTIFICATIONS.md](NOTIFICATIONS.md) - Slack/Teams/Email setup
- [CONVERTER.md](CONVERTER.md) - CLI converter for other formats
- [packages/playwright/README.md](packages/playwright/README.md) - Playwright details
- [packages/selenium/README.md](packages/selenium/README.md) - Selenium details
- [packages/rest-assured/README.md](packages/rest-assured/README.md) - RestAssured details

## 💡 Tips

1. **First run** creates history baseline
2. **Flaky tests** automatically detected after 2+ runs
3. **Reports are portable** - just copy the folder
4. **No server needed** - everything is file-based
5. **Multi-browser support** - Automatically groups results by browser (Playwright/Selenium)
6. **CI/CD friendly** - Works in any CI environment

## 🆘 Troubleshooting

### Report not generated?
- **Playwright**: Check `playwright.config.ts` has reporter configured
- **Selenium/RestAssured**: Verify TestNG listener is in testng.xml
- Check output folder has write permissions

### Attachments missing?
- **Playwright**: Ensure config has `screenshot`/`video`/`trace` enabled
- **Selenium**: Verify screenshots are captured on failure
- **RestAssured**: API request/response captured automatically

### History not working?
- Verify `history.enabled: true` in configuration
- First run creates baseline, trends appear after 2+ runs
- Check `sarva-report/history/` folder exists

### Sensitive data in reports?
- **RestAssured**: Enable masking with `-Dsarva.maskSensitiveData=true`
- **Selenium**: Data masking available via listener configuration

---

Made with 📊 by [Sarva-Varadi](https://github.com/yoggit/sarva-varadi)
