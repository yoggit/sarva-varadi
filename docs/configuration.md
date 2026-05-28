# Configuration

Sarva-Varadi uses different config mechanisms depending on the adapter:

- **Playwright** — options in `playwright.config.ts`
- **Java adapters** — `sarva-varadi.properties` file in project root (or `-D` system properties)
- **Robot Framework** — CLI flags + optional `sarva-varadi.properties` in the directory where you run the CLI

[[toc]]

---

## Playwright (TypeScript)

Pass an options object to the reporter plugin in `playwright.config.ts`:

```typescript
['@sarva-varadi/playwright', {
  outputFolder: 'sarva-report',
  title: 'My Test Report',
  history: {
    enabled: true,
    maxRuns: 25,
    retentionDays: 90,
  },
  notifications: {
    enabled: true,
    slack: { webhookUrl: process.env.SLACK_WEBHOOK_URL },
  },
}]
```

### Core options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `outputFolder` | string | `'sarva-report'` | Directory for the report |
| `outputFile` | string | `'index.html'` | Report filename |
| `title` | string | `'Sarva-Varadi Test Report'` | Title shown in the report header |
| `showStackTrace` | boolean | `true` | Show full stack traces in test detail |
| `embedAttachments` | boolean | `true` | Embed screenshots/videos inline |
| `maskSensitiveData` | boolean | `false` | Enable sensitive data masking in step titles |
| `sensitiveEnvVars` | string[] | `[]` | Env var names whose resolved values are masked wherever they appear in step titles, e.g. `['PASSWORD', 'EMAIL']` |
| `maskAllFills` | boolean | `false` | Mask the typed value in every `Fill`/`Type` step regardless of locator |

::: tip Masking sensitive data
Sensitive values typically come from a `.env` file. List the env var names you want masked — the reporter resolves their values at runtime and redacts them from every step title they appear in, regardless of locator type (XPath, CSS, role, etc.).

```typescript
['@sarva-varadi/playwright', {
  maskSensitiveData: true,
  sensitiveEnvVars: ['PASSWORD', 'EMAIL', 'API_TOKEN'],  // values read from process.env
  maskAllFills: false,  // set true to also mask every Fill/Type step unconditionally
}]
```
:::

### History options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `history.enabled` | boolean | `true` | Enable historical run tracking |
| `history.maxRuns` | number | `30` | Keep last N runs (no hard cap — 100+ works fine) |
| `history.retentionDays` | number | `90` | Auto-remove runs older than N days |
| `history.trackPerTest` | boolean | `true` | Track per-test pass/fail/flaky across runs |

::: tip History and performance
Each run is stored as a separate JSON file (~1 KB each). Charts work best with 20–100 runs. Flaky detection improves with more data.
:::

### Playwright attachment options

```typescript
use: {
  screenshot: 'only-on-failure',   // 'always' | 'only-on-failure' | 'off'
  video: 'retain-on-failure',      // 'on' | 'retain-on-failure' | 'on-first-retry' | 'off'
  trace: 'on-first-retry',         // 'on' | 'retain-on-failure' | 'on-first-retry' | 'off'
}
```

---

## Java adapters — `sarva-varadi.properties`

Drop `sarva-varadi.properties` in the project root. System properties (`-Dsarva.xxx=yyy`) always override file values.

```properties
# ── Output ──────────────────────────────────────────────────
sarva.outputDir=sarva-varadi-results

# ── Report display ──────────────────────────────────────────
sarva.report.title=My Test Suite
sarva.report.frameworkLabel=Selenium-TestNG
sarva.report.showStackTrace=true
sarva.report.embedAttachments=true

# ── History & trends ────────────────────────────────────────
sarva.report.history=true
sarva.report.trends=true
sarva.report.maxRuns=30
sarva.report.retentionDays=90

# ── Sensitive data ──────────────────────────────────────────
sarva.maskSensitiveData=false

# ── Screenshots (Selenium only) ─────────────────────────────
sarva.screenshot=on-failure          # always | on-failure | never
sarva.screenshotDir=sarva-varadi-results/screenshots

# ── Retry / flaky detection ─────────────────────────────────
sarva.maxRetryCount=2                # requires @Test(retryAnalyzer=...) on TestNG
```

### All properties reference

| Property | Default | Description |
|----------|---------|-------------|
| `sarva.outputDir` | `sarva-varadi-results` | Where `test-results.json` is written |
| `sarva.report.title` | `Sarva-Varadi Test Report` | Report title |
| `sarva.report.frameworkLabel` | auto | Label shown below report heading and in PDF |
| `sarva.report.showStackTrace` | `true` | Show stack traces in test detail |
| `sarva.report.embedAttachments` | `true` | Embed screenshots inline |
| `sarva.report.history` | `true` | Enable run history |
| `sarva.report.trends` | `true` | Enable trends analysis |
| `sarva.report.maxRuns` | `30` | Max runs to retain |
| `sarva.report.retentionDays` | `90` | Max age in days |
| `sarva.maskSensitiveData` | `false` | Mask auth headers/tokens with `***` |
| `sarva.screenshot` | `on-failure` | Screenshot capture mode (Selenium) |
| `sarva.screenshotDir` | `sarva-varadi-results/screenshots` | Screenshot output path |
| `sarva.maxRetryCount` | `2` | Retries before marking failed |

---

## Robot Framework (CLI converter)

The CLI converter is configured through **flags** and an optional **`sarva-varadi.properties`** file placed in the directory where you run the command.

### CLI flags

| Flag | Default | Description |
|------|---------|-------------|
| `--input`, `-i` | required | Path to `output.xml` |
| `--output`, `-o` | required | Output directory for the report |
| `--title`, `-t` | `'Sarva-Varadi Test Report'` | Title shown in the report header |
| `--use-current-timestamp` | off | Shift all test timestamps to the current time (useful for demo/sample data) |

```bash
sarva-varadi generate \
  --input results/output.xml \
  --output sarva-report \
  --title "Robot Suite — Nightly"
```

### `sarva-varadi.properties` (CLI)

Place this file in the same directory you run the CLI from. Flags always take precedence over file values.

```properties
# ── Report display ──────────────────────────────────────────
sarva.report.title=Robot Framework Tests
sarva.report.frameworkLabel=Robot Framework
sarva.report.showStackTrace=true
sarva.report.embedAttachments=true

# ── History & trends ────────────────────────────────────────
sarva.report.history=true
sarva.report.trends=true
sarva.report.maxRuns=30
sarva.report.retentionDays=90

# ── Sensitive data ──────────────────────────────────────────
sarva.report.maskSensitiveData=false

# ── Environment info ────────────────────────────────────────
sarva.environment=staging

# ── Issue / TMS link templates ──────────────────────────────
sarva.links.issue=https://jira.example.com/browse/{issue}
sarva.links.tms=https://testrail.example.com/index.php?/cases/view/{tms}
```

### Properties reference (CLI)

| Property | Default | Description |
|----------|---------|-------------|
| `sarva.report.title` | `Sarva-Varadi Test Report` | Report title (overridden by `--title` flag) |
| `sarva.report.frameworkLabel` | `robot` | Label shown below the report heading |
| `sarva.report.showStackTrace` | `true` | Show stack traces in test detail |
| `sarva.report.embedAttachments` | `true` | Embed attachments inline |
| `sarva.report.history` | `true` | Enable run history tracking |
| `sarva.report.trends` | `true` | Enable trends analysis |
| `sarva.report.maxRuns` | `30` | Max runs to retain |
| `sarva.report.retentionDays` | `90` | Max age in days |
| `sarva.report.maskSensitiveData` | `false` | Mask sensitive values with `***` |
| `sarva.environment` | — | Environment name shown in report (e.g. `staging`, `prod`) |
| `sarva.links.issue` | — | URL template for issue links — use `{issue}` as placeholder |
| `sarva.links.tms` | — | URL template for TMS links — use `{tms}` as placeholder |

---

## Severity labels

Tag tests with severity to unlock the **Failures by Severity** trend chart and ranked failure view.

**Playwright:**
```typescript
test('Login fails @severity:critical', async ({ page }) => { ... });
// or
test.info().annotations.push({ type: 'severity', description: 'critical' });
```

**Java (TestNG / RestAssured):**
```java
@Test(groups = { "severity:critical" })
public void loginTest() { ... }
```

**Robot Framework:**
```robotframework
*** Test Cases ***
Valid Login With Correct Credentials
    [Tags]    severity:critical    tms:AUTH-001    smoke
    Navigate To    ${BASE_URL}/login
    ...

GET All Users Returns 200
    [Tags]    severity:high    tms:USR-001    regression
    GET On Session    api    /users
    ...
```

Tags are mapped automatically by the CLI converter — no extra configuration needed.

| Tag format | Effect |
|-----------|--------|
| `severity:critical` / `severity:high` / `severity:medium` / `severity:low` | Severity badge in report |
| `tms:JIRA-123` | TMS link (requires `sarva.links.tms` property) |
| `issue:BUG-456` | Issue link (requires `sarva.links.issue` property) |
| Any other tag | Shown as a plain label chip |

Levels: `critical` · `high` · `medium` · `low`

---

## Notifications

→ [Notifications guide](./notifications)

```typescript
// Playwright
notifications: {
  enabled: true,
  slack:  { webhookUrl: process.env.SLACK_WEBHOOK_URL },
  teams:  { webhookUrl: process.env.TEAMS_WEBHOOK_URL },
  email:  {
    host: 'smtp.gmail.com', port: 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    to:   'team@company.com',
  },
}
```

```properties
# sarva-varadi.properties (Java)
sarva.notification.enabled=true
sarva.notification.slack.webhook-url=${SLACK_WEBHOOK_URL}
sarva.notification.teams.webhook-url=${TEAMS_WEBHOOK_URL}
sarva.notification.email.host=smtp.gmail.com
sarva.notification.email.port=587
sarva.notification.email.user=${EMAIL_USER}
sarva.notification.email.pass=${EMAIL_PASS}
sarva.notification.email.to=team@company.com
```
