# GitHub Private Collaboration Checklist

Use this when the repository stays private but multiple collaborators are actively contributing.

Checked against GitHub behavior as of 2026-02-13.

## 1. Keep Visibility Private

Path:

`Settings` -> `General` -> `Danger Zone`

Actions:

1. Keep repository visibility as `Private`.
2. Document the decision in project notes so collaborators do not accidentally switch it.

## 2. Add Collaborators with Least Privilege

Path:

`Settings` -> `Collaborators and teams`

Role recommendations:

1. `Read`: observers.
2. `Triage`: issue/discussion triagers.
3. `Write`: day-to-day contributors.
4. `Maintain`: release managers.
5. `Admin`: owner only.

## 3. Protect Main with Rulesets

Path:

`Settings` -> `Rules` -> `Rulesets`

Required protections:

1. PR required for `main`.
2. Minimum one approval.
3. CODEOWNER review required.
4. Required status checks:
   - `CI / validate`
   - `Dependency Review / dependency-review`
   - `CodeQL / Analyze (JavaScript/TypeScript)`
5. Dismiss stale approvals on new commits.
6. Block force pushes and deletions.

## 4. Secure Actions and Secrets

Path:

`Settings` -> `Actions` -> `General`

Set:

1. Allow only GitHub + verified creator actions.
2. Set `GITHUB_TOKEN` default permissions to read-only.
3. Require approval for workflow runs from outside collaborators.
4. Keep environment secrets in GitHub Environments (not repo files).

## 5. Enable Security Scanning

Path:

`Security` tab and `Settings` -> `Security`

Enable:

1. Code scanning.
2. Dependabot alerts.
3. Dependabot security updates.
4. Secret scanning (if available for your plan).

## 6. Use Standard Intake Paths

1. Use issue forms for bug/feature intake.
2. Use pull request template for review hygiene.
3. Route security reports through private advisories.
4. Use Discussions for design and open-ended Q&A.

## 7. Weekly Maintainer Routine

1. Triage `needs-triage` issues.
2. Review Dependabot PRs.
3. Check failing workflows and flaky tests.
4. Review open security alerts.
5. Refresh `good first issue` set for onboarding.

## 8. Future Public Transition

When ready to open source publicly, run:

`docs/github-public-launch-checklist.md`

