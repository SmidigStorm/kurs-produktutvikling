# Code patterns — four-researcher reconciliation

Date: 2026-08-28. Inputs:

| Researcher | Saw Plan A? | Document |
|---|---|---|
| Anchored review | **Yes** | `app-code-patterns-comprehensive-research.md` |
| Backend (blind) | No | `backend-patterns-independent-research.md` |
| Frontend (blind) | No | `frontend-and-contract-patterns-independent-research.md` |
| Testing (blind) | No | `testing-patterns-independent-research.md` |

**Why the blind design.** The anchored researcher was handed Plan A's six choices and
asked to validate them, which biases toward ratification. The three blind
researchers derived recommendations from the constraints alone and were explicitly
forbidden from reading the plan. Convergence between blind and anchored is real
corroboration; divergence is a genuine finding.

**All four lacked a shell** despite being told empirical checks beat reading. Every
probe below was therefore run directly in this session. Three of them changed or
confirmed a recommendation that documentation alone left open.

---

## Probes run in this session (2026-08-28, Node 26.5.0, npm 11.17)

| Probe | Result |
|---|---|
| Drizzle migrator against `:memory:` | **OK** — applies cleanly. Closes testing-researcher gap G1, its highest-risk unknown. |
| better-sqlite3 transaction, **sync** callback, throw inside | **OK** — rolls back, row absent. |
| better-sqlite3 transaction, **async** callback, throw inside | Driver throws `Transaction function cannot return a promise`; row rolled back; the async rejection surfaces separately as an `unhandledRejection`. **Fails loudly and safely — not the silent data-integrity bug that was feared.** |
| Vitest `toEqual` on a 5-item array, default config | `expected [ …(5) ] to deeply equal [ …(5) ]` — **contentless**, exactly as predicted. |
| Same, with `chaiConfig: { truncateThreshold: 0 }` | Full unified diff naming `id: "X"` vs `id: "e"`, plus `file:line`. **One config line, 45%→77% band shift.** |

---

## Verdict table

**KEEP** — Plan A was right, and blind research corroborates independently.

| Decision | Corroboration |
|---|---|
| Factory DI `createApp({ db, clock })` | Blind backend reached it independently, with a better reason than the plan had: the ubiquitous `c.set('db')` Hono pattern is a **Cloudflare Workers workaround** — bindings only exist per-request via `c.env` — not a Hono preference. That constraint does not exist on Node. Corroborating detail: the leading Hono+Drizzle starter uses a module singleton and consequently needed a separate `createTestApp()`. |
| No repository or service layer | Blind backend, citing Fowler's own criteria — Repository is warranted with "a large number of domain classes or heavy querying"; 2 tables and 5 endpoints meets neither. Anchored found Hono's Best Practices guide arguing the same ("Avoid Rails-Like Controllers"). Important caveat to teach: *"no repository" ≠ "logic in handlers"* — the seam that matters is pure-vs-impure. |
| Pure domain module | Passes, but narrowly, and justified by **constraints not by the pattern's name**: the estimate is specified as pure, and passing time as a parameter is the only structural way to hold the clock rule. Becomes objectionable the moment it acquires a layer name (`application/`, `ports/`). |
| Hand-rolled polling, no TanStack Query | Both anchored and blind frontend reject TanStack Query. **Recorded as genuinely contested, not settled:** TkDodo, the library's maintainer, explicitly lists *interval fetching* among cases where it earns its keep. The counter-argument is that TanStack's own defaults (`staleTime: 0`, `refetchOnWindowFocus`, silent 3× retry) would all need turning off. A senior reviewer could take the other side; if the app grows a second screen sharing this data, they become right. |
| No `hc` RPC client | Both reject. Blind frontend adds the decisive reason: `AppType` points at the whole route tree, whose module graph reaches **`better-sqlite3`, a native binary**. One accidentally non-type import puts a native module in a browser bundle, live, in class. |
| No error boundary | Blind frontend confirms the omission is correct: react.dev states boundaries do not catch event handlers or async code. A failed poll is async; a failed submit is an event handler. It would catch none of this app's real errors. |
| `app.request()` for HTTP tests | Blind backend agrees; skip `testClient`, whose docs require routes defined as chained methods — the tests dictating source layout. |
| `timestamp_ms` for arrival time | Blind backend independently flagged that second-resolution timestamps produce **arrival-time ties** in a queue ordered by arrival within level — a real flake source for this exact domain. Plan A already had this right. |

**CHANGE** — apply to Plan A before execution.

| # | Change | Source | Why |
|---|---|---|---|
| C1 | `@hono/zod-validator` instead of `safeParse` + manual 400s | Anchored **and** blind backend | Hono's docs say verbatim *"We recommend using a third-party validator."* 1 line/route instead of 3. **And it fixes a defect:** Hono's validator wraps `c.req.json()` in try/catch and returns 400 on malformed JSON; Plan A awaits it outside any try, so **four routes return 500 where they should return 400**. `@hono/zod-validator@0.9.0`, MIT, peers satisfied. |
| C2 | `text('level', { enum: TRIAGE_LEVELS })`, drop `as TriageLevel` | Anchored **and** blind backend | Infers the union with no cast; generated SQL is unchanged (verified in Drizzle's shipped source). The cast punched a hole through the exact type-safety argument decision 30 used to choose Drizzle. |
| C3 | In-memory SQLite for the Vitest suite | Anchored **and** blind testing | Anchored: the temp-file approach never closes the connection, so `rmSync` throws `EBUSY` **on Windows**. Blind testing adds the structural argument — `:memory:` makes "never touch the dev database" *physically impossible* rather than a setting to get right. Probe confirms the migrator works on `:memory:`. |
| C4 | Shared `contract.ts` exporting Zod schemas + `z.infer`; `import type` on the client | Blind frontend | **Neither Plan A nor the anchored review found this.** Replaces duplicated types without `hc`'s native-module hazard. Leaf module importing nothing but `zod`. |
| C5 | Wrap re-triage's two writes in `db.transaction((tx) => …)` — **synchronous** callback | Blind backend | Plan A updates the level and inserts history as two unguarded writes; cycle 3's amendment depends on that history. Probe confirms sync rollback works and async callbacks are rejected loudly. |
| C6 | `chaiConfig: { truncateThreshold: 0 }` in the Vitest config | Blind testing | Verified: default output is `expected [ …(5) ] to deeply equal [ …(5) ]`. One line restores a full diff with `file:line`. |
| C7 | Replace `getByTestId` with role/label locators in step definitions | Anchored | Plan A enables `aiFix`, whose prompt instructs the model to *"strictly rely on the ARIA snapshot"* — where `data-testid` does not appear. **Enabling that feature and hiding every assertion target from it is the one indefensible combination in the plan.** |
| C8 | Unique per-row `aria-label` on staff-table controls | Blind frontend | `htmlFor="triage"` inside a `.map()` labels only row one — MDN: later duplicate ids "are not considered". Invalid HTML that renders perfectly. Not politeness: unique accessible names are what make the C7 locators work. |
| C9 | `page.clock.fastForward` in E2E instead of waiting out the poll | Blind testing | Removes the 15-second poll from the flake surface without sleeps — the largest flake risk in a live-demoed suite for a time-dependent domain. |
| C10 | Add `app.onError` | Anchored | An unexpected throw currently logs nothing. 5 lines. |
| C11 | Move step definitions out of `features/` | Anchored | Global Constraints assign `features/` to the product person; Plan A puts TypeScript step definitions inside it. |
| C12 | `POST /api/test/reset` behind the existing `allowTestRoutes` flag | Anchored | Plan A's `Given the clinic queue is empty` does N+1 HTTP calls and makes each scenario cleaned-up-by-its-successor rather than independent. |
| C13 | `setVisit(null)` when `visitId` changes | Anchored | The `ignore` flag pattern **is** react.dev's documented approach and is correct — but react.dev's own example also resets state, without which navigation shows the previous patient's data. |
| C14 | Single browser in Playwright config, **with the reason written in the config file** | Blind testing | Playwright officially recommends testing all browsers. Declining is right here; declining *silently* reads as ignorance to a skilled audience, while an explained deviation reads as judgement. |
| C15 | Add `exhaustive-deps` lint as its own gate-catalogue row | Blind frontend | react.dev's canonical stale-closure example **is a `setInterval` polling loop** — this app's centrepiece is the canonical instance of the canonical React mistake. Produces file-line-reason errors, i.e. the 77% repair band. |

**DO NOT DO** — instincts that would make things worse.

| Anti-recommendation | Source |
|---|---|
| Do **not** configure Vitest `reporters` | Blind testing: Vitest auto-switches to an agent-optimised `minimal` reporter when it detects an AI agent — *unless custom reporters are configured*. The instinctive response to "output quality matters" defeats the feature. |
| Do **not** add decorators/POM to playwright-bdd | playwright-bdd's own page recommends both playwright-style and decorators; decorators presuppose a page-object model over two screens. Vendor guidance declined on the over-engineering criterion. |
| Do **not** add a repository, DI container, or service layer | All three researchers, independently. |

---

## The synthesis none of them made alone

C1, C2 and C4 compose. One `TRIAGE_LEVELS` `as const` array feeds **the TypeScript union, the Drizzle enum column, and the Zod schema**; the same `contract.ts` feeds **`@hono/zod-validator` on the server and the frontend's types**. Four separate declarations of the domain vocabulary collapse into one.

That is better code, and it is a genuinely good thing for skilled developers to see — a
single source of truth that is *load-bearing* rather than decorative.

---

## Open, deliberately

- **`hc` cross-workspace type inference was never tested.** All three researchers that could have tested it had no shell. Labelled documentary. Both rejected `hc` on independent grounds (native-module bundling hazard; `InferResponseType<typeof client.posts[':id']['comments']['$get']>` is not comprehensible cold), so the gap is recorded rather than closed.
- **Whether Vitest's agent-detection actually suppresses custom reporters** — one sentence in one docs page, Medium-High confidence, 5-minute check.
- **Declarative vs imperative agent-authored Gherkin.** The testing researcher reached §4c's negative verdict *independently*, from vendor style guidance rather than from reading `examples/ai`. Two independent routes to "expect imperative Gherkin; the `spec` command needs a guardrail." That corroborates pre-course experiment 2's premise — it does not answer it.
