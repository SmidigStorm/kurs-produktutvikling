---
name: sdd-implement
description: "Use when a work item has a task list and needs building. The user asks to implement LEGE-3 or ITEM-2, build the tasks, make the scenarios pass, continue implementing, or asks what comes after sdd-tasks. Last step of the kit: spec, plan, tasks, implement. Builds each task red then green with new unit tests and e2e steps, runs both test suites, pushes the branch and marks the item done."
---

<!-- Copied from skald-sdd/plugins/sdd-lite by scripts/sync-sdd-lite.sh — edit there, not here. -->

# Implement

Build `tasks.md` one task at a time, test first, then code, then commit, until every scenario of
the item passes and both suites are green. Then push the branch. It runs straight through, stopping
only where it cannot go on (§5).

Read `../sdd-spec/references/backlog.md` first for the config, the item and the drift check.

## 1. Gate

| Situation | Do |
|---|---|
| No `.sdd/config.json` | **Stop.** "Run `sdd-spec` first" |
| No `tasks.md` | **Stop.** "`sdd-tasks <ID>` comes first" |
| On `main` | Create `<pair>` and switch, as `backlog.md` describes. On any other branch, stay where they are |
| Uncommitted changes that are not this item's | **Stop** and show them. Never commit someone else's work |
| The app is running (`npm run dev`, ports 3001 and 5173) | Ask the pair to stop it. The e2e suite starts its own servers and fails on busy ports |

Then run the drift check. It stops on any difference.

Move the item to In Progress: in Plane by reading `state` `list` and passing the state id to
`workitem` `update`, in markdown by setting `Status: In Progress`.

**Resuming?** Run the item's scenarios first with `npm run test:e2e -- --grep "@<ID>\b"`, where the
`\b` stops `@LEGE-3` matching `@LEGE-30`. Green scenarios are done, so start at the first red one.
Ticks in `tasks.md` are a convenience; the test run is the truth.

## 2. The loop, one task at a time

For each unticked task, in order:

1. **Red.** Write the unit test the task names, and the new or changed step definitions it needs.
   Run the proof and see it fail for the right reason: a missing behaviour, not a typo or a missing
   import. A test that passes before the code exists proves nothing. A task whose proof is
   `npm run typecheck` has no red; say so and go on.
2. **Green.** Write the smallest code that makes the proof pass, following the plan's files.
3. **Tidy.** Clean up what you just wrote while it is green, then re-run the proof.
4. Tick the task in `tasks.md` and commit as `<ID>: <task title>`.

**Never weaken a test to make it pass.** Not by editing a scenario to match the code, not by a
step definition that asserts nothing, and not by skipping. It is the one failure nobody would see.

## 3. Both suites

When every task is ticked, run both in full:

```bash
npm test
npm run test:e2e
```

The whole suites, not only this item's scenarios: a change that breaks someone else's scenario is
not done. Both must be green.

## 4. Finish

- Push the branch the pair is on with `git push -u origin <current branch>`. Never push to `main`.
- Mark the item done. In Plane, move it to Done and add a comment with `workitem_comment` `create`
  naming the branch. In markdown mode, set `Status: Done` and commit it.
- Report in one message: the tasks built, the unit tests and steps added, both suite results, the
  branch, and anything from §5 the pair should know.

## 5. When it goes red

**Three attempts to fix a failure, then stop.** Past three, fixing gets worse rather than better.

| What is wrong | Do |
|---|---|
| The code | Fix the code. Up to three attempts |
| **The example.** The code does what the rule says, and the example illustrates it badly | Fix the example in both copies, the feature file and the item, as `backlog.md` describes. Re-run and list the change in the report |
| **The rule** seems wrong | Build what the rule says anyway, and put the doubt at the top of the report. Changing a rule is the product owner's call, through `sdd-spec` |
| A scenario would have to be deleted to go green | **Stop.** Deleting coverage passes every check there is |
| The plan does not fit the code | **Stop** and say why. Building something else without saying so is the failure the plan exists to prevent |
| Three attempts failed | **Stop.** Show the failing test, the last error, and what was tried |

A stop leaves the branch as it is, every green task already committed. Running `sdd-implement`
again resumes from the tests (§1).

## Rules

- **Test first, always.** Red before green.
- **Never push to `main`, never merge.** The branch is the result.
- **Don't narrate.** Do the work, then report what happened.
