# Matsci.org-Informed Strategy to Increase Activated Users/Day (Materialist)

## TL;DR

> **Summary**: Make Forum Q&A the activation engine (matsci-like long-tail), then amplify it with Tool Hubs, templates, and measurable funnels.
> **Deliverables**:
>
> - Canonical tag system + `/tag/[tag]` hub pages (Tool Hubs v1)
> - Forum “Question” template + unanswered queue + zero-state CTAs
> - Activation KPI instrumentation + cohortable GA4 events + updated `metrics/daily.json` collector
> - SEO upgrades (QAPage JSON-LD for questions + sitemap coverage + internal linking)
> - Ops playbook: project-rep program + 30-day seeding cadence (tool maintainers/labs)
>   **Effort**: XL
>   **Parallel**: YES — 4 waves
>   **Critical Path**: Canonical tags + instrumentation → question template + unanswered loop → tool hubs → SEO/internal links → outreach + seeding cadence

## Context

### Original Request

- “matsci.org 프로젝트 참고해서 활성 사용자/방문자 낮은 문제를 개선할 완벽한 전략 수립”

### Interview Summary

- Primary KPI (next 30 days): `Activated users/day` (unique users doing >=1 of `vote_cast`, `comment_created`, `post_created`).

### Repo + Reference Findings

- matsci.org: Discourse umbrella forum; many tool/project categories; visible project representatives; strong long-tail SEO; projects migrate support forums into matsci; governance/neutrality emphasized.
- Materialist already has: 4 sections, tags + trending topics RPC, search RPC, in-app notifications, bots, GA4 + daily metrics snapshot (`metrics/daily.json`), UX experiments.
- Key technical risk: tags are exact-match freeform ("vasp" vs "#VASP" fragment), while trending output forces a leading `#`.

### Metis Review (gaps addressed)

- Timebox “Tool Hubs v1” to avoid Discourse-clone scope creep.
- Canonicalize tags end-to-end + provide alias/compat so hubs/trending/search don’t fragment.
- Avoid thin/duplicate SEO pages; use canonical URLs; preselect hub set.
- Make “project reps + first response time” an explicit operational loop (not just UI).

## Work Objectives

### Core Objective

- Increase `Activated users/day` by removing contribution friction and making “ask/answer” the default first action, while keeping anonymity + bots from confounding measurement.

### Deliverables

- D1. Activation KPI event taxonomy + daily collector updates + baseline doc.
- D2. Canonical tag representation + compatibility layer + tests.
- D3. Forum Question authoring improvements: question template + unanswered queue + comment zero-state CTA.
- D4. Tool Hub pages v1: `/tag/[tag]` (5 hubs) with CTA + rep list + filtered feed + sitemap entries.
- D5. SEO: QAPage JSON-LD for forum questions + related-post internal links.
- D6. Ops: project-representative program docs + seed content + outreach templates.

### Definition of Done (verifiable)

- Tag input, filter, trending links, and hub routes resolve to a single canonical tag (no fragmentation).
- `/tag/<tool>` loads, renders hub header + CTA, and correctly filters posts tagged with `<tool>` and legacy `#<tool>`.
- Forum “question” posts render QAPage JSON-LD (non-question posts remain Article).
- `scripts/collect-metrics.ts` collects the new GA4 events without breaking existing metrics.
- Vitest + Playwright (where applicable) pass; `npm run build` succeeds.

### Must Have

- No Discourse rewrite; keep existing Next.js/Supabase architecture.
- No PII in analytics (no email/username/post title/raw query text in GA4 params).
- Bot engagement is measurable separately from organic activation.

### Must NOT Have (guardrails)

- Do not introduce complex taxonomy (hierarchies/synonyms UI) in the first 30 days.
- Do not attempt mass importing/migrating external forums in the 30-day window.
- Do not expand middleware matcher beyond `/auth/*`.

## Verification Strategy

> ZERO HUMAN INTERVENTION — all verification is agent-executed.

- Test decision: tests-after (Vitest + Playwright where UI/SEO changes exist)
- Evidence policy: each task writes proof artifacts to `.sisyphus/evidence/task-{T#}-{slug}.*` (screenshots, JSON extracts, command logs)

## Execution Strategy

### Parallel Execution Waves

Wave 1 (Foundations: measurement + tags)

- T1 Instrument activation KPI + funnel events; update daily collector + docs
- T2 Canonical tag model + compatibility filter + tests

Wave 2 (Activation UX)

- T3 Comment zero-state CTA + composer affordance + instrumentation hooks
- T4 Forum question template + unanswered queue

Wave 3 (Tool Hubs + SEO)

- T5 `/tag/[tag]` Tool Hub pages v1 + sitemap + sidebar entry
- T6 QAPage JSON-LD for forum questions + related-post internal links

Wave 4 (Ops + distribution)

- T7 Project rep program docs + hub rep allowlist display
- T8 Seed content bundle + outreach kit (no external sending)

### Dependency Matrix

- T1 blocks: T3, T4, T5, T6 (event names + measurement definitions)
- T2 blocks: T5 (hub routing + tag filtering), T6 (related-post links by canonical tag)
- T3 blocks: —
- T4 blocks: T6 (QAPage depends on question flair/template conventions)
- T5 blocks: T7, T8
- T6 blocks: —
- T7 blocks: T8
- T8 blocks: —

### Agent Dispatch Summary

- Wave 1: quick + unspecified-low (analytics + normalization)
- Wave 2: visual-engineering (composer/empty states)
- Wave 3: visual-engineering (hub UI) + deep (SEO/schema)
- Wave 4: writing (ops artifacts) + unspecified-low (lists/templates)

## TODOs

> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [ ] T1. Instrument Activated Users KPI + Funnel Events (GA4) and Extend Daily Collector

  **What to do**:
  - Define a canonical event taxonomy focused on activation:
    - `activated` (fires once per browser session, on first core action)
    - `auth_gate_shown` + `auth_gate_click` (anonymous user hits a locked action)
    - `composer_open` (post/comment composer shown or first focus)
    - `question_template_inserted` (forum question template used)
    - `unanswered_view` (unanswered feed viewed)
    - `hub_view` (tool hub page viewed)
    - `tag_filter_used` (tag filter applied)
    - `search_used` + `search_result_click`
    - `share_click`
  - Implement `activated` as once-per-session via `sessionStorage` to prevent inflation.
  - Event parameter spec (decision-complete; all params optional except where noted):
    - `activated` (required: `activation_type`): `activation_type=vote|comment|post`, `section`, `identity_mode=anonymous|verified`, `tag` (if action happened inside a hub)
    - `auth_gate_shown` / `auth_gate_click`: `locked_action=vote|comment|post`, `section`, `identity_mode` (current)
    - `composer_open`: `composer_type=post|comment`, `section`, `is_reply` (comment only)
    - `hub_view`: `tag` (canonical)
    - `tag_filter_used`: `tag` (canonical)
    - `search_used`: `query_len` (number), `scope=global|section`, `has_tag_filter` (bool)
    - `search_result_click`: `post_id`, `has_query` (bool), `has_tag_filter` (bool)
    - `share_click`: `surface=post_card|post_detail`, `post_id`
  - Add `auth_gate_*` instrumentation to existing sign-in toasts in:
    - `src/components/voting/vote-button.tsx`
    - `src/components/comment/comment-composer.tsx`
    - `src/components/post/post-composer.tsx`
  - Add `composer_open` for:
    - Post composer mount (create page)
    - Comment composer first focus (post detail + reply)
  - Add `search_used` on header search submit and `search_result_click` on post cards.
    - Params must not include raw query text; only `query_len`, and boolean flags like `has_tag_filter`.
  - Extend `scripts/collect-metrics.ts` by adding the new events to `EVENTS`.
  - Update `ux-experiment/000-guide.md` (event inventory + definitions) and add `ux-experiment/004-activated-users-baseline.md`:
    - Define Activated users/day computation method.
    - Define how to report “bot-assisted vs organic” activation (e.g., `comment_created` with bot mention).

  **Must NOT do**:
  - Do not send PII to GA4 params (no emails, usernames, post titles, raw query text).
  - Do not break app functionality if GA is blocked; keep `event()` guarded/no-op.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: additive instrumentation + script/docs updates
  - Skills: [`ux-experiment`] — keep metrics docs consistent
  - Omitted: [`playwright`] — only required if new UI is added

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T3,T4,T5,T6 | Blocked By: —

  **References**:
  - Analytics: `src/lib/analytics/gtag.ts`, `src/lib/analytics/provider.tsx`
  - Daily collector: `scripts/collect-metrics.ts`, `metrics/daily.json`
  - Existing event inventory: `ux-experiment/000-guide.md`
  - Search UX: `src/components/layout/header.tsx`, `src/features/posts/presentation/use-search-filter.ts`

  **Acceptance Criteria**:
  - [ ] `npm run lint` passes
  - [ ] `npx tsc --noEmit` passes
  - [ ] `npm run test` passes
  - [ ] `npm run build` passes
  - [ ] `scripts/collect-metrics.ts` includes the new events in `EVENTS`
  - [ ] Evidence: `.sisyphus/evidence/task-t1-events.json` exists (event names + params table)

  **QA Scenarios**:

  ```
  Scenario: Auth gate event fires on locked action
    Tool: Playwright
    Steps:
      1) Visit /post/<id> while signed out
      2) Click Vote and Comment
    Expected:
      - Toast shows actionable Sign in
      - auth_gate_shown attempted (+ auth_gate_click if clicked)
    Evidence: .sisyphus/evidence/task-t1-auth-gate.png

  Scenario: Activated fires once per session
    Tool: Playwright
    Steps:
      1) Sign in
      2) Cast 2 votes in same session
    Expected:
      - activated fires at most once
    Evidence: .sisyphus/evidence/task-t1-activated-once.txt
  ```

  **Commit**: YES | Message: `feat(analytics): add activation and funnel events` | Files: `src/**`, `scripts/collect-metrics.ts`, `ux-experiment/**`

- [ ] T2. Canonical Tag Model + Compatibility (fix # vs no-# fragmentation)

  **What to do**:
  - Canonical tag storage model (v1 decision):
    - Stored: lowercase slug without `#` (e.g. `vasp`, `quantum-espresso`)
    - Display: always show `#${tag}` in UI
  - Update `normalizeTag()` in `src/features/posts/domain/query-normalization.ts` to canonicalize:
    - trim + collapse whitespace
    - strip leading `#`
    - lowercase
    - replace spaces with `-`
    - remove disallowed chars (keep `[a-z0-9-_.+]`)
    - length <= 40, empty => `undefined`
  - Update tag parsing in `src/components/post/post-composer.tsx`:
    - canonicalize + dedupe tags before API submit
    - do not rewrite user input while typing
  - Update tag filtering in `src/features/posts/infrastructure/supabase-posts-repository.ts`:
    - replace exact `.contains("tags", [tag])` with an OR filter that matches both `{tag}` and `{#tag}`
    - ensure `parseTag()` uses the new canonicalization (`src/features/posts/api/http.ts`)
  - Update trending topic linking so returned display values like `#vasp` route to `/tag/vasp`.
  - Extend unit tests in `src/features/posts/domain/__tests__/query-normalization.test.ts`.

  **Must NOT do**:
  - Do not require an immediate DB migration; compatibility must work without it.
  - Do not introduce a new taxonomy DB schema in v1.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: deterministic normalization + query adjustments + tests
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T5,T6 | Blocked By: —

  **References**:
  - Tag parsing UI: `src/components/post/post-composer.tsx`
  - Tag parsing API: `src/features/posts/api/http.ts`
  - Feed filtering: `src/features/posts/infrastructure/supabase-posts-repository.ts`
  - Trending RPC: `supabase/migrations/20260218120000_drop_profile_pii_columns.sql`

  **Acceptance Criteria**:
  - [ ] `npx vitest run src/features/posts/domain/__tests__/query-normalization.test.ts` passes
  - [ ] `npm run build` passes
  - [ ] Evidence: `.sisyphus/evidence/task-t2-tag-cases.txt` exists

  **QA Scenarios**:

  ```
  Scenario: Tag canonicalization prevents fragmentation
    Tool: Vitest
    Steps:
      - normalizeTag("  #VASP ") => "vasp"
      - normalizeTag("vasp") => "vasp"
      - normalizeTag("Quantum ESPRESSO") => "quantum-espresso"
    Expected: all pass
    Evidence: .sisyphus/evidence/task-t2-vitest.txt
  ```

  **Commit**: YES | Message: `fix(tags): canonicalize tags and support legacy forms` | Files: `src/**`

- [ ] T3. Activation Friction Sweep (Comment Zero-State CTA + Composer Affordance)

  **What to do**:
  - Ensure first-comment experience is actionable (not a blank/dead end):
    - In `src/app/post/[id]/post-detail-page-client.tsx`, when there are 0 comments, show an empty-state block with a primary CTA “Write the first comment”.
    - CTA behavior: focus comment textarea; if signed out, show actionable auth toast.
  - In `src/components/comment/comment-composer.tsx`, ensure:
    - Placeholder uses “Be the first…” when `isFirstComment === true`.
    - `composer_open` fires on first focus.
  - Fire `unanswered_view` when the empty-state block renders.

  **Must NOT do**:
  - Do not create new navigation flows that fight centralized auth navigation.
  - Do not add heavy layout changes; keep readability.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: small but UX-sensitive changes
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: — | Blocked By: T1

  **References**:
  - Post detail: `src/app/post/[id]/post-detail-page-client.tsx`
  - Comment composer: `src/components/comment/comment-composer.tsx`
  - Experiment doc: `ux-experiment/003-comment-post-friction.md`

  **Acceptance Criteria**:
  - [ ] `npm run test` passes
  - [ ] `npm run build` passes
  - [ ] Playwright: empty-state CTA focuses composer and allows typing
  - [ ] Evidence: `.sisyphus/evidence/task-t3-empty-state.png` exists

  **QA Scenarios**:

  ```
  Scenario: First-comment CTA focuses composer
    Tool: Playwright
    Steps:
      1) Visit a post with 0 comments
      2) Click “Write the first comment”
    Expected:
      - Textarea receives focus
    Evidence: .sisyphus/evidence/task-t3-focus.png

  Scenario: Signed-out user gets actionable auth gate
    Tool: Playwright
    Steps:
      1) Sign out
      2) Click “Write the first comment”
    Expected:
      - Toast: “Sign in to comment.” with Sign in action
    Evidence: .sisyphus/evidence/task-t3-auth-toast.png
  ```

  **Commit**: YES | Message: `feat(activation): add first-comment CTA and instrument composer open` | Files: `src/**`

- [ ] T4. Forum Question Template + Unanswered Queue (matsci-style first contribution path)

  **What to do**:
  - Add a “Question template” UX in `src/components/post/post-composer.tsx` when:
    - `section === "forum"` and `flair === "question"`
  - Template behavior (decision-complete):
    - Show a button “Insert template” when flair becomes question and `content.trim().length === 0`.
    - Clicking inserts a Markdown template (never overwrites existing typed content).
    - Fire `question_template_inserted`.
  - Implement an “Unanswered” feed filter:
    - Add query param `unanswered=1` supported by:
      - `src/features/posts/presentation/feed-page-client.tsx` (parse + pass through)
      - `src/features/posts/presentation/use-posts-feed.ts` (include in API qs)
      - `src/features/posts/api/http.ts` (parse)
      - `src/features/posts/infrastructure/supabase-posts-repository.ts` (DB filter: `comment_count = 0`)
    - Add an entry point on Forum page header (chip/button) to toggle Unanswered.
    - Fire `unanswered_view` when unanswered list renders.

  **Must NOT do**:
  - Do not create a separate “questions” section; use Forum + flair + filters.
  - Do not add an “accepted answer” feature in v1.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: composer + feed filter UX
  - Skills: []

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T6 | Blocked By: T1

  **References**:
  - Composer: `src/components/post/post-composer.tsx`
  - Forum feed: `src/app/forum/forum-page-client.tsx`, `src/features/posts/presentation/feed-page-client.tsx`
  - API list posts: `src/app/api/posts/route.ts`, `src/features/posts/api/http.ts`

  **Acceptance Criteria**:
  - [ ] `npm run test` passes
  - [ ] `npm run build` passes
  - [ ] Visiting `/forum?flair=question&unanswered=1` shows only posts with 0 comments
  - [ ] Evidence: `.sisyphus/evidence/task-t4-template.md` contains the exact template text

  **QA Scenarios**:

  ```
  Scenario: Insert question template
    Tool: Playwright
    Steps:
      1) Visit /create
      2) Choose section=Forum and flair=Question
      3) Click “Insert template”
    Expected:
      - Content textarea contains the template
    Evidence: .sisyphus/evidence/task-t4-template.png

  Scenario: Unanswered filter works
    Tool: Playwright
    Steps:
      1) Visit /forum?flair=question&unanswered=1
    Expected:
      - List shows only unanswered questions
    Evidence: .sisyphus/evidence/task-t4-unanswered.png
  ```

  **Commit**: YES | Message: `feat(forum): add question template and unanswered filter` | Files: `src/**`

- [ ] T5. Tool Hubs v1: `/tag/[tag]` Landing Pages + Sitemap Coverage

  **What to do**:
  - Implement a new hub route: `src/app/tag/[tag]/page.tsx`.
  - Hub page behavior (decision-complete):
    - Canonical hub slug is `params.tag`.
    - Hub page shows:
      - Title: `#${tag}`
      - Short description + external links (official docs + GitHub)
      - “Ask a question” CTA (prefilled create link):
        - Link format: `/create?section=forum&flair=question&tag=${tag}`
        - Implement prefill by reading `useSearchParams()` on create/composer mount and applying defaults only when not editing and when the user has not already typed.
      - Feed filtered by this tag across **all sections**
    - Fire `hub_view`.
  - Add a hub registry file: `src/lib/hubs.ts` (static list for v1) with exactly 5 hubs:
    - `lammps`, `vasp`, `quantum-espresso`, `ase`, `pymatgen`
    - Each hub includes: `tag`, `label`, `description`, `links[]`, `repUsernames[]` (empty ok), `seedPostIds[]` (empty ok)
  - Add hub URLs to sitemap:
    - Update `src/app/sitemap.ts` to include `/tag/${hub.tag}` for each hub.
  - Add a navigation entry point:
    - Add “Tool Hubs” section in `src/components/layout/left-sidebar.tsx` linking to the 5 hubs.

  **Must NOT do**:
  - Do not auto-generate hub pages for arbitrary tags yet.
  - Do not require DB schema changes for hubs in v1.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: new page + sidebar/nav + CTA composition
  - Skills: []

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: T7,T8 | Blocked By: T1,T2

  **References**:
  - Feed server: `src/features/posts/server/get-initial-posts-feed.ts`
  - Feed UI: `src/features/posts/presentation/feed-page-client.tsx`
  - Create page: `src/app/create/page.tsx`, `src/components/post/post-composer.tsx`
  - Sitemap: `src/app/sitemap.ts`
  - Sidebar: `src/components/layout/left-sidebar.tsx`

  **Acceptance Criteria**:
  - [ ] `npm run build` passes
  - [ ] Visiting `/tag/vasp` returns 200 and renders hub header + feed
  - [ ] `src/app/sitemap.ts` includes the 5 hub URLs
  - [ ] Evidence: `.sisyphus/evidence/task-t5-hub-pages.png` exists (screenshots of at least 2 hubs)

  **QA Scenarios**:

  ```
  Scenario: Hub page renders + filters posts
    Tool: Playwright
    Steps:
      1) Seed a post tagged "vasp" and one tagged "lammps"
      2) Visit /tag/vasp
    Expected:
      - Only vasp-tagged posts show
    Evidence: .sisyphus/evidence/task-t5-filter.png
  ```

  **Commit**: YES | Message: `feat(hubs): add tool hub pages and sitemap entries` | Files: `src/**`

- [ ] T6. SEO for Q&A: QAPage JSON-LD + Related-Posts Internal Linking

  **What to do**:
  - Extend structured data generation in `src/components/seo/post-json-ld.tsx`:
    - Emit `QAPage` when `post.section === "forum"` and `post.flair === "question"`
    - Otherwise keep current `Article`
    - QAPage minimum schema:
      - `@type: "QAPage"`
      - `mainEntity: { @type: "Question", name, text, answerCount, dateCreated, author, url }`
      - No acceptedAnswer in v1
  - Add related-post internal links on post detail:
    - In `src/app/post/[id]/page.tsx`, fetch up to 5 related posts sharing the first canonical tag (excluding current post).
      - Query shape (decision-complete): `from("posts").select(POSTS_SELECT_LIST).contains("tags", [tag]).neq("id", postId).order("vote_count", { ascending: false }).order("created_at", { ascending: false }).limit(5)`.
      - Prefer reusing `POSTS_SELECT_LIST` exported from `src/features/posts/infrastructure/supabase-posts-repository.ts` to avoid duplicating column lists.
    - Render a compact “More in #tag” box.
  - Ensure stable canonicals for tag hubs and post pages using existing Next metadata patterns.

  **Must NOT do**:
  - Do not include full comment bodies in JSON-LD.
  - Do not add thin pages for arbitrary tags.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: SEO/schema correctness + server data-fetching patterns
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: — | Blocked By: T1,T2,T4

  **References**:
  - JSON-LD: `src/components/seo/post-json-ld.tsx`
  - Post page: `src/app/post/[id]/page.tsx`
  - SEO constants: `src/lib/seo.ts`

  **Acceptance Criteria**:
  - [ ] `npm run build` passes
  - [ ] Forum question post page contains `QAPage` JSON-LD
  - [ ] Non-question post page remains `Article`
  - [ ] Evidence: `.sisyphus/evidence/task-t6-jsonld.json` exists

  **QA Scenarios**:

  ```
  Scenario: QAPage JSON-LD renders for forum questions
    Tool: Playwright
    Steps:
      1) Open a forum post with flair=question
      2) Extract <script type="application/ld+json">
    Expected:
      - @type == "QAPage"
    Evidence: .sisyphus/evidence/task-t6-qapage.json
  ```

  **Commit**: YES | Message: `feat(seo): add QAPage schema and related-post links` | Files: `src/**`

- [ ] T7. Project Representative Program (matsci-like trust + response-time loop)

  **What to do**:
  - Create ops docs:
    - `docs/growth/project-reps.md`:
      - Definition, expectations (first response <24h), boundaries (redirect bugs to GitHub), and visibility.
    - `docs/growth/qna-guidelines.md`:
      - How to ask/answer (minimal repro, versions, code blocks, kindness).
  - Add v1 rep allowlist support in `src/lib/hubs.ts`:
    - `repUsernames[]` per hub (start empty)
    - Hub page renders “Project reps” section when non-empty

  **Must NOT do**:
  - Do not build a full moderation/admin UI in this pass.

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: ops docs + templates
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: T8 | Blocked By: T5

  **References**:
  - Hub registry: `src/lib/hubs.ts`
  - matsci charter (external): `https://matsci.org/t/materials-science-community-forum-charter/4493`
  - matsci getting-started pattern (external): `https://matsci.org/t/getting-started-guide-for-posting-lammps-questions-to-matsci-org/49195`

  **Acceptance Criteria**:
  - [ ] `docs/growth/project-reps.md` exists
  - [ ] `docs/growth/qna-guidelines.md` exists
  - [ ] Evidence: `.sisyphus/evidence/task-t7-docs-list.txt` exists

  **QA Scenarios**:

  ```
  Scenario: Docs are readable and complete
    Tool: Read
    Steps:
      - Open docs/growth/project-reps.md
      - Open docs/growth/qna-guidelines.md
    Expected:
      - Includes expectations + boundaries + examples
    Evidence: .sisyphus/evidence/task-t7-doc-snippets.txt
  ```

  **Commit**: YES | Message: `docs(growth): add project rep program and Q&A guidelines` | Files: `docs/growth/**`, `src/lib/hubs.ts`

- [ ] T8. Seed Content Bundle + Outreach Kit (5 hubs)

  **What to do**:
  - Create `docs/growth/seeding-plan-30d.md`:
    - For each hub: 2 starter questions + 2 starter answers + 3 canonical docs links + suggested tags.
  - Use existing bot tooling to prepare seed posts (no external posting):
    - Run `scripts/bot-post.ts --dry-run` for each seeded forum question (persona `pauling`, flair `question`, tags include hub tag).
    - Save dry-run output into `.sisyphus/evidence/task-t8-seed-dryrun.txt`.
  - Prepare outreach templates:
    - `docs/growth/outreach-email.md`
    - `docs/growth/outreach-github-issue.md`
    - `docs/growth/outreach-social.md`
  - Produce a target list:
    - `.sisyphus/evidence/task-t8-targets.csv` columns: tool, project URL, contact surface, proposed ask.

  **Must NOT do**:
  - Do not send emails or post externally from the agent.
  - Do not create spammy/low-quality seed titles; must be specific + searchable.

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: seed post quality drives SEO + activation
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: — | Blocked By: T7

  **References**:
  - Bot posting: `scripts/bot-post.ts`
  - Bot personas: `src/lib/bots.ts`
  - Baselines: `ux-experiment/001-baseline.md`, `ux-experiment/002-vote-funnel.md`, `ux-experiment/003-comment-post-friction.md`

  **Acceptance Criteria**:
  - [ ] `docs/growth/seeding-plan-30d.md` exists
  - [ ] `.sisyphus/evidence/task-t8-seed-dryrun.txt` exists
  - [ ] Outreach templates exist
  - [ ] `.sisyphus/evidence/task-t8-targets.csv` exists

  **QA Scenarios**:

  ```
  Scenario: Seed plan is actionable
    Tool: Read
    Steps:
      - Open docs/growth/seeding-plan-30d.md
    Expected:
      - Each hub has 2 Q + 2 A with concrete titles and links
    Evidence: .sisyphus/evidence/task-t8-seeding-snippet.txt
  ```

  **Commit**: YES | Message: `docs(growth): add 30-day seeding and outreach kit` | Files: `docs/growth/**`, `.sisyphus/evidence/**`

## Final Verification Wave (4 parallel agents, ALL must APPROVE)

- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy

- Prefer 1 commit per task (T1..T8), with conventional messages:
  - `feat(analytics): ...` for event instrumentation
  - `fix(tags): ...` for canonicalization/compat
  - `feat(forum): ...` for Q&A surfaces
  - `feat(hubs): ...` for tool hub pages
  - `feat(seo): ...` for schema + internal links
  - `docs(growth): ...` for ops + seeding kits

## Success Criteria

- By Day 30: `Activated users/day` is measurably higher than baseline week, with bot-assisted activation reported separately.
- Tool Hubs v1 each have at least 2 seeded Qs and 2 seeded As (seed plan ready even if posting is manual).
