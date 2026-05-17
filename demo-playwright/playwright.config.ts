import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 1,
  workers: 2,

  reporter: [
    ['list'],
    ['../packages/playwright/dist/index.js', {
      outputFolder: 'sarva-report',
      outputFile: 'index.html',
      title: 'Sarva-Varadi - Playwright Report',
      history: {
        enabled: true,
        maxRuns: 180,
        retentionDays: 90,
        trackPerTest: true,
      },
      trends: {
        enabled: true,
        showInMainReport: true,
      },
    }]
  ],

  use: {
    baseURL: 'https://playwright.dev',
    screenshot: 'on',
    video: 'on',
    trace: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
    // Uncomment below to enable additional browsers
    // {
    //   name: 'webkit',
    //   use: { browserName: 'webkit' },
    // },
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     browserName: 'chromium',
    //     ...devices['Pixel 5'],
    //   },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: {
    //     browserName: 'webkit',
    //     ...devices['iPhone 12'],
    //   },
    // },
  ],
});
