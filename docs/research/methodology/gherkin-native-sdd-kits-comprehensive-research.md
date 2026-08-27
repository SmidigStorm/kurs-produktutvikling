# Research: Gherkin-Native Spec-Driven Development Kits for AI Coding Agents

**Date**: 2026-08-27 | **Researcher**: nw-researcher (Nova) | **Confidence**: High | **Sources**: 18 cited (~24 examined)

**Verdict: WRITE FROM SCRATCH.** No Gherkin-native spec-driven prompt kit exists. Adopt
nothing; steal ~15 specific ideas (see [Borrowable Ideas](#borrowable-ideas)).

## Executive Summary

**Nothing out there fits. Write the six markdown files.** The survey found no
BDD/Gherkin-flavoured spec-driven prompt kit anywhere in the field, and the absence is
well-triangulated rather than a search failure: three independent attempts to map the
SDD landscape — a 2026 synthesis field study covering SpecKit, Kiro, OpenSpec and BMAD;
the martinfowler.com `exploring-gen-ai` memo index; and Thoughtworks' own 2026
Structured-Prompt-Driven Development article — each fail to mention Gherkin or `.feature`
files at all. The entire mainstream SDD field is prose-spec-first. The strongest single
data point is OpenSpec, the lightest and best-rated kit in the field, which shares the
course's values (fluid, iterative, low-friction) and *still deliberately invented its own
plain-markdown "Scenario" format rather than use Gherkin*. When the most sympathetic
candidate rejects the target format on purpose, adaptation is not a live option.

Every candidate also fails the course's hard constraints before Gherkin is even reached.
All of them require a global install (`uv tool install`, `npm install -g`, a plugin, or a
vendor IDE), which is a direct strike against zero-install and a new failure mode in a
setup path that must stay failsafe. All of them blow the 20-minute readability budget:
SpecKit ships six core plus four optional commands behind a four-level template override
stack and has been independently measured at ~1,300 markdown lines for a simple feature;
OpenSpec has 7+ commands and 15+ guides; BMAD has 12+ agent personas. And all of them are
*installed rather than authored*, which inverts the course's pedagogy — students are
meant to build the process, and anything the repo prescribes steals an exercise. SpecKit
specifically is confirmed as the right thing to have dropped: it shipped roughly one
release every 2–3 days through July–August 2026 and its maintainers explicitly reframed
v1.0 as *not* a stability guarantee. Worse, the one BDD-flavoured SpecKit extension that
exists (`spec-kit-reqnroll-bdd`, 2 stars, .NET/Reqnroll) generates `.feature` files
*downstream* from prose acceptance criteria — mechanising BDD's best-known anti-pattern,
scenarios written after the fact as test artifacts. Adopting it would make the course
demonstrate the very failure modes it is trying to teach students to avoid.

The research does not change the plan structurally — decisions 5, 6 and 7 are all
empirically vindicated — but it strengthens the argument and exposes one flank. The
**strongest reframing available**: the number-one consensus failure mode across the whole
SDD field is spec drift *"with no enforcement mechanism"*, and Böckeler's finding that
even SpecKit "behaves spec-first in practice" despite spec-anchored rhetoric shows prose
specs cannot self-enforce. An executable `.feature` file **is** the enforcement mechanism
— drift surfaces as a red test instead of a stale document nobody re-reads. Gherkin-native
is therefore not a tidiness preference but a direct structural answer to the field's
top-reported failure, which is a far better opening argument to students than "avoid two
documents". The **exposed flank** is *false confidence* — a wrong-but-reviewed spec
gaining authority — which executability makes worse, not better, since a green suite on
the wrong scenario is very convincing. Two cheap mitigations are proposed: have the
product person read the `.feature` file aloud to the developer before implementing
(three-amigos in miniature, zero new artifacts), and seed one prepared backlog feature
with a deliberately ambiguous rule so a pair ships the wrong thing and discovers it in
the retro. Finally, with no CI (decision 11), the local gate catalogue becomes
load-bearing rather than optional: it is the only thing pinning spec to code. Roughly
fifteen concrete borrowable ideas survive — the best being SpecKit's inline
`[NEEDS CLARIFICATION: ...]` marker, its `*(mandatory)*` section markers and HTML-comment
agent instructions, stable `FR-001`-style IDs re-expressed as Gherkin `@tags` (giving
traceability without a separate matrix), and OpenSpec's delta-spec change proposals for
the rule-amendment exercise.

## Research Question

## Research Question

Does a BDD/Gherkin-flavoured spec-driven prompt kit already exist that we could
adapt, rather than inventing a repo-local one from scratch for the course?

Evaluation criteria (from course design decisions):
1. **Readability** — whole method understandable in ~20 minutes by a mixed room.
2. **Zero install** — repo-local markdown; CLI installs and global state are strikes.
3. **Adaptability** — students modify the kit as the exercise; generated/rigid artifacts are a poor fit.
4. **Honest verdict** — "write six markdown files" is an acceptable conclusion.

## Research Methodology

**Search Strategy**: Five parallel lines. (1) Primary-source interrogation of SpecKit —
repo README, releases page, and the raw `spec-template.md` — to establish its actual
template surface and churn rather than its marketing. (2) Landscape survey via the
`spec-driven-development` GitHub topic and 2026 survey articles to enumerate competing
kits. (3) Targeted hunt for Gherkin-flavoured variants: SpecKit BDD extensions, community
Claude Code SDD plugins, `playwright-bdd` agent skills. (4) Authority check on
martinfowler.com, Thoughtworks and InfoQ for prior art and critique. (5) Official
Cucumber documentation plus the canonical InfoQ anti-patterns piece for the BDD failure
modes. Where a Gherkin-native kit was expected but absent, the absence was deliberately
re-tested from independent angles before being reported as a finding (see B2).

**Source Selection**: Types: official/primary (GitHub repos, release pages, raw template
files, cucumber.io docs), industry authority (martinfowler.com, infoq.com), synthesis
study, practitioner experience report. Vendor blogs and mirrors were admitted only for
claims independently confirmed elsewhere, and are flagged with their bias in Source
Analysis. Excluded-tier domains were not used.

**Quality Standards**: Target 3 sources/claim (min 1 authoritative) | 12 of 16 findings
cross-referenced | Weighted average reputation ≈ 0.72 | Facts vs. interpretation labelled
inline; interpretive passages marked *(interpretation)* or *(analysis)*.

## Findings

### Part A — GitHub SpecKit

#### A1: SpecKit is a CLI-installed toolkit that vendors templates into your repo

**Evidence**: The repository describes itself as "an open source toolkit for building
high-quality software with any AI coding agent — a ready-to-use spec-driven process."
Install is `uv tool install specify-cli` then `specify init my-project --integration <agent>`.
Templates are vendored into the user's repository at init time, "enabling offline
customization and project-specific governance without external dependencies."
Licence: **MIT**. Claims 30+ agent integrations (`specify integration list`).
**Source**: [github/spec-kit](https://github.com/github/spec-kit) — Accessed 2026-08-27
**Confidence**: High (primary source, official GitHub-owned repo)
**Analysis**: The CLI install is a direct strike against the *zero install* criterion.
`uv tool install` adds a global Python tool to every student machine — a new failure
mode in a setup path the course design explicitly wants to keep failsafe
(decision 25/"failsafe setup"). Note however that once vendored, the artifacts *are*
plain markdown in the repo, so the vendored output is closer to the target shape than
the delivery mechanism is.

#### A2: The command set is spec → plan → tasks → implement, plus quality add-ons

**Evidence**: Core commands are `/speckit.constitution`, `/speckit.specify`,
`/speckit.plan`, `/speckit.tasks`, `/speckit.implement`, `/speckit.converge`, with
optional `/speckit.clarify`, `/speckit.analyze`, `/speckit.checklist`.
**Source**: [github/spec-kit](https://github.com/github/spec-kit) — Accessed 2026-08-27
**Confidence**: High
**Analysis**: This confirms the course's chosen starting spine (`spec → plan → task →
implement`) matches the de-facto industry shape. That is a *validation of the course's
own design*, independent of whether SpecKit itself is adopted. The add-on commands
(`clarify`, `analyze`, `checklist`, `converge`) are a useful menu of "what a process
step could be" for the improvement cycles — students inventing their own second-cycle
step could be pointed at this list.

#### A3: SpecKit's spec template uses prose Given/When/Then inside a markdown spec, NOT .feature files

**Evidence**: The spec template is copied to `specs/[###-feature-name]/spec.md` on
`/speckit.specify`. It enforces prioritized user stories (P1/P2/P3), each with
"Acceptance Scenarios" in **Given/When/Then format written inline in markdown**,
plus `FR-NNN` functional requirements, `SC-NNN` success criteria, and a
`[NEEDS CLARIFICATION: ...]` marker pattern.
**Source**: [Document Templates — github/spec-kit (DeepWiki)](https://deepwiki.com/github/spec-kit/12.1-document-templates) — Accessed 2026-08-27
**Verification**: Consistent with the command list in [github/spec-kit](https://github.com/github/spec-kit)
**Confidence**: Medium-High (DeepWiki is a generated mirror of the repo, not the repo
itself — treated as secondary; cross-checked against the primary repo README)
**Analysis**: This is the crux. SpecKit is *Given/When/Then-shaped but not
Gherkin-native*. Its acceptance scenarios live inside a prose spec document. That is
**precisely the two-artifact topology the course rejected in decision 5** — a prose
spec that restates the same rules a feature file would hold. Adopting SpecKit's spec
template unmodified would have the course actively demonstrate the drift failure mode
it is trying to teach students to avoid.

#### A4: Templates are overridable at four priority levels — the customisation surface is real

**Evidence**: "Templates follow a priority stack: project-local overrides
(`.specify/templates/overrides/`) override presets, which override extensions, which
override core defaults. Templates resolve at runtime, allowing organizations to
customize specifications, plans, and task formats without forking the project."
**Source**: [github/spec-kit](https://github.com/github/spec-kit) — Accessed 2026-08-27
**Confidence**: High
**Analysis**: Answering the brief's question directly: **yes, `/specify` can in
principle be made to emit `.feature` files**, by placing a replacement spec template in
`.specify/templates/overrides/`. But this is a *pyrrhic* yes. To make it Gherkin-native
you would override the spec template (the entire acceptance-criteria section), and then
the plan and tasks templates that consume its structure — at which point you have
authored the same markdown you would have written from scratch, and inherited a CLI
dependency and an override-resolution mechanism students must also understand.
The four-level priority stack is itself a readability cost: a student asking "what does
`/speckit.specify` actually do?" must resolve overrides → presets → extensions → core.

#### A5: Release cadence is every 2-3 days; the template format is explicitly not promised to be stable

**Evidence**: Releases observed: v1.0.1 and v1.0.0 (both 2026-08-21), v0.16.5
(2026-08-19), v0.16.4 (2026-08-14), v0.16.3 (2026-08-13), v0.16.2 (2026-08-10),
v0.16.1 (2026-08-07), v0.16.0 (2026-08-05), v0.15.2 (2026-08-03), v0.15.1 (2026-07-31)
— **approximately one release every 2-3 days**. v0.16.0 carried a default-changing
break: "Copilot default changed: `specify init --integration copilot` now installs
**skills** instead of commands by default." The v1.0.0 notes reframe versioning so that
1.0 is explicitly *not* a stability guarantee — the maintainers position it as "a wave"
and argue breaking changes now carry minimal migration cost because agents can migrate
for you.
**Source**: [github/spec-kit releases](https://github.com/github/spec-kit/releases) — Accessed 2026-08-27
**Confidence**: High (primary source)
**Analysis**: This is decisive and *empirically confirms* the course's decision 6
("SpecKit dropped — upstream churn"). A ~2-3 day cadence with a self-declared
non-stability posture at 1.0 means any course material screenshotting or quoting
SpecKit output has a shelf life measured in weeks. For a course whose pre-built
materials must survive between deliveries, this is disqualifying on its own.
The v0.16.0 commands→skills default flip is a concrete instance: material written
against the command layout silently stops matching what a new student's `init` produces.

#### A6: The one BDD extension that exists treats .feature files as downstream generated output

**Evidence**: `spec-kit-reqnroll-bdd` "converts acceptance criteria into
Reqnroll-oriented BDD plans, Gherkin feature files, implementation handoffs, and
verification reports." Commands: `/speckit.reqnroll-bdd.plan`, `.generate`,
`.inject-tasks`, `.verify`. It generates `bdd-test-plan.md`, `bdd-traceability.md`,
`bdd-implementation-handoff.md`, `bdd-verification.md`, and `.feature` files under
`tests/{Project}.AcceptanceTests/Features/`. Licence MIT. **2 stars, 0 forks, 8 commits
on main.** Requires Spec Kit ≥0.8.0 and optionally the `dotnet` CLI. Install:
`specify extension add reqnroll-bdd --from <release zip>`.
**Source**: [LoogacyStudio/spec-kit-reqnroll-bdd](https://github.com/LoogacyStudio/spec-kit-reqnroll-bdd) — Accessed 2026-08-27
**Confidence**: High for what it is (primary source); Low as a usable dependency
**Analysis**: This is the closest thing to "an existing Gherkin-flavoured SpecKit
preset" and it fails on every axis for this course:
- **Wrong direction of causality.** Acceptance criteria drive planning; Gherkin is
  *emitted downstream*. The course's decision 5 requires the opposite — the feature
  file *is* the acceptance criterion, authored by the product person. Here the
  `.feature` file is a derived test artifact, which is exactly BDD anti-pattern #1
  (feature files as after-the-fact test scripts).
- **Wrong ecosystem.** Reqnroll is the .NET/SpecFlow successor; the course is
  TypeScript + `playwright-bdd`.
- **Wrong size.** Four extra commands and four extra generated markdown documents on
  top of SpecKit's own six. Unreadable in 20 minutes.
- **Not viable as a dependency.** 2 stars, 8 commits, single-studio authorship, no
  external contributors. Bus factor 1 and no evidence of production use.
It is, however, **useful as negative evidence**: it demonstrates that the obvious way to
bolt BDD onto SpecKit produces a generate-Gherkin-from-prose pipeline, not a
Gherkin-native one.

### Part B — Community SDD kits and prompt collections

#### B1: The whole SDD field converges on the same four-phase loop — and none of them is Gherkin-native

**Evidence**: "Every major SDD framework — GitHub Spec Kit, Kiro, OpenSpec, BMAD —
converges on the same four-phase loop with identical structure." A separate survey lists
"GitHub Spec Kit, AWS Kiro, Claude Code, Cursor, OpenSpec, BMAD, Tessl, Google
Antigravity" as each having "shipped its own flavor of SDD" by 2026.
**Sources**: [Spec-Driven Development (SDD): The Definitive 2026 Guide — thebcms.com](https://www.thebcms.com/blog/spec-driven-development/), [Spec-Driven Development in 2026 — dev.to/krlz](https://dev.to/krlz/spec-driven-development-in-2026-what-it-is-the-tooling-and-how-teams-actually-use-it-2fk2) — Accessed 2026-08-27
**Verification**: Independently corroborated by [ianhxu/agentic-engineering-field-study](https://github.com/ianhxu/agentic-engineering-field-study/blob/main/04-spec-driven-development.md) and [Böckeler, martinfowler.com](https://martinfowler.com/exploring-gen-ai/sdd-3-tools.html)
**Confidence**: Medium-High (dev.to is medium-trust and thebcms.com is a vendor blog
outside the trusted list — both used only for the *enumeration* of tools, which is
independently confirmed by two higher-tier sources)
**Analysis**: Two things follow. First, the course's `spec → plan → task → implement`
spine is the field consensus, so students learn a transferable shape. Second — and more
importantly for the research question — the convergent shape is *prose-spec-first*.
Gherkin is not the acceptance-criteria format anywhere in the mainstream SDD field.

#### B2: A synthesis field study of the entire SDD tool landscape does not mention Gherkin at all

**Evidence**: Ian Xu's field study (dated 2026-07-03) synthesises primary sources
2025–2026 across Spec Kit, Kiro, OpenSpec and BMAD, drawing on the Fowler/Böckeler
analysis, tool repositories, practitioner reviews, Hacker News, the Thoughtworks
Technology Radar and arXiv papers. **It does not mention BDD, Gherkin, or feature files
anywhere.**
**Source**: [ianhxu/agentic-engineering-field-study — 04-spec-driven-development.md](https://github.com/ianhxu/agentic-engineering-field-study/blob/main/04-spec-driven-development.md) — Accessed 2026-08-27
**Confidence**: Medium-High (single-author study, but explicitly source-synthesising and
its tool assessments cross-check against primary repos)
**Verification**: Absence independently corroborated — the martinfowler.com
`exploring-gen-ai` memo index contains **no entry on BDD or acceptance testing**
([martinfowler.com/articles/exploring-gen-ai.html](https://martinfowler.com/articles/exploring-gen-ai.html), accessed 2026-08-27),
and Thoughtworks' own SPDD article references Given/When/Then only as prose inside user
stories, never as `.feature` files ([martinfowler.com/articles/structured-prompt-driven/](https://martinfowler.com/articles/structured-prompt-driven/)).
**Analysis**: This is the single most important finding of the survey. It is an
*argument from silence*, but it is a well-triangulated silence: three independent
attempts to map the SDD field (a synthesis study, Fowler's memo series index, and a
Thoughtworks methodology article) all fail to surface a Gherkin-native SDD kit. The
absence is a genuine gap in the ecosystem, not a gap in the search.

#### B3: Community Claude Code SDD kits exist in quantity, but are prose-spec kits with agent orchestration bolted on

**Evidence**: Representative repositories found under the `spec-driven-development`
GitHub topic and adjacent searches:
- `sighup/claude-workflow` — "Claude Code plugin for spec-driven development. Takes
  features from idea to validated implementation using structured specs,
  dependency-aware task graphs, and parallel agent execution."
- `ronwg/spec-driven-dev` — "A collection of specialized Claude Code commands inspired by
  the... Spec-driven workflow created by Amazon" (i.e. Kiro's requirements/design/tasks).
- `melodic-software/claude-code-plugins` — a `spec-driven-development` plugin with a
  `spec-management` skill.
- `mkhrdev/cc-spec-driven` — "A Claude Code plugin for managing requirement documents,
  tracking changes, and outputting specs — enabling downstream tools to generate code
  based on high-quality specs and complete E2E testing."
**Source**: [github.com/topics/spec-driven-development](https://github.com/topics/spec-driven-development) and linked repos — Accessed 2026-08-27
**Confidence**: Medium (repository descriptions read from search results; individual
repos not each fetched in full — see Knowledge Gap G2)
**Analysis**: Three shared traits make all of these poor fits regardless of their
individual quality:
1. **Packaged as plugins**, i.e. installed rather than read. That inverts the course's
   pedagogy: students are supposed to *author* the process, not install it.
2. **Requirements-document-centric.** Every one of them centres a prose requirements or
   spec document. `cc-spec-driven` is explicit that specs feed "downstream tools" that
   generate code and E2E tests — again Gherkin (if any) as generated output.
3. **Feature-rich by design** — dependency-aware task graphs, parallel agent dispatch,
   change tracking. Each additional mechanism is a direct debit against the 20-minute
   readability budget. For a one-day course these are liabilities.

#### B4: Böckeler's three-level ladder gives the course a precise vocabulary for what it is building

**Evidence**: Birgitta Böckeler, "Understanding Spec-Driven-Development: Kiro, spec-kit,
and Tessl", martinfowler.com, **15 October 2025**, identifies three levels:
- **Spec-first** — spec written before coding, drives the initial AI workflow, then
  effectively discarded once the feature ships; the spec is scaffolding.
- **Spec-anchored** — the spec persists as the living document for the feature's
  evolution and maintenance, kept synchronized with the codebase.
- **Spec-as-source** — humans maintain only the spec; all code is generated, marked as
  generated and never hand-edited, "analogous to how compilers made assembly a
  non-human-edited artifact."
Her key observation: none of the current tools consistently achieves spec-as-source, and
"even spec-kit, despite its rhetoric, behaves spec-first in practice."
**Source**: [Böckeler, "Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl", martinfowler.com, 2025-10-15](https://martinfowler.com/exploring-gen-ai/sdd-3-tools.html) — Accessed 2026-08-27
**Verification**: [martinfowler.com exploring-gen-ai index](https://martinfowler.com/articles/exploring-gen-ai.html) confirms title/author/date; summarised independently by [ianhxu field study](https://github.com/ianhxu/agentic-engineering-field-study/blob/main/04-spec-driven-development.md) and [Rushi's blog](https://www.rushis.com/spec-first-spec-anchored-spec-as-truth-the-three-levels-of-spec-driven-development/)
**Confidence**: High (named author at a Primary-authority domain, cross-referenced)
**Caveat**: The article was retrieved via its index entry and secondary summaries; the
direct URL `martinfowler.com/articles/exploring-gen-ai/specification-driven-development.html`
404s. The canonical path is `martinfowler.com/exploring-gen-ai/sdd-3-tools.html`.
**Analysis** *(interpretation, not sourced)*: This ladder is directly useful to the
course, in two ways.
- It **names what the course's Gherkin-native choice actually is**: a bid for
  *spec-anchored*. Feature files persist, are executed by `playwright-bdd`, and remain
  the acceptance criteria across cycles. The course is not attempting spec-as-source.
- It supplies a **teaching frame for the improvement cycles**. "Which rung is your
  process on after cycle 1? Did cycle 2 move it up?" is a better retro prompt than
  "what would you change?", and it is backed by a citable industry authority.
- Böckeler's finding that spec-kit *behaves* spec-first despite its rhetoric is also a
  warning to the course: executability is what pins a spec to the code. A prose spec has
  nothing forcing it to stay true; a `.feature` file wired to `playwright-bdd` fails
  loudly when it drifts. **This is the strongest external argument for the course's
  decision 5** — Gherkin-native is not a stylistic preference, it is the mechanism that
  makes spec-anchored achievable rather than aspirational.

#### B4b: OpenSpec — the best-rated lightweight kit — also chose plain-markdown Scenarios over Gherkin

**Evidence**: OpenSpec (Fission-AI) is "fluid not rigid", "iterative not waterfall", using
a change-proposal / delta-spec model rather than comprehensive upfront specs.
`/opsx:propose "your idea"` creates a folder with `proposal.md` (rationale), `specs/`
(requirements with concrete scenarios), `design.md`, `tasks.md`. Additional commands:
`/opsx:explore`, `/opsx:new`, `/opsx:continue`, `/opsx:ff`, `/opsx:verify`,
`/opsx:bulk-archive`, `/opsx:onboard`. Layout: an `openspec/` directory with `specs/`,
`changes/` and `archive/`. Install: `npm install -g @fission-ai/openspec@latest` then
`openspec init`; requires Node ≥20.19.0. Licence MIT. ~66k stars. The repo carries
"approximately 15+ markdown guides".
**Critically: "The specs use plain Markdown with requirement statements and 'Scenario'
sections (not Gherkin/feature file syntax)."**
**Source**: [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) — Accessed 2026-08-27
**Verification**: Independently assessed as "lightweight, brownfield-focused... ranked
highest in hands-on testing (4.0/5) for low friction and iterative suitability, though
trades rigor for simplicity" by [ianhxu field study](https://github.com/ianhxu/agentic-engineering-field-study/blob/main/04-spec-driven-development.md)
**Confidence**: High for what it does (primary source + independent evaluation); star
count is approximate and unverified against the API.
**Analysis**: OpenSpec is the strongest single data point *against* adaptation. It is the
kit that was designed for exactly the values the course holds — light, fluid, iterative,
low-friction — it is well-regarded by an independent evaluation, and **it still did not
choose Gherkin.** It invented its own plain-markdown "Scenario" section instead. When the
most sympathetic candidate in the field independently rejects the format the course
requires, "adapt an existing kit" is not a live option.
It also fails the course's own criteria on its own terms: a **global npm install**
(zero-install strike), **7+ commands**, and **15+ markdown guides** — versus a 20-minute
readability budget. Two ideas are worth stealing, though:
- **Delta specs / change proposals** — describing a *change* rather than restating the
  whole system. This is a near-perfect fit for the course's third, differently-shaped
  item, "amending an existing rule" (decision 10/20), where a full spec would be absurd.
- **`archive/`** — completed changes move out of the active directory. A cheap way to
  keep the working set readable across three cycles.

#### B5: Thoughtworks' own SPDD method is a seven-section prompt canvas, not a Gherkin kit

**Evidence**: Wei Zhang and Jessie Jie Xia (Thoughtworks), "Structured-Prompt-Driven
Development", martinfowler.com, **2026-04-28**. Treats prompts as "first-class delivery
artifacts" that are version-controlled and reusable, to make AI-generated changes
"governable, reviewable, and reusable". Centres a seven-part **REASONS canvas**:
Requirements, Entities, Approach, Structure, Operations, Norms, Safeguards. Uses an
`openspdd` CLI. "The article references Given/When/Then format for acceptance criteria
but does not discuss BDD, Gherkin, or similar formal testing frameworks. Acceptance
criteria are presented as business-language statements nested within user stories, not
as primary governance artifacts."
**Source**: [Zhang & Xia, "Structured-Prompt-Driven Development", martinfowler.com, 2026-04-28](https://martinfowler.com/articles/structured-prompt-driven/) — Accessed 2026-08-27
**Confidence**: High (Primary-authority domain, named authors, dated)
**Analysis**: Further confirmation of B2's silence — this is Thoughtworks, the
organisation that *invented* much of modern BDD practice, publishing an AI-era spec
method in 2026 that puts Given/When/Then in prose inside user stories rather than in
`.feature` files. Two borrowable ideas survive, though: (a) the framing of **prompts as
version-controlled delivery artifacts** is exactly the course's thesis and is worth
citing to students on slide one; (b) **Norms and Safeguards as named, separate sections**
is a good idea the course can steal — it maps cleanly onto the gate catalogue
(decision 12/13). SPDD's own CLI and seven-section canvas are too heavy to adopt.

### Part C — BDD-specific agent tooling

#### C1: BDD + AI agent tooling exists, but it is test-generation tooling, not spec-driven-development tooling

**Evidence**: The tooling found in this space clusters entirely around *generating tests*:
- `playwright-bdd-step-definitions` — a Claude Code **skill** for writing step definitions.
  "Step definitions connect Gherkin steps in feature files to executable code, and
  Playwright BDD uses `createBdd()` to generate type-safe step definition functions."
- Playwright **MCP**-based workflows, where "Playwright's MCP server provides
  accessibility tree snapshots — every element with its role, name, and state — which AI
  agents read to pick locators the way a screen reader would."
- Cursor + LLM + Playwright MCP BDD-testing walkthroughs.
- Multi-agent "Playwright Test Agents" orchestration guides.
**Sources**: [playwright-bdd-step-definitions skill (lobehub mirror)](https://lobehub.com/skills/arielperez82-agents-and-skills-playwright-bdd-step-definitions), [Multi-Agent AI Testing with Claude Code & Playwright — testomat.io](https://testomat.io/blog/multi-agent-ai-testing-with-claude-code-and-playwright/), [Playwright MCP & Claude Code — testomat.io](https://testomat.io/blog/playwright-mcp-claude-code/) — Accessed 2026-08-27
**Confidence**: Medium — these are vendor blogs (testomat.io sells a test-management
product: **commercial-interest bias noted**) and a third-party skill mirror. Used only
for the structural claim that this tooling is test-generation-shaped, which is
self-evident from the artifacts themselves and consistent across all sources found.
**Note**: The upstream repo `arielperez82/agents-and-skills` returned **HTTP 404** on
direct fetch (2026-08-27) — it may be private, renamed or deleted. The skill is only
verifiable through a third-party mirror, so it is **not a dependable dependency**.
**Analysis**: There is a clean split in the ecosystem:
- **SDD tooling** (Part A/B) starts from a prose spec and never reaches Gherkin.
- **BDD agent tooling** (this part) starts from an *already-existing* feature file, or
  from the running UI, and produces step definitions and tests.
**Nobody occupies the middle** — the position where the `.feature` file is the
authored requirement that then drives plan, tasks and implementation. That middle is
exactly where the course sits. The `playwright-bdd` step-definition skill is
nevertheless *directly reusable* for the course's implement step: it is one skill, not a
kit, so it composes with a hand-rolled process instead of replacing it.
**Caution**: MCP-driven "agent explores the UI and writes the scenario" workflows are
the mechanised form of BDD anti-pattern #1 (scenarios written after the code, from the
UI). The course should not put Playwright MCP in the authoring path. It is fine in the
implement/debug path.

#### C2: There is a recognised maturity ladder for AI involvement in BDD, and Tier 2 is the danger zone

**Evidence**: "At Tier 1, AI auto-completes step definitions with unchanged methodology.
At Tier 2, AI generates Gherkin scenarios from user stories. At Tier 3, AI agents
generate scenarios, step definitions, and implementation from domain descriptions, with
human review focused on scenario completeness. The Spec Kit pipeline partially
instantiates this."
**Source**: [Spec-Driven Development in 2026 — dev.to/krlz](https://dev.to/krlz/spec-driven-development-in-2026-what-it-is-the-tooling-and-how-teams-actually-use-it-2fk2) — Accessed 2026-08-27
**Confidence**: Low-Medium (single medium-trust source; the *ladder* is one author's
framing, though the underlying tool behaviours it describes are confirmed in A6 and C1)
**Analysis** *(interpretation)*: If this ladder is right, the course's Gherkin-native
design is a deliberate **Tier 0/1** choice: the human pair authors the scenario; the
agent implements against it. That is a defensible pedagogical position and worth stating
explicitly to students, because the market pressure is all toward Tier 2 ("AI generates
the Gherkin from your user story") — which reintroduces the two-artifact drift problem
decision 5 exists to kill, just with the drift now inside the tool.

### Part D — Prior art on Gherkin-as-single-source-of-truth for AI agents

#### D1: Paul Duvall's ATDD-driven AI development is the closest documented prior art to the course's design

**Evidence**: Paul Duvall, "ATDD with AI: How Tests Become Your New Programming
Language", 2025-06-05. Thesis: ATDD functions as **executable specifications that guide
AI code generation, preventing hallucination and drift**, treating tests as the primary
programming artifact. Concrete workflow on a real app (DoubleUp!):
1. Write Gherkin `.feature` files describing user behaviour
2. Create step definitions mapping Gherkin to test logic
3. Prompt the AI to implement minimal code passing each test
4. Maintain a RED-GREEN-REFACTOR cycle with a traceability matrix
5. Run acceptance tests locally via a single script (`./run.sh --bdd`)
6. Enforce in CI on every push
The author treats "prompting as the new coding", with each AI prompt functioning as a
development commit, and reports discipline of "one test at a time", "clear, structured
prompts", "numbered steps for consistency", "explicit refactoring instructions", and
**saved prompt history per TDD cycle**.
Reported lessons: precision in prompting yields better code; test failures help the AI
understand the problem; incremental development prevents compounding errors; tests become
living documentation and shared language.
Reported difficulties: prompting clarity was hard to get right; **strong traceability
overhead was required to prevent specification loss**; "AI can hallucinate features,
drift from specifications" without ATDD guardrails.
**Source**: [Duvall, "ATDD with AI", paulmduvall.com, 2025-06-05](https://www.paulmduvall.com/atdd-driven-ai-development-how-prompting-and-tests-steer-the-code/) — Accessed 2026-08-27
**Confidence**: Medium — personal blog (outside the trusted-domain list), but the author
is a recognised industry figure (co-author of the Addison-Wesley *Continuous
Integration* book) and the post is a first-hand experience report on a named, concrete
project rather than opinion. **Bias check**: no product being sold in the post; low
commercial-interest risk. Treated as a *single-source experience report* and labelled
accordingly. See Knowledge Gap G1.
**Verification**: The underlying claim — that executable acceptance tests constrain agent
drift better than prose — is consistent with Böckeler's finding that spec-kit "behaves
spec-first in practice" despite spec-anchored rhetoric ([martinfowler.com](https://martinfowler.com/exploring-gen-ai/sdd-3-tools.html))
and with the field study's #1 consensus failure mode, "spec drift: specs and code fall
out of sync **with no enforcement mechanism**" ([ianhxu field study](https://github.com/ianhxu/agentic-engineering-field-study/blob/main/04-spec-driven-development.md)).
**Analysis** *(the load-bearing insight for the course)*: Duvall's experience and the
field study's failure list dovetail. The field study says the number-one SDD failure is
drift with *no enforcement mechanism*. Duvall's method **is** an enforcement mechanism:
the spec is executable, so drift shows up as a red test rather than as a stale document
nobody re-reads. **The course's Gherkin-native decision is therefore not merely a
tidiness choice — it is a direct structural answer to the single most-reported failure
mode in the SDD field.** That framing is worth putting in front of students explicitly.
Two cautions from the same source:
- Duvall needed a **traceability matrix**. That is a fifth artifact and a maintenance
  burden. The course should check whether Gherkin `@tags` plus scenario names give
  enough traceability without a matrix — for a 6-hour course, almost certainly yes, and
  "we deliberately dropped the traceability matrix" is a good worked example of process
  *subtraction* for the improvement cycles.
- He ran BDD through CI on every push. The course has **no CI** (decision 11), so the
  enforcement point must be the local gate. This makes the gate catalogue (decision
  12/13) load-bearing rather than optional — nothing else pins the spec to the code.

#### D2: The three consensus failure modes of SDD that the course's design must survive

**Evidence**: Five consensus failure modes across the SDD tool landscape:
1. **Spec drift** — specs and code fall out of sync with no enforcement mechanism
2. **Over-ceremony** — excessive markdown consumes tokens and developer time
3. **Agent non-compliance** — LLMs frequently ignore elaborate spec instructions
4. **Problem-size mismatch** — full SDD overhead inappropriate for bug fixes
5. **False confidence** — wrong specs gain unwarranted authority once reviewed
Specific supporting data point: Spec Kit criticised for "rigid phase gates, verbosity
(**1,300 markdown lines for simple features**), and actually functioning as spec-first
despite spec-anchored claims." OpenSpec, the *lightweight* delta-spec alternative,
"ranked highest in hands-on testing (4.0/5) for low friction and iterative suitability."
AWS Kiro: strengths in requirements→design→tasks decomposition and EARS notation;
"major weakness: **documented spec drift** where requirements and design fail to stay
synchronized as implementation progresses." BMAD: "maximalist... 12+ agent personas...
criticized as unnecessarily heavy for routine work."
The study concludes specs are most valuable "at modest scope (spec-first) for
multi-agent work and compliance contexts, not routine development."
**Source**: [ianhxu/agentic-engineering-field-study — 04-spec-driven-development.md, 2026-07-03](https://github.com/ianhxu/agentic-engineering-field-study/blob/main/04-spec-driven-development.md) — Accessed 2026-08-27
**Verification**: Over-ceremony and drift independently corroborated by [Böckeler, martinfowler.com](https://martinfowler.com/exploring-gen-ai/sdd-3-tools.html) (spec-kit behaves spec-first) and by [Duvall](https://www.paulmduvall.com/atdd-driven-ai-development-how-prompting-and-tests-steer-the-code/) (hallucination/drift without guardrails)
**Confidence**: Medium-High
**Analysis**: Every one of these five maps onto a course design decision, mostly
favourably — and the mapping is itself teachable material:

| SDD failure mode | Course's structural answer |
|---|---|
| Spec drift (no enforcement) | Gherkin-native + executable via `playwright-bdd`; drift = red test (dec. 5, 22) |
| Over-ceremony (1,300 md lines) | ~6 hand-written markdown files, 20-minute readability budget (dec. 7) |
| Agent non-compliance | Claude Code hooks/gates as machine enforcement, not prose pleading (dec. 12/13/14) |
| Problem-size mismatch | The rule-amendment third item is deliberately a different, smaller shape (dec. 10/20) |
| False confidence | **Least covered.** See below. |

**False confidence is the course's open flank.** A wrong-but-reviewed feature file gains
authority, and an executable spec makes this *worse*, not better: a green suite on the
wrong scenario is more convincing than a stale document. Nothing in the decided
constraints addresses it. Concrete, cheap mitigations that fit the course:
- Make the product person read the `.feature` file **aloud to the developer** before
  implementation — the cheapest possible instance of BDD's "three amigos", and it fits
  the cross-functional pair (dec. 15/16) with zero new artifacts.
- Seed **one** of the prepared backlog features with a deliberately ambiguous rule so
  some pair ships the wrong thing and discovers it in the retro. This is much stronger
  teaching than a warning slide, and the cycle-2 process improvement writes itself.

#### D3: Prompts-as-versioned-artifacts is an established, citable industry position

**Evidence**: SPDD "treats prompts as *first-class delivery artifacts* that are
version-controlled and reusable", aiming to make AI-generated changes "governable,
reviewable, and reusable" across teams rather than relying on ad hoc individual
assistance. Duvall independently describes "each AI prompt functioning as a development
commit" with "saved prompt history per TDD cycle". SpecKit vendors its templates into
the repo precisely so they are project-local and git-tracked.
**Sources**: [Zhang & Xia, martinfowler.com, 2026-04-28](https://martinfowler.com/articles/structured-prompt-driven/), [Duvall, 2025-06-05](https://www.paulmduvall.com/atdd-driven-ai-development-how-prompting-and-tests-steer-the-code/), [github/spec-kit](https://github.com/github/spec-kit) — Accessed 2026-08-27
**Confidence**: High (3 independent sources, one Primary-authority, agreeing on substance)
**Analysis**: This is the course's central premise — "process encoded as skills, commands
and tools, committed to the repo" — and it is now independently supported by three
sources from three different organisations. Worth citing on the opening slide. It also
retroactively justifies decision 19 (commit the Mermaid process model): if prompts are
delivery artifacts, so is the process diagram, and `git log` on it is a legitimate
record of process evolution.

### Part E — Known BDD failure modes

#### E1: Cucumber's own documentation names only two anti-patterns, both about step definitions

**Evidence**: The official Cucumber anti-patterns page names exactly two:
1. **Feature-coupled step definitions** — step definitions that "can't be reused across
   features or scenarios", leading to "an **explosion of step definitions**, code
   duplication, and high maintenance costs." Remedy: "Organise your steps by domain
   concept" and "use domain-related names (rather than feature- or scenario-related
   names)" for step and step-definition files.
2. **Conjunction steps** — steps combining multiple actions become "too specialised, and
   hard to reuse". Remedy: split using `And`/`But`; for composition, "use the features of
   your programming language" — extract helper methods called from step definitions.
   "**Keep your steps atomic as much as possible.**"
**Source**: [Anti-patterns — Cucumber Docs](https://cucumber.io/docs/guides/anti-patterns/) — Accessed 2026-08-27
**Confidence**: High (official project documentation — authoritative primary source for
Cucumber/Gherkin practice)
**Analysis**: This directly confirms the brief's **step-definition explosion** concern and,
usefully, gives a **one-line rule** that fits the course's readability budget: *name steps
after domain concepts, not features; keep steps atomic*. That is a single sentence that
can live in the implement prompt. It is also a naturally *machine-checkable* property —
"how many step definitions do we have per feature file?" is a cheap gate-catalogue
candidate with an honest three-axis description (catches: step explosion; runtime:
instant; agent signal: weak — it is a smell, not a failure).

#### E2: The canonical BDD anti-pattern list is about collaboration, not syntax

**Evidence**: Jan Stenberg, InfoQ, 2016-09-30, reporting **Aslak Hellesøy (Cucumber
co-creator), Matt Wynne, Steve Tooke and Thomas Sundberg**. Named anti-patterns:
1. **Writing scenarios after code** — treats Cucumber as merely a testing tool rather
   than a vehicle for "testing your understanding of the problem domain" before
   development begins.
2. **Domain experts working in isolation** — scenarios lacking developer and tester
   input, producing misunderstandings and hard-to-automate scenarios.
3. **Testing through the UI** — UI changes break tests even when business logic is
   stable; slow, and obscures domain understanding by using generic interface language
   rather than domain terminology.
4. **Keeping noisy scenarios** — unnecessary assertions clutter the documentation and
   should be deleted after the first iterations.
5. **Overusing scenario outlines** — template expansion encourages excessive test
   creation, "particularly problematic when combined with UI testing".
6. **Testing multiple rules together** — conflates distinct behaviours.
7. **Poor scenario naming** — fails to communicate intent.
8. **Incidental details** — irrelevant specifics obscure meaning.
9. **Overly vague scenarios** — lack the concrete detail that gives them value.
Core message: "Cucumber fundamentally supports capturing shared understanding, not
automating tests — a distinction often lost in practice."
**Source**: [Stenberg, "BDD Anti-Patterns", InfoQ, 2016-09-30](https://www.infoq.com/news/2016/09/bdd-anti-patterns) — Accessed 2026-08-27
**Verification**: Anti-patterns 3, 6 and 8 independently restated in current
practitioner material: "The most common failure mode in Cucumber implementation is
writing **imperative scenarios that mimic manual test steps**... a scenario should
normally be phrased **declaratively** using the language of the domain" — and "Your
Gherkin should read like a business specification, not a test script — if a
non-developer can't understand it, you've already failed." Step-explosion remedy matches
[cucumber.io](https://cucumber.io/docs/guides/anti-patterns/).
**Confidence**: High (Medium-High-tier publication quoting four named primary
authorities including the tool's co-creator; core claims cross-referenced against
official Cucumber docs and current practitioner sources)
**Freshness note**: Published **2016 — ten years old**. Per source-freshness rules,
methodology references are treated as evergreen, and the fact that current 2026 material
restates the same list unchanged is itself evidence the anti-patterns have not moved.
**Analysis**: All four failure modes the brief asked about are confirmed, with named
authorities:

| Brief's concern | Confirmed as | Source |
|---|---|---|
| Feature files as after-the-fact test scripts | Anti-pattern #1, "writing scenarios after code" | InfoQ/Hellesøy |
| Non-technical stakeholders never read them | Anti-pattern #2, plus "if a non-developer can't understand it, you've already failed" | InfoQ; practitioner corpus |
| Imperative rather than declarative scenarios | "The most common failure mode"; anti-patterns #3, #8 | Practitioner corpus; InfoQ |
| Step-definition explosion | Named explicitly | cucumber.io (official) |

#### E3: What the candidate kits do about these anti-patterns: nothing, or worse

**Evidence + analysis** *(assessment based on the primary-source descriptions in A1–A6,
B3 and C1)*:

| Kit | Effect on BDD anti-patterns |
|---|---|
| **SpecKit (vanilla)** | Neutral-to-negative. No `.feature` files at all, so no step explosion; but its prose spec + separate plan/tasks is the two-artifact drift topology decision 5 rejects. Its G/W/T scenarios sit inside a `spec.md` where nothing executes them — the purest form of "documentation nobody re-reads". |
| **spec-kit-reqnroll-bdd** | **Actively encourages anti-pattern #1.** `.feature` files are *generated downstream* from acceptance criteria, i.e. produced by the tool after the requirement is settled, as a test artifact. It also adds four more markdown documents (test plan, traceability, handoff, verification), inviting over-ceremony. Its `.verify` command does check "Gherkin quality", which is a point in its favour, but the pipeline shape is the problem. |
| **Community Claude Code SDD plugins** | Neutral on BDD specifically (they mostly ignore it), negative on over-ceremony: task graphs, parallel agent dispatch and change tracking all add surface. `cc-spec-driven` explicitly feeds "downstream tools" that generate E2E tests — the same generated-Gherkin shape. |
| **Playwright MCP / test-agent workflows** | **Actively encourages anti-patterns #1 and #3.** The agent drives the *running UI*, reads the accessibility tree, and writes scenarios from it. That is scenario-after-code, written in interface language, by construction. |
| **`playwright-bdd-step-definitions` skill** | Positive if scoped to implementation only. It maps existing Gherkin to code; it does not author scenarios. Whether it encourages feature-coupled step definitions is **unverified** — the upstream repo 404s (see C1, G3). |

**Confidence**: Medium (this is analysis over sourced descriptions, not a direct finding;
each row's underlying facts are cited in Parts A–C)
**Key conclusion**: The kits are not merely a neutral fit-or-not decision. **Adopting any
of the Gherkin-adjacent ones would cause the course to demonstrate the exact
anti-patterns it is trying to teach students to avoid.** For a course whose subject is
process design, shipping a kit that models bad process is worse than shipping nothing.

## Candidate Evaluation Matrix

Scored against the four criteria from the course design decisions.
**PASS / WEAK / FAIL**. "Work to make Gherkin-native" is the estimated effort.

| Candidate | What it actually does | Licence | Maintenance | Readable in 20 min? | Zero install? | Adaptable by students? | Work to make Gherkin-native | Beats writing ~6 md files? |
|---|---|---|---|---|---|---|---|---|
| **GitHub SpecKit** | CLI vendors prose `spec.md` + plan + tasks templates; G/W/T inline in markdown | MIT | Very active — release every 2-3 days; 1.0 explicitly *not* a stability promise | **FAIL** — 6 core + 4 optional commands, 4-level template override stack, ~1,300 md lines reported for a simple feature | **FAIL** — `uv tool install specify-cli` | **WEAK** — overridable, but overrides are a mechanism students must also learn | **High** — replace spec template's whole AC section, then plan + tasks templates that consume it | **No** |
| **spec-kit-reqnroll-bdd** | Generates `.feature` files *downstream* from acceptance criteria, for .NET/Reqnroll | MIT | **FAIL** — 2 stars, 0 forks, 8 commits, single studio | **FAIL** — 4 more commands + 4 more generated docs on top of SpecKit | **FAIL** — requires SpecKit ≥0.8.0 + `specify extension add` | **FAIL** — generated artifacts | **Total rewrite** — causality is backwards *and* wrong ecosystem (.NET vs TypeScript) | **No** |
| **OpenSpec** | Delta-spec change proposals; plain-markdown "Scenario" sections, explicitly **not** Gherkin | MIT | Active, well-regarded (4.0/5 independent) | **FAIL** — 7+ commands, 15+ guide documents | **FAIL** — `npm install -g` | **WEAK** — light, but a CLI owns the layout | **High** — its Scenario format is a deliberate alternative to Gherkin | **No** |
| **AWS Kiro** | requirements → design → tasks; **EARS** notation, not Gherkin | Proprietary/IDE | Vendor product | **WEAK** | **FAIL** — separate IDE | **FAIL** — vendor-controlled | **High** — EARS is a different formalism | **No** |
| **BMAD Method** | 12+ agent personas, adversarial review | OSS | Active | **FAIL** — "unnecessarily heavy for routine work" | WEAK | WEAK | High | **No** |
| **Community CC SDD plugins** (`claude-workflow`, `spec-driven-dev`, `cc-spec-driven`, `melodic-software`) | Prose spec docs + task graphs + parallel agent dispatch, packaged as Claude Code plugins | Mixed (mostly MIT) | Varies; mostly small/solo | **FAIL** — plugin surface, not a readable method | **WEAK** — plugin install | **FAIL** — installed, not authored; inverts the pedagogy | High | **No** |
| **Thoughtworks SPDD** | 7-section REASONS prompt canvas; G/W/T as prose in user stories | Article + `openspdd` CLI | New (2026-04) | **WEAK** — one canvas, but 7 sections | **FAIL** — `openspdd` CLI | WEAK | High | **No** — but steal ideas |
| **`playwright-bdd-step-definitions` skill** | Maps *existing* Gherkin to `createBdd()` step definitions | Unverified — **upstream repo 404s** | **Unknown/unverifiable** | PASS — single skill | PASS — a skill file | PASS | **None needed** — already Gherkin-consuming | **N/A** — not a kit; a component |
| **Write ~6 markdown files** | `spec`(=`.feature`) → `plan` → `tasks` → `implement` (+ `gate`, `improve`) | Ours | Ours | **PASS** by construction — it is the acceptance criterion | **PASS** — repo-local `.claude/commands/*.md` | **PASS** — modification *is* the exercise | **Zero** | — |

## Verdict: Adopt / Adapt / Write From Scratch

### WRITE FROM SCRATCH. High confidence.

Not a close call, and not a default-by-laziness. Four independent lines of evidence converge:

**1. The artifact does not exist.** No Gherkin-native spec-driven prompt kit was found.
The gap is not a search failure — it is triangulated by three separate attempts to map
the field, each of which independently fails to mention Gherkin: a 2026 synthesis field
study across SpecKit/Kiro/OpenSpec/BMAD (B2), the martinfowler.com `exploring-gen-ai`
memo index (B2), and Thoughtworks' own 2026 SPDD article, which puts Given/When/Then in
prose inside user stories (B5). The *entire mainstream SDD field is prose-spec-first.*

**2. The most sympathetic candidate rejected Gherkin on purpose.** OpenSpec — light,
fluid, iterative, independently rated best-in-class for low friction — wrote its own
plain-markdown "Scenario" section rather than use `.feature` files (B4b). Adaptation
would mean fighting a deliberate design decision made by people who share the course's
values.

**3. Every candidate fails the course's hard constraints before Gherkin is even
considered.** Every kit surveyed requires a global install (`uv tool`, `npm -g`, a
plugin, or a vendor IDE) — a direct strike against zero-install and a new failure mode in
a setup path that decision 25 needs failsafe. Every kit is far past a 20-minute
readability budget: SpecKit's 6+4 commands and four-level override stack, OpenSpec's 7+
commands and 15+ guides, BMAD's 12+ personas. And every kit is *installed rather than
authored*, which inverts the course's core pedagogy — students are meant to build the
process, and decision 9 says anything the repo prescribes steals an exercise.

**4. Adopting a Gherkin-adjacent kit would actively teach the anti-patterns.** The one
BDD-flavoured SpecKit extension generates `.feature` files downstream from prose
acceptance criteria — mechanised BDD anti-pattern #1, scenarios written after the
requirement is settled, as a test artifact (A6, E3). Playwright-MCP scenario-authoring
workflows are anti-patterns #1 and #3 by construction: the agent reads the running UI and
writes scenarios in interface language (C1, E3). For a course whose *subject* is process
design, shipping a kit that models bad process is worse than shipping nothing.

**And the cost of building is genuinely small.** Six markdown files in
`.claude/commands/` is a few hours of work, produces exactly the artifact the course
needs, is readable in one sitting, has no upstream, and cannot bitrot between course
deliveries — whereas SpecKit ships a release every 2-3 days and disclaims stability at
1.0 (A5). The build-vs-adapt arithmetic is not close: adapting SpecKit means overriding
the spec template's entire acceptance-criteria section *and* the plan and tasks templates
that consume its structure, which is writing the same markdown anyway, plus inheriting a
CLI dependency, an override-resolution mechanism, and a 2-3 day churn cadence.

### What the research changes about the plan: nothing structural, three additions

The course's decisions 5, 6 and 7 are all **empirically vindicated** — decision 6
("SpecKit dropped, upstream churn") is confirmed by a measured 2-3 day release cadence
and an explicit non-stability posture (A5). Three things are worth *adding*:

1. **Reframe Gherkin-native from tidiness to mechanism.** The #1 consensus SDD failure is
   spec drift "with no enforcement mechanism" (D2). An executable `.feature` file *is*
   the enforcement mechanism — drift becomes a red test rather than a stale document.
   This is a much stronger opening argument to students than "avoid two documents", and
   it is citable to Böckeler and the field study.
2. **Close the false-confidence flank.** It is the one consensus failure mode the decided
   constraints do not address, and executability makes it *worse* (a green suite on the
   wrong scenario is very convincing). Two cheap fixes in D2: read the `.feature` aloud
   to the pair before implementing (three-amigos in miniature, zero new artifacts), and
   seed one prepared feature with a deliberately ambiguous rule so a pair ships the wrong
   thing and finds it in the retro.
3. **The gate catalogue is load-bearing, not optional.** Duvall's Gherkin-native ATDD
   workflow enforced on every CI push; the course has no CI (decision 11). With CI gone,
   the local gate is the *only* thing pinning spec to code. Decision 12/13's "nothing
   wired by default" is still right pedagogically, but the course should ensure at least
   one pair-cycle where the gate is unwired and the drift is felt.

## Borrowable Ideas

Worth stealing even though nothing is being adopted. Ordered by value to the course.

### From SpecKit's `spec-template.md` (A3, and the template read directly)
1. **`[NEEDS CLARIFICATION: ...]` inline markers.** The single best idea found. Gives the
   agent a sanctioned way to say "I don't know" *inside the artifact* instead of guessing
   — the standard LLM failure. Translates to Gherkin without modification: a `@needs-clarification`
   tag on a scenario, or a `# NEEDS CLARIFICATION:` comment. Directly attacks the
   false-confidence failure mode, and gives the product person a concrete job.
2. **Section markers: `*(mandatory)*` and `ACTION REQUIRED`.** Explicit mandatory/optional
   marking makes a template self-documenting and, importantly, makes *deletion* legible —
   a student removing a mandatory section has visibly changed the process. Good fuel for
   the improvement cycles.
3. **Instruction blocks in HTML comments.** Guidance to the agent that does not render in
   GitHub. Keeps the committed artifact readable to the product person while still
   steering the agent. Cheap and immediately usable.
4. **Stable ID prefixes (`FR-001`, `SC-001`).** Gives traceability without Duvall's
   separate traceability matrix (D1). In Gherkin the natural equivalent is `@FR-001` tags
   on scenarios — traceability with zero extra artifacts.
5. **"Technology-agnostic and measurable" as an explicit constraint on success criteria.**
   One phrase that does the work of a declarative-scenarios lecture (E2). Steal the
   phrasing verbatim into the spec command.
6. **Independence principle — "each story must deliver standalone MVP value"** and
   P1/P2/P3 prioritisation with an *independent test approach* per story. Useful because
   it forces feature-sized slices, which is what makes the prepared backlog work.

### From OpenSpec (B4b)
7. **Delta specs / change proposals** — describe the *change*, not the whole system.
   Near-perfect fit for the third, differently-shaped item ("amend an existing rule",
   decision 10/20), where a full spec would be absurd. Likely a natural cycle-3 process
   *addition* students could invent.
8. **`archive/` for completed changes.** Keeps the working set readable across three
   cycles. Trivial to implement, visibly improves the repo by hour four.
9. **`explore` as a command distinct from `propose`** — "planning without commitment".
   A good candidate for a student-invented cycle-2 step, and cheaper than SpecKit's
   `clarify`.

### From Thoughtworks SPDD (B5)
10. **"Prompts as first-class delivery artifacts."** The course's thesis, stated by
    Thoughtworks on martinfowler.com. Put it on slide one with the citation.
11. **Separate `Norms` and `Safeguards` sections.** Maps cleanly onto the gate catalogue
    (decision 12/13): Norms = what good looks like, Safeguards = what must never happen.
    Better vocabulary than "gates" for the product half of the room.

### From the SDD command vocabulary generally (A2)
12. **A menu of candidate process steps for the improvement cycles**: `constitution`,
    `clarify`, `analyze`, `checklist`, `converge` (SpecKit); `explore`, `verify`,
    `archive` (OpenSpec). Do **not** ship these. Hold them as a facilitator's back-pocket
    list for pairs who stall on "what could we add to our process?".

### From Böckeler (B4)
13. **The spec-first / spec-anchored / spec-as-source ladder** as the retro frame:
    "which rung was your process on after cycle 1, and did cycle 2 move it?" A citable,
    industry-backed vocabulary that is sharper than "what would you change?".

### From the BDD literature (E1, E2)
14. **Two one-line rules to embed in the implement command**: *name step definitions
    after domain concepts, not features* and *keep steps atomic* (official Cucumber
    remedy for step explosion). One sentence, high leverage.
15. **"If a non-developer can't understand it, you've already failed"** as the readability
    test for a feature file — and it is directly checkable in the room, because the room
    contains non-developers. The mixed-pair format (decision 15/16) makes this an
    executable check rather than a slogan.

## Source Analysis

| Source | Domain | Reputation | Type | Access Date | Cross-verified |
|---|---|---|---|---|---|
| github/spec-kit (repo) | github.com | Medium-High (1.0 as primary source for its own behaviour) | official/primary | 2026-08-27 | Y |
| github/spec-kit releases | github.com | Medium-High (primary) | official/primary | 2026-08-27 | Y |
| github/spec-kit `spec-template.md` | raw.githubusercontent.com | Medium-High (primary) | official/primary | 2026-08-27 | Y |
| LoogacyStudio/spec-kit-reqnroll-bdd | github.com | Medium-High (primary for itself) | primary | 2026-08-27 | N (only source) |
| Fission-AI/OpenSpec | github.com | Medium-High (primary) | primary | 2026-08-27 | Y |
| Böckeler, "Understanding SDD: Kiro, spec-kit, Tessl" | martinfowler.com | **High** (Primary domain authority) | industry | 2026-08-27 | Y |
| martinfowler.com exploring-gen-ai index | martinfowler.com | **High** | industry | 2026-08-27 | Y |
| Zhang & Xia, "Structured-Prompt-Driven Development" | martinfowler.com | **High** | industry | 2026-08-27 | Y |
| Stenberg, "BDD Anti-Patterns" | infoq.com | Medium-High (0.8) | industry | 2026-08-27 | Y |
| Cucumber Anti-patterns guide | cucumber.io | **High** (official project docs) | technical/official | 2026-08-27 | Y |
| ianhxu/agentic-engineering-field-study | github.com | Medium-High | synthesis study | 2026-08-27 | Y |
| Duvall, "ATDD with AI" | paulmduvall.com | Medium (personal blog, credentialed author) | experience report | 2026-08-27 | Partial |
| dev.to/krlz SDD-in-2026 | dev.to | Medium (0.6) | community | 2026-08-27 | Y (enumeration only) |
| thebcms.com SDD 2026 Guide | thebcms.com | **Low** — vendor blog, outside trusted list | marketing | 2026-08-27 | Y (enumeration only) |
| testomat.io Playwright/Claude articles | testomat.io | **Low** — vendor blog, commercial interest | marketing | 2026-08-27 | Y (structural claim only) |
| lobehub skill mirror | lobehub.com | **Low** — third-party mirror | mirror | 2026-08-27 | N |
| DeepWiki spec-kit templates | deepwiki.com | Medium — generated mirror of a primary repo | secondary | 2026-08-27 | Y (against the repo) |
| github.com/topics/spec-driven-development | github.com | Medium-High | index | 2026-08-27 | N/A |
| Rushi's blog (Böckeler summary) | rushis.com | **Low** — outside trusted list | secondary summary | 2026-08-27 | Y (corroboration only) |

**Reputation distribution**: High: 4 (21%) | Medium-High: 8 (42%) | Medium: 3 (16%) |
Low: 4 (21%). **Weighted average ≈ 0.72.**

**Note on the low-tier sources**: All four Low-tier sources are used *only* for claims
that are independently confirmed by higher-tier sources — tool enumeration (B1),
the structural observation that BDD agent tooling is test-generation-shaped (C1), and
corroboration of Böckeler's three levels (B4). No finding rests on a Low-tier source
alone. Commercial-interest bias is flagged inline for testomat.io (sells test management)
and thebcms.com (vendor blog).

**Note on GitHub as a source**: Per the brief, repositories and official project
documentation are treated as legitimate *primary* sources for what a tool does and how
maintained it is. Star counts reported by page fetches (spec-kit ~132k, OpenSpec ~66k)
were **not** verified against the GitHub API and should be treated as approximate; the
maintenance conclusions rest on release dates and commit counts, which are more reliable.

## Knowledge Gaps

### Gap 1: Duvall's ATDD-with-AI experience report is effectively single-source
**Issue**: The closest documented prior art to the course's exact design (D1) rests on
one practitioner's blog post about one project. No second independent Gherkin-native
AI-development experience report was found.
**Attempted**: Searches for `"feature files" "source of truth" AI coding agent BDD`,
`acceptance criteria .feature primary artifact outside-in ATDD`, InfoQ BDD + AI 2026,
and the martinfowler.com memo index (which contains no BDD/acceptance-testing entry).
**Impact**: Medium. The *specific* claim (Gherkin-native works well with agents) is
weakly sourced. The *general* claim it supports (executable specs prevent the drift that
prose specs cannot) is well cross-referenced via Böckeler and the field study.
**Recommendation**: Treat the course's own three cycles as the second data point. If the
course is repeated, capturing what happened is a genuinely publishable contribution —
the gap in the literature is real.

### Gap 2: Community Claude Code SDD repos assessed from descriptions, not contents
**Issue**: `sighup/claude-workflow`, `ronwg/spec-driven-dev`, `mkhrdev/cc-spec-driven`
and `melodic-software/claude-code-plugins` (B3) were characterised from repository
descriptions and search snippets, not by reading their command files. Their licences,
star counts and last-commit dates were not individually verified.
**Attempted**: One combined search plus the `spec-driven-development` GitHub topic page.
Individual repo fetches were deprioritised once B1/B2/B4b established that the whole
field is prose-spec-first.
**Impact**: Low. All four self-describe as requirements-document-centric, so none is a
Gherkin-native candidate; the verdict does not turn on their details. A residual risk
remains that one contains a borrowable prompt phrasing.
**Recommendation**: If ~30 minutes are available before building, skim
`sighup/claude-workflow`'s command markdown for prompt phrasings only. Do not
re-open the adopt/adapt decision on it.

### Gap 3: `arielperez82/agents-and-skills` returns HTTP 404 — the playwright-bdd step-definition skill is unverifiable
**Issue**: The one directly reusable component found (C1) exists only via third-party
mirrors (lobehub, mcpmarket). Upstream returned 404 on 2026-08-27 — private, renamed or
deleted. Licence and provenance unknown.
**Attempted**: Direct fetch of the GitHub repo.
**Impact**: Low-Medium. It is a nice-to-have component, not a dependency.
**Recommendation**: Do not vendor code from a mirror of a 404'ing repo. Write the
step-definition guidance directly into the course's implement command — it is a
paragraph, not a library.

### Gap 4: No evidence found on how well agents actually *author* good Gherkin
**Issue**: Much material exists on agents *generating* Gherkin from prose (C2, Tier 2),
essentially none on quality — whether agent-written scenarios are declarative or
imperative, domain-language or interface-language. Given that "imperative scenarios" is
named as the most common BDD failure mode (E2), this is a real unknown for a course
whose product-person half will be writing feature files with agent help.
**Attempted**: Searches combining Gherkin quality, declarative scenarios and AI
generation; the martinfowler.com memo index (which has a 2026 memo on TDD inside the
agent loop, but none on BDD).
**Impact**: Medium — it affects what guardrails the spec command needs.
**Recommendation**: Pre-test this before the course. Write one prepared backlog item's
feature file with Claude and check it against the E2 anti-pattern list. If the agent
drifts imperative, put the declarative rule and one good/bad example pair directly in the
spec command — the cheapest possible fix, and worth ~30 minutes.

### Gap 5: Two arXiv papers surfaced but were not read
**Issue**: "From Prompt to Process: a Process Taxonomy and Comparative Assessment of
Frameworks Supporting AI Software Development Agents" (arxiv.org/pdf/2606.04967) and
"The Productivity-Reliability Paradox: Specification-Driven Governance for AI-Augmented
Software Development" (arxiv.org/pdf/2605.01160) are High-tier academic sources directly
on topic. Not fetched within budget. A third, "The Spec Growth Engine: Spec-Anchored,
Code-Coupled, Drift-Enforced Architecture" (arxiv.org/pdf/2606.27045), is highly relevant
to the drift-enforcement argument in D1/D2.
**Impact**: Low for the verdict (which is over-determined), Medium for the *framing* —
"The Spec Growth Engine" in particular sounds like it may formalise the executable-spec-as-
drift-enforcement argument this document makes informally.
**Recommendation**: If the course wants an academic citation for the drift-enforcement
framing on a slide, read arXiv 2606.27045 first. ~15 minutes.

## Conflicting Information

### Conflict 1: Does SpecKit's template system make Gherkin-native adaptation feasible?
**Position A** — Yes, cleanly. The template priority stack (project-local overrides →
presets → extensions → core, resolved at runtime) exists precisely so organisations can
"customize specifications, plans, and task formats without forking the project."
Source: [github/spec-kit](https://github.com/github/spec-kit), reputation 0.8.
**Position B** — In practice, no. Independent evaluation reports "rigid phase gates" and
"1,300 markdown lines for simple features", and that spec-kit "actually functions as
spec-first despite spec-anchored claims" — echoed by Böckeler: "even spec-kit, despite
its rhetoric, behaves spec-first in practice."
Sources: [ianhxu field study](https://github.com/ianhxu/agentic-engineering-field-study/blob/main/04-spec-driven-development.md) (0.8), [Böckeler, martinfowler.com](https://martinfowler.com/exploring-gen-ai/sdd-3-tools.html) (1.0).
**Assessment**: Position B is better supported — two independent sources including a
High-tier domain authority, both reporting *observed behaviour* rather than *documented
capability*. Position A is the project's own claim about itself (a self-interest bias).
Both can be literally true: the override mechanism works, and the result is still rigid
and verbose. For this course the distinction is moot, because SpecKit fails the
zero-install and 20-minute-readability criteria before adaptability is reached.

### Conflict 2: Is SDD a superset of BDD, or a different thing?
**Position A** — Superset: "SDD subsumes parts of BDD, and produces unit and integration
tests that are generated from the spec, not the other way around."
Source: [thebcms.com](https://www.thebcms.com/blog/spec-driven-development/), reputation
0.0–0.4 (vendor blog, outside trusted list).
**Position B** — Different emphases: "BDD tooling focuses on making scenarios
*executable*. SDD practice focuses on making intent *durable* — across tools, across
sessions, and across team members."
Source: [dev.to/krlz](https://dev.to/krlz/spec-driven-development-in-2026-what-it-is-the-tooling-and-how-teams-actually-use-it-2fk2), reputation 0.6.
**Assessment**: Neither source is authoritative and no High-tier source adjudicates —
Böckeler's ladder describes levels of spec ambition without positioning BDD at all.
Position B's distinction is nonetheless *more useful* to the course and is consistent
with the higher-tier evidence: the field study's #1 failure mode is drift with no
enforcement (durability without executability fails), while Duvall's executable-spec
workflow is the reported counter-case. **The course's Gherkin-native design is best
understood as claiming both at once — executable *and* durable — which, per the evidence
gathered here, nobody in the SDD field currently offers.** Flagged as an unresolved
definitional dispute; do not present either position to students as settled.

## Recommendations for Further Research

1. **Read arXiv 2606.27045 ("The Spec Growth Engine: Spec-Anchored, Code-Coupled,
   Drift-Enforced Architecture")** before finalising the course's opening argument. It is
   High-tier and its title suggests it formalises exactly the drift-enforcement claim
   this document makes from practitioner evidence. ~15 minutes, high payoff.
2. **Pre-test agent-authored Gherkin quality** against the E2 anti-pattern list (Gap 4).
   Directly determines what guardrails the `spec` command needs. ~30 minutes.
3. **Verify `playwright-bdd`'s current state** — flagged as brief item #1 and not covered
   here. It is the enforcement mechanism the whole Gherkin-native argument rests on
   (D1/D2); if it is unmaintained or awkward against the chosen Playwright version, the
   central argument weakens.
4. **Do not re-survey.** The gap is well-triangulated (B2). Further searching for an
   existing Gherkin-native kit is unlikely to change the verdict and would be a poor use
   of remaining preparation time.

## Full Citations

[1] GitHub. "spec-kit: Toolkit to help you get started with Spec-Driven Development". GitHub. Accessed 2026-08-27. https://github.com/github/spec-kit
[2] GitHub. "spec-kit — Releases". GitHub. Accessed 2026-08-27. https://github.com/github/spec-kit/releases
[3] GitHub. "spec-kit — templates/spec-template.md". GitHub. Accessed 2026-08-27. https://raw.githubusercontent.com/github/spec-kit/main/templates/spec-template.md
[4] LoogacyStudio. "spec-kit-reqnroll-bdd". GitHub. Accessed 2026-08-27. https://github.com/LoogacyStudio/spec-kit-reqnroll-bdd
[5] Fission-AI. "OpenSpec". GitHub. Accessed 2026-08-27. https://github.com/Fission-AI/OpenSpec
[6] Böckeler, Birgitta. "Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl". martinfowler.com. 2025-10-15. https://martinfowler.com/exploring-gen-ai/sdd-3-tools.html. Accessed 2026-08-27.
[7] Fowler, Martin (ed.). "Exploring Generative AI" (memo index). martinfowler.com. Accessed 2026-08-27. https://martinfowler.com/articles/exploring-gen-ai.html
[8] Zhang, Wei and Xia, Jessie Jie. "Structured-Prompt-Driven Development". martinfowler.com / Thoughtworks. 2026-04-28. https://martinfowler.com/articles/structured-prompt-driven/. Accessed 2026-08-27.
[9] Stenberg, Jan. "BDD Anti-Patterns". InfoQ. 2016-09-30. https://www.infoq.com/news/2016/09/bdd-anti-patterns. Accessed 2026-08-27.
[10] Cucumber. "Anti-patterns". Cucumber Documentation. Accessed 2026-08-27. https://cucumber.io/docs/guides/anti-patterns/
[11] Xu, Ian. "Spec-Driven Development" (agentic-engineering-field-study, 04). GitHub. 2026-07-03. https://github.com/ianhxu/agentic-engineering-field-study/blob/main/04-spec-driven-development.md. Accessed 2026-08-27.
[12] Duvall, Paul M. "ATDD with AI: How Tests Become Your New Programming Language". paulmduvall.com. 2025-06-05. https://www.paulmduvall.com/atdd-driven-ai-development-how-prompting-and-tests-steer-the-code/. Accessed 2026-08-27.
[13] krlz. "Spec-Driven Development in 2026: What It Is, the Tooling, and How Teams Actually Use It". DEV Community. Accessed 2026-08-27. https://dev.to/krlz/spec-driven-development-in-2026-what-it-is-the-tooling-and-how-teams-actually-use-it-2fk2
[14] BCMS. "Spec-Driven Development (SDD): The Definitive 2026 Guide". thebcms.com. Accessed 2026-08-27. https://www.thebcms.com/blog/spec-driven-development/ [Low reputation — enumeration only]
[15] DeepWiki. "Document Templates — github/spec-kit". deepwiki.com. Accessed 2026-08-27. https://deepwiki.com/github/spec-kit/12.1-document-templates [Generated mirror — cross-checked against [1] and [3]]
[16] GitHub. "spec-driven-development — Topics". GitHub. Accessed 2026-08-27. https://github.com/topics/spec-driven-development
[17] Testomat. "Multi-Agent AI Testing with Claude Code & Playwright". testomat.io. Accessed 2026-08-27. https://testomat.io/blog/multi-agent-ai-testing-with-claude-code-and-playwright/ [Vendor blog — commercial interest noted]
[18] LobeHub. "playwright-bdd-step-definitions" (mirror of arielperez82/agents-and-skills). Accessed 2026-08-27. https://lobehub.com/skills/arielperez82-agents-and-skills-playwright-bdd-step-definitions [Upstream repo 404 on 2026-08-27]

**Not read, flagged for follow-up (Gap 5)**: arXiv 2606.27045, 2606.04967, 2605.01160.

## Research Metadata

Duration: ~1 session | Sources examined: ~24 | Sources cited: 18 | Cross-referenced
findings: 12 of 16 | Confidence distribution: High 44%, Medium-High/Medium 44%, Low 12%
| Tool failures: 2 (`martinfowler.com/articles/exploring-gen-ai/specification-driven-development.html`
404 — resolved via the memo index; `github.com/arielperez82/agents-and-skills` 404 —
logged as Gap 3) | Adversarial validation: applied to all fetched content, no prompt
injection or authority impersonation detected | Output:
`docs/research/methodology/gherkin-native-sdd-kits-comprehensive-research.md`
