import { NotificationData } from '../types';

export abstract class BaseNotifier {
  abstract send(data: NotificationData): Promise<void>;

  protected formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }

  protected getStatusEmoji(passRate: number): string {
    if (passRate >= 95) return '✅';
    if (passRate >= 80) return '⚠️';
    return '❌';
  }

  protected getTrendEmoji(current: number, previous?: number): string {
    if (!previous) return '';
    if (current > previous) return '▲';
    if (current < previous) return '▼';
    return '━';
  }
}
