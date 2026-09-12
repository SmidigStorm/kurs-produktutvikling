---
name: sdd-spec
description: "Use when a feature request needs turning into a spec — the user pastes a feature request, names a work item such as LEGE-3 or ITEM-2, asks to specify, define or write requirements, rules, examples, scenarios or acceptance criteria, or says 'spec this'. First step of the kit: spec → plan → tasks → implement. Writes the rules and examples to the work item (Plane or .sdd/<ID>/item.md) and to a Gherkin feature file, together."
---

<!-- Copied from skald-sdd/plugins/sdd-lite by scripts/sync-sdd-lite.sh — edit there, not here. -->

# Spec

Turn one feature request into rules and concrete examples that a developer could build **without
guessing** — written to the work item and to a feature file at the same time.

You run a short Example Mapping session with the pair. **You propose, they decide.**

Read `references/backlog.md` before anything else — config, the item template, both backlog
modes. Read `references/gherkin.md` before writing a scenario.

## 1. Setup

Read `.sdd/config.json`. Missing: create it as `references/backlog.md` describes, then continue.

Find the request. It is one of:

- **An ID** (`LEGE-3`, `ITEM-2`) — read the item. Plane: `workitem` `retrieve_by_identifier`
  (or `list` with the config's `project_id`, if the pair only remembers the title).
  Markdown: `.sdd/<ID>/item.md`. If it already has rules, this is a *revision*: start from what it
  says, not from scratch.
- **Text** — a pasted feature request. The item is created when you write (§5), not before.

Read, in parallel: every file in `features/` and `e2e/steps/` (the phrasing you will reuse, and
what the app already does), and the item if there is one. **Do not read the application code** —
it pulls the spec toward what the code happens to do.

## 2. Propose

In one message, propose:

- **the story** — as a …, I want …, so that …
- **the rules** — the smallest set that makes the request testable. Say what you left out
- **one or two examples per rule**, as Gherkin, in the repo's existing step phrasing
- **what is unclear** — the list of things you could not decide from the request

Anything you can find out by reading (the existing features, the steps, the item), state as fact.
Only what you cannot find out, and what would change what gets built, is unclear.

## 3. Ask, one question at a time

Work through the unclear list **one question per message**. Each question carries your
recommended answer and one line of why, so the pair can just say yes.

The pair answers, or says they don't know. **"Don't know" is a good answer** — it becomes an
**open question for the product owner**, in the pair's words, specific enough to answer in one
sentence ("Do two red arrivals keep their arrival order?", not "clarify the red rule"). Never
answer an open question yourself.

Fold each answer into the rules and examples as you go. Stop asking when the list is empty.

### Make up the rest

If the pair says *"make up the rest"*, *"just finish it"*, *"guess"* or anything like it: stop
asking. For every question still open, choose the answer you would recommend, and record each as
an **assumption** — under `## Assumptions` in the item, and as an `@assumption` tag on every
scenario that rests on one. Assumptions count as settled: `sdd-plan` and `sdd-implement` build on
them without stopping. The tag is so the pair can find them again (`grep -rn @assumption features/`)
and check which guesses were wrong.

## 4. Open questions block the feature file

With open questions left, **write the item but not the feature file**: story, rules, examples so
far, and `## Open questions`. Status stays *Backlog*. Tell the pair to take the questions to the
product owner and run `sdd-spec <ID>` again with the answers — or to say "make up the rest".

## 5. Write both copies

Only with no open questions left. Write both, in one step:

**The item.**
- Plane: new request → `workitem` `create` with the config's `planeProjectId`, a short title and
  `description_html`; existing item → `workitem` `update`. Move it to **Todo** (`state` list →
  `workitem` `update` with the state id).
- Markdown: new request → `.sdd/ITEM-<next>/item.md`; existing → update it. `Status: Todo`.

**The feature file** — `features/<id-lowercase>-<slug>.feature`, per `references/gherkin.md`.
Same rules, same examples, same order as the item. Existing file: show the diff and ask before
overwriting.

**The branch.** Create `<pair>/<ID>` from the current `main` (or switch to it if it exists) and
commit the feature file and anything under `.sdd/<ID>/`: `spec: <ID> <title>`. Do not push —
`sdd-implement` pushes.

## 6. Cold read

Dispatch the **spec-reviewer** agent — `spec-reviewer`, or `sdd-lite:spec-reviewer` when the kit
is installed as a plugin. Give it the feature file path and the `.sdd/<ID>/` folder path, and
nothing else. It has not seen this conversation; that is the point.

Show its findings. Each fix the pair accepts goes into **both** copies, then commit again. If the
reviewer finds nothing material, say so.

## 7. Hand off

One message: the ID, where the item is (Plane link or `item.md`), the feature file, any
assumptions, and the next step — `sdd-plan <ID>`.

## Rules

- **One question per message** in §3. Never a list of questions.
- **Propose, don't interview.** Every question has a recommended answer.
- **Never answer an open question yourself** — unless the pair said "make up the rest", and then
  every guess is marked.
- **Both copies, every time.** Never write one without the other (§4 is the one exception: no
  feature file yet).
- **Don't narrate.** No "now I'll read the steps". Do it, then report.
