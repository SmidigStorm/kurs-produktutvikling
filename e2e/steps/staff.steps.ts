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
  // The first cell is the position. Asserting on the whole row would also
  // match the estimate: "15 min" contains "1".
  await expect(row.getByRole('cell').first()).toHaveText(String(position));
});

const consultationRoom = (page: Parameters<Parameters<typeof Then>[1]>[0]['page']) =>
  page.getByRole('status', { name: 'Consultation room' });

Then(
  'the consultation room shows {string}, {string}',
  async ({ page }, name: string, level: string) => {
    await expect(consultationRoom(page)).toContainText(name);
    await expect(consultationRoom(page)).toContainText(level);
  },
);

Then('the consultation room is shown as free', async ({ page }) => {
  await expect(consultationRoom(page)).toHaveText('Consultation room: free');
});
