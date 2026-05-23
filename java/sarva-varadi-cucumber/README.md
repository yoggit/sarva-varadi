# sarva-varadi-cucumber

Cucumber BDD plugin for Sarva-Varadi. Captures Feature → Scenario → Step execution and writes `sarva-varadi-results/test-results.json` in Sarva-Varadi native format.

## Installation

Add to your Maven `pom.xml`:

```xml
<dependency>
  <groupId>io.github.yoggit</groupId>
  <artifactId>sarva-varadi-cucumber</artifactId>
  <version>1.0.0</version>
  <scope>test</scope>
</dependency>
```

## Registration

### Option A — junit-platform.properties

```properties
cucumber.plugin=io.github.yoggit.sarvavaradi.SarvaVaradiCucumberPlugin
```

### Option B — @CucumberOptions

```java
@CucumberOptions(plugin = "io.github.yoggit.sarvavaradi.SarvaVaradiCucumberPlugin")
```

### Option C — @ConfigurationParameter (JUnit Platform Suite)

```java
@Suite
@IncludeEngines("cucumber")
@ConfigurationParameter(key = PLUGIN_PROPERTY_NAME,
    value = "io.github.yoggit.sarvavaradi.SarvaVaradiCucumberPlugin")
public class CucumberTestRunner {}
```

## Configuration

| System property | Default | Description |
|---|---|---|
| `sarva.outputDir` | `sarva-varadi-results` | Directory where `test-results.json` is written |

## Sub-step integration with Selenium

When `sarva-varadi-selenium` is also on the classpath at runtime, each BDD step is automatically enriched with granular WebDriver sub-steps (navigate, click, find element, etc.). This uses reflection — **no compile-time dependency** on the Selenium module is required.

```
When I navigate to "https://www.selenium.dev/"
  └─ Navigate: https://www.selenium.dev/       ← WebDriver sub-step
  └─ Wait for page load complete               ← WebDriver sub-step
```

If `sarva-varadi-selenium` is not on the classpath, steps are captured without sub-steps — the plugin degrades gracefully.

## Output

Results are written to `<outputDir>/test-results.json` in Sarva-Varadi native format. Pass directly to the CLI — no `--format` flag needed:

```bash
npx @sarva-varadi/core generate \
  --input sarva-varadi-results/test-results.json \
  --output sarva-report
```

## What is captured

- Feature name (derived from `.feature` filename)
- Scenario name and tags
- Given/When/Then steps with keyword, timing, and status
- Step-level error messages on failure
- WebDriver actions as sub-steps (when Selenium listener present)
- Hook steps are skipped (only `PickleStepTestStep` is recorded)

## Status mapping

| Cucumber status | Sarva-Varadi status |
|---|---|
| PASSED | passed |
| FAILED | failed |
| SKIPPED / PENDING | skipped |
| UNDEFINED / AMBIGUOUS | broken |

## License

MIT
