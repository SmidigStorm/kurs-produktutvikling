# Research: Repository Affordances for Agent Code Quality

**Date**: 2026-08-28 | **Researcher**: nw-researcher (Nova) | **Confidence**: Medium-High | **Sources**: 9 (avg reputation 1.0)

> **Scope.** What a codebase can *carry* — files, conventions, machinery — so that an
> AI coding agent working inside it produces good code. The sibling research covers
> empirical evidence on interventions; this one covers **what to put in the repo and
> how to write it.**

---

## Executive Summary

**The repository side of "agents write good code" has one governing economy: every
advisory artefact costs context on every session, forever, while every mechanical
one costs nothing until it fires.** That single asymmetry explains most of what
follows, and it is supported from both directions — Anthropic states plainly that
CLAUDE.md is "context, not enforced configuration" with "no guarantee of strict
compliance," and three independent arXiv teams find that adding context degrades
repository-task performance before it ever truncates anything. The practical rule:
**prose is for what cannot be checked.** Rationale, pitfalls, domain vocabulary, and
conventions that differ from tool defaults. Everything else belongs in a check, an
exemplar, or nothing.

**The most important finding is the one that argues against the brief.** A controlled
study across four agents and two benchmarks found that repository context files
*reduce* task success rates — by 0.5-2% for generated files — while raising inference
cost 20-23% and adding 2.45-3.92 steps per task. Human-written files helped, but only
by ~4%, and the paper's diagnosis is that they "are often redundant with existing
documentation." This does not overturn the vendor guidance so much as explain it:
Anthropic's own `/doctor` trims exactly the derivable content the study measured as
harmful. The two sources agree on the mechanism and differ on whether real files
avoid it. **For a room of sceptical seniors this is an asset, not a threat** — opening
with the disconfirming evidence and then asking "so what is in the +4% and what is in
the −20%?" is a far stronger framing than a clean story, and it is honest.

**Four things this repo should carry**, in priority order: a ~55-line `CLAUDE.md`
whose every line names a file or a command (drafted in full below); a read-only
`spec-ambiguity-hunter` sub-agent aimed at the planted "position in the queue" trap,
with an explicit instruction not to manufacture findings; the gate catalogue extended
with Anthropic's own four-rung verification ladder (prompt → `/goal` → Stop hook →
reviewer sub-agent) as the composition exercise; and hooks shipped as *text, unwired*,
leading with the contrast between `Blocked: not allowed` and a three-line message
naming the file, the reason and the repair. That last artefact is where this
project's own error-shape finding meets the vendor's mechanism: **a hook author is
hand-writing the agent's repair prompt**, which means the ~45%-versus-~77% repair
band is a design choice, not a property of the tool. The do-not-bother list is
equally load-bearing, and its first entry is the file-tree diagram at the top of
every CLAUDE.md in the world — the very thing Anthropic's own trimmer deletes first.

**Two of the course's central claims are unmeasured, and should be stated as such.**
No evidence was found that independent review beats self-review, nor that agents
imitate in-repo exemplars strongly, nor that smaller files improve agent accuracy.
The mechanisms are documented and plausible; the outcomes are not measured. The
independent-review question in particular is cheap to settle in-house using the
planted ambiguity as a known defect, and belongs on the pre-course experiment list —
which would be the third time this project has found that a sixty-second experiment
outperforms another hour of reading.

---

## Research Methodology

**Search Strategy**: Vendor documentation first (Anthropic Claude Code docs, the
AGENTS.md convention, tool vendors), then industry-leader engineering writing, then
practitioner opinion — explicitly labelled as such.
**Source Selection**: official > technical_docs > industry_leaders. Blog opinion
admitted only where no primary source exists, and labelled.
**Quality Standards**: 3 sources/claim where available; 1 authoritative (vendor docs)
accepted alone for product behaviour claims.

---

## Findings

### Part 1 — Agent instruction files (`CLAUDE.md` / `AGENTS.md`)

#### 1.1 The vendor states plainly that instruction files are *not* enforcement

**Evidence** (verbatim, Anthropic): "Claude treats them as context, not enforced
configuration. To block an action regardless of what Claude decides, use a
PreToolUse hook instead."

And in the troubleshooting section: "CLAUDE.md content is delivered as a **user
message after the system prompt**, not as part of the system prompt itself. Claude
reads it and tries to follow it, but **there's no guarantee of strict compliance**,
especially for vague or conflicting instructions."

And in the managed-settings table: "Settings rules are enforced by the client
regardless of what Claude decides to do. CLAUDE.md instructions shape Claude's
behavior but are not a hard enforcement layer."

**Source**: [Anthropic, "How Claude remembers your project"](https://code.claude.com/docs/en/memory) — Accessed 2026-08-28
**Confidence**: High (authoritative primary source; the vendor describing its own
product's mechanism)
**Analysis**: This is the single most important finding for the course, and it is
*vendor-stated*, not blogger-inferred. It gives the primitive-selection lesson
(§3b of the decisions doc) a citable spine: **"Hook — when it must be *enforced*,
not requested"** is Anthropic's own distinction, in Anthropic's own words. It also
means any classroom claim of the form "but I told it in CLAUDE.md" has a documented
answer: you asked, you did not enforce.

#### 1.2 Size: under 200 lines, and longer files measurably reduce adherence

**Evidence** (verbatim): "**Size**: target under 200 lines per CLAUDE.md file.
Longer files consume more context and reduce adherence." Also: "Claude Code loads a
CLAUDE.md file of up to 4 MiB in full and skips a larger file. **Shorter files
produce better adherence.**" And: "Files over 200 lines consume more context and may
reduce adherence."

**Source**: [Anthropic, memory docs](https://code.claude.com/docs/en/memory) — Accessed 2026-08-28
**Confidence**: High for the recommendation; **Medium for the causal claim**. The
vendor asserts the adherence effect three times but publishes no measurement behind
it. Treat "under 200 lines" as an authoritative *recommendation* and the
dilution mechanism as vendor assertion.
**Analysis**: A ~1000-line teaching repo has no excuse for a 200-line CLAUDE.md.
Budget ~60-80 lines. Note the trap: **`@path` imports do not save context.** Verbatim:
"Splitting into @path imports helps organization but doesn't reduce context, since
imported files load at launch." Students will reach for imports as a size fix; it is
not one.

#### 1.3 Specificity beats exhortation — the vendor gives the exact contrast

**Evidence** (verbatim): "write instructions that are concrete enough to verify. For
example: 'Use 2-space indentation' instead of 'Format code properly'; 'Run `npm
test` before committing' instead of 'Test your changes'; 'API handlers live in
`src/api/handlers/`' instead of 'Keep files organized'."

Also on conflicts: "**if two rules contradict each other, Claude may pick one
arbitrarily.**"

**Source**: [Anthropic, memory docs](https://code.claude.com/docs/en/memory) — Accessed 2026-08-28
**Confidence**: High (authoritative)
**Analysis**: The test is *verifiability*. Every one of the vendor's three good
examples is a statement whose violation you could detect mechanically. That is a
usable editing rule for students: **if you cannot write the check, you have not
written the rule.** This directly connects Part 1 to Part 6 (feedback machinery) and
Part 3 (hooks): a rule that is concrete enough to verify is a rule that *could* be
promoted to a gate.

#### 1.4 What does NOT belong: anything derivable from the codebase

**Evidence** (verbatim, describing `/doctor`'s trim proposal): "it **cuts content
Claude can derive from the codebase, such as directory layouts, dependency lists,
and architecture overviews**, and **keeps pitfalls, rationale, and conventions that
differ from tool defaults.**"

Corroborated by the auto-memory design: "Claude skips anything it can derive from
the codebase, such as architecture, file paths, or debugging fixes."

And the routing rule: "Keep it to facts Claude should hold in every session: build
commands, conventions, project layout, 'always do X' rules. **If an entry is a
multi-step procedure or only matters for one part of the codebase, move it to a
skill or a path-scoped rule instead.**"

**Source**: [Anthropic, memory docs](https://code.claude.com/docs/en/memory) — Accessed 2026-08-28
**Confidence**: High (two independent mechanisms in the same product embody the same
rule, which is stronger than one sentence of advice)
**Analysis**: This is the sharpest editorial rule found in the whole research, and it
is counter-intuitive: **the file-tree diagram everyone puts at the top of their
CLAUDE.md is exactly what the vendor's own trimmer deletes.** The keep-list —
"pitfalls, rationale, and conventions that differ from tool defaults" — is a
three-word content spec. Note the emphasis on *differ from tool defaults*: telling
an agent to do what it would do anyway is pure cost.

#### 1.5 Routing: CLAUDE.md vs `.claude/rules/` vs skills is documented, not folklore

**Evidence**: The vendor documents three containers with distinct load semantics:

| Container | Loads | Vendor's stated use |
|---|---|---|
| `CLAUDE.md` | Every session, unconditionally | "facts Claude should hold in every session" |
| `.claude/rules/*.md` with `paths:` frontmatter | "only load into context when Claude works with matching files" | Instructions scoped to a file type or subdirectory |
| Skills (`SKILL.md`) | "only load when you invoke them or when Claude determines they're relevant" | "task-specific instructions that don't need to be in context all the time" |

Verbatim on the rules/skills boundary: "Rules load into context every session or when
matching files are opened. For task-specific instructions that don't need to be in
context all the time, use skills instead."

**Source**: [Anthropic, memory docs](https://code.claude.com/docs/en/memory) — Accessed 2026-08-28
**Confidence**: High (authoritative product behaviour)
**Analysis**: There is a **three-way** routing decision here, not the two-way one most
teams use. Path-scoped rules are the under-used middle: they cost zero context until
an agent touches a matching file, but unlike a skill they need no invocation
decision. For this repo that maps almost too neatly:
`paths: ["features/**/*.feature"]` for the Gherkin house style,
`paths: ["backend/src/domain/**"]` for the purity rules.
**Caveat worth stating to the room:** this is Claude-Code-specific machinery. The
portable subset is CLAUDE.md/AGENTS.md. Rules and skills are vendor extensions.

#### 1.6 `AGENTS.md` is a convention, not a specification — and Claude does not read it

**Evidence**: agents.md describes itself as "a simple, open format for guiding coding
agents… a **README for agents**." Format: "AGENTS.md is just standard Markdown. Use
any headings you like; the agent simply parses the text you provide." **No fields
are mandatory.** Content guidance: "anything you'd tell a new teammate" — project
overview, build and test commands, code style, testing instructions, security
considerations. Nesting: "Agents automatically read the nearest file in the directory
tree, so the closest one takes precedence."

Anthropic states flatly: "**Claude Code reads `CLAUDE.md`, not `AGENTS.md`.**" The
documented bridge is a one-line import (`@AGENTS.md` at the top of CLAUDE.md) or a
symlink (`ln -s AGENTS.md CLAUDE.md`), with the note that on Windows a symlink
"requires Administrator privileges or Developer Mode, so use the `@AGENTS.md` import
instead."

**Sources**: [agents.md](https://agents.md/) — Accessed 2026-08-28;
[Anthropic, memory docs](https://code.claude.com/docs/en/memory) — Accessed 2026-08-28
**Confidence**: High (two independent primary sources, one per claim)
**Analysis**: Two practical consequences. (1) AGENTS.md has **no schema** — it
prescribes a filename and nothing else. Any blog claiming "the AGENTS.md standard
requires X" is over-reading it; the site says the opposite. (2) The Windows symlink
caveat is a live failsafe-setup hazard for a mixed classroom — if this repo ships
both filenames, use the import, not the symlink. Recommendation for this repo in the
deliverable below: **ship `CLAUDE.md` only.** Portability to other agents is not a
course objective, and a second file is a second thing to drift.

#### 1.7 Two under-known mechanisms worth exactly one line each in class

**Evidence** (verbatim): "Block-level HTML comments (`<!-- maintainer notes -->`) in
CLAUDE.md files are **stripped before the content is injected into Claude's
context**. Use them to leave notes for human maintainers without spending context
tokens on them."

And: "Project-root CLAUDE.md **survives compaction**: after `/compact`, Claude
re-reads it from disk and re-injects it into the session… Nested CLAUDE.md files in
subdirectories and rules with `paths:` frontmatter reload as Claude reads files they
apply to."

**Source**: [Anthropic, memory docs](https://code.claude.com/docs/en/memory) — Accessed 2026-08-28
**Confidence**: High (authoritative)
**Analysis**: The comment-stripping is the **inverse** of the SDD research's borrowed
trick (§4 of the decisions doc: "agent instructions in HTML comments — invisible on
GitHub, readable by the agent"). In feature files and specs, HTML comments *are*
read by the agent; in `CLAUDE.md` they are *stripped*. Same syntax, opposite
behaviour, depending on the file. Worth one slide, because a student who learns the
SDD trick will misapply it to CLAUDE.md and silently lose the instruction.

The compaction fact is the honest answer to "the agent forgot halfway through": root
CLAUDE.md survives; anything said only in chat does not. That is an argument for
writing durable process into files rather than re-prompting — which is the course's
whole thesis, stated by the vendor.

### Part 2 — Skills as house style

#### 2.1 The vendor's own trigger for "make it a skill" is exactly the course's criterion

**Evidence** (verbatim): "Create a skill when you keep pasting the same instructions,
checklist, or multi-step procedure into chat, **or when a section of CLAUDE.md has
grown into a procedure rather than a fact.** Unlike CLAUDE.md content, a skill's body
**loads only when it's used**, so long reference material costs almost nothing until
you need it."

**Source**: [Anthropic, "Extend Claude with skills"](https://code.claude.com/docs/en/skills) — Accessed 2026-08-28
**Confidence**: High (authoritative)
**Analysis**: Decision 31's tree says "**Skill** — the knowledge is reused across
several steps." The vendor's phrasing is sharper and worth adopting verbatim in
class because it gives a *detection rule* rather than a judgement call:
**fact → CLAUDE.md; procedure → skill.** A student can apply that to a line of text
without knowing anything about the codebase. Second criterion, also mechanical:
**does it need to be true in every session, or only during one kind of task?**

#### 2.2 Skills are *not* free once loaded, and the failure mode is documented

**Evidence** (verbatim): "Keep the body itself concise. Once a skill loads, its
content **stays in context across turns**, so **every line is a recurring token
cost.** State what to do rather than narrating how or why, and apply the same
conciseness test you would for CLAUDE.md content."

And on the load lifecycle: "Claude Code **does not re-read the skill file on later
turns**, so write guidance that should apply throughout a task as **standing
instructions rather than one-time steps**."

And the honest failure note: "**If a skill seems to stop influencing behavior after
the first response**, the content is usually still present and the model is choosing
other tools or approaches. Strengthen the skill's `description` and instructions so
the model keeps preferring it, **or use hooks to enforce behavior deterministically.**"

**Source**: [Anthropic, skills docs](https://code.claude.com/docs/en/skills) — Accessed 2026-08-28
**Confidence**: High (authoritative)
**Analysis**: Two things the room will not expect. First, the popular framing
"skills are free because they load lazily" is **half true**: lazy to load, permanent
once loaded. Second — and this is the important one for the course — **the vendor's
own escalation path from "skill" to "hook" is written into its troubleshooting
docs.** "A skill stopped being followed, so use a hook to enforce it
deterministically" is decision 31's ladder, stated by the vendor, in the place a
frustrated practitioner would actually find it. This is a genuinely strong artefact
for the primitive-selection module: the escalation is not a course invention.

Also note "write standing instructions rather than one-time steps." A house-style
skill should read as *invariants* ("error responses use `c.json({ error }, status)`"),
not as *a procedure with a beginning and an end*. That is a concrete drafting rule.

#### 2.3 `description` is load-bearing, and it competes for a hard budget

**Evidence** (verbatim): "All fields are optional. **Only `description` is
recommended so Claude knows when to use the skill.**" Skill discovery works by the
model matching a request against a listing of names and descriptions — so
troubleshooting advice is: "Check the description includes **keywords users would
naturally say**." And if it fires too much: "Make the description more specific."

The budget is explicit: "Claude Code loads a listing of skill names and descriptions
into context… **The budget scales at 1% of the model's context window.** When the
listing overflows, Claude Code **drops descriptions** starting with the skills you
invoke least… **put the key use case first**, since each entry's combined text is
capped at 1,536 characters regardless of budget."

**Source**: [Anthropic, skills docs](https://code.claude.com/docs/en/skills) — Accessed 2026-08-28
**Confidence**: High (authoritative, with specific numbers)
**Analysis**: There is a real, quantified **context cost per skill you own** —
independent of whether you ever invoke it. That is the same lesson the decisions
document already banked from Plane's MCP consolidation (177 tools → 30, §3b:
"tool count is a context cost"). **Two independent vendors, two different primitives,
same economics.** That converts a plausible-sounding claim into a cross-verified
one, and it is a strong argument against the "build a skill for everything" instinct
the course explicitly wants to inoculate against (§3b: "when *not* to reach for one
at all"). It also retroactively justifies setting nWave aside (§6: "151 skills is too
much surface") on measurable grounds rather than taste.

#### 2.4 Skill vs rule vs lint rule: the advisory/enforced distinction

**Evidence**: Synthesising the vendor's three statements — CLAUDE.md and skills are
"context, not enforced configuration"; hooks "apply regardless of what Claude
decides"; settings "are enforced by the client regardless of what Claude decides to
do" — the containers sort onto one axis:

| Container | Enforced? | Cost | Loads |
|---|---|---|---|
| `CLAUDE.md` | Advisory | Always in context | Every session |
| `.claude/rules/` + `paths:` | Advisory | Only when matching files touched | On file access |
| Skill | Advisory | Description always; body once invoked, then permanently | On invocation/match |
| Lint rule / typecheck | **Enforced** *if run* | Zero context until it fails | Never in context |
| Hook | **Enforced unconditionally** | Zero context until it fires | Never in context |

**Source**: [Anthropic, memory docs](https://code.claude.com/docs/en/memory) and
[skills docs](https://code.claude.com/docs/en/skills) — Accessed 2026-08-28
**Confidence**: High for the Claude-Code rows (authoritative). The lint/typecheck row
is this project's own synthesis — **[interpretation, not sourced]**.
**Analysis**: The decisive practical asymmetry is the **cost column, not the
enforcement column.** An advisory convention costs context on every single session
whether or not it is relevant. A lint rule costs *nothing* until it is violated, and
then it produces a file-line-reason error — the ~77% name-error repair band from the
gate-catalogue research rather than the ~45% assertion band.

This yields a rule sharper than "advisory vs enforced":

> **If a convention can be expressed as a check, expressing it as prose is strictly
> worse: you pay context forever for a weaker guarantee.**

Prose is for what cannot be checked — rationale, domain vocabulary, "why we did it
this odd way." That is precisely the vendor's own CLAUDE.md keep-list from §1.4
("pitfalls, rationale, and conventions that differ from tool defaults"), reached
from a different direction. **Two independent derivations, same answer** — the
strongest cross-reference in this document.

**Caution against over-applying it here.** In a ~1000-line teaching repo, a custom
ESLint rule is a *worse* teaching artefact than a sentence, because writing one is a
half-hour detour into AST matching that teaches nothing about process design. The
rule above is right at scale and only partly right here. See the Do Not Bother list.

### Part 3 — Hooks as enforcement

#### 3.1 The vendor's one-sentence definition is the whole lesson

**Evidence** (verbatim): "Hooks are user-defined shell commands. Claude Code runs them
at specific points in its lifecycle, which gives you **deterministic control: certain
actions always happen rather than relying on the LLM to choose to run them.**"

**Source**: [Anthropic, "Automate actions with hooks"](https://code.claude.com/docs/en/hooks-guide) — Accessed 2026-08-28
**Confidence**: High (authoritative)
**Analysis**: "Rather than relying on the LLM to choose to run them" is the exact
distinction decision 31 draws. Use the sentence as-is on the slide; it is the vendor
conceding the limits of its own advisory mechanisms.

#### 3.2 The mechanism worth teaching is not "block" — it is *stderr as feedback*

**Evidence** (verbatim): "**Exit 2**: Claude Code blocks the action. **Write a reason
to stderr.** Where it lands depends on the event: **some events feed it to Claude as
feedback so it can adjust**, others show it to the user."

And in the worked example: `echo "Blocked: dropping tables is not allowed" >&2  #
stderr becomes Claude's feedback`. And: "Claude Code blocks the command and **shows
Claude the guardrail's stderr**."

And from the `.env` example: "Claude Code blocks the edit before it runs and **passes
the script's `Blocked:` message to Claude as feedback.**"

**Source**: [Anthropic, hooks guide](https://code.claude.com/docs/en/hooks-guide) — Accessed 2026-08-28
**Confidence**: High (authoritative; stated three separate times with a code example)
**Analysis**: This is the finding that ties Part 3 to Part 6, and it is the one most
practitioners miss. A hook is usually described as a *veto*. It is better understood
as **a way to inject a precisely-shaped error message into the agent's loop at a
moment you choose.** The blocking is the delivery mechanism; the *message* is the
product.

That lands directly on this project's own finding that **error shape matters**
(gate-catalogue research: name errors ~77% repair, assertion errors ~45%). A hook
author is *writing an error message by hand* — which means they have total control
over the variable that research identified as decisive. The design rule follows
immediately:

> **A blocking hook whose stderr says "not allowed" wastes the mechanism. Say what
> was violated, where, and what to do instead — you are authoring the repair prompt.**

Compare, for the same violation:

```
Blocked: not allowed
```
```
Blocked: backend/src/api/app.ts calls new Date() directly.
Production code must take a Clock (see backend/src/clock.ts) and call clock.now().
Only backend/src/clock.ts may read the wall clock.
```

The second names a file, a reason, and a repair — a name-error-shaped message rather
than an assertion-shaped one. **[Interpretation: the mapping from hook stderr onto
the repair-rate bands is this project's synthesis, not a sourced claim.]**

#### 3.3 Hooks are shell commands with the user's full privileges

**Evidence**: Hooks are configured in settings files and "communicate through stdout,
stderr, and exit codes only." They are arbitrary shell commands running at lifecycle
events. Timeouts are generous: "`command`, `http`, `mcp_tool`: **10 minutes**."
Anthropic ships a separate workspace-trust flow governing hooks in project settings
files (referenced from the memory docs as "the workspace trust rule as hooks in
settings files").

**Source**: [Anthropic, hooks guide](https://code.claude.com/docs/en/hooks-guide) — Accessed 2026-08-28
**Confidence**: High for the mechanism; Medium for the risk framing (this is
partly inference from the existence of the trust flow)
**Analysis**: Two consequences for this repo. (1) A committed `.claude/settings.json`
containing hooks is **executable content shipped to twelve student machines**. That
is a real reason — beyond the stated pedagogical one — for Global Constraint "gates
stay unwired." Worth saying out loud in class: a hook in a repo you cloned runs on
your machine. (2) The 10-minute default timeout means a naively-wired
`PostToolUse: npm test` hook can hang a session for ten minutes. If a pair wires one
in a retro, they should set `timeout` explicitly. That is a genuine, cheap piece of
instructor foreknowledge.

#### 3.4 Where enforcement is over-control

**[Practitioner consensus / this project's judgement — no source found]**
No source was located giving evidence-based guidance on when hooks are *excessive*.
The vendor documents capability, not restraint. The gap is recorded below.

The defensible position, resting on the sourced material above rather than on
opinion: enforcement is warranted when **(a)** the rule is objectively checkable,
**(b)** violation is silent — it does not otherwise produce an error, and **(c)** it
has actually been violated. Condition (c) matters most in a teaching repo. The
vendor's own trigger for writing anything down is "Claude makes the same mistake a
**second** time" (§1.4). Pre-emptive enforcement of a violation that has never
occurred is speculative machinery, and in this repo it also steals the retro moment
decision 31 explicitly reserves: "**Hooks — reached for in a retro once a pair
notices they keep skipping something.**" A hook shipped in the box removes the
noticing.

### Part 4 — Sub-agent review

#### 4.1 The defining property is context isolation, and the vendor enumerates what is lost

**Evidence** (verbatim): "Each subagent runs in **its own context window** with a
custom system prompt, specific tool access, and independent permissions… Use one when
a side task would flood your main conversation with search results, logs, or file
contents you won't reference again: the subagent does that work in its own context
and **returns only the summary.**"

What a subagent *does* receive at startup: its own system prompt, the delegation task
message, "**CLAUDE.md files**: every level of the CLAUDE.md hierarchy the main
conversation loads," git status, preloaded skills, and a sibling roster.

What it does **not** receive: "Subagents also **don't see your conversation history,
skills you've already invoked, or files Claude has already read.**" Also excluded:
output style, the main conversation's auto memory, and the parent's context window
size.

**Source**: [Anthropic, "Subagents"](https://code.claude.com/docs/en/sub-agents) — Accessed 2026-08-28
**Confidence**: High (authoritative)
**Analysis**: This is the mechanism that makes an "independent opinion" independent,
and it is worth being precise about in class, because the independence is **partial
and asymmetric**:

- The reviewer **does not** inherit the reasoning that produced the code — no
  conversation history, no files already read. It cannot be talked into agreeing by
  arguments it never heard. **This is the real value.**
- The reviewer **does** inherit CLAUDE.md — every level of it. So it shares the
  author's *stated standards* while not sharing the author's *rationalisations*.

That combination is close to ideal for review, and it is a designed property rather
than a happy accident. It also produces a warning: **whatever bias lives in your
CLAUDE.md is inherited by your reviewer.** A CLAUDE.md that says "prefer clever
one-liners" yields a reviewer that approves clever one-liners. The reviewer cannot
catch a flaw in the standards themselves.

For the spec-ambiguity hunter (§3b of the decisions doc), this is decisive and
slightly counter-intuitive: it should be given the feature file **and as little
else as possible.** Its job is to read the text the way someone who was not in the
conversation would — which is exactly the failure mode the planted "position in the
queue" ambiguity models. A pair who has been discussing the queue for an hour cannot
un-know their reading. A fresh context can.

#### 4.2 The vendor's shipped reviewer example is a read-only, narrow-tool agent

**Evidence** (verbatim, Anthropic's own documented example):

```markdown
---
name: code-reviewer
description: Expert code review specialist. Proactively reviews code for quality,
  security, and maintainability. Use immediately after writing or modifying code.
tools: Read, Grep, Glob, Bash
model: inherit
---

You are a senior code reviewer ensuring high standards of code quality and security.

When invoked:
1. Run git diff to see recent changes
2. Focus on modified files
3. Begin review immediately
...
```

**Source**: [Anthropic, subagents docs](https://code.claude.com/docs/en/sub-agents) — Accessed 2026-08-28
**Confidence**: High (authoritative example) for the *shape*; the example is
illustrative, and Anthropic publishes no evidence that this particular prompt
outperforms alternatives.
**Analysis**: Three design decisions are visible in the frontmatter alone, and all
three are teachable:

1. **No `Edit`, no `Write`.** The reviewer physically cannot fix what it finds. That
   is what makes it a review rather than a second implementation pass, and it means
   its output must be *legible to a human* rather than silently applied.
2. **`git diff` as the scoping mechanism.** The agent is pointed at *change*, not at
   the codebase. This is what makes a reviewer cheap and focused, and it is the
   single most transferable line in the example.
3. **A checklist body.** The prompt is a list of concrete things to look for, not
   "review this well."

Anthropic also documents a production instance of the same pattern: the
`security-guidance` plugin, described as "hooks that **run a separate model review
and feed findings back into the session**." So the vendor ships this pattern itself,
not merely as documentation. **Note the composition:** a *hook* that triggers a
*sub-agent* whose findings return as *feedback* — three primitives, one mechanism.
That is a strong worked example for the primitive-selection module.

#### 4.3 Self-review vs independent review: no direct evidence found

**[Knowledge gap — see below.]** No source was found within budget that measures
whether an isolated-context reviewing agent catches more real defects than the same
model reviewing its own output in the same context. The mechanism (4.1) makes the
independent case *architecturally* plausible — the reviewer cannot see the reasoning
it would need to be persuaded by — but plausible is not measured.

What can be said with sourcing:
- The **isolation is real and specified**, not marketing (4.1, authoritative).
- Anthropic **ships** an independent-reviewer example and a production plugin built
  on the pattern (4.2), which is evidence of vendor conviction, not of efficacy.

Recommendation: state this honestly to the room. A senior developer who asks "is
there evidence a second agent reviews better than the first one re-reading?" deserves
"no, but here is the mechanism and here is why it is plausible" rather than a
confident answer. **This is also a cheap in-class experiment** — the same shape as the
correction-round experiment already in §5 of the decisions document, and it would
produce the course's own evidence.

### Part 4b — The measured result that contradicts everything in Part 1

#### 4b.1 Instruction files measurably *reduced* success rates in a controlled study

**Evidence** (verbatim from the abstract): "Across multiple coding agents and LLMs,
we find that context files tend to **_reduce_** task success rates compared to
providing no repository context."

Measured effects:

| Condition | Effect on success | Cost effect |
|---|---|---|
| **LLM-generated** context file | **−0.5%** (SWE-bench Lite), **−2%** (AGENTbench) | +20-23% inference cost |
| **Human-written** context file | **+4%** average (helped 3 of 4 agents) | up to **+19%** cost |
| Either | — | **+2.45 to +3.92 extra steps** per task |

Setup: four coding agents (**Claude Code on Sonnet-4.5**, Codex on GPT-5.2 and
GPT-5.1-mini, Qwen Code on Qwen3-30b) across two benchmarks — SWE-bench Lite (300
tasks, popular repos) and AGENTbench (138 instances, 12 niche repos **with
developer-written context files**). Developer-written files averaged **641 words and
9.7 sections**.

A second result matters as much as the first: "**When documentation was removed from
repositories, LLM-generated files outperformed human-written ones by 2.7%**,
suggesting **human files are often redundant with existing documentation.**"

**Source**: ["Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for
Coding Agents?"](https://arxiv.org/html/2602.11988v1), arXiv:2602.11988 — Accessed 2026-08-28
**Confidence**: **Medium.** The study is direct, controlled and recent, and arXiv is
a high-reputation domain — but it is a **preprint**, single-team, self-limited to
"heavily Python," and the effect sizes (−0.5%, −2%, +4%) are small enough that the
138-instance AGENTbench arm is unlikely to separate them from noise. The authors
themselves list benchmark size as a limitation. **No independent replication was
found within budget.**
**Analysis**: This deserves careful handling rather than either burial or
sensationalising, because **the instructor's fear cuts both ways**: a room of
sceptical seniors will respect being shown the disconfirming study far more than
being sold a clean story.

Three things this study does **not** show, which matter for how it is used:

1. **The task is wrong for our purposes.** SWE-bench is *resolve a GitHub issue in a
   repository you did not write.* That is close to the opposite of the course's
   situation: a small repo whose conventions were authored deliberately, by the
   people using it, for work that is about to happen. The measured harm is largely
   **redundancy cost** — the paper says so directly ("human files are often redundant
   with existing documentation"). Redundancy is a property of *those* files, not of
   instruction files as a category.
2. **The mechanism it found is the mechanism the vendor warns about.** The paper's
   harm channel is extra tokens and extra steps for information the agent could get
   otherwise. Anthropic's `/doctor` trimmer removes exactly that class of content:
   "content Claude can derive from the codebase" (§1.4). **The study and the vendor
   guidance are not actually in conflict — they agree on the mechanism and disagree
   only on whether typical files avoid it.** They do not. That is a finding about
   practice, not about the primitive.
3. **The +4% human-written result is the one to quote.** Files written by the people
   who own the repo *helped*, on 3 of 4 agents. The course's repo is the
   human-written case, at its strongest: small, freshly authored, deliberately
   non-redundant.

**What to say in the room**, and it is a genuinely strong moment: *"The best evidence
we have says a typical AGENTS.md makes the agent slightly worse and 20% more
expensive. Human-written ones help by about 4%. So the interesting question is not
'should we have one' — it is 'what is in the 4% and what is in the −20%?'"* That
converts a threatening result into the framing device for the whole repo-affordances
module, and it pre-empts the sceptic by having already made their argument.

**Corroboration on the mechanism** — from a different team, a different task:
"Although recall slightly improves when expanding context limits to 40K tokens,
**model performance decreases**, indicating that current LLMs still struggle to
extract useful information from long contexts in repository-level code development
tasks." ([On the Effectiveness of Context Compression for Repository-Level Tasks](https://arxiv.org/html/2604.13725), arXiv:2604.13725 — Accessed 2026-08-28.)
And from a third: accuracy "reduces significantly at extreme lengths" ([LongCodeBench](https://arxiv.org/html/2505.07897v3), arXiv:2505.07897 — Accessed 2026-08-28).

**Confidence in the underlying mechanism — that added context has a real cost and is
not free — is therefore High**: three independent research teams, two of Anthropic's
own product mechanisms (`/doctor` trimming, auto-memory's derive-skip rule), and the
vendor's repeated adherence warnings all point the same way. **Confidence in the
specific claim "instruction files are net harmful" is Low-to-Medium** and
task-dependent.

### Part 5 — Repo shape

#### 5.1 The stated master constraint is context, and it is stated as degradation not truncation

**Evidence** (verbatim): "**Most best practices are based on one constraint: Claude's
context window fills up fast, and performance degrades as it fills.**" And: "**LLM
performance degrades as context fills.** When the context window is getting full,
Claude may start 'forgetting' earlier instructions or making more mistakes. **The
context window is the most important resource to manage.**"

**Source**: [Anthropic, "Best practices for Claude Code"](https://code.claude.com/docs/en/best-practices) — Accessed 2026-08-28
**Confidence**: High as vendor guidance; the degradation curve itself is
independently supported by the three arXiv results in 4b.1 above, which is a genuine
cross-source agreement between a vendor and disinterested academics.
**Analysis**: The important word is *degrades*, not *truncates*. The naive mental
model — "it fits or it doesn't" — is wrong, and it is the mental model a senior
developer will arrive with. Quality falls off *before* anything breaks, which is why
"it fit in the window" is not the standard. This is the load-bearing justification
for everything else in Part 5.

#### 5.2 Repo shape claims: what is evidenced and what is not

**Honest position first.** No source was found — vendor or academic — that measures
**file size, module boundaries or colocation against agent output quality.** The
frequently-repeated practitioner advice ("keep files under 300 lines so the agent can
hold them") has, as far as this search reached, **no published measurement behind
it.** Recorded as a knowledge gap.

What *can* be supported is the chain of reasoning, with each link sourced:

1. Context is the binding constraint and quality degrades continuously as it fills —
   sourced, 5.1, and cross-verified by 4b.1.
2. Every file read is charged against it. Verbatim: the context window "holds your
   entire conversation, including every message, **every file Claude reads**, and
   every command output" — sourced.
3. Anthropic's own listed failure pattern is uncontrolled reading: "**The infinite
   exploration.** You ask Claude to 'investigate' something without scoping it.
   Claude reads hundreds of files, filling the context" — sourced.
4. Therefore a unit of work that can be understood by reading *few, small* files
   costs less context and leaves more headroom — **[interpretation]**, but a short
   and, I think, safe one.

**Confidence**: High for links 1-3, Medium for the conclusion. The conclusion is
*derived*, not measured. Say so.

**Analysis, and the honest limit of it**: the practical form of the advice is not
"small files" but **"few files per unit of work."** Those come apart, and the
distinction matters here. Splitting `queue.ts` into five files makes each file small
while making the *task* require five reads. Anthropic's own prompting advice cuts the
same way — its worked good-prompt example names **one** exemplar file
("`HotDogWidget.php` is a good example"), not a directory.

The baseline plan already satisfies this without having argued for it: pure domain
logic in `backend/src/domain/queue.ts` with its test beside it, vocabulary in one
`contract/src/index.ts`, the clock alone in `clock.ts`. A pair asking "why does the
queue order that way?" reads one file. **Recommendation: claim this as a property the
repo already has, and do not add structure in its name.** For ~1000 lines, further
decomposition is cost with no evidenced benefit, and a senior developer would
rightly object to its *presence*.

#### 5.3 Colocated tests are supported indirectly, by the same reasoning

The plan already colocates (`queue.ts` / `queue.test.ts`). No source measures this
against agent quality. It follows from 5.2 — the test and the code are one unit of
work — and it has an independent, non-agent justification. **[Practitioner
consensus, not evidenced for agents.]** Do not oversell it in class.

### Part 6 — Feedback machinery

#### 6.1 "Give Claude a way to verify its work" is the vendor's own headline section

**Evidence** (verbatim): "**Claude stops when the work looks done. Without a check it
can run, 'looks done' is the only signal available, and you become the verification
loop: every mistake waits for you to notice it.** Give Claude something that produces
a pass or fail, and the loop closes on its own. Claude does the work, runs the check,
reads the result, and iterates until the check passes."

"The check is anything that returns a signal Claude can read in the conversation: a
test suite, a build exit code, a linter, a script that diffs output against a
fixture, or a browser screenshot."

And in the failure-patterns list: "**The trust-then-verify gap.** Claude produces a
plausible-looking implementation that doesn't handle edge cases. **Fix**: Always
provide verification (tests, scripts, screenshots). **If you can't verify it, don't
ship it.**"

**Source**: [Anthropic, best practices](https://code.claude.com/docs/en/best-practices) — Accessed 2026-08-28
**Confidence**: High (authoritative, and it is the document's first substantive
section — the vendor's own ordering signals priority)
**Analysis**: "Claude stops when the work looks done" is the single best sentence
found for the instructor's problem. It reframes *"agents write bad code"* into
*"agents stop early, and what they stop against is whatever you gave them."* That is
not a defence of agents; it is a statement that **the repository chooses the stopping
condition.** Which is the course's thesis, from the vendor, in one line.

It also independently vindicates decision 12/13's "gate catalogue" framing: the
catalogue is a menu of stopping conditions, and composing it is choosing when the
agent is allowed to believe it is finished.

#### 6.2 The vendor documents a four-rung escalation ladder for verification

**Evidence** (verbatim, paraphrasing the structure with quoted rungs): "Once the
check exists, decide **how hard it gates the stop**:"

1. "**In one prompt**: ask Claude to run the check and iterate in the same message."
2. "**Across a session**: set the check as a `/goal` condition. A separate evaluator
   re-checks it after every turn."
3. "**As a deterministic gate**: a **Stop hook** runs your check as a script and
   **blocks the turn from ending until it passes.** Claude Code overrides the hook
   and ends the turn after **8 consecutive blocks.**"
4. "**By a second opinion**: a verification subagent… **so the agent doing the work
   isn't the one grading it.**"

And: "Each step trades setup for attention. The prompt version works on any task
today. The `/goal` and Stop hook versions are what let an unattended run finish
correctly without you."

**Source**: [Anthropic, best practices](https://code.claude.com/docs/en/best-practices) — Accessed 2026-08-28
**Confidence**: High (authoritative)
**Analysis**: This is **the gate-composition exercise, pre-drawn by the vendor**, and
it is a better teaching object than anything this research could invent, because it
is ordered by *cost of setup* rather than by strength. "Each step trades setup for
attention" is the exact trade-off decision 12/13 wants students to feel.

Two details worth having as instructor foreknowledge:
- **The 8-block override.** A Stop hook is not an absolute gate; after 8 consecutive
  blocks Claude Code ends the turn anyway. A pair who wires a Stop hook on a failing
  test suite will see it give up. Better to know before it happens in the room.
- Rung 4 is the sub-agent reviewer from Part 4, and rung 3 is the hook from Part 3.
  **Three of the five primitives in decision 31's tree appear in one vendor list,
  ordered.** Worth putting on a slide as-is.

#### 6.3 Show evidence, don't assert success

**Evidence** (verbatim): "**Have Claude show evidence rather than asserting success**:
the test output, the command it ran and what it returned, or a screenshot of the
result. **Reviewing evidence is faster than re-running the verification yourself**,
and it works for sessions you weren't watching."

**Source**: [Anthropic, best practices](https://code.claude.com/docs/en/best-practices) — Accessed 2026-08-28
**Confidence**: High (authoritative)
**Analysis**: A one-line CLAUDE.md rule falls straight out of this, and it passes the
§1.3 verifiability test. It is also the cheapest available counter to the
false-confidence trap the SDD research flagged (§4 of decisions): an agent that
pastes `30 passed` is checkable; an agent that says "all tests pass" is not. For a
mixed room this matters doubly — the product person cannot read the code, but they
can read test output.

#### 6.4 Individually runnable checks: supported, and it is vendor advice for a reason

**Evidence** (verbatim, from the vendor's own example CLAUDE.md): "**Prefer running
single tests, and not the whole test suite, for performance.**"

**Source**: [Anthropic, best practices](https://code.claude.com/docs/en/best-practices) — Accessed 2026-08-28
**Confidence**: High (authoritative), though note this is presented as a *performance*
tip rather than a quality one.
**Analysis**: Anthropic puts this in its two-rule example CLAUDE.md — of all the
things it could have chosen to illustrate the format, one of two workflow rules is
about *granularity of feedback*. Decision 12/13's "every check exists as an
individually runnable command" is the repo-side counterpart: the agent cannot prefer
a narrow check if the repo only offers a wide one. **The gate catalogue is therefore
not only a teaching device — it is the affordance that makes this vendor advice
followable.** That is a satisfying, and evidenced, connection.

This also connects to the project's own error-shape finding. Running one test yields
a failure naming one function; running the suite yields a wall of output, most of it
irrelevant context spend. Same defect, different error shape, different repair band.

### Part 7 — Worked examples in-repo

#### 7.1 Pointing at an exemplar is the vendor's own top-tier prompting advice

**Evidence** (verbatim, from the "Provide specific context" table — the *after*
column, i.e. the recommended form):

> "**Reference existing patterns.** Point Claude to patterns in your codebase."
> Before: *"add a calendar widget"*
> After: *"**look at how existing widgets are implemented on the home page to
> understand the patterns. `HotDogWidget.php` is a good example. follow the pattern**
> to implement a new calendar widget… **build from scratch without libraries other
> than the ones already used in the codebase.**"*

**Source**: [Anthropic, best practices](https://code.claude.com/docs/en/best-practices) — Accessed 2026-08-28
**Confidence**: High that this is recommended practice (authoritative). **The
underlying claim — that agents imitate in-repo code strongly — was not found
measured in any source within budget.** Recorded as a knowledge gap.
**Analysis**: Three details in that one example repay attention, and all three are
repo-side rather than prompt-side:

1. **A named file, not a directory.** "`HotDogWidget.php` is a good example." The
   affordance the repo must provide is a *canonical* implementation someone can name.
2. **"follow the pattern"** — the exemplar carries the convention, doing the work a
   paragraph of prose would otherwise do, at zero standing context cost. This is the
   §2.4 economics again: an example in `src/` costs nothing until read; the same
   convention in CLAUDE.md costs every session forever.
3. **"without libraries other than the ones already used"** — the vendor felt the
   need to say this explicitly, which is weak evidence that imitation of *structure*
   does not automatically extend to *dependency restraint*. Worth a line in CLAUDE.md
   for this repo, which has an explicit zero-dependency goal.

#### 7.2 The repo already has its canonical implementations — name them

**Analysis** **[interpretation, grounded in 7.1]**: The baseline plan produces natural
exemplars without having framed them as such. Each is the *first* instance of a
pattern that will be repeated in cycles 1-3:

| Pattern about to be repeated | Canonical file |
|---|---|
| A pure domain rule + its colocated test | `backend/src/domain/queue.ts` + `queue.test.ts` |
| An API route with validation | the `POST /api/visits` route in `api/app.ts` |
| Everything time-dependent | `backend/src/clock.ts` |
| A Gherkin scenario in domain language | `features/queue-position.feature` |
| Vocabulary declared once | `contract/src/index.ts` |

The cheapest possible intervention — one line in CLAUDE.md naming these — is
**exactly the form Anthropic's own good-prompt example takes**, and it costs perhaps
five lines of standing context. Compare against writing out the conventions in prose,
which would cost thirty lines *and* be a second source of truth that can drift from
the code. The exemplar cannot drift from itself.

#### 7.3 The risk nobody mentions: imitation is indiscriminate

**[Interpretation — no source found either way.]** If the mechanism in 7.1 works,
it works on whatever is there. In a ~1000-line repo where every file is likely to be
read, there is no room for a file that is "not how we do it any more." A large
codebase can absorb one bad module; this one cannot.

This has a direct and slightly uncomfortable consequence for §4b of the decisions
document, which proposes imitating Total TypeScript's plural solutions
(`*.solution.1/.2/.3.ts`) to encode "divergent processes are a feature" at filesystem
level. That is a good idea for the **SDD kit and the backlog** — process artefacts —
and a **bad** one inside `src/`, where three sibling implementations of the same
function would be three competing exemplars with nothing marking which to follow.
Keep the plural-solutions device strictly outside the application code. The decisions
document already scopes it that way ("for the rescue SDD kit and the backlog"); this
is a reason to hold that line rather than a new proposal.

---

## Deliverable: what this repo should carry

Prioritised. Each item is tested against the project's standing question: **would a
senior developer object to its absence, and would they object to its presence in a
~1000-line teaching repo?**

---

### P1 — A short `CLAUDE.md` (~55 lines). Draft below, ready to commit.

**Absence**: yes, objectionable — every convention would then be re-explained per
session, and the Global Constraints would exist only in a planning document no agent
loads. **Presence**: no objection at this length. At 200 lines it would become
objectionable, and per 4b.1 probably counter-productive.

Written to the sourced rules: under 200 lines (§1.2, target ~55), every line
verifiable (§1.3), nothing derivable from the codebase (§1.4), exemplars named rather
than conventions described (§7.1), evidence-not-assertion (§6.3).

```markdown
# Legevakt queue — agent instructions

A teaching repository. The application is a vehicle; the subject is the development
process. Prefer the boring, obvious change.

## Commands

- `npm test` — Vitest, unit and integration. Prefer running a single test file.
- `npm run typecheck` — tsc across backend and frontend.
- `npm run reset` — recreate and reseed `data/legevakt.sqlite`.
- `npm run dev` — starts backend (3001) and frontend (5173).

No CI, no git hooks, no deploy. Checks are run by hand, on purpose: composing them
into a policy is the exercise. Do not add `.github/workflows`, husky or lint-staged.

## Non-negotiable rules

- **The clock.** No production code calls `new Date()` or `Date.now()` outside
  `backend/src/clock.ts`. Everything else takes a `Clock` and calls `clock.now()`.
- **The vocabulary.** Triage levels and visit statuses are declared once, in
  `contract/src/index.ts`. Never re-declare them in a schema, a validator or the UI.
- **The estimate is a defined function, never a prediction.** See the doc comment on
  `estimatedWaitMinutes`. If a change makes the same queue return two different
  numbers, the change is wrong.
- **Tests use `:memory:`.** Never point a test at `data/legevakt.sqlite`.
- **`features/` holds `.feature` files only.** Step definitions are code and live in
  `e2e/steps/`. The product person owns `features/` and `specs/`.
- **No new runtime dependencies** without saying so explicitly and why. The backend
  runs on zero-runtime-dependency packages by design.
- **No clinical content.** A visit has a fictional name and a triage level. Nothing
  else, ever.

## Follow these examples

Match the surrounding code rather than introducing a new style. When adding:

- a domain rule → follow `backend/src/domain/queue.ts` and its colocated test
- an API route → follow `POST /api/visits` in `backend/src/api/app.ts`
  (`zValidator` for the body; never `await c.req.json()` directly — it returns 500
  on malformed JSON where the validator returns 400)
- a scenario → follow `features/queue-position.feature`. Domain language, not UI
  mechanics: "the patient sees position 3", not "I click the button".

## Reporting your work

Show evidence, do not assert it. Paste the command you ran and its output. "The
tests pass" is not a result; the Vitest summary is.

If a requirement has two defensible readings, stop and say so rather than picking
one. Write `[NEEDS CLARIFICATION: ...]` in the artefact.
```

Notes on choices a reviewer should be able to challenge:
- **No file tree.** Deliberately: it is the first thing `/doctor` deletes (§1.4).
- **No "write clean code," no "use TypeScript properly."** Unverifiable (§1.3), and on
  Anthropic's explicit exclude list ("self-evident practices").
- **The malformed-JSON parenthetical** is a gotcha that differs from the obvious
  approach — squarely in the vendor's keep-list ("pitfalls… conventions that differ
  from tool defaults"). Its presence is justified where a general style rule's is not.
- **Every rule names a file or a command.** That is the §1.3 verifiability test
  applied as an editing pass, and it is worth demonstrating live: strike any line that
  fails it.

---

### P2 — The reviewer sub-agent, `.claude/agents/spec-ambiguity-hunter.md`

**Absence**: yes, objectionable — decision 31 promises a sub-agent whose value is
*visible in the retro*, and the planted "position in the queue" ambiguity (§3a) is
worthless if nothing hunts it. **Presence**: no objection; it is one file, read-only,
and it does nothing unless invoked.

Built to the shape of Anthropic's own reviewer example (§4.2): no `Edit`/`Write`,
narrow tools, checklist body, scoped at a named artefact rather than the codebase.

```markdown
---
name: spec-ambiguity-hunter
description: Hunts a feature file for rules that have more than one defensible
  reading. Use before implementing a scenario, and after any change to a .feature file.
tools: Read, Grep, Glob
model: inherit
disable-model-invocation: true
---

You read one feature file and hunt for ambiguity. You do not implement, do not
suggest wording, and do not review code quality. You have no edit tools by design.

You have not been part of the conversation that produced this file. That is the
point: read it as a developer who joins on Monday with only this text.

For each rule in the file, ask:

1. Could two competent developers implement this differently and both believe they
   followed it? If yes, give both readings concretely, with a case where they
   produce different observable output.
2. Does it use a word that names a quantity without defining it — "position",
   "wait", "next", "urgent", "soon"? Name the word and ask the question it leaves open.
3. Is there a case the rule does not mention: an empty queue, a tie, the patient
   at the front, a patient who is no longer waiting?
4. Would a passing test for this rule still allow the wrong behaviour to ship?

Report only ambiguities that would change observable behaviour. Style, wording and
Gherkin formatting are out of scope; do not mention them.

Format each finding as:

  RULE: <quote the line from the feature file>
  READING A: <interpretation> -> <observable outcome>
  READING B: <interpretation> -> <observable outcome>
  DIFFERS WHEN: <a concrete situation where A and B disagree>

If you find nothing, say so plainly in one line. Do not manufacture findings.
```

The last two lines exist because Anthropic warns about exactly this failure:
"**A reviewer prompted to find gaps will usually report some, even when the work is
sound, because that is what it was asked to do.** Chasing every finding leads to
over-engineering… Tell the reviewer to flag only gaps that affect correctness."
(Source: [best practices](https://code.claude.com/docs/en/best-practices), accessed
2026-08-28.) That caveat is itself teaching material: **a review agent's precision is
a prompt-design problem, and it is the first thing a pair should tune in a retro.**

`disable-model-invocation: true` is deliberate — it keeps the description out of the
standing context budget (§2.3), and it makes running the hunter **a decision a pair
makes**, which is what makes the retro comparison work. A hunter that fires
automatically proves nothing about process design.

---

### P3 — The gate catalogue as an agent-readable document

Already decided (12/13); the finding that strengthens it is §6.2. The catalogue's
three documented axes — *what it catches, how long it takes, what signal it gives the
agent* — should be joined by a fourth column pointing at the vendor's escalation
ladder, because that is the exercise: **"if you wanted this check to be binding
rather than optional, which rung would you use — prompt, `/goal`, Stop hook, or
reviewer sub-agent?"** Students then compose a policy from a menu with a documented
cost gradient rather than from taste.

Add the 8-consecutive-block override (§6.2) as a footnote. It will otherwise surprise
someone live.

---

### P4 — One path-scoped rule, at most, as a demonstration

`.claude/rules/gherkin.md` with `paths: ["features/**/*.feature"]`. **Value here is
almost entirely pedagogical**: it is the cheapest possible demonstration of the
three-way routing decision from §1.5 (always-loaded / path-scoped / on-invocation),
and the Gherkin house style is genuinely irrelevant to most sessions, so it is an
honest example rather than a contrived one.

```markdown
---
paths:
  - "features/**/*.feature"
---

# Gherkin house style

- Domain language, never UI mechanics. "the patient sees position 3", not
  "I click #position". A scenario should read to someone who has never seen the app.
- One rule per scenario. If the title needs "and", it is two scenarios.
- Given = the world before. When = the one thing that happens. Then = what someone
  can observe. Exactly one When.
- Tag the requirement: `@FR-001`.
- Follow `features/queue-position.feature`.
```

**Would a senior object to its presence?** Possibly, and fairly: it is one small file
of vendor-specific machinery for five rules that could sit in CLAUDE.md. The defence
is that the course is *about* primitive selection, so owning one instance of each
primitive is the point. If it must be cut for simplicity, cut it — the rules move
into CLAUDE.md and cost four lines. Recorded as the weakest of the four
recommendations.

---

### P5 — A `hooks.md` that ships hooks *unwired*, as text

The Global Constraint forbids auto-running gates, and §3.3 gives a second, harder
reason: a committed `.claude/settings.json` with hooks is executable content on
twelve student machines. But §3.2 is too good to lose — the insight that **a hook
author is hand-writing the agent's repair prompt**.

Resolution: ship a `docs/hooks-you-could-wire.md` containing ready-to-paste
configurations that nothing loads. The repo *provides*; the student *composes*. Lead
with the pair below, because the contrast is the entire lesson in four lines:

```bash
# Weak — blocks, and tells the agent nothing it can act on.
echo "Blocked: not allowed" >&2
exit 2
```

```bash
# Strong — names the file, the reason, and the repair.
echo "Blocked: $FILE calls new Date() directly." >&2
echo "Production code must take a Clock and call clock.now()." >&2
echo "Only backend/src/clock.ts may read the wall clock." >&2
exit 2
```

Same enforcement, different error shape — and by this project's own measured figures
that is the ~45% band versus the ~77% band. **The clock rule is the right one to use
for the demonstration**: it is a genuine Global Constraint, it is trivially greppable,
and there is no lint rule for it, so a hook is honestly the right primitive rather
than a contrived one.

---

## Do Not Bother

Each of these is either right at scale and wrong here, or wrong everywhere.

1. **`AGENTS.md` alongside `CLAUDE.md`.** Claude Code does not read it (§1.6);
   bridging costs an import or a Windows-hostile symlink; cross-agent portability is
   not a course objective. A second file is a second thing to drift. *Right at scale
   for a public OSS repo; wrong here.*

2. **A file-tree diagram or architecture overview in `CLAUDE.md`.** Anthropic's own
   `/doctor` trimmer deletes exactly this (§1.4), and it is the redundancy the
   AGENTS.md study measured as harmful (§4b.1). *Wrong everywhere.* The strongest
   single line to cut, because everyone writes it.

3. **A custom ESLint rule for the clock constraint.** Correct at scale — enforced,
   zero standing context, perfect error shape. Here it is a half-hour AST detour that
   teaches nothing about process design, and the payoff arrives once. *Right at
   scale, wrong here.* A grep in a hook (P5) demonstrates the same principle in four
   lines and is honest about being a demonstration.

4. **Wired hooks, husky, lint-staged.** Already excluded by the Global Constraints;
   §3.3 and §3.4 add independent reasons (executable content on student machines;
   pre-empting the retro moment where a pair *notices* they keep skipping something).

5. **Type-aware linting.** The decisions document already records the vendor's own
   figure (~1s → ~8s on 5k files). At ~1000 lines the defect yield is near zero and
   `tsc` already runs. *Right at scale, wrong here.*

6. **A large skill library.** §2.3 quantifies the standing cost: every skill's
   description competes for a budget of ~1% of the context window, and descriptions
   get silently dropped when it overflows. Three or four skills, honestly earned
   (§3b of decisions: triage rules, Gherkin style, migration procedure). *Wrong
   everywhere*, and the reason nWave was set aside (§6).

7. **Configuring Vitest `reporters`.** Already a Global Constraint; restated here
   because it is the exact shape of the trap this research is about — an intervention
   that *looks* like tuning agent feedback and actually disables the vendor's
   agent-optimised reporter.

8. **A `CONTRIBUTING.md` for agents.** Everything it would say belongs in CLAUDE.md,
   which is loaded; `CONTRIBUTING.md` is not. Two files, one truth, one of them read.

9. **Prose descriptions of conventions that an exemplar already carries.** §7.1-7.2:
   naming `queue.ts` costs one line and cannot drift; describing its style costs
   fifteen lines of permanent context and can. *Wrong everywhere.*

10. **An auto-firing review sub-agent.** Beyond the Global Constraint, it destroys the
    thing decision 31 is buying — the retro contrast between the pair that ran the
    hunter and the pair that did not.

---

## Evidenced vs practitioner consensus

**Evidenced — authoritative vendor documentation** (primary source, product
behaviour, quotable):
- CLAUDE.md is context, not enforcement; delivered as a user message; no compliance
  guarantee (§1.1)
- Target under 200 lines; imports do not reduce context; 4 MiB hard skip (§1.2)
- Specificity beats vagueness; contradictions resolved arbitrarily (§1.3)
- Content derivable from the codebase should be cut (§1.4)
- Three-way routing: CLAUDE.md / path-scoped rules / skills, with distinct load
  semantics (§1.5)
- Claude Code does not read AGENTS.md; AGENTS.md prescribes no schema (§1.6)
- HTML comments stripped from CLAUDE.md; root CLAUDE.md survives compaction (§1.7)
- Skill bodies persist once loaded and are re-charged every turn (§2.2)
- Skill descriptions compete for ~1% of the context window and are silently truncated
  (§2.3)
- Hooks are deterministic; exit 2 stderr is fed to the model as feedback (§3.1-3.2)
- Sub-agents get CLAUDE.md but not conversation history or files already read (§4.1)
- The four-rung verification ladder, and the 8-block Stop-hook override (§6.2)

**Evidenced — independent academic** (arXiv preprints; Medium confidence
individually, High for the shared mechanism):
- Context files reduced success ~0.5-2% (generated) / raised it ~4% (human-written),
  at +20-23% cost and +2.45-3.92 steps (§4b.1)
- Human-written context files are frequently redundant with existing docs (§4b.1)
- More context is not monotonically better; performance falls before truncation
  (§4b.1, corroborating §5.1)

**Practitioner consensus / vendor opinion without published measurement** — believe
it, but do not present it as evidence:
- That shorter instruction files *cause* better adherence. Asserted repeatedly by the
  vendor; no measurement published. The mechanism is independently plausible.
- That pointing at an exemplar works because agents imitate in-repo code. It is the
  vendor's own recommended prompt form, but the imitation strength is unmeasured.
- That an independent reviewer outperforms self-review. Architecturally motivated
  (§4.1), shipped by the vendor (§4.2), **not measured** (§4.3).

**This project's own interpretation — labelled, not sourced:**
- The mapping from hook stderr shape onto the ~45%/~77% repair bands (§3.2)
- "If a convention can be expressed as a check, prose is strictly worse" (§2.4)
- "Few files per unit of work" beating "small files" (§5.2)
- That indiscriminate imitation argues against plural solutions inside `src/` (§7.3)

## Source Analysis

| Source | Domain | Reputation | Type | Access date | Cross-verified |
|---|---|---|---|---|---|
| Claude Code — memory / CLAUDE.md | code.claude.com | High (1.0) | Official vendor | 2026-08-28 | Y (§1.2 size claim partly corroborated by arXiv:2602.11988; routing corroborated by skills docs) |
| Claude Code — skills | code.claude.com | High (1.0) | Official vendor | 2026-08-28 | Y (context-budget economics corroborated by Plane MCP tool-consolidation finding, decisions §3b) |
| Claude Code — hooks guide | code.claude.com | High (1.0) | Official vendor | 2026-08-28 | Y (enforcement/advisory split stated identically in memory docs and best practices) |
| Claude Code — subagents | code.claude.com | High (1.0) | Official vendor | 2026-08-28 | Y (reviewer pattern restated in best practices) |
| Claude Code — best practices | code.claude.com | High (1.0) | Official vendor | 2026-08-28 | Y (context-degradation claim corroborated by three arXiv papers) |
| agents.md | agents.md | High (1.0) | Official spec site | 2026-08-28 | Y (Anthropic independently confirms Claude Code ignores the file) |
| "Evaluating AGENTS.md" (arXiv:2602.11988) | arxiv.org | High (1.0) domain; **preprint** | Academic | 2026-08-28 | Partial — mechanism corroborated by arXiv:2604.13725 and 2505.07897; **headline result not replicated** |
| "Context Compression for Repository-Level Tasks" (arXiv:2604.13725) | arxiv.org | High (1.0) domain; preprint | Academic | 2026-08-28 | Y (agrees with 2602.11988 and vendor on the degradation mechanism) |
| LongCodeBench (arXiv:2505.07897) | arxiv.org | High (1.0) domain; preprint | Academic | 2026-08-28 | Y |
| Prior project research (gate catalogue, SDD kit, reconciliation) | local | — | Internal | 2026-08-28 | Used only as this project's own prior findings, labelled as such |

Reputation: High 9/9 cited external sources (100%). **Average reputation 1.0.**
Zero medium-trust or excluded sources were used. Six SEO-flavoured "best CLAUDE.md
practices 2026" style results were visible in search and **were not opened or
cited** — consistent with the provenance warning already recorded in decisions §4.

**Bias note.** Six of nine external sources are Anthropic documenting its own
product. For *product behaviour* (what a hook does, what a sub-agent loads) that is
the correct primary source and self-interest is not a concern. For *efficacy* claims
(does a shorter CLAUDE.md work better) Anthropic has a clear interest in its own
mechanisms working, and publishes no measurement. Those claims are marked Medium
throughout, and the one genuinely disinterested measurement found (§4b.1) **points
the other way.** This asymmetry is the most important caveat in the document.

## Knowledge Gaps

### Gap 1: No measurement of file size or module boundaries against agent output quality
**Issue**: The widely-repeated advice to keep files small so an agent can "hold a
unit in context" has no measurement behind it that this search reached.
**Attempted**: arXiv searches on repository-level code generation and long context;
Anthropic best-practices and large-codebases documentation. Found the *context
degradation* premise well supported (§5.1, §4b.1) but never the *file-granularity
conclusion*. **Recommendation**: present the reasoning chain (§5.2) and label the
conclusion as derived. Do not restructure the repo on it. This is cheap to measure
in-house if it ever matters.

### Gap 2: No evidence on self-review vs independent-context review
**Issue**: The central justification for a reviewer sub-agent is unmeasured (§4.3).
**Attempted**: vendor docs (which assert it), and the same arXiv searches.
**Recommendation**: **add it to the pre-course experiment list in §5 of the decisions
document.** It is the same shape as the correction-round experiment already planned,
would take under an hour using the planted ambiguity as the known defect, and would
convert the course's second-most-important claim into its own measured evidence. The
first experiment already exists precisely because "small experiments beat more
reading" — this is the same conclusion in a new location, for the third time.

### Gap 3: Imitation strength is unmeasured
**Issue**: Whether and how strongly agents imitate in-repo code — brief item 7 — was
not found measured. Only the vendor's recommended prompt form (§7.1).
**Attempted**: search on code-generation style consistency and in-context exemplars.
**Recommendation**: treat the seed-example recommendation (P2 in the CLAUDE.md draft,
§7.2) as low-cost and low-risk rather than evidence-backed. It costs five lines.

### Gap 4: No independent replication of the AGENTS.md study
**Issue**: A single preprint carries the only direct measurement of the central
question. Effect sizes are small relative to benchmark size.
**Attempted**: search returned no replication or rebuttal.
**Recommendation**: cite it honestly with its limitations. Do not build a course
claim that depends on it being right — build one that survives either way, which is
what the framing in §4b.1 does.

### Gap 5: Restraint guidance is entirely absent from vendor documentation
**Issue**: Every vendor page documents capability. None documents when a mechanism is
over-control. §3.4's position is this project's judgement.
**Analysis**: This is unsurprising and worth naming in class — **a vendor has no
incentive to publish "do not use our feature."** The course's most distinctive claim
(decision 31: "most valuably, when *not* to reach for one at all") is therefore
supported by nobody's documentation, which is a reason it is worth teaching, not a
reason to soften it. But it must be presented as a considered position, not as
sourced fact.

## Conflicting Information

### Conflict 1: Do agent instruction files help or hurt?
**Position A — they help, if written well.** Anthropic devotes substantial
documentation to writing CLAUDE.md effectively, with the size, specificity and
content rules quoted in §1.2-1.4. Source: [Claude Code memory
docs](https://code.claude.com/docs/en/memory) and [best
practices](https://code.claude.com/docs/en/best-practices), reputation 1.0.

**Position B — they measurably hurt on average.** "Context files tend to *reduce*
task success rates compared to providing no repository context," at +20-23%
inference cost. Source: [arXiv:2602.11988](https://arxiv.org/html/2602.11988v1),
reputation 1.0 (preprint).

**Assessment**: **The conflict is narrower than it looks, and resolving it produces
the document's best teaching moment.** The paper's harm mechanism is redundancy and
token cost — the paper states human files "are often redundant with existing
documentation." Anthropic's `/doctor` trimmer removes precisely that class of
content, and its auto-memory explicitly skips "anything it can derive from the
codebase." **Both sources agree that derivable content in an instruction file is
harmful.** They differ on the empirical question of whether real files avoid it. The
paper says they mostly do not; the vendor says they should.

Weighing: for *this repo*, the human-written condition (+4%, helped 3 of 4 agents) is
the applicable one, and the task shape in both benchmarks — fix an issue in an
unfamiliar repository — is materially different from ours. Position A wins on
applicability; Position B wins on directness of measurement and on the humility it
imposes. **Net recommendation: a short instruction file, aggressively pruned, and a
willingness to say in the room that the best available evidence is unflattering.**
Neither position supports the 200-line CLAUDE.md most teams actually have.

### Conflict 2: Is a skill or a lint rule the right container for a convention?
**Position A**: the advisory/enforced distinction — a skill is advisory, a lint rule
is enforced; enforcement is stronger, therefore preferable for anything checkable.
Derived from Anthropic's own enforcement language (§2.4).
**Position B**: in a ~1000-line teaching repo, a custom lint rule is a worse artefact
than a sentence, because building one teaches AST matching rather than process
design.
**Assessment**: Not a factual conflict but a **scale-dependent** one, and both are
correct in their domain. Recorded rather than resolved, because the standing test
("right at scale, wrong here") is exactly the judgement the course wants students to
practise. Position A goes on the slide; Position B governs what gets committed.

## Recommendations for Further Research

1. **Run the independent-review experiment** (Gap 2). Highest value per hour of any
   open item, uses an asset that already exists (the planted ambiguity), and produces
   evidence for the course's own second claim.
2. **Measure this repo's CLAUDE.md the way §4b.1 measured theirs.** Run one backlog
   item with and without it. n=1 is not science, but it is a live demo, and it is the
   same "cheap empirical check beats more reading" lesson the project has now learned
   three separate times (§4a, §4b, and Gap 2 above).
3. **Watch for replication of arXiv:2602.11988** before the course. A rebuttal or a
   confirmation materially changes how §4b.1 should be presented.

## Full Citations

[1] Anthropic. "How Claude remembers your project". Claude Code Documentation. https://code.claude.com/docs/en/memory. Accessed 2026-08-28.
[2] Anthropic. "Extend Claude with skills". Claude Code Documentation. https://code.claude.com/docs/en/skills. Accessed 2026-08-28.
[3] Anthropic. "Automate actions with hooks". Claude Code Documentation. https://code.claude.com/docs/en/hooks-guide. Accessed 2026-08-28.
[4] Anthropic. "Subagents". Claude Code Documentation. https://code.claude.com/docs/en/sub-agents. Accessed 2026-08-28.
[5] Anthropic. "Best practices for Claude Code". Claude Code Documentation. https://code.claude.com/docs/en/best-practices. Accessed 2026-08-28.
[6] "AGENTS.md — a simple, open format for guiding coding agents". https://agents.md/. Accessed 2026-08-28.
[7] "Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?". arXiv:2602.11988. https://arxiv.org/html/2602.11988v1. Accessed 2026-08-28. [Preprint]
[8] "On the Effectiveness of Context Compression for Repository-Level Tasks: An Empirical Investigation". arXiv:2604.13725. https://arxiv.org/html/2604.13725. Accessed 2026-08-28. [Preprint]
[9] "LongCodeBench: Evaluating Coding LLMs at 1M Context Windows". arXiv:2505.07897. https://arxiv.org/html/2505.07897v3. Accessed 2026-08-28. [Preprint]

Internal, cited as this project's own prior findings rather than as external evidence:
`docs/course-design-decisions.md`; `docs/superpowers/plans/2026-08-28-app-baseline.md`;
`docs/research/tooling/gate-catalogue-comprehensive-research.md` (repair-rate bands,
arXiv:2604.10508; Gao/Bird/Barr ICSE 2017).

## Research Metadata

Examined: 9 external sources | Cited: 9 | Cross-references: 12 | Excluded without
opening: ~6 SEO/AI-generated results | Confidence distribution: High ~65%,
Medium ~25%, Low/interpretation ~10% (labelled inline) |
Output: `docs/research/methodology/repo-affordances-for-agent-quality-research.md`
