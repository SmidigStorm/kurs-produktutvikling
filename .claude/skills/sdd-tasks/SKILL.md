---
name: sdd-tasks
description: "Use when a work item has an approved plan and needs a task list. The user asks for tasks for LEGE-3 or ITEM-2, wants the plan broken down, or asks what comes after sdd-plan. Third step of the kit: spec, plan, tasks, implement. Writes .sdd/<ID>/tasks.md, one task per concrete change: create or update this file, this function, this step, this test, this document."
---

<!-- Copied from skald-sdd/plugins/sdd-lite by scripts/sync-sdd-lite.sh — edit there, not here. -->

# Tasks

Turn the approved plan into a task list: **one task per concrete change**, create or update this
file, this function, this step, this test, this document, in build order. The list is the work,
written out in `.sdd/<ID>/tasks.md` before it is done. The task list lives in the repo in both
backlog modes; Plane holds the item, not the tasks.

No questions. This step runs straight through.

Read `../sdd-spec/references/backlog.md` first for the config, the item and the drift check.

## 1. Gate

| Situation | Do |
|---|---|
| No `.sdd/config.json` | **Stop.** "Run `sdd-spec` first" |
| No `plan.md`, or no `Approved:` line in it | **Stop.** "`sdd-plan <ID>` comes first" |
| On `main` | Create `<pair>` and switch, as `backlog.md` describes. On any other branch, stay where they are |
| `tasks.md` already exists | Say so. Ticked tasks are work already done, so keep them and plan the rest around them |

Then run **the drift check**. It stops on any difference.

## 2. Read

`plan.md`, the feature file, `e2e/steps/`, and the files the plan's table names.

## 3. Cut the work into tasks

A task is **one concrete change to one file**: create or update the file, and name the function,
component, step or section that is added or changed, and what it does. The task list is the work,
written out, so that anyone can see what the agent is about to do before it does it.

Every change the plan's file table implies becomes a task, of one of these kinds:

| Kind | Title reads like |
|---|---|
| Code | `Create frontend/src/triageExplanations.ts: TRIAGE_EXPLANATION, the five strings keyed by level` |
| Code | `Update frontend/src/PatientView.tsx: render the explanation under the level chip` |
| Unit test | `Update backend/src/domain/queue.test.ts: RED sorts before GREEN regardless of arrival` |
| E2E step | `Create step "they see the explanation {string}" in e2e/steps/queue.steps.ts` |
| E2E step | `Update step "staff re-triage {string} to {string}" in e2e/steps/staff.steps.ts: works from the patient page` |
| Documentation | `Update README.md: the patient view section, the explanation under the level` |

Order them so the build runs top to bottom: a file before the file that imports it, a step
before the scenario that uses it, the test that goes red before the code that makes it green. A
task another one depends on says so.

Every task body carries:

- **Does:** what the change is, in two or three lines, precise enough to write from
- **Serves:** the scenario or scenarios it is for
- **Prove:** the command that shows it done: the unit test, `npm run typecheck`, or the scenario
  command `npm run test:e2e -- --grep "<scenario title>"` for the task that turns a scenario green

Where a kind has nothing to do, say so in the hand-off rather than inventing a task: no unit test
when the behaviour lives only in the UI and the repo has no frontend test runner, no documentation
when no document describes the thing that changed.

**"Check that it works" is never a task.** Checking belongs to the task that built the thing.

**Never estimate time**, anywhere.

## 4. Write `tasks.md`

`.sdd/<ID>/tasks.md`, in both backlog modes:

```markdown
# Tasks for <ID>

- [ ] **1. Create frontend/src/triageExplanations.ts: TRIAGE_EXPLANATION, the five strings keyed by level**
  - Does: `Record<TriageLevel, string>` with the five strings from the feature file verbatim,
    keyed the way `triageStyles.ts` keys the chip colours, so a missing level is a type error
  - Serves: `A patient sees what their colour means`
  - Prove: `npm run typecheck`

- [ ] **2. Update frontend/src/PatientView.tsx: render the explanation under the level chip**
  - Does: a `<p role="status" aria-label="What this means">` directly under the level, showing
    `TRIAGE_EXPLANATION[visit.level]`. Needs 1
  - Serves: `A patient sees what their colour means`
  - Prove: `npm run test:e2e -- --grep "A patient sees what their colour means"`, after task 3
```

## 5. Check the scenarios are all served

Every `Scenario:` and `Scenario Outline:` title in the feature file must appear under some task's
"Serves", and no two tasks may carry the same title. Check against the feature file, not against
`playwright test --list`: the generator will not list a scenario whose steps have no definition
yet, and writing those definitions is `sdd-implement`'s work.

## 6. Hand off

Commit on the branch as `tasks: <ID>`.

One message: the task count by kind, which kinds have nothing to do and why, and the next step,
which is `sdd-implement <ID>`.
