# 🚀 Sarva-Varadi Quick Start

Get started with Sarva-Varadi in 2 minutes!

## Installation

### For Playwright Projects

```bash
npm install --save-dev @sarva-varadi/core @sarva-varadi/playwright
```

## Basic Configuration

Add to your `playwright.config.ts`:

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

## Run Tests

```bash
npx playwright test
```

## View Report

```bash
# Windows
start sarva-report/index.html

# macOS
open sarva-report/index.html

# Linux
xdg-open sarva-report/index.html
```

## 📊 You Get Two Reports

1. **`index.html`** - Latest test run results
2. **`trends.html`** - Historical trends dashboard

## 🎯 Next Steps

### Enable Notifications (Optional)

Send results to Slack/Teams/Email automatically:

```typescript
export default defineConfig({
  reporter: [
    ['@sarva-varadi/playwright', {
      notifications: {
        enabled: true,
        slack: {
          enabled: true,
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: '#test-results',
        },
      },
    }]
  ],
});
```

**See [NOTIFICATIONS.md](NOTIFICATIONS.md) for setup guide**

### Customize Options

```typescript
export default defineConfig({
  reporter: [
    ['@sarva-varadi/playwright', {
      outputFolder: 'test-reports',      // Custom folder
      title: 'E2E Tests',                // Custom title
      
      history: {
        enabled: true,                   // Track history
        maxRuns: 30,                     // Keep last 30 runs
        retentionDays: 90,               // Auto-delete after 90 days
      },
      
      trends: {
        enabled: true,                   // Generate trends.html
        showInMainReport: true,          // Mini-trend widget in main report
      },
    }]
  ],
});
```

## 📖 Full Documentation

- [README.md](README.md) - Complete features and configuration
- [NOTIFICATIONS.md](NOTIFICATIONS.md) - Slack/Teams/Email setup
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical design details
- [examples/](examples/) - Configuration examples

## 💡 Tips

1. **First run** creates history baseline
2. **Flaky tests** automatically detected after 2+ runs
3. **Reports are portable** - just copy the folder
4. **No server needed** - everything is file-based

## 🆘 Troubleshooting

### Report not generated?
- Check `playwright.config.ts` has reporter configured
- Verify output folder has write permissions

### Attachments missing?
- Ensure Playwright config has `screenshot`/`video`/`trace` enabled
- Check `embedAttachments: true` in reporter config

### History not working?
- Verify `history.enabled: true`
- First run creates baseline, trends appear after 2+ runs

---

Made with 📊 by [Sarva-Varadi](https://github.com/yoggit/sarva-varadi)
