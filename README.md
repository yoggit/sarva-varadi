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
  <strong>🎭 <a href="https://yoggit.github.io/sarva-varadi/playwright/index.html">Playwright Demo</a></strong> •
  <strong>🌐 <a href="https://yoggit.github.io/sarva-varadi/selenium/index.html">Selenium (TestNG) Demo</a></strong> •
  <strong>🌿 <a href="https://yoggit.github.io/sarva-varadi/selenium-cucumber/index.html">Selenium (Cucumber BDD) Demo</a></strong> •
  <strong>🔌 <a href="https://yoggit.github.io/sarva-varadi/rest-assured/index.html">RestAssured (TestNG) Demo</a></strong> •
  <strong>🧪 <a href="https://yoggit.github.io/sarva-varadi/rest-assured-junit/index.html">RestAssured (JUnit) Demo</a></strong> •
  <strong>🔀 <a href="https://yoggit.github.io/sarva-varadi/restassured-cucumber/index.html">RestAssured (Cucumber BDD) Demo</a></strong>
</p>

---

## 🎯 Supported Frameworks

<table>
<tr>
<td width="14%" align="center"><strong>🎭 Playwright</strong><br/>Web automation<br/>TypeScript/JavaScript</td>
<td width="14%" align="center"><strong>🌐 Selenium (TestNG)</strong><br/>WebDriver browser tests<br/>Java/TestNG</td>
<td width="14%" align="center"><strong>🌿 Selenium (Cucumber BDD)</strong><br/>BDD browser tests<br/>Java/Cucumber 7</td>
<td width="14%" align="center"><strong>🔌 RestAssured (TestNG)</strong><br/>API testing<br/>Java/TestNG</td>
<td width="14%" align="center"><strong>🧪 RestAssured (JUnit)</strong><br/>API testing<br/>Java/JUnit 5</td>
<td width="14%" align="center"><strong>🔀 RestAssured (Cucumber BDD)</strong><br/>BDD API testing<br/>Java/Cucumber 7</td>
<td width="16%" align="center"><strong>🚧 Cypress</strong><br/>Modern web testing<br/><em>(Coming soon)</em></td>
</tr>
</table>

---

## ✨ Features

<table>
<tr>
<td width="50%">

**📊 Reporting & Analytics**
- 🎨 Dark/light theme with sidebar navigation
- 📋 Overview: stat cards, pass rate donut, health pulse
- 🔍 Tests: full list with filter/search/sort, per-test history
- 📈 Trends: pass rate, failures, flakiness, duration over time
- ⏱️ Timeline: run cadence and execution Gantt chart
- 🔥 Intelligent flaky test detection with flaky score
- 🎯 Top failing & top flaky leaderboards

</td>
<td width="50%">

**⚡ Developer Experience**
- ⚡ Zero config — works out of the box
- 📁 File-based — no database needed
- 🔄 Framework agnostic (5 frameworks supported)
- 📎 Rich attachments: screenshots, videos, traces
- 🖨️ PDF print export (A4, with executive summary)
- 📥 PNG chart download & CSV test export
- 📧 Slack / Teams / Email notifications

</td>
</tr>
</table>

---

## 📸 Live Demos

The best way to explore Sarva-Varadi is to open one of the live demos — each has 25 historical runs pre-loaded so every chart has real data to show.

| Framework | Demo |
|-----------|------|
| 🎭 Playwright | [yoggit.github.io/sarva-varadi/playwright/](https://yoggit.github.io/sarva-varadi/playwright/index.html) |
| 🌐 Selenium (TestNG) | [yoggit.github.io/sarva-varadi/selenium/](https://yoggit.github.io/sarva-varadi/selenium/index.html) |
| 🔌 RestAssured (TestNG) | [yoggit.github.io/sarva-varadi/rest-assured/](https://yoggit.github.io/sarva-varadi/rest-assured/index.html) |
| 🧪 RestAssured (JUnit 5) | [yoggit.github.io/sarva-varadi/rest-assured-junit/](https://yoggit.github.io/sarva-varadi/rest-assured-junit/index.html) |

### What's in the report

Each report is a single-page app with four sections reachable from the sidebar:

**Overview** — Pass rate donut, stat cards (total / passed / failed / flaky / skipped), Health Pulse trend indicator, run history table, top failing tests, top flaky tests, and a Needs Attention strip when things regress.

**Tests** — Full test list with filter by status, free-text search, and sort. Click any test to open a drawer showing the full step tree, error message, stack trace, attachments (screenshots / videos / traces), and a per-test history chart across the last 25 runs.

**Trends** — Six interactive ECharts charts across runs: pass rate over time, failures & flakiness, test count, run duration, top failing tests bar chart, and top flaky tests bar chart. All charts share a run-count filter (Last 10 / 20 / 50 / All).

**Timeline** — Run Cadence bar chart showing how often and when runs happen, plus an Execution Gantt showing every test's start time and duration for the current run.

**Export** — Every chart has a PNG download button. The Tests page has a CSV export. Print the full report to a structured PDF (A4 landscape, with an executive summary and page numbers) via the print button.

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

### Compatibility

| Tool | Minimum Version |
|------|----------------|
| Java | 11+ |
| Maven | 3.6+ |
| Node.js | 16+ (required for all Java integrations — used to generate the HTML report) |
| RestAssured | 5.x+ |
| Selenium | 4.x+ (uses `EventFiringDecorator` — not available in Selenium 3) |
| TestNG | 7.x+ |
| JUnit Jupiter | 5.8+ |
| Playwright | 1.20+ |

### For Playwright

```bash
npm install --save-dev @sarva-varadi/core @sarva-varadi/playwright
```

### For RestAssured + TestNG

Add to your `pom.xml` — see the [RestAssured (TestNG) + Maven Integration Guide](#restassured-maven-guide) below.

### For RestAssured + JUnit 5

Add to your `pom.xml` — see the [RestAssured (JUnit 5) + Maven Integration Guide](#restassured-junit-maven-guide) below.

### For Selenium (WebDriver + TestNG)

Add to your `pom.xml` — see the [Selenium + Maven Integration Guide](#selenium-maven-guide) below.

---

## 📋 What Gets Captured

Understanding what is automatic vs what requires an extra setup step saves a lot of confusion:

| | Automatic (Steps 1–3 or 1–2) | Requires extra step |
|---|---|---|
| **RestAssured (TestNG)** | Test pass/fail/skip, duration, error & stack trace, flaky/retry detection | HTTP request/response details shown as test steps (Step 4) |
| **RestAssured (JUnit 5)** | Test pass/fail/skip, duration, error & stack trace, flaky/retry detection, **HTTP steps auto-captured** | Nothing extra needed — the extension auto-registers the request capture filter |
| **Selenium** | Test pass/fail/skip, duration, error & stack trace, flaky/retry detection | Browser actions (clicks, navigation, inputs) + screenshots shown as test steps (Step 4) |
| **Playwright** | Everything — steps, screenshots, video, trace captured natively | Nothing extra needed |

> **RestAssured + JUnit 5** ([guide](#restassured-junit-maven-guide)): Steps 1–3 (dependency → Surefire plugin → `@ExtendWith`) give you a fully detailed report including HTTP steps — no extra wiring needed.
>
> **RestAssured + TestNG** ([guide](#restassured-maven-guide)): Steps 1–3 set up the dependency and listener; Step 4 adds the request capture filter for HTTP step detail.
>
> **Selenium** ([guide](#selenium-maven-guide)): Steps 1–3 set up the dependency and listener; Step 4 wraps WebDriver to capture browser actions and screenshots.

---

## 🚀 Quick Start

<details>
<summary><b>🎭 Playwright Configuration</b></summary>

### Installation

```bash
npm install --save-dev @sarva-varadi/core @sarva-varadi/playwright
```

### Setup

In your existing `playwright.config.ts`, add `@sarva-varadi/playwright` to the `reporter` array — keep any existing reporters you already have:

```typescript
reporter: [
  ['html'],                        // keep your existing reporters
  ['allure-playwright'],           // keep your existing reporters
  ['@sarva-varadi/playwright', {
    outputFolder: 'sarva-report',
    title: 'My Test Report',
    maskSensitiveData: false,      // set true to mask passwords/tokens in step titles
    history: {
      enabled: true,
      maxRuns: 30,
      retentionDays: 90,
    },
    trends: {
      enabled: true,
    },
  }],
],
```

> 💡 `@sarva-varadi/playwright` works alongside other reporters such as `html`, `allure-playwright`, or `playwright-html-reporter` — all reporters in the array run together.

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

<a id="restassured-maven-guide"></a>
<details>
<summary>🔌 RestAssured (TestNG) + Maven Integration Guide</summary>

<br>

> ✅ **Seamless setup** — No cloning, no hardcoded paths. Just Maven + Node.js.
>
> **Prerequisites:** Java 11+, Maven 3.6+, [Node.js](https://nodejs.org)

---

### Step 1 — Add repository & dependency to `pom.xml`

Pulls the sarva-varadi library from JitPack so Maven can resolve it at compile time.

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
        <version>v2.1.1</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

### Step 2 — Add report generation plugin to `pom.xml`

Automatically generates the HTML report after every `mvn test` run — no manual step needed.

> **Node.js required:** This plugin runs `npx @sarva-varadi/core generate` after tests to produce the HTML report. Node.js must be installed on the machine running `mvn test`. [Download Node.js](https://nodejs.org)

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

Hooks into TestNG so every test start, pass, fail, and skip is recorded to the results file.

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

Captures HTTP request/response details as test steps — without this, tests appear in the report with no detail inside them. Add this to your `@BeforeClass` or `@BeforeSuite` setup method — typically in your base test class (e.g. `BaseTest.java`).

| Without Step 4 | With Step 4 |
|---|---|
| Test listed as pass/fail, no detail | Each test shows full HTTP request URL, method, headers, body, response status & body |

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

<a id="restassured-junit-maven-guide"></a>
<details>
<summary>🧪 RestAssured (JUnit 5) + Maven Integration Guide</summary>

<br>

> ✅ **Easiest setup of all Java integrations** — No `testng.xml`, no manual filter registration. Just annotate your base test and run.
>
> **Prerequisites:** Java 11+, Maven 3.6+, [Node.js](https://nodejs.org)

---

### Step 1 — Add repository & dependency to `pom.xml`

Pulls the sarva-varadi library from JitPack so Maven can resolve it at compile time.

```xml
<repositories>
    <repository>
        <id>jitpack.io</id>
        <url>https://jitpack.io</url>
    </repository>
</repositories>

<dependencies>
    <!-- Your existing RestAssured + JUnit 5 dependencies -->
    <dependency>
        <groupId>io.rest-assured</groupId>
        <artifactId>rest-assured</artifactId>
        <version>5.3.2</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <version>5.10.0</version>
        <scope>test</scope>
    </dependency>

    <!-- Sarva-Varadi: JUnit 5 extension + RestAssured request capture -->
    <dependency>
        <groupId>com.github.yoggit.sarva-varadi</groupId>
        <artifactId>sarva-varadi-restassured-junit</artifactId>
        <version>v2.1.1</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

### Step 2 — Add Surefire plugin + report generation to `pom.xml`

Runs tests with JUnit 5 support, enables flaky test retry, and auto-generates the HTML report after every `mvn test`.

> **Node.js required:** This plugin runs `npx @sarva-varadi/core generate` after tests to produce the HTML report. Node.js must be installed on the machine running `mvn test`. [Download Node.js](https://nodejs.org)

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <version>3.2.5</version>
            <configuration>
                <!-- Continue build so report always generates even on failures -->
                <testFailureIgnore>true</testFailureIgnore>
                <!-- Retry failing tests once — enables flaky test detection -->
                <rerunFailingTestsCount>1</rerunFailingTestsCount>
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

### Step 3 — Add `@ExtendWith` to your base test class

This is the only wiring needed. The extension automatically:
- Records every test start, pass, fail, skip, and retry
- Registers the HTTP request/response capture filter (no `RestAssured.filters()` call needed)
- Detects flaky tests when `rerunFailingTestsCount` is set in Surefire
- Writes results to `sarva-varadi-results/test-results.json` on JVM exit

```java
import io.github.yoggit.sarvavaradi.SarvaVaradiJUnit5Extension;
import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(SarvaVaradiJUnit5Extension.class)
public class BaseTest {

    @BeforeAll
    static void setup() {
        RestAssured.baseURI = "https://api.example.com";
        // No RestAssured.filters() call needed — captured automatically
    }
}
```

All test classes extend `BaseTest`:

```java
public class UserApiTest extends BaseTest {

    @Test
    void getUserById() {
        given()
            .when().get("/users/1")
            .then().statusCode(200);
    }
}
```

---

### Step 4 — Run tests

```bash
mvn test
```

That's it. This will:
1. ✅ Run all JUnit 5 tests
2. ✅ Auto-capture HTTP request/response details per test
3. ✅ Collect results → `sarva-varadi-results/test-results.json`
4. ✅ Auto-generate the HTML report → `sarva-report/index.html`

```bash
# Open the report
open sarva-report/index.html       # macOS
start sarva-report/index.html      # Windows
xdg-open sarva-report/index.html   # Linux
```

### Flaky Test Detection

The extension detects flaky tests automatically when `rerunFailingTestsCount` is set in Surefire. A test is marked **flaky** when it fails on the first attempt but passes on retry — no extra configuration needed.

| Without `rerunFailingTestsCount` | With `rerunFailingTestsCount=1` |
|---|---|
| Intermittently failing test marked as `failed` | Intermittently failing test marked as `flaky` with retry count |

📂 **Demo project:** [`demo-restassured-junit/`](demo-restassured-junit/)

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

Pulls the sarva-varadi library from JitPack so Maven can resolve it at compile time.

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
        <version>v2.1.1</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

### Step 2 — Add report generation plugin to `pom.xml`

Automatically generates the HTML report after every `mvn test` run — no manual step needed.

> **Node.js required:** This plugin runs `npx @sarva-varadi/core generate` after tests to produce the HTML report. Node.js must be installed on the machine running `mvn test`. [Download Node.js](https://nodejs.org)

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

Hooks into TestNG so every test start, pass, fail, and skip is recorded to the results file.

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

Intercepts browser actions (clicks, navigation, form inputs) as test steps — without this, tests appear in the report with no action detail inside them. Add this to whichever class creates your `WebDriver` — typically a base test class (e.g. `BaseTest.java`) or a centralized driver factory (e.g. `DriverManager.java`, `BrowserManager.java`).

| Without Step 4 | With Step 4 |
|---|---|
| Test listed as pass/fail, no detail | Each test shows browser actions: navigations, clicks, element finds, inputs, and failure screenshots |

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

## 📊 Report Structure

Each report is a single `index.html` — no server required, open it directly in a browser.

### Sidebar tabs

| Tab | What's inside |
|-----|---------------|
| **Overview** | Pass rate donut · stat cards · Health Pulse trend · run history table · top failing & top flaky · Needs Attention strip |
| **Tests** | Filterable test list · free-text search · sort by duration/status · test detail drawer with steps, attachments, and per-test history chart |
| **Trends** | Pass rate trend · failures & flakiness · test count · run duration · top failing bar chart · top flaky bar chart — all with run-count filter |
| **Timeline** | Run Cadence chart (when and how often runs happen) · Execution Gantt (per-test start time and duration) |

### Export options

| Format | Where |
|--------|-------|
| **PDF** | Print button — A4 landscape, executive summary, page numbers |
| **PNG** | Download button on every chart (12 total) |
| **CSV** | Tests page toolbar · Overview Top Failures & Top Flaky tables |

### Standalone trends page

`trends.html` is also generated alongside `index.html` — same Trends content, useful for direct linking in CI notifications or dashboards.

---

## ⚙️ Configuration Options

### Node.js / Playwright

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
| `history.maxRuns` | number | `30` | Keep last N runs (no hard limit, can be set to 100+ for extensive history) |
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

### Java (RestAssured / Selenium) — `sarva-varadi.properties`

<details>
<summary><b>View all configuration properties</b></summary>

<br>

Drop a `sarva-varadi.properties` file in your project root to configure behaviour. System properties (`-D` flags) always override file values.

```properties
# ── Output ──────────────────────────────────────────────────────────────
sarva.outputDir=sarva-varadi-results          # [RestAssured TestNG, RestAssured JUnit 5, Selenium] where test-results.json is written

# ── Sensitive data masking ───────────────────────────────────────────────
sarva.maskSensitiveData=false                 # [RestAssured TestNG, RestAssured JUnit 5, Selenium] mask passwords/tokens/API keys with ***
                                              # [Playwright] set maskSensitiveData: true in playwright.config.ts

# ── Screenshots ─────────────────────────────────────────────────────────
sarva.screenshot=on-failure                   # [Selenium] always | on-failure | never
sarva.screenshotDir=sarva-varadi-results/screenshots  # [Selenium] where screenshot files are saved
                                              # [Playwright] use: { screenshot: 'on' | 'only-on-failure' | 'off' } in playwright.config.ts

# ── Video recording ─────────────────────────────────────────────────────
                                              # [Playwright] use: { video: 'on' | 'retain-on-failure' | 'on-first-retry' | 'off' } in playwright.config.ts

# ── Trace recording ─────────────────────────────────────────────────────
                                              # [Playwright] use: { trace: 'on' | 'retain-on-failure' | 'on-first-retry' | 'off' } in playwright.config.ts

# ── Flaky test detection & retry ─────────────────────────────────────────
sarva.maxRetryCount=2                         # [RestAssured TestNG, Selenium] retries before marking a test failed
                                              # Requires @Test(retryAnalyzer = SarvaVaradiRetryAnalyzer.class) on the method
                                              # [RestAssured JUnit 5] use <rerunFailingTestsCount>1</rerunFailingTestsCount> in surefire instead
                                              # [Playwright] set retries: 2 in playwright.config.ts

# ── Report: display ─────────────────────────────────────────────────────
sarva.report.title=My Test Suite              # [All tools] title shown in the HTML report header
sarva.report.frameworkLabel=Selenium-TestNG   # [All tools] label shown below "Test Report" heading and in PDF/page title
                                              # e.g. "Selenium-TestNG", "RestAssured-Cucumber BDD", "Playwright"
sarva.report.showStackTrace=true              # [All tools] show full stack traces in the report
sarva.report.embedAttachments=true            # [All tools] embed screenshots/videos inline in the report

# ── Report: history & trends ────────────────────────────────────────────
sarva.report.history=true                     # [All tools] enable historical run tracking
sarva.report.trends=true                      # [All tools] enable trend analysis across runs
sarva.report.maxRuns=30                       # [All tools] max past runs to keep (oldest deleted first)
sarva.report.retentionDays=90                 # [All tools] max age in days (whichever limit hits first wins)
```

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

1. **`maxRuns`** — keeps the last N runs. In normal sequential use, exactly **1 oldest run** is deleted each time a new run is added. (default: 30)
2. **`retentionDays`** — removes runs older than N days. Deletes **all** runs past the age threshold in one pass — so if you pause testing for weeks and multiple runs age out, they are all removed when the next run triggers cleanup. (default: 90)

<details>
<summary><b>Corner case examples (maxRuns=30, retentionDays=90)</b></summary>

<br>

**Case 1 — Heavy CI usage (maxRuns triggers first)**

You run tests 3× a day for 11 days = 33 runs, all less than 11 days old.

| Limit hit | What happens |
|---|---|
| Run #31 arrives | Run #1 deleted — it's only 10 days old but `maxRuns` triggered first |

---

**Case 2 — Paused testing (retentionDays deletes multiple at once)**

You run tests once a week, then pause for 3 months. When you resume, 13 old runs are now past 90 days.

| Limit hit | What happens |
|---|---|
| Next run arrives | All 13 stale runs deleted in one pass — `retentionDays` does not wait to remove them one at a time |

This is intentional — stale runs past the age threshold are all cleaned up immediately, not incrementally.

---

**Case 3 — The tricky one: burst after slow start**

36 old weekly runs (100–90 days old), then 100 new runs in 2 weeks. Total = 136 runs.

| Limit hit | What happens |
|---|---|
| `maxRuns=30` | Runs beyond position #30 are deleted — the old weekly runs are purged |
| `retentionDays=90` | Any run older than 90 days also deleted independently |

With the old AND logic, runs within 90 days would have survived even if beyond position #30 — `maxRuns` would have been completely ignored.

---

**Case 4 — Both limits hit simultaneously**

Run #31 arrives AND it's from 95 days ago (slow project, 31 runs over 3+ months).

Both limits exceeded at the same time — run is deleted regardless.

---

**Case 5 — Exactly at the boundary**

You have exactly 20 runs, all exactly 90 days old today. Run #21 comes in.

Both `maxRuns` and `retentionDays` trigger simultaneously — the oldest run is deleted.

</details>

</details>

---

## 🔗 Issue & Test Management Links

Link individual test results to Jira, Xray, Zephyr, TestRail, GitHub Issues, or any other tracker. When configured, clickable badges appear in the test detail drawer.

**1. Configure URL patterns in `sarva-varadi.properties`:**

```properties
sarva.links.issue=https://your-company.atlassian.net/browse/{id}
sarva.links.tms=https://your-company.atlassian.net/browse/{id}
```

**2. Tag tests using your framework's native syntax:**

| Framework | Issue tag | TMS tag |
|---|---|---|
| Cucumber | `@issue:PROJ-123` | `@tms:PROJ-456` |
| JUnit 5 | `@Tag("issue:PROJ-123")` | `@Tag("tms:PROJ-456")` |
| TestNG | `groups = {"issue:PROJ-123"}` | `groups = {"tms:PROJ-456"}` |
| Playwright | `'my test @issue:PROJ-123'` (in title) | `'my test @tms:PROJ-456'` (in title) |

**3. Report shows clickable badges:**
> 🐛 PROJ-123 &nbsp;&nbsp; 🧪 PROJ-456

📖 **[Full setup guide with examples for all frameworks →  ISSUE_LINKS.md](ISSUE_LINKS.md)**

---

## 🏷️ Severity & Labels

Label individual tests with **severity**, **owner**, and **feature** to make failures actionable at a glance.

**Severity describes the risk impact if a test fails — independent of pass/fail status:**

| Level | Meaning |
|---|---|
| `critical` | Core flow broken — release blocker |
| `high` | Major feature impact — fix before release |
| `medium` | Noticeable failure — workaround exists |
| `low` | Edge case or cosmetic — log a ticket |
| `trivial` | Almost no user impact |

**Tag tests using your framework's native syntax:**

| Framework | Example |
|---|---|
| Cucumber | `@severity:critical @owner:payments-team` |
| JUnit 5 | `@Tag("severity:critical")` `@Tag("owner:payments-team")` |
| TestNG | `groups = {"severity:critical", "owner:payments-team"}` |
| Playwright | `'my test @severity:critical @owner:payments-team'` (in title) |

Severity appears as a coloured badge in the test list and detail drawer. Owner/feature appear as chips alongside issue/TMS link badges.

📖 **[Full setup guide with examples for all frameworks → LABELS.md](LABELS.md)**

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
| Multi-framework | ✅ 30+ | ✅ Many | ✅ 4 (growing) |
| Modern UI | ⚠️ Dated | ⚠️ Complex | ✅ Sidebar SPA, dark/light |
| Zero config | ❌ CLI needed | ❌ Server setup | ✅ Yes |
| File-based | ✅ Yes | ❌ DB required | ✅ Yes |
| Historical trends | ✅ Basic | ✅ Advanced | ✅ File-based, 6 charts |
| Flaky detection | ⚠️ Manual | ✅ ML-based | ✅ Score-based, per-test history |
| PDF / PNG / CSV export | ⚠️ PDF only | ❌ No | ✅ All three |
| Notifications | ❌ No | ✅ Yes | ✅ Slack/Teams/Email |
| CI/CD friendly | ✅ Yes | ⚠️ Complex | ✅ Yes |
| Setup time | 15 min | 1+ hour | < 2 min |

---

## 🏛️ Monorepo Structure

```
packages/
├── core/                       # @sarva-varadi/core — report engine + CLI
│   ├── src/
│   │   ├── types/              # Common interfaces (SarvaTestResult, RunHistory, …)
│   │   ├── adapters/           # Base adapter class
│   │   ├── converters/         # Format converters (JUnit, TestNG, Cucumber)
│   │   ├── generators/
│   │   │   ├── shell/          # Sidebar shell, topbar, CSS, print styles
│   │   │   ├── shared/         # SarvaStore state, EventBus, utilities
│   │   │   └── micro-apps/
│   │   │       ├── overview/   # Overview tab (stat cards, donut, health pulse, …)
│   │   │       ├── test-list/  # Tests tab (list, filter, search, drawer)
│   │   │       ├── test-detail/# Per-test history drawer chart
│   │   │       ├── trends/     # Trends tab (6 ECharts charts)
│   │   │       └── timeline/   # Timeline tab (run cadence + Gantt)
│   │   ├── history-manager.ts  # File-based run history & flaky score
│   │   └── cli.ts              # CLI entry point
│
├── playwright/                 # @sarva-varadi/playwright
│   └── src/index.ts            # Playwright reporter adapter
│
└── rest-assured-junit/         # @sarva-varadi/rest-assured-junit (JitPack)
    └── junit5-extension.ts     # JUnit 5 extension + RestAssured filter

java/
├── sarva-varadi-restassured/           # JitPack: sarva-varadi-restassured
│   └── SarvaVaradiListener             # TestNG listener + RestAssured filter
│
└── sarva-varadi-restassured-junit/     # JitPack: sarva-varadi-restassured-junit
    └── SarvaVaradiJUnit5Extension      # JUnit 5 extension + RestAssured filter
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

## 🔧 Troubleshooting

<details>
<summary><b>Report not generated — Node.js not found / npx command fails</b></summary>

The `exec-maven-plugin` runs `npx @sarva-varadi/core generate` after tests to produce the HTML report. This requires Node.js to be installed on the machine running `mvn test`.

Install Node.js from [nodejs.org](https://nodejs.org), then verify with:
```bash
npx --version
```

</details>

<details>
<summary><b>Tests appear in the report but with no steps or detail inside them</b></summary>

Step 4 (or Step 3 for JUnit 5) is missing or not wired correctly:

- **RestAssured + TestNG:** `RestAssured.filters(new RestAssuredRequestCapture())` must be called in your `@BeforeClass` / `@BeforeSuite` setup method (e.g. `BaseTest.java`).
- **RestAssured + JUnit 5:** Ensure `@ExtendWith(SarvaVaradiJUnit5Extension.class)` is on your base test class. The extension auto-registers the filter — no `RestAssured.filters()` call is needed.
- **Selenium:** Your `WebDriver` must be wrapped with `EventFiringDecorator` + `SarvaVaradiWebDriverListener` before being used in tests. See Step 4 in the [Selenium + Maven Integration Guide](#selenium-maven-guide).

</details>

<details>
<summary><b>Cannot resolve io.github.yoggit.sarvavaradi.* — import not found in IDE</b></summary>

This happens when the dependency has `<scope>test</scope>` but the class using it is in `src/main/java`. Test-scoped dependencies are invisible to main source files.

Fix: remove `<scope>test</scope>` from the sarva-varadi dependency in `pom.xml` so it defaults to compile scope.

</details>

<details>
<summary><b>Report not generated when some tests fail</b></summary>

By default, Maven stops the build on test failure before the report generation plugin runs. Set `testFailureIgnore` to `true` in the `maven-surefire-plugin` configuration:

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.0.0</version>
    <configuration>
        <testFailureIgnore>true</testFailureIgnore>
    </configuration>
</plugin>
```

</details>

---

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
