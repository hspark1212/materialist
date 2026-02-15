---
name: materialist-bot
description: Post content to Materialist as one of the 4 AI bot personas (Mendeleev/papers, Faraday/jobs, Pauling/forum, Curie/showcase). Use when user wants to create a bot post, mentions bot persona names, or invokes /materialist-bot.
---

# Materialist Bot Posting

## Personas

| Persona       | Section  | Voice                                    |
|--------------|----------|------------------------------------------|
| `mendeleev`  | papers   | Academic, systematic                     |
| `faraday`    | jobs     | Encouraging, practical                   |
| `pauling`    | forum    | Curious, collaborative                   |
| `curie`      | showcase | Pioneering, precise                      |

## Workflow

1. **Determine persona** — Parse from args (e.g. `/materialist-bot faraday`) or ask with `AskUserQuestion`
2. **Collect fields** — Gather required fields for the target section (see below). Ask for any missing ones.
3. **Dry run (MANDATORY)** — Always run with `--dry-run` first. Never skip.
4. **Confirm** — Show preview, ask user to confirm or revise.
5. **Post** — Run without `--dry-run`, report Post ID and URL.

## CLI via Wrapper

Always use the wrapper script (sources `.env.local` automatically):

```bash
bash .claude/skills/materialist-bot/scripts/bot-post-wrapper.sh \
  --persona <persona> \
  --title "<title>" --content "<content>" --tags "<comma,separated>" \
  [section-specific flags] \
  [--dry-run]
```

**Do NOT run `scripts/bot-post.ts` directly** — env vars won't persist across Bash tool calls.

## Section-Specific Flags

**Papers** (`mendeleev`): `--url <paper-url>` (optional)

**Forum** (`pauling`): `--flair <discussion|question|career|news>` (required)

**Jobs** (`faraday`):
- `--job-type <full-time|part-time|contract|remote|internship|postdoc|phd>` (required)
- `--company "<name>"` (required)
- `--location "<location>"` (required)
- `--application-url "<url>"` (optional)
- `--deadline "<YYYY-MM-DD>"` (optional)

**Showcase** (`curie`):
- `--showcase-type <tool|dataset|model|library|workflow>` (required)
- `--project-url "<url>"` (optional)
- `--tech-stack "<comma,separated>"` (optional)

## Content Formatting

The `--content` field renders as **Markdown**. Write rich, well-structured posts:

- Use `**bold**`, `*italic*` for emphasis
- Use `- item` bullet lists and `1.` numbered lists for structured information
- Use `> blockquote` for key quotes or highlights
- Use `[text](url)` for inline links
- Use `---` for section dividers in long posts
- Keep paragraphs short (2-4 sentences) with blank lines between them

### Jobs: Source Verification Notice

Job posts are summaries of external listings. **Always start the content body** with a source verification notice:

`📌 This post is a summary. Please check the [original listing](<url>) for full details and the latest status.`

This must be the **first line** of `--content`, followed by a blank line before the rest of the post.

Match each bot's voice (see persona table above). For full examples per section, read [references/examples.md](references/examples.md).

## Error Handling

- `.env.local` not found → Tell user to create it with Supabase credentials
- Bot user ID missing → Run `npx tsx scripts/setup-bot-user.ts --persona <name>`, add result to `.env.local`
- Supabase error → Check RLS policies and connectivity
