# Legevakt Queue App Baseline — Implementation Plan (Plan A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revision 2 (2026-08-28).** Revised after four researchers reviewed revision 1 — one
anchored, three blind. Fifteen changes applied; see
`docs/research/tooling/RECONCILIATION-code-patterns.md` for the verdict table and
the reasoning behind each. Every claim marked "verified" below was executed in a
scratch directory on this machine, not read in documentation.

**Goal:** Build the pre-built baseline application for the course — a live legevakt
queue where patients see their position, triage level and estimated wait — with the
determinism guarantees that make its BDD suite trustworthy in front of a room.

**Architecture:** Three npm workspace packages. `contract` is a leaf package holding
the wire vocabulary as Zod schemas and inferred types, importing nothing but `zod`;
it is the single source of truth for the domain vocabulary, consumed by the Drizzle
column definition, the request validators and the frontend's types. `backend` owns
SQLite via Drizzle behind a Hono API. `frontend` is Vite/React and polls it. All
queue logic lives in pure functions with no I/O. Time enters through one injectable
`Clock`.

**Tech Stack:** TypeScript, Hono, Zod, `@hono/zod-validator`, `@hono/node-server`,
Drizzle ORM + drizzle-kit on better-sqlite3, Vite + React, Vitest, playwright-bdd +
Playwright.

## Global Constraints

- **Package manager: npm.** Not pnpm, not bun. npm ships with Node, so students install nothing extra. A failsafe-setup requirement, not a preference.
- **Everything in English** — code, comments, specs, feature files, docs, commits.
- **No Docker. No CI. No deploy.** Do not create `.github/workflows`, Dockerfiles or compose files.
- **No clinical content of any kind.** A visit carries a fictional name and a triage level. Nothing else.
- **The clock is injectable everywhere.** No production code may call `new Date()` or `Date.now()` outside `backend/src/clock.ts`.
- **The wait estimate is a defined pure function, never a prediction.**
- **"Live" means polling at 15 seconds.** No websockets, no SSE.
- **Tests never touch the development database.** Tests use `:memory:`, which makes this physically impossible rather than a setting to get right.
- **The domain vocabulary is declared once,** in `contract`, and flows to the database column, the validators and the UI. Never re-declare a triage level or a status anywhere else.
- **Gates stay unwired.** Every check is an individually runnable npm script. No husky, no lint-staged, no git hooks. Plan B composes them; this plan only creates them.
- **Do not configure Vitest `reporters`.** Vitest auto-switches to an agent-optimised minimal reporter when it detects an AI agent — *unless custom reporters are configured*. Configuring them defeats the feature.
- **Node ≥ 22.** Development happens on Node 26.5.
- **Ownership-split layout is mandatory:** `specs/` and `features/` at the repo root belong to the product person and contain **only** `.feature` files and specs. Step definitions are TypeScript and live in `e2e/steps/`. Never put code in `features/`.

---

## File Structure

```
package.json                     # workspace root; delegating scripts only
tsconfig.base.json
vitest.config.ts                 # chaiConfig only — no reporters
scripts/dev.mjs                  # starts backend + frontend, no dependency
scripts/reset.mjs
scripts/verify-setup.mjs
scripts/check-native-deps.mjs
contract/
  package.json                   # exports ./src/index.ts directly, no build
  src/index.ts                   # TRIAGE_LEVELS, statuses, Zod schemas, inferred types
backend/
  package.json
  tsconfig.json
  drizzle.config.ts
  src/
    clock.ts
    domain/triage.ts             # priority + average consultation minutes
    domain/queue.ts              # orderQueue, positionOf, estimatedWaitMinutes
    domain/queue.test.ts
    db/schema.ts
    db/client.ts                 # createDb(file) — ':memory:' in tests
    db/migrate.ts
    db/seed.ts
    db/testDb.ts                 # createTestDb(): in-memory, migrated
    api/app.ts
    api/app.test.ts
    server.ts
frontend/
  package.json
  tsconfig.json
  vite.config.ts
  index.html
  src/
    main.tsx
    api.ts
    App.tsx
    PatientView.tsx
    StaffView.tsx
e2e/
  steps/fixtures.ts              # step definitions are CODE — not in features/
  steps/queue.steps.ts
features/                        # PRODUCT OWNS — .feature files only
  queue-position.feature
specs/                           # PRODUCT OWNS
playwright.config.ts
```

**Deviation from §3a of the decisions document, recorded deliberately:** the
indicative model listed `Patient → Visit → TriageEvent`. This plan uses **two**
tables, folding the fictional patient name onto the visit. A separate `Patient`
table would carry no field the course uses, and every table is something students
must read and another way setup can fail. `TriageEvent` is kept because the cycle-3
queue-aging amendment needs re-triage history.

---

### Task 1: Workspace skeleton and the shared contract

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `vitest.config.ts`, `.gitignore`
- Create: `contract/package.json`, `contract/src/index.ts`
- Create: `backend/package.json`, `backend/tsconfig.json`
- Create: `backend/src/domain/triage.ts`, `backend/src/domain/triage.test.ts`

**Interfaces:**
- Produces from `contract`: `TRIAGE_LEVELS`, `TriageLevel`, `VISIT_STATUSES`, `VisitStatus`, `registerArrivalSchema`, `retriageSchema`, `changeStatusSchema`, `QueueEntry`, `QueueResponse`, `VisitView`
- Produces from `backend`: `TRIAGE_PRIORITY`, `AVERAGE_CONSULTATION_MINUTES`

**Verified (this machine, Node 26.5, npm 11.17):** a workspace package whose
`exports` points directly at a `.ts` file resolves under backend `moduleResolution:
NodeNext`, under frontend `moduleResolution: bundler`, at runtime under
`node --experimental-strip-types`, and through `vite build` — with no build step.

- [ ] **Step 1: Create the workspace root**

`package.json`:

```json
{
  "name": "kurs-produktutvikling",
  "private": true,
  "type": "module",
  "workspaces": ["contract", "backend", "frontend"],
  "engines": { "node": ">=22" },
  "scripts": {
    "typecheck": "npm run typecheck -w backend && npm run typecheck -w frontend",
    "test": "vitest run"
  }
}
```

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

`vitest.config.ts` — one option, and no `reporters`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Default truncation renders a queue comparison as
    // "expected [ …(5) ] to deeply equal [ …(5) ]" — contentless.
    // 0 disables truncation and restores a full diff with file:line.
    chaiConfig: { truncateThreshold: 0 },
    // Deliberately no `reporters`: Vitest switches to an agent-optimised
    // minimal reporter automatically, but only when none are configured.
  },
});
```

`.gitignore`:

```
node_modules/
data/
dist/
test-results/
playwright-report/
.features-gen/
```

- [ ] **Step 2: Create the contract package**

`contract/package.json` — note `exports` points straight at TypeScript:

```json
{
  "name": "contract",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "dependencies": { "zod": "^4.4.3" }
}
```

`contract/src/index.ts`:

```ts
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

export const queueResponseSchema = z.object({
  now: z.string(),
  entries: z.array(queueEntrySchema),
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
export type VisitView = z.infer<typeof visitViewSchema>;
```

- [ ] **Step 3: Create the backend package**

`backend/package.json`:

```json
{
  "name": "backend",
  "private": true,
  "type": "module",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "dev": "node --experimental-strip-types --watch src/server.ts",
    "start": "node --experimental-strip-types src/server.ts",
    "db:generate": "drizzle-kit generate"
  },
  "dependencies": {
    "@hono/node-server": "^2.1.1",
    "@hono/zod-validator": "^0.9.0",
    "better-sqlite3": "^13.0.3",
    "contract": "*",
    "drizzle-orm": "^0.45.2",
    "hono": "^4.13.5",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13",
    "@types/node": "^24.0.0",
    "drizzle-kit": "^0.31.10",
    "typescript": "^5.9.0",
    "vitest": "^4.1.11"
  }
}
```

`backend/tsconfig.json`:

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": { "module": "NodeNext", "moduleResolution": "NodeNext" },
  "include": ["src"]
}
```

- [ ] **Step 4: Write the failing test**

`backend/src/domain/triage.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { TRIAGE_LEVELS } from 'contract';
import { AVERAGE_CONSULTATION_MINUTES, TRIAGE_PRIORITY } from './triage.js';

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
```

- [ ] **Step 5: Run it and watch it fail**

```bash
npm install
npm test
```

Expected: FAIL — cannot resolve `./triage.js`.

- [ ] **Step 6: Write the implementation**

`backend/src/domain/triage.ts` — note it imports the vocabulary rather than
re-declaring it:

```ts
import type { TriageLevel } from 'contract';

/** Lower number means more urgent. Patients are served in this order. */
export const TRIAGE_PRIORITY: Record<TriageLevel, number> = {
  RED: 1,
  ORANGE: 2,
  YELLOW: 3,
  GREEN: 4,
  BLUE: 5,
};

/**
 * How many minutes a consultation takes on average at this level.
 * Constants on purpose: the wait estimate is a defined function, not a prediction.
 */
export const AVERAGE_CONSULTATION_MINUTES: Record<TriageLevel, number> = {
  RED: 30,
  ORANGE: 25,
  YELLOW: 20,
  GREEN: 15,
  BLUE: 10,
};
```

- [ ] **Step 7: Run tests and typecheck**

```bash
npm test
npm run typecheck
```

Expected: both PASS. If `contract` does not resolve, confirm `npm install` linked
the workspace (`ls -l node_modules/contract` should be a symlink).

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.base.json vitest.config.ts .gitignore contract/ backend/
git commit -m "Add workspace skeleton and shared domain contract"
```

---

### Task 2: Queue ordering

**Files:**
- Create: `backend/src/domain/queue.ts`, `backend/src/domain/queue.test.ts`

**Interfaces:**
- Consumes: `TriageLevel` from `contract`, `TRIAGE_PRIORITY`
- Produces: `type WaitingVisit = { id: string; level: TriageLevel; arrivedAt: Date }`, `orderQueue(visits: WaitingVisit[]): WaitingVisit[]`

- [ ] **Step 1: Write the failing test**

`backend/src/domain/queue.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { TriageLevel } from 'contract';
import { orderQueue, type WaitingVisit } from './queue.js';

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
```

- [ ] **Step 2: Run it and watch it fail**

```bash
npm test
```

Expected: FAIL — cannot resolve `./queue.js`.

- [ ] **Step 3: Write the implementation**

`backend/src/domain/queue.ts`:

```ts
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
```

`AVERAGE_CONSULTATION_MINUTES` is imported now and used in Task 3; if the linter
objects to the unused import at this point, add the functions from Task 3 first.

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: PASS, 5 tests total.

- [ ] **Step 5: Commit**

```bash
git add backend/src/domain/queue.ts backend/src/domain/queue.test.ts
git commit -m "Add queue ordering: triage level then arrival time"
```

---

### Task 3: Position and the wait estimate

**Files:**
- Modify: `backend/src/domain/queue.ts`, `backend/src/domain/queue.test.ts`

**Interfaces:**
- Produces: `positionOf(visits: WaitingVisit[], visitId: string): number | null`, `estimatedWaitMinutes(visits: WaitingVisit[], visitId: string): number | null`

**The definitions being implemented.** Record them in the code — the point is that
the estimate is *defined* rather than guessed:

> `estimatedWaitMinutes` = the sum, over every patient ahead of you in the ordered
> queue, of the average consultation minutes for **that patient's** level. The
> patient at the front waits 0. One consultation room is assumed.

> `positionOf` = your 1-based index in the **whole** ordered queue, across all levels.

Note for later: Plan C plants a deliberate ambiguity on exactly that second
definition. Implement it as written; do not add a per-level variant.

- [ ] **Step 1: Write the failing tests**

Append to `backend/src/domain/queue.test.ts` (extend the existing import from
`./queue.js` rather than adding a second import statement):

```ts
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
```

- [ ] **Step 2: Run and watch them fail**

```bash
npm test
```

Expected: FAIL — `positionOf` and `estimatedWaitMinutes` are not exported.

- [ ] **Step 3: Write the implementation**

Append to `backend/src/domain/queue.ts`:

```ts
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
```

- [ ] **Step 4: Run tests and typecheck**

```bash
npm test
npm run typecheck
```

Expected: PASS, 11 tests total.

- [ ] **Step 5: Commit**

```bash
git add backend/src/domain/queue.ts backend/src/domain/queue.test.ts
git commit -m "Add queue position and defined wait estimate"
```

---

### Task 4: The injectable clock

**Files:**
- Create: `backend/src/clock.ts`, `backend/src/clock.test.ts`

**Interfaces:**
- Produces: `type Clock = { now(): Date }`, `systemClock: Clock`, `fixedClock(initial: Date): TestClock` where `type TestClock = Clock & { set(next: Date): void; advanceMinutes(minutes: number): void }`

- [ ] **Step 1: Write the failing test**

`backend/src/clock.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fixedClock } from './clock.js';

describe('fixedClock', () => {
  it('always returns the time it was created with', () => {
    const clock = fixedClock(new Date('2026-03-01T09:00:00.000Z'));

    expect(clock.now().toISOString()).toBe('2026-03-01T09:00:00.000Z');
    expect(clock.now().toISOString()).toBe('2026-03-01T09:00:00.000Z');
  });

  it('moves when advanced', () => {
    const clock = fixedClock(new Date('2026-03-01T09:00:00.000Z'));

    clock.advanceMinutes(90);

    expect(clock.now().toISOString()).toBe('2026-03-01T10:30:00.000Z');
  });

  it('can be set to an explicit time', () => {
    const clock = fixedClock(new Date('2026-03-01T09:00:00.000Z'));

    clock.set(new Date('2026-03-02T12:00:00.000Z'));

    expect(clock.now().toISOString()).toBe('2026-03-02T12:00:00.000Z');
  });
});
```

- [ ] **Step 2: Run and watch it fail**

```bash
npm test
```

Expected: FAIL — cannot resolve `./clock.js`.

- [ ] **Step 3: Write the implementation**

`backend/src/clock.ts`:

```ts
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
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: PASS, 14 tests total.

- [ ] **Step 5: Commit**

```bash
git add backend/src/clock.ts backend/src/clock.test.ts
git commit -m "Add injectable clock so no test depends on wall time"
```

---

### Task 5: Database schema, migrations and the in-memory test database

**Files:**
- Create: `backend/src/db/schema.ts`, `backend/src/db/client.ts`, `backend/src/db/migrate.ts`, `backend/src/db/testDb.ts`, `backend/src/db/testDb.test.ts`
- Create: `backend/drizzle.config.ts`, `backend/drizzle/` (generated)

**Interfaces:**
- Consumes: `TRIAGE_LEVELS`, `VISIT_STATUSES` from `contract`
- Produces: `visits`, `triageEvents` tables; `createDb(file: string): Db`; `applyMigrations(db: Db): void`; `createTestDb(): Db`

**Verified on this machine:** the Drizzle migrator applies cleanly to `':memory:'`.

- [ ] **Step 1: Write the schema**

`backend/src/db/schema.ts` — note the `enum` option, which types reads with **no
cast** and leaves the generated SQL unchanged:

```ts
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
```

`backend/drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
```

- [ ] **Step 2: Generate the migration and inspect it**

```bash
npm run db:generate -w backend
```

Expected: prints `2 tables` and writes `backend/drizzle/0000_*.sql`. Open it and
confirm it contains `CREATE TABLE `visits`` and `CREATE TABLE `triage_events``, and
that `level` is plain `text` — the `enum` option is a TypeScript-level constraint
and must not appear in the SQL.

- [ ] **Step 3: Write the failing test**

`backend/src/db/testDb.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { visits } from './schema.js';
import { createTestDb } from './testDb.js';

describe('createTestDb', () => {
  it('returns an in-memory database with the schema applied', () => {
    const db = createTestDb();

    db.insert(visits)
      .values({
        id: 'v1',
        patientName: 'Kari Nordmann',
        level: 'GREEN',
        status: 'WAITING',
        arrivedAt: new Date('2026-03-01T09:00:00.000Z'),
      })
      .run();

    const rows = db.select().from(visits).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.patientName).toBe('Kari Nordmann');
    expect(rows[0]?.arrivedAt.toISOString()).toBe('2026-03-01T09:00:00.000Z');
  });

  it('is isolated: a second database does not see the first one rows', () => {
    createTestDb().insert(visits)
      .values({
        id: 'only-in-first',
        patientName: 'Ola',
        level: 'GREEN',
        status: 'WAITING',
        arrivedAt: new Date('2026-03-01T09:00:00.000Z'),
      })
      .run();

    expect(createTestDb().select().from(visits).all()).toHaveLength(0);
  });

  it('types the level column as the union, with no cast', () => {
    const db = createTestDb();
    db.insert(visits)
      .values({
        id: 'v2',
        patientName: 'Ingrid',
        level: 'RED',
        status: 'WAITING',
        arrivedAt: new Date('2026-03-01T09:00:00.000Z'),
      })
      .run();

    const row = db.select().from(visits).all()[0];
    // If this compiles without `as TriageLevel`, the enum option is working.
    const level: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'BLUE' | undefined = row?.level;
    expect(level).toBe('RED');
  });
});
```

- [ ] **Step 4: Run and watch it fail**

```bash
npm test
```

Expected: FAIL — cannot resolve `./testDb.js`.

- [ ] **Step 5: Write the implementation**

`backend/src/db/client.ts`:

```ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

/** Pass ':memory:' for a private, disposable database. */
export function createDb(file: string) {
  const sqlite = new Database(file);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

export type Db = ReturnType<typeof createDb>;
```

`backend/src/db/migrate.ts`:

```ts
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { Db } from './client.js';

const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), '../../drizzle');

export function applyMigrations(db: Db): void {
  migrate(db, { migrationsFolder });
}
```

`backend/src/db/testDb.ts`:

```ts
import { createDb, type Db } from './client.js';
import { applyMigrations } from './migrate.js';

/**
 * A fresh, private, migrated database per call.
 *
 * ':memory:' is not merely faster than a temp file — it makes "tests must never
 * touch the development database" physically impossible to violate, rather than a
 * setting someone has to remember. It also avoids the Windows EBUSY that a temp
 * file causes when the connection is still open at cleanup.
 */
export function createTestDb(): Db {
  const db = createDb(':memory:');
  applyMigrations(db);
  return db;
}
```

- [ ] **Step 6: Run tests and typecheck**

```bash
npm test
npm run typecheck
```

Expected: PASS, 17 tests total. If the migrator cannot find its folder, log
`migrationsFolder` — it must resolve to `backend/drizzle`.

- [ ] **Step 7: Commit**

```bash
git add backend/src/db backend/drizzle.config.ts backend/drizzle
git commit -m "Add schema with typed enum columns and in-memory test database"
```

---

### Task 6: Seed data and the reset command

**Files:**
- Create: `backend/src/db/seed.ts`, `backend/src/db/seed.test.ts`, `backend/src/db/reset-entry.ts`
- Create: `scripts/reset.mjs`
- Modify: root `package.json`

**Interfaces:**
- Produces: `seedDemoData(db: Db, clock: Clock): void` — replaces all data with five waiting visits at fixed offsets before `clock.now()`

- [ ] **Step 1: Write the failing test**

`backend/src/db/seed.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fixedClock } from '../clock.js';
import { orderQueue } from '../domain/queue.js';
import { visits } from './schema.js';
import { seedDemoData } from './seed.js';
import { createTestDb } from './testDb.js';

const CLOCK = () => fixedClock(new Date('2026-03-01T09:00:00.000Z'));

describe('seedDemoData', () => {
  it('creates a queue with more than one triage level represented', () => {
    const db = createTestDb();

    seedDemoData(db, CLOCK());

    const rows = db.select().from(visits).all();
    expect(rows.length).toBeGreaterThanOrEqual(5);
    expect(new Set(rows.map((r) => r.level)).size).toBeGreaterThan(1);
  });

  it('is deterministic: the same clock produces the same queue order', () => {
    const order = () => {
      const db = createTestDb();
      seedDemoData(db, CLOCK());
      return orderQueue(
        db.select().from(visits).all().map((r) => ({
          id: r.id,
          level: r.level,
          arrivedAt: r.arrivedAt,
        })),
      ).map((v) => v.id);
    };

    expect(order()).toEqual(order());
  });

  it('replaces existing data rather than appending', () => {
    const db = createTestDb();

    seedDemoData(db, CLOCK());
    seedDemoData(db, CLOCK());

    expect(db.select().from(visits).all()).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Run and watch it fail**

```bash
npm test
```

Expected: FAIL — cannot resolve `./seed.js`.

- [ ] **Step 3: Write the implementation**

`backend/src/db/seed.ts`:

```ts
import type { TriageLevel } from 'contract';
import type { Clock } from '../clock.js';
import type { Db } from './client.js';
import { triageEvents, visits } from './schema.js';

type SeedRow = {
  id: string;
  patientName: string;
  level: TriageLevel;
  minutesAgo: number;
};

/** Fictional names, no clinical content. Fixed offsets keep seeding deterministic. */
const DEMO_QUEUE: SeedRow[] = [
  { id: 'seed-1', patientName: 'Kari Nordmann', level: 'GREEN', minutesAgo: 55 },
  { id: 'seed-2', patientName: 'Ola Hansen', level: 'YELLOW', minutesAgo: 40 },
  { id: 'seed-3', patientName: 'Ingrid Berg', level: 'GREEN', minutesAgo: 35 },
  { id: 'seed-4', patientName: 'Jonas Lie', level: 'BLUE', minutesAgo: 20 },
  { id: 'seed-5', patientName: 'Maja Solum', level: 'ORANGE', minutesAgo: 5 },
];

export function seedDemoData(db: Db, clock: Clock): void {
  const now = clock.now().getTime();

  db.transaction((tx) => {
    tx.delete(triageEvents).run();
    tx.delete(visits).run();

    for (const row of DEMO_QUEUE) {
      tx.insert(visits)
        .values({
          id: row.id,
          patientName: row.patientName,
          level: row.level,
          status: 'WAITING',
          arrivedAt: new Date(now - row.minutesAgo * 60_000),
        })
        .run();
    }
  });
}
```

**The transaction callback must be synchronous.** Verified on this machine:
better-sqlite3 rejects an async callback outright with `Transaction function cannot
return a promise`. That fails loudly rather than corrupting data, but it does fail —
never mark a transaction callback `async`.

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: PASS, 20 tests total.

- [ ] **Step 5: Add the reset command**

`backend/src/db/reset-entry.ts`:

```ts
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { systemClock } from '../clock.js';
import { createDb } from './client.js';
import { applyMigrations } from './migrate.js';
import { seedDemoData } from './seed.js';

const file = process.env.DB_FILE ?? 'data/legevakt.sqlite';
mkdirSync(dirname(file), { recursive: true });

const db = createDb(file);
applyMigrations(db);
seedDemoData(db, systemClock);
```

`scripts/reset.mjs`:

```js
#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';

const file = process.env.DB_FILE ?? 'data/legevakt.sqlite';

for (const suffix of ['', '-wal', '-shm']) {
  rmSync(`${file}${suffix}`, { force: true });
}

execFileSync(
  process.execPath,
  ['--experimental-strip-types', 'backend/src/db/reset-entry.ts'],
  { stdio: 'inherit', env: { ...process.env, DB_FILE: file } },
);

console.log(`Reset complete. Database recreated at ${file}`);
```

Add to root `package.json` scripts: `"reset": "node scripts/reset.mjs"`.

- [ ] **Step 6: Run reset twice and confirm it is idempotent**

```bash
npm run reset
npm run reset
```

Expected: both print `Reset complete.` with no error. If Node rejects
`--experimental-strip-types`, try `--experimental-transform-types`, and record which
flag worked in the commit message and later in the README.

- [ ] **Step 7: Commit**

```bash
git add backend/src/db scripts/reset.mjs package.json
git commit -m "Add deterministic demo seed and one-command reset"
```

---

### Task 7: The queue API

**Files:**
- Create: `backend/src/api/app.ts`, `backend/src/api/app.test.ts`

**Interfaces:**
- Produces: `createApp(deps: { db: Db; clock: Clock; allowTestRoutes?: boolean }): Hono` serving `GET /api/queue` and `GET /api/visits/:id`

Response shapes are defined by `queueResponseSchema` and `visitViewSchema` in
`contract` — the frontend imports those types rather than re-declaring them.

**On dependency injection.** A factory that closes over its dependencies is used
rather than Hono's `c.set('db')`. The `c.set` pattern is common because Cloudflare
Workers bindings only exist per request via `c.env`; that constraint does not apply
on Node. A factory also makes the clock rule structural rather than a convention.

- [ ] **Step 1: Write the failing test**

`backend/src/api/app.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import type { TriageLevel } from 'contract';
import { fixedClock } from '../clock.js';
import type { Db } from '../db/client.js';
import { visits } from '../db/schema.js';
import { createTestDb } from '../db/testDb.js';
import { createApp } from './app.js';

let db: Db;
const clock = fixedClock(new Date('2026-03-01T10:00:00.000Z'));

beforeEach(() => {
  db = createTestDb();
  clock.set(new Date('2026-03-01T10:00:00.000Z'));
});

const arrive = (id: string, level: TriageLevel, minutesAgo: number) =>
  db
    .insert(visits)
    .values({
      id,
      patientName: id,
      level,
      status: 'WAITING',
      arrivedAt: new Date(clock.now().getTime() - minutesAgo * 60_000),
    })
    .run();

describe('GET /api/queue', () => {
  it('returns waiting patients in triage order with position and estimate', async () => {
    arrive('green-first', 'GREEN', 60);
    arrive('green-second', 'GREEN', 30);
    arrive('red', 'RED', 5);

    const response = await createApp({ db, clock }).request('/api/queue');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.entries.map((e: { id: string }) => e.id)).toEqual([
      'red',
      'green-first',
      'green-second',
    ]);
    expect(body.entries[1].position).toBe(2);
    expect(body.entries[1].estimatedWaitMinutes).toBe(30);
  });

  it('excludes patients who are no longer waiting', async () => {
    arrive('waiting', 'GREEN', 10);
    arrive('gone', 'GREEN', 20);
    db.update(visits).set({ status: 'DONE' }).where(eq(visits.id, 'gone')).run();

    const body = await (await createApp({ db, clock }).request('/api/queue')).json();

    expect(body.entries.map((e: { id: string }) => e.id)).toEqual(['waiting']);
  });
});

describe('GET /api/visits/:id', () => {
  it('returns that patient position and estimate', async () => {
    arrive('a', 'GREEN', 60);
    arrive('b', 'GREEN', 30);

    const body = await (await createApp({ db, clock }).request('/api/visits/b')).json();

    expect(body.position).toBe(2);
    expect(body.estimatedWaitMinutes).toBe(15);
  });

  it('returns 404 for an unknown visit', async () => {
    const response = await createApp({ db, clock }).request('/api/visits/nobody');

    expect(response.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run and watch it fail**

```bash
npm test
```

Expected: FAIL — cannot resolve `./app.js`.

- [ ] **Step 3: Write the implementation**

`backend/src/api/app.ts`:

```ts
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Clock } from '../clock.js';
import type { Db } from '../db/client.js';
import { visits } from '../db/schema.js';
import {
  estimatedWaitMinutes,
  orderQueue,
  positionOf,
  type WaitingVisit,
} from '../domain/queue.js';

export type AppDeps = {
  db: Db;
  clock: Clock;
  allowTestRoutes?: boolean;
};

type WaitingRow = WaitingVisit & { patientName: string };

function waitingVisits(db: Db): WaitingRow[] {
  return db
    .select()
    .from(visits)
    .where(eq(visits.status, 'WAITING'))
    .all()
    .map((row) => ({
      id: row.id,
      patientName: row.patientName,
      level: row.level,
      arrivedAt: row.arrivedAt,
    }));
}

export function createApp(deps: AppDeps) {
  const app = new Hono();

  app.use('/api/*', cors());

  app.onError((error, c) => {
    console.error(error);
    return c.json({ error: 'internal server error' }, 500);
  });

  app.get('/api/queue', (c) => {
    const waiting = waitingVisits(deps.db);
    const byId = new Map(waiting.map((row) => [row.id, row]));

    const entries = orderQueue(waiting).map((visit, index) => ({
      id: visit.id,
      patientName: byId.get(visit.id)?.patientName ?? '',
      level: visit.level,
      position: index + 1,
      estimatedWaitMinutes: estimatedWaitMinutes(waiting, visit.id) ?? 0,
    }));

    return c.json({ now: deps.clock.now().toISOString(), entries });
  });

  app.get('/api/visits/:id', (c) => {
    const id = c.req.param('id');
    const row = deps.db.select().from(visits).where(eq(visits.id, id)).get();
    if (!row) return c.json({ error: 'visit not found' }, 404);

    const waiting = waitingVisits(deps.db);

    return c.json({
      id: row.id,
      patientName: row.patientName,
      level: row.level,
      status: row.status,
      position: positionOf(waiting, id),
      estimatedWaitMinutes: estimatedWaitMinutes(waiting, id),
    });
  });

  return app;
}
```

- [ ] **Step 4: Run tests and typecheck**

```bash
npm test
npm run typecheck
```

Expected: PASS, 24 tests total.

- [ ] **Step 5: Commit**

```bash
git add backend/src/api
git commit -m "Add queue API with position, estimated wait and onError"
```

---

### Task 8: Staff actions, validation, and test-only routes

**Files:**
- Modify: `backend/src/api/app.ts`, `backend/src/api/app.test.ts`
- Create: `backend/src/server.ts`

**Interfaces:**
- Produces: `POST /api/visits`, `POST /api/visits/:id/triage`, `POST /api/visits/:id/status`, and — only when `allowTestRoutes` is true — `POST /api/test/clock` and `POST /api/test/reset`

Bodies are validated by the schemas already exported from `contract`:
`registerArrivalSchema`, `retriageSchema`, `changeStatusSchema`.

**Why `@hono/zod-validator` rather than `safeParse`.** Hono's own validation guide
says "We recommend using a third-party validator." It costs one line per route
instead of three — and it fixes a real defect: the middleware wraps `c.req.json()`
in a try/catch and returns **400** on malformed JSON, whereas calling
`await c.req.json()` yourself throws and surfaces as a **500**.

- [ ] **Step 1: Write the failing tests**

Append to `backend/src/api/app.test.ts`:

```ts
const post = (app: ReturnType<typeof createApp>, path: string, body: unknown) =>
  app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('staff actions', () => {
  it('registers an arrival at the current clock time', async () => {
    const app = createApp({ db, clock });

    const created = await post(app, '/api/visits', {
      patientName: 'Nils Aas',
      level: 'YELLOW',
    });
    const { id } = await created.json();

    expect(created.status).toBe(201);
    expect(db.select().from(visits).where(eq(visits.id, id)).get()?.arrivedAt.toISOString())
      .toBe('2026-03-01T10:00:00.000Z');
  });

  it('rejects an unknown triage level with 400', async () => {
    const response = await post(createApp({ db, clock }), '/api/visits', {
      patientName: 'Nils Aas',
      level: 'PURPLE',
    });

    expect(response.status).toBe(400);
  });

  it('returns 400, not 500, for malformed JSON', async () => {
    const response = await createApp({ db, clock }).request('/api/visits', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{ not json',
    });

    expect(response.status).toBe(400);
  });

  it('re-triage moves a patient up the queue and records the change', async () => {
    arrive('green', 'GREEN', 60);
    arrive('blue', 'BLUE', 10);
    const app = createApp({ db, clock });

    await post(app, '/api/visits/blue/triage', { level: 'RED' });

    const body = await (await app.request('/api/queue')).json();
    expect(body.entries[0].id).toBe('blue');
    expect(db.select().from(triageEvents).all()).toHaveLength(1);
  });
});

describe('test-only routes', () => {
  it('are absent unless test routes are allowed', async () => {
    const response = await post(createApp({ db, clock }), '/api/test/reset', {});

    expect(response.status).toBe(404);
  });

  it('reset empties the queue when allowed', async () => {
    arrive('someone', 'GREEN', 10);
    const app = createApp({ db, clock, allowTestRoutes: true });

    await post(app, '/api/test/reset', {});

    expect((await (await app.request('/api/queue')).json()).entries).toHaveLength(0);
  });
});
```

Add `triageEvents` to the existing `../db/schema.js` import.

- [ ] **Step 2: Run and watch them fail**

```bash
npm test
```

Expected: FAIL — the POST routes return 404.

- [ ] **Step 3: Write the implementation**

Add these imports to `backend/src/api/app.ts`:

```ts
import { randomUUID } from 'node:crypto';
import { zValidator } from '@hono/zod-validator';
import { changeStatusSchema, registerArrivalSchema, retriageSchema } from 'contract';
import { z } from 'zod';
import { triageEvents } from '../db/schema.js';
import { seedDemoData } from '../db/seed.js';
```

Add these routes inside `createApp`, before `return app;`:

```ts
  app.post('/api/visits', zValidator('json', registerArrivalSchema), (c) => {
    const { patientName, level } = c.req.valid('json');
    const id = randomUUID();

    deps.db
      .insert(visits)
      .values({ id, patientName, level, status: 'WAITING', arrivedAt: deps.clock.now() })
      .run();

    return c.json({ id }, 201);
  });

  app.post('/api/visits/:id/triage', zValidator('json', retriageSchema), (c) => {
    const id = c.req.param('id');
    const { level } = c.req.valid('json');

    const row = deps.db.select().from(visits).where(eq(visits.id, id)).get();
    if (!row) return c.json({ error: 'visit not found' }, 404);

    // Two writes, one fact: the level change and its history entry must be
    // atomic, because the queue-aging amendment depends on that history.
    // The callback MUST be synchronous — better-sqlite3 rejects an async one
    // outright with "Transaction function cannot return a promise".
    deps.db.transaction((tx) => {
      tx.update(visits).set({ level }).where(eq(visits.id, id)).run();
      tx.insert(triageEvents)
        .values({
          id: randomUUID(),
          visitId: id,
          fromLevel: row.level,
          toLevel: level,
          occurredAt: deps.clock.now(),
        })
        .run();
    });

    return c.json({ id, level });
  });

  app.post('/api/visits/:id/status', zValidator('json', changeStatusSchema), (c) => {
    const id = c.req.param('id');
    const { status } = c.req.valid('json');

    const row = deps.db.select().from(visits).where(eq(visits.id, id)).get();
    if (!row) return c.json({ error: 'visit not found' }, 404);

    deps.db.update(visits).set({ status }).where(eq(visits.id, id)).run();
    return c.json({ id, status });
  });

  if (deps.allowTestRoutes) {
    app.post('/api/test/clock', zValidator('json', z.object({ now: z.string() })), (c) => {
      const { now } = c.req.valid('json');
      const parsed = new Date(now);
      if (Number.isNaN(parsed.getTime())) return c.json({ error: 'invalid date' }, 400);

      const settable = deps.clock as { set?: (next: Date) => void };
      if (!settable.set) return c.json({ error: 'clock is not settable' }, 400);

      settable.set(parsed);
      return c.json({ now });
    });

    // One call to put the system in a known state, instead of N+1 requests
    // from a step definition. Scenarios become independent rather than
    // cleaned-up-by-their-successor.
    app.post('/api/test/reset', (c) => {
      deps.db.transaction((tx) => {
        tx.delete(triageEvents).run();
        tx.delete(visits).run();
      });
      return c.json({ ok: true });
    });

    app.post('/api/test/seed', (c) => {
      seedDemoData(deps.db, deps.clock);
      return c.json({ ok: true });
    });
  }
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: PASS, 30 tests total. The malformed-JSON test is the one that would have
failed before this change.

- [ ] **Step 5: Create the server entry point**

`backend/src/server.ts`:

```ts
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { serve } from '@hono/node-server';
import { createApp } from './api/app.js';
import { fixedClock, systemClock, type Clock } from './clock.js';
import { createDb } from './db/client.js';
import { applyMigrations } from './db/migrate.js';

const file = process.env.DB_FILE ?? 'data/legevakt.sqlite';
const port = Number(process.env.PORT ?? 3001);
const allowTestRoutes = process.env.ALLOW_TEST_ROUTES === 'true';

mkdirSync(dirname(file), { recursive: true });

const db = createDb(file);
applyMigrations(db);

const clock: Clock = process.env.CLOCK_FIXED_AT
  ? fixedClock(new Date(process.env.CLOCK_FIXED_AT))
  : systemClock;

serve({ fetch: createApp({ db, clock, allowTestRoutes }).fetch, port }, (info) => {
  console.log(`Backend listening on http://localhost:${info.port}`);
});
```

- [ ] **Step 6: Start it and check by hand**

```bash
npm run reset
npm run dev -w backend
```

In another terminal:

```bash
curl -s http://localhost:3001/api/queue
curl -s -X POST http://localhost:3001/api/visits -H 'content-type: application/json' -d '{ not json' -o /dev/null -w '%{http_code}\n'
```

Expected: five seeded entries with Maja Solum (ORANGE) first; the malformed request
prints `400`. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add backend/src
git commit -m "Add staff actions with validator middleware, transactional re-triage and test routes"
```

---

### Task 9: Frontend shell and the patient view

**Files:**
- Create: `frontend/package.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`, `frontend/index.html`
- Create: `frontend/src/main.tsx`, `frontend/src/api.ts`, `frontend/src/App.tsx`, `frontend/src/PatientView.tsx`

**Interfaces:**
- Consumes: `QueueResponse`, `VisitView`, `TriageLevel` from `contract`; the API from Tasks 7–8
- Produces: a page at `#/visit/:id` refreshing every 15 seconds

**Why no TanStack Query.** Recorded as a genuine toss-up rather than a settled
question — the library's own maintainer lists interval fetching as a case where it
earns its keep. It is declined here because its defaults (`staleTime: 0`,
`refetchOnWindowFocus`, silent retries) would all have to be turned off to behave as
"poll every 15 seconds", and because zero new dependencies serves the failsafe-setup
constraint. If this app ever grows a second screen sharing this data, revisit.

**Accessibility here is infrastructure, not politeness.** The polled values are
marked `role="status"` with an `aria-label` — genuinely correct ARIA for content
that updates on its own, *and* the mechanism that makes them visible to Playwright's
role locators and to the `aiFix` ARIA snapshot. `data-testid` is deliberately not
used: it does not appear in an ARIA snapshot, and the `aiFix` prompt instructs the
model to rely strictly on that snapshot.

- [ ] **Step 1: Create the package**

`frontend/package.json`:

```json
{
  "name": "frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src"
  },
  "dependencies": {
    "contract": "*",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^5.0.0",
    "eslint": "^9.0.0",
    "eslint-plugin-react-hooks": "^7.0.0",
    "typescript": "^5.9.0",
    "vite": "^8.0.0"
  }
}
```

`frontend/tsconfig.json`:

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler"
  },
  "include": ["src"]
}
```

`frontend/vite.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3001' },
  },
});
```

`frontend/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Legevakt queue</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Write the API client**

`frontend/src/api.ts` — types come from `contract`, never re-declared:

```ts
import type { QueueResponse, TriageLevel, VisitStatus, VisitView } from 'contract';

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) throw new Error(`${init?.method ?? 'GET'} ${path} failed: ${response.status}`);
  return response.json() as Promise<T>;
}

const post = <T>(path: string, body: unknown): Promise<T> =>
  json<T>(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

export const fetchQueue = (): Promise<QueueResponse> => json<QueueResponse>('/api/queue');

export const fetchVisit = (id: string): Promise<VisitView> =>
  json<VisitView>(`/api/visits/${id}`);

export const registerArrival = (patientName: string, level: TriageLevel) =>
  post<{ id: string }>('/api/visits', { patientName, level });

export const retriage = (id: string, level: TriageLevel) =>
  post<{ id: string }>(`/api/visits/${id}/triage`, { level });

export const changeStatus = (id: string, status: VisitStatus) =>
  post<{ id: string }>(`/api/visits/${id}/status`, { status });
```

- [ ] **Step 3: Write the patient view**

`frontend/src/PatientView.tsx`:

```tsx
import { useEffect, useState } from 'react';
import type { VisitView } from 'contract';
import { fetchVisit } from './api';

const REFRESH_MS = 15_000;

export function PatientView({ visitId }: { visitId: string }) {
  const [visit, setVisit] = useState<VisitView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset on identity change, or the previous patient's data stays on screen
    // while the new request is in flight.
    setVisit(null);
    setError(null);

    let ignore = false;

    const load = async () => {
      try {
        const next = await fetchVisit(visitId);
        if (!ignore) {
          setVisit(next);
          setError(null);
        }
      } catch (cause) {
        if (!ignore) setError(String(cause));
      }
    };

    void load();
    const timer = setInterval(() => void load(), REFRESH_MS);

    return () => {
      ignore = true;
      clearInterval(timer);
    };
  }, [visitId]);

  if (error) return <p role="alert">{error}</p>;
  if (!visit) return <p>Loading…</p>;

  return (
    <main>
      <h1>Hello, {visit.patientName}</h1>

      <p role="status" aria-label="Triage level">
        Your triage level is {visit.level}
      </p>
      <p role="status" aria-label="Queue position">
        You are number {visit.position ?? '-'} in the queue
      </p>
      <p role="status" aria-label="Estimated wait">
        Estimated wait: {visit.estimatedWaitMinutes ?? '-'} minutes
      </p>
    </main>
  );
}
```

- [ ] **Step 4: Write the shell**

`frontend/src/App.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { PatientView } from './PatientView';
import { StaffView } from './StaffView';

const currentHash = (): string => window.location.hash.replace(/^#/, '');

export function App() {
  const [route, setRoute] = useState(currentHash());

  useEffect(() => {
    const onChange = () => setRoute(currentHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const visitMatch = /^\/visit\/(.+)$/.exec(route);
  return visitMatch?.[1] ? <PatientView visitId={visitMatch[1]} /> : <StaffView />;
}
```

`frontend/src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const container = document.getElementById('root');
if (!container) throw new Error('#root not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 5: Commit**

`App.tsx` imports `StaffView`, written in Task 10, so typecheck fails until then.
Commit anyway — the two views belong in separate reviewable commits.

```bash
git add frontend/
git commit -m "Add frontend shell, contract-typed API client and patient view"
```

---

### Task 10: The staff view and the dev launcher

**Files:**
- Create: `frontend/src/StaffView.tsx`, `frontend/eslint.config.js`
- Create: `scripts/dev.mjs`
- Modify: root `package.json`

Deliberately plain. This is not a real triage interface and must not grow into one.

**The per-row label trap.** Every row has its own controls, so `htmlFor="triage"`
inside a `.map()` would label only the first row — later duplicate ids are not
considered, producing invalid HTML that renders perfectly and leaves most controls
with no accessible name. Each row control therefore gets a **unique** `aria-label`
including the patient's name, which is also what makes the E2E role locators work.

- [ ] **Step 1: Write the staff view**

`frontend/src/StaffView.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import { TRIAGE_LEVELS, type QueueEntry, type TriageLevel } from 'contract';
import { changeStatus, fetchQueue, registerArrival, retriage } from './api';

export function StaffView() {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [name, setName] = useState('');
  const [level, setLevel] = useState<TriageLevel>('GREEN');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setEntries((await fetchQueue()).entries);
      setError(null);
    } catch (cause) {
      setError(String(cause));
    }
  }, []);

  useEffect(() => {
    void reload();
    const timer = setInterval(() => void reload(), 15_000);
    return () => clearInterval(timer);
  }, [reload]);

  const onRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    await registerArrival(name, level);
    setName('');
    await reload();
  };

  return (
    <main>
      <h1>Staff — queue</h1>
      {error && <p role="alert">{error}</p>}

      <form onSubmit={(event) => void onRegister(event)}>
        <label htmlFor="patient-name">Patient name</label>
        <input id="patient-name" value={name} onChange={(e) => setName(e.target.value)} />

        <label htmlFor="arrival-level">Triage level</label>
        <select
          id="arrival-level"
          value={level}
          onChange={(e) => setLevel(e.target.value as TriageLevel)}
        >
          {TRIAGE_LEVELS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button type="submit">Register arrival</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Level</th>
            <th>Estimate</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.position}</td>
              <td>
                <a href={`#/visit/${entry.id}`}>{entry.patientName}</a>
              </td>
              <td>{entry.level}</td>
              <td>{entry.estimatedWaitMinutes} min</td>
              <td>
                {/* Unique per row: a shared htmlFor would label only row one. */}
                <select
                  aria-label={`Triage level for ${entry.patientName}`}
                  value={entry.level}
                  onChange={(e) =>
                    void retriage(entry.id, e.target.value as TriageLevel).then(reload)
                  }
                >
                  {TRIAGE_LEVELS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button
                  aria-label={`Mark ${entry.patientName} done`}
                  onClick={() => void changeStatus(entry.id, 'DONE').then(reload)}
                >
                  Done
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
```

- [ ] **Step 2: Add the hooks lint**

This is not style enforcement. react.dev's canonical stale-closure example *is* a
`setInterval` polling loop — this app's centrepiece is the canonical instance of the
canonical React mistake, and this rule catches it with file, line and reason.

`frontend/eslint.config.js`:

```js
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      // Load-bearing: this app polls on an interval, which is exactly the
      // shape that produces stale closures.
      'react-hooks/exhaustive-deps': 'error',
    },
  },
];
```

- [ ] **Step 3: Write the dev launcher**

No dependency needed — `concurrently` and `npm-run-all` are both avoidable.

`scripts/dev.mjs`:

```js
#!/usr/bin/env node
import { spawn } from 'node:child_process';

const children = [
  spawn('npm', ['run', 'dev', '-w', 'backend'], { stdio: 'inherit', shell: true }),
  spawn('npm', ['run', 'dev', '-w', 'frontend'], { stdio: 'inherit', shell: true }),
];

const stop = () => children.forEach((child) => child.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
children.forEach((child) => child.on('exit', (code) => code !== 0 && stop()));
```

Root `package.json` scripts:

```json
{
  "scripts": {
    "dev": "node scripts/dev.mjs",
    "reset": "node scripts/reset.mjs",
    "typecheck": "npm run typecheck -w backend && npm run typecheck -w frontend",
    "test": "vitest run",
    "lint": "npm run lint -w frontend",
    "build": "npm run build -w frontend"
  }
}
```

- [ ] **Step 4: Run the whole app and check both views**

```bash
npm install
npm run reset
npm run dev
```

Open `http://localhost:5173`. Expected: the staff table lists five seeded patients,
Maja Solum (ORANGE) first. Click a name to see the patient view. Re-triage someone
to RED and confirm they move to position 1.

- [ ] **Step 5: Typecheck, lint and commit**

```bash
npm run typecheck
npm run lint
git add frontend/ scripts/dev.mjs package.json
git commit -m "Add staff view with per-row labels, hooks lint and dev launcher"
```

---

### Task 11: playwright-bdd with worked scenarios

**Files:**
- Create: `playwright.config.ts`
- Create: `features/queue-position.feature`
- Create: `e2e/steps/fixtures.ts`, `e2e/steps/queue.steps.ts`
- Create: `specs/.gitkeep`
- Modify: root `package.json`

**Step definitions live in `e2e/steps/`, not in `features/`.** `features/` belongs to
the product person and holds `.feature` files only; step definitions are code.

Steps arrange state through the API and assert through the UI. Driving setup through
the staff UI would make every scenario depend on throwaway markup.

- [ ] **Step 1: Add the dependencies**

Add to root `package.json` devDependencies, then install:

```json
"devDependencies": {
  "@playwright/test": "^1.56.0",
  "playwright-bdd": "^9.2.0",
  "vitest": "^4.1.11"
}
```

```bash
npm install
npx playwright install chromium
```

- [ ] **Step 2: Write the feature file**

`features/queue-position.feature`:

```gherkin
Feature: Queue position

  Patients waiting at the legevakt want to know where they are in the queue
  and roughly how long they will wait.

  Background:
    Given the clinic queue is empty

  Scenario: A patient sees their position and estimated wait
    Given "Kari" arrived 60 minutes ago with triage level "GREEN"
    And "Ola" arrived 30 minutes ago with triage level "GREEN"
    When "Ola" opens their queue view
    Then they see position 2
    And they see an estimated wait of 15 minutes

  Scenario: A more urgent arrival moves ahead of everyone waiting
    Given "Kari" arrived 60 minutes ago with triage level "GREEN"
    And "Maja" arrived 5 minutes ago with triage level "RED"
    When "Kari" opens their queue view
    Then they see position 2

  Scenario: The waiting patient sees their position change without reloading
    Given "Kari" arrived 60 minutes ago with triage level "GREEN"
    And "Kari" opens their queue view
    When "Maja" arrives now with triage level "RED"
    And the page refreshes itself
    Then they see position 2
```

- [ ] **Step 3: Write the step definitions**

`e2e/steps/fixtures.ts`:

```ts
import { test as base, createBdd } from 'playwright-bdd';

export const API = 'http://localhost:3001';

/** Matches CLOCK_FIXED_AT in playwright.config.ts. */
export const NOW = new Date('2026-03-01T10:00:00.000Z');

type Fixtures = {
  /** Maps a patient's first name to the visit id created for them. */
  visitIds: Map<string, string>;
};

export const test = base.extend<Fixtures>({
  visitIds: async ({}, use) => {
    await use(new Map());
  },
});

export const { Given, When, Then } = createBdd(test);
```

`e2e/steps/queue.steps.ts`:

```ts
import { expect } from '@playwright/test';
import { API, Given, NOW, Then, When } from './fixtures';

Given('the clinic queue is empty', async ({ request, page }) => {
  await request.post(`${API}/api/test/reset`);
  // Install a controllable browser clock so the 15s poll can be advanced
  // deliberately rather than waited out.
  await page.clock.install();
});

const arrive = async (
  request: { post: (url: string, opts?: { data?: unknown }) => Promise<{ json(): Promise<{ id: string }> }> },
  visitIds: Map<string, string>,
  name: string,
  level: string,
  minutesAgo: number,
) => {
  await request.post(`${API}/api/test/clock`, {
    data: { now: new Date(NOW.getTime() - minutesAgo * 60_000).toISOString() },
  });

  const created = await request.post(`${API}/api/visits`, {
    data: { patientName: name, level },
  });
  visitIds.set(name, (await created.json()).id);

  await request.post(`${API}/api/test/clock`, { data: { now: NOW.toISOString() } });
};

Given(
  '{string} arrived {int} minutes ago with triage level {string}',
  async ({ request, visitIds }, name: string, minutesAgo: number, level: string) => {
    await arrive(request, visitIds, name, level, minutesAgo);
  },
);

When(
  '{string} arrives now with triage level {string}',
  async ({ request, visitIds }, name: string, level: string) => {
    await arrive(request, visitIds, name, level, 0);
  },
);

Given('{string} opens their queue view', async ({ page, visitIds }, name: string) => {
  const id = visitIds.get(name);
  expect(id, `no visit registered for ${name}`).toBeTruthy();
  await page.goto(`/#/visit/${id}`);
});

When('{string} opens their queue view', async ({ page, visitIds }, name: string) => {
  const id = visitIds.get(name);
  expect(id, `no visit registered for ${name}`).toBeTruthy();
  await page.goto(`/#/visit/${id}`);
});

When('the page refreshes itself', async ({ page }) => {
  // Advance the browser clock past the 15s poll instead of sleeping.
  await page.clock.fastForward('00:16');
});

Then('they see position {int}', async ({ page }, expected: number) => {
  await expect(page.getByRole('status', { name: 'Queue position' })).toContainText(
    `number ${expected} in the queue`,
  );
});

Then('they see an estimated wait of {int} minutes', async ({ page }, expected: number) => {
  await expect(page.getByRole('status', { name: 'Estimated wait' })).toContainText(
    `${expected} minutes`,
  );
});
```

- [ ] **Step 4: Write the Playwright config**

`playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'e2e/steps/**/*.ts',
  // Attaches a prompt to failures containing the error, the steps up to the
  // failure, the code snippet and an ARIA snapshot of the page. This is why
  // the UI uses role/label locators rather than data-testid: test ids do not
  // appear in an ARIA snapshot, and the prompt tells the model to rely on it.
  aiFix: { promptAttachment: true },
});

export default defineConfig({
  testDir,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
  // Playwright recommends testing every browser. We deliberately run only
  // Chromium: this is a teaching repo demonstrated on one machine, and every
  // extra browser is another download that can fail during pre-class setup.
  // Cross-browser coverage is a real concern for a real product, not for this.
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: [
    {
      command: 'npm run start -w backend',
      url: 'http://localhost:3001/api/queue',
      reuseExistingServer: false,
      env: {
        DB_FILE: 'data/test.sqlite',
        ALLOW_TEST_ROUTES: 'true',
        CLOCK_FIXED_AT: '2026-03-01T10:00:00.000Z',
      },
    },
    {
      command: 'npm run dev -w frontend',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
    },
  ],
});
```

Add to root `package.json` scripts:

```json
"test:e2e": "bddgen && playwright test"
```

- [ ] **Step 5: Run the suite**

```bash
rm -f data/test.sqlite data/test.sqlite-wal data/test.sqlite-shm
npm run test:e2e
```

Expected: 3 scenarios pass. Confirm the dev database is untouched — the staff view
should still show the five seeded patients afterwards.

If `aiFix` is rejected by the installed playwright-bdd, remove that option, note it
in the commit message, and **also revert to `data-testid` is NOT the fix** — keep the
role locators, since they are better regardless.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts features/ e2e/ specs/.gitkeep package.json
git commit -m "Add playwright-bdd suite with role locators and clock control"
```

---

### Task 12: verify-setup and the pre-class README

**Files:**
- Create: `scripts/verify-setup.mjs`, `README.md`
- Modify: root `package.json`

The dangerous pre-class failure is not "I could not get it working" — it is "I
thought it was working." This script exists to make that impossible.

- [ ] **Step 1: Write the script**

`scripts/verify-setup.mjs`:

```js
#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const failures = [];

const check = (label, fn) => {
  try {
    fn();
    console.log(`  ok    ${label}`);
  } catch (cause) {
    console.log(`  FAIL  ${label}`);
    failures.push(`${label}: ${cause instanceof Error ? cause.message : String(cause)}`);
  }
};

console.log('Checking your setup...\n');

check('Node is version 22 or newer', () => {
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 22) throw new Error(`found Node ${process.versions.node}`);
});

check('Dependencies are installed', () => {
  if (!existsSync('node_modules')) throw new Error('run: npm install');
});

check('The SQLite binding loads', () => {
  execFileSync(process.execPath, ['-e', "require('better-sqlite3')"], { stdio: 'pipe' });
});

check('TypeScript compiles', () => {
  execFileSync('npm', ['run', 'typecheck'], { stdio: 'pipe', shell: true });
});

check('Unit tests pass', () => {
  execFileSync('npm', ['test'], { stdio: 'pipe', shell: true });
});

check('A browser is installed for Playwright', () => {
  execFileSync('npx', ['playwright', 'install', '--dry-run', 'chromium'], {
    stdio: 'pipe',
    shell: true,
  });
});

if (failures.length === 0) {
  console.log('\nPASS — you are ready for the course.');
  process.exit(0);
}

console.log(`\nFAIL — ${failures.length} problem(s):\n`);
failures.forEach((failure, index) => console.log(`  ${index + 1}. ${failure}`));
console.log('\nBring this output to class if you cannot resolve it.');
process.exit(1);
```

Add `"verify-setup": "node scripts/verify-setup.mjs"` to root scripts.

- [ ] **Step 2: Confirm it passes**

```bash
npm run verify-setup
```

Expected: six `ok` lines and `PASS`.

- [ ] **Step 3: Confirm it can actually fail**

```bash
mv node_modules node_modules.bak && npm run verify-setup; mv node_modules.bak node_modules
```

Expected: `FAIL`, a numbered reason, exit code 1. A verify script that cannot fail is
worthless; this step proves it can.

- [ ] **Step 4: Write the README**

`README.md`:

```markdown
# Legevakt queue — course baseline

A small app for a course on process design with AI agents. Patients waiting at a
legevakt see their position in the queue, their triage level and an estimated
wait. Staff register arrivals and re-triage.

All data is fictional. The app holds no clinical content of any kind.

## Before the course (developers only)

Your pair needs **one** working machine — the developer's. Do this in advance, not
on the morning of the course.

1. Install Node 22 or newer: https://nodejs.org
2. Clone this repository
3. Install and check:

   ```bash
   npm install
   npm run verify-setup
   ```

   You must see `PASS`. If you see `FAIL`, the output lists what to fix. Bring that
   output to class if you get stuck.

4. Start the app:

   ```bash
   npm run reset
   npm run dev
   ```

   Open http://localhost:5173 — you should see five waiting patients.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts backend (3001) and frontend (5173) |
| `npm run reset` | Recreates the database with fresh demo data |
| `npm run verify-setup` | Checks your machine, prints PASS or FAIL |
| `npm run typecheck` | Type-checks every package |
| `npm run lint` | React hooks rules |
| `npm test` | Unit and integration tests |
| `npm run test:e2e` | Gherkin scenarios in a real browser |
| `npm run build` | Production build of the frontend |
| `npm run deps:check` | Fails if a dependency needs native compilation |

None of these run automatically. There are no git hooks and no CI — which checks
run, and when, is something you decide during the course.

## Layout

| Path | Owner |
|---|---|
| `specs/`, `features/` | Product |
| `contract/`, `backend/`, `frontend/`, `e2e/` | Development |

`contract/` holds the domain vocabulary and the wire schemas. A triage level is
declared there **once** and flows to the database column, the request validators
and the UI.

## How the queue works

Patients are seen in triage-level order (RED, ORANGE, YELLOW, GREEN, BLUE), and by
arrival time within a level.

The estimated wait is a **definition, not a prediction**: the sum of the average
consultation minutes of every patient ahead of you, using each of those patients'
own triage level. One consultation room is assumed. The same queue always produces
the same number.

Time enters through a single injectable clock (`backend/src/clock.ts`). No test
depends on the real wall clock.
```

- [ ] **Step 5: Commit**

```bash
git add scripts/verify-setup.mjs README.md package.json
git commit -m "Add verify-setup check and pre-class README"
```

---

### Task 13: Gate scripts, unwired

**Files:**
- Create: `scripts/check-native-deps.mjs`
- Modify: root `package.json`

Plan B measures these and builds the classroom table. This task only guarantees each
one exists and runs alone.

- [ ] **Step 1: Write the native-dependency guard**

Enforces the failsafe-setup constraint: `better-sqlite3` ships prebuilds, but a
future dependency could reintroduce compilation.

`scripts/check-native-deps.mjs`:

```js
#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const lockfile = readFileSync('package-lock.json', 'utf8');
const banned = ['node-gyp', 'nan'];
const found = banned.filter((name) => lockfile.includes(`"node_modules/${name}"`));

if (found.length > 0) {
  console.error(`FAIL — these force native compilation at install time: ${found.join(', ')}`);
  console.error('Setup must not require a C++ toolchain. Find a prebuilt alternative.');
  process.exit(1);
}

console.log('ok — no dependency requires native compilation');
```

- [ ] **Step 2: Finalise the scripts block**

Root `package.json`, complete:

```json
{
  "scripts": {
    "dev": "node scripts/dev.mjs",
    "reset": "node scripts/reset.mjs",
    "verify-setup": "node scripts/verify-setup.mjs",
    "typecheck": "npm run typecheck -w backend && npm run typecheck -w frontend",
    "lint": "npm run lint -w frontend",
    "test": "vitest run",
    "test:e2e": "bddgen && playwright test",
    "build": "npm run build -w frontend",
    "db:generate": "npm run db:generate -w backend",
    "deps:check": "node scripts/check-native-deps.mjs"
  }
}
```

Do **not** add a combined `verify` or `check` script. Composing them is the
students' exercise.

- [ ] **Step 3: Run each one individually**

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run deps:check
npm run test:e2e
```

Expected: all six pass, run one at a time.

- [ ] **Step 4: Confirm nothing was wired**

```bash
ls .husky 2>/dev/null; grep -c '"prepare"' package.json; ls .github 2>/dev/null
```

Expected: no `.husky`, `0` occurrences of `prepare`, no `.github`. Gates stay
unwired and there is no CI.

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/check-native-deps.mjs
git commit -m "Add gate scripts as individually runnable checks, none wired"
```

---

## Self-Review

**Spec coverage against `docs/course-design-decisions.md`:**

| Requirement | Task |
|---|---|
| TypeScript everywhere (3) | 1 |
| Separate backend and frontend, one dev script (27) | 9, 10 |
| Drizzle + drizzle-kit on better-sqlite3 (30) | 5 |
| SQLite, no Docker (26) | 5; no Dockerfile anywhere |
| No CI/CD (11) | none created; Task 13 step 4 verifies |
| Gate catalogue unwired (12/13) | 13 |
| Three test layers, none mandatory (22) | unit 2–4, integration 5–8, BDD 11 |
| Separate test database + reset (21) | 5 (`:memory:`), 6, 11 (`data/test.sqlite`) |
| Everything English (18) | throughout |
| Wait estimate is a defined function (§3a) | 3 |
| Injectable clock (§3a) | 4, used in 7, 8, 11 |
| Polling not websockets (§3a) | 9, 10 |
| Patient view + minimal staff view (§3a) | 9, 10 |
| No clinical content (§3a) | schema in 5 carries name and level only |
| Ownership-split layout | `features/` and `specs/` product-owned; steps in `e2e/` |
| Position defined across all levels (§3a) | 3 — Plan C plants the ambiguity on it |
| `verify-setup` with unambiguous PASS/FAIL (2) | 12 |
| Pre-class developer setup (2) | 12 |
| `aiFix` enabled (§4c) | 11, with role locators that it can actually see |

**Reconciliation changes applied:** C1 validator (Task 8), C2 enum columns (5),
C3 in-memory tests (5), C4 contract package (1), C5 transactional re-triage (8),
C6 `truncateThreshold` (1), C7 role locators (9, 11), C8 per-row labels (10),
C9 `page.clock` (11), C10 `onError` (7), C11 steps in `e2e/` (11), C12 test reset
route (8), C13 `setVisit(null)` (9), C14 single browser with the reason in the
config (11), C15 hooks lint (10).

**Not in this plan, by design:** the three backlog features and the planted
ambiguity (Plan C), gate measurement and the classroom table (Plan B), the SDD kit
(Plan C), Plane and its MCP (Plan D).

**Risks flagged inline with fallbacks:** the `--experimental-strip-types` flag name
(Task 6 step 6) and `aiFix` support (Task 11 step 5). Everything else previously
listed as a risk — `:memory:` migration, transaction rollback semantics, enum column
typing, cross-package contract resolution, Vitest diff truncation — was **executed
on this machine** and is no longer a guess.
