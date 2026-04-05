---
name: issue-rfc-draft
description: Draft or refine a parent issue for a new feature, process change, architecture change, or design proposal in this repository. Use when non-trivial work needs an issue-first record before implementation, or when an existing parent issue is missing goals, constraints, non-goals, acceptance criteria, or planned sub-issues.
---

# Issue RFC Draft

Use this skill for parent issues that define new work before implementation.

## When to use

- A non-trivial feature does not yet have a parent issue.
- A process or workflow change needs a repository issue record.
- An architecture, data-model, rendering-pipeline, or public-behavior change needs a scoped issue.
- An existing parent issue is incomplete and needs to be strengthened before implementation.

## Do not use

- For bug or regression records. Use `$bug-report-draft`.
- For concrete execution tasks under a parent issue. Use the sub-issue template instead.
- For implementation planning after the parent issue is already clear. That belongs in a separate strategy task.

## Workflow

1. Read the user request and determine whether the work belongs in a parent issue.
2. If an issue already exists, strengthen that issue instead of creating a duplicate.
3. Read the repository template at [feature_request.md](/Users/a011/proj/code4focus-site/.github/ISSUE_TEMPLATE/feature_request.md).
4. Produce content that fills the template sections directly:
   - `Summary`
   - `Problem Statement`
   - `Goals`
   - `Non-Goals`
   - `Constraints`
   - `Proposed Direction`
   - `Acceptance Criteria`
   - `Planned Sub-issues`
5. Keep implementation details high-level. Concrete tasks should be split into sub-issues, not embedded in the parent issue body.
6. If the user wants the issue created, use the configured GitHub workflow.
   - In this repository, prefer `pnpm create-parent-issue --kind feature --title ... --body-file ...`.
   - If the parent issue body has already been drafted, write that content to a temporary file and pass it via `--body-file`.
   - If the repository script does not cover the needed operation, fall back to `gh`.
   - Use GitHub MCP only for gaps or for structured GitHub reads.
7. Otherwise provide a ready-to-submit draft.

## Output requirements

- State the problem and motivation clearly.
- Separate goals from non-goals.
- Include constraints and scope boundaries.
- Write acceptance criteria as checkable bullets.
- Include a first-pass sub-issue split when the work spans multiple modules, phases, or validation paths.
- Avoid fix-level or file-level implementation details unless they are required to define scope.

## Repository-specific rules

- The parent issue is the source of truth for the work definition.
- Do not move the primary RFC record into a standalone repository document.
- If the task is too small to justify a parent issue, say so explicitly instead of forcing one.
