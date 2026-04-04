---
name: pr-draft-summary
description: Draft or refine pull request summary content for completed repository work. Use when implementation is ready for delivery and the user needs a concise PR title, summary, issue links, validation notes, risks, or follow-up items before opening or updating a pull request.
---

# PR Draft Summary

Use this skill during delivery preparation after implementation is complete or nearly complete.

## When to use

- The change is ready for pull request drafting or delivery handoff.
- The user needs a PR title, summary, issue linkage, validation notes, or follow-up section.
- The implementation spans more than one commit or file and needs a concise delivery narrative.
- A PR already exists but its description or summary is incomplete.

## Do not use

- Before the parent issue or sub-issue is defined.
- Before implementation sequencing is settled. Use `$implementation-strategy`.
- As a substitute for executed validation. Use `$code-change-verification`.
- For the publish step itself. Use the available GitHub workflow after the summary is ready.

## Workflow

1. Identify the parent issue, sub-issue, and change boundary.
2. Collect deterministic branch and diff context with [collect-pr-context.ts](/Users/a011/proj/code4focus-site/scripts/pr/collect-pr-context.ts) when local checkout data is relevant.
3. Read the delivery structure in [pr-template.md](/Users/a011/proj/code4focus-site/.agents/skills/pr-draft-summary/references/pr-template.md).
4. Read the guard constraints in [guard-boundaries.md](/Users/a011/proj/code4focus-site/.agents/skills/pr-draft-summary/references/guard-boundaries.md) if guard scope or workflow ownership is part of the request.
5. Produce content that fills the delivery sections directly:
   - `Title`
   - `Summary`
   - `Scope`
   - `Validation`
   - `Issue Links`
   - `Risks and Follow-ups`
6. If the user wants the pull request created, hand the prepared content to the configured GitHub workflow instead of mixing summary drafting with publication steps.

## Output requirements

- Keep the title specific to the shipped change.
- Reference the relevant parent issue and sub-issue numbers explicitly.
- Report only validation that actually ran.
- Separate delivered scope from residual risks and deferred follow-up work.
- Keep the summary concise enough to become a PR body without heavy editing.

## Repository-specific rules

- The PR summary is a delivery artifact. It does not replace the issue as the source of truth for problem definition.
- Prefer script-collected branch and diff context over ad hoc commit descriptions when local repository context is available.
- Guard mechanisms remain auxiliary. They must not take ownership of issue creation, strategy drafting, or verification reporting.
