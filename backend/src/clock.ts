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

/**
 * A clock that runs at a chosen multiple of real time, for the simulator: at
 * speed 60, one real second is one simulated minute. Pausing holds it still.
 * Changing the speed or pausing re-anchors first, so the time never jumps.
 */
export type ScaledClock = Clock & {
  speed(): number;
  setSpeed(next: number): void;
  running(): boolean;
  setRunning(next: boolean): void;
};

export function scaledClock(
  start: Date,
  initialSpeed: number,
  realNow: () => number = Date.now,
): ScaledClock {
  let anchorSim = start.getTime();
  let anchorReal = realNow();
  let speed = initialSpeed;
  let running = true;

  const current = () => (running ? anchorSim + (realNow() - anchorReal) * speed : anchorSim);
  const reanchor = () => {
    anchorSim = current();
    anchorReal = realNow();
  };

  return {
    now: () => new Date(current()),
    speed: () => speed,
    setSpeed: (next) => {
      reanchor();
      speed = next;
    },
    running: () => running,
    setRunning: (next) => {
      reanchor();
      running = next;
    },
  };
}
