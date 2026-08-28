/**
 * The only place in production code allowed to read the real time.
 * Everything else takes a Clock, so no test depends on the wall clock.
 */
export type Clock = {
  now(): Date;
};

export type TestClock = Clock & {
  set(next: Date): void;
  advanceMinutes(minutes: number): void;
};

export const systemClock: Clock = {
  now: () => new Date(),
};

export function fixedClock(initial: Date): TestClock {
  let current = initial;

  return {
    now: () => new Date(current),
    set: (next: Date) => {
      current = next;
    },
    advanceMinutes: (minutes: number) => {
      current = new Date(current.getTime() + minutes * 60_000);
    },
  };
}
