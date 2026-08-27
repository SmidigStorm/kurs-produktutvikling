# Kurs produktutvikling — design decisions (working document)

Status: **grilling complete, research items 1–4 delivered.** Session date 2026-08-27.
Records what is decided, what is deliberately parked, what the research found,
and the experiments to run before the course.

---

## 1. What the course is actually about

**The subject is process design and process improvement — encoded as skills,
commands and tools. The application is only a vehicle.**

This reframing happened mid-session and supersedes the original framing ("a
teaching repo with a robust stack"). Earlier decisions were re-evaluated against
it, and several were reversed.

Course shape:

1. Process and **BPMN mapping** — students model the development process explicitly.
2. Build an SDD process **one step at a time**, starting with `spec → plan → task → implement`.
3. Run the process **multiple times**, improving it between runs.

Consequence: divergent student processes are a *feature*, not a problem to
standardise away. Anything the repo prescribes steals an exercise.

**Format:** single full day, ~6 hours. Mixed room of developers and product people,
working in cross-functional pairs.

---

## 2. Decided

### Course & audience

| # | Decision | Choice |
|---|----------|--------|
| 1 | Audience | Mixed room (devs + product people), hands-on |
| 15 | Product person's role | **Pairs with a developer throughout** |
| 16 | Pair working mode | **One repo, one machine at a time** — pair swaps driver. Only the developer's machine runs the app. |
| 17 | Format | **Single full day (~6h)** |
| 10/20 | Cycle structure | **Cycles 1 and 2 use similarly-shaped features** so process improvement is the only variable and is directly felt. A **third, differently-shaped item — amending an existing rule** — waits for fast pairs and take-home. |
| 23 | Improvement evidence | **Retro discussion, nothing formally recorded.** Note: the process Mermaid file is committed, so `git log` on it is a free record of every process change. |
| 18 | Language of artifacts | **Everything English** — specs, features, code, docs |
| 19 | Process model | **Map on a whiteboard, encode as Mermaid, commit it.** Diffs readably between cycles, renders in GitHub, agent can edit it. BPMN concepts without BPMN's file format. |

### Method & tooling

| # | Decision | Choice |
|---|----------|--------|
| 5 | Spec ↔ BDD topology | **Gherkin-native** — feature files *are* the acceptance criteria, not a second document. Avoids the classic BDD failure of two drifting requirement artifacts. |
| 7 | SDD suite | **Hand-rolled, repo-local, built with the students in class.** A ready-made simple kit ships in the repo (e.g. `course/sdd-kit/`) for anyone stuck — available, not pre-installed. |
| 9 | Contract between student processes and repo automation | **Minimal** — only what automation strictly needs. Divergence is deliberate. |
| 14 | Agent | **Claude Code** as the primary tool (unlocks commands, skills, subagents, hooks — so "process enforced by the machine" is demonstrable). Artifacts stay plain markdown for portability. |
| 24 | Claude Cowork | **Spec-authoring only.** Guarantee the product person can write specs and feature files in Cowork with no terminal. Running the app, tests and gate stays on the developer's machine. No full parity. |
| 6 | SpecKit | **Dropped.** Superseded by the hand-rolled suite. Vendoring/pinning problem evaporates. |

### Engineering

| # | Decision | Choice |
|---|----------|--------|
| 11 | CI/CD | **None.** No pipeline, no online deploy. Local gates only. Deletes Actions, deploy targets, secrets, environments, branch protection. |
| 12/13 | Gates | **Gate catalogue, unwired.** Every check exists as an individually runnable command, each documented on three axes: *what it catches, how long it takes, what signal it gives the agent.* Nothing wired by default — students compose the policy. |
| 22 | Test layers | **Three layers, none mandatory** — typecheck, fast domain unit/integration tests, BDD E2E. Worked examples of each. Gives the gate exercise real trade-offs and the agent high-quality fast feedback. Process decides what's required. |
| 21 | Test data & recovery | **Separate ephemeral test database + one-command `reset`.** Tests never wipe the pair's demo data. (Trivial now that the DB is SQLite — a second file.) |
| 3 | Language | **TypeScript everywhere** — backend, frontend and tests. One toolchain for a mixed room, `playwright-bdd` native rather than substituted, strict typing as high-quality agent feedback, and Node ≥22 ships SQLite in the standard library so there is no native compilation in the setup path. |
| 27 | App topology | **Separate backend and frontend** — distinct directories and processes, started by a single `dev` script. Layer boundaries visible in the tree and in the running system, and they map onto the pair's division of labour. Bought with the simplicity budget freed by dropping Docker and CI. |
| 29 | Frontend framework | **React** (with Vite). Chosen on asymmetric risk: if Claude Code is more reliable in React than in Svelte 5 runes, agent noise would contaminate the exact variable the course measures; if that turns out to be wrong, React is merely less pretty — a much smaller cost. Svelte's readability edge rested only on medium-trust commercial blogs. |
| 30 | ORM & migrations | **Drizzle ORM + drizzle-kit on `better-sqlite3`.** Reverses the research recommendation after its central objection was empirically falsified — see §4a. Chosen on the course's own criterion: a typo'd column becomes a `tsc` error (name-error band, ~77% agent repair rate) instead of a runtime failure (assertion band, ~45%). |
| 26 | Database & packaging | **SQLite. No Docker.** Everything as simple as possible. Setup is install deps + run one command. Real migrations preserved. |
| 2 | Onboarding | **Developers set the app up before class** (async, with time to get help). Needs a pre-class doc and a `verify-setup` command giving unambiguous pass/fail — the dangerous failure is "I thought it was working". |
| 25 | Broken-setup fallback | **Pair up with another pair, and fix it live.** Requirement this imposes: the app must be *slightly failsafe* — minimal services, no native build steps, pinned lockfiles, few ways to fail. |
| — | Pre-building | **Maximum.** App, gate catalogue, feature backlog and a skeleton SDD kit all exist before class. Class time buys process thinking; everything else is pre-built. |

### Key insight to carry forward: gates serve two masters

- **The human** — "do I feel safe?"
- **The agent** — a failing check is the signal it self-corrects against.

These rank checks differently. A slow security scan is good human reassurance and
near-useless as agent feedback. A strict typechecker is mediocre reassurance and
*excellent* agent feedback: it fails in seconds with file, line and reason. An E2E
failure says "the scenario failed" and the agent must investigate; a unit test
failure names the function that returned the wrong value.

**This is an independent argument for strict static typing and deterministic,
machine-readable test output** — see the parked language decision.

### Design constraints falling out of the decisions

- **Ownership-split directory layout** — product-person artifacts (`specs/`,
  `features/`) and developer artifacts (`src/`) in non-overlapping directories.
  Kept as a structural principle even though one-machine-at-a-time removes the
  merge-conflict motivation; it also makes the Cowork spec-authoring path clean.
- **Agent as the git interface** — the product person never learns git commands.
  Contingency only: if a pair does split across machines, agent-driven git on a
  shared branch is the documented fallback. Not taught.
- **Failsafe setup** — every avoidable setup failure mode is a tax on the only day
  available.

---

## 3. Parked — decide after research

| # | Question | What research must produce |
|---|----------|---------------------------|
| 4 | **Domain** | User has an existing course-registration app and wants "something more fun". Must be: instantly understandable, *deterministic* underneath the fun, and rich enough for several feature-shaped holes including one rule-amendment. Candidates floated: office game ladder (players/matches/rankings; feature = seasons + inactivity decay), pub quiz (feature = joker double-points + tie-break by speed), lunch roulette (feature = no repeat pairings within 3 rounds + odd numbers). An open-source backlog/Jira-alternative was floated as a possible domain — only viable as *the app itself*, never as infrastructure. **New from §4b — the Gilded Rose test:** a domain that survives real training rooms has an invariant, at least one deliberate exception to the main rule, and a rule amendment held in reserve. Against that test the **office game ladder** scores best of the three: decay is the invariant, an inactive or provisional player is the natural exception, and "seasons reset rankings" is a clean withheld amendment. Still the user's call. |

---

## 4. Research outcomes (2026-08-27)

Three research documents, all in `docs/research/`:

- `tooling/typescript-stack-and-baseline-apps-comprehensive-research.md`
- `methodology/gherkin-native-sdd-kits-comprehensive-research.md`
- `tooling/gate-catalogue-comprehensive-research.md`

### Recommended stack (item 1)

Hono + Zod + `@hono/node-server` (backend), Vite + React (frontend, item 29),
SQLite via **Drizzle ORM + drizzle-kit on `better-sqlite3`** (item 30 — this
supersedes the research's `node:sqlite` + raw-SQL recommendation, see §4a),
Vitest, playwright-bdd. The three backend packages have **zero runtime
dependencies** — verified from npm registry manifests.

~~**Skip ORMs entirely.**~~ **Superseded — see §4a below.** The research argued that
every mainstream ORM reintroduces `better-sqlite3` and therefore native
compilation, violating the failsafe-setup constraint, and recommended a ~60-line
`db.exec()` migration runner instead. The premise was tested and does not hold.

**playwright-bdd is not a risk.** MIT, actively maintained, tracks Playwright
within weeks of each minor. Pin exactly; residual risk is browser downloads.

**Correction to a widely-repeated falsehood:** `node:test` does have watch mode
(since v19.2.0) and stable snapshots (since v23.4.0). Vitest still wins, but only
on assertion-diff quality — `node:test` is a credible near-zero-dependency
fallback.

## 4a. Empirical correction: the ORM objection does not hold

Tested directly on this machine (Node v26.5.0, ABI 147, npm 11.17) on 2026-08-27.
The research's headline threat to failsafe setup was **falsified by measurement**.

**What was claimed:** `better-sqlite3` requires native compilation via `node-gyp`,
so any ORM depending on it breaks setup on student laptops.

**What is actually true:** `better-sqlite3` v13.0.3 **bundles all eight platform
prebuilds inside the npm tarball** — `win32-x64`, `win32-arm64`, `linux-x64`,
`linux-arm64`, `linuxmusl-x64`, `linuxmusl-arm64`, `darwin-x64`, `darwin-arm64`.

- Install: **0.7 seconds, 2 packages, no `node-gyp`, no separate binary download.**
- It runs correctly on Node 26.5 because it is built on **`node-addon-api`
  (Node-API), which is ABI-stable across Node majors** — one prebuild works
  everywhere. The compilation fear is real for older `nan`-based modules and
  largely obsolete here.
- Because the binaries ship *inside* the package rather than being fetched from
  GitHub releases, this **removes** a corporate-proxy failure mode rather than
  adding one.
- `drizzle-kit generate` was run end to end against a sample schema and produced a
  migration successfully.

**The decisive argument for the ORM is the course's own thesis.** With Drizzle, a
typo'd column is caught by the typechecker:

```
src/bad.ts(6,39): error TS2339: Property 'naem' does not exist on type ...
```

File, line, column, precise reason, at typecheck speed. With raw SQL the same
mistake is a *runtime* error surfacing as a failed test. Per the gate-catalogue
research's own measured figures, that is the difference between the **~77%
name-error repair band and the ~45% assertion band** — the ORM converts a
hard-to-repair error class into an easy one.

**Honest residual costs, recorded so nobody rediscovers them in class:**

- `drizzle-kit` pulls in `esbuild`, which has a postinstall script. npm 11 blocks
  postinstall scripts by default and prints an approval warning. It worked anyway,
  but it is a moving part on student machines — verify during the pre-class setup
  check.
- Drizzle's type errors are precise but **verbose** — the sample error dumped a
  deeply nested generic type inline. Good signal, high token cost.
- `@types/better-sqlite3` is needed as an extra dev dependency.
- Generated migrations are magic in a course about examining process — but
  *inspectable* magic, since students can read the generated SQL.

**Lesson worth keeping:** the research reached a confident, well-cited conclusion
from a premise that a 60-second experiment disproved. Cheap empirical checks beat
more reading — which is the same conclusion the pre-course work package reached
from the other direction.

---

### Baseline app: build from scratch (item 3)

No candidate survives. Every maintained starter is optimised for
production-readiness (auth, CI, deploy, observability) — exactly what this course
deleted.

The original decisive argument was pedagogical: production starters are dense with
embedded process opinions (commit hooks, conventional commits, CI workflows), so
"a third-party starter is an unexamined process smuggled into a course about
examining your process." **That argument is weakened — see §4b.** It was measured
false on the one candidate where it was actually tested. The decision stands, but
now rests on **licence availability and structural fit** instead.

## 4b. Second pass: training-oriented templates (2026-08-27)

`docs/research/tooling/training-oriented-app-templates-comprehensive-research.md`

The first survey rejected *production* starters on pedagogical grounds. This pass
searched the category it missed — workshop repos, course companions, katas,
bootcamp projects, BDD/Playwright teaching material. **Verdict unchanged: build
from scratch — but on entirely new grounds.**

### The decisive finding is licensing, which we had not identified

The training-repo category is **not thin. It is well-populated, high-quality,
actively maintained, and almost entirely unavailable.**

Of the top 18 TypeScript repos tagged `topic:workshop`, exactly one carries a
permissive licence — and it is not a workshop repo. Everything else is
`NOASSERTION` or has no licence file at all:

- `epicweb-dev/*` (18 repos, the strongest full-stack TypeScript training material
  in existence) resolves in its own `LICENSE.md` to **GPL-3.0, private
  non-commercial use, "contact us at team@epicweb.dev" to run your own workshop.**
  A double block: non-commercial *and* copyleft on derivatives.
- `total-typescript` — 7,960 stars, **no licence**
- `goldbergyoni/nodejs-testing-best-practices` — 4,390 stars, **no licence**
- `ReactTraining/react-workshop` — 299 stars, **no licence**
- Even the workshop *tooling* (`epicweb-dev/epicshop`) is `NOASSERTION`

No licence means all rights reserved. **The cause is market structure, not search
coverage:** a training repo is maintained precisely because someone is paid to
teach from it, and that person has a direct commercial reason not to license it to
competing training. More searching does not fix this.

### The BDD-template branch was a category error

BDD/Cucumber/Playwright "templates" contain no application — they are deliberately
app-agnostic, because the pitch is that you point them at *your* app. Confirmed at
both quality poles: Serenity/JS's Apache-2.0 template and `playwright-bdd`'s own
`examples/` are harness-only. `topic:coding-dojo language:TypeScript` returns
**six repos in total**, five unlicensed, newest meaningful one from 2018.

### One near-match — and it inverts a prior argument

`w3cj/hono-open-api-starter` — MIT, 1,011 stars, TypeScript + Hono + Drizzle +
Vitest. Its embedded process opinion was **measured rather than assumed**:
`.github/workflows` returns HTTP 404, `.github` holds only `funding.yml`, and
`package.json` has no husky, lint-staged, commitlint, semantic-release or
`prepare` script. Its checks are four unwired npm scripts — `typecheck`, `lint`,
`test`, `build` — which is nearly a literal implementation of decision 12/13.

It still fails: no frontend, no Playwright, no Gherkin, `@libsql/client` instead of
the `better-sqlite3` verified in §4a, ~6 unwanted runtime dependencies against the
zero-dependency-backend goal, ~10 months stale, and a bare `tasks` CRUD domain
with no rule worth amending.

**Conflict flagged rather than buried:** the earlier claim that *"third-party
starters smuggle in an unexamined process"* was measured **false** on the one
candidate where it was actually checked. Keep the build-from-scratch decision, but
rest it on **licence and structural fit** — not on process-smuggling. Treat
process-smuggling as a per-candidate hypothesis costing one API call to test.
Same lesson as §4a, in a new location.

### Two borrowable ideas worth acting on

**Total TypeScript ships plural solutions.** Its `src/` holds 18 `*.problem.ts`
files and **29** `*.solution*.ts` files, because several problems carry three
sibling answers (`02-object-param.solution.1/.2/.3.ts`). That encodes "divergent
processes are a feature" (decision 9) **at filesystem level** — far more convincing
than a README paragraph asking students to diverge. Worth imitating directly for
the rescue SDD kit and the backlog.

**Gilded Rose gives the parked domain decision a concrete test.** MIT, 6,089 forks,
maintained 13 years — strong evidence the exercise *shape* survives real rooms. Its
design is: an invariant, at least one deliberate exception to the main rule
(Sulfuras), and a rule amendment held in reserve. See item 4 in §3 for how the
domain candidates score against it.

**Licence split to decide before the first public push:** `serenity-bdd/bdd-trader`
is Apache-2.0 while Serenity Dojo's course *material* is not. App permissive,
teaching material reserved, is the conventional and correct split.

### Highest-value follow-up

`vitalets/playwright-bdd/examples/` contains an **`ai`** directory — the tool
vendor's own worked opinion on agent-authored Gherkin, on a tool already chosen,
bearing directly on pre-course experiment 2, where the earlier research established
that *no* evidence exists. Verified to exist but not read (~15 minutes).

---

### SDD kit: write from scratch (item 2)

No Gherkin-native SDD kit exists, and the absence is triangulated across three
independent surveys of the field rather than being a failed search — the
mainstream is entirely prose-spec-first. SpecKit's release cadence measured at
roughly one release every 2–3 days, vindicating decision 6.

Counter-signal worth keeping in view: OpenSpec, the most sympathetic candidate,
**deliberately invented its own plain-markdown scenario format rather than use
Gherkin.** Not enough to reverse decision 5 — our reason for Gherkin is the
non-technical reader, a constraint OpenSpec does not have — but it is a real
signal, not a null result.

**Reframe Gherkin-native as a mechanism, not tidiness.** The consensus failure of
SDD is spec drift *with no enforcement*. An executable feature file **is** the
enforcement: drift becomes a red test. Corollary — with no CI, the gate catalogue
is load-bearing rather than optional.

**Close the false-confidence flank.** The one consensus failure mode our decisions
do not address, and executability makes it worse: a green suite on the wrong
scenario is very convincing. Cheap fixes — the product person reads the feature
file aloud before implementation, and one prepared feature is seeded with a
deliberately ambiguous rule so a pair ships the wrong thing and finds it in the
retro.

**Worth stealing:** SpecKit's inline `[NEEDS CLARIFICATION: ...]` marker (a
sanctioned way for the agent to say "I don't know" inside the artifact); agent
instructions in HTML comments (invisible on GitHub, readable by the agent);
requirement IDs re-expressed as `@FR-001` Gherkin tags (traceability without a
separate matrix); OpenSpec's delta-spec change proposals, which map onto the
rule-amendment exercise.

### Gate catalogue (item 4)

The two-masters insight is now evidenced rather than asserted:

- **Vitest ships an AI-agent reporter and auto-detects when an agent runs it**,
  switching to minimal output. A first-tier vendor treating agent-consumed output
  as a distinct target from human output.
- **Measured repair rates across seven models** (arXiv:2604.10508): name errors
  ~77%, syntax ~66%, assertion errors — "ran fine, wrong answer" — only **~45%**.
  Typecheck and lint failures are location-and-reason shaped; a BDD "scenario
  failed" is the degenerate assertion error. Two repair rounds capture 76–95% of
  total achievable improvement, so gate output only needs optimising for rounds
  one and two.
- **Static types catch 15% of 400 bugs across 389 repos** (Gao/Bird/Barr, ICSE
  2017, peer-reviewed). Justifies strict typing *and* the three test layers, since
  ~85% of bugs are beyond types' reach.

**May change decision 22:** because `node:sqlite` runs in-process, the traditional
unit-vs-integration cost gap largely collapses — "integration tests are slow" is
an artefact of Postgres and Docker, not a law. If confirmed, integration tests
belong in the *fast* gate. Currently unmeasured; top measurement priority.

**Classroom traps documented:** paying twice for types (type-aware lint took Biome
from ~1s to ~8s on 5k files, vendor's own figure); gating on format (zero defects
caught, self-fixing); trusting `build` as a typecheck (bundlers strip types
without checking them).

**Deliverable is two tables**, and they **invert at the extremes**: E2E is bottom
for agent signal and top for human confidence, and is the only check a product
person can read against their own acceptance criteria. That inversion is the gate
design exercise in one view.

**Honest correction:** there is *no* evidence on TypeScript strictness settings
versus agent-generated code quality. Keep the decision, but rest its justification
on the 45%→77% band-shift argument rather than on nothing.

### Provenance warning

Runtime figures are the weak spot throughout and are tagged measured / estimated /
unmeasured. Six SEO- or AI-generated "2026 benchmark" articles were found,
assessed and **rejected** — logged so nobody re-finds and trusts them. Three
numbers the course most needs are unmeasured: Vitest vs `node:test` startup,
`node:sqlite` suite runtime, and playwright-bdd E2E runtime.

---

## 5. Pre-course work package

Both the SDD-kit and gate-catalogue research independently converged on the same
conclusion: small experiments beat more reading. All four are feasible before the
course.

1. **Correction-round experiment.** Seed one defect; count Claude Code's correction
   rounds under E2E-only vs unit-only vs typecheck-only gates. Converts the
   course's central hypothesis into its own measured evidence — and makes a strong
   live demo.
2. **Declarative vs imperative Gherkin pre-test** (~30 min). No evidence exists on
   whether agents *author* declarative or imperative Gherkin. The answer determines
   what guardrails the `spec` command needs. **Start by reading
   `vitalets/playwright-bdd/examples/ai/`** (§4b) — the tool vendor's own worked
   opinion on exactly this, on a tool already chosen. ~15 minutes, and it may
   shortcut the experiment entirely.
3. **Measure the three unmeasured runtimes** so the classroom gate table contains
   real numbers rather than estimates.
4. ~~Frontend spike~~ — no longer needed; React chosen on asymmetric risk (item 29).

### Still to research

- **SQLite vs server-database semantics** (former brief item 5) — not researched.
  Limited `ALTER TABLE` support in particular will shape how migrations are written
  and taught. Less urgent now that drizzle-kit generates the migrations (item 30),
  but still worth knowing before the rule-amendment feature is authored.
- Better-T-Stack's generated code was never inspected; its SQLite driver may pull
  in `better-sqlite3`.
- Hono's Node-specific ergonomics were not verified hands-on.

---

## 6. Reversed during grilling — do not resurrect without cause

- **SpecKit** → replaced by a hand-rolled, repo-local suite built in class.
- **Robust CI/CD pipeline** → no CI/CD at all; local gates only.
- **Docker** → dropped; SQLite, no containers on the critical path.
- **Building an open-source Jira alternative so PMs avoid git** → rejected as
  infrastructure (huge scope for a cheap problem; the agent can be the git
  interface, and Skald/GitHub Issues already exist). Survives only as a possible
  *domain* for the app itself.
- **nWave as the course subject** → set aside; 151 skills is too much surface and
  it would make the course about nWave.

---

## 7. Environment facts (verified — do not re-ask)

- Repo empty, no commits. Remote `git@github.com:SmidigStorm/kurs-produktutvikling.git`
- `SmidigStorm` is a **personal** GitHub account (not an org); `gh` authenticated.
- Installed: Node 26.5.0, npm 11.17, pnpm 11.20, bun 1.4.0, Python 3.14.6,
  uv 0.11.29, Docker 29.6.2, Docker Compose 5.3.1, gh 2.96.0, git 2.55.0.
- **SpecKit (`specify`) is not installed.**
- **nWave 3.21.0 installed globally** — 151 skills under `~/.claude/skills/nw-*`.
- **Skald MCP** is connected in-session (AI-native PM app with requirements,
  backlog, goals, open questions — reachable by an agent without git).
