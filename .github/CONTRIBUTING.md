# Contributing to Materialist

Thanks for contributing to Materialist.

This project uses Next.js 16 + Supabase + Cloudflare and follows a strict set of architecture guardrails.
Please read this file before opening a pull request.

## Before You Start

1. Search existing issues and discussions to avoid duplicate work.
2. For large features, open an issue first and align on scope.
3. Keep pull requests focused and reviewable.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Prepare local environment:

```bash
cp .env.dev .env.local
npx supabase link --project-ref kshalsrbtvmuqyvbzolf
npx supabase start
```

3. Run the app:

```bash
npm run dev
```

## Development Rules

1. Do not edit generated shadcn files under `src/components/ui/`.
2. Keep Tailwind v4 configuration in `src/app/globals.css`. Do not add `tailwind.config.ts`.
3. Preserve centralized auth navigation behavior in `src/lib/auth/context.tsx`.
4. Keep migrations additive. Do not rewrite applied migration files.
5. Do not run `supabase db push` unless maintainers explicitly ask for it.

## Branch and Commit Guidance

1. Create a topic branch from `main`.
2. Use clear commit messages with one concern per commit when possible.
3. Rebase on latest `main` before requesting review.

## Pull Request Checklist

1. `npm run lint`
2. `npm run test`
3. `npm run build`
4. Include screenshots for UI changes.
5. Include migration notes if SQL schema changed.
6. Add or update tests when behavior changes.
7. Link the issue with `Closes #<id>` when applicable.

## Review Expectations

1. At least one maintainer approval is required.
2. CODEOWNER review is required for protected paths.
3. Maintainers may request splitting large PRs.

## Community Standards

By contributing, you agree to the Code of Conduct in `CODE_OF_CONDUCT.md`.

