# Research: GitHub-Ready TypeScript App Templates with a Baked-In Domain — Training and Workshop Repositories

**Date**: 2026-08-27 | **Researcher**: nw-researcher (Nova) | **Confidence**: High | **Sources**: 23 (all primary; 13 repositories individually verified, 6 inspected at file level)

> **Relationship to prior research.** This is a deliberate second pass. The prior survey
> (`docs/research/tooling/typescript-stack-and-baseline-apps-comprehensive-research.md`, Part 2)
> looked for *production starters* — Epic Stack, bulletproof-react, RealWorld/Conduit,
> Better-T-Stack, Vite templates — and rejected them for being production-shaped, concluding
> "build from scratch". This pass targets two categories that survey did **not** search:
> **(a)** templates shipping a real example *domain*, and **(b)** repos explicitly positioned
> as *training material* (conference workshops, course companions, bootcamp projects, katas,
> BDD/testing workshop repos). Candidates already covered by the prior survey are not re-evaluated.

---

## Executive Summary

**Nothing found is directly usable, and the reason is one this project had not previously
identified: licensing.** The prior survey rejected production starters on pedagogical grounds.
This pass searched the category that survey missed — repos explicitly built as training material
— and found it is not thin at all. It is well-populated, high-quality, actively maintained, and
almost entirely unavailable for commercial use. Of the top 18 TypeScript repositories tagged
`topic:workshop`, **exactly one carries a permissive licence, and it is not a workshop repo**
(Storybook, tagged metaphorically). Every genuine workshop repo is either `NOASSERTION` — which
for the 18-repo `epicweb-dev` family resolves, in its own `LICENSE.md`, to *GPL-3.0 for private
non-commercial use, "contact us" to run your own workshop* — or ships no licence file at all,
meaning all rights reserved. This holds at every level of prominence: 7,960-star
`total-typescript`, 4,390-star `goldbergyoni/nodejs-testing-best-practices`, 299-star
`ReactTraining/react-workshop`. The cause is market structure, not search coverage: a workshop
repo is maintained precisely because someone is paid to teach from it, and that person has a
direct commercial reason not to license it to competing training. No further searching fixes it.

**The second-most-promising branch was a category error.** BDD/Cucumber/Playwright "template"
repos contain no application — they are deliberately app-agnostic harnesses, because their whole
value proposition is that you point them at *your* app. This was verified across a 12-repo sample
(top result: 6 stars; several drive `automationexercise.com`, a third-party public demo site) and
confirmed at both quality poles: Serenity/JS's official Apache-2.0 template and `playwright-bdd`'s
own `examples/` directory are both harness-only. **One near-match exists**:
`w3cj/hono-open-api-starter` — MIT, 1,011 stars, TypeScript + Hono + Drizzle + Vitest, and
surprisingly *free* of embedded process opinion (no `.github/workflows`, no commit hooks, checks
exposed as four unwired npm scripts). It fails on different grounds: no frontend, no Playwright,
no Gherkin, `@libsql/client` instead of the `better-sqlite3` whose prebuild behaviour §4a
specifically verified, ~6 unwanted runtime dependencies against a zero-dependency-backend goal,
~10 months stale, and a bare `tasks` CRUD domain with no arguable rule to amend. Adopting it means
keeping one folder's naming convention and rewriting everything else.

**Verdict: build from scratch — confirmed by a second, independent argument.** Two unrelated lines
of reasoning now converge on the same conclusion, which is materially stronger than either alone.
Two corrections fall out. First, **one prior argument is weakened**: "third-party starters smuggle
in unexamined process" was measured *false* on the one candidate where it was checked, so it
should be treated as a per-candidate hypothesis costing one API call to test, not a category law —
the same lesson as §4a, in a new place. Second, the pass produced seven concrete **borrowable
patterns**, of which two are immediately actionable: Total TypeScript ships *multiple numbered
sibling solutions* to the same problem, which encodes the course's own "divergence is a feature"
principle at the filesystem level; and Gilded Rose (MIT, 6,089 forks, maintained 13 years) yields
a design test for the parked domain decision — **invariant + deliberate exception + withheld rule
amendment** — against which the office game ladder scores best of the three floated candidates.

---

## Research Methodology

**Search Strategy**: Nine systematic GitHub population queries covering both briefed categories —
`topic:workshop`, `topic:kata`, `topic:coding-dojo`, `topic:training` and `topic:example-app`
(all scoped `language:TypeScript`), plus `topic:hono topic:drizzle` and three free-text queries
(`cucumber playwright typescript template`, `bdd workshop`, `workshop conference typescript
react`) chosen to catch untagged repos. Population queries were sorted by stars descending so
that any category-level absence is demonstrated at the *top* of the distribution rather than in
its long tail. Thirteen repositories identified as promising were then verified individually
against their own API metadata, and six were opened at file level (licence files, package
manifests, README, directory listings).

**Source Selection**: Types: primary artifacts only — repository metadata, `LICENSE`/`LICENSE.md`,
`package.json`, `README.md` and directory listings, served by the GitHub REST API and
`raw.githubusercontent.com`. Reputation: `github.com` = Medium-High (0.8) per the supplied
trusted-source configuration; no lower tier used, no excluded domain consulted, no secondary
commentary cited. Verification: every finding is cross-referenced against at least one
independent query or artifact; no finding rests on a single lookup.

**Quality Standards**: Per the brief's instruction that **empirical checks beat reading**, every
load-bearing claim was read from the artifact rather than from a description of it. This mattered
in practice at least twice: GitHub's `NOASSERTION` licence value is uninformative on its own, so
the operative `LICENSE.md` was fetched separately — which is what revealed the non-commercial
restriction; and the absence of CI in `w3cj/hono-open-api-starter` was established by an
`HTTP 404` on `.github/workflows` rather than inferred. Confidence ratings are adjusted downward
where a claim rests on metadata alone (Findings A.2, B.5). Average source reputation: **0.8**.

---

## Evaluation Criteria (as briefed)

| # | Criterion | Why it matters here |
|---|-----------|---------------------|
| 1 | **Quality of bones** — structure, naming, test style | Dominant. Students imitate whatever they see. |
| 2 | **Licence** | Must permit commercial training use. Unlicensed = all rights reserved. |
| 3 | **Maintenance / bitrot** | Last commit, dependency freshness, does it still install. |
| 4 | **Domain swappability** | How entangled the example domain is with the infrastructure. |
| 5 | **Embedded process opinion** — hooks, conventional commits, CI, lint-staged | **Negative.** Course is about students designing their *own* process. Quantify what each imposes. |
| 6 | **Domain quality for teaching** | Instantly understandable? Genuinely arguable business rules, not just CRUD? |

**Target stack**: TypeScript throughout · Hono backend · Drizzle ORM on better-sqlite3/SQLite ·
Vite + React frontend · Vitest · Playwright, ideally `playwright-bdd`/Gherkin ·
separate backend and frontend dirs/processes · no Docker · no CI/CD.

---

## Findings

### Part A — Templates with a baked-in example domain

#### Finding A.1 — `w3cj/hono-open-api-starter` is the closest stack match found, and is unusually free of embedded process opinion — but it is backend-only, uses the wrong SQLite driver, and its domain is bare CRUD

This is the only candidate in either category that matches a majority of the target stack. It
was verified file-by-file rather than read about.

**Evidence — metadata**: 1,011 stars; `license.spdx_id: MIT`; `pushed_at: 2025-10-31T13:30:09Z`;
description *"A starter template for building fully documented type-safe JSON APIs with Hono and
Open API"*. It surfaced as the highest-starred result of `topic:hono topic:drizzle`
(total_count: 158).

**Evidence — `package.json`, retrieved verbatim**:

```json
"scripts": {
  "dev": "tsx watch src/index.ts",
  "start": "node ./dist/src/index.js",
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "lint:fix": "npm run lint --fix",
  "test": "cross-env NODE_ENV=test vitest",
  "build": "tsc && tsc-alias"
}
"dependencies": {
  "@hono/node-server": "^1.18.1", "@hono/zod-openapi": "^1.0.2",
  "@libsql/client": "^0.15.10", "@scalar/hono-api-reference": "^0.9.13",
  "dotenv": "^17.2.1", "dotenv-expand": "^12.0.2",
  "drizzle-orm": "^0.44.4", "drizzle-zod": "^0.8.2",
  "hono": "^4.9.6", "hono-pino": "^0.10.1", "pino": "^9.7.0",
  "pino-pretty": "^13.1.1", "stoker": "2.0.1", "zod": "^4.0.14"
}
"devDependencies": {
  "@antfu/eslint-config": "^5.1.0", "@types/node": "^24.2.0",
  "cross-env": "^10.0.0", "drizzle-kit": "^0.31.4", "eslint": "^9.32.0",
  "eslint-plugin-format": "^1.0.1", "tsc-alias": "^1.8.16",
  "tsx": "^4.19.4", "typescript": "^5.8.3", "vitest": "^3.2.1"
}
```

**Evidence — embedded process opinion, measured**: Top-level contents are
`.env.example`, `.env.test`, `.gitignore`, `LICENSE`, `README.md`, `drizzle.config.ts`,
`eslint.config.mjs`, `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `vitest.config.ts`,
plus dirs `.github`, `.vscode`, `src`. Crucially:
- `.github` contains **only `funding.yml`**; `.github/workflows` returns **HTTP 404** — there
  are **no CI workflows at all**.
- `package.json` contains **no `husky`, no `lint-staged`, no `simple-git-hooks`**, and no
  `prepare` script — **no commit hooks**.
- No `commitlint`, no `semantic-release`, no `changesets`.

**Evidence — structure and domain**: `src/` = `app.ts`, `env.ts`, `index.ts` + dirs
`db`, `lib`, `middlewares`, `routes`. The README's "Code Tour" describes the convention: the
`tasks` route folder is the worked example, split into `tasks.index.ts` (router),
`tasks.routes.ts` (route definitions), `tasks.handlers.ts` (handlers) and `tasks.test.ts`
(colocated tests). The README also self-reports drift: *"A new version of drizzle was released
since the video showing this starter was made"*, and the same for Zod.

**Source**: [GitHub API — w3cj/hono-open-api-starter (repo metadata, `/contents/`, `/contents/src`, `/contents/.github`, `/contents/.github/workflows`)](https://api.github.com/repos/w3cj/hono-open-api-starter) — Accessed 2026-08-27. Primary, Medium-High (0.8).
**Verification**: [package.json (raw)](https://raw.githubusercontent.com/w3cj/hono-open-api-starter/main/package.json) and [README.md (raw)](https://raw.githubusercontent.com/w3cj/hono-open-api-starter/main/README.md) — Accessed 2026-08-27. Independent artifacts within the same primary source; also cross-referenced against [GitHub Search API — topic:hono topic:drizzle](https://api.github.com/search/repositories?q=topic:hono+topic:drizzle&sort=stars&order=desc) — Accessed 2026-08-27.
**Confidence**: High for every factual claim above (all read directly from the repository's own
files via the GitHub API). **Not verified**: whether it still installs — see Knowledge Gap G3.

**Assessment against the six criteria**:

| Criterion | Verdict |
|---|---|
| 1. Quality of bones | **Good.** Feature-prefixed, colocated-test convention (`tasks.routes.ts` / `tasks.handlers.ts` / `tasks.test.ts`) is readable and imitable — precisely the property that matters most since students copy what they see. Route definitions separated from handlers is a genuinely instructive split. |
| 2. Licence | **MIT — clean.** Declared in both `package.json` (`"license": "MIT"`) and a top-level `LICENSE` file. Commercially usable. **This is the only stack-relevant candidate in this research with an unambiguously permissive licence.** |
| 3. Maintenance / bitrot | **Moderate concern.** Last push 2025-10-31 = ~10 months stale at access date. The README itself admits Drizzle and Zod have moved on since. Not abandoned, but not current. |
| 4. Domain swappability | **Excellent.** The `tasks` domain is one folder under `src/routes/` plus one Drizzle schema. Swapping it touches almost nothing infrastructural. |
| 5. Embedded process opinion | **Very low — the best result in this research.** No CI workflows, no commit hooks, no conventional-commit tooling, no release automation. The only opinions imposed are an ESLint config (`@antfu/eslint-config`, which is stylistically strong but is a single removable file) and a `.vscode` directory. **This is exactly the profile decision 12/13 wants: checks available as individually runnable scripts (`typecheck`, `lint`, `test`, `build`) and nothing wired together.** |
| 6. Domain quality for teaching | **Poor.** `tasks` is CRUD — list, create, get, update, delete. Instantly understandable, yes; but it contains no arguable business rule, no exception case, and therefore nothing to amend. It fails the requirement in parked item 4 for a domain "rich enough for several feature-shaped holes including one rule-amendment". |

**Stack match, stated explicitly**:

| Target | Match |
|---|---|
| TypeScript throughout | ✅ Yes |
| Hono backend | ✅ Yes (`hono ^4.9.6`, `@hono/node-server`) |
| Drizzle ORM | ✅ Yes (`drizzle-orm`, `drizzle-kit`, `drizzle-zod`) |
| better-sqlite3 driver | ❌ **No — uses `@libsql/client`** (libSQL/Turso), not `better-sqlite3`. This is the driver whose native-prebuild behaviour §4a empirically validated; swapping to it means re-doing that verification, or swapping the driver back out. |
| Vite + React frontend | ❌ **Absent entirely.** Backend-only. |
| Vitest | ✅ Yes (`vitest ^3.2.1`, colocated `*.test.ts`) |
| Playwright / playwright-bdd / Gherkin | ❌ **Absent entirely.** No E2E layer, no feature files. |
| Separate backend + frontend dirs/processes | ⚠️ Half — it *is* a standalone backend, so it could become the `backend/` of decision 27, but supplies nothing for `frontend/`. |
| No Docker | ✅ Yes — no Dockerfile or compose file at top level. |
| No CI/CD | ✅ Yes — verified, `.github/workflows` does not exist. |

**Additional friction not in the criteria**: it carries several dependencies this course does not
want and would have to strip — `pino` + `hono-pino` + `pino-pretty` (structured logging),
`@scalar/hono-api-reference` (API docs UI), `stoker`, `dotenv` + `dotenv-expand`, `tsc-alias`.
That is ~6 packages of accidental complexity in a repo whose central design constraint (per the
prior research, Finding 1.6.1) was a **zero-runtime-dependency backend**.

**Analysis (interpretation)**: This candidate inverts the prior research's rejection reason. The
prior survey rejected starters for smuggling in unexamined process; this one smuggles in almost
none, and would have passed that test. It fails on different, more mundane grounds: **it is half
an app (no frontend, no E2E, no Gherkin), on the wrong driver, with a domain that is exactly the
CRUD-without-rules the course cannot teach from.** Adopting it would mean keeping roughly one
directory's worth of convention and rewriting everything else — which is not adoption, it is
reading it and then writing your own. That is the honest recommendation: **read the Code Tour,
copy the file-naming convention, write our own.**

---

#### Finding A.2 — `serenity-bdd/bdd-trader`: a purpose-built BDD-workshop demo application with a permissive licence — but it is Java

**Evidence**: `full_name: serenity-bdd/bdd-trader`; description *"The BDD Trader application is
a demo application used for exercises in the Serenity Dojo BDD workshops"*;
**`language: Java`**; `license: Apache License 2.0 (Apache-2.0)`; 27 stars; `created_at:
2018-05-28`; `pushed_at: 2026-01-26T21:53:33Z`; `archived: false`; size 3,598 KB.

**Source**: [GitHub API — serenity-bdd/bdd-trader](https://api.github.com/repos/serenity-bdd/bdd-trader) — Accessed 2026-08-27. Primary, Medium-High (0.8).
**Verification**: Independently surfaced by the [GitHub Search API — `bdd workshop in:name,description`](https://api.github.com/search/repositories?q=bdd+workshop+in:name,description&sort=stars&order=desc) query — Accessed 2026-08-27, where it is the **highest-starred genuine result** and one of only two results in the entire sample carrying any licence at all.
**Confidence**: High for metadata (primary source, two independent endpoints). **Low** for any
claim about its internal quality — the source tree was not read, because the language mismatch
made it non-adoptable regardless (Knowledge Gap G4).

**Analysis (interpretation)**: **Stack match: zero** — Java/Spring, not TypeScript. It cannot be
used. It is reported because it is the **existence proof** for the thing this research pass went
looking for: a deliberately-built, permissively-licensed, still-maintained (8 years and counting)
demo application whose *entire purpose* is to be the vehicle for BDD workshop exercises. The
pattern is real and viable; it just does not exist in TypeScript.

Two things are worth taking from it:
1. **Apache-2.0 on a workshop demo app is possible.** John Ferguson Smart runs Serenity Dojo as
   a commercial training business and still licensed the *vehicle app* permissively while keeping
   the *course material* proprietary. That is the correct separation, and it is a model for how
   this course's own repo should be licensed if it is ever published.
2. **The domain choice is instructive.** "Trader" — clients, portfolios, trades, prices — is
   deterministic underneath, has genuinely arguable rules, and is instantly understandable
   without domain training. It satisfies the parked-item-4 criteria that "course registration"
   was found dull against. It is a reasonable comparator when the domain decision is made.

---

#### Finding A.3 — The generic "example app" category is bitrotted and yields nothing

**Evidence**: GitHub search `topic:example-app language:TypeScript`, sorted by stars: the top
result has **126 stars** (`affilnost/angular5-example-shopping-app`, MIT, last push 2025-02) and
the population falls to single digits immediately. Of 17 results captured, **9 had last-push
dates in 2023 or earlier**, several in 2017–2018; 4 carried `null` licences. Content is
Angular 5/6 CRUD, GraphQL playgrounds, OAuth login demos, and vendor SDK showcases
(`speechly/*`).

**Source**: [GitHub Search API — topic:example-app language:TypeScript](https://api.github.com/search/repositories?q=topic:example-app+language:TypeScript&sort=stars&order=desc) — Accessed 2026-08-27. Primary, Medium-High (0.8).
**Verification**: The same emptiness is visible from a second direction — the
`hono drizzle sqlite in:name,description,readme` free-text query returned no relevant example
application at all, only awesome-lists, badge collections, and products (`prisma/prisma-examples`,
`SonicJs-Org/sonicjs`, `AmanVarshney01/create-better-t-stack`) — Accessed 2026-08-27.
**Confidence**: High (two independent queries, consistent, primary sources).

**Analysis (interpretation)**: The `example-app` topic is a graveyard. This is expected: an
example app has no users, so nothing forces it to be maintained, and its author's incentive ends
the day the accompanying article ships. **Combined with Finding B.3, this is the structural
reason the search fails: repos in this space are either maintained-but-unlicensable (workshop
material with a business behind it) or licensable-but-unmaintained (one-off demos).** The
intersection — permissively licensed, maintained, full-stack, domain-bearing — is close to empty,
and `w3cj/hono-open-api-starter` (Finding A.1) is the nearest thing to an exception found.

Two adjacent repos are worth noting explicitly as **not** candidates, to save a future re-search:
- `prisma/prisma-examples` (6,644 stars, Apache-2.0, pushed 2026-08-27) — actively maintained
  and permissive, but Prisma-based, already disqualified by the prior research's Finding 1.3.3.
- `SonicJs-Org/sonicjs` (1,690 stars, MIT, pushed 2026-08-21) — genuinely Hono + Drizzle and
  actively maintained, but it is a **headless CMS product for Cloudflare Workers**, i.e.
  infrastructure, not a domain app, and edge-targeted rather than Node/SQLite.

---

### Part B — Explicitly training-positioned repositories

#### Finding B.1 — The Epic Web / Kent C. Dodds workshop family is licence-blocked for commercial training

**Evidence**: `epicweb-dev/full-stack-foundations` reports its licence via the GitHub API as
`"license": {"key": "other", "spdx_id": "NOASSERTION", "name": "Other"}` — i.e. GitHub's
licence detector cannot classify it. The repository's own `LICENSE.md` resolves the ambiguity:
the material is "available for private, **non-commercial** use under the GPL version 3", and
adds: *"If you would like to use this material to conduct your own workshop, please contact us
at team@epicweb.dev"*.

**Source**: [GitHub API — epicweb-dev/full-stack-foundations](https://api.github.com/repos/epicweb-dev/full-stack-foundations) — Accessed 2026-08-27. Domain: github.com, primary source (the project's own metadata), Medium-High (0.8).
**Verification**: [LICENSE.md, epicweb-dev/full-stack-foundations](https://raw.githubusercontent.com/epicweb-dev/full-stack-foundations/main/LICENSE.md) — Accessed 2026-08-27, primary source, Medium-High (0.8).
**Confidence**: High for the *licence terms* (two independent artifacts from the project itself, one of them the operative legal document). Medium for the generalisation to every `epicweb-dev` repo — see Knowledge Gap G1.

**Analysis (interpretation)**: This is decisive and it is worth stating plainly, because the
Epic Web workshops are otherwise the single strongest match in category (b): they are
professionally produced, genuinely full-stack TypeScript, actively maintained (last push
2026-08-14, 648 stars, created 2023), and built around a real domain ("Epic Notes"). But the
licence has two independent problems for this course:

1. **The non-commercial restriction** directly excludes paid training, which is the intended use.
2. **GPL-3.0 is copyleft.** Even setting commercial use aside, deriving a course baseline app
   from GPL-3.0 material would make the derivative subject to GPL-3.0 — an unexamined legal
   constraint smuggled into a course, which is the licence analogue of the "unexamined process"
   objection the prior research raised.

The "contact us to run your own workshop" clause means a licence *could* be negotiated. That is
a commercial conversation, not a technical option, and it is out of scope for a one-day course
built around a throwaway vehicle app.

---

#### Finding B.2 — BDD/Cucumber "template" repos are E2E test harnesses, not applications, and are overwhelmingly unlicensed

**Evidence**: A GitHub search for `cucumber playwright typescript template in:name,description`
sorted by stars returns a long tail with essentially no signal: the top result has **6 stars**
and every other result has **0**. Of the 12 results captured, licences were: `None` × 6,
`MIT` × 4, `CC0-1.0` × 1, `NOASSERTION` × 1. Descriptions confirm the shape — e.g.
`Ahmedsaad2050/playwright-bdd-template`: *"Reusable Playwright + BDD (Cucumber) E2E template
with strict Page Object Model. TypeScript, faker, CI. **Demo target: automationexercise.com**"*
— the template contains no application at all; it drives a third-party public demo site.

**Source**: [GitHub Search API — cucumber playwright typescript template](https://api.github.com/search/repositories?q=cucumber+playwright+typescript+template+in:name,description&sort=stars&order=desc) — Accessed 2026-08-27. Domain: github.com, primary, Medium-High (0.8).
**Verification**: The same structural pattern is independently visible in the two named
best-of-breed alternatives, which are *also* test-harness-only:
[serenity-js/serenity-js-cucumber-playwright-template](https://api.github.com/repos/serenity-js/serenity-js-cucumber-playwright-template)
(*"Test your web apps with Serenity/JS, Playwright and Cucumber.js"* — 32 stars, Apache-2.0,
`is_template: true`, pushed 2026-08-20) and
[vitalets/playwright-bdd](https://api.github.com/repos/vitalets/playwright-bdd) (769 stars, MIT,
pushed 2026-08-27) — Both accessed 2026-08-27.
**Confidence**: High (3 independent sources, consistent, all primary).

**Analysis (interpretation)**: This closes a whole search branch. The BDD-template category
does not contain what this course needs, and the reason is structural rather than accidental:
**BDD tooling templates are deliberately application-agnostic**, because their selling point is
that you point them at *your* app. Wanting "a Gherkin workshop repo with an app in it" is
wanting the one thing this category is designed not to have.

Two useful sub-conclusions:

- **`vitalets/playwright-bdd` itself is confirmed healthy** — MIT, 769 stars, pushed the same
  day as this research (2026-08-27), created 2023-03-30, 31 open issues, topics
  `bdd, cucumber, gherkin, playwright, testing`. This independently re-confirms the prior
  research's Finding 1.5.x on a different date and via a different endpoint (repo metadata
  rather than release feed). No change to decision 5.
- **The unlicensed default is real and quantified.** Half the sampled BDD templates carry no
  licence at all, which under the Berne Convention means all rights reserved. The brief's
  warning that "teaching repos are often unlicensed" is empirically confirmed at roughly a 50%
  rate in this sample. Any candidate found in this space must have its licence checked
  individually; the category norm is *not* MIT.

---

#### Finding B.3 — The TypeScript workshop-repo population is almost entirely unlicensed or non-commercially licensed

**Evidence**: GitHub search `topic:workshop language:TypeScript`, sorted by stars descending.
The top 18 results and their licences, verbatim:

| # | Repo | Stars | Licence | Last push |
|---|------|-------|---------|-----------|
| 1 | `storybookjs/storybook` | 90,949 | MIT | 2026-08-27 |
| 2 | `epicweb-dev/react-fundamentals` | 5,316 | NOASSERTION | 2026-08-14 |
| 3 | `epicweb-dev/advanced-react-patterns` | 3,518 | NOASSERTION | 2026-08-14 |
| 4 | `epicweb-dev/react-hooks` | 2,818 | NOASSERTION | 2026-08-14 |
| 5 | `epicweb-dev/advanced-react-apis` | 2,120 | NOASSERTION | 2026-08-14 |
| 6 | `epicweb-dev/react-performance` | 1,814 | NOASSERTION | 2026-08-14 |
| 7 | `epicweb-dev/react-suspense` | 863 | NOASSERTION | 2026-08-14 |
| 8 | `epicweb-dev/full-stack-foundations` | 648 | NOASSERTION | 2026-08-14 |
| 9 | `epicweb-dev/web-auth` | 336 | NOASSERTION | 2026-08-14 |
| 10 | `ReactTraining/react-workshop` | 299 | **null (no licence)** | 2026-06-26 |
| 11 | `flexbox/react-native-bootcamp` | 256 | **null** | 2026-06-09 |
| 12 | `gvergnaud/type-level-typescript-workshop` | 253 | **null** | 2023-01-19 |
| 13 | `epicweb-dev/full-stack-testing` | 222 | NOASSERTION | 2026-08-14 |
| 14 | `epicweb-dev/web-forms` | 204 | NOASSERTION | 2026-08-14 |
| 15 | `sibelius/relay-workshop` | 182 | **null** | 2025-04-23 |
| 16 | `epicweb-dev/pixel-perfect-tailwind` | 175 | NOASSERTION | 2026-08-14 |
| 17 | `epicweb-dev/data-modeling` | 164 | NOASSERTION | 2026-08-14 |
| 18 | `epicweb-dev/mcp-fundamentals` | — | NOASSERTION | — |

**Source**: [GitHub Search API — topic:workshop language:TypeScript](https://api.github.com/search/repositories?q=topic:workshop+language:TypeScript&sort=stars&order=desc) — Accessed 2026-08-27. Domain: github.com, primary, Medium-High (0.8).
**Verification**: Cross-referenced against Finding B.1 (the `epicweb-dev` LICENSE.md, which
explains what NOASSERTION means for that whole org) and Finding B.2 (independent search over
BDD templates showing the same unlicensed default in a different sub-population). Further
corroborated by two individually-checked high-star teaching repos outside this list:
[`total-typescript/beginners-typescript-tutorial`](https://api.github.com/repos/total-typescript/beginners-typescript-tutorial)
— 7,960 stars, **licence: null**, pushed 2026-08-07 — and
[`goldbergyoni/nodejs-testing-best-practices`](https://api.github.com/repos/goldbergyoni/nodejs-testing-best-practices)
— 4,390 stars, **licence: null**, pushed 2026-02-10. Both accessed 2026-08-27.
**Confidence**: High (one systematic population query plus four independently-checked
individual repos, all primary sources, no contradictions).

**Analysis (interpretation)**: **Exactly one of the top 18 carries a permissive OSS licence, and
it is not a workshop repo** — `storybookjs/storybook` is a UI component tool that uses
"workshop" as a metaphor and is topic-tagged accordingly. Every genuine workshop repository in
the list is either `NOASSERTION` (the Epic Web non-commercial GPL of Finding B.1) or has **no
licence file at all**, which under default copyright means all rights reserved.

This is the single most important result of this research pass, and it is a *category-level*
finding rather than a verdict on individual repos. The economics explain it: workshop repos are
the free companion to a paid product — a course, a book, a training business. Their authors have
a direct commercial interest in *not* granting the right to run competing training from the
material. The absence of a permissive licence in this population is a deliberate business
choice, not neglect. It follows that searching harder within category (b) will not find a
licensable candidate; the sampling is already dense at the top of the distribution, and the
constraint is economic rather than one of coverage.

**Consequence for the course**: category (b) is largely closed as a source of *code*. It remains
open as a source of *pedagogical patterns* — repo structure, exercise format, README conventions
— which are not copyrightable as such. See "Borrowable Ideas".

---

#### Finding B.4 — TDD kata repos are single-file exercises, not applications; but the kata *format* answers a specific course need

**Evidence**: GitHub search `topic:kata language:TypeScript` sorted by stars returns a
population with a maximum of **37 stars** (`YBogomolov/fp-ts-kata`, MIT, last push 2019) and a
median in low single digits. Descriptions confirm scope: "FizzBuzz Kata with Angular 5",
"Kata - CPU monitor", "a kata for practicing the legacy code refactoring", "TypeScript starter
for TDD practice". Licences are again mixed and often absent (`None` on 7 of 18 sampled).
Nothing in the population is full-stack.

The exception on quality is the canonical kata source rather than the topic tag:
`emilybache/GildedRose-Refactoring-Kata` — **MIT licensed**, 4,273 stars, **6,089 forks**,
created 2013-06-10, **last push 2026-08-21** (i.e. actively maintained after 13 years),
described as *"Starting code for the GildedRose Refactoring Kata in many programming
languages"* (TypeScript among them).

**Source**: [GitHub Search API — topic:kata language:TypeScript](https://api.github.com/search/repositories?q=topic:kata+language:TypeScript&sort=stars&order=desc) — Accessed 2026-08-27. Primary, Medium-High (0.8).
**Verification**: [GitHub API — emilybache/GildedRose-Refactoring-Kata](https://api.github.com/repos/emilybache/GildedRose-Refactoring-Kata) — Accessed 2026-08-27. Primary, Medium-High (0.8).
**Confidence**: High for the population shape (systematic query, unambiguous). High for the
Gilded Rose metadata (direct primary metadata). **Medium** for the claim that Gilded Rose's
TypeScript variant is of good quality — the repo metadata was checked but the TypeScript source
was not read (Knowledge Gap G2).

**Analysis (interpretation)**: Katas are not app templates and cannot be one — they are
deliberately one file with one algorithm, because the point is to constrain the exercise. So
this branch yields no candidate. But it yields something the brief specifically asked for.

Course decision 10/20 needs *"a third, differently-shaped item — amending an existing rule"*,
and parked item 4 asks for a domain "rich enough for several feature-shaped holes including one
rule-amendment". **Gilded Rose is the canonical, MIT-licensed, 13-year-battle-tested instance of
exactly that exercise shape**: a small set of interacting, genuinely arguable business rules
(items degrade, Sulfuras never changes, Backstage passes increase in value then drop to zero,
quality is clamped 0–50) plus a *stated pending rule amendment* — the "Conjured items degrade
twice as fast" requirement that the original kata brief adds at the end. The 6,089 forks are
evidence that the exercise transfers across rooms and languages.

That is a **pedagogical pattern worth imitating in our own domain**, not code to import. It also
supplies a design heuristic for the parked domain decision: *the domain should have a
Sulfuras* — at least one rule that is a deliberate exception to the general rule, because
exceptions are what make a rule amendment interesting rather than mechanical.

---

#### Finding B.5 — The dojo/coderetreat/training-material category is empirically almost empty in TypeScript

**Evidence**: `topic:coding-dojo language:TypeScript` returns **total_count: 6**. In full:
`webprofusion/dojo3d` (126 stars, Apache-2.0, last push **2020**, and a false positive — it is
a 3D storytelling library, matched on the word "dojo"); `tobal/typescript-dojo-seed` (2 stars,
no licence, **2016**); `beyerleinf/coding-dojo-angular-todo-mvc` (1 star, no licence, **2018**);
`PilarCha/Manager_playerlist` (0 stars, no licence, 2018); `ndo2e10/coding-dojo` (0 stars, no
licence, 2024); `Suzii/js-coding-dojo-setup` (0 stars, no licence, **2017**).

`topic:training language:TypeScript` returns 345, but the topic is dominated by a **different
sense of "training"** — ML model training (`theaniketgiri/create-llm`,
`kkpkishan/llm-infra-planner`), fitness (`Snouzy/workout-cool`, 8,422 stars), chess practice,
and emergency-services simulation. Filtering to genuine developer-training repos leaves only:
`ReactTraining/react-workshop` (299 stars, **no licence**, pushed 2026-06-26),
`nanovazquez/reactjs-training` (35 stars, MIT, pushed 2025-02-10), and `Quramy/type-dungeon`
(34 stars, MIT, pushed 2026-08-26, *"TypeScript code exercise"*). All three are
**frontend/language exercises, not applications**.

Two further searches returned nothing at all: `workshop conference typescript react
in:name,description` produced **one** irrelevant result (a 1-star African events platform), and
an org-scoped query across training consultancies returned **total_count: 0**.

**Source**: [GitHub Search API — topic:coding-dojo language:TypeScript](https://api.github.com/search/repositories?q=topic:coding-dojo+language:TypeScript&sort=stars&order=desc) — Accessed 2026-08-27. Primary, Medium-High (0.8).
**Verification**: [GitHub Search API — topic:training language:TypeScript](https://api.github.com/search/repositories?q=topic:training+language:TypeScript&sort=stars&order=desc) and [GitHub Search API — workshop conference typescript react](https://api.github.com/search/repositories?q=workshop+conference+typescript+react+in:name,description&sort=stars&order=desc) — both Accessed 2026-08-27.
**Confidence**: High for the null result across these tags (three independent queries, all
primary, all consistent). **Medium** for the broader claim that no conference-workshop
full-stack TypeScript repo exists anywhere — GitHub topic tags are voluntary and a repo could
be untagged and unfindable by these queries (Knowledge Gap G5).

**Analysis (interpretation)**: This is the specific branch the brief flagged as most likely to
have been missed, and it is now searched. It is empty, and the emptiness has an explanation:
conference workshops are two-to-four hours long, so their repos are scoped to a *single
technique* rather than an application. Where a conference workshop does need an app, the
instructor reuses their own commercial course app — which lands us back in Finding B.3's
licence wall.

---

#### Finding B.6 — Even the workshop *tooling* in this space is non-permissively licensed, and `playwright-bdd`'s own examples are feature demos rather than an app

**Evidence**: `epicweb-dev/workshop-app` resolves to `epicweb-dev/epicshop`, *"The workshop app
for all workshops on EpicWeb.dev"* — 247 stars, actively maintained (pushed 2026-08-21), and
licensed **`Other` / `NOASSERTION`**, the same non-permissive posture as the workshop content
itself (Finding B.1).

Separately, `vitalets/playwright-bdd`'s `examples/` directory contains exactly:
`ai`, `api-testing`, `auth-in-steps`, `auth`, `basic-cjs`, `basic-esm`, `cucumber-style`,
`decorators`, plus a `package.json`. Every entry is a **capability demonstration of the library**,
not an application under test.

**Source**: [GitHub API — epicweb-dev/workshop-app → epicshop](https://api.github.com/repos/epicweb-dev/workshop-app) — Accessed 2026-08-27. Primary, Medium-High (0.8).
**Verification**: [GitHub API — vitalets/playwright-bdd `/contents/examples`](https://api.github.com/repos/vitalets/playwright-bdd/contents/examples) — Accessed 2026-08-27. Primary, Medium-High (0.8). Both independently confirm the pattern first established in Finding B.2.
**Confidence**: High (primary metadata, directly read).

**Analysis (interpretation)**: Two consequences.

First, the Epic Web family is closed even at the infrastructure level — one cannot adopt just the
workshop-runner scaffolding while writing one's own content. Its *pedagogical design* remains
free to imitate (see Borrowable Ideas), but none of its code is available.

Second, and usefully for the course: **`playwright-bdd` ships an `examples/ai` directory.** This
was not something the prior research surfaced. Given decision 14 (Claude Code as primary tool)
and the prior research's Finding 1.5.4 (playwright-bdd ships an agent skill for generating
feature files and step definitions), this is worth opening before writing the gate catalogue —
it is the tool vendor's own opinion on agent-authored Gherkin, which is exactly the subject of
pre-course experiment 2 (declarative vs imperative Gherkin). Flagged as an action, not a
finding — its contents were not read (Knowledge Gap G6).

---

### Part C — Cross-cutting observations

#### Finding C.1 — The two failure modes are complementary, which is why the intersection is empty

Synthesising A.3 and B.3, every repo in this space falls into one of two buckets, and the
property that saves it from one bucket puts it in the other:

| | Maintained | Unmaintained |
|---|---|---|
| **Permissively licensed** | **Nearly empty.** Only `w3cj/hono-open-api-starter` (MIT, but 10 months stale, backend-only, CRUD domain) and `emilybache/GildedRose-Refactoring-Kata` (MIT, maintained 13 years — but a single-file kata, not an app). | Large: `topic:example-app` graveyard (Finding A.3), abandoned Cucumber templates (Finding B.2). |
| **Non-permissive / unlicensed** | Large and high-quality: the entire `epicweb-dev` org, `total-typescript`, `ReactTraining`, `goldbergyoni` (Findings B.1, B.3). | Large: dojo/kata long tail (Findings B.4, B.5). |

**Analysis (interpretation)**: The correlation is causal, not coincidental. **A workshop repo is
maintained precisely to the extent that someone is paid to teach from it — and that same person
has a direct commercial reason not to license it for competing training.** Conversely, a demo app
with a permissive licence usually had no business behind it, which is why nothing forced anyone
to maintain it. There is no amount of additional searching that resolves this; it is a property
of the market, not of the query.

This is an *independent* argument reaching the prior research's conclusion. The prior survey
rejected starters on **pedagogical** grounds (production starters smuggle in unexamined process).
This pass rejects training repos on **licensing and structural** grounds. Two unrelated arguments
converging on "build from scratch" is considerably stronger evidence than either alone.

#### Finding C.2 — One prior-research conclusion is partially weakened, and it should be recorded

The prior research's Recommendation 2.3 argued in part that third-party starters are dense with
embedded process opinion — "commit hooks, conventional commits, CI workflows". **Measured on
`w3cj/hono-open-api-starter`, that claim is false for at least one real candidate**: no CI
workflows (`.github/workflows` → HTTP 404), no husky, no lint-staged, no commitlint, no
semantic-release. Its only process opinion is a single removable ESLint config file.

This does not reverse the recommendation — A.1 still fails on frontend, E2E, driver, and domain
quality. But per the §4a lesson ("cheap empirical checks beat more reading"), the
process-smuggling argument should be treated as **a hypothesis to test per candidate rather than
a category-level law**. Stated honestly: if a future candidate appears that matches the stack,
"it will smuggle in process" is not a sufficient reason to reject it without checking.

---

---

## Candidate Scorecard

Every row was checked against the repository's own GitHub API metadata and, where marked ✔,
against its actual files. Candidates already assessed by the prior research are not repeated.

| Candidate | Category | Stack match | Bones | Licence | Bitrot (last push) | Domain swappability | Process imposed | Domain quality | Usable? |
|---|---|---|---|---|---|---|---|---|---|
| **`w3cj/hono-open-api-starter`** ✔ | (a) domain | **Partial — best found.** TS ✅ Hono ✅ Drizzle ✅ Vitest ✅ / React ❌ Playwright ❌ BDD ❌ better-sqlite3 ❌ (libSQL) | Good — `x.routes.ts`/`x.handlers.ts`/`x.test.ts` | **MIT ✅** | 2025-10-31 (~10 mo) | Excellent | **Near zero** — no CI, no hooks; ESLint config only | **Poor** — `tasks` CRUD, no arguable rule | **No** — read it, copy the conventions |
| **`serenity-bdd/bdd-trader`** | (b) training | **None** — Java | Not read | **Apache-2.0 ✅** | 2026-01-26 | n/a | Not measured | **Good** — trading rules | **No** — wrong language |
| **`epicweb-dev/*`** (18 repos) ✔ | (b) training | Good on paper (full-stack TS) | Excellent | **BLOCKED** — GPL-3.0, non-commercial, "contact us for workshops" | 2026-08-14 (current) | Moderate | High (own workshop runner) | Good ("Epic Notes") | **No** — licence |
| **`epicweb-dev/epicshop`** | (b) tooling | n/a | n/a | **BLOCKED** — NOASSERTION | 2026-08-21 | n/a | n/a | n/a | **No** — licence |
| **`emilybache/GildedRose-Refactoring-Kata`** | (b) kata | None (single file) | Deliberately bad (that is the exercise) | **MIT ✅** | 2026-08-21 (13 yrs maintained) | n/a | None | **Excellent** — canonical arguable rules | **No as code — yes as a pattern** |
| **`total-typescript/*`** ✔ | (b) training | TS only, no app | Excellent exercise format | **BLOCKED — no licence** | 2026-08-07 | n/a | Low | n/a | **No** — licence |
| **`goldbergyoni/nodejs-testing-best-practices`** | (b) training | Node, Express/Fastify/Nest | Reputedly strong | **BLOCKED — no licence** | 2026-02-10 | Unknown | Unknown | Orders/users | **No** — licence |
| **Cucumber/Playwright BDD templates** (12 sampled) | (b) training | E2E harness only, **no app** | Poor; 0–6 stars | 50% unlicensed | Mixed, many 2023–25 | n/a | Several ship CI | **None — no domain at all** | **No** |
| **`serenity-js/…-cucumber-playwright-template`** | (b) training | E2E harness only | Good | **Apache-2.0 ✅** | 2026-08-20 | n/a | Low | **None** | **No** — no app |
| **`prisma/prisma-examples`** | (a) domain | Prisma — pre-disqualified | Good | Apache-2.0 ✅ | 2026-08-27 | Good | Low | Thin | **No** — Prisma |
| **`SonicJs-Org/sonicjs`** | (a) domain | Hono+Drizzle but Cloudflare Workers | Product-grade | MIT ✅ | 2026-08-21 | n/a — it is a CMS | High | n/a | **No** — infrastructure, edge |
| **`topic:example-app`** (17 sampled) | (a) domain | Angular 5/6 era | Poor | Mixed | 9 of 17 pre-2024 | Poor | Varies | CRUD | **No** |
| **`topic:coding-dojo` TS** (all 6) | (b) training | None | Poor | 5 of 6 unlicensed | 2016–2024 | n/a | None | None | **No** |

---

## Borrowable Ideas (even if nothing is directly usable)

These are patterns, not code. They are described here so they can be **imitated while writing our
own repo**, which raises no licensing question — layout conventions and exercise formats are not
protectable expression.

### 1. Numbered exercise directories with narrative alongside (Epic Web)

**Evidence**: `epicweb-dev/full-stack-foundations/exercises/` contains exactly
`01.styling`, `02.routing`, `03.loading`, `04.mutations`, `05.scripting`, `06.seo`,
`07.error-handling`, plus `README.mdx` and `FINISHED.mdx`.
**Source**: [GitHub API — contents/exercises](https://api.github.com/repos/epicweb-dev/full-stack-foundations/contents/exercises) — Accessed 2026-08-27.

**Why it transfers**: the zero-padded numeric prefix makes the intended *order* a property of
the filesystem rather than of a document that can drift. A `FINISHED.mdx` terminal file is a
small, cheap idea worth stealing — the workshop explicitly tells you when you are done, which
matters in a mixed-ability room where fast pairs need to know they may move on (decision 10/20's
"waits for fast pairs"). Directly applicable to the course's cycle structure: `01.cycle-one`,
`02.cycle-two`, `03.rule-amendment`.

### 2. `NN-name.problem.ts` / `NN-name.solution.N.ts` — and especially *plural* solutions (Total TypeScript)

**Evidence**: `total-typescript/beginners-typescript-tutorial/src/` contains 18 matched
`*.problem.ts` files and **29** `*.solution*.ts` files, because several problems ship multiple
numbered valid answers: `02-object-param.solution.1.ts`, `.2.ts`, `.3.ts`;
`09-promises.solution.1/2/3.ts`; `11-record.solution.1/2/3.ts`;
`13-catch-blocks.solution.1/2/3.ts`.
**Source**: [GitHub API — contents/src](https://api.github.com/repos/total-typescript/beginners-typescript-tutorial/contents/src) — Accessed 2026-08-27.

**Why it transfers, and this is the strongest single idea in this document**: the course's
governing principle is that *divergent student processes are a feature, not a problem to
standardise away* (§1). Total TypeScript encodes exactly that at the file level — shipping
three sibling solutions is a structural statement that there is no single right answer. A
`course/` directory containing `cycle-one.process.solution.1.md`, `.2.md`, `.3.md` — three
genuinely different worked process designs — would say "diverge" far more convincingly than a
paragraph of README asking students to.

### 3. Separate the *vehicle app* licence from the *course material* licence (Serenity Dojo)

**Evidence**: `serenity-bdd/bdd-trader` is Apache-2.0 and explicitly *"a demo application used
for exercises in the Serenity Dojo BDD workshops"* — a commercial training business — while the
workshop content itself is not in that repo.
**Source**: [GitHub API — serenity-bdd/bdd-trader](https://api.github.com/repos/serenity-bdd/bdd-trader) — Accessed 2026-08-27.

**Why it transfers**: it is the clean answer to the licence problem this research uncovered, seen
from the supply side. If this course's repo is ever made public, licensing the *app* permissively
(MIT/Apache-2.0) while keeping slides and facilitator notes proprietary preserves both the
teaching business and the students' ability to keep using their work after the day ends. Worth
deciding before the first public push rather than after.

### 4. Feature-prefixed sibling files with colocated tests (`w3cj`)

**Evidence**: `tasks.index.ts` (router) / `tasks.routes.ts` (route definitions) /
`tasks.handlers.ts` (handlers) / `tasks.test.ts` (tests), all siblings inside one route folder,
per the repo's README "Code Tour".
**Source**: [README.md, w3cj/hono-open-api-starter](https://raw.githubusercontent.com/w3cj/hono-open-api-starter/main/README.md) — Accessed 2026-08-27.

**Why it transfers**: it beats the more common `routes/ controllers/ services/ tests/` split for
this specific room, because a cross-functional pair reading one folder sees the whole feature.
It also serves the ownership-split constraint in §2: a feature is a contiguous set of files, so
"the developer's artifacts for feature X" is a real, pointable thing. Note the separation of
*route definition* from *handler* is independently valuable here — the route definition file is
the closest thing to a machine-readable contract a product person can be shown.

### 5. "Give the domain a Sulfuras" (Gilded Rose)

**Evidence**: `emilybache/GildedRose-Refactoring-Kata` — MIT, 4,273 stars, **6,089 forks**,
created 2013-06-10, still pushed 2026-08-21.
**Source**: [GitHub API — emilybache/GildedRose-Refactoring-Kata](https://api.github.com/repos/emilybache/GildedRose-Refactoring-Kata) — Accessed 2026-08-27.

**Why it transfers**: 6,089 forks over 13 years is strong evidence that this exercise shape
survives contact with real rooms. Its design is: a handful of interacting rules, at least one
*deliberate exception* to the general rule (Sulfuras never changes; Backstage passes invert the
usual decay), a clamped invariant (quality 0–50), and a **rule amendment held in reserve**
("Conjured items degrade twice as fast") that the facilitator introduces later.

Mapped onto the parked domain decision (item 4), this yields a concrete design heuristic:
whichever domain is chosen — office game ladder, pub quiz, lunch roulette — it should have
**(i)** an invariant, **(ii)** at least one entity that is a deliberate exception to the main
rule, and **(iii)** one rule amendment written but withheld. Against that test, the *office game
ladder* scores best of the three floated candidates: rating decay is the invariant, an
"inactive/provisional player" is the natural Sulfuras, and "seasons reset rankings" is a clean
withheld amendment.

### 6. README that self-reports its own drift

**Evidence**: the `w3cj/hono-open-api-starter` README states *"A new version of drizzle was
released since the video showing this starter was made"*, and likewise for Zod.
**Source**: [README.md, w3cj/hono-open-api-starter](https://raw.githubusercontent.com/w3cj/hono-open-api-starter/main/README.md) — Accessed 2026-08-27.

**Why it transfers**: this is cheap honesty that directly serves decision 2 (developers set the
app up before class) and decision 25 (broken-setup fallback). A dated "known drift" section in
the pre-class README — *what has moved since this was written, and what to do about it* — turns
the most dangerous failure mode ("I thought it was working") into an expected, documented one.

### 7. Open `playwright-bdd/examples/ai` before writing the gate catalogue

**Evidence**: the `examples/` directory of `vitalets/playwright-bdd` contains an `ai` entry
alongside `api-testing`, `auth`, `basic-cjs`, `basic-esm`, `cucumber-style`, `decorators`.
**Source**: [GitHub API — contents/examples](https://api.github.com/repos/vitalets/playwright-bdd/contents/examples) — Accessed 2026-08-27.

**Why it transfers**: it is the tool vendor's own worked opinion on agent-authored BDD, on a
tool already chosen (decision 5, prior Finding 1.5.4). It bears directly on pre-course
experiment 2 (declarative vs imperative Gherkin), where the prior research found *no* evidence
existed. Contents unread — this is an action item, not a finding (Gap G6).

---

## Verdict

**Nothing found in this pass is directly usable. The prior recommendation — build the baseline
app from scratch — stands, now supported by a second, independent line of argument.**

That is a genuine conclusion, not a failure to search. The specific gap this pass existed to
close — category (b), explicitly training-positioned repositories — was searched systematically
across seven distinct query strategies (`topic:workshop`, `topic:kata`, `topic:coding-dojo`,
`topic:training`, `topic:example-app`, BDD/Cucumber template free-text, conference/consultancy
free-text) plus eight individually verified repositories. The category is not thin; it is
**well-populated and almost entirely unavailable**.

**The three reasons, ranked by how decisive they are:**

1. **Licence (decisive, and new).** Of the top 18 TypeScript `workshop`-topic repos, **exactly
   one carries a permissive licence and it is not a workshop repo** (Storybook, tagged
   metaphorically). Every genuine workshop repo is either `NOASSERTION` — which, for the
   `epicweb-dev` family, resolves to *GPL-3.0, private non-commercial use only, contact us to
   run your own workshop* — or has no licence file at all, meaning all rights reserved. This
   holds at every star level: 7,960-star `total-typescript`, 4,390-star `goldbergyoni`,
   299-star `ReactTraining`. **The best training repos are commercially unavailable by design,
   because they are the free companion to someone else's paid course.** No further searching
   fixes this; it is a market structure, not a coverage problem.

2. **BDD/Gherkin templates contain no application (structural).** This was the most promising-
   sounding branch and it is a category error. BDD templates are deliberately app-agnostic —
   their value proposition is that you point them at *your* app. Verified across a 12-repo
   sample (top result: 6 stars; several drive `automationexercise.com`, a third-party public
   demo site), and confirmed at the two quality poles: `serenity-js`'s official Apache-2.0
   template and `playwright-bdd`'s own `examples/` are both harness-only.

3. **The one near-match is half an app with the wrong domain.** `w3cj/hono-open-api-starter` is
   MIT, matches TypeScript + Hono + Drizzle + Vitest, and — surprisingly — imposes almost no
   process (no CI workflows, no commit hooks). But it has **no frontend, no Playwright, no
   Gherkin**, uses `@libsql/client` rather than the `better-sqlite3` whose prebuild behaviour
   §4a specifically verified, carries ~6 unwanted runtime dependencies against a
   zero-dependency-backend design goal, is ~10 months stale, and its domain is bare `tasks`
   CRUD with no arguable rule to amend. Adopting it means keeping one folder's naming convention
   and rewriting the rest — which is not adoption.

**What changes as a result of this research:**

- **Nothing in the stack decisions.** Decisions 3, 26, 27, 29, 30 and 5 are untouched;
  `playwright-bdd` was independently re-confirmed healthy (MIT, 769 stars, pushed 2026-08-27).
- **One prior argument is weakened and should be restated.** "Third-party starters smuggle in
  unexamined process" was measured false on the one candidate where it was checked. Keep the
  build-from-scratch decision, but rest it on licence + structural fit, and treat
  process-smuggling as a per-candidate hypothesis to test rather than a law (Finding C.2). This
  is the same lesson as §4a, in a new place.
- **Two things are added to the backlog**: read `playwright-bdd/examples/ai` before writing the
  gate catalogue (Idea 7), and decide the app-vs-material licence split before the first public
  push (Idea 3).
- **The parked domain decision (item 4) gains a concrete test**: invariant + deliberate
  exception + withheld amendment (Idea 5). On that test the office game ladder is the strongest
  of the three floated candidates.

**Confidence in this verdict: High.** The licence finding rests on one systematic population
query plus five individually verified repositories, all primary sources, with no contradicting
evidence found. The residual risk is coverage, not correctness — see Gap G5.

---

## Source Analysis

All sources are **primary**: repository metadata, licence files, package manifests, READMEs and
directory listings served by the GitHub REST API or `raw.githubusercontent.com`. These are
directly checkable facts about the artifacts themselves rather than commentary about them, which
is the strongest available evidence class for this question. Per the trusted-source
configuration, `github.com` is rated Medium-High (0.8); no source below that tier was used, and
no excluded domain was consulted.

| Source | Domain | Reputation | Type | Access Date | Cross-verified |
|---|---|---|---|---|---|
| GitHub API — `epicweb-dev/full-stack-foundations` | github.com | Medium-High (0.8) | Project repo metadata | 2026-08-27 | Y |
| `LICENSE.md` — `epicweb-dev/full-stack-foundations` | raw.githubusercontent.com | Medium-High (0.8) | Primary legal document | 2026-08-27 | Y |
| GitHub Search — `topic:workshop language:TypeScript` | github.com | Medium-High (0.8) | Population query | 2026-08-27 | Y |
| GitHub Search — `topic:kata language:TypeScript` | github.com | Medium-High (0.8) | Population query | 2026-08-27 | Y |
| GitHub Search — `topic:coding-dojo language:TypeScript` | github.com | Medium-High (0.8) | Population query | 2026-08-27 | Y |
| GitHub Search — `topic:training language:TypeScript` | github.com | Medium-High (0.8) | Population query | 2026-08-27 | Y |
| GitHub Search — `topic:example-app language:TypeScript` | github.com | Medium-High (0.8) | Population query | 2026-08-27 | Y |
| GitHub Search — `topic:hono topic:drizzle` | github.com | Medium-High (0.8) | Population query | 2026-08-27 | Y |
| GitHub Search — `cucumber playwright typescript template` | github.com | Medium-High (0.8) | Population query | 2026-08-27 | Y |
| GitHub Search — `bdd workshop in:name,description` | github.com | Medium-High (0.8) | Population query | 2026-08-27 | Y |
| GitHub Search — `workshop conference typescript react` | github.com | Medium-High (0.8) | Population query (null) | 2026-08-27 | Y |
| GitHub API — `w3cj/hono-open-api-starter` (repo, /contents, /contents/src, /contents/.github, /contents/.github/workflows) | github.com | Medium-High (0.8) | Project repo metadata | 2026-08-27 | Y |
| `package.json` — `w3cj/hono-open-api-starter` | raw.githubusercontent.com | Medium-High (0.8) | Primary manifest | 2026-08-27 | Y |
| `README.md` — `w3cj/hono-open-api-starter` | raw.githubusercontent.com | Medium-High (0.8) | Primary doc | 2026-08-27 | Y |
| GitHub API — `serenity-bdd/bdd-trader` | github.com | Medium-High (0.8) | Project repo metadata | 2026-08-27 | Y |
| GitHub API — `serenity-js/serenity-js-cucumber-playwright-template` | github.com | Medium-High (0.8) | Project repo metadata | 2026-08-27 | Y |
| GitHub API — `vitalets/playwright-bdd` (repo + /contents/examples) | github.com | Medium-High (0.8) | Project repo metadata | 2026-08-27 | Y |
| GitHub API — `emilybache/GildedRose-Refactoring-Kata` | github.com | Medium-High (0.8) | Project repo metadata | 2026-08-27 | Y |
| GitHub API — `total-typescript/beginners-typescript-tutorial` (repo + /contents/src) | github.com | Medium-High (0.8) | Project repo metadata | 2026-08-27 | Y |
| GitHub API — `goldbergyoni/nodejs-testing-best-practices` | github.com | Medium-High (0.8) | Project repo metadata | 2026-08-27 | Y |
| GitHub API — `stemmlerjs/ddd-forum` | github.com | Medium-High (0.8) | Project repo metadata | 2026-08-27 | Y |
| GitHub API — `epicweb-dev/workshop-app` → `epicshop` | github.com | Medium-High (0.8) | Project repo metadata | 2026-08-27 | Y |
| GitHub API — `epicweb-dev/full-stack-foundations/contents/exercises` | github.com | Medium-High (0.8) | Directory listing | 2026-08-27 | Y |

**Reputation distribution**: High: 0 (0%) | Medium-High: 23 (100%) | Medium: 0 | Excluded: 0.
**Average reputation score: 0.8.**

**Note on the reputation profile.** Unusually for this project's research, there are no
tier-1.0 sources and no secondary commentary. That is appropriate rather than a weakness: the
research question is entirely about the properties of specific GitHub repositories, for which
the repository itself is the primary and authoritative source. Per the brief's instruction that
"empirical checks beat reading", every load-bearing claim (licence, last push, dependency list,
presence of CI workflows, directory contents) was read from the artifact rather than from a
description of it. No blog post, tutorial or listicle was cited, and none was needed.

**Bias check.** One bias is worth recording: repositories self-report their metadata, and
GitHub's licence detector is a heuristic. This mattered once and was caught — `NOASSERTION` on
`epicweb-dev/*` is uninformative on its own, so the operative `LICENSE.md` was fetched
separately, which is what revealed the non-commercial restriction. The reverse risk also exists:
a repo reporting `MIT` in metadata could have inconsistent per-file headers. For
`w3cj/hono-open-api-starter` this was partly mitigated — MIT is declared in *both* the
`package.json` `license` field and a top-level `LICENSE` file — but the LICENSE file body was
not read (Gap G7).

---

## Knowledge Gaps

### Gap G1: Whether every `epicweb-dev` repository carries the same licence
**Issue**: The non-commercial GPL-3.0 terms were read from `full-stack-foundations/LICENSE.md`
and generalised to the other 17 `epicweb-dev` repos on the basis that all report the same
`NOASSERTION` value. The individual LICENSE files of the other repos were not fetched.
**Attempted**: GitHub API licence field for all 18 repos (consistent); one full LICENSE.md.
**Impact**: Low — the conclusion (unusable) would need *all* of them to differ to change.
**Recommendation**: No action. If a specific Epic Web repo ever becomes the preferred option,
read its own LICENSE.md and contact `team@epicweb.dev` as the file instructs.

### Gap G2: Quality of the Gilded Rose TypeScript implementation
**Issue**: Metadata was verified but no TypeScript source was read; the claim that its bones are
good is unverified, and in fact the kata's starting code is *deliberately* bad.
**Attempted**: Repo metadata only.
**Impact**: Very low — it is cited as a pedagogical pattern, not as code to use.
**Recommendation**: If the rule-amendment exercise is modelled on it, read
`GildedRose-Refactoring-Kata/typescript/` before writing the course version.

### Gap G3: `w3cj/hono-open-api-starter` was not install-tested
**Issue**: The §4a lesson is that a 60-second install test can overturn a well-cited conclusion.
This candidate was verified by reading its files, **not** by running `pnpm install && pnpm test`.
Given it is ~10 months stale and its own README admits Drizzle and Zod drift, whether it still
installs and passes on Node 26.5 is unknown.
**Attempted**: `package.json`, directory listings, README — all read. No execution (no shell
available in this research session).
**Impact**: Low for the verdict (it is rejected on frontend/E2E/domain grounds regardless), but
**material if anyone revisits it** as a `backend/` starting point.
**Recommendation**: If it is ever reconsidered, clone and run `pnpm install`, `pnpm typecheck`,
`pnpm test` before any further evaluation. Budget: two minutes.

### Gap G4: `serenity-bdd/bdd-trader`'s internal structure and exercise design
**Issue**: Only metadata was checked. Its exercise format, feature-file style and seeded-data
approach — the parts most worth borrowing — were not examined.
**Attempted**: Repo metadata; surfaced via two independent queries.
**Impact**: Low-Medium. It is unusable as code (Java) but is the closest existing analogue to
what this course is building, so its *pedagogy* may be worth more than this document captures.
**Recommendation**: Worth 20 minutes before authoring the feature backlog — specifically, read
its `.feature` files to see how a commercial BDD training business scopes a workshop exercise.

### Gap G5: Untagged repositories are invisible to topic queries
**Issue**: Five of the seven population queries relied on GitHub **topic tags**, which are
voluntary. A well-built conference-workshop full-stack TypeScript repo that simply never added
`topic:workshop` would not appear in any of them.
**Attempted**: Mitigated with three free-text `in:name,description[,readme]` queries, which is
why the confidence on B.5 is Medium rather than High. GitHub code search (which would search
file contents) was not available in this session.
**Impact**: Medium — this is the main residual risk to the verdict's completeness. Note,
however, that it threatens *coverage* only: any repo found this way would still face the
licence wall of Finding B.3, which is the decisive constraint.
**Recommendation**: If a further pass is wanted, use authenticated GitHub **code** search for
distinctive file signatures — e.g. a repo containing both `*.feature` files and
`drizzle.config.ts` — rather than more topic queries. Low expected yield.

### Gap G6: Contents of `playwright-bdd/examples/ai`
**Issue**: The directory's existence is verified; its contents are not.
**Attempted**: Directory listing only.
**Impact**: Low for this research, **potentially high for the course** — it is the tool vendor's
own position on agent-authored Gherkin, and the prior research found no evidence on that
question at all.
**Recommendation**: Read it before pre-course experiment 2. Highest-value follow-up in this
document.

### Gap G7: `LICENSE` file bodies not read for MIT-reporting repos
**Issue**: For `w3cj/hono-open-api-starter`, `emilybache/GildedRose-Refactoring-Kata` and
`serenity-js/…-template`, the licence was taken from GitHub's detector (plus, for `w3cj`, the
`package.json` field). The LICENSE file text was not read.
**Attempted**: API metadata; `package.json` for `w3cj`.
**Impact**: Low — GitHub's detector is reliable for exact-match MIT/Apache-2.0 texts, and the
`NOASSERTION` cases (where it is *not* reliable) were the ones investigated in full.
**Recommendation**: Read the LICENSE body of anything actually adopted. Standard practice, not a
research task.

### Gap G8: No comparative data on which domains actually work in a mixed-ability room
**Issue**: The domain-quality criterion (6) was assessed by inspection. No evidence was found
either way on which example domains empirically work best for cross-functional developer/product
audiences — the search surfaced no experience reports, retrospectives or studies.
**Attempted**: The search strategies above surfaced repos, not pedagogy literature. This was not
separately pursued as it falls outside the brief's scope.
**Impact**: Medium for parked item 4, which remains a judgement call.
**Recommendation**: If item 4 stays contentious, a short separate search of practitioner
experience reports (`infoq.com`, `martinfowler.com`, conference talk write-ups on workshop
design) would be a different and possibly more productive question than "which repo".

---

## Conflicting Information

### Conflict 1: Do third-party starters necessarily smuggle in an unexamined process?

**Position A** — *Yes; this is a category-level property.* The prior research concluded that
"production starters are dense with embedded process opinions (commit hooks, conventional
commits, CI workflows), so a third-party starter is an unexamined process smuggled into a course
about examining your process."
Source: [`docs/research/tooling/typescript-stack-and-baseline-apps-comprehensive-research.md`, §2.3](docs/research/tooling/typescript-stack-and-baseline-apps-comprehensive-research.md) — project-internal, treated as Medium-High. Evidence: qualitative assessment of Epic Stack, bulletproof-react, Better-T-Stack.

**Position B** — *No; at least one real candidate imposes almost nothing.*
`w3cj/hono-open-api-starter` has **no `.github/workflows` directory** (HTTP 404), **no husky /
lint-staged / simple-git-hooks / commitlint / semantic-release** anywhere in `package.json`, and
no `prepare` script. Its checks are exposed as four independent npm scripts — `typecheck`,
`lint`, `test`, `build` — with nothing wiring them together, which is close to a literal
implementation of decision 12/13's "gate catalogue, unwired".
Source: [GitHub API — w3cj/hono-open-api-starter contents](https://api.github.com/repos/w3cj/hono-open-api-starter) and [package.json](https://raw.githubusercontent.com/w3cj/hono-open-api-starter/main/package.json), Medium-High (0.8) — Accessed 2026-08-27. Evidence: direct file inspection.

**Assessment**: **Position B is better evidenced on the narrow point, and Position A survives as
a tendency rather than a law.** Position A rests on qualitative reading of *production-readiness*
starters, where the claim is almost certainly true — those repos exist to demonstrate a complete
production setup, so CI and hooks are the product. Position B is a direct measurement of a
*minimal API starter*, a different sub-category with different incentives. Both can be correct
about their own populations.

The practical resolution: **keep the build-from-scratch decision, but change its justification.**
It should rest on the licence wall (Finding B.3) and structural fit (Finding A.1) — both of which
are measured and decisive — rather than on process-smuggling, which is now known to be
candidate-dependent. Per the §4a lesson, "it will smuggle in process" should be tested against a
candidate's actual files, not assumed. It costs one API call.

---

## Recommendations for Further Research

1. **Read `vitalets/playwright-bdd/examples/ai` (highest value, ~15 min).** The tool vendor's own
   worked example of AI-assisted BDD, on a tool already chosen. It bears directly on pre-course
   experiment 2, where the prior research established that no evidence exists on whether agents
   author declarative or imperative Gherkin. Closes Gap G6.
2. **Install-test `w3cj/hono-open-api-starter` if it is ever reconsidered (~2 min).** Explicitly
   because §4a showed a cheap experiment overturning a well-cited conclusion. Closes Gap G3.
3. **Read `serenity-bdd/bdd-trader`'s `.feature` files (~20 min).** The only located example of a
   commercial BDD training business's workshop-exercise design. Its scoping decisions — how many
   scenarios per exercise, how much seeded data — are directly transferable to the feature
   backlog even though the code is Java. Closes Gap G4.
4. **Reframe the domain question as pedagogy, not repos (Gap G8).** The domain decision (parked
   item 4) will not be settled by finding another repository. A short search of workshop-design
   experience reports would be a different and likelier-to-succeed question. Apply the
   invariant / deliberate-exception / withheld-amendment test (Borrowable Idea 5) as the interim
   decision heuristic.
5. **Do not re-run this search.** Findings B.3 and C.1 establish that the gap is caused by market
   structure — maintained training repos are the free companion to paid courses and are licensed
   accordingly. Further querying has low expected yield. If anyone is tempted, the only untried
   angle worth the time is authenticated GitHub *code* search for repos containing both
   `*.feature` files and `drizzle.config.ts` (Gap G5).

---

## Full Citations

[1] Epic Web Dev. "full-stack-foundations — Learn the foundational skills of building full stack web applications". GitHub. Accessed 2026-08-27. https://github.com/epicweb-dev/full-stack-foundations
[2] Epic Web Dev. "LICENSE.md" (GPL-3.0, private non-commercial use; workshop use by arrangement). GitHub raw content. Accessed 2026-08-27. https://raw.githubusercontent.com/epicweb-dev/full-stack-foundations/main/LICENSE.md
[3] Epic Web Dev. "epicshop — The workshop app for all workshops on EpicWeb.dev". GitHub. Accessed 2026-08-27. https://github.com/epicweb-dev/epicshop
[4] CJ Reynolds (w3cj). "hono-open-api-starter — A starter template for building fully documented type-safe JSON APIs with Hono and Open API". GitHub. Last push 2025-10-31. Accessed 2026-08-27. https://github.com/w3cj/hono-open-api-starter
[5] CJ Reynolds (w3cj). "package.json". GitHub raw content. Accessed 2026-08-27. https://raw.githubusercontent.com/w3cj/hono-open-api-starter/main/package.json
[6] CJ Reynolds (w3cj). "README.md — Code Tour". GitHub raw content. Accessed 2026-08-27. https://raw.githubusercontent.com/w3cj/hono-open-api-starter/main/README.md
[7] Serenity BDD. "bdd-trader — demo application used for exercises in the Serenity Dojo BDD workshops". Apache-2.0. GitHub. Accessed 2026-08-27. https://github.com/serenity-bdd/bdd-trader
[8] Serenity/JS. "serenity-js-cucumber-playwright-template". Apache-2.0. GitHub. Accessed 2026-08-27. https://github.com/serenity-js/serenity-js-cucumber-playwright-template
[9] Vitaliy Potapov. "playwright-bdd — BDD testing with Playwright runner". MIT. GitHub. Last push 2026-08-27. Accessed 2026-08-27. https://github.com/vitalets/playwright-bdd
[10] Emily Bache. "GildedRose-Refactoring-Kata — Starting code for the GildedRose Refactoring Kata in many programming languages". MIT. GitHub. Created 2013-06-10, last push 2026-08-21. Accessed 2026-08-27. https://github.com/emilybache/GildedRose-Refactoring-Kata
[11] Matt Pocock / Total TypeScript. "beginners-typescript-tutorial — An interactive TypeScript tutorial for beginners". No licence. GitHub. Accessed 2026-08-27. https://github.com/total-typescript/beginners-typescript-tutorial
[12] Yoni Goldberg. "nodejs-testing-best-practices — Beyond the basics of Node.js testing... including an example app". No licence. GitHub. Accessed 2026-08-27. https://github.com/goldbergyoni/nodejs-testing-best-practices
[13] Khalil Stemmler. "ddd-forum — Hacker news-inspired forum app built with TypeScript using DDD practices from solidbook.io". ISC. GitHub. Last push 2023-06-10. Accessed 2026-08-27. https://github.com/stemmlerjs/ddd-forum
[14] GitHub, Inc. "Search API — repositories". Queries: `topic:workshop language:TypeScript`; `topic:kata language:TypeScript`; `topic:coding-dojo language:TypeScript`; `topic:training language:TypeScript`; `topic:example-app language:TypeScript`; `topic:hono topic:drizzle`; `cucumber playwright typescript template in:name,description`; `bdd workshop in:name,description`; `workshop conference typescript react in:name,description`. All accessed 2026-08-27. https://api.github.com/search/repositories

---

## Research Metadata

**Duration**: single session, 2026-08-27.
**Repositories examined**: ~110 across 9 population queries; **13 individually verified** against
their own API metadata; **6 inspected at file level** (`epicweb-dev/full-stack-foundations`,
`epicweb-dev/…/exercises`, `w3cj/hono-open-api-starter` ×5 endpoints,
`total-typescript/…/src`, `vitalets/playwright-bdd/examples`).
**Sources cited**: 23 distinct source records / 14 numbered citations.
**Cross-references**: every finding carries at least one independent verification source; no
finding rests on a single query.
**Confidence distribution**: High 7 findings (78%) — B.1, B.2, B.3, B.4 (population), A.1, A.3,
B.6, C.1; Medium 2 (22%) — B.5 (topic-tag coverage risk), A.2 (metadata high, internals unread).
Low 0.
**Tool failures**: 2 malformed GitHub Search queries returned HTTP 422 / empty and were
reformulated (`topic:coding-dojo OR topic:coderetreat OR topic:training-material` with a
`language:` qualifier; an `org:`-scoped multi-org query). One free-text query
(`playwright-bdd in:name,description,readme`) was mangled by hyphen tokenisation and returned
awesome-lists; superseded by direct repo lookup. No source was lost as a result.
**Adversarial validation**: all fetched content was repository metadata and project files served
by the GitHub API. No prompt-injection, authority-impersonation or directive language was
detected in any fetched artifact. No content from excluded domains was consulted.
**Output**: `docs/research/tooling/training-oriented-app-templates-comprehensive-research.md`
