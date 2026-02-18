# Materialist

**Hybrid Autonomous Materials Science + AI Community**

Verified rigor + anonymous wildness. A platform where verified researchers and anonymous contributors coexist—creating a trust spectrum instead of binary authentication.

---

## Philosophy: Hybrid Autonomy

**Hybrid** = Verified researchers + anonymous users share the same space
- Verified researchers establish credibility through email signup + profile completion
- Anonymous users contribute without career risk (postdocs discussing lab politics, industry sharing proprietary insights)
- Users toggle anonymity per-post—same person can be verified on papers, anonymous in forum

**Autonomous** = Community self-governs through voting, karma, and bot curation
- Voting system (upvote/downvote) determines visibility
- Karma-based reputation incentivizes quality
- Bot accounts (`isBot: true`) autonomously post arXiv digests, benchmarks, jobs

**Why This Matters**: Confidential postdocs can discuss toxic advisors. Industry researchers can share findings without NDAs. Students ask "dumb questions" without judgment. PIs build authority through consistent contributions.

---

## Core Architecture

### Dual Identity System

```typescript
interface User {
  isAnonymous: boolean  // Toggle per post/comment
  isBot: boolean        // Bot accounts for automated curation
  bio?: string          // Self-introduction
  karma: number         // Reputation earned through votes
}
```

**Anonymous Users**: `isAnonymous: true` hides identity—no username link, deterministic random avatar. Users switch between identified and anonymous per-post.

### 4 Sections

| Section | Purpose | Example Content |
|---------|---------|-----------------|
| **Papers** | Peer-reviewed research, arXiv, DOI refs | "GNoME: 2.2M stable crystals discovered" |
| **Forum** | Questions, career advice, news | "Is anyone else struggling with VASP convergence?" |
| **Showcase** | Tools, datasets, models, workflows | "My ASE+MLFF pipeline for high-throughput screening" |
| **Jobs** | Postdoc, PhD, industry, internships | "Postdoc @ Stanford: Battery ML" |

### Post Types

```typescript
type Post = {
  section: "papers" | "forum" | "showcase" | "jobs"
  isAnonymous: boolean  // Author can hide identity

  // Paper-specific
  doi?: string
  arxivId?: string

  // Forum-specific
  flair?: "discussion" | "question" | "career" | "news"

  // Showcase-specific
  showcaseType?: "tool" | "dataset" | "model" | "library" | "workflow"

  // Job-specific
  jobType?: "postdoc" | "phd" | "full-time" | "internship" | ...
}
```

---

## Tech Stack

- **Next.js 16** + App Router + TypeScript + React 19
- **Tailwind v4** — CSS-only config in `globals.css` (NO `tailwind.config.ts`)
- **shadcn/ui** — Components in `src/components/ui/` (DO NOT edit—they're generated)
- **Supabase** — PostgreSQL + Auth (email/password, Google/GitHub OAuth, RLS policies)
- **Cloudflare Workers** — Deployed via `@opennextjs/cloudflare` with Workers Builds (auto CI/CD)

### Key Imports

```typescript
import type { User, Post, Comment, Section } from "@/lib/types"
import { sections, sectionByKey } from "@/lib/sections"
import { cn } from "@/lib/utils"  // clsx + tailwind-merge
```

---

## Non-Negotiable Constraints

1. **Tailwind v4 CSS-only config** — All theme vars in `globals.css` using `@theme`, `@utility`, `@layer`. No `tailwind.config.ts`.
2. **shadcn/ui read-only** — Components in `src/components/ui/` are scaffolded. Customize via Tailwind classes in consuming components.
3. **Light theme default** — GitHub-inspired design. Dark mode available, but light is default.
4. **CSS variables as single source of truth**:
   ```css
   --header-height: 3.5rem    /* Used by header/sidebars/layout */
   --section-papers: #0969da   /* Papers = blue */
   --section-forum: #1a7f37    /* Forum = green */
   --upvote: #ff4500           /* Reddit-style upvote */
   ```

---

## Project Structure

```
src/
  lib/
    types.ts                — User, Post, Comment, Section types
    sections.ts             — Section metadata, flair system
    auth/
      context.tsx           — AuthProvider (centralized navigation via onAuthStateChange)
      types.ts              — Profile, AuthContextValue interfaces (includes isNavigating)
      utils.ts              — profileToUser mapper, deriveStatus
    supabase/
      client.ts             — Browser Supabase client (createBrowserClient)
      server.ts             — Server Supabase client (createServerClient)
      admin.ts              — Admin client with service role (bypasses RLS)
      middleware.ts         — Session refresh for Next.js middleware

  features/
    posts/
      domain/             — Types, mappers, vote-state, query-normalization
      application/        — Use cases (cast-vote, create-comment) + ports
      infrastructure/     — Supabase repository implementation
      presentation/       — React hooks + UI components
      api/                — HTTP error handling + parsing

  app/
    page.tsx                — Home feed (all posts)
    papers/                 — Papers section
    forum/                  — Forum section
    showcase/               — Showcase section
    jobs/                   — Jobs section
    post/[id]/              — Post detail with nested comments
    create/                 — Post composer
    u/[username]/           — User profile (About, Activity, Details tabs)
    settings/               — User settings (Profile, Appearance, Account)
    (auth)/
      layout.tsx            — Centered auth layout (no sidebar)
      login/page.tsx        — Login page (email/password + Google/GitHub OAuth)
      signup/page.tsx       — Signup page (email/password + Google/GitHub OAuth)
      auth/callback/route.ts — Supabase auth callback (code exchange)

  components/
    user/
      anonymous-avatar.tsx         — Deterministic hash-based avatar
      user-profile-header.tsx      — Profile header with bio
      profile-edit-form.tsx        — Profile edit modal
    post/
      post-card.tsx                — Post card display
    ui/                            — shadcn components (DO NOT EDIT)

supabase/
  migrations/                      — Single squashed migration (all history consolidated)
  config.toml                      — Supabase CLI config

wrangler.jsonc                    — Cloudflare Workers config (build command, vars)
open-next.config.ts               — OpenNext Cloudflare adapter config
middleware.ts                     — Supabase session refresh on every request
```

---

## Build & Dev

**Environment setup**:
```bash
cp .env.local.example .env.local  # Fill in secret keys
npx supabase start                # Start local Supabase (requires Docker)
```

> **Important**: Always develop and test against the local Supabase instance first. Never run `supabase db push` without explicit user approval.

```bash
npm run dev           # Turbopack dev server (localhost:3001)
npm run build         # Next.js production build
npm run preview       # OpenNext Cloudflare build + local preview
npm run deploy        # OpenNext Cloudflare build + deploy to Workers
npm run test          # Vitest unit tests
npm run test:e2e      # Playwright E2E tests
```

---

## Backend: Current Implementation

### Authentication & Authorization

**Supabase Auth** with email/password and OAuth:
- **Authenticated users** — Email/password signup or Google/GitHub OAuth:
  1. `/signup` → Email/password or OAuth signup
  2. `/login` → Email/password or OAuth login
  3. `/auth/callback` → Supabase code exchange (handles OAuth redirect + email confirmation)
  4. Profile auto-created on signup with friendly username
  5. Signed-in users land on `/u/:username` and can edit profile later in Settings
- **Auth statuses**: `loading` → `anonymous` (no session) → `authenticated` (session exists, profile not loaded yet) → `verified` (session + profile loaded)

**Row Level Security (RLS)**:
```sql
-- profiles table policies
CREATE POLICY "Public read access" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

**Anonymous Toggle**:
- Users can toggle `is_anonymous` per post/comment
- Anonymous posts hide username, show deterministic avatar (hash-based)

### Auth Navigation Architecture

**Centralized navigation** via `onAuthStateChange` listener in `AuthContext` (`src/lib/auth/context.tsx`):

**Navigation Rules**:
| Auth Event | Destination | Condition |
|------------|-------------|-----------|
| `SIGNED_OUT` | `/` (home feed) | Always |
| `SIGNED_IN` | `/u/:username` | Profile found |
| `SIGNED_IN` | `/` (home feed) | Profile unavailable fallback |
| `INITIAL_SESSION` | No navigation | Page load with existing session |
| `TOKEN_REFRESHED` | No navigation | Background session refresh |

**Key Architecture Decisions**:
1. **Zero manual navigation in UI components** — `signOut()`, `signInWithEmail()`, `signInWithOAuth()` calls don't require `router.push()`
2. **`isNavigating` flag** — Prevents route guard conflicts during auth transitions (login/signup pages check this before redirecting)
3. **`pendingSignIn` state** — Defers navigation until profile fetch completes after sign-in
4. **`hasReceivedInitialSession` ref** — Guards against unwanted navigation on page load or token refresh

**Files Involved**:
- `src/lib/auth/context.tsx` — `onAuthStateChange` listener with navigation logic
- `src/lib/auth/types.ts` — `isNavigating: boolean` in `AuthContextValue`
- `src/app/(auth)/login/page.tsx` — Route guard with `isNavigating` check
- `src/app/(auth)/signup/page.tsx` — Route guard with `isNavigating` check
- `src/components/layout/header.tsx` — Sign out button (no manual navigation)
- `src/app/settings/page.tsx` — Sign out button (no manual navigation)

### Database

**Tables**:
- `profiles` — User profiles (username, email, bio, karma, is_bot)
- `posts` — All post types with section-specific fields
- `comments` — Flat storage with `parent_comment_id` + `depth` (max 6)
- `votes` — Unique constraint on user_id + target_type + target_id

**Triggers**:
- `handle_new_user` — Auto-create profile on `auth.users` INSERT
- `handle_updated_at` — Auto-update `updated_at` timestamp

### Deployment (Cloudflare Workers Builds)

**Auto CI/CD on `main` branch push**:

1. **GitHub push** → Workers Builds triggered
2. **Build phase** (`npx opennextjs-cloudflare build`):
   - Reads build-time env vars from **Cloudflare Dashboard > Settings > Build > Build variables**
   - Runs `next build` with `NEXT_PUBLIC_*` vars inlined
   - Generates `.open-next/worker.js` + `.open-next/assets/`
3. **Deploy phase**:
   - Uploads Worker script to Cloudflare edge
   - Binds runtime secrets (set via `wrangler secret put`)
4. **Result**: `https://materialist.science` updated

**Key files**:
- `wrangler.jsonc` — Workers config (name, compatibility_date, assets binding, public vars)
- `open-next.config.ts` — OpenNext adapter config
- `middleware.ts` — Supabase session refresh

**Environment Variables**:

| Variable | Location | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_*` | Build vars + Runtime vars | Public client-side values (Supabase URL, anon key, app URL) |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime secrets only | Supabase admin key (bypasses RLS) |

**Build-time vs Runtime**:
- **Build variables** — Available during `next build` for SSG pages (set in Cloudflare Dashboard)
- **Runtime secrets** — Available at request-time in API routes/middleware (set via `wrangler secret put`)

**Important**: `wrangler.jsonc` `build.command` and `vars` are **NOT used by Workers Builds**. Only dashboard settings apply.
