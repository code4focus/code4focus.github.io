# Core Conventions

## Classification Legend｜分类说明

- `core`: the minimum portable baseline for the workflow or repository layer.
- `optional`: useful enhancement modules that many repos can skip at first.
- `repo-specific`: details that should stay local unless another repo has the same constraints.

## README Semantics Layer｜README 语义层

| Practice | Class | Why it is portable | Dependencies and boundaries | Current repo cue |
| --- | --- | --- | --- | --- |
| Clear value statement plus project identity | `core` | Every repo homepage needs to explain what the project is and why it matters in one screen. | The exact tone, visuals, and product framing can vary. | Intro paragraph in `README.md` and `assets/docs/README.zh.md` |
| Capability summary that tells readers what they can do with the repo | `core` | Replaces feature hunting with an explicit scope statement. | The section can be features, use cases, or supported scenarios depending on repo type. | `Features` / `特征` |
| Practical entry points such as demo, quickstart, deployment, or docs | `core` | Readers need a next action after trust is established. | A live demo is not mandatory for every repo, but at least one usage or evaluation path is. | `Demo`, `Getting Started`, deploy badges |
| Environment and deployment assumptions | `core` | Repos need to explain canonical URLs, env vars, and operational expectations. | Keep only assumptions that affect real usage or deployment. | `Environment` |
| Performance or quality proof modules | `optional` | Useful when the repo makes claims about speed, quality, or production readiness. | Only include objective evidence the repo can maintain over time. | `Performance` |
| Status and trend signals such as build badges or star history | `optional` | Helpful for trust-building when signals stay current. | Avoid vanity sections that are not tied to a decision or trust signal. | `Star History`; future build badges can fit here |
| Multi-language README variants | `optional` | Useful for communities that actively maintain more than one audience path. | Only portable when translation upkeep is realistic. | English and Chinese README variants |
| Theme-specific cover images and one-click deploy badges | `repo-specific` | They fit template distribution here, but should not be treated as a universal baseline. | Copy only when the target repo is also a template-like product. | Top hero images and Netlify/Vercel badges |

## Issue-Driven Flow Layer｜Issue-Driven 流程层

| Practice | Class | Why it is portable | Dependencies and boundaries | Current repo cue |
| --- | --- | --- | --- | --- |
| Require a parent issue before non-trivial implementation | `core` | Keeps problem definition, goals, and scope visible before code changes begin. | Trivial wording-only edits can stay outside the full issue flow. | `AGENTS.md`; parent issue templates |
| Separate parent issue responsibility from sub-issue execution | `core` | Prevents planning, implementation, and verification from collapsing into one unreviewable task. | Small repos may use fewer sub-issues, but the responsibility split should remain. | Parent and sub-issue templates; issue [#43](https://github.com/code4focus/code4focus.github.io/issues/43) and sub-issue [#46](https://github.com/code4focus/code4focus.github.io/issues/46) |
| Define explicit acceptance criteria and validation for every execution task | `core` | Makes completion testable instead of narrative-only. | Validation can be manual or automated, but it must be named explicitly. | `Acceptance Criteria` and `Validation` sections in templates |
| Record issue references in commits and handoff summaries | `core` | Keeps code history connected to the decision record. | Merge and revert commits can stay exempt. | Commit policy in `AGENTS.md`; commit-msg hook |
| Keep a reusable branch line per parent issue | `optional` | Helpful when one parent issue spans multiple sub-issues or PRs. | Repos with one-PR tasks may choose simpler per-task branches. | `user/issue-<n>-<slug>` branch naming |
| Use completion comments to close the loop on scope and validation | `optional` | Helps reviewers and future maintainers see what was actually delivered. | Can start as a manual checklist before adding automation. | `complete-issue` and `issue-comment` helpers |
| Route all GitHub issue operations through repo-local helpers first | `repo-specific` | The preference order improves consistency here, but other repos may prefer direct `gh` or another toolchain. | Keep the convention only if the repo maintains its own wrappers. | `AGENTS.md` workflow order: repo scripts, then `gh`, then MCP |

## Engineering Facilities Layer｜工程设施层

| Practice | Class | Why it is portable | Dependencies and boundaries | Current repo cue |
| --- | --- | --- | --- | --- |
| Standard issue templates for parent issue, bug, and sub-issue | `core` | Templates encode the minimum planning vocabulary of the workflow. | Templates should stay short enough that people will actually use them. | `.github/ISSUE_TEMPLATE/*` |
| Single repository verification entry point reused locally and in CI | `core` | One deterministic check command reduces drift between local and CI verification. | The command can wrap lint, tests, type checks, or builds based on repo needs. | `scripts/verify.sh`; `pnpm verify:repo`; `.github/workflows/verify.yml` |
| Scripted helpers for issue creation, branch resolution, and completion | `optional` | Useful once the workflow is stable enough to automate repeatedly. | Premature automation can hard-code a workflow that is still moving. | `create-parent-issue`, `create-sub-issue`, `issue-branch`, `complete-issue` |
| Commit-message guard for issue references | `optional` | Lightweight enforcement helps the rule stick without heavy process overhead. | The guard should remain narrow and easy to bypass for exempt commit types. | `scripts/git-hooks/check-commit-msg.mjs` |
| PR context and merge-readiness helpers | `optional` | Useful for larger repos that want deterministic PR summaries and delivery checks. | Skip until the repo has enough PR volume or handoff complexity to justify it. | `pr-context`, `current-pr`, `pr-open`, `pr-update`, `merge-readiness` |
| Codex-specific operating rules in `AGENTS.md` | `repo-specific` | Helpful here because the repo is actively maintained with Codex collaboration. | Other repos may need a different agent contract or none at all. | `AGENTS.md` |
| `main` as the stable integration branch | `repo-specific` | The repository should expose one predictable integration branch, but the exact branch name still depends on local workflow choices. | Reuse the convention when it fits; otherwise rename it to the repo's own stable branch line. | `main` |
