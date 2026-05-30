# CLI Converter

The built-in converter transforms test results from other formats (JUnit XML, TestNG XML, Cucumber JSON, Robot Framework XML, Allure results) into a Sarva-Varadi report — without adding any adapter code to your tests.

[[toc]]

---

## Quick start

```bash
# Install globally
npm install -g @sarva-varadi/core@latest

# Convert any test results
sarva-varadi generate --input test-results.xml --output sarva-report

# Open the report
open sarva-report/index.html
```

---

## Supported input formats

| Format | Source | Auto-detected? |
|--------|--------|---------------|
| **JUnit XML** | Maven Surefire, Gradle, Ant | ✅ Yes |
| **TestNG XML** | Standard TestNG `testng-results.xml` | ✅ Yes |
| **Cucumber JSON** | Cucumber JSON formatter output | ✅ Yes |
| **Robot Framework XML** | `output.xml` from RF 4, 5, 6, and 7 | ✅ Yes |
| **Allure results directory** | `allure-results/` from any Allure 2/3 adapter | ✅ Yes (directory input) |
| **Sarva-Varadi JSON** | Native format (no conversion needed) | ✅ Skips conversion |

Format is **auto-detected** from file structure — no `--format` flag needed in most cases.

::: tip Using Allure results
Point `--input` at the `allure-results/` **directory** (not a single file). The converter scans all `*-result.json` files automatically:

```bash
sarva-varadi generate --input allure-results/ --output sarva-report
```

This works with any framework that has an Allure adapter — Playwright, Selenium, RestAssured, Pytest, NUnit, and more — with **zero changes** to your existing test code.
:::

---

## CLI flags

| Flag | Short | Required | Description |
|------|-------|----------|-------------|
| `--input` | `-i` | ✅ | Input file path or directory |
| `--output` | `-o` | ✅ | Output directory for the report |
| `--title` | `-t` | ✗ | Report title shown in the header |

> History retention, max runs, notifications, and other options are configured via `sarva-varadi.properties` in your project root — see [CLI Converter configuration](/configuration#cli-converter-all-formats).

---

## Usage examples by format

### JUnit XML — Maven Surefire

```bash
# Single test suite file
sarva-varadi generate \
  --input target/surefire-reports/TEST-com.example.LoginTest.xml \
  --output sarva-report

# Whole surefire-reports directory (merges all XML files)
sarva-varadi generate \
  --input target/surefire-reports/ \
  --output sarva-report

# With custom report title
sarva-varadi generate \
  --input target/surefire-reports/ \
  --output sarva-report \
  --title "Login Service — Nightly"
```

### JUnit XML — Gradle

```bash
# Single test result file
sarva-varadi generate \
  --input build/test-results/test/TEST-com.example.LoginTest.xml \
  --output sarva-report

# Whole results directory
sarva-varadi generate \
  --input build/test-results/test/ \
  --output sarva-report \
  --title "My Gradle Suite"
```

### TestNG XML

```bash
# Standard TestNG output file
sarva-varadi generate \
  --input test-output/testng-results.xml \
  --output sarva-report

# With custom title
sarva-varadi generate \
  --input test-output/testng-results.xml \
  --output sarva-report \
  --title "API Regression Suite"

# Custom output location
sarva-varadi generate \
  -i test-output/testng-results.xml \
  -o reports/my-report \
  -t "TestNG Results"
```

### Cucumber JSON

```bash
# Single Cucumber JSON file
sarva-varadi generate \
  --input cucumber-report.json \
  --output sarva-report

# With custom title
sarva-varadi generate \
  --input cucumber-report.json \
  --output sarva-report \
  --title "BDD Regression"

# Cucumber JS — generate JSON first, then convert
cucumber-js --format json:cucumber-report.json
sarva-varadi generate --input cucumber-report.json --output sarva-report
```

### Robot Framework XML

```bash
# Standard output.xml from robot command
sarva-varadi generate \
  --input results/output.xml \
  --output sarva-report

# With custom title
sarva-varadi generate \
  --input results/output.xml \
  --output sarva-report \
  --title "Robot Framework Suite"

# Robot Framework — run tests then convert
robot --outputdir results tests/
sarva-varadi generate --input results/output.xml --output sarva-report
```

### Allure 2/3 results directory

```bash
# Point at the allure-results/ directory (not a single file)
sarva-varadi generate \
  --input allure-results/ \
  --output sarva-report

# With custom title
sarva-varadi generate \
  --input allure-results/ \
  --output sarva-report \
  --title "Allure Migration Report"

# Works with any Allure adapter — Playwright, Selenium, Pytest, NUnit, etc.
# Just point at whatever directory your Allure adapter writes to
sarva-varadi generate \
  --input target/allure-results/ \
  --output sarva-report \
  --title "Java API Suite"
```

### Sarva-Varadi JSON (pass-through)

```bash
# Already in native format — no conversion, just regenerate the report
sarva-varadi generate \
  --input sarva-varadi-results/test-results.json \
  --output sarva-report

# Useful for re-generating report after changing sarva-varadi.properties config
sarva-varadi generate \
  --input sarva-varadi-results/ \
  --output sarva-report \
  --title "Re-generated Report"
```

---

## CI/CD examples

### GitHub Actions — Maven project

```yaml
- name: Run tests
  run: mvn test

- name: Generate Sarva-Varadi report
  run: |
    npm install -g @sarva-varadi/core@latest
    sarva-varadi generate \
      --input target/surefire-reports/ \
      --output sarva-report \
      --title "My Maven Suite"

- name: Upload report
  uses: actions/upload-artifact@v4
  with:
    name: test-report
    path: sarva-report/
```

### GitHub Actions — Gradle project

```yaml
- name: Run tests
  run: ./gradlew test

- name: Generate report
  run: |
    npm install -g @sarva-varadi/core@latest
    sarva-varadi generate \
      --input build/test-results/test/ \
      --output sarva-report
```

### GitHub Actions — Robot Framework project

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

### GitHub Actions — Allure (Java / Maven)

Works with any Java framework that has an Allure adapter (`allure-testng`, `allure-junit5`, `allure-restassured`). The adapter writes `allure-results/` automatically — no Allure report generation step needed.

```yaml
- name: Run tests
  run: mvn test   # allure-testng/allure-junit5 adapter writes allure-results/ automatically

- name: Generate Sarva-Varadi report
  run: |
    npm install -g @sarva-varadi/core@latest
    sarva-varadi generate \
      --input allure-results/ \
      --output sarva-report \
      --title "Java Test Suite"

- name: Upload report
  uses: actions/upload-artifact@v4
  with:
    name: sarva-report
    path: sarva-report/
```

### GitHub Actions — Allure (Playwright / JavaScript)

```yaml
- name: Install dependencies
  run: npm ci

- name: Run Playwright tests
  run: npx playwright test
  # allure-playwright adapter writes allure-results/ automatically

- name: Generate Sarva-Varadi report
  run: |
    npm install -g @sarva-varadi/core@latest
    sarva-varadi generate \
      --input allure-results/ \
      --output sarva-report \
      --title "Playwright Suite"

- name: Upload report
  uses: actions/upload-artifact@v4
  with:
    name: sarva-report
    path: sarva-report/
```

### GitHub Actions — Allure (Pytest / Python)

```yaml
- name: Run tests
  run: pytest --alluredir=allure-results   # allure-pytest writes allure-results/

- name: Generate Sarva-Varadi report
  run: |
    npm install -g @sarva-varadi/core@latest
    sarva-varadi generate \
      --input allure-results/ \
      --output sarva-report \
      --title "Python Test Suite"

- name: Upload report
  uses: actions/upload-artifact@v4
  with:
    name: sarva-report
    path: sarva-report/
```

---

## Which approach gives you what?

There are two ways to get a sarva-varadi report:

- **Via native adapter** — add a sarva-varadi adapter to your test project. Captures the richest data because it runs inside your test execution.
- **Via converter** — sarva-varadi reads an output file your existing toolchain already produces. No code changes needed. Data richness depends on how much information the source format carries:
  - **Standard formats** (JUnit XML, TestNG XML) — designed for CI pass/fail only, carry minimal metadata
  - **Rich formats** (Robot Framework `output.xml`, Allure `allure-results/`) — designed to carry full test data, converter output is nearly as rich as a native adapter

| Feature | Via converter — Standard (JUnit / TestNG) | Via converter — Rich (Robot / Allure) | Via native adapter |
|---------|-----------|----------------|----------------|
| Pass/fail/skip counts | ✅ | ✅ | ✅ |
| Test duration | ✅ | ✅ | ✅ |
| Error messages | ✅ | ✅ | ✅ |
| Stack traces | ✅ | ✅ | ✅ |
| Nested step hierarchy | ✗ | ✅ Robot (keyword tree) / ✅ Allure (steps) | ✅ |
| Screenshots / attachments | ✗ | ✗ Robot / ✅ Allure | ✅ Full |
| Video / traces | ✗ | ✗ | ✅ Playwright only |
| HTTP request/response | ✗ | ✗ | ✅ RestAssured only |
| Flaky test detection | ✗ | ✅ Allure (`@Flaky`) / ✗ Robot | ✅ Full score (auto) |
| Severity labels | ✗ | ✅ Both (tags / labels) | ✅ |
| Issue / TMS links | ✗ | ✅ Both | ✅ |
| BDD Gherkin hierarchy | ✗ | ✗ | ✅ Cucumber only |
| Browser grouping | ✗ | ✗ | ✅ Playwright (automatic) |

::: tip Choosing the right approach
- Already using **Allure adapters**? → Use the Allure converter. Zero code changes, near-native quality.
- Already using **Robot Framework**? → Use the Robot converter. Full step tree and labels included.
- Starting fresh or want the **richest data**? → Use a native adapter.
- Just need **quick pass/fail** from an existing CI pipeline? → Use JUnit/TestNG converter.
:::
