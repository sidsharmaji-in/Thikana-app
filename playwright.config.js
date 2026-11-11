// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * GharDekho Playwright E2E Configuration
 * Tests Desktop Chrome and Mobile (Pixel 7 / iPhone 14) Viewports
 * Production Slice P5
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Sequential execution prevents race conditions on database/in-memory state
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10000,
    navigationTimeout: 15000
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: process.env.CI ? undefined : 'chrome',
        viewport: { width: 1280, height: 800 }
      }
    },
    {
      name: 'Mobile Pixel 7',
      use: {
        ...devices['Pixel 7'],
        channel: process.env.CI ? undefined : 'chrome'
      }
    }
  ],
  webServer: {
    command: 'node server/src/index.js',
    url: 'http://localhost:4000/api/health',
    reuseExistingServer: true,
    timeout: 30000
  }
});
