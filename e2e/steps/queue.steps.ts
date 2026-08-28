import { expect } from '@playwright/test';
import { API, Given, NOW, Then, When } from './fixtures';

Given('the clinic queue is empty', async ({ request, page }) => {
  await request.post(`${API}/api/test/reset`);
  // A controllable browser clock, so the 15-second poll can be advanced
  // deliberately instead of waited out. Must be installed before navigation.
  await page.clock.install();
});

Given(
  '{string} arrived {int} minutes ago with triage level {string}',
  async ({ request, visitIds }, name: string, minutesAgo: number, level: string) => {
    await request.post(`${API}/api/test/clock`, {
      data: { now: new Date(NOW.getTime() - minutesAgo * 60_000).toISOString() },
    });

    const created = await request.post(`${API}/api/visits`, {
      data: { patientName: name, level },
    });
    const { id } = await created.json();
    visitIds.set(name, id);

    await request.post(`${API}/api/test/clock`, { data: { now: NOW.toISOString() } });
  },
);

When(
  '{string} arrives now with triage level {string}',
  async ({ request, visitIds }, name: string, level: string) => {
    const created = await request.post(`${API}/api/visits`, {
      data: { patientName: name, level },
    });
    const { id } = await created.json();
    visitIds.set(name, id);
  },
);

When('the page refreshes itself', async ({ page }) => {
  // Advance past the 15s poll rather than sleeping.
  await page.clock.fastForward('00:16');
});

When('{string} opens their queue view', async ({ page, visitIds }, name: string) => {
  const id = visitIds.get(name);
  expect(id, `no visit registered for ${name}`).toBeTruthy();
  await page.goto(`/#/visit/${id}`);
});

Then('they see position {int}', async ({ page }, expected: number) => {
  await expect(page.getByRole('status', { name: 'Queue position' })).toContainText(
    `number ${expected} in the queue`,
  );
});

Then('they see an estimated wait of {int} minutes', async ({ page }, expected: number) => {
  await expect(page.getByRole('status', { name: 'Estimated wait' })).toContainText(
    `${expected} minutes`,
  );
});
