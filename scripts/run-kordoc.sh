#!/usr/bin/env bash
set -euo pipefail

SKILL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KORDOC_BIN="${SKILL_ROOT}/vendor/kordoc/runtime/node_modules/.bin/kordoc"

if [[ ! -x "${KORDOC_BIN}" ]]; then
  echo "kordoc runtime is missing. Re-run scripts/install.sh." >&2
  exit 2
fi

exec "${KORDOC_BIN}" "$@"
