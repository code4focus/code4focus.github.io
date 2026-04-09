# Reference Implementation

## README Semantics Layer｜README 语义层

| Convention | Current files | What the current repo demonstrates |
| --- | --- | --- |
| Value statement and visual first impression | `README.md`, `assets/docs/README.zh.md` | The repo opens with a concise identity statement, paired screenshots, and an immediate language switch. |
| Capability summary | `README.md`, `assets/docs/README.zh.md` | Feature bullets establish what the theme supports before a reader installs it. |
| Evaluation and activation paths | `README.md`, `assets/docs/README.zh.md` | Demo links, getting-started steps, deployment guides, and deploy badges reduce the gap between discovery and first use. |
| Operational assumptions | `README.md`, `.env.example` | The repo documents canonical URL handling and the required environment variable name. |
| Trust and status signals | `README.md`, `assets/docs/README.zh.md` | The current implementation uses PageSpeed proof and Star History rather than a long badge wall. |

## Issue-Driven Flow Layer｜Issue-Driven 流程层

| Convention | Current files | What the current repo demonstrates |
| --- | --- | --- |
| Parent issue planning vocabulary | `.github/ISSUE_TEMPLATE/feature_request.md`, `.github/ISSUE_TEMPLATE/bug_report.md` | Feature/RFC and bug records carry explicit problem, constraints, acceptance criteria, and planned sub-issues. |
| Sub-issue execution vocabulary | `.github/ISSUE_TEMPLATE/task_sub_issue.md`, `scripts/issues/create-sub-issue.ts` | Concrete tasks capture scope, dependencies, validation, and a parent link. |
| No blank issue path | `.github/ISSUE_TEMPLATE/config.yml` | New work is nudged into typed issue records instead of ad-hoc free-form issues. |
| Parent-first branch resolution | `scripts/issues/use-issue-branch.ts` | A sub-issue can resolve to its parent branch line, which keeps related work on one semantic track. |
| Completion loop | `scripts/issues/complete-issue.ts`, `scripts/github/issue-comment.ts` | Closing an issue can be paired with a templated summary of scope, validation, and notes. |

## Engineering Facilities Layer｜工程设施层

| Convention | Current files | What the current repo demonstrates |
| --- | --- | --- |
| Repo-local issue creation helpers | `scripts/issues/create-parent-issue.ts`, `scripts/issues/create-sub-issue.ts`, `package.json` | The repo exposes repeatable issue creation through `pnpm` scripts instead of relying on manual template copy-paste. |
| Commit reference guard | `scripts/git-hooks/check-commit-msg.mjs`, `package.json` | Commit messages are checked for issue references before they land. |
| Deterministic verification entry point | `scripts/verify.sh`, `.github/workflows/verify.yml`, `package.json` | Local and CI verification share the same lint/check/build command entry point. |
| PR drafting and readiness helpers | `scripts/pr/collect-pr-context.ts`, `scripts/github/current-pr.ts`, `scripts/github/pr-open.ts`, `scripts/github/pr-update.ts`, `scripts/github/merge-readiness.ts` | PR state, context, and merge readiness are treated as structured workflow data rather than informal notes. |
| Agent-facing workflow contract | `AGENTS.md` | The repo spells out issue-first rules, branch-line expectations, validation, and handoff requirements for automated collaborators. |

## Sync Rules｜同步规则

Use this reference implementation file when a portable convention changes locally:

1. Update the concrete file path or command here.
2. Re-check whether the convention should still be classified as `core`, `optional`, or `repo-specific`.
3. If the implementation change also changes adopter expectations, update `adoption-recipes.md` in the same branch.
