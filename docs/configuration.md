# Configuration

Sarva-Varadi uses different config mechanisms depending on the adapter:

- **Playwright** — options in `playwright.config.ts`
- **Java adapters** — `sarva-varadi.properties` file in project root (or `-D` system properties)

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
| `maskSensitiveData` | boolean | `false` | Mask passwords, tokens, API keys with `***` |

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
