---
name: implementation-strategy
description: Produce a structured implementation strategy for non-trivial work in this repository before coding begins. Use when an issue affects shared abstractions, build or rendering pipelines, content models, public behavior, configuration, or directory structure, or when the task should be split into ordered phases with explicit risks and validation plans.
---

# Implementation Strategy

Use this skill when the work needs boundary-setting before implementation.

## When to use

- The issue affects shared abstractions, public behavior, configuration, or repository structure.
- The issue touches build, rendering, content, or delivery pipelines.
- The work spans multiple modules or phases.
- The issue is clear enough to exist, but implementation sequencing is still unresolved.

## Do not use

- For creating the initial feature or bug record. Use `$issue-rfc-draft` or `$bug-report-draft`.
- For final validation after code changes. Use `$code-change-verification`.
- For one-file or obviously local edits that do not need staged planning.

## Workflow

1. Read the parent issue and identify the change boundary.
2. Map the affected modules, files, or workflows at a high level.
3. Read the output structure in [strategy-template.md](/Users/a011/proj/code4focus-site/.agents/skills/implementation-strategy/references/strategy-template.md).
4. Produce a strategy that covers:
   - impact surface
   - key path
   - main risks
   - validation plan
   - phased implementation order
5. Keep the strategy actionable but not over-specified. It should guide implementation, not duplicate every code diff in advance.
6. Call out what should become sub-issues if the work is still too broad for one execution task.

## Output requirements

- Separate scope from risks.
- Describe the key path in execution order.
- Make validation explicit instead of implied.
- Identify any sequencing constraints or blockers.
- Avoid mixing final verification results into the strategy. This skill plans validation; it does not report completed validation.

## Repository-specific rules

- Parent issues remain the source of truth for problem definition.
- This skill refines the execution plan; it does not replace the parent issue.
- If a task can be implemented safely without a separate strategy, say so plainly instead of forcing ceremony.
