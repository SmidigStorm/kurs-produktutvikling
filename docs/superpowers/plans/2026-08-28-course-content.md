# Course Content — Implementation Plan (Plan C)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Everything the course needs that is not the app and not the infrastructure:
the feature backlog with its planted ambiguity, the rescue SDD kit built from
primitives, the minimal `CLAUDE.md`, the two remaining experiments, and the lesson
plan — including where the line falls between what ships and what students build.

**Architecture:** Nothing in `.claude/` is pre-installed, so the build-it-in-class
exercise is real. The repo instead carries `course/` — a rescue kit students may
import when stuck, and *paired* primitive examples designed to be compared rather
than copied.

**Depends on:** Plan A (the app the features are written against) and Plan D (the
Plane projects the backlog items live in).

## Global Constraints

- **Nothing lands in `.claude/`.** Not a command, not a skill, not a hook, not a settings file. The moment the repo ships a working `.claude/`, the day's central exercise is over. Everything lives in `course/` and is copied by hand.
- **Requirements live in git, not in Plane.** Plane holds *backlog items* — what to build next. The acceptance criteria are the feature files. Never write acceptance criteria into a Plane description; that recreates the drift the Gherkin-native decision exists to prevent.
- **The planted ambiguity must be genuinely ambiguous.** Both readings must be defensible to a skilled reader. If a careful reader can tell which is intended, it is not a trap, it is a badly written spec — and this audience will say so.
- **Cycle 2's improvement must be structural, not verbal.** Measured evidence: prompt specificity has no effect on code structure (p > 0.8 across every smell category), and few-shot prompting made some smells worse. If a pair's "improvement" is better prompt wording, the retro must push them toward a gate, a hook, a test-first step, or smaller increments.
- **Everything in English.**

---

### Task 1: The minimal CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

**Repo facts only.** Measured evidence: repository *overviews* in agent context files
are unhelpful and cost >20% more inference, while *instructions* are followed well —
68.1% of 2,303 real context files are mostly the unhelpful kind. So: no file-tree
diagram, no architecture essay, no restatement of anything an agent can read from
the code.

And a second reason specific to this course: **how to work is the students'
exercise.** A `CLAUDE.md` that encodes a process steals it.

- [ ] **Step 1: Write it**

`CLAUDE.md` — aim for roughly 30 lines, and cut anything derivable:

```markdown
# Legevakt queue

A teaching baseline. Patients waiting at a legevakt see their queue position,
triage level and estimated wait; staff register arrivals and re-triage.

## Rules that are not derivable from the code

- The domain vocabulary is declared **once**, in `contract/src/index.ts`. A triage
  level or visit status flows from there to the Drizzle column, the request
  validators and the UI. Never re-declare one.
- Production code must not call `new Date()` or `Date.now()` outside
  `backend/src/clock.ts`. Everything takes a `Clock`.
- The wait estimate is a **definition, not a prediction**: the sum of average
  consultation minutes of every patient ahead, using each of their own levels.
  If a change makes it non-deterministic, the change is wrong.
- `features/` and `specs/` belong to the product person and contain no code.
  Step definitions are TypeScript and live in `e2e/steps/`.
- Transaction callbacks must be synchronous. better-sqlite3 rejects async ones.
- All data is fictional. Never add clinical content — no symptoms, diagnoses or
  notes.

## Commands

Every check runs alone; nothing is wired together. `npm run dev`, `npm run reset`,
`npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`.
```

- [ ] **Step 2: Check it against the evidence**

Read it back and delete every line that an agent could derive by reading the repo.
If a line survives only because it feels reassuring, cut it.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "Add minimal CLAUDE.md: non-derivable rules only"
```

---

### Task 2: Backlog feature 1 and the planted ambiguity

**Files:**
- Create: `docs/backlog/feature-1-urgent-arrival.md`
- Create: `docs/backlog/INSTRUCTOR-NOTES.md`

Cycle 1's feature. Per the cycle structure, features 1 and 2 are **the same shape**
so process improvement is the only variable in the retro.

- [ ] **Step 1: Write the backlog item**

`docs/backlog/feature-1-urgent-arrival.md` — the text that goes into Plane. A
*request*, not a specification. Deriving the acceptance criteria is the students'
job.

```markdown
# An urgent arrival should not wait behind less urgent patients

When someone arrives who is triaged RED, they need to be seen before everyone
already waiting. Patients further back should see their own position and estimated
wait update to reflect that.

Today a RED arrival is ordered correctly by the queue, but nobody has checked what
the waiting patients actually see when it happens.

**Where the ambiguity is planted:** the phrase "their own position". Do not resolve
it here.
```

- [ ] **Step 2: Design the ambiguity so both readings are defensible**

The trap is *"you are number N in the queue."* Two readings:

- **N among everyone waiting** — Kari is 4th overall
- **N among patients at her own triage level** — Kari is 2nd of the GREENs

Both are defensible. Under the second, a patient's number can stay at 3 for an hour
while reds keep arriving ahead of them — wrong behaviour, furious patient, and
**a green test suite**, because the scenarios were written from the same reading as
the implementation.

Plan A implements the **first** reading. A pair that adopts the second will write
scenarios that pass against code that is wrong.

- [ ] **Step 3: Write the instructor notes**

`docs/backlog/INSTRUCTOR-NOTES.md` — **not** given to students:

- which reading the baseline implements, and where (`positionOf` in `backend/src/domain/queue.ts`)
- the exact question that surfaces the ambiguity: *"a RED arrives — does Kari's number change?"*
- what to do if a pair spots it early: praise it, ask **how** they caught it, and note whether it was a person, the spec step, or a reviewer sub-agent. That attribution is the retro's most valuable data.
- what to do if no pair spots it: do not tell them. Let cycle 1 finish green and open the retro with the question. The demonstration only works if it lands after they were confident.

- [ ] **Step 4: Commit**

```bash
git add docs/backlog/
git commit -m "Add backlog feature 1 with the planted position ambiguity"
```

---

### Task 3: Backlog features 2 and 3

**Files:**
- Create: `docs/backlog/feature-2-left-without-being-seen.md`
- Create: `docs/backlog/feature-3-queue-aging.md`
- Modify: `docs/backlog/INSTRUCTOR-NOTES.md`

- [ ] **Step 1: Write feature 2 — same shape as feature 1**

A rule plus its visible effect, so the retro compares process rather than difficulty:

```markdown
# A patient who leaves without being seen should drop out of the queue

People give up and go home. When staff mark someone as having left, everyone behind
them should move up, and their estimated wait should fall.
```

Deliberately **unambiguous**. One trap per course; a second would muddy which
process change caused which outcome.

- [ ] **Step 2: Write feature 3 — the amendment**

Different in kind: it changes a rule that already exists and already has passing
scenarios.

```markdown
# Waiting too long should raise your priority

Someone triaged GREEN who has waited over an hour should not keep being overtaken by
every new arrival. After 60 minutes of waiting, a patient moves up one triage level.

This changes how the queue is ordered, so existing behaviour has to be revisited
rather than extended.
```

- [ ] **Step 3: Record why feature 3 is the hard one**

In the instructor notes: this is the case every tutorial skips. Existing scenarios
must be **revised, not added to**, and the pair must decide whether the old scenario
was *wrong* or merely *incomplete*. It also needs the `triage_events` history that
Plan A built for exactly this.

- [ ] **Step 4: Load all three into Plane**

Create them as work items in each pair's project, via the MCP — proving the write
path and modelling the tool. **Titles and the request text only.** No acceptance
criteria.

- [ ] **Step 5: Commit**

```bash
git add docs/backlog/
git commit -m "Add backlog features 2 and 3 including the rule amendment"
```

---

### Task 4: The rescue SDD kit

**Files:**
- Create: `course/sdd-kit/README.md`
- Create: `course/sdd-kit/commands/{spec,plan,tasks,implement}.md`

A complete, working, deliberately plain kit. Available in ten seconds, never in the
way. **Not installed** — copying it is a decision a pair makes out loud.

- [ ] **Step 1: Write the four commands**

Each is a markdown file a student copies into `.claude/commands/`. Keep each under
40 lines: students must be able to read the entire method in twenty minutes.

`spec.md` must do three things, because the evidence supports all three:

- read the backlog item from Plane through the MCP
- write or amend a `.feature` file — **not** a separate spec document
- **name its ambiguities explicitly** rather than resolving them silently, using an
  inline `[NEEDS CLARIFICATION: ...]` marker

That third one is the mechanism that catches the planted trap, and it is borrowed
from SpecKit, which is worth telling students.

- [ ] **Step 2: Write the README as a menu, not an answer**

State plainly: this kit is *one* way to decompose the process, it is deliberately
minimal, and the exercise is to build your own. List what it does **not** do —
no review step, no gate, no hooks — so its gaps are visible and inviting rather than
hidden.

- [ ] **Step 3: Commit**

```bash
git add course/sdd-kit/
git commit -m "Add the rescue SDD kit as four readable commands"
```

---

### Task 5: Paired primitive examples

**Files:**
- Create: `course/primitives/reviewers/{a,b,c}-spec-reviewer.md`
- Create: `course/primitives/hooks/{quiet,loud}-vocabulary-guard.md`
- Create: `course/primitives/README.md`

**Ship variants, not answers.** Total TypeScript ships 18 problems and 29 solutions
because several problems have three defensible answers; that encodes "divergence is
a feature" at filesystem level far better than a README asking students to diverge.

- [ ] **Step 1: Write three reviewer sub-agent variants**

All read-only, all with an explicit *"do not manufacture findings"* clause — vendors
warn that reviewers over-report.

- **A — self-review:** asks the same agent to check its own work. Include it
  **because it is measured to be worse**: GPT-4 dropped 95.5% → 91.5% without
  external feedback. Students should meet the thing that does not work.
- **B — independent reviewer, no signal:** a fresh agent reading the diff.
- **C — independent reviewer, given the failing output:** the same, plus the gate's
  actual output. The evidence says this is the one that works.

The comparison *is* the lesson: "please review your work" is worthless; "here is the
failing output" is not.

- [ ] **Step 2: Write two hook variants that differ only in stderr**

Both enforce the same rule — a triage level re-declared outside `contract/` — and
both exit 2. They differ only in what they print:

- **quiet:** `Blocked.`
- **loud:** names the file, the line, the rule, and the one-line repair

Anthropic states three times that exit-2 stderr is fed back to the model. **A hook
author is hand-writing the agent's repair prompt.** Same enforcement, two repair
bands. This is a five-minute live demonstration of the course's central claim.

- [ ] **Step 3: Write the README**

For each pair of variants: what differs, what to try, what to look for. No verdict
at the top — the verdict is what the pair produces.

- [ ] **Step 4: Commit**

```bash
git add course/primitives/
git commit -m "Add paired primitive variants: three reviewers, two hooks"
```

---

### Task 6: The two remaining experiments

**Files:**
- Create: `docs/experiments/gherkin-authoring.md`, `docs/experiments/imitation-ab.md`

- [ ] **Step 1: Run the Gherkin authoring pre-test (~30 min)**

No evidence exists on whether agents author *declarative* or *imperative* Gherkin,
and the answer determines what guardrails `spec.md` needs. Weak prior: playwright-bdd's
own example is imperative.

Give an agent backlog feature 1 and the app, ask for a `.feature` file, three times
with fresh context. Record whether the scenarios describe **behaviour** ("they see
position 2") or **mechanics** ("they click the link, then read the third table
cell"). If imperative dominates, add an explicit declarative instruction to `spec.md`
and re-run to confirm it helps.

- [ ] **Step 2: Run the imitation A/B (~30 min)**

The claim that a good baseline produces good agent output is the **weakest link** in
the evidence and is load-bearing for the whole pre-built-repo decision.

Copy the repo, degrade the copy deliberately — inline the domain functions into the
handlers, drop the `contract` package and duplicate the types, loosen `strict` — then
ask an agent to add the same small feature in each. Compare what it produces.

Record the result **whichever way it goes.** A null result is still original
evidence, and this audience will respect it more than a citation.

- [ ] **Step 3: Commit**

```bash
git add docs/experiments/
git commit -m "Run the Gherkin authoring and imitation experiments"
```

---

### Task 7: The lesson plan

**Files:**
- Create: `docs/lesson-plan.md`
- Create: `docs/process-v0.md` (Mermaid starter)

- [ ] **Step 1: Write the opening — the disconfirming evidence first**

The instructor's stated fear is that the day becomes "agents write bad code". The
answer is to make the sceptic's argument first, with citations, and then declare
what the day will show:

- AI-vs-human differences in real repositories are "rather small"; in the lab, 63.34%
  more code smells. **The gap is roughly what a review process removes.**
- METR: developers 19% slower while believing they were 20% faster (say the n=16).
- DORA 2025: AI amplifies what is already there.
- **Then the prediction:** cycle 1 will produce mediocre code, because the process is
  thin. Cycle 2 will produce better code, because you fixed the process.

A room told in advance to expect bad output in cycle 1 cannot use it as evidence
against the course.

- [ ] **Step 2: Draw the build-in-class line explicitly**

This has been the longest-open gap. Resolve it in writing:

| Ships, active | Ships, inert (`course/`) | Students author |
|---|---|---|
| The app, the gate scripts, `CLAUDE.md`, the backlog in Plane | Rescue SDD kit; three reviewer variants; two hook variants | Everything in `.claude/` — commands, their gate policy, their process diagram |

The principle: **the repo provides capabilities; students compose the policy.** Same
rule that governs the gate catalogue, applied one level up.

- [ ] **Step 3: Write the session-by-session outline**

Frame each block by what students *produce*, not what is covered. At minimum:
opening and the evidence; the process mapping; building the kit; cycle 1; retro; cycle 2;
the framework appendix (SpecKit, OpenSpec, nWave) as recognising primitives they
have now built themselves.

- [ ] **Step 4: Write the retro script**

The most important twenty minutes of the day, and the one most likely to drift.
It must:

- surface the planted ambiguity if nobody caught it — **ask, do not tell**
- collect *where it hurt* before any talk of solutions
- **push every proposed improvement toward the structural.** Prompt wording is
  measured not to improve code structure. If a pair's answer is "write a better
  prompt", ask what would have *caught* it instead.

- [ ] **Step 5: Write `docs/process-v0.md`**

A deliberately thin starting Mermaid diagram — `spec → plan → implement`, no gate,
no review — committed so that `git log` on this one file becomes the record of every
process change the class makes. That diff is the improvement evidence, obtained for
free.

- [ ] **Step 6: Commit**

```bash
git add docs/lesson-plan.md docs/process-v0.md
git commit -m "Add the lesson plan, the build-in-class line and process v0"
```

---

## Self-Review

**Spec coverage against `docs/course-design-decisions.md`:**

| Requirement | Task |
|---|---|
| Three features, 1 and 2 same shape, 3 an amendment (10/20) | 2, 3 |
| Planted ambiguity producing a green suite (§3a, §4) | 2 |
| Rescue kit available, not pre-installed (7) | 4 |
| Kit composed of primitives, not just prompts (31) | 4, 5 |
| Skills / sub-agents / hooks each with an honest home (§3b) | 5 |
| MCP is the genuine reason to leave the repo (32) | 3 step 4 |
| Framework appendix: SpecKit, OpenSpec, nWave (31) | 7 step 3 |
| Process as committed Mermaid (19) | 7 step 5 |
| Retro discussion, nothing formally recorded (23) | 7 step 4 |
| Divergence deliberate (9) | 5 — variants, not answers |
| Cycle 2 must be structural, not verbal (§3c) | 7 step 4 |
| Gherkin authoring experiment (§5 item 2) | 6 |
| Imitation A/B (§5 item 5) | 6 |
| The build-in-class line — longest-open gap | 7 step 2 |

**Ordering note:** Task 6's Gherkin experiment should ideally run *before* Task 4
writes `spec.md`, since its result determines whether that command needs a
declarative guardrail. If the plan is executed in order, revisit `spec.md` after
Task 6 rather than accepting it unchanged.

**Not in this plan:** the app (Plan A), gate measurement (Plan B), Plane deployment
(Plan D).
