# Course infrastructure

Working notes for Plan D. **No credentials in this file, ever.**

## Coolify

| | |
|---|---|
| URL | `https://coolify-class.smidigakademiet.no` |
| Version | 4.0.0-beta.470 |
| Server | one host, `localhost` (the Coolify host itself), reachable and usable |
| Host IP | 204.168.231.70 |
| Auth | API token, held by the instructor — not recorded here |

### Already running on this server

| Service | Status |
|---|---|
| open-webui | running:healthy |
| rocketchat | running:healthy |
| class-mcp | running:unknown |
| n8n | degraded:unhealthy |
| ai-labs | degraded:unhealthy |

Existing projects: `n8n-class`, `ai-workshop`.

### Findings that affect the plan

- **No wildcard DNS.** `coolify-class.smidigakademiet.no` resolves; arbitrary
  subdomains under `smidigakademiet.no` do not. A DNS A record must be created for
  whatever hostname Plane gets, pointing at 204.168.231.70. **This is a hard
  prerequisite and cannot be done from the Coolify API.**
- **Headroom is unverified.** Coolify's metrics are disabled (`is_metrics_enabled:
  false`) and the API exposes no memory or disk figures, so the ~4 GB RAM / ~20 GB
  disk budget for Plane could not be confirmed remotely. Five services already run
  here, two of them degraded.
- **`GET /api/v1/servers/{uuid}/domains` returns a 500** on this Coolify build
  (`Undefined variable $ip`) — a beta bug, not a configuration problem. Use the
  resources and services endpoints instead.
- An existing service named **`class-mcp`** is running. Worth knowing what it is
  before adding another MCP host; it may already serve this purpose.

## Plane

Not yet deployed — blocked on the DNS record and the headroom question.
