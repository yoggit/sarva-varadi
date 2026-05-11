/**
 * Test script to verify Slack, Teams, and Email notifications
 *
 * Usage:
 * 1. Set environment variables for your webhook URLs and email credentials
 * 2. Run: node test-notifications.js
 *
 * Environment variables needed:
 * - SLACK_WEBHOOK_URL (optional)
 * - TEAMS_WEBHOOK_URL (optional)
 * - EMAIL_USER (optional - for email notifications)
 * - EMAIL_PASS (optional - for email notifications)
 */

const { NotificationManager } = require('./packages/core/dist/notifiers/notification-manager');

async function testNotifications() {
  console.log('\n🧪 Testing Sarva-Varadi Notification System\n');

  // Sample test data
  const testData = {
    summary: {
      id: 'test-run-2026-05-10',
      timestamp: Date.now(),
      duration: 125000, // 2m 5s
      total: 50,
      passed: 45,
      failed: 3,
      skipped: 1,
      flaky: 1,
      passRate: 90.0,
    },
    reportUrl: 'https://example.com/reports/latest/index.html',
    trendsUrl: 'https://example.com/reports/latest/trends.html',
    failedTests: [
      { name: 'Login flow - timeout after 30s', error: 'TimeoutError: Waiting for selector timed out' },
      { name: 'Checkout process - assertion failed', error: 'AssertionError: Expected "Success" but got "Error"' },
      { name: 'API integration test - network error', error: 'NetworkError: Failed to fetch' },
    ],
  };

  // Test Slack
  if (process.env.SLACK_WEBHOOK_URL) {
    console.log('📱 Testing Slack notification...');
    const slackManager = new NotificationManager({
      enabled: true,
      slack: {
        enabled: true,
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: '#test-results',
        mentionOnFailure: ['channel'], // or specific usernames
      },
    });

    try {
      await slackManager.notify(testData);
      console.log('✅ Slack notification sent successfully!\n');
    } catch (error) {
      console.error('❌ Slack notification failed:', error.message, '\n');
    }
  } else {
    console.log('⏭️  Skipping Slack (no SLACK_WEBHOOK_URL)\n');
  }

  // Test Teams
  if (process.env.TEAMS_WEBHOOK_URL) {
    console.log('💼 Testing Teams notification...');
    const teamsManager = new NotificationManager({
      enabled: true,
      teams: {
        enabled: true,
        webhookUrl: process.env.TEAMS_WEBHOOK_URL,
      },
    });

    try {
      await teamsManager.notify(testData);
      console.log('✅ Teams notification sent successfully!\n');
    } catch (error) {
      console.error('❌ Teams notification failed:', error.message, '\n');
    }
  } else {
    console.log('⏭️  Skipping Teams (no TEAMS_WEBHOOK_URL)\n');
  }

  // Test Email
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('📧 Testing Email notification...');
    const emailManager = new NotificationManager({
      enabled: true,
      email: {
        enabled: true,
        smtp: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        },
        from: process.env.EMAIL_USER,
        to: [process.env.EMAIL_USER], // Send to yourself for testing
        subject: '🧪 Test Notification - Sarva-Varadi',
      },
    });

    try {
      await emailManager.notify(testData);
      console.log('✅ Email notification sent successfully!\n');
    } catch (error) {
      console.error('❌ Email notification failed:', error.message, '\n');
    }
  } else {
    console.log('⏭️  Skipping Email (no EMAIL_USER or EMAIL_PASS)\n');
  }

  console.log('✨ Notification testing complete!\n');
  console.log('💡 To test notifications:');
  console.log('   1. Set environment variables (SLACK_WEBHOOK_URL, TEAMS_WEBHOOK_URL, etc.)');
  console.log('   2. Run: node test-notifications.js\n');
}

// Run the test
testNotifications().catch(console.error);
