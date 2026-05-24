import { NotificationOptions } from './notifications';

export interface SarvaReporterOptions {
  outputFolder?: string;
  outputFile?: string;
  title?: string;
  frameworkLabel?: string; // e.g. "Selenium-TestNG", "RestAssured-Cucumber BDD" — shown below "Test Report"
  environment?: string;   // e.g. "QA", "Staging", "Production" — shown as a badge in the report
  showStackTrace?: boolean;
  embedAttachments?: boolean;
  maskSensitiveData?: boolean;

  history?: HistoryOptions;
  trends?: TrendsOptions;
  notifications?: NotificationOptions;
  links?: LinksOptions;
}

export interface LinksOptions {
  issue?: string;   // URL pattern with {id} placeholder, e.g. "https://jira.company.com/browse/{id}"
  tms?: string;     // URL pattern with {id} placeholder, e.g. "https://jira.company.com/browse/{id}"
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
  frameworkLabel: '',
  environment: '',
  showStackTrace: true,
  embedAttachments: true,
  maskSensitiveData: false,
  history: {
    enabled: true,
    maxRuns: 30,
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
  links: {},
};
