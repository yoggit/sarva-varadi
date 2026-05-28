# Quick Start

Get started in 2 minutes. Choose your framework:

::: info Prerequisites (Java adapters)
Java 11+, Maven 3.6+, [Node.js](https://nodejs.org) (required to generate the HTML report)
:::

---

## 🎭 Playwright

<details>
<summary>Show setup steps</summary>

### Installation

```bash
npm install --save-dev @sarva-varadi/core@latest @sarva-varadi/playwright@latest
```

### Configure `playwright.config.ts`

Add `@sarva-varadi/playwright` to the `reporter` array — keep any existing reporters you already have:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['html'],                         // keep your existing reporters
    ['allure-playwright'],            // keep your existing reporters
    ['@sarva-varadi/playwright', {
      outputFolder: 'sarva-report',
      title: 'My Test Report',
      maskSensitiveData: false,       // set true to mask passwords/tokens
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
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
});
```

> `@sarva-varadi/playwright` works alongside other reporters — all reporters in the array run together.

### What's captured automatically

- ✅ Screenshots, video, and trace on failure
- ✅ Test steps with timing
- ✅ Multi-browser grouping (chromium, firefox, webkit)
- ✅ Flaky test detection with retry tracking
- ✅ Historical trends — no extra wiring needed

### Run & open report

```bash
npx playwright test

open sarva-report/index.html       # macOS
start sarva-report/index.html      # Windows
xdg-open sarva-report/index.html   # Linux
```

</details>

---

## 🌐 RestAssured (TestNG)

<details>
<summary>Show setup steps</summary>

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
        <version>v2.1.1</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### Step 2 — Add report generation plugin to `pom.xml`

This auto-generates the HTML report after every `mvn test` — no manual step needed.

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

### Step 4 — Add request capture filter to your test setup

Without this, tests appear in the report with no HTTP detail. With it, each test shows the full request URL, method, headers, body, response status and body.

Add to your `@BeforeClass` or `@BeforeSuite` — typically in your base test class:

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

### Step 5 — Run & open report

```bash
mvn test
# ✅ Runs tests → collects results → auto-generates sarva-report/index.html

open sarva-report/index.html       # macOS
start sarva-report/index.html      # Windows
xdg-open sarva-report/index.html   # Linux
```

</details>

---

## 🧪 RestAssured (JUnit 5)

<details>
<summary>Show setup steps</summary>

::: tip Easiest Java setup
No `testng.xml`, no manual filter registration. Just annotate your base test and run — HTTP request/response is captured automatically.
:::

### Step 1 — Add repository & dependency to `pom.xml`

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

### Step 2 — Add Surefire plugin + report generation to `pom.xml`

Enables JUnit 5, flaky test retry, and auto-generates the HTML report after every `mvn test`:

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <version>3.2.5</version>
            <configuration>
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

### Step 3 — Add `@ExtendWith` to your base test class

This is the only wiring needed. The extension automatically:
- Records every test start, pass, fail, skip, and retry
- Registers the HTTP request/response capture filter — **no `RestAssured.filters()` call needed**
- Detects flaky tests when `rerunFailingTestsCount` is set in Surefire

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

### Step 4 — Run & open report

```bash
mvn test
# ✅ Runs tests → auto-captures HTTP steps → auto-generates sarva-report/index.html

open sarva-report/index.html       # macOS
start sarva-report/index.html      # Windows
xdg-open sarva-report/index.html   # Linux
```

</details>

---

## 🔬 Selenium (TestNG)

<details>
<summary>Show setup steps</summary>

### Step 1 — Add repository & dependency to `pom.xml`

```xml
<repositories>
    <repository>
        <id>jitpack.io</id>
        <url>https://jitpack.io</url>
    </repository>
</repositories>

<dependencies>
    <!-- Your existing Selenium + TestNG dependencies -->
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

### Step 4 — Wrap your WebDriver in test setup

Without this, tests appear in the report with no browser action detail. With it, each test shows navigations, clicks, element finds, inputs, and failure screenshots.

Pass the **raw/unwrapped** driver to both the listener and `.decorate()` — always use a separate `baseDriver` variable:

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
        // your test code
    }

    @AfterMethod
    public void teardown() {
        if (driver != null) driver.quit();
    }
}
```

::: tip Using a centralized DriverManager / BrowserManager?
Add the wrapping right after creating the driver, before returning it:
```java
WebDriver baseDriver = new ChromeDriver(options);
SarvaVaradiWebDriverListener listener = new SarvaVaradiWebDriverListener(baseDriver);
driver = new EventFiringDecorator<>(listener).decorate(baseDriver);
return driver;
```
Do **not** reuse the same field variable on both sides — always use a separate `baseDriver` reference.
:::

### Step 5 — Run & open report

```bash
mvn test
# ✅ Runs tests → captures browser actions + screenshots → auto-generates sarva-report/index.html

open sarva-report/index.html       # macOS
start sarva-report/index.html      # Windows
xdg-open sarva-report/index.html   # Linux
```

</details>

---

## 🥒 Cucumber BDD (Selenium or RestAssured)

<details>
<summary>Show setup steps</summary>

::: info One plugin, any underlying tool
`sarva-varadi-cucumber` works with Selenium, RestAssured, or any Java-based Cucumber setup. Add the matching tool adapter alongside it to get granular sub-steps.
:::

### Step 1 — Add repository & dependencies to `pom.xml`

```xml
<repositories>
  <repository>
    <id>jitpack.io</id>
    <url>https://jitpack.io</url>
  </repository>
</repositories>

<dependencies>
  <!-- Cucumber BDD adapter -->
  <dependency>
    <groupId>com.github.yoggit.sarva-varadi</groupId>
    <artifactId>sarva-varadi-cucumber</artifactId>
    <version>2.1.1</version>
    <scope>test</scope>
  </dependency>

  <!-- For Selenium sub-steps (navigate, click, find element): -->
  <dependency>
    <groupId>com.github.yoggit.sarva-varadi</groupId>
    <artifactId>sarva-varadi-selenium</artifactId>
    <version>2.1.1</version>
    <scope>test</scope>
  </dependency>

  <!-- For RestAssured HTTP sub-steps: -->
  <!-- <dependency>
    <groupId>com.github.yoggit.sarva-varadi</groupId>
    <artifactId>sarva-varadi-restassured</artifactId>
    <version>2.1.1</version>
    <scope>test</scope>
  </dependency> -->
</dependencies>
```

Add only the adapter matching your tool — Selenium or RestAssured, not both (unless your project uses both).

### Step 2 — Register the plugin

**Option A** — `src/test/resources/junit-platform.properties`:

```properties
cucumber.plugin=io.github.yoggit.sarvavaradi.SarvaVaradiCucumberPlugin
cucumber.glue=com.example.cucumber
cucumber.features=src/test/resources/features
```

**Option B** — via `@ConfigurationParameter` on your runner class:

```java
@Suite
@IncludeEngines("cucumber")
@ConfigurationParameter(key = PLUGIN_PROPERTY_NAME,
    value = "io.github.yoggit.sarvavaradi.SarvaVaradiCucumberPlugin")
@ConfigurationParameter(key = GLUE_PROPERTY_NAME,   value = "com.example.cucumber")
@ConfigurationParameter(key = FEATURES_PROPERTY_NAME, value = "src/test/resources/features")
public class CucumberTestRunner {}
```

### Step 3 — Add report generation plugin to `pom.xml`

```xml
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
        <executable>npx</executable>
        <arguments>
          <argument>@sarva-varadi/core</argument>
          <argument>generate</argument>
          <argument>--input</argument>
          <argument>sarva-varadi-results/test-results.json</argument>
          <argument>--output</argument>
          <argument>sarva-report</argument>
        </arguments>
      </configuration>
    </execution>
  </executions>
</plugin>
```

### Step 4 — Set framework label (optional)

In `src/test/resources/sarva-varadi.properties`:

```properties
sarva.report.frameworkLabel=Selenium-Cucumber BDD
# or: RestAssured-Cucumber BDD
```

### Step 5 — Run & open report

```bash
mvn test
# ✅ Captures Feature → Scenario → Step hierarchy → auto-generates sarva-report/index.html

open sarva-report/index.html       # macOS
start sarva-report/index.html      # Windows
xdg-open sarva-report/index.html   # Linux
```

The report shows the full **Feature → Scenario → Step** hierarchy. If the tool adapter is also on the classpath, each BDD step is enriched with granular sub-steps (browser actions or HTTP request/response).

</details>

---

## 🤖 Robot Framework

<details>
<summary>Show setup steps</summary>

No adapter code needed — the CLI converter reads Robot Framework's standard `output.xml` directly.

### Step 1 — Install the CLI

```bash
npm install -g @sarva-varadi/core@latest
```

### Step 2 — Run your Robot Framework tests

```bash
robot --outputdir results tests/
```

### Step 3 — Generate the report

```bash
sarva-varadi generate \
  --input results/output.xml \
  --output sarva-report \
  --title "Robot Suite"
```

### Step 4 — Open the report

```bash
open sarva-report/index.html       # macOS
start sarva-report/index.html      # Windows
xdg-open sarva-report/index.html   # Linux
```

### What's captured automatically

- ✅ Full nested keyword hierarchy (sub-keywords at any depth)
- ✅ Per-keyword timing and pass/fail status
- ✅ Tags mapped to severity/TMS labels (`severity:critical`, `tms:JIRA-123`)
- ✅ Suite breadcrumb (Suite → Sub-suite → Test)
- ✅ Error messages with failure path highlighted in detail drawer
- ✅ RF 4, 5, 6, and 7 supported

### CI/CD example (GitHub Actions)

```yaml
- name: Run Robot Framework tests
  run: robot --outputdir results tests/

- name: Generate Sarva-Varadi report
  run: |
    npm install -g @sarva-varadi/core@latest
    sarva-varadi generate \
      --input results/output.xml \
      --output sarva-report \
      --title "Robot Suite"

- name: Upload report
  uses: actions/upload-artifact@v4
  with:
    name: robot-report
    path: sarva-report/
```

</details>

---

## View your report

After running tests the report is at `sarva-report/index.html` — a self-contained HTML file. Share it, attach to a CI artifact, or host on GitHub Pages.

## Tips

1. **First run** creates the history baseline — trends appear from run 2 onwards
2. **Flaky detection** requires retries: `retries: 2` in Playwright config, or `rerunFailingTestsCount` in Surefire for Java
3. **Reports are portable** — just copy the folder, no server needed
4. **CI/CD** — fetch the previous `history/` before running tests so history accumulates across runs

## Next steps

- [Configuration reference →](./configuration)
- [What's inside the report →](./report-guide)
- [Set up notifications →](./notifications)
- [Troubleshooting →](./troubleshooting)
