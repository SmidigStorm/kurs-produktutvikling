<!-- Copied from skald-sdd/plugins/sdd-lite by scripts/sync-sdd-lite.sh — edit there, not here. -->

# The backlog: config, the work item, and the drift check

Every skill in this kit reads this file. It is the only place the two backlog modes differ.

## `.sdd/config.json`

Written by `sdd-spec` the first time it runs in a repo, read by every skill after.

```json
{
  "pair": "lege",
  "backlog": "plane",
  "planeProject": "LEGE",
  "planeProjectId": "3f41e06f-c495-438f-aa6c-6862254ab9b5"
}
```

```json
{ "pair": "team-blue", "backlog": "markdown" }
```

| Field | Meaning |
|---|---|
| `pair` | Short lowercase name for the pair. Names their branch, so two pairs never collide. With Plane it is the project identifier, lowercased |
| `backlog` | `plane` or `markdown` |
| `planeProject` | The Plane project's identifier (the prefix in `LEGE-3`). Plane mode only |
| `planeProjectId` | The project's UUID. Plane mode only. See below: on an old instance it cannot be looked up |

The file is per pair, so it is not committed: `sdd-spec` adds `.sdd/config.json` to `.gitignore`
when it writes it, if the line is not there already.

**Only `sdd-spec` creates the config file.** Every other skill stops when it is missing and
says: "No `.sdd/config.json`. Run `sdd-spec` first."

**Creating it** (`sdd-spec` only). Ask, in one message:

1. "Are you using Plane? If so, what is your project called?"
2. Markdown mode only: "What should your branch be called?" (suggest one from the repo's
   git user, e.g. `kari-ola`)

In Plane mode, call `project` `list` and match what the pair said against both `name` and
`identifier`, case-insensitively. No match: show the projects you can see and ask which. Save
both the `identifier` as `planeProject` and the `id` as `planeProjectId`, because every later
call passes the UUID.

**If `project list` returns 404**, the instance is older than Plane v1.4.0, where those list
endpoints arrived. Fall back to the project URL, which carries the UUID, and confirm it with
`project` `retrieve`:

```
https://plane.example.com/<workspace>/projects/<uuid>/issues/
                                               ^^^^^^ planeProjectId
```

Never create a project: the pair creates it in Plane.

## The work item

One item = one feature request = one ID.

| | Plane mode | Markdown mode |
|---|---|---|
| **ID** | Plane's, such as `LEGE-3` | `ITEM-<n>`, the next free number under `.sdd/` |
| **The item** | The Plane work item, whose description holds the template below | `.sdd/<ID>/item.md`, the same template in markdown |
| **Status** | Plane state: Backlog, Todo, In Progress, Done | a `Status:` line at the top of `item.md`, the same four values |
| **Plan** | `.sdd/<ID>/plan.md` | same |
| **Tasks** | Sub-work-items under the item, one per concrete change | `.sdd/<ID>/tasks.md` |
| **Feature file** | `features/<id-lowercase>-<slug>.feature` | same |
| **Branch** | whichever branch the pair is on. See below | same |

Plane MCP tools used: `project` (`list`, `retrieve`), `workitem` (`retrieve_by_identifier`, `list` with a
`project_id`, `create` with `parent` for a task, `update`), `state` (`list` with a `project_id`, to look the state id up by
name before moving an item), `workitem_comment` (`create`). A Plane description is **HTML**, not
markdown: write it with `description_html`.

**`workitem list` without a `project_id` answers 404** on a self-hosted Community Edition, which
has no workspace-wide item list. Always pass the config's `planeProjectId`. (`workitem search` does
work workspace-wide.) **`pql` is refused outright** on Community Edition, so filter the list
yourself: an item's tasks are the rows whose `parent` is the item's id.

## The branch

**One branch for everything the pair builds, not one per item.** A class is a day long and a pair
works through several items; switching branches between them costs time and teaches nothing.

Every skill starts by reading the current branch:

| Where they are | Do |
|---|---|
| On any branch except `main` | **Stay there.** Whatever it is called, that is the pair's branch |
| On `main` | Create `<pair>` from it, switch, and say so in one line |

**Never create a branch per item, and never switch away from a branch the pair is already on.**
They may have named it themselves, or be sharing it with the other half of the pair. Only the move
off `main` is yours to make, and only once.

## The template

Same sections in both modes, in this order. Every section that has nothing in it is left out.

**Markdown (`item.md`):**

````markdown
# <ID>: <title>

Status: Todo

## Story

As a <who>, I want <what>, so that <why>.

## Rules

### Rule 1: <what must be true>

**Example: <scenario title>**

```gherkin
Given …
When …
Then …
```

## Open questions

- <a question only the product owner can answer>

## Assumptions

- <a guess the pair told the kit to make, per sdd-spec's "Make up the rest">

## Files

- Feature file: `features/<id>-<slug>.feature`
- Plan: `.sdd/<ID>/plan.md`
````

**Plane (`description_html`)**, the same structure:

```html
<h2>Story</h2><p>As a …, I want …, so that ….</p>
<h2>Rules</h2>
<h3>Rule 1: …</h3>
<p><strong>Example:</strong> …</p>
<pre><code>Given …
When …
Then …</code></pre>
<h2>Open questions</h2><ul><li><p>…</p></li></ul>
<h2>Assumptions</h2><ul><li><p>…</p></li></ul>
<h2>Files</h2><p>Feature file: features/….feature</p>
```

Plane wraps the whole description in a `<div>` when it saves. Ignore it when reading back.

## The rules live in two places

The item and the feature file carry **the same rules and the same examples**. Neither is generated
from the other. Three rules keep them honest:

1. **Whoever changes a requirement writes both copies, in the same step.** `sdd-spec` writes both.
   If `sdd-implement` finds an example is wrong, it fixes the feature file *and* the item.
2. **The build reads only the feature file.** The item is for humans.
3. **Every skill after `sdd-spec` starts with the drift check.**

### The drift check

Read the item (Plane: `retrieve_by_identifier` with `fields: description_html`; markdown:
`item.md`) and the feature file. Compare:

- the rule names, in order, against the feature file's `Rule:` lines
- under each rule, the example titles against the `Scenario:` titles
- each example's Given/When/Then lines against the scenario's steps, ignoring whitespace

Everything matches: say nothing and continue. Anything differs: **stop**. Show the difference as
two short columns, what the item says and what the feature file says, and ask which one is right. Then write the
answer into the other copy and continue. Never pick a side yourself. A difference means a human changed one of them, and only that human
knows which change they meant.
