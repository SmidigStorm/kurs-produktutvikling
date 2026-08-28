import { describe, expect, it } from 'vitest';
import { TRIAGE_LEVELS } from 'contract';
import { AVERAGE_CONSULTATION_MINUTES, TRIAGE_PRIORITY } from './triage.ts';

describe('triage levels', () => {
  it('orders RED as the most urgent and BLUE as the least', () => {
    expect(TRIAGE_PRIORITY.RED).toBeLessThan(TRIAGE_PRIORITY.BLUE);
  });

  it('gives every level a priority and an average consultation length', () => {
    for (const level of TRIAGE_LEVELS) {
      expect(TRIAGE_PRIORITY[level]).toBeTypeOf('number');
      expect(AVERAGE_CONSULTATION_MINUTES[level]).toBeGreaterThan(0);
    }
  });
});
