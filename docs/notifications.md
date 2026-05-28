# Notifications

Sarva-Varadi can send Slack, Teams, or Email notifications automatically after each test run.

Works with all frameworks: Playwright, Selenium, RestAssured (TestNG + JUnit 5 + Cucumber).

[[toc]]

---

## Playwright setup

Add a `notifications` block in `playwright.config.ts`.

::: tip Email notifications need nodemailer
Email support uses [nodemailer](https://nodemailer.com/) as an optional peer dependency — it is **not** installed automatically. If you enable email notifications, install it first:

```sh
npm install nodemailer
```
:::


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
          mentionOnFailure: ['john.doe'],  // optional
        },
        teams: {
          enabled: true,
          webhookUrl: process.env.TEAMS_WEBHOOK_URL,
        },
        email: {
          enabled: true,
          host: 'smtp.gmail.com',
          port: 587,
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
          to: 'team@company.com',
        },
      },
    }]
  ],
});
```

---

## Java setup (Selenium / RestAssured)

Add to `sarva-varadi.properties`:

```properties
sarva.notification.enabled=true

# Slack
sarva.notification.slack.enabled=true
sarva.notification.slack.webhook-url=${SLACK_WEBHOOK_URL}
sarva.notification.slack.channel=#test-results

# Teams
sarva.notification.teams.enabled=true
sarva.notification.teams.webhook-url=${TEAMS_WEBHOOK_URL}

# Email
sarva.notification.email.enabled=true
sarva.notification.email.host=smtp.gmail.com
sarva.notification.email.port=587
sarva.notification.email.user=${EMAIL_USER}
sarva.notification.email.pass=${EMAIL_PASS}
sarva.notification.email.to=team@company.com
```

---

## Getting webhook URLs

### Slack

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → Create New App → From scratch
2. Go to **Incoming Webhooks** → toggle ON → **Add New Webhook to Workspace**
3. Select channel → copy the webhook URL
4. Set `SLACK_WEBHOOK_URL` in your environment / CI secrets

### Microsoft Teams

1. In Teams, open the target channel → **...** → **Connectors** → search **Incoming Webhook** → Configure
2. Name it "Sarva-Varadi" → Create → copy the webhook URL
3. Set `TEAMS_WEBHOOK_URL` in your environment / CI secrets

### Email (Gmail)

1. Enable 2FA on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords) → Generate for "Mail"
3. Use the 16-character app password as `EMAIL_PASS`
4. Set `EMAIL_USER` (your Gmail address) and `EMAIL_PASS` in CI secrets

---

## CI secrets (GitHub Actions)

In your repo: **Settings → Secrets and variables → Actions → New repository secret**

Add: `SLACK_WEBHOOK_URL`, `TEAMS_WEBHOOK_URL`, `EMAIL_USER`, `EMAIL_PASS`

Then pass them to the job:

```yaml
env:
  SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
  TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
  EMAIL_USER: ${{ secrets.EMAIL_USER }}
  EMAIL_PASS: ${{ secrets.EMAIL_PASS }}
```

---

## What the notification includes

| Field | Value |
|-------|-------|
| Title | Report title + pass/fail status emoji |
| Pass rate | % and count |
| Failures | Count (if any) |
| Flaky | Count (if any) |
| Duration | Total run time |
| Report link | Direct link to the HTML report (if configured) |

Slack messages use rich block kit formatting. Teams messages use Adaptive Cards. Email uses an HTML template with matching styling.
