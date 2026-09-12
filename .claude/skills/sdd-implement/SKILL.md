---
name: sdd-implement
description: "Use when a work item has a task list and needs building — the user asks to implement LEGE-3 or ITEM-2, build the tasks, make the scenarios pass, continue implementing, or asks what comes after sdd-tasks. Last step of the kit: spec → plan → tasks → implement. Builds each task red then green with new unit tests and e2e steps, runs both test suites, pushes the branch and marks the item done."
---

<!-- Copied from skald-sdd/plugins/sdd-lite by scripts/sync-sdd-lite.sh — edit there, not here. -->

# Implement

Build `tasks.md` one task at a time — **test first, then code, then commit** — until every
scenario of the item passes and both test suites are green. Then push the branch.

It runs straight through. It stops only where it cannot go on (§5).

Read `../sdd-spec/references/backlog.md` first — config, the item, the drift check.

## 1. Gate

| Situation | Do |
|---|---|
| No `.sdd/config.json` | **Stop** — "run `sdd-spec` first" |
| No `tasks.md` | **Stop** — "`sdd-tasks <ID>` comes first" |
| Not on `<pair>/<ID>` | Switch to it |
| Uncommitted changes that are not this item's | **Stop** and show them. Never commit someone else's work |
| The app is running (`npm run dev`, ports 3001 / 5173) | Ask the pair to stop it. The e2e suite starts its own servers and fails on busy ports |

Then run **the drift check**. It stops on any difference.

Move the item to **In Progress** (Plane: `state` list → `workitem` `update`; markdown:
`Status: In Progress`).

**Resuming?** Run the item's scenarios first — `npm run test:e2e -- --grep "@<ID>\b"` (the `\b` stops `@LEGE-3` matching `@LEGE-30`). Green
scenarios are done; start at the first red one. Ticks in `tasks.md` are a convenience; the test
run is the truth.

## 2. The loop — one task at a time

For each unticked task, in order:

1. **Red.** Write the unit test the task names, and the new step definitions it needs. Run both
   proof commands and **see them fail, for the right reason** — a missing behaviour, not a typo
   or a missing import. A test that passes before the code exists proves nothing.
2. **Green.** Write the smallest code that makes both pass. Follow the plan's files.
3. **Tidy.** Clean up what you just wrote while it is green. Re-run the proofs.
4. **Tick** the task in `tasks.md` and **commit**: `<ID>: <scenario title>`.

Prep tasks follow the same loop with a unit test as their proof.

**Never weaken a test to make it pass** — not by editing a scenario to match the code, not by a
step definition that asserts nothing, not by skipping. That is the one failure nobody would see.

## 3. Both suites

When every task is ticked, run the whole of both:

```bash
npm test
npm run test:e2e
```

The whole suites, not just this item — a change that breaks someone else's scenario is not done.
Both must be green.

## 4. Finish

- **Push the branch:** `git push -u origin <pair>/<ID>`. Never push to `main`.
- **Mark the item done.** Plane: move to **Done** and add a comment (`workitem_comment` `create`)
  with the branch name. Markdown: `Status: Done`, and commit it.
- **Report** in one message: the tasks built, the unit tests and steps added, both suite results,
  the branch, and anything from §5 the pair should know.

## 5. When it goes red

**Three attempts to fix a failure, then stop.** Past three, fixing gets worse, not better.

| What is wrong | Do |
|---|---|
| The code | Fix the code. Up to three attempts |
| **The example** — the code does what the rule says, the example illustrates it badly | Fix the example **in both copies** (feature file and item, per `backlog.md`), re-run, and list the change in the report |
| **The rule** seems wrong | Build what the rule says anyway, and put the doubt at the top of the report. Changing a rule is the product owner's call, through `sdd-spec` |
| A scenario would have to be deleted to go green | **Stop.** Deleting coverage passes every check there is |
| The plan does not fit the code | **Stop** and say why. Building something else quietly is the failure the plan exists to prevent |
| Three attempts failed | **Stop.** Show the failing test, the last error, and what was tried |

A stop leaves the branch as it is: every green task already committed. Running `sdd-implement`
again resumes from the tests (§1).

## Rules

- **Test first, always.** Red before green.
- **Never push to `main`, never merge.** The branch is the result.
- **Don't narrate.** Do the work, then report what happened.
