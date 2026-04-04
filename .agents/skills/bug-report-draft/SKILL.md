---
name: bug-report-draft
description: Draft or refine a parent bug issue for a defect, regression, compatibility problem, build failure, or rendering problem in this repository. Use when bug work needs a structured issue-first record before implementation, or when an existing bug issue is missing reproduction steps, impact, acceptance criteria, or planned sub-issues.
---

# Bug Report Draft

Use this skill for parent bug issues before fix implementation begins.

## When to use

- A defect or regression does not yet have a parent bug issue.
- A rendering, build, compatibility, or workflow failure needs a structured bug record.
- An existing bug issue is incomplete and must be strengthened before debugging or implementation.

## Do not use

- For new feature or design proposals. Use `$issue-rfc-draft`.
- For one concrete fix task under an existing parent issue. Use the sub-issue template instead.
- For root-cause analysis or implementation strategy after the parent bug issue is already well-defined.

## Workflow

1. Read the user request and confirm that the task is a defect or regression record.
2. If a parent bug issue already exists, strengthen it instead of creating a duplicate.
3. Read the repository template at [bug_report.md](/Users/a011/proj/code4focus-site/.github/ISSUE_TEMPLATE/bug_report.md).
4. Produce content that fills the template sections directly:
   - `Summary`
   - `Problem Statement`
   - `Reproduction`
   - `Expected Behavior`
   - `Actual Behavior`
   - `Impact and Scope`
   - `Suspected Area`
   - `Acceptance Criteria`
   - `Planned Sub-issues`
5. Keep the bug issue focused on problem definition, impact, and verification boundaries. Do not prematurely embed a full fix plan unless the user explicitly asks for it.
6. If the user wants the issue created, use the configured GitHub workflow. Otherwise provide a ready-to-submit draft.

## Output requirements

- Make reproduction steps concrete and ordered.
- Separate expected behavior from actual behavior.
- Include scope and severity where known.
- Write acceptance criteria as observable outcomes.
- Suggest sub-issues when the work should be split into analysis, fix implementation, and regression verification.
- Keep suspected areas tentative unless backed by evidence.

## Repository-specific rules

- The parent bug issue is the source of truth for the problem record.
- Do not move the primary bug record into a standalone repository document.
- If the report is too vague to support implementation, ask for the missing reproduction or scope details instead of guessing.
