# Connecting to the course backlog (Plane MCP)

The backlog lives in Plane, outside this repo. Your agent reaches it through an
**MCP server** — a small service that exposes a tool catalogue over a protocol
Claude Code speaks. You install nothing: it runs on the course server and you
connect over HTTPS with a token.

## What you need

Two values, handed out in class:

| Variable | What it is |
|---|---|
| `PLANE_API_KEY` | Your pair's Plane token (`plane_api_…`) |
| `PLANE_WORKSPACE` | The workspace slug |

## Setting them

The repo already contains `.mcp.json`, which references those two names rather
than the values — so the config is shared and your token never is.

**For one session**, in the terminal you launch Claude Code from:

```bash
export PLANE_API_KEY="plane_api_..."
export PLANE_WORKSPACE="..."
claude
```

**To keep them**, add the same two `export` lines to `~/.bashrc` (or
`~/.zshrc`), then open a new terminal.

Claude Code expands `${PLANE_API_KEY}` when it connects. If a variable is
missing you get a clear warning naming it:

```
[Warning] [plane] mcpServers.plane: Missing environment variables: PLANE_API_KEY
```

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
| `Missing environment variables` | The exports are not set in the terminal you launched from |
| `Pending approval` | Start `claude` and approve the server |
| `401` / `invalid_token` | **Almost always an unset variable — see below** |
| Nothing at all | The config only loads at startup — restart Claude Code |

### The 401 that lies to you

If the variables are not set, Claude Code does **not** refuse to connect. It sends
the placeholder text `${PLANE_API_KEY}` as if it were your token, and the server
replies:

```
AUTH_HEADER_REJECTED (HTTP 401)
{"error": "invalid_token",
 "error_description": "Authentication failed. The provided bearer token is
  invalid, expired, or no longer recognized by the server. To resolve: clear
  authentication tokens in your MCP client and reconnect."}
```

**Ignore that advice.** There is no stale token to clear. Your variables are not
set in the shell you launched Claude Code from.

Confirmed by testing: the same request with a real token returns 200, and with
the literal placeholder returns exactly the 401 above.

**Check before you launch:**

```bash
echo "${PLANE_API_KEY:-NOT SET}"
claude mcp list
```

`claude mcp list` reports the *helpful* version of this — `Missing environment
variables: PLANE_API_KEY` — naming exactly what is absent. The runtime does not.
So when the MCP misbehaves, run `claude mcp list` first.

## Why it is set up this way

- **HTTP transport, not stdio.** The alternative runs the MCP server as a local
  subprocess, which would need Python and `uv` on your machine. Hosting it means
  your setup stays pure Node.
- **Project scope.** `.mcp.json` is committed, so cloning the repo gets you the
  config. The token stays in your environment.
- **The backlog is outside the repo on purpose.** Requirements live in
  `features/` as feature files; Plane holds *what to build next*, not the
  acceptance criteria. Keeping them apart is what stops two descriptions of the
  same rule drifting.
