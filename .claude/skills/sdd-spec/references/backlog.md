<!-- Copied from skald-sdd/plugins/sdd-lite by scripts/sync-sdd-lite.sh — edit there, not here. -->

# The backlog — config, the work item, and the drift check

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
| `pair` | Short lowercase name for the pair. Prefixes every branch, so two pairs never collide. With Plane it is the project identifier, lowercased |
| `backlog` | `plane` or `markdown` |
| `planeProject` | The Plane project's identifier (the prefix in `LEGE-3`). Plane mode only |
| `planeProjectId` | The project's UUID. Plane mode only — see below, it cannot be looked up |

**No config file** — only `sdd-spec` creates one. Every other skill stops and says: "No
`.sdd/config.json` — run `sdd-spec` first."

**Creating it** (`sdd-spec` only). Ask, in one message:

1. "Are you using Plane? If so, paste the URL of your project — open it in Plane and copy the
   address bar."
2. Markdown mode only: "What short name should your branches use?" (suggest one from the repo's
   git user, e.g. `kari-ola`)

**Never look a project up by name.** This Plane (Community Edition) answers `project list` with
404 — the connector calls an endpoint the edition does not have. The URL is the way in:

```
https://plane.example.com/<workspace>/projects/<uuid>/issues/
                                               ^^^^^^ planeProjectId
```

Confirm it with `project` `retrieve` (`project_id`), which does work, and read `identifier` from
the answer into `planeProject`. If retrieve fails, the pair pasted the wrong URL or the account
is not a member of that project — say which and ask again. Never create a project: the pair
creates it in Plane.

## The work item

One item = one feature request = one ID.

| | Plane mode | Markdown mode |
|---|---|---|
| **ID** | Plane's, e.g. `LEGE-3` | `ITEM-<n>`, next free number under `.sdd/` |
| **The item** | The Plane work item; its description holds the template below | `.sdd/<ID>/item.md`, same template in markdown |
| **Status** | Plane state: Backlog → Todo → In Progress → Done | a `Status:` line at the top of `item.md`, same four values |
| **Plan and tasks** | `.sdd/<ID>/plan.md`, `.sdd/<ID>/tasks.md` | same |
| **Feature file** | `features/<id-lowercase>-<slug>.feature` | same |
| **Branch** | `<pair>/<ID>`, e.g. `lege/LEGE-3` | `team-blue/ITEM-2` |

Plane MCP tools used: `project` (`retrieve`), `workitem` (`retrieve_by_identifier`, `list` with a
`project_id`, `create`, `update`), `state` (`list` with a `project_id` — look the state id up by
name before moving an item), `workitem_comment` (`create`). A Plane description is **HTML**, not
markdown: write it with `description_html`.

**Anything workspace-wide fails on Community Edition** — `project list`, `workitem list` without a
`project_id`, and `workitem search` all answer 404. Always pass `project_id` from the config.

## The template

Same sections in both modes, in this order. Every section that has nothing in it is left out.

**Markdown (`item.md`):**

````markdown
# <ID> — <title>

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

- <a guess the pair told the kit to make — see sdd-spec § "Make up the rest">

## Files

- Feature file: `features/<id>-<slug>.feature`
- Plan: `.sdd/<ID>/plan.md`
````

**Plane (`description_html`)** — the same structure:

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

## Two copies, one agreement

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
two short columns — item says / feature file says — and ask which one is right. Then write the
answer into the other copy and continue. Never pick a side yourself: a difference means a human
changed one of them, and only a human knows which change they meant.
