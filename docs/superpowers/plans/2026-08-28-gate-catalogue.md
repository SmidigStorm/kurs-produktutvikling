# Gate Catalogue and Measurement — Implementation Plan (Plan B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the individually runnable checks Plan A created into a documented
catalogue with **measured** numbers, so students can compose a gate policy under a
real time budget instead of guessing.

**Architecture:** No application code changes. This plan measures what exists, adds
the two checks Plan A deliberately deferred (lint and format, whose tool choice
needed evidence), and produces one classroom-facing document plus one experiment
that turns the course's central hypothesis into its own measured evidence.

**Depends on:** Plan A, complete and green.

## Global Constraints

- **Gates stay unwired.** This plan documents and measures. It must not add a combined `verify` script, a git hook, or CI. Composing the policy is the students' exercise.
- **Every number in the classroom table is measured on the actual repo,** on a stated machine, with the command shown. No vendor claims, no estimates presented as measurements. Where a figure cannot be measured, mark it `[unmeasured]` and say why.
- **Rate every check on agent-feedback quality, not only speed.** The distinguishing axis is whether a failure names a file, a line and a reason.
- **Do not configure Vitest `reporters`.** Vitest switches to an agent-optimised reporter automatically, but only when none are configured.
- **Timings are indicative, not benchmarks.** Say so in the document. A skilled audience will discount an over-precise number faster than an honest range.

---

### Task 1: Choose the lint tool on evidence

**Files:**
- Create: `docs/gate-catalogue.md` (skeleton)
- Modify: root `package.json`, `frontend/eslint.config.js` or a new Biome config

Plan A shipped only the `react-hooks` rules, deliberately, because the broader lint
choice needed measurement rather than taste.

- [ ] **Step 1: Measure ESLint on this repo**

Install a minimal typescript-eslint setup, then:

```bash
time npm run lint
```

Record: cold runtime, warm runtime, and **paste an actual failure message** — that
message is the deliverable, not the timing.

- [ ] **Step 2: Measure Biome on the same repo**

```bash
npx @biomejs/biome check . ; time npx @biomejs/biome check .
```

Record the same three things.

- [ ] **Step 3: Measure the type-aware cost**

Enable typescript-eslint's type-checked rules and time it again. The published
vendor figure is ~1s → ~8s on 5k files; find out what it is here.

**This is the decision point.** Type-aware lint duplicates work `tsc` already does,
and the course already runs `tsc`. If the type-aware rules cost several seconds to
catch what the typechecker catches anyway, that is a *finding to teach*, not a
config to adopt.

- [ ] **Step 4: Decide and record**

Pick one tool. Write the reason in `docs/gate-catalogue.md`, including the numbers
that decided it. Wire nothing.

- [ ] **Step 5: Commit**

```bash
git add package.json docs/gate-catalogue.md
git commit -m "Choose lint tool on measured runtime and output quality"
```

---

### Task 2: Measure every check

**Files:**
- Modify: `docs/gate-catalogue.md`

- [ ] **Step 1: Record the machine**

Put this at the top of the measurements section — numbers without a machine are
decoration:

```bash
node -v && npm -v && uname -srm && nproc
```

- [ ] **Step 2: Time each check, cold and warm, three runs each**

```bash
for check in typecheck lint test build deps:check; do
  echo "== $check =="
  for i in 1 2 3; do /usr/bin/time -f '%e s' npm run "$check" >/dev/null; done
done
```

Then the slow one separately:

```bash
for i in 1 2 3; do /usr/bin/time -f '%e s' npm run test:e2e >/dev/null; done
```

Record the **median**, and note cold-versus-warm where the difference is material.
These are the three figures the earlier research could not supply: Vitest startup,
the `node:sqlite` integration suite, and playwright-bdd end-to-end.

- [ ] **Step 3: Test the collapsed unit/integration gap**

Earlier research predicted that because SQLite runs in-process, the usual
unit-versus-integration cost gap largely disappears — meaning integration tests may
belong in the *fast* gate, which would be a genuinely non-obvious result.

```bash
npx vitest run backend/src/domain --reporter=basic
npx vitest run backend/src/api backend/src/db --reporter=basic
```

Compare. If the integration suite is within a small multiple of the pure-domain
suite, say so plainly in the catalogue — it changes how a student should compose
their gate.

- [ ] **Step 4: Commit**

```bash
git add docs/gate-catalogue.md
git commit -m "Measure runtime of every check on this repo"
```

---

### Task 3: Rate output quality as agent feedback

**Files:**
- Modify: `docs/gate-catalogue.md`

The distinguishing axis. A check that fails with file, line and reason sits in the
~77% repair band; one that says "something failed" sits in the ~45–63% band.

- [ ] **Step 1: Break something deliberately, once per check**

For each check, introduce the smallest defect it should catch, run it, and **paste
the verbatim output** into the catalogue:

| Check | Defect to introduce |
|---|---|
| `typecheck` | Reference a column that does not exist on `visits` |
| `lint` | Remove a dependency from a `useEffect` array |
| `test` | Change `AVERAGE_CONSULTATION_MINUTES.GREEN` from 15 to 16 |
| `test:e2e` | Change the patient view's position wording |
| `build` | Import a module that does not exist |
| `deps:check` | Temporarily add `node-gyp` to the lockfile text |

Revert each defect before introducing the next.

- [ ] **Step 2: Rate each on three questions**

- Does it name a **file**?
- Does it name a **line**?
- Does it state a **reason** precise enough to act on without investigating?

Three yeses is the top band. Record the rating beside the pasted output, so a reader
can check your judgement rather than trust it.

- [ ] **Step 3: Re-rate E2E with `aiFix` enabled**

Run the broken E2E scenario and open the Cucumber report. Extract the attached
prompt and paste it into the catalogue.

The earlier rating of E2E as worst-in-class agent feedback was made **without**
`aiFix`. The attached prompt carries the error, the steps up to the failure, the
code snippet and an ARIA snapshot of the page. **Re-rate honestly** — this may move
E2E up a band, and if it does, that is a finding worth teaching.

- [ ] **Step 4: Commit**

```bash
git add docs/gate-catalogue.md
git commit -m "Rate every check on agent-feedback quality with verbatim output"
```

---

### Task 4: The correction-rounds experiment

**Files:**
- Create: `docs/experiments/correction-rounds.md`

This is pre-course experiment 1, and it is the study the literature does not
contain. It converts the course's central hypothesis into the instructor's own
measured evidence — worth more to a sceptical room than any citation.

- [ ] **Step 1: Choose one defect and write it down first**

Pick a defect the domain layer would catch, the E2E layer would catch, and the
typechecker would not — for example, `estimatedWaitMinutes` summing the *waiting*
patient's own level instead of each patient ahead's.

Write the defect and the exact prompt you will give the agent **before** running
anything. Deciding afterwards is how experiments become anecdotes.

- [ ] **Step 2: Run three arms, fresh context each**

For each arm: introduce the defect, start a fresh agent session, give it the same
prompt, and let it work until the check passes or it gives up.

| Arm | The agent may run |
|---|---|
| A | `npm run test:e2e` only |
| B | `npm test` only |
| C | `npm run typecheck` only |

Record for each: **rounds to green**, whether it reached green at all, and what it
tried first.

- [ ] **Step 3: Repeat each arm three times**

One run per arm is an anecdote. Three is still small — say so — but it shows whether
the difference is larger than the noise.

- [ ] **Step 4: Write it up honestly**

Include the prompt, the defect, every run's outcome, and the arms that behaved
unexpectedly. If the result contradicts the expected ordering, **report that** — the
literature predicts the ordering but nobody has measured this exact case, and an
honest null result is still original evidence.

- [ ] **Step 5: Commit**

```bash
git add docs/experiments/correction-rounds.md
git commit -m "Run the correction-rounds experiment across three gate arms"
```

---

### Task 5: The classroom table

**Files:**
- Modify: `docs/gate-catalogue.md`

The artifact students actually use during the gate-design exercise.

- [ ] **Step 1: Build the main table**

One row per check: **command, median runtime, what it catches, what it does NOT
catch, agent-feedback rating, human-confidence rating.**

The "what it does not catch" column is the one that makes the exercise real — a
student who cannot say what a check misses cannot reason about a gate.

- [ ] **Step 2: Build the second table, ranked by feedback quality per second**

The two tables should **invert at the extremes**: E2E bottom for agent signal and top
for human confidence, and the only check a product person can read against their own
acceptance criteria. Confirm the inversion actually holds in your measurements — if
it does not, say so and explain why.

That inversion is the gate-design exercise in a single view.

- [ ] **Step 3: Write the exercise brief**

A short section stating the constraint students work under:

> You have a 90-second budget. Which checks buy the most safety, and which does your
> agent actually need to fix its own mistakes? They are not the same question.

- [ ] **Step 4: Document the traps**

Three, each with the evidence:

- **Paying twice for types** — type-aware lint versus `tsc` (Task 1's numbers)
- **Gating on format** — catches zero defects and self-fixes
- **Trusting `build` as a typecheck** — bundlers strip types without checking them

- [ ] **Step 5: Commit**

```bash
git add docs/gate-catalogue.md
git commit -m "Publish the classroom gate table with measured figures"
```

---

## Self-Review

**Spec coverage against `docs/course-design-decisions.md`:**

| Requirement | Task |
|---|---|
| Gate catalogue documented on three axes (12/13) | 2, 3, 5 |
| Nothing wired (12/13) | enforced throughout; no combined script |
| Re-rate E2E with `aiFix` (§4c, §5 item 3) | 3 step 3 |
| Measure the three unmeasured runtimes (§5 item 3) | 2 |
| Correction-rounds experiment (§5 item 1) | 4 |
| Integration-in-the-fast-gate hypothesis (§4) | 2 step 3 |
| Lint tool chosen on evidence (Plan A Task 13) | 1 |

**Not in this plan:** the declarative-vs-imperative Gherkin experiment and the
imitation A/B (both belong with Plan C, since they shape the SDD kit and the
baseline argument respectively).

**Honest limitation to state in the document itself:** every timing is one machine,
one repo, three runs. That is enough to rank checks and to support a 90-second
budgeting exercise. It is not a benchmark, and presenting it as one would invite
exactly the scrutiny it cannot survive.
