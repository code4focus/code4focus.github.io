# Repository Workflow

These instructions apply to the entire repository.

## Default Model

- Use an issue-first workflow for all non-trivial work.
- An issue is required before implementation for:
  - new features
  - bugs and regressions
  - architecture or data-model changes
  - public behavior changes
  - build, configuration, deployment, or tooling changes
  - workflow or process changes
- Small wording-only edits or typo fixes with no behavior or configuration impact may proceed without a new issue only when the requested scope is clearly trivial.

## Before Implementation

- If no issue exists for qualifying work, create or refine the issue before editing code.
- If an issue exists but lacks a clear problem statement, goals, constraints, or acceptance criteria, strengthen the issue first.
- Do not use a standalone repository document as the primary record for a new RFC, process change, or bug report when the issue is intended to be the source of truth.
- Use `$issue-rfc-draft` for new features, process changes, design changes, and other parent issues that define non-trivial work before implementation.
- Use `$bug-report-draft` for parent bug issues covering defects, regressions, build failures, rendering problems, or compatibility issues.
- Use the parent-issue templates for feature, process, design, and bug records.
- Use the sub-issue template for concrete execution tasks under a parent issue.

## Parent Issue Responsibilities

- Define the problem, scope, constraints, goals, non-goals, and acceptance criteria.
- Record major design decisions and implementation boundaries.
- Track overall progress, cross-cutting risks, and final completion state.

## Sub-issue Responsibilities

- Represent one concrete task: analysis, implementation, verification, or documentation.
- Stay narrow enough to be completed and reviewed independently.
- Reference the parent issue explicitly.
- Define task-local acceptance criteria and validation steps.

## When To Split Into Sub-issues

- The work spans multiple modules, phases, or dependencies.
- The issue mixes analysis, implementation, and verification concerns.
- Different tasks require different validation paths.
- The work is too large to complete as one reviewable change.

## Handoff Requirements

- Reference the relevant issue and sub-issue numbers.
- Summarize the implemented scope.
- Report the validation that was run and any skipped checks.
- Call out residual risks, follow-up work, or unresolved questions.
