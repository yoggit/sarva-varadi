import { BaseNotifier } from './base-notifier';
import { NotificationData, TeamsOptions } from '../types';

export class TeamsNotifier extends BaseNotifier {
  constructor(private options: TeamsOptions) {
    super();
  }

  async send(data: NotificationData): Promise<void> {
    const { summary, reportUrl, failedTests } = data;

    const statusEmoji = this.getStatusEmoji(summary.passRate);
    const duration = this.formatDuration(summary.duration);

    const facts: Array<{ title: string; value: string }> = [
      { title: 'Total Tests', value: summary.total.toString() },
      { title: 'Pass Rate', value: `${summary.passRate}%` },
      { title: 'Passed', value: `✅ ${summary.passed}` },
      { title: 'Failed', value: `❌ ${summary.failed}` },
      { title: 'Skipped', value: `⏭️ ${summary.skipped}` },
      { title: 'Duration', value: duration },
    ];

    if (summary.flaky > 0) {
      facts.push({ title: 'Flaky', value: `⚠️ ${summary.flaky}` });
    }

    const sections: any[] = [
      {
        activityTitle: `${statusEmoji} Test Results`,
        activitySubtitle: new Date(summary.timestamp).toLocaleString(),
        facts,
      },
    ];

    if (failedTests && failedTests.length > 0) {
      const failedText = failedTests
        .slice(0, 5)
        .map(t => `- ${t.name}`)
        .join('\n');

      sections.push({
        text: `**Failed Tests:**\n\n${failedText}${failedTests.length > 5 ? `\n\n_...and ${failedTests.length - 5} more_` : ''}`,
      });
    }

    const card: any = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: 'Test Results',
      themeColor: summary.passRate >= 95 ? '00FF00' : summary.passRate >= 80 ? 'FFA500' : 'FF0000',
      sections,
    };

    if (reportUrl) {
      card.potentialAction = [
        {
          '@type': 'OpenUri',
          name: '📊 View Full Report',
          targets: [{ os: 'default', uri: reportUrl }],
        },
      ];
    }

    await this.postToTeams(card);
  }

  private async postToTeams(card: any): Promise<void> {
    try {
      const response = await fetch(this.options.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card),
      });

      if (!response.ok) {
        console.error('Failed to send Teams notification:', response.statusText);
      } else {
        console.log('✅ Teams notification sent');
      }
    } catch (error) {
      console.error('Error sending Teams notification:', error);
    }
  }
}
