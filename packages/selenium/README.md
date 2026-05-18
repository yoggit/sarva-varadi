# @sarva-varadi/selenium

Selenium WebDriver (TestNG) adapter for Sarva-Varadi — captures browser actions, screenshots, and WebDriver events as test steps and generates beautiful, interactive reports with historical trend tracking.

---

## Installation

**Step 1 — npm package** (report generator):

```bash
npm install --save-dev @sarva-varadi/core @sarva-varadi/selenium
```

**Step 2 — Copy Java listener files** to your test project:

Copy the following files from `node_modules/@sarva-varadi/selenium/src/` into your `src/test/java/io/github/yoggit/sarvavaradi/` directory:

- `SarvaVaradiSeleniumListener.java`
- `SarvaVaradiWebDriverListener.java`
- `SarvaVaradiRetryAnalyzer.java`
- `SarvaVaradiConfig.java`

---

## Quick Setup

### 1 — Add Maven dependencies to `pom.xml`

```xml
<dependencies>
    <dependency>
        <groupId>org.seleniumhq.selenium</groupId>
        <artifactId>selenium-java</artifactId>
        <version>4.16.1</version>
    </dependency>
    <dependency>
        <groupId>org.testng</groupId>
        <artifactId>testng</artifactId>
        <version>7.8.0</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
        <version>2.15.2</version>
    </dependency>
</dependencies>
```

### 2 — Add listener to `testng.xml`

```xml
<suite name="Selenium Test Suite">
    <listeners>
        <listener class-name="io.github.yoggit.sarvavaradi.SarvaVaradiSeleniumListener"/>
    </listeners>
    <test name="Selenium Tests">
        <classes>
            <class name="com.example.tests.LoginTest"/>
        </classes>
    </test>
</suite>
```

### 3 — Wrap WebDriver in your test setup

```java
import io.github.yoggit.sarvavaradi.SarvaVaradiRetryAnalyzer;
import io.github.yoggit.sarvavaradi.SarvaVaradiWebDriverListener;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.events.EventFiringDecorator;
import org.testng.annotations.*;

public class BaseTest {

    protected WebDriver driver;

    @BeforeMethod
    public void setup() {
        WebDriver baseDriver = new ChromeDriver();
        SarvaVaradiWebDriverListener listener = new SarvaVaradiWebDriverListener(baseDriver);
        driver = new EventFiringDecorator(listener).decorate(baseDriver);
    }

    @AfterMethod
    public void teardown() {
        if (driver != null) driver.quit();
    }
}
```

### 4 — Run tests

```bash
mvn clean test
```

Report generated at `sarva-report/index.html`.

```bash
open sarva-report/index.html   # macOS
start sarva-report/index.html  # Windows
xdg-open sarva-report/index.html  # Linux
```

---

## What Gets Captured

| Data | Captured |
|---|---|
| Test pass / fail / skip | ✅ Automatic |
| Duration | ✅ Automatic |
| Error message & stack trace | ✅ Automatic |
| Browser name & version | ✅ Automatic |
| Navigation (URL changes) | ✅ Via `SarvaVaradiWebDriverListener` |
| Element interactions (click, type) | ✅ Via listener |
| Screenshots on failure | ✅ Configurable |
| Flaky / retry detection | ✅ Via `SarvaVaradiRetryAnalyzer` |

---

## Flaky Test Detection

```java
@Test(retryAnalyzer = SarvaVaradiRetryAnalyzer.class)
public void testFlakyLogin() {
    // test code
}
```

Configure retry count in `sarva-varadi.properties`:

```properties
sarva.maxRetryCount=2
```

Tests that pass after a retry are automatically marked **FLAKY** in the report.

---

## Screenshot Configuration

```properties
# sarva-varadi.properties
sarva.screenshot=on-failure   # on-failure | always | never
sarva.screenshotDir=sarva-varadi-results/screenshots
```

---

## Sensitive Data Masking

```properties
# sarva-varadi.properties
sarva.maskSensitiveData=true
```

When enabled, input fields matching `password`, `token`, `secret`, `apikey` patterns are masked in step logs.

---

## Notifications

Send Slack, Teams, or Email notifications after each run via `sarva-varadi.properties`:

```properties
sarva.notifications.enabled=true
sarva.notifications.slack.enabled=true
sarva.notifications.slack.webhookUrl=${SLACK_WEBHOOK_URL}
sarva.notifications.slack.channel=#test-results
```

See [NOTIFICATIONS.md](../../NOTIFICATIONS.md) for full configuration options.

---

## Full Integration Guide

For the complete step-by-step guide including the Maven exec plugin for report generation, see the [Selenium + Maven Integration Guide](../../README.md#selenium-maven-guide) in the main README.

---

## License

MIT
