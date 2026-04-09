# Portable Repository Playbook

## Purpose｜目的

This folder captures the first portable baseline extracted from this repository for issue [#43](https://github.com/code4focus/code4focus.github.io/issues/43) and implementation task [#46](https://github.com/code4focus/code4focus.github.io/issues/46).

The goal is not to freeze every local detail. The goal is to separate:

- `core conventions`: the minimum workflow and repository semantics worth carrying to other projects.
- `optional extensions`: useful modules that improve trust, automation, or ergonomics, but are not required everywhere.
- `repo-specific implementation`: choices that work here today but should not be copied blindly.

## Source Of Truth｜事实来源

- Parent issue [#43](https://github.com/code4focus/code4focus.github.io/issues/43) remains the source of truth for the problem statement, goals, constraints, and acceptance criteria of this direction.
- This folder is a derived playbook that stabilizes the current inventory, classification, and adoption guidance.
- Concrete execution should still happen through sub-issues such as [#46](https://github.com/code4focus/code4focus.github.io/issues/46), not by expanding the parent issue indefinitely.

When a repository practice changes, update the parent issue and this playbook together using the following rule:

1. Decide whether the changed practice is `core`, `optional`, or `repo-specific`.
2. Update the relevant reference implementation link if the concrete file or script changed.
3. Record whether adopters would face a breaking workflow change or only a local implementation change.

## Document Map｜文档结构

- [Core Conventions](core-conventions.md): the portable inventory across README semantics, issue-driven flow, and engineering facilities.
- [Reference Implementation](reference-implementation.md): where this repository currently implements each convention.
- [Adoption Recipes](adoption-recipes.md): light, standard, and full migration paths for other repositories.

## First-Round Boundary｜首轮边界

This first round intentionally focuses on documentation and classification:

- in scope: inventory, classification, source-of-truth rules, and adoption paths
- out of scope: extracting a standalone package or CLI, rewriting existing workflow scripts, or forcing external repositories to adopt this exact structure
