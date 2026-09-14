---
name: sdd-spec
description: "Use when a feature request needs turning into a spec. The user pastes a feature request, names a work item such as LEGE-3 or ITEM-2, asks to specify, define or write requirements, rules, examples, scenarios or acceptance criteria, or says 'spec this'. First step of the kit: spec, plan, tasks, implement. Writes the rules and examples to the work item (Plane or .sdd/<ID>/item.md) and to a Gherkin feature file, together."
---

<!-- Copied from skald-sdd/plugins/sdd-lite by scripts/sync-sdd-lite.sh — edit there, not here. -->

# Spec

Turn one feature request into rules and concrete examples that a developer could build **without
guessing**, written to the work item and to a feature file at the same time.

You run a short Example Mapping session with the pair. **You propose, they decide.**

Read `references/backlog.md` before anything else, for the config, the item template and both
backlog modes. Read `references/gherkin.md` before writing a scenario.

## 1. Setup

Read `.sdd/config.json`. If it is missing, create it as `references/backlog.md` describes, then
continue.

Find the request. It is one of:

- **An ID** such as `LEGE-3` or `ITEM-2`. Read the item: in Plane with `workitem`
  `retrieve_by_identifier`, or `list` with the config's `project_id` if the pair only remembers
  the title; in markdown mode from `.sdd/<ID>/item.md`. If it already has rules, this is a
  *revision*, so start from what it says rather than from scratch.
- **Text**, a pasted feature request. The item is created when you write in §5, not before.

Read in parallel: every file in `features/`, which gives you the phrasing to reuse and what the app
already does, plus the item if there is one. **Do not read the application code or `e2e/steps/`.**
Code pulls the spec toward whatever the app happens to do today, and step definitions are
implementation: `sdd-implement` writes whatever steps the scenarios need.

## 2. Propose

In one message, propose:

- the story, as "as a …, I want …, so that …"
- the rules: the smallest set that makes the request testable, and say what you left out
- one or two examples per rule, as Gherkin, in the phrasing the existing feature files use
- what is unclear: the things you could not decide from the request

Anything you can find out by reading, whether in the existing features, the steps or the item,
you state as fact. Only what you cannot find out, and that would change what gets built, counts
as unclear.

## 3. Ask, one question at a time

Work through the unclear list **one question per message**. Each question carries your
recommended answer and one line of why, so the pair can just say yes.

The pair answers, or says they don't know. **"Don't know" is a good answer.** It becomes an
**open question for the product owner**, in the pair's words, specific enough to answer in one
sentence ("Do two red arrivals keep their arrival order?", not "clarify the red rule"). Never
answer an open question yourself.

Fold each answer into the rules and examples as you go. Stop asking when the list is empty.

### Make up the rest

If the pair says *"make up the rest"*, *"just finish it"*, *"guess"* or anything like it, stop
asking. For every question still open, choose the answer you would recommend and record each one
as an **assumption**: under `## Assumptions` in the item, and as an `@assumption` tag on every
scenario that rests on one. Assumptions count as settled, so `sdd-plan` and `sdd-implement` build
on them without stopping. The tag is what lets the pair find them again
(`grep -rn @assumption features/`) and check which guesses were wrong.

## 4. Open questions block the feature file

While open questions are left, **write the item but not the feature file**: story, rules, examples
so far, and `## Open questions`. Status stays *Backlog*. Tell the pair to take the questions to
the product owner and run `sdd-spec <ID>` again with the answers, or to say "make up the rest".

## 5. Write both copies

Only once no open questions are left. Write both in one step:

**The item.**
- Plane: for a new request, `workitem` `create` with the config's `planeProjectId`, a short title
  and `description_html`; for an existing item, `workitem` `update`. Move it to **Todo** by
  reading `state` `list` and passing the state id to `workitem` `update`.
- Markdown: for a new request, `.sdd/ITEM-<next>/item.md`; for an existing one, update it.
  `Status: Todo`.

**The feature file**, at `features/<capability>.feature`, named for the capability in two or three
words (`triage-explanation.feature`, not the item's ID or title), following
`references/gherkin.md`. Same rules, same examples, same order as the item. If the file exists,
show the diff and ask before overwriting.

**The branch.** Settle it as `references/backlog.md` describes: stay on whatever branch the pair is
already on, and only when they are on `main` create `<pair>` and switch. Then commit the feature
file and anything under `.sdd/<ID>/` as `spec: <ID> <title>`. Do not push. `sdd-implement` pushes.

## 6. Cold read

Dispatch the **spec-reviewer** agent, called `spec-reviewer`, or `sdd-lite:spec-reviewer` when the
kit is installed as a plugin. Give it the feature file path, the `.sdd/<ID>/` folder path and, in
Plane mode, the item's text: read it back with `workitem` `retrieve_by_identifier` and `fields:
description_html` and paste it into the brief, because the agent has no Plane tools. Nothing else.
It has not seen this conversation, which is the point.

Then **apply the fixes yourself, before showing anything.** For every finding, choose the answer
you would recommend and write it into **both** copies. A finding that only tightens what was
already decided (an assertion that was missing, a word the prose and the scenario disagree on) is
just applied. A finding that settles something the pair never decided is applied *and* recorded
as an assumption: under `## Assumptions` in the item, and as `@assumption` on every scenario that
rests on it, exactly as in "Make up the rest". A finding that would widen the item is not applied;
it is listed as a candidate item instead. Commit again as `spec: <ID> after review`.

Then show the pair one table: each finding, what you changed for it (or "left out, candidate
item"), and whether it is an assumption. The pair reads the result and comments; anything they
change goes into both copies and is committed. If the reviewer finds nothing material, say so.

## 7. Hand off

One message: the ID, where the item is (a Plane link or `item.md`), the feature file, any
assumptions, and the next step, which is `sdd-plan <ID>`.

## Rules

- **One question per message** in §3. Never a list of questions.
- **Propose, don't interview.** Every question has a recommended answer.
- **Never answer an open question yourself,** unless the pair said "make up the rest", and then
  every guess is marked.
- **Both copies, every time.** Never write one without the other. Section 4 is the only exception,
  where there is no feature file yet.
- **Don't narrate.** No "now I'll read the steps". Do it, then report.
