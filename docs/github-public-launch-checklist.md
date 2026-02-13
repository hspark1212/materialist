# GitHub Public Launch Checklist

This checklist captures the repository settings that must be configured in GitHub UI after switching the repo to public.

Checked against GitHub behavior as of 2026-02-13.

## 1. Make Repository Public

Path:

`Settings` -> `General` -> `Danger Zone` -> `Change repository visibility`

Actions:

1. Confirm no secrets are committed in current branch and history.
2. Switch to `Public`.
3. Re-check rulesets immediately after visibility change.

## 2. Branch Protection with Rulesets

Path:

`Settings` -> `Rules` -> `Rulesets`

Create a ruleset for `main`:

1. Require a pull request before merging.
2. Require at least 1 approving review.
3. Require CODEOWNER review.
4. Require conversation resolution before merge.
5. Require status checks to pass.
6. Disable direct pushes to `main` for non-admin roles.
7. Require linear history (optional, recommended).

Required checks to add:

1. `CI / validate`
2. `Dependency Review / dependency-review`
3. `CodeQL / Analyze (JavaScript/TypeScript)`

## 3. Enable Merge Queue

Path:

`Settings` -> `General` -> `Pull Requests` -> `Merge queue`

Actions:

1. Enable merge queue for `main`.
2. Keep auto-merge enabled for maintainers.
3. Keep squash merge enabled as default.

## 4. Security Features

Path:

`Security` tab and `Settings` -> `Security`

Enable:

1. Code scanning (default setup or keep workflow-based CodeQL).
2. Secret scanning.
3. Push protection for secrets.
4. Dependabot alerts.
5. Dependabot security updates.

## 5. Actions Security Controls

Path:

`Settings` -> `Actions` -> `General`

Set:

1. Allow actions from GitHub and verified creators.
2. Require approval for all outside collaborator workflow runs.
3. Keep `GITHUB_TOKEN` default permissions read-only.
4. Keep "Allow GitHub Actions to create and approve pull requests" disabled unless required.

## 6. Collaboration Roles

Path:

`Settings` -> `Collaborators and teams`

Recommended baseline:

1. `Read` for observers.
2. `Triage` for issue/discussion moderators.
3. `Write` for regular contributors.
4. `Maintain` for trusted maintainers.
5. `Admin` only for repository owners.

## 7. Community and Intake

Path:

`Settings` -> `General` and `Insights` -> `Community Standards`

Actions:

1. Enable Discussions.
2. Confirm `.github` templates are detected.
3. Pin `CONTRIBUTING.md` in README.
4. Add labels:
   - `kind/bug`
   - `kind/feature`
   - `kind/chore`
   - `needs-triage`
   - `good first issue`
   - `help wanted`
   - `area/papers`
   - `area/forum`
   - `area/showcase`
   - `area/jobs`

## 8. Project Operations

Path:

`Projects` (new project experience)

Actions:

1. Create one project board for roadmap + backlog.
2. Add fields:
   - `Status`
   - `Priority`
   - `Area`
   - `Size`
   - `Owner`
3. Add auto-add workflow for new issues and PRs.

## 9. Release and Maintenance Rhythm

1. Define release cadence (weekly or bi-weekly).
2. Tag releases and publish release notes.
3. Keep Dependabot PRs reviewed weekly.
4. Review open security alerts weekly.

