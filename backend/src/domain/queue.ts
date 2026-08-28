import type { TriageLevel } from 'contract';
import { AVERAGE_CONSULTATION_MINUTES, TRIAGE_PRIORITY } from './triage.js';

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

/**
 * Sum of the average consultation minutes of every patient ahead of you, using
 * each of those patients' own triage level. One consultation room.
 * A definition, not a prediction: the same queue always gives the same number.
 */
export function estimatedWaitMinutes(visits: WaitingVisit[], visitId: string): number | null {
  const ordered = orderQueue(visits);
  const index = ordered.findIndex((v) => v.id === visitId);
  if (index === -1) return null;

  return ordered
    .slice(0, index)
    .reduce((total, ahead) => total + AVERAGE_CONSULTATION_MINUTES[ahead.level], 0);
}
