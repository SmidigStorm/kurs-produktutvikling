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
| 4 | **Domain** | User has an existing course-registration app and wants "something more fun". Must be: instantly understandable, *deterministic* underneath the fun, and rich enough for several feature-shaped holes including one rule-amendment. Candidates floated: office game ladder (players/matches/rankings; feature = seasons + inactivity decay), pub quiz (feature = joker double-points + tie-break by speed), lunch roulette (feature = no repeat pairings within 3 rounds + odd numbers). An open-source backlog/Jira-alternative was floated as a possible domain — only viable as *the app itself*, never as infrastructure. |
| 29 | **Frontend framework** | The weakest call in the research. Svelte's readability advantage rests only on medium-trust commercial blogs, and there is an unsourced counter-argument that Claude Code is more reliable in React than in Svelte 5 runes — which matters disproportionately here, because agent unreliability injects noise directly into the variable the course teaches. Settle with a spike, not more reading. |

---

## 4. Research outcomes (2026-08-27)

Three research documents, all in `docs/research/`:

- `tooling/typescript-stack-and-baseline-apps-comprehensive-research.md`
- `methodology/gherkin-native-sdd-kits-comprehensive-research.md`
- `tooling/gate-catalogue-comprehensive-research.md`

### Recommended stack (item 1)

Hono + Zod + `@hono/node-server` (backend), Vite + a frontend framework still to be
chosen (item 29), `node:sqlite` with a repo-local raw-SQL migration runner,
Vitest, playwright-bdd. The three backend packages have **zero runtime
dependencies** — verified from npm registry manifests.

**Skip ORMs entirely.** Every mainstream ORM reintroduces `better-sqlite3` and
therefore native compilation, violating the failsafe-setup constraint:
`drizzle-kit` refuses to connect to SQLite without it, Prisma's only local-SQLite
adapter is built on it, and Kysely's bundled dialect targets it. Drizzle's
`node:sqlite` support is on the `@rc` line, not stable. A ~60-line `db.exec()`
migration runner wins on all three criteria — zero fragility, error output we
control, and readable SQL for the product person — and it is a better gate
catalogue exhibit than an opaque CLI. Add a gate that greps the lockfile for
`better-sqlite3`/`node-gyp` and fails.

**playwright-bdd is not a risk.** MIT, actively maintained, tracks Playwright
within weeks of each minor. Pin exactly; residual risk is browser downloads.

**Correction to a widely-repeated falsehood:** `node:test` does have watch mode
(since v19.2.0) and stable snapshots (since v23.4.0). Vitest still wins, but only
on assertion-diff quality — `node:test` is a credible near-zero-dependency
fallback.

### Baseline app: build from scratch (item 3)

No candidate survives, for a structural reason: every maintained starter is
optimised for production-readiness (auth, CI, deploy, observability) — exactly
what this course deleted. The decisive argument is pedagogical: production
starters are dense with embedded process opinions (commit hooks, conventional
commits, CI workflows), so **a third-party starter is an unexamined process
smuggled into a course about examining your process.**

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
   what guardrails the `spec` command needs.
3. **Measure the three unmeasured runtimes** so the classroom gate table contains
   real numbers rather than estimates.
4. **Frontend spike** (item 29) — build the same small component in both candidates
   with Claude Code and compare agent reliability and readability.

### Still to research

- **SQLite vs server-database semantics** (former brief item 5) — not researched.
  Limited `ALTER TABLE` support in particular will shape how migrations are written
  and taught, so it feeds back into the migration-runner recommendation.
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
