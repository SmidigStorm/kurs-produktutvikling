import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'e2e/steps/**/*.ts',
  // Attaches a prompt to failures containing the error, the steps up to the
  // failure, the code snippet and an ARIA snapshot of the page. This is why the
  // UI uses role/label locators rather than data-testid: test ids do not appear
  // in an ARIA snapshot, and the prompt tells the model to rely on it.
  aiFix: { promptAttachment: true },
});

export default defineConfig({
  testDir,
  reporter: [['list']],
  // One worker, deliberately. Every scenario talks to the same backend and the
  // same SQLite file, and each Background resets the queue — so two scenarios
  // in parallel delete each other's data mid-test. Sharding would need a
  // database per worker, which is more machinery than this suite is worth.
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
  // Playwright recommends testing every browser. We deliberately run only
  // Chromium: this is a teaching repo demonstrated on one machine, and every
  // extra browser is another download that can fail during pre-class setup.
  // Cross-browser coverage is a real concern for a real product, not for this.
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: [
    {
      command: 'npm run start -w backend',
      url: 'http://localhost:3001/api/queue',
      reuseExistingServer: false,
      env: {
        DB_FILE: 'data/test.sqlite',
        ALLOW_TEST_ROUTES: 'true',
        CLOCK_FIXED_AT: '2026-03-01T10:00:00.000Z',
      },
    },
    {
      command: 'npm run dev -w frontend',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
    },
  ],
});
