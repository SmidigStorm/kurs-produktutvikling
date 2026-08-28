import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { TRIAGE_LEVELS, VISIT_STATUSES } from 'contract';

/**
 * A single visit to the legevakt. The fictional patient name is the only
 * personal field: this app deliberately holds no clinical content.
 */
export const visits = sqliteTable('visits', {
  id: text('id').primaryKey(),
  patientName: text('patient_name').notNull(),
  level: text('level', { enum: TRIAGE_LEVELS }).notNull(),
  status: text('status', { enum: VISIT_STATUSES }).notNull().default('WAITING'),
  // timestamp_ms, not timestamp: second resolution produces arrival-time ties
  // in a queue ordered by arrival within a level.
  arrivedAt: integer('arrived_at', { mode: 'timestamp_ms' }).notNull(),
});

/** History of triage level changes. Needed by the queue-aging amendment. */
export const triageEvents = sqliteTable('triage_events', {
  id: text('id').primaryKey(),
  visitId: text('visit_id')
    .notNull()
    .references(() => visits.id),
  fromLevel: text('from_level', { enum: TRIAGE_LEVELS }),
  toLevel: text('to_level', { enum: TRIAGE_LEVELS }).notNull(),
  occurredAt: integer('occurred_at', { mode: 'timestamp_ms' }).notNull(),
});
