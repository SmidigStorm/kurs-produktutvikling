---
name: sdd-tasks
description: "Use when a work item has an approved plan and needs a task list — the user asks for tasks for LEGE-3 or ITEM-2, wants the plan broken down, or asks what comes after sdd-plan. Third step of the kit: spec → plan → tasks → implement. Writes .sdd/<ID>/tasks.md: one task per scenario, each with its files and the commands that prove it."
---

<!-- Copied from skald-sdd/plugins/sdd-lite by scripts/sync-sdd-lite.sh — edit there, not here. -->

# Tasks

Turn the approved plan into `.sdd/<ID>/tasks.md` — **one scenario, one task**, each small enough
to go red, then green, then commit.

No questions. This step runs straight through.

Read `../sdd-spec/references/backlog.md` first — config, the item, the drift check.

## 1. Gate

| Situation | Do |
|---|---|
| No `.sdd/config.json` | **Stop** — "run `sdd-spec` first" |
| No `plan.md`, or no `Approved —` line in it | **Stop** — "`sdd-plan <ID>` comes first" |
| Not on `<pair>/<ID>` | Switch to it |
| `tasks.md` already exists | Say so. Ticked tasks are work already done — keep them and plan the rest around them |

Then run **the drift check**. It stops on any difference.

## 2. Read

`plan.md`, the feature file, `e2e/steps/`, and the files the plan's table names.

## 3. Write `tasks.md`

One task per scenario, in the order the feature file lists them. A task that must exist before
another (a new database column, a shared helper) is a **prep task**, marked as such and naming the
task it unblocks.

```markdown
# <ID> — tasks

- [ ] **1. A red arrival moves ahead of a green patient**
  - Scenario: `A red arrival moves ahead of a green patient`
  - Unit test: `backend/src/domain/queue.test.ts` — RED sorts before GREEN regardless of arrival
  - Steps: reuses existing steps / new: `…` in `e2e/steps/queue.steps.ts`
  - Code: `backend/src/domain/queue.ts`
  - Prove: `npx vitest run backend/src/domain/queue.test.ts` and
    `npm run test:e2e -- --grep "A red arrival moves ahead of a green patient"`

- [ ] **2. (prep, unblocks 3) …**
```

Every task carries:

- **the scenario** it makes pass (prep tasks: the task they unblock)
- **the unit test** to write — the rule, tested directly, without the browser. A task whose
  behaviour lives only in the UI says so instead
- **the steps** — which already exist, and which are new and where they go
- **the code** files
- **the proof** — the unit test command and the scenario command

**"Check that it works" is never a task.** Checking belongs to the task that built the thing.

**No time estimates**, anywhere.

## 4. Prove the proofs exist

A proof that matches nothing reads as green and proves nothing. Run once:

```bash
npx bddgen && npx playwright test --list --grep "@<ID>\b"
```

The `\b` matters: without it `@LEGE-3` also matches `@LEGE-30`. Every scenario title in
`tasks.md` must appear in that list, and no two titles may be the same. Fix any that fail before
going on.

## 5. Hand off

Commit on the branch: `tasks: <ID>`. One message: the task count, any prep tasks, and the next
step — `sdd-implement <ID>`.
