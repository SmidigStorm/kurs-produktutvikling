import { z } from 'zod';

/**
 * The domain vocabulary, declared once. This array feeds the TypeScript union,
 * the Drizzle column definition, the request validators and the UI's options.
 * Never re-declare these values anywhere else.
 */
export const TRIAGE_LEVELS = ['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE'] as const;
export type TriageLevel = (typeof TRIAGE_LEVELS)[number];

export const VISIT_STATUSES = ['WAITING', 'IN_CONSULTATION', 'DONE', 'LEFT'] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

export const triageLevelSchema = z.enum(TRIAGE_LEVELS);
export const visitStatusSchema = z.enum(VISIT_STATUSES);

export const registerArrivalSchema = z.object({
  patientName: z.string().min(1),
  level: triageLevelSchema,
});

export const retriageSchema = z.object({ level: triageLevelSchema });

export const changeStatusSchema = z.object({ status: visitStatusSchema });

export const queueEntrySchema = z.object({
  id: z.string(),
  patientName: z.string(),
  level: triageLevelSchema,
  position: z.number().int().positive(),
  estimatedWaitMinutes: z.number().int().nonnegative(),
});

/** The one patient in the consultation room, or null when it is free. */
export const roomOccupantSchema = z.object({
  id: z.string(),
  patientName: z.string(),
  level: triageLevelSchema,
});

export const queueResponseSchema = z.object({
  now: z.string(),
  entries: z.array(queueEntrySchema),
  inConsultation: roomOccupantSchema.nullable(),
});

export const visitViewSchema = z.object({
  id: z.string(),
  patientName: z.string(),
  level: triageLevelSchema,
  status: visitStatusSchema,
  position: z.number().int().positive().nullable(),
  estimatedWaitMinutes: z.number().int().nonnegative().nullable(),
});

export type RegisterArrival = z.infer<typeof registerArrivalSchema>;
export type QueueEntry = z.infer<typeof queueEntrySchema>;
export type QueueResponse = z.infer<typeof queueResponseSchema>;
export type RoomOccupant = z.infer<typeof roomOccupantSchema>;
export type VisitView = z.infer<typeof visitViewSchema>;

/** The classroom simulator's controls. Present only when the server runs with SIMULATE=true. */
export const SIMULATION_SPEEDS = [1, 10, 60, 120] as const;
export const simulationSchema = z.object({
  running: z.boolean(),
  speed: z.number().positive(),
});
export const updateSimulationSchema = simulationSchema.partial();
export type Simulation = z.infer<typeof simulationSchema>;
