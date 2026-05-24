# Sarva-Varadi Selenium-Cucumber BDD Demo

Demo project showing how to integrate Selenium + Cucumber BDD tests with Sarva-Varadi reporting. Feature → Scenario → Step hierarchy is captured automatically, and each BDD step is enriched with granular WebDriver sub-steps (navigate, click, find element, etc.).

## Prerequisites

- Java 11 or higher
- Maven 3.6+
- Node.js 18+ (for report generation)
- Google Chrome + ChromeDriver (for Selenium steps)

## Project Structure

```
demo-selenium-cucumber/
├── pom.xml                                   # Maven configuration
├── src/
│   └── test/
│       ├── java/
│       │   └── com/example/cucumber/
│       │       ├── CucumberTestRunner.java   # JUnit Platform Suite runner
│       │       └── StepDefinitions.java      # Given/When/Then implementations
│       └── resources/
│           ├── features/
│           │   ├── selenium_website.feature  # 6 scenarios — Selenium website navigation
│           │   └── selenium_api_docs.feature # 2 scenarios — API docs & blog
│           └── junit-platform.properties     # Plugin + glue + features path
├── cucumber-source/
│   └── data.json                             # Base scenarios for demo history generation
└── sarva-varadi-results/                     # Test results (generated)
    └── test-results.json
```

## Quick Start

### 1. Run Tests

```bash
mvn clean test
```

This runs all Cucumber scenarios and generates `sarva-varadi-results/test-results.json`.

### 2. Generate Report

```bash
npx @sarva-varadi/core generate \
  --input sarva-varadi-results/test-results.json \
  --output sarva-report
```

Or run both in one step (the `exec-maven-plugin` does this automatically after tests):

```bash
mvn clean test   # report generated to sarva-report/ automatically
```

### 3. View Report

```bash
open sarva-report/index.html   # macOS
start sarva-report/index.html  # Windows
xdg-open sarva-report/index.html  # Linux
```

## Features Under Test

This demo tests the [Selenium website](https://www.selenium.dev/) using Cucumber BDD + Selenium WebDriver:

### selenium_website.feature (6 scenarios)
- ✅ Homepage loads with correct title
- ✅ Documentation page is accessible
- ✅ Downloads page loads successfully
- ✅ WebDriver docs display content
- ✅ Ecosystem page is reachable
- ✅ Getting started guide is accessible

### selenium_api_docs.feature (2 scenarios)
- ✅ Blog page is accessible
- ✅ WebDriver API reference loads

## How It Works

### Plugin registration

`junit-platform.properties` registers the Sarva-Varadi plugin:

```properties
cucumber.plugin=io.github.yoggit.sarvavaradi.SarvaVaradiCucumberPlugin
cucumber.glue=com.example.cucumber
cucumber.features=src/test/resources/features
```

### Step hierarchy

The plugin captures:
- **Level 1** — BDD step: `When I navigate to "https://www.selenium.dev/"`
- **Level 2** — WebDriver sub-steps: `Navigate: https://www.selenium.dev/`, `Wait for page load complete`

Sub-steps appear automatically when `sarva-varadi-selenium` is on the classpath. If only the Cucumber plugin is present, steps are still captured — sub-steps are simply absent.

### Runner

`CucumberTestRunner.java` uses JUnit Platform Suite:

```java
@Suite
@IncludeEngines("cucumber")
@ConfigurationParameter(key = PLUGIN_PROPERTY_NAME,
    value = "io.github.yoggit.sarvavaradi.SarvaVaradiCucumberPlugin")
@ConfigurationParameter(key = GLUE_PROPERTY_NAME,   value = "com.example.cucumber")
@ConfigurationParameter(key = FEATURES_PROPERTY_NAME, value = "src/test/resources/features")
public class CucumberTestRunner {}
```

## Report Features

The generated report (`sarva-report/index.html`) includes:

- **Overview** — Pass/fail/flaky summary, health pulse, top failures
- **Tests** — BDD steps with collapsible WebDriver sub-steps, search and filter by tag
- **Trends** — Historical pass rate, flakiness trends across runs
- **Timeline** — Gantt chart of scenario execution order

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Cucumber Tests
  run: cd demo-cucumber && mvn clean test

- name: Upload Report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: cucumber-bdd-report
    path: demo-selenium-cucumber/sarva-report/
```

## Troubleshooting

### ChromeDriver not found

Ensure Chrome is installed and ChromeDriver matches the Chrome version:

```bash
chromedriver --version
google-chrome --version
```

### Report not generated

Ensure test results exist:

```bash
ls sarva-varadi-results/test-results.json
```

## License

MIT
