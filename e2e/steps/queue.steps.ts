import { expect } from '@playwright/test';
import { API, Given, NOW, Then, When } from './fixtures';

Given('the clinic queue is empty', async ({ request, page }) => {
  await request.post(`${API}/api/test/reset`);
  // A controllable browser clock, so the refresh poll (REFRESH_MS) can be advanced
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
  // Advance just past the refresh interval rather than sleeping.
  await page.clock.fastForward('00:06');
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

/**
 * Puts a registered patient into the one consultation room through the API.
 * Registered twice so it reads as a Given ("is in consultation") and as a When
 * ("is called in"); it is the same event.
 */
async function callIn(
  request: Parameters<Parameters<typeof Given>[1]>[0]['request'],
  visitIds: Map<string, string>,
  name: string,
) {
  const id = visitIds.get(name);
  expect(id, `no visit registered for ${name}`).toBeTruthy();
  const response = await request.post(`${API}/api/visits/${id}/status`, {
    data: { status: 'IN_CONSULTATION' },
  });
  expect(response.ok(), `could not call ${name} in: ${response.status()}`).toBeTruthy();
}

Given('{string} is in consultation', async ({ request, visitIds }, name: string) => {
  await callIn(request, visitIds, name);
});

When('{string} is called in', async ({ request, visitIds }, name: string) => {
  await callIn(request, visitIds, name);
});

Then('they see {string}', async ({ page }, text: string) => {
  // The main region only, so text in the header can never satisfy this.
  await expect(page.getByRole('main')).toContainText(text);
});
