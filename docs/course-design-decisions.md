# Kurs produktutvikling — design decisions (working document)

Status: **grilling complete, awaiting research.** Session date 2026-08-27.
Records what is decided, what is deliberately parked, and what research must
answer before we build.

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
| 28 | **TypeScript tooling** | Topology is decided (separate backend + frontend); the remaining choices are researchable facts: backend framework, frontend approach, ORM/migration tool against `node:sqlite`, and unit test runner. Judge on: fewest ways setup can fail, quality of error output *as agent feedback*, and how readable the resulting code is to a non-developer. |
| 4 | **Domain** | User has an existing course-registration app and wants "something more fun". Must be: instantly understandable, *deterministic* underneath the fun, and rich enough for several feature-shaped holes including one rule-amendment. Candidates floated: office game ladder (players/matches/rankings; feature = seasons + inactivity decay), pub quiz (feature = joker double-points + tie-break by speed), lunch roulette (feature = no repeat pairings within 3 rounds + odd numbers). An open-source backlog/Jira-alternative was floated as a possible domain — only viable as *the app itself*, never as infrastructure. |
| 8 | **Baseline app origin** | Survey (a) maintained starter templates, (b) existing small OSS apps, (c) agent-built-on-a-starter. Brownfield is pedagogically stronger regardless of effort saved — students go back to brownfield codebases. Counter-risk: students imitate the baseline's structure, naming and test style, so its bones must be deliberately exemplary. |

---

## 4. Research brief (`/nw-research`)

Ordered by dependency:

1. **TypeScript tooling.** Resolve *first* — it constrains the baseline app
   candidates. Backend framework, frontend approach, migration tooling against
   `node:sqlite`, and unit test runner, for a separate-backend-and-frontend
   layout. Verify `playwright-bdd`'s current state and its integration with the
   chosen Playwright version.
2. **Gherkin-native SDD kits.** Does a BDD/Gherkin-flavoured spec-driven prompt kit
   already exist to adapt rather than invent? (SpecKit template presets, community
   kits, agent-command collections.)
3. **Baseline app candidates.** Maintained starter templates and small OSS apps in
   the shortlisted stack, judged on quality of bones, licence, bitrot, and whether
   the domain is swappable or fun enough as-is.
4. **Gate catalogue evidence.** For each candidate check: typical runtime, class of
   defect caught, and quality of its output *as agent feedback*.
5. **SQLite specifics.** Migration tooling, separate-test-file ergonomics, and
   whether anything about SQLite semantics would mislead students versus a server
   database. (PGlite noted as a real-Postgres-without-Docker alternative if
   SQLite's divergence turns out to matter.)

---

## 5. Reversed during grilling — do not resurrect without cause

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

## 6. Environment facts (verified — do not re-ask)

- Repo empty, no commits. Remote `git@github.com:SmidigStorm/kurs-produktutvikling.git`
- `SmidigStorm` is a **personal** GitHub account (not an org); `gh` authenticated.
- Installed: Node 26.5.0, npm 11.17, pnpm 11.20, bun 1.4.0, Python 3.14.6,
  uv 0.11.29, Docker 29.6.2, Docker Compose 5.3.1, gh 2.96.0, git 2.55.0.
- **SpecKit (`specify`) is not installed.**
- **nWave 3.21.0 installed globally** — 151 skills under `~/.claude/skills/nw-*`.
- **Skald MCP** is connected in-session (AI-native PM app with requirements,
  backlog, goals, open questions — reachable by an agent without git).
