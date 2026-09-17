import type { TriageLevel, VisitStatus } from 'contract';
import { AVERAGE_CONSULTATION_MINUTES, TRIAGE_PRIORITY } from './triage.ts';

export type WaitingVisit = {
  id: string;
  level: TriageLevel;
  arrivedAt: Date;
};

/**
 * The queue invariant: triage level first, then arrival time within a level.
 * Pure and total — never reads the clock, never touches the database.
 */
export function orderQueue<T extends WaitingVisit>(visits: readonly T[]): T[] {
  return [...visits].sort((a, b) => {
    const byLevel = TRIAGE_PRIORITY[a.level] - TRIAGE_PRIORITY[b.level];
    if (byLevel !== 0) return byLevel;
    return a.arrivedAt.getTime() - b.arrivedAt.getTime();
  });
}

/** Your 1-based place in the whole queue, across all triage levels. */
export function positionOf(visits: WaitingVisit[], visitId: string): number | null {
  return annotateQueue(visits).find((v) => v.id === visitId)?.position ?? null;
}

/** The patient in the one consultation room. Only the level matters here. */
export type RoomOccupant = { level: TriageLevel };

/**
 * Sum of the average consultation minutes of every patient ahead of you, using
 * each of those patients' own triage level. One consultation room, and whoever
 * is in it is ahead of everyone waiting, counted at their level's full average.
 * A definition, not a prediction: the same queue always gives the same number.
 */
export function annotateQueue<T extends WaitingVisit>(
  visits: readonly T[],
  occupant?: RoomOccupant | null,
): (T & { position: number; estimatedWaitMinutes: number })[] {
  let wait = occupant ? AVERAGE_CONSULTATION_MINUTES[occupant.level] : 0;
  return orderQueue(visits).map((visit, index) => {
    const entry = { ...visit, position: index + 1, estimatedWaitMinutes: wait };
    wait += AVERAGE_CONSULTATION_MINUTES[visit.level];
    return entry;
  });
}

export function estimatedWaitMinutes(
  visits: WaitingVisit[],
  visitId: string,
  occupant?: RoomOccupant | null,
): number | null {
  return annotateQueue(visits, occupant).find((v) => v.id === visitId)?.estimatedWaitMinutes ?? null;
}

/** One room: it is free while no visit is in consultation. */
export function roomIsFree(visits: { status: VisitStatus }[]): boolean {
  return !visits.some((v) => v.status === 'IN_CONSULTATION');
}
