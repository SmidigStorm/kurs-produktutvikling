# Research: Quality Gate Catalogue for TypeScript Projects — Cost, Defect Classes, and Error Output Quality as AI Agent Feedback

**Date**: 2026-08-27 | **Researcher**: nw-researcher (Nova) | **Confidence**: Medium-High overall (High for output-format facts, Medium for runtime figures, Medium for the agent-feedback thesis) | **Sources**: 21 cited, 6 rejected

> STATUS: COMPLETE.

## Executive Summary

**The course's central insight survives contact with the evidence, and is better supported than expected.** Two findings carry it. First, Vitest **ships a reporter specifically for AI coding agents and auto-detects when an agent is running it**, explicitly to show only failures and minimise token usage — a first-tier vendor treating agent-consumed output as a distinct target from human-consumed output. Second, a 2026 study of iterative LLM self-repair across seven models measured repair success **by error type**: errors naming a symbol and location repair at **~77%**, syntax errors at **~66%**, but assertion errors — where "the code ran successfully but produced the wrong output" — repair at **only ~45%**. That gradient is the course's thesis, measured. It maps cleanly onto the catalogue: typecheck and lint errors are location-and-reason shaped; unit-test failures are enriched assertions; and a BDD "the scenario failed" is the degenerate assertion error with no location in production code at all.

**The cost picture is less dramatic than folklore suggests, and in one place is inverted.** At course scale nearly every check is effectively free: lint and format land under a second (Biome publishes ~800ms–1s for 2k–5k files), build is ~0.4s for 547k LOC with esbuild, typecheck is low single-digit seconds, and — the genuinely interesting one — **because `node:sqlite` is in-process with no container and no server, the traditional unit-vs-integration cost gap largely disappears.** "Integration tests are slow" turns out to be a fact about Postgres and Docker, not a law of nature, which changes the optimal gate composition for this stack. Only E2E is expensive, by an order of magnitude. So the 90-second gate exercise reduces to a single real decision — E2E in or out — and that decision is precisely where the two masters disagree most sharply: E2E has the lowest agent-feedback quality and the highest human-confidence value in the entire catalogue, and it is the only check the product person in the pair can read.

**Two cautions on the evidence.** The best-evidenced number here is the oldest: Gao, Bird and Barr (ICSE 2017, peer-reviewed) found static types catch **15% of 400 public bugs across 389 repositories** — a conservative lower bound that simultaneously justifies strict typing and justifies having three test layers, since ~85% of bugs are out of reach of types. Against that, **runtime figures are the weak spot throughout.** Almost every vendor multiplier ("10x", "50–100x faster") is self-published, and the web is now saturated with AI-generated benchmark articles which were found, assessed and rejected. Six sources were rejected outright. **No trustworthy published figure exists for Vitest vs `node:test` startup, for `node:sqlite` integration-suite runtime, or for playwright-bdd E2E runtime on a small app** — three of the numbers the course most needs. Every figure in the deliverable is therefore tagged [M]easured, [E]stimated or [U]nmeasured, and the strongest recommendation in this document is that the course measure its own repo and replace the estimates before class. Finally, on the secondary question: LLM self-repair is well studied, but **feedback-loop *latency* against agent success is genuinely under-studied**, and there is **no evidence at all** on TypeScript strictness settings and agent-generated code quality. Say so plainly rather than over-claiming.

## Research Methodology

**Search Strategy**: Primary-source-first. For every tool, the vendor's own documentation was fetched directly for output-format and reporter facts (authoritative for the tool's own behaviour) rather than relying on search summaries. Web search was used only for *discovery* — to locate primary sources and academic papers — never as a citation of record. Academic evidence was sought on arXiv and via ACM/ICSE for three specific questions: type-system defect detection, static-analysis effectiveness, and LLM self-repair from error feedback. The repo's own `docs/course-design-decisions.md` was read first as the authoritative statement of course constraints.

**Source Selection**: Types used — official vendor documentation (typescriptlang.org, nodejs.org, vitest.dev, playwright.dev, biomejs.dev, oxc.rs, orm.drizzle.team, esbuild.github.io), academic (arxiv.org, ACM DL/ICSE), industry (github.com, neverworkintheory.org). **Six sources rejected**: SEO/AI-generated "2026 benchmark" comparison articles (tech-insider.org, pkgpulse.com, byteiota.com, nerdleveltech.com, techloghub.com, pikvue.com) — none on trusted domains, several bearing content-farm signatures. Their claims are recorded in Part B1 solely so a future researcher does not re-discover and trust them.

**Verification approach**: Vendor performance claims were treated as claims-with-commercial-interest and flagged as such, even from High-reputation domains. Note the deliberate exception: Biome publishing its *own* Scanner's 8x slowdown raises credibility rather than lowering it, and is cited with confidence. Microsoft's DevBlog and the microsoft/typescript-go repo were counted as **one** source cluster, not two, under circular-reference rules.

**Quality Standards**: Target 3 sources/claim (min 1 authoritative). Output-format and reporter facts rest on a single official source each — accepted as authoritative-minimum, since a tool's own documentation is definitionally the authority on its own CLI. Every runtime figure is tagged [M]/[E]/[U] for provenance. Claims that are this research's own analysis rather than sourced fact are labelled inline as "analysis" or "interpretation".

---

## THE DELIVERABLE: Gate Comparison Table

**How to read the provenance flags — this matters, students will reason from this table:**

- **[M]** = **Measured**, published by a named source with stated methodology. Trust it, within its stated conditions.
- **[E]** = **Estimated** by extrapolation from measured data. Directionally sound, numerically soft. Do not quote as fact.
- **[U]** = **Unmeasured.** No trustworthy figure was found. **Measure it on your own repo before believing anything.**

Agent-feedback and human-confidence ratings are **this research's own analysis**, argued from cited facts about output formats and from the empirical error-type findings in Part K2. They are reasoned judgements, not measurements.

### Table 1 — The classroom table

| Check | Runtime (course-scale repo) | Runtime (large repo, cited) | Defect class caught | Does NOT catch | Agent feedback | Human confidence |
|---|---|---|---|---|---|---|
| **typecheck** `tsc --noEmit` | ~1–4s per project **[E]** | 1.1s @2k LOC → 77.8s @1.5M LOC; 5.5s @18k LOC (tRPC) **[M]** | Type/shape mismatch, null misuse, bad call signatures. **~15% of all real bugs [M]** | ~85% of bugs: all logic errors | **5/5 Excellent.** File+line+col, stable `TSxxxx` code, seconds, deterministic. No JSON reporter (gap). Errors cluster causally — first error is usually the real one | **2/5.** "It compiles" reassures nobody who has shipped software |
| **typecheck** TS 7 native | sub-second **[E]** | ~10x faster than above; 7.5s on 1.5M LOC VS Code **[M, vendor]** | as above | as above | **5/5**, same signal, arriving faster | 2/5 |
| **lint** ESLint | <1s **[E]** | 30–90s claimed on 100k LOC — **[U] rejected, untrustworthy sources** | Unused vars, floating promises, import cycles, a11y. Broad, shallow | Logic, integration, UI. High FP + high FN **[M, but different domain — see J2]** | **5/5.** File+line+col, stable rule ID, JSON built-in, SARIF via package, **`--fix` often removes the round entirely** | **2/5.** Rarely the thing that breaks prod |
| **lint** Biome / Oxlint | <200ms **[E]** | Biome: ~800ms–1s for 2k–5k files **[M, vendor]** | as ESLint, fewer plugins | as ESLint | **5/5.** Biome: 10 reporters incl. **SARIF**; `--max-diagnostics` **defaults to 20** — noise capped by design **[M]** | 2/5 |
| **lint** with type-aware rules | ~1–2s **[E]** | Biome +Scanner: ~1s → **~8s @5k files [M, vendor's own worst number]** | + floating promises, unresolved imports, import cycles | as above | 5/5 | 2/5 |
| **format** Prettier / Biome | <200ms **[E]** | included in the Biome figures above **[M]** | **Nothing. Zero defects, by design** | Everything | **N/A as a detector.** As a check: excellent output, and `--write` fixes it with no agent involvement. **Should not be a blocking gate** | **1/5.** Pure hygiene |
| **unit tests** Vitest | ~1–3s **[E]** | **[U]** — no trustworthy published figure | Wrong business logic, wrong rule, edge cases. The only cheap check for *correctness* | Wiring, SQL, UI, schema | **5/5, best in catalogue.** Expected vs actual + test name stating intent + stack at the wrong function. Jest-JSON with `location` line/col. **Ships an auto-detecting AI-agent reporter [M]** | **4/5.** Depends entirely on whether the tests assert anything real |
| **unit tests** `node:test` | ~2–6s **[E]** | **[U]** | as Vitest | as Vitest | **3/5.** TAP + JUnit, but no Jest-JSON location, **docs explicitly disclaim reporter-output stability as a programmatic contract [M]**, no agent reporter | 4/5 |
| **integration tests** (real SQLite) | ~2–5s **[E]** — see note | **[U]** — no published figure found | Wrong SQL, constraint violations, migration/query mismatch, repository-layer bugs | UI, cross-service wiring, requirement gaps | **5/5** (inherits runner). **Risk: state leakage → order-dependent failure = worst possible agent signal** | **4/5.** Real database, real queries |
| **BDD / E2E** playwright-bdd | **tens of seconds to minutes [U]** — an order of magnitude above everything else | **[U]** | Broken wiring, user-visible regressions, whole-system integration. The **only** check covering the user's path | Nothing *specific* — it localises nothing | **2/5.** Points at the symptom, not the defect. "Scenario failed"/"timed out" ≈ the **~45% assertion-error repair band [M]**. Rich JSON/JUnit/blob reporters and traces, but **trace is built for a human eye**. Flakiest check | **5/5, highest.** And **the only check a product person can read and verify against their own acceptance criteria** |
| **build** (esbuild/Vite) | <1s **[E]** | esbuild 0.39s @547k LOC; webpack 41.21s same input **[M, vendor self-benchmark]** | Module resolution, syntax, config errors | **Type errors — bundlers strip types without checking [M]**, and all logic | **2/5.** File+line, no error-code vocabulary, largely redundant with typecheck + lint | **2/5.** Mostly a trap: "it built" ≠ "types are fine" |
| **migration check** | <1s **[E]** | **[U]** — `drizzle-kit check` output format and exit codes **undocumented [M: documented gap]** | Schema drift, unapplied migrations, migration-history conflicts | Everything else | **4/5 custom / unknown for `drizzle-kit check`.** A schema diff's failure output *is the fix* — puts it in the ~66–77% band | **4/5.** Catches the defect that passes every other gate and then kills the demo |
| **spec-trace** (custom) | milliseconds **[E]** | n/a — **no suitable off-the-shelf tool found [Medium confidence negative finding]** | Requirements with no scenario; scenarios with no backlog link. **No other check covers this at all** | Every actual code defect | **5/5 by construction — you choose the error message.** Recommend a `--json` mode as a worked example | **4/5, and uniquely for the product person.** Answers "is what we agreed actually covered?" |

### Table 2 — Cost per unit of agent signal (the ranking that matters for the second master)

Ordered by this research's core question: **feedback quality per second spent.**

| Rank | Check | Why |
|---|---|---|
| 1 | **typecheck** | Seconds, located, coded, deterministic, zero flake. The reference standard |
| 2 | **unit tests** | Only slightly slower; adds expected-vs-actual and intent, which types cannot give. Small flake risk |
| 3 | **lint (non-type-aware)** | Nearly free, located, rule-IDed, and **often auto-fixes so no round is needed at all** |
| 4 | **integration tests (SQLite)** | Cheap *because SQLite is in-process*; covers the SQL blind spot. Watch state leakage |
| 5 | **spec-trace** | Free, and you author the message |
| 6 | **migration check** | Free, and the failure names its own fix |
| 7 | **build** | Cheap but mostly redundant |
| 8 | **lint (type-aware)** | Duplicates typecheck coverage at up to 8x the lint cost **[M]** |
| 9 | **format** | Zero detection value. Auto-fix it, do not gate on it |
| 10 | **BDD / E2E** | Most expensive by an order of magnitude, weakest localisation, flakiest. **Highest human value, lowest agent value — the clearest illustration of the two masters** |

**Note the inversion between the two columns.** Table 2's bottom entry (E2E) is Table 1's top scorer on human confidence. That inversion is the course's thesis, in one table.

---

## Narrative: Composing a Gate Under a 90-Second Budget

**The budget is the whole exercise.** With no ceiling, every student turns everything on and learns nothing. At 90 seconds, they must rank — and ranking forces them to answer "who is this gate for?"

**The first 10 seconds buy almost everything.** Typecheck plus non-type-aware lint plus fast unit tests plus spec-trace plus migration check fit comfortably inside ten seconds at course scale. Those five checks cover types (~15% of real bugs, the best-evidenced number here), the entire logic-error class, schema drift, and requirement coverage — and every one of them produces located, machine-readable, deterministic output. **The gate is roughly 90% as good as it will ever get, and it has spent 11% of its budget.**

**The remaining 80 seconds buy one thing: E2E.** This is the actual decision. Everything cheap is already in. What remains is the check that is 10–100x more expensive, that localises nothing, that flakes, and that is *also* the only evidence the assembled system works for a user — and the only check the product person in the pair can read.

Students will split, and **both answers are defensible, which is exactly why it is a good exercise**:

- *"E2E out of the commit gate."* Justification: at ~45% repair rate for outcome-only errors versus ~66–77% for located errors, E2E feedback is the least agent-actionable signal in the catalogue, and its flake actively misleads the agent. Put it on a separate command run before demoing.
- *"E2E in, cut something else."* Justification: the pair is building a *product*, the Gherkin scenarios *are* the acceptance criteria (decision 5), and a gate that never checks the acceptance criteria is measuring the wrong thing. The product person's confidence is not a lesser concern than the developer's.

**Three traps to let students walk into, then name in the retro:**

1. **Paying twice for types.** Turning on type-aware lint rules alongside `tsc --noEmit` buys a small amount of extra coverage (floating promises) for up to an 8x increase in lint cost **[M, Biome's own figure]**. Most pairs will do this without noticing.
2. **Gating on format.** It catches zero defects and can fix itself. Nearly every pair will put it in first, because it is the easiest to set up. The retro question: *"which of your checks has ever caught a bug?"*
3. **Trusting `build` as a typecheck.** Bundlers strip types without checking them **[M]**. A pair that drops `tsc` because "the build passes" has silently deleted their best check.

**The reframe to deliver in the retro.** Most teams pick gates by asking *"what could go wrong?"* — which monotonically adds checks until the gate is unusable. The better question is **"what will this check tell whoever has to fix it?"** That question ranks the catalogue very differently, and it is answerable from evidence: located, coded, deterministic errors get repaired far more often than "it failed" **[M, K2]**, most of the recoverable value lands in the first two correction rounds **[M, K1]**, and a major test runner now ships a reporter specifically for AI agents **[M, D1]**. Gate design has quietly become an interface design problem, and the agent is now one of the users.

**A caution to give students explicitly**: several numbers in Table 1 are marked **[E]** or **[U]**. The most valuable ten minutes of this exercise is not composing the gate — it is **timing your own checks on your own repo and replacing the estimates with measurements.** A gate policy built on somebody else's benchmark is a guess.

---

## Findings

### Part A — Typecheck

#### A1: `tsc --noEmit` cold runtime scales roughly linearly with codebase size; small projects are sub-2s, large ones are tens of seconds

**Evidence** (Microsoft's own published benchmark table, TypeScript 5.x `tsc` vs the Go native port):

| Codebase | LOC | `tsc` (JS, TS 5.x) | Native (`tsgo`) | Speedup |
|----------|-----|---------|--------|---------|
| VS Code | 1,505,000 | 77.8s | 7.5s | 10.4x |
| Playwright | 356,000 | 11.1s | 1.1s | 10.1x |
| TypeORM | 270,000 | 17.5s | 1.3s | 13.5x |
| date-fns | 104,000 | 6.5s | 0.7s | 9.5x |
| tRPC | 18,000 | 5.5s | 0.6s | 9.1x |
| rxjs | 2,100 | 1.1s | 0.1s | 11.0x |

**Source**: [Microsoft. "A 10x Faster TypeScript". TypeScript DevBlog](https://devblogs.microsoft.com/typescript/typescript-native-port/) — Accessed 2026-08-27. Domain `devblogs.microsoft.com`, official vendor, reputation High (1.0).
**Confidence**: High for the figures as published; **Medium** for transferability to a course repo (see caveat).
**Caveat / provenance warning**: These are *vendor-published* numbers on the vendor's hardware, and the two ends of the table are not comparable projects. Note the important anomaly for our purposes: **tRPC at 18k LOC takes 5.5s while date-fns at 104k LOC takes 6.5s** — nearly identical despite a 5.8x size difference. LOC is a poor predictor of typecheck time; *type complexity* (generics, conditional types, inference depth) dominates. A course app of a few thousand lines of plain application TypeScript will be much closer to the rxjs row than the tRPC row.

**Analysis (interpretation, not sourced fact)**: For a small course-sized TypeScript app (backend + frontend, low thousands of LOC, no heavyweight generic library code), the defensible estimate for `tsc --noEmit` cold is **roughly 1–4 seconds per project** on modern hardware — i.e. 2–8s if backend and frontend are typechecked as separate projects. This is an inference from the table's small-project rows, **not a measured figure**, and should be labelled as such in classroom material. The course should measure its own repo and replace this estimate with a real number.

#### A2: The Go native port (TypeScript 7 / `tsgo`) is ~10x faster and is now the mainline compiler

**Evidence**: "This staging repository is now closed. The native port development has been completed, and all work has been merged into the original TypeScript repository. The repo will be permanently archived in September 2026." — the native port "became TypeScript 7.0", distributed in preview as `@typescript/native-preview` with binary `tsgo`; for RC and later the binary is just `tsc`.
**Source**: [microsoft/typescript-go, GitHub](https://github.com/microsoft/typescript-go) — Accessed 2026-08-27. Reputation Medium-High (0.8) as a GitHub repo, but it is the *vendor's own* repo, so effectively official.
**Verification**: Cross-referenced with the DevBlog announcement above (same organisation — counts as **one** independent source cluster under circular-reference rules, since the GitHub repo and the DevBlog are both Microsoft).
**Confidence**: High for "it exists and is ~10x faster on Microsoft's benchmarks"; **Medium** for exact real-world speedup.

**Conflicting evidence on the 10x claim**: An independent practitioner report claims "~3x faster, not 10x" when benchmarking against `tsc` on a real Next.js monorepo. Source is a dev.to post (medium trust, 0.6) and could not be fully verified. **Flagged as weak provenance — do not put "3x" in classroom material as fact.** The honest classroom statement is: *"Microsoft measures ~10x on their benchmark suite; independent reports of smaller gains exist; measure your own repo."*

#### A3: Typecheck output quality as agent feedback — the reference standard

**Evidence**: `tsc` diagnostics are emitted in the form `file(line,col): error TSxxxx: message`, with a stable numeric error code per diagnostic class. `tsc` additionally supports `--pretty false` for a flat one-line-per-error format that is trivially parseable, and the TypeScript compiler API exposes structured `Diagnostic` objects (file, start, length, messageText, code, category).
**Source**: [TypeScript Handbook / tsc CLI options, typescriptlang.org](https://www.typescriptlang.org/docs/handbook/compiler-options.html) — Accessed 2026-08-27. Official, reputation High.
**Confidence**: High (official documentation of the tool's own output format).

**Agent-feedback rating: EXCELLENT (5/5).** Rationale, itemised against the rubric in this research:
- File: yes. Line: yes. Column: yes.
- Precise reason: yes — and uniquely, a *stable error code* (`TS2345`) that is a searchable, machine-groupable identity for the defect class.
- Machine-readable format: partially. There is **no built-in JSON reporter** for `tsc` — this is a real gap. The flat `--pretty false` text format is regular enough to parse with a one-line regex, and the compiler API gives full structure programmatically, but a `--format json` flag does not exist.
- Fails fast: yes, seconds.
- Noise: **bounded but not trivially so.** A single upstream type change can cascade into dozens of downstream errors. Mitigation for agent consumption: pipe through `head`, or sort by file. Errors are *causally clustered*, so the first error is usually the real one — which is itself a useful property for an agent.
- Determinism: high. Same input, same output, no flake.

### Part B — Lint

#### B1: Rust/Go-based linters are 10–100x faster than ESLint, but the vendor multipliers are self-published

**Evidence**: "Oxlint is 50 to 100 times faster than ESLint" — vendor claim, backed by a public benchmark repo (`github.com/oxc-project/bench-linter`).
**Source**: [Oxc Linter Guide, oxc.rs](https://oxc.rs/docs/guide/usage/linter.html) — Accessed 2026-08-27. Official vendor docs, reputation High for facts about its own tool, but **the speed multiplier is a vendor claim with a commercial/adoption interest** (bias flag: the project's entire value proposition is speed).
**Confidence**: Medium. The *direction* (Rust linters are dramatically faster) is uncontested across all sources found; the *specific multiplier* is not independently verified here.

**Provenance warning — do NOT put these in the classroom table as measured facts**: Numerous SEO-style comparison articles surfaced in search ("56x faster", "Oxlint 2x faster than Biome", "30-45s → under 1s on a mid-sized repo", "100k LOC monorepo in under 2 seconds"). None are from trusted domains; several appear to be AI-generated content farms. **All rejected.** They are recorded here only so a future researcher does not re-find them and mistake them for evidence.

#### B2: Rule counts (official, verifiable)

**Evidence**:
- Oxlint: "more than 865 rules", covering ESLint core, TypeScript, React, Jest, Vitest, Import, Unicorn, jsx-a11y. Source: [oxc.rs linter guide](https://oxc.rs/docs/guide/usage/linter.html), Accessed 2026-08-27.
- Biome: "526 rules" across multiple languages. Source: [biomejs.dev/linter](https://biomejs.dev/linter/), Accessed 2026-08-27.
- ESLint: core rule set plus an effectively unbounded plugin ecosystem (typescript-eslint alone adds ~100+ rules, many type-aware).

**Confidence**: High (each is the tool's own documentation stating its own rule count — authoritative for that fact).
**Analysis**: Rule *count* is a bad proxy for defect-catching power. Most rules in every one of these tools are stylistic or preference rules that catch zero defects. The defect-relevant subset is small and largely overlapping (`no-unused-vars`, `no-floating-promises`, `no-explicit-any` escapes, exhaustive-deps, import cycles).

#### B3: Type-aware linting is the expensive part, and both fast linters now have it — at a measurable cost

**Evidence (Oxlint)**: Type-aware linting is "fully supported", leveraging "the native Go port of the TypeScript compiler (tsgo aka TypeScript 7), providing full TypeScript compatibility" for checks like floating-promise detection.
**Source**: [oxc.rs linter guide](https://oxc.rs/docs/guide/usage/linter.html) — Accessed 2026-08-27.

**Evidence (Biome)**: Biome v2 added type-inference rules (`noFloatingPromises`, `noUnresolvedImports`, `noImportCycles`) in a "project domain" that requires the Scanner. Biome publishes the Scanner's cost directly:

| Project size | Without Scanner | With Scanner |
|---|---|---|
| ~2k files | ~800ms | ~2s |
| ~5k files | ~1000ms | ~8s |

Biome's own docs concede: "we're aware of this impact on performance, and the team is pledged to improve the performance in this part of the software."
**Source**: [biomejs.dev/linter](https://biomejs.dev/linter/) — Accessed 2026-08-27. Official, reputation High. **This is a vendor publishing its own tool's *worst* numbers, which raises rather than lowers credibility.**
**Confidence**: High.

**Analysis — this is the single most classroom-useful figure in Part B.** It shows the gate trade-off in miniature: turning on the rules that catch *real* defects (floating promises are a genuine correctness bug class) took Biome from ~1s to ~8s on a 5k-file project — an 8x cost increase for a small increase in defect coverage. That is exactly the choice a student composing a 90-second gate must make, and it is a *published vendor number*, not a blog estimate.

**Second-order point for the course**: ~800ms–1s for 2k–5k files means a course-sized repo (tens to low hundreds of files) will lint in **well under 200ms** with Biome or Oxlint, and lint cost is effectively free at that scale. The interesting cost is type-aware rules — which largely duplicate what `tsc --noEmit` already does. A student who runs `tsc --noEmit` *and* type-aware lint is paying twice for overlapping coverage.

#### B4: Lint output quality as agent feedback — machine-readable formats are excellent across all three

**Evidence (Biome)**: `--reporter` accepts `default`, `concise` (one line per diagnostic), `summary`, `json`, `json-pretty` (both marked experimental), `github`, `gitlab`, `junit`, `checkstyle`, `rdjson`, **`sarif`**. `--reporter-file=PATH` writes to file. `--max-diagnostics` **defaults to 20** (output is capped — noise is bounded by default). `--error-on-warnings` promotes warnings to a non-zero exit.
**Source**: [Biome CLI Reference, biomejs.dev](https://biomejs.dev/reference/cli/) — Accessed 2026-08-27. Official, High.
**Confidence**: High.

**Evidence (ESLint)**: Built-in formatters documented are `stylish` (default, human-readable), `json`, `json-with-metadata` (results plus rule metadata), and `html`. **`unix`, `compact`, and SARIF are NOT built-in** — they are separate npm packages (SARIF via `@microsoft/eslint-formatter-sarif`). ESLint slimmed its built-in formatter set; older tutorials referencing built-in `unix`/`compact` are out of date.
**Source**: [ESLint Formatters documentation, eslint.org](https://eslint.org/docs/latest/use/formatters/) — Accessed 2026-08-27. Official, High.
**Confidence**: High.

**Agent-feedback rating: EXCELLENT (5/5) for all three.**
- File / line / column: yes, all three.
- Precise reason: yes, plus a **rule ID** (`@typescript-eslint/no-floating-promises`) which, like a TS error code, is a stable machine-groupable defect identity.
- Machine-readable: **best-in-class.** Biome ships SARIF *and* JSON *and* 8 other formats out of the box; ESLint ships JSON built-in with SARIF one package away.
- Noise control: Biome caps at 20 diagnostics by default — a genuinely agent-friendly design choice. ESLint has `--max-warnings` but no default cap on error volume.
- Autofix: all three have `--fix`, which means **an agent can often skip the correction round entirely.** This is a distinct and under-appreciated agent-feedback property: the best feedback is a fix that applies itself. Worth naming explicitly in the classroom table.
- Determinism: high, no flake.

**Interpretation (analysis, not sourced)**: Lint's honest position in a gate is *cheap and self-fixing but low-yield for real defects*. Its main agent value is not catching bugs — it is **suppressing the class of agent output that is merely untidy**, so that the remaining signal is real.

### Part C — Format

#### C1: Formatting is the cheapest possible gate and catches zero defects

**Evidence**: Biome is a combined formatter+linter; formatting shares the same CLI, the same `--reporter` set (including `sarif`, `json`, `concise`), and the same sub-second performance envelope documented in B3 (~800ms–1s for 2k–5k files for the whole check, formatter included).
**Source**: [biomejs.dev/reference/cli](https://biomejs.dev/reference/cli/) and [biomejs.dev/linter](https://biomejs.dev/linter/) — Accessed 2026-08-27. Official, High.
**Confidence**: High for the output-format facts; Medium for runtime at course scale (extrapolated downward from published 2k-file figures).

**Analysis (interpretation, clearly labelled)**: Format checks are a **defect-detection null**. Prettier and Biome-format catch no correctness defect of any kind, by design — they are idempotent text transformations. Their value in a gate is entirely second-order:
1. **Diff hygiene** — with a formatter enforced, every line in a git diff is a semantic change. This materially improves what a *human reviewer* and an *agent reading `git diff`* can infer. This is a real agent benefit, but an indirect one.
2. **Eliminating a whole category of pointless agent correction rounds** — an agent that is not told the formatting rules will guess, and guess differently each time.

**Agent-feedback rating: N/A-to-EXCELLENT, depending on framing.** As a *detector* it rates 0 — there is nothing to detect. As a *check that fails*, its output is excellent (file, line, and with `--write`/`--fix` it repairs itself with zero agent involvement).

**The strong classroom claim**: a format check should almost never be in a gate as a *blocking* check. It should be `--write` on save or pre-commit. **A gate that fails on formatting is spending its scarce seconds and its scarce agent attention on a problem the machine can solve unilaterally.** This is one of the clearest "gates serve two masters" examples in the whole catalogue: format has near-zero human-confidence value AND near-zero agent-feedback value, yet it is the check teams most reflexively wire up first.

### Part D — Unit tests

#### D1: **Vitest ships a reporter specifically for AI coding agents, and auto-detects when it is being run by one** — direct vendor evidence for this research's central thesis

**Evidence** (quoted from official Vitest documentation): "When Vitest detects it is running inside an AI coding agent, the minimal reporter is used instead." The reporter is described as optimised for AI assistants, "showing only failures and errors to minimize token usage."
**Source**: [Vitest Reporters guide, vitest.dev](https://vitest.dev/guide/reporters) — Accessed 2026-08-27. Official vendor documentation, reputation High (1.0).
**Confidence**: High (official documentation of the tool's own behaviour — authoritative for this fact).

**Analysis — this is the strongest single piece of evidence in the entire research.** It is a first-tier tool vendor treating "output consumed by an AI agent" as a **distinct output target with different requirements from human output**, and shipping auto-detection for it. It empirically validates the course's framing that gates serve two masters. Two specific design choices are worth naming in class:
1. **Suppress passes, show only failures.** For a human, a wall of green ticks is reassurance. For an agent, it is pure token cost with zero information — the agent already knows what it asked for.
2. **Minimise token usage** is stated as an explicit design goal. This is the *cost* axis of agent feedback that has no human analogue.

This is a citable, checkable, vendor-official fact, not a practitioner opinion. Use it as the anchor for the classroom discussion.

#### D2: Vitest reporter inventory and failure-payload richness

**Evidence**: Built-in reporters are `default`, `verbose`, `tree`, `json`, `junit`, `tap`, `tap-flat`, `github-actions`, `hanging-process`, and the minimal/agent reporter. The **JSON reporter is Jest-JSON-compatible**; its schema contains a `testResults` array, each entry carrying `assertionResults` with `location` (**line and column**), `failureMessages`, `status`, and `duration`.
**Source**: [Vitest Reporters guide, vitest.dev](https://vitest.dev/guide/reporters) — Accessed 2026-08-27. Official, High.
**Confidence**: High.

**Agent-feedback rating: EXCELLENT (5/5) — arguably the best in the catalogue, jointly with typecheck.**
- File / line / column: yes, structured, in the JSON reporter's `location` field.
- Precise reason: **the best in the catalogue.** A unit-test failure gives the *test name* (a natural-language statement of intended behaviour), the *expected value*, the *actual value*, and a *stack trace pointing at the function that produced the wrong value*. No other check in this catalogue delivers expected-vs-actual semantics.
- Machine-readable: yes — Jest-compatible JSON, plus JUnit and TAP.
- Fails fast: yes for fast domain tests.
- Noise: low, and Vitest's agent reporter explicitly minimises it.
- **Determinism: high but not guaranteed** — unlike typecheck, tests can be flaky (timing, shared state, ordering). Flake is uniquely toxic as agent feedback because it teaches the agent to "fix" a non-defect.

#### D3: `node:test` — zero-dependency alternative with weaker structured output and a costly isolation default

**Evidence**: Five built-in reporters — `spec` (default, human-readable), `tap`, `dot`, `junit`, and `lcov` (coverage, requires `--experimental-test-coverage`). Watch mode via `node --test --watch`. Coverage supported with configurable `lineCoverage`/`branchCoverage`/`functionCoverage` thresholds.

**Critically**, the Node docs state that reporter output "is subject to change between versions" and **"shouldn't be relied upon programmatically"**; for programmatic access the documented route is `TestsStream` events such as `'test:fail'`.
**Source**: [Node.js Test Runner API, nodejs.org/api/test.html](https://nodejs.org/api/test.html) — Accessed 2026-08-27. Official language documentation, reputation High (1.0).
**Confidence**: High.

**Evidence (performance-relevant defaults)**:

| Setting | Default | Behavior |
|---|---|---|
| Isolation | `'process'` | **Each test file runs in a separate child process** |
| Concurrency | `false` | **Only one test file runs at a time** |

Overridable via `--test-concurrency=N` or `isolation: 'none'`.
**Source**: same, [nodejs.org/api/test.html](https://nodejs.org/api/test.html) — Accessed 2026-08-27.
**Confidence**: High.

**Analysis — this is the most decision-relevant `node:test` fact for a gate under a time budget.** Process-per-file isolation plus serial execution by default means `node:test` runtime is dominated by **Node process startup multiplied by file count**, not by the tests themselves. A course repo with 20 small test files pays ~20 process spawns serially. Vitest by contrast runs a worker pool in-process by default. **Provenance note**: I did not find a trustworthy head-to-head measured benchmark of Vitest vs `node:test` startup cost; the structural argument above follows from the documented defaults, but the *magnitude* is unmeasured. **Flag this in classroom material as reasoning-from-documented-defaults, not measurement**, and have students measure it — it is a good five-minute exercise that demonstrates the whole point of the gate catalogue.

**Agent-feedback rating: GOOD (3/5).** Has JUnit and TAP, so machine-readable output exists. But: no Jest-style JSON with `location` line/column; the docs *explicitly disclaim* the stability of reporter output as a programmatic contract; and there is **no agent-oriented reporter**. Against Vitest's 5/5, `node:test` trades output quality for zero dependencies.

### Part E — Integration tests (against a real SQLite database)

#### E1: `node:sqlite` is a synchronous, in-process, zero-native-build database — which removes the usual integration-test cost driver

**Evidence**: Node ≥22 ships SQLite in the standard library (`node:sqlite`), which is why the course selected it (design decision 3/26: "Node ≥22 ships SQLite in the standard library so there is no native compilation in the setup path"). The environment is confirmed at Node 26.5.0.
**Source**: Repo document `docs/course-design-decisions.md` (project-internal, authoritative for course constraints) + [nodejs.org API docs](https://nodejs.org/api/test.html) domain, Accessed 2026-08-27.
**Confidence**: High for the constraint; **Low for runtime figures — see gap.**

**Analysis (interpretation, explicitly not measured)**: The classic reason integration tests are slow — container/server startup, network round-trips, connection pooling — **is structurally absent** with in-process SQLite. Setting up a fresh SQLite database is a file operation (or `:memory:`, no file at all). The dominant remaining costs are schema/migration application per test and fixture insertion.

**This collapses the traditional unit-vs-integration cost gap almost to nothing for this course's stack.** That is a genuinely interesting classroom point: the received wisdom "integration tests are slow, so put them behind a slower gate" is **an artefact of server databases and containers, not a law of nature**. With `node:sqlite`, integration tests against a real database may cost only marginally more than pure unit tests — which changes the optimal gate composition.

**Confidence: Medium-Low, and honestly labelled.** I found no published benchmark of `node:sqlite` integration-test suite runtimes. The reasoning is sound and follows from architecture, but **the course must measure this on its own repo before putting a number in front of students.** See Knowledge Gaps.

**Agent-feedback rating: EXCELLENT (5/5) — inherits the test runner's output.** An integration test failure carries the same expected/actual/stack payload as a unit test. The *additional* agent-relevant risk is **state leakage between tests**, which produces order-dependent failures — the most agent-hostile failure mode there is, because the feedback is not reproducible and the agent will chase a phantom. The course's decision 21 (separate ephemeral test database + one-command `reset`) is directly a mitigation for this, and can be taught as such.

### Part F — BDD / E2E (playwright-bdd + Playwright)

#### F1: `playwright-bdd` is actively maintained and generates native Playwright tests, so it inherits Playwright's whole reporting surface

**Evidence**: "Playwright-BDD converts `.feature` files into native Playwright tests, so you can use all Playwright runner capabilities." It "supports all non-deprecated versions of Playwright". Repo shows ~769 stars and 2,110 commits with active maintenance. Notably it advertises "step export capabilities for AI integration" and frames itself around "BDD in the Era of AI".
**Source**: [vitalets/playwright-bdd, GitHub](https://github.com/vitalets/playwright-bdd) — Accessed 2026-08-27. Reputation Medium-High (0.8).
**Confidence**: Medium-High. **Provenance caveat**: the fetched README did not surface an explicit current version number or last-release date. "Actively maintained" is inferred from commit count and the compatibility statement, not from a dated release. **Verify the exact version and release date before class** — this is the kind of fact that rots.

**Architectural consequence that matters for the gate**: because playwright-bdd *generates* Playwright test files rather than running its own runner, it adds a **codegen step** (`bddgen`) before the test run. For gate-timing purposes this is a small fixed cost on top of Playwright's own startup, and it means a stale-generated-tests failure mode exists.

#### F2: Playwright's reporter and artefact surface is the richest in the catalogue — and that is not the same as being the best agent feedback

**Evidence (reporters)**: Eight built-in reporters — `list`, `line`, `dot`, `html`, `blob`, `json`, `junit`, `github`. The JSON reporter "produces an object with all information about the test run", configurable via `PLAYWRIGHT_JSON_OUTPUT_NAME` or `outputFile`.
**Source**: [Playwright Test Reporters, playwright.dev](https://playwright.dev/docs/test-reporters) — Accessed 2026-08-27. Official, High.
**Confidence**: High for the reporter list. **Medium** for the JSON schema's failure detail — the reporters page does not document the schema, and I did not verify the exact error/stack representation. Flagged.

**Evidence (traces)**: A Playwright trace captures a screencast rendered as a film strip, **full DOM snapshots for each action (Before / Action / After)**, all network requests with headers, bodies, status codes and timing, browser and test console logs, action logs with timing and locator information, and **source-code line references showing where each action originated**. Traces are `trace.zip` files, opened with `npx playwright show-trace path/to/trace.zip` or at trace.playwright.dev (statically hosted, no external data transmission).

Recording modes: `on` (every test — documented as "not recommended, performance heavy"), `on-first-retry`, `on-all-retries`, `retain-on-failure`, `off`.
**Source**: [Playwright Trace Viewer, playwright.dev](https://playwright.dev/docs/trace-viewer) — Accessed 2026-08-27. Official, High.
**Confidence**: High for trace contents and modes. The docs give **no numbers** for trace file size or overhead — only the qualitative "performance heavy". Flagged as an unquantified cost.

#### F3: The agent-feedback verdict on E2E — rich artefacts, poor *signal*

**Agent-feedback rating: FAIR (2/5) as a raw gate signal; GOOD (3–4/5) if trace artefacts are made agent-consumable.**

The reasoning, and this is the sharpest point in the catalogue:
- **File / line**: yes, but it points at the *step definition or the .feature line*, not at the defective production code. The location is where the symptom was observed, not where the defect lives. Every other check in this catalogue points at the defect; E2E points at the symptom.
- **Precise reason**: **no.** The failure is typically "expected locator to be visible, timed out after 5000ms" or, in BDD terms, "the scenario failed at step X". The agent must now *investigate* — form a hypothesis, add logging, re-run. That is exactly the extra correction round the course's central insight predicts.
- **Machine-readable**: yes, and abundantly (`json`, `junit`, `blob`, `github`).
- **The trace problem**: the trace is the richest debugging artefact in the catalogue *and is essentially designed for a human eye*. A film strip, DOM snapshots and a timeline UI are high-bandwidth for a person and awkward for an agent. An agent can unzip `trace.zip` and read the network log and console output as text — that part is genuinely consumable — but the screencast and the visual film strip are close to worthless to it. **This is the single cleanest illustration of "gates serve two masters" in the whole research**: Playwright's most impressive feature is high-value human reassurance and low-value agent feedback.
- **Determinism: the weakest in the catalogue.** E2E is where flake lives. Playwright's retry-and-trace-on-retry design is itself an admission that these tests fail non-deterministically. For an agent, a flaky failure is *negative* information — it can consume several correction rounds "fixing" nothing.
- **Cost**: highest in the catalogue by an order of magnitude — real browser startup, real server startup, real navigation, per scenario. **Provenance warning: I found no trustworthy published figure for playwright-bdd E2E suite runtime on a small app.** Do not invent one. The classroom-honest statement is that E2E is measured in **tens of seconds to minutes** where every other check is measured in **seconds**, and that the course should measure its own suite.

**Counterweight — the human-confidence column**: E2E is the *only* check in the catalogue that provides evidence the assembled system actually works from a user's point of view. Its human-confidence value is the highest in the catalogue, and for a **product person in a cross-functional pair, a passing Gherkin scenario is the only check in the entire catalogue they can read and personally verify against their own acceptance criteria.** That is a course-specific value that no agent-feedback rating captures. In a mixed room, this is arguably E2E's main justification.

### Part G — Build

#### G1: With a modern Go/Rust bundler, build is not a meaningful cost at course scale

**Evidence** (esbuild's published benchmark — bundling 10 copies of three.js, **547,441 lines** including comments/blanks, built from scratch with no caches, best of three runs, 6-core 2019 MacBook Pro, 16GB RAM):

| Bundler | Time | Relative | Output |
|---|---|---|---|
| esbuild | **0.39s** | 1x | 5.80mb |
| parcel 2 | 14.91s | 38x | 5.78mb |
| rollup 4 + terser | 34.10s | 87x | 5.82mb |
| webpack 5 | 41.21s | 106x | 5.84mb |

**Source**: [esbuild FAQ — Benchmark details, esbuild.github.io](https://esbuild.github.io/faq/#benchmark-details) — Accessed 2026-08-27. Official project documentation, reputation High for the tool's own published methodology.
**Bias flag**: this is **esbuild benchmarking itself against competitors**. The methodology is unusually well documented (exact flags, hardware, LOC, best-of-three) which is a credibility point, but a vendor choosing its own benchmark input is a structural bias. The *ordering* is uncontroversial and widely reproduced; the *exact ratios* should be treated as favourable-case.
**Confidence**: Medium-High for the figures as published; **Low** for direct transfer to a course app.

**Analysis (interpretation)**: 0.39s for 547k LOC means build cost at course scale (a few thousand LOC) is **effectively zero** with esbuild/Vite/Rolldown, and would be seconds with webpack. Practically: **if the project uses a modern toolchain, "build" is nearly free and can be in any gate; if it doesn't, build is one of the most expensive things in the gate.** The toolchain choice, not the check, determines the cost.

**Agent-feedback rating: POOR-to-FAIR (2/5), and this is a subtle and worth-teaching point.**
- A build failure in a TypeScript project is *usually* one of: (a) a type error — but esbuild and Vite **strip types without checking them**, so type errors do not surface here at all; (b) a module-resolution error — genuinely useful, names the missing import; (c) a syntax error — useful.
- **Critical overlap warning**: for the dominant bundlers, `build` does **not** typecheck. A student who believes "build passing means types are fine" is wrong. This is a defect-coverage trap worth an explicit slide.
- Output: file and line for resolution/syntax errors; no stable error-code vocabulary; JSON output is available programmatically via the bundlers' JS APIs but the CLI default is human-oriented text.
- **The honest verdict**: `build` in a TypeScript gate is largely *redundant* with `tsc --noEmit` plus lint's import rules, and catches almost nothing they don't. Its real value is **catching the "it typechecks but won't bundle" class** — bad import paths, missing files, config errors — which is small but non-zero and is exactly the class that produces a confusing failure late.

### Part H — Migration check / schema drift

#### H1: "Migration check" is three different checks that people conflate, and off-the-shelf tools cover them unevenly

Distinguishing them is the actual finding, and it is a good classroom exercise in itself:

1. **Migration-history consistency** — do the migration files on disk form a coherent, non-conflicting sequence?
2. **Pending-migration detection** — has every migration on disk been applied to this database?
3. **True schema drift** — does the live database schema match what the schema definition says it should be, regardless of migration files?

#### H2: `drizzle-kit check` covers only category 1

**Evidence**: "drizzle-kit check command lets you check consistency of your generated SQL migrations", performing "commutativity checks" on migrations; documented as "particularly useful for teams with multiple developers working on different branches". Flags: `--config`, `--out`, `--ignore-conflicts`, required `dialect`.
**Source**: [drizzle-kit check, orm.drizzle.team](https://orm.drizzle.team/docs/drizzle-kit-check) — Accessed 2026-08-27. Official vendor docs, reputation High for its own tool.
**Confidence**: High for what it does; **the docs do NOT specify exit-code behaviour or output format** — a real documentation gap that matters if you want to wire it into a gate. Flagged.

**Evidence (categories 2 and 3, weaker sourcing)**: Community discussion indicates that detecting pending migrations requires comparing the `__drizzle_migrations` table against migration files on disk (i.e. **you write it yourself**), and that drift can manifest as `drizzle-kit generate` reporting "No schema changes, nothing to migrate" when schema and database clearly differ.
**Source**: [drizzle-team/drizzle-orm Discussion #5685, GitHub](https://github.com/drizzle-team/drizzle-orm/discussions/5685) — Accessed 2026-08-27. Reputation Medium-High (0.8) as GitHub, but it is a *discussion thread*, not documentation. **Confidence: Low-Medium. Verify before relying on it.**

**Evidence (Prisma comparison)**: There is an **open feature request** for a `--exit-code` option on `prisma migrate dev` to fail when drift exists, explicitly modelled on `git diff --exit-code`, motivated by CI integration.
**Source**: [prisma/prisma Issue #9707, GitHub](https://github.com/prisma/prisma/issues/9707) — Accessed 2026-08-27. Medium-High (0.8).
**Confidence**: Medium. **The fact that this is still an open request is itself the finding**: even a mature, well-funded ORM does not ship a clean gate-shaped drift check. Flag that the issue's current status was not verified — check before citing in class.

**Analysis and course recommendation**: For this course (SQLite, `node:sqlite`, no CI), the pedagogically ideal migration check is a **small custom script**: apply all migrations to a throwaway database, dump the resulting schema, compare against the schema the code expects, exit non-zero with a diff. It is maybe 30 lines, it runs in well under a second against SQLite, and — importantly for a course *about process design* — **writing it is a better exercise than installing it.** It also produces near-perfect agent feedback (see H3).

**Agent-feedback rating: GOOD-to-EXCELLENT (4/5) for a well-built custom check; UNKNOWN for `drizzle-kit check` because the output format is undocumented.** A schema-diff check has an unusual property: its failure output is *itself the fix*. "Column `players.rating` exists in schema but not in database" tells the agent precisely what migration to write. This puts it in the location-and-reason class (the ~66–77% repair band from K2), not the outcome-only class.

**Human-confidence value: high and disproportionate.** Schema drift is the classic defect that passes every other gate and then destroys the demo. For a one-day course where the demo *is* the deliverable, this check punches above its weight.

### Part I — Spec-trace

#### I1: Nothing off-the-shelf fits a repo-local, Gherkin-native, no-CI setup. This is correctly a custom check.

**Evidence of what exists, and why none of it fits**:
- **Commercial test-management platforms** (TestRail, TestCollab, Kualitee) offer requirement-to-test traceability matrices and coverage-per-requirement reports. TestCollab specifically advertises "coverage reports per requirement and a full traceability matrix from requirement to test to defect" for Gherkin-based BDD. **Disqualified for this course**: hosted SaaS, requires a separate requirements database, contradicts decisions 11 (no CI/CD), 7 (repo-local) and 9 (minimal contract).
  **Sources**: [TestCollab BDD features](https://testcollab.com/features/bdd-testing), [TestRail RTM guide](https://www.testrail.com/blog/requirements-traceability-matrix/) — Accessed 2026-08-27. **Reputation: Medium at best — these are vendor marketing pages with a direct commercial interest.** Cited only as evidence that the category exists commercially, not for any factual claim about efficacy.
- **GherkinSyncTool** (Quantori) — "an open-source console application that synchronizes tests scenarios in Gherkin syntax (also known as feature files) with a test management system." **Disqualified**: it *synchronises to* an external TMS; it is not a local coverage gate.
  **Source**: [quantori/GherkinSyncTool, GitHub](https://github.com/quantori/GherkinSyncTool) — Accessed 2026-08-27. Medium-High (0.8). **Confidence: Medium — surfaced via search summary, repo not deep-inspected.**
- The generic best-practice literature does describe the right idea — "automate orphan and stale-link checks to identify uncovered requirements and unused test scenarios" — but as a *practice*, not a tool.

**Confidence in the overall conclusion ("no suitable off-the-shelf tool"): Medium.** This is a **negative finding**, and negative findings are inherently weaker: absence of search results is not proof of absence. I searched for Gherkin traceability tooling, orphan-scenario detection, and open-source RTM tools. **Recommendation: one more targeted search of npm for `gherkin coverage` / `feature file lint` before class**, in case something small and repo-local exists that these searches missed.

**Analysis — and this is a lucky break for the course.** Decision 5 makes the course **Gherkin-native**: the feature files *are* the acceptance criteria; there is no second requirements document. That deletes half the traceability problem before it starts. What remains is genuinely small:
- Every requirement has a scenario → trivially true by construction, because the requirement *is* the scenario.
- Every scenario has a step definition → **`bddgen` already enforces this**; playwright-bdd fails on undefined steps.
- Every scenario is tagged/linked to a backlog item → a ~20-line script over the `.feature` files.

**Agent-feedback rating: EXCELLENT (5/5) by construction — because you write it.** A custom spec-trace check is the one gate whose output quality you fully control. This is a strong teaching moment: **"the best agent feedback in your gate may be the check you wrote yourself, because you got to choose the error message."** Recommend the course's example emit both a human line and a `--json` mode, as a worked demonstration of designing for two masters.

**Cost: negligible.** Reading a few dozen `.feature` files is milliseconds.
**Human-confidence value: high for the product person**, and uniquely so — it is the only check that answers *"is everything we agreed on actually covered?"*, which is the product person's core anxiety, not the developer's.

### Part J — Defect-detection effectiveness (empirical studies)

#### J1: Static type systems catch ~15% of public bugs in JavaScript — the single most important number in this research

**Evidence**: Gao, Bird and Barr sampled fixed bugs from JavaScript project histories, checked out the code just prior to each fix, manually added type annotations, and tested whether the type checker reported an error. "Both Flow 0.30 and TypeScript 2.0 successfully detect **15%**." The study examined **400 bugs across 389 public GitHub repositories**.
**Source (primary)**: Gao, Z., Bird, C., Barr, E.T. "To Type or Not to Type: Quantifying Detectable Bugs in JavaScript". ICSE 2017, Buenos Aires. [ACM DL 10.1109/ICSE.2017.75](https://dl.acm.org/doi/10.1109/ICSE.2017.75) — **[Paywalled]** (returned HTTP 403 on access attempt, 2026-08-27). Open-access author copy: [earlbarr.com/publications/typestudy.pdf](https://earlbarr.com/publications/typestudy.pdf) (fetch returned unparseable binary; **not directly verified**).
**Source (verification, independent)**: [It Will Never Work in Theory — review of the paper](https://neverworkintheory.org/2021/09/08/to-type-or-not-to-type.html) — Accessed 2026-08-27. A research-summary site run by software-engineering researchers; reputation Medium-High (0.8). Independently confirms the 15% figure and the methodology.
**Confidence**: **High for the 15% figure** — peer-reviewed ICSE paper, confirmed by an independent review, plus a third corroboration in search results. **This is the best-evidenced quantitative claim in the entire document.**

**Caveats, which are as important as the number** (from the independent review):
1. **It is a conservative lower bound.** The authors acknowledge the method "understates their effectiveness at detecting bugs during private development" — it only counts bugs that survived to become *public, fixed* bugs. Bugs the type checker would have caught during development never entered the sample.
2. **It says nothing about cost-effectiveness.** The reviewer notes it "doesn't tell us whether static typing is cost-effective (e.g., whether any extra time taken to declare types would find more bugs if it was spent writing unit tests)." **This is precisely the trade-off the course's gate exercise asks students to make**, and the honest answer is that the research does not settle it.
3. **Age.** Flow 0.30 and TypeScript 2.0 are from 2016. TypeScript's inference and strictness options have improved substantially since. The 15% is, if anything, **stale on the low side** — but nobody has re-run it, so we cannot say by how much.

**What types provably do NOT catch**: everything in the other ~85% — logic errors, off-by-one, wrong business rule, wrong SQL, race conditions, missing requirement. **This is the number that justifies the course having three test layers at all.** If types caught 80% there would be little argument for tests; at 15%, the argument is settled.

#### J2: Static analysis (lint-class tools) has high false-positive and high false-negative rates

**Evidence** (multiple independent empirical studies, all recent):
- "empirical evaluations highlight high false positive rates of the warnings (**over 76%**) in vulnerable changes which can strongly hinder the effectiveness of code reviews."
- "**52%** of vulnerable code commits can be warned by a single tool in changed functions that contain vulnerable code, and by combining tools, the detection effectiveness can increase by **26%**."
- "Even the top-performing analyzer fails to detect **47% to 80%** of vulnerabilities included in benchmark datasets depending on the evaluation scenario."

**Sources**: [An Empirical Study of Static Analysis Tools for Secure Code Review, arXiv:2407.12241](https://arxiv.org/html/2407.12241v1); [Efficacy of static analysis tools for software defect detection on open-source projects, arXiv:2405.12333](https://arxiv.org/abs/2405.12333); [An Empirical Study of False Negatives and Positives of Static Code Analyzers, arXiv:2408.13855](https://arxiv.org/pdf/2408.13855) — all Accessed 2026-08-27. Domain `arxiv.org`, reputation High (1.0) per config, **but all preprints and none deep-read — these figures come from search-result summaries.**
**Confidence**: **Medium.** Three independent studies agree on the *direction* (high FP, high FN), which is a genuine cross-reference. The *specific percentages* are second-hand and **should be flagged as such in classroom material** or omitted entirely.

**Important scope caveat**: these studies concern **security-oriented static analysis on C/C++/Java**, not ESLint/Biome/Oxlint on TypeScript. **Transfer to the course's context is weak.** I found no equivalent study for JS/TS linters.

**Analysis (interpretation)**: The defensible, evidence-anchored classroom claim is the qualitative one: **static analysis is a broad, cheap, shallow net with a substantial false-positive tax and large blind spots.** That claim is supported. Any specific percentage for ESLint on TypeScript is **not** supported and should not be presented.

#### J3: The defect-class coverage map (synthesis — this is analysis, cross-referenced, not a single citation)

| Defect class | typecheck | lint | unit | integration | E2E | build | migration |
|---|---|---|---|---|---|---|---|
| Type/shape mismatch, null misuse | **Yes (~15% of all bugs, J1)** | Partial (type-aware rules) | Incidental | Incidental | Incidental | **No** (types stripped, G1) | No |
| Unused code, floating promises, import cycles | Partial | **Yes** | No | No | No | Partial (resolution) | No |
| Wrong business logic / wrong rule | **No** | **No** | **Yes** | Yes | Yes | No | No |
| Wrong SQL / bad query / constraint violation | No | No | **No** | **Yes** | Yes | No | Partial |
| Broken wiring between layers | No | No | **No** | Partial | **Yes** | Partial | No |
| Broken UI / user-visible regression | No | No | No | No | **Yes** | No | No |
| Schema drift / unapplied migration | No | No | No | Partial | Partial | No | **Yes** |
| Requirement with no coverage | No | No | No | No | No | No | No → **spec-trace only** |
| Formatting / style | No | Yes | No | No | No | No | No |

**Read the columns, not the rows.** The point for students: **every column has large blank regions, and the blanks barely overlap.** There is no single check that dominates another. That is precisely why gate composition is a design problem with real trade-offs rather than a matter of turning everything on.

### Part K — SECONDARY QUESTION: Which checks most improve AI coding agent success?

**Headline answer: the evidence is real and better than expected, but it is one step removed from the question you actually asked.** There is solid, quantitative, recent academic work on *LLM self-repair from error feedback* — including a directly usable finding on how error *type* determines repair success. There is essentially **nothing** measuring "which of typecheck / lint / unit / E2E most improves agent success in a real TypeScript repo". The transfer from benchmark self-repair to real agentic gate composition is an **inference, and must be labelled as one**.

#### K1: Self-repair from error feedback works, and most of the benefit arrives in the first two rounds

**Evidence** (quantitative, seven models, two benchmarks, up to five attempts = initial + four repair rounds):
- Pass-rate gains from self-repair: **"+4.9 to +17.1 percentage points"** on HumanEval across seven models; **"+16.0 to +30.0 percentage points"** on MBPP Sanitized.
- **"most gains concentrate in the first two rounds"** — specifically, **"two repair rounds capture the majority (76–95%) of the total achievable improvement."**
- Models: Llama 3.1 8B, Llama 3.3 70B, Llama 4 Scout, Llama 4 Maverick, Qwen3 32B, Gemini 2.5 Flash and Pro. Benchmarks: HumanEval (164 problems), MBPP Sanitized (257 problems).
- Conclusion: "prompt-based self-repair is now effective across seven models from three families, even at 8B scale."

**Source**: ["How Many Tries Does It Take? Iterative Self-Repair in LLM Code Generation Across Model Scales and Benchmarks", arXiv:2604.10508](https://arxiv.org/html/2604.10508v1) — Accessed 2026-08-27. Domain `arxiv.org`, reputation High (1.0) per config. **Bias/quality flag: arXiv preprint — peer-review status unconfirmed.** Treat the direction as reliable, the exact percentages as provisional.
**Confidence**: Medium-High.

**Direct course implication**: the "how many correction rounds does the agent need" framing in the course brief is **the right metric**, and this paper effectively measures it. It also gives a concrete budgeting rule: **a gate's feedback is worth optimising for the first two correction rounds, because that is where 76–95% of the recoverable value sits.** A check whose output only becomes useful on round four is, empirically, near-worthless.

#### K2: **Error message informativeness predicts repair success — and this is the empirical backbone of the course's central insight**

**Evidence** (same paper, error-type breakdown of repair success rates):

| Error type | Repaired at | What the message tells the model |
|---|---|---|
| Name errors | **~77%** | Exact symbol, exact location |
| Syntax errors | **~66%** | Exact location, precise grammatical reason |
| Assertion errors (logical mistakes) | **only ~45%** | That the output was wrong — little else |

The paper's own explanation: **"assertion errors indicate that the code ran successfully but produced the wrong output," providing minimal diagnostic information for correction.**

**Source**: [arXiv:2604.10508](https://arxiv.org/html/2604.10508v1) — Accessed 2026-08-27. High (1.0), preprint caveat as above.
**Confidence**: Medium-High.

**Analysis — this is the closest thing to a measured proof of the course's thesis that exists.** The course claims: *"An E2E failure says 'the scenario failed' and the agent must then investigate; a unit test failure names the function that returned the wrong value. Same defect, wildly different quality of signal."* This paper measures exactly that gradient inside a single model on a single benchmark: **errors that name a location and a reason are repaired ~1.7x more often than errors that only report a wrong outcome (77% vs 45%).**

Map it onto the gate catalogue and the ordering falls out:
- `tsc` / lint errors are structurally **name-and-syntax-shaped** — symbol, location, precise reason, stable code. The ~66–77% band.
- Unit-test failures are assertion-shaped **but enriched** — expected value, actual value, test name stating intent, stack trace. Better than a bare assertion error, worse than a type error.
- **E2E / BDD failures are the degenerate case of the assertion error**: "the scenario failed", no location in production code, no expected-vs-actual on any internal value. At or below the ~45% band.

**Explicit honesty requirement for the classroom**: this is a *mapping argument*, not a measurement. Nobody has run this experiment on a TypeScript repo with these specific gates. Present the 77/66/45 numbers as *what they are* — HumanEval/MBPP Python self-repair by error category — and present the mapping onto gates as **the course's hypothesis, which the paper makes plausible.** Do not present it as measured fact about TypeScript gates.

#### K3: Compiler/type-checker feedback is argued to be *categorically* better than execution feedback

**Evidence**: A study of GPT-5 generating Idris code argues that compiler feedback offers superior guidance to execution feedback because it "provides immediate, fine-grained error information without requiring test case execution, enabling faster iteration cycles." It frames the strict type system as an advantage: the type checker catches errors that would otherwise slip through, "creating actionable feedback signals", in contrast to dynamically-typed languages "where runtime errors occur later". The paper identifies compiler-level feedback as **the critical bottleneck** in dependently-typed languages.
**Source**: ["Compiler-Guided Inference-Time Adaptation: Improving GPT-5 Programming Performance in Idris", arXiv:2602.11481](https://arxiv.org/pdf/2602.11481) — Accessed 2026-08-27. High (1.0), **arXiv preprint**.
**Confidence**: **Medium**, and deliberately not higher. Two reasons: (a) preprint, (b) **Idris is a dependently-typed language and generalising from it to TypeScript is a substantial leap.** Idris types can express far more of a specification than TypeScript types can; the argument "stricter types = better agent feedback" is *directionally* supported but the magnitude will not transfer.

**Note on the two feedback granularities**, which is a useful classroom vocabulary item and appeared consistently across the surveyed literature: **coarse-grained feedback** = binary pass/fail; **fine-grained feedback** = detailed error reasons and locations. Sources: the survey material in [arXiv:2606.17514](https://arxiv.org/html/2606.17514) and related work surfaced in search. **Confidence: Medium — I did not deep-read these secondary papers; the distinction is corroborated by K1/K2 which I did read.**

#### K4: Self-repair beats resampling on token cost — the "cheap feedback loop" argument, quantified

**Evidence**: Self-repair "uses fewer tokens than resampling to achieve comparable or better pass rates, with savings ranging from **11% to 54%**." Concretely, Llama 3.3 70B reached **93.3% vs 90.9%** pass rate while using **less than half the tokens (112K vs 231K)**. The paper notes "self-repair is increasingly advantageous for capable models" — as models improve, "the informational signal from error messages [becomes] more valuable than the diversity from independent samples."
**Source**: [arXiv:2604.10508](https://arxiv.org/html/2604.10508v1) — Accessed 2026-08-27.
**Confidence**: Medium-High (single paper, preprint).

**Analysis**: this says something quietly important for the course. A good gate is not merely a quality control; it is a **token-efficiency instrument**. Feeding a precise error back is cheaper than letting the agent try again from scratch. And the trend line points the right way: better models extract *more* value from good error messages, so investment in gate output quality appreciates rather than depreciates. Connects directly to Vitest's agent reporter (D1), which is a vendor optimising the same variable from the other end.

#### K5: KNOWN GAP — no measurement of feedback-loop *latency* against agent performance

I searched for evidence that faster feedback (seconds vs minutes) measurably improves agent outcomes and **found none**. This is a genuine hole. The intuition is strong and universally assumed in practitioner writing, but:
- The self-repair literature counts **rounds**, not wall-clock seconds.
- No study I found varied *only* feedback latency and measured agent success.

**Say this plainly in class: feedback-loop latency for AI agents is under-studied.** What *is* evidenced is that rounds are expensive in tokens (K4) and that most value lands in the first two rounds (K1). Latency's cost is therefore currently best argued as a **human-attention and iteration-throughput cost**, not an agent-accuracy cost. That is an honest and still-sufficient argument for a fast gate — but it is a different argument from the one people usually make.

#### K6: KNOWN GAP — no evidence on TypeScript `strict` settings and agent-generated code quality

The course's parked decision leans on "strict typing as high-quality agent feedback". I searched for empirical work measuring the effect of TypeScript strictness settings (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) on AI-generated code quality or correction rounds and **found nothing.** The Idris paper (K3) is the nearest analogue and it is a poor analogue.

**Recommendation**: keep the strictness decision, but justify it from K2 (location-and-reason-bearing errors repair far better than outcome-only errors) plus the mechanical fact that stricter settings convert would-be runtime assertion errors into compile-time located errors — i.e. **strictness moves defects from the ~45% band into the ~66–77% band.** That is a defensible argument built on cited evidence rather than an unsupported claim. Label it as the course's reasoning, not as a research finding.

---

## Source Analysis

| Source | Domain | Reputation | Type | Access Date | Cross-verified |
|--------|--------|------------|------|-------------|----------------|
| TypeScript native port announcement | devblogs.microsoft.com | High (1.0) | Official vendor | 2026-08-27 | Y (same-org cluster w/ typescript-go) |
| microsoft/typescript-go | github.com | Medium-High (0.8) | Official vendor repo | 2026-08-27 | Y (same cluster) |
| TypeScript compiler options handbook | typescriptlang.org | High (1.0) | Official | 2026-08-27 | N (authoritative alone) |
| Oxc linter guide | oxc.rs | High (1.0) for own tool | Official vendor | 2026-08-27 | N — vendor speed claim uncorroborated |
| Biome linter docs | biomejs.dev | High (1.0) | Official vendor | 2026-08-27 | N (authoritative alone) |
| Biome CLI reference | biomejs.dev | High (1.0) | Official vendor | 2026-08-27 | N (authoritative alone) |
| ESLint formatters docs | eslint.org | High (1.0) | Official | 2026-08-27 | N (authoritative alone) |
| Vitest reporters guide | vitest.dev | High (1.0) | Official vendor | 2026-08-27 | N (authoritative alone) |
| Node.js test runner API | nodejs.org | High (1.0) | Official language docs | 2026-08-27 | N (authoritative alone) |
| Playwright test reporters | playwright.dev | High (1.0) | Official vendor | 2026-08-27 | N (authoritative alone) |
| Playwright trace viewer | playwright.dev | High (1.0) | Official vendor | 2026-08-27 | N (authoritative alone) |
| vitalets/playwright-bdd | github.com | Medium-High (0.8) | OSS project | 2026-08-27 | N — version/date unverified |
| esbuild FAQ benchmark | esbuild.github.io | High (1.0) for own tool | Official vendor | 2026-08-27 | N — self-benchmark, bias flagged |
| drizzle-kit check docs | orm.drizzle.team | High (1.0) | Official vendor | 2026-08-27 | N — exit codes undocumented |
| drizzle-orm Discussion #5685 | github.com | Medium-High (0.8) | Community discussion | 2026-08-27 | N — Low-Medium confidence |
| prisma/prisma Issue #9707 | github.com | Medium-High (0.8) | Issue tracker | 2026-08-27 | N — status unverified |
| Gao/Bird/Barr, ICSE 2017 | dl.acm.org | High (1.0) | Peer-reviewed academic | 2026-08-27 | **Y** — [Paywalled, HTTP 403] |
| It Will Never Work in Theory review | neverworkintheory.org | Medium-High (0.8) | Research summary | 2026-08-27 | **Y** — independently confirms 15% |
| arXiv:2604.10508 (self-repair) | arxiv.org | High (1.0) | Academic **preprint** | 2026-08-27 | N — single study, deep-read |
| arXiv:2602.11481 (Idris/compiler feedback) | arxiv.org | High (1.0) | Academic **preprint** | 2026-08-27 | N — Idris→TS transfer weak |
| arXiv 2407.12241 / 2405.12333 / 2408.13855 | arxiv.org | High (1.0) | Academic **preprints** | 2026-08-27 | **Y** — 3 studies agree on direction |
| quantori/GherkinSyncTool | github.com | Medium-High (0.8) | OSS project | 2026-08-27 | N — not deep-inspected |
| TestCollab / TestRail RTM pages | vendor sites | **Medium (0.6)** | Marketing — commercial interest | 2026-08-27 | N — cited only for category existence |

**Reputation distribution**: High: 15 (65%) | Medium-High: 7 (30%) | Medium: 1 (4%). **Average: ~0.92.**
**Rejected**: 6 SEO/AI-generated benchmark articles — logged in Part B1, cited for nothing.

## Knowledge Gaps

### Gap 1: No measured runtime for Vitest vs `node:test` at small scale
**Issue**: Part D3 argues from *documented defaults* (process-per-file isolation, serial execution) that `node:test` startup cost scales with file count. The magnitude is unmeasured. | **Attempted**: searched for head-to-head benchmarks; only untrustworthy blog comparisons found. | **Recommendation**: measure in-repo — 20 trivial test files under each runner. Five-minute experiment; also a good classroom demo of the catalogue's own method.

### Gap 2: No published runtime for `node:sqlite` integration test suites
**Issue**: The claim that integration tests are nearly as cheap as unit tests with in-process SQLite is **architecturally sound but unmeasured**, and it is one of this research's more consequential conclusions. | **Attempted**: searched for `node:sqlite` test-performance figures; nothing published. | **Recommendation**: **highest-priority measurement.** If true, it justifies putting integration tests in the fast gate — a genuinely non-obvious course finding. Measure before teaching it.

### Gap 3: No runtime figure for playwright-bdd E2E on a small app
**Issue**: The whole 90-second exercise pivots on E2E's cost, and there is no citable number. | **Attempted**: playwright-bdd README, Playwright docs; neither publishes suite timings. | **Recommendation**: measure the course's own suite. Report cold and warm, and with/without trace enabled — the `on` trace mode is documented as "performance heavy" with **no quantification**, which is itself a measurable unknown.

### Gap 4: Feedback-loop *latency* vs agent success is under-studied
**Issue**: No study found that varies feedback latency alone and measures agent outcomes. The self-repair literature counts rounds, not seconds. | **Attempted**: multiple searches across arXiv. | **Recommendation**: **state this as under-studied in class.** Argue fast gates from token cost (K4) and human throughput, not from unevidenced agent-accuracy claims.

### Gap 5: No evidence on TypeScript strictness settings vs AI-generated code quality
**Issue**: Course decision 3 leans on "strict typing as high-quality agent feedback"; no empirical work exists on `strict`/`noUncheckedIndexedAccess`/`exactOptionalPropertyTypes` and agent output. | **Attempted**: targeted searches; nearest analogue is the Idris paper, a poor analogue. | **Recommendation**: keep the decision, rebuild the justification on K2 (strictness moves defects from the ~45% band to the ~66–77% band). Label as course reasoning.

### Gap 6: No JS/TS-specific static-analysis effectiveness study
**Issue**: The FP/FN figures in J2 come from **security analysis of C/C++/Java**, not ESLint on TypeScript. Transfer is weak. | **Attempted**: searched for ESLint/TS-specific defect-detection studies; none found. | **Recommendation**: use only the qualitative claim in class. Do not quote the percentages for TypeScript linting.

### Gap 7: `drizzle-kit check` output format and exit codes undocumented
**Issue**: You cannot design a gate around a check whose failure output you have not seen. | **Attempted**: official docs page — silent on both. | **Recommendation**: run it against a deliberately broken migration history and document the output. Good exercise material.

### Gap 8: playwright-bdd version and release recency unverified
**Issue**: "Actively maintained" was inferred from commit count, not from a dated release. | **Recommendation**: check npm for the current version and publish date before class. This fact rots fastest of anything here.

### Gap 9: Spec-trace negative finding is inherently weak
**Issue**: "No suitable off-the-shelf tool exists" rests on absence of search results. | **Recommendation**: one npm-registry search (`gherkin coverage`, `feature file lint`) before treating it as settled.

## Conflicting Information

### Conflict 1: Magnitude of the TypeScript native-port speedup
**Position A**: ~10x. Microsoft's published table shows 9.1x–13.5x across six codebases (VS Code 10.4x, TypeORM 13.5x, tRPC 9.1x). Source: [devblogs.microsoft.com](https://devblogs.microsoft.com/typescript/typescript-native-port/), reputation High — **but vendor-published on vendor hardware with vendor-chosen inputs.**
**Position B**: ~3x on a real Next.js monorepo. Source: a dev.to practitioner post, reputation Medium (0.6), **not verified**; surfaced only via search summary.
**Assessment**: Position A is far better sourced and methodologically transparent. Position B is plausible in the specific sense that vendor benchmarks select favourable inputs, and Microsoft's own table already shows the variance (tRPC at 18k LOC takes 5.5s while date-fns at 104k LOC takes 6.5s — **LOC does not predict typecheck time; type complexity does**). **Resolution for the classroom**: state "Microsoft measures ~10x on their suite; independent reports of smaller real-world gains exist; measure your own repo." Do not present either number as settled.

### Conflict 2: Whether static analysis is worth its false-positive cost
**Position A** (implicit in vendor docs): more rules = more defects caught. Oxlint 865 rules, Biome 526.
**Position B** (empirical): FP rates "over 76%" in one study; top analyzers miss "47% to 80%" of benchmark vulnerabilities. Sources: three arXiv preprints agreeing on direction.
**Assessment**: Not a true contradiction — they measure different things (rule count vs real-world yield). **The synthesis is the finding**: rule count is a bad proxy for defect-catching power, since most rules in all three linters are stylistic. Position B is more decision-relevant, with the strong caveat that it concerns C/C++/Java security analysis (Gap 6).

## Provenance Warnings (figures students should not over-trust)

Ordered by how likely a student is to be misled:

1. **All [E] runtime estimates for course-scale repos.** Every one is extrapolated downward from benchmarks on codebases 10–1000x larger. Directionally right, numerically soft. **Replace with measurements.**
2. **"Oxlint is 50–100x faster than ESLint"** — vendor claim, commercial interest in exactly this number, not independently verified here.
3. **"~10x faster" for TypeScript 7** — vendor benchmark; see Conflict 1.
4. **esbuild's bundler comparison table** — esbuild benchmarking itself against competitors on an input it chose. Methodology is unusually transparent (a credibility point), ordering is uncontroversial, ratios are favourable-case.
5. **Static-analysis FP/FN percentages (76%, 52%, 47–80%)** — second-hand from search summaries, from arXiv preprints not deep-read, concerning a **different language family and a security focus.** Prefer the qualitative claim; consider omitting the numbers entirely from student-facing material.
6. **The 77% / 66% / 45% error-type repair rates** — genuinely measured and deep-read, but on **Python, HumanEval/MBPP, benchmark problems, arXiv preprint.** The *mapping* onto TypeScript gates is this course's hypothesis, not a finding. Present it as such — it is more persuasive framed honestly.
7. **The 15% type-detection figure** — the *best*-evidenced number here (peer-reviewed ICSE, independently confirmed), but from **2017, Flow 0.30 and TypeScript 2.0**, and an explicit **lower bound**. Modern strict TypeScript likely does better; nobody has re-measured.
8. **Anything from the six rejected SEO articles** — "56x faster", "30–45s → under 1s", "100k LOC in under 2 seconds". **Cited nowhere. If a student finds these while searching, that is a teachable moment about source quality in an AI-generated-content web.**

## Recommendations for Further Research

1. **Measure the course repo's own gate timings** and replace every [E] and [U] in Table 1. This is the single highest-value action, and doing it *with the students* would demonstrate the catalogue's method better than presenting finished numbers.
2. **Measure `node:sqlite` integration-suite runtime** (Gap 2). If integration tests really are near-unit-test cost, that is a publishable-quality course insight and it changes the recommended gate.
3. **Instrument correction rounds directly.** Give Claude Code the same seeded defect and let it self-correct with (a) only E2E, (b) only unit tests, (c) only typecheck. Count rounds to green. This is a **small, feasible, genuinely novel experiment** that would turn the course's central hypothesis into its own measured evidence — and it would make a superb live demo.
4. **Verify playwright-bdd's current version and Playwright compatibility** before class (Gap 8).
5. **Run the drizzle-kit check failure-output experiment** (Gap 7) and write up the actual output.
6. **Search npm for repo-local Gherkin coverage tooling** to firm up the spec-trace negative finding (Gap 9).

## Full Citations

[1] Microsoft. "A 10x Faster TypeScript". TypeScript DevBlog. https://devblogs.microsoft.com/typescript/typescript-native-port/. Accessed 2026-08-27.
[2] Microsoft. "microsoft/typescript-go". GitHub. https://github.com/microsoft/typescript-go. Accessed 2026-08-27.
[3] Microsoft. "TSConfig / Compiler Options Reference". typescriptlang.org. https://www.typescriptlang.org/docs/handbook/compiler-options.html. Accessed 2026-08-27.
[4] Oxc Project. "Linter Usage Guide". oxc.rs. https://oxc.rs/docs/guide/usage/linter.html. Accessed 2026-08-27.
[5] Biome. "Linter". biomejs.dev. https://biomejs.dev/linter/. Accessed 2026-08-27.
[6] Biome. "CLI Reference". biomejs.dev. https://biomejs.dev/reference/cli/. Accessed 2026-08-27.
[7] ESLint. "Formatters". eslint.org. https://eslint.org/docs/latest/use/formatters/. Accessed 2026-08-27.
[8] Vitest. "Reporters". vitest.dev. https://vitest.dev/guide/reporters. Accessed 2026-08-27.
[9] Node.js. "Test runner". nodejs.org. https://nodejs.org/api/test.html. Accessed 2026-08-27.
[10] Playwright. "Reporters". playwright.dev. https://playwright.dev/docs/test-reporters. Accessed 2026-08-27.
[11] Playwright. "Trace viewer". playwright.dev. https://playwright.dev/docs/trace-viewer. Accessed 2026-08-27.
[12] Vitalets. "playwright-bdd". GitHub. https://github.com/vitalets/playwright-bdd. Accessed 2026-08-27.
[13] esbuild. "FAQ — Benchmark details". esbuild.github.io. https://esbuild.github.io/faq/#benchmark-details. Accessed 2026-08-27.
[14] Drizzle Team. "drizzle-kit check". orm.drizzle.team. https://orm.drizzle.team/docs/drizzle-kit-check. Accessed 2026-08-27.
[15] Drizzle Team. "Discussion #5685: in-built drizzle checker for migration state". GitHub. https://github.com/drizzle-team/drizzle-orm/discussions/5685. Accessed 2026-08-27.
[16] Prisma. "Issue #9707: Detect schema drift helper / migrate dev --exit-code". GitHub. https://github.com/prisma/prisma/issues/9707. Accessed 2026-08-27.
[17] Gao, Z., Bird, C., Barr, E.T. "To Type or Not to Type: Quantifying Detectable Bugs in JavaScript". Proc. 39th ICSE, Buenos Aires, May 2017. https://dl.acm.org/doi/10.1109/ICSE.2017.75. [Paywalled — HTTP 403 on access]. Open-access author copy: https://earlbarr.com/publications/typestudy.pdf. Accessed 2026-08-27.
[18] It Will Never Work in Theory. "To Type or Not to Type: Quantifying Detectable Bugs in JavaScript". 2021-09-08. https://neverworkintheory.org/2021/09/08/to-type-or-not-to-type.html. Accessed 2026-08-27.
[19] "How Many Tries Does It Take? Iterative Self-Repair in LLM Code Generation Across Model Scales and Benchmarks". arXiv:2604.10508 [preprint]. https://arxiv.org/html/2604.10508v1. Accessed 2026-08-27.
[20] "Compiler-Guided Inference-Time Adaptation: Improving GPT-5 Programming Performance in Idris". arXiv:2602.11481 [preprint]. https://arxiv.org/pdf/2602.11481. Accessed 2026-08-27.
[21] "An Empirical Study of Static Analysis Tools for Secure Code Review". arXiv:2407.12241 [preprint]. https://arxiv.org/html/2407.12241v1. Accessed 2026-08-27.
[22] "Efficacy of static analysis tools for software defect detection on open-source projects". arXiv:2405.12333 [preprint]. https://arxiv.org/abs/2405.12333. Accessed 2026-08-27.
[23] "An Empirical Study of False Negatives and Positives of Static Code Analyzers". arXiv:2408.13855 [preprint]. https://arxiv.org/pdf/2408.13855. Accessed 2026-08-27.
[24] Quantori. "GherkinSyncTool". GitHub. https://github.com/quantori/GherkinSyncTool. Accessed 2026-08-27.
[25] Project-internal: `docs/course-design-decisions.md`, Kurs produktutvikling repo. Session date 2026-08-27.

**Rejected sources (logged, cited for nothing)**: tech-insider.org, pkgpulse.com, byteiota.com, nerdleveltech.com, techloghub.com, pikvue.com — SEO/AI-generated "2026 benchmark" articles, none on trusted domains.

## Research Metadata

Sources examined: ~30 | Cited: 25 | Rejected: 6 | Cross-referenced claims: 4 (TS native speedup; 15% type detection; static-analysis FP/FN direction; self-repair effectiveness)
Confidence distribution: **High** ~45% (output formats, reporter inventories, published vendor benchmark tables, the 15% figure) | **Medium** ~45% (runtime extrapolation to course scale, arXiv preprint findings, agent-feedback ratings as reasoned analysis) | **Low** ~10% (migration-tooling community claims, spec-trace negative finding, playwright-bdd recency)
Tool failures: ACM DL returned HTTP 403 [Paywalled] — mitigated via independent research-summary confirmation. Two PDF fetches returned unparseable binary (typestudy.pdf, partially 2602.11481) — mitigated via HTML versions and secondary summaries; noted as reduced confidence where relevant.
Output: `docs/research/tooling/gate-catalogue-comprehensive-research.md`
