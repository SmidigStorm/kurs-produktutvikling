---
name: sdd-tasks
description: "Use when a work item has an approved plan and needs a task list. The user asks for tasks for LEGE-3 or ITEM-2, wants the plan broken down, or asks what comes after sdd-plan. Third step of the kit: spec, plan, tasks, implement. Writes the tasks as sub-work-items under the item in Plane, or as .sdd/<ID>/tasks.md, one task per piece of work, each carrying its files and the commands that prove it."
---

<!-- Copied from skald-sdd/plugins/sdd-lite by scripts/sync-sdd-lite.sh — edit there, not here. -->

# Tasks

Turn the approved plan into a task list: **one task per piece of work**, in build order, each
small enough to go red, then green, then commit. The list is the agent's plan for the change,
written where the pair and the product owner can see it: as **sub-work-items under the item** in
Plane, or as `.sdd/<ID>/tasks.md` in markdown mode.

No questions. This step runs straight through.

Read `../sdd-spec/references/backlog.md` first for the config, the item and the drift check.

## 1. Gate

| Situation | Do |
|---|---|
| No `.sdd/config.json` | **Stop.** "Run `sdd-spec` first" |
| No `plan.md`, or no `Approved:` line in it | **Stop.** "`sdd-plan <ID>` comes first" |
| On `main` | Create `<pair>` and switch, as `backlog.md` describes. On any other branch, stay where they are |
| Tasks already exist (children under the item, or `tasks.md`) | Say so. Tasks marked Done are work already done, so keep them and plan the rest around them |

Then run **the drift check**. It stops on any difference.

## 2. Read

`plan.md`, the feature file, `e2e/steps/`, and the files the plan's table names.

## 3. Cut the work into tasks

A task is one piece of work from the plan's file table: the table of strings, the rendering, the
new step definition, the changed step, the new column, the endpoint. Order them so that each task
ends with something that can be run, and so that the scenarios go green as early as possible
rather than all at the end. A task that must exist before another one, such as a new database
column or a shared helper, says which task it unblocks.

Every task carries:

- the scenario or scenarios it serves
- the unit test to write: the rule, tested directly, without the browser. A task whose behaviour
  lives only in the UI says so instead
- the steps: which already exist, and which are new or changed, and where they go
- the code files
- the proof: the command that shows it done. A unit test, `npm run typecheck`, or the scenario
  command `npm run test:e2e -- --grep "<scenario title>"` for the task that makes a scenario pass

**"Check that it works" is never a task.** Checking belongs to the task that built the thing.

**Never estimate time**, anywhere.

## 4. Write the tasks

**Plane.** One child work item per task: `workitem` `create` with the config's `planeProjectId`,
`parent` set to the item's id, the name `<n>. <task title>`, and the body as `description_html`.
Create them in order, so their sequence ids follow the build order. Move each to **Todo** with the
state id from `state` `list`. Nothing is written to `.sdd/<ID>/` for the tasks.

**Markdown.** `.sdd/<ID>/tasks.md`:

```markdown
# Tasks for <ID>

- [ ] **1. The five explanations, keyed by level**
  - Serves: `A patient sees what their colour means`
  - Unit test: none, the behaviour lives in the UI; the `Record` type proves completeness
  - Steps: none
  - Code: `frontend/src/triageExplanations.ts`
  - Prove: `npm run typecheck`

- [ ] **2. The patient view shows the explanation under the level**
  - Serves: `A patient sees what their colour means`
  - Unit test: none, UI only
  - Steps: new `Then they see the explanation {string}` in `e2e/steps/queue.steps.ts`
  - Code: `frontend/src/PatientView.tsx`
  - Prove: `npm run test:e2e -- --grep "A patient sees what their colour means"`
```

Same body in both modes. A task's title says what exists when it is done, in the words of the
plan, not the name of a layer: "the patient view shows the explanation", not "frontend change".

## 5. Check the scenarios are all served

Every `Scenario:` and `Scenario Outline:` title in the feature file must appear under some task's
"Serves", and no two tasks may carry the same title. Check against the feature file, not against
`playwright test --list`: the generator will not list a scenario whose steps have no definition
yet, and writing those definitions is `sdd-implement`'s work.

## 6. Hand off

Markdown mode: commit on the branch as `tasks: <ID>`. Plane mode: nothing to commit.

One message: the task count, which tasks unblock others, where the tasks are (the item's children
in Plane, or `tasks.md`), and the next step, which is `sdd-implement <ID>`.
