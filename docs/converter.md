# CLI Converter

The built-in converter transforms test results from other formats (JUnit XML, TestNG XML, Cucumber JSON, Robot Framework XML) into a Sarva-Varadi report — without adding any adapter code to your tests.

[[toc]]

---

## Quick start

```bash
# Install globally
npm install -g @sarva-varadi/core

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
| **Sarva-Varadi JSON** | Native format (no conversion needed) | ✅ Skips conversion |

Format is **auto-detected** from file structure — no `--format` flag needed in most cases.

---

## Usage

### Single file

```bash
sarva-varadi generate --input target/surefire-reports/TEST-Suite.xml --output sarva-report
```

### Directory of XML files

```bash
sarva-varadi generate --input target/surefire-reports/ --output sarva-report
```

The converter merges all XML files in the directory into one report.

### With custom title

```bash
sarva-varadi generate \
  --input test-results.xml \
  --output sarva-report \
  --title "My Test Suite" \
  --max-runs 25
```

### All options

| Flag | Default | Description |
|------|---------|-------------|
| `--input` | required | Input file or directory |
| `--output` | `sarva-report` | Output directory |
| `--title` | `'Sarva-Varadi Test Report'` | Report title |
| `--max-runs` | `30` | Max history runs to retain |
| `--no-history` | false | Disable history tracking |

---

## CI/CD examples

### GitHub Actions — Maven project

```yaml
- name: Run tests
  run: mvn test

- name: Generate Sarva-Varadi report
  run: |
    npm install -g @sarva-varadi/core
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
    npm install -g @sarva-varadi/core
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
    npm install -g @sarva-varadi/core
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

---

## Native adapters vs. converter

The converter is great for a quick start or when you can't modify the test code. For the richest experience, use the native adapters:

| Feature | Converter | Native adapter |
|---------|-----------|----------------|
| Pass/fail/skip counts | ✅ | ✅ |
| Test duration | ✅ | ✅ |
| Error messages | ✅ | ✅ |
| Stack traces | ✅ | ✅ |
| Screenshots | ⚠️ Limited | ✅ Full |
| Video / traces | ✗ | ✅ (Playwright) |
| HTTP request/response | ✗ | ✅ (RestAssured) |
| Flaky test detection | ⚠️ Basic | ✅ Full score |
| Severity labels | ✗ (except Robot — tags map automatically) | ✅ |
| BDD Gherkin hierarchy | ✗ | ✅ (Cucumber) |
| Keyword step tree | ✅ (Robot Framework — full nested keyword hierarchy) | N/A |
| Browser grouping | ⚠️ Name parsing | ✅ Automatic |

> **Robot Framework** is the only converter input that captures a full step hierarchy (keyword tree with sub-keywords) and tag-based labels — making the converter output nearly as rich as a native adapter.
