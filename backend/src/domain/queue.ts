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
export function orderQueue(visits: WaitingVisit[]): WaitingVisit[] {
  return [...visits].sort((a, b) => {
    const byLevel = TRIAGE_PRIORITY[a.level] - TRIAGE_PRIORITY[b.level];
    if (byLevel !== 0) return byLevel;
    return a.arrivedAt.getTime() - b.arrivedAt.getTime();
  });
}

/** Your 1-based place in the whole queue, across all triage levels. */
export function positionOf(visits: WaitingVisit[], visitId: string): number | null {
  const index = orderQueue(visits).findIndex((v) => v.id === visitId);
  return index === -1 ? null : index + 1;
}

/** The patient in the one consultation room. Only the level matters here. */
export type RoomOccupant = { level: TriageLevel };

/**
 * Sum of the average consultation minutes of every patient ahead of you, using
 * each of those patients' own triage level. One consultation room, and whoever
 * is in it is ahead of everyone waiting, counted at their level's full average.
 * A definition, not a prediction: the same queue always gives the same number.
 */
export function estimatedWaitMinutes(
  visits: WaitingVisit[],
  visitId: string,
  occupant?: RoomOccupant | null,
): number | null {
  const ordered = orderQueue(visits);
  const index = ordered.findIndex((v) => v.id === visitId);
  if (index === -1) return null;

  const ahead = ordered
    .slice(0, index)
    .reduce((total, v) => total + AVERAGE_CONSULTATION_MINUTES[v.level], 0);

  return occupant ? ahead + AVERAGE_CONSULTATION_MINUTES[occupant.level] : ahead;
}

/** One room: it is free while no visit is in consultation. */
export function roomIsFree(visits: { status: VisitStatus }[]): boolean {
  return !visits.some((v) => v.status === 'IN_CONSULTATION');
}
