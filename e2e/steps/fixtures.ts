import { test as base, createBdd } from 'playwright-bdd';

export const API = 'http://localhost:3001';

/** Matches CLOCK_FIXED_AT in playwright.config.ts. */
export const NOW = new Date('2026-03-01T10:00:00.000Z');

type Fixtures = {
  /** Maps a patient's first name to the visit id created for them. */
  visitIds: Map<string, string>;
};

export const test = base.extend<Fixtures>({
  visitIds: async ({}, use) => {
    await use(new Map());
  },
});

export const { Given, When, Then } = createBdd(test);
