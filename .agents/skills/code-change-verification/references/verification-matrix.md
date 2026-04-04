# Verification Matrix

## Default repository checks

Use the shared script for full repository verification:

```bash
bash scripts/verify.sh
```

The default sequence is:

1. `eslint .`
2. `astro check`
3. `astro build`

## Reporting format

Use this structure when reporting verification:

## Checks Run

- `command`: result

## Failures

- None

## Skipped Checks

- `command`: reason

## Residual Risks

- What remains unverified

## Shared script layer

The shared script layer should handle deterministic, repeatable checks only.

Current script:

- `scripts/verify.sh`: repository-wide lint, type and build verification
- `scripts/pr/collect-pr-context.ts`: deterministic branch, commit, file, and diff context for delivery summaries

Candidate future scripts:

- change-scope detection
- issue context collection
