#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

print_help() {
  cat <<'EOF'
Run deterministic repository verification checks.

Usage:
  bash scripts/verify.sh
  bash scripts/verify.sh --skip-build
  bash scripts/verify.sh --only lint,check

Options:
  --only <list>     Comma-separated subset of: lint,check,build
  --skip-build      Skip the build step
  --help            Show this help text
EOF
}

run_lint=1
run_check=1
run_build=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --only)
      run_lint=0
      run_check=0
      run_build=0
      IFS=',' read -r -a targets <<< "${2:-}"
      for target in "${targets[@]}"; do
        case "$target" in
          lint) run_lint=1 ;;
          check) run_check=1 ;;
          build) run_build=1 ;;
          *)
            echo "❌ Unknown verification target: $target" >&2
            exit 1
            ;;
        esac
      done
      shift 2
      ;;
    --skip-build)
      run_build=0
      shift
      ;;
    --help|-h)
      print_help
      exit 0
      ;;
    *)
      echo "❌ Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

run_step() {
  local label="$1"
  shift

  echo "▶ $label"
  (
    cd "$ROOT_DIR"
    "$@"
  )
  echo "✓ $label"
}

if [[ $run_lint -eq 1 ]]; then
  run_step "repository lint" pnpm lint
fi

if [[ $run_check -eq 1 ]]; then
  run_step "astro check" ./node_modules/.bin/astro check
fi

if [[ $run_build -eq 1 ]]; then
  run_step "astro build" ./node_modules/.bin/astro build
  run_step "standalone pages build" pnpm build:standalone-pages
fi
