export type TestStatus = 'passed' | 'failed' | 'broken' | 'skipped' | 'flaky';
export type TestStage = 'scheduled' | 'running' | 'finished' | 'interrupted';
export type TestTool = 'playwright' | 'selenium' | 'cypress' | 'rest-assured' | 'junit' | 'testng' | 'cucumber';

export interface SarvaTestResult {
  uuid: string;
  tool: TestTool;
  name: string;
  fullName: string;
  status: TestStatus;
  statusDetails?: {
    message?: string;
    trace?: string;
  };
  stage: TestStage;
  start: number;
  stop: number;
  duration: number;

  steps: TestStep[];
  attachments: Attachment[];

  parameters?: Parameter[];
  labels?: Label[];
  links?: Link[];

  extra?: ToolSpecificData;
}

export interface TestStep {
  name: string;
  status: TestStatus;
  start: number;
  stop: number;
  duration: number;
  steps?: TestStep[];
  attachments?: Attachment[];
}

export interface Attachment {
  name: string;
  type: string;
  source: string;
  contentType?: string;
}

export interface Parameter {
  name: string;
  value: string;
}

export interface Label {
  name: string;
  value: string;
}

export interface Link {
  name: string;
  url: string;
  type?: string;
}

export interface ToolSpecificData {
  playwright?: {
    traceFile?: string;
    project?: string;
    browser?: string;
    retries?: number;
  };
  selenium?: {
    retries?: number;
    browser?: {
      name?: string;
      version?: string;
      platform?: string;
    };
    browserName?: string;
    browserVersion?: string;
    platformName?: string;
    seleniumVersion?: string;
    driverLogs?: string;
  };
  cypress?: {
    specFile?: string;
    timeTravel?: boolean;
  };
  restAssured?: {
    method?: string;
    endpoint?: string;
    statusCode?: number;
    request?: any;
    response?: any;
    retries?: number;
  };
  // For converters
  systemOut?: string;
  systemErr?: string;
  parameters?: Array<{ name: string; value: string }>;
  scenarioType?: string;
  [key: string]: any; // Allow additional properties
}

export interface TestSuite {
  name: string;
  children: (TestSuite | SarvaTestResult)[];
}

export interface RunMetadata {
  id: string;
  tool: TestTool;
  timestamp: number;
  duration: number;
  environment?: {
    branch?: string;
    commit?: string;
    ci?: string;
    os?: string;
    node?: string;
  };
}
