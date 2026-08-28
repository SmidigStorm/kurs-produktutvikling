# Research: Test structure for a small TypeScript app (Vitest + playwright-bdd), read by senior developers

**Date**: 2026-08-28 | **Researcher**: nw-researcher (Nova) | **Confidence**: Medium-High (High on documented mechanics; reduced because no code was executed — see G0) | **Sources**: 26 external (25 official, 1 industry-leader author with 2 works) + 1 local constraint document

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

**Six of the seven answers are subtractive.** For an application of this size — two
tables, five endpoints, one non-trivial pure function — the evidence points overwhelmingly
at *not adding things*: no page objects, no builder hierarchies, no custom matchers, no
custom reporter, no snapshots, no retries, no transaction-rollback machinery, no
cross-browser matrix. The total additive surface that survives scrutiny is a ten-line
database helper, a five-line test-data function, one configuration line, and clock
control. That distribution is itself the finding, and it is the right shape for an
audience whose more likely failure mode is over-engineering rather than sloppiness.

**Three recommendations are concrete enough to act on immediately and would not be
guessed.** First, **Vitest truncates assertion values at 40 characters by default**
(`chaiConfig.truncateThreshold`), which silently converts a five-patient queue comparison
into `expected [ Array(5) ] to deeply equal [ Array(5) ]` — a contentless failure, the
degenerate form of the ~45 % assertion band this project measured. One config line fixes
it. Second, **Vitest already auto-switches to an agent-optimised reporter when it detects
an AI coding agent, and per its documentation that stops if `reporters` is configured** —
so the instinctive response to "output quality is a first-class requirement" (adding
`reporters: ['verbose']`) makes things worse. Third, **`page.clock.fastForward` removes
the 15–30 second polling interval from the E2E suite entirely**, which is the single
largest flakiness risk in a live-demonstrated BDD suite for a domain built on "now".

**On database isolation, the decisive argument turned out to be structural rather than
performance.** A fresh `:memory:` better-sqlite3 database per test satisfies the "never
touch the development database" constraint by making it *physically impossible* — there
is no path to misconfigure — whereas temp files, transaction rollback and truncation all
satisfy it only while configuration stays correct. Transaction rollback in particular is
an idiom that exists to amortise expensive server-database setup; in-process SQLite has
nothing to amortise, so importing the pattern is pure cost. The honest price is that
in-memory isolation *requires* the database handle to be injectable — which, together
with the injectable clock this project already mandates, gives exactly two dependency-
injection seams. Two is defensible; a third would need an argument, and that boundary is
worth teaching explicitly.

**Three caveats bound this document.** (1) **No code was executed** — the requested
empirical probes were impossible because no shell tool was available in this session, so
the most load-bearing unverified item, "does `:memory:` work end-to-end with Drizzle's
`migrate()`", is written up as Gap G1 with a three-minute experiment rather than as a
finding; Drizzle's own documentation contains no `:memory:` example. (2) Three genuine
**source conflicts** are recorded rather than smoothed over, including playwright-bdd
recommending two different step styles on the same page and Playwright's official advice
to test all browsers, which this project should deliberately decline *with the reason
written in the config file*. (3) The Gherkin guidance rests on three pages from a single
publisher (Cucumber) and therefore qualifies under the one-authoritative-source rule, not
the three-source rule. **The document's most reusable output is not any single
recommendation but the two-question test applied consistently to every pattern**: object
to its absence at this size? object to its presence? — which is what the reviewer
checklist operationalises.

## Recommendation Table

Code column shows the *shape*; full versions with rationale are in the Findings section.

| # | Question | Recommendation | Why | Shape |
|---|---|---|---|---|
| 1 | DB isolation | **Fresh `:memory:` better-sqlite3 per test**, migrated with Drizzle's `migrate()`, injected into the app | The constraint "never touch the dev database" becomes *physically impossible* rather than a configuration to get right. No file, no path, no cleanup. Rollback/truncate exist to amortise server-DB setup cost that in-process SQLite does not have | `const db = drizzle({ client: new Database(':memory:') }); migrate(db, {migrationsFolder:'./drizzle'})` — plus `pragma('foreign_keys = ON')`, which SQLite leaves **off** by default |
| 2 | Test data | **Inline literals; one `aVisit(overrides)` per table at the second repetition.** No builders, no Object Mothers, no fixture files, no `faker` | Indirection between the failure message and the data that caused it is a direct cost when output *is* the agent's signal. Fowler: Object Mothers create "heavy coupling in that many tests will depend on the exact data". A JSON fixture also un-does decision 30 by moving a name error back out of the typecheck band | `function aVisit(o: Partial<NewVisit> = {}): NewVisit { return { patientName:'Ada', triageLevel:3, arrivedAt:T0, status:'waiting', ...o }; }` |
| 3 | Assertion style | **Assert whole projected values with `toEqual`; set `chaiConfig.truncateThreshold`; do NOT set `reporters`; ban `toBeTruthy` on domain values; no snapshots** | Vitest truncates assertion values at **40 chars** by default, turning a five-patient queue into `[ Array(5) ]` — a contentless failure. And Vitest already auto-switches to the `minimal`/`agent` reporter inside AI agents, *unless custom reporters are configured*: the instinct to "improve output" by setting `reporters` makes it worse | `chaiConfig: { truncateThreshold: 0 }` + `expect(queue.map(v => v.name)).toEqual(['Bjorn','Ada','Chidi'])` |
| 4 | Unit/integration boundary | **Every behaviour at exactly one layer — the lowest that can express it.** Ordering + estimate arithmetic: unit only, exhaustive. HTTP layer: persistence, contract, and **exactly one** "the ordering function is wired in" assertion. E2E: business rules, one per rule | Fowler: "Push your tests as far down the test pyramid as you can"; "I delete high-level tests that are already covered on a lower level". Sharper here: duplicated coverage produces three failures of which the least informative (E2E, ~45% band) is as likely to be read first | `test.each([...])('$case', …)` for the pure function; one `expect(body.map(v=>v.patientName)).toEqual([...])` in the API test |
| 5 | playwright-bdd steps | **Playwright-style arrow functions + fixtures. One steps file. `features/` (product-owned) separate from `e2e/steps/` (dev-owned). Declarative wording. Arrange via API except when the arrangement *is* the behaviour. Data-table Given. Fixed server clock + `page.clock` in the browser** | Decorators need a Page Object Model — a class per screen over two screens, one of them deliberately ugly. Scoped steps solve collisions this app cannot have. `page.clock.fastForward` makes the 15–30 s poll deterministic and instant, so the suite never sleeps | `Given('the following patients are waiting:', async ({request}, table) => …)`; `When('the queue refreshes', ({page}) => page.clock.fastForward('00:30'))` |
| 6 | Gherkin quality | **Eleven checkable rules, four `grep`-able.** No UI vocabulary; one `When` per scenario; Background ≤ 4 lines; every `Then` patient-observable; step count sub-linear in scenario count | The degraded form describes *what the tester does to the program*; the readable form describes *what is true of the world*. Cucumber's own test: "Will this wording need to change if the implementation does?" | `grep -inE '\b(click\|button\|field\|navigate\|url)\b' features/` returns nothing |
| 7 | Playwright flakiness | **Five things matter:** web-first assertions, role-based locators, `fullyParallel` isolation, deterministic seeding, controlled time. **Reject:** retries, cross-browser matrix, sharding, hard sleeps, explicit `waitFor*`, timeout inflation, `describe.serial` | Playwright states it directly: "using non-retrying assertions can lead to a flaky test". Retries only *relabel* flake — and with no CI (decision 11) the usual justification is absent; in a live demo a retry is 20 s of silence or a real bug turned green | `await expect(loc).toHaveText('2')` — check `grep -n 'expect(await ' e2e/` returns nothing; `retries: 0`, `fullyParallel: true`, chromium only |

**The through-line.** Six of the seven answers are *subtractive*: assert on whole values
rather than more values, test each behaviour once rather than at three layers, add no
reporter, add no builder, add no page object, add no retries. The only genuinely additive
recommendations are one ten-line DB helper, one five-line data function, one config line,
and clock control. **That distribution is itself the finding** for an audience whose more
likely failure mode is over-engineering.

## Research Methodology

**Search strategy.** Vendor documentation first, in every case. For each of the seven
questions the relevant primary authority was identified up front (playwright.dev,
vitest.dev, chaijs.com, cucumber.io, orm.drizzle.team, sqlite.org, and playwright-bdd's
repository), and fetched directly rather than discovered through search. No general web
search was needed or used, which is deliberate: `course-design-decisions.md` §4 records
six SEO/AI-generated "2026 benchmark" articles found and rejected in earlier work on this
project, and restricting to first-party documentation removes that failure mode by
construction. Two supplementary industry sources (martinfowler.com) were used for the
layering and test-data questions, where the authority is a body of practice rather than a
tool.

**A tooling note that shaped the method.** `vitalets.github.io/playwright-bdd` is a
docsify single-page app and returns an empty shell to a fetcher. All playwright-bdd
evidence was therefore taken from `raw.githubusercontent.com` markdown in the project
repository — the same text the site renders, at higher fidelity, with the `_sidebar.md`
used as the page index. Similarly, `vitest.dev/config/` renders as navigation only; the
per-option pages (`/config/chaiconfig`, `/config/diff`) carry the content.

**Source selection.** Types: official vendor documentation (25 of 27 sources), industry
leader (2). Minimum reputation accepted: Medium-High. No Medium-tier or excluded-tier
source was cited. Verification: each claim cross-referenced against an independent page
or an independent vendor where one exists; where it does not, the finding is marked
"single source" and its confidence reduced accordingly.

**Quality standards applied.** Target 3 sources per claim, minimum 1 authoritative. Claims
resting on a single vendor page are labelled Medium confidence in the findings and their
verification status stated inline. Inferences that compose two documented facts into an
undocumented conclusion (notably `:memory:` + Drizzle) are labelled **"partially
verified"** at the point of use and repeated in Knowledge Gaps with an experiment.
Statements that are judgement rather than evidence are marked **"interpretation
(labelled)"**.

**The two-question filter.** Every candidate pattern was evaluated against the brief's
test — *would a senior developer object to its absence at this size? would they object to
its presence?* — and a per-question verdict recorded at the end of each finding. Patterns
that failed the second question were rejected explicitly and named, rather than omitted,
because for this audience the rejections carry as much teaching value as the adoptions.

**What was deliberately not consulted.** `docs/superpowers/plans/2026-08-28-app-baseline.md`
was not read, opened or grepped, per the blind-study instruction. Prior research documents
in `docs/research/` were also left unread to avoid anchoring; only
`docs/course-design-decisions.md` was used, and only for requirements, constraints and the
§4 gate-catalogue background on error-output quality.

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

**Recommendation: playwright-style steps (arrow functions + fixtures); one steps file for
the whole app; feature files in `features/`, step definitions in `e2e/steps/`, wired with
explicit `features`/`steps` globs; declarative wording; arrange via the API except where
the arrangement *is* the behaviour; a data-table step as the main defence against step
explosion; a fixed server clock plus `page.clock` in the browser.**

#### E5.1 — Style: playwright-style. And a real conflict in the vendor's own docs.

> "**Playwright-style** is the recommended approach for new projects. Steps are written as
> Playwright tests with fixtures passed as parameters."
> "**Cucumber-style** uses `this` to access the world […] This suits teams migrating from
> CucumberJS."
> "**Decorators** involve marking Page Object Model class methods as steps […] This
> approach is recommended for all project types."
Source: [playwright-bdd — Writing steps (overview)](https://github.com/vitalets/playwright-bdd/blob/main/docs/writing-steps/index.md) — Accessed 2026-08-28. Reputation: High (official project docs).

**These two recommendations conflict** (see Conflicting Information C1). Resolution for
this project: playwright-style. Cucumber-style is explicitly scoped to CucumberJS
migration, which does not apply. Decorators require a Page Object Model — a class per
screen — and this app has two screens, one of which is deliberately "ugly and thin"
(`course-design-decisions.md` §3a). **A POM hierarchy over two screens is the canonical
over-engineering failure this brief warns about**, and it would be the first thing a
senior reviewer flagged.

Style detail from the docs: playwright-style steps "can (and should) be defined as arrow
functions", and "Step functions accept custom fixtures as the first argument, and the rest
are step parameters".
Source: [playwright-bdd — Playwright-style](https://github.com/vitalets/playwright-bdd/blob/main/docs/writing-steps/playwright-style.md) — Accessed 2026-08-28.

Also useful and non-obvious: "there are no `And()` / `But()` functions, as these keywords
are used only for better semantics in `.feature` files." So `And` in Gherkin does not
create a step definition — which is precisely why `And` chains are cheap to write and
therefore need a *style* rule rather than a mechanical one (see Q6).

#### E5.2 — Declarative wording, with a documented test that is actually checkable

> Prefer "**When 'Bob' logs in**" over steps that enter credentials in specific fields and
> click buttons. "**Will this wording need to change if the implementation does?**" If
> yes, rework it to remove implementation-specific details.
> Declarative style is "more resilient to UI changes" and produces scenarios that "will be
> a lot shorter and much easier to follow and understand".
Source: [Cucumber — Writing better Gherkin](https://cucumber.io/docs/bdd/better-gherkin/) — Accessed 2026-08-28. Reputation: High (official, the tool's own vendor). Confidence: **High**.

**Independent convergence worth recording:** this research reached the same negative
verdict on playwright-bdd's `examples/ai` Gherkin that `course-design-decisions.md` §4c
recorded (`I click link "Get started"` is UI mechanics). The vendor's *examples* are
imperative while the vendor's *style guidance* — and Cucumber's — are declarative. That
is a second, independent reason to expect that an agent left to itself will write
imperative Gherkin, and therefore that the `spec` command needs an explicit guardrail.

#### E5.3 — Step explosion: the root cause is named, and the fix is a data table

Cucumber names the mechanism:
> "**Feature-coupled step definitions** — Step definitions that **can't be reused** across
> features or scenarios." The remedy is to "organize steps by domain concept rather than
> feature or scenario names."
> "**Conjunction steps**" — steps that combine multiple unrelated actions — should be
> split using `And`/`But`. And: avoid "calling steps from step definitions", using helper
> methods instead.
Source: [Cucumber — Anti-patterns](https://cucumber.io/docs/guides/anti-patterns/) — Accessed 2026-08-28. Reputation: High (official).

Three mechanical defences, in order of leverage for this domain:

1. **One data-table Given for arrangement.** This is by far the biggest lever. A queue
   scenario needs N patients; N per-patient Given steps is N sentences and a linear
   growth in Gherkin. One table step is one definition forever:
   ```gherkin
   Given the following patients are waiting:
     | name  | triage level | arrived         |
     | Ada   | 3            | 09:00           |
     | Bjorn | 1            | 09:05           |
   ```
   playwright-bdd supports data tables ([docs/writing-steps/data-tables.md](https://github.com/vitalets/playwright-bdd/blob/main/docs/writing-steps/data-tables.md), listed in the official sidebar — Accessed 2026-08-28). It also happens to read *better* to a non-technical stakeholder than five prose sentences, so Q6 and Q5 agree here.
2. **Cucumber-expression parameters.** `{string}`, `{int}` collapse many sentences into
   one definition. Documented for both step styles.
3. **Organise by domain concept.** At this size that means **one file**:
   `e2e/steps/queue.steps.ts`. Splitting into `queue.steps.ts` / `re-triage.steps.ts`
   *is* the feature-coupling anti-pattern in embryo, and with roughly ten step definitions
   there is nothing to navigate.

**Explicitly reject `scoped` steps.** Scoped/tagged step definitions exist because "in
large projects […] maintaining unique step names across all domains becomes difficult" and
they resolve `Error: Multiple definitions matched scenario step!`
(Source: [playwright-bdd — Scoped steps](https://github.com/vitalets/playwright-bdd/blob/main/docs/writing-steps/scoped.md) — Accessed 2026-08-28). This app has one domain and cannot produce that collision. Senior test: absence objection **no**, presence objection **yes**. Reject.

#### E5.4 — Where the files live

The configuration surface is explicit:
> `features` — "location of feature files using directory paths or glob patterns"; `steps` — "where step definitions are located via directory or glob pattern"; `featuresRoot` — "a base directory for constructing generated file paths within `outputDir`. The behavior mirrors TypeScript's `rootDir`"; since v8 it is "the default base for both `features` and `steps` if those options aren't explicitly defined". `outputDir` defaults to `.features-gen`.
Source: [playwright-bdd — Configuration options](https://github.com/vitalets/playwright-bdd/blob/main/docs/configuration/options.md) — Accessed 2026-08-28. Reputation: High (official).
The getting-started guide's flat layout (`sample.feature` and `steps.js` in the project
root, `.features-gen/` gitignored) is a minimal example, not a recommended structure.
Source: [playwright-bdd — Write first test](https://github.com/vitalets/playwright-bdd/blob/main/docs/getting-started/write-first-test.md) — Accessed 2026-08-28.

**Recommendation, and it is driven by a project constraint rather than by the tool.**
`course-design-decisions.md` records an "ownership-split directory layout — product-person
artifacts (`specs/`, `features/`) and developer artifacts (`src/`) in non-overlapping
directories", kept "as a structural principle" and because it "makes the Cowork
spec-authoring path clean". Co-locating step definitions next to feature files — the
default habit in most Cucumber projects — **violates that constraint**, because step
definitions are developer artifacts.

```
features/                     # product person's territory. .feature files only.
  queue-order.feature
  re-triage.feature
e2e/
  steps/queue.steps.ts        # developer territory. One file.
  fixtures.ts                 # custom fixtures + createBdd(test)
.features-gen/                # generated, gitignored
```

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  // features and steps live in different trees (ownership split), so featuresRoot's
  // "default base for both" behaviour does not apply — set both explicitly.
  features: 'features/**/*.feature',
  steps: 'e2e/steps/**/*.ts',
  featuresRoot: 'features',
  // §4c of the design decisions: this is what turns "the scenario failed" into a
  // prompt carrying the error, the steps so far, the code, and an ARIA snapshot.
  aiFix: { promptAttachment: true },
});

export default defineConfig({
  testDir,
  fullyParallel: true,
  retries: 0,                 // see Q7 — retries hide flakiness, and there is no CI
  reporter: [['html'], ['list']],
});
```

The `featuresRoot: 'features'` line deserves a comment in the real repo: it controls the
*generated* path layout under `.features-gen`, which is what appears in stack traces. With
features and steps in separate trees, leaving it unset produces deeper generated paths and
noisier traces — a small but real hit on failure-output quality.
**Verification status: partially verified.** The `featuresRoot`-as-`rootDir` behaviour is
documented; the specific effect on trace readability in this two-tree layout is my
inference. See Knowledge Gap G5.

#### E5.5 — Arrange through the API, act through the UI — with one deliberate exception

Playwright's own guidance points this way: "Each test should be completely isolated […]
with its own local storage, session storage, data, cookies etc.", and "use the Playwright
Network API and guarantee the response needed" rather than depending on things you do not
control.
Source: [Playwright — Best Practices](https://playwright.dev/docs/best-practices) — Accessed 2026-08-28.

Arranging a queue through the staff UI would make *every* patient-view scenario depend on
the staff screen — the same coupling Cucumber names as an anti-pattern, expressed
structurally instead of textually. It also multiplies the flake surface, which this
project cannot afford.

**The exception, and it is not a compromise:** the scenario whose subject *is* staff
registration must arrange through the UI, because there the registration is the behaviour
under test, not scaffolding. State the rule as:

> Arrange through the API. Arrange through the UI only when the arrangement is the
> behaviour the scenario is about.

```ts
// e2e/steps/queue.steps.ts
import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

Given(
  'the following patients are waiting:',
  async ({ request }, table: { hashes(): Array<{ name: string; 'triage level': string; arrived: string }> }) => {
    for (const row of table.hashes()) {
      const res = await request.post('/api/visits', {
        data: {
          patientName: row.name,
          triageLevel: Number(row['triage level']),
          arrivedAt: `2026-03-01T${row.arrived}:00Z`,
        },
      });
      expect(res.ok(), `arranging ${row.name} failed: ${res.status()}`).toBe(true);
    }
  },
);

Then('{string} is number {int} in the queue', async ({ page }, name: string, position: number) => {
  await expect(page.getByRole('listitem').filter({ hasText: name })).toHaveAttribute(
    'data-position',
    String(position),
  );
});
```

Note the message on the arrangement assertion. **A failed *arrange* step is the worst
possible E2E failure** — the scenario reports a wrong position when in fact the setup
never happened. One string turns that into a located, named failure. This is the E2E-layer
equivalent of E3.4 and it costs nothing.

#### E5.6 — Determinism under time: two clocks, and only one of them is the server's

Playwright provides browser-side control:
> The Clock API lets you "manipulate and control time within tests, enabling the precise
> validation of features such as rendering time, timeouts, scheduled tasks **without the
> delays and variability of real-time execution**."
> `await page.clock.install({ time: new Date('2024-02-02T08:00:00') });`
> `await page.clock.setFixedTime(new Date('2024-02-02T10:00:00'));`
> `await page.clock.fastForward('30:00');`
Source: [Playwright — Clock](https://playwright.dev/docs/clock) — Accessed 2026-08-28. Reputation: High (official). Confidence: **High** for the API; the docs do not state the introducing version (Knowledge Gap G6).

**This is the answer to the polling problem, and it is the single most valuable
flakiness finding for this app.** `course-design-decisions.md` §3a constraint 3 fixes
"live" as a 15–30 second poll. A scenario that waits for a real poll cycle is both slow
and a coin flip. `page.clock.fastForward('00:30')` fires the pending interval immediately,
so the suite **never sleeps** and the refresh is triggered deterministically.

```ts
Given('the current time is {string}', async ({ page }, time: string) => {
  await page.clock.install({ time: new Date(`2026-03-01T${time}:00Z`) });
});

When('the queue refreshes', async ({ page }) => {
  await page.clock.fastForward('00:30');   // not waitForTimeout(30_000)
});
```

**But `page.clock` only controls the browser.** The server has its own "now", and this is
where a design choice is forced. Two options:

| | Option A — fixed server clock | Option B — test-only clock endpoint |
|---|---|---|
| Mechanism | `FAKE_NOW` env var read at startup; the injectable clock returns it | `POST /test/clock` advances the server clock |
| Expressiveness | "Time passes" is expressed by *seeding different arrival times*, not by advancing | Directly expresses "60 minutes pass" |
| Production surface | None | A test-only route in shipped code |
| Determinism | Total | Total |

**Recommend Option A**, and the deciding test is whether it survives the hardest *known*
future feature. Cycle 3 is queue aging: "after 60 minutes waiting, a patient escalates one
level" (`course-design-decisions.md` §3a). Under Option A that scenario is
`Given a patient arrived at 08:00` with `FAKE_NOW = 09:01` — fully expressible, no
endpoint, no advancement. Option A therefore survives the amendment exercise, which is the
case it was most at risk from. Choose A; revisit only if a rule requires the server clock
to move *within* a single scenario.

A senior reviewer would object to Option B's presence (a test-only route in production
code) and would not object to Option A's absence of machinery.

#### Senior-developer test (summary for Q5)

1. Absence objection? **Yes** for declarative wording, API arrangement, the data-table
   step and clock control — all four have visible symptoms (unreadable features, coupled
   scenarios, step sprawl, a sleeping suite).
2. Presence objection? **No** for any of them — each is one file or one line. **Yes** for
   Page Objects, scoped steps and a `World` class, all of which are therefore rejected.

### Q6 — Gherkin quality criteria

**Recommendation: eleven checkable rules, four of which are literally `grep`-able. Ship
them as the "Gherkin house style" skill that `course-design-decisions.md` §3b already
plans.**

The brief asked for "concrete, checkable criteria preferred over principles". The
principles are well documented and boring; the value is in converting them to checks.

#### Evidence base

- Declarative over imperative; the test "Will this wording need to change if the
  implementation does?"; scenarios "will be a lot shorter and much easier to follow".
  [Cucumber — Writing better Gherkin](https://cucumber.io/docs/bdd/better-gherkin/) — Accessed 2026-08-28. High.
- `Given` = "put the system in a known state"; `When` = the action or event; `Then` =
  assert on "something that comes _out_ of the system (report, user interface, message)".
  `Background` must not "set up **complicated states**, unless that state is actually
  something the client needs to know" and should be kept "short" — "ideally under 4 lines".
  [Cucumber — Gherkin reference](https://cucumber.io/docs/gherkin/reference/) — Accessed 2026-08-28. High.
- Feature-coupled step definitions and conjunction steps are named anti-patterns.
  [Cucumber — Anti-patterns](https://cucumber.io/docs/guides/anti-patterns/) — Accessed 2026-08-28. High.

All three are the same publisher (Cucumber). **Independence caveat:** these are not three
independent sources, they are three pages of one authority. They qualify under the
"1 authoritative source" rule rather than the 3-source rule. Cross-referencing support
comes from Playwright ("Test user-visible behavior… avoid relying on implementation
details") and Fowler (test at the lowest useful level), which agree on substance from
different toolchains.

#### The checkable list

| # | Check | How to check it | Source |
|---|---|---|---|
| 1 | **No UI vocabulary in any step.** Ban: `click`, `button`, `field`, `type`, `select`, `page`, `screen`, `navigate`, `URL`, `link`, `tab`, `checkbox`, `dropdown`, `id=`, `.css` | `grep -inE '\b(click|button|field|type into|select|navigate|url|checkbox|dropdown)\b' features/` returns nothing | Cucumber, better-gherkin |
| 2 | **Implementation-change test.** For each step: would this sentence change if we replaced React with plain HTML? | Manual, but binary | Cucumber, better-gherkin (verbatim test) |
| 3 | **At most one `When` per scenario.** `And` under `When` is a smell, not a syntax error | Count `^\s*When` per `Scenario:` block | Gherkin reference (When = *the* action) |
| 4 | **No conjunctions inside one step.** A step containing " and " that joins two facts | `grep -n ' and ' features/*.feature` then eyeball | Cucumber anti-patterns ("conjunction steps") |
| 5 | **Background ≤ 4 lines**, and contains nothing a stakeholder would not state themselves | Line count | Gherkin reference (verbatim "under 4 lines") |
| 6 | **Every `Then` asserts something a patient or nurse could see.** No ids, no table names, no HTTP status codes, no internal fields | Read the `Then` lines alone | Gherkin reference ("comes _out_ of the system") |
| 7 | **Scenario titles alone form a readable table of contents.** Strip everything but `Scenario:` lines and give them to the product person: do they recognise the rules? | Mechanical extraction, human judgement | Interpretation (labelled) |
| 8 | **Step-definition count grows sub-linearly with scenario count.** If `#steps ≈ #scenarios × steps-per-scenario`, the steps are feature-coupled | Count definitions vs scenarios | Cucumber anti-patterns |
| 9 | **Every domain noun appears in the glossary.** `legevakt`, triage level, position, estimate, re-triage, waiting | Diff the feature-file nouns against the triage-rules skill | Ubiquitous language; project decision §3b |
| 10 | **Numbers are business numbers.** Triage levels, 60 minutes, average consultation minutes — yes. Timeouts, ports, ids, pixel values — no | `grep -oE '[0-9]+' features/` and classify | Interpretation (labelled) |
| 11 | **Read-aloud test.** The product person reads the feature aloud before implementation | Ceremony, already planned | `course-design-decisions.md` §4 |

#### The distinction the brief asked for, stated directly

A feature file **a stakeholder can read** describes *what is true of the world*. A feature
file **that has degraded into a test script** describes *what the tester does to the
program*. Four observable symptoms of the degraded form, in rough order of how early they
appear:

1. Steps in the first person about mechanics — "I click", "I enter", "I see" — rather than
   about the domain. (`I see` is the subtle one: it is about the tester's eyeballs, not
   about the system's output. `Then Ada is number 2 in the queue` is better than
   `Then I see "2" next to Ada`.)
2. More than ~7 steps in a scenario. Long scenarios are almost always a sequence of UI
   operations, because domain rules are short.
3. Literal values that only a developer could have chosen — selectors, ids, `200`, `null`.
4. `And` chains under `When`, which means the scenario covers more than one behaviour and
   its title can no longer be a single rule.

**One counter-intuitive point worth teaching.** Data tables *look* technical and are often
assumed to be a script smell. They are the opposite here: a table of waiting patients is
how a nurse would actually write the queue down, and it collapses N imperative Given
sentences into one declarative statement. The rule is not "no tables" — it is that the
table's **columns must be domain attributes** (name, triage level, arrival time), never
technical ones (id, created_at, status_code).

#### Recommended shape

```gherkin
Feature: Queue order

  Patients are seen in triage-level order, and by arrival time within a level.

  Background:
    Given the clinic opened at 08:00

  Scenario: A more urgent arrival is seen before patients who arrived earlier
    Given the following patients are waiting:
      | name  | triage level | arrived |
      | Ada   | 3            | 09:00   |
      | Chidi | 3            | 09:02   |
    When Bjorn arrives with triage level 1 at 09:05
    Then the queue order is Bjorn, Ada, Chidi
    And Ada's estimated wait has increased
```

Check it against the list: no UI words (1), survives a rewrite in plain HTML (2), one
`When` (3), no conjunction steps (4), a 1-line Background (5), both `Then`s are patient-
observable (6), the title states the rule (7), five step definitions cover this and every
sibling scenario (8), every noun is domain vocabulary (9), every number is a triage level
or a clock time (10).

Note `Then Ada's estimated wait has increased` — deliberately *not* `Then Ada's estimated
wait is 45 minutes`. The exact arithmetic is unit-tested (Q4); the scenario asserts the
rule the stakeholder cares about. This is where Q4 and Q6 reinforce each other: pushing
arithmetic down the pyramid is also what keeps the Gherkin declarative.

#### Senior-developer test

1. Absence objection? **Yes** — degraded Gherkin is the single most common criticism of
   BDD, and this project has staked decision 5 on feature files *being* the acceptance
   criteria. If they are unreadable, the whole topology fails.
2. Presence objection? **No** — the deliverable is a checklist in a skill file. There is
   no code, no framework, and no lint rule to maintain. (A custom Gherkin linter *would*
   draw an objection at this size; `grep` in a documented checklist does not.)

### Q7 — Flakiness prevention in Playwright

**Recommendation: five practices matter. Six commonly-cited ones are cargo cult *for this
project*, and one of those is official Playwright advice that should be deliberately
declined with a written reason.**

#### What actually matters

**F1 — Web-first (auto-retrying) assertions. This is the whole game.**
Playwright divides assertions in two, and states the consequence outright:
> "The following assertions will retry until the assertion passes, or the assertion
> timeout is reached." (`toBeVisible`, `toHaveText`, `toContainText`, `toHaveCount`,
> `toHaveAttribute`, `toHaveValue`, `toHaveURL`, `toMatchAriaSnapshot`, …) **Default
> timeout: 5 seconds.**
> Generic assertions — `toBe()`, `toEqual()`, `toContain()` — do not retry, and
> "**using non-retrying assertions can lead to a flaky test**."
Source: [Playwright — Assertions](https://playwright.dev/docs/test-assertions) — Accessed 2026-08-28. Reputation: High (official). Confidence: **High**.
Corroborated: "By using web first assertions Playwright will wait until the expected
condition is met" — [Playwright — Best Practices](https://playwright.dev/docs/best-practices) — Accessed 2026-08-28.

The practical rule, and it is mechanically checkable:
```ts
// ✗ non-retrying: reads the DOM once, races the poll
expect(await page.getByTestId('position').textContent()).toBe('2');

// ✓ retrying: polls until true or 5s
await expect(page.getByTestId('position')).toHaveText('2');
```
**Check: `grep -n 'expect(await ' e2e/` should return nothing.** `await expect(` good,
`expect(await` bad. That single character-level distinction is responsible for a large
share of real-world Playwright flake, and it is trivially reviewable.

**F2 — Auto-waiting via locators, and role-based locators.**
> "Auto waiting means that Playwright performs a range of actionability checks on the
> elements, such as ensuring the element is visible and enabled." And: "Prefer user-facing
> attributes to XPath or CSS selectors" because "your DOM can change easily".
Source: [Playwright — Best Practices](https://playwright.dev/docs/best-practices) — Accessed 2026-08-28. High.
**Independent corroboration from inside this project:** playwright-bdd's own default
`aiFix` prompt instructs "Use only role-based locators: getByRole, getByLabel, etc."
(`course-design-decisions.md` §4c, quoted verbatim from `src/ai/promptTemplate.ts`). Two
vendors, same rule. Confidence: **High**.
This one also pays a second dividend specific to this project: role-based locators make
the ARIA snapshot in the `aiFix` prompt *legible*, because the locator vocabulary and the
snapshot vocabulary are the same. A CSS-selector suite produces an aiFix prompt whose
snapshot the agent cannot map back to the failing locator.

**F3 — Test isolation, enforced rather than requested.**
> "Each test should be completely isolated from another test and should run independently
> with its own local storage, session storage, data, cookies etc."
Source: [Playwright — Best Practices](https://playwright.dev/docs/best-practices) — Accessed 2026-08-28. High.
> Workers are independent processes with "identical environments and each starts its own
> browser"; on failure Playwright "discards the entire worker process and browser
> instance, then launches a fresh one to prevent cascade failures".
Source: [Playwright — Retries](https://playwright.dev/docs/test-retries) — Accessed 2026-08-28. High.
Setting `fullyParallel: true` is the cheap enforcement: order-dependent scenarios fail
immediately and visibly rather than lurking until demo day.

**F4 — Deterministic seeding.** Each scenario arranges its own data through the API
(E5.5), against a database that is reset between scenarios. This is the E2E counterpart of
Q1. Note the layer difference: the BDD suite runs against a *real server process*, so
`:memory:` is not available to it — the E2E database must be a real file, and it must be
the ephemeral test file that decision 21 already specifies, never the demo database.
**This is the one place where the "never touch the development database" constraint is
enforced by configuration rather than by physics, and therefore the one place it can go
wrong.** It deserves an explicit guard: the server should refuse to start in test mode if
the database path is the demo path. Three lines, and it converts a catastrophic
silent failure into a startup error.

**F5 — Controlling time.** `page.clock` for the browser, a fixed server clock for the
backend — argued in full at E5.6. Without it the 15–30 s poll makes every scenario a race.

#### What is cargo cult *here* — including one piece of official advice, declined

| Commonly cited | Verdict for this project | Reason |
|---|---|---|
| **`retries: 1` or more** | **Reject.** Set `retries: 0` | Playwright defines flaky as "tests that failed on the first run, but passed when retried" ([Retries](https://playwright.dev/docs/test-retries), Accessed 2026-08-28). Retries *relabel* flakiness; they do not remove it. The usual justification is CI noise, and `course-design-decisions.md` decision 11 removes CI entirely. Worse for the live demo: a retried scenario still costs the room 20 seconds of silence, and it can turn a genuine bug into a green run in front of the audience. |
| **Cross-browser matrix (chromium + firefox + webkit)** | **Decline — deliberately, against official advice** | Playwright best practices says to "Test across all browsers". Correct for a product; wrong here. Browser compatibility is not the subject, the suite is demonstrated on known machines, and a 3× runtime is a direct cost on the gate catalogue's "how long it takes" axis (decision 12/13). **Write the reason in `playwright.config.ts`** — an unexplained single-project config looks like ignorance; an explained one looks like judgement. |
| **Sharding / parallel tuning** | Ignore | Recommended by Playwright for large CI suites. At roughly six scenarios there is nothing to shard. Keep `fullyParallel: true` — but for isolation (F3), not for speed. |
| **`page.waitForTimeout(...)` / any hard sleep** | **Reject** | Superseded by F1 and F5: retrying assertions handle "not yet rendered", `page.clock.fastForward` handles "the poll has not fired". A sleep is either too short (flake) or too long (slow). **Verification status: not verified in this session** — I could not retrieve the API note for `page.waitForTimeout`; the recommendation rests on F1 and F5 rather than on a quote. See Knowledge Gap G7. |
| **Explicit `waitForSelector` / `waitForLoadState` before interactions** | Reject | Redundant with locator auto-waiting (F2). This is the most common cargo-cult addition in Playwright suites: it looks defensive, and it is dead code that hides which wait actually mattered. |
| **Inflating `timeout` / `expect.timeout` globally** | Reject | Converts fast failures into slow ones. The default assertion timeout is 5 s, which is generous for a local SQLite app. If something needs longer, the cause is real and should be found. |
| **`test.describe.serial`** | Reject | Playwright: "It is usually better to make your tests isolated, so they can be efficiently run and retried independently." ([Retries](https://playwright.dev/docs/test-retries), Accessed 2026-08-28). Serial mode makes one failure cascade into a screen of skips — the worst possible live-demo output. |
| **Soft assertions everywhere** | Use sparingly | Listed under Playwright best practices, but multiplying assertion output is directly against this project's output-quality goal. |
| **Mocking third-party services** | **Inapplicable — say so** | Playwright's "Avoid testing third-party dependencies" is prominent advice that simply does not apply: this app has no external service. Copying the pattern in anyway would be pure cargo-culting, and noting the inapplicability is a small teaching win. |

#### Recommended shape

```ts
// playwright.config.ts (flakiness-relevant parts only)
export default defineConfig({
  testDir,
  fullyParallel: true,   // enforces isolation; not a speed optimisation at this size
  retries: 0,            // a retry hides a flake; there is no CI to appease (decision 11)
  // Chromium only, deliberately: browser compatibility is not what this suite is for,
  // and a 3x runtime is a real cost on the gate catalogue's time axis.
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
});
```

#### Senior-developer test

1. Absence objection? **Yes** for F1–F5. A reviewer who finds `expect(await …)`,
   `waitForTimeout`, or shared database state in a suite that is about to be demonstrated
   live will say so immediately.
2. Presence objection? **No** — F1–F5 are default behaviours plus two config lines. The
   rejected items are all *additions*, which is the pattern: at this size, flakiness
   prevention is almost entirely about **not adding things**.

## What a senior reviewer would flag — checklist

Applicable to a finished suite. Split into the two failure modes, because the brief is
right that they are asymmetric: over-engineering is the more likely one, so it comes
first.

### A. Over-engineering — "why is this here at all?"

- [ ] A Page Object Model, or a `World` class, over two screens
- [ ] Test data builders with `.withX().withY().build()`, or named personas (Object Mothers)
- [ ] Custom Vitest matchers (`toBeInQueueOrder(…)`) — they hide the diff behind a message
- [ ] A custom or explicitly-configured `reporters` array — which **disables** Vitest's automatic `minimal`/`agent` reporter
- [ ] `diff.*` tuning: `printBasicPrototype` is already `false` and `diff.truncateThreshold` is already `0` in Vitest. Configuring them changes nothing and signals cargo-culting
- [ ] Scoped/tagged step definitions in a one-domain app
- [ ] A test-only route (`POST /test/clock`, `POST /test/reset`) reachable in production code
- [ ] Snapshot assertions anywhere in the suite
- [ ] Transaction-rollback or truncate machinery around an in-process database
- [ ] JSON/YAML fixture files (untyped — and they undo the reason Drizzle was chosen)
- [ ] `faker` or any randomised input
- [ ] Cross-browser project matrix, sharding config, or retry counts, in a suite with ~6 scenarios and no CI
- [ ] A helper file whose exports are used exactly once
- [ ] More than two dependency-injection seams. **Two are earned: the clock and the database.** A third needs an argument

### B. Sloppiness — "this will bite you"

**Isolation and determinism**
- [ ] Any test path that can resolve to the demo/development database. The E2E server must refuse to start if it does
- [ ] Shared mutable state between tests: a module-level `db`, a `beforeAll` that seeds, an ordering dependency
- [ ] `PRAGMA foreign_keys` not enabled — SQLite defaults it **off, per connection**, so referential integrity is silently unenforced in tests
- [ ] Any `waitForTimeout` / `sleep` in the E2E suite
- [ ] `expect(await …)` instead of `await expect(…)` — non-retrying assertion on a live DOM. `grep -n 'expect(await ' e2e/`
- [ ] Real wall-clock time anywhere: `new Date()` in a test, or a scenario that waits for a real poll cycle
- [ ] CSS or XPath locators instead of `getByRole`/`getByLabel` — also degrades the `aiFix` ARIA snapshot
- [ ] `test.describe.serial`

**Failure-output quality (this project's first-class requirement)**
- [ ] `chaiConfig.truncateThreshold` left at its 40-character default while assertions compare arrays or objects
- [ ] `toBeTruthy()` / `toBeDefined()` / bare `expect(res.ok)` on a domain value — no expected, no actual, nothing to diff
- [ ] Field-by-field assertions where one whole-value `toEqual` would show the entire shape of the failure
- [ ] A bare `expect(fn).toThrow()` with no message or error class
- [ ] An *arrange* step that can fail silently — every setup call in a `Given` needs its own assertion with a message naming what was being set up
- [ ] `aiFix: { promptAttachment: true }` missing from `defineBddConfig` — without it an E2E failure is "the scenario failed"
- [ ] A `test.each` table without a `$`-interpolated title, so failures do not name the case

**Layering**
- [ ] Ordering or estimate permutations re-run through HTTP or through the browser
- [ ] An HTTP test that asserts a domain rule the pure function already covers
- [ ] A rule with no unit test but an E2E test — Fowler's rule inverted, and the most expensive shape
- [ ] E2E scenarios that duplicate lower-level coverage **without a written reason**. (Here there *is* a legitimate reason — the feature files are the acceptance criteria — but it must be written down, or it is indistinguishable from redundancy)

**Gherkin**
- [ ] UI vocabulary in any step: click, button, field, navigate, URL, dropdown
- [ ] More than one `When` in a scenario, or `And` chains under `When`
- [ ] A `Then` that asserts an id, a table row, an HTTP status, or an internal field
- [ ] `Background` longer than 4 lines, or setting up state a stakeholder would not state
- [ ] Step-definition count growing linearly with scenario count (feature-coupled steps)
- [ ] Data-table columns that are technical (`id`, `created_at`) rather than domain attributes

### C. Two questions to ask about anything not on this list

1. Would I object to its **absence** in a project this size?
2. Would I object to its **presence** in a project this size?

Keep it only on *yes, then no*. Everything in section A is something that answers *no* to
(1); everything in section B answers *yes* to (1) and *no* to (2).

## Source Analysis

| Source | Domain | Reputation | Type | Access Date | Cross-verified |
|---|---|---|---|---|---|
| Playwright — Best Practices | playwright.dev | High (1.0) | Official | 2026-08-28 | Y (Assertions, Retries, Cucumber) |
| Playwright — Assertions | playwright.dev | High (1.0) | Official | 2026-08-28 | Y (Best Practices) |
| Playwright — Retries | playwright.dev | High (1.0) | Official | 2026-08-28 | Y (Best Practices) |
| Playwright — Clock | playwright.dev | High (1.0) | Official | 2026-08-28 | N (single source; API reference) |
| Vitest — Reporters | vitest.dev | High (1.0) | Official | 2026-08-28 | Y (project's own §4 gate research) |
| Vitest — chaiConfig | vitest.dev | High (1.0) | Official | 2026-08-28 | Y (Chai docs, same default 40) |
| Vitest — diff | vitest.dev | High (1.0) | Official | 2026-08-28 | N |
| Vitest — expect | vitest.dev | High (1.0) | Official | 2026-08-28 | N |
| Vitest — Test API (`test.each`) | vitest.dev | High (1.0) | Official | 2026-08-28 | N |
| Chai — Styles/config | chaijs.com | High (1.0) | Official library docs | 2026-08-28 | Y (Vitest chaiConfig) |
| playwright-bdd — writing-steps overview | github.com/vitalets | High (1.0) | Official (raw repo docs) | 2026-08-28 | Y (playwright-style, cucumber-style pages) |
| playwright-bdd — playwright-style | github.com/vitalets | High (1.0) | Official | 2026-08-28 | Y |
| playwright-bdd — cucumber-style | github.com/vitalets | High (1.0) | Official | 2026-08-28 | Y |
| playwright-bdd — scoped steps | github.com/vitalets | High (1.0) | Official | 2026-08-28 | N |
| playwright-bdd — configuration/options | github.com/vitalets | High (1.0) | Official | 2026-08-28 | Y (write-first-test) |
| playwright-bdd — write first test | github.com/vitalets | High (1.0) | Official | 2026-08-28 | Y |
| playwright-bdd — writing-features | github.com/vitalets | High (1.0) | Official | 2026-08-28 | N |
| playwright-bdd — `_sidebar.md` | github.com/vitalets | High (1.0) | Official | 2026-08-28 | — (index only) |
| Cucumber — Writing better Gherkin | cucumber.io | High (1.0) | Official | 2026-08-28 | Partial (same publisher as below) |
| Cucumber — Gherkin reference | cucumber.io | High (1.0) | Official | 2026-08-28 | Partial (same publisher) |
| Cucumber — Anti-patterns | cucumber.io | High (1.0) | Official | 2026-08-28 | Partial (same publisher) |
| Drizzle — Get started SQLite | orm.drizzle.team | High (1.0) | Official | 2026-08-28 | Y (Migrations page) |
| Drizzle — Migrations | orm.drizzle.team | High (1.0) | Official | 2026-08-28 | Y |
| better-sqlite3 — API docs | github.com/WiseLibs | High (1.0) | Official project docs | 2026-08-28 | Y (SQLite.org for pragma semantics) |
| SQLite — Foreign Key Support | sqlite.org | High (1.0) | Official | 2026-08-28 | Y (better-sqlite3) |
| Ham Vocke — The Practical Test Pyramid | martinfowler.com | Medium-High (0.8) | Industry leader | 2026-08-28 | Y (Playwright best practices) |
| Martin Fowler — ObjectMother | martinfowler.com | Medium-High (0.8) | Industry leader | 2026-08-28 | N (single source for the criticism) |
| `docs/course-design-decisions.md` | local | n/a | Project constraint document | 2026-08-28 | — (constraints, not evidence) |

**Reputation distribution:** High: 25 of 27 external sources (93%). Medium-High: 2 (7%).
Medium: 0. Excluded-tier: 0. **Average reputation score: 0.985.**
**No blog, no Medium/dev.to, no Stack Overflow, no SEO-farm content was used.** Given
`course-design-decisions.md` §4's "Provenance warning" about six rejected AI-generated
"2026 benchmark" articles, the search was restricted to vendor documentation from the
outset and no such article was encountered.

**Bias check.** Every primary source is a tool vendor documenting its own tool, which is
a real bias for questions of the form "should I use X" — but this research asks "how
should X be used", where vendor docs are the correct authority. The one place vendor bias
bites is C1 below (playwright-bdd recommending its own POM-decorator feature), and it is
flagged rather than followed. Fowler/Vocke have no commercial interest in the outcome.

## Knowledge Gaps

Each gap names the exact experiment that would close it. Per
`course-design-decisions.md` §4a and §4b, this project has twice had a confidently-cited
conclusion overturned by a 60-second check; the items below are where that could happen
again.

**G0 — No empirical verification was possible at all. This is the dominant gap.**
**Issue:** The brief explicitly requested probes in a scratch directory. No shell tool was
available in this session, so **nothing below was executed**. Every code sample is
documentation-derived and unrun.
**Attempted:** Toolset contained only Read/Write/Edit/Glob/Grep/WebFetch/WebSearch.
**Recommendation:** Run G1, G2, G3 and G7 before acting on the corresponding
recommendations. Total estimated time: under 15 minutes.

**G1 — Does `:memory:` actually work end-to-end with Drizzle + `migrate()`?**
**Issue:** Drizzle's own SQLite page shows `new Database('sqlite.db')` and **contains no
`:memory:` example** (verified absent). The recommendation composes two documented facts
rather than following a documented example. A plausible failure mode exists: `migrate()`
writes a `__drizzle_migrations` table and reads the migrations folder — fine in memory in
principle, but unverified. A second risk is that `drizzle-kit`-generated SQL uses
statements SQLite accepts only on disk.
**Experiment (~3 min):** In a scratch dir — `new Database(':memory:')` → `drizzle({client})`
→ `migrate(db, { migrationsFolder })` → insert → select. If it fails, fall back to
`new Database('')` (anonymous temp DB — documented by better-sqlite3, still pathless from
the caller's perspective, so the structural argument survives).
**Impact if wrong:** Q1's recommendation degrades to "anonymous temp database", which
keeps most of the argument. Low blast radius, but check it first.

**G2 — Does setting `reporters` really suppress Vitest's agent auto-detection?**
**Issue:** The claim rests on one sentence ("unless custom reporters are configured") in
one page. It drives a *prohibition* in the recommendation table, so the cost of being
wrong is that the repo omits useful configuration for no reason.
**Experiment (~5 min):** Run the suite with a deliberate failure, with and without
`reporters: ['verbose']`, under an agent-detected environment; compare output.
**Also unverified:** which environment variables Vitest uses to detect "an AI coding
agent". Worth knowing, because the course's whole gate exercise depends on students
seeing the agent-mode output.

**G3 — Does `expect(value, 'message')` replace or augment the diff in Vitest?**
**Issue:** The docs say "the error message will be equal to it", which reads as
*replacement*. If it replaces the diff, then the arrange-step message pattern recommended
in E5.5 is a net loss at the Vitest layer (it remains correct at the Playwright layer,
where `expect(res.ok(), msg)` has no diff to lose).
**Experiment (~2 min):** One failing `expect(1, 'ctx').toBe(2)`; read the output.

**G4 — `test.each` `$`-title interpolation.** **Closed during research.** Verified from
[Vitest — Test API](https://vitest.dev/api/): `'add($a, $b) -> $expected'` produces
`add(1, 1) -> 2`. Recorded because it was flagged mid-document.

**G5 — `featuresRoot` and stack-trace readability with split feature/step trees.**
**Issue:** `featuresRoot` is documented as behaving like TypeScript's `rootDir` for
generated paths; the claim that leaving it unset produces noisier stack traces in a
two-tree layout is my inference, not documentation.
**Experiment (~5 min):** Generate with and without it; compare a failing scenario's paths.

**G6 — Playwright version that introduced `page.clock`.** The Clock docs do not state it.
Matters only because decision 25 requires pinned, failsafe setup — the pinned Playwright
version must support it. Check the changelog before pinning.

**G7 — No quote obtained for `page.waitForTimeout` guidance.** Two fetches of
`playwright.dev/docs/api/class-page` returned truncated content that did not reach the
method. The "no hard sleeps" recommendation therefore rests on the assertions and clock
documentation rather than on a direct prohibition. The recommendation is not in doubt; its
citation is.

**G8 — No runtime measurements.** The three numbers `course-design-decisions.md` §4 names
as unmeasured (Vitest vs `node:test` startup, SQLite suite runtime, playwright-bdd E2E
runtime) remain unmeasured, and this research adds a fourth: the per-test cost of
`migrate()` against an in-memory database, which is the only real cost of the Q1
recommendation. If it turns out to be non-trivial, the documented fallback is to migrate
once per file and truncate — but do not build that until measured.

**G9 — No evidence found on agent-authored Gherkin style.** Consistent with
`course-design-decisions.md` §5 experiment 2, which remains open. This research adds one
weak data point in the same direction (playwright-bdd's own examples are imperative while
its vendor's guidance is declarative), but that is corroboration of an existing suspicion,
not evidence. **Searched:** vendor documentation for Cucumber, playwright-bdd and
Playwright. **Not found:** any study, benchmark or vendor statement on LLM Gherkin style.
Recommendation unchanged: run the 30-minute pre-test.

**G10 — Nothing found on custom Vitest matchers vs agent repair rates.** The
recommendation to reject custom matchers rests on the diff-preservation argument
(interpretation, labelled) plus the project's own 45%/77% figures, not on direct evidence.
Confidence: Medium.

## Conflicting Information

### C1 — playwright-bdd recommends two different step styles as "recommended"
**Position A:** "**Playwright-style** is the recommended approach for new projects."
**Position B:** "**Decorators** involve marking Page Object Model class methods as steps
[…] This approach is recommended for all project types."
**Source (both):** [playwright-bdd — Writing steps overview](https://github.com/vitalets/playwright-bdd/blob/main/docs/writing-steps/index.md) — Accessed 2026-08-28. Reputation: High.
**Assessment:** Same page, same authority, directly conflicting scope ("new projects" vs
"all project types"). Neither can be resolved by appeal to authority, so it must be
resolved on the project's own criteria. Decorators presuppose a Page Object Model; this
app has two screens, one deliberately minimal, and the brief names "a page-object
framework in a project this size" as an explicit teaching hazard. **Resolution:
playwright-style.** Recorded here rather than silently choosing, because a senior reviewer
who reads the vendor docs will find the other recommendation and should find our reasoning
already written down.

### C2 — Playwright says test all browsers; this project should not
**Position A:** "Test across all browsers" — [Playwright — Best Practices](https://playwright.dev/docs/best-practices), Accessed 2026-08-28. Reputation: High.
**Position B (this document):** Chromium only.
**Assessment:** Not a factual conflict — a scope conflict. Playwright's advice targets
products shipped to unknown browsers. This suite exists to demonstrate business rules on
known machines with no CI, and runtime is a first-class cost on the gate catalogue's time
axis (decision 12/13). **Resolution: decline the official advice, and write the reason in
the config file.** A deviation from vendor guidance that is argued in a comment reads as
judgement; the same deviation unexplained reads as ignorance — which matters for an
audience that will read this code closely.

### C3 — Fowler's delete-duplicates rule vs this project's Gherkin-native topology
**Position A:** "I delete high-level tests that are already covered on a lower level
(given they don't provide extra value)." — [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html), Accessed 2026-08-28. Reputation: Medium-High.
**Position B:** `course-design-decisions.md` decision 5 makes feature files *be* the
acceptance criteria, so E2E scenarios necessarily restate rules already unit-tested.
**Assessment:** Resolved by Fowler's own parenthesis — "given they don't provide extra
value". Here they do provide extra value, but it is *stakeholder* value, not defect-
detection value. **Resolution: keep the overlap, and record the reason in the feature
file's description block.** An unexplained overlap is indistinguishable from the mistake
Fowler is warning about.

## Recommendations for Further Research

Ordered by value-per-minute. The first four are the experiments this document could not
run and should not be trusted without.

1. **Run G1 (3 min): `:memory:` + Drizzle `migrate()` end to end.** This is the only
   recommendation in the document whose central mechanism is inferred rather than
   documented. If it fails, fall back to `new Database('')` and the argument survives
   largely intact — but find out before writing the helper.
2. **Run G2 (5 min): does configuring `reporters` suppress Vitest's agent reporter?** It
   drives a prohibition, and the prohibition is the counter-intuitive part of Q3. Also
   discover *how* Vitest detects an agent, since the course's gate exercise depends on
   students being able to see both output modes on demand.
3. **Run G3 (2 min): does `expect(value, 'message')` replace the diff?** Determines
   whether the message pattern is safe at the Vitest layer.
4. **Measure the per-test cost of `migrate()` in memory (G8).** This is the only cost of
   the Q1 recommendation and it is the number that decides whether the fallback
   (migrate-per-file + truncate) ever becomes necessary. It also closes one of the four
   runtime numbers `course-design-decisions.md` §4 flags as unmeasured.
5. **Merge the Q6 checklist into the planned "Gherkin house style" skill (§3b).** The
   eleven rules are written to be usable directly by the `spec` command as guardrails,
   and four of them are `grep` invocations that could equally become a hook — which makes
   them a worked example of the primitive-selection lesson (checklist → skill → hook).
6. **Re-run the E2E gate rating with `aiFix` enabled *and* role-based locators enforced.**
   §4c already flags the re-rating. This research adds a dependency the re-rating should
   control for: the ARIA snapshot in the aiFix prompt is only useful to an agent if the
   suite's locators share its vocabulary, so a CSS-selector suite and a role-locator suite
   will not rate the same.
7. **Settle the pinned Playwright version against `page.clock` availability (G6)** before
   the lockfile is committed, since decision 25 makes setup failure expensive.
8. **Investigate whether `expect.poll` or `toPass` is ever needed here.** Both were found
   in the Playwright assertion docs and neither appears in any recommendation. The
   expectation is that web-first assertions plus clock control cover every case, and if
   that holds it is worth stating as a positive finding ("we never needed a polling
   assertion") rather than as an omission.

## Full Citations

[1] Playwright. "Best Practices". playwright.dev. https://playwright.dev/docs/best-practices. Accessed 2026-08-28.
[2] Playwright. "Assertions". playwright.dev. https://playwright.dev/docs/test-assertions. Accessed 2026-08-28.
[3] Playwright. "Retries". playwright.dev. https://playwright.dev/docs/test-retries. Accessed 2026-08-28.
[4] Playwright. "Clock". playwright.dev. https://playwright.dev/docs/clock. Accessed 2026-08-28.
[5] Vitest. "Reporters". vitest.dev. https://vitest.dev/guide/reporters. Accessed 2026-08-28.
[6] Vitest. "chaiConfig". vitest.dev. https://vitest.dev/config/chaiconfig. Accessed 2026-08-28.
[7] Vitest. "diff". vitest.dev. https://vitest.dev/config/diff. Accessed 2026-08-28.
[8] Vitest. "expect". vitest.dev. https://vitest.dev/api/expect. Accessed 2026-08-28.
[9] Vitest. "Test API Reference". vitest.dev. https://vitest.dev/api/. Accessed 2026-08-28.
[10] Chai. "Assertion Styles / config". chaijs.com. https://www.chaijs.com/guide/styles/. Accessed 2026-08-28.
[11] Vitalets, V. "playwright-bdd — Writing steps (overview)". https://github.com/vitalets/playwright-bdd/blob/main/docs/writing-steps/index.md. Accessed 2026-08-28.
[12] Vitalets, V. "playwright-bdd — Playwright-style steps". https://github.com/vitalets/playwright-bdd/blob/main/docs/writing-steps/playwright-style.md. Accessed 2026-08-28.
[13] Vitalets, V. "playwright-bdd — Cucumber-style steps". https://github.com/vitalets/playwright-bdd/blob/main/docs/writing-steps/cucumber-style.md. Accessed 2026-08-28.
[14] Vitalets, V. "playwright-bdd — Scoped step definitions". https://github.com/vitalets/playwright-bdd/blob/main/docs/writing-steps/scoped.md. Accessed 2026-08-28.
[15] Vitalets, V. "playwright-bdd — Configuration options". https://github.com/vitalets/playwright-bdd/blob/main/docs/configuration/options.md. Accessed 2026-08-28.
[16] Vitalets, V. "playwright-bdd — Write your first test". https://github.com/vitalets/playwright-bdd/blob/main/docs/getting-started/write-first-test.md. Accessed 2026-08-28.
[17] Vitalets, V. "playwright-bdd — Writing features". https://github.com/vitalets/playwright-bdd/blob/main/docs/writing-features/index.md. Accessed 2026-08-28.
[18] Cucumber. "Writing better Gherkin". cucumber.io. https://cucumber.io/docs/bdd/better-gherkin/. Accessed 2026-08-28.
[19] Cucumber. "Gherkin Reference". cucumber.io. https://cucumber.io/docs/gherkin/reference/. Accessed 2026-08-28.
[20] Cucumber. "Anti-patterns". cucumber.io. https://cucumber.io/docs/guides/anti-patterns/. Accessed 2026-08-28.
[21] Drizzle Team. "Get Started with SQLite". orm.drizzle.team. https://orm.drizzle.team/docs/get-started-sqlite. Accessed 2026-08-28.
[22] Drizzle Team. "Migrations". orm.drizzle.team. https://orm.drizzle.team/docs/migrations. Accessed 2026-08-28.
[23] WiseLibs. "better-sqlite3 API — new Database(path, [options])". https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md. Accessed 2026-08-28.
[24] SQLite. "SQLite Foreign Key Support, §2 Enabling Foreign Key Support". sqlite.org. https://www.sqlite.org/foreignkeys.html. Accessed 2026-08-28.
[25] Vocke, H. "The Practical Test Pyramid". martinfowler.com. 2018. https://martinfowler.com/articles/practical-test-pyramid.html. Accessed 2026-08-28. [Published 2018; concept remains current — architecture/methodology category, evergreen per freshness rules.]
[26] Fowler, M. "ObjectMother". martinfowler.com. 2006. https://martinfowler.com/bliki/ObjectMother.html. Accessed 2026-08-28. [Published 2006; pattern criticism remains current.]

## Research Metadata

**Duration:** single session, 2026-08-28.
**Sources examined:** 29 fetch attempts across 26 distinct URLs (3 refetches for
truncated pages).
**Sources cited:** 26 external + 1 local constraint document.
**Cross-references established:** 9 (Vitest↔Chai on truncation; Playwright
Assertions↔Best Practices on web-first assertions; Playwright↔playwright-bdd `aiFix`
prompt on role-based locators; Playwright Retries↔Best Practices on isolation;
Fowler↔Playwright on testing behaviour not implementation; better-sqlite3↔SQLite.org on
pragmas; Drizzle get-started↔Drizzle migrations; playwright-bdd overview↔style pages;
Cucumber better-gherkin↔Gherkin reference).
**Confidence distribution:** High 62% (Q1 mechanics, Q3 truncation, Q4 rule, Q5 style and
clock, Q6 rules, Q7 assertions/retries/isolation) · Medium 31% (Q2 — one source for the
Object Mother criticism plus interpretation; Q3 reporter suppression; Q5 `featuresRoot`
trace effect) · Low 7% (nothing rests on Low; the Low-confidence items were moved into
Knowledge Gaps instead of into recommendations).
**Tool failures:** `playwright.dev/docs/api/class-page` returned truncated content on two
attempts (circuit-breaker applied after 2, alternative source used) → Gap G7.
`vitest.dev/config/` and its raw GitHub markdown returned navigation only on two attempts
→ resolved via per-option pages `/config/chaiconfig` and `/config/diff`.
`vitalets.github.io/playwright-bdd` is a docsify SPA returning an empty shell → resolved by
fetching `raw.githubusercontent.com` markdown throughout.
**No shell access:** zero code samples executed. See G0 — this is the document's principal
limitation.
**Output:** `docs/research/tooling/testing-patterns-independent-research.md`
