# Research: Idiomatic React data-fetching and client/server type sharing for a small polled dashboard

**Date**: 2026-08-28 | **Researcher**: nw-researcher (Nova) | **Confidence**: Medium-High | **Sources**: 25

> Independent research. Author was deliberately kept blind to
> `docs/superpowers/plans/2026-08-28-app-baseline.md` (not read, not grepped).
> Context taken only from `docs/course-design-decisions.md`.

## Executive Summary

**The headline: at 200-300 lines, every library the question set asks about loses, and every
hand-written correctness detail wins.** That is not a "keep it simple" reflex — it falls out
of the evidence. TanStack Query, Hono's `hc`, a generated API client and a component-test
suite each solve a real problem, and in each case the problem is one this app does not have,
while the cost (a provider and a second vocabulary; `tsconfig` surface plus an unreadable
`InferResponseType<typeof client.posts[':id']['$get']>` idiom; a codegen ritual; a second
drifting requirement artifact) lands squarely on the reader. Meanwhile the things that *do*
earn their place — `let ignore = false`, `clearInterval`, `key={entry.visitId}`,
`aria-label` per row, `exhaustive-deps` unsuppressed — cost a combined ten lines and are
each straight off react.dev or MDN.

**Three findings are non-obvious and worth acting on regardless of what else is decided.**
(1) react.dev's illustration of the stale-closure effect bug is *itself a `setInterval`
polling loop*, so the app's centrepiece is the canonical example of the canonical React
mistake — which makes `eslint-plugin-react-hooks` load-bearing rather than hygiene.
(2) React's error-boundary documentation states plainly that boundaries do **not** catch
errors in asynchronous code or event handlers, i.e. an error boundary would catch *none* of
this app's realistic failures — the clearest gold-plating call in the set. (3) MDN's rule
that only the **first** element matching a duplicated `id` is labelled means the obvious
first draft of the staff table (`htmlFor="triage"` inside a `.map()`) silently leaves every
row but the first with no accessible name — invalid HTML that renders perfectly, which is
the same shape as the false-confidence trap the course plants on purpose. Doing this
properly is not politeness: unique accessible names are what make `getByRole` work, and
playwright-bdd's own `aiFix` prompt instructs the agent to use role-based locators only.

**Two honest caveats.** The TanStack Query call is genuinely contested — its own maintainer
lists "interval fetching" among the cases where the library still earns its keep, and that
counter-signal is recorded rather than buried. And the `hc` cross-workspace type-inference
question the brief asked to be **tested** was **not tested**: this session had no shell tool.
The conclusion rests on Hono's own "Known issues" documentation plus three field reports, is
labelled Medium-High rather than High, and the exact ten-minute experiment is written out in
Knowledge Gaps.

## The Test Applied to Every Pattern

1. Would a senior developer object to its **absence** in a 200-300 line frontend?
2. Would a senior developer object to its **presence** at this size?

A pattern earns a place only on yes(1) + no(2).

## Recommendation Table

| # | Question | Recommendation | Reason (one line) | Absence objectionable? | Presence objectionable? | Confidence |
|---|----------|----------------|-------------------|:---:|:---:|---|
| 1 | How to poll every 15s | **Hand-rolled `useEffect` + `setInterval` in one named hook (~30 lines)**. No TanStack Query. No `use`/Suspense. | Only 3 of 8 bug classes bite at this size, and all 3 are fixed by 7 lines from react.dev; TanStack's defaults (`staleTime: 0`, `refetchOnWindowFocus: true`, silent 3× retry) actively contradict "live = polling every 15s" and would have to be configured *off* | No | **Yes** | Medium-High |
| 2 | Cancelling in-flight fetch in an effect | **`let ignore = false` + cleanup sets it `true`.** Not `AbortController`. | Still exactly what react.dev teaches, verbatim, in 2026. `ignore` fixes correctness; abort only frees a socket, and costs an extra `AbortError` filter | **Yes** | No | High |
| 3 | Sharing types Hono → React | **Export Zod schemas + `z.infer` types from a leaf `contract.ts`; `import type` in the frontend.** Not `hc`. Not duplicated types. | Same drift protection as `hc` with none of its cost: no project references, no `unknown`-inference class of bug, no `InferResponseType<typeof client[':id']['$get']>` idiom, and the import graph reaches `zod` only — not Drizzle/`better-sqlite3` | **Yes** (vs duplication) | No | Medium-High |
| 4 | Fetch layer | **One ~30-line typed `fetch` wrapper, one exported function per endpoint.** Not inline. Not generated. | `fetch` "does not reject if the server responds with HTTP status codes that indicate errors" (MDN) — the `res.ok` guard must exist in exactly one place, and `res.json()` is `any` at every inline call site | **Yes** | No | Medium |
| 5a | Effect deps | **`eslint-plugin-react-hooks` on, `exhaustive-deps` never suppressed.** Pin the version. | react.dev's own stale-closure example *is* a `setInterval` loop; the rule produces file-line-reason errors — the 77% repair band the course's own thesis is built on | **Yes** | No | High |
| 5b | List keys | **`key={entry.visitId}`.** Never index, never `Math.random()`. | The queue *reorders* by design (cycle-1 feature) and rows hold their own controls — react.dev: index keys "lose any user input inside the list items" | **Yes** | No | High |
| 5c | Loading / error states | **Three states: first-load, ready, ready-but-last-poll-failed.** No skeletons, no toasts. | A failed poll must never blank a patient's queue position; show stale data plus a marker | **Yes** | No | Medium-High |
| 5d | Error boundaries | **Do not add one.** | react.dev: boundaries "do not catch errors for … Event handlers … Asynchronous code" — i.e. neither of this app's real failures. Cost is a lone class component in a hooks codebase, or a dependency | No | **Yes** | High |
| 5e | Per-row form a11y | **`aria-label={\`Triage level for ${entry.name}\`}` on row controls; real `<label htmlFor>` on the standalone arrival form.** | Duplicated `id` in a `.map()` labels only the first row (MDN). And unique accessible names are what make `getByRole`/`getByLabel` work — which playwright-bdd's `aiFix` prompt requires | **Yes** | No | High |
| 6 | Component tests | **No suite. 1-2 tests only, for what E2E cannot reach** (the polling race under fake timers; the failed-poll-keeps-data transition). Leave unwired per decision 12/13. | Fowler/Vocke's rule is reactive — write the lower test when a higher one catches something. Re-asserting Gherkin scenarios in jsdom recreates the two-drifting-artifacts failure decision 5 exists to prevent | No | **Yes** (if a full suite) | Medium-High |

**Net dependency delta for the frontend: zero new runtime dependencies.** Everything
recommended is React, the platform, and one dev-time ESLint plugin.

## Research Methodology

**Search Strategy**: Primary vendor documentation first (react.dev, hono.dev, tanstack.com,
vite.dev, playwright.dev, testing-library.com), MDN and W3C WAI for platform/accessibility
semantics, then targeted GitHub issue/discussion search scoped to `github.com` for field
reports contradicting or qualifying the vendor docs. Verbatim quotes were pulled from
`raw.githubusercontent.com` source markdown where the rendered page risked summarisation
loss (Hono RPC "Known issues").

**Source Selection**: Types: official vendor docs (react.dev, hono.dev, tanstack.com,
vite.dev), technical documentation (MDN), standards body (W3C WAI), industry leaders
(martinfowler.com, github.com). Reputation floor: medium-high. Verification: every
recommendation cross-referenced against at least one source *outside* the vendor whose
product is being recommended for or against.

**Quality Standards**: Vendor-official statements are treated as authoritative-single-source
(sufficient per methodology). Judgement calls are labelled as interpretation and marked
Medium/Medium-High. Two claims are explicitly downgraded for lack of empirical verification.

**Empirical checks**: **None performed — no shell tool was available in this session**
(available tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch). The brief's requested
`hc` cross-workspace probe was **not run**. This is recorded as Knowledge Gap 1 with the exact
experiment. Nothing in this document should be read as measured.

**Blindness discipline**: `docs/superpowers/plans/2026-08-28-app-baseline.md` was not read,
opened or grepped. The other agents' research documents
(`app-code-patterns-comprehensive-research.md`, `backend-patterns-independent-research.md`)
were also deliberately left unread to preserve independence. Repo context is taken only from
`docs/course-design-decisions.md`, which the brief permitted.

## Findings

### Q1. Polling every 15 seconds: hand-rolled vs TanStack Query vs React 19

**Recommendation: hand-rolled `useEffect` + `setInterval`, extracted into one custom hook
(`usePolledQueue`) of roughly 30 lines. Do not add TanStack Query. Do not use `use`/Suspense.**

This is the closest call in the document and the reasoning below deliberately argues the
other side first.

#### 1a. React 19 `use` + Suspense: ruled out on primary evidence, not taste

`use` is the wrong primitive for a *repeating* fetch, and react.dev says so directly.

**Evidence (verbatim, react.dev `use` reference, Pitfall box, accessed 2026-08-28):**

```js
function Albums() {
  // 🔴 `fetch` creates a new Promise on every render.
  const albums = use(fetch('/albums'));
}
```

> "React doesn't preserve state for renders that suspended before mounting. After each
> suspension, React retries rendering from scratch, so any Promise created during render
> is recreated."

React will emit the runtime warning **"A component was suspended by an uncached promise"**.
The documented fix is to create the promise *outside* render — in an event handler, a
route loader, a Server Component, or a module-level `Map` cache. react.dev's own words:

> "The way you cache Promises depends on the framework you use with Suspense. Frameworks
> typically provide built-in caching mechanisms. If you don't use a framework, you can use
> a simple module-level cache like the one above, or a Suspense-enabled data source."

**Analysis.** This app has no framework (Vite SPA, no RSC, no router loaders). Using `use`
would therefore require hand-writing a module-level promise cache *and* a cache-busting
key that changes every 15 seconds *and* a `startTransition` to avoid the fallback
re-flashing on each poll. That is strictly more machinery than `setInterval`, and it is
machinery the audience would have to reverse-engineer. **React 19 Actions / `useActionState`
are also not relevant here** — they are documented for *form submission and mutation*
pending state, not for read polling; they would apply, if at all, to the staff view's
forms (see Q5).

**Sources**: [react.dev — `use`](https://react.dev/reference/react/use) — Accessed 2026-08-28 (High, official).
**Confidence**: High.

#### 1b. What bugs does the hand-rolled version *actually* have?

The honest list, separated into "real here" and "real but not here". This matters because
the pro-TanStack argument is usually made with the whole list undifferentiated.

| # | Bug class | Real in *this* app? | Cost to fix by hand |
|---|-----------|---------------------|---------------------|
| 1 | **Out-of-order responses** — a slow response overwrites a fresh one | **Yes.** A 15s poll over a proxy genuinely can overlap | 3 lines: `let ignore = false` + cleanup (Q2) |
| 2 | **Interval leaks on unmount / StrictMode double-mount** — two intervals, doubled traffic in dev | **Yes**, and it is visible in the dev Network tab, which a senior reader *will* open | 1 line: `return () => clearInterval(id)` |
| 3 | **Loading flash on every tick** — `setLoading(true)` each poll blanks the screen every 15s | **Yes — and this is the bug that actually ruins the demo.** It is the classic hand-rolled polling defect | 1 condition: only show the spinner when there is no data yet |
| 4 | **Stale closure** — the interval callback captures render-0 state | **No**, provided the effect body only *writes* state from the response and never *reads* state. Keep it that way. It becomes real the moment someone reads state inside the tick | Avoid by construction, or `useRef`/functional `setState` |
| 5 | **Overlapping in-flight requests** if a fetch exceeds 15s | Marginal. Bounded, self-healing, and mitigated by #1 | Ignore, or poll with recursive `setTimeout` |
| 6 | **No request dedupe** across components | **No.** One consumer, one endpoint | n/a |
| 7 | **No cache / refetch on remount** | **No.** Single-screen SPA; a remount *should* refetch | n/a |
| 8 | **No retry/backoff on transient failure** | Marginal — the next tick is 15s away and is itself the retry | Free |

**The decisive observation: bugs 1-3 are the only ones that bite, and all three are fixed
by seven lines that are already on react.dev.** Bugs 4-8 — the ones TanStack Query is
genuinely, uniquely good at — are the ones a single-endpoint single-screen app does not
have. TanStack Query would be bought almost entirely to solve problems this app does not
possess.

#### 1c. The specific case *against* TanStack Query here, on evidence

Three concrete costs, all from TanStack's own documentation:

**(i) Its defaults contradict the thing the app is meant to demonstrate.** Verbatim from
TanStack Query's `useQuery` reference and Important Defaults (accessed 2026-08-28):

> `staleTime` — "Defaults to `0`."
> `refetchOnWindowFocus` — "Defaults to `true`. If set to `true`, the query will refetch on
> window focus if the data is stale."
> Important Defaults: "Stale queries are refetched automatically in the background when:
> New instances of the query mount, The window is refocused, The network is reconnected."

The course is teaching *"live means polling every 15 seconds"* (`docs/course-design-decisions.md`
§3a constraint 3). With TanStack Query's defaults, the app also refetches on every
window focus, every remount and every reconnect. A student alt-tabbing back and seeing an
instant update learns the wrong lesson about what mechanism is running. You can suppress
it (`refetchOnWindowFocus: false, staleTime: 15_000`), but now you are writing
configuration to *disable* library behaviour — the clearest possible signal that the
library is not being used for what it is for.

**(ii) It adds a provider, a client singleton and a second vocabulary.** `QueryClient`,
`QueryClientProvider`, `queryKey`, `queryFn`, `isPending` vs `isLoading` vs `isFetching`,
`gcTime`, `staleTime`, `placeholderData`. In a 250-line frontend that is a second mental
model larger than the app.

**(iii) Silent retry changes failure semantics.** Verbatim: *"Queries that fail are silently
retried 3 times, with exponential backoff delay."* For a course that is explicitly about
**gate output and error legibility** (`docs/course-design-decisions.md` §4 "gates serve two
masters"), a layer that silently swallows the first three failures is working against the
teaching goal.

#### 1d. The honest case *for* TanStack Query — stated fairly

The library's own maintainer names our exact use case. Dominik Dorfmeister (TkDodo),
TanStack Query maintainer, in "You Might Not Need React Query", lists the scenarios where
it stays valuable: **"infinite scrolling lists, offline functionality, interval fetching,
and smart auto-refetches."** *Interval fetching is on that list.* That is a real
counter-signal from the most authoritative possible source and it is recorded here rather
than buried.

It also genuinely wins on one behaviour: with `refetchInterval` set,
`refetchIntervalInBackground` defaults to false, so **polling stops when the tab is
hidden**. A hand-rolled `setInterval` keeps running — though MDN documents that browsers
throttle it anyway:

> "Firefox Desktop has a minimum timeout of 1 second for inactive tabs. … Chrome …
> **Intensive throttling** … Timers in this state are checked once per minute."
> — [MDN, `setTimeout`, "Timeouts in inactive tabs"](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout), accessed 2026-08-28

So the real-world difference is "hidden tab polls once a minute" vs "hidden tab polls not
at all". For a classroom demo on a visible tab, that is not a difference.

#### 1e. Senior-reviewer test

1. **Would a senior object to TanStack Query's absence?** *No* — provided the hand-rolled
   version demonstrably handles bugs 1-3. A reviewer objects to a *naive* `useEffect`
   fetch, not to a correct one. The objection they raise is about the bugs, not about the
   missing package.
2. **Would a senior object to its presence?** *Plausibly yes.* A `QueryClientProvider`
   wrapping a single `useQuery` against one endpoint, with two options set to turn its
   defaults back off, in a 250-line app, is exactly the shape of cargo-culting the brief
   warns about.

**Verdict: hand-rolled, but extracted into a named custom hook** so the correctness work is
visible and reusable rather than smeared through a component. **Confidence: Medium-High** —
the mechanical facts are High-confidence and officially sourced; the judgement call is
genuinely contested (see 1d and the Conflicting Information section).

#### 1f. Recommended code

```tsx
// src/usePolledQueue.ts
import { useEffect, useState } from 'react'

type State<T> =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; data: T; stale: boolean }

const POLL_MS = 15_000

export function usePolled<T>(load: (signal?: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<State<T>>({ status: 'loading' })

  useEffect(() => {
    let ignore = false                                  // Q2: react.dev's pattern

    async function tick() {
      try {
        const data = await load()
        if (!ignore) setState({ status: 'ready', data, stale: false })
      } catch (e) {
        if (!ignore) {
          // Keep showing the last good data; just mark it stale.  Never blank
          // the screen on a failed poll.
          setState(prev =>
            prev.status === 'ready'
              ? { ...prev, stale: true }
              : { status: 'error', error: (e as Error).message })
        }
      }
    }

    tick()                                              // fire immediately, then every 15s
    const id = setInterval(tick, POLL_MS)
    return () => {
      ignore = true
      clearInterval(id)                                 // survives StrictMode double-mount
    }
  }, [load])

  return state
}
```

Three properties worth pointing at in the room: `ignore` (race), `clearInterval` (leak),
and the `stale` flag instead of a loading state on re-poll (no 15-second flash). Those are
bugs 1, 2 and 3. `load` must be a stable reference — a module-level function, not an inline
arrow — which is itself the effect-dependency lesson from Q5.

### Q2. Cancelling in-flight fetches in an effect — current react.dev guidance

**Answer: the boolean flag is still exactly what react.dev teaches. It has not been
superseded by `AbortController`. react.dev calls the variable `ignore`, not `cancelled`.**

**Evidence (verbatim, react.dev `useEffect` reference, "Fetching data with Effects",
accessed 2026-08-28):**

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

> "Note the `ignore` variable which is initialized to `false`, and is set to `true`
> during cleanup. This ensures your code doesn't suffer from 'race conditions':
> network responses may arrive in a different order than you sent them."

And on the async/await variant, verbatim:

> "You can also rewrite using the `async` / `await` syntax, **but you still need to
> provide a cleanup function**."

**Source**: [react.dev — `useEffect`](https://react.dev/reference/react/useEffect) — Accessed 2026-08-28. Reputation: High (official).

**No `AbortController` in react.dev's data-fetching guidance.** Searching the official
`useEffect` reference, `Synchronizing with Effects`, and `You Might Not Need an Effect`
pages surfaces no `AbortController`-based fetch-cancellation recommendation. The
official docs teach ignoring a stale result, not aborting the request.

**Analysis — why `ignore` and not `abort`, and what it means for this app.** They solve
different problems. `ignore` fixes the *correctness* bug (out-of-order responses
overwriting fresher state). `AbortController` additionally frees the *socket* — a
bandwidth/connection optimisation. For a 15-second poll of a ~1KB JSON payload on a
localhost dev proxy in a classroom, the socket saving is worth nothing and the
correctness fix is worth everything. Note also that aborting turns the promise into a
rejection you must then filter (`if (err.name !== 'AbortError')`), i.e. `AbortController`
is *more* code than `ignore`, not less. That is the wrong trade at this size.

**Senior-reviewer test**
1. Object to its absence? **Yes.** A `useEffect` fetch with no cleanup at all is the
   single most-flagged React review comment. It must be there.
2. Object to its presence? **No.** It is three lines and it is literally the code on
   react.dev.

**Caveat to state honestly in the code:** react.dev also documents the downsides of
fetching in Effects at all (see Q1) — the docs endorse the pattern's *shape* while
recommending you eventually not hand-roll it.

**Confidence**: High (official primary source, quoted directly).

### Q3. Sharing types between Hono backend and React frontend in an npm workspace

**Recommendation: export the Zod schemas and their `z.infer`'d types from the backend
package, and `import type` them in the frontend. Do not use `hc`. Do not hand-duplicate.**

> **Methodology flag, stated up front.** The brief asked for this to be tested empirically
> in a scratch workspace. **This session had no shell tool available** (tools were
> Read/Write/Edit/Glob/Grep/WebSearch/WebFetch only), so the probe was **not run**. What
> follows is documentary evidence plus mechanical reasoning, and it is labelled as such.
> The specific unrun experiment is recorded in Knowledge Gaps with the exact commands to
> run — it is a ~10-minute check and it should be run before building.

#### 3a. Option A — hand-written duplicated types on the client: **reject**

The only option with a *correctness* failure mode. The backend already owns a Zod schema;
a second hand-maintained `interface QueueEntry` on the client silently drifts the moment
someone renames a field. Nothing catches it — Vite does not typecheck across the wire, and
`tsc` cannot compare two unrelated declarations. Worse for this audience: the course's own
central argument (`docs/course-design-decisions.md` §4a) is that a typo should be a `tsc`
error in the 77% name-error repair band rather than a runtime failure in the 45% assertion
band. Duplicated client types push the contract *back* into the assertion band. Rejecting
this is the one uncontroversial call in the document.

- Object to its absence? n/a. Object to its presence? **Yes, strongly.**

#### 3b. Option C — Hono's `hc` typed RPC client: **works, but does not earn its place**

Verified facts about `hc`, all from Hono's own documentation (`docs/guides/rpc.md`,
accessed 2026-08-28):

**What must be exported from the backend.** The app type, and the routes must be *chained*:

```ts
const routes = app.route('/authors', authors).route('/books', books)
export type AppType = typeof routes
```

> "A simple way to do this is to chain the handlers so that the types are always inferred."

**Documented failure modes (verbatim / near-verbatim from the "Known issues" section):**

| Constraint | Hono docs say |
|---|---|
| `strict` mode | Both client and server `tsconfig.json` must set `"strict": true` |
| Hono version match | "When backend and frontend codebases are separate, ensure both use identical Hono versions." Mismatch produces *"Type instantiation is excessively deep and possibly infinite."* |
| Project references | "For separated backend/frontend architectures, implement TypeScript project references to allow the frontend to access backend code like `AppType`." |
| IDE performance | "When implementing RPC with numerous routes, IDE responsiveness can degrade significantly … massive amounts of type instantiations are executed to infer the type of your app." |
| Recommended mitigation | Pre-compile: `export type Client = ReturnType<typeof hc<typeof app>>` + `hcWithType` wrapper, because "tsc can do heavy tasks like type instantiation at compile time" |
| Silent inference loss | Handlers written as `.then()` promise chains **lose response type inference and become `unknown`**. `async`/`await` required |
| Route definition style | Routes not chained via `.route()`, or handlers detached from the exported app instance, leave client types `unknown` |

**Source**: [Hono — RPC guide](https://hono.dev/docs/guides/rpc) and its source at
[honojs/website `docs/guides/rpc.md`](https://raw.githubusercontent.com/honojs/website/main/docs/guides/rpc.md) — Accessed 2026-08-28. Reputation: High (official vendor docs).

**Two of these are not problems here, and I say so plainly:**
- *Version mismatch* is **automatically satisfied** by a single npm workspace: npm hoists
  one `hono` to the root `node_modules`, so both packages resolve the same install. This is
  a genuine point in `hc`'s favour that the docs' warning does not apply to us.
- *IDE performance* is a "numerous routes" problem. With ~5 endpoints it will not bite.

**But the field evidence across a package boundary is bad**, and this is the part that
matters:

- [honojs/hono issue #4003 — "Cannot get type for a hono/client in a different package"](https://github.com/honojs/hono/issues/4003)
  (opened 2025-03-16, since closed): `AppType` exported from the API package, imported into
  a separate `api-client` package, and **the resulting client typed as `unknown`** despite
  the import resolving. No documented resolution in the thread.
- [honojs discussion #4643 — "Struggling to reuse Hono RPC types in client-side components"](https://github.com/orgs/honojs/discussions/4643)
  (2026-01-22 → 2026-08-06, Turborepo + React + Hono): the author had `hc` working and
  *still* ended up with "fragile local TypeScript duplicates", because naming a response
  type for a child component's props is not obvious. The accepted answer, eight months
  later, is:

  ```ts
  type PostWithComments = InferResponseType<typeof client.posts[':id']['comments']['$get']>
  ```

**That last line is the answer to "how comprehensible is the resulting code to someone
reading it cold?"** — and the answer is: not very. Indexing a client object by a literal
route segment and an HTTP-method-shaped `$get` key, inside a generic utility type, in order
to name the type of a table row, is a genuinely difficult expression for a mixed room to
read. It is also *not optional*: the moment the app has a `<QueueRow entry={...}>` child
component — which it will — someone has to write a `props` type, and with `hc` that is the
only non-duplicating way to get one.

**A third field report matters more than the other two for *this* repo:**
[honojs/hono issue #3450 — "RPC tries to import server-side database code into the client
and make svelte crash"](https://github.com/honojs/hono/issues/3450) (opened 2024-09-25,
closed, labelled *"not bug"*). Server-side database code was pulled into the browser bundle,
crashing the client. An EdgeDB employee on the thread suspected *"whatever the runtime or
bundler is doing (Bun? Vite?) is causing server code to be executed (bundled?) into the
browser."*

That is **avoidable** — it was a *value* import, and `import type` plus `verbatimModuleSyntax`
prevents it. But note what the exported `AppType` points at: the whole route tree, whose
module graph in this repo reaches **Drizzle and `better-sqlite3`, a native module**
(`docs/course-design-decisions.md` §4a). The blast radius of one accidentally non-type import
is a native binary in a browser bundle, and the failure would land during class. A 250-line
teaching app should not be carrying that foot-gun to buy URL-string autocomplete for five
endpoints. The recommended Option B narrows the surface to a single leaf module
(`contract.ts`) that imports nothing but `zod`.

Reputation note: these are GitHub issue/discussion threads (medium-high, `github.com`),
used here as *field reports of known failure modes*, cross-referenced against Hono's own
docs which independently document the same fragility ("leaving client types `unknown`").

**Cost in `tsconfig` setup.** Hono recommends project references. Colin Hacks (author of
Zod) surveys this exact problem in
[colinhacks/live-typescript-monorepo](https://github.com/colinhacks/live-typescript-monorepo)
and says of the approach Hono recommends: *"Use TypeScript project references to link
packages together. This has a lot of downsides and doesn't play nice with `node` or other
tooling out of the box."* His recommended alternative is custom export conditions plus
`customConditions` in `tsconfig.json` — which is *more* configuration, not less. Either way
this is real `tsconfig` surface area in an app whose stated constraint is failsafe setup.

- Object to `hc`'s absence? **No** — a shared Zod contract gives the same drift protection.
- Object to `hc`'s presence? **Marginally yes** — it is the "generated API client" shape the
  brief warns about, it adds `tsconfig` surface, and its downstream idiom is unreadable cold.

#### 3c. Option B (recommended) — share the Zod schemas from the backend package

The backend already has Zod (fixed decision). The schema *is* the contract; deriving the
type from it is one line and costs nothing extra.

**Backend — `packages/api/src/contract.ts`:**

```ts
import { z } from 'zod'

export const TriageLevel = z.enum(['red', 'orange', 'yellow', 'green', 'blue'])

export const QueueEntry = z.object({
  visitId: z.string(),
  name: z.string(),
  triage: TriageLevel,
  arrivedAt: z.string().datetime(),
  position: z.number().int().positive(),
  estimatedWaitMinutes: z.number().int().nonnegative(),
})

export const Queue = z.object({ entries: z.array(QueueEntry), now: z.string().datetime() })

export type TriageLevel = z.infer<typeof TriageLevel>
export type QueueEntry  = z.infer<typeof QueueEntry>
export type Queue       = z.infer<typeof Queue>
```

**Backend — `packages/api/package.json` (the whole trick, three lines):**

```jsonc
{
  "name": "@legevakt/api",
  "type": "module",
  "exports": {
    "./contract": "./src/contract.ts"   // points at SOURCE, not dist
  }
}
```

**Frontend — one import, and it reads exactly like what it is:**

```ts
import type { Queue, QueueEntry, TriageLevel } from '@legevakt/api/contract'
```

**Why this needs no build step (mechanism, and what to verify).** npm workspaces symlink
`packages/api` into the root `node_modules/@legevakt/api`. With `moduleResolution` set to
`bundler` (or `node16`/`nodenext`), TypeScript follows `exports` and lands on the `.ts`
source, so `tsserver` and `tsc --noEmit` both see live types with zero compilation. This
"point `exports` at source" convention is the one discussed in
[microsoft/TypeScript issue #51750](https://github.com/microsoft/TypeScript/issues/51750)
("Establish a package.json convention for TypeScript source in monorepos"), where the
recorded finding is that *"the top-level `types` field can be `.ts` and not just `.d.ts`"*
and that pointing exports at source *"allows your package to be used internally without
project references or a TypeScript build step."*

At runtime nothing crosses the boundary at all, because the import is type-only and Vite
erases it. Vite's own docs, verbatim: **"Vite only performs transpilation on `.ts` files and
does NOT perform type checking."** Its guidance to *"use the dedicated syntax
(`import type { T } from 'module'`) to prevent type-only imports from being incorrectly
bundled"* is exactly what the recommendation above does. So the frontend bundle contains no
backend code, and the contract costs zero bytes shipped.
**Source**: [Vite — Features / TypeScript](https://vite.dev/guide/features.html) — Accessed 2026-08-28 (High, official).

**Where it *would* cost a build step, and how to avoid it:** if the frontend imported the
Zod *values* (e.g. `QueueEntry.parse(json)` on the client) rather than only the types, then
`@legevakt/api/contract` becomes a real runtime dependency and Vite must transpile a file
outside the frontend's own root. That still works (Vite handles linked workspace deps), but
it drags Zod into the client bundle. **Recommendation: import types only. Do not validate on
the client** — the server already validated, and client-side re-validation of your own
server's response is textbook gold-plating at this size.

- Object to its absence? **Yes** — the alternative is drifting duplicates (3a).
- Object to its presence? **No.** It is one `exports` entry and one `import type` line.

**Confidence**: Medium-High. The Hono `hc` facts are High (official docs, quoted). The
"no build step needed" mechanism is well-attested in TypeScript's own issue tracker and is
standard practice, but **it was not executed in this session** — see Knowledge Gaps.

---

### Q4. Fetch layer shape

**Recommendation: one thin typed `fetch` wrapper module (~30 lines, one exported function
per endpoint). Not inline `fetch` in components. Not a generated client.**

**Inline `fetch` in components — reject.** With 5 endpoints and both a patient and a staff
view, URL strings and `res.json()` casts scatter across every component. Two concrete harms
a senior reader would flag: (i) `res.json()` returns `any`, so every inline call site is an
unchecked type assertion, silently defeating the whole point of Q3; (ii) `fetch` does not
reject on 4xx/5xx — the `res.ok` check has to be repeated at every call site, and the one
place it is forgotten is the bug. Centralising both is the entire justification.

**Generated client (openapi-typescript, `@hono/zod-openapi` + codegen) — reject.** It
requires an OpenAPI document, a generation step, generated output committed or gitignored,
and a "regenerate after changing the backend" ritual. For 5 endpoints, in a repo whose
declared constraint is *"install deps + run one command"*, this is the clearest
over-engineering case in the whole brief. It also directly contradicts
`docs/course-design-decisions.md` §7's "few ways to fail".

**Recommended shape — `src/api.ts`:**

```ts
import type { Queue, TriageLevel } from '@legevakt/api/contract'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const getQueue = () =>
  fetch('/api/queue').then(json<Queue>)

export const getVisit = (id: string) =>
  fetch(`/api/visits/${id}`).then(json<VisitView>)

export const registerArrival = (body: { name: string; triage: TriageLevel }) =>
  fetch('/api/visits', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then(json<QueueEntry>)
```

Everything a reviewer wants is visible in one screen: every URL, the `res.ok` guard in
exactly one place, and the response type named at each boundary. The `as Promise<T>` is the
single unchecked assertion in the codebase and it is worth being honest about that in a
comment — it is the seam where the Q3 contract is asserted rather than proven.

- Object to a wrapper's absence? **Yes** — scattered URLs and repeated `res.ok` is the
  most common React review comment after missing effect cleanup.
- Object to its presence? **No** — 30 lines with no abstraction, no class, no interceptors,
  no base-URL config object. Adding any of those *would* draw the objection.

**Confidence**: Medium — this is a judgement synthesised from the primary sources above
plus the `fetch` semantics documented at
[MDN — `fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch) (High,
accessed 2026-08-28), which states that the promise *"does not reject on HTTP error status
even if the response is an HTTP 404 or 500"*. No single source prescribes "wrapper module"
as doctrine; it is the consensus shape rather than a cited rule.

### Q5. Component patterns a senior reviewer would flag

Split into **must do** (a reviewer objects to the absence) and **must not do** (a reviewer
objects to the presence).

#### 5a. Effect dependency correctness — **MUST DO**, and it is free

react.dev's own illustration of the failure is *literally a `setInterval` polling loop*,
which makes this directly load-bearing for Q1. Verbatim from
[react.dev — Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies)
(accessed 2026-08-28):

```js
function Timer() {
  const [count, setCount] = useState(0);
  const [increment, setIncrement] = useState(1);

  function onTick() {
    setCount(count + increment); // Uses old values!
  }

  useEffect(() => {
    const id = setInterval(onTick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 🔴 BAD: count and increment are missing
}
```

> "Suppressing the linter with `eslint-disable-next-line react-hooks/exhaustive-deps` is
> dangerous and leads to bugs."
> "**every reactive value used by your Effect must be declared in its dependency list**. You
> don't choose what goes in the dependency list — the code determines it."

**The minimum a skilled reader expects:** `eslint-plugin-react-hooks` installed and its
`exhaustive-deps` rule **on and not suppressed anywhere in the repo**. A single
`eslint-disable` comment next to a polling effect is, on this evidence, the highest-signal
red flag in the entire frontend — and this audience will spot it.

**This is also the strongest alignment with the course's own thesis.** Per
`docs/course-design-decisions.md` §4, the argument for strict typing is the 45%→77%
repair-band shift: errors that name a file, line and reason are repairable, errors that say
"the scenario failed" are not. `exhaustive-deps` produces exactly a file-line-reason error
for the single most common React defect class. It is a *gate*, it is nearly free, and it
belongs in the gate catalogue.

**Version caveat (flag, do not assume).** The current
[`eslint-plugin-react-hooks` reference on react.dev](https://react.dev/reference/eslint-plugin-react-hooks)
(accessed 2026-08-28) documents a `recommended` preset that now carries a much larger rule
set including `set-state-in-effect`, `purity`, `immutability` and `preserve-manual-memoization`,
and lists the version as **`rc`**. Two consequences: (i) pin the version exactly, per the
failsafe-setup constraint; (ii) **verify empirically whether `set-state-in-effect` fires on
the polling hook in Q1f** — it should not (the `setState` occurs in an async continuation,
not synchronously during the effect body), but a compiler-driven rule set at RC quality
that lights up red on the app's centrepiece hook would be a bad classroom surprise. Recorded
in Knowledge Gaps.

#### 5b. List keys — **MUST DO**, one line

Verbatim from [react.dev — Rendering Lists](https://react.dev/learn/rendering-lists):

> "Keys must be unique among siblings." "**Keys must not change** or that defeats their
> purpose! Don't generate them while rendering."
> "You might be tempted to use an item's index in the array as its key. … But the order in
> which you render items will change over time if an item is inserted, deleted, or if the
> array gets reordered. Index as a key often leads to subtle and confusing bugs."
> "Similarly, do not generate keys on the fly, e.g. with `key={Math.random()}`. This will
> cause keys to never match up between renders, leading to all your components and DOM being
> recreated every time. Not only is this slow, but it will also lose any user input inside
> the list items."

**This domain is the textbook case where index keys break.** The queue *reorders* — that is
the entire cycle-1 feature ("an urgent (red) arrival jumps the queue"). With
`key={index}`, React reuses row 0's DOM for a different patient. And the staff table has
**a control per row** (re-triage select, "done" button), so react.dev's specific warning —
*"it will also lose any user input inside the list items"* — is not hypothetical: a half-set
`<select>` value would jump to the wrong patient mid-poll.

Use `key={entry.visitId}`. It costs nothing and the app is *designed* to demonstrate the
bug that index keys cause.

#### 5c. Error and loading states — **MUST DO**, but as three states, not a spinner

The minimum: the patient view must distinguish (i) first load, (ii) loaded, (iii) *loaded
but the last poll failed*. The third is the one hand-rolled polling apps get wrong, and it is
the one this app most needs, because a failed poll on a queue display must **not** blank the
patient's position. See the `stale` flag in Q1f. Rendering "Updated 47 seconds ago" or a
subtle "reconnecting" marker is honest UI and costs one line.

Gold-plating to avoid: skeleton loaders, shimmer, toast notification libraries, retry
buttons with backoff UI.

#### 5d. Error boundaries — **DO NOT ADD.** This is the clearest gold-plating call

The decisive fact is from react.dev's `Component` reference itself (accessed 2026-08-28):

> "**Error boundaries do not catch errors for:** Event handlers … Server side rendering …
> Errors thrown in the error boundary itself … **Asynchronous code (e.g. `setTimeout` or
> `requestAnimationFrame` callbacks)**"

> "There is currently no way to write an Error Boundary as a function component. However,
> you don't have to write the Error Boundary class yourself. For example, you can use
> `react-error-boundary` instead."

**Put together: an error boundary would not catch this app's only realistic error.** A failed
poll is asynchronous; a failed form submit is an event handler. Both are explicitly outside
what an error boundary catches, and both are already handled in component state. What is
left is render-time crashes — and the cost of covering them is either **a class component,
the only one in an otherwise all-hooks 250-line codebase**, or **an extra npm dependency**.

- Object to its absence? **No** — a reviewer who reads the async caveat agrees it catches
  nothing here.
- Object to its presence? **Yes** — a lone `class ErrorBoundary extends React.Component`
  with `getDerivedStateFromError` in a hooks-only teaching app is precisely the
  cargo-cultable artefact the brief warns about, and students will copy it.

*Dissent recorded:* a reviewer could reasonably say a top-level boundary is cheap insurance
against a white screen in front of a room. If you want that insurance, the honest cheap
version is a `try`/`catch` around the render of the list, not a boundary class.

#### 5e. Form accessibility with a control per table row — **MUST DO**, and the trap is real

This is the sharpest technical trap in the question set, and MDN names it exactly.

Verbatim from [MDN — `<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label)
(accessed 2026-08-28):

> "The first element in the document with an `id` attribute matching the value of the `for`
> attribute is the *labeled control* for this `label` element … **If there are other elements
> that also match the `id` value, later in the document, they are not considered.**"

> "Generally, we recommend using explicit association with the `for` attribute, to ensure
> compatibility with external tools and assistive technologies."

And [W3C WAI — Labeling Controls](https://www.w3.org/WAI/tutorials/forms/labels/):

> "Whenever possible, use the `label` element to associate text with form elements explicitly.
> The `for` attribute of the label must exactly match the `id` of the form control."

Labels can be visually hidden where a visible one is undesirable, but "it still needs to be
provided within the code to support other forms of presentation and interaction, such as for
screen reader and speech input users." `aria-label` and `aria-labelledby` are listed as
supported alternatives, with the caveat that "the information is not conveyed to visual users."

**The trap:** the natural first draft is `<label htmlFor="triage">` + `<select id="triage">`
inside a `.map()`. That produces N duplicate `id="triage"` attributes; per MDN only the
**first row** is labelled, and the other rows' `<select>` elements have no accessible name.
Nothing visibly breaks. It is invalid HTML that renders fine — the exact class of defect a
green test suite misses, which is thematically the same trap the course plants deliberately
in §3a.

**Recommended shape.** In a table row, the column header already carries the *what*; the
control needs the *which*. So give each control an accessible name that includes the patient,
via `aria-label`, and skip `<label>`/`id` entirely for per-row controls:

```tsx
<tbody>
  {queue.entries.map(entry => (
    <tr key={entry.visitId}>
      <th scope="row">{entry.name}</th>
      <td>{entry.position}</td>
      <td>
        <select
          aria-label={`Triage level for ${entry.name}`}
          value={entry.triage}
          onChange={e => retriage(entry.visitId, e.target.value as TriageLevel)}
        >
          {TRIAGE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </td>
      <td>
        <button onClick={() => complete(entry.visitId)}>
          Mark done<span className="sr-only"> for {entry.name}</span>
        </button>
      </td>
    </tr>
  ))}
</tbody>
```

The *arrival form* is a different case — it is a normal standalone form, so it gets real
`<label htmlFor>`/`id` pairs with visible text.

**Bonus, and it is not a small one:** unique accessible names per row are exactly what makes
`getByRole('combobox', { name: /Triage level for Kari/ })` work. Playwright's own best
practices, verbatim: *"Use `getByRole()` and `getByLabel()` instead of CSS selectors or
XPath … These locators are resilient to DOM changes."* And playwright-bdd's built-in
`aiFix` prompt (recorded in `docs/course-design-decisions.md` §4c) instructs the agent:
*"Use only role-based locators: getByRole, getByLabel, etc."* **Accessible names are
therefore load-bearing infrastructure for this repo's E2E layer and its agent-repair story,
not a checkbox.** That is a strong, non-obvious, repo-specific reason to do 5e properly, and
it is the finding I would most want carried forward.

**Confidence**: High (MDN + W3C WAI, two independent high-reputation sources, plus
Playwright vendor docs for the downstream consequence).

---

### Q6. Frontend component tests when Playwright E2E already exists

**Recommendation: no component test *suite*. Ship one or two component tests as a worked
example only, explicitly labelled as such, and leave the layer unwired — consistent with
decision 12/13's "gate catalogue, unwired".**

**The rule that decides it**, verbatim from Ham Vocke, "The Practical Test Pyramid",
martinfowler.com (published 2018-02-15, revised 2018-02-26):

> "If a higher-level test spots an error and there's no lower-level test failing, you need to
> write a lower-level test."
> "Push your tests as far down the test pyramid as you can."
> "every single test in your test suite is additional baggage and doesn't come for free"

Read carefully, that is a **reactive** rule, not a coverage mandate: you add the lower test
when a higher test catches something the lower layer missed. It does not license writing a
component-test suite up front for behaviour E2E already covers. And in a **pre-built app
that students never extend architecturally**, that trigger will essentially never fire before
the course.

Note the symmetry with the other two vendors: Testing Library's guiding principle is *"The
more your tests resemble the way your software is used, the more confidence they can give
you"* — and in a 250-line app whose UI is a table and a form, **Playwright resembles real
usage strictly more closely than jsdom does.** Testing Library's own north star therefore
points *away* from duplicating those flows in jsdom.

**Where the line actually is — three tests that E2E genuinely cannot reach cheaply:**

1. **The polling hook's race handling.** With fake timers you can assert that an out-of-order
   slow response does not overwrite a fresh one. E2E cannot force that interleaving without
   flakiness — which is precisely the failure mode `docs/course-design-decisions.md` §3a
   forbids ("this domain's natural failure mode is flaky tests, which would discredit the BDD
   layer in front of the room"). **This one is worth writing.**
2. **The "failed poll keeps last good data" state transition** (5c). Trivial in Vitest with a
   mocked `load`, awkward in E2E because you must make a real endpoint fail mid-scenario.
3. **Pure derivations** — the wait-estimate formula and the ordering comparator. But per
   §3a constraint 1 the estimate is a *defined function*, and it belongs on the **backend**,
   where it is a plain unit test with no React involved. Do not pull it into the frontend to
   justify a frontend test layer.

Everything else — "an arrival appears in the table", "re-triage reorders the queue", "the
patient sees position 3" — is domain acceptance criteria, is already Gherkin, and duplicating
it in jsdom would be a second drifting requirement artifact. That is the *exact* failure mode
decision 5 was made to avoid ("Gherkin-native … avoids the classic BDD failure of two
drifting requirement artifacts"). **Rewriting acceptance criteria as component tests
reintroduces it through the back door.**

**The counter-argument, stated fairly.** Vocke's cost argument runs the other way too: E2E is
the slowest and most brittle layer, and per the gate research an E2E failure is a degenerate
assertion error (~45% agent repair band) while a focused component-test failure names the
component. For *agent feedback quality*, component tests are strictly better. Two things blunt
it here: `aiFix` materially improves E2E's agent signal (§4c), and the app is pre-built, so
agents are not iterating on this frontend during the course.

**Senior-reviewer test**
1. Object to the absence of a component-test suite? **No** — given E2E exists and the app is
   250 lines and frozen. A reviewer would object to *zero* frontend tests of the polling hook.
2. Object to its presence? **Yes, if it is a full suite** re-asserting the Gherkin scenarios.
   No, if it is 1-2 tests aimed at what E2E cannot reach.

**Confidence**: Medium-High. The pyramid/duplication rule is well-sourced and cross-checked
against two vendor sources pointing the same way, but the 2018 publication date means it is
cited as an evergreen methodology reference (per source-freshness rules) rather than current
reporting.

## Empirical Probe Results

**None. The probe was not run.**

The brief asked for the `hc` cross-workspace type-inference question to be settled by
experiment in `/tmp/.../scratchpad/frontend-probe`. **No shell/Bash tool was exposed to this
session**, so no workspace could be created and no `tsc` could be invoked. Rather than
silently substitute reading for measurement — which is the exact failure mode
`docs/course-design-decisions.md` §4a and §4b were written to warn about — this is reported
as a failure. The Q3 recommendation is therefore **documentary, not measured**, and is rated
Medium-High rather than High.

The experiment is specified in full in Knowledge Gap 1 so it can be run in ten minutes by
anyone with a terminal.

## Source Analysis

| Source | Domain | Reputation | Type | Access Date | Cross-verified |
|--------|--------|------------|------|-------------|----------------|
| react.dev — `useEffect` | react.dev | High (1.0) | Official vendor | 2026-08-28 | Y (Q1, Q2, Q5a) |
| react.dev — `use` | react.dev | High (1.0) | Official vendor | 2026-08-28 | Y |
| react.dev — Rendering Lists | react.dev | High (1.0) | Official vendor | 2026-08-28 | Y |
| react.dev — Removing Effect Dependencies | react.dev | High (1.0) | Official vendor | 2026-08-28 | Y |
| react.dev — `Component` (error boundaries) | react.dev | High (1.0) | Official vendor | 2026-08-28 | N (single authoritative) |
| react.dev — `eslint-plugin-react-hooks` | react.dev | High (1.0) | Official vendor | 2026-08-28 | N (single authoritative; version `rc`) |
| Hono — RPC guide (rendered) | hono.dev | High (1.0) | Official vendor | 2026-08-28 | Y (against raw source) |
| Hono — `docs/guides/rpc.md` (raw source) | raw.githubusercontent.com / honojs | High (1.0) | Official vendor source | 2026-08-28 | Y |
| TanStack Query — Important Defaults | tanstack.com | High (1.0) | Official vendor | 2026-08-28 | Y (against useQuery ref) |
| TanStack Query — `useQuery` reference | tanstack.com | High (1.0) | Official vendor | 2026-08-28 | Y |
| Vite — Features / TypeScript | vite.dev | High (1.0) | Official vendor | 2026-08-28 | N (single authoritative) |
| MDN — `setTimeout` (inactive-tab throttling) | developer.mozilla.org | High (1.0) | Technical docs | 2026-08-28 | N (single authoritative) |
| MDN — `fetch()` | developer.mozilla.org | High (1.0) | Technical docs | 2026-08-28 | N (single authoritative) |
| MDN — `<label>` | developer.mozilla.org | High (1.0) | Technical docs | 2026-08-28 | Y (with W3C WAI) |
| W3C WAI — Labeling Controls | w3.org | High (1.0) | Standards body | 2026-08-28 | Y (with MDN) |
| Playwright — Best Practices | playwright.dev | High (1.0) | Official vendor | 2026-08-28 | Y (with aiFix prompt, §4c) |
| Testing Library — Guiding Principles | testing-library.com | High (1.0) | Official vendor | 2026-08-28 | Y (with Vocke) |
| Vocke, "The Practical Test Pyramid" | martinfowler.com | Medium-High (0.8) | Industry leader | 2026-08-28 | Y (with Testing Library) |
| TkDodo, "You Might Not Need React Query" | tkdodo.eu | Medium-High (0.8) | Maintainer/primary-adjacent | 2026-08-28 | Y (author is the TanStack Query maintainer; used only for a statement about his own library) |
| honojs/hono issue #4003 | github.com | Medium-High (0.8) | Field report | 2026-08-28 | Y (with #4643, #3450, Hono docs) |
| honojs discussion #4643 | github.com | Medium-High (0.8) | Field report | 2026-08-28 | Y |
| honojs/hono issue #3450 | github.com | Medium-High (0.8) | Field report | 2026-08-28 | Y |
| microsoft/TypeScript issue #51750 | github.com | Medium-High (0.8) | Vendor issue tracker | 2026-08-28 | Y (with colinhacks repo) |
| colinhacks/live-typescript-monorepo | github.com | Medium-High (0.8) | Industry leader (Zod author) | 2026-08-28 | Y |
| stevedylandev/bhvr (Hono+Vite+React template) | github.com | Medium-High (0.8) | Reference implementation | 2026-08-28 | N (context only) |

**Reputation summary**: High: 17 of 25 (68%) | Medium-High: 8 of 25 (32%) | Medium: 0 |
Excluded-tier sources used: 0. **Weighted average reputation: 0.94.**

**Bias notes.** (i) TanStack Query's own documentation is the source for the case *against*
adopting it — this is a favourable bias direction (the vendor is not incentivised to
document defaults as drawbacks), so the citation is safe. (ii) TkDodo has a clear interest
in his own library; he is cited *only* for the passage where he argues **against** needing
it, plus the counter-signal listing interval fetching — both directions recorded.
(iii) Hono's "Known issues" section is self-critical vendor documentation, the most reliable
kind. (iv) The GitHub threads are self-selected complaints and systematically over-represent
failure; they are used only to establish that a failure mode *exists*, never its frequency.

## Knowledge Gaps

### Gap 1: The `hc` cross-workspace probe was not run — **highest priority**
**Issue**: Whether Hono `hc` type inference survives an *npm workspace* (not Bun, not
Turborepo, not pnpm) boundary **with no build step** is documented as fragile but was not
measured here. Every field report found used Bun or Turborepo.
**Attempted**: Hono official RPC docs (incl. raw markdown source), three GitHub issues/
discussions, two monorepo templates, TypeScript issue #51750, colinhacks/live-typescript-monorepo.
**Why insufficient**: All secondary. No shell tool available in this session.
**Recommendation — the exact ten-minute experiment**:
```bash
mkdir -p probe/packages/{api,web} && cd probe
# root package.json: { "private": true, "workspaces": ["packages/*"] }
# packages/api/package.json:
#   { "name":"@p/api","type":"module","exports":{"./contract":"./src/contract.ts",".":"./src/index.ts"} }
# packages/api/src/index.ts: chained Hono routes + `export type AppType = typeof routes`
# packages/web/package.json: { "name":"@p/web","dependencies":{"@p/api":"*"} }
# packages/web/tsconfig.json: { "compilerOptions": { "strict": true, "moduleResolution": "bundler", "noEmit": true } }
npm install                      # creates the symlink; NO build
# packages/web/src/probe.ts:
#   import { hc } from 'hono/client'
#   import type { AppType } from '@p/api'
#   const c = hc<AppType>('/'); const r = await c.queue.$get(); const d = await r.json()
npx tsc -p packages/web --noEmit
```
Then answer four questions: (a) does `d` have the real shape or `unknown`/`any`?
(b) does it still work with `moduleResolution: "node16"`? (c) does `tsc` in `web` now report
**backend** type errors, and does it demand `@types/node`? (d) how long does `tsc --noEmit`
take vs the Option B (`contract.ts` only) variant? **If (a) passes cleanly and (c) is
benign, the Q3 recommendation should be revisited** — `hc` becomes considerably more
attractive, though the `InferResponseType` readability objection and the #3450 bundle-leak
foot-gun both stand regardless.

### Gap 2: `eslint-plugin-react-hooks` at `rc` — behaviour on the polling hook unverified
**Issue**: The current `recommended` preset documented on react.dev includes compiler-driven
rules (`set-state-in-effect`, `purity`, `immutability`) and is versioned `rc`. Whether
`set-state-in-effect` fires on the recommended `usePolled` hook (Q1f) is **unknown**.
**Attempted**: react.dev's plugin reference page; it lists rules but no install/config
snippet and no per-rule semantics.
**Recommendation**: install the pinned version, run lint against the hook, and if
`set-state-in-effect` fires, decide *before* class whether to narrow the config or restructure
the hook. Do not discover this in the room.

### Gap 3: No measured cost figures anywhere in this document
**Issue**: No numbers for bundle size delta (TanStack Query vs none), `tsc --noEmit` time
under `hc` vs shared-schema, or IDE responsiveness at 5 routes. All arguments are
qualitative. This mirrors the provenance warning already recorded in
`docs/course-design-decisions.md` §4.
**Recommendation**: if the TanStack Query decision is contested, `npx vite build` twice and
compare — a five-minute check that would convert a judgement into a measurement.

### Gap 4: React 19 Actions for the staff-view forms not researched in depth
**Issue**: `use`/Suspense was ruled out for *polling* on primary evidence, but React 19's
`useActionState` / `<form action>` for the staff view's arrival form and re-triage control
was only ruled out by argument, not by reading the Actions documentation closely.
**Recommendation**: 15 minutes on react.dev's `useActionState` and `useOptimistic` pages
before writing the staff view. Prior expectation: still overkill for three throwaway
controls, but it is the one place in this app where a React 19 feature is plausibly the
idiomatic answer rather than a stretch.

### Gap 5: Nothing found on teaching-specific React pattern guidance
**Issue**: Searched for evidence on how *pre-built teaching codebases* should differ from
production codebases in pattern selection. Nothing authoritative found. The
"students imitate what they see" premise is taken from the brief and is untested here.
**Attempted**: general web search; no trusted-domain result.
**Recommendation**: treat that premise as an assumption, not a finding.

## Conflicting Information

### Conflict 1: Is TanStack Query right for interval polling? (the central disagreement)
**Position A — it is the right tool.** Dominik Dorfmeister (TkDodo), **maintainer of TanStack
Query**, in "You Might Not Need React Query": having listed the cases where you *don't* need
it, he names the cases where it stays valuable — *"infinite scrolling lists, offline
functionality, **interval fetching**, and smart auto-refetches."* Source:
[tkdodo.eu](https://tkdodo.eu/blog/you-might-not-need-react-query), reputation 0.8 (author is
the primary authority on the library). react.dev itself points the same way, verbatim:
*"Consider using or building a client-side cache. Popular open source solutions include
TanStack Query, useSWR, and React Router 6.4+."*

**Position B — not at this size.** TanStack Query's own docs establish that its defaults
(`staleTime: 0`, `refetchOnWindowFocus: true`, refetch on mount and reconnect, silent 3×
retry with backoff) would have to be *disabled* for this app to behave as specified, and
five of the eight bug classes it uniquely solves (dedupe, cache, cross-component sharing,
retry, background-tab suspension) do not arise with one endpoint on one screen.

**Assessment.** Both positions are well-sourced and neither is wrong. They are answering
different questions: TkDodo is answering *"is interval fetching in scope for this library?"*
(yes, clearly), not *"is this library worth its cost in a 250-line single-endpoint app?"*.
Note also react.dev's phrasing — *"using **or building**"* a client-side cache — explicitly
sanctions the hand-rolled route. **I recommend Position B, at Medium-High confidence, and
flag that a competent senior reviewer could take Position A without being wrong.** If this
app were to grow a second screen sharing the same data, Position A becomes correct.

### Conflict 2: Is component testing redundant when E2E exists?
**Position A — push tests down.** Vocke, martinfowler.com: *"Push your tests as far down the
test pyramid as you can"*; *"every single test in your test suite is additional baggage and
doesn't come for free."* Combined with the repo's own measured finding that an E2E failure
is a degenerate assertion error (~45% agent repair band vs ~77% for named errors), this
argues for *more* component tests, not fewer.
**Position B — resemble real usage.** Testing Library: *"The more your tests resemble the way
your software is used, the more confidence they can give you."* Playwright: *"Test
user-visible behavior."* For a table-and-form app, Playwright resembles usage more closely
than jsdom, so component tests trade confidence for speed.
**Assessment.** These conflict only on *default quantity*, and both are satisfied by the same
answer: write component tests exclusively where E2E is expensive or flaky (the polling race,
the failed-poll transition) and nowhere else. Confidence Medium-High. Note that Vocke's rule
is explicitly *reactive* — "if a higher-level test spots an error and there's no lower-level
test failing" — which does not license a pre-emptive suite.

### Non-conflict worth noting
react.dev documents real downsides of fetching in Effects (waterfalls, no cache, *"It's not
very ergonomic"*) while simultaneously teaching the `ignore` pattern as the correct way to do
it. That is not a contradiction: the *shape* is endorsed, the *hand-rolling at scale* is
discouraged. This app is below that scale.

## Recommendations for Further Research

1. **Run the Gap 1 probe before writing any frontend code.** It is the only recommendation in
   this document that could be reversed by ten minutes of measurement, and this repo has
   already had two conclusions overturned that way (§4a, §4b of the decisions doc).
2. **Lint the recommended `usePolled` hook against the pinned `eslint-plugin-react-hooks`**
   (Gap 2) before the hook is committed.
3. **Read react.dev's `useActionState` / `useOptimistic` pages** before writing the staff view
   (Gap 4) — the one place a React 19 feature might genuinely be idiomatic here.
4. **Add `exhaustive-deps` to the gate catalogue as its own row.** On this document's
   evidence it is the highest signal-per-millisecond frontend gate available, and it fits
   decision 12/13's "what it catches / how long it takes / what signal it gives the agent"
   format cleanly.
5. **Consider making the per-row `aria-label` an explicit teaching beat.** It connects three
   things the course already cares about: invalid-but-rendering HTML (the false-confidence
   trap), role-based Playwright locators, and the `aiFix` prompt's house style.

## Full Citations

[1] React Team. "useEffect — Fetching data with Effects". react.dev. https://react.dev/reference/react/useEffect. Accessed 2026-08-28.
[2] React Team. "use". react.dev. https://react.dev/reference/react/use. Accessed 2026-08-28.
[3] React Team. "Rendering Lists — Rules of keys". react.dev. https://react.dev/learn/rendering-lists. Accessed 2026-08-28.
[4] React Team. "Removing Effect Dependencies". react.dev. https://react.dev/learn/removing-effect-dependencies. Accessed 2026-08-28.
[5] React Team. "Component — static getDerivedStateFromError / componentDidCatch". react.dev. https://react.dev/reference/react/Component. Accessed 2026-08-28.
[6] React Team. "eslint-plugin-react-hooks". react.dev. https://react.dev/reference/eslint-plugin-react-hooks. Accessed 2026-08-28. [Version listed as `rc` — flagged.]
[7] Hono. "RPC". hono.dev. https://hono.dev/docs/guides/rpc. Accessed 2026-08-28.
[8] Hono. "docs/guides/rpc.md" (source markdown). honojs/website. https://raw.githubusercontent.com/honojs/website/main/docs/guides/rpc.md. Accessed 2026-08-28.
[9] TanStack. "Important Defaults". TanStack Query v5 docs. https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults. Accessed 2026-08-28.
[10] TanStack. "useQuery". TanStack Query v5 docs. https://tanstack.com/query/latest/docs/framework/react/reference/useQuery. Accessed 2026-08-28.
[11] Dorfmeister, Dominik (TkDodo). "You Might Not Need React Query". tkdodo.eu. https://tkdodo.eu/blog/you-might-not-need-react-query. Accessed 2026-08-28. [Author maintains TanStack Query.]
[12] Vite Team. "Features — TypeScript". vite.dev. https://vite.dev/guide/features.html. Accessed 2026-08-28.
[13] MDN Contributors. "Window: setTimeout() — Timeouts in inactive tabs". developer.mozilla.org. https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout. Accessed 2026-08-28.
[14] MDN Contributors. "Window: fetch()". developer.mozilla.org. https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch. Accessed 2026-08-28.
[15] MDN Contributors. "`<label>`: The Label element". developer.mozilla.org. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label. Accessed 2026-08-28.
[16] W3C Web Accessibility Initiative. "Labeling Controls — Forms Tutorial". w3.org. https://www.w3.org/WAI/tutorials/forms/labels/. Accessed 2026-08-28.
[17] Microsoft / Playwright. "Best Practices". playwright.dev. https://playwright.dev/docs/best-practices. Accessed 2026-08-28.
[18] Testing Library. "Guiding Principles". testing-library.com. https://testing-library.com/docs/guiding-principles/. Accessed 2026-08-28.
[19] Vocke, Ham. "The Practical Test Pyramid". martinfowler.com. Published 2018-02-15, revised 2018-02-26. https://martinfowler.com/articles/practical-test-pyramid.html. Accessed 2026-08-28. [Evergreen methodology reference per source-freshness rules.]
[20] honojs/hono. "Cannot get type for a hono/client in a different package" (issue #4003). github.com. Opened 2025-03-16, closed. https://github.com/honojs/hono/issues/4003. Accessed 2026-08-28.
[21] honojs. "Struggling to reuse Hono RPC types in client-side components" (discussion #4643). github.com. 2026-01-22 → 2026-08-06. https://github.com/orgs/honojs/discussions/4643. Accessed 2026-08-28.
[22] honojs/hono. "RPC tries to import server-side database code into the client and make svelte crash" (issue #3450). github.com. Opened 2024-09-25, closed, labelled "not bug". https://github.com/honojs/hono/issues/3450. Accessed 2026-08-28.
[23] microsoft/TypeScript. "Establish a package.json convention for TypeScript source in monorepos and npm packages" (issue #51750). github.com. https://github.com/microsoft/TypeScript/issues/51750. Accessed 2026-08-28.
[24] Hacks, Colin. "live-typescript-monorepo — Strategies for live-updating TypeScript types in monorepos". github.com. https://github.com/colinhacks/live-typescript-monorepo. Accessed 2026-08-28.
[25] Dylan Steck, Steve. "bhvr — A monorepo template using Bun, Hono, Vite, and React". github.com. https://github.com/stevedylandev/bhvr. Accessed 2026-08-28.

## Research Metadata

**Sources examined**: ~25 | **Cited**: 25 | **Cross-referenced claims**: 9 of 10 recommendation rows
**Confidence distribution**: High 5 (50%), Medium-High 4 (40%), Medium 1 (10%), Low 0
**Weighted average source reputation**: 0.94 | **Excluded-tier sources used**: 0
**Tool failures / limitations**: **No shell tool available** — the requested `hc` empirical
probe could not be executed (Gap 1, Empirical Probe Results). `stackoverflow.com` was
unreachable to the search agent (HTTP 400, blocked user-agent) and was excluded from all
searches; no finding depends on it.
**Blindness compliance**: `docs/superpowers/plans/2026-08-28-app-baseline.md` not read, not
opened, not grepped. Sibling research documents in `docs/research/tooling/` also left unread
to preserve independence.
**Output**: `docs/research/tooling/frontend-and-contract-patterns-independent-research.md`
