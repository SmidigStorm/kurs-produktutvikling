---
name: sdd-plan
description: "Use when a work item has a finished spec and needs a plan. The user asks to plan LEGE-3 or ITEM-2, asks how to build it, wants options compared, or asks what comes after sdd-spec. Second step of the kit: spec, plan, tasks, implement. Weighs two ways to build it, the pair picks one, and writes .sdd/<ID>/plan.md."
---

<!-- Copied from skald-sdd/plugins/sdd-lite by scripts/sync-sdd-lite.sh — edit there, not here. -->

# Plan

Decide **how** to build a spec'd item. Two ways to do it, the pair picks one, and the pick becomes
`.sdd/<ID>/plan.md`: the files that change, and why.

The spec says *what*. The plan only says *how*. A plan may not add, drop or weaken anything the
feature file says.

Read `../sdd-spec/references/backlog.md` first for the config, the item and the drift check.

## 1. Gate

| Situation | Do |
|---|---|
| No `.sdd/config.json` | **Stop.** "Run `sdd-spec` first" |
| No feature file for the item | **Stop.** "`sdd-spec <ID>` has not finished" |
| The item has open questions | **Stop.** They block. The pair asks the product owner, or runs `sdd-spec` and says "make up the rest" |
| On `main` | Create `<pair>` and switch, as `backlog.md` describes. On any other branch, stay where they are |
| `plan.md` already exists | Say so, show its approval line, and ask: keep it, or plan again? |

Then run **the drift check**. It stops on any difference.

## 2. Read

In parallel: the item, the feature file, `e2e/steps/`, and **the code the scenarios touch**,
following the behaviour from the screen the scenarios describe back to where it is decided. Read
the existing unit tests next to that code. Read `CLAUDE.md` or `README.md` for the repo's rules.

Read what you need in order to name real files, not the whole repo.

## 3. Two ways

Write two options, each in a few lines:

- The quick one: the smallest change that makes every scenario pass. Write it to win, because it
  is often the right answer.
- The considered one: what you would do with room to do it properly. Offer it only if it is
  genuinely different. If the two collapse into one, say so and present one.

For each, say what changes at module level ("the queue ordering in
`backend/src/domain/queue.ts`"), what it costs (how much changes, what could break), and what it
leaves out. **Never estimate time.**

Mark **one recommendation**, with one sentence of why.

## 4. Pick and approve, in one question

Ask once, with `AskUserQuestion`: which option. The pick is also the approval. Corrections are
folded in and the question is asked again; they are not a new round of questions.

## 5. Write `plan.md`

```markdown
# Plan for <ID>

## Approach
<the chosen option in two or three sentences>

Rejected: <the other option, one line, and why>

## Files
| File | Change |
|---|---|
| backend/src/domain/queue.ts | changed: … |
| backend/src/domain/queue.test.ts | changed: new unit tests for … |
| e2e/steps/queue.steps.ts | changed: steps for … |

## Risks
- <anything the code showed that could bite, or "None found">

Approved: <date>
```

Every production file that changes has its unit test file in the table, and every new step
phrasing has its step file. Commit on the branch: `plan: <ID>`.

## 6. Hand off

One message: the approach, the file count, the risks, and the next step, which is
`sdd-tasks <ID>`.

## Rules

- **One stop, which is the pick.** Nothing else is asked.
- **Never re-open the spec.** If the code shows a rule cannot work, say so in Risks and at the
  pick. The fix goes back through `sdd-spec`.
- **Don't narrate.** Do the reading, then report.
