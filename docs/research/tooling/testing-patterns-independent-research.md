# Research: Test structure for a small TypeScript app (Vitest + playwright-bdd), read by senior developers

**Date**: 2026-08-28 | **Researcher**: nw-researcher (Nova) | **Confidence**: TBD | **Sources**: TBD

> **Blind-study note.** This document was produced without reading
> `docs/superpowers/plans/2026-08-28-app-baseline.md`. Background was taken only from
> `docs/course-design-decisions.md`. Any agreement with the existing plan is independent
> convergence; any disagreement is an independent signal.

> **Tooling limitation — read this before trusting any "measured" claim.**
> The brief asked for empirical probes in a scratch directory ("empirical checks beat
> reading"). **This was not possible: no shell/Bash tool was available in this session's
> toolset** (only Read, Write, Edit, Glob, Grep, WebFetch, WebSearch). No code in this
> document has been executed. Every claim below is therefore documentation-derived, and
> the specific claims that *should* be probed before being trusted are listed explicitly
> in **Knowledge Gaps**, each with the exact 60-second experiment that would settle it.
> Given this project's own track record — §4a and §4b of `course-design-decisions.md`
> each record a well-cited conclusion falsified by a cheap experiment — treat the
> flagged items as hypotheses, not findings.

## Executive Summary
_placeholder — written last_

## Recommendation Table
_placeholder_

## Research Methodology
_placeholder_

## Findings

### Q1 — Database isolation for integration tests

**Recommendation: a fresh `:memory:` better-sqlite3 database per test, migrated with
Drizzle's `migrate()`, injected into the app. Not a temp file, not transaction rollback,
not truncate.**

#### Evidence

**E1.1 — better-sqlite3 supports in-memory and anonymous databases natively.**
"Pass `":memory:"` to create a database existing only in RAM." An empty string or no
argument creates a temporary database for the session. Creation "happens synchronously,
which means you can start executing queries right away."
Source: [better-sqlite3 API docs](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md) — Accessed 2026-08-28. Reputation: High (official project docs, MIT).
Confidence: **High**.

**E1.2 — Drizzle accepts an existing better-sqlite3 client instance.**
```ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
const sqlite = new Database('sqlite.db');
const db = drizzle({ client: sqlite });
```
Source: [Drizzle — Get started with SQLite](https://orm.drizzle.team/docs/get-started-sqlite) — Accessed 2026-08-28. Reputation: High (official).
This is the hook that makes `:memory:` work: `new Database(':memory:')` substitutes
directly for `new Database('sqlite.db')`.
**Verification status: partially verified.** Drizzle's own page does *not* show a
`:memory:` example (confirmed absent). The composition of E1.1 + E1.2 is an inference,
not a documented example. See Knowledge Gap G1.

**E1.3 — Schema can be applied programmatically to any connection.**
```ts
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
await migrate(db, { migrationsFolder: './drizzle' });
```
Source: [Drizzle — Migrations overview](https://orm.drizzle.team/docs/migrations) — Accessed 2026-08-28. Reputation: High (official). Confidence: **High**.

**E1.4 — "Integration tests are slow" is a property of out-of-process databases, not a law.**
Playwright's own guidance frames isolation as the primary property to protect: "Each test
should be completely isolated from another test and should run independently with its own
local storage, session storage, data, cookies etc."
Source: [Playwright — Best Practices](https://playwright.dev/docs/best-practices) — Accessed 2026-08-28. Reputation: High (official).
This project's own gate-catalogue research reached the same conclusion independently
(`docs/course-design-decisions.md` §4: "the traditional unit-vs-integration cost gap
largely collapses — 'integration tests are slow' is an artefact of Postgres and Docker").
That is convergence from two independent directions.

#### Analysis — why each rejected option loses

| Option | Fails on |
|---|---|
| **Fresh temp file per test** | Reintroduces a filesystem path. The hard constraint is *"tests must never touch the development database"*, and a path is exactly the thing that can be misconfigured. Also adds tmpdir creation, cleanup, and a class of Windows file-lock failures for zero benefit. |
| **Shared file + transaction rollback per test** | This idiom (Rails, Django, `pytest-django`) exists to amortise expensive connection/schema setup on a *server* database. With in-process SQLite there is nothing to amortise, so it is pure cost. It also couples every test to a wrapper, and breaks or behaves subtly if application code opens its own transaction or its own connection. **A senior developer would object to its presence at this size.** |
| **Truncate between tests** | Requires a maintained list of tables that drifts from the schema. Silent drift = a new table never cleaned = a state-leak flake, which is the one failure mode this project cannot afford. |
| **`:memory:` per test** | Only real cost: the schema must be created per test. At 2 tables that is negligible. |

**The decisive argument is structural, not performance.** With `:memory:` there is no
path, no file, no env var, and therefore *no way for a test to touch the development
database even if the wiring is wrong*. The constraint is enforced by physics rather than
by discipline. Every other option satisfies the constraint only as long as configuration
is correct — and configuration correctness is precisely what a course full of students
editing an unfamiliar repo will violate.

Note that `docs/course-design-decisions.md` decision 21 already reaches a compatible but
weaker position ("separate ephemeral test database + one-command `reset`"). `:memory:` is
the strictly stronger version of that decision for the *fast* layer: nothing to reset.
The `reset` command remains necessary for the E2E layer and the demo database.

#### The honest caveat — this constrains the application, not just the tests

`:memory:` databases are **per-connection**. If the backend creates a module-level
singleton connection from an env var, a test's in-memory database is invisible to the app
and the integration tests silently test the wrong database. In-memory isolation therefore
*requires* that the `db` handle be injectable — passed into route construction rather
than imported. This is a real design constraint that must be true of the app, and it is
worth stating out loud in the course because it is the same shape of argument as the
injectable clock (§3a constraint 2 of the design decisions): **testability forces
dependency injection at exactly two points, time and storage, and nowhere else.** Two
injection points is a defensible amount; a DI container would not be.

#### Recommended shape

```ts
// test/helpers/db.ts  — the entire isolation strategy, deliberately ~10 lines
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../src/db/schema';

export function createTestDb(): BetterSQLite3Database<typeof schema> {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');           // SQLite defaults this OFF
  const db = drizzle({ client: sqlite, schema });
  migrate(db, { migrationsFolder: './drizzle' });
  return db;
}
```

```ts
// test/queue-api.test.ts
import { beforeEach, expect, test } from 'vitest';
import { createApp } from '../src/app';
import { createTestDb } from './helpers/db';

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp({ db: createTestDb(), now: () => new Date('2026-03-01T09:00:00Z') });
});

test('re-triaging a patient to red moves them to the front of the queue', async () => {
  // ...
});
```

**`sqlite.pragma('foreign_keys = ON')` is not decoration.** SQLite disables foreign-key
enforcement by default, per-connection. Without it, integration tests pass against
referential integrity violations that a reviewer would assume are caught. This is one
line and a senior developer *would* object to its absence.
Source: [SQLite — Foreign Key Support](https://www.sqlite.org/foreignkeys.html) — Accessed 2026-08-28. Reputation: High (official). See §2 "Enabling Foreign Key Support".

#### Senior-developer test

1. Object to its **absence**? **Yes** — shared mutable database state across tests is a
   first-order review defect, and this project has declared flakiness catastrophic.
2. Object to its **presence**? **No** — it is one helper function of about ten lines with
   no abstraction layer, no base class, and no fixture framework.

**Verdict: adopt.**

### Q2 — Test data setup

**Recommendation: inline object literals by default; exactly one five-line
`aVisit(overrides)` helper per table once a literal is repeated with irrelevant fields.
No builder classes, no Object Mothers, no fixture files, no `faker`.**

#### Evidence

**E2.1 — Shared canned fixtures create coupling that is a known maintenance failure.**
Fowler describes an Object Mother as "a kind of class used in testing to help create
example objects that you use for testing", then states the cost directly:
> "Object Mothers do have their faults. In particular there's a heavy coupling in that
> many tests will depend on the exact data in the mothers."
Source: [Martin Fowler — ObjectMother](https://martinfowler.com/bliki/ObjectMother.html) — Accessed 2026-08-28. Reputation: Medium-High (industry leader, canonical author). Confidence: **Medium-High** (single source for the specific criticism; the pattern description is widely corroborated).

**E2.2 — The failure-output argument, which is specific to this project.**
This is an interpretation, labelled as such, not a sourced claim. When an assertion fails
with `expected triageLevel 1, got 3`, the reader's next question is *"where did 3 come
from?"* With an inline literal, the answer is on screen. With a factory, the answer is in
another file, and with a fluent builder it is distributed across a chain plus the
builder's defaults. Given this project's premise that **failing output is the agent's
self-correction signal**, indirection between the failure message and the data that
caused it is a direct cost — and it is a cost that scales with exactly the pattern
seniors are most tempted to add.

**E2.3 — Randomised data is disqualified outright.** The project states flakiness would be
catastrophic and that a live demo failure "would discredit the whole approach". `faker`
and property-style random inputs make a failure non-reproducible from the failure message
alone. Cross-references the project's own injectable-clock constraint
(`course-design-decisions.md` §3a constraint 2), which exists for the identical reason.
This is the same rule applied to a second nondeterminism source.

#### Analysis

| Option | Reads best? | Failure message quality | Verdict |
|---|---|---|---|
| **Inline object literals** | Yes at low repetition; noisy once a row has 6 columns and 4 of them are irrelevant | Best — the value in the message is literally on the screen | **Default** |
| **One `aX(overrides)` function per table** | Yes — relevant fields visible at the call site, irrelevant ones absent | Good — defaults are in one obvious five-line function | **Adopt at the second repetition** |
| **Builder class / fluent chain** | No at this size | Poor — value is assembled across a chain | **Reject** |
| **Object Mother / named personas** | No | Poor, plus Fowler's coupling problem (E2.1) | **Reject** |
| **JSON/YAML fixture files** | No — third file, untyped, invisible to `tsc` | Worst — no type error when the schema changes | **Reject.** Also contradicts decision 30's whole rationale: a fixture file moves a name error out of the ~77% typecheck band into the ~45% runtime band. |
| **`faker` / random data** | — | Non-reproducible | **Reject** (E2.3) |

The last row is worth its own sentence in the course. `docs/course-design-decisions.md`
decision 30 chose Drizzle specifically so that "a typo'd column becomes a `tsc` error […]
instead of a runtime failure". **An untyped JSON fixture file silently gives that back.**
A senior reviewer should be able to derive the rejection from the project's own stated
criterion, which is a much better teaching outcome than being told.

#### Recommended shape

```ts
// test/helpers/data.ts — one function per table, no class, no chaining
import type { NewVisit } from '../../src/db/schema';

export const T0 = new Date('2026-03-01T09:00:00Z');
export const minutesAfterT0 = (m: number) => new Date(T0.getTime() + m * 60_000);

export function aVisit(overrides: Partial<NewVisit> = {}): NewVisit {
  return {
    patientName: 'Ada',
    triageLevel: 3,
    arrivedAt: T0,
    status: 'waiting',
    ...overrides,
  };
}
```

```ts
// Usage: only the fields the test actually depends on appear.
const queue = orderQueue([
  aVisit({ patientName: 'Ada',   triageLevel: 3, arrivedAt: minutesAfterT0(0) }),
  aVisit({ patientName: 'Bjorn', triageLevel: 1, arrivedAt: minutesAfterT0(5) }),
  aVisit({ patientName: 'Chidi', triageLevel: 3, arrivedAt: minutesAfterT0(2) }),
]);

expect(queue.map((v) => v.patientName)).toEqual(['Bjorn', 'Ada', 'Chidi']);
```

Two deliberate details:

- **Every field the assertion depends on is restated at the call site even though the
  helper would default it.** `triageLevel: 3` for Ada is redundant against the default.
  It is restated because the test's *meaning* depends on it. The rule to teach:
  *defaults carry the fields the test does not care about; the test restates the fields
  it does.* This is what keeps a factory from becoming an Object Mother.
- **Names are chosen so the expected order is not alphabetical.** `Ada, Bjorn, Chidi` in,
  `Bjorn, Ada, Chidi` out. An accidental `sort()` by name would produce a green test with
  most name choices; with this choice it fails. Free, invisible, and exactly the kind of
  detail a senior reader notices and approves of.

#### Senior-developer test

1. Absence objection? **Yes, weakly** — repeating six columns across a dozen tests buries
   the two that matter, and a reviewer will say "extract the noise".
2. Presence objection? **No** for a five-line function with an `overrides` spread.
   **Yes** for anything with `.with…().build()`, a class, or named personas.

**Verdict: adopt the minimal helper; reject the pattern one step up from it.**

### Q3 — Assertion style and failure-output quality in Vitest

**Recommendation: assert on whole values with `toEqual`, raise
`chaiConfig.truncateThreshold`, and — counterintuitively — do *not* configure
`reporters`.**

This is the question where documentation actually yields a concrete, mechanical,
high-leverage answer rather than a principle.

#### E3.1 — Vitest truncates assertion values at 40 characters by default. This is the single biggest own-goal available.

> `chaiConfig.truncateThreshold` — **Type:** `number`, **Default:** `40`. "Sets length
> threshold for actual and expected values in assertion errors. If this threshold is
> exceeded […] the value is replaced with something like `[ Array(3) ]`".
Source: [Vitest — chaiConfig](https://vitest.dev/config/chaiconfig) — Accessed 2026-08-28. Reputation: High (official).

Chai, the underlying assertion library, documents the escape:
> "sets length threshold for actual and expected values in assertion errors. If this
> threshold is exceeded, the value is truncated. **Set it to zero if you want to disable
> truncating altogether.**" — example given: `chai.config.truncateThreshold = 0;`
Source: [Chai — Styles / config](https://www.chaijs.com/guide/styles/) — Accessed 2026-08-28. Reputation: High (official library docs).
**Cross-verified:** two independent sources (Vitest docs, Chai docs), same default, same semantics. Confidence: **High**.

**Why this matters more here than in a normal project.** A queue of five patients
serialised as an array exceeds 40 characters immediately. The default therefore converts
the exact assertion error this project needs — *"expected 3, got 2"* — into
`expected [ Array(5) ] to deeply equal [ Array(5) ]`, which is a **contentless** failure.
That is the degenerate assertion error, the ~45% repair band named in
`course-design-decisions.md` §4. Raising the threshold moves the same failure toward the
information-rich end of the same band at a cost of one config line.

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    // Default is 40 chars, which turns a five-patient queue into "[ Array(5) ]".
    // Test output here is agent feedback, so the values must survive.
    chaiConfig: { truncateThreshold: 0 },
  },
});
```

**Honest counterweight:** `0` means unbounded, and unbounded values are a token cost for
an agent — the same trade-off `course-design-decisions.md` §4a already recorded about
Drizzle's verbose type errors ("Good signal, high token cost"). At this app's data sizes
(a queue of single-digit length, two-table rows) unbounded is safe. For a project with
large fixtures, a finite value such as `500` is the better default. State the reasoning
in the comment so students see a *judgement*, not a magic number.

#### E3.2 — Do not set `reporters`. Vitest already detects agents and optimises for them.

> "**Minimal (alias: `agent`)** — Outputs a minimal report containing only failed tests
> and their error messages." And: "When Vitest detects it is running inside an AI coding
> agent, the `minimal` reporter is used instead to reduce output and minimize token
> usage." The minimal reporter is "well optimized for AI coding assistants and LLM-based
> workflows to reduce token usage" and activates automatically **unless custom reporters
> are configured.**
Source: [Vitest — Reporters](https://vitest.dev/guide/reporters) — Accessed 2026-08-28. Reputation: High (official).
Confidence: **Medium-High** — the auto-detection is documented, but the precise
condition under which an explicit `reporters` entry suppresses it is stated in one
sentence in one source. See Knowledge Gap G2.

This is the useful inversion for a room of senior developers. The instinct on being told
"test output quality is a first-class requirement" is to *add* configuration —
`reporters: ['verbose']` is the obvious move. Per the documentation, that instinct
**disables** the agent optimisation. The correct action is to add nothing.

`docs/course-design-decisions.md` §4 already cites this auto-detection as evidence for
the two-masters thesis; this research adds the operational consequence, which is a
prohibition rather than a feature.

#### E3.3 — Assert on the whole value, once; not on fields, repeatedly.

Vitest's `toEqual` "asserts if actual value is equal to received one or has the same
structure, if it is an object (compares them recursively)", whereas `toBe` compares
"primitives and object references using `Object.is()`".
Source: [Vitest — expect](https://vitest.dev/api/expect) — Accessed 2026-08-28. Reputation: High (official).

The consequence for failure output is mechanical, and it is the heart of the answer:

```ts
// ✗ Loses information. Fails at the first mismatch and stops; the reader learns
//   position 1 is wrong but not whether the rest of the ordering is also wrong.
expect(queue[0].name).toBe('Bjorn');
expect(queue[1].name).toBe('Ada');
expect(queue[2].name).toBe('Chidi');

// ✓ One assertion, full diff, whole shape of the failure visible at once.
expect(queue.map((v) => v.name)).toEqual(['Bjorn', 'Ada', 'Chidi']);
```

The second form prints both arrays and a positional diff. The first prints
`expected 'Ada' to be 'Bjorn'` and then *nothing about the remaining elements*, because
the test aborted. For an agent performing a repair round, the difference is between
"reorder these two" and "something is wrong somewhere in the ordering".

**Corollary — project the value before comparing.** `queue.map(v => v.name)` is not a
helper, an abstraction, or a matcher. It is one inline expression that makes the diff
about the thing under test (ordering) instead of about every column of every row. This is
the cheapest available improvement to failure output and requires no infrastructure.

#### E3.4 — Ban the contentless matchers on domain values

`toBeTruthy()`, `toBeDefined()`, `toBeGreaterThan(0)` and bare `expect(res.ok)` all
produce failures of the form `expected undefined to be truthy` — no expected value, no
actual value, nothing to diff. That is the *worst* case in the ~45% assertion band, and
it is self-inflicted. Every assertion about a domain value should carry the value it
expected. `toBeTruthy` is legitimate only for genuine booleans.

#### E3.5 — Matchers that earn their place, and one that does not

| Matcher | Use here | Verdict |
|---|---|---|
| `toEqual` | Whole projected values: queue order, estimate arrays, response bodies | **Default.** Structural diff. |
| `toStrictEqual` | Rarely — it additionally checks `undefined` keys, array sparseness, "object types are checked to be equal" | Use only if class identity matters. It will fail on plain-object vs class mismatches in ways that confuse readers here. |
| `toMatchObject` | HTTP response bodies where only some fields are asserted — "a subset of the properties of an object" | **Yes**, for endpoint tests. Avoids brittleness on `id`/timestamps. |
| `expect(fn).toThrowError(...)` | Validation and invariant violations. Docs: "wrap the code in a function, otherwise the error will not be caught" | **Yes**, with a message/class argument — never bare. |
| `expect.soft` | "continues running and marks the failure as a test failure" | **Sparingly.** Good for several independent facts about one HTTP response (status *and* body). Bad as a habit: it multiplies output. |
| `toMatchSnapshot` / `toMatchInlineSnapshot` | — | **No. Reject.** A snapshot failure says "snapshot mismatch" and the reflex it trains is `-u`. That is precisely the wrong reflex for both a student and an agent, and it makes a green suite cheap. A senior reviewer *would* object to its presence in a suite of this size and purpose. |
| `expect(x, 'message')` | Vitest supports a custom message as the second argument | **Sparingly, and verify first** — the docs say "the error message will be equal to it", which reads as *replacing* rather than augmenting the diff. If it replaces the diff, it is a net loss for agent feedback. See Knowledge Gap G3. |

Matcher semantics above quoted from [Vitest — expect](https://vitest.dev/api/expect) — Accessed 2026-08-28.

#### E3.6 — Leave `diff` alone

`diff.printBasicPrototype` defaults to `false` in Vitest (Jest's default was `true`, and
the noisy `Object {` / `Array [` prefixes are a common thing people configure away).
`diff.truncateThreshold` defaults to `0`, i.e. diffs are **not** truncated — only the
chai message prefix is (E3.1). `diff.maxDepth` is `20`.
Source: [Vitest — diff](https://vitest.dev/config/diff) — Accessed 2026-08-28. Reputation: High (official).

**So the only diff-related change worth making is the chai one.** Configuring `diff`
here would be over-engineering: it would change defaults that are already correct.
Worth saying out loud in the course, because "we tuned the diff options" sounds like
diligence and is actually noise.

#### Senior-developer test

1. Absence objection? **Yes** for E3.1 and E3.3–E3.4 — a reviewer who sees
   `expected [ Array(5) ] to deeply equal [ Array(5) ]` in a project that claims output
   quality is a first-class requirement will say so.
2. Presence objection? **No** — the total footprint is one config line, one comment, and
   a discipline about matcher choice. Custom matchers, a custom reporter, or a diff
   configuration block would all fail this test.

**Verdict: adopt E3.1–E3.5; explicitly decline custom reporters, custom matchers, `diff`
tuning and snapshots.**

### Q4 — Unit versus integration boundary

**Recommendation: every behaviour is asserted at exactly one layer — the lowest layer
that can express it. The ordering rules live *only* in unit tests of the pure function.
The HTTP/DB layer tests wiring, persistence and contract, never ordering permutations.
BDD tests business rules, one scenario per rule, never endpoints.**

#### Evidence

**E4.1 — The non-duplication rule is explicit and citable.**
> "Push your tests as far down the test pyramid as you can."
> "If a higher-level test spots an error and there's no lower-level test failing, you need
> to write a lower-level test."
> "I delete high-level tests that are already covered on a lower level (given they don't
> provide extra value)."
Source: [Ham Vocke — The Practical Test Pyramid, martinfowler.com](https://martinfowler.com/articles/practical-test-pyramid.html) — Accessed 2026-08-28. Reputation: Medium-High (industry leader). Confidence: **High** for the rule itself; it is the field's most-repeated guidance and is corroborated by Playwright's independent "test user-visible behavior … avoid relying on implementation details" framing.
Verification: [Playwright — Best Practices](https://playwright.dev/docs/best-practices) — Accessed 2026-08-28 (High).

**E4.2 — The agent-feedback argument sharpens the same rule.** This project already
measured the cost asymmetry: name errors repair at ~77%, assertion errors at ~45%, and
"an E2E failure says 'the scenario failed'" (`course-design-decisions.md` §4, "gates
serve two masters"). So duplication is not merely wasteful here — it actively *degrades*
the feedback signal, because a bug covered at three layers produces three failures of
which the loudest and least informative (E2E) is as likely to be read first. **The
argument for non-duplication is stronger in this project than in a normal one.**

#### The boundary, concretely

| Behaviour | Layer | Explicitly NOT tested at |
|---|---|---|
| Ordering: triage level first, then arrival time within level | **Unit** (pure function), exhaustively via `test.each` | Integration, E2E |
| Re-triage exception — worsened patient moves ahead | **Unit**, exhaustively | Integration, E2E (one E2E scenario exists, but as a *rule demonstration*, not as coverage) |
| Wait estimate arithmetic — `(patients ahead) × (avg minutes for level)` | **Unit**, including boundaries: empty queue, first in queue, ties | Integration, E2E |
| Tie-breaking on identical `arrivedAt` | **Unit** | anywhere else |
| A registered arrival is persisted and reappears on read | **Integration** (HTTP + in-memory DB) | Unit (no DB), E2E |
| Invalid payload → 400 with a usable error body | **Integration**, one representative case per endpoint | E2E |
| Unknown visit id → 404 | **Integration** | E2E |
| The ordering function is actually wired into `GET /queue` | **Integration**, exactly one assertion | Unit (can't), E2E |
| Re-triage is visible to a waiting patient without reloading | **BDD/E2E** — this is polling + UI, unexpressible below | — |
| A patient can see their position, level and estimate | **BDD/E2E**, one scenario | — |

**The single most important line in that table is "The ordering function is actually
wired into `GET /queue`", tested once.** That is the only thing the integration layer
knows that the unit layer cannot: that the correct function is called with the correct
arguments. Everything else at that layer is about persistence and HTTP contract. Once
that one wiring assertion exists, re-running ordering permutations through HTTP buys
nothing and costs a slower, less precise failure.

#### The deliberate duplication, and why it is not a violation

There **is** one intentional overlap: the E2E suite re-covers rules already unit-tested.
That is not redundancy in the pyramid sense, because its purpose is different — per
`course-design-decisions.md` §4, E2E "is the only check a product person can read against
their own acceptance criteria", and per decision 5 the feature files *are* the acceptance
criteria. Its value is **stakeholder-facing**, not defect-finding. Say this explicitly in
the repo, because otherwise a senior reader will correctly flag it as duplication. The
justification must be written down or the pattern looks like cargo-culting.

Rule of thumb to teach: **if you would delete an E2E scenario on Fowler's advice, and the
product person would object, keep it — and note *why* in the feature file's description.**

#### Recommended shape

```ts
// test/queue-order.test.ts — the pure function, exhaustive, no DB, no HTTP
import { describe, expect, test } from 'vitest';
import { orderQueue } from '../src/domain/queue';
import { aVisit, minutesAfterT0 } from './helpers/data';

describe('orderQueue', () => {
  test.each([
    {
      case: 'sorts by triage level before arrival time',
      given: [['Ada', 3, 0], ['Bjorn', 1, 5]] as const,
      expected: ['Bjorn', 'Ada'],
    },
    {
      case: 'sorts by arrival time within the same level',
      given: [['Chidi', 3, 2], ['Ada', 3, 0]] as const,
      expected: ['Ada', 'Chidi'],
    },
    {
      case: 'is empty for an empty queue',
      given: [] as const,
      expected: [],
    },
  ])('$case', ({ given, expected }) => {
    const visits = given.map(([patientName, triageLevel, m]) =>
      aVisit({ patientName, triageLevel, arrivedAt: minutesAfterT0(m) }),
    );
    expect(orderQueue(visits).map((v) => v.patientName)).toEqual(expected);
  });
});
```

`test.each` with a `$case` title is the right shape here for a failure-output reason: the
failing case is named in the output, so the reader (or agent) gets *which rule* broke
before reading the diff. A `for` loop over cases would collapse them into one test and
lose that.
Source for `test.each` and `$`-interpolated titles: [Vitest — Test API](https://vitest.dev/api/) — Accessed 2026-08-28. Reputation: High (official). **Verification status: unverified in this session** — the `$case` title syntax was not fetched; see Knowledge Gap G4.

```ts
// test/queue-api.test.ts — wiring, persistence, contract. NOT ordering rules.
test('GET /queue returns the ordered queue for the registered arrivals', async () => {
  await app.request('/visits', { method: 'POST', body: json(aVisit({ patientName: 'Ada',   triageLevel: 3 })) });
  await app.request('/visits', { method: 'POST', body: json(aVisit({ patientName: 'Bjorn', triageLevel: 1 })) });

  const res = await app.request('/queue');

  expect(res.status).toBe(200);
  // One wiring assertion. Ordering permutations belong to queue-order.test.ts.
  expect((await res.json()).map((v: { patientName: string }) => v.patientName))
    .toEqual(['Bjorn', 'Ada']);
});
```

#### Senior-developer test

1. Absence objection? **Yes.** A suite that runs the ordering matrix through HTTP is the
   single most common thing a senior reviewer flags, and it is the most likely mistake an
   agent will make unprompted.
2. Presence objection? **No.** The rule adds no code. It only removes tests.

**Verdict: adopt. This is the cheapest recommendation in the document and probably the
highest-value one for the audience.**

### Q5 — playwright-bdd step organisation
_placeholder_

### Q6 — Gherkin quality criteria
_placeholder_

### Q7 — Flakiness prevention in Playwright
_placeholder_

## What a senior reviewer would flag — checklist
_placeholder_

## Source Analysis
_placeholder_

## Knowledge Gaps
_placeholder_

## Conflicting Information
_placeholder_

## Full Citations
_placeholder_

## Research Metadata
_placeholder_
