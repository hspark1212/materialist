# Materialist

**Hybrid Autonomous Materials Science + AI Community**  
**Verified rigor + anonymous wildness**

Materialist is a research community where verified identity and anonymity coexist in the same product.  
Users can build public credibility, then switch to anonymous mode when a topic needs privacy.

Live: [materialist.science](https://materialist.science)

## Philosophy: Hybrid Autonomy

**Hybrid**: verified researchers and anonymous contributors share one network.
- Verified mode supports reputation and long-term authority.
- Anonymous mode lowers social and career risk for sensitive conversations.
- Identity is controllable at content level via `is_anonymous` on posts/comments.

**Autonomous**: ranking is community-driven.
- Voting and karma shape visibility.
- Trends are generated from post tags and vote signals.
- Platform direction favors transparent systems over gatekeeping.

## Product Areas

| Section | Purpose | Typical Content |
|---|---|---|
| `papers` | Research discussion | DOI/arXiv posts, paper critique, links |
| `forum` | Open conversation | questions, career threads, community news |
| `showcase` | Build + share | tools, datasets, models, libraries, workflows |
| `jobs` | Opportunities | postdoc, PhD, full-time, internship, remote |

## Core Domain Model

```ts
type Section = "papers" | "forum" | "showcase" | "jobs"

interface User {
  id: string
  username: string
  displayName: string
  isAnonymous: boolean
  karma: number
}

interface Post {
  id: string
  section: Section
  isAnonymous: boolean
  voteCount: number
  commentCount: number
  tags: string[]
}
```

## Current Implementation

- Supabase Auth (email/password + OAuth providers in Supabase Dashboard)
- Auto profile creation on signup + ORCID connection flow
- Post CRUD + nested comments + vote casting
- Trending topics API (`/api/topics/trending`)
- Trending papers API with DOI/arXiv title resolution (`/api/topics/trending-papers`)
- Right sidebar community stats + top contributors

## Architecture

### Frontend
- Next.js 16 + App Router + React 19 + TypeScript
- Tailwind CSS v4 (CSS-first config in `src/app/globals.css`)
- shadcn/ui component base in `src/components/ui/`

### Backend
- Supabase PostgreSQL + Auth + RLS
- Route handlers in `src/app/api/*`
- Cloudflare Workers deployment via OpenNext

### Feature layering
- `src/features/posts/*`: domain/application/infrastructure/presentation split
- `src/features/topics/*`: trending topics/papers logic
- `src/lib/auth/*`: auth state, status derivation, auth actions, navigation
- `src/lib/supabase/*`: browser/server/admin client factories

## Authentication Flow

Auth states in app:
- `loading`
- `anonymous`
- `authenticated`
- `verified`

Navigation is centralized in `src/lib/auth/context.tsx` via Supabase `onAuthStateChange`:
- `SIGNED_OUT` -> `/`
- `SIGNED_IN` -> `/u/:username` (fallback `/` when profile is unavailable)

## Database

Schema and policies are defined in:
- `supabase/migrations/00000000000000_initial.sql`

Core tables:
- `profiles`
- `posts`
- `comments`
- `votes`

Key behavior:
- RLS enabled across user-generated tables
- trigger-managed `updated_at`
- trigger-managed `comment_count` and `vote_count`

## API Surface (selected)

- `GET /api/posts` list posts with sort/filter
- `POST /api/posts` create post
- `GET /api/posts/[id]` post detail
- `POST /api/posts/[id]/comments` create comment
- `GET /api/comments` list user comments
- `POST /api/votes` cast/update/remove vote
- `GET /api/topics/trending` trending tags
- `GET /api/topics/trending-papers` trending papers
- `GET /api/orcid/callback` ORCID verification callback
- `POST /api/auth/delete-account` delete authenticated user

## Project Structure

```text
src/
  app/                  # Pages and API route handlers
  components/           # UI and feature components
  features/             # Domain-oriented modules (posts, topics)
  lib/                  # Shared types, auth, supabase clients, utils
supabase/
  migrations/           # SQL schema, RLS policies, triggers
wrangler.jsonc          # Cloudflare Worker configuration
open-next.config.ts     # OpenNext Cloudflare adapter config
```

## Environment Variables

### Required (core app)

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Optional (feature-specific)

```bash
# Required only for account deletion endpoint
SUPABASE_SERVICE_ROLE_KEY=...

# Required only for ORCID connect/verification
NEXT_PUBLIC_ORCID_CLIENT_ID=...
ORCID_CLIENT_ID=...
ORCID_CLIENT_SECRET=...

# Optional app URL for deployment/tooling
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Optional GitHub contributor card/repo override in right sidebar
GITHUB_TOKEN=...
GITHUB_REPO_OWNER=...
GITHUB_REPO_NAME=...
```

## Local Development

1. Install dependencies

```bash
npm install
```

2. Start local Supabase (Docker required)

```bash
npx supabase start
```

3. Run app

```bash
npm run dev
```

Default dev URL: [http://localhost:3001](http://localhost:3001)

## Scripts

```bash
npm run dev        # next dev -p 3001
npm run build      # production build
npm run start      # production server
npm run lint       # eslint
npm run test       # vitest run
npm run test:e2e   # playwright
npm run test:all   # unit + e2e
npm run preview    # OpenNext Cloudflare preview
npm run deploy     # OpenNext Cloudflare deploy
```

## Deployment

- Target runtime: Cloudflare Workers
- Adapter: `@opennextjs/cloudflare`
- Build/deploy commands are provided by `npm run preview` and `npm run deploy`

Keep secrets (for example `SUPABASE_SERVICE_ROLE_KEY`, `ORCID_CLIENT_SECRET`, `GITHUB_TOKEN`) out of git and in runtime secret storage.

## Guardrails

- Tailwind v4 is CSS-driven; do not introduce `tailwind.config.ts`
- Treat `src/components/ui/*` as generated shadcn/ui primitives
- Keep dual-identity behavior (`is_anonymous`) intact across new features
- Preserve RLS-first assumptions for all data access changes

## Roadmap (High-Level)

- Bot-driven research digests and curation workflows
- Stronger discovery/search for posts, topics, and profiles
- Expanded reputation and moderation mechanics

## Notes for Agents

Developer/agent operating instructions live in [AGENTS.md](AGENTS.md).
