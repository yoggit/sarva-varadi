<p align="center">
  <img src="screenshots/logo.png" alt="Sarva-Varadi Logo" width="360">
</p>

<h1 align="center">Sarva-Varadi - <sub><sup>Unified Insights...Universal Reports</sup></sub></h1>

<p align="center">
  <strong>Comprehensive test reporting framework with historical trend analysis, intelligent flaky test detection, and interactive dashboards for multiple test automation tools.</strong>
</p>

<p align="center">
  Zero config • File-based • Beautiful UI • Multi-framework
</p>

<p align="center">
  <strong>"Sarva"</strong> means "All" or "Universal", <strong>"Varadi"</strong> means "Reporting" - one reporter for all your testing tools.
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/@sarva-varadi/core" alt="npm version">
  <img src="https://img.shields.io/npm/l/@sarva-varadi/core" alt="license">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="https://yoggit.github.io/sarva-varadi">🎬 Live Demo</a> •
  <a href="#-features">Features</a> •
  <a href="#-visual-preview">Screenshots</a> •
  <a href="QUICKSTART.md">Full Docs</a>
</p>

<p align="center">
  <strong>🎭 <a href="https://yoggit.github.io/sarva-varadi/playwright/trends.html">Playwright Demo</a></strong> • 
  <strong>🌐 <a href="https://yoggit.github.io/sarva-varadi/selenium/trends.html">Selenium Demo</a></strong> • 
  <strong>🔌 <a href="https://yoggit.github.io/sarva-varadi/rest-assured/trends.html">RestAssured Demo</a></strong>
</p>

---

## 🎯 Supported Frameworks

<table>
<tr>
<td width="25%" align="center"><strong>🎭 Playwright</strong><br/>Web automation<br/>TypeScript/JavaScript</td>
<td width="25%" align="center"><strong>🔌 RestAssured</strong><br/>API testing<br/>Java/TestNG</td>
<td width="25%" align="center"><strong>🌐 Selenium</strong><br/>WebDriver browser tests<br/>Java/TestNG</td>
<td width="25%" align="center"><strong>🚧 Cypress</strong><br/>Modern web testing<br/><em>(Coming soon)</em></td>
</tr>
</table>

---

## ✨ Features

<table>
<tr>
<td width="50%">

**📊 Reporting & Analytics**
- 🎨 Beautiful dark/light theme UI
- 📈 Interactive trend charts with zoom
- 🔥 Intelligent flaky test detection
- 🎯 Top offenders leaderboard
- 📅 Activity stream with filters
- 📎 Rich attachments (screenshots/videos/traces)

</td>
<td width="50%">

**⚡ Developer Experience**
- ⚡ Zero config - works out of the box
- 📁 File-based - no database needed
- 🔄 Framework agnostic
- 🎪 Multi-browser support
- 🔍 Smart search & filtering
- 📧 Slack/Teams/Email notifications

</td>
</tr>
</table>

---

## 📸 Visual Preview

### Latest Report (`index.html`)

<details>
<summary><b>Summary Dashboard</b></summary>
<br>
<img src="screenshots/latest-report/summary.png" alt="Summary Dashboard" width="100%">
<p><i>Overview of test execution with pass/fail/skip counts, duration, and mini trend widget</i></p>
</details>

<details>
<summary><b>Retried Tests View</b></summary>
<br>
<img src="screenshots/latest-report/retried-tests.png" alt="Retried Tests" width="100%">
<p><i>Dedicated section showing tests that were retried with their final status</i></p>
</details>

<details>
<summary><b>Search & Filters</b></summary>
<br>
<img src="screenshots/latest-report/filters.png" alt="Search and Filters" width="100%">
<p><i>Filter tests by status (passed/failed/skipped) and search by test name</i></p>
</details>

<details>
<summary><b>Test Details - Expanded View</b></summary>
<br>
<img src="screenshots/latest-report/test-details-expanded.png" alt="Test Details Expanded" width="100%">
<p><i>Detailed test steps, error messages, stack traces, and attachments (screenshots, videos, traces)</i></p>
</details>

### Trends Dashboard (`trends.html`)

<details>
<summary><b>Health Pulse - Pass Rate Trends</b></summary>
<br>
<img src="screenshots/trends-report/health-pulse-with-filters.png" alt="Health Pulse with Filters" width="100%">
<p><i>Interactive line chart showing pass rate over time with date range filters and zoom controls</i></p>
</details>

<details>
<summary><b>Execution Breakdown</b></summary>
<br>
<img src="screenshots/trends-report/execution-breakdown.png" alt="Execution Breakdown" width="100%">
<p><i>Stacked bar chart displaying test distribution (passed/failed/flaky/skipped) per run</i></p>
</details>

<details>
<summary><b>Top Offenders - Flaky Tests</b></summary>
<br>
<img src="screenshots/trends-report/top-offenders.png" alt="Top Offenders" width="100%">
<p><i>Historically flaky tests with scores (0-100), last flaky date, and last 10 runs visualization with hover tooltips</i></p>
</details>

<details>
<summary><b>Activity Stream</b></summary>
<br>
<img src="screenshots/trends-report/activity-stream.png" alt="Activity Stream" width="100%">
<p><i>Filterable test run history (Last 20/50/100/All) with scrollable view showing date, pass rate, results, and duration</i></p>
</details>

---

## 🏗️ Architecture

Sarva-Varadi uses a **two-phase execution model** inspired by Allure:

### Phase 1: Data Collection
During test execution, framework-specific adapters convert test results into a standardized JSON format.

### Phase 2: Report Generation
After execution, the core generator creates beautiful HTML reports from the collected data.

```
┌─────────────────┐
│  Playwright     │──┐
│  Selenium       │──┼──→ Adapter ──→ Common JSON ──→ Report Generator ──→ HTML
│  Cypress        │──┤                                                       
│  RestAssured    │──┘
└─────────────────┘
```

---

## 📦 Installation

> 🚀 **New to Sarva-Varadi?** Check out the [QUICKSTART.md](QUICKSTART.md) guide!

### For Playwright

```bash
npm install --save-dev @sarva-varadi/core @sarva-varadi/playwright
```

### For RestAssured (API Testing)

Add to your `pom.xml` — see the [RestAssured + Maven Integration Guide](#restassured-maven-guide) below.

### For Selenium (WebDriver + TestNG)

Add to your `pom.xml` — see the [Selenium + Maven Integration Guide](#selenium-maven-guide) below.

---

## 🚀 Quick Start

<details>
<summary><b>🎭 Playwright Configuration</b></summary>

### Installation

```bash
npm install --save-dev @sarva-varadi/core @sarva-varadi/playwright
```

### Setup

Add to your `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['list'],
    ['@sarva-varadi/playwright', {
      outputFolder: 'sarva-report',
      title: 'My Test Report',
      maskSensitiveData: false,   // set true to mask passwords/tokens in step titles
      history: {
        enabled: true,
        maxRuns: 30,
        retentionDays: 90,
      },
      trends: {
        enabled: true,
        showInMainReport: true,
      },
    }]
  ],
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  // Configure browsers for parallel execution
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
    // Uncomment to enable additional browsers
    // {
    //   name: 'webkit',
    //   use: { browserName: 'webkit' },
    // },
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     browserName: 'chromium',
    //     ...devices['Pixel 5'],
    //   },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: {
    //     browserName: 'webkit',
    //     ...devices['iPhone 12'],
    //   },
    // },
  ],
});
```

### Features

- ✅ Automatic screenshot/video capture on failure
- ✅ Playwright trace integration
- ✅ Multi-browser support with automatic grouping
- ✅ Flaky test detection with retry tracking
- ✅ Historical trends and pass rate analysis
- ✅ Test steps with timing information

### Multi-Browser Testing

- Reports automatically group results by browser
- Test names include browser suffix (e.g., "Login Test - chromium")
- Install browsers: `npx playwright install`
- Enable parallel execution with `fullyParallel: true` and `workers: 2` or more

### Run Tests

```bash
npx playwright test
```

### Open Report

```bash
# Windows
start sarva-report/index.html

# macOS
open sarva-report/index.html

# Linux
xdg-open sarva-report/index.html
```

</details>

<details>
<summary><b>🔌 RestAssured Configuration (API Testing)</b></summary>

### Installation

Add to your `pom.xml`:

```xml
<repositories>
    <repository>
        <id>jitpack.io</id>
        <url>https://jitpack.io</url>
    </repository>
</repositories>

<dependency>
    <groupId>com.github.yoggit.sarva-varadi</groupId>
    <artifactId>sarva-varadi-restassured</artifactId>
    <version>v2.0.1</version>
    <scope>test</scope>
</dependency>
```

### Setup

**1. Add listener to `testng.xml`**

```xml
<!DOCTYPE suite SYSTEM "https://testng.org/testng-1.0.dtd">
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

**2. Add request capture filter to your test setup**

```java
import io.github.yoggit.sarvavaradi.RestAssuredRequestCapture;
import io.github.yoggit.sarvavaradi.SarvaVaradiRetryAnalyzer;
import io.restassured.RestAssured;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import static io.restassured.RestAssured.*;

public class UserApiTest {

    @BeforeClass
    public void setup() {
        RestAssured.baseURI = "https://api.example.com";
        RestAssured.filters(new RestAssuredRequestCapture()); // captures req/response details
    }

    @Test
    public void testGetUser() {
        given().when().get("/users/1").then().statusCode(200);
    }

    // Enable retry for flaky test detection
    @Test(retryAnalyzer = SarvaVaradiRetryAnalyzer.class)
    public void testFlakyEndpoint() {
        given().when().get("/users/status").then().statusCode(200);
    }
}
```

**3. Run Tests — report auto-generates**

```bash
mvn test
# Report opens at: sarva-report/index.html
```

> 📖 Full setup guide: see the [RestAssured + Maven Integration Guide](#restassured-maven-guide) below.

### Features

- ✅ Detailed request/response capture (method, URL, headers, body)
- ✅ Hierarchical test steps with parent-child structure
- ✅ Automatic flaky test detection with retry tracking
- ✅ Detailed request/response capture (method, URL, headers, body)
- ✅ Sensitive data masking (via `sarva-varadi.properties` or `-D` flag)
- ✅ Historical trends and pass rate analysis
- ✅ Works with any TestNG-based API tests

### Sensitive Data Masking (Optional)

By default, all request/response data is captured as-is. Enable masking when needed:

```properties
# sarva-varadi.properties (persistent — recommended)
sarva.maskSensitiveData=true
```

```bash
# Or as a one-off system property
mvn test -Dsarva.maskSensitiveData=true
```

**What gets masked:**
- Headers: Authorization, X-API-Key, Cookie, Set-Cookie
- Body fields: password, token, secret, apikey, credit_card, ssn

📂 **Demo project:** [`demo-restassured/`](demo-restassured/)

</details>

<a id="restassured-maven-guide"></a>
<details>
<summary>🔌 RestAssured + Maven Integration Guide</summary>

<br>

> ✅ **Seamless setup** — No cloning, no hardcoded paths. Just Maven + Node.js.
>
> **Prerequisites:** Java 11+, Maven 3.6+, [Node.js](https://nodejs.org)

---

### Step 1 — Add repository & dependency to `pom.xml`

```xml
<repositories>
    <repository>
        <id>jitpack.io</id>
        <url>https://jitpack.io</url>
    </repository>
</repositories>

<dependencies>
    <!-- Your existing RestAssured + TestNG dependencies -->
    <dependency>
        <groupId>io.rest-assured</groupId>
        <artifactId>rest-assured</artifactId>
        <version>5.3.2</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.testng</groupId>
        <artifactId>testng</artifactId>
        <version>7.8.0</version>
        <scope>test</scope>
    </dependency>

    <!-- Sarva-Varadi: TestNG listener + RestAssured request capture -->
    <dependency>
        <groupId>com.github.yoggit.sarva-varadi</groupId>
        <artifactId>sarva-varadi-restassured</artifactId>
        <version>v2.0.1</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

### Step 2 — Add report generation plugin to `pom.xml`

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <version>3.0.0</version>
            <configuration>
                <suiteXmlFiles>
                    <suiteXmlFile>src/test/resources/testng.xml</suiteXmlFile>
                </suiteXmlFiles>
                <testFailureIgnore>true</testFailureIgnore>
            </configuration>
        </plugin>

        <!-- Auto-generates the HTML report after mvn test -->
        <plugin>
            <groupId>org.codehaus.mojo</groupId>
            <artifactId>exec-maven-plugin</artifactId>
            <version>3.1.0</version>
            <executions>
                <execution>
                    <id>generate-sarva-report</id>
                    <phase>test</phase>
                    <goals><goal>exec</goal></goals>
                    <configuration>
                        <!-- Windows users: change npx to npx.cmd -->
                        <executable>npx</executable>
                        <arguments>
                            <argument>--yes</argument>
                            <argument>@sarva-varadi/core</argument>
                            <argument>generate</argument>
                            <argument>--input</argument>
                            <argument>${project.basedir}/sarva-varadi-results/test-results.json</argument>
                            <argument>--output</argument>
                            <argument>${project.basedir}/sarva-report</argument>
                        </arguments>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

---

### Step 3 — Add listener to `testng.xml`

```xml
<!DOCTYPE suite SYSTEM "https://testng.org/testng-1.0.dtd">
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

---

### Step 4 — Add request capture filter to your test setup

```java
import io.github.yoggit.sarvavaradi.RestAssuredRequestCapture;
import io.restassured.RestAssured;

public class UserApiTest {

    @BeforeClass
    public void setup() {
        RestAssured.baseURI = "https://api.example.com";
        RestAssured.filters(new RestAssuredRequestCapture()); // captures req/response in report
    }

    @Test
    public void testGetUser() {
        given().when().get("/users/1").then().statusCode(200);
    }
}
```

---

### Step 5 — Run tests

```bash
mvn test
```

That's it. This will:
1. ✅ Run all TestNG tests
2. ✅ Collect results → `sarva-varadi-results/test-results.json`
3. ✅ Auto-generate the HTML report → `sarva-report/index.html`

```bash
# Open the report
open sarva-report/index.html       # macOS
start sarva-report/index.html      # Windows
xdg-open sarva-report/index.html   # Linux
```

📂 **Demo project:** [`demo-restassured/`](demo-restassured/)

</details>

<details>
<summary><b>🌐 Selenium Configuration (WebDriver + TestNG)</b></summary>

### Installation

Add to `pom.xml` (see the [Selenium + Maven Integration Guide](#selenium-maven-guide) below for full `pom.xml`):

```xml
<!-- JitPack repository -->
<repositories>
    <repository>
        <id>jitpack.io</id>
        <url>https://jitpack.io</url>
    </repository>
</repositories>

<!-- Sarva-Varadi Selenium listener -->
<dependency>
    <groupId>com.github.yoggit.sarva-varadi</groupId>
    <artifactId>sarva-varadi-selenium</artifactId>
    <version>v2.0.1</version>
    <scope>test</scope>
</dependency>
```

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
        // Step 1: create the raw driver as usual
        WebDriver baseDriver = new ChromeDriver();

        // Step 2: pass the raw driver to the listener AND to decorate()
        // Both must receive the same unwrapped instance — use a separate baseDriver variable
        SarvaVaradiWebDriverListener listener = new SarvaVaradiWebDriverListener(baseDriver);
        driver = new EventFiringDecorator<>(listener).decorate(baseDriver);

        // 'driver' is now the decorated version — use this in all your tests
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
mvn test
# Report auto-generates at: sarva-report/index.html
```

> The `exec-maven-plugin` in `pom.xml` generates the report automatically after tests. See the full setup in the [Selenium + Maven Integration Guide](#selenium-maven-guide) below.

### Features

- ✅ Automatic WebDriver action capture (clicks, navigation, form inputs)
- ✅ Screenshots on test failure
- ✅ Browser information (Chrome, Firefox, Edge)
- ✅ Flaky test detection with retry tracking
- ✅ Sensitive data masking (via `sarva-varadi.properties` or `-D` flag)

📖 **Full documentation:** [`packages/selenium/README.md`](packages/selenium/README.md)

📂 **Demo project:** [`demo-selenium/`](demo-selenium/)

</details>

<a id="selenium-maven-guide"></a>
<details>
<summary>🌐 Selenium + Maven Integration Guide</summary>

<br>

> ✅ **Seamless setup** — No cloning, no hardcoded paths. Just Maven + Node.js.
>
> **Prerequisites:** Java 11+, Maven 3.6+, [Node.js](https://nodejs.org), ChromeDriver (or your browser driver)

---

### Step 1 — Add repository & dependency to `pom.xml`

```xml
<repositories>
    <repository>
        <id>jitpack.io</id>
        <url>https://jitpack.io</url>
    </repository>
</repositories>

<dependencies>
    <!-- Selenium + TestNG (or your existing dependencies) -->
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

    <!-- Sarva-Varadi: TestNG listener + WebDriver event listener -->
    <dependency>
        <groupId>com.github.yoggit.sarva-varadi</groupId>
        <artifactId>sarva-varadi-selenium</artifactId>
        <version>v2.0.1</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

### Step 2 — Add report generation plugin to `pom.xml`

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <version>3.2.2</version>
            <configuration>
                <suiteXmlFiles>
                    <suiteXmlFile>src/test/resources/testng.xml</suiteXmlFile>
                </suiteXmlFiles>
                <testFailureIgnore>true</testFailureIgnore>
            </configuration>
        </plugin>

        <!-- Auto-generates the HTML report after mvn test -->
        <plugin>
            <groupId>org.codehaus.mojo</groupId>
            <artifactId>exec-maven-plugin</artifactId>
            <version>3.1.0</version>
            <executions>
                <execution>
                    <id>generate-sarva-report</id>
                    <phase>test</phase>
                    <goals><goal>exec</goal></goals>
                    <configuration>
                        <!-- Windows users: change npx to npx.cmd -->
                        <executable>npx</executable>
                        <arguments>
                            <argument>--yes</argument>
                            <argument>@sarva-varadi/core</argument>
                            <argument>generate</argument>
                            <argument>--input</argument>
                            <argument>${project.basedir}/sarva-varadi-results/test-results.json</argument>
                            <argument>--output</argument>
                            <argument>${project.basedir}/sarva-report</argument>
                        </arguments>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

---

### Step 3 — Add listener to `testng.xml`

```xml
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

---

### Step 4 — Wrap your WebDriver in test setup

Pass the **raw/unwrapped** driver to both the listener and `.decorate()` — both must receive the same unwrapped instance. Always use a separate `baseDriver` variable to keep the raw and decorated instances distinct.

```java
import io.github.yoggit.sarvavaradi.SarvaVaradiWebDriverListener;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.events.EventFiringDecorator;
import org.testng.annotations.*;

public class LoginTest {
    private WebDriver driver;

    @BeforeMethod
    public void setup() {
        // Step 1: create the raw driver as usual
        WebDriver baseDriver = new ChromeDriver();

        // Step 2: pass the raw driver to the listener AND to decorate()
        SarvaVaradiWebDriverListener listener = new SarvaVaradiWebDriverListener(baseDriver);
        driver = new EventFiringDecorator<>(listener).decorate(baseDriver);

        // 'driver' is now the decorated version — use this in all your tests
    }

    @Test
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

> **If you use a centralized `DriverManager` / `BrowserManager` class**, add the wrapping there — right after creating the driver, before returning it:
> ```java
> WebDriver baseDriver = new ChromeDriver(options);
> SarvaVaradiWebDriverListener listener = new SarvaVaradiWebDriverListener(baseDriver);
> driver = new EventFiringDecorator<>(listener).decorate(baseDriver);
> return driver;
> ```
> Do **not** reuse the same field variable on both sides of the same line — always use a separate `baseDriver` reference to keep the raw and decorated instances distinct.
>
> The listener **automatically registers itself** when created, so test step capture works regardless of whether it is created in a test class or a centralized factory — you do not need to store or pass the listener anywhere else.

---

### Step 5 — Run tests

```bash
mvn test
# Report auto-generates at: sarva-report/index.html
```

That's it. This will:
1. ✅ Run all TestNG + Selenium tests
2. ✅ Capture browser actions, screenshots, and flaky retries
3. ✅ Auto-generate the HTML report → `sarva-report/index.html`

```bash
# Open the report
open sarva-report/index.html       # macOS
start sarva-report/index.html      # Windows
xdg-open sarva-report/index.html   # Linux
```

### Optional — `sarva-varadi.properties`

Drop a `sarva-varadi.properties` file in your project root to configure behaviour:

```properties
# ── Collection ──────────────────────────────────────────────────────────
sarva.outputDir=sarva-varadi-results          # where test-results.json is written
sarva.screenshotDir=sarva-varadi-results/screenshots  # where screenshot files are saved
sarva.screenshot=on-failure                   # always | on-failure | never
sarva.maskSensitiveData=false                 # true to mask passwords/tokens in logs
sarva.maxRetryCount=2                         # retries before marking a test as failed

# ── Report display ───────────────────────────────────────────────────────
sarva.report.title=My Test Suite              # title shown in the HTML report header
sarva.report.showStackTrace=true              # show full stack traces in the report
sarva.report.embedAttachments=true            # embed screenshots inline in the report

# ── History & trends ────────────────────────────────────────────────────
sarva.report.maxRuns=20                       # max past runs to keep (oldest deleted first)
sarva.report.retentionDays=90                 # max age in days (whichever limit hits first wins)
sarva.report.history=true                     # enable historical run tracking
sarva.report.trends=true                      # enable trend analysis across runs
```

📂 **Demo project:** [`demo-selenium/`](demo-selenium/)

</details>

---

## 🔄 Universal Converter

<details>
<summary><b>Generate Reports from Any Format (JUnit, TestNG, Cucumber)</b></summary>

<br>

Already have test results from other tools? Sarva-Varadi can convert them into beautiful reports using the CLI converter.

### Installation

```bash
# Install globally for CLI access
npm install -g @sarva-varadi/core

# Or use locally in your project
npm install --save-dev @sarva-varadi/core
npx sarva-varadi generate --input <file> --output <dir>
```

### Usage Examples

```bash
# JUnit XML (Maven Surefire, Gradle)
sarva-varadi generate --input target/surefire-reports/TEST-*.xml --output sarva-report

# TestNG XML
sarva-varadi generate --input test-output/testng-results.xml --output sarva-report

# Cucumber JSON
sarva-varadi generate --input cucumber-report.json --output sarva-report --title "API Tests"

# Already in Sarva-Varadi format (no conversion needed)
sarva-varadi generate --input sarva-data.json --output sarva-report
```

### Smart Auto-Detection

The converter intelligently detects the format and handles conversion automatically:

| Format | Detection Method | Notes |
|--------|------------------|-------|
| **Sarva-Varadi JSON** | Checks for required fields (`tool`, `name`, `status`, `duration`) | **Skips conversion** - direct pass-through |
| **JUnit XML** | Looks for `<testsuites>` or `<testsuite>` root | Maven Surefire, Gradle test reports |
| **TestNG XML** | Looks for `<testng-results>` or `<suite>` root | Standard TestNG output |
| **Cucumber JSON** | Checks for `type: "feature"` and `elements` array | Cucumber JSON formatter output |

**Key Features:**
- 🎯 Zero-config format detection - just point to your file
- ⚡ **Intelligent skip** - if data is already in Sarva-Varadi format, no conversion overhead
- 📁 Works with both XML and JSON files
- 🔄 Same beautiful reports as native adapters
- 📊 Full historical tracking and trend analysis included
- 🎨 Consistent UI across all converted formats

### CLI Options

```bash
sarva-varadi generate [options]

Options:
  --input, -i <path>     Input test results file (required)
  --output, -o <path>    Output directory for reports (required)
  --title, -t <title>    Custom report title (optional)
  --help, -h             Show help message

Examples:
  # Basic usage
  sarva-varadi generate -i junit.xml -o sarva-report
  
  # With custom title
  sarva-varadi generate -i testng.xml -o reports --title "Regression Suite"
  
  # CI/CD integration
  sarva-varadi generate -i $REPORT_PATH -o $OUTPUT_DIR
```

### What Gets Generated

After running the CLI, you'll get:

```
sarva-report/
├── index.html              # Latest run report with test details
├── trends.html             # Historical trends dashboard
├── attachments/            # Screenshots, videos (if present)
└── history/
    ├── runs.json          # Run metadata and trends
    └── 2026-05-10-*/      # Archived run data
        └── data.json
```

### Supported Formats

| Format | Status | File Extension | Common Source |
|--------|--------|----------------|---------------|
| Sarva-Varadi JSON | ✅ Native | `.json` | Playwright/Selenium adapters |
| JUnit XML | ✅ Supported | `.xml` | Maven Surefire, Gradle |
| TestNG XML | ✅ Supported | `.xml` | TestNG framework |
| Cucumber JSON | ✅ Supported | `.json` | Cucumber JSON formatter |
| Mocha JSON | 🚧 Coming soon | `.json` | Mocha `--reporter json` |
| Jest JSON | 🚧 Coming soon | `.json` | Jest `--json` |

### Use Cases

**1. Legacy Test Suites**
Convert existing JUnit/TestNG reports without changing your test framework:
```bash
sarva-varadi generate --input target/surefire-reports/*.xml --output sarva-report
```

**2. CI/CD Pipelines**
Add as a post-test step to generate reports from any tool:
```yaml
# GitHub Actions example
- name: Generate Sarva-Varadi Report
  run: |
    npm install -g @sarva-varadi/core
    sarva-varadi generate -i test-results.xml -o sarva-report
    
- name: Upload Report
  uses: actions/upload-artifact@v3
  with:
    name: test-report
    path: sarva-report/
```

**3. Multi-Framework Projects**
Combine reports from different testing tools into one consistent format:
```bash
# Convert Java tests
sarva-varadi generate -i junit.xml -o reports/java

# Convert BDD tests  
sarva-varadi generate -i cucumber.json -o reports/bdd
```

**4. Migration Path**
Start using Sarva-Varadi with existing reports, then migrate to native adapters later for richer features (screenshots, videos, traces).

### Conversion vs Native Adapters

| Feature | CLI Converter | Native Adapters (Playwright/Selenium) |
|---------|---------------|----------------------------------------|
| Test results | ✅ Yes | ✅ Yes |
| Pass/Fail/Skip status | ✅ Yes | ✅ Yes |
| Error messages & stack traces | ✅ Yes | ✅ Yes |
| Test duration | ✅ Yes | ✅ Yes |
| Historical trends | ✅ Yes | ✅ Yes |
| Flaky test detection | ✅ Yes | ✅ Yes |
| Screenshots | ⚠️ If in source format | ✅ Automatic |
| Videos | ⚠️ If in source format | ✅ Automatic |
| Trace files | ❌ Not available | ✅ Playwright only |
| Test steps | ⚠️ Cucumber only | ✅ Automatic |
| Retry information | ⚠️ Limited | ✅ Full retry tracking |
| Browser grouping | ⚠️ If in test name | ✅ Automatic |

**Recommendation:** Use the CLI converter for quick wins and legacy compatibility. For new projects or full feature support, use native adapters for the richest experience.

📖 **[Full Converter Documentation](CONVERTER.md)** - Detailed guide with CI/CD examples, troubleshooting, and advanced usage

</details>

---

## 📊 Two Views

### View 1: Latest Run (`index.html`)
- Current test execution results with summary dashboard
- Pass/fail/skip counts with visual progress bars
- Search and filter functionality (by status, test name, browser)
- Individual test details with steps, errors, and attachments
- Mini trend widget showing last 7 runs

### View 2: Trends Dashboard (`trends.html`)
- **Health Pulse**: Pass rate over time with interactive line chart
- **Execution Breakdown**: Test distribution per run (stacked bar chart)
- **Top Offenders**: Historically flaky tests with scores (0-100) and last flaky date
  - Shows only tests that actually passed after retry (intelligent detection)
  - Grouped by test name (removes browser duplicates)
  - Last 10 runs icons with hover tooltips showing date/time
- **Activity Stream**: Filterable history (Last 20/50/100/All) with vertical scrolling
- Date range filters and zoom controls on charts

Navigation between views via header buttons.

---

## ⚙️ Configuration Options

<details>
<summary><b>View all configuration options</b></summary>

<br>

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `outputFolder` | string | `'sarva-report'` | Directory for the report |
| `outputFile` | string | `'index.html'` | Report filename |
| `title` | string | `'Sarva-Varadi Test Report'` | Report title |
| `showStackTrace` | boolean | `true` | Show full stack traces |
| `embedAttachments` | boolean | `true` | Embed screenshots/videos |

### History Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `history.enabled` | boolean | `true` | Enable historical tracking |
| `history.maxRuns` | number | `20` | Keep last N runs (no hard limit, can be set to 100+ for extensive history) |
| `history.retentionDays` | number | `90` | Auto-cleanup after N days (3 months default, can be set to 365+ for longer retention) |
| `history.trackPerTest` | boolean | `true` | Track per-test flakiness |

**Storage & Performance:**
- No technical limit on `maxRuns` - can handle hundreds of runs
- Each run stored as separate JSON file (~1KB per run)
- Trend charts work best with 20-100 runs
- Flaky test detection improves with more historical data
- Longer retention provides better seasonal trend analysis

### Trends Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `trends.enabled` | boolean | `true` | Generate trends.html |
| `trends.showInMainReport` | boolean | `true` | Embed mini-trend widget |

### Notification Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `notifications.enabled` | boolean | `false` | Enable notifications |
| `notifications.slack` | object | - | Slack webhook configuration |
| `notifications.teams` | object | - | Teams webhook configuration |
| `notifications.email` | object | - | SMTP email configuration |

**📖 See [NOTIFICATIONS.md](NOTIFICATIONS.md) for detailed setup guide**

</details>

## 📂 Output Structure

<details>
<summary><b>View generated files structure</b></summary>

<br>

```
sarva-report/
├── index.html              # Latest run report
├── trends.html             # Historical trends dashboard
├── attachments/            # Screenshots, videos, traces
└── history/
    ├── runs.json          # Run metadata and trends data
    ├── 2026-05-09-143022/ # Individual run archive
    │   └── data.json
    └── 2026-05-08-091530/
        └── data.json
```

</details>

---

## 🎯 Historical Trends & Flaky Test Detection

<details>
<summary><b>Learn about intelligent flaky test detection</b></summary>

<br>

### Intelligent Flaky Test Detection

Sarva-Varadi tracks flaky tests across **entire history** (not just last 10 runs):
- **wasEverFlaky**: Permanent flag tracking if test was ever flaky
- **lastFlakyRunId**: Stores most recent flaky occurrence with date/time
- **Only counts true flaky tests**: Tests that passed after retry (not just failed retries)

### Flaky Score Calculation (0-100)

```
Score = (Status Changes / Total Runs × 100) + (Flaky Retries / Total Runs × 20)
```

- **Status changes**: Pass → Fail → Pass transitions
- **Flaky retries**: Only counts retries when test eventually passed

**Score interpretation:**
- `0-20`: Stable ✅
- `21-50`: Moderately flaky ⚠️
- `51-100`: Highly flaky 🔴

### Automatic Cleanup

Old test runs are automatically cleaned up using a **"whichever comes first"** policy — a run is deleted the moment it exceeds **either** limit:

1. **`maxRuns`** — keeps the last N runs. In normal sequential use, exactly **1 oldest run** is deleted each time a new run is added. (default: 20)
2. **`retentionDays`** — removes runs older than N days. Deletes **all** runs past the age threshold in one pass — so if you pause testing for weeks and multiple runs age out, they are all removed when the next run triggers cleanup. (default: 90)

<details>
<summary><b>Corner case examples (maxRuns=20, retentionDays=90)</b></summary>

<br>

**Case 1 — Heavy CI usage (maxRuns triggers first)**

You run tests 3× a day for 8 days = 24 runs, all less than 8 days old.

| Limit hit | What happens |
|---|---|
| Run #21 arrives | Run #1 deleted — it's only 7 days old but `maxRuns` triggered first |

---

**Case 2 — Paused testing (retentionDays deletes multiple at once)**

You run tests once a week, then pause for 3 months. When you resume, 13 old runs are now past 90 days.

| Limit hit | What happens |
|---|---|
| Next run arrives | All 13 stale runs deleted in one pass — `retentionDays` does not wait to remove them one at a time |

This is intentional — stale runs past the age threshold are all cleaned up immediately, not incrementally.

---

**Case 3 — The tricky one: burst after slow start**

26 old weekly runs (100–90 days old), then 100 new runs in 2 weeks. Total = 126 runs.

| Limit hit | What happens |
|---|---|
| `maxRuns=20` | Runs beyond position #20 are deleted — the old weekly runs are purged |
| `retentionDays=90` | Any run older than 90 days also deleted independently |

With the old AND logic, runs within 90 days would have survived even if beyond position #20 — `maxRuns` would have been completely ignored.

---

**Case 4 — Both limits hit simultaneously**

Run #21 arrives AND it's from 95 days ago (slow project, 21 runs over 3+ months).

Both limits exceeded at the same time — run is deleted regardless.

---

**Case 5 — Exactly at the boundary**

You have exactly 20 runs, all exactly 90 days old today. Run #21 comes in.

Both `maxRuns` and `retentionDays` trigger simultaneously — the oldest run is deleted.

</details>

</details>

---

## 📧 Notifications

<details>
<summary><b>Setup Slack, Teams, or Email notifications</b></summary>

<br>

Send test results automatically to Slack, Microsoft Teams, or Email:

### Quick Setup Example

```typescript
export default defineConfig({
  reporter: [
    ['@sarva-varadi/playwright', {
      notifications: {
        enabled: true,
        
        // Slack notification
        slack: {
          enabled: true,
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          // Example: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX'
          channel: '#test-results',
          mentionOnFailure: ['john.doe', 'jane.smith'], // Optional: @mention on failures
        },
        
        // Microsoft Teams notification
        teams: {
          enabled: true,
          webhookUrl: process.env.TEAMS_WEBHOOK_URL,
          // Example: 'https://outlook.office.com/webhook/a1b2c3d4.../IncomingWebhook/...'
        },
        
        // Email notification
        email: {
          enabled: true,
          smtp: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS, // App password for Gmail
            },
          },
          from: 'noreply@yourcompany.com',
          to: ['qa@yourcompany.com', 'dev@yourcompany.com'],
          subject: 'Test Results - ${passRate}% Pass Rate', // Optional
        },
      },
    }]
  ],
});
```

### Environment Variables

```bash
# .env file (never commit this!)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/YOUR/WEBHOOK/URL
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Sample Notification Output

**Slack Message:**
```
📊 Test Results
━━━━━━━━━━━━━━━━━━
Total: 50           Pass Rate: 90%
Passed: ✅ 45       Failed: ❌ 3
Duration: 2m 5s     Skipped: ⏭️ 1
━━━━━━━━━━━━━━━━━━

Failed Tests:
• Login flow - timeout after 30s
• Checkout process - assertion failed
• API integration test - network error

[📊 View Full Report] (button)
```

**What gets sent:**
- ✅ Summary stats (total, pass rate, duration)
- ✅ Pass/Fail/Skip/Flaky counts
- ✅ Top 5 failed tests with names
- ✅ Link to full HTML report (if hosted)
- ✅ Color-coded status (🎉 green, ⚠️ yellow, 🚨 red)

**📖 Full documentation:** [NOTIFICATIONS.md](NOTIFICATIONS.md)

**🚀 Quick 5-minute setup:** [NOTIFICATIONS-SETUP.md](NOTIFICATIONS-SETUP.md)

</details>

---

## 🔄 Comparison with Other Tools

| Feature | Allure | ReportPortal | Sarva-Varadi |
|---------|--------|--------------|--------------|
| Multi-framework | ✅ 30+ | ✅ Many | ✅ 2+ (growing) |
| Modern UI | ⚠️ Dated | ⚠️ Complex | ✅ Beautiful |
| Zero config | ❌ CLI needed | ❌ Server setup | ✅ Yes |
| File-based | ✅ Yes | ❌ DB required | ✅ Yes |
| Historical trends | ✅ Basic | ✅ Advanced | ✅ File-based |
| Flaky detection | ⚠️ Manual | ✅ ML-based | ✅ Score-based |
| Notifications | ❌ No | ✅ Yes | ✅ Slack/Teams/Email |
| CI/CD friendly | ✅ Yes | ⚠️ Complex | ✅ Yes |
| Setup time | 15 min | 1+ hour | < 2 min |

---

## 🏛️ Monorepo Structure

```
packages/
├── core/              # @sarva-varadi/core
│   ├── types/        # Common interfaces
│   ├── adapters/     # Base adapter class
│   ├── converters/   # Format converters (JUnit, TestNG, Cucumber)
│   ├── generators/   # HTML report generation
│   └── history-manager.ts
│
├── playwright/        # @sarva-varadi/playwright
│   └── adapter.ts    # Playwright-specific adapter
│
├── rest-assured/      # @sarva-varadi/rest-assured
    ├── adapter.ts    # RestAssured adapter
    └── testng/       # TestNG listener & retry analyzer
```

---

## 🛠️ Development

<details>
<summary><b>Build from source and contribute</b></summary>

<br>

### Build from Source

```bash
# Clone the repository
git clone https://github.com/yoggit/sarva-varadi.git
cd sarva-varadi

# Install dependencies
npm install

# Build all packages
npm run build
```

### Local Development

```bash
# Link packages
cd packages/core && npm link
cd ../playwright && npm link @sarva-varadi/core && npm link

# In your test project
npm link @sarva-varadi/core @sarva-varadi/playwright
```

## 🤝 Contributing

Contributions are welcome! Especially for adding new framework adapters.

### Adding a New Framework Adapter

1. Create `packages/<framework>/`
2. Implement adapter extending `BaseAdapter`
3. Convert framework events → `SarvaTestResult`
4. Add demo project
5. Update documentation

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

</details>

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on top of [Varadi](https://github.com/yoggit/varadi) - the beautiful Playwright reporter
- Inspired by [Allure](https://github.com/allure-framework) adapter architecture
- UI inherited from Varadi's modern design

## 📞 Support

- 🐛 [Report Issues](https://github.com/yoggit/sarva-varadi/issues)
- 💬 [Discussions](https://github.com/yoggit/sarva-varadi/discussions)
- 📖 [Examples](examples/)

---

Made with ✨ by [yoggit](https://github.com/yoggit)
