#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -lt 1 ]]; then
  echo "Usage: run-hwpx.sh <script.py> [arguments...]" >&2
  exit 2
fi

SKILL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HWPX_ROOT="${SKILL_ROOT}/vendor/hwpx"
SCRIPT_NAME="$1"
shift

if [[ "${SCRIPT_NAME}" == *".."* || "${SCRIPT_NAME}" != *.py ]]; then
  echo "Invalid HWPX script path: ${SCRIPT_NAME}" >&2
  exit 2
fi

TARGET="${HWPX_ROOT}/scripts/${SCRIPT_NAME}"
if [[ ! -f "${TARGET}" ]]; then
  echo "Unknown HWPX script: ${SCRIPT_NAME}" >&2
  exit 2
fi

export PYTHONPATH="${HWPX_ROOT}/.deps${PYTHONPATH:+:${PYTHONPATH}}"
exec python3 "${TARGET}" "$@"
