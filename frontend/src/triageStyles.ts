import type { TriageLevel } from 'contract';

/**
 * How each triage level is painted. Keyed by TriageLevel, so adding a level to
 * the contract is a type error here until it is given a colour — the vocabulary
 * and its presentation cannot drift apart.
 *
 * Class strings are written out in full rather than composed, because Tailwind
 * scans source for literal class names; a template-built class would not exist.
 */
export const TRIAGE_CHIP: Record<TriageLevel, string> = {
  RED: 'bg-triage-red text-white',
  ORANGE: 'bg-triage-orange-soft text-triage-orange-ink',
  YELLOW: 'bg-triage-yellow-soft text-triage-yellow-ink',
  GREEN: 'bg-triage-green-soft text-triage-green-ink',
  BLUE: 'bg-triage-blue-soft text-triage-blue-ink',
};
