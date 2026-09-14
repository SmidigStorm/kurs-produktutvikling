<!-- Copied from skald-sdd/plugins/sdd-lite by scripts/sync-sdd-lite.sh — edit there, not here. -->

# sdd-lite

A small spec-driven development kit for teaching. Four steps, one skill each:

```
sdd-spec  →  sdd-plan  →  sdd-tasks  →  sdd-implement
  what         how         in what        build it,
               (pick 1     order          test first
               of 2)
```

| Skill | Asks you | Writes |
|---|---|---|
| `sdd-spec` | one question at a time, each with a suggested answer | the work item (Plane or `.sdd/<ID>/item.md`) **and** `features/<capability>.feature` |
| `sdd-plan` | once: which of two approaches | `.sdd/<ID>/plan.md` |
| `sdd-tasks` | nothing | `.sdd/<ID>/tasks.md`, one task per concrete change |
| `sdd-implement` | nothing, unless it gets stuck | code, unit tests, e2e steps; pushes the pair's branch |

After `sdd-spec`, a **spec-reviewer** sub-agent reads the spec cold, without the conversation,
and reports what a developer would still have to guess.

## The building blocks

The kit is made of the three things the course teaches:

- Skills: the four steps above, plain markdown in `skills/`
- An MCP server: the Plane connector, for the work item
- A sub-agent: `spec-reviewer`, fresh eyes on the spec

## Where things live

| | |
|---|---|
| **The work item** | Plane, or `.sdd/<ID>/item.md` if you are not using Plane. Story, rules, examples, open questions |
| **The acceptance criteria** | `features/*.feature`, the same rules and examples, as Gherkin. The tests run these |
| **Plan and tasks** | `.sdd/<ID>/`. A task is one concrete change: this file, this function, this step, this test |
| **Your settings** | `.sdd/config.json`, written the first time you run `sdd-spec` |

The work item and the feature file hold the same rules and examples. Whoever changes one changes
both, and every step after `sdd-spec` checks they still agree before it starts.

## Install

In the course repo it is **already installed**: the skills sit in `.claude/skills/` and the
agent in `.claude/agents/`, so a `git clone` is the whole setup. Run `/sdd-spec` with a feature
request.

In another repo, either copy those folders in, or install the plugin from the `skald-sdd`
marketplace: `/plugin install sdd-lite@skald-sdd`. The agent is then called
`sdd-lite:spec-reviewer`.

Plane is optional. Without it, answer "no" when `sdd-spec` asks, and the work item is a markdown
file.

## Tips

Tired of questions? Say **"make up the rest."** `sdd-spec` then answers what is left itself,
records each answer as an assumption, and tags the scenarios resting on one `@assumption`, so
`grep -rn @assumption features/` tells you afterwards how much of the spec was a guess.

Stop `npm run dev` before running `sdd-implement`: the end-to-end tests start their own servers
and the ports will already be taken.

The pair works on one branch for the whole class, not one per item. The kit stays on whatever
branch you are on, and creates `<pair>` only when you are still on `main`. Nothing writes to
`main`.
