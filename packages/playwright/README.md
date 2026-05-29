# @sarva-varadi/playwright

Playwright adapter for Sarva-Varadi — captures test results, steps, attachments, and browser info, and generates beautiful interactive reports with historical trend tracking.

---

## Installation

```bash
npm install --save-dev @sarva-varadi/core@latest @sarva-varadi/playwright@latest
```

---

## Quick Setup

### 1 — Add reporter to `playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['list'],
    ['@sarva-varadi/playwright', {
      outputFolder: 'sarva-report',
      title: 'My Test Report',
    }]
  ],

  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
});
```

### 2 — Run tests

```bash
npx playwright test
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
| Test pass / fail / skip / flaky | ✅ Automatic |
| Duration | ✅ Automatic |
| Error message & stack trace | ✅ Automatic |
| Browser name & version | ✅ Automatic |
| Test steps | ✅ Automatic |
| Screenshots | ✅ Via `use.screenshot` config |
| Videos | ✅ Via `use.video` config |
| Traces | ✅ Via `use.trace` config |
| Retry / flaky detection | ✅ Automatic |

---

## Advanced Configuration

```typescript
['@sarva-varadi/playwright', {
  outputFolder: 'sarva-report',
  title: 'E2E Tests',
  environment: 'QA',           // Shown as a badge in the report

  history: {
    enabled: true,
    maxRuns: 30,               // Keep last 30 runs
    retentionDays: 90,         // Auto-delete runs older than 90 days
  },

  trends: {
    enabled: true,
    showInMainReport: true,    // Embed trend data in index.html SPA
  },

  notifications: {
    enabled: true,
    slack: {
      enabled: true,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: '#test-results',
    },
  },

  // Sensitive data masking
  maskSensitiveData: true,
  sensitiveEnvVars: ['PASSWORD', 'EMAIL', 'API_TOKEN'], // env var names — values are masked in step titles
  maskAllFills: false,   // set true to mask every Fill/Type step value unconditionally
}]
```

> **Note:** `maskSensitiveData: true` alone does nothing — at least one of `sensitiveEnvVars` or `maskAllFills: true` must be configured. If neither is set, the reporter prints a warning at test run start reminding you to configure a masking strategy.

```typescript
```

---

## Notifications

Send Slack, Teams, or Email notifications after each run. See [NOTIFICATIONS.md](../../NOTIFICATIONS.md) for full configuration options.

---

## Full Integration Guide

For the complete step-by-step guide see the [Playwright Integration Guide](../../README.md#playwright-guide) in the main README.

---

## License

MIT
