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

### Next

- Instructor admin account + course workspace (Plan D Task 2 step 4)
- API token, then MCP verification — the per-student token question (Task 3)
