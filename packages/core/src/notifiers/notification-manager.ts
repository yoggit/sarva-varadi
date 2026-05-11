import { NotificationOptions, NotificationData, SarvaTestResult } from '../types';
import { SlackNotifier } from './slack-notifier';
import { TeamsNotifier } from './teams-notifier';
import { EmailNotifier } from './email-notifier';

export class NotificationManager {
  constructor(private options: NotificationOptions) {}

  async notify(data: NotificationData): Promise<void> {
    if (!this.options.enabled) return;

    const promises: Promise<void>[] = [];

    if (this.options.slack?.enabled && this.options.slack.webhookUrl) {
      const notifier = new SlackNotifier(this.options.slack);
      promises.push(notifier.send(data));
    }

    if (this.options.teams?.enabled && this.options.teams.webhookUrl) {
      const notifier = new TeamsNotifier(this.options.teams);
      promises.push(notifier.send(data));
    }

    if (this.options.email?.enabled) {
      const notifier = new EmailNotifier(this.options.email);
      promises.push(notifier.send(data));
    }

    await Promise.allSettled(promises);
  }
}
