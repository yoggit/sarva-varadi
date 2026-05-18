# 📧 Notification Configuration Guide

Get Slack, Teams, or Email notifications up and running in **5 minutes**!

## ✅ What's Already Working

The notification system is **fully integrated** and ready to use:
- ✅ Slack notifications with rich formatting
- ✅ Microsoft Teams adaptive cards
- ✅ Email with HTML templates
- ✅ Automatic triggering after test runs
- ✅ Supports all frameworks (Playwright, Selenium, RestAssured TestNG, RestAssured JUnit 5)

## ⚙️ How to Configure — by Framework

| Framework | Where to configure |
|---|---|
| **Playwright** | `playwright.config.ts` reporter options (see below) |
| **Selenium** | `sarva-varadi.properties` in project root (see below) |
| **RestAssured (TestNG)** | `sarva-varadi.properties` in project root (see below) |
| **RestAssured (JUnit 5)** | `sarva-varadi.properties` in project root (see below) |

---

## 🚀 Quick Start (Pick One)

<details open>
<summary><b>Option 1: Slack (Fastest)</b></summary>

### Step 1: Get Webhook URL

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name it "Sarva-Varadi"
4. Select your workspace
5. Click "Incoming Webhooks" → Toggle ON
6. Click "Add New Webhook to Workspace"
7. Select channel → Copy the webhook URL

### Step 2: Add to Your Config

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
          channel: '#test-results', // Optional: override default channel
          mentionOnFailure: ['john.doe', 'jane.smith'], // Optional: @mention on failures
        },
      },
    }]
  ],
});
```

### Step 3: Set Environment Variable

```bash
# .env file
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Done!** Run your tests and check Slack 🎉

</details>

<details>
<summary><b>Option 2: Microsoft Teams</b></summary>

### Step 1: Get Webhook URL

1. Open Microsoft Teams
2. Go to your desired channel
3. Click "..." → "Connectors"
4. Search "Incoming Webhook" → Configure
5. Name it "Sarva-Varadi" → Create
6. Copy the webhook URL

### Step 2: Add to Config

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

### Step 3: Set Environment Variable

```bash
# .env
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/YOUR-WEBHOOK-URL
```

**Done!** Run tests and check Teams 🎉

</details>

<details>
<summary><b>Option 3: Email (Gmail Example)</b></summary>

### Step 1: Generate App Password

1. Enable 2FA: https://myaccount.google.com/signinoptions/two-step-verification
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Select "Mail" → "Other" → Name it "Sarva-Varadi"
4. Copy the 16-character password

### Step 2: Add to Config

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
          to: ['qa@yourcompany.com', 'dev@yourcompany.com'],
          subject: 'Test Results - ${passRate}% Pass Rate', // Optional
        },
      },
    }]
  ],
});
```

### Step 3: Set Environment Variables

```bash
# .env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
```

**Done!** Run tests and check your inbox 🎉

</details>

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

## 🎯 Advanced Configuration

### Conditional Notifications

**Only notify on failures:**
```typescript
const hasFailures = process.env.FAILURES === 'true';

notifications: {
  enabled: hasFailures,
  slack: { ... },
}
```

**Only in CI:**
```typescript
notifications: {
  enabled: process.env.CI === 'true',
  slack: { ... },
}
```

**Different channels per environment:**
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

## 📖 Other SMTP Providers

<details>
<summary><b>SendGrid</b></summary>

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

</details>

<details>
<summary><b>Outlook/Office 365</b></summary>

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

</details>

<details>
<summary><b>AWS SES</b></summary>

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

</details>

---

## 🔒 Security Best Practices

### Never Commit Credentials

```bash
# .gitignore
.env
.env.local
```

### Use CI/CD Secrets

```yaml
# GitHub Actions
- name: Run tests
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
    TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
    EMAIL_USER: ${{ secrets.EMAIL_USER }}
    EMAIL_PASS: ${{ secrets.EMAIL_PASS }}
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
- ✅ Check notification config is inside reporter config

---

## ✨ Framework-Specific Setup

### Selenium / RestAssured (TestNG & JUnit 5)

Notifications are configured via `sarva-varadi.properties` in your project root. The CLI reads this file automatically when generating the report — no code changes needed.

**Step 1 — add to `sarva-varadi.properties`:**

```properties
# Master switch
sarva.notifications.enabled=true

# Slack
sarva.notifications.slack.enabled=true
sarva.notifications.slack.webhookUrl=${SLACK_WEBHOOK_URL}
sarva.notifications.slack.channel=#test-results

# Teams (optional)
# sarva.notifications.teams.enabled=true
# sarva.notifications.teams.webhookUrl=${TEAMS_WEBHOOK_URL}

# Email (optional)
# sarva.notifications.email.enabled=true
# sarva.notifications.email.smtp.host=smtp.gmail.com
# sarva.notifications.email.smtp.port=587
# sarva.notifications.email.smtp.user=${EMAIL_USER}
# sarva.notifications.email.smtp.pass=${EMAIL_PASS}
# sarva.notifications.email.from=tests@company.com
# sarva.notifications.email.to=qa@company.com,dev@company.com
```

**Step 2 — set environment variables (never commit secrets):**

```bash
# .env / CI secrets
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Step 3 — run as normal:**

```bash
mvn clean test   # report generation (and notification) fires automatically
```

Notifications fire at the end of report generation — the same moment the HTML report is written. No extra steps required.

> `${ENV_VAR}` values in `sarva-varadi.properties` are resolved from environment variables at runtime, so secrets never live in the file itself.

---

## 📞 Support

- 🐛 [Report Issues](https://github.com/yoggit/sarva-varadi/issues)
- 💬 [Discussions](https://github.com/yoggit/sarva-varadi/discussions)

---

Made with ✨ by [Sarva-Varadi](https://github.com/yoggit/sarva-varadi)
