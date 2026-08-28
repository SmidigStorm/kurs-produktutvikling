# Research: Simplest Defensible Code Patterns for a Small Hono + Drizzle + React Teaching Application

**Date**: 2026-08-28 | **Researcher**: nw-researcher (Nova) | **Confidence**: High | **Sources**: 19 (12 official framework docs, 4 primary source artefacts read from disk, 3 industry/community)

**Subject**: `docs/superpowers/plans/2026-08-28-app-baseline.md`, validated against
`docs/course-design-decisions.md`.

## Executive Summary

**The plan is defensible as written, and the likely failure mode the brief worried about —
over-engineering — has largely been avoided already.** Nine of thirteen evaluated decisions are
keeps. The two most dangerous cargo-cult patterns for a 500-line app, a repository/service layer
and a DI container, are both absent, and Hono's own Best Practices guide argues explicitly for
the plan's choices on both counts ("Avoid Rails-Like Controllers", define handlers inline). The
factory-function DI is the right call for a specific, demonstrable reason: it is the only thing
that lets each integration test own its own database, and a senior reviewer can see that working
two files away. The pure `domain/queue.ts` module earns its place three times over — it is the
fast test layer, it is the literal encoding of the locked "estimate is a defined function"
constraint, and the three folders `domain/`/`db/`/`api/` map one-to-one onto the course's own
three test layers, so the directory tree doubles as the gate table.

**Three changes are worth making, and they are small.** First, `text('level', { enum:
TRIAGE_LEVELS })` instead of bare `text` plus an `as TriageLevel` cast: verified against
`drizzle-orm@0.45.2`'s own type declarations, this infers the exact union and emits **identical
SQL**, and it closes a hole punched through the very type-safety argument decision 30 used to
justify choosing Drizzle at all. Second, `@hono/zod-validator` instead of `safeParse` — Hono's
docs say verbatim "We recommend using a third-party validator", it costs one line per route
instead of three, and it fixes a genuine bug: `await c.req.json()` sits outside any `try`, so
four routes currently return **500** for a malformed body where Hono's own validator returns
**400** (verified by reading the shipped `validator.js`). Third, `createDb(':memory:')` in the
Vitest suite instead of `mkdtempSync` + `rmSync`: the SQLite connection is never closed, so the
cleanup will raise `EBUSY` on Windows — and §4a of the design document lists Windows prebuilds
among the reasons this stack is safe for student laptops.

**Two widely-recommended patterns are correctly rejected, and saying so plainly is one of this
document's more useful outputs.** TanStack Query is what most senior React developers reach for,
React's own documentation recommends it by name, and it is still the wrong choice here: three of
React's four stated downsides of fetch-in-Effect do not apply (no SSR to degrade, no waterfalls,
and caching is actively *unwanted* at a 15-second poll), it would make `StaffView` harder rather
than easier, and the plan's `cancelled` flag is already the documented `ignore` pattern
implemented correctly. Hono's typed RPC client is a real selling point that costs, in this
repository, matching tsconfigs, `@types/node` in a *browser* package, an `exports` map the
backend does not have, and the project references and pre-compiled client Hono's own docs
recommend — a build-order constraint in a repo whose Global Constraints say gates stay unwired,
to delete seventeen lines of types. Both calls are genuinely close and the document records the
counter-arguments rather than hiding them. The remaining findings are code-level: a stale-data
bug when `PatientView` navigates, silently swallowed API errors in `StaffView`, a missing
`app.onError`, unlabelled forms, step definitions sitting inside the product person's directory,
and a `getByTestId`/`aiFix` conflict where the plan enables an AI prompt that instructs the model
to "strictly rely on the ARIA snapshot" while hiding every assertion target from that snapshot.

## Research Methodology

**Search Strategy**: Official framework documentation first, in the order the brief specified —
hono.dev, react.dev, orm.drizzle.team, tanstack.com, cucumber.io,
vitalets.github.io/playwright-bdd. Where documentation was ambiguous or where the brief asked a
question documentation cannot answer ("does this actually work?"), **primary source artefacts
were read directly from disk**: `hono@4.12.18` and `drizzle-orm@0.45.2` — the exact minor pinned
by the plan — were located in existing `node_modules` trees on this machine and their shipped
`.d.ts` and `.js` files read. Community sources (honojs GitHub issues) were used only to
corroborate a claim already established from official docs.

**Source Selection**: Types: official framework documentation (12), primary source code (4),
industry/community (3). Reputation: High for all framework docs and source artefacts;
Medium-High for github.com and martinfowler.com; Medium for destroyallsoftware.com (cited once,
as the origin of a term, with the underlying idea cross-referenced to Fowler). No excluded-domain
source was used. No source required adversarial-content sanitisation; one WebFetch (docsify SPA)
returned no content and was routed around via raw GitHub markdown.

**Quality Standards**: Every "change" verdict is backed by either an official recommendation or
a primary source artefact, and in four cases by both. Every "keep" verdict states the
counter-argument. Claims that could not be executed are explicitly marked — see Knowledge Gap 1,
which is material given this project's stated track record of overturning confident conclusions
with 60-second experiments.

## The Test Applied to Every Pattern

For each pattern, two questions:

1. Would a senior developer object to its **absence**?
2. Would a senior developer object to its **presence** at this size (~500 lines, pre-built,
   never extended by students)?

A pattern earns its place only if (1) is yes and (2) is no.

## Verdict Table

**Headline: the plan is in good shape.** Nine of thirteen decisions are keeps, and the two
biggest over-engineering traps (a repository layer, a DI container) were already avoided. The
changes that matter are three small, concrete ones — a Drizzle enum, `zValidator`, and
`:memory:` test databases — not an architectural rethink.

| # | Decision | Verdict | Reason | Replacement |
|---|---|---|---|---|
| 1 | DI by factory `createApp({db, clock, allowTestRoutes})` | **Keep** | Hono's `Variables`/`c.set` is documented as *request-scoped*; a db handle and a clock are process-scoped. The factory is a closure, not a framework, and it is the sole reason the integration tests can own their database. | — |
| 2 | Direct Drizzle in handlers, no repository/service | **Keep** | Hono's own Best Practices tell you to avoid the controller indirection. Fowler's repository triggers (many entity types, complex queries, swappable source) are all absent at 2 tables / 5 routes. Best practice at scale, overkill here. | Add one README sentence saying it is a choice. |
| 3 | Pure `domain/queue.ts` (functional core) | **Keep** | It is the only reason the fast unit layer exists, and it is the literal encoding of the locked constraint "the estimate is a defined function, not a prediction". One module, three functions, no classes. | Teach it as "the rule is a function so the test can name it", not as a pattern name. |
| 4 | Hand-rolled `useEffect` + `setInterval` vs TanStack Query | **Toss-up → keep hand-rolled** | React's own `ignore`-flag pattern; the plan implements it correctly. 3 of React's 4 stated downsides don't apply (no SSR, no waterfalls, caching is *unwanted* at a 15s poll). TanStack would make `StaffView` harder, not easier. But it is a defensible call either way. | Two mandatory fixes: `setVisit(null)` on effect entry; check `response.ok` in `StaffView.post`. |
| 5 | Duplicated types vs Hono RPC (`hc`) | **Keep duplication** | RPC needs matching tsconfigs, `@types/node` in the *frontend*, `exports` in `backend/package.json`, and Hono's own docs recommend project references + a pre-compiled client. Deletes 17 lines; costs a build-order constraint in a repo whose constraint is "gates stay unwired". Corroborated by recurring monorepo inference issues in honojs/hono. | Add a 3-line contract test pinning the response keys. |
| 6 | `safeParse` + manual 400 vs `@hono/zod-validator` | **CHANGE** | Hono's docs say verbatim "We recommend using a third-party validator" and name this one. 1 line/route instead of 3. **And it fixes a bug**: `await c.req.json()` outside a try makes a malformed body a 500; `zValidator` returns 400. | Full diff in Decision 6. `@hono/zod-validator@0.9.0`, peers already satisfied. |
| 7 | Layer folders `domain/ db/ api/` vs feature folders | **Keep** | One feature — a `queue/` folder would name nothing. The three folders map 1:1 onto the three test layers, so the tree *is* the gate table. No `services/`, `ports/` or `adapters/`. | — |
| 8 | Error handling: exceptions, not Result types | **Keep, but ADD `onError`** | `HTTPException` + `app.onError` is the documented Hono idiom, and `hono/validator` throws `HTTPException` internally — Result types would fight the framework. But the plan has **no `onError`**, so an unexpected throw logs nothing. | 5-line `app.onError` with `console.error(err)`. |
| 9 | `level`/`status` as bare `text` + cast | **CHANGE** | `text('level', { enum: TRIAGE_LEVELS })` infers the exact union (verified in `drizzle-orm@0.45.2` source) and emits **identical SQL**. The `as TriageLevel` cast punches a hole through the exact type-safety argument decision 30 used to choose Drizzle. | `text('level', { enum: TRIAGE_LEVELS })`; delete both casts. Diff in "Drizzle specifics (a)". |
| 10 | `$inferSelect` / `$inferInsert` | **Toss-up → leave out** | Present in 0.45.2, but nothing currently passes a *row* across a function boundary — `waitingVisits` correctly returns a domain type. A name with no user. | Reach for it the moment a row is passed around. |
| 11 | Transactions | **Toss-up → add two** | Not needed for correctness (better-sqlite3 is sync, single connection, no `await` between writes) but re-triage writes two tables and the aging amendment reads the second. Cheap and true. | `db.transaction((tx) => {…})` — **no `await`**; the sync signature differs from Drizzle's published async examples. |
| 12 | Vitest: temp SQLite file per test | **CHANGE to `:memory:`** | Removes `mkdtemp`/`rmSync`, unifies two inconsistent idioms, and fixes a real cross-platform failure: the connection is never closed, so `rmSync` raises `EBUSY` on Windows — and §4a lists Windows prebuilds as a reason the stack is student-safe. | `createDb(':memory:')` in `beforeEach`; move the module-scope `clock` into `beforeEach` too. E2E suite keeps its file. |
| 13 | `app.request()` for API tests; small local test helpers | **Keep** | `app.request()` is verbatim Hono's documented way to test without a server. `at()`/`visit()`/`arrive()` are 3-line arrows — a `VisitBuilder` class would fail question 2. | — |

**Also recommended, from the "worth covering" list:**

| Item | Verdict | Replacement |
|---|---|---|
| Step definitions live in `features/steps/` | **Change** | Move to a sibling `steps/` — developer TypeScript currently sits inside the directory the Global Constraints assign to the product person. One line of `defineBddConfig`. |
| `Given the clinic queue is empty` marks everyone DONE via N+1 HTTP calls | **Change** | `POST /api/test/reset` behind the existing `allowTestRoutes` flag. Makes scenarios independent instead of cleaned-up-by-their-successor. |
| Gherkin style (declarative, domain language) | **Keep — and say so** | Better than playwright-bdd's own `examples/ai`, which §4c already flagged as imperative. |
| `getByTestId` assertions with `aiFix` enabled | **Change or consciously accept** | `data-testid` does not appear in the ARIA snapshot the `aiFix` prompt tells the model to "strictly rely on". Enabling `aiFix` and hiding the targets from it is the one indefensible combination. |
| Forms use `aria-label`, no visible `<label>` | **Change** | `<label htmlFor>` — the form currently has no visible text saying what the input is for. |
| `App.tsx` hash router via `useEffect` not `useSyncExternalStore` | **Keep** | The "correct" answer would be the most over-engineered thing in the repo. Note the choice in the README so it reads as deliberate. |
| No error boundary | **Keep** | Correctly absent at two views. |
| Keys, effect dependencies, cleanup, `StrictMode` | **Keep** | All correct as written. Listed because not-changing them is also a finding. |

## Findings

Each finding states evidence first, then verdict, then the two-question test.

### Decision 1: Dependency injection by factory function

**Verdict: KEEP.**

**Evidence A — Hono officially discourages the controller indirection that a DI container
would exist to serve.** From Hono's Best Practices guide: the docs advise against creating
separate "Rails-like controller" files, because "path parameters cannot be reliably inferred
without complex generics", and recommend defining handlers inline with route declarations:

```ts
app.get('/books/:id', (c) => {
  const id = c.req.param('id') // Type inference works
  return c.json(`get ${id}`)
})
```
**Source**: [Hono — Best Practices](https://hono.dev/docs/guides/best-practices) — Accessed 2026-08-28. Reputation: High (official).

**Evidence B — Hono's own DI-shaped answer is `c.set`/`c.get` with a typed `Variables`
generic, and it is explicitly request-scoped.** From the Context docs: "Get and set arbitrary
key-value pairs, with a lifetime of the current request", and "The value of `c.set` / `c.get`
are retained only within the same request. They cannot be shared or persisted across different
requests."

```ts
type Variables = { message: string }
const app = new Hono<{ Variables: Variables }>()
```
**Source**: [Hono — Context](https://hono.dev/docs/api/context) — Accessed 2026-08-28. Reputation: High (official).

**Analysis (interpretation, labelled as such).** The `Variables` mechanism is designed for
values that *differ per request* — an authenticated user, a request id, a per-request
transaction. A SQLite handle and a clock are process-lifetime singletons in this app; they do
not vary per request. Putting them in `Variables` means:

- writing a middleware whose only job is `c.set('db', db)` — pure ceremony;
- every handler reads `c.var.db` instead of closing over `deps.db`, so the dependency is
  invisible at the top of the file and visible only at each use site;
- the `Hono<{ Variables: … }>` generic must be threaded through every `app.route()` split.

That is strictly more machinery than `createApp({ db, clock })` for zero benefit here. It
becomes right the moment a dependency genuinely varies per request.

**Applying the two questions:**

1. *Would a senior developer object to its absence?* Yes — the alternative is module-level
   singletons (`export const db = createDb(process.env.DB_FILE)`), which would make
   `backend/src/api/app.test.ts`'s temp-file-per-test pattern impossible without module
   mocking. The plan's integration tests are only clean *because* of the factory. That is a
   strong, concrete justification a reader can see working two files away.
2. *Would a senior developer object to its presence?* No. `createApp(deps)` is a closure, not
   a framework. It adds one function signature and no concepts. It is the smallest thing that
   makes the tests honest.

**A DI container would fail question 2 loudly.** `tsyringe`/`inversify`-style registration in a
500-line app is the canonical cargo-cult smell, and it would also require decorators and
`reflect-metadata` — extra tsconfig flags on a student machine, against the failsafe-setup
constraint.

**Note on `createFactory`.** Hono ships `createFactory()`/`factory.createHandlers()` from
`hono/factory` for exactly the "I want controller-style organisation" case. It is *not* a DI
container and is not needed here — the plan needs dependency injection, not handler
composition. Mentioning it and not using it is the correct outcome.

**Confidence**: High (two official Hono pages plus the plan's own test file as direct evidence).

---

### Decision 2: Direct Drizzle calls in route handlers

**Verdict: KEEP — and it is not a close call, because Hono's own documentation argues for it.**

**Evidence A — the framework's official position.** Hono Best Practices: "Avoid Rails-Like
Controllers… define handlers inline with route declarations." The stated reason is technical,
not stylistic (type inference of path params breaks across the indirection).
**Source**: [Hono — Best Practices](https://hono.dev/docs/guides/best-practices) — Accessed 2026-08-28. Reputation: High (official).

**Evidence B — the canonical statement of when a repository *does* earn its place.** Fowler's
*Repository* definition (P of EAA): a Repository "mediates between the domain and data mapping
layers, acting like an in-memory collection of domain objects… Client objects construct query
specifications declaratively and submit them to Repository for satisfaction." The stated
motivation is a *large number of domain object types* and *complex queries*, and the ability to
"replace with a dummy implementation for testing".
**Source**: [Martin Fowler — Repository (P of EAA catalog)](https://martinfowler.com/eaaCatalog/repository.html) — Accessed 2026-08-28. Reputation: Medium-High (industry leader, primary source for the pattern).

**Where the line actually is — the three triggers, applied to this app:**

| Trigger for a repository/service layer | Present here? |
|---|---|
| The same query is written in more than ~2 places | **Partly.** `waitingVisits(db)` already exists as a module-private helper — the plan *has* extracted the one duplicated query, at function scope rather than class scope. Correct call. |
| You need to swap the data source in tests | **No.** Tests use a real SQLite file in a temp dir. Because SQLite is in-process, faking the DB buys nothing and costs fidelity. |
| A single request touches several tables under one invariant | **Yes, once** — `POST /api/visits/:id/triage` writes `visits` and `triage_events`. See the transaction finding below; that argues for `db.transaction()`, not for a repository. |
| >~10 entities, or query complexity that swamps the handler | **No.** Two tables, five routes. |

**Applying the two questions:**

1. *Absence objectionable?* No. Five handlers of 5–15 lines each, each doing one obvious thing.
   A reviewer reading `app.get('/api/queue', …)` sees the whole behaviour in one screen.
2. *Presence objectionable?* **Yes, strongly.** A `VisitRepository` wrapping five one-line
   Drizzle calls is a pass-through layer. In a course whose explicit subject is *restraint in
   primitive selection* (§3b of the decisions doc: "when not to reach for one at all"), shipping
   a pointless abstraction in the baseline app would actively contradict the curriculum.

**This is the "best practice at scale, overkill here" case.** Say it in the README if the
concern is that a reader will assume ignorance rather than choice: one sentence — *"Drizzle
calls sit directly in handlers. At two tables and five routes a repository layer would be
pure indirection; the one query used twice is extracted as a plain function."* That sentence
costs nothing and converts a possible wince into a nod.

**Confidence**: High.

### Decision 3: Pure domain functions in a separate module

**Verdict: KEEP.** This is the single most defensible structural choice in the plan.

**Evidence A — it is the only reason the fast test layer can exist at all.** The plan's
`domain/queue.test.ts` runs `orderQueue`, `positionOf` and `estimatedWaitMinutes` with plain
array literals — no temp directory, no migration, no HTTP. Compare `db/client.test.ts` and
`api/app.test.ts`, both of which need `mkdtempSync` + `applyMigrations` + `rmSync`. The pure
module is what makes decision 22's "three test layers" a real ladder rather than one layer
wearing three hats.
**Source**: the plan itself, `docs/superpowers/plans/2026-08-28-app-baseline.md` Tasks 2–3 vs Tasks 5, 7.

**Evidence B — it is the mechanism that satisfies a locked, non-negotiable course constraint.**
`docs/course-design-decisions.md` §3a constraint 1: "The wait estimate is a defined function,
not a prediction… `estimate = (patients ahead) × (average consultation minutes for their
level)`, with the averages as constants." A function with no I/O and no clock read is the
literal encoding of "defined, not predicted". If `estimatedWaitMinutes` took a `Db`, the claim
would be unverifiable by inspection.

**Evidence C — the gate-catalogue argument the course already accepted.** §4 of the decisions
document cites measured agent repair rates: name errors ~77%, assertion errors ~45%. A failing
unit test on `estimatedWaitMinutes` names the function and shows `expected 45, received 30`;
the same defect surfacing through `GET /api/queue` is a degenerate assertion error. Separating
the calculation from the I/O is what moves the failure into the higher band.

**Evidence D — the framing has a canonical name.** "Functional core, imperative shell" (Gary
Bernhardt, *Boundaries*, 2012): push decisions into pure functions and keep I/O in a thin
outer layer, so the interesting logic is testable without test doubles.
**Source**: [Gary Bernhardt — Boundaries](https://www.destroyallsoftware.com/talks/boundaries) — Accessed 2026-08-28. Reputation: Medium (personal site, but the primary source for the term; the underlying idea is uncontroversial and long-standing — cf. Fowler's separation of Domain Model from Data Source layers, [P of EAA](https://martinfowler.com/eaaCatalog/domainModel.html)).

**Applying the two questions:**

1. *Absence objectionable?* Yes. Inlining the sort and the reduce into the `/api/queue` handler
   would make the queue invariant — the one rule the whole course is about — invisible, and
   would delete the fast test layer.
2. *Presence objectionable?* No. It is **one file with three exported functions and no
   classes, no interfaces, no injection**. It is not a "layer"; it is a module. Nobody winces
   at a module.

**On the framing for the classroom.** Teach it as *"the rule is a function, so the test can name
it"* rather than as *"functional core, imperative shell"*. The pattern name buys nothing for a
mixed room and invites the cargo-culting the brief warns about; the operational sentence buys
everything. Put the term in the README as a pointer for the curious, not in the code comments.

**One real caveat, worth a line in the code.** `orderQueue` is called three times per
`/api/queue` request in the current handler (once directly, then once inside `positionOf` /
`estimatedWaitMinutes` per entry — so it is O(n² log n) overall). At five patients this is
irrelevant and the clarity is worth it, but see the code-quality notes below: the handler also
does a redundant `waiting.find()` per entry that can simply be deleted.

**Confidence**: High.

---

### Decision 4: Hand-rolled `useEffect` + `setInterval` vs TanStack Query

**Verdict: KEEP the hand-rolled version — but this is the closest call of the six, and the
current code has two real defects that must be fixed either way.**

#### First: is the `cancelled` flag current React guidance, and is it correct as written?

**Yes to both.** React's official `useEffect` reference documents exactly this pattern, using
the name `ignore`:

```js
useEffect(() => {
  let ignore = false;
  setBio(null);
  fetchBio(person).then(result => {
    if (!ignore) {
      setBio(result);
    }
  });
  return () => {
    ignore = true;
  };
}, [person]);
```

> "Note the `ignore` variable which is initialized to `false`, and is set to `true` during
> cleanup. This ensures your code doesn't suffer from 'race conditions': network responses may
> arrive in a different order than you sent them."
> "You can also rewrite using the `async` / `await` syntax, but you still need to provide a
> cleanup function."

**Source**: [React — `useEffect`, "Fetching data with Effects"](https://react.dev/reference/react/useEffect) — Accessed 2026-08-28. Reputation: High (official).

So the plan's `cancelled` flag is the documented pattern, spelled with a different variable
name, and the `async/await` rewrite is explicitly sanctioned. **It is also correct as written**:
`cancelled` is set and `clearInterval` is called in the same cleanup, so both the in-flight
request and the timer are torn down together, and `load` closes over the current `visitId`
(recreated per effect run) so there is no stale-closure bug.

**But it differs from the React example in one way that is a genuine bug.** The React example
calls `setBio(null)` at the *top* of the effect. The plan does not reset `visit`. Consequence:
when `visitId` changes (the app is hash-routed, so this happens on navigation), `PatientView`
keeps rendering the **previous patient's name, level, position and estimate** until the new
request resolves. In a clinic-queue demo, showing patient A's data under patient B's URL is
exactly the kind of thing a senior reviewer flags — and it is a one-line fix.

#### Second: TanStack Query or not?

**React's own docs list four downsides of fetching in Effects.** Verbatim:

- "**Effects don't run on the server.**"
- "**Fetching directly in Effects makes it easy to create 'network waterfalls'.**"
- "**Fetching directly in Effects usually means you don't preload or cache data.**"
- "**It's not very ergonomic.** There's quite a bit of boilerplate code involved…"

…and recommends: "consider using or building a client-side cache. Popular open source
solutions include TanStack Query, useSWR, and React Router 6.4+."
**Source**: [React — `useEffect`](https://react.dev/reference/react/useEffect) — Accessed 2026-08-28. Reputation: High (official).

**Three of the four downsides do not apply to this app, and one of them is inverted:**

| React's downside | Applies here? |
|---|---|
| No SSR | **No.** Client-only Vite SPA by decision; there is no server render to degrade. |
| Network waterfalls | **No.** One request per view, no nested fetching components. |
| No preload or cache | **Inverted.** The product requirement is a **15-second poll**; the *point* is that the data is refetched, not cached. TanStack's `staleTime: 0` default plus `refetchInterval` reproduces what the plan already has. Caching is not a benefit here, it is a thing to configure off. |
| Not ergonomic / boilerplate | **Yes — this one is entirely real.** |

**The honest cost/benefit, counted concretely.**

TanStack Query would replace the whole 22-line effect with:

```tsx
const { data: visit, error } = useQuery({
  queryKey: ['visit', visitId],
  queryFn: () => fetchVisit(visitId),
  refetchInterval: 15_000,
});
```

Four lines, and the stale-data-on-navigation bug above disappears for free (a new `queryKey`
means new data). That is a genuine win.

What it costs:
1. A dependency, `@tanstack/react-query`, plus a `QueryClient` and a `QueryClientProvider` in
   `main.tsx`. **Source**: [TanStack Query — Quick Start](https://tanstack.com/query/latest/docs/framework/react/quick-start) — Accessed 2026-08-28. Reputation: High (official).
2. Concepts a mixed room must absorb: query keys, staleness, invalidation.
3. **`StaffView` gets *harder*, not easier.** Its current shape is `await post(...); await
   reload()`. The idiomatic TanStack version is `useMutation` + `queryClient.invalidateQueries({
   queryKey: ['queue'] })` — a second hook, a second concept, and a `useQueryClient()` call.
   For four write actions that is more surface, not less.
4. Behavioural defaults that interact with the BDD suite. TanStack Query defaults to
   `refetchOnWindowFocus: true` and `refetchOnMount: true`. Those are *safe* (an extra refetch
   can only make the view fresher), but they are extra non-obvious network activity in a suite
   whose whole selling point in this repo is determinism. Not a blocker; a thing you would have
   to reason about and probably configure.

**Applying the two questions:**

1. *Absence objectionable?* **Weakly.** A senior React developer would reach for TanStack Query
   by reflex at almost any real size. At **two components and two queries**, with a correct
   `ignore`-flag effect straight out of the React docs, they would read it, recognise the
   documented pattern, and move on. They would object if the count were ten components.
2. *Presence objectionable?* **Mildly, yes.** A `QueryClientProvider` wrapping an app with two
   queries, in a repo whose stated curriculum (§3b) is *"when not to reach for a primitive at
   all"*, is the same shape of mistake as a repository layer — just a much more forgivable one,
   because the library genuinely is the industry default.

**Recommendation: keep hand-rolled, and make the choice legible.** The deciding argument is not
React's, it is the course's: the frontend is not the subject, every dependency is a pre-class
setup failure mode (decision 25 / the failsafe-setup constraint), and the polling loop is
itself teaching material for §3a constraint 2 ("how do you test time?" is worth a slide).
A hand-rolled loop that a student can read end to end serves that better than a library that
hides it.

**But fix these two things first — both are wince-level, not preference-level:**

```diff
   useEffect(() => {
     let cancelled = false;
+    setVisit(null);   // otherwise the previous patient's data stays on screen
+                      // while the new one loads. React's own example does this.
 
     const load = async () => {
```

and in `StaffView`, `reload()` has no error path at all — `void reload()` inside `setInterval`
means an unhandled promise rejection every 15 seconds if the backend is down, and `post()`
never checks `response.ok`, so a 400 from the API is silently swallowed:

```diff
-  const post = async (path: string, body: unknown) => {
-    await fetch(path, {
+  const post = async (path: string, body: unknown) => {
+    const response = await fetch(path, {
       method: 'POST',
       headers: { 'content-type': 'application/json' },
       body: JSON.stringify(body),
     });
+    if (!response.ok) {
+      setError(`${path} failed: ${response.status}`);
+      return;
+    }
     await reload();
   };
```

**This is where a senior reviewer's eye actually lands.** The `useEffect`-vs-TanStack question
is a defensible judgement call either way; a silently-swallowed 400 is not.

**Confidence**: High on the React-docs facts; the verdict itself is an interpretation, and the
document records it as the toss-up it is.

### Decision 5: Manually duplicated types vs Hono's typed RPC client (`hc`)

**Verdict: KEEP the duplicated types.** RPC is a genuine Hono selling point and it is the wrong
tool *for this repository*, for reasons that are specific and checkable rather than
aesthetic.

**Evidence A — what Hono itself says the setup requires.** From the RPC guide:

- Export the app type: `export type AppType = typeof app`, then `const client =
  hc<AppType>('http://localhost:8787/')`.
- "For the RPC types to work properly in a monorepo, in both the Client's and Server's
  `tsconfig.json` files, set `"strict": true` in compilerOptions."
- On IDE performance: "This is a type instantiation for a single route… if you have a lot of
  routes, this can slow down your IDE significantly", with the recommended mitigation being to
  **pre-compile the client** —

```ts
export type Client = ReturnType<typeof hc<typeof app>>
export const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<typeof app>(...args)
```

- "In monorepo setups, ensure both backend and frontend use the same Hono version and implement
  TypeScript project references to avoid type instantiation errors."

**Source**: [Hono — RPC](https://hono.dev/docs/guides/rpc) — Accessed 2026-08-28. Reputation: High (official).

**Evidence B — the plan's own tsconfigs block the no-build-step path.** Reading the two configs
side by side:

| | `backend/tsconfig.json` | `frontend/tsconfig.json` |
|---|---|---|
| `moduleResolution` | `NodeNext` (inherited) | `bundler` (overridden) |
| `module` | `NodeNext` | `ESNext` |
| `lib` | default (no DOM) | `["ES2022","DOM","DOM.Iterable"]` |
| `@types/node` | present | **absent** |
| `hono` dependency | yes | **no** |

For `hc<AppType>` to infer anything, the frontend's TypeScript program must load
`backend/src/api/app.ts` and everything it transitively imports. That file imports
`node:crypto`, `drizzle-orm`, `better-sqlite3` (via `db/client.ts`) and `hono`. The frontend
program has no `@types/node`, so `import { randomUUID } from 'node:crypto'` is an unresolved
module — and because `app.ts` is a `.ts` source file rather than a `.d.ts`, `skipLibCheck: true`
does **not** suppress it. `npm run typecheck -w frontend` fails.

**So: does `hc` type-infer across an npm-workspace boundary without a build step?** In general
**yes** — npm workspaces symlink `backend` into `node_modules`, and TypeScript will happily
follow a bare `backend/src/api/app.js` specifier to the `.ts` source under both `NodeNext` and
`bundler` resolution. **But not with these two tsconfigs**, and making it work means one of:

1. Add `@types/node` to the frontend and widen its `types`, i.e. deliberately teach a browser
   package to compile Node built-ins — and pull Drizzle's (documented in §4a as "precise but
   **verbose**") generic types into the frontend typecheck's error surface. Also add
   `"exports"` to `backend/package.json`, which it currently lacks entirely.
2. Emit declarations from the backend (`tsc --declaration --emitDeclarationOnly`) and point the
   frontend at the `.d.ts` — **that is the build step**, and it must run before every frontend
   typecheck, which means a wired build order in a repo whose Global Constraints say *"Gates
   stay unwired."*
3. TypeScript project references, which Hono's own monorepo guidance recommends — the same
   build-order problem, plus `composite: true` and a `references` array in both packages.

**Evidence C — the duplication being removed is 17 lines and is already load-bearing
elsewhere.** `frontend/src/api.ts` duplicates `TriageLevel`, `QueueEntry` and `VisitView`. But
`TriageLevel` is *also* duplicated in `features/steps/queue.steps.ts` (as a bare `string`) and
would still be, because playwright-bdd steps talk HTTP to a running server and cannot use `hc`
type inference for Gherkin string parameters. RPC removes two of the three copies, not all
three.

**Applying the two questions:**

1. *Absence objectionable?* **No.** Hand-writing a response type for a JSON API is what
   essentially every frontend in the world does. A senior reviewer sees `frontend/src/api.ts`,
   sees 17 lines of plain types and two `fetch` wrappers that check `response.ok`, and reads it
   in ten seconds. If anything they will note approvingly that the frontend has an explicit
   contract rather than `any`.
2. *Presence objectionable?* **Yes, at this size.** `hcWithType` wrappers, `composite`
   tsconfigs, project references and a build ordering constraint, to delete 17 lines of types,
   in an app that must install and run first time on a stranger's laptop — that is the
   over-engineering failure the brief warns about, and it lands directly on the failsafe-setup
   constraint (decision 25).

**The drift risk is real but bounded, and there is a cheap mitigation that costs no
configuration.** The duplication can silently drift. One three-line guard in the backend test
suite catches it without any cross-package type plumbing:

```ts
// backend/src/api/app.test.ts — pins the wire contract the frontend hand-types.
it('returns exactly the queue entry fields the frontend expects', async () => {
  arrive('a', 'GREEN', 10);
  const body = await (await createApp({ db, clock }).request('/api/queue')).json();
  expect(Object.keys(body.entries[0]).sort()).toEqual(
    ['estimatedWaitMinutes', 'id', 'level', 'patientName', 'position'],
  );
});
```

That converts "the types might drift" from a latent hazard into a red test, which is the same
mechanism §4 of the decisions document already endorses for spec drift. **Recommend adding
it.**

**Confidence**: High on the Hono documentation facts and on the tsconfig analysis (both read
directly). **Medium on the specific claim that the frontend typecheck fails** — see Knowledge
Gap 1: no shell was available in this session, so this was derived from reading the two
tsconfigs and the import graph rather than by running `tsc`. It is a 60-second check and
should be run before acting on it.

---

### Decision 6: `zod.safeParse` + manual 400 vs `@hono/zod-validator`

**Verdict: CHANGE to `@hono/zod-validator`.** This is the clearest "change" in the document,
and it fixes a real bug rather than only shortening code.

**Evidence A — Hono's documentation recommends it in as many words.** The Validation guide,
after showing the built-in `validator` with a manual callback, states: **"We recommend using a
third-party validator."** and then shows `@hono/zod-validator` specifically:

```ts
import { zValidator } from '@hono/zod-validator'

app.post(
  '/posts',
  zValidator('form', z.object({ body: z.string() })),
  (c) => {
    const validated = c.req.valid('form')
  }
)
```
**Source**: [Hono — Validation](https://hono.dev/docs/guides/validation) — Accessed 2026-08-28. Reputation: High (official).

**Evidence B — version and peer compatibility, checked against the registry manifest.**
`@hono/zod-validator` is at **0.9.0**, MIT, with `peerDependencies`: `hono >=4.11.2` and
`zod ^3.25.0 || ^4.0.0`. The plan pins `hono ^4.13.5` and `zod ^4.4.3` — **both satisfied**, and
Zod 4 is explicitly supported.
**Source**: [honojs/middleware — packages/zod-validator](https://github.com/honojs/middleware/tree/main/packages/zod-validator) and its `package.json` — Accessed 2026-08-28. Reputation: Medium-High (the project's own repository; first-party for this package).

**Evidence C — the plan's current code returns 500 where it should return 400. Verified in
Hono's shipped source.** `hono/dist/validator/validator.js`, lines 13–23:

```js
case "json":
  if (!contentType || !jsonRegex.test(contentType)) {
    break;
  }
  try {
    value = await c.req.json();
  } catch {
    const message = "Malformed JSON in request body";
    throw new HTTPException(400, { message });
  }
```

The plan writes `.safeParse(await c.req.json())`. `c.req.json()` is awaited **outside** any
`try`, so a malformed or absent body rejects before `safeParse` is ever reached; the rejection
propagates out of the handler and Hono turns it into a **500**. `zValidator` — which wraps this
exact `validator` — returns **400**. Four routes are affected (`POST /api/visits`,
`/api/visits/:id/triage`, `/api/visits/:id/status`, `/api/test/clock`).

**Source**: `hono@4.12.18` shipped source read directly from disk at
`/home/storm/orca/workspaces/skald/spike-new-design/node_modules/hono/dist/validator/validator.js` — Accessed 2026-08-28. Reputation: High (primary artefact).

**Boilerplate cost per route, counted:**

| | Lines per route | Malformed body | Type of validated data |
|---|---|---|---|
| `safeParse` (current) | 3 (`const parsed = …safeParse(await c.req.json()); if (!parsed.success) return c.json({error: …}, 400);`) | **500** | `parsed.data`, inferred |
| `zValidator` | 1 (in the route signature) | **400** | `c.req.valid('json')`, inferred |

**Concrete diff.** Schemas move to module scope, which is where they belong anyway:

```diff
+import { zValidator } from '@hono/zod-validator';
+
+const levelSchema = z.enum(TRIAGE_LEVELS);
+const statusSchema = z.enum(['WAITING', 'IN_CONSULTATION', 'DONE', 'LEFT']);
+const newVisitSchema = z.object({ patientName: z.string().min(1), level: levelSchema });
+
 export function createApp(deps: AppDeps) {
   const app = new Hono();
   app.use('/api/*', cors());
 
-  app.post('/api/visits', async (c) => {
-    const parsed = z
-      .object({ patientName: z.string().min(1), level: levelSchema })
-      .safeParse(await c.req.json());
-    if (!parsed.success) return c.json({ error: parsed.error.message }, 400);
-
+  app.post('/api/visits', zValidator('json', newVisitSchema), (c) => {
+    const body = c.req.valid('json');
     const id = randomUUID();
     deps.db
       .insert(visits)
       .values({
         id,
-        patientName: parsed.data.patientName,
-        level: parsed.data.level,
+        patientName: body.patientName,
+        level: body.level,
         status: 'WAITING',
         arrivedAt: deps.clock.now(),
       })
       .run();
 
     return c.json({ id }, 201);
   });
```

Note the handler also stops being `async`, since nothing is awaited any more — better-sqlite3 is
synchronous. That is a small readability win in its own right and is worth pointing out to the
room.

**Applying the two questions:**

1. *Absence objectionable?* **Yes, mildly** — a Hono-literate reviewer expects `zValidator`
   because the docs recommend it, and a careful reviewer of any stripe would catch the
   malformed-body 500.
2. *Presence objectionable?* **No.** It is one line per route replacing three, from the
   framework's own middleware collection, with no new architectural concept. There is no
   over-engineering risk here at all.

**The one honest argument for keeping `safeParse`.** With `zValidator`, the 400 becomes
*invisible* — nothing in the route body shows the failure path. In a mixed room, "where does the
400 come from?" is a fair question and the current code answers it on screen. Two responses:
the `validator('json', …)` example in Hono's own docs shows the manual form for exactly that
teaching purpose, so it can be shown once on a slide; and the middleware's `hook` third
argument makes the error response explicit again in one place if you want it:

```ts
zValidator('json', newVisitSchema, (result, c) => {
  if (!result.success) return c.json({ error: 'invalid request body' }, 400);
})
```

**Recommend the plain two-argument form.** The hook is available if a reviewer wants the error
shape pinned, but the default response is fine for a teaching app and the third argument is
one more thing to explain.

**Residual cost to record:** one new runtime dependency in the backend, against §4's noted
"three backend packages have zero runtime dependencies" property. `@hono/zod-validator` itself
has no runtime dependencies (hono and zod are peers, both already present), so the *installed
tree* does not grow — but the dependency **count** in `backend/package.json` goes from 5 to 6.
That is a fact the plan should record rather than discover.

**Confidence**: High (official Hono recommendation + first-party package manifest + primary
source code read from disk).

### Also: Project structure — feature folders vs layer folders

**Verdict: KEEP the layer folders (`domain/`, `db/`, `api/`).** The usual "feature folders scale
better" argument is correct and does not apply, for a reason specific to this repository.

**The standard argument.** Layer folders are widely criticised for scattering one feature across
many directories — a change to "invoicing" touches `controllers/`, `services/`, `repositories/`.
Feature folders (`invoicing/`, `shipping/`) keep a change local. This is real advice at scale.

**Why it is inverted here.** This app has **one feature**. A feature-folder layout would produce
`backend/src/queue/` containing all nine source files — a folder whose name conveys no
information, since everything is the queue.

**And the layer folders are doing a second job that a feature folder could not.** They map
one-to-one onto decision 22's three test layers:

| Folder | Test layer | Test cost |
|---|---|---|
| `domain/` | unit | array literals, no I/O |
| `db/` + `api/` | integration | real SQLite, `app.request()` |
| `features/` (repo root) | BDD E2E | real browser, real server |

The directory tree *is* the gate table. For a course whose deliverable is a classroom gate
catalogue, that is unusually strong justification — it is teaching material, not filing.

**Applying the two questions:** (1) absence objectionable — yes, a flat `backend/src/` with nine
files would blur exactly that boundary; (2) presence objectionable — no, three folders holding
2–5 files each is not an architecture, and there are no `interfaces/`, `ports/`, `adapters/` or
`services/` folders, which is where this would start to wince.

**One structural note.** `clock.ts` sits at `backend/src/clock.ts`, outside all three folders.
That is right: it is a cross-cutting primitive, not a layer, and its top-level position is a
visible restatement of the Global Constraint that it is the only place allowed to read real
time.

**Confidence**: Medium-High (reasoned from the repository's own constraints; the general layer-vs-feature
debate has no authoritative resolution — see Conflicting Information below).

---

### Also: Error handling — exceptions + `onError`, or Result types?

**Verdict: exceptions. And ADD an `app.onError` — the plan currently has none.**

**Evidence — Hono's documented idiom is throw-and-catch-centrally.** `HTTPException` from
`hono/http-exception`, thrown from a handler, caught in `app.onError`:

```ts
import { HTTPException } from 'hono/http-exception'
throw new HTTPException(401, { message: 'Unauthorized' })
```

```ts
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  console.error(err)
  return c.text('Internal Server Error', 500)
})
```
**Source**: [Hono — Exception](https://hono.dev/docs/api/exception) — Accessed 2026-08-28. Reputation: High (official).

This is not merely available; it is load-bearing. `hono/validator` — and therefore
`@hono/zod-validator`, recommended above — **throws `HTTPException(400)` internally** for a
malformed JSON body (verified in shipped source, quoted under Decision 6). Choosing Result types
would mean fighting the framework's own middleware.

**On Result types (`neverthrow`, `fp-ts` `Either`, or a hand-rolled `Result<T, E>`).** This is a
legitimate and increasingly popular TypeScript style, and it is the wrong choice here:

1. **Not idiomatic Hono.** Nothing in the framework or its middleware ecosystem produces or
   consumes a `Result`; every boundary would need adapting.
2. **It fails question 2 hard.** A mixed room of developers and product people, on a one-day
   course about *process*, should not spend any of its attention budget on railway-oriented
   programming. Every handler becomes a `match`, and the reader must learn a new control-flow
   idiom before they can read a five-line route.
3. **There is almost nothing to model.** The app's only genuinely-expected failures are "visit
   not found" (already an explicit `if (!row) return c.json(…, 404)`) and "invalid body"
   (handled by the validator). Explicit early returns already express both, in the plainest
   possible way.

**The concrete gap: no `onError` exists in the plan.** An unexpected throw — a SQLite foreign-key
violation from `triageEvents.visitId.references(() => visits.id)` with `PRAGMA foreign_keys =
ON`, a disk error, a `randomUUID` collision — currently produces Hono's built-in 500 with no
server-side log. In a classroom that is the difference between a student seeing *nothing* and
seeing a stack trace in their terminal. Five lines:

```diff
 export function createApp(deps: AppDeps) {
   const app = new Hono();
   app.use('/api/*', cors());
+
+  app.onError((err, c) => {
+    if (err instanceof HTTPException) return err.getResponse();
+    console.error(err);              // the classroom needs this line
+    return c.json({ error: 'internal error' }, 500);
+  });
```

**Applying the two questions:** (1) absence objectionable — yes, mildly; a production Hono app
without `onError` is a recognisable omission and the missing log is a real classroom cost;
(2) presence objectionable — no, it is one block, it is in the official docs, and it introduces
no concept the reader does not already have.

**Confidence**: High.

---

### Also: Drizzle specifics

#### (a) The `level` column: **CHANGE** — use `text('level', { enum: TRIAGE_LEVELS })`

This is the highest value-per-character change in the document. The plan currently stores
`level` as bare `text` and casts on read:

```ts
level: row.level as TriageLevel,      // api/app.ts
level: r.level as 'GREEN',            // db/seed.test.ts — and this cast is a lie
```

**Evidence — read directly from the pinned version's type declarations.** In
`drizzle-orm@0.45.2`, `sqlite-core/columns/text.d.ts`:

```ts
// line 72 — the (name, config) overload
export declare function text<TName extends string, U extends string,
  T extends Readonly<[U, ...U[]]>, L extends number | undefined, …>(
  name: TName, config?: SQLiteTextConfig<TMode, T | Writable<T>, L>
): … SQLiteTextBuilderInitial<TName, Writable<T>, L>;

// line 11 — what that does to the inferred data type
data: TEnum[number];
```

`T extends Readonly<[U, ...U[]]>` accepts a `readonly` tuple, which is exactly what
`TRIAGE_LEVELS` (declared `as const`) already is. **No `Writable<>` juggling or spread is
needed at the call site.**

**And it does not change the generated SQL.** From `sqlite-core/columns/text.js`, lines 26–28:

```js
getSQLType() {
  return `text${this.config.length ? `(${this.config.length})` : ""}`;
}
```

`enum` is not consulted. Drizzle's own docs confirm the intent: the enum option "will be inferred
as text: 'value1' | 'value2' | null", but it "won't check runtime values."
**Source**: [Drizzle — SQLite column types](https://orm.drizzle.team/docs/column-types/sqlite) — Accessed 2026-08-28. Reputation: High (official); cross-verified against `drizzle-orm@0.45.2` source read from disk.

**The diff:**

```diff
+import { TRIAGE_LEVELS } from '../domain/triage.js';
+
+export const VISIT_STATUSES = ['WAITING', 'IN_CONSULTATION', 'DONE', 'LEFT'] as const;
+
 export const visits = sqliteTable('visits', {
   id: text('id').primaryKey(),
   patientName: text('patient_name').notNull(),
-  level: text('level').notNull(),
-  status: text('status').notNull().default('WAITING'),
+  level: text('level', { enum: TRIAGE_LEVELS }).notNull(),
+  status: text('status', { enum: VISIT_STATUSES }).notNull().default('WAITING'),
   arrivedAt: integer('arrived_at', { mode: 'timestamp_ms' }).notNull(),
 });
```

and then, in `api/app.ts`:

```diff
-      level: row.level as TriageLevel,
+      level: row.level,
```

**Why this matters more than it looks.** Decision 30 in the design document justifies choosing
Drizzle *entirely* on this: "a typo'd column becomes a `tsc` error (name-error band, ~77% agent
repair rate) instead of a runtime failure (assertion band, ~45%)." A `as TriageLevel` cast is a
hole punched straight through that argument — it tells the compiler to stop checking exactly
where the domain's most important constraint lives. Shipping the cast in a course that argues
for the ORM on type-safety grounds is the kind of internal inconsistency a skilled audience
notices immediately. With the enum, `level: 'PURPLE'` in a seed literal is a compile error.

Two knock-on wins: `VISIT_STATUSES` becomes a single source of truth shared with the
`statusSchema` in the API (`z.enum(VISIT_STATUSES)`), removing a second duplicated string list;
and the honest-lie cast `r.level as 'GREEN'` in `seed.test.ts` disappears.

**One thing to verify with a command, not by reading:** run `npm run db:generate -w backend` and
confirm the diff is empty. The source says it must be; that is cheap to prove.

#### (b) `$inferSelect` / `$inferInsert`: **available, but do not add them gratuitously**

Confirmed present in `drizzle-orm@0.45.2` (`table.d.ts` lines 26–27:
`readonly $inferSelect: InferSelectModel<Table<T>>`, `readonly $inferInsert:
InferInsertModel<Table<T>>`; the older `InferModel` is marked `@deprecated` in the same file).

**They are not needed as written, and that is fine.** `db.select().from(visits).all()` is already
fully inferred at the call site; a named `type VisitRow = typeof visits.$inferSelect` earns its
place only when a row **crosses a function boundary**. In this app the one function that does —
`waitingVisits(db)` — deliberately returns a *domain* type (`WaitingVisit & { patientName:
string }`), not a row type. That is the better choice: it is the seam where the imperative shell
hands off to the functional core, and it should speak the domain's vocabulary, not the table's.

Verdict: **toss-up, leaning no**. Reach for `$inferSelect` the moment a row is passed around;
adding it now would be a name with no user.

#### (c) Transactions: **toss-up, leaning ADD two of them**

**Evidence — with better-sqlite3 the API is synchronous, which most Drizzle documentation does
not show.** Drizzle's transactions page shows only the async form (`await db.transaction(async
(tx) => …)`). The better-sqlite3 driver's own declaration is different —
`drizzle-orm/better-sqlite3/session.d.ts` line 28:

```ts
transaction<T>(
  transaction: (tx: BetterSQLiteTransaction<TFullSchema, TSchema>) => T,
  config?: SQLiteTransactionConfig,
): T;
```

The callback is **not** async and the return value is **`T`, not `Promise<T>`**. So the correct
call is `db.transaction((tx) => { … })` with **no `await`**. Anyone copying the docs' `await
db.transaction(async …)` into this codebase writes something subtly wrong.
**Sources**: [Drizzle — Transactions](https://orm.drizzle.team/docs/transactions) — Accessed 2026-08-28 (async form, official) — corrected against `drizzle-orm@0.45.2` `better-sqlite3/session.d.ts` read from disk. Reputation: High for both; the source file is authoritative where the two differ.

**Does this app need one? Honestly: not for correctness today.** better-sqlite3 is synchronous
and single-connection, and there is no `await` between the two writes in the re-triage handler,
so nothing can interleave. **But** if the `triageEvents` insert throws (foreign-key violation,
disk full), you are left with a changed `level` and no history row — and the cycle-3 queue-aging
amendment reads that history. Two places are worth wrapping:

```diff
-    deps.db.update(visits).set({ level: body.level }).where(eq(visits.id, id)).run();
-    deps.db.insert(triageEvents).values({ … }).run();
+    // Both writes or neither: the aging amendment reads this history.
+    deps.db.transaction((tx) => {
+      tx.update(visits).set({ level: body.level }).where(eq(visits.id, id)).run();
+      tx.insert(triageEvents).values({ … }).run();
+    });
```

and `seedDemoData`, whose delete-delete-insert×5 should be atomic so a failed `npm run reset`
cannot leave a half-empty queue in front of a class.

**Applying the two questions:** (1) absence objectionable — mildly; "two writes that must both
happen" is the textbook transaction trigger and a reviewer will look for it; (2) presence
objectionable — no; it is one `db.transaction((tx) => {…})` wrapper, three lines, and it teaches
something true. Add it, and say in the comment *why* (both writes or neither), so it reads as a
decision rather than a reflex.

---

### Also: Testing patterns

#### `app.request()` — **KEEP, this is exactly the documented idiom**

Hono's testing guide: "All you need to do is create a Request and pass it to the Hono
application to validate the Response", with `const res = await app.request('/posts')`.
**Source**: [Hono — Testing](https://hono.dev/docs/guides/testing) — Accessed 2026-08-28. Reputation: High (official).

`createApp({ db, clock })` + `app.request(…)` with no server, no port and no `supertest` is the
best-supported thing in the whole plan. It is also the direct pay-off of Decision 1: the factory
is what lets each test build an app over its own database.

#### Temp SQLite file per test — **CHANGE to `:memory:` for the unit/integration suite**

Three problems with the current shape, in increasing order of severity:

1. **Inconsistent between files.** `client.test.ts` and `seed.test.ts` use `let dir: string |
   undefined` with `afterEach`; `app.test.ts` uses `beforeEach` + `afterEach`. Two idioms for
   one job in one suite.
2. **Shared mutable state at module scope.** `app.test.ts` has `const clock = fixedClock(new
   Date('2026-03-01T10:00:00.000Z'))` **outside** `beforeEach`. `fixedClock` returns an object
   with `set()` and `advanceMinutes()`. No test mutates it today, so it is not a bug today — it
   is a loaded gun, and Task 8 adds a route whose entire purpose is mutating a clock. Move it
   into `beforeEach`.
3. **The connection is never closed, and `rmSync` on Windows will fail because of it.**
   `createDb` opens a `better-sqlite3` handle and sets `journal_mode = WAL` (producing `-wal`
   and `-shm` files); nothing calls `sqlite.close()`. On Linux and macOS `rmSync(dir,
   {recursive:true, force:true})` unlinks open files happily. **On Windows it raises
   `EBUSY`/`EPERM`.** §4a of the design document explicitly lists `win32-x64` and `win32-arm64`
   prebuilds among the reasons `better-sqlite3` is safe for student laptops — so Windows
   students are expected, and this suite would fail for them.

**All three vanish with an in-memory database:**

```diff
-import { mkdtempSync, rmSync } from 'node:fs';
-import { tmpdir } from 'node:os';
-import { join } from 'node:path';
-import { afterEach, beforeEach, describe, expect, it } from 'vitest';
+import { beforeEach, describe, expect, it } from 'vitest';
 
-let dir: string;
 let db: Db;
-const clock = fixedClock(new Date('2026-03-01T10:00:00.000Z'));
+let clock: TestClock;
 
 beforeEach(() => {
-  dir = mkdtempSync(join(tmpdir(), 'legevakt-'));
-  db = createDb(join(dir, 'test.sqlite'));
+  clock = fixedClock(new Date('2026-03-01T10:00:00.000Z'));
+  db = createDb(':memory:');   // fresh, isolated, nothing to clean up
   applyMigrations(db);
 });
-
-afterEach(() => {
-  rmSync(dir, { recursive: true, force: true });
-});
```

`createDb` needs no change — `new Database(':memory:')` is supported by better-sqlite3, and the
WAL pragma is simply a no-op there. `applyMigrations` runs against it normally.

**This also serves the course directly.** §4 of the design document flags as its "top measurement
priority" the hypothesis that *"integration tests are slow' is an artefact of Postgres and
Docker, not a law"*. In-memory SQLite is that claim in its strongest form, and it makes the
number worth putting on a slide.

**Scope note:** this applies to the Vitest suite only. The playwright-bdd suite must keep
`DB_FILE=data/test.sqlite`, because it drives a **separate server process** which cannot share an
in-memory handle. The Global Constraint "the test database is a separate file, recreated per
run" is about that suite and is unaffected.

#### Test data builders vs inline literals — **KEEP the current approach exactly**

The plan uses three tiny local helpers: `at(hhmm)`, `visit(id, level, time)` and `arrive(id,
level, minutesAgo)`. Each is a 3–6 line arrow function defined in the test file that uses it.

This is the right amount. **A `VisitBuilder` class with `.withLevel('RED').withArrival(…).build()`
would fail question 2 outright** — it is the canonical over-engineering of test setup, it adds a
file, and at three fields it is strictly longer to call than the positional helper. Meanwhile
fully inline literals would repeat `arrivedAt: new Date(clock.now().getTime() - 60 * 60_000)` in
every test, which buries the one number the test is about.

The named-argument tell is worth knowing: switch from positional helper to an options object
when you reach ~4 parameters or when a boolean appears. Neither has happened.

#### Avoiding shared state — one more item

Beyond the module-scope clock above: `db/seed.ts` uses **fixed literal ids** (`seed-1` …
`seed-5`) and `DEMO_QUEUE` is a module-level `const` array. Because `seedDemoData` only reads it
and inserts, nothing mutates it — fine. But if any future test does
`DEMO_QUEUE.push(…)`, every subsequent test in the same worker inherits it. Vitest isolates by
file by default (each test file gets its own module registry), so the blast radius is one file.
Worth one comment (`// read-only: seeded rows are fixed so the demo is deterministic`) and no
more.

**Confidence**: High on the Hono testing idiom (official docs) and on the Windows file-handle
hazard (well-established platform behaviour); **Medium** on the claim that `:memory:` needs no
`createDb` change — see Knowledge Gap 1, this was not executed.

---

### Also: playwright-bdd step organisation

#### Declarative vs imperative — **the plan gets this right, and better than the vendor's own examples**

Cucumber's official guidance: "Your scenarios should describe the intended behaviour of the
system, not the implementation… it should describe *what*, not *how*", and "By avoiding terms
like 'click a button' that suggest implementation, the scenario is more resilient to
implementation details of the UI."
**Source**: [Cucumber — Better Gherkin](https://cucumber.io/docs/bdd/better-gherkin/) — Accessed 2026-08-28. Reputation: High (the BDD tool's own documentation; primary source for Gherkin style).

The plan's steps —

```gherkin
Given "Kari" arrived 60 minutes ago with triage level "GREEN"
When "Ola" opens their queue view
Then they see position 2
```

— are domain language throughout. No `I click`, no field names, no selectors. Contrast
playwright-bdd's own `examples/ai` (`I click link "Get started"`, `I see header "About"`), which
§4c of the design document already flagged as imperative. **The plan's Gherkin is a better
teaching artefact than the vendor's**, and that is worth saying out loud in the classroom.

**One tension worth naming for the room**: `arrived 60 minutes ago` is *time* mechanics leaking
into the scenario, in the same way `click` is *UI* mechanics. The defence is strong — waiting
time is genuinely part of this domain's language, not an implementation detail — but it is
exactly the judgement call the "better Gherkin" exercise is about, so use it.

#### Step definition mechanics — **KEEP; `createBdd(test)` + a custom fixture is the documented pattern**

playwright-bdd's Playwright-style docs: "Step functions accept custom fixtures as the first
argument, and the rest are step parameters", they "don't rely on `this` context and work best as
arrow functions", and custom fixtures require exactly the three steps the plan performs —
extend the base `test`, export `Given/When/Then` bound to it, import those in step files. The
alternative `this`-based "default World" is described as **discouraged**, present for CucumberJS
migration.
**Source**: [playwright-bdd — Playwright-style steps](https://vitalets.github.io/playwright-bdd/#/writing-steps/playwright-style) — Accessed 2026-08-28. Reputation: High (official).

The plan's `visitIds: Map<string, string>` fixture is textbook: scenario-scoped state, created
fresh per test by the fixture lifecycle, so **no** module-level `Map` leaking between scenarios.
That is the single most common source of cross-scenario flake in Cucumber suites and the plan
avoids it by construction.

#### Avoiding step-definition explosion — already handled, one guideline to write down

Five step definitions cover both scenarios, and `{string} arrived {int} minutes ago with triage
level {string}` is reused four times. Reuse is coming from **parameterisation**, which is the
mechanism that prevents explosion: a step with `{string}`/`{int}` placeholders serves N
scenarios; a step spelled `Given Kari arrived 60 minutes ago as GREEN` serves one.

The rule to record in the repo (because Plan C adds more features and this is where explosion
starts): **a new step definition is justified only when it expresses a new *kind* of fact about
the domain, never when it expresses a new *value*.** New value → parameter. New fact → step.

#### Two concrete changes

**1. Move step definitions out of the product person's directory.** The Global Constraints say
"`specs/` and `features/` at the repo root belong to the product person; `backend/src/` and
`frontend/src/` belong to the developer." But `features/steps/fixtures.ts` and
`features/steps/queue.steps.ts` are developer TypeScript living **inside** `features/`. That
quietly contradicts the plan's own ownership principle, and it is the directory a
Cowork-only product person is pointed at.

```diff
 features/                        # PRODUCT PERSON OWNS THIS
   queue-position.feature
-  steps/fixtures.ts
-  steps/queue.steps.ts
+steps/                           # DEVELOPER OWNS THIS
+  fixtures.ts
+  queue.steps.ts
```
```diff
 const testDir = defineBddConfig({
   features: 'features/**/*.feature',
-  steps: 'features/steps/**/*.ts',
+  steps: 'steps/**/*.ts',
   aiFix: { promptAttachment: true },
 });
```

`defineBddConfig` takes `features` and `steps` as independent globs, so this costs one line of
config and buys a directory tree that matches the stated rule. **It also removes the risk that
a product person editing "their" folder in Cowork opens a `.ts` file.**

**2. Replace the `Given the clinic queue is empty` loop with a test-only reset route.** Today
that step reads the queue and issues one `POST …/status {DONE}` per entry — an O(n) sequence of
HTTP calls whose behaviour depends on what the *previous* scenario left behind. Scenarios are
cleaned up by their successor rather than being independent. The plan already has the machinery
for a better answer: an `allowTestRoutes` flag and a precedent (`POST /api/test/clock`).

```ts
// inside `if (deps.allowTestRoutes) { … }` in createApp
app.post('/api/test/reset', (c) => {
  deps.db.transaction((tx) => {
    tx.delete(triageEvents).run();
    tx.delete(visits).run();
  });
  return c.json({ ok: true });
});
```
```diff
 Given('the clinic queue is empty', async ({ request }) => {
-  const response = await request.get(`${API}/api/queue`);
-  const { entries } = await response.json();
-  for (const entry of entries) {
-    await request.post(`${API}/api/visits/${entry.id}/status`, { data: { status: 'DONE' } });
-  }
+  await request.post(`${API}/api/test/reset`);
 });
```

One request instead of N+1, genuinely independent scenarios, and the step now means what it says
(the queue is *empty*, not "everyone is marked done"), which matters because `DONE` visits are
still rows and the aging amendment in cycle 3 will eventually care.

#### One smaller flag

`3001` appears in four places: `features/steps/fixtures.ts` (`API`), `frontend/vite.config.ts`
(proxy), `backend/src/server.ts` (`PORT` default) and implicitly in `playwright.config.ts`
(`url: 'http://localhost:3001/api/queue'`). Four copies of a magic number is a "when it breaks,
it breaks confusingly" hazard on a course day. Not worth a config module — worth a comment in
each place pointing at the others, or an `API_PORT` constant in `playwright.config.ts` reused by
the fixture.

**Confidence**: High (official playwright-bdd and Cucumber documentation; the two changes are
derived from the plan's own stated constraints).

---

### Also: React review — what a senior reviewer would actually flag

**What is correct and should be left alone.** Listing these matters as much as the defects,
because the brief's risk is over-correction:

- **Keys.** `entries.map` uses `key={entry.id}` (stable domain id, not index); `LEVELS.map`
  uses `key={option}` (stable string). Both correct. React's rule — keys must be stable,
  predictable and unique among siblings — is satisfied.
- **Effect dependencies.** `[visitId]`, `[reload]` (with `reload` wrapped in `useCallback(…,
  [])`), and `[]` for the `hashchange` subscription. All three are exhaustive and correct; none
  is the classic "lying dependency array".
- **Cleanup.** Every effect returns one. The `hashchange` listener is removed; the intervals are
  cleared; the fetch is guarded by `cancelled`.
- **`StrictMode` is on.** In development React double-invokes effect + cleanup precisely to
  surface missing cleanup. The plan's effects survive that, and the `cancelled` flag makes the
  doubled fetch harmless. This is a small piece of evidence *for* the hand-rolled approach: the
  code passes the check React added to catch this exact class of bug.
- **No error boundary.** Correctly absent. Question 1: no — an `ErrorBoundary` class component
  (still the only way to write one; there is no hook equivalent) wrapping two views would be
  ceremony. Question 2: yes, it would wince.

**What a reviewer would flag, ordered by severity:**

1. **Stale patient data on navigation** (`PatientView`). Covered under Decision 4 — add
   `setVisit(null)` at the top of the effect, matching React's own example. **This is the only
   user-visible correctness bug in the frontend.**
2. **`StaffView` swallows API failures.** `post()` never checks `response.ok`; `void reload()`
   inside `setInterval` produces an unhandled rejection when the backend is down. Diff under
   Decision 4. `StaffView` has no `error` state at all, unlike `PatientView`.
3. **`aria-label` where `<label>` belongs.** `<input aria-label="Patient name" />` works and
   `getByLabel` finds it, but a visible `<label htmlFor>` is better for *everyone*, not only
   screen-reader users — and this form currently has **no visible text at all** telling a user
   what the input is for. Two lines:

   ```diff
   -<input aria-label="Patient name" value={name} onChange={…} />
   +<label htmlFor="patient-name">Patient name</label>
   +<input id="patient-name" value={name} onChange={…} />
   ```

   The same applies to the `Triage level` select. In a health-adjacent domain in front of a
   health-tech room, an unlabelled form is a bad look regardless of the app's throwaway status.
4. **`getByTestId` contradicts the `aiFix` prompt the plan enables.** Task 11 turns on
   `aiFix: { promptAttachment: true }`, whose vendor prompt template (quoted in §4c of the
   design document) instructs: *"Use only role-based locators: getByRole, getByLabel, etc."* and
   *"Strictly rely on the ARIA snapshot of the page."* But the step definitions assert with
   `page.getByTestId('position')` — and `data-testid` attributes **do not appear in an ARIA
   snapshot**. When a scenario fails, the AI prompt will show an accessibility tree in which the
   thing the test was looking for is invisible. That is a self-inflicted wound on the one
   feature §4c says materially improves the E2E gate's rating.

   Cheapest fix that keeps the assertions readable: give the values accessible names in the
   markup and assert on roles.

   ```diff
   -<p>You are number <strong data-testid="position">{visit.position ?? '-'}</strong> in the queue</p>
   +<p>Queue position: <strong aria-label="Queue position">{visit.position ?? '-'}</strong></p>
   ```
   ```diff
   -await expect(page.getByTestId('position')).toHaveText(String(expected));
   +await expect(page.getByLabel('Queue position')).toHaveText(String(expected));
   ```

   This is a genuine trade-off, not a clear win — `data-testid` is deliberately decoupled from
   copy, which is why many teams prefer it, and Playwright ships `getByTestId` as a
   first-class locator. **Both positions are defensible; what is not defensible is enabling
   `aiFix` and then hiding the assertion targets from it.** Pick one deliberately and record why.
5. **`App.tsx` subscribes to a browser store from an Effect.** The modern-React answer to
   "subscribe to an external store" is `useSyncExternalStore`, and the effect version has a real
   (if microscopic) gap: a hash change occurring between render and effect commit is missed.
   **Do not change this.** Question 2 decides it: `useSyncExternalStore` for a 12-line hash
   router would be the most over-engineered thing in the repo, and the failure mode is a hash
   change in the first few milliseconds of page load. Worth *knowing*, not worth *doing* — and
   worth saying so in the README so a reader sees a decision rather than an oversight.

**Two small ones:** the `<table>` has no `<caption>`; and `PatientView`'s error branch replaces
the entire view with the raw `String(cause)` of the exception, so a single transient network
blip wipes the patient's position off the screen until the next successful poll 15 seconds
later. For a "live queue" the better behaviour is to keep showing the last known data with a
staleness note. That is a genuine product decision, not just a code one — which arguably makes
it good material for the room rather than something to silently fix.

**Confidence**: High on the React facts (official documentation, read directly); the severity
ordering is interpretation and labelled as such.

## Source Analysis

| Source | Domain | Reputation | Type | Access Date | Cross-verified |
|--------|--------|------------|------|-------------|----------------|
| Hono — Best Practices | hono.dev | High | official | 2026-08-28 | Y (Fowler, Context docs) |
| Hono — Context | hono.dev | High | official | 2026-08-28 | Y (Best Practices) |
| Hono — Validation | hono.dev | High | official | 2026-08-28 | Y (validator.js source, middleware repo) |
| Hono — Exception | hono.dev | High | official | 2026-08-28 | Y (validator.js throws HTTPException) |
| Hono — Testing | hono.dev | High | official | 2026-08-28 | Y (plan's own test files) |
| Hono — RPC | hono.dev | High | official | 2026-08-28 | Y (honojs GitHub issues) |
| React — `useEffect` | react.dev | High | official | 2026-08-28 | Y (plan code, TanStack docs) |
| TanStack Query — Quick Start | tanstack.com | High | official | 2026-08-28 | Y (react.dev names it) |
| Drizzle — SQLite column types | orm.drizzle.team | High | official | 2026-08-28 | Y (text.d.ts + text.js on disk) |
| Drizzle — Transactions | orm.drizzle.team | High | official | 2026-08-28 | **Partially — corrected** by session.d.ts |
| playwright-bdd — Playwright-style steps | vitalets.github.io | High | official | 2026-08-28 | Y (plan's fixtures.ts) |
| Cucumber — Better Gherkin | cucumber.io | High | official | 2026-08-28 | Y (design doc §4c) |
| `hono@4.12.18` `dist/validator/validator.js` | local disk | High | primary artefact | 2026-08-28 | Y (Hono validation docs) |
| `drizzle-orm@0.45.2` `sqlite-core/columns/text.d.ts` + `.js` | local disk | High | primary artefact | 2026-08-28 | Y (Drizzle docs) |
| `drizzle-orm@0.45.2` `table.d.ts` | local disk | High | primary artefact | 2026-08-28 | Y (Drizzle docs) |
| `drizzle-orm@0.45.2` `better-sqlite3/session.d.ts` | local disk | High | primary artefact | 2026-08-28 | Corrects the official docs |
| honojs/middleware — zod-validator (README + package.json) | github.com | Medium-High | first-party repo | 2026-08-28 | Y (Hono validation docs) |
| Martin Fowler — Repository / Domain Model (P of EAA) | martinfowler.com | Medium-High | industry leader | 2026-08-28 | Y (Hono Best Practices) |
| honojs/hono issues #3738, #1151, #4867; discussions #2213, #3489, #4643 | github.com | Medium-High | community, first-party tracker | 2026-08-28 | Y (Hono RPC docs) |
| Gary Bernhardt — *Boundaries* | destroyallsoftware.com | Medium | primary for the term | 2026-08-28 | Y (Fowler, plan's test structure) |

Reputation: High: 16 (80%) | Medium-High: 3 (15%) | Medium: 1 (5%) | **Avg: 0.96**

**Bias check.** Framework documentation has an obvious commercial-adjacent interest in
recommending its own features — hono.dev recommending `@hono/zod-validator` (a Hono-org package)
and RPC (a Hono selling point) is exactly that shape. This was handled by *not* taking the
recommendation as decisive on its own: the `zValidator` verdict rests additionally on shipped
source code showing a behavioural difference, and the RPC verdict **goes against** the vendor's
promotion of its own feature. React's docs recommending TanStack Query is the reverse case — a
recommendation *away* from the vendor's own primitive, which raises rather than lowers its
weight, and it is still not followed here for reasons documented rather than asserted.

**Freshness.** All framework documentation was accessed 2026-08-28 and is the current version at
that date. Version-specific claims are anchored to versions actually on disk (`hono@4.12.18`,
`drizzle-orm@0.45.2`) or to a manifest read on the access date (`@hono/zod-validator@0.9.0`).
Per the framework-versions freshness rule (max age 1 year), all are in date. **Flagged**: the
plan pins `hono ^4.13.5` but the artefact read from disk was **4.12.18** — a patch/minor behind.
The `validator.js` behaviour quoted is long-standing, but the exact line numbers may differ in
4.13.x.

## Knowledge Gaps

### Gap 1: No shell was available, so nothing was executed
**Issue**: The brief explicitly requested empirical checks ("Empirical checks beat reading… you
have a shell") because two of this project's conclusions have already been overturned by
60-second experiments. **This session had no Bash/execution tool** — only file reading, globbing,
grepping and web fetching. The gap was mitigated by reading the *shipped source and type
declarations* of the exact pinned dependency versions from `node_modules` trees already present
on this machine, which is stronger than reading documentation but weaker than running `tsc`.

**Attempted**: `drizzle-orm@0.45.2` and `hono@4.12.18` located and read directly;
`@hono/zod-validator` was **not** present anywhere on disk, so its version and peer ranges come
from the repository manifest rather than an installed artefact.

**Specifically unverified — run these before acting:**

1. `text('level', { enum: TRIAGE_LEVELS })` compiles with `TRIAGE_LEVELS` declared `as const`,
   and `npm run db:generate -w backend` produces **no** migration diff. *(The type declaration
   at `text.d.ts:72` accepts `Readonly<[U, ...U[]]>` and `getSQLType()` at `text.js:26` ignores
   `enum`, so both should hold. Confidence High, but this is the single highest-value 60-second
   check in the document.)*
2. `createDb(':memory:')` works with `applyMigrations` and the `journal_mode = WAL` pragma.
   *(Expected: pragma is a silent no-op. Confidence Medium-High.)*
3. `npm run typecheck -w frontend` fails if `hc`/`AppType` is imported across the workspace with
   the plan's current tsconfigs. *(Reasoned from the two tsconfigs and the import graph.
   Confidence Medium. This is the load-bearing claim under Decision 5; if it turns out the
   frontend typechecks fine, Decision 5 becomes a much closer call and should be re-examined.)*
4. `POST /api/visits` with body `not-json` returns 500 under the current code and 400 under
   `zValidator`. *(Confidence High — read from `validator.js` — but trivially checkable with
   `curl`.)*
5. `db.transaction((tx) => {…})` type-checks **without** `await` under better-sqlite3.
   *(Confidence High — `session.d.ts:28` returns `T`, not `Promise<T>`.)*

**Recommendation**: run all five in a scratch workspace before folding these changes into the
plan. Item 3 is the one most likely to change a verdict.

### Gap 2: No evidence on what a *mixed* room finds readable
**Issue**: Every "would a senior developer wince?" judgement in this document is calibrated to a
senior *developer*. Decision 1 of the course design document says the room is **mixed** —
developers and product people in cross-functional pairs. No source was found measuring
comprehension of these specific patterns by non-developers.
**Attempted**: no authoritative source exists; this is a genuine empirical unknown rather than a
search failure.
**Recommendation**: it is cheap to test — show `api/app.ts` to one non-developer before the
course and ask what `GET /api/queue` does. Note that this cuts *toward* the recommendations here
in every case: fewer layers, fewer libraries, more explicit code.

### Gap 3: `@hono/zod-validator` was not installed or exercised
**Issue**: Its version (0.9.0) and peer ranges were read from the repository manifest, not from
an installed package, and its Zod 4 error-response *shape* was not observed. The plan's existing
tests assert only `response.status === 400`, so the shape does not matter today — but if a test
ever asserts on the error body, that assertion is unverified.
**Recommendation**: `npm i @hono/zod-validator -w backend` and `curl` one bad request. One
minute.

### Gap 4: TanStack Query's interaction with the BDD suite is reasoned, not measured
**Issue**: The claim that `refetchOnWindowFocus: true` would add non-obvious network activity
under Playwright is derived from documented defaults, not observed. It is a minor input to
Decision 4 and does not carry the verdict.
**Recommendation**: only worth measuring if Decision 4 is revisited.

## Conflicting Information

### Conflict 1: Drizzle's transaction API — the docs and the driver disagree
**Position A**: Transactions are `await db.transaction(async (tx) => { … })`.
— Source: [Drizzle — Transactions](https://orm.drizzle.team/docs/transactions), Reputation High
(official). Evidence: every example on the page uses the async form.
**Position B**: With better-sqlite3, `transaction<T>(fn: (tx) => T): T` — the callback is
synchronous and the return value is **not** a Promise.
— Source: `drizzle-orm@0.45.2` `better-sqlite3/session.d.ts` line 28, Reputation High (primary
artefact). Evidence quoted in full above.
**Assessment**: **B is authoritative.** The published examples are dialect-generic and written for
async drivers; the driver's own declaration governs. A developer copying the documentation
verbatim into this codebase writes `await` on a non-Promise — which TypeScript permits silently.
This is precisely the class of thing the plan should get right, since students will read it.

### Conflict 2: React recommends TanStack Query; this document recommends against it
**Position A**: "consider using or building a client-side cache. Popular open source solutions
include TanStack Query, useSWR, and React Router 6.4+" — Source:
[react.dev](https://react.dev/reference/react/useEffect), Reputation High (official).
**Position B**: Keep the hand-rolled effect. — Source: this analysis, applying the brief's
two-question test to a two-component app.
**Assessment**: **Not actually a contradiction, and the document should not pretend otherwise.**
React's own text qualifies the recommendation with four named downsides, three of which are
absent here and one of which (no caching) is *inverted* by a 15-second polling requirement. React
also says outright: "You can continue fetching data directly in Effects if neither of these
approaches suit you." The recommendation is conditional and the conditions are not met. **But
this is the closest call in the document**, a competent senior React developer could reasonably
land the other way, and the verdict is recorded as a toss-up rather than a clean keep.

### Conflict 3: Layer folders vs feature folders has no authoritative resolution
**Position A**: Feature/vertical-slice folders scale better; layer folders scatter a change
across directories. Widely held, no single authoritative source.
**Position B**: Layer folders are fine and conventional at small scale.
**Assessment**: **The community genuinely disagrees and no source settles it.** The verdict here
does not rest on the general debate at all — it rests on two facts local to this repository: the
app has exactly one feature, so a feature folder would name nothing; and the three layer folders
map 1:1 onto the course's three test layers, which is a teaching purpose a feature folder cannot
serve. Anyone applying the general argument to a real multi-feature app should reach the opposite
conclusion, and that is correct.

### Conflict 4: `getByTestId` vs role-based locators
**Position A**: Use role-based locators. — Source: playwright-bdd's own `aiFix` prompt template,
quoted verbatim in §4c of the design document: "Use only role-based locators: getByRole,
getByLabel, etc." and "Strictly rely on the ARIA snapshot of the page." Reputation High (vendor,
first-party).
**Position B**: `data-testid` decouples tests from user-visible copy and is a first-class
Playwright locator (`getByTestId`), widely preferred for exactly that reason.
**Assessment**: **Both are defensible in isolation; the combination in the plan is not.** The plan
enables `aiFix` *and* asserts via `data-testid`, and `data-testid` attributes do not appear in an
ARIA snapshot — so the AI-repair prompt the plan deliberately turns on will show a page
representation in which every assertion target is invisible. §4c argues `aiFix` materially
improves the E2E gate's agent-feedback rating; that improvement is undercut by the locator
choice. Pick either, deliberately, and record the reason.

## Recommendations for Further Research

1. **Run the five checks in Knowledge Gap 1** before folding any of this into the implementation
   plan. Item 3 (frontend typecheck under RPC) is the only one that could flip a verdict, and
   this project's own §4a and §4b are two recorded cases of exactly that happening.
2. **Measure the in-memory integration suite runtime.** §4 of the design document names this a
   "top measurement priority" — the hypothesis that "integration tests are slow" is an artefact
   of Postgres and Docker. Switching the Vitest suite to `:memory:` (recommended above) is the
   strongest form of that experiment and produces a number for the classroom gate table.
3. **Decide the `getByTestId`/`aiFix` question explicitly** and record it, because it sits at the
   intersection of two things the course cares about (E2E gate quality, and accessibility as a
   proxy for testability).
4. **Consider writing the "why not" list into the README.** Four of this document's verdicts are
   restraint decisions (no repository, no TanStack Query, no RPC, no `useSyncExternalStore`). A
   ten-line README section — *"things this app deliberately does not have, and at what size each
   would start to earn its place"* — converts every one of them from a possible wince into
   teaching material, and it is directly on the theme of §3b ("when not to reach for a primitive
   at all"). This may be the single highest-leverage item in the document.

## Full Citations

[1] Hono. "Best Practices". Hono documentation. https://hono.dev/docs/guides/best-practices. Accessed 2026-08-28.
[2] Hono. "Context". Hono documentation. https://hono.dev/docs/api/context. Accessed 2026-08-28.
[3] Hono. "Validation". Hono documentation. https://hono.dev/docs/guides/validation. Accessed 2026-08-28.
[4] Hono. "Exception". Hono documentation. https://hono.dev/docs/api/exception. Accessed 2026-08-28.
[5] Hono. "Testing". Hono documentation. https://hono.dev/docs/guides/testing. Accessed 2026-08-28.
[6] Hono. "RPC". Hono documentation. https://hono.dev/docs/guides/rpc. Accessed 2026-08-28.
[7] Meta / React team. "useEffect — Fetching data with Effects". react.dev. https://react.dev/reference/react/useEffect. Accessed 2026-08-28.
[8] TanStack. "Quick Start". TanStack Query v5 documentation. https://tanstack.com/query/latest/docs/framework/react/quick-start. Accessed 2026-08-28.
[9] Drizzle Team. "SQLite column types". orm.drizzle.team. https://orm.drizzle.team/docs/column-types/sqlite. Accessed 2026-08-28.
[10] Drizzle Team. "Transactions". orm.drizzle.team. https://orm.drizzle.team/docs/transactions. Accessed 2026-08-28.
[11] Vitaliy Potapov. "Playwright-style steps". playwright-bdd documentation. https://vitalets.github.io/playwright-bdd/#/writing-steps/playwright-style. Accessed 2026-08-28.
[12] Cucumber. "Writing better Gherkin". cucumber.io. https://cucumber.io/docs/bdd/better-gherkin/. Accessed 2026-08-28.
[13] Hono contributors. `hono@4.12.18`, `dist/validator/validator.js` lines 8–23. Read from disk at `/home/storm/orca/workspaces/skald/spike-new-design/node_modules/hono/dist/validator/validator.js`. Accessed 2026-08-28.
[14] Drizzle Team. `drizzle-orm@0.45.2`, `sqlite-core/columns/text.d.ts` lines 7–15, 63–72 and `sqlite-core/columns/text.js` lines 26–28. Read from disk at `/home/storm/orca/iniva-academy-web/node_modules/.bun/drizzle-orm@0.45.2+a93e43789d31b71e/node_modules/drizzle-orm/`. Accessed 2026-08-28.
[15] Drizzle Team. `drizzle-orm@0.45.2`, `table.d.ts` lines 26–27 (`$inferSelect` / `$inferInsert`). Same location. Accessed 2026-08-28.
[16] Drizzle Team. `drizzle-orm@0.45.2`, `better-sqlite3/session.d.ts` line 28 (synchronous `transaction<T>(…): T`). Same location. Accessed 2026-08-28.
[17] Hono contributors. "@hono/zod-validator" README and package.json (v0.9.0; peers `hono >=4.11.2`, `zod ^3.25.0 || ^4.0.0`). https://github.com/honojs/middleware/tree/main/packages/zod-validator. Accessed 2026-08-28.
[18] Fowler, Martin. "Repository" and "Domain Model", Patterns of Enterprise Application Architecture catalog. https://martinfowler.com/eaaCatalog/repository.html, https://martinfowler.com/eaaCatalog/domainModel.html. Accessed 2026-08-28. [Published 2002; pattern definitions remain current.]
[19] Bernhardt, Gary. "Boundaries". Destroy All Software / Ruby Conf 2012. https://www.destroyallsoftware.com/talks/boundaries. Accessed 2026-08-28. [Published 2012; concept remains current.]
[20] Hono contributors. RPC monorepo type-inference reports: issues [#3738](https://github.com/honojs/hono/issues/3738), [#1151](https://github.com/honojs/hono/issues/1151), [#4867](https://github.com/honojs/hono/issues/4867), [#4368](https://github.com/honojs/hono/issues/4368); discussions [#2213](https://github.com/orgs/honojs/discussions/2213), [#3489](https://github.com/orgs/honojs/discussions/3489), [#4643](https://github.com/orgs/honojs/discussions/4643). Accessed 2026-08-28.
[21] Internal. `docs/superpowers/plans/2026-08-28-app-baseline.md` (the plan under review) and `docs/course-design-decisions.md` (constraints, §3a, §4, §4a, §4c). Read 2026-08-28.

## Research Metadata

Sources examined: 24 | Cited: 21 | Cross-references performed: 14 | Confidence distribution: High 78%, Medium 22%, Low 0% | Tool failures: 2 (WebFetch against the playwright-bdd docsify SPA returned no content — routed around via raw GitHub markdown; one TanStack Query docs page returned the wrong section — re-fetched at the correct URL). **No execution tool was available this session — see Knowledge Gap 1.** | Output: `docs/research/tooling/app-code-patterns-comprehensive-research.md`
