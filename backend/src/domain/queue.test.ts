import { describe, expect, it } from 'vitest';
import type { TriageLevel } from 'contract';
import { estimatedWaitMinutes, orderQueue, positionOf, type WaitingVisit } from './queue.ts';

const at = (hhmm: string): Date => new Date(`2026-03-01T${hhmm}:00.000Z`);

const visit = (id: string, level: TriageLevel, time: string): WaitingVisit => ({
  id,
  level,
  arrivedAt: at(time),
});

describe('orderQueue', () => {
  it('puts a more urgent patient ahead of a less urgent one who arrived earlier', () => {
    const queue = [visit('green-early', 'GREEN', '09:00'), visit('red-late', 'RED', '09:30')];

    expect(orderQueue(queue).map((v) => v.id)).toEqual(['red-late', 'green-early']);
  });

  it('orders patients at the same level by arrival time', () => {
    const queue = [visit('second', 'GREEN', '09:05'), visit('first', 'GREEN', '09:00')];

    expect(orderQueue(queue).map((v) => v.id)).toEqual(['first', 'second']);
  });

  it('does not mutate the input array', () => {
    const queue = [visit('b', 'GREEN', '09:05'), visit('a', 'RED', '09:00')];
    const before = queue.map((v) => v.id);

    orderQueue(queue);

    expect(queue.map((v) => v.id)).toEqual(before);
  });
});

describe('positionOf', () => {
  it('is 1 for the patient at the front of the queue', () => {
    const queue = [visit('a', 'GREEN', '09:00'), visit('b', 'GREEN', '09:05')];

    expect(positionOf(queue, 'a')).toBe(1);
  });

  it('counts across all triage levels, not within a level', () => {
    const queue = [
      visit('red', 'RED', '09:30'),
      visit('green-first', 'GREEN', '09:00'),
      visit('green-second', 'GREEN', '09:05'),
    ];

    expect(positionOf(queue, 'green-second')).toBe(3);
  });

  it('returns null for a visit that is not in the queue', () => {
    expect(positionOf([visit('a', 'GREEN', '09:00')], 'nobody')).toBeNull();
  });
});

describe('estimatedWaitMinutes', () => {
  it('is 0 for the patient at the front', () => {
    expect(estimatedWaitMinutes([visit('a', 'GREEN', '09:00')], 'a')).toBe(0);
  });

  it('sums the average consultation time of everyone ahead, using their level', () => {
    const queue = [
      visit('red', 'RED', '09:30'),
      visit('green-first', 'GREEN', '09:00'),
      visit('green-second', 'GREEN', '09:05'),
    ];

    expect(estimatedWaitMinutes(queue, 'green-second')).toBe(45);
  });

  it('returns null for a visit that is not in the queue', () => {
    expect(estimatedWaitMinutes([], 'nobody')).toBeNull();
  });
});
