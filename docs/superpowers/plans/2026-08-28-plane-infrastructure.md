# Plane Backlog Infrastructure — Implementation Plan (Plan D)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A self-hosted Plane instance on Coolify holding the course backlog, with a
project per pair and a verified MCP connection that every student can use with the
least possible local setup.

**Architecture:** Plane deployed on the instructor's Coolify server. Each pair gets
its own Plane project inside one shared workspace, so twelve pairs do not collide.
Students reach the backlog through Plane's official MCP server — ideally over HTTP
against a centrally hosted MCP so nothing is installed locally, falling back to
per-student `uvx` over stdio if header-based tokens turn out not to work
self-hosted.

**Executed by:** the instructor's agent, not the students.

## BLOCKER — required before Task 2

This plan cannot proceed past Task 1 without:

1. **Coolify URL** and either an API token or dashboard access
2. **A hostname/subdomain** for Plane, with DNS pointing at the Coolify server
3. Confirmation the server has headroom — Plane runs Postgres, Redis, MinIO, a
   Django API and several workers; budget roughly 4 GB RAM and 20 GB disk
4. Whether TLS is handled by Coolify's proxy (normally yes)

Ask for these before starting. Do not guess a hostname, and do not deploy into an
existing project without being told which one.

## Global Constraints

- **Nothing here touches the course repository.** No files in `backend/`, `frontend/`, `contract/`, `features/` or `specs/`. The only repo artifact this plan produces is documentation under `docs/`.
- **No student credential may be committed.** Tokens go in the instructor's own notes and are handed out in the room.
- **The MCP is the teaching artifact.** Plane was chosen over lighter alternatives because its MCP is first-party and well designed (177 operations consolidated into 30 action-based tools). Preserve access to that design story — do not hide it behind a wrapper.
- **Verify, do not assume.** Every claim about what the self-hosted MCP supports must be tested against the actual deployment.

---

### Task 1: Gather access and confirm the target

**Files:**
- Create: `docs/course-infrastructure.md`

- [ ] **Step 1: Ask the instructor for the four items in the BLOCKER section**

Do not proceed until all four are answered. Record them in
`docs/course-infrastructure.md` — **the URL and hostname only, never a token.**

- [ ] **Step 2: Confirm Coolify is reachable and see what version it is**

```bash
curl -sS -o /dev/null -w '%{http_code}\n' "$COOLIFY_URL"
```

Expected: `200` or `302`. If this fails, stop and report — everything else depends
on it.

- [ ] **Step 3: Check whether Coolify has a Plane service template**

In the Coolify dashboard, search the one-click services for "Plane". Record the
answer in `docs/course-infrastructure.md`, because it decides Task 2:

- **Template exists** → use it (Task 2, path A)
- **No template** → deploy Plane's official compose file as a Docker Compose
  resource (Task 2, path B)

- [ ] **Step 4: Commit the infrastructure note**

```bash
git add docs/course-infrastructure.md
git commit -m "Record Coolify target and Plane deployment path"
```

---

### Task 2: Deploy Plane

**Files:**
- Modify: `docs/course-infrastructure.md`

- [ ] **Step 1: Fetch Plane's current self-host instructions**

```bash
curl -sS https://raw.githubusercontent.com/makeplane/plane/master/deploy/selfhost/docker-compose.yml -o /tmp/plane-compose.yml
head -40 /tmp/plane-compose.yml
```

Read the file before deploying it. Note which services it defines and which
environment variables have no default — those are the ones that must be set.

- [ ] **Step 2: Deploy**

**Path A (Coolify template):** create the service from the template, set the domain
to the agreed hostname, and let Coolify generate the secrets it offers to generate.

**Path B (compose resource):** create a Docker Compose resource, paste the compose
file, set the domain, and supply every variable that had no default — at minimum a
secret key, the web URL, and database credentials.

Either way, **write down which path was used** in `docs/course-infrastructure.md`.

- [ ] **Step 3: Wait for it to come up and verify**

```bash
curl -sS -o /dev/null -w '%{http_code}\n' "https://$PLANE_HOST"
```

Expected: `200`. First boot runs migrations and may take several minutes; if it
returns 502, check the API container's logs in Coolify before assuming failure.

- [ ] **Step 4: Create the instructor account and a workspace**

Through the web UI: sign up as the first user (which becomes the instance admin),
then create **one workspace** for the course. Record the workspace **slug** — the
MCP needs it.

- [ ] **Step 5: Commit**

```bash
git add docs/course-infrastructure.md
git commit -m "Deploy Plane on Coolify and record workspace slug"
```

---

### Task 3: Verify the MCP against the self-hosted instance

**Files:**
- Modify: `docs/course-infrastructure.md`

**This task resolves the plan's one real unknown.** Plane's MCP documents
`PLANE_BASE_URL` for self-hosted instances, and documents header-based personal
access tokens **for its hosted service**. Whether a self-hosted MCP in HTTP mode
accepts per-student PATs via headers is untested, and the answer decides whether
students install anything at all.

- [ ] **Step 1: Create an API token**

Plane web UI → Workspace Settings → API tokens. Create one named
`mcp-instructor`. Copy it somewhere safe; **do not commit it.**

- [ ] **Step 2: Verify the API answers before involving MCP**

```bash
curl -sS -H "X-API-Key: $PLANE_TOKEN" \
  "https://$PLANE_HOST/api/v1/workspaces/$PLANE_WORKSPACE/projects/" | head -c 400
```

Expected: JSON, not an HTML error page. If this fails, the MCP cannot possibly
work — fix it here.

- [ ] **Step 3: Test the MCP over stdio**

```bash
PLANE_API_KEY="$PLANE_TOKEN" \
PLANE_WORKSPACE_SLUG="$PLANE_WORKSPACE" \
PLANE_BASE_URL="https://$PLANE_HOST" \
  uvx plane-mcp-server stdio
```

Expected: the server starts and waits on stdin. It requires Python 3.10+ via `uvx`.
Send an MCP `initialize` request, or simply confirm it starts without an auth error,
then stop it.

**Record the result.** If stdio works, students have a guaranteed fallback.

- [ ] **Step 4: Test HTTP mode with a per-user token — the decisive check**

```bash
PLANE_BASE_URL="https://$PLANE_HOST" uvx plane-mcp-server http --port 8765 &
sleep 3
curl -sS -X POST http://localhost:8765/mcp \
  -H 'content-type: application/json' \
  -H "Authorization: Bearer $PLANE_TOKEN" \
  -H "X-Workspace-slug: $PLANE_WORKSPACE" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | head -c 600
```

Run `plane-mcp-server --help` first to confirm the HTTP subcommand's actual name and
flags rather than trusting the invocation above.

**Two possible outcomes, both acceptable — record which:**

- **Tools list returned** → host the MCP centrally on Coolify (Task 4). Students add
  a URL and a token. **Nothing installed locally.**
- **Auth rejected or tokens ignored** → each student runs stdio via `uvx`, which adds
  a `uv`/Python dependency to an otherwise pure-Node setup. Note it in the pre-class
  instructions so it is not discovered on the day.

- [ ] **Step 5: Write the outcome up**

Record in `docs/course-infrastructure.md`: which transport works, the exact client
configuration a student needs, and any error encountered. This is the single most
useful paragraph in the document.

- [ ] **Step 6: Commit**

```bash
git add docs/course-infrastructure.md
git commit -m "Verify Plane MCP against the self-hosted instance"
```

---

### Task 4: Host the MCP centrally (only if Task 3 step 4 succeeded)

**Files:**
- Modify: `docs/course-infrastructure.md`

Skip this task entirely if header-based tokens did not work; go to Task 5.

- [ ] **Step 1: Deploy the MCP server as a Coolify resource**

Create a second resource running `plane-mcp-server` in HTTP mode, on its own
subdomain, with `PLANE_BASE_URL` pointing at the Plane instance. It needs no API key
of its own — each request carries the student's.

- [ ] **Step 2: Verify from outside the server**

```bash
curl -sS -X POST "https://$MCP_HOST/mcp" \
  -H 'content-type: application/json' \
  -H "Authorization: Bearer $PLANE_TOKEN" \
  -H "X-Workspace-slug: $PLANE_WORKSPACE" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | head -c 400
```

Expected: a tools list. This is what a student's machine will do.

- [ ] **Step 3: Commit**

```bash
git add docs/course-infrastructure.md
git commit -m "Host Plane MCP centrally over HTTP"
```

---

### Task 5: Projects, accounts and tokens for the room

**Files:**
- Modify: `docs/course-infrastructure.md`

- [ ] **Step 1: Decide the number of pairs and create a project each**

Ask the instructor how many pairs to expect, then add two spares. Create one Plane
project per pair, named `pair-01` … `pair-NN`.

This is what makes a shared instance survivable: pairs never see each other's
backlog items, so nobody is confused by work they did not create.

- [ ] **Step 2: Create accounts and tokens**

For each pair, create a Plane user and an API token. Keep them in a **local,
uncommitted** file — a printable handout with one row per pair:

```
pair-03   user: pair03@course.local   password: ...   token: plane_api_...
```

Add that file's name to `.gitignore` if it lives in the repo directory at all.
Preferably keep it outside the repo entirely.

- [ ] **Step 3: Verify one pair account end to end**

Using `pair-01`'s token, not the instructor's, list projects through the MCP path
that Task 3 established works. Confirm it sees `pair-01` and behaves sensibly.

A token that works for the instructor and not for a pair account is exactly the
failure that would surface at 09:15 in the room.

- [ ] **Step 4: Commit the documentation only**

```bash
git add docs/course-infrastructure.md .gitignore
git commit -m "Create per-pair Plane projects and verify a pair token"
```

---

### Task 6: Seed the backlog and write the student connection guide

**Files:**
- Modify: `docs/course-infrastructure.md`
- Create: `docs/student-mcp-setup.md`

Plan C authors the actual backlog items; this task creates the container for them
and proves the write path works.

- [ ] **Step 1: Create one work item in `pair-01` through the MCP**

Not through the web UI — through the MCP, so the write path is proven, not assumed.
Create a throwaway item, confirm it appears in the web UI, then delete it.

- [ ] **Step 2: Write the student setup guide**

`docs/student-mcp-setup.md` must contain the **exact** configuration a student
pastes, filled in with the real host and workspace slug — not a template with
placeholders they have to reason about. Include:

- what to paste, and where
- how to confirm it worked (a single command or prompt whose output they can check)
- what the failure looks like and who to ask

- [ ] **Step 3: Follow your own guide on a clean profile**

Configure the MCP exactly as written, using `pair-02`'s token, and confirm it works
without consulting anything else. Any step you had to improvise is a step that will
fail in the room.

- [ ] **Step 4: Commit**

```bash
git add docs/student-mcp-setup.md docs/course-infrastructure.md
git commit -m "Seed Plane backlog container and document student MCP setup"
```

---

## Self-Review

**Spec coverage against `docs/course-design-decisions.md`:**

| Requirement | Task |
|---|---|
| Plane self-hosted on Coolify (32) | 2 |
| Official MCP as the course's worked MCP example (31, §3b) | 3, 4 |
| A project per pair solves the shared-instance problem (§3b) | 5 |
| Per-student PAT question resolved (§5 item 5) | 3 step 4 |
| Backlog lives outside the repo, requirements stay in git (5) | throughout — no spec content in Plane |

**Not in this plan:** the backlog items' content (Plan C), and the SDD kit's MCP
usage (Plan C).

**Known risk:** Plane is the heaviest self-host of the candidates considered. That
was accepted deliberately — the weight lands on the instructor's server before the
course, while MCP quality would land on students, live, in the room.
