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

### Headroom (verified 2026-08-28 over SSH)

Host `coolify-ubuntu-16gb-hel1-1` (Hetzner, 16 GB):

```
Mem:   15Gi total, 6.2Gi used, 9.0Gi available   (no swap)
Disk:  301G total,  36G used,  253G free (13%)
```

21 containers running, none restarting or unhealthy at the Docker level — so
Coolify's "degraded" on `n8n`/`ai-labs` is its own health reporting, not crashes.
Largest single consumer is `open-webui` at 930 MB. Ample room for Plane.

`class-mcp` turned out to be running **`mcp-everything`**, the MCP reference server —
teaching material, not a Plane MCP host. No conflict, nothing saved.

## Plane — deployed 2026-08-28

| | |
|---|---|
| URL | `https://plane.smidigakademiet.no` (Let's Encrypt, valid) |
| Version | v1.3.0, via Coolify's one-click `plane` template |
| Coolify project | `kurs-produktutvikling` / `cwv254t5t6nrs8pszcbqb5pm` |
| Service uuid | `bcnh9puwhbgls382tvllwqil` |
| Containers | 13: proxy, web, space, admin, live, api, worker, beat-worker, migrator, Postgres 15.7, Valkey, RabbitMQ, MinIO |

### Coolify API gap — recorded so this is reproducible

**Coolify 4.0.0-beta.470 cannot set a service FQDN through its public API.** Create
and update both reject a `domains` field with *"This field is not allowed"*, and
there is no endpoint for a service application (404 on every candidate path).
Patching the `SERVICE_FQDN_PLANE` env var is *not* enough — Traefik labels are
generated from `service_applications.fqdn` in Coolify's own database, so the service
kept serving on its generated `sslip.io` hostname and Traefik answered 503 with its
default certificate.

Resolved by updating that one field directly, scoped to a single uuid:

```sql
update service_applications
   set fqdn = 'https://plane.smidigakademiet.no'
 where uuid = 'tdmhc0x8kv1w9tcdedzyj5uk';   -- the proxy sub-service
```

followed by a restart through the API, which regenerated the labels correctly
(`Host(...)` on both entrypoints, `certresolver: letsencrypt`). **If Plane is ever
recreated, set the domain in the Coolify UI instead** — the UI writes the same field
through the supported path.

Three env vars also had to be corrected before deploying, because the template
defaults point at the generated hostname and `CORS_ALLOWED_ORIGINS` defaults to
`http://localhost`:

- `SERVICE_FQDN_PLANE`, `SERVICE_URL_PLANE`, `CORS_ALLOWED_ORIGINS`

### Instance state

Signup enabled, email/password auth enabled, self-managed.

**SMTP is not configured** (`is_smtp_configured: false`). Consequence for the course:
no invite emails and no password resets. Pair accounts must have their passwords set
directly and handed out on paper, and a student who locks themselves out cannot
self-recover.

## MCP — verified 2026-08-28

Workspace `storm-testworkspace`, project `Legevakt App` (`LEGEVAKTAP`).
Plane MCP server version **3.2.0**, 30 tools.

### The per-student token question is ANSWERED: no local install needed

`POST /http/api-key/mcp` with two headers works against the **self-hosted**
instance — this was the plan's one real unknown, and it resolves the good way:

| Header | Value |
|---|---|
| `Authorization` | `Bearer <the pair's Plane API token>` |
| `X-Workspace-slug` | the workspace slug |

Verified: `initialize` returns `Plane MCP Server (header-http) 3.2.0`, `tools/list`
returns **30 tools**, and a wrong token is rejected with **401**. So students need
**no `uv`, no Python, no local install** — a URL and a token, which keeps the setup
pure-Node as intended.

**stdio also works** as a guaranteed fallback: `PLANE_API_KEY`,
`PLANE_WORKSPACE_SLUG`, `PLANE_BASE_URL` + `uvx plane-mcp-server stdio`.

### Four gotchas, recorded because each cost time

1. **HTTP mode refuses to start without OAuth config**, even when only the api-key
   mount is wanted — it builds the OAuth provider unconditionally. Two dummy values
   suffice: `PLANE_OAUTH_PROVIDER_CLIENT_ID` and `PLANE_OAUTH_PROVIDER_CLIENT_SECRET`.
2. **The startup log is wrong.** It prints *"Starting HTTP server at URLs: /mcp and
   /header/mcp"*. Both 404. The real mounts are `/http/api-key` (header/PAT) and
   `/http` (OAuth) — confirmed in the source and by probing.
3. **`FASTMCP_PORT` is ignored**; the server chose 8211. Set the port through
   whatever the deployment honours, and verify rather than assume.
4. **Do not `pkill -f plane-mcp-server`** — the pattern matches the killing shell's
   own command line. Kill by PID.

## Central MCP — deployed and verified 2026-08-28

**`https://plane-mcp.smidigakademiet.no/http/api-key/mcp`** — live, Let's Encrypt,
verified end to end: `initialize` returns `Plane MCP Server (header-http) 3.2.0`,
`tools/list` returns **30 tools**, a wrong token gives **401**.

| | |
|---|---|
| Coolify application uuid | `q82hfr4x7cjtt650tb51ibmr` |
| Build | Dockerfile from `github.com/makeplane/plane-mcp-server`, branch `main` |
| Port | 8211 |
| Env | `PLANE_BASE_URL`, plus dummy `PLANE_OAUTH_PROVIDER_CLIENT_ID` / `_CLIENT_SECRET` / `_BASE_URL` |

**Students need nothing installed.** Their MCP client config is the URL above plus
two headers — `Authorization: Bearer <their token>` and `X-Workspace-slug: <slug>`.

Two API notes that differ from the services API:

- **The applications API *does* accept `domains` on create** — so no database edit
  was needed here, unlike the Plane service itself.
- `is_build_time` is rejected on the env endpoint (*"This field is not allowed"*);
  a minimal `{key, value}` payload works. Coolify then auto-creates a preview-copy
  of every variable, which is expected and harmless.

### Deployment background

**There is no published container image.** `ghcr.io/makeplane/plane-mcp-server`
denies, and the GitHub packages API reports the package does not exist. The repo
does ship a clean, purpose-built `Dockerfile` (python:3.11-slim, `EXPOSE 8211`,
`ENTRYPOINT python -m plane_mcp`, `CMD ["http"]`), so Coolify would build from the
public repository rather than pull an image.

What a deployment needs:

- a **second DNS A record** (e.g. `plane-mcp.smidigakademiet.no` → 204.168.231.70);
  there is no wildcard, so this must be created by hand
- env: `PLANE_BASE_URL`, plus dummy `PLANE_OAUTH_PROVIDER_CLIENT_ID` and
  `PLANE_OAUTH_PROVIDER_CLIENT_SECRET` (see gotcha 1)
- port 8211, and the Coolify FQDN set **in the UI**, not the API (see the Coolify
  API gap above)

Note the image hard-codes `ENV FASTMCP_PORT=8211` — which is also the port the app
picks regardless, confirming gotcha 3 rather than contradicting it.

### Decisions taken 2026-08-28

- **`storm-testworkspace` is a throwaway** for experimentation. The real course
  workspace will be created later.
- **No per-pair projects, accounts or tokens yet** — deferred until the course
  design settles. Cheap to create later, annoying to migrate.

### Next

- Deploy the MCP centrally (needs the DNS record above)
- Course workspace, then per-pair projects and tokens — remember SMTP is
  unconfigured, so passwords must be set directly and handed out on paper
