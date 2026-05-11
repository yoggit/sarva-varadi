# 🚀 Quick Notification Setup Guide

Get Slack, Teams, or Email notifications up and running in **5 minutes**!

## ✅ What's Already Working

The notification system is **fully integrated** and ready to use:
- ✅ Slack notifications with rich formatting
- ✅ Microsoft Teams adaptive cards
- ✅ Email with HTML templates
- ✅ Automatic triggering after test runs
- ✅ Supports all frameworks (Playwright, Selenium, RestAssured)

## 🎯 Quick Start (Pick One)

### Option 1: Slack (Fastest)

**Step 1:** Get webhook URL
```
1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name it "Sarva-Varadi"
4. Select your workspace
5. Click "Incoming Webhooks" → Toggle ON
6. Click "Add New Webhook to Workspace"
7. Select channel → Copy the webhook URL
```

**Step 2:** Add to your config
```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['@sarva-varadi/playwright', {
      notifications: {
        enabled: true,
        slack: {
          enabled: true,
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: '#test-results', // Optional
        },
      },
    }]
  ],
});
```

**Step 3:** Set environment variable
```bash
# .env file
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Done!** Run your tests and check Slack 🎉

---

### Option 2: Microsoft Teams

**Step 1:** Get webhook URL
```
1. Open Microsoft Teams
2. Go to your desired channel
3. Click "..." → "Connectors"
4. Search "Incoming Webhook" → Configure
5. Name it "Sarva-Varadi" → Create
6. Copy the webhook URL
```

**Step 2:** Add to config
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

**Step 3:** Set environment variable
```bash
# .env
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/YOUR-WEBHOOK-URL
```

**Done!** Run tests and check Teams 🎉

---

### Option 3: Email (Gmail Example)

**Step 1:** Generate App Password
```
1. Enable 2FA: https://myaccount.google.com/signinoptions/two-step-verification
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Select "Mail" → "Other" → Name it "Sarva-Varadi"
4. Copy the 16-character password
```

**Step 2:** Add to config
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
              pass: process.env.EMAIL_PASS, // App password
            },
          },
          from: 'noreply@yourcompany.com',
          to: ['qa@yourcompany.com'],
        },
      },
    }]
  ],
});
```

**Step 3:** Set environment variables
```bash
# .env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
```

**Done!** Run tests and check your inbox 🎉

---

## 🔥 Enable All Three at Once

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
          to: ['qa@company.com'],
        },
      },
    }]
  ],
});
```

---

## 🧪 Test Your Setup

We've created a test script to verify your notifications work before running actual tests:

```bash
# Set your webhook URLs
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
export TEAMS_WEBHOOK_URL="https://outlook.office.com/webhook/..."
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASS="your-app-password"

# Run the test
node test-notifications.js
```

You should see test notifications in Slack/Teams/Email within seconds!

---

## 📊 What You'll Receive

### Slack Message Example:
```
📊 Test Results
━━━━━━━━━━━━━━━━━━
Total: 50           Pass Rate: 90%
Passed: ✅ 45       Failed: ❌ 3
Duration: 2m 5s     Skipped: ⏭️ 1
Flaky: ⚠️ 1
━━━━━━━━━━━━━━━━━━

Failed Tests:
• Login flow - timeout after 30s
• Checkout process - assertion failed
• API integration test - network error

[📊 View Full Report] (button)
```

### Teams Card:
- Rich adaptive card with stats
- Color-coded pass rate (green/yellow/red)
- Failed test list
- Direct link to report

### Email:
- Professional HTML template
- Grid layout with stats
- Failed tests section
- "View Full Report" button

---

## 🎯 Conditional Notifications

### Only notify on failures:
```typescript
const hasFailures = process.env.FAILURES === 'true';

notifications: {
  enabled: hasFailures,
  slack: { ... },
}
```

### Only in CI:
```typescript
notifications: {
  enabled: process.env.CI === 'true',
  slack: { ... },
}
```

### Different channels per environment:
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

## 🔒 Security Best Practices

### Never commit credentials:
```bash
# .gitignore
.env
.env.local
```

### Use CI/CD secrets:
```yaml
# GitHub Actions
- name: Run tests
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
    TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
  run: npx playwright test
```

---

## 🛠️ Troubleshooting

### Slack: "url_verification failed"
- ✅ Webhook URL must start with `https://hooks.slack.com/services/`
- ✅ Check webhook is active in Slack app settings

### Teams: Message not appearing
- ✅ Verify connector added to correct channel
- ✅ URL should start with `https://outlook.office.com/webhook/`

### Email: Authentication failed
- ✅ Gmail: Use App Password, NOT regular password
- ✅ Enable 2FA first, then generate app password
- ✅ Check SMTP host/port are correct

### Not receiving any notifications?
- ✅ Check `notifications.enabled: true`
- ✅ Verify environment variables loaded (`console.log(process.env.SLACK_WEBHOOK_URL)`)
- ✅ Look for errors in terminal output
- ✅ Run `node test-notifications.js` to isolate the issue

---

## 📖 Other SMTP Providers

### SendGrid:
```typescript
smtp: {
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
}
```

### Outlook:
```typescript
smtp: {
  host: 'smtp-mail.outlook.com',
  port: 587,
  auth: {
    user: process.env.OUTLOOK_EMAIL,
    pass: process.env.OUTLOOK_PASSWORD,
  },
}
```

### AWS SES:
```typescript
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

## ✨ Next Steps

1. ✅ Set up notifications (5 minutes)
2. ✅ Test with `test-notifications.js`
3. ✅ Run your actual tests
4. ✅ Verify notifications arrive
5. ✅ Customize message format if needed

**Need help?** Open an issue at https://github.com/yoggit/sarva-varadi/issues

---

Made with ✨ by Sarva-Varadi
