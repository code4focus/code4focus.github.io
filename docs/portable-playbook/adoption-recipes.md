# Adoption Recipes

## How To Use These Recipes｜如何使用

Treat these recipes as migration bands, not strict maturity levels. A repo can adopt one layer without adopting them all.

## Light Path｜轻量路径

Use this when a repo needs issue-first discipline quickly without investing in custom automation.

### Adopt

- a README that explains identity, capabilities, and one practical next step
- one parent issue template for features/process changes and one bug template
- an explicit rule that non-trivial work starts from a parent issue
- commit messages and handoff notes that reference issue numbers
- a short validation checklist recorded in each issue or PR

### Skip For Now

- branch resolution scripts
- completion comment automation
- commit hooks
- PR summary tooling

### Exit Criteria

- contributors can open the right kind of issue without asking for the format
- reviewers can tell what problem is being solved and how it was validated
- the repo no longer depends on tribal knowledge for non-trivial work intake

## Standard Path｜标准路径

Use this when the repo now has repeated workflow friction and wants predictable task slicing.

### Add On Top Of Light

- a dedicated sub-issue template
- a semantic branch naming rule, preferably tied to the parent issue
- one shared verification entry point reused by local runs and CI
- templated completion or handoff notes that summarize scope, validation, and follow-up

### Recommended Boundaries

- keep guards lightweight and focused on missing issue references or incomplete handoff
- avoid automating workflow steps that still change every week
- prefer repo-local wrapper scripts only after the manual flow has stabilized

## Full Path｜完整路径

Use this when the repo wants a portable playbook that others can copy with minimal guesswork.

### Add On Top Of Standard

- wrapper scripts for parent issue creation, sub-issue creation, branch resolution, and completion
- PR context and merge-readiness helpers
- an explicit source-of-truth model between parent issues, derived docs, and example implementations
- a maintained playbook folder that classifies every workflow convention as `core`, `optional`, or `repo-specific`
- optional trust modules in README such as demos, performance evidence, status signals, and multi-language variants when they are actually maintained

### Watchouts

- do not package unstable local habits as universal rules
- do not let helper scripts outrun the documented workflow
- do not copy repo-specific branch names, deployment assumptions, or agent contracts unchanged

## Suggested Migration Order｜建议迁移顺序

1. Start with the issue vocabulary and validation vocabulary.
2. Add the verification entry point and a stable branch rule.
3. Automate the repeated GitHub and PR operations only after the flow is stable.
4. Add trust-building README modules and language variants only when the repo can keep them current.
