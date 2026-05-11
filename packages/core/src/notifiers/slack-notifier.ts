import { BaseNotifier } from './base-notifier';
import { NotificationData, SlackOptions } from '../types';

export class SlackNotifier extends BaseNotifier {
  constructor(private options: SlackOptions) {
    super();
  }

  async send(data: NotificationData): Promise<void> {
    const { summary, reportUrl, failedTests } = data;

    const statusEmoji = this.getStatusEmoji(summary.passRate);
    const duration = this.formatDuration(summary.duration);

    const mentions = summary.failed > 0 && this.options.mentionOnFailure
      ? this.options.mentionOnFailure.map(u => `<@${u}>`).join(' ')
      : '';

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${statusEmoji} Test Results`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Total:*\n${summary.total}` },
          { type: 'mrkdwn', text: `*Pass Rate:*\n${summary.passRate}%` },
          { type: 'mrkdwn', text: `*Passed:*\n✅ ${summary.passed}` },
          { type: 'mrkdwn', text: `*Failed:*\n❌ ${summary.failed}` },
        ],
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Duration:*\n${duration}` },
          { type: 'mrkdwn', text: `*Skipped:*\n⏭️ ${summary.skipped}` },
        ],
      },
    ];

    if (summary.flaky > 0) {
      blocks[2].fields.push({
        type: 'mrkdwn',
        text: `*Flaky:*\n⚠️ ${summary.flaky}`,
      });
    }

    if (failedTests && failedTests.length > 0) {
      const failedList = failedTests
        .slice(0, 5)
        .map(t => `• ${t.name}`)
        .join('\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Failed Tests:*\n${failedList}${failedTests.length > 5 ? `\n_...and ${failedTests.length - 5} more_` : ''}`,
        },
      });
    }

    if (reportUrl) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '📊 View Full Report' },
            url: reportUrl,
            style: 'primary',
          },
        ],
      });
    }

    const payload: any = {
      blocks,
    };

    if (this.options.channel) {
      payload.channel = this.options.channel;
    }

    if (mentions) {
      payload.text = mentions;
    }

    await this.postToSlack(payload);
  }

  private async postToSlack(payload: any): Promise<void> {
    try {
      const response = await fetch(this.options.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Failed to send Slack notification:', response.statusText);
      } else {
        console.log('✅ Slack notification sent');
      }
    } catch (error) {
      console.error('Error sending Slack notification:', error);
    }
  }
}
