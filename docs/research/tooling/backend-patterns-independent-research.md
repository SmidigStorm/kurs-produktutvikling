# Research: Idiomatic Backend Structure for a Small Hono + Zod + Drizzle/SQLite Application

**Date**: 2026-08-28 | **Researcher**: nw-researcher (Nova) | **Confidence**: High | **Sources**: 29 external (15 High-reputation, 13 Medium-High, 0 Medium) + 1 local project-of-record

> **Blind study.** `docs/superpowers/plans/2026-08-28-app-baseline.md` was not read, opened,
> globbed or grepped at any point. `docs/course-design-decisions.md` was read, as permitted.
>
> **Capability caveat, disclosed up front.** No shell tool was available in this session, so the
> brief's requested scratch-directory experiments could not be run. All *existence* and
> *API-shape* questions were instead resolved against primary artifacts — npm registry
> manifests, package TypeScript source, official documentation, real repository source files —
> which is equivalent or stronger evidence. Three *runtime-behaviour* questions genuinely need
> execution; they are flagged inline and listed as Knowledge Gaps 1–3 with the exact experiment
> to run (total cost: under five minutes). They are not presented as settled.

## Executive Summary

**The headline finding is a trap, not a pattern.** The most widely-copied Hono dependency
pattern — building the database in middleware and stashing it with `c.set('db', ...)`, typed via
a `Variables` generic — appears in Hono's own factory-helper documentation with a
`D1Database` binding read from `c.env`. Hono's API reference defines `Bindings` as *"Cloudflare
Workers Bindings"*. On Workers, bindings do not exist at module scope, so the database
*cannot* be constructed at startup and *must* be attached per request. **On Node with
better-sqlite3 that constraint does not exist.** Copying the pattern here means paying its cost
— a middleware, an `Env` type, a `c.get('db')` at every call site — to solve a problem the app
does not have. A plain factory, `createApp({ db, clock })`, is simpler, satisfies the hard
"no test may depend on the wall clock" constraint by construction, and needs no mocking. This
is the recommendation most likely to differ from an experienced Hono developer's first instinct,
and the evidence for it is primary.

**Almost everything else resolves toward less structure, and the sources say so in their own
words.** No repository and no service layer: Fowler's own catalogue entry states the pattern is
warranted when *"there are a large number of domain classes or heavy querying"* — two tables and
five endpoints meet neither, and the most prominent Hono+Drizzle starter (`w3cj/hono-open-api-starter`,
MIT, ~1k stars) calls Drizzle directly in its handlers with no such layer anywhere in its tree.
No Result/Either type and no per-handler try/catch: Hono's ecosystem middleware throws
`HTTPException`, so a four-line `app.onError` is mandatory regardless, and any second mechanism
means maintaining two error paths. No `testClient`: it is documented as requiring routes to be
defined as chained methods on the instance, which lets the tests dictate the source layout —
`await app.request(...)` costs nothing and constrains nothing. No DI container, no `application/`
or `ports/` folders, no hand-written row interfaces.

**Three things do earn their place, and each is justified by a stated constraint rather than by
a pattern's reputation.** (1) A pure `domain/` module of **two files** — not an architecture —
because the wait estimate is *specified* as a pure function and because making `now: Date` a
parameter is the only way to hold the no-wall-clock rule structurally rather than by convention.
(2) `@hono/zod-validator` — verified at **v0.9.0**, MIT, peer-depending on `zod ^3.25 || ^4` and
`hono >=4.11.2` — because Hono's validation guide says outright *"We recommend using a
third-party validator"* and because it costs one argument per route while removing a five-line
`safeParse`/400 block from each. (3) Exactly one transaction, around re-triage, because that
endpoint writes two rows that are one fact.

**On Drizzle**: `$inferSelect`/`$inferInsert` are unreserved yes — the alternative is a second
declaration of the same truth, which is the exact failure the project chose Drizzle to avoid.
There is **no native enum column in Drizzle's SQLite dialect** (SQLite has no such type);
`text('triage_level', { enum: TRIAGE_LEVELS }).notNull()` is the answer, documented to infer as
the string-literal union with no manual cast, with the explicit caveat that it *"won't check
runtime values"* — Zod at the boundary is what actually enforces it. One `as const` array can
feed the TypeScript union, the Drizzle column and the Zod schema simultaneously; this is the
highest-leverage three lines in the codebase for a reader who imitates what they see.

**Two conclusions are deliberately left open for a 60-second experiment rather than asserted.**
Whether Drizzle's better-sqlite3 transaction callback should be synchronous or `async` (the
official transactions page is dialect-generic and gives no better-sqlite3 guidance, while the
SQLite getting-started page shows `await db.all(...)` over a synchronous driver), and whether
omitting `as const` on the triage-level array silently degrades the column type to `string`.
Both are checkable in under a minute with a shell, and this session had none. Given that this
project has already had two confident conclusions overturned by cheap experiments, they are
flagged as actions rather than smoothed over.

## Research Methodology

**Search Strategy**: Official framework documentation was treated as the primary and
outranking source throughout: `hono.dev` (7 pages: context, best-practices, testing, validation,
exception, factory helper, testing helper, app API, Node.js getting-started), `orm.drizzle.team`
(4 pages: goodies, SQLite column types, transactions, SQLite getting-started). Where
documentation was silent or ambiguous, I went to **primary artifacts** rather than to blogs: the
npm registry manifest for `@hono/zod-validator`, the package's TypeScript **source file** on
`raw.githubusercontent.com`, and the GitHub tree API plus raw source files of the most prominent
Hono+Drizzle+Vitest starter. Pattern-level questions (repository, layering, YAGNI) were anchored
to `martinfowler.com` as the canonical cataloguer, with the community counter-position sourced
separately so both sides are represented.

**Source Selection**: Types: official framework docs (primary), industry-leader pattern
catalogues, primary code artifacts (registry manifests, source files, repository trees).
Reputation: high and medium-high only. One search returned `dev.to` and `medium.com` results;
**these were not cited** — the claims they made about Hono DI were instead verified against
Hono's own factory-helper page, which is where the pattern actually originates.
No excluded-domain sources were used.

**Verification approach**: Every API-existence claim (does `zValidator` exist, does
`$inferSelect` exist, is there an enum helper in Drizzle SQLite, can Hono be tested without a
server) was resolved against a **primary artifact** — official documentation or the package's
own manifest/source — not against a description of one. Structural/architectural claims were
cross-referenced across at least two independent sources: official docs, a real repository, and
a pattern catalogue.

**Deviation from the brief, disclosed**: The brief asked for empirical checks in a scratch
directory. **No shell tool was available in this session** (available tools were
Read/Write/Edit/Glob/Grep/WebSearch/WebFetch only). I substituted primary-artifact retrieval,
which is equivalent evidence for *existence and API shape* questions (registry manifest, source
`.ts`) but **not** for *runtime behaviour* questions. The three claims that genuinely needed
execution are isolated, flagged inline, and listed in Knowledge Gaps with the exact experiment
to run. They are not presented as settled.

**Blind-study compliance**: `docs/superpowers/plans/2026-08-28-app-baseline.md` was not read,
opened, globbed or grepped. `docs/course-design-decisions.md` was read, as permitted; its
constraints (injectable clock, ephemeral test database, three test layers, the error-repair
band argument, the domain specification) are cited where they drive a recommendation.

**Quality Standards**: Every recommendation carries at least one authoritative source. Claims
resting on a single source, or on my synthesis rather than a citation, are labelled inline with
an explicit confidence rating and the word "analysis". Average reputation of cited sources: 0.94.

## Recommendation Table

Each row answers the two questions from the brief. A pattern is recommended only when a senior
developer would object to its **absence** and not to its **presence** at this size.

| # | Question | Recommendation | Object to absence? | Object to presence? | One-line reason |
|---|---|---|---|---|---|
| 1 | Dependency delivery | **Factory `createApp({ db, clock })`** | Yes — the no-wall-clock rule is otherwise unenforceable | No | Hono's ubiquitous `c.set('db')` pattern solves a *Cloudflare bindings* problem that does not exist on Node |
| 1b | `c.set`/`c.get` + `Variables` | **Reject** (for db/clock) | No | **Yes** | Per-request mechanism for a process-lifetime value |
| 1c | Module singleton `db` | **Reject** | No | **Yes** | Hidden input; forces `vi.mock` and a second `createTestApp` |
| 1d | DI container | **Reject firmly** | No | **Yes** | A registry and lifetime model to replace one function argument |
| 2 | Repository / service layer | **None. Drizzle in handlers** | No | **Yes** | Fowler's own precondition — *"a large number of domain classes or heavy querying"* — is not met at 2 tables |
| 3 | Business logic location | **Pure `domain/` module — 2 files, no layer names** | Yes | No (at 2 files) | The wait estimate is *specified* as a pure function and `now` must be a parameter |
| 4 | Request validation | **`@hono/zod-validator` (v0.9.0)** | Yes, mildly | No | Hono's docs: *"We recommend using a third-party validator"*; costs one argument, removes 5 lines/route |
| 5 | Error handling | **Throw + `app.onError`** | Yes | No | Hono middleware throws `HTTPException` anyway — a Result type gives you *two* error paths, not one |
| 6 | Project structure | **Shallow layer folders `domain/` `db/` `http/`** | Mildly | No | One feature means feature folders are just nesting; layer names make the pure/impure seam visible |
| 7a | `$inferSelect` / `$inferInsert` | **Yes, always** | Yes | No | The alternative is a second declaration of the same truth |
| 7b | Triage enum column | **`text('triage_level', { enum: TRIAGE_LEVELS }).notNull()`** | Yes | No | One `as const` array feeds the TS union, the column type and the Zod validator |
| 7c | Transactions | **Yes — exactly one, around re-triage** | Yes | No, if used once | Re-triage writes two rows that are one fact |
| 8 | HTTP testing | **`await app.request(...)`** | Yes | No | A Hono app *is* `Request => Response`; no server, no port, no flake |
| 8b | `testClient` | **Skip** | No | **Yes** | Forces chained route definitions on the app to serve the tests |

**Patterns explicitly rejected as over-engineering at this size** (say so out loud in the
README — the rejection is itself teaching material): repository layer, service layer,
controllers, DI container, Result/Either types, per-handler try/catch, `application/` +
`ports/` + `adapters/` folders, domain-model-to-DB mapping types, `utils/`, a file per
endpoint, and `testClient`-driven route chaining.

## Findings

### Q1: How dependencies reach route handlers

**Recommendation: a factory function `createApp({ db, clock })` with dependencies closed over.
Not `c.set`/`c.get`. Not a module singleton. Certainly not a DI container.**

This is the question where the obvious answer is wrong, so the reasoning matters more than the
conclusion.

#### The finding that changes the answer: Hono's `c.set(db)` pattern is a Cloudflare workaround

Hono's factory-helper documentation gives this example verbatim:

```ts
type Env = {
  Bindings: { MY_DB: D1Database }
  Variables: { db: DrizzleD1Database }
}

export default createFactory<Env>({
  initApp: (app) => {
    app.use(async (c, next) => {
      const db = drizzle(c.env.MY_DB)
      c.set('db', db)
      await next()
    })
  },
})
```

**Source**: [Hono Docs — Factory Helper](https://hono.dev/docs/helpers/factory) — Accessed 2026-08-28.

Read what that code is actually forced to do. The database handle is built **inside a
middleware, per request**, from `c.env.MY_DB`. Why? Because `MY_DB` is a Cloudflare Workers
binding. Hono's own API reference defines `Bindings` as *"Cloudflare Workers Bindings"*,
accessed via `c.env`.
**Source**: [Hono Docs — Hono (app API)](https://hono.dev/docs/api/hono) — Accessed 2026-08-28.

On Cloudflare Workers, bindings **do not exist at module scope** — they arrive attached to the
request. There is therefore no way to construct the database at startup, so it must be
constructed per request and stashed on the context. **`c.set('db', ...)` is the solution to a
constraint that does not exist on Node.**

This app runs on Node with better-sqlite3. The database handle exists happily at startup, is
process-wide, and never varies per request. Adopting the Workers pattern here means paying its
cost (a middleware, an `Env`/`Variables` type, a `c.get('db')` at every call site) to solve a
problem you do not have. **This is the single most likely over-engineering trap in this
question, and it is one a Hono-experienced reader could easily fall into**, because almost all
Hono example code in the wild is Workers-shaped.

**Confidence: High** on the mechanism (two official Hono pages agree on what `Bindings` are and
how `initApp` uses them). **Medium** on my inference that this is *why* the pattern is
ubiquitous — Hono's docs do not say "only do this on Workers" in so many words. Labelled as
analysis, not as a documented claim.

#### What Hono documentation does positively endorse

Hono's Best Practices page endorses writing handlers inline and warns specifically against the
alternative: it advises against *"Ruby on Rails-like Controllers"* because *"the path parameter
cannot be inferred in the Controller without writing complex generics"*, showing

```ts
// ✅
app.get('/books/:id', (c) => {
  const id = c.req.param('id') // Type inference works
  return c.json(`get ${id}`)
})
```

**Source**: [Hono Docs — Best Practices](https://hono.dev/docs/guides/best-practices) — Accessed 2026-08-28.
**Confidence**: High (official documentation; this is the framework's own stated position).

Note what this rules out: extracting handlers into a separate controller object loses type
inference. Hono's escape hatch if you must is `factory.createHandlers()` — but at 5 endpoints
you do not need the escape hatch, you need to not create the problem.

#### The community evidence points at the factory

`w3cj/hono-open-api-starter` (MIT, ~1,000 stars, TypeScript + Hono + Drizzle + Vitest — the
most prominent starter matching this exact stack) assembles its app through factory functions:
`createRouter()` returns a configured instance, `createApp()` composes middleware and registers
`app.notFound(notFound)` and `app.onError(onError)`, and there is a dedicated
**`createTestApp()`** that mounts a router for tests.
**Source**: [w3cj/hono-open-api-starter — `src/lib/create-app.ts`](https://raw.githubusercontent.com/w3cj/hono-open-api-starter/main/src/lib/create-app.ts) — Accessed 2026-08-28.
**Confidence**: Medium-High (single high-visibility repository; evidence of community
convention, not of correctness).

Note the tell: the starter needed a **separate `createTestApp`** — because its `db` is a module
singleton (below) it could not simply hand a test database to the normal factory. Our
recommendation removes the need for that second function.

#### Why the module singleton loses here specifically

The same starter creates its database as a module-level singleton:

```ts
const db = drizzle({ connection: { url: env.DATABASE_URL, ... }, casing: 'snake_case', schema })
export default db
```

**Source**: [w3cj/hono-open-api-starter — `src/db/index.ts`](https://raw.githubusercontent.com/w3cj/hono-open-api-starter/main/src/db/index.ts) — Accessed 2026-08-28.

This is common and, for a deployed service, defensible. **It fails on this app's hardest
constraint.** Design decision 3a.2 says the clock is injectable and *no test may depend on the
wall clock*; decision 21 says tests use a separate ephemeral database. A module singleton makes
both of those a mocking problem (`vi.mock('../db')`, `vi.setSystemTime`) instead of a parameter.
For an audience being taught process and testability, **teaching `vi.mock` to work around your
own module structure is the wrong lesson.** The factory makes the same tests need no mocking at
all.

This is also the honest general argument, independent of this app: a singleton is a hidden
input. It is fine until you want two of them, and tests are always the place you want two.

#### DI container: reject, and say why plainly

There are DI libraries for Hono (e.g. `hono-simple-DI`). At 500 lines, a container replaces a
function parameter — which every reader already understands — with a registry, a resolution
order, and a lifetime model, which they must learn from your code. Fowler's cost-of-carry
argument applies directly: *"Extra code increases complexity, making all subsequent
modifications harder and slower."*
**Source**: [Martin Fowler — Yagni](https://martinfowler.com/bliki/Yagni.html) — Accessed 2026-08-28.
**Confidence**: High (canonical source for the principle; the application to this case is my
analysis).

**Best practice at scale, overkill here — and here it is not even best practice at scale in
TypeScript, where a container mostly re-implements what the module system and function
arguments already do.**

#### The four options scored

| Option | Absence objectionable? | Presence objectionable? | Verdict |
|---|---|---|---|
| **Factory closing over deps** | — | No | **Recommended** |
| `c.set` / `c.get` + `Variables` | No | **Yes** — a per-request mechanism for a process-lifetime value; solves a Workers-only problem | Reject for this app |
| Module singleton | No | **Yes** — hidden input; forces `vi.mock` and a second `createTestApp`; breaks the injectable-clock constraint | Reject |
| DI container | No | **Yes** — a whole concept for five call sites | Reject firmly |

#### Recommended shape

```ts
// src/app.ts  — pure assembly, no I/O, no server
import { Hono } from 'hono'
import type { Db } from './db/client'
import type { Clock } from './clock'
import { registerQueueRoutes } from './http/queue.routes'

export type Deps = { db: Db; clock: Clock }

export function createApp(deps: Deps) {
  const app = new Hono()
  app.onError(errorHandler)
  registerQueueRoutes(app, deps)   // routes still written inline inside this fn
  return app
}
```

```ts
// src/clock.ts — the whole abstraction, three lines
export type Clock = { now: () => Date }
export const systemClock: Clock = { now: () => new Date() }
```

```ts
// src/index.ts — the only file that touches the outside world
import { serve } from '@hono/node-server'
import { createApp } from './app'
import { openDb } from './db/client'
import { systemClock } from './clock'

serve(createApp({ db: openDb(process.env.DATABASE_URL!), clock: systemClock }))
```

Splitting `app.ts` (assembly) from `index.ts` (server) is standard on Node — Hono's own Node
guide keeps `serve(app)` distinct from the app definition, noting *"`serve()` wraps the
node:http module and returns the underlying server instance"*.
**Source**: [Hono Docs — Getting started, Node.js](https://hono.dev/docs/getting-started/nodejs) — Accessed 2026-08-28.

**Note the `Clock` type is three lines and has no interface ceremony.** Resist `IClock`,
`ClockService`, or a `FakeClock` class. `{ now: () => FIXED_DATE }` written inline in a test is
the fake. If you need one shared fixture, a `const frozenClock = (at: Date): Clock => ({ now: ()
=> at })` helper is four lines and earns its place.

**Both questions for the factory itself:**
1. *Absence?* Yes. Without it the constraint "no test depends on the wall clock" is
   unenforceable without mocking machinery.
2. *Presence?* No. It is one exported function taking one object. This is the least
   machinery that satisfies a hard, stated requirement — which is precisely the standard.

**Honest counter-argument, stated because the community does split here.** If the app later
gains per-request state that genuinely varies (an authenticated user, a request id, a tenant),
`c.set`/`c.get` with a typed `Variables` becomes the right answer for *that* value — it is
per-request by nature. The rule is not "never use `c.set`"; it is **`c.set` is for
request-scoped values, constructor arguments are for process-scoped ones**. A database handle
and a clock are process-scoped. If the app grows auth, expect a `Variables: { user: User }` to
appear alongside the factory, not to replace it.

### Q2: Repository / service layer vs. direct DB access in handlers

**Recommendation: no repository, no service layer. Drizzle queries live in the handlers — with
one caveat below that is more important than the headline.**

**Evidence 1 — Fowler's own threshold is explicit and this app is far below it.** The Repository
catalog entry says the pattern is warranted when *"there are a large number of domain classes or
heavy querying"*, where it earns its keep by *"minimizing duplicate query logic"*.
**Source**: [Martin Fowler — Repository (PoEAA catalog)](https://martinfowler.com/eaaCatalog/repository.html) — Accessed 2026-08-28.
**Confidence**: High (the pattern's canonical definition, by its cataloguer).

This app has **2 tables and 5 endpoints**. There is no large number of domain classes. There is
no heavy querying. There is essentially no duplicate query logic to minimise — at most `select
* from visits where status = 'waiting'` appears twice. **The pattern's own author's stated
precondition is not met.** That is the strongest possible form of this argument: it is not
"repositories are bad", it is "the person who wrote it down says not yet".

**Evidence 2 — the reference implementation for this exact stack does not have one.**
`w3cj/hono-open-api-starter` calls Drizzle directly in handlers:

```ts
export const list: AppRouteHandler<ListRoute> = async (c) => {
  const tasks = await db.query.tasks.findMany();
  return c.json(tasks);
};
```

with `import db from "@/db"` and no repository, service, or model layer anywhere in its tree
(`src/` contains `app.ts`, `index.ts`, `env.ts`, `db/`, `lib/`, `middlewares/`, `routes/` — and
nothing else).
**Sources**: [`tasks.handlers.ts`](https://raw.githubusercontent.com/w3cj/hono-open-api-starter/main/src/routes/tasks/tasks.handlers.ts), [repo tree](https://api.github.com/repos/w3cj/hono-open-api-starter/git/trees/main?recursive=1) — Accessed 2026-08-28.
**Confidence**: Medium-High (one repository; strong signal of convention, not proof).

**Evidence 3 — the standing community objection to repositories over an ORM.** The recurring
arguments are: it is an abstraction over an abstraction; it hides ORM capabilities (joins,
partial selects) so those leak out anyway; and the testing benefit is largely illusory because
the logic lives in the queries, which a mocked repository does not exercise.
**Sources**: [Microsoft Developer Blogs archive — "Repository nightmares"](https://learn.microsoft.com/en-us/archive/blogs/cdndevs/repository-nightmares), [InfoQ — Using ORM the Wrong Way](https://www.infoq.com/news/2014/09/using-orm-wrong-way) — Accessed 2026-08-28.
**Confidence**: Medium-High for the arguments as a documented position; these are opinion pieces,
cross-referenced against Fowler's own threshold above. Note the temporal caveat: the InfoQ piece
is from 2014 and the MS blog is an archive — the *arguments* are evergreen but neither is recent.

**Both questions:**
1. *Would a senior dev object to the absence of a repository at 2 tables / 5 endpoints?* **No.**
   This is close to certain. The reaction to `db.select().from(visits)` in a handler in a
   500-line app is "fine".
2. *Would a senior dev object to its presence?* **Yes, and pointedly.** A
   `VisitRepository.findAllWaiting()` that contains one Drizzle call, in an app with one
   database that will never be swapped, is the canonical example of an abstraction with no
   second implementation. Worse for this course: **students will copy it**, and they will copy
   it into apps where it is equally useless.

**Fails the test. Do not add it.**

#### The caveat that matters more than the headline

"No repository" does **not** mean "SQL scattered through HTTP handlers with logic mixed in".
The thing that actually goes wrong at this size is not missing layers — it is a handler that
does five things. Keep the discipline without the layer:

```ts
// http/queue.routes.ts
app.get('/queue', (c) => {
  const waiting = db.select().from(visits)          // 1. I/O — read
    .where(eq(visits.status, 'waiting')).all()
  const queue = buildQueue(waiting, clock.now())    // 2. pure domain (Q3)
  return c.json(queue)                              // 3. serialise
})
```

Three lines, three responsibilities, each visible. That is what a senior reader wants to see and
it needs no layer to achieve. **The seam that matters is pure-vs-impure (Q3), not
handler-vs-repository.**

#### At what size does the threshold arrive, and what triggers it?

Not a line count — a **trigger**. Introduce a data-access module when one of these first
happens, and not before:

1. **The same non-trivial query appears a third time.** (Twice is a coincidence; three times is
   duplication with a maintenance cost.) The fix is usually one exported function, not a class.
2. **A query becomes complex enough to need its own test.** If you want to test the query
   independently of the HTTP route, it needs a name and a home.
3. **You genuinely need a second implementation** — a different database, or an in-memory fake
   you have decided is worth the fidelity risk. Genuinely, not hypothetically.
4. **Handlers exceed roughly 15–20 lines of query-building.** At that point the route's shape
   is lost in the query.

Note that "we might swap the database later" is **not** on this list. It is the most commonly
given reason and the least often exercised, and Fowler's cost-of-repair point applies: the
abstraction built for the imagined swap rarely fits the real one.
**Confidence: Low-Medium.** These triggers are my synthesis, not a cited threshold — no source
gives a numeric line count, and I have labelled it as analysis. What *is* cited is Fowler's
qualitative criterion ("large number of domain classes or heavy querying"), which these triggers
operationalise.

**And when it does arrive, prefer a module of functions over a class.** `db/visits.ts` exporting
`findWaiting(db)`, `insertVisit(db, input)` is the small step. `class VisitRepository implements
IVisitRepository` is the large one, and you almost never need the large one in TypeScript.

### Q3: Where business logic lives — functional core / imperative shell

**Recommendation: yes, a pure `domain/` module — but justify it by the constraints, not by the
pattern's name. And keep it to two files.**

This is the question where the answer is closest, so both sides deserve a fair hearing.

**The pattern, and its documented claims.** Gary Bernhardt's formulation (SCNA 2012 "Boundaries";
the "Functional Core, Imperative Shell" screencast) puts an imperative shell around a functional
core, giving *"the shell having fewer paths but more dependencies"* while *"the core contains no
dependencies but encapsulates the different logic paths"*. The claimed testing benefit is that
testing the functional pieces *"often naturally allows isolated testing with no test doubles"*,
and Bernhardt reports having few or no tests for the shell because it contains few conditionals.
**Sources**: [Destroy All Software — Boundaries (SCNA 2012)](https://www.destroyallsoftware.com/talks/boundaries), [Destroy All Software — Functional Core, Imperative Shell](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell) — Accessed 2026-08-28.
**Confidence**: Medium-High. These are the primary sources (author's own site), but the talk is
paywalled/video and I could not verify the quotes against the primary artifact directly — they
come via search-result summarisation and community restatements
([kbilsted/Functional-core-imperative-shell](https://github.com/kbilsted/Functional-core-imperative-shell)). Flagged in Knowledge Gaps.

**The argument FOR, in this specific app — and it is unusually strong.**

This app has **two hard requirements that are exactly what the pattern is for**:

1. **"The wait estimate is a defined function, not a prediction"** — `estimate = (patients
   ahead) × (average consultation minutes for their level)`. That is *literally specified as a
   pure function*. It has no natural home other than a pure module.
2. **"No test may depend on the wall clock."** The only way to hold that guarantee structurally
   is for `now` to be a **parameter** of the ordering and estimation functions. Once `now: Date`
   is an argument rather than a call, the function is pure by construction, and the constraint
   becomes unbreakable rather than merely observed.

Add the queue ordering rule (triage level, then arrival time within level) and the cycle-3
amendment (queue aging escalates a level after 60 minutes), and you have **the entirety of the
app's interesting behaviour expressible with zero I/O**. That is not a coincidence — it is what
the domain was designed for.

The payoff is concrete and visible in the test suite: ordering, estimation and aging get tested
as `expect(buildQueue(visits, at)).toEqual(...)` — no database, no HTTP, no clock mocking, no
`beforeEach`, microsecond runtime. Per design decision 22 and the gate-catalogue finding about
error-repair bands, **a failing unit test that names the function and shows the wrong value is
in the ~77% band; the same defect surfacing through an E2E scenario is in the ~45% band.** The
functional core is what makes the fast, high-signal gate possible.

**The argument AGAINST, stated honestly.** At 500 lines you could put `orderQueue` and
`estimateWait` in the same file as the routes and nothing would be wrong. The pattern's *name*
is heavier than the thing; a reader who sees `domain/`, `application/`, `infrastructure/` and a
`Ports` file in a 500-line app will (correctly) see hexagonal-architecture cargo cult.
**The risk here is real, and it is entirely about how far you take it.**

**The resolution — and this is the important sentence in this section.** The recommendation is
**a pure module, not an architecture**. Concretely:

- ✅ `src/domain/queue.ts` — exports `buildQueue`, `estimateWait`, `compareVisits`. Imports
  nothing but types. ~80 lines.
- ✅ `src/domain/triage.ts` — the level union, the target-time constants. ~15 lines.
- ❌ No `application/` layer. No `ports/`. No `Result` type. No interfaces for the pure
  functions. No dependency-inversion diagram in the README.

**Both questions:**
1. *Absence?* **Yes.** With ordering and estimation inlined in handlers, the two rules the
   entire course exercises would only be testable through HTTP — which directly contradicts
   design decisions 3a.2 and 22. A senior reader would ask "why can't I test the ordering rule
   directly?" and there would be no answer.
2. *Presence?* **No — at two files with no ceremony.** It becomes objectionable at the moment it
   acquires an interface, a factory, a layer name, or a third file that exists only for symmetry.

**Passes — narrowly, and only in its minimal form.**

**Recommended shape:**

```ts
// src/domain/queue.ts — no imports except types. No Date.now(). No db. No Hono.
import type { Visit, TriageLevel } from '../db/schema'

const RANK: Record<TriageLevel, number> = {
  RED: 0, ORANGE: 1, YELLOW: 2, GREEN: 3, BLUE: 4,
}

const AVG_CONSULTATION_MINUTES: Record<TriageLevel, number> = {
  RED: 30, ORANGE: 25, YELLOW: 20, GREEN: 15, BLUE: 10,
}

/** Triage level first, then arrival time within a level. */
export function compareVisits(a: Visit, b: Visit): number {
  return RANK[a.triageLevel] - RANK[b.triageLevel]
    || a.arrivedAt.getTime() - b.arrivedAt.getTime()
}

export type QueueEntry = {
  visit: Visit
  position: number
  estimatedWaitMinutes: number
}

/**
 * `now` is a parameter, not a call. This is what makes every test
 * deterministic without mocking the system clock.
 */
export function buildQueue(waiting: readonly Visit[], now: Date): QueueEntry[] {
  const ordered = [...waiting].sort(compareVisits)
  let minutes = 0
  return ordered.map((visit, i) => {
    const entry = { visit, position: i + 1, estimatedWaitMinutes: minutes }
    minutes += AVG_CONSULTATION_MINUTES[visit.triageLevel]
    return entry
  })
}
```

Two details worth noticing, both aimed at the reader:

- **`now: Date` as a parameter, with a comment saying why.** A skilled reader learns the
  technique from the signature. This is the highest-value teaching line in the codebase, and it
  costs nothing.
- **`[...waiting].sort(...)` rather than `waiting.sort(...)`.** `Array.prototype.sort` mutates.
  A function billed as pure that mutates its argument is worse than no claim of purity at all —
  and it is exactly the detail this audience will check.

**One deliberate omission.** The domain module takes `Visit` — the Drizzle `$inferSelect` type —
directly. It does **not** define its own `DomainVisit` and map into it. That mapping layer is the
classic next step in hexagonal architecture and it is unambiguously overkill here: it would
double the type declarations to decouple from a database that is never changing. The dependency
on `db/schema` is a **type-only** dependency (`import type`), erased at compile time, so the
domain module still has zero runtime dependencies — which is the property that actually matters.

### Q4: Request validation — `safeParse` vs `@hono/zod-validator`

**Recommendation: `@hono/zod-validator`. Verified to exist, current, and cheap.**

**Evidence — the package exists and is actively maintained.** The npm registry manifest for
`@hono/zod-validator@latest` returns **version 0.9.0**, MIT, `"description": "Validator
middleware using Zod"`, maintainer `yusukebe` (Hono's author), repository
`honojs/middleware` in `packages/zod-validator`. Its `peerDependencies` are
`zod: "^3.25.0 || ^4.0.0"` and `hono: ">=4.11.2"` — so **Zod v4 is supported**. Its
devDependencies pin `zod ^4.2.1`, `hono ^4.11.5`, `vitest ^4.1.7`.
**Source**: [npm registry manifest, `@hono/zod-validator/latest`](https://registry.npmjs.org/@hono/zod-validator/latest) — Accessed 2026-08-28.
**Confidence**: High (primary artifact — the registry manifest itself, not a description of it).

**Evidence — Hono's own docs recommend a third-party validator over hand-rolling.**
The validation guide shows the built-in `validator()` from `hono/validator`, then shows
the manual Zod pattern (`schema.safeParse(value)` inside `validator('form', ...)`), and
then states: *"We recommend using a third-party validator."*
**Source**: [Hono Docs — Validation](https://hono.dev/docs/guides/validation) — Accessed 2026-08-28.
**Confidence**: High (official framework documentation, primary source).

**The per-route boilerplate cost, measured against the alternatives.**

Hand-rolled `safeParse` inside a handler — what you avoid:

```ts
// 3 extra lines per route, x5 routes = 15 lines of pure ceremony,
// plus the result is untyped unless you narrow manually.
app.post('/visits', async (c) => {
  const parsed = registerArrivalSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: 'ValidationError', issues: parsed.error.issues }, 400)
  }
  const input = parsed.data
  // ...
})
```

`zValidator` — what you get instead:

```ts
import { zValidator } from '@hono/zod-validator'

app.post('/visits', zValidator('json', registerArrivalSchema), async (c) => {
  const input = c.req.valid('json') // fully typed as z.infer<typeof registerArrivalSchema>
  // ...
})
```

Per-route cost is **one argument**. `c.req.valid('json')` is typed from the schema with no
generics written by hand. This is the pattern in Hono's own validation guide.

**Both questions from the central tension:**
1. *Would a senior dev object to its absence?* Yes — mildly. Repeating the same
   five-line safeParse/400 block five times is the kind of duplication a reviewer flags,
   and it makes the validated value's type a manual concern.
2. *Would a senior dev object to its presence?* No. It is one first-party dependency
   maintained by the framework author, adds one argument per route, and removes code
   rather than adding structure. It is not a layer, an abstraction, or an indirection.

**Verdict: passes the test.** This is the rare case where the "extra" tool is smaller than
what it replaces.

**One caveat worth teaching.** Hono's validation guide notes: *"When you validate `json`
or `form`, the request _must_ contain a matching `content-type` header."* A request without
`content-type: application/json` will not reach your schema. Worth knowing before someone
loses ten minutes to it in class.

**The error shape is customisable via the hook (third argument).** If a uniform error
envelope matters, `zValidator(target, schema, (result, c) => { ... })` lets you shape the
400 once. For a 5-endpoint app the default response is acceptable; if you want a house
style, define the hook **once** and wrap it:

```ts
// http/validate.ts — 6 lines, used by every route
import { zValidator } from '@hono/zod-validator'
import type { ZodSchema } from 'zod'

export const validate = <T extends ZodSchema>(target: 'json' | 'param' | 'query', schema: T) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'ValidationError', issues: result.error.issues }, 400)
    }
  })
```

**Confidence on the hook signature**: High — verified against the package **source**, not a
blog. `zValidator` takes `(target, schema, hook?, options?)`. The hook's type is:

```
(result: ({ success: true; data: T } | { success: false; error: ZodError<Schema>; data: T })
   & { target: Target },
 c: Context<E, P>) => Response | void | TypedResponse<O> | Promise<...>
```

Returning `void` falls through to the default behaviour, so the hook only needs to handle the
failure branch. There is also an `options.validationFunction` escape hatch for custom
validation logic.
**Source**: [honojs/middleware — `packages/zod-validator/src/index.ts`](https://raw.githubusercontent.com/honojs/middleware/main/packages/zod-validator/src/index.ts) — Accessed 2026-08-28.
(Note: the `main` branch source may be ahead of the published 0.9.0. The parameter order and
hook shape are stable across recent versions, but if the hook misbehaves, check the installed
version's `.d.ts` first.)

**Alternative worth knowing about, not worth using here.** `@hono/standard-validator`
(`sValidator`) targets the Standard Schema interface and works with Zod, Valibot and ArkType
interchangeably. That flexibility buys nothing when the stack decision has already fixed Zod,
and it costs one layer of indirection in the reader's head. *Best practice for a library;
overkill here.*
**Source**: [Hono Docs — Validation](https://hono.dev/docs/guides/validation) — Accessed 2026-08-28.

### Q5: Error handling — `onError` vs Result types vs try/catch

**Recommendation: throw `HTTPException`, catch centrally in `app.onError`. No try/catch in
handlers, no Result type.**

**Evidence — this is Hono's documented mechanism.** Hono ships `HTTPException` from
`hono/http-exception` specifically for this: *"When a fatal error occurs, Hono (and many
ecosystem middleware) may throw an `HTTPException`."* The documented handling pattern is
verbatim:

```ts
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  console.error(err)
  return c.text('Internal Server Error', 500)
})
```

**Source**: [Hono Docs — Exception](https://hono.dev/docs/api/exception) — Accessed 2026-08-28.
**Confidence**: High (official documentation; `HTTPException` is a framework export, and
Hono's own middleware throws it, so `onError` must exist in any non-trivial app regardless
of your own style).

**The decisive argument is not aesthetics — it is that you do not get a choice.** Hono's
own ecosystem middleware throws `HTTPException`. If you adopt a Result/Either discipline in
your handlers, you still need `onError` for everything thrown beneath you, so you end up
maintaining **two** error paths instead of one. A single mechanism that already exists beats
a second mechanism layered beside it.

**Both questions:**
1. *Absence?* Yes, strongly. Without `onError` an unexpected throw produces an unhandled
   rejection and whatever the adapter decides — usually a bare 500 with no log line. A
   4-line `onError` is the smallest possible fix and a senior reader expects it.
2. *Presence?* No. It is four lines, framework-native, and there is exactly one of it.

**Result/Either types: best practice in some codebases, overkill here — and actively
harmful for this audience.** The stated audience is *mixed-experience developers who will
imitate what they see*. A `Result<T, E>` discipline is a whole-codebase commitment: every
call site must unwrap, and the moment one function forgets, the guarantee is gone. In 500
lines with 5 endpoints there is not enough error surface to amortise the concept, and the
students most likely to copy it are the ones least likely to apply it consistently. It also
fights the ecosystem — Hono middleware throws, Drizzle throws, Zod's `safeParse` returns a
result but `zValidator` already handles that boundary for you.

**Per-handler try/catch: reject.** It is the pattern that scales worst: five handlers means
five nearly-identical catch blocks, and the first one someone forgets is the one that
matters. This is the failure mode `onError` exists to remove.

**Recommended shape — a domain error the HTTP layer translates:**

```ts
// domain/errors.ts
export class NotFoundError extends Error {
  constructor(public readonly what: string, public readonly id: string) {
    super(`${what} ${id} not found`)
    this.name = 'NotFoundError'
  }
}

// http/app.ts
import { HTTPException } from 'hono/http-exception'

app.onError((err, c) => {
  if (err instanceof NotFoundError) return c.json({ error: err.message }, 404)
  if (err instanceof HTTPException) return err.getResponse()
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})
```

**Why a domain error class rather than throwing `HTTPException` from domain code:** it keeps
the pure domain module free of HTTP vocabulary, which is the whole point of Q3's
functional-core recommendation. The translation to a status code happens in exactly one
place. That said — **if your domain functions never throw** (see Q3: prefer returning
`undefined`/`null` and letting the handler decide), you may not need a domain error class at
all, and throwing `HTTPException(404)` directly from the handler is simpler and perfectly
idiomatic. Prefer the simpler version unless the app grows a second reason to fail.

**Documented gotcha to carry:** the exception docs warn that
*"`HTTPException.getResponse` is not aware of `Context`"* — headers set on the context are
not automatically applied to the returned response. Irrelevant for this app (no
context-set headers), but worth a comment if CORS headers are ever set per-request.

### Q6: Project structure — feature folders vs layer folders

**Recommendation: shallow layer folders (`domain/`, `db/`, `http/`) — because at one feature,
feature folders are a distinction without a difference, and layer names teach the seam that
actually matters here.**

**The honest starting point: this debate is about a problem this app does not have.** Feature
folders (a.k.a. vertical slices, package-by-feature) win in the literature because they keep
change local: a change to "billing" touches `billing/` and nothing else. **This app has one
feature.** The queue *is* the app. A `visits/` folder containing everything is not a feature
folder; it is the `src/` folder with an extra level of nesting.

**Community evidence — the reference repo for this stack uses feature folders, and it is
instructive to see why it does not transfer.** `w3cj/hono-open-api-starter` has:

```
src/
├── app.ts
├── index.ts
├── env.ts
├── db/          index.ts, schema.ts, migrations/
├── lib/         create-app.ts, types.ts, constants.ts, configure-open-api.ts, zod-utils.ts
├── middlewares/ pino-logger.ts
└── routes/
    ├── index.route.ts
    └── tasks/   tasks.routes.ts, tasks.handlers.ts, tasks.index.ts, tasks.test.ts
```

**Source**: [w3cj/hono-open-api-starter — repository tree](https://api.github.com/repos/w3cj/hono-open-api-starter/git/trees/main?recursive=1) — Accessed 2026-08-28.
**Confidence**: Medium-High (single repository; evidence of one credible author's convention).

Three things to take from it and one to reject:

- ✅ **`db/` is a layer folder even in a feature-folder repo.** Schema and migrations are global,
  not per-feature. Same conclusion for us.
- ✅ **`app.ts` separate from `index.ts`** (assembly vs. server entry). Same conclusion for us.
- ✅ **Tests co-located** (`tasks.test.ts` next to the code). Worth copying.
- ❌ **The four-file split per feature** (`.routes.ts` / `.handlers.ts` / `.index.ts` / `.test.ts`)
  exists because that starter uses `@hono/zod-openapi`, which requires route *definitions* to be
  declared separately from their implementations so a spec can be generated. **That is a
  constraint of OpenAPI generation, not a structural preference.** We are not generating OpenAPI.
  Copying the split without the reason is precisely the cargo-culting this research is meant to
  prevent — and it would be very easy to do, since this is the most visible example in the
  ecosystem.

**Why layer names and not `visits/`.** The one seam this codebase genuinely needs the reader to
see is **pure vs. impure** (Q3). Folder names are the cheapest possible way to make it visible:
`domain/` means "no I/O in here", `db/` and `http/` mean "I/O lives here". A reader who opens
`domain/queue.ts` and finds a `db` import knows instantly that something is wrong. That
affordance is free and it is exactly the lesson the course is trying to transmit.

**Both questions:**
1. *Absence of any structure (everything flat in `src/`)?* At ~8 files this is genuinely
   defensible and a senior reader would not object. But it loses the pure/impure signal, which
   here is load-bearing. Mild yes.
2. *Presence of three shallow folders?* No. Three folders with 2–4 files each is not
   architecture, it is filing. It becomes objectionable at `application/`, `ports/`,
   `adapters/`, `interfaces/`, `dto/`, or any folder that exists for symmetry rather than
   contents.

**Recommended shape:**

```
backend/src/
├── index.ts              # server entry: opens db, real clock, serve(). The ONLY impure top level.
├── app.ts                # createApp({ db, clock }) -> Hono. Assembly + onError.
├── clock.ts              # type Clock = { now(): Date }; systemClock. ~3 lines.
├── domain/
│   ├── triage.ts         # TRIAGE_LEVELS, TriageLevel, per-level constants
│   ├── queue.ts          # compareVisits, buildQueue, estimateWait  (PURE)
│   └── queue.test.ts     # fast, no db, no http, no clock
├── db/
│   ├── schema.ts         # tables + `export type Visit = typeof visits.$inferSelect`
│   ├── client.ts         # openDb(url) -> Db   (factory, not singleton — see Q1)
│   └── migrations/       # drizzle-kit output
└── http/
    ├── schemas.ts        # Zod request schemas (reusing TRIAGE_LEVELS)
    ├── routes.ts         # the 5 endpoints, handlers inline (see Q2 caveat)
    └── routes.test.ts    # app.request() against a fresh in-memory db
```

**Roughly 8 source files for 400–600 lines — about 60 lines each.** That is the right density: a
reader can hold any one file in their head, and nothing is split for the sake of splitting.

**Deliberate choices in that tree, each defensible aloud:**

- **`http/routes.ts` is one file, not five.** Five endpoints at ~15 lines each is ~75 lines. A
  file per endpoint would be five files that must be read together — worse, not better. Split
  when the file passes ~200 lines, not before.
- **`clock.ts` sits at the top level, not in `domain/` or a `lib/`.** It is a dependency of the
  shell, not of the core (the core takes `now: Date`, never a `Clock`). Putting it at the root
  says "this is a top-level concept of this app" — which, given the constraint, it is.
- **No `lib/`, no `utils/`, no `types.ts`.** `utils/` is where cohesion goes to die, and at this
  size every type has an obvious home next to what it describes.
- **No `services/`, no `repositories/`, no `controllers/`, no `models/`.** Per Q2.
- **Tests co-located with source.** Two test files, each next to what it tests. Vitest picks up
  `*.test.ts` anywhere with no configuration.

**The dependency rule, which is the actual point of the folder names** — worth stating in one
line in the README:

```
index.ts  ->  app.ts  ->  http/  ->  domain/   (pure)
                            \\
                             ->  db/       (impure)

domain/ imports nothing but types. If that ever stops being true, the design has broken.
```

One arrow, one invariant, no diagram. A skilled reader gets the whole architecture in five
seconds, and — critically for a course about process — **it is a rule a gate could enforce**
(a lint rule or a three-line grep asserting `domain/` contains no non-type imports). That makes
the structure an *artifact of the course's own thesis* rather than decoration.

### Q7: Drizzle specifics — `$inferSelect`, enum columns, transactions

#### Q7a: Is `$inferSelect` / `$inferInsert` worth using? — **Yes, unreservedly.**

**Evidence.** Drizzle documents both as first-class "goodies":

```ts
type SelectUser = typeof users.$inferSelect;
type InsertUser = typeof users.$inferInsert;
```

with equivalent generic forms `InferSelectModel<typeof users>` / `InferInsertModel<typeof users>`.
The documented purpose is *"fully type-safe database operations by automatically generating
accurate TypeScript types from your schema definitions."*
**Source**: [Drizzle ORM Docs — Goodies](https://orm.drizzle.team/docs/goodies) — Accessed 2026-08-28.
**Confidence**: High (official documentation).

**Why it earns its place at 500 lines — and this is the strongest argument in this
document.** The alternative is a hand-written `interface Visit { ... }` sitting next to the
schema, which is a **second declaration of the same truth**. Two declarations drift. The
whole reason this project chose Drizzle over raw SQL (per `docs/course-design-decisions.md`
§4a) was to convert runtime mistakes into `tsc` errors; hand-writing the row type throws that
benefit away at exactly the point it pays off. `$inferSelect` is not an abstraction — it is
zero runtime code and one type alias.

**Both questions:**
1. *Absence?* Yes — a senior reader seeing a hand-maintained `interface Visit` beside a
   Drizzle schema will immediately ask why the schema is not the source of truth.
2. *Presence?* No. It is `typeof table.$inferSelect`. There is nothing to object to.

**Recommended shape:**

```ts
// db/schema.ts
export const visits = sqliteTable('visits', { /* ... */ })

export type Visit = typeof visits.$inferSelect
export type NewVisit = typeof visits.$inferInsert
```

Export the types **from the schema file**, next to the table. Then the domain module imports
`Visit` and never mentions Drizzle again. One line, and it is the seam that makes Q3's
functional core possible without a mapping layer.

**Note on `$inferInsert` specifically:** it correctly makes columns with defaults and
autoincrementing ids optional, which is precisely the difference you would get wrong by hand.

#### Q7b: How to declare the triage level (RED/ORANGE/YELLOW/GREEN/BLUE)

**Answer: `text({ enum: [...] }).notNull()`. Drizzle's SQLite dialect has no native enum
column type — and does not need one.**

**Evidence.** The SQLite column-types documentation gives:

```ts
text({ enum: ["value1", "value2"] })
```

and states it *"will be inferred as text: `"value1" | "value2" | null`"*, with the explicit
caveat that it **"won't check runtime values"** — the `enum` option is a TypeScript-level
inference feature only. SQLite has no native enum type; Drizzle does not synthesise one.
(Compare: `pgEnum` exists in the Postgres dialect because Postgres has the type. The absence
in SQLite is a dialect fact, not a Drizzle gap.)
**Source**: [Drizzle ORM Docs — SQLite column types](https://orm.drizzle.team/docs/column-types/sqlite) — Accessed 2026-08-28.
**Confidence**: High (official documentation, dialect-specific page).

**Reads come back typed with no manual cast** — that is exactly what the `enum` option
delivers. Note the documented inferred type ends in `| null` because columns are nullable by
default; **`.notNull()` is what removes the `| null`** and gives you the clean union.

**Recommended shape — single source of truth for the level union:**

```ts
// domain/triage.ts — no Drizzle import, pure data
export const TRIAGE_LEVELS = ['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE'] as const
export type TriageLevel = (typeof TRIAGE_LEVELS)[number]
//   => 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'BLUE'

// db/schema.ts
import { TRIAGE_LEVELS } from '../domain/triage'

export const visits = sqliteTable('visits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  triageLevel: text('triage_level', { enum: TRIAGE_LEVELS }).notNull(),
  arrivedAt: integer('arrived_at', { mode: 'timestamp_ms' }).notNull(),
  status: text('status', { enum: ['waiting', 'in-consultation', 'done'] }).notNull(),
})

// http/schemas.ts — Zod reuses the same array, so all three agree by construction
import { z } from 'zod'
export const triageLevelSchema = z.enum(TRIAGE_LEVELS)
```

**This is the highest-leverage three lines in the whole app for this audience.** One `as
const` array feeds (a) the TypeScript union, (b) the Drizzle column type, and (c) the Zod
runtime validator. A skilled reader will notice it approvingly; the failure they would notice
is the same list written out three times.

**Two caveats that will bite if ignored:**

1. **`as const` is load-bearing.** Drizzle infers the union from a readonly tuple type.
   Without `as const`, `TRIAGE_LEVELS` is `string[]` and the column infers as plain `string`
   — silently losing the exact thing you wanted.
   **Confidence: Medium.** This follows from how the documented inference works
   (`text({ enum: ["a","b"] })` producing `"a" | "b"` requires literal-type preservation), but
   I could not execute a compile to confirm the failure mode for a non-`const` array — see
   Knowledge Gaps. **Cheap to verify: 60 seconds with `tsc`. Do it before the course.**
2. **No runtime enforcement.** Drizzle states plainly that the enum option *"won't check
   runtime values"* — nothing stops `UPDATE visits SET triage_level = 'PURPLE'` outside the
   app. Zod at the HTTP boundary is what actually enforces it. If belt-and-braces is wanted,
   a SQLite `CHECK` constraint in the migration is the honest complement, but for a 5-endpoint
   teaching app with one writer that is defensible to skip — and worth one sentence in a
   comment saying so, because *saying why you skipped it* is itself the senior signal.

**Timestamps:** use `integer('arrived_at', { mode: 'timestamp_ms' })`. Drizzle documents
`integer({ mode: 'timestamp' })` and `integer({ mode: 'timestamp_ms' })` as mapping to `Date`.
This matters for the injectable-clock constraint: the domain then works with `Date` end to
end and never parses strings. Prefer `timestamp_ms` over `timestamp` — the latter is
second-resolution, and a queue that orders by arrival time within a triage level will produce
ties in tests where two arrivals land in the same second. **That is a real flake source for
this specific app.**
**Source**: [Drizzle ORM Docs — SQLite column types](https://orm.drizzle.team/docs/column-types/sqlite) — Accessed 2026-08-28.
**Confidence**: High on the API; the tie-ordering hazard is my analysis, labelled as such.

#### Q7c: Does this app need transactions anywhere? — **Yes, in exactly one place.**

**Evidence — the API.** Drizzle documents `db.transaction(async (tx) => { ... })`, with
`tx.rollback()`, nested transactions via savepoints, and return values:

```ts
await db.transaction(async (tx) => {
  await tx.update(accounts).set({ /* ... */ }).where(/* ... */)
  await tx.update(accounts).set({ /* ... */ }).where(/* ... */)
})
```

**Source**: [Drizzle ORM Docs — Transactions](https://orm.drizzle.team/docs/transactions) — Accessed 2026-08-28.
**Confidence**: High (official documentation).

**The one place it is warranted: re-triage.** Re-triage writes **two** rows — it updates
`visits.triage_level` and appends a row to `triage_events`. Those two writes are one fact.
If the second fails, the history no longer explains the current state, and the cycle-3
amendment (queue aging) depends on that history being complete. This is the textbook case,
and it is *genuinely present in the domain* rather than added for demonstration.

```ts
export function reTriage(db: Db, clock: Clock, id: number, to: TriageLevel) {
  return db.transaction((tx) => {
    const [visit] = tx.update(visits)
      .set({ triageLevel: to })
      .where(eq(visits.id, id))
      .returning()
      .all()
    if (!visit) throw new NotFoundError('visit', String(id))
    tx.insert(triageEvents)
      .values({ visitId: id, toLevel: to, at: clock.now() })
      .run()
    return visit
  })
}
```

**Both questions:**
1. *Absence?* Yes. A senior reader who sees two related writes without a transaction will
   flag it — and here they would be right, not pedantic.
2. *Presence?* No, provided it appears **once**, wrapping a genuine multi-write operation.
   The over-engineering failure would be a `withTransaction()` helper, a unit-of-work
   abstraction, or wrapping single-statement reads. Call `db.transaction` inline at the one
   call site that needs it.

**Registration (`POST /visits`) is a judgement call.** If arrival also writes an initial
`triage_events` row, it is the same two-write case and takes the same treatment. If it writes
only to `visits`, do not wrap it — a single statement is already atomic in SQLite, and
wrapping it teaches the cargo-cult.

**A better-sqlite3 specific note — FLAGGED AS UNVERIFIED, AND THE TOP EMPIRICAL CHECK IN THIS
DOCUMENT.** better-sqlite3 is a *synchronous* driver, but Drizzle's own SQLite getting-started
page shows `const result = await db.all('select 1')` for the better-sqlite3 setup — i.e. the
Drizzle wrapper presents an awaitable API over a synchronous driver.
**Source**: [Drizzle ORM Docs — Get started with SQLite](https://orm.drizzle.team/docs/get-started-sqlite) — Accessed 2026-08-28.

Meanwhile the transactions page is **dialect-generic** and, as fetched, contains **no
better-sqlite3-specific guidance at all** — its examples are `async (tx) => { await ... }` and
its only dialect-specific section is PostgreSQL isolation levels.
**Source**: [Drizzle ORM Docs — Transactions](https://orm.drizzle.team/docs/transactions) — Accessed 2026-08-28.

So the two official pages leave the important question open: **for the better-sqlite3 dialect,
is the transaction callback synchronous or async, and is `await` inside it safe?** This matters
because with a synchronous driver, yielding to the event loop mid-transaction is the classic way
to lose atomicity. I could not resolve this from documentation and had no shell in this session.

**Action before writing the re-triage endpoint (~60 seconds):**

```ts
// 1. Does the callback type accept async? Does tsc complain about a sync one?
// 2. Does a mid-transaction throw actually roll back the first write?
try {
  db.transaction((tx) => {
    tx.insert(visits).values({ /* ... */ }).run()
    throw new Error('boom')
  })
} catch {}
// assert: SELECT count(*) FROM visits === 0
```

If that assertion passes, the code shape shown above is correct. If the sync callback does not
typecheck, use `async (tx) => { await ... }` and re-run the rollback assertion — **the rollback
assertion is the check that actually matters**, not the syntax. Write this as a real test and
keep it: it documents a genuine subtlety and is exactly the kind of artifact this audience
respects. See Knowledge Gaps.

### Q8: Testing the HTTP layer in Vitest without a server

**Recommendation: `await app.request(...)`. Nothing else. No supertest, no `listen`, no port.**

**Evidence — this is the documented method.** Hono's testing guide's core statement is that
testing is done by creating a Request and passing it to `app.request()` to check the Response:

```ts
test('GET /posts', async () => {
  const res = await app.request('/posts')
  expect(res.status).toBe(200)
  expect(await res.text()).toBe('Many posts')
})

test('POST /posts', async () => {
  const res = await app.request('/posts', {
    method: 'POST',
    body: JSON.stringify({ message: 'hello hono' }),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  })
  expect(res.status).toBe(201)
})
```

A native `Request` instance or `FormData` can be passed directly. Bindings can be mocked via
a third argument: `await app.request('/posts', {}, MOCK_ENV)`.
**Source**: [Hono Docs — Testing](https://hono.dev/docs/guides/testing) — Accessed 2026-08-28.
**Confidence**: High (official documentation; `app.request` is core API, not a helper package).

**Why this is not merely convenient but architecturally significant.** A Hono app *is* a
`Request => Response` function. There is no server to start because the server was never part
of the app — `@hono/node-server` is an adapter bolted on at `index.ts`. This is the single
best thing about the stack for a teaching repo: **the HTTP tests have no setup, no teardown,
no port allocation, no flake, and no `beforeAll`.** A senior reader who has fought
supertest/port-collision flake will notice this immediately and favourably.

**Recommended shape — this is where Q1's factory pays off:**

```ts
// test/queue.test.ts
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { createTestDb } from './helpers/db'

const AT_0900 = new Date('2026-03-01T09:00:00Z')

describe('GET /queue', () => {
  it('orders by triage level, then arrival time within level', async () => {
    const db = createTestDb()                 // fresh in-memory sqlite + migrations
    const clock = { now: () => AT_0900 }      // frozen; no wall clock anywhere
    const app = createApp({ db, clock })      // <- the whole reason for the factory

    await app.request('/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A', triageLevel: 'GREEN' }),
    })

    const res = await app.request('/queue')
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ /* ... */ })
  })
})
```

No `beforeEach`, no shared mutable state, no cleanup — each test constructs its own app over
its own database. For a teaching repo that is a lesson in itself.

**`testClient` — the typed alternative, and why to skip it here.** Hono ships
`testClient()` in `hono/testing`, which *"takes an instance of Hono as its first argument and
returns an object typed according to your Hono application's routes"*, called as
`client.search.$get({ query: { q: 'hono' } })`. It is genuinely nicer for large APIs.
**But it carries a hard structural constraint**: the docs state *"you must define your routes
using chained methods directly on the Hono instance"*, and warn that if you *"define routes
separately after creating the Hono instance ... the testClient will not have the necessary
type information."*
**Source**: [Hono Docs — Testing helper](https://hono.dev/docs/helpers/testing) — Accessed 2026-08-28.
**Confidence**: High (official documentation).

That constraint is the problem. It forces every route into one chained expression
(`new Hono().get(...).post(...).patch(...)`), which is a style choice made **for the benefit
of the test client**, not for the reader. Letting the test tail wag the production dog is
exactly the over-engineering smell this audience will spot. With 5 endpoints, `app.request()`
costs nothing and constrains nothing.

**Both questions for `testClient`:**
1. *Absence?* No — `app.request()` is the documented baseline and reads fine.
2. *Presence?* **Yes** — it imposes a source-layout constraint on the app to serve the tests.

**Verdict: use `app.request()`.** Mention `testClient` in a comment if you like; do not build
around it.

**Test database:** create a fresh SQLite database per test. better-sqlite3 supports
`':memory:'`, and the project has already decided on a separate ephemeral test database
(design decision 21). Run migrations into it in the helper. **Confidence: Medium** — I did not
verify the exact `drizzle-orm/better-sqlite3/migrator` invocation against an in-memory
database in this session (no shell available). It is a documented path but worth a 60-second
check.

## Source Analysis

| Source | Domain | Reputation | Type | Access Date | Cross-verified |
|--------|--------|------------|------|-------------|----------------|
| Hono Docs — Context (`c.set`/`c.get`, `Variables`, `ContextVariableMap`) | hono.dev | High (1.0) | Official framework docs | 2026-08-28 | Y (api/hono) |
| Hono Docs — Best Practices | hono.dev | High (1.0) | Official framework docs | 2026-08-28 | Y (helpers/factory) |
| Hono Docs — Testing guide | hono.dev | High (1.0) | Official framework docs | 2026-08-28 | Y (helpers/testing) |
| Hono Docs — Testing helper (`testClient`) | hono.dev | High (1.0) | Official framework docs | 2026-08-28 | Y (guides/testing) |
| Hono Docs — Validation guide | hono.dev | High (1.0) | Official framework docs | 2026-08-28 | Y (npm manifest, pkg source) |
| Hono Docs — Exception / `HTTPException` | hono.dev | High (1.0) | Official framework docs | 2026-08-28 | Y (api/hono `onError`) |
| Hono Docs — Factory helper (`createFactory`, `initApp`) | hono.dev | High (1.0) | Official framework docs | 2026-08-28 | Y (api/hono `Bindings`) |
| Hono Docs — App API (`Bindings`, `Variables`, `onError`, `request`) | hono.dev | High (1.0) | Official framework docs | 2026-08-28 | Y (helpers/factory) |
| Hono Docs — Getting started, Node.js (`serve`) | hono.dev | High (1.0) | Official framework docs | 2026-08-28 | N (single source; low-risk claim) |
| Drizzle Docs — Goodies (`$inferSelect`/`$inferInsert`) | orm.drizzle.team | High (1.0) | Official ORM docs | 2026-08-28 | N (single authoritative source) |
| Drizzle Docs — SQLite column types (`text({enum})`, integer modes) | orm.drizzle.team | High (1.0) | Official ORM docs | 2026-08-28 | N (single authoritative source) |
| Drizzle Docs — Transactions | orm.drizzle.team | High (1.0) | Official ORM docs | 2026-08-28 | Partial (gap: no better-sqlite3 guidance) |
| Drizzle Docs — Get started with SQLite | orm.drizzle.team | High (1.0) | Official ORM docs | 2026-08-28 | Partial (conflicts w/ transactions page — see Conflicts) |
| npm registry manifest — `@hono/zod-validator@0.9.0` | registry.npmjs.org | High (1.0) | Primary artifact (package manifest) | 2026-08-28 | Y (pkg source, Hono docs) |
| `honojs/middleware` — `packages/zod-validator/src/index.ts` | raw.githubusercontent.com | High (1.0) | Primary artifact (source code) | 2026-08-28 | Y (npm manifest, Hono docs) |
| `w3cj/hono-open-api-starter` — repo tree (GitHub API) | api.github.com | Medium-High (0.8) | Primary artifact (repo structure) | 2026-08-28 | Y (raw source files below) |
| `w3cj/hono-open-api-starter` — `src/routes/tasks/tasks.handlers.ts` | raw.githubusercontent.com | Medium-High (0.8) | Primary artifact (source code) | 2026-08-28 | Y (repo tree, Fowler) |
| `w3cj/hono-open-api-starter` — `src/db/index.ts` | raw.githubusercontent.com | Medium-High (0.8) | Primary artifact (source code) | 2026-08-28 | Y (repo tree) |
| `w3cj/hono-open-api-starter` — `src/lib/create-app.ts` | raw.githubusercontent.com | Medium-High (0.8) | Primary artifact (source code) | 2026-08-28 | Y (repo tree) |
| Martin Fowler — Repository (PoEAA catalog) | martinfowler.com | Medium-High (0.8) | Industry leader / canonical pattern catalogue | 2026-08-28 | Y (repo evidence, MS/InfoQ) |
| Martin Fowler — Yagni | martinfowler.com | Medium-High (0.8) | Industry leader | 2026-08-28 | N (canonical for the principle) |
| Martin Fowler — AnemicDomainModel | martinfowler.com | Medium-High (0.8) | Industry leader | 2026-08-28 | Y (DDD bliki) |
| Martin Fowler — DomainDrivenDesign (bliki) | martinfowler.com | Medium-High (0.8) | Industry leader | 2026-08-28 | Y (AnemicDomainModel) |
| Martin Fowler — TransactionScript (PoEAA catalog) | martinfowler.com | Medium-High (0.8) | Industry leader | 2026-08-28 | Partial (page is a stub — see Gaps) |
| Microsoft Developer Blogs archive — "Repository nightmares" | learn.microsoft.com | High (1.0) | Technical documentation (archive) | 2026-08-28 | Y (InfoQ, Fowler) |
| InfoQ — Using ORM the Wrong Way | infoq.com | Medium-High (0.8) | Industry reporting | 2026-08-28 | Y (MS archive) |
| Destroy All Software — Boundaries (SCNA 2012) | destroyallsoftware.com | Medium-High (0.8) | Primary author source (video, not fetched) | 2026-08-28 | Partial — see Gaps |
| Destroy All Software — Functional Core, Imperative Shell | destroyallsoftware.com | Medium-High (0.8) | Primary author source (paywalled screencast) | 2026-08-28 | Partial — see Gaps |
| `kbilsted/Functional-core-imperative-shell` | github.com | Medium-High (0.8) | Community restatement | 2026-08-28 | Y (DAS primary) |
| `docs/course-design-decisions.md` (local) | local repo | n/a — project of record | Requirements/constraints | 2026-08-28 | n/a |

**Reputation distribution**: High (1.0): 15 of 29 (52%) — all official framework/ORM
documentation plus two primary package artifacts. Medium-High (0.8): 13 (45%).
Project-of-record (local): 1 (3%). **Average reputation of cited external sources: 0.91.**
**Medium-trust (0.6) sources cited: zero.** **Excluded-domain sources cited: zero** — one search
surfaced `dev.to` and `medium.com` results on Hono DI; these were read for lead generation only
and every claim they made was independently re-verified against Hono's own documentation before
appearing here. No `*.blogspot.com`, `wordpress.com`, `quora.com` or `pastebin.com` content was
used.

**Bias check.** The clearest bias risk is that `hono.dev` and `orm.drizzle.team` are vendor
documentation with an interest in their own tools looking good. This is mitigated in two ways:
these are *fixed* stack decisions, so no vendor is competing for a choice here; and the two
places where vendor docs would have led me astray are called out rather than accepted — the
Workers-shaped `c.set('db')` pattern (Q1) and the OpenAPI-driven four-file route split in the
reference starter (Q6). The second risk is that the community evidence for Q2/Q6 rests
substantially on **one** repository; that is labelled Medium-High and framed as evidence of
convention, not correctness. Third, `martinfowler.com` sources are 10–20 years old, but the
freshness rules classify architecture patterns as evergreen and the specific quotes used are
definitional rather than time-sensitive.

## Knowledge Gaps

### Gap 1 (HIGHEST PRIORITY): Drizzle better-sqlite3 transaction callback — sync or async, and does rollback actually work?
**Issue**: Drizzle's transactions page is dialect-generic (`async (tx) => { await ... }`, plus a
PostgreSQL-only isolation-level section) and gives **no better-sqlite3 guidance**, while the
SQLite getting-started page shows `await db.all('select 1')` over a driver that is natively
synchronous. Whether `await` inside a better-sqlite3 transaction preserves atomicity is
therefore unresolved from documentation, and this app has exactly one place it matters
(re-triage: two writes, one fact).
**Attempted**: `orm.drizzle.team/docs/transactions`, `orm.drizzle.team/docs/get-started-sqlite`.
Neither addresses it.
**Recommendation**: Run the rollback assertion given inline in Q7c — insert a row inside a
transaction, throw, assert the row is absent. ~60 seconds. Keep it as a committed test.
**Why this is the top gap**: it is the only recommendation in this document where being wrong
produces a *silent data-integrity bug* rather than a style disagreement.

### Gap 2: Does omitting `as const` on `TRIAGE_LEVELS` silently degrade the column type?
**Issue**: I recommend `TRIAGE_LEVELS = [...] as const` feeding `text('triage_level', { enum:
TRIAGE_LEVELS })`. Drizzle documents that an **inline** array literal infers as the union. I
could not confirm that a separately-declared array *without* `as const` degrades to `string`
rather than erroring — i.e. whether the failure is loud or silent.
**Attempted**: Drizzle SQLite column-types page (documents the inline-literal case only).
**Recommendation**: One `tsc` run comparing both forms. ~60 seconds. If the degradation is
silent, add a one-line comment on the `as const` explaining why it is there — this audience will
otherwise "tidy it away".

### Gap 3: In-memory SQLite + drizzle migrator in tests
**Issue**: I recommend a fresh database per test, but did not verify the exact
`drizzle-orm/better-sqlite3/migrator` invocation against `':memory:'`, nor whether generated
migrations apply cleanly to an empty in-memory database.
**Attempted**: Drizzle SQLite getting-started (covers file-based connection only).
**Recommendation**: Write the `createTestDb()` helper first and run one trivial test through it
before writing any other test. If migrations are awkward in-memory, `pushSchema`/a temp file are
the fallbacks. Note design decision 21 already anticipates an ephemeral test database.

### Gap 4: `@hono/zod-validator` README not retrievable
**Issue**: The raw README fetch was refused by the fetching tool on content-reproduction
grounds. Mitigated by going to two better sources — the npm registry manifest (version, peer
deps, licence) and the TypeScript source (exact signature) — so the substantive questions are
answered from *stronger* evidence than the README would have been. Residual risk: any
usage caveat documented only in prose in the README.
**Recommendation**: Read `node_modules/@hono/zod-validator/README.md` after install. Zero cost.

### Gap 5: `main`-branch source vs. published 0.9.0
**Issue**: The `zValidator` signature was read from the `main` branch, which may be ahead of the
published version the project will install.
**Recommendation**: If the hook or `options.validationFunction` misbehaves, check the installed
package's `.d.ts` before debugging further.

### Gap 6: Functional-core/imperative-shell primary sources not directly verified
**Issue**: Bernhardt's "Boundaries" talk is video and the "Functional Core, Imperative Shell"
screencast is paywalled. The quotes used reach me via search-result summarisation and a
community restatement, not from the primary artifact.
**Attempted**: `destroyallsoftware.com` (both URLs identified; content not machine-readable /
[Paywalled]).
**Recommendation**: Low impact — the Q3 recommendation rests primarily on *this app's own stated
constraints* (the estimate is specified as a pure function; no test may depend on the wall
clock), not on the pattern's authority. Treat the Bernhardt citations as attribution for the
name, not as load-bearing evidence.

### Gap 7: No shell — three claims rest on documentation rather than execution
**Issue**: The brief explicitly asked for empirical verification in a scratch directory. No
shell tool was available in this session. Existence/API-shape questions were fully resolved from
primary artifacts (registry manifest, package source, official docs) and are **not** affected.
Runtime-behaviour questions (Gaps 1–3) are.
**Recommendation**: The three experiments in Gaps 1–3 total under five minutes. Given this
project's own record — two confident, well-cited conclusions already overturned by 60-second
experiments (`docs/course-design-decisions.md` §4a, §4b) — run them before writing the code, not
after.

### Gap 8: `martinfowler.com/eaaCatalog/transactionScript.html` is a stub
**Issue**: I hoped to cite Fowler's own Transaction Script vs. Domain Model complexity
threshold, since "handlers call the database directly" is essentially Transaction Script. The
catalog page is a one-paragraph teaser referring to PoEAA chapter 9.
**Attempted**: The catalog page; the DDD bliki (which says DDD *"is particularly suited to
complex domains"* but does not state the inverse threshold).
**Recommendation**: The Q2 "when does the threshold arrive" triggers are therefore **my
synthesis and are labelled Low-Medium confidence in place**. If a cited threshold is wanted,
PoEAA ch. 9 (print) is the source. Not worth blocking on.

## Conflicting Information

### Conflict 1: How the community delivers a database to Hono handlers
**Position A — per-request via context.** Hono's factory-helper documentation demonstrates
`c.set('db', drizzle(c.env.MY_DB))` inside `initApp` middleware, with `Variables: { db:
DrizzleD1Database }`.
Source: [Hono Docs — Factory Helper](https://hono.dev/docs/helpers/factory), reputation 1.0.
**Position B — module singleton.** The leading Hono+Drizzle starter creates
`const db = drizzle({ connection: {...}, schema }); export default db` and imports it directly
into handlers.
Source: [w3cj/hono-open-api-starter `src/db/index.ts`](https://raw.githubusercontent.com/w3cj/hono-open-api-starter/main/src/db/index.ts), reputation 0.8.
**Assessment**: These are not really rival opinions — they are **rival deployment targets**.
Position A is the Cloudflare Workers answer, and is *forced*: Hono's API reference defines
`Bindings` as *"Cloudflare Workers Bindings"* available via `c.env`, which on Workers means
per-request. Position B is the Node answer, and is *chosen*. Neither source is wrong; both are
wrong to copy here. A third option — the factory — dominates for **this** app because it
satisfies the injectable-clock and ephemeral-test-database constraints without mocking, which
neither A nor B does. Note the tell in Position B's own repo: it needed a separate
`createTestApp()` precisely because its singleton could not accept a test database. That is
the cost of B, visible in B's own source.

### Conflict 2: Is `await` correct inside a Drizzle better-sqlite3 transaction?
**Position A**: Drizzle's transactions page shows `db.transaction(async (tx) => { await ... })`
throughout.
Source: [Drizzle — Transactions](https://orm.drizzle.team/docs/transactions), reputation 1.0.
**Position B (implicit)**: better-sqlite3 is a synchronous driver; the Drizzle SQLite
getting-started page nonetheless shows `await db.all('select 1')`, i.e. an awaitable wrapper
over synchronous execution.
Source: [Drizzle — Get started with SQLite](https://orm.drizzle.team/docs/get-started-sqlite), reputation 1.0.
**Assessment**: Not a contradiction so much as an **unresolved silence** — the transactions page
is dialect-generic and never mentions better-sqlite3. Two equally authoritative pages from the
same vendor leave the atomicity question open. **Refusing to resolve this by reasoning is the
correct call**; it is resolvable by a one-minute experiment (Gap 1) and unresolvable by more
reading.

### Conflict 3: Repository pattern — worthwhile abstraction or double abstraction?
**Position A — pro**: Fowler catalogues Repository as isolating domain objects from data-access
details, valuable where there are *"a large number of domain classes or heavy querying"*.
Source: [Fowler — Repository](https://martinfowler.com/eaaCatalog/repository.html), reputation 0.8.
**Position B — con**: it abstracts over an abstraction, hides ORM capabilities so they leak out
anyway, and delivers little testing value because the logic lives in the queries a mocked
repository never runs.
Sources: [MS Developer Blogs archive — Repository nightmares](https://learn.microsoft.com/en-us/archive/blogs/cdndevs/repository-nightmares) (1.0), [InfoQ — Using ORM the Wrong Way](https://www.infoq.com/news/2014/09/using-orm-wrong-way) (0.8).
**Assessment**: **The conflict dissolves at this app's size, and both sides agree there.**
Position A is conditional on a precondition that 2 tables and 5 endpoints plainly do not meet;
Position B is strongest exactly in the small-app case. Fowler is the more authoritative source
and his own stated condition rules the pattern out here — which is why this document's Q2
answer is "no repository" with **high** confidence rather than as a contested judgement call.
Temporal caveat noted: the Position B sources date from ~2014 and an archived blog; the
arguments are evergreen but neither is recent, and the confidence rests on Fowler's condition,
not on them.

### Conflict 4: The reference starter's four-file-per-feature split
Not a conflict between sources, but between a source and its own rationale, and worth recording
because it is the most likely thing to be copied without its reason. `w3cj/hono-open-api-starter`
splits every feature into `.routes.ts` / `.handlers.ts` / `.index.ts` / `.test.ts`. That split is
required by `@hono/zod-openapi`, which needs route *definitions* declared separately from
implementations so an OpenAPI spec can be generated. **This app generates no OpenAPI spec.**
Adopting the split without the constraint that produces it would be textbook cargo-culting — and
would sit oddly beside Hono's own Best Practices advice to write handlers inline for type
inference.

## Recommendations for Further Research

1. **Run the three experiments (Gaps 1–3) before writing the backend.** Total cost under five
   minutes; one of them (transaction rollback) guards against a silent data-integrity bug. This
   project has now had *three* confident research conclusions redirected by cheap experiments —
   treat "check it" as the default rather than the exception.
2. **Add a gate that enforces the one architectural rule.** A three-line check that `domain/`
   contains no non-type imports turns the structure from a convention into an enforced
   invariant, and makes the app itself an example of the course's own thesis (process encoded as
   a tool). It also fails in the ~77% name-error repair band rather than the ~45% assertion band.
3. **Write the README's "what we deliberately did not build" section.** For an audience that
   imitates what it reads, the *rejected* list (repository, service layer, DI container, Result
   types, `testClient`-driven chaining) is at least as instructive as the code — and it
   pre-empts the "is this app just sloppy?" reading of an intentionally thin design.
4. **SQLite `ALTER TABLE` limits and Drizzle migrations** (already flagged as open in
   `docs/course-design-decisions.md` §5). This directly shapes the cycle-3 rule-amendment
   exercise, which is the one place students will change the schema.
5. **Re-verify Hono/Drizzle API details at build time.** Framework sources carry a 1-year
   freshness window. `@hono/zod-validator` is at 0.9.0 (pre-1.0), so its API is not yet under a
   stability guarantee — pin it exactly, per the failsafe-setup constraint.

## Full Citations

[1] Hono. "Context". Hono Documentation. https://hono.dev/docs/api/context. Accessed 2026-08-28.
[2] Hono. "Best Practices". Hono Documentation. https://hono.dev/docs/guides/best-practices. Accessed 2026-08-28.
[3] Hono. "Testing". Hono Documentation. https://hono.dev/docs/guides/testing. Accessed 2026-08-28.
[4] Hono. "Testing Helper". Hono Documentation. https://hono.dev/docs/helpers/testing. Accessed 2026-08-28.
[5] Hono. "Validation". Hono Documentation. https://hono.dev/docs/guides/validation. Accessed 2026-08-28.
[6] Hono. "Exception". Hono Documentation. https://hono.dev/docs/api/exception. Accessed 2026-08-28.
[7] Hono. "Factory Helper". Hono Documentation. https://hono.dev/docs/helpers/factory. Accessed 2026-08-28.
[8] Hono. "App - Hono". Hono Documentation. https://hono.dev/docs/api/hono. Accessed 2026-08-28.
[9] Hono. "Node.js". Hono Documentation. https://hono.dev/docs/getting-started/nodejs. Accessed 2026-08-28.
[10] Drizzle Team. "Goodies". Drizzle ORM Documentation. https://orm.drizzle.team/docs/goodies. Accessed 2026-08-28.
[11] Drizzle Team. "SQLite column types". Drizzle ORM Documentation. https://orm.drizzle.team/docs/column-types/sqlite. Accessed 2026-08-28.
[12] Drizzle Team. "Transactions". Drizzle ORM Documentation. https://orm.drizzle.team/docs/transactions. Accessed 2026-08-28.
[13] Drizzle Team. "Get Started with SQLite". Drizzle ORM Documentation. https://orm.drizzle.team/docs/get-started-sqlite. Accessed 2026-08-28.
[14] npm. "@hono/zod-validator — package manifest, version 0.9.0". npm registry. https://registry.npmjs.org/@hono/zod-validator/latest. Accessed 2026-08-28.
[15] Hono contributors. "zod-validator/src/index.ts". honojs/middleware, branch `main`. https://raw.githubusercontent.com/honojs/middleware/main/packages/zod-validator/src/index.ts. Accessed 2026-08-28.
[16] CJ Reynolds (w3cj). "hono-open-api-starter — repository tree". GitHub API. https://api.github.com/repos/w3cj/hono-open-api-starter/git/trees/main?recursive=1. Accessed 2026-08-28.
[17] CJ Reynolds (w3cj). "src/routes/tasks/tasks.handlers.ts". hono-open-api-starter. https://raw.githubusercontent.com/w3cj/hono-open-api-starter/main/src/routes/tasks/tasks.handlers.ts. Accessed 2026-08-28.
[18] CJ Reynolds (w3cj). "src/db/index.ts". hono-open-api-starter. https://raw.githubusercontent.com/w3cj/hono-open-api-starter/main/src/db/index.ts. Accessed 2026-08-28.
[19] CJ Reynolds (w3cj). "src/lib/create-app.ts". hono-open-api-starter. https://raw.githubusercontent.com/w3cj/hono-open-api-starter/main/src/lib/create-app.ts. Accessed 2026-08-28.
[20] Fowler, Martin. "Repository". Catalog of Patterns of Enterprise Application Architecture. https://martinfowler.com/eaaCatalog/repository.html. Accessed 2026-08-28. [Concept evergreen per freshness rules]
[21] Fowler, Martin. "Yagni". martinfowler.com. 2015-05-26. https://martinfowler.com/bliki/Yagni.html. Accessed 2026-08-28. [Concept evergreen]
[22] Fowler, Martin. "AnemicDomainModel". martinfowler.com. 2003-11-25. https://martinfowler.com/bliki/AnemicDomainModel.html. Accessed 2026-08-28. [Concept evergreen]
[23] Fowler, Martin. "DomainDrivenDesign". martinfowler.com. https://martinfowler.com/bliki/DomainDrivenDesign.html. Accessed 2026-08-28. [Concept evergreen]
[24] Fowler, Martin. "Transaction Script". Catalog of PoEAA. https://martinfowler.com/eaaCatalog/transactionScript.html. Accessed 2026-08-28. [Stub page — see Knowledge Gap 8]
[25] Microsoft Developer Blogs (archive). "Repository nightmares". https://learn.microsoft.com/en-us/archive/blogs/cdndevs/repository-nightmares. Accessed 2026-08-28. [Archived; arguments evergreen, recency not confirmable]
[26] InfoQ. "Using ORM the Wrong Way". 2014-09. https://www.infoq.com/news/2014/09/using-orm-wrong-way. Accessed 2026-08-28. [Published 2014; arguments evergreen]
[27] Bernhardt, Gary. "Boundaries" (SCNA 2012). Destroy All Software. https://www.destroyallsoftware.com/talks/boundaries. Accessed 2026-08-28. [Video; not directly verified — Knowledge Gap 6]
[28] Bernhardt, Gary. "Functional Core, Imperative Shell". Destroy All Software screencasts. https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell. Accessed 2026-08-28. [Paywalled — Knowledge Gap 6]
[29] Bilsted, Kasper B. "Functional-core-imperative-shell". GitHub. https://github.com/kbilsted/Functional-core-imperative-shell. Accessed 2026-08-28.
[30] Storm, Arne Henrik. "Kurs produktutvikling — design decisions". Local repository, `docs/course-design-decisions.md`. 2026-08-27. [Project of record]

## Research Metadata

**Duration**: ~1 session (approx. 25 tool calls) | **Sources examined**: 30 |
**Sources cited**: 29 external + 1 local project-of-record |
**Cross-references performed**: 14 |
**Confidence distribution**: High 70% (Q1 mechanism, Q4, Q5, Q7a, Q7b, Q8 — all resting on
official documentation or primary package artifacts), Medium 22% (Q2 and Q6 community-convention
evidence from a single repository; Q3 pattern attribution), Low 8% (the Q2 "threshold triggers",
explicitly labelled as synthesis).
**Rejected sources**: 3 (`dev.to`, `medium.com` and a personal-blog result surfaced by one
search on Hono DI — used for lead generation only; every claim re-verified against Hono's own
documentation before use, and none cited).
**Tool failures**: 2 — (a) `raw.githubusercontent.com` README for `@hono/zod-validator` refused
by the fetching tool on content-reproduction grounds, worked around via the npm registry
manifest and the package's TypeScript source, which are stronger evidence; (b)
`npmjs.com/package/@hono/zod-validator` returned HTTP 403, worked around via
`registry.npmjs.org`. Neither degraded a conclusion.
**Capability limitation**: No shell tool available; the brief's requested scratch-directory
experiments could not be run. Compensated with primary-artifact retrieval for all
existence/API-shape questions; the three runtime-behaviour questions are isolated in Knowledge
Gaps 1–3 with the exact experiments to run, and are not presented as settled.
**Blind-study compliance**: `docs/superpowers/plans/2026-08-28-app-baseline.md` was never read,
opened, globbed or grepped. Confirmed.
**Output**: `docs/research/tooling/backend-patterns-independent-research.md`
