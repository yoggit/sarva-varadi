/**
 * Local notification test - Shows what payloads would be sent
 * No real webhooks needed - just displays the JSON that would be posted
 */

const { SlackNotifier } = require('./packages/core/dist/notifiers/slack-notifier');
const { TeamsNotifier } = require('./packages/core/dist/notifiers/teams-notifier');

// Sample test data
const testData = {
  summary: {
    id: 'test-run-2026-05-11',
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
    { name: 'Login flow - timeout after 30s', error: 'TimeoutError' },
    { name: 'Checkout process - assertion failed', error: 'AssertionError' },
    { name: 'API integration test - network error', error: 'NetworkError' },
  ],
};

console.log('🧪 Sarva-Varadi Notification Payload Test\n');
console.log('=' .repeat(70));

// Test Slack payload
console.log('\n📱 SLACK PAYLOAD:\n');
console.log('-'.repeat(70));

const slackNotifier = new SlackNotifier({
  enabled: true,
  webhookUrl: 'https://hooks.slack.com/services/DUMMY/WEBHOOK/URL',
  channel: '#test-results',
  mentionOnFailure: ['john.doe'],
});

// Mock the postToSlack method to capture payload
const originalSlackPost = slackNotifier.postToSlack;
slackNotifier.postToSlack = async function(payload) {
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n✅ This would be sent to Slack webhook\n');
};

slackNotifier.send(testData).catch(console.error);

// Wait a bit then test Teams
setTimeout(() => {
  console.log('=' .repeat(70));
  console.log('\n💼 MICROSOFT TEAMS PAYLOAD:\n');
  console.log('-'.repeat(70));

  const teamsNotifier = new TeamsNotifier({
    enabled: true,
    webhookUrl: 'https://outlook.office.com/webhook/DUMMY/WEBHOOK/URL',
  });

  // Mock the postToTeams method to capture payload
  const originalTeamsPost = teamsNotifier.postToTeams;
  teamsNotifier.postToTeams = async function(payload) {
    console.log(JSON.stringify(payload, null, 2));
    console.log('\n✅ This would be sent to Teams webhook\n');
  };

  teamsNotifier.send(testData).catch(console.error);

  setTimeout(() => {
    console.log('=' .repeat(70));
    console.log('\n✨ Test Complete!\n');
    console.log('💡 What this shows:');
    console.log('   - Slack: Rich block formatting with stats and failed tests');
    console.log('   - Teams: Adaptive card with facts and color coding');
    console.log('   - Both include pass rate, duration, and report links\n');
  }, 100);
}, 100);
