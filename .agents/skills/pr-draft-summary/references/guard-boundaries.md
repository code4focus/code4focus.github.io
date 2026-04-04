# Guard Boundaries

Guard mechanisms are optional workflow helpers. They are not the primary execution surface for repository process logic.

## Allowed responsibilities

- Remind the session about repository workflow constraints at startup
- Gate obviously destructive commands before execution
- Check that delivery handoff includes issue references and executed validation

## Disallowed responsibilities

- Draft or refine parent issues or bug reports
- Decide issue decomposition or implementation sequencing
- Run verification or interpret unexecuted checks as passed
- Create commits, branches, issues, or pull requests without explicit user intent
- Store the primary record for RFC, bug, or strategy content

## Candidate minimal guard points

1. Session-start reminder for issue-first workflow and required skills
2. Destructive command gate for reset, checkout restore, or removal operations
3. Optional handoff reminder for missing issue references or missing validation notes

## Design rules

- Keep the number of guards minimal
- Give each guard one responsibility
- Prefer warning or approval gates over automatic mutation
- Avoid duplicate logic already owned by a skill or deterministic script
