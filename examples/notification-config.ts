import { defineConfig } from '@playwright/test';

// Example 1: Slack only
export const slackConfig = defineConfig({
  reporter: [
    ['@sarva-varadi/playwright', {
      outputFolder: 'sarva-report',
      title: 'My Test Report',

      notifications: {
        enabled: true,
        slack: {
          enabled: true,
          webhookUrl: process.env.SLACK_WEBHOOK_URL!,
          channel: '#test-results',
          mentionOnFailure: ['john.doe', 'jane.smith'], // Slack usernames
        },
      },
    }]
  ],
});

// Example 2: Teams only
export const teamsConfig = defineConfig({
  reporter: [
    ['@sarva-varadi/playwright', {
      notifications: {
        enabled: true,
        teams: {
          enabled: true,
          webhookUrl: process.env.TEAMS_WEBHOOK_URL!,
        },
      },
    }]
  ],
});

// Example 3: Email only (Gmail)
export const emailConfig = defineConfig({
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
              user: process.env.EMAIL_USER!,
              pass: process.env.EMAIL_PASS!, // Gmail App Password
            },
          },
          from: 'noreply@yourcompany.com',
          to: ['team@yourcompany.com', 'qa@yourcompany.com'],
          subject: 'Automated Test Results',
        },
      },
    }]
  ],
});

// Example 4: All notifications enabled
export const allNotificationsConfig = defineConfig({
  reporter: [
    ['@sarva-varadi/playwright', {
      outputFolder: 'sarva-report',
      title: 'E2E Test Results',

      notifications: {
        enabled: true,

        slack: {
          enabled: true,
          webhookUrl: process.env.SLACK_WEBHOOK_URL!,
          channel: '#test-results',
          mentionOnFailure: ['qa-team'],
        },

        teams: {
          enabled: true,
          webhookUrl: process.env.TEAMS_WEBHOOK_URL!,
        },

        email: {
          enabled: true,
          smtp: {
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
              user: process.env.EMAIL_USER!,
              pass: process.env.EMAIL_PASS!,
            },
          },
          from: 'tests@company.com',
          to: ['dev@company.com', 'qa@company.com'],
        },
      },
    }]
  ],
});

// Example 5: CI-only notifications
const isCI = !!process.env.CI;

export const ciOnlyConfig = defineConfig({
  reporter: [
    ['@sarva-varadi/playwright', {
      notifications: {
        enabled: isCI, // Only send in CI/CD
        slack: {
          enabled: isCI,
          webhookUrl: process.env.SLACK_WEBHOOK_URL!,
          channel: process.env.NODE_ENV === 'production' ? '#prod-alerts' : '#test-results',
        },
      },
    }]
  ],
});

// Example 6: SendGrid Email
export const sendgridConfig = defineConfig({
  reporter: [
    ['@sarva-varadi/playwright', {
      notifications: {
        enabled: true,
        email: {
          enabled: true,
          smtp: {
            host: 'smtp.sendgrid.net',
            port: 587,
            auth: {
              user: 'apikey',
              pass: process.env.SENDGRID_API_KEY!,
            },
          },
          from: 'noreply@yourcompany.com',
          to: ['team@yourcompany.com'],
        },
      },
    }]
  ],
});
