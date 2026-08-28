import { describe, expect, it } from 'vitest';
import { fixedClock } from './clock.ts';

describe('fixedClock', () => {
  it('always returns the time it was created with', () => {
    const clock = fixedClock(new Date('2026-03-01T09:00:00.000Z'));

    expect(clock.now().toISOString()).toBe('2026-03-01T09:00:00.000Z');
    expect(clock.now().toISOString()).toBe('2026-03-01T09:00:00.000Z');
  });

  it('moves when advanced', () => {
    const clock = fixedClock(new Date('2026-03-01T09:00:00.000Z'));

    clock.advanceMinutes(90);

    expect(clock.now().toISOString()).toBe('2026-03-01T10:30:00.000Z');
  });

  it('can be set to an explicit time', () => {
    const clock = fixedClock(new Date('2026-03-01T09:00:00.000Z'));

    clock.set(new Date('2026-03-02T12:00:00.000Z'));

    expect(clock.now().toISOString()).toBe('2026-03-02T12:00:00.000Z');
  });
});
