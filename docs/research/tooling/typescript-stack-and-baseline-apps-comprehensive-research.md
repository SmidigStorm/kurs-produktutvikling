# Research: TypeScript Stack Tooling and Baseline App Candidates for a One-Day Process-Design Course

**Date**: 2026-08-27 | **Researcher**: nw-researcher (Nova) | **Confidence**: High on factual claims, Medium on the frontend choice | **Sources**: 38

> STATUS: COMPLETE for research items 1 and 3. Items 2, 4 and 5 of the research brief are out of scope — see Recommendations for Further Research.

## Executive Summary

**The headline: a stack exists that satisfies every decided constraint, and its backend has zero transitive runtime dependencies. The one genuine threat to the failsafe-setup constraint is migration tooling — and the fix is to write ~60 lines yourself rather than adopt any ORM.**

**Recommended stack**: **Hono** (4.13.5, MIT, zero runtime dependencies) + **Zod** (4.4.3, zero deps) + **@hono/node-server** (2.1.1, zero deps) on the backend; **Vite 8 + Svelte (`svelte-ts`)** on the frontend; **`node:sqlite`** for data with a **repo-local raw-SQL migration runner**; **Vitest 4.1.11** for unit tests; **playwright-bdd 9.2.0** for BDD E2E. The backend's entire production dependency tree is three MIT packages with no transitive dependencies at all — SQLite, migrations, and optionally the test runner all come from Node itself. Against the failsafe-setup constraint this is close to a best-case outcome.

**Three risks, only one of them serious.** First and most important: **every mainstream ORM reintroduces `better-sqlite3` and therefore native compilation.** `drizzle-kit` cannot connect via `node:sqlite` and errors demanding better-sqlite3, bun, libsql or turso; Prisma's only local-SQLite adapter is `@prisma/adapter-better-sqlite3`; Kysely's bundled SQLite dialect targets better-sqlite3. Any of these would put a C++ toolchain on the critical path and is the single most likely cause of a pair losing their morning on Windows. Drizzle's `node:sqlite` support additionally lives on an unreleased `@rc` line rather than stable 0.45.2. The recommendation is therefore to skip ORMs entirely: `db.exec()` plus a `_migrations` table is a ~60-line file that is not merely *adequate* but actually **better on all three of the brief's criteria** — zero fragility, error output we control (and so can make more precise than any ORM's wrapped errors), and plain readable SQL for the product person. It is also a better teaching artefact, since students can read the whole gate. The two lesser risks are Playwright browser downloads (mitigated by Chromium-only, an explicit `verify-setup` check, and the fact that decision #22 already makes all test layers optional) and Vite's platform-specific optional dependencies (mitigated by instructing `npm install` rather than `npm ci`). Neither requires a compiler. **Recommendation: add an automated gate that greps the lockfile for `better-sqlite3`/`node-gyp` and fails** — cheap, precise, and itself a good exhibit for the gate catalogue.

**`playwright-bdd` is not a risk — this was the brief's biggest worry and the evidence clears it.** It is at v9.2.0 (MIT, ~2 months old), tracks Playwright within weeks of each minor release, declares a permissive peer range of `>=1.44`, and cut a deliberate breaking major in June 2026 to modernise its Cucumber dependencies — the behaviour of a maintained project, not a bit-rotting one. Pin it and `@playwright/test` exactly and the residual risk is browser downloads, not the library. Separately, a widely-repeated claim that `node:test` lacks watch mode and snapshot testing is **false** — Node's own documentation shows watch mode since v19.2.0 and stable snapshots since v23.4.0. Vitest still wins on assertion-diff quality (the criterion that matters most for agent feedback), but `node:test` is a strong runner-up that would take the whole toolchain to near-zero dependencies, and it is the right switch if pre-class setup failures prove to be the dominant risk.

**On baseline apps, the honest answer is to build from scratch.** No surveyed candidate is good enough, and the reason is structural, not incidental: **every maintained starter is optimised for production-readiness — auth, deployment, CI, observability — which is exactly what this course has deliberately deleted.** The better a starter is at its own job, the worse it fits. Epic Stack fails on Prisma, a meta-framework and Fly.io config; bulletproof-react has no backend and is explicitly not a template; RealWorld/Conduit is bitrotted, wrong-stack and an unfun domain. The decisive argument is pedagogical rather than technical: production starters are dense with embedded process opinions — commit hooks, conventional commits, CI workflows — and in a course whose subject is *students designing their own process*, **a third-party starter is an unexamined process smuggled into a course about examining your process.** Scaffold `frontend/` with `npm create vite@latest`, hand-write the ~15-line Hono backend, generate the domain with Claude Code from written Gherkin specs, then **curate it line by line** — that human curation step is not optional and is the main cost of this recommendation, since students imitate whatever they see. Better-T-Stack (MIT, actively developed, and the only candidate that can emit Hono + Node + SQLite + separate apps) is worth thirty minutes as a layout reference and possible accelerator, but its generated code was never inspected and its SQLite driver is unconfirmed — verify it does not pull in better-sqlite3 before trusting it.

**Confidence and caveats.** Confidence is **High** on all version, licence, dependency-count and driver-support facts, which rest on npm registry manifests and official documentation. It is **Medium** on the frontend choice, where "readability" is supported only by Medium-trust commercial blogs (Gap G6) and where an unsourced counter-argument — that Claude Code is more reliable in React than in Svelte 5 runes, and agent reliability protects the course's actual subject matter — is the most debatable call in this document; treat the frontend as provisional and settle it with a spike. Two further gaps deserve action before building: Hono's Node-specific ergonomics were not verified hands-on (G4), and SQLite-versus-server-database semantic divergence (research-brief item 5, including limited `ALTER TABLE`) was **not researched at all** (G9) and should be commissioned separately.

## Research Methodology
**Search Strategy**: Official project documentation and changelogs, npm registry metadata, GitHub repository state (releases, issues, commit recency), cross-referenced against industry-leader commentary.
**Source Selection**: Types: official / technical_docs / industry_leaders. Reputation: high and medium-high.
**Quality Standards**: Target 3 sources/claim (min 1 authoritative for version/API facts). Registry and project docs treated as primary sources for version and maintenance facts.

## Evaluation Criteria (applied to every candidate)
1. **(a) Setup fragility** — failure modes on Windows / macOS ARM / Linux. Native compilation, global installs, daemons, postinstall scripts, version sensitivity.
2. **(b) Agent-feedback quality** — does a failure produce file + line + precise reason, fast?
3. **(c) Readability to a non-developer** — product people read this code in the room.

---

## PART 1 — TypeScript Tooling

### 1.0 Foundation: `node:sqlite` status

#### Finding 1.0.1: `node:sqlite` is Release Candidate (Stability 1.2), unflagged, and API-rich
**Evidence**: The Node.js API docs for `node:sqlite` state `Stability: 1.2 - Release Candidate`, "Added in: v22.5.0", and that the module reached Release Candidate in **v25.7.0**. It is no longer behind the `--experimental-sqlite` flag as of v23.4.0 / v22.13.0.
**Source**: [Node.js Documentation — SQLite](https://nodejs.org/api/sqlite.html) — Accessed 2026-08-27. Domain: nodejs.org (official project docs, reputation High).
**Confidence**: High (authoritative primary source; this is the normative definition).
**Analysis**: The environment has Node 26.5.0 installed (per `docs/course-design-decisions.md` §6), which is comfortably past the v25.7.0 RC milestone. "Release Candidate" in Node's stability index means the API is unlikely to change and is broadly usable, but is not yet covered by semver-major stability guarantees. **For a one-day course this is acceptable**: the risk is a future Node major changing an API, not a runtime failure today. It is worth pinning the Node version in `.nvmrc`/`engines` and stating a minimum of Node 24 LTS or newer in the pre-class doc.

**API surface relevant to the course** (all from the same source):
- `DatabaseSync(path[, options])` — synchronous, file or `:memory:`. Options include `enableForeignKeyConstraints` (default true), `readOnly`, `timeout` (busy timeout).
- `db.exec(sql)` — raw SQL execution. **This is the whole migration primitive we need.**
- `db.prepare(sql)` → `StatementSync` with `.all() / .get() / .iterate() / .run()`.
- `db.isTransaction` property; transactions via `BEGIN`/`COMMIT` through `exec`.
- `sqlite.backup(sourceDb, path)` — the only async API.
- `createTagStore()` (v24.9.0+) — tagged-template prepared-statement cache.
- `Symbol.dispose` support, so `using db = new DatabaseSync(...)` works.

**Why this matters for setup fragility (criterion a)**: `node:sqlite` is in the Node binary. There is **zero** install step, zero native compilation, zero postinstall script, zero platform-specific prebuilt-binary download. On the fragility axis it is the single best decision already made in this project, and everything downstream should be judged on whether it preserves that property.

**Caveat worth flagging**: `DatabaseSync` is *synchronous*. It blocks the event loop. For a teaching app with one user per machine this is irrelevant and arguably a pedagogical *benefit* — no `await` noise in the data layer makes repository code markedly more readable to a non-developer (criterion c). It would be wrong in production; say so in a code comment so students do not over-generalise.

### 1.1 Backend framework

**Verdict up front: Hono. Zero runtime dependencies, MIT, excellent TypeScript inference, and route handlers a product person can read. Fastify is the defensible alternative if you want built-in schema validation. Express is acceptable-but-dated; NestJS is disqualified on readability.**

#### Finding 1.1.1: Hono has *zero* runtime dependencies
**Evidence**: The npm registry manifest for `hono` reports `"version": "4.13.5"`, `"license": "MIT"`, `"engines": {"node": ">=16.9.0"}`, and **no `dependencies` field at all**.
**Source**: [npm registry — hono/latest](https://registry.npmjs.org/hono/latest) — Accessed 2026-08-27. Domain: registry.npmjs.org (official registry, primary source, High).
**Verification**: Independent comparative write-ups characterise Hono as "the lightweight, small, edge-native, Web Standards-based option" among Nest/Fastify/Hono ([Encore — NestJS vs Fastify vs Hono](https://encore.dev/articles/nestjs-vs-fastify-vs-hono), Medium trust, commercial interest noted) and as offering "end-to-end type-safe RPC between client and server" ([PkgPulse comparison](https://www.pkgpulse.com/guides/hono-vs-express-vs-fastify-2026), Medium trust).
**Confidence**: High for the dependency-count and licence facts (primary registry data). Medium for the qualitative framing (Medium-trust secondary sources with commercial interests; see Knowledge Gap G4).
**Analysis (criterion a — fragility)**: Zero runtime dependencies is the strongest possible result. It means: no transitive native module can sneak in, no postinstall script, a tiny lockfile, and a fast, near-unbreakable `npm ci`. For a repo installed cold on ~15 unknown laptops, this is worth more than any performance number.

#### Finding 1.1.2: Fastify is mature and pure-JS, but carries ~15 runtime dependencies
**Evidence**: The npm manifest for `fastify` reports `"version": "5.12.1"`, `"license": "MIT"`, and 15 runtime dependencies: `pino`, `rfdc`, `avvio`, `semver`, `toad-cache`, `find-my-way`, `@fastify/error`, `process-warning`, `abstract-logging`, `light-my-request`, `secure-json-parse`, `@fastify/proxy-addr`, `fast-json-stringify`, `@fastify/ajv-compiler`, `@fastify/fast-json-stringify-compiler`.
**Source**: [npm registry — fastify/latest](https://registry.npmjs.org/fastify/latest) — Accessed 2026-08-27.
**Confidence**: High (primary registry data).
**Analysis**: **Important nuance, so as not to overstate the case against Fastify:** all 15 are pure JavaScript. None is a native module. So Fastify does *not* threaten the failsafe-setup constraint the way `better-sqlite3` does — the difference from Hono is install size and lockfile churn, not a class of failure. Fastify's genuine advantage for criterion (b) is **JSON Schema validation built into the route definition**: an invalid request body produces a structured, machine-readable validation error naming the offending field. That is high-quality agent feedback, and it is a real argument. Its disadvantage for criterion (c) is the plugin/encapsulation model (`fastify.register`, decorators, hooks), which is genuinely confusing to a non-developer and to an agent reasoning about where a route "lives".

#### Finding 1.1.3: Express types `req.body` as `any`; Hono and Fastify infer it
**Evidence**: "Express types `req.body` as `any`, while Hono and Fastify both make the inferred body type available without explicit casting." Hono and Fastify "both ship first-class TypeScript".
**Source**: [PkgPulse — Hono vs Express vs Fastify 2026](https://www.pkgpulse.com/guides/hono-vs-express-vs-fastify-2026) — Accessed 2026-08-27. Domain: pkgpulse.com (Medium trust, SEO-comparison genre — treat with caution).
**Verification**: Corroborated in substance by [APIScout](https://apiscout.dev/guides/hono-vs-fastify-vs-express-api-framework-2026) and [Encore](https://encore.dev/articles/nestjs-vs-fastify-vs-hono), both Medium trust, both stating Express's TypeScript coverage is materially weaker.
**Confidence**: Medium — three sources agree, but all three are in the SEO/vendor comparison genre and may share upstream sources (possible circular reference; see Conflict/Gap notes). The underlying claim is consistent with Express's architecture (types supplied by the separate DefinitelyTyped `@types/express` package rather than written in TypeScript), which is a well-established structural fact.
**Analysis (criterion b — agent feedback)**: This matters more than it looks. `req.body` typed as `any` means the typechecker — the course's single best agent-feedback gate per the decision doc's "gates serve two masters" section — **goes blind exactly at the API boundary**, which is where the agent most often makes mistakes. Adopting Express would quietly weaken the strongest gate in the catalogue. That is an argument from the course's own stated principles, not from fashion.

#### Finding 1.1.4: Performance is not a deciding factor here
**Evidence**: Benchmarks quoted put Hono at "around 62K req/s, roughly 4 to 5x Express and 4x Fastify" on hello-world, and Fastify at "~10x faster than Express in JSON-heavy workloads".
**Source**: [PkgPulse](https://www.pkgpulse.com/guides/hono-vs-express-vs-fastify-2026) and [Kanopy](https://kanopylabs.com/blog/hono-vs-express-vs-fastify) — Accessed 2026-08-27. Both Medium trust.
**Confidence**: Low for the specific numbers — hello-world microbenchmarks are notoriously unreliable, the two sources give mutually awkward multipliers, and neither publishes methodology I could inspect.
**Analysis**: Recorded and then **explicitly discounted**. One pair, one laptop, a handful of rows. Throughput is irrelevant to every criterion in this brief. I flag it only so nobody re-introduces it as an argument later.

#### Finding 1.1.5: NestJS is the heavyweight option
**Evidence**: "NestJS, Fastify, and Hono sit at three different points on the 'how much framework do you want' spectrum, with NestJS being the heavyweight opinionated architecture."
**Source**: [Encore — NestJS vs Fastify vs Hono 2026](https://encore.dev/articles/nestjs-vs-fastify-vs-hono) — Accessed 2026-08-27. Medium trust; **commercial interest** — Encore sells a competing backend framework, so its framing is not disinterested. The "heavyweight" characterisation is nonetheless uncontroversial and matches NestJS's own documented architecture (modules, providers, DI container, decorators).
**Confidence**: Medium-High (single Medium-trust source, but the claim is structural and independently evident from NestJS's own docs).
**Analysis**: **Reject NestJS**, for three course-specific reasons:
1. **Criterion (c) is fatal.** `@Injectable()`, `@Module({providers: [...]})` and constructor dependency injection require a product person to understand an inversion-of-control container before they can read a single line of business logic.
2. **It prescribes a process.** Decision doc §1: "Anything the repo prescribes steals an exercise." Nest imposes a strong opinion on structure and layering. The course's subject is students designing their own process; handing them a framework that has already decided is working against the pedagogy.
3. **Setup surface.** Decorators require `experimentalDecorators` / `emitDecoratorMetadata` and `reflect-metadata`, and the ecosystem historically leans on the `@nestjs/cli` global install.

#### Recommendation 1.1: Hono
| | Hono | Fastify | Express | NestJS |
|---|---|---|---|---|
| Runtime deps | **0** | 15 (all pure JS) | ~30 (pure JS) | many |
| Native compilation risk | **None** | None | None | None |
| TS inference at the request boundary | **Excellent** | Excellent (schema) | Poor (`any`) | Good |
| Readable to a non-developer | **Best** | Medium | Good | Worst |
| Prescribes structure | **No** | Somewhat | No | **Heavily** |
| Licence | MIT | MIT | MIT | MIT |

A Hono route reads almost like a sentence, which is the property that matters in a mixed room:
```ts
app.get('/players', (c) => c.json(listPlayers()))
app.post('/matches', async (c) => c.json(recordMatch(await c.req.json()), 201))
```
**Caveats to state honestly**: (i) Hono is Web-Standards-based (`Request`/`Response`), which is *conceptually cleaner* but slightly less represented in older tutorials than Express — a minor cost when students search for help; (ii) Hono has no built-in request validation, so pair it with a small **Zod** schema per endpoint. That Zod pairing is not a workaround — it is a deliberate criterion-(b) win: Zod produces a precise, structured error naming the failing field and the expected type, which is first-rate agent feedback, and a Zod schema is close to plain English for a product person. (iii) If the team already knows Fastify well, Fastify is a defensible choice and nothing above is disqualifying.

### 1.2 Frontend approach

**Verdict up front: Vite + Svelte (the `svelte-ts` template), talking to the Hono backend over `fetch`. React + Vite (`react-ts`) is the low-risk alternative if the room's developers are React people. Reject SvelteKit, Next.js and Astro — not on quality, but because meta-frameworks structurally contradict decision #27.**

#### Finding 1.2.1: Meta-frameworks (SvelteKit / Next.js / Astro) conflict with the decided topology
**Evidence (from the project's own decision record, not external)**: Decision #27 requires "**Separate backend and frontend** — distinct directories and processes... Layer boundaries visible in the tree and in the running system, and they map onto the pair's division of labour."
**Source**: `docs/course-design-decisions.md` §2, Engineering table — repo-internal, authoritative for this project.
**Confidence**: High (this is a decided constraint, quoted verbatim).
**Analysis (interpretation)**: SvelteKit, Next.js and Astro all ship their own server and their own server-side data-loading layer (`+page.server.ts`, server actions, Astro endpoints). Adopting one forces an unattractive choice: either (i) run the meta-framework's server *and* the Hono backend, so there are now two backends and the "layer boundary" the course wants to make visible is instead smeared across three places; or (ii) collapse the backend into the meta-framework, which **reverses decision #27**. Either way it damages the thing decision #27 was bought to provide. This is a fit-to-brief judgement, not a criticism of the frameworks. **Reject on architecture.**

Worth stating explicitly because it is counter-intuitive: SvelteKit is the *better framework* than plain Svelte + Vite for most real projects. It is the wrong one here for a reason specific to this course.

#### Finding 1.2.2: Vite scaffolds a TypeScript template for every candidate and requires no native build step
**Evidence**: `npm create vite@latest` offers TypeScript variants `vanilla-ts`, `vue-ts`, `react-ts`, `preact-ts`, `lit-ts`, `svelte-ts`, `solid-ts`, `qwik-ts`, plus `react-compiler-ts`. Vite requires "Node.js version 20.19+, 22.12+". The current stable release is **v8.2.2**. The documentation describes no native dependency or postinstall requirement.
**Source**: [Vite — Getting Started](https://vite.dev/guide/) — Accessed 2026-08-27. Domain: vite.dev (official project docs, High).
**Confidence**: High for templates and Node requirement (authoritative). Medium for "no native dependencies" — see the flag immediately below, which the docs page does not address.

#### FLAG (criterion a): Vite's platform-specific optional dependencies are the second real fragility risk in this stack
**Evidence / analysis**: Vite's bundler and transform layer (esbuild, and Rollup/Rolldown) are distributed as **platform-specific prebuilt binaries selected via npm `optionalDependencies`** (`@esbuild/darwin-arm64`, `@rollup/rollup-win32-x64-msvc`, and so on). This is *not* compilation — nothing invokes a C++ compiler — so it is a much milder risk than `better-sqlite3`. But it is a documented, recurring npm failure mode: a lockfile generated on one platform can omit another platform's optional package, producing the well-known `Cannot find module @rollup/rollup-<platform>` class of error at first run.
**Confidence**: Medium — the mechanism (optionalDependencies for prebuilt platform binaries) is well established and directly observable in any Vite lockfile, but I did **not** find a High-reputation source in this research explicitly documenting the failure mode; the Vite docs page I fetched is silent on it. Recorded as an engineering judgement, clearly labelled. See Knowledge Gap G5.
**Mitigations, in order of effectiveness**:
1. **Commit the lockfile, but have every pair run a plain `npm install` (not `npm ci`) once**, so npm resolves the optional packages for *their* platform. This is the single highest-value instruction in the pre-class doc.
2. Make `verify-setup` actually start the dev server and hit it, rather than only checking that `node_modules` exists. Per decision #2, "the dangerous failure is 'I thought it was working'" — a check that only inspects the filesystem is precisely that dangerous failure.
3. Keep a documented fallback: `rm -rf node_modules package-lock.json && npm install`.

**Honest framing for the user**: after `better-sqlite3` (avoided) and Playwright browser downloads (Finding 1.5), this is the third and last material setup risk. All three are known, all three are mitigable, and none requires a compiler. That is a good position to be in.

#### Finding 1.2.3: Svelte is consistently rated more readable and lower-boilerplate than React
**Evidence**: "For equivalent functionality, Svelte requires fewer lines of code"; Svelte "is widely regarded as the more intuitive and readable of the two, with its single-file component format (HTML, CSS, and JavaScript together) reducing boilerplate dramatically". "For beginners, Svelte is often gentler to read and write, though React skills are more transferable to jobs." "JSX, while powerful and expressive, can be difficult for new developers to learn."
**Source**: [Strapi — Svelte vs React in 2026](https://strapi.io/blog/svelte-vs-react-comparison) — Accessed 2026-08-27. Medium trust; **commercial interest** (Strapi sells a headless CMS integrating with both, so it is comparatively neutral between them).
**Verification**: [DreamHost — Svelte vs React](https://www.dreamhost.com/blog/svelte-vs-react/) and [Windframe](https://windframe.dev/blog/svelte-vs-react) — both Medium trust, both independently making the fewer-lines / lower-learning-curve claim.
**Confidence**: Medium. Three sources agree, satisfying the cross-reference requirement, but all three are Medium-trust commercial blogs in a genre prone to recycling each other's framing, so genuine independence is uncertain. **No High-reputation source was found for this claim, and I am not going to pretend otherwise** — "readability" is a subjective property that authoritative sources rarely adjudicate. See Knowledge Gap G6.
**Analysis**: The direction of the claim is uncontested — I found no source arguing React is more readable to a beginner — and it matches the structural facts (Svelte has no JSX, no `useState`/`useEffect` ceremony, no dependency arrays, and reactivity is assignment). For criterion (c), which the brief asks me to weigh, that is a real advantage.

#### Finding 1.2.4: React's advantage is transferability and training-data density
**Evidence**: "React skills are more transferable to jobs." Per State of JS 2025 (published February 2026), 27% of JavaScript developers have used Svelte — growth, but far short of React's dominance.
**Source**: [Strapi](https://strapi.io/blog/svelte-vs-react-comparison) citing State of JS 2025 — Accessed 2026-08-27.
**Confidence**: Low-Medium for the 27% figure specifically — it is reported second-hand and I did not reach the State of JS survey directly to confirm the number or its exact question wording. See Knowledge Gap G6. The qualitative claim about React's dominance is uncontroversial.
**Analysis (interpretation — this is the counter-argument to Finding 1.2.3, and it is a serious one)**: There is a **course-specific** reason to prefer React that has nothing to do with developer preference: **Claude Code is the primary tool (decision #14), and agents are measurably more reliable in React than in Svelte** because React is enormously better represented in training data — and Svelte 5's runes (`$state`, `$derived`, `$effect`) are recent enough that agents can regress to Svelte 4 idioms. In a course whose entire subject is *the agent executing the student's process*, an agent that writes subtly wrong frontend code is not a minor annoyance — **it is noise injected directly into the variable the course is trying to teach.** This argument is a judgement, not a sourced finding, and I flag it as the single most debatable call in this document.

#### Recommendation 1.2: `svelte-ts`, with `react-ts` as a fully-supported fallback — and a decision rule
| | Svelte + Vite | React + Vite | SvelteKit / Next / Astro |
|---|---|---|---|
| Fits decision #27 (separate BE/FE) | **Yes** | **Yes** | **No** |
| Readable to a non-developer | **Best** | Good | n/a |
| Agent reliability | Good | **Best** | n/a |
| Setup fragility | Low (Vite optional-deps caveat) | Low (same caveat) | Higher |
| Scaffold | `npm create vite@latest -- --template svelte-ts` | `--template react-ts` | separate CLI |

**Decision rule, since the evidence genuinely does not settle this one:** the frontend is a thin CRUD surface — a list, a form, a detail view — over the Hono API. At that size Svelte's readability advantage is at its maximum and React's ecosystem advantage is at its minimum, so **Svelte is the better fit for criterion (c)**. But if a dry run shows Claude Code producing shaky Svelte 5 runes code, switch to `react-ts` without hesitation; the agent-reliability argument outranks the readability argument, because agent reliability protects the course's actual subject matter.

**In either case**: keep the frontend deliberately plain — `fetch` against the backend, no state-management library, no component library, no CSS framework beyond a single hand-written stylesheet. Students imitate what they see (decision-doc §3, item 8). Every abstraction on the frontend is one the product person must decode and one the agent can get wrong, and none of them teaches process design.

### 1.3 Migration tooling against `node:sqlite`

**This is the section where the failsafe-setup constraint is genuinely under threat, and the answer is not the popular one.**

**Verdict up front: use a ~60-line repo-local raw-SQL migration runner built on `db.exec()`. Every mainstream ORM/migration tool either reintroduces `better-sqlite3` (native compilation) or puts you on a pre-release branch. For this course specifically, neither is acceptable, and the hand-rolled runner is *also* the pedagogically better artefact.**

#### Finding 1.3.1: `drizzle-kit` cannot connect to a database via `node:sqlite` — it demands `better-sqlite3` or another native/external driver
**Evidence**: Drizzle Kit emits the error *"Please install either 'better-sqlite3', 'bun', '@libsql/client' or '@tursodatabase/database' for Drizzle Kit to connect to SQLite databases"* when pointed at a `node:sqlite` setup. `node:sqlite` is not among drizzle-kit's recognised driver options.
**Source**: [GitHub — drizzle-team/drizzle-orm issue #5471, "[BUG]: drizzle-kit does not support `node:sqlite`"](https://github.com/drizzle-team/drizzle-orm/issues/5471) — Accessed 2026-08-27. Domain: github.com (project's own issue tracker, primary source, reputation Medium-High).
**Verification**: Independently corroborated by Drizzle's own driver documentation, which lists native SQLite connection support for "libsql, node:sqlite and better-sqlite3" **at the ORM layer** while the Kit tooling documents a separate, narrower driver list.
**Confidence**: High — the error string is a verbatim quote from the tool, and the ORM/Kit asymmetry is visible in the vendor's own docs.
**Analysis**: **This is exactly the failure the brief asked me to look for.** Adopting Drizzle naively means `npm i -D better-sqlite3` appears in `devDependencies`, and `better-sqlite3` is a `node-gyp` native module. On Windows without Visual Studio Build Tools, or on any laptop where the prebuilt binary for that Node ABI is missing, `npm install` fails with a wall of C++ compiler errors. **That single line would undo decision #26 and #3 and is the highest-probability cause of "a pair loses their morning".** Flag: RED.

**Partial workaround, stated fairly**: `drizzle-kit generate` needs **only the schema files, not a live database connection** — see the command matrix below. So a Drizzle setup *can* avoid better-sqlite3 if you (i) use `generate` to author migrations and (ii) apply them at runtime with `migrate()` from `drizzle-orm/node-sqlite/migrator` against your own `DatabaseSync` connection.
**Source**: [Drizzle ORM — Migrations](https://orm.drizzle.team/docs/migrations) — Accessed 2026-08-27.

| drizzle-kit command | Needs live DB connection? | Works with `node:sqlite` only? |
|---|---|---|
| `generate` | No — schema files only | **Yes** |
| `migrate` | Yes | No — needs a supported driver |
| `push` | Yes | No |
| `pull` | Yes | No |
| `studio` | Yes | No |

The cost of that workaround: you lose `drizzle-kit push` (rapid prototyping) and `drizzle-kit studio` (the GUI data browser). Studio is a *notable* loss for this course — a visual table browser is genuinely valuable for a product person. But it is not worth a native compile step; a `sqlite3` CLI or a VS Code SQLite extension covers it, installed per-person and off the critical path.

#### Finding 1.3.2: Drizzle's `node:sqlite` support sits on the unreleased v1 line, not the stable line
**Evidence**: Drizzle's own "Node SQLite" connection guide instructs installing `drizzle-orm@rc` and `drizzle-kit@rc` — i.e. release-candidate tags, not `latest`. Meanwhile the npm registry reports stable `drizzle-orm` at **0.45.2** and `drizzle-kit` at **0.31.10**.
**Source**: [Drizzle ORM — Node SQLite](https://orm.drizzle.team/docs/connect-node-sqlite) — Accessed 2026-08-27; [npm registry — drizzle-orm/latest](https://registry.npmjs.org/drizzle-orm/latest) and [npm registry — drizzle-kit/latest](https://registry.npmjs.org/drizzle-kit/latest) — Accessed 2026-08-27.
**Confidence**: Medium-High. Three sources, but see Conflict C1 below — Drizzle's own release-notes page returned internally inconsistent version history, so I could not fully pin the v1 timeline.
**Analysis**: Building a teaching repo on an `@rc` tag is a compounding risk: RC tags move, documentation lags, and the migration path to v1 stable may break the exact code students are told to imitate. If Drizzle is chosen anyway, pin an **exact** RC version in the lockfile and never use the `rc` dist-tag in `package.json`.

#### Finding 1.3.3: Prisma is disqualified — driver adapters for SQLite are `better-sqlite3`, libSQL or D1; there is no `node:sqlite` adapter
**Evidence**: Prisma's SQLite connector documentation lists exactly three driver adapters: `@prisma/adapter-better-sqlite3` (local SQLite), `@prisma/adapter-libsql` (Turso), `@prisma/adapter-d1` (Cloudflare D1). The docs do not mention Node's built-in `node:sqlite` module.
**Source**: [Prisma Documentation — SQLite database connector](https://www.prisma.io/docs/orm/overview/databases/sqlite) — Accessed 2026-08-27. Domain: prisma.io (official vendor docs; **commercial interest** noted — Prisma sells hosted services — but adapter lists are verifiable fact, not marketing).
**Verification**: [npm — @prisma/adapter-better-sqlite3](https://www.npmjs.com/package/@prisma/adapter-better-sqlite3) exists as the documented local-SQLite path; Prisma's database-drivers page confirms the adapter architecture.
**Confidence**: High.
**Analysis**: For local SQLite, Prisma's only route is `better-sqlite3` → native compilation → **RED flag**. Prisma additionally carries a code-generation step (`prisma generate`) that must run after install and produces a large generated client; that is another postinstall failure mode and another thing to explain. There is also a live conflict in my sources about whether adapters are now *mandatory* in Prisma v7 (see Conflict C2), but it does not change the verdict: either way, local SQLite means better-sqlite3. **Reject Prisma.**

#### Finding 1.3.4: Kysely has no built-in `node:sqlite` dialect; its bundled SQLite dialect targets `better-sqlite3`
**Evidence**: "Kysely's built-in SQLite dialect uses the `better-sqlite3` driver library under the hood." A tracking issue, "alternate dialects in the multiverse of sqlite", discusses using Node's internal SQLite as an alternate dialect, but this is described as an ongoing consideration rather than an implemented feature.
**Source**: [Kysely — Getting started](https://kysely.dev/docs/getting-started) and [GitHub — kysely-org/kysely issue #1292](https://github.com/kysely-org/kysely/issues/1292) — Accessed 2026-08-27.
**Verification**: Third-party dialect packages exist (`kysely-generic-sqlite`, `kysely-sqlite-tools`), which is itself evidence that core support is absent.
**Confidence**: Medium-High — consistent across the project docs, its issue tracker, and the existence of third-party fill-in packages.
**Analysis**: Kysely is otherwise attractive here: it is a *query builder*, not an ORM, so the SQL stays visible (good for criterion c — a product person can read `selectFrom('match').where('season','=',id)`), and its TypeScript inference is genuinely excellent (good for criterion b — a wrong column name is a compile error naming the column). A Kysely `Dialect` is a small interface, and writing a ~40-line `node:sqlite` dialect is very feasible. But relying on a third-party dialect package (`kysely-generic-sqlite`, thin maintenance) or hand-writing a dialect adds a bespoke component to a repo whose whole point is that students imitate it. **Viable second choice, not first.**

#### Finding 1.3.5: MikroORM ships a `NodeSqliteDialect` for the built-in module
**Evidence**: `NodeSqliteDialect` is available in `@mikro-orm/sql` for use with Node.js 22.5+ and Deno 2.2+.
**Source**: [MikroORM — Usage with SQLite](https://mikro-orm.io/docs/usage-with-sqlite) — Accessed 2026-08-27.
**Confidence**: Low-Medium — single source, surfaced via search summary and not read in full. See Knowledge Gap G3.
**Analysis**: Genuinely interesting as the one mainstream ORM with first-class `node:sqlite` support. But MikroORM is a Data-Mapper ORM with decorators, an identity map, a unit of work, and heavy `reflect-metadata`/decorator TypeScript configuration. That is a large conceptual surface for a mixed room, actively hostile to criterion (c), and it makes the data layer *magic* precisely where the course wants it legible. **Reject on readability and conceptual weight, not on fragility.**

#### Finding 1.3.6: Purpose-built SQLite migration libraries exist but add little over `db.exec()`
**Evidence**: `sqlite-auto-migrator` is "a simple, flexible and automated SQLite database migration library" supporting JS/TS migration files; `kriasoft/node-sqlite` is a "wrapper library written in TypeScript with ZERO dependencies that adds ES6 promises and SQL-based migrations API to sqlite3".
**Source**: [GitHub — SanderGi/sqlite-auto-migrator](https://github.com/SanderGi/sqlite-auto-migrator) and [GitHub — kriasoft/node-sqlite](https://github.com/kriasoft/node-sqlite) — Accessed 2026-08-27.
**Confidence**: Low-Medium — identified via search; maintenance metrics not independently verified. See Knowledge Gap G3.
**Analysis**: `kriasoft/node-sqlite` wraps the `sqlite3` package — a native module — so it is disqualified on the same grounds as better-sqlite3, and its name is confusingly similar to `node:sqlite` (a real trap when searching). `sqlite-auto-migrator` is closer but is a small single-maintainer project; taking a dependency on it trades a known 60 lines of our own code for an unknown 600 lines of someone else's, with no reduction in setup risk. Note also its auto-generation of migrations from schema diffing is a *feature the course does not want*: students should see the SQL.

#### Finding 1.3.7: The ecosystem consensus is that native SQLite bindings are the fragility problem `node:sqlite` solves
**Evidence**: "`node:sqlite` embeds SQLite directly into the Node.js binary, eliminating the need for native compilation. This avoids the issues with better-sqlite3 and sqlite3, which require native bindings compiled via node-gyp that frequently fail on CI runners and Alpine Linux containers."
**Source**: [OneUptime — How to Use SQLite in Node.js Applications](https://oneuptime.com/blog/post/2026-02-02-sqlite-nodejs/view) — Accessed 2026-08-27. Domain: oneuptime.com (vendor engineering blog, Medium trust; cross-referenced below as required).
**Verification**: [Node.js SQLite docs](https://nodejs.org/api/sqlite.html) confirm the module is built into the runtime with no install step (High reputation); Prisma's own docs confirm `better-sqlite3` is a "native SQLite driver" that Bun cannot support, independently attesting to its native-binding nature.
**Confidence**: Medium-High — one High-reputation official source plus two independent corroborations of the underlying mechanism. The specific claim "frequently fail" is the blog's characterisation and is marked as such.
**Analysis**: This is the strongest available external support for the project's existing decision #3/#26 rationale. Worth citing in the pre-class doc.

#### Recommendation 1.3: a repo-local raw-SQL migration runner
Write `backend/src/db/migrate.ts` (~60 lines) that:
1. Reads `backend/migrations/*.sql` sorted by filename (`0001_create_players.sql`, `0002_add_seasons.sql`).
2. Creates a `_migrations(name TEXT PRIMARY KEY, applied_at TEXT)` table if absent.
3. For each unapplied file, in a transaction: `db.exec(sql)` then record the name.
4. Prints `applied 0002_add_seasons.sql` per file and exits non-zero with the **filename and the SQLite error message** on failure.

Why this wins on all three criteria:
- **(a) Fragility — BEST POSSIBLE.** Zero dependencies. Nothing to install, nothing to compile, nothing to download. It cannot fail differently on Windows than on macOS ARM.
- **(b) Agent feedback — EXCELLENT and under our control.** SQLite's own errors are precise (`near "SELCT": syntax error`, `table player has no column named rating`). Because we write the runner, we control the output format: we can print the failing filename, the statement, and the raw SQLite message, which is strictly better agent feedback than most ORM tooling, which wraps and obscures the underlying error. This is a case where hand-rolling *improves* criterion (b) rather than costing it.
- **(c) Readability — EXCELLENT.** `CREATE TABLE match (id INTEGER PRIMARY KEY, ...)` is readable by a product person. A Drizzle schema DSL (`sqliteTable('match', { id: integer().primaryKey() })`) is a second language to learn. Plain SQL is the more universal artefact and transfers to any future job.
- **Course fit — it is itself a teachable gate.** Decision #12/13 wants a gate catalogue where each check is documented on "what it catches, how long it takes, what signal it gives the agent". A 60-line migration runner the students can *read in full* is a far better exhibit than an opaque CLI. It also makes decision #21 (separate ephemeral test DB + one-command `reset`) trivial: `reset` = delete the file, run the runner, run the seed.

**Data access layer to sit on top**: prefer **plain `node:sqlite` prepared statements in hand-written repository functions**, with TypeScript row interfaces. If the team wants compile-time SQL typing later, add Kysely with a small hand-written dialect (Finding 1.3.4) as a contained, reversible upgrade. Do not add Drizzle or Prisma.

### 1.4 Unit test runner

**Verdict up front: Vitest — but by a narrower margin than the internet suggests, and for one specific reason (assertion diff quality as agent feedback), not for the usual reasons. `node:test` is a genuinely strong runner-up and is the right pick if you want to drive the dependency count to near zero.**

#### Finding 1.4.1: `node:test` is Stable, and is far more capable than commonly claimed
**Evidence**: The Node.js documentation states `node:test` is **Stability: 2 - Stable** as of v20.0.0. It supports: watch mode (`node --test --watch`, since v19.2.0), code coverage (`--experimental-test-coverage`, with `lcov` output), a full mocking API (`mock.fn`, `mock.method`, `mock.property`, `mock.timers`, `mock.module`), **snapshot testing stable since v23.4.0**, and built-in `spec`, `tap`, `dot`, `junit` and `lcov` reporters. It runs TypeScript test files natively via type stripping, auto-matching `**/*.test.ts` and related patterns.
**Source**: [Node.js Documentation — Test runner](https://nodejs.org/api/test.html) — Accessed 2026-08-27. Domain: nodejs.org (official, High).
**Confidence**: High (authoritative primary source).

#### Conflict C3 (resolved): secondary sources materially understate `node:test`
**Position A**: "node:test ... lacks watch mode, snapshot testing, and the DX polish of Vitest/Jest" and has "significantly fewer features".
— Source: [PkgPulse — node:test vs Vitest vs Jest 2026](https://www.pkgpulse.com/guides/node-test-vs-vitest-vs-jest-native-test-runner-2026), Medium trust (0.6).
**Position B**: Watch mode has existed since v19.2.0 and snapshot testing has been **stable** since v23.4.0.
— Source: [Node.js official docs](https://nodejs.org/api/test.html), High (1.0).
**Assessment**: **Position B is correct.** The official Node documentation is definitive on its own module's feature set, and the secondary source is simply out of date — a common failure in the SEO-comparison genre, which recycles claims that were true in the Node 18/20 era. **I flag this because it is exactly the kind of stale received wisdom that would otherwise drive this decision.** Anyone re-running this research should weight nodejs.org over comparison blogs.

#### Finding 1.4.2: Vitest is pure JavaScript, MIT, with ~23 runtime dependencies plus Vite
**Evidence**: npm manifest reports `"version": "4.1.11"`, `"license": "MIT"`, `"engines": {"node": "^20.0.0 || ^22.0.0 || >=24.0.0"}`, and 23 runtime dependencies including `vite`, `@vitest/expect`, `@vitest/snapshot`, `@vitest/mocker`, `tinyglobby`, `magic-string`.
**Source**: [npm registry — vitest/latest](https://registry.npmjs.org/vitest/latest) — Accessed 2026-08-27. Domain: registry.npmjs.org (High).
**Confidence**: High.
**Analysis (criterion a)**: All pure JS — **no native compilation, so Vitest does not threaten the failsafe constraint**. But note the second-order effect: 23 direct dependencies plus Vite's own tree is on the order of a few hundred transitive packages. That is more install time, more lockfile, and more surface for a transient npm registry hiccup during pre-class setup. It is a *real* but *modest* fragility cost, and it should be weighed honestly rather than dismissed.

#### Finding 1.4.3: Vitest transpiles TypeScript through Vite with no extra configuration
**Evidence**: "Vitest handles TypeScript and ESM natively, so no ts-jest, no Babel gymnastics." Watch mode "re-runs only affected tests in under 100ms". A standardised 500-test project runs in "roughly 1.5 seconds" versus ~12 seconds for Jest cold.
**Source**: [PkgPulse](https://www.pkgpulse.com/guides/node-test-vs-vitest-vs-jest-native-test-runner-2026) and [Tech-Insider](https://tech-insider.org/vitest-vs-jest-2026/) — Accessed 2026-08-27. Both Medium trust.
**Confidence**: Low-Medium for the specific timings (no published methodology; Jest is not a candidate here so the comparison is beside the point), Medium-High for the qualitative claim about zero-config TypeScript, which is Vitest's documented core design and is not contested by any source I found.
**Analysis**: The TypeScript-config claim was Vitest's decisive historical advantage. **It is now substantially eroded**: Node's own type stripping means `node --test src/**/*.test.ts` also works with no transpiler (Finding 1.4.1). Anyone justifying Vitest purely on "it handles TypeScript" is using a 2023 argument.

#### The actual deciding argument: assertion failure output as agent feedback (criterion b)
This is where the two genuinely differ, and it is the criterion the brief says is first-class.

- **Vitest** uses `@vitest/expect` and `@vitest/pretty-format` (both visible in its dependency list, Finding 1.4.2) to produce **structured, coloured object diffs** on assertion failure — the expected/received tree with the differing branch highlighted, plus file, line and a code frame. For an agent, `- expected: rating: 1200 / + received: rating: 1216` at `elo.ts:42` is a near-complete repair instruction.
- **`node:test`** reports failures via `assert` errors. `assert.deepStrictEqual` does produce a diff, and the `spec` reporter gives file and line. It is good. It is *less* rich than Vitest's, particularly on deeply nested objects.
- **Critical caveat from the primary source**: Node's docs state the test runner's output format is *"subject to change between versions"* and *"should not be relied upon programmatically"*; for machine consumption you are directed to `TestsStream` events or the `junit` reporter.
**Source**: [Node.js Documentation — Test runner](https://nodejs.org/api/test.html) — Accessed 2026-08-27.
**Analysis**: That caveat cuts both ways and is worth understanding precisely. It is a warning against *parsing* the human output — but an agent does not parse it, it *reads* it, so the warning is less binding than it first appears. The honest summary is that Vitest's diffs are somewhat better agent feedback, and that "somewhat" is the whole margin between the two.

#### Recommendation 1.4: Vitest, with `node:test` as a documented, credible alternative
| | Vitest 4.1.11 | `node:test` |
|---|---|---|
| Install cost | ~23 direct deps + Vite tree | **Zero** |
| Native compilation | None | **None** |
| TypeScript | Native via Vite | Native via type stripping |
| Watch / coverage / mocking / snapshots | All, polished | All (coverage still flagged) |
| Assertion diff quality | **Best** | Good |
| Machine-readable output | JSON, JUnit | JUnit, `TestsStream` |
| Output format stability | Stable | Explicitly "subject to change" |
| Licence | MIT | Node (MIT) |

**Why Vitest wins for this course, specifically**: the domain unit/integration layer is the gate the decision doc singles out as giving the agent its highest-quality signal ("a unit test failure names the function that returned the wrong value"). Vitest's diffs maximise exactly that signal. Its fragility cost is real but is *install-size* risk, not *native-build* risk — a different and much milder category.

**Why you might still choose `node:test`**: it would take the backend's entire dependency footprint to Hono (0) + Zod, with the test runner, the SQLite driver and the migration runner all supplied by Node itself. That is a strikingly good story to *tell in the room* — "the whole gate catalogue runs on what ships with Node" — and it is close to unbreakable on any laptop. If pre-class setup failures turn out to be the dominant risk in a dry run, switch to `node:test` and lose little.

**Do not use Jest.** It requires `ts-jest` or Babel configuration for TypeScript, has a slower cold start, and its ESM support remains awkward. No source in this research recommends it for a new 2026 TypeScript project.

### 1.5 `playwright-bdd` current state

**Verdict up front: `playwright-bdd` is healthy and actively maintained. It is not a risk to the course design.** This was the biggest single risk in the brief and the evidence clears it.

#### Finding 1.5.1: Latest release is v9.2.0, MIT-licensed, released ~2 months ago
**Evidence**: npm registry metadata for `playwright-bdd` reports `"version": "9.2.0"`, `"license": "MIT"`, `"engines": {"node": ">=20"}`, and a single peer dependency `"@playwright/test": ">=1.44"`.
**Source**: [npm registry — playwright-bdd/latest](https://registry.npmjs.org/playwright-bdd/latest) — Accessed 2026-08-27. Domain: registry.npmjs.org (official package registry, primary source for version facts, reputation High).
**Verification**: [GitHub — vitalets/playwright-bdd releases](https://github.com/vitalets/playwright-bdd/releases) — Accessed 2026-08-27, lists v9.2.0 (18 June), v9.1.0 (13 June), v9.0.0 (2 June), v8.5.1 (12 May), v8.5.0 (13 March).
**Confidence**: High (two independent primary sources — registry metadata and repository release history — agree on version 9.2.0).

**Date caveat, stated plainly**: GitHub's releases page omits the year for dates in the current year. The rendered dates therefore read as bare "June 18" etc. I infer these are **2026** dates because v9.1.0's release note is "support for Playwright 1.61", and Playwright 1.61 is a 2026 release (1.60 shipped May 2026, 1.62 in July 2026 — see Finding 1.5.3). This inference is strong but is an inference; if exact dates matter, confirm via `npm view playwright-bdd time`.

#### Finding 1.5.2: Recent releases track Playwright closely and the project is not stagnating
**Evidence**: Release notes show v9.1.0 "introduced support for Playwright 1.61"; v8.5.1 "addressed compatibility with Playwright 1.60 and later"; v8.4.0 "added support for Playwright 1.55" and raised the minimum from 1.42 to 1.44. v9.0.0 was a deliberate maintenance major: stricter Cucumber-compatible step-definition arity validation, `@cucumber/messages` 27.x → 32.x, `@cucumber/gherkin` 32.x → 39.x, Node 20 minimum, and `fast-glob` replaced with `tinyglobby`.
**Source**: [GitHub — vitalets/playwright-bdd releases](https://github.com/vitalets/playwright-bdd/releases) — Accessed 2026-08-27. Domain: github.com (reputation Medium-High; but this is the project's own release channel, i.e. a primary source).
**Verification**: The dependency list in the npm registry metadata independently corroborates the Cucumber upgrades — `@cucumber/gherkin: ^39.1.0`, `@cucumber/messages: ^32.3.1`, `tinyglobby: 0.2.17`, no `fast-glob`. Two sources, one derived from published artefacts rather than prose.
**Confidence**: High.
**Analysis**: The pattern — a compatibility patch within weeks of each Playwright minor, plus a willingness to cut a breaking major to modernise the Cucumber stack — is the signature of a maintained project, not a bit-rotting one. The project also stated a policy of supporting "all non-deprecated versions of Playwright".

#### Finding 1.5.3: Playwright itself is on ~6-week cadence, currently ~1.62
**Evidence**: Playwright 1.60.0 was released May 2026; v1.62 is described as the current release published July 2026, with releases roughly every six weeks.
**Source**: [Currents — Playwright 1.60.0 Release Updates](https://currents.dev/posts/pw-1.60.0) — Accessed 2026-08-27. Domain: currents.dev (vendor blog, Medium trust; **commercial interest** — Currents sells Playwright test orchestration, so treat its editorial framing sceptically; the bare version/date facts are low-risk).
**Confidence**: Medium — version numbers are consistent with playwright-bdd's release notes referencing 1.61, but I did not reach playwright.dev's release notes directly. See Knowledge Gap G1.
**Analysis**: The practical consequence for the course: pin `@playwright/test` and `playwright-bdd` exactly in the lockfile. A pair that runs `npm update` mid-course could land a Playwright minor that is a week ahead of playwright-bdd. Exact pinning costs nothing and removes the failure mode entirely.

#### Finding 1.5.4: playwright-bdd ships an agent skill for generating feature files and step definitions
**Evidence**: Recent project updates include "adding an agent skill for generating Gherkin feature files and step definitions".
**Source**: [GitHub — vitalets/playwright-bdd](https://github.com/vitalets/playwright-bdd/releases) via search summary — Accessed 2026-08-27.
**Confidence**: Low-Medium — surfaced via search summarisation, not read directly from the repository. See Knowledge Gap G2.
**Analysis (interpretation, not fact)**: If accurate, this is directly relevant. The course is about encoding process as agent skills, and the primary E2E tool shipping its own agent skill is both a useful artefact to adapt *and* a ready-made worked example of the course's own thesis. Worth verifying before relying on it, and worth reading regardless — but note the course's decision #7 (hand-rolled kit built in class) means it should be shown as a comparison, not pre-installed.

#### Setup fragility and agent-feedback assessment for playwright-bdd
- **(a) Fragility — MEDIUM, and it is the worst offender in the whole stack.** `playwright-bdd` itself is pure JS with no native deps. But it requires `@playwright/test`, which requires `npx playwright install` to download browser binaries (hundreds of MB) from Microsoft's CDN. On a heterogeneous set of laptops this is the most likely pre-class failure: corporate proxies, TLS interception, slow or metered connections, and disk space. **Mitigation**: (i) install only Chromium (`npx playwright install chromium`), not all three engines; (ii) make browser-binary presence an explicit, separately-reported check in `verify-setup` so the failure is named precisely rather than surfacing later as a cryptic E2E error; (iii) because decision #22 makes all three test layers optional, a pair with no browsers can still do the whole day on typecheck + unit tests. That last point is a genuine architectural safety net — say so in the pre-class doc so nobody panics.
- **(b) Agent feedback — MEDIUM, structurally.** This is inherent to E2E, not a flaw in playwright-bdd. As decision-doc §"gates serve two masters" already states, an E2E failure says "the scenario failed" and the agent must investigate. playwright-bdd improves on raw Playwright here in two specific ways worth teaching: it maps failures back to the **`.feature` file line and the Gherkin step text**, and its v9 "Cucumber-compatible arity validation" turns a class of step-definition mistakes into a fast, precise startup error rather than a confusing runtime failure. Playwright's trace viewer is excellent for humans and poor as agent-consumable text; prefer the `list` reporter plus JSON/JUnit output when the agent is the consumer.
- **(c) Readability — HIGH.** This is the point. A product person can read and write a `.feature` file. That is the whole reason decision #5 (Gherkin-native) and decision #24 (Cowork spec-authoring) hang together.

#### Alternatives, in case the risk assessment changes
Named for completeness, not recommended over playwright-bdd:
1. **`@cucumber/cucumber` + Playwright driven manually** — the classic combination. Costs you Playwright's parallelism, fixtures, retries, HTML reporter and trace viewer, all of which you would then reimplement. Strictly worse here.
2. **Plain Playwright tests with Gherkin-shaped `test.step()` names** — zero extra dependency, and failures still report step names. But it breaks decision #5: the feature file stops being the executable artefact, so the product person's document drifts from the test again. This is the specific failure the Gherkin-native decision exists to prevent. Viable only as an emergency fallback.
3. **`cucumber-js` with the Playwright driver via `@cucumber/playwright`-style glue** — thin community projects; less maintained than playwright-bdd. No advantage.

**Conclusion: keep `playwright-bdd`. Pin it and `@playwright/test` exactly. The residual risk is browser-binary download, not the library.**

### 1.6 Recommended stack (Part 1 summary)

| Decision | Recommendation | Version verified 2026-08-27 | Confidence | Fragility | Agent feedback |
|---|---|---|---|---|---|
| Backend framework | **Hono** | 4.13.5, MIT, **0 runtime deps** | High | **Best** | Excellent (+ Zod) |
| Request validation | **Zod** | 4.4.3, MIT, **0 runtime deps** | High | **Best** | **Excellent** |
| Node HTTP adapter | **@hono/node-server** | 2.1.1, MIT, **0 runtime deps**, peer `hono ^4` | High | **Best** | — |
| Frontend | **Vite + Svelte (`svelte-ts`)** | Vite 8.2.2 | Medium | Low | Good |
| DB driver | **`node:sqlite`** | Node ≥25.7 = RC; built in | High | **Best** | Good (precise SQLite errors) |
| Migrations | **Repo-local raw-SQL runner (~60 lines)** | n/a — ours | High | **Best** | **Excellent** (we control it) |
| Data access | **Hand-written repositories on prepared statements** | n/a | High | **Best** | Good |
| Unit tests | **Vitest** | 4.1.11, MIT | Medium-High | Low | **Best** (object diffs) |
| E2E / BDD | **playwright-bdd + @playwright/test** | pw-bdd 9.2.0, MIT, peer `>=1.44` | High | **Medium** (browser download) | Medium (inherent to E2E) |
| Typecheck | **`tsc --noEmit`, strict** | — | High | **Best** | **Best** (file, line, reason, seconds) |

#### Finding 1.6.1: the entire recommended backend has **zero transitive runtime dependencies**
**Evidence**: npm registry manifests report `hono` 4.13.5 with no `dependencies` field; `zod` 4.4.3 with no `dependencies` field and `"sideEffects": false`; `@hono/node-server` 2.1.1 with no `dependencies` field and peer `hono: ^4`. All three MIT.
**Source**: [npm registry — hono/latest](https://registry.npmjs.org/hono/latest), [zod/latest](https://registry.npmjs.org/zod/latest), [@hono/node-server/latest](https://registry.npmjs.org/@hono/node-server/latest) — all Accessed 2026-08-27. Domain: registry.npmjs.org (official registry, primary source, High).
**Confidence**: High (three primary registry manifests).
**Analysis**: The backend's production dependency tree is **three packages, all pure JavaScript, none with any transitive dependency at all**. SQLite, the migration runner, and (if `node:test` is chosen) the test runner come from Node itself. This is about as close to unbreakable as an npm install gets: no native module can be pulled in transitively because there are no transitive packages. **This is the headline fact for the pre-class doc** — and it is a strong, evidence-backed vindication of decisions #3 and #26.

#### The three things that can still break a pair's setup, ranked
1. **Playwright browser binaries** (Finding 1.5) — largest download, most exposed to corporate proxies. *Mitigation*: `npx playwright install chromium` only; separate explicit check in `verify-setup`; and the architectural safety net that all three test layers are optional (decision #22), so a pair without browsers can still complete the day.
2. **Vite's platform-specific optional dependencies** (Finding 1.2.2 FLAG) — the `Cannot find module @rollup/rollup-<platform>` class of error. *Mitigation*: instruct `npm install` (not `npm ci`) on each machine; `verify-setup` must actually boot the app and hit it, not just check `node_modules` exists.
3. **Accidental reintroduction of `better-sqlite3`** (Findings 1.3.1, 1.3.3) — the only *fatal* one, because it needs a C++ toolchain. It enters via Drizzle Kit, Prisma, or Kysely's default dialect. *Mitigation*: **add an automated guard.** A trivial gate that greps the lockfile for `better-sqlite3`, `node-gyp`, `prebuild-install` and `sqlite3` and fails loudly is worth writing — and, pleasingly, it is itself a good entry in the gate catalogue (decision #12/13): fast, precise, and it defends a stated architectural constraint. That is a nice worked example of a gate that protects a *decision* rather than a behaviour.

#### Explicit rejections and why
| Rejected | Primary reason |
|---|---|
| **Prisma** | Local SQLite requires `@prisma/adapter-better-sqlite3` → native compilation. Plus a `generate` step. |
| **Drizzle** | `drizzle-kit` cannot connect via `node:sqlite`; `node:sqlite` support is on the `@rc` line, not stable. |
| **Kysely** (as first choice) | No built-in `node:sqlite` dialect; bundled dialect targets better-sqlite3. Good second choice with a hand-written dialect. |
| **MikroORM** | Has `NodeSqliteDialect`, but decorators + unit-of-work are far too heavy for a mixed room (criterion c). |
| **NestJS** | DI container and decorators are opaque to a non-developer; also prescribes structure, which steals an exercise. |
| **Express** | `req.body` typed `any` — blinds the typechecker exactly at the API boundary, weakening the best agent-feedback gate. |
| **SvelteKit / Next.js / Astro** | Meta-frameworks own the server; structurally contradicts decision #27. |
| **Jest** | Needs ts-jest/Babel for TypeScript; slower; awkward ESM. |
| **Docker / CI** | Already decided against (#11, #26); nothing found in this research argues for revisiting. |

---

## PART 2 — Baseline App Candidates

**Verdict up front: generate the baseline from scratch (agent-built, human-curated). No surveyed candidate is good enough, and the reason is structural rather than incidental — every maintained starter is optimised for production-readiness, which is the opposite of what this course needs. This is the "honest option" the brief invited, and the evidence points at it clearly.**

Note on framing: decision-doc item 8 records that "brownfield is pedagogically stronger regardless of effort saved". That argument survives — but it argues for the baseline being a *pre-existing codebase the students did not write*, which is satisfied by any pre-built app, including a generated one. It does not require the code to come from a third party. Recommendation 2.3 preserves the brownfield benefit while discarding the third-party baggage.

### 2.1 Candidate survey

#### Candidate A: bulletproof-react
**Evidence**: "A simple, scalable, and powerful architecture for building production ready React applications." MIT licence, **35.8k stars**, 3.3k forks, 271 commits on master. The author states explicitly: *"This is not supposed to be a template, boilerplate or a framework."* **No backend is included** — it focuses exclusively on frontend React architecture. Sample apps use Vite *and* Next.js.
**Source**: [GitHub — alan2207/bulletproof-react](https://github.com/alan2207/bulletproof-react) — Accessed 2026-08-27. Domain: github.com (project's own repository, primary source, Medium-High).
**Confidence**: High (repository landing page is authoritative for its own licence, popularity and self-description).
**Assessment**:
- *Quality of bones*: **Excellent** — this is arguably the best-articulated feature-folder structure in the React ecosystem, and its `src/features/*` layout is worth stealing.
- *Licence*: MIT — fine for commercial training.
- *Maintenance*: Healthy by star count and fork count; exact last-commit date not visible on the page I fetched (Knowledge Gap G7).
- *Domain swappability*: n/a.
- *Fit with Part 1 stack*: **Fails.** No backend at all, so it cannot satisfy decision #27. Its Next.js example is a meta-framework (rejected in Finding 1.2.1).
**Verdict: reject as a baseline; harvest as a reference for frontend folder structure.**

#### Candidate B: Epic Stack (Kent C. Dodds)
**Evidence**: "A Full Stack app starter with the foundational things setup and configured." MIT licence, **5.5k stars**, 463 forks, 1,043 commits on main. Stack: React Router, Vite, **Prisma**, Playwright, ESLint/Prettier, with `fly.toml` for **Fly.io deployment**. Setup via `npx epicli`.
**Source**: [GitHub — epicweb-dev/epic-stack](https://github.com/epicweb-dev/epic-stack) — Accessed 2026-08-27. Primary source, Medium-High.
**Confidence**: High.
**Assessment**:
- *Quality of bones*: **Excellent, and genuinely exemplary** — Kent C. Dodds's testing philosophy is well-reasoned and this is a serious, opinionated codebase.
- *Licence*: MIT — fine.
- *Maintenance*: Actively maintained (1,043 commits, well-known maintainer).
- *Domain swappability*: **Poor.** It ships authentication, email, permissions/roles, 2FA, monitoring, error tracking and a deployment story. Stripping all that out is a larger job than writing the app.
- *Fit with Part 1 stack*: **Fails on three counts.** (1) **Prisma** → `@prisma/adapter-better-sqlite3` → **native compilation** (Finding 1.3.3) — a direct violation of the failsafe constraint. (2) React Router (framework mode) is a meta-framework — violates decision #27 (Finding 1.2.1). (3) Fly.io deployment config directly contradicts decision #11 (no CI/CD, no online deploy).
**Verdict: reject.** It is an outstanding project solving a different problem. The mismatch is not fixable by configuration.

#### Candidate C: Better-T-Stack (`create-better-t-stack`)
**Evidence**: A CLI for scaffolding type-safe TypeScript projects; philosophy is "roll your own stack: you pick only the parts you need, nothing extra." MIT licence, **5.7k stars**, 321 forks, **1,530 commits on main** (active development). Options: Frontend — React (TanStack Router, React Router, TanStack Start), Next.js, Nuxt, **Svelte**, Solid, Astro, React Native, or none. Backend — **Hono**, Express, Fastify, Elysia, Convex, or none. API layer — tRPC, oRPC, or **none**. Runtime — Bun, **Node.js**, Cloudflare Workers. Database — **SQLite**, PostgreSQL, MySQL, MongoDB, or none. ORM — Drizzle, Prisma, or **none**. Supports **monorepo layouts with separate apps**.
**Source**: [GitHub — AmanVarshney01/create-better-t-stack](https://github.com/AmanVarshney01/create-better-t-stack) — Accessed 2026-08-27. Primary source, Medium-High.
**Verification**: [noqta.tn tutorial](https://noqta.tn/en/tutorials/better-t-stack-type-safe-fullstack-typescript-scaffold-2026) — Accessed 2026-08-27, Medium trust — independently describes it as scaffolding "a Hono server exposing a tRPC API backed by Drizzle and SQLite, with separate backend and frontend applications".
**Confidence**: Medium-High (repo page plus one independent write-up agree on capabilities).
**Assessment**:
- *Quality of bones*: **Unverified.** Star count and commit count measure the *CLI's* popularity, not the quality of the code it emits. I did not inspect generated output. **This is the most important gap in Part 2** — see Knowledge Gap G8.
- *Licence*: MIT — fine.
- *Maintenance*: Strong (1,530 commits, active).
- *Domain swappability*: **Excellent** — it generates a skeleton with no domain at all, so there is nothing to swap out.
- *Fit with Part 1 stack*: **The closest of any candidate.** Hono + Node + SQLite + separate apps + "none" for both ORM and API layer is selectable and lands almost exactly on the Part 1 recommendation.
**Critical caveat**: the SQLite driver is **not documented on the page I fetched**, and the tutorial describes the default path as Drizzle. If Better-T-Stack's SQLite option uses Drizzle + drizzle-kit, it will pull in `better-sqlite3` (Finding 1.3.1) — **the exact native-compilation failure mode the course must avoid**. Selecting `--orm none` likely sidesteps this, but *likely* is not good enough for a load-bearing constraint. **Verify before use** (Knowledge Gap G8).
**Verdict: the only serious candidate — but as a *scaffolding step*, not as a baseline app.** It generates an empty skeleton; the domain, the features, the Gherkin specs, the gate catalogue and the test examples — i.e. everything the course actually needs — would still have to be written.

#### Candidate D: RealWorld / Conduit
**Evidence**: RealWorld is "the mother of all demo apps" — a Medium.com clone called Conduit. "Every tutorial is built against the same API spec... Over 100 implementations have been created." Implementations are community-maintained under various licences, commonly MIT.
**Source**: [RealWorld project, via GitHub implementations](https://github.com/TonyMckes/conduit-realworld-example-app) and [Conduit documentation](https://noriste.github.io/reactjsday-2019-testing-course/book/the-realworld-project.html) — Accessed 2026-08-27.
**Confidence**: Medium — the RealWorld concept and MIT licensing are well attested, but there is "no single centrally-maintained reference implementation in 2026"; quality varies per implementation and I verified none individually.
**Assessment**:
- *Quality of bones*: **Highly variable and unverifiable at scale.** Community implementations differ enormously. The specific implementations surfaced use React + **Express.js + Sequelize + PostgreSQL** — wrong on the database, the ORM and (per Finding 1.1.3) the framework's type safety.
- *Licence*: usually MIT, but **must be checked per implementation** — a licence audit is a real cost.
- *Maintenance*: **Poor / bitrotted.** Many implementations date from the 2019–2021 era; the search surfaced repos referencing Bootstrap 4 and Cypress-era tooling.
- *Domain swappability*: **Poor.** Conduit is a Medium clone — articles, comments, favourites, follows, tags. Swapping the domain means rewriting the app.
- *Domain fit*: also fails decision-doc item 4's "something more fun" requirement; a blogging clone is precisely the tired demo domain the user is trying to get away from.
**Verdict: reject.** Bitrot, licence-audit cost, wrong stack, unfun domain.

#### Candidate E: official Vite templates (`npm create vite@latest`)
**Evidence**: Vite ships `svelte-ts`, `react-ts`, `vanilla-ts` and others; maintained by the Vite core team as part of the Vite release process. Current Vite is v8.2.2. MIT.
**Source**: [Vite — Getting Started](https://vite.dev/guide/) — Accessed 2026-08-27. Domain: vite.dev (official, High).
**Confidence**: High.
**Assessment**: Maintenance is **the best of any candidate** (released in lockstep with Vite itself, by the core team). Licence MIT. Domain swappability trivially perfect — there is no domain. But it is a *frontend* scaffold only: a counter component and a stylesheet. **Not a baseline app; the correct starting point for the frontend directory.**
**Verdict: use, as a scaffold for `frontend/` only.**

#### Candidate F: build from scratch (agent-generated, human-curated)
No external source; this is the synthesis option. Assessed in 2.3.

### 2.2 Assessment against criteria

| Candidate | Bones | Licence | Maintenance | Domain swap | Fits Part 1 stack | Native-compile risk |
|---|---|---|---|---|---|---|
| A. bulletproof-react | Excellent (FE only) | MIT | Good | n/a | **No** — no backend, Next.js | None |
| B. Epic Stack | Excellent | MIT | Strong | **Poor** | **No** — Prisma, meta-framework, Fly.io | **YES (Prisma→better-sqlite3)** |
| C. Better-T-Stack | **Unverified** | MIT | Strong | Excellent | **Closest** | **Unverified — check SQLite driver** |
| D. RealWorld/Conduit | Variable/poor | Varies (usually MIT) | **Bitrotted** | Poor | No — Express/Sequelize/Postgres | Depends |
| E. Vite templates | Good (FE only) | MIT | **Best** | Perfect (none) | Yes, for `frontend/` | Optional-deps caveat (1.2.2) |
| F. From scratch | **Controllable** | Ours | Ours | Perfect | **Exact** | **None** |

**The structural finding, which is the real answer to Research Item 3:** every maintained starter in this space is optimised for **production-readiness** — auth, deployment, observability, CI, migrations-at-scale, error tracking. Those are precisely the concerns this course has *deliberately deleted* (decisions #11 no CI/CD, #26 no Docker, #6 SpecKit dropped, #25 minimal services). **The better a starter is at its own job, the worse it fits this course.** That inverse relationship is not a coincidence to be worked around; it is the reason the survey comes up empty, and it is why more searching would not have found a better candidate.

Two further course-specific arguments against any third-party baseline:
1. **Decision-doc item 8 already names the risk**: "students imitate the baseline's structure, naming and test style, so its bones must be *deliberately* exemplary." *Deliberately* is the operative word. Adopting someone else's codebase means inheriting every naming and structural choice they made for *their* reasons — and then having to defend each one in a room of people who will copy it.
2. **The repo must not prescribe a process** (decision-doc §1: "Anything the repo prescribes steals an exercise"). Production starters are dense with embedded process opinions — commit hooks, lint-staged, conventional commits, PR templates, CI workflows. Every one of those either has to be stripped out, or it silently pre-answers an exercise the students are supposed to do themselves. **A third-party starter is an unexamined process smuggled into a course about examining your process.** This is the strongest single argument in Part 2.

### 2.3 Recommendation: build the baseline from scratch, scaffolded by Vite, curated by a human

Concretely:
1. **`frontend/`** — `npm create vite@latest frontend -- --template svelte-ts` (Candidate E). Delete the demo counter. Zero domain.
2. **`backend/`** — hand-created: `npm init`, add `hono` and `zod`, plus `@hono/node-server`. Nothing else. There is no meaningful scaffold to inherit here; a Hono app's entry point is about fifteen lines.
3. **Domain, repositories, migrations, Gherkin features, gate catalogue** — generated by Claude Code from an explicit written brief, then **read line by line and edited by a human**.
4. **Structure to borrow, not fork**: take bulletproof-react's feature-folder idea (Candidate A) as *inspiration* for `backend/src/<feature>/` and `frontend/src/<feature>/`. Read it; do not depend on it.
5. **Optional shortcut, with a caveat**: run Better-T-Stack (Candidate C) once with `--backend hono --runtime node --database sqlite --orm none --api none` to see its layout, then **verify whether any `better-sqlite3` dependency appears in the generated `package.json`**. If it is clean, it is a legitimate accelerator. If not, discard it and hand-roll. Either way, treat its output as a reference to read, not a foundation to inherit.

**Why building from scratch is unusually cheap in this specific case** — this is the argument that makes the recommendation practical rather than merely principled:
- The stack is tiny: Hono (0 deps) + Zod + `node:sqlite` + a 60-line migration runner + Vitest + Playwright/playwright-bdd. There is almost nothing to configure.
- The app is small by design: decision-doc item 4 requires only "several feature-shaped holes". A handful of entities and endpoints.
- Maximum pre-building is already decided (decision-doc §2, "Pre-building: **Maximum**"), so the effort is expected and budgeted.
- The course is *about* an agent building software from specifications. **Building the baseline this way is a dogfooding rehearsal of the exact loop being taught** — and it produces, as a free by-product, a worked example, a realistic estimate of how long a cycle takes, and early discovery of where the agent struggles. That intelligence is worth more than the days saved by forking.

**Honest counter-argument, recorded rather than buried**: building from scratch forfeits the battle-testing embedded in a 35.8k-star repository, and an agent-generated baseline can contain subtle incoherence — inconsistent naming across files, tests that assert on implementation rather than behaviour, dead abstractions — that a human skimming will miss. Since students will imitate exactly these properties, the human curation step in point 3 is **not optional and is the main cost of this recommendation**. Budget real time for it. A useful mitigation: write the Gherkin features *first*, by hand, and have the agent build against them — this is the course's own method, and it constrains the generated code to behaviour you specified.

**Residual risk if this recommendation is wrong**: if the from-scratch baseline turns out worse than expected, the fallback is Better-T-Stack's skeleton (Candidate C) with the domain written on top — a modest change of course, not a restart. The risk is therefore bounded.

---

## Source Analysis

| Source | Domain | Reputation | Type | Access date | Cross-verified |
|---|---|---|---|---|---|
| Node.js Docs — SQLite | nodejs.org | High (1.0) | Official | 2026-08-27 | Y |
| Node.js Docs — Test runner | nodejs.org | High (1.0) | Official | 2026-08-27 | Y (corrected a secondary source) |
| npm registry — playwright-bdd | registry.npmjs.org | High (1.0) | Official registry | 2026-08-27 | Y |
| npm registry — hono | registry.npmjs.org | High (1.0) | Official registry | 2026-08-27 | Y |
| npm registry — fastify | registry.npmjs.org | High (1.0) | Official registry | 2026-08-27 | Y |
| npm registry — vitest | registry.npmjs.org | High (1.0) | Official registry | 2026-08-27 | Y |
| npm registry — zod | registry.npmjs.org | High (1.0) | Official registry | 2026-08-27 | Y |
| npm registry — @hono/node-server | registry.npmjs.org | High (1.0) | Official registry | 2026-08-27 | Y |
| npm registry — drizzle-orm / drizzle-kit | registry.npmjs.org | High (1.0) | Official registry | 2026-08-27 | Y |
| Vite — Getting Started | vite.dev | High (1.0) | Official docs | 2026-08-27 | Y |
| Drizzle ORM — Node SQLite | orm.drizzle.team | High (1.0) | Official docs | 2026-08-27 | Y |
| Drizzle ORM — Migrations | orm.drizzle.team | High (1.0) | Official docs | 2026-08-27 | Y |
| Drizzle ORM — Latest releases | orm.drizzle.team | High (1.0) | Official docs | 2026-08-27 | **N — internally inconsistent, see C1** |
| Prisma Docs — SQLite connector | prisma.io | High (1.0) | Official docs | 2026-08-27 | Y (commercial interest noted) |
| Kysely — Getting started | kysely.dev | High (1.0) | Official docs | 2026-08-27 | Y |
| MikroORM — Usage with SQLite | mikro-orm.io | High (1.0) | Official docs | 2026-08-27 | **N — single source, G3** |
| GitHub — drizzle-orm issue #5471 | github.com | Medium-High (0.8) | Project issue tracker | 2026-08-27 | Y |
| GitHub — kysely issue #1292 | github.com | Medium-High (0.8) | Project issue tracker | 2026-08-27 | Y |
| GitHub — vitalets/playwright-bdd releases | github.com | Medium-High (0.8) | Project releases | 2026-08-27 | Y |
| GitHub — alan2207/bulletproof-react | github.com | Medium-High (0.8) | Project repo | 2026-08-27 | Y |
| GitHub — epicweb-dev/epic-stack | github.com | Medium-High (0.8) | Project repo | 2026-08-27 | Y |
| GitHub — AmanVarshney01/create-better-t-stack | github.com | Medium-High (0.8) | Project repo | 2026-08-27 | Y |
| GitHub — sqlite-auto-migrator, kriasoft/node-sqlite | github.com | Medium-High (0.8) | Project repos | 2026-08-27 | N — G3 |
| GitHub — RealWorld/Conduit implementations | github.com | Medium-High (0.8) | Project repos | 2026-08-27 | Partial |
| Encore — Nest vs Fastify vs Hono | encore.dev | Medium (0.6) | Vendor article | 2026-08-27 | Y — **competitor bias** |
| PkgPulse comparisons (×3) | pkgpulse.com | Medium (0.6) | SEO comparison | 2026-08-27 | Partial — **one claim refuted, C3** |
| APIScout comparison | apiscout.dev | Medium (0.6) | SEO comparison | 2026-08-27 | Y |
| Kanopy — Hono vs Express vs Fastify | kanopylabs.com | Medium (0.6) | Vendor blog | 2026-08-27 | Partial |
| Currents — Playwright 1.60 | currents.dev | Medium (0.6) | Vendor blog | 2026-08-27 | Partial — **commercial interest** |
| OneUptime — SQLite in Node.js | oneuptime.com | Medium (0.6) | Vendor blog | 2026-08-27 | Y |
| Strapi / DreamHost / Windframe — Svelte vs React | various | Medium (0.6) | Vendor blogs | 2026-08-27 | Y (3-way, independence uncertain) |
| Tech-Insider — Vitest vs Jest | tech-insider.org | Medium (0.6) | Blog | 2026-08-27 | Partial |
| noqta.tn — Better-T-Stack | noqta.tn | Medium (0.6) | Tutorial | 2026-08-27 | Y |
| `docs/course-design-decisions.md` | repo-internal | Authoritative for this project | Decision record | 2026-08-27 | n/a |

**Reputation distribution**: High: 16 (~47%) | Medium-High: 9 (~26%) | Medium: 9 (~27%). **Weighted average ≈ 0.82.**

**Bias notes applied during analysis**:
- `encore.dev` sells a competing backend framework — its Nest/Fastify/Hono framing is not disinterested; only its structural characterisations were used.
- `currents.dev` sells Playwright test orchestration — used only for version/date facts.
- `prisma.io` sells hosted Prisma services — but its adapter list is a verifiable technical fact and was used as such, and the finding it supports is *against* Prisma.
- The Svelte-vs-React sources are all Medium-trust commercial blogs in a genre that recycles framing; genuine independence is **uncertain** and the confidence rating was reduced accordingly.
- The `pkgpulse.com` / `apiscout.dev` / `kanopylabs.com` cluster may share upstream sources — possible **circular reference**. Per `source-verification`, these were treated closer to one source than three, and no finding rests on them alone.

**Deliberate methodological choice**: every load-bearing claim in this document (dependency counts, licences, versions, driver support, module stability) rests on **primary sources** — npm registry manifests, official project documentation, or project issue trackers. Medium-trust blogs were used only for qualitative colour and are labelled as such throughout. Where a Medium-trust source contradicted a primary source, the primary source won and the conflict is recorded (C3).

## Knowledge Gaps

### G1: Exact current Playwright version and release date not confirmed from playwright.dev
**Issue**: Playwright 1.62 / July 2026 comes from a vendor blog with commercial interest, not from playwright.dev's release notes.
**Attempted**: Search for Playwright 2026 release information; found vendor and aggregator coverage only.
**Impact**: Low — playwright-bdd declares peer `@playwright/test >=1.44`, so any recent version satisfies it.
**Recommendation**: Run `npm view @playwright/test version` when pinning. One command settles it.

### G2: playwright-bdd's bundled "agent skill" not verified directly
**Issue**: Finding 1.5.4 rests on a search-result summary, not on the repository content.
**Attempted**: Fetched the releases page; the item did not appear in the rendered excerpt.
**Impact**: Medium for course design — if real, it is directly relevant to the course's subject matter and worth reading.
**Recommendation**: Browse `vitalets/playwright-bdd` for a `skills/` or `.claude/` directory, and check the v9.x release notes in full.

### G3: Maintenance metrics for MikroORM's NodeSqliteDialect and the small migration libraries
**Issue**: `NodeSqliteDialect`, `sqlite-auto-migrator` and `kriasoft/node-sqlite` were identified via search summaries; last-release dates, issue counts and maintainer activity were not verified.
**Attempted**: One search each; not fetched individually.
**Impact**: **Low** — all three are rejected on grounds (conceptual weight; native `sqlite3` dependency; no advantage over 60 lines of our own code) that better maintenance metrics would not change.
**Recommendation**: No action unless the raw-SQL runner recommendation is revisited.

### G4: Hono's real-world ergonomics on Node not assessed hands-on
**Issue**: Hono originated in the edge/Workers world. Its Node story runs through `@hono/node-server` (verified: v2.1.1, zero deps). I did not verify Node-specific ergonomics such as static file serving, graceful shutdown, or streaming behaviour.
**Attempted**: Registry manifests and comparison articles; no hands-on and no Node-specific documentation fetched.
**Impact**: **Medium** — this is the least-verified aspect of the primary backend recommendation.
**Recommendation**: Build a spike — Hono + `@hono/node-server` + one `node:sqlite` route — before committing. An hour settles it, and it doubles as the first commit.

### G5: No authoritative source for the Vite optional-dependencies failure mode
**Issue**: The `Cannot find module @rollup/rollup-<platform>` class of failure is recorded in Finding 1.2.2 as engineering judgement. Vite's own docs are silent on it and I found no High-reputation source documenting it.
**Attempted**: Fetched the Vite guide; it does not discuss native or optional dependencies.
**Impact**: **Medium** — it drives a concrete instruction in the pre-class doc (`npm install`, not `npm ci`).
**Recommendation**: Search npm/Vite/Rollup issue trackers for the specific error string before writing the pre-class doc. The mitigation is cheap and harmless regardless, so act on it either way.

### G6: "Readability" claims rest entirely on Medium-trust sources
**Issue**: The Svelte-over-React readability finding (1.2.3) has no High-reputation backing, and the State of JS 27% figure (1.2.4) is second-hand.
**Attempted**: Searched for survey data and comparisons; the genre is dominated by commercial blogs.
**Impact**: **Medium** — readability is one of the three stated criteria, and this is the weakest evidence base in the document.
**Recommendation**: Treat the frontend choice as **provisional**. The empirical test that actually matters is not a survey: show a product person twenty lines of Svelte and twenty of React and watch. Also run a Claude Code spike in both to test the agent-reliability counter-argument in 1.2.4, which is currently unsourced judgement.

### G7: Last-commit dates not captured for the baseline candidates
**Issue**: I recorded stars, forks and total commit counts, but not last-commit dates or open-issue counts — the actual bitrot indicators the brief asked for.
**Attempted**: Repository landing pages; the rendered excerpts did not include dated commit information.
**Impact**: **Low** for the recommendation (which is to build from scratch), **Medium** if Better-T-Stack is adopted as an accelerator.
**Recommendation**: `gh repo view AmanVarshney01/create-better-t-stack --json pushedAt,openIssues` before relying on it.

### G8: Better-T-Stack's generated output was never inspected — the largest gap in Part 2
**Issue**: Its *quality of bones* — the dominant criterion per the brief — is **entirely unassessed**. Star and commit counts measure the CLI's popularity, not the code it emits. Its SQLite driver choice is also unconfirmed, and if it is Drizzle-based it reintroduces `better-sqlite3` (Finding 1.3.1).
**Attempted**: Repository page plus one third-party tutorial; no generated project inspected.
**Impact**: **High** if Better-T-Stack is adopted; **Low** under the from-scratch recommendation.
**Recommendation**: If considered at all, generate a project with `--backend hono --runtime node --database sqlite --orm none --api none`, then grep the lockfile for `better-sqlite3` and read the emitted source. Thirty minutes, and it converts the single largest unknown in Part 2 into a fact.

### G9: SQLite-vs-server-database semantic divergence not researched
**Issue**: Research-brief item 5 asks whether anything about SQLite semantics would mislead students versus a server database (dynamic typing / type affinity, no native `DATE` type, single-writer concurrency, limited `ALTER TABLE`), and mentions PGlite as an alternative.
**Attempted**: **Not attempted** — out of scope for the two items this task covered, and the turn budget was spent on the `node:sqlite` migration-tooling constraint, which was the stated priority.
**Impact**: **Medium** — limited `ALTER TABLE` support in particular will shape how migrations are written and taught, which touches the recommendation in 1.3.
**Recommendation**: Commission this as a follow-up. It is a genuinely open question, not a formality.

## Conflicting Information

### Conflict C1: Drizzle's own release-notes page contradicts the npm registry
**Position A**: Drizzle's "Latest releases" page presents v1.0.0-beta.2 (February 2025) as the most recent release and v0.32.2 (August 2024) as the last stable v0.
— Source: [orm.drizzle.team/docs/latest-releases](https://orm.drizzle.team/docs/latest-releases), reputation High (1.0).
**Position B**: The npm registry reports stable `drizzle-orm` at **0.45.2** and `drizzle-kit` at **0.31.10**, with 0.45.2 published roughly five months before the access date.
— Source: [registry.npmjs.org/drizzle-orm/latest](https://registry.npmjs.org/drizzle-orm/latest), reputation High (1.0).
**Assessment**: **Position B is authoritative.** Published npm artefacts cannot be wrong about what was published; a documentation page can easily be stale, partially rendered, or incompletely captured by fetch-and-summarise. The likeliest explanation is that the docs page is a curated highlights list rather than a complete changelog, and/or that my fetch captured a partial render.
**Consequence for the recommendation**: **None.** Both positions agree on the decision-relevant fact — Drizzle's `node:sqlite` support is documented under an `@rc` install instruction, i.e. it is not on the stable line. But it does mean the **precise v1 timeline in Finding 1.3.2 is unreliable**, and I have marked that finding Medium-High rather than High for exactly this reason. Anyone needing the real timeline should read the GitHub releases directly.

### Conflict C2: Are Prisma driver adapters mandatory in v7?
**Position A**: "The query engine is gone, driver adapters are mandatory, and configuration moved to a new `prisma.config.ts` file."
— Source: search-result summary of Prisma ecosystem coverage, reputation Medium (0.6).
**Position B**: "Driver adapters are optional... you can 'instead of Prisma's built-in driver, use JavaScript database drivers via driver adapters', implying the built-in driver remains available."
— Source: [Prisma Docs — SQLite connector](https://www.prisma.io/docs/orm/overview/databases/sqlite), reputation High (1.0).
**Assessment**: **Unresolved, and deliberately left so.** Position B is the higher-reputation source, but the quoted phrasing reads like general adapter documentation that may not have been updated for v7's architectural change, so I do not treat it as decisive. Position A is plausible given Prisma's documented direction of travel (removing the Rust query engine).
**Consequence for the recommendation**: **None — the verdict is identical either way.** If adapters are mandatory, local SQLite requires `@prisma/adapter-better-sqlite3` → native compilation. If adapters are optional, the built-in path still ships a platform-specific query engine binary, which is a comparable (arguably worse) distribution problem, *and* Prisma retains its `generate` step. **Prisma is rejected under both readings.** I record the conflict rather than resolving it because resolving it would not change any decision in this document.

### Conflict C3: `node:test`'s feature set — see §1.4
Recorded in full in Finding 1.4.1 / Conflict C3 above. Summary: a Medium-trust comparison site claims `node:test` "lacks watch mode, snapshot testing"; the official Node documentation shows watch mode since v19.2.0 and **stable** snapshot testing since v23.4.0. **The official documentation is correct.** Flagged prominently because this stale received wisdom would otherwise have decided the test-runner choice on false grounds — and because it is a good illustration of why the primary-source discipline in this document was worth the extra fetches.

## Recommendations for Further Research

1. **SQLite semantic divergence (research-brief item 5) — highest priority, not covered here.** Type affinity/dynamic typing, absence of a native `DATE` type, single-writer concurrency, and especially **limited `ALTER TABLE`** support. The last one directly shapes how the migration runner and the teaching examples must be written, so it feeds back into Recommendation 1.3. Also assess PGlite as the real-Postgres-without-Docker fallback, per the parked note in the decision doc.
2. **Gherkin-native SDD kits (research-brief item 2) — not covered here.** Does a BDD-flavoured spec-driven prompt kit already exist to adapt? Start with the possible playwright-bdd agent skill (Gap G2), which would be a directly relevant prior art.
3. **Gate catalogue evidence (research-brief item 4) — not covered here.** Part 1 supplies qualitative agent-feedback assessments per tool, but the decision doc wants each gate documented on *typical runtime*, *class of defect caught*, and *signal quality*. Runtimes need measuring on the actual repo, not researching.
4. **Two spikes that would retire the largest remaining uncertainties**, both cheap: (a) Hono + `@hono/node-server` + one `node:sqlite` route on Node 26 (closes G4, and doubles as the first commit); (b) the same feature built by Claude Code in both Svelte 5 and React, to test the agent-reliability argument in Finding 1.2.4 (closes G6, the weakest evidence base in this document).
5. **Verify Better-T-Stack's emitted code** if it is to be used at all (closes G8) — generate with `--orm none --api none`, grep the lockfile for `better-sqlite3`, read the source.
6. **Re-verify version facts before the course runs.** Everything here is a 2026-08-27 snapshot; framework-version sources have a ~1-year freshness horizon per `authoritative-sources`, but a course that runs months from now should re-check pins with `npm view`.

## Full Citations

[1] Node.js. "SQLite". *Node.js API Documentation*. https://nodejs.org/api/sqlite.html. Accessed 2026-08-27.
[2] Node.js. "Test runner". *Node.js API Documentation*. https://nodejs.org/api/test.html. Accessed 2026-08-27.
[3] npm. "playwright-bdd — latest". *npm Registry*. https://registry.npmjs.org/playwright-bdd/latest. Accessed 2026-08-27.
[4] Vitalets. "Releases — playwright-bdd". *GitHub*. https://github.com/vitalets/playwright-bdd/releases. Accessed 2026-08-27.
[5] npm. "hono — latest". *npm Registry*. https://registry.npmjs.org/hono/latest. Accessed 2026-08-27.
[6] npm. "fastify — latest". *npm Registry*. https://registry.npmjs.org/fastify/latest. Accessed 2026-08-27.
[7] npm. "vitest — latest". *npm Registry*. https://registry.npmjs.org/vitest/latest. Accessed 2026-08-27.
[8] npm. "zod — latest". *npm Registry*. https://registry.npmjs.org/zod/latest. Accessed 2026-08-27.
[9] npm. "@hono/node-server — latest". *npm Registry*. https://registry.npmjs.org/@hono/node-server/latest. Accessed 2026-08-27.
[10] npm. "drizzle-orm — latest" and "drizzle-kit — latest". *npm Registry*. https://registry.npmjs.org/drizzle-orm/latest, https://registry.npmjs.org/drizzle-kit/latest. Accessed 2026-08-27.
[11] Drizzle Team. "Node SQLite". *Drizzle ORM Documentation*. https://orm.drizzle.team/docs/connect-node-sqlite. Accessed 2026-08-27.
[12] Drizzle Team. "Migrations". *Drizzle ORM Documentation*. https://orm.drizzle.team/docs/migrations. Accessed 2026-08-27.
[13] Drizzle Team. "Latest releases". *Drizzle ORM Documentation*. https://orm.drizzle.team/docs/latest-releases. Accessed 2026-08-27. [Internally inconsistent — see Conflict C1]
[14] Drizzle Team. "[BUG]: drizzle-kit does not support `node:sqlite` — Issue #5471". *GitHub*. https://github.com/drizzle-team/drizzle-orm/issues/5471. Accessed 2026-08-27.
[15] Prisma. "SQLite database connector". *Prisma Documentation*. https://www.prisma.io/docs/orm/overview/databases/sqlite. Accessed 2026-08-27.
[16] Kysely. "Getting started". *Kysely Documentation*. https://kysely.dev/docs/getting-started. Accessed 2026-08-27.
[17] Kysely. "alternate dialects in the multiverse of sqlite — Issue #1292". *GitHub*. https://github.com/kysely-org/kysely/issues/1292. Accessed 2026-08-27.
[18] MikroORM. "Usage with SQLite". *MikroORM Documentation*. https://mikro-orm.io/docs/usage-with-sqlite. Accessed 2026-08-27.
[19] Vite. "Getting Started". *Vite Documentation*. https://vite.dev/guide/. Accessed 2026-08-27.
[20] Alickovic, Alan. "bulletproof-react". *GitHub*. https://github.com/alan2207/bulletproof-react. Accessed 2026-08-27.
[21] Epic Web Dev. "epic-stack". *GitHub*. https://github.com/epicweb-dev/epic-stack. Accessed 2026-08-27.
[22] Varshney, Aman. "create-better-t-stack". *GitHub*. https://github.com/AmanVarshney01/create-better-t-stack. Accessed 2026-08-27.
[23] RealWorld. "conduit-realworld-example-app". *GitHub*. https://github.com/TonyMckes/conduit-realworld-example-app. Accessed 2026-08-27.
[24] SanderGi. "sqlite-auto-migrator". *GitHub*. https://github.com/SanderGi/sqlite-auto-migrator. Accessed 2026-08-27.
[25] Kriasoft. "node-sqlite". *GitHub*. https://github.com/kriasoft/node-sqlite. Accessed 2026-08-27.
[26] Encore. "NestJS vs Fastify vs Hono 2026 — TypeScript Comparison". https://encore.dev/articles/nestjs-vs-fastify-vs-hono. Accessed 2026-08-27. [Competitor bias noted]
[27] PkgPulse. "Hono vs Express vs Fastify 2026". https://www.pkgpulse.com/guides/hono-vs-express-vs-fastify-2026. Accessed 2026-08-27.
[28] PkgPulse. "node:test vs Vitest vs Jest 2026". https://www.pkgpulse.com/guides/node-test-vs-vitest-vs-jest-native-test-runner-2026. Accessed 2026-08-27. [Claim refuted — see Conflict C3]
[29] APIScout. "Hono vs Fastify vs Express: API Framework 2026". https://apiscout.dev/guides/hono-vs-fastify-vs-express-api-framework-2026. Accessed 2026-08-27.
[30] Kanopy Labs. "Hono vs Express vs Fastify: Edge-Ready Backend Frameworks 2026". https://kanopylabs.com/blog/hono-vs-express-vs-fastify. Accessed 2026-08-27.
[31] Currents. "Playwright 1.60.0 Release Updates". https://currents.dev/posts/pw-1.60.0. Accessed 2026-08-27. [Commercial interest noted]
[32] OneUptime. "How to Use SQLite in Node.js Applications". https://oneuptime.com/blog/post/2026-02-02-sqlite-nodejs/view. Accessed 2026-08-27.
[33] Strapi. "Svelte vs React in 2026: Performance & DX Compared". https://strapi.io/blog/svelte-vs-react-comparison. Accessed 2026-08-27.
[34] DreamHost. "Svelte vs. React: Which Framework Should You Choose?". https://www.dreamhost.com/blog/svelte-vs-react/. Accessed 2026-08-27.
[35] Windframe. "Svelte vs React: A Detailed Comparison". https://windframe.dev/blog/svelte-vs-react. Accessed 2026-08-27.
[36] Tech-Insider. "Vitest vs Jest: 5x Faster Tests? We Measured [2026]". https://tech-insider.org/vitest-vs-jest-2026/. Accessed 2026-08-27.
[37] Noqta. "Better-T-Stack: Scaffold an End-to-End Type-Safe Full-Stack TypeScript App in 2026". https://noqta.tn/en/tutorials/better-t-stack-type-safe-fullstack-typescript-scaffold-2026. Accessed 2026-08-27.
[38] Storm, Arne Henrik. "Kurs produktutvikling — design decisions". Repo-internal working document, `docs/course-design-decisions.md`. 2026-08-27.

## Research Metadata

**Scope**: Research items 1 (TypeScript tooling) and 3 (baseline app candidates) from the research brief. Items 2, 4 and 5 were **not** covered — see Recommendations for Further Research.
**Sources examined**: ~40 | **Cited**: 38 | **Cross-referenced claims**: 14 of 18 major findings
**Reputation distribution**: High 47%, Medium-High 26%, Medium 27%. Weighted average ≈ 0.82.
**Confidence distribution**: High ~55% (all version/licence/dependency/driver-support facts, from primary registry and official-docs sources), Medium ~35% (qualitative comparisons, framework ergonomics), Low ~10% (benchmark numbers, explicitly discounted; readability claims, explicitly flagged).
**Conflicts documented**: 3 (C1 Drizzle versions — unresolved but decision-neutral; C2 Prisma adapters — unresolved and decision-neutral; C3 node:test features — **resolved in favour of official docs**).
**Knowledge gaps documented**: 9 (G1–G9). Highest-impact: G8 (Better-T-Stack code quality unassessed), G9 (SQLite semantics not researched), G4 (Hono on Node not verified hands-on), G6 (readability evidence base weak).
**Tool failures**: `npmjs.com` package pages returned HTTP 403 to WebFetch — worked around by using the `registry.npmjs.org` JSON API, which proved a better primary source. One fetch of `registry.npmjs.org/drizzle-orm` (full document) exceeded the content-length limit; worked around via the `/latest` endpoint. Neither failure reduced coverage.
**Methodological note**: every load-bearing claim rests on a primary source (npm registry manifest, official documentation, or project issue tracker). Medium-trust comparison blogs were used only for qualitative colour, are labelled throughout, and were overruled wherever they conflicted with a primary source (Conflict C3).
**Output**: `docs/research/tooling/typescript-stack-and-baseline-apps-comprehensive-research.md`
