# Connecting to the course backlog (Plane MCP)

The backlog lives in Plane, outside this repo. Your agent reaches it through an
**MCP server** — a small service that exposes a tool catalogue over a protocol
Claude Code speaks. You install nothing and you configure nothing: it runs on the
course server, and this repo's `.mcp.json` carries the address, the course
token and the workspace.

## First run: approve it

A project-scoped MCP server is **not** trusted automatically — a repo could
otherwise point your agent at any server. The first time you start Claude Code
you will see:

```
plane: … (HTTP) - ⏸ Pending approval (run `claude` to approve)
```

Approve it when prompted. This is per-machine, once.

## Checking it works

```bash
claude mcp list
```

`plane: … (HTTP) - ✓ Connected` means you are set. Then ask your agent
something only the backlog can answer, e.g. *"list the work items in our Plane
project"*.

## When it does not work

| What you see | What it means |
|---|---|
| `Pending approval` | Start `claude` and approve the server |
| Nothing at all | The config only loads at startup — restart Claude Code |
| `401` / `invalid_token` | The course token has been rotated, or `.mcp.json` was edited locally. Ask in the room |

## The course credentials

One shared account for the whole class — `kurs@smidigakademiet.no`, workspace
`sdd-kurs`. The password and the token are on the course page at
[smidigakademiet.no/docs/sdd-kurs](https://smidigakademiet.no/docs/sdd-kurs),
which is how you get into Plane in the browser to create your pair's project.

Everything in the course environment is deleted after the course, and the token
is rotated. **Nothing in here is a secret worth protecting** — which is exactly
why it can sit in a committed file.

### Using your own token instead

Point the two headers at your own account if you want to work in a different
workspace: edit `.mcp.json` locally, or override them with environment
variables in a copy. Claude Code expands `${PLANE_API_KEY}` in that file if you
prefer the variable form.

## Why it is set up this way

- **HTTP transport, not stdio.** The alternative runs the MCP server as a local
  subprocess, which would need Python and `uv` on your machine. Hosting it means
  your setup stays pure Node.
- **Project scope, credentials included.** `.mcp.json` is committed, so cloning
  the repo is the whole setup. That is only acceptable because the account is a
  throwaway shared by the class — never do this with a real workspace.
- **The backlog is outside the repo on purpose.** Plane is where a product person
  reads and orders the work; `features/` is what the tests run. The work item
  carries the same rules and examples as the feature file, written in the same
  step, and every step after the spec compares them and stops if they differ (see
  decision 5). The check is what stops two descriptions of the
  same rule drifting.
