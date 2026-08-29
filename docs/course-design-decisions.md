# Kurs produktutvikling — design decisions (working document)

Status: **Plan A built and green; infrastructure live.** Sessions 2026-08-27/28.
Records every decision, what the research found, and the experiments to run before
the course.

**Built so far:** the legevakt queue app runs (`npm run dev`) and all six checks
pass — typecheck, lint, test (30), build, deps:check, and the BDD suite (6
scenarios). Tailwind v4 is wired with no classes yet, awaiting a generated design. Plane is deployed at `plane.smidigakademiet.no` with its MCP at
`plane-mcp.smidigakademiet.no`, verified with per-student tokens. Plans B and C are
written but not executed.

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
| 4 | Domain | **Live queue app for a `legevakt`** (out-of-hours emergency clinic) — patient sees position, triage level and estimated wait. Patient view plus a staff view. Full specification in §3a. |
| 19 | Process model | **Map on a whiteboard, encode as Mermaid, commit it.** Diffs readably between cycles, renders in GitHub, agent can edit it. BPMN concepts without BPMN's file format. |

### Method & tooling

| # | Decision | Choice |
|---|----------|--------|
| 5 | Spec ↔ BDD topology | **Gherkin-native** — feature files *are* the acceptance criteria, not a second document. Avoids the classic BDD failure of two drifting requirement artifacts. |
| 31 | **Learning objective** | **Teach students to think in skills, MCPs and sub-agents** — process decomposed into primitives, not a folder of prompts. Closing module shows **SpecKit, OpenSpec and nWave** so students recognise the same primitives inside industrial frameworks. See §3b. |
| 7 | SDD suite | **Hand-rolled, repo-local, built with the students in class.** A ready-made simple kit ships in the repo (e.g. `course/sdd-kit/`) for anyone stuck — available, not pre-installed. **Amended by 31:** the kit is a composition of primitives, not only markdown prompts. The framework appendix rejected at question 7 is **reinstated** — but now motivated: having built their own process from primitives, students can recognise those primitives inside SpecKit/OpenSpec/nWave. |
| 32 | Backlog tool & MCP | **Plane, self-hosted on Coolify**, with its **official MCP server** (`makeplane/plane-mcp-server`). The genuine reason to reach outside the repo, and the course's worked MCP example. See §3b. |
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
| 30 | ORM & migrations | **Drizzle ORM + drizzle-kit on `better-sqlite3`.** Reverses the research recommendation after its central objection was empirically falsified — see §4a. Chosen on the course's own criterion: a typo'd column becomes a `tsc` error (name-error band, ~77% agent repair rate) instead of a runtime failure (assertion band, ~45–63%). |
| 33 | Styling | **Tailwind v4, no component library**, Preflight included. Chosen because Claude's design tooling emits Tailwind-flavoured markup: a generated design must drop straight in, or it lands on the projector unstyled. v4 needs no config file and no PostCSS — two packages and one line in `vite.config.ts`. See §3d. |
| 34 | Design in the curriculum | **Design is a taught step.** Students learn process improvement, and design is one of the techniques. Consequence: pairs regenerate UI live, under time pressure — which raises the stakes on the accessibility guards in §3d. |
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

## 3. Parked

**Nothing.** The domain was the last open item and is now decided — see §3a.

---

## 3a. The domain (decision 4)

**A live queue app for a `legevakt` (out-of-hours emergency clinic).** Patients see
their position in the queue, their triage level, and an estimated wait.

**Why this one.** Everyone in the room has sat in a legevakt waiting area with no
idea what is happening, so it needs zero explanation. It is a real unsolved product
problem rather than a toy, which engages product people directly — and *engagement*
was what the earlier "make it fun" criterion was really proxying for. It sits
adjacent to a medical-journal company's world without being their product, which
matters: if the domain were their actual system, the room would argue about their
real requirements instead of learning the process.

### The Gilded Rose shape (§4b test)

| Element | In this domain |
|---|---|
| **Invariant** | Patients are seen in triage-level order, then by arrival time within a level |
| **Exception** | Re-triage — a patient whose condition worsens jumps the queue |
| **Withheld amendment** | Queue aging: after 60 minutes waiting, a patient escalates one level. This *amends* the ordering invariant, so existing passing scenarios must change rather than merely be added to |
| **Planted ambiguity** | *"Your position in the queue."* Position among **everyone**, or among **your own triage level**? Both readings are defensible. Under one, a patient sees "number 3" that stays at 3 while their real wait grows because reds keep arriving. Wrong behaviour, **green test suite**, furious patient — the false-confidence trap the SDD research asked for (§4) |

### Scope (decided)

**Patient view plus a staff view.** The patient sees position, triage level and
estimate. The staff screen registers arrivals, re-triages and marks patients done.

**Amended 2026-08-29:** originally "deliberately ugly and thin". That stopped being
defensible once the app is styled at all — a polished patient page beside a raw HTML
table reads as unfinished rather than deliberate, to an audience that notices. The
staff view is now **fully designed**, but its *functional* scope is unchanged: three
actions, no more. Designed does not mean it grows features.

### Three design constraints — non-negotiable, locked at build time

These exist because this domain's natural failure mode is flaky tests, which would
discredit the BDD layer in front of the room.

1. **The wait estimate is a defined function, not a prediction.**
   `estimate = (patients ahead) × (average consultation minutes for their level)`,
   with the averages as constants. "Estimated wait time" is otherwise exactly the
   fuzzy rule that produces fuzzy specs. Bonus teaching moment: the spec must
   *define* the estimate, not gesture at it.
2. **The clock is injectable.** Everything depends on "now", and time-dependent E2E
   tests are the classic flake source. A controllable clock from day one or every
   scenario is a coin flip. Also a good artifact in its own right — "how do you test
   time?" is worth a slide.
3. **"Live" means polling, not websockets.** Keeps the stack at two processes and
   stays inside the failsafe-setup constraint. Websockets would buy nothing visible
   and cost real complexity.
   **Amended 2026-08-29 to 5 seconds** (was 15–30). The original figure was chosen
   as what "reads as live" to a user; in practice the app is *demonstrated live to a
   room*, and 15 seconds reads as nothing happening while an instructor waits at the
   front. The interval is declared once in `frontend/src/config.ts` and shared by
   both views.

### Data model (indicative)

`Patient` (fictional, minimal) → `Visit` (arrival time, triage level, status:
waiting / in-consultation / done) → `TriageEvent` (re-triage history, needed by the
cycle-3 amendment). Triage levels as a constant table with target times. **No
clinical content of any kind** — a visit needs no more than a fictional name and a
level. A room of health-tech people will otherwise spend twenty minutes on data
protection instead of on process.

### Backlog (per decision 20 — cycles 1 and 2 same shape, 3 different)

- **Cycle 1** — an urgent (red) arrival jumps the queue; everyone behind sees their
  position and estimate change. *Shape: a rule plus its visible effect.*
- **Cycle 2** — a patient who leaves without being seen is removed and the queue
  recalculates. *Same shape*, so process improvement is the only variable in the
  retro.
- **Cycle 3 (amendment, for fast pairs and take-home)** — queue aging: after 60
  minutes, escalate one level. Existing scenarios must be revised, not extended.
  Alternative amendment if a second is wanted: change what "position" means, which
  directly detonates the planted ambiguity.

---

## 3b. The primitives lesson (decision 31)

The subject is **primitive selection**: given a step in your process, which
primitive is it — and, most valuably, **when not to reach for one at all**. A course
that teaches the primitives without teaching restraint produces people who build an
MCP for something a bash command already does.

The working decision tree to teach:

| Reach for | When |
|---|---|
| **Just a prompt** | Most process steps. The default. |
| **Skill** | The knowledge is reused across several steps |
| **Sub-agent** | You need context isolation or an independent opinion |
| **Hook** | It must be *enforced*, not requested |
| **MCP** | You genuinely must reach outside the repo |

### Each primitive has an honest home in this course

Nothing below is contrived; each earns its place, which is what makes the
selection lesson credible.

- **Skills** — the legevakt triage rules, the Gherkin house style, the migration
  procedure. Genuinely reused across `spec`, `plan` and `implement`, which is
  exactly the "when is it a skill" criterion.
- **Sub-agents** — a **spec-ambiguity hunter** that reads the feature file and
  hunts for rules with two readings. Aimed squarely at the planted "position in the
  queue" trap (§3a): a pair that runs it catches the trap, a pair that does not
  ships the wrong thing. The sub-agent's value becomes *visible in the retro*
  rather than asserted.
- **MCP** — the backlog lives in **Plane**, outside the repo (decision 32). An
  honest reason to reach out, and it closes the earlier thread about the product
  person working without git: the agent is their interface to the backlog.
- **Hooks** — available as the "make the machine enforce it" step, reached for in a
  retro once a pair notices they keep skipping something.

### Plane MCP — verified facts (2026-08-28)

`makeplane/plane-mcp-server` — Plane's **official** server, last pushed 2026-08-26.
The only first-party MCP among the self-hostable backlog tools surveyed (Vikunja,
Directus, Baserow, Teable, Huly, Kanboard, Taiga, OpenProject and Wekan all have
community-only servers).

- **Self-hosted is explicitly supported** — add `PLANE_BASE_URL`
- **30 tools covering 204 operations**, self-documenting at call time, plus **PQL**,
  a query language with a `get_pql_reference` tool
- Transports: **stdio** (`uvx plane-mcp-server stdio`, needs Python 3.10+),
  **streamable HTTP**, SSE (deprecated)
- Auth: API key (`Workspace Settings → API tokens`) or OAuth
- Workspaces and projects — so **a project per pair** solves the
  twelve-pairs-one-instance problem

**Bonus teaching artifact:** Plane consolidated **177 per-operation tools into 30
action-based tools**, and its README explains why. That is a first-party, citable
lesson that **tool count is a context cost** — worth a segment of its own in a
course about thinking in MCPs.

**Trade-off accepted:** Plane is the heaviest self-host of the candidates (Django,
Postgres, Redis, MinIO, workers). That weight lands on the instructor's server
before class, with time to fix it; MCP quality would land on the students, live, in
the room. Not symmetric — both point to Plane.

**Unverified, test on deployment:** whether a *self-hosted* Plane MCP in HTTP mode
accepts per-student personal access tokens via headers the way the hosted service
does. If yes, students add a URL and a token — zero local install. If no, each
student runs stdio via `uvx`, which drags a Python/uv dependency into an otherwise
pure-Node setup.

---

## 3c. "Agents write bad code" — the instructor's fear, and the evidence (2026-08-28)

`docs/research/methodology/agent-code-quality-evidence-research.md`
`docs/research/methodology/repo-affordances-for-agent-quality-research.md`

**The risk.** A room of sceptical senior developers watches an agent produce
something mediocre and leaves validated in a belief they arrived with. That is a
worse outcome than a boring course.

**The reframe.** The course already contains the antidote; it was simply not stated
as the thesis. The gate catalogue, the spec-first flow, the reviewer sub-agent and
the baseline's quality are all mechanisms for making agents write *good* code.
Say so at the start of the day: **cycle 1 will produce mediocre code because the
process is thin, and cycle 2 will produce good code because you fixed the process.**
A room told to expect bad output in cycle 1 cannot use it as evidence against you.

**Open with the disconfirming evidence, not the sales pitch.** Make the sceptic's
argument first, with citations:

- Largest real-world repository measurement: AI-vs-human code differences are
  "rather small" (arXiv:2603.27130). Controlled lab comparison: **63.34% more code
  smells** than professional reference solutions (arXiv:2510.03029). *The delta
  between lab and production is roughly what a review process removes.*
- METR: developers were **19% slower** with AI while believing they were 20% faster
  (n=16 — say the n out loud).
- DORA 2025: "AI doesn't fix a team; it amplifies what's already there" — throughput
  up, stability down, moderated by testing and fast feedback. Disclose that it is
  Google Cloud's programme.
- Repository *overviews* in `CLAUDE.md`/`AGENTS.md` are measured **unhelpful** and
  cost >20% more inference (ETH Zürich; arXiv:2602.11988 found context files reduce
  success by 0.5–2% for LLM-written ones, +4% for human-written, at +20–23% cost and
  2.45–3.92 extra steps) — yet **68.1% of 2,303 real context files** contain exactly
  that. Synthesis both studies support: **instructions pay, descriptions don't.**
  A "delete half your CLAUDE.md" exercise is grounded in measurement.

### Four interventions large enough to be visible in one day

| Intervention | Evidence |
|---|---|
| **Tests as executable clarification of intent, agreed before implementation** | **+45.97 pp absolute pass@1 within 5 interactions** — IEEE TSE 2024, peer-reviewed, 4 LLMs, 2 datasets, plus a user study finding people significantly better at *judging* AI code than writing the spec in prose. Strongest evidence in the set, and it is precisely the Gherkin-native bet plus the planted ambiguity. |
| **Don't let the agent see or edit the tests it must pass** | GPT-5 exploits impossible tests **76%** of the time; hiding test files drops cheating to near zero; environmental hardening cut hacking 5.7 pp (87.7% relative) with no loss of task success. Three independent benchmarks agree. **The most demo-able moment available.** |
| **Error class governs repairability** | name ~77%, syntax ~66%, assertion **~45% (HumanEval) / ~63% (MBPP)**. |
| **Generate less per step** | ρ = **0.94** between generated LOC and architectural smells (ρ = 0.72 for file count). Strongest measured relationship found — but a correlation; no controlled decomposition experiment exists. |

### The negative list — where the value is for this audience

- **Self-review degrades accuracy**: GPT-4 95.5% → 91.5% without external feedback
  (ICLR 2024, DeepMind). *"Please review your work"* is measured worthless-to-harmful;
  *"here is the failing output"* works. This is the primitive-selection lesson with
  evidence attached — and it answers the reviewer-sub-agent question: give it
  **external signal**, not introspection.
- **Detailed prompting does not improve structure**: requirement specificity
  **p > 0.8 on every smell category**; few-shot structured prompting made Long Method
  *worse*. **Course-design consequence: cycle 2 must not be "a better prompt."**
  If the students' improvement is prompt wording, the day fails on the evidence.
- Better models produce *more* bloated code. Reasoning mode *lowered* first-pass
  accuracy. In-context examples degrade beyond two. Beyond ~3 repair rounds is
  theatre (2 rounds = 76–95% of the achievable gain). Multi-agent setups shift bloat
  into God Classes rather than removing it.

### A hook's value is its stderr, not its block

Anthropic states three separate times that **exit-2 stderr is fed back to the
model**. A hook author is therefore *hand-writing the agent's repair prompt*, which
puts the repair-band finding directly under their control: `Blocked: not allowed`
and a three-line message naming file, reason and repair are the same enforcement in
two different bands. Directly demonstrable, and it is the course's own thesis
applied to the course's own tooling.

**One economy explains most of it:** advisory artefacts cost context every session
forever; mechanical ones cost nothing until they fire. Skill *descriptions* compete
for ~1% of the context window and are **silently truncated** on overflow —
independently confirming the tool-count-is-a-context-cost lesson already banked from
Plane's 177→30 consolidation. Two vendors, two primitives, identical economics.

### Honest gaps — no evidence at all

- **TypeScript strictness vs agent code quality** (confirms the correction already
  recorded in §4).
- **Gherkin specifically.** All test-first evidence uses *unit tests* and pass@1.
  The course's central bet is supported by analogy, not by direct measurement.
- Diff-size caps as a gate; hooks versus simply asking.
- **The imitation effect is the weakest link and is load-bearing** for the pre-built
  baseline. Evidence supports "agents copy visible conventions"; it only weakly
  supports "a good codebase makes agents write good code."
- **Rejected and logged:** the widely-cited code-duplication claim rests on GitClear,
  a vendor selling code analysis, and is contradicted by the academic measurement.

### Verdict on the two-cycle arc

**Supported — but assembled from studies that each measured one leg. No study
measured the whole arc.** That is worth saying to this audience rather than hiding.

---

## 3d. Styling, and the accessibility guard (decisions 33–34)

**Tailwind v4, no component library, Preflight included.** The deciding constraint
was not taste: Claude's design tooling emits Tailwind-flavoured markup, so anything
else means a generated design renders as unstyled soup in front of the room.
shadcn/ui was rejected because wrapping semantic elements in components is exactly
where the accessibility contract dies.

### What the accessibility contract is, and why it is load-bearing

Three elements in the patient view carry `role="status"` and an `aria-label`, and
the staff table's per-row controls carry unique `aria-label`s. Three things depend
on them:

1. **The BDD suite** finds elements by role and accessible name, not by CSS or test id.
2. **The agent.** `aiFix` attaches an ARIA snapshot to every failure and its prompt
   says *"strictly rely on the ARIA snapshot"* — elements without a role or name
   barely appear in it.
3. **Actual accessibility.** `role="status"` genuinely means "this value updates on
   its own, announce it".

A generated redesign that wraps values in styled divs breaks all three at once. Since
design is now a taught step (decision 34), that will happen live, repeatedly.

### The guards, and an honest negative result

**`eslint-plugin-jsx-a11y` was adopted for this and does not do it.** Tested
directly: removing a per-row `aria-label` produced **no lint error**.
`control-has-associated-label` asks whether a control has *any* accessible name — a
`<button>Done</button>` has one — not whether it is *distinguishing*. It also
false-positives on correctly labelled inputs, including the nested-label form. That
rule is **deliberately not enabled**, with the reason written in the config.

What is kept from jsx-a11y is precise and verified to fire: `aria-props`,
`aria-role`, `role-supports-aria-props`, `label-has-associated-control`,
`anchor-has-content`. These catch the silent-typo class — `aria-lable`, an invalid
role — in about a second, with file, line and a "did you mean".

**The guard that actually works is `features/staff-queue.feature`**, whose steps
drive the table through its per-row accessible names. Verified: dropping either
per-row label turns exactly one scenario red. It costs **~30 seconds** to fail (a
locator timeout) where lint would cost one — a clean, real illustration of the
gate-catalogue trade-off, using this repo's own code.

### Two incidental findings worth keeping

- **Do not nest a `<select>` inside its `<label>`.** The option text folds into the
  label's text content, so the accessible name becomes
  `"Triage level RED ORANGE YELLOW ..."` and `getByLabel('Triage level')` stops
  matching. `htmlFor`/`id` is correct for selects.
- **The E2E suite must run with `workers: 1`.** Every scenario shares one backend
  and one SQLite file, and each Background resets the queue, so parallel workers
  delete each other's data mid-test. This only surfaced when a second feature file
  gave Playwright enough tests to parallelise.

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
name-error repair band and the ~45–63% assertion band** — the ORM converts a
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

~~`vitalets/playwright-bdd/examples/ai`~~ — **done, see §4c.** It turned out to be
about fixing failing tests rather than authoring Gherkin, so experiment 2 stands;
but it produced a correction to the gate catalogue and a free teaching artifact.

---

## 4c. playwright-bdd `examples/ai/` — read 2026-08-27

Read directly from `vitalets/playwright-bdd` (`examples/ai/`,
`src/ai/promptBuilder.ts`, `src/ai/promptTemplate.ts`,
`docs/guides/fix-with-ai.md`).

**It is not about agent-authored Gherkin.** It demonstrates **"Fix with AI"**
(playwright-bdd ≥8.1.0, Playwright ≥1.49): when a scenario fails, playwright-bdd
pre-builds a structured prompt and attaches it to the Cucumber HTML report.
Pre-course experiment 2 is therefore **not** answered by it — that gap stands.

### But it corrects the gate catalogue's weakest row

The gate research rated E2E the worst agent feedback: "the scenario failed" is a
degenerate assertion error, the ~45–63% repair band. **`aiFix` is the vendor's own fix
for exactly that**, and it materially changes the rating. Enabled with:

```ts
defineBddConfig({ featuresRoot: './features', aiFix: { promptAttachment: true } })
```

The generated prompt carries the context an E2E failure normally lacks:

- the error message (ANSI stripped)
- the scenario steps **up to and including the failing one**
- the failing code snippet
- an **ARIA snapshot of the page** — the accessibility tree, i.e. what was actually
  on screen at failure

That last one is the missing "why". **Action: enable `aiFix` and re-rate the E2E row
in the classroom gate table**; the current rating was derived without it.

### The default prompt template is itself teaching material

Verbatim from `src/ai/promptTemplate.ts`:

```
You are an expert in Playwright BDD testing.
Fix the error in the BDD scenario.

- Provide response as a diff highlighted code snippet.
- First try to fix test by adjusting Gherkin steps parameters.
- If test is not fixable by Gherkin, try to modify the code snippet.
- Strictly rely on the ARIA snapshot of the page.
- Avoid adding any new code.
- Avoid adding comments to the code.
- Avoid changing the test logic.
- Use only role-based locators: getByRole, getByLabel, etc.
- Add a concise note about applied changes.
- If the test may be correct and there is a bug in the page, note it.
```

Worth reading with students line by line. It contains an **escalation ladder**
(try Gherkin parameters first, only then the code), **anti-overreach constraints**
(no new code, no comments, don't change the test logic), **grounding** (rely
strictly on the ARIA snapshot), and **house style** (role-based locators only).

The last line is the important one: *"If the test may be correct and there is a bug
in the page, note it."* That is an explicit escape hatch telling the agent the test
might be right and the application wrong — **the false-confidence guard the SDD
research said we needed**, shipped by default by a tool vendor. Independent support
for that design principle.

**And it is user-overridable** via `aiFix.promptTemplate`. So the course gets a
real, running, vendor-authored prompt that students can critique and *modify as a
process-improvement exercise* — a piece of process encoded as a tool, improvable in
a retro. Exactly on theme, and free.

### Small negative signal for experiment 2

The example's own Gherkin is imperative rather than declarative — `I click link
"Get started"`, `I see header "About"` are UI mechanics, not domain language. The
vendor's example is not a model of declarative Gherkin. Weak evidence, not an
answer, but it points the same way as the anti-pattern warning: expect to need
guardrails in the `spec` command.

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
  ~77%, syntax ~66%, assertion errors — "ran fine, wrong answer" — only **~45% on HumanEval, ~63% on MBPP**.
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
on the 45–63%→77% band-shift argument rather than on nothing.

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
   what guardrails the `spec` command needs. **Still open** — `examples/ai/` was
   read (§4c) and turned out to be about fixing failing tests, not authoring
   scenarios. Its own Gherkin is imperative, which is a weak signal that guardrails
   will be needed.
3. **Measure the three unmeasured runtimes** so the classroom gate table contains
   real numbers rather than estimates. **Re-rate the E2E row with `aiFix` enabled**
   (§4c) — the current rating was derived without it.
4. ~~Frontend spike~~ — no longer needed; React chosen on asymmetric risk (item 29).
5. **Imitation A/B (~30 min, §3c's weakest link).** Build the same small feature
   twice — once in the clean baseline, once in a deliberately degraded copy — and
   compare what the agent produces. Would generate *original* evidence for the claim
   the pre-built baseline rests on, and makes a superb live demo.
6. **Note on experiment 1:** it is precisely the thin-vs-thick process study the
   literature does not contain. The evidence predicts it will work, so the risk is
   low and the payoff with a sceptical audience is higher than any citation.

5. **Deploy Plane on Coolify** and seed a project per pair, then **test whether the
   self-hosted MCP in HTTP mode accepts per-student PATs via headers** (§3b). This
   determines whether students need `uv`/Python locally or just a URL and a token —
   a direct hit on the failsafe-setup constraint, so settle it early.

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
- **Directus as the backlog/requirements server** (explored 2026-08-28, rejected).
  Findings worth keeping: its MCP is **in core**, not the stale standalone
  `directus/mcp` repo — `api/src/ai/mcp/*`, an OAuth guard, migrations through
  2026-05 and a Settings → AI → MCP admin UI. Licence is Monospace Sustainable
  Core 1.0; the operative test is *Competing Use*, which a course backlog is not,
  though the enumerated list says "non-commercial education" and a licence-key
  clause implies paid tiers (never verified whether MCP sits behind one).
  **Rejected for two reasons.** First, its real advantage is modelling
  `Requirement`/`Rule`/`Example`/`OpenQuestion` as collections — but decision 5
  puts requirements in git as feature files, so a requirements *server* would
  recreate the two-drifting-artifacts failure that decision exists to prevent.
  Second, Plane's MCP is a worked example of good MCP design (177 tools → 30);
  Directus's is generic CRUD over collections, which would teach that an MCP is a
  database wrapper. Also noted at the time: modelling the requirement artifacts
  properly amounts to rebuilding Skald.

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
