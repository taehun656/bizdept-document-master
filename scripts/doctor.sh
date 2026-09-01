#!/usr/bin/env bash
set -euo pipefail

SKILL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

required_files=(
  "${SKILL_ROOT}/SKILL.md"
  "${SKILL_ROOT}/references/upstream-lock.json"
  "${SKILL_ROOT}/vendor/kordoc/SKILL.md"
  "${SKILL_ROOT}/vendor/kordoc/runtime/node_modules/.bin/kordoc"
  "${SKILL_ROOT}/vendor/hwpx/SKILL.md"
  "${SKILL_ROOT}/vendor/hwpx/scripts/validate.py"
  "${SKILL_ROOT}/vendor/hwpx/.deps/lxml"
  "${SKILL_ROOT}/vendor/fluent-korean/fluent-korean.md"
)

for required_file in "${required_files[@]}"; do
  if [[ ! -e "${required_file}" ]]; then
    echo "Missing integrated component: ${required_file}" >&2
    exit 2
  fi
done

"${SKILL_ROOT}/scripts/run-kordoc.sh" --version >/dev/null
"${SKILL_ROOT}/scripts/run-hwpx.sh" validate.py --help >/dev/null

PYTHONPATH="${SKILL_ROOT}/vendor/hwpx/.deps" python3 -c "import lxml; print('lxml ' + lxml.__version__)"
echo "PASS: bizdept-document-master is ready"
