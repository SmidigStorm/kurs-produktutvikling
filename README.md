# Legevakt queue — course baseline

A small app for a course on process design with AI agents. Patients waiting at a
legevakt see their position in the queue, their triage level and an estimated
wait. Staff register arrivals and re-triage.

All data is fictional. The app holds no clinical content of any kind.

## Before the course (developers only)

Your pair needs **one** working machine — the developer's. Do this in advance, not
on the morning of the course.

1. Install Node 22 or newer: https://nodejs.org
2. Clone this repository
3. Install and check:

   ```bash
   npm install
   npm run verify-setup
   ```

   You must see `PASS`. If you see `FAIL`, the output lists what to fix. Bring that
   output to class if you get stuck.

4. Start the app:

   ```bash
   npm run reset
   npm run dev
   ```

   Open http://localhost:5173 — you should see five waiting patients.

On Linux distributions Playwright does not officially support (Arch, for example)
`npx playwright install` prints *"your OS is not officially supported"* and
downloads an Ubuntu build. That warning is expected and the browser works.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts backend (3001) and frontend (5173) |
| `npm run reset` | Recreates the database with fresh demo data |
| `npm run verify-setup` | Checks your machine, prints PASS or FAIL |
| `npm run typecheck` | Type-checks every package |
| `npm run lint` | React hooks rules |
| `npm test` | Unit and integration tests |
| `npm run test:e2e` | Gherkin scenarios in a real browser |
| `npm run build` | Production build of the frontend |
| `npm run deps:check` | Fails if a dependency needs native compilation |

None of these run automatically. There are no git hooks and no CI — **which checks
run, and when, is something you decide during the course.**

**Stop `npm run dev` before `npm run test:e2e`.** The end-to-end suite starts its
own servers on the same ports and will refuse to run if the dev server holds them.
That refusal is deliberate: reusing your dev server would point the tests at your
*development* database, and tests must never touch it.

## Layout

| Path | Owner |
|---|---|
| `specs/`, `features/` | Product |
| `contract/`, `backend/`, `frontend/`, `e2e/` | Development |

`contract/` holds the domain vocabulary and the wire schemas. A triage level is
declared there **once** and flows to the database column, the request validators
and the UI.

## How the queue works

Patients are seen in triage-level order (RED, ORANGE, YELLOW, GREEN, BLUE), and by
arrival time within a level.

The estimated wait is a **definition, not a prediction**: the sum of the average
consultation minutes of every patient ahead of you, using each of those patients'
own triage level. One consultation room is assumed. The same queue always produces
the same number.

Time enters through a single injectable clock (`backend/src/clock.ts`). No test
depends on the real wall clock, and the end-to-end suite advances the browser
clock rather than waiting out the refresh.

Open pages re-fetch every **5 seconds** (`frontend/src/config.ts`, declared once
for both views). That is a teaching choice: the app is demonstrated live, and a
longer interval reads as "nothing is happening".

## Two conventions worth knowing

**Backend imports use `.ts` extensions.** Node runs TypeScript directly by
stripping types, and it does not rewrite a `.js` specifier to the `.ts` file on
disk. So `./clock.ts` is correct here, with `allowImportingTsExtensions` set. No
build step, no extra dependency.

**The database path resolves against the repo root, never the current directory.**
npm runs a workspace script with its cwd set to that workspace, so a bare relative
path would mean `backend/data/...` for the server and `./data/...` for `npm run
reset` — two databases, and a reset that appears to do nothing.
