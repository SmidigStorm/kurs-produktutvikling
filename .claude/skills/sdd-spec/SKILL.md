---
name: sdd-spec
description: "Use when a feature request needs turning into a spec. The user pastes a feature request, names a work item such as LEGE-3 or ITEM-2, asks to specify, define or write requirements, rules, examples, scenarios or acceptance criteria, or says 'spec this'. First step of the kit: spec, plan, tasks, implement. Writes the rules and examples to the work item (Plane or .sdd/<ID>/item.md) and to a Gherkin feature file, together."
---

<!-- Copied from skald-sdd/plugins/sdd-lite by scripts/sync-sdd-lite.sh — edit there, not here. -->

# Spec

Turn one feature request into rules and concrete examples a developer could build without guessing,
in the work item and the feature file at once.

A short Example Mapping session with the pair: you propose, they decide. It runs in one of two
ways, and the pair picks which: an **interview**, one question at a time, or a **workshop dump**,
where the pair pastes what a requirements workshop produced and you work from that.

Read `references/backlog.md` first for the config, the item template and both backlog modes, and
`references/gherkin.md` before writing a scenario.

## 1. Setup

Read `.sdd/config.json`; if it is missing, create it as `references/backlog.md` describes.

Find the request. It is one of:

- **An ID** such as `LEGE-3` or `ITEM-2`. Read the item: in Plane with `workitem`
  `retrieve_by_identifier`, or `list` with the config's `project_id` if the pair only remembers the
  title; in markdown mode from `.sdd/<ID>/item.md`. Rules already there means a *revision*: start
  from what it says.
- **Text**, a pasted feature request. The item is created when you write in §5, not before.

Read in parallel every file in `features/`, for the phrasing to reuse and what the app already does,
plus the item if there is one. Do not read the application code or `e2e/steps/`: code pulls the spec
toward whatever the app does today, and `sdd-implement` writes whatever steps the scenarios need.

## 1a. Interview or workshop dump

Ask once, before proposing anything: **"Interview, or do you have notes from a requirements
workshop to paste?"** Recommend the interview when all you have is a short request, and the dump
when the pair says they have talked it through with the product owner already.

- **Interview:** §2, then §3, one question per message.
- **Workshop dump:** the pair pastes the notes, in whatever shape they are: decisions, examples,
  a transcript, a photo's worth of sticky notes typed up. Read them the way you read the item.
  Then §2 as usual, but everything the notes settle is stated as fact and credited to the
  workshop, and the unclear list holds only what the notes do not settle. Instead of §3, put that
  whole list in **one message**, each question with your recommended answer, and take the answers
  in one reply. "Don't know" still becomes an open question, and "make up the rest" still works.

Either way the result is the same: the rules and examples, written to both copies in §5.

## 2. Propose

In one message, propose:

- the story, as "as a …, I want …, so that …"
- the rules: the smallest set that makes the request testable, and what you left out
- one or two examples per rule, as Gherkin, in the phrasing the existing feature files use
- what is unclear

State as fact anything you can find out by reading the features, the steps or the item. Only what
you cannot find out, and that would change what gets built, is unclear.

## 3. Ask, one question at a time

Interview mode only; the workshop dump takes its questions in one message (§1a). Work through the
unclear list one question per message. Each question carries your recommended
answer and one line of why, so the pair can just say yes.

"Don't know" is a good answer: it becomes an open question for the product owner, in the pair's
words, specific enough to answer in one sentence ("Do two red arrivals keep their arrival order?",
not "clarify the red rule").

Fold each answer into the rules and examples as you go. Stop when the list is empty.

### Make up the rest

If the pair says *"make up the rest"*, *"just finish it"*, *"guess"* or anything like it, stop
asking. Choose the answer you would recommend for every question still open and record it as an
assumption: under `## Assumptions` in the item, and as an `@assumption` tag on every scenario
resting on one. Assumptions count as settled, so `sdd-plan` and `sdd-implement` build on them
without stopping. The tag lets the pair find them again (`grep -rn @assumption features/`) and
check which guesses were wrong.

## 4. Open questions block the feature file

While open questions are left, write the item but not the feature file: story, rules, examples so
far, and `## Open questions`. Status stays *Backlog*. Tell the pair to take the questions to the
product owner and run `sdd-spec <ID>` again with the answers, or to say "make up the rest".

## 5. Write both copies

Only once no open questions are left. Both in one step:

**The item.**
- Plane: a new request is `workitem` `create` with the config's `planeProjectId`, a short title and
  `description_html`; an existing item is `workitem` `update`. Move it to Todo by reading `state`
  `list` and passing the state id to `workitem` `update`.
- Markdown: `.sdd/ITEM-<next>/item.md` for a new request, an update for an existing one.
  `Status: Todo`.

**The feature file**, at `features/<capability>.feature`, named for the capability in two or three
words (`triage-explanation.feature`, not the item's ID or title), following
`references/gherkin.md`. Same rules, same examples, same order as the item. If the file exists, show
the diff and ask before overwriting.

**The branch.** Settle it as `references/backlog.md` describes: stay on whatever branch the pair is
on, and only from `main` create `<pair>` and switch. Then commit the feature file and anything under
`.sdd/<ID>/` as `spec: <ID> <title>`. Do not push; `sdd-implement` pushes.

## 6. Cold read

Dispatch the spec-reviewer agent, `spec-reviewer`, or `sdd-lite:spec-reviewer` as a plugin. Give it
the feature file path, the `.sdd/<ID>/` folder path and, in Plane mode, the item's text: read it
back with `workitem` `retrieve_by_identifier` and `fields: description_html`, pasted into the brief,
because the agent has no Plane tools. Nothing else. It has not seen this conversation, which is the
point.

Then apply the fixes yourself, before showing anything. For every finding, choose the answer you
would recommend and write it into both copies. A finding that only tightens what was already decided
(a missing assertion, a word the prose and the scenario disagree on) is just applied. One that
settles something the pair never decided is applied *and* recorded as an assumption, as in "Make
up the rest". One that would widen the item is not applied; list it as a candidate item. Commit
again as `spec: <ID> after review`.

Then show the pair one table: each finding, what you changed for it (or "left out, candidate
item"), and whether it is an assumption. Anything they change goes into both copies and is
committed. If the reviewer finds nothing material, say so.

## 7. Hand off

One message: the ID, where the item is (a Plane link or `item.md`), the feature file, any
assumptions, and the next step, `sdd-plan <ID>`.

## Rules

- **One question per message** in §3, never a list.
- **Propose, don't interview.** Every question carries a recommended answer.
- **Never answer an open question yourself,** unless the pair said "make up the rest", and then
  every guess is marked.
- **Both copies, every time.** §4 is the only exception, where there is no feature file yet.
- **Don't narrate.** No "now I'll read the steps". Do it, then report.
