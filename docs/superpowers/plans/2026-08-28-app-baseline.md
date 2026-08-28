# Legevakt Queue App Baseline — Implementation Plan (Plan A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the pre-built baseline application for the course — a live legevakt queue where patients see their position, triage level and estimated wait — with the determinism guarantees that make its BDD suite trustworthy in a classroom.

**Architecture:** npm workspaces with two packages: a Hono backend owning SQLite via Drizzle, and a Vite/React frontend that polls it. All queue logic lives in pure functions with no I/O so it is unit-testable without a database. Time enters the system through one injectable `Clock` so no test depends on the real wall clock. Gherkin feature files live at the repo root, outside both packages, because the product person owns them.

**Tech Stack:** TypeScript, Hono, Zod, `@hono/node-server`, Drizzle ORM + drizzle-kit on better-sqlite3, Vite + React, Vitest, playwright-bdd + Playwright.

## Global Constraints

- **Package manager: npm.** Not pnpm, not bun. npm ships with Node, so students install nothing extra. This is a failsafe-setup requirement, not a preference.
- **Everything in English** — code, comments, specs, feature files, docs, commit messages.
- **No Docker. No CI. No deploy.** Do not add `.github/workflows`, Dockerfiles or compose files.
- **No clinical content of any kind.** A visit carries a fictional name and a triage level. Nothing else. No symptoms, diagnoses, notes or free clinical text.
- **The clock is injectable everywhere.** No production code may call `new Date()` or `Date.now()` outside `backend/src/clock.ts`.
- **The wait estimate is a defined pure function, never a prediction.**
- **"Live" means polling at 15 seconds.** No websockets, no SSE.
- **Tests never touch the development database.** The test database is a separate file, recreated per run.
- **Gates stay unwired.** Every check is an individually runnable npm script. Do not add husky, lint-staged, commitlint, or any git hook. Plan B composes them; this plan only creates them.
- **Node ≥ 22** (for stable modern APIs). Development happens on Node 26.5.
- **Ownership-split layout is mandatory:** `specs/` and `features/` at the repo root belong to the product person; `backend/src/` and `frontend/src/` belong to the developer. Never put a feature file inside a package.

---

## File Structure

```
package.json                     # workspace root; delegating scripts only
tsconfig.base.json               # shared compiler options
scripts/dev.mjs                  # starts backend + frontend, no dependency
scripts/verify-setup.mjs         # unambiguous PASS/FAIL for pre-class setup
backend/
  package.json
  tsconfig.json
  drizzle.config.ts
  src/
    clock.ts                     # Clock type, systemClock, fixedClock
    domain/triage.ts             # levels, priorities, average consultation minutes
    domain/queue.ts              # orderQueue, positionOf, estimatedWaitMinutes (pure)
    domain/queue.test.ts         # unit tests for the above
    db/schema.ts                 # Drizzle tables
    db/client.ts                 # createDb(file)
    db/migrate.ts                # applyMigrations(db)
    db/seed.ts                   # seedDemoData(db, clock)
    api/app.ts                   # createApp({db, clock, allowTestRoutes})
    api/app.test.ts              # integration tests against a real SQLite file
    server.ts                    # process entry point
frontend/
  package.json
  tsconfig.json
  vite.config.ts
  index.html
  src/
    main.tsx
    api.ts                       # typed fetch helpers
    PatientView.tsx              # position, level, estimate; polls every 15s
    StaffView.tsx                # register arrival, re-triage, change status
    App.tsx                      # trivial hash routing between the two
features/                        # PRODUCT PERSON OWNS THIS
  queue-position.feature
  steps/fixtures.ts
  steps/queue.steps.ts
specs/                           # PRODUCT PERSON OWNS THIS (empty for now, .gitkeep)
playwright.config.ts
```

**Deviation from §3a of the decisions document, recorded deliberately:** the indicative data model listed `Patient → Visit → TriageEvent`. This plan uses **two** tables, folding the patient's fictional name onto the visit. A separate `Patient` table would carry no field the course uses, and every table is a thing students must read and an opportunity for setup to fail. `TriageEvent` is kept because the cycle-3 queue-aging amendment needs re-triage history.

---

### Task 1: Workspace skeleton that installs, typechecks and tests

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `.gitignore`
- Create: `backend/package.json`, `backend/tsconfig.json`
- Create: `backend/src/domain/triage.ts`, `backend/src/domain/triage.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `TriageLevel` (union of `'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'BLUE'`), `TRIAGE_LEVELS`, `TRIAGE_PRIORITY: Record<TriageLevel, number>`, `AVERAGE_CONSULTATION_MINUTES: Record<TriageLevel, number>`

- [ ] **Step 1: Create the workspace root**

`package.json`:

```json
{
  "name": "kurs-produktutvikling",
  "private": true,
  "type": "module",
  "workspaces": ["backend", "frontend"],
  "engines": { "node": ">=22" },
  "scripts": {
    "typecheck": "npm run typecheck -w backend",
    "test": "npm run test -w backend"
  }
}
```

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

`.gitignore`:

```
node_modules/
data/
dist/
test-results/
playwright-report/
.cucumber-report/
```

- [ ] **Step 2: Create the backend package**

`backend/package.json`:

```json
{
  "name": "backend",
  "private": true,
  "type": "module",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "better-sqlite3": "^13.0.3",
    "drizzle-orm": "^0.45.2",
    "hono": "^4.13.5",
    "@hono/node-server": "^2.1.1",
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
  "include": ["src"]
}
```

- [ ] **Step 3: Write the failing test**

`backend/src/domain/triage.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  AVERAGE_CONSULTATION_MINUTES,
  TRIAGE_LEVELS,
  TRIAGE_PRIORITY,
} from './triage.js';

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

- [ ] **Step 4: Run it and watch it fail**

```bash
npm install
npm test
```

Expected: FAIL — `Failed to resolve import "./triage.js"`.

- [ ] **Step 5: Write the implementation**

`backend/src/domain/triage.ts`:

```ts
export const TRIAGE_LEVELS = ['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE'] as const;

export type TriageLevel = (typeof TRIAGE_LEVELS)[number];

/** Lower number means more urgent. Patients are served in this order. */
export const TRIAGE_PRIORITY: Record<TriageLevel, number> = {
  RED: 1,
  ORANGE: 2,
  YELLOW: 3,
  GREEN: 4,
  BLUE: 5,
};

/**
 * How many minutes a consultation takes on average for a patient at this level.
 * These are constants on purpose: the wait estimate must be a defined function,
 * not a prediction.
 */
export const AVERAGE_CONSULTATION_MINUTES: Record<TriageLevel, number> = {
  RED: 30,
  ORANGE: 25,
  YELLOW: 20,
  GREEN: 15,
  BLUE: 10,
};

export function isTriageLevel(value: string): value is TriageLevel {
  return (TRIAGE_LEVELS as readonly string[]).includes(value);
}
```

- [ ] **Step 6: Run tests and typecheck**

```bash
npm test
npm run typecheck
```

Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.base.json .gitignore backend/
git commit -m "Add npm workspace skeleton and triage level constants"
```

---

### Task 2: Queue ordering

**Files:**
- Create: `backend/src/domain/queue.ts`
- Create: `backend/src/domain/queue.test.ts`

**Interfaces:**
- Consumes: `TriageLevel`, `TRIAGE_PRIORITY` from Task 1
- Produces: `type WaitingVisit = { id: string; level: TriageLevel; arrivedAt: Date }`, `orderQueue(visits: WaitingVisit[]): WaitingVisit[]`

- [ ] **Step 1: Write the failing test**

`backend/src/domain/queue.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { orderQueue, type WaitingVisit } from './queue.js';

const at = (hhmm: string): Date => new Date(`2026-03-01T${hhmm}:00.000Z`);

const visit = (id: string, level: WaitingVisit['level'], time: string): WaitingVisit => ({
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
import { TRIAGE_PRIORITY, type TriageLevel } from './triage.js';

export type WaitingVisit = {
  id: string;
  level: TriageLevel;
  arrivedAt: Date;
};

/**
 * The queue invariant: triage level first, then arrival time within a level.
 * Pure and total — it never reads the clock and never touches the database.
 */
export function orderQueue(visits: WaitingVisit[]): WaitingVisit[] {
  return [...visits].sort((a, b) => {
    const byLevel = TRIAGE_PRIORITY[a.level] - TRIAGE_PRIORITY[b.level];
    if (byLevel !== 0) return byLevel;
    return a.arrivedAt.getTime() - b.arrivedAt.getTime();
  });
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: PASS, 3 tests in `queue.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/domain/queue.ts backend/src/domain/queue.test.ts
git commit -m "Add queue ordering: triage level then arrival time"
```

---

### Task 3: Position and the wait estimate

**Files:**
- Modify: `backend/src/domain/queue.ts`
- Modify: `backend/src/domain/queue.test.ts`

**Interfaces:**
- Consumes: `orderQueue`, `WaitingVisit`, `AVERAGE_CONSULTATION_MINUTES`
- Produces: `positionOf(visits: WaitingVisit[], visitId: string): number | null`, `estimatedWaitMinutes(visits: WaitingVisit[], visitId: string): number | null`

**Definition being implemented** — record it in the code, because the whole point is that the estimate is *defined* rather than guessed:

> `estimatedWaitMinutes` = the sum, over every patient ahead of you in the ordered queue, of the average consultation minutes for **that patient's** level. The patient at the front waits 0. One consultation room is assumed.

> `positionOf` = your 1-based index in the **whole** ordered queue, across all levels.

Note for later: Plan C plants an ambiguity on exactly this second definition. Implement it as written here; do not add a per-level variant.

- [ ] **Step 1: Write the failing tests**

Append to `backend/src/domain/queue.test.ts`:

```ts
import { estimatedWaitMinutes, positionOf } from './queue.js';

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
    const queue = [visit('a', 'GREEN', '09:00')];

    expect(estimatedWaitMinutes(queue, 'a')).toBe(0);
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
import { AVERAGE_CONSULTATION_MINUTES } from './triage.js';

/** Your 1-based place in the whole queue, across all triage levels. */
export function positionOf(visits: WaitingVisit[], visitId: string): number | null {
  const index = orderQueue(visits).findIndex((v) => v.id === visitId);
  return index === -1 ? null : index + 1;
}

/**
 * Sum of the average consultation minutes of every patient ahead of you,
 * using each of those patients' own triage level. One consultation room.
 * This is a definition, not a prediction: the same queue always gives the
 * same number.
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

Merge the two `./triage.js` imports into one statement so the file has a single import per module.

- [ ] **Step 4: Run tests and typecheck**

```bash
npm test
npm run typecheck
```

Expected: PASS, 9 tests total.

- [ ] **Step 5: Commit**

```bash
git add backend/src/domain/queue.ts backend/src/domain/queue.test.ts
git commit -m "Add queue position and defined wait estimate"
```

---

### Task 4: The injectable clock

**Files:**
- Create: `backend/src/clock.ts`
- Create: `backend/src/clock.test.ts`

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

Expected: PASS, 12 tests total.

- [ ] **Step 5: Commit**

```bash
git add backend/src/clock.ts backend/src/clock.test.ts
git commit -m "Add injectable clock so no test depends on wall time"
```

---

### Task 5: Database schema and migrations

**Files:**
- Create: `backend/src/db/schema.ts`, `backend/src/db/client.ts`, `backend/src/db/migrate.ts`
- Create: `backend/drizzle.config.ts`
- Create: `backend/drizzle/` (generated)
- Modify: `backend/package.json` (add `db:generate`, `db:migrate` scripts)

**Interfaces:**
- Consumes: `TriageLevel`
- Produces: `visits` and `triageEvents` Drizzle tables; `createDb(file: string): Db`; `applyMigrations(db: Db): void`

- [ ] **Step 1: Write the schema**

`backend/src/db/schema.ts`:

```ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * A single visit to the legevakt. The patient's name is fictional and is the
 * only personal field: this app deliberately holds no clinical content.
 */
export const visits = sqliteTable('visits', {
  id: text('id').primaryKey(),
  patientName: text('patient_name').notNull(),
  level: text('level').notNull(),
  status: text('status').notNull().default('WAITING'),
  arrivedAt: integer('arrived_at', { mode: 'timestamp_ms' }).notNull(),
});

/** History of triage level changes. Needed by the queue-aging amendment. */
export const triageEvents = sqliteTable('triage_events', {
  id: text('id').primaryKey(),
  visitId: text('visit_id')
    .notNull()
    .references(() => visits.id),
  fromLevel: text('from_level'),
  toLevel: text('to_level').notNull(),
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

- [ ] **Step 2: Generate the migration and confirm it appears**

Add to `backend/package.json` scripts:

```json
"db:generate": "drizzle-kit generate"
```

Run:

```bash
npm run db:generate -w backend
```

Expected: prints `2 tables` and writes `backend/drizzle/0000_*.sql`. Open that file and confirm it contains `CREATE TABLE `visits`` and `CREATE TABLE `triage_events``.

- [ ] **Step 3: Write the failing test for the client**

`backend/src/db/client.test.ts`:

```ts
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { applyMigrations } from './migrate.js';
import { createDb } from './client.js';
import { visits } from './schema.js';

let dir: string | undefined;

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = undefined;
});

describe('createDb', () => {
  it('creates a usable database with the schema applied', () => {
    dir = mkdtempSync(join(tmpdir(), 'legevakt-'));
    const db = createDb(join(dir, 'test.sqlite'));

    applyMigrations(db);
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
});
```

- [ ] **Step 4: Run and watch it fail**

```bash
npm test
```

Expected: FAIL — cannot resolve `./client.js`.

- [ ] **Step 5: Write the implementation**

`backend/src/db/client.ts`:

```ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

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
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { Db } from './client.js';

const migrationsFolder = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../drizzle',
);

export function applyMigrations(db: Db): void {
  migrate(db, { migrationsFolder });
}
```

- [ ] **Step 6: Run tests**

```bash
npm test
```

Expected: PASS, 13 tests total. If `migrate` cannot find the folder, print `migrationsFolder` and correct the relative path — it must resolve to `backend/drizzle` from the compiled module location.

- [ ] **Step 7: Commit**

```bash
git add backend/src/db backend/drizzle.config.ts backend/drizzle backend/package.json
git commit -m "Add SQLite schema, Drizzle client and migration runner"
```

---

### Task 6: Seed data and the reset command

**Files:**
- Create: `backend/src/db/seed.ts`
- Create: `backend/src/db/seed.test.ts`
- Create: `scripts/reset.mjs`
- Modify: `package.json` (root `reset` script)

**Interfaces:**
- Consumes: `Db`, `Clock`, `visits`
- Produces: `seedDemoData(db: Db, clock: Clock): void` — inserts five waiting visits at fixed offsets before `clock.now()`

- [ ] **Step 1: Write the failing test**

`backend/src/db/seed.test.ts`:

```ts
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { fixedClock } from '../clock.js';
import { orderQueue } from '../domain/queue.js';
import { applyMigrations } from './migrate.js';
import { createDb } from './client.js';
import { seedDemoData } from './seed.js';
import { visits } from './schema.js';

let dir: string | undefined;

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = undefined;
});

describe('seedDemoData', () => {
  it('creates a queue with more than one triage level represented', () => {
    dir = mkdtempSync(join(tmpdir(), 'legevakt-'));
    const db = createDb(join(dir, 'test.sqlite'));
    applyMigrations(db);

    seedDemoData(db, fixedClock(new Date('2026-03-01T09:00:00.000Z')));

    const rows = db.select().from(visits).all();
    expect(rows.length).toBeGreaterThanOrEqual(5);
    expect(new Set(rows.map((r) => r.level)).size).toBeGreaterThan(1);
  });

  it('is deterministic: the same clock produces the same queue order', () => {
    dir = mkdtempSync(join(tmpdir(), 'legevakt-'));
    const clock = fixedClock(new Date('2026-03-01T09:00:00.000Z'));

    const first = createDb(join(dir, 'a.sqlite'));
    applyMigrations(first);
    seedDemoData(first, clock);

    const second = createDb(join(dir, 'b.sqlite'));
    applyMigrations(second);
    seedDemoData(second, clock);

    const order = (db: ReturnType<typeof createDb>) =>
      orderQueue(
        db
          .select()
          .from(visits)
          .all()
          .map((r) => ({ id: r.id, level: r.level as 'GREEN', arrivedAt: r.arrivedAt })),
      ).map((v) => v.id);

    expect(order(first)).toEqual(order(second));
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
import type { Clock } from '../clock.js';
import type { TriageLevel } from '../domain/triage.js';
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
  db.delete(triageEvents).run();
  db.delete(visits).run();

  const now = clock.now().getTime();

  for (const row of DEMO_QUEUE) {
    db.insert(visits)
      .values({
        id: row.id,
        patientName: row.patientName,
        level: row.level,
        status: 'WAITING',
        arrivedAt: new Date(now - row.minutesAgo * 60_000),
      })
      .run();
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: PASS, 15 tests total.

- [ ] **Step 5: Add the reset command**

`scripts/reset.mjs`:

```js
#!/usr/bin/env node
import { rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const file = process.env.DB_FILE ?? 'data/legevakt.sqlite';

rmSync(file, { force: true });
rmSync(`${file}-wal`, { force: true });
rmSync(`${file}-shm`, { force: true });

execFileSync(process.execPath, ['--experimental-strip-types', 'backend/src/db/reset-entry.ts'], {
  stdio: 'inherit',
  env: { ...process.env, DB_FILE: file },
});

console.log(`Reset complete. Database recreated at ${file}`);
```

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

Add to root `package.json` scripts:

```json
"reset": "node scripts/reset.mjs"
```

- [ ] **Step 6: Run reset twice and confirm it is idempotent**

```bash
npm run reset
npm run reset
```

Expected: both print `Reset complete.` with no error. If `--experimental-strip-types` is rejected by the installed Node, change `reset.mjs` to invoke `node --experimental-transform-types` instead, and record which flag worked in the README during Task 12.

- [ ] **Step 7: Commit**

```bash
git add backend/src/db/seed.ts backend/src/db/seed.test.ts backend/src/db/reset-entry.ts scripts/reset.mjs package.json
git commit -m "Add deterministic demo seed and one-command reset"
```

---

### Task 7: The queue API

**Files:**
- Create: `backend/src/api/app.ts`
- Create: `backend/src/api/app.test.ts`

**Interfaces:**
- Consumes: `Db`, `Clock`, `orderQueue`, `positionOf`, `estimatedWaitMinutes`
- Produces: `createApp(deps: { db: Db; clock: Clock; allowTestRoutes?: boolean }): Hono`, serving `GET /api/queue` and `GET /api/visits/:id`

Response shapes, relied on by the frontend in Tasks 9–10 and the step definitions in Task 11:

```ts
type QueueEntry = {
  id: string;
  patientName: string;
  level: TriageLevel;
  position: number;
  estimatedWaitMinutes: number;
};
// GET /api/queue      -> { now: string; entries: QueueEntry[] }
// GET /api/visits/:id -> { id, patientName, level, status, position, estimatedWaitMinutes }
//                        404 { error: 'visit not found' } when unknown
```

- [ ] **Step 1: Write the failing test**

`backend/src/api/app.test.ts`:

```ts
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fixedClock } from '../clock.js';
import { createDb, type Db } from '../db/client.js';
import { applyMigrations } from '../db/migrate.js';
import { visits } from '../db/schema.js';
import { createApp } from './app.js';

let dir: string;
let db: Db;
const clock = fixedClock(new Date('2026-03-01T10:00:00.000Z'));

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'legevakt-'));
  db = createDb(join(dir, 'test.sqlite'));
  applyMigrations(db);
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const arrive = (id: string, level: string, minutesAgo: number) =>
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

    const app = createApp({ db, clock });
    const response = await app.request('/api/queue');
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

    const app = createApp({ db, clock });
    const body = await (await app.request('/api/queue')).json();

    expect(body.entries.map((e: { id: string }) => e.id)).toEqual(['waiting']);
  });
});

describe('GET /api/visits/:id', () => {
  it('returns that patient position and estimate', async () => {
    arrive('a', 'GREEN', 60);
    arrive('b', 'GREEN', 30);

    const app = createApp({ db, clock });
    const body = await (await app.request('/api/visits/b')).json();

    expect(body.position).toBe(2);
    expect(body.estimatedWaitMinutes).toBe(15);
  });

  it('returns 404 for an unknown visit', async () => {
    const app = createApp({ db, clock });
    const response = await app.request('/api/visits/nobody');

    expect(response.status).toBe(404);
  });
});
```

Add `import { eq } from 'drizzle-orm';` at the top of the test file.

- [ ] **Step 2: Run and watch it fail**

```bash
npm test
```

Expected: FAIL — cannot resolve `./app.js`.

- [ ] **Step 3: Write the implementation**

`backend/src/api/app.ts`:

```ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { eq } from 'drizzle-orm';
import type { Clock } from '../clock.js';
import type { Db } from '../db/client.js';
import { visits } from '../db/schema.js';
import type { TriageLevel } from '../domain/triage.js';
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

function waitingVisits(db: Db): (WaitingVisit & { patientName: string })[] {
  return db
    .select()
    .from(visits)
    .where(eq(visits.status, 'WAITING'))
    .all()
    .map((row) => ({
      id: row.id,
      patientName: row.patientName,
      level: row.level as TriageLevel,
      arrivedAt: row.arrivedAt,
    }));
}

export function createApp(deps: AppDeps) {
  const app = new Hono();
  app.use('/api/*', cors());

  app.get('/api/queue', (c) => {
    const waiting = waitingVisits(deps.db);

    const entries = orderQueue(waiting).map((visit, index) => {
      const full = waiting.find((w) => w.id === visit.id);
      return {
        id: visit.id,
        patientName: full?.patientName ?? '',
        level: visit.level,
        position: index + 1,
        estimatedWaitMinutes: estimatedWaitMinutes(waiting, visit.id) ?? 0,
      };
    });

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

Expected: PASS, 19 tests total.

- [ ] **Step 5: Commit**

```bash
git add backend/src/api
git commit -m "Add queue API with position and estimated wait"
```

---

### Task 8: Staff actions and the test-only clock route

**Files:**
- Modify: `backend/src/api/app.ts`
- Modify: `backend/src/api/app.test.ts`
- Create: `backend/src/server.ts`

**Interfaces:**
- Produces: `POST /api/visits`, `POST /api/visits/:id/triage`, `POST /api/visits/:id/status`, and `POST /api/test/clock` (only when `allowTestRoutes` is true)

Request bodies, relied on by Task 10 and Task 11:

```ts
// POST /api/visits              { patientName: string; level: TriageLevel } -> 201 { id }
// POST /api/visits/:id/triage   { level: TriageLevel }                      -> 200 { id, level }
// POST /api/visits/:id/status   { status: 'WAITING'|'IN_CONSULTATION'|'DONE'|'LEFT' } -> 200 { id, status }
// POST /api/test/clock          { now: string }  -> 200 { now }   (test routes only)
```

- [ ] **Step 1: Write the failing tests**

Append to `backend/src/api/app.test.ts`:

```ts
describe('staff actions', () => {
  it('registers an arrival at the current clock time', async () => {
    const app = createApp({ db, clock });

    const created = await app.request('/api/visits', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ patientName: 'Nils Aas', level: 'YELLOW' }),
    });
    const { id } = await created.json();

    expect(created.status).toBe(201);
    const row = db.select().from(visits).where(eq(visits.id, id)).get();
    expect(row?.arrivedAt.toISOString()).toBe('2026-03-01T10:00:00.000Z');
  });

  it('rejects an unknown triage level', async () => {
    const app = createApp({ db, clock });

    const response = await app.request('/api/visits', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ patientName: 'Nils Aas', level: 'PURPLE' }),
    });

    expect(response.status).toBe(400);
  });

  it('re-triage moves a patient up the queue', async () => {
    arrive('green', 'GREEN', 60);
    arrive('blue', 'BLUE', 10);
    const app = createApp({ db, clock });

    await app.request('/api/visits/blue/triage', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ level: 'RED' }),
    });

    const body = await (await app.request('/api/queue')).json();
    expect(body.entries[0].id).toBe('blue');
  });
});

describe('test-only clock route', () => {
  it('is absent unless test routes are allowed', async () => {
    const app = createApp({ db, clock });

    const response = await app.request('/api/test/clock', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ now: '2026-03-01T12:00:00.000Z' }),
    });

    expect(response.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run and watch them fail**

```bash
npm test
```

Expected: FAIL — the POST routes return 404.

- [ ] **Step 3: Write the implementation**

Add to `backend/src/api/app.ts`, inside `createApp` before `return app;`:

```ts
  const levelSchema = z.enum(TRIAGE_LEVELS);
  const statusSchema = z.enum(['WAITING', 'IN_CONSULTATION', 'DONE', 'LEFT']);

  app.post('/api/visits', async (c) => {
    const parsed = z
      .object({ patientName: z.string().min(1), level: levelSchema })
      .safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.message }, 400);

    const id = randomUUID();
    deps.db
      .insert(visits)
      .values({
        id,
        patientName: parsed.data.patientName,
        level: parsed.data.level,
        status: 'WAITING',
        arrivedAt: deps.clock.now(),
      })
      .run();

    return c.json({ id }, 201);
  });

  app.post('/api/visits/:id/triage', async (c) => {
    const id = c.req.param('id');
    const parsed = z.object({ level: levelSchema }).safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.message }, 400);

    const row = deps.db.select().from(visits).where(eq(visits.id, id)).get();
    if (!row) return c.json({ error: 'visit not found' }, 404);

    deps.db.update(visits).set({ level: parsed.data.level }).where(eq(visits.id, id)).run();
    deps.db
      .insert(triageEvents)
      .values({
        id: randomUUID(),
        visitId: id,
        fromLevel: row.level,
        toLevel: parsed.data.level,
        occurredAt: deps.clock.now(),
      })
      .run();

    return c.json({ id, level: parsed.data.level });
  });

  app.post('/api/visits/:id/status', async (c) => {
    const id = c.req.param('id');
    const parsed = z.object({ status: statusSchema }).safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.message }, 400);

    const row = deps.db.select().from(visits).where(eq(visits.id, id)).get();
    if (!row) return c.json({ error: 'visit not found' }, 404);

    deps.db.update(visits).set({ status: parsed.data.status }).where(eq(visits.id, id)).run();
    return c.json({ id, status: parsed.data.status });
  });

  if (deps.allowTestRoutes) {
    app.post('/api/test/clock', async (c) => {
      const parsed = z.object({ now: z.iso.datetime() }).safeParse(await c.req.json());
      if (!parsed.success) return c.json({ error: parsed.error.message }, 400);

      const settable = deps.clock as { set?: (next: Date) => void };
      if (!settable.set) return c.json({ error: 'clock is not settable' }, 400);

      settable.set(new Date(parsed.data.now));
      return c.json({ now: parsed.data.now });
    });
  }
```

Add these imports at the top of the file:

```ts
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { triageEvents } from '../db/schema.js';
import { TRIAGE_LEVELS } from '../domain/triage.js';
```

If `z.iso.datetime()` is not available in the installed Zod version, use `z.string()` and validate with `!Number.isNaN(Date.parse(value))` instead — record which one worked in the commit message.

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: PASS, 23 tests total.

- [ ] **Step 5: Create the server entry point**

`backend/src/server.ts`:

```ts
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { serve } from '@hono/node-server';
import { systemClock, fixedClock, type Clock } from './clock.js';
import { createApp } from './api/app.js';
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

Add to `backend/package.json` scripts:

```json
"dev": "node --experimental-strip-types --watch src/server.ts",
"start": "node --experimental-strip-types src/server.ts"
```

- [ ] **Step 6: Start it and check by hand**

```bash
npm run reset
npm run dev -w backend
```

In another terminal:

```bash
curl -s http://localhost:3001/api/queue
```

Expected: JSON with five seeded entries, `Maja Solum` (ORANGE) first, each carrying `position` and `estimatedWaitMinutes`. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add backend/src backend/package.json
git commit -m "Add staff actions, test-only clock route and server entry point"
```

---

### Task 9: Frontend shell and the patient view

**Files:**
- Create: `frontend/package.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`, `frontend/index.html`
- Create: `frontend/src/main.tsx`, `frontend/src/api.ts`, `frontend/src/App.tsx`, `frontend/src/PatientView.tsx`

**Interfaces:**
- Consumes: `GET /api/queue`, `GET /api/visits/:id` from Task 7
- Produces: a page at `#/visit/:id` showing position, level and estimated wait, refreshing every 15 seconds

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
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^5.0.0",
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
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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

- [ ] **Step 2: Write the API client and the patient view**

`frontend/src/api.ts`:

```ts
export type TriageLevel = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'BLUE';

export type QueueEntry = {
  id: string;
  patientName: string;
  level: TriageLevel;
  position: number;
  estimatedWaitMinutes: number;
};

export type VisitView = {
  id: string;
  patientName: string;
  level: TriageLevel;
  status: string;
  position: number | null;
  estimatedWaitMinutes: number | null;
};

export async function fetchQueue(): Promise<{ now: string; entries: QueueEntry[] }> {
  const response = await fetch('/api/queue');
  if (!response.ok) throw new Error(`queue request failed: ${response.status}`);
  return response.json();
}

export async function fetchVisit(id: string): Promise<VisitView> {
  const response = await fetch(`/api/visits/${id}`);
  if (!response.ok) throw new Error(`visit request failed: ${response.status}`);
  return response.json();
}
```

`frontend/src/PatientView.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { fetchVisit, type VisitView } from './api';

const REFRESH_MS = 15_000;

export function PatientView({ visitId }: { visitId: string }) {
  const [visit, setVisit] = useState<VisitView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const next = await fetchVisit(visitId);
        if (!cancelled) {
          setVisit(next);
          setError(null);
        }
      } catch (cause) {
        if (!cancelled) setError(String(cause));
      }
    };

    void load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [visitId]);

  if (error) return <p data-testid="error">{error}</p>;
  if (!visit) return <p>Loading…</p>;

  return (
    <main>
      <h1>Hello, {visit.patientName}</h1>
      <p>
        Your triage level is <strong data-testid="level">{visit.level}</strong>
      </p>
      <p>
        You are number <strong data-testid="position">{visit.position ?? '-'}</strong> in the
        queue
      </p>
      <p>
        Estimated wait:{' '}
        <strong data-testid="estimate">{visit.estimatedWaitMinutes ?? '-'}</strong> minutes
      </p>
    </main>
  );
}
```

`frontend/src/App.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { PatientView } from './PatientView';
import { StaffView } from './StaffView';

function currentHash(): string {
  return window.location.hash.replace(/^#/, '');
}

export function App() {
  const [route, setRoute] = useState(currentHash());

  useEffect(() => {
    const onChange = () => setRoute(currentHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const visitMatch = /^\/visit\/(.+)$/.exec(route);
  if (visitMatch?.[1]) return <PatientView visitId={visitMatch[1]} />;
  return <StaffView />;
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

- [ ] **Step 3: Commit (StaffView follows in Task 10)**

`App.tsx` imports `StaffView`, which does not exist yet, so typecheck will fail until Task 10. Commit now anyway — Task 10 is the immediate next step and this keeps the two views in separate reviewable commits.

```bash
git add frontend/
git commit -m "Add frontend shell, API client and patient view"
```

---

### Task 10: The minimal staff view

**Files:**
- Create: `frontend/src/StaffView.tsx`
- Modify: `package.json` (root `dev` and `typecheck` scripts)
- Create: `scripts/dev.mjs`

**Interfaces:**
- Consumes: `POST /api/visits`, `POST /api/visits/:id/triage`, `POST /api/visits/:id/status`, `GET /api/queue`
- Produces: a staff page at any hash other than `#/visit/:id`

Deliberately plain. This is not a real triage interface and should not grow into one.

- [ ] **Step 1: Write the staff view**

`frontend/src/StaffView.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import { fetchQueue, type QueueEntry, type TriageLevel } from './api';

const LEVELS: TriageLevel[] = ['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE'];

export function StaffView() {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [name, setName] = useState('');
  const [level, setLevel] = useState<TriageLevel>('GREEN');

  const reload = useCallback(async () => {
    setEntries((await fetchQueue()).entries);
  }, []);

  useEffect(() => {
    void reload();
    const timer = setInterval(() => void reload(), 15_000);
    return () => clearInterval(timer);
  }, [reload]);

  const post = async (path: string, body: unknown) => {
    await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    await reload();
  };

  return (
    <main>
      <h1>Staff — queue</h1>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          void post('/api/visits', { patientName: name, level }).then(() => setName(''));
        }}
      >
        <input
          aria-label="Patient name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <select
          aria-label="Triage level"
          value={level}
          onChange={(event) => setLevel(event.target.value as TriageLevel)}
        >
          {LEVELS.map((option) => (
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
            <tr key={entry.id} data-testid={`queue-row-${entry.id}`}>
              <td>{entry.position}</td>
              <td>
                <a href={`#/visit/${entry.id}`}>{entry.patientName}</a>
              </td>
              <td>{entry.level}</td>
              <td>{entry.estimatedWaitMinutes} min</td>
              <td>
                <select
                  aria-label={`Re-triage ${entry.patientName}`}
                  value={entry.level}
                  onChange={(event) =>
                    void post(`/api/visits/${entry.id}/triage`, { level: event.target.value })
                  }
                >
                  {LEVELS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => void post(`/api/visits/${entry.id}/status`, { status: 'DONE' })}
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

- [ ] **Step 2: Write the dev launcher**

No dependency — `concurrently` and `npm-run-all` are both avoidable here.

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

Update root `package.json` scripts:

```json
{
  "scripts": {
    "dev": "node scripts/dev.mjs",
    "reset": "node scripts/reset.mjs",
    "typecheck": "npm run typecheck -w backend && npm run typecheck -w frontend",
    "test": "npm run test -w backend",
    "build": "npm run build -w frontend"
  }
}
```

- [ ] **Step 3: Run the whole app and check both views**

```bash
npm install
npm run reset
npm run dev
```

Open `http://localhost:5173`. Expected: the staff table lists five seeded patients, Maja Solum (ORANGE) first. Click a patient name — the patient view shows their level, position and estimate. Re-triage someone to RED and confirm they jump to position 1 after the table reloads.

- [ ] **Step 4: Typecheck and commit**

```bash
npm run typecheck
git add frontend/src/StaffView.tsx scripts/dev.mjs package.json
git commit -m "Add minimal staff view and dependency-free dev launcher"
```

---

### Task 11: playwright-bdd with one worked scenario

**Files:**
- Create: `playwright.config.ts`
- Create: `features/queue-position.feature`
- Create: `features/steps/fixtures.ts`, `features/steps/queue.steps.ts`
- Create: `specs/.gitkeep`
- Modify: root `package.json` (add `test:e2e`, `bdd:gen`)
- Modify: root `package.json` devDependencies

**Interfaces:**
- Consumes: the API from Tasks 7–8 and the views from Tasks 9–10
- Produces: `npm run test:e2e` running Gherkin scenarios against a real server with a fixed clock

Steps arrange state through the API and assert through the UI. That is deliberate: driving setup through the staff UI would make every scenario depend on the staff view's markup, and the staff view is throwaway.

- [ ] **Step 1: Add the dependencies**

Add to root `package.json`:

```json
"devDependencies": {
  "@playwright/test": "^1.56.0",
  "playwright-bdd": "^9.2.0"
}
```

Then:

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
```

- [ ] **Step 3: Write the step definitions**

`features/steps/fixtures.ts`:

```ts
import { test as base, createBdd } from 'playwright-bdd';

export const API = 'http://localhost:3001';

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

`features/steps/queue.steps.ts`:

```ts
import { expect } from '@playwright/test';
import { API, Given, Then, When } from './fixtures';

/** Matches CLOCK_FIXED_AT in playwright.config.ts. */
const NOW = new Date('2026-03-01T10:00:00.000Z');

Given('the clinic queue is empty', async ({ request }) => {
  const response = await request.get(`${API}/api/queue`);
  const { entries } = await response.json();

  for (const entry of entries) {
    await request.post(`${API}/api/visits/${entry.id}/status`, {
      data: { status: 'DONE' },
    });
  }
});

Given(
  '{string} arrived {int} minutes ago with triage level {string}',
  async ({ request, visitIds }, name: string, minutesAgo: number, level: string) => {
    await request.post(`${API}/api/test/clock`, {
      data: { now: new Date(NOW.getTime() - minutesAgo * 60_000).toISOString() },
    });

    const created = await request.post(`${API}/api/visits`, {
      data: { patientName: name, level },
    });
    const { id } = await created.json();
    visitIds.set(name, id);

    await request.post(`${API}/api/test/clock`, { data: { now: NOW.toISOString() } });
  },
);

When('{string} opens their queue view', async ({ page, visitIds }, name: string) => {
  const id = visitIds.get(name);
  expect(id, `no visit registered for ${name}`).toBeTruthy();
  await page.goto(`/#/visit/${id}`);
});

Then('they see position {int}', async ({ page }, expected: number) => {
  await expect(page.getByTestId('position')).toHaveText(String(expected));
});

Then('they see an estimated wait of {int} minutes', async ({ page }, expected: number) => {
  await expect(page.getByTestId('estimate')).toHaveText(String(expected));
});
```

- [ ] **Step 4: Write the Playwright config**

`playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'features/steps/**/*.ts',
  aiFix: { promptAttachment: true },
});

export default defineConfig({
  testDir,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
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
"bdd:gen": "bddgen",
"test:e2e": "bddgen && playwright test"
```

Add `.features-gen/` to `.gitignore`.

- [ ] **Step 5: Delete any stale test database and run the suite**

```bash
rm -f data/test.sqlite data/test.sqlite-wal data/test.sqlite-shm
npm run test:e2e
```

Expected: 2 scenarios pass. The test database is `data/test.sqlite`, never `data/legevakt.sqlite` — confirm the dev database is untouched by checking that the staff view still shows the five seeded patients after the run.

If `aiFix` is rejected by the installed playwright-bdd, remove that option, run again, and record the fact in the commit message — Plan B depends on it and needs to know.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts features/ specs/.gitkeep package.json .gitignore
git commit -m "Add playwright-bdd with two worked queue scenarios"
```

---

### Task 12: verify-setup and the pre-class README

**Files:**
- Create: `scripts/verify-setup.mjs`
- Create: `README.md`
- Modify: root `package.json`

**Interfaces:**
- Produces: `npm run verify-setup` printing an unambiguous `PASS` or `FAIL` with a numbered reason

The dangerous pre-class failure is not "I could not get it working" — it is "I thought it was working." This script exists to make that impossible.

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

check('The native SQLite binding loads', async () => {
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

Add to root `package.json` scripts:

```json
"verify-setup": "node scripts/verify-setup.mjs"
```

- [ ] **Step 2: Run it and confirm PASS**

```bash
npm run verify-setup
```

Expected: six `ok` lines and `PASS`.

- [ ] **Step 3: Confirm it actually fails when something is broken**

```bash
mv node_modules node_modules.bak && npm run verify-setup; mv node_modules.bak node_modules
```

Expected: `FAIL` with a numbered reason and exit code 1. A verify script that cannot fail is worthless — this step proves it can.

- [ ] **Step 4: Write the README**

`README.md`:

```markdown
# Legevakt queue — course baseline

A small app for a course on process design with AI agents. Patients waiting at a
legevakt see their position in the queue, their triage level and an estimated
wait. Staff register arrivals and re-triage.

All data is fictional. The app holds no clinical content of any kind.

## Before the course (developers only)

Your pair only needs **one** working machine — the developer's. Do this in advance,
not on the morning of the course.

1. Install Node 22 or newer: https://nodejs.org
2. Clone this repository
3. Install and check:

   ```bash
   npm install
   npm run verify-setup
   ```

   You must see `PASS`. If you see `FAIL`, the output lists what to fix. Bring
   that output to class if you get stuck.

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
| `npm run typecheck` | Type-checks both packages |
| `npm test` | Unit and integration tests |
| `npm run test:e2e` | Gherkin scenarios in a real browser |
| `npm run build` | Production build of the frontend |

None of these run automatically. There are no git hooks and no CI — which checks
run, and when, is something you decide during the course.

## Layout

| Path | Owner |
|---|---|
| `specs/`, `features/` | Product |
| `backend/src/`, `frontend/src/` | Development |

## How the queue works

Patients are seen in triage-level order (RED, ORANGE, YELLOW, GREEN, BLUE), and
by arrival time within a level.

The estimated wait is a **definition, not a prediction**: it is the sum of the
average consultation minutes of every patient ahead of you, using each of those
patients' own triage level. One consultation room is assumed. The same queue
always produces the same number.

Time enters the system through a single injectable clock (`backend/src/clock.ts`).
No test depends on the real wall clock.
```

- [ ] **Step 5: Commit**

```bash
git add scripts/verify-setup.mjs README.md package.json
git commit -m "Add verify-setup check and pre-class README"
```

---

### Task 13: Gate scripts, unwired

**Files:**
- Modify: root `package.json`
- Create: `backend/eslint.config.js` *(only if lint is added — see step 1)*

**Interfaces:**
- Produces: every check as an individually runnable npm script, none of them wired together

Plan B documents these with runtimes and agent-feedback ratings and builds the classroom table. This task only guarantees each one exists and runs alone.

- [ ] **Step 1: Confirm the check list**

The scripts that must exist and run independently:

| Script | Command |
|---|---|
| `typecheck` | `npm run typecheck -w backend && npm run typecheck -w frontend` |
| `test` | `npm run test -w backend` |
| `test:e2e` | `bddgen && playwright test` |
| `build` | `npm run build -w frontend` |
| `db:check` | `npm run db:generate -w backend -- --check` |
| `deps:check` | `node scripts/check-native-deps.mjs` |

Do **not** add a combined `verify` or `check` script. Composing them is the students' exercise.

Lint and format are deliberately left out of this task: Plan B decides between ESLint and Biome on measured evidence, and adding one now would prejudge it.

- [ ] **Step 2: Write the native-dependency guard**

This enforces the failsafe-setup constraint from §4a — `better-sqlite3` ships prebuilds, but a future dependency could reintroduce compilation.

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

- [ ] **Step 3: Add the scripts**

Root `package.json` scripts block, complete:

```json
{
  "scripts": {
    "dev": "node scripts/dev.mjs",
    "reset": "node scripts/reset.mjs",
    "verify-setup": "node scripts/verify-setup.mjs",
    "typecheck": "npm run typecheck -w backend && npm run typecheck -w frontend",
    "test": "npm run test -w backend",
    "test:e2e": "bddgen && playwright test",
    "build": "npm run build -w frontend",
    "db:check": "npm run db:generate -w backend -- --check",
    "deps:check": "node scripts/check-native-deps.mjs"
  }
}
```

- [ ] **Step 4: Run each one individually**

```bash
npm run typecheck
npm test
npm run build
npm run db:check
npm run deps:check
npm run test:e2e
```

Expected: all six pass, run one at a time. If `db:generate -- --check` is not supported by the installed drizzle-kit, replace `db:check` with `drizzle-kit check` and note the change in the commit message.

- [ ] **Step 5: Confirm no hooks were installed**

```bash
ls .husky 2>/dev/null; cat package.json | grep -c '"prepare"'
```

Expected: no `.husky` directory, and `0` occurrences of `prepare`. Gates stay unwired.

- [ ] **Step 6: Commit**

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
| SQLite, no Docker (26) | 5, and no Dockerfile anywhere |
| No CI/CD (11) | No workflows created; Task 13 step 5 verifies |
| Gate catalogue unwired (12/13) | 13 |
| Three test layers, none mandatory (22) | Unit 2–4, integration 7–8, BDD 11 |
| Separate test DB + reset (21) | 6, 11 (`DB_FILE=data/test.sqlite`) |
| Everything English (18) | Throughout |
| Wait estimate is a defined function (§3a) | 3 |
| Injectable clock (§3a) | 4, used in 7, 8, 11 |
| Polling not websockets (§3a) | 9, 10 (`REFRESH_MS = 15_000`) |
| Patient view + minimal staff view (§3a) | 9, 10 |
| No clinical content (§3a) | Schema in 5 has name and level only |
| Ownership-split layout | `features/`, `specs/` at root; Task 11, 12 |
| Position defined across all levels (§3a) | 3 — Plan C plants the ambiguity on it |
| `verify-setup` with unambiguous PASS/FAIL (2) | 12 |
| Pre-class developer setup (2) | 12 README |
| `aiFix` enabled (§4c) | 11 |

**Not in this plan, by design:** the three backlog features and the planted ambiguity (Plan C), the gate catalogue's documentation and measurements (Plan B), the SDD kit (Plan C), Plane and its MCP (Plan D).

**Known risks flagged inline for the implementer:** the `--experimental-strip-types` flag name (Task 6 step 6), `z.iso.datetime()` availability (Task 8 step 3), `aiFix` support (Task 11 step 5), and `drizzle-kit --check` (Task 13 step 4). Each has a stated fallback and an instruction to record which worked.
