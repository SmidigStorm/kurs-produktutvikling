import { expect } from '@playwright/test';
import { Given, Then, When } from './fixtures';

/**
 * These steps drive the staff table through its per-row accessible names —
 * "Triage level for Kari", "Mark Kari done". That is deliberate: those labels
 * are what make each row's controls individually addressable, and nothing else
 * in the suite asserts they exist. A redesign that drops them, or that makes
 * every row's button say only "Done", turns these scenarios red.
 */

Given('staff open the queue', async ({ page }) => {
  await page.goto('/');
});

When(
  'staff register {string} with triage level {string}',
  async ({ page }, name: string, level: string) => {
    await page.getByLabel('Patient name').fill(name);
    await page.getByLabel('Triage level', { exact: true }).selectOption(level);
    await page.getByRole('button', { name: 'Register arrival' }).click();
  },
);

When('staff re-triage {string} to {string}', async ({ page }, name: string, level: string) => {
  await page.getByLabel(`Triage level for ${name}`).selectOption(level);
});

When('staff mark {string} as done', async ({ page }, name: string) => {
  await page.getByRole('button', { name: `Mark ${name} done` }).click();
});

Then('the queue shows {string} at position {int}', async ({ page }, name: string, position: number) => {
  const row = page.getByRole('row').filter({ hasText: name });
  await expect(row).toContainText(String(position));
});
