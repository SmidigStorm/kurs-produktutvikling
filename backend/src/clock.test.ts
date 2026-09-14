import { describe, expect, it } from 'vitest';
import { fixedClock, scaledClock } from './clock.ts';

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

describe('scaledClock', () => {
  const start = new Date('2026-03-01T10:00:00.000Z');

  const realTime = () => {
    let real = 1_000_000;
    return { now: () => real, advanceSeconds: (s: number) => (real += s * 1000) };
  };

  it('starts at the given instant', () => {
    const real = realTime();
    expect(scaledClock(start, 60, real.now).now().toISOString()).toBe(start.toISOString());
  });

  it('moves one simulated minute per real second at speed 60', () => {
    const real = realTime();
    const clock = scaledClock(start, 60, real.now);

    real.advanceSeconds(3);

    expect(clock.now().toISOString()).toBe('2026-03-01T10:03:00.000Z');
  });

  it('changes rate from the moment the speed changes, without jumping', () => {
    const real = realTime();
    const clock = scaledClock(start, 60, real.now);
    real.advanceSeconds(1);

    clock.setSpeed(120);
    real.advanceSeconds(1);

    expect(clock.now().toISOString()).toBe('2026-03-01T10:03:00.000Z');
  });

  it('holds still while paused and continues from there', () => {
    const real = realTime();
    const clock = scaledClock(start, 60, real.now);
    real.advanceSeconds(1);

    clock.setRunning(false);
    real.advanceSeconds(10);
    expect(clock.now().toISOString()).toBe('2026-03-01T10:01:00.000Z');

    clock.setRunning(true);
    real.advanceSeconds(1);
    expect(clock.now().toISOString()).toBe('2026-03-01T10:02:00.000Z');
  });
});
