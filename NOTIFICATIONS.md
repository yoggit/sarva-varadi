# 📧 Notification Configuration Guide

Sarva-Varadi can automatically send test results to Slack, Microsoft Teams, and Email after test execution.

## Quick Start

### 1. Slack Notifications

**Step 1: Get Slack Webhook URL**
1. Go to https://api.slack.com/apps
2. Create a new app or select existing
3. Enable "Incoming Webhooks"
4. Add webhook to your workspace
5. Copy the webhook URL

**Step 2: Configure in playwright.config.ts**

```typescript
export default defineConfig({
  reporter: [
    ['@sarva-varadi/playwright', {
      outputFolder: 'sarva-report',
      notifications: {
        enabled: true,
        slack: {
          enabled: true,
          webhookUrl: process.env.SLACK_WEBHOOK_URL, // Store in .env file
          channel: '#test-results', // Optional: override default channel
          mentionOnFailure: ['john.doe', 'jane.smith'], // Optional: mention users when tests fail
        },
      },
    }]
  ],
});
```

**Step 3: Set environment variable**

```bash
# .env file
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX

# Or in CI/CD (GitHub Actions)
# Add SLACK_WEBHOOK_URL to repository secrets
```

---

### 2. Microsoft Teams Notifications

**Step 1: Get Teams Webhook URL**
1. Open Microsoft Teams
2. Go to your channel
3. Click "..." → "Connectors" → "Incoming Webhook"
4. Configure and copy the webhook URL

**Step 2: Configure**

```typescript
export default defineConfig({
  reporter: [
    ['@sarva-varadi/playwright', {
      notifications: {
        enabled: true,
        teams: {
          enabled: true,
          webhookUrl: process.env.TEAMS_WEBHOOK_URL,
        },
      },
    }]
  ],
});
```

---

### 3. Email Notifications

**Step 1: Get SMTP credentials**

For Gmail:
1. Enable 2-factor authentication
2. Generate app password: https://myaccount.google.com/apppasswords
3. Use app password in configuration

**Step 2: Configure**

```typescript
export default defineConfig({
  reporter: [
    ['@sarva-varadi/playwright', {
      notifications: {
        enabled: true,
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
          to: ['team@yourcompany.com', 'qa@yourcompany.com'],
          subject: 'Test Results - ${passRate}% Pass Rate', // Optional custom subject
        },
      },
    }]
  ],
});
```

**Alternative SMTP providers:**

```typescript
// SendGrid
smtp: {
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
}

// Outlook
smtp: {
  host: 'smtp-mail.outlook.com',
  port: 587,
  auth: {
    user: process.env.OUTLOOK_EMAIL,
    pass: process.env.OUTLOOK_PASSWORD,
  },
}

// AWS SES
smtp: {
  host: 'email-smtp.us-east-1.amazonaws.com',
  port: 587,
  auth: {
    user: process.env.AWS_SES_USER,
    pass: process.env.AWS_SES_PASS,
  },
}
```

---

## 🔥 All-in-One Configuration

Send to **all channels** simultaneously:

```typescript
export default defineConfig({
  reporter: [
    ['@sarva-varadi/playwright', {
      outputFolder: 'sarva-report',
      title: 'My Test Report',
      
      notifications: {
        enabled: true,
        
        slack: {
          enabled: true,
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: '#test-results',
          mentionOnFailure: ['john.doe'],
        },
        
        teams: {
          enabled: true,
          webhookUrl: process.env.TEAMS_WEBHOOK_URL,
        },
        
        email: {
          enabled: true,
          smtp: {
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          },
          from: 'tests@company.com',
          to: ['qa@company.com', 'dev@company.com'],
        },
      },
    }]
  ],
});
```

---

## 📊 What Gets Sent?

### Summary Card includes:
- ✅ Total tests, pass rate, duration
- 📈 Pass/Fail/Flaky/Skipped counts
- ⚠️ Top 5 failed tests (with names)
- 🔗 Link to full HTML report (if hosted)

### Example Slack Message:

```
📊 Test Results
━━━━━━━━━━━━━━━━━━━━━
Total: 100          Pass Rate: 95%
Passed: ✅ 95       Failed: ❌ 4
Duration: 2m 15s    Skipped: ⏭️ 1
━━━━━━━━━━━━━━━━━━━━━

Failed Tests:
• Login flow - timeout
• Checkout process - assertion failed
• API integration - network error

[View Full Report →]
```

---

## 🔒 Security Best Practices

### 1. **Never commit credentials**

```bash
# .gitignore
.env
.env.local
```

### 2. **Use environment variables**

```bash
# .env (local development)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. **CI/CD secrets (GitHub Actions)**

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Run tests
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
          EMAIL_USER: ${{ secrets.EMAIL_USER }}
          EMAIL_PASS: ${{ secrets.EMAIL_PASS }}
        run: npx playwright test
```

---

## 🎯 Conditional Notifications

Send notifications **only on failures**:

```typescript
const shouldNotify = process.env.CI === 'true'; // Only in CI

notifications: {
  enabled: shouldNotify,
  slack: { ... },
}
```

Send to **different channels** based on environment:

```typescript
const channel = process.env.NODE_ENV === 'production' 
  ? '#prod-alerts' 
  : '#test-results';

slack: {
  enabled: true,
  webhookUrl: process.env.SLACK_WEBHOOK_URL,
  channel,
}
```

---

## 🧪 Testing Notifications

Test your setup without running full test suite:

```typescript
// test-notification.ts
import { NotificationManager } from '@sarva-varadi/core';

const manager = new NotificationManager({
  enabled: true,
  slack: {
    enabled: true,
    webhookUrl: process.env.SLACK_WEBHOOK_URL!,
  },
});

await manager.notify({
  summary: {
    id: 'test-123',
    timestamp: Date.now(),
    duration: 5000,
    total: 10,
    passed: 8,
    failed: 2,
    skipped: 0,
    flaky: 0,
    passRate: 80,
  },
  failedTests: [
    { name: 'Test notification', error: 'This is a test' }
  ],
});

console.log('Notification sent!');
```

Run:
```bash
npx ts-node test-notification.ts
```

---

## 🛠️ Troubleshooting

### Slack: "url_verification failed"
- ✅ Make sure webhook URL starts with `https://hooks.slack.com/services/`
- ✅ Check webhook is still active in Slack app settings

### Teams: "Message not appearing"
- ✅ Verify connector is added to the correct channel
- ✅ Check webhook URL is correct (starts with `https://outlook.office.com/webhook/`)

### Email: "Authentication failed"
- ✅ For Gmail: use App Password, not regular password
- ✅ Enable "Less secure app access" if using regular SMTP
- ✅ Check SMTP host and port are correct

### General: "Notifications not sending"
- ✅ Ensure `notifications.enabled: true`
- ✅ Check environment variables are loaded
- ✅ Look for errors in console output
- ✅ Verify network/firewall allows outbound connections

---

## 📖 Advanced Examples

### Send report URL (if hosting on S3/GitHub Pages)

```typescript
// After uploading report to S3
const reportUrl = 'https://your-bucket.s3.amazonaws.com/reports/latest/index.html';

// In custom script
await notificationManager.notify({
  summary: runSummary,
  reportUrl,
  trendsUrl: reportUrl.replace('index.html', 'trends.html'),
  failedTests,
});
```

### Custom notification wrapper

```typescript
// notify.ts
export async function notifyTeam(passRate: number, reportUrl: string) {
  const emoji = passRate >= 95 ? '🎉' : passRate >= 80 ? '⚠️' : '🚨';
  
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    body: JSON.stringify({
      text: `${emoji} Tests completed with ${passRate}% pass rate\n${reportUrl}`
    }),
  });
}
```

---

Made with ✨ by [Sarva-Varadi](https://github.com/yoggit/sarva-varadi)
