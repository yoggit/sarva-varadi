import { RunSummary } from './history';

export interface NotificationOptions {
  enabled?: boolean;
  slack?: SlackOptions;
  teams?: TeamsOptions;
  email?: EmailOptions;
}

export interface SlackOptions {
  enabled: boolean;
  webhookUrl: string;
  channel?: string;
  mentionOnFailure?: string[]; // @username
}

export interface TeamsOptions {
  enabled: boolean;
  webhookUrl: string;
}

export interface EmailOptions {
  enabled: boolean;
  smtp: {
    host: string;
    port: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  };
  from: string;
  to: string[];
  subject?: string;
  attachReport?: boolean;
}

export interface NotificationData {
  summary: RunSummary;
  reportUrl?: string;
  trendsUrl?: string;
  failedTests?: Array<{
    name: string;
    error: string;
  }>;
}
