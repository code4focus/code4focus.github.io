---
name: code-change-verification
description: Run and report structured verification for code, configuration, build, or behavior changes in this repository. Use after implementation to decide which checks to run, execute deterministic repository checks, and summarize completed checks, failures, skipped checks, and residual risks.
---

# Code Change Verification

Use this skill after code or configuration changes are in place.

## When to use

- Code changed.
- Configuration changed.
- Build or rendering behavior changed.
- A user asks whether the change was validated.

## Do not use

- For implementation planning before coding. Use `$implementation-strategy`.
- For creating the initial issue record.
- For purely conceptual discussion with no repository changes.

## Workflow

1. Identify the scope of the change.
2. Read the verification structure in [verification-matrix.md](/Users/a011/proj/code4focus-site/.agents/skills/code-change-verification/references/verification-matrix.md).
3. Decide whether the default repository verification script is sufficient or whether narrower checks are justified.
4. Use the shared script [verify.sh](/Users/a011/proj/code4focus-site/scripts/verify.sh) when full repository verification is appropriate.
5. Report results using the standard sections:
   - checks run
   - failures
   - skipped checks
   - residual risks
6. If a required check cannot run, say why and what remains unverified.

## Output requirements

- Name the exact checks that ran.
- Distinguish failed checks from skipped checks.
- Tie residual risks to what was not verified.
- Keep the report factual and concise.

## Repository-specific rules

- Prefer deterministic script-driven checks over ad hoc command sequences.
- Use the shared verification script for repository-wide validation unless a narrower scope is clearly justified.
- Do not claim verification that was not actually executed.
