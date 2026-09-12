---
name: sdd-plan
description: "Use when a work item has a finished spec and needs a plan — the user asks to plan LEGE-3 or ITEM-2, asks how to build it, wants options compared, or asks what comes after sdd-spec. Second step of the kit: spec → plan → tasks → implement. Weighs two ways to build it, the pair picks one, and writes .sdd/<ID>/plan.md."
---

<!-- Copied from skald-sdd/plugins/sdd-lite by scripts/sync-sdd-lite.sh — edit there, not here. -->

# Plan

Decide **how** to build a spec'd item: two ways to do it, the pair picks, and the pick becomes
`.sdd/<ID>/plan.md` — the files that change and why.

The spec says *what*. The plan only says *how*. A plan may not add, drop or weaken anything the
feature file says.

Read `../sdd-spec/references/backlog.md` first — config, the item, the drift check.

## 1. Gate

| Situation | Do |
|---|---|
| No `.sdd/config.json` | **Stop** — "run `sdd-spec` first" |
| No feature file for the item | **Stop** — "`sdd-spec <ID>` has not finished" |
| The item has open questions | **Stop** — they block. The pair asks the product owner, or runs `sdd-spec` and says "make up the rest" |
| Not on `<pair>/<ID>` | Switch to it. It does not exist: create it from `main` |
| `plan.md` already exists | Say so, show its approval line, and ask: keep it, or plan again? |

Then run **the drift check**. It stops on any difference.

## 2. Read

In parallel: the item, the feature file, `e2e/steps/`, and **the code the scenarios touch** —
follow the behaviour from the screen the scenarios describe back to where it is decided. Read the
existing unit tests next to that code. Read `CLAUDE.md` or `README.md` for the repo's rules.

Read what you need to name real files, not the whole repo.

## 3. Two ways

Write two options, each in a few lines:

- **The quick one** — the smallest change that makes every scenario pass. Written to win: it is
  often the right answer.
- **The considered one** — what you would do with room to do it properly. Only if it is genuinely
  different; if the two collapse into one, say so and present one.

For each: what changes (at module level — "the queue ordering in `backend/src/domain/queue.ts`"),
what it costs (how much changes, what could break), and what it leaves out. **No time estimates**,
ever.

Mark **one recommendation**, with one sentence of why.

## 4. Pick and approve — one question

Ask once, with `AskUserQuestion`: which option — and the pick is the approval. Corrections are
folded in and asked again; they are not a new round of questions.

## 5. Write `plan.md`

```markdown
# <ID> — plan

## Approach
<the chosen option in two or three sentences>

Rejected: <the other option, one line, and why>

## Files
| File | Change |
|---|---|
| backend/src/domain/queue.ts | changed — … |
| backend/src/domain/queue.test.ts | changed — new unit tests for … |
| e2e/steps/queue.steps.ts | changed — steps for … |

## Risks
- <anything the code showed that could bite — or "None found">

Approved — <date>
```

Every production file that changes has its unit test file in the table, and every new step
phrasing has its step file. Commit on the branch: `plan: <ID>`.

## 6. Hand off

One message: the approach, the file count, the risks, and the next step — `sdd-tasks <ID>`.

## Rules

- **One stop** — the pick. Nothing else is asked.
- **Never re-open the spec.** If the code shows a rule cannot work, say so in Risks and at the
  pick; the fix goes back through `sdd-spec`.
- **Don't narrate.** Do the reading, then report.
