import { NotificationOptions } from './notifications';

export interface SarvaReporterOptions {
  outputFolder?: string;
  outputFile?: string;
  title?: string;
  showStackTrace?: boolean;
  embedAttachments?: boolean;
  maskSensitiveData?: boolean;

  history?: HistoryOptions;
  trends?: TrendsOptions;
  notifications?: NotificationOptions;
}

export interface HistoryOptions {
  enabled: boolean;
  maxRuns: number;
  retentionDays: number;
  trackPerTest: boolean;
}

export interface TrendsOptions {
  enabled: boolean;
  showInMainReport: boolean;
}

export const DEFAULT_OPTIONS: Required<SarvaReporterOptions> = {
  outputFolder: 'sarva-report',
  outputFile: 'index.html',
  title: 'Sarva-Varadi Test Report',
  showStackTrace: true,
  embedAttachments: true,
  maskSensitiveData: false,
  history: {
    enabled: true,
    maxRuns: 20,
    retentionDays: 90,
    trackPerTest: true,
  },
  trends: {
    enabled: true,
    showInMainReport: true,
  },
  notifications: {
    enabled: false,
  },
};
