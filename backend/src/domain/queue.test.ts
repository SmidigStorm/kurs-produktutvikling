import { describe, expect, it } from 'vitest';
import type { TriageLevel } from 'contract';
import { annotateQueue, estimatedWaitMinutes, orderQueue, positionOf, roomIsFree, type WaitingVisit } from './queue.ts';

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

describe('annotateQueue', () => {
  it.each([
    [undefined, 0],
    [null, 0],
    [{ level: 'RED' as const }, 30],
  ])('sorts and annotates the whole queue with occupant %j', (occupant, offset) => {
    const queue = [
      { ...visit('second', 'GREEN', '09:05'), patientName: 'Second' },
      { ...visit('first', 'GREEN', '09:00'), patientName: 'First' },
      { ...visit('urgent', 'RED', '09:30'), patientName: 'Urgent' },
    ];
    const before = structuredClone(queue);

    expect(orderQueue(queue).map((entry) => entry.patientName)).toEqual(['Urgent', 'First', 'Second']);
    expect(annotateQueue(queue, occupant).map((entry) => ({
      name: entry.patientName,
      position: entry.position,
      wait: entry.estimatedWaitMinutes,
    }))).toEqual([
      { name: 'Urgent', position: 1, wait: offset },
      { name: 'First', position: 2, wait: offset + 30 },
      { name: 'Second', position: 3, wait: offset + 45 },
    ]);
    expect(queue).toEqual(before);
  });

  it('returns no entries when only the room is occupied', () => {
    expect(annotateQueue([], { level: 'RED' })).toEqual([]);
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

describe('estimatedWaitMinutes with a patient in the consultation room', () => {
  it('counts the occupant as ahead of the patient at the front', () => {
    expect(estimatedWaitMinutes([visit('a', 'GREEN', '09:00')], 'a', { level: 'GREEN' })).toBe(15);
  });

  it('adds the occupant average, at the occupant level, to everyone waiting', () => {
    const queue = [
      visit('red', 'RED', '09:30'),
      visit('green-first', 'GREEN', '09:00'),
      visit('green-second', 'GREEN', '09:05'),
    ];

    expect(estimatedWaitMinutes(queue, 'green-second', { level: 'RED' })).toBe(75);
  });

  it('changes nothing when the room is free', () => {
    const queue = [visit('a', 'GREEN', '09:00'), visit('b', 'GREEN', '09:05')];

    expect(estimatedWaitMinutes(queue, 'b', null)).toBe(15);
  });
});

describe('roomIsFree', () => {
  it('is free when there are no visits', () => {
    expect(roomIsFree([])).toBe(true);
  });

  it('is free when the patient who was in the room is done', () => {
    expect(roomIsFree([{ status: 'DONE' }, { status: 'WAITING' }])).toBe(true);
  });

  it('is taken while a patient is in consultation', () => {
    expect(roomIsFree([{ status: 'WAITING' }, { status: 'IN_CONSULTATION' }])).toBe(false);
  });
});
