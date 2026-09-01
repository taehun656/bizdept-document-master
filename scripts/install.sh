#!/usr/bin/env bash
set -euo pipefail

SKILL_NAME="bizdept-document-master"
SOURCE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_BASE="${CODEX_HOME:-${HOME}/.codex}/skills"
INSTALL_DIR="${INSTALL_BASE}/${SKILL_NAME}"

KORDOC_REPOSITORY="https://github.com/taehun656/kordoc.git"
KORDOC_COMMIT="7861d5c4d1cf95b8b70da9b52ce196b9bafa4a2f"
KORDOC_VERSION="4.12.0"
HWPX_REPOSITORY="https://github.com/Canine89/hwpxskill.git"
HWPX_COMMIT="cb5f25b6557b47b0339398d3b5d45a57bdcb4b28"
FLUENT_REPOSITORY="https://github.com/snflkd/fluent-korean.git"
FLUENT_COMMIT="ce8683f0eba8cddb91de4dcd151425ff73e60498"
LXML_VERSION="6.0.1"

for required_command in git node npm python3; do
  if ! command -v "${required_command}" >/dev/null 2>&1; then
    echo "Required command is missing: ${required_command}" >&2
    exit 2
  fi
done

NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
if [[ "${NODE_MAJOR}" -lt 18 ]]; then
  echo "Node.js 18 or newer is required." >&2
  exit 2
fi

if [[ -e "${INSTALL_DIR}" ]]; then
  echo "Installation destination already exists: ${INSTALL_DIR}" >&2
  echo "Move or remove the existing directory before installing again." >&2
  exit 2
fi

STAGING_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/bizdept-document-master.XXXXXX")"
trap 'rm -rf -- "${STAGING_ROOT:?}"' EXIT
STAGING_SKILL="${STAGING_ROOT}/${SKILL_NAME}"
mkdir -p "${STAGING_SKILL}"

tar -C "${SOURCE_ROOT}" \
  --exclude='.git' \
  --exclude='vendor' \
  --exclude='qa' \
  --exclude='outputs' \
  --exclude='.omo' \
  --exclude='.debug-journal.md' \
  -cf - . | tar -C "${STAGING_SKILL}" -xf -
mkdir -p "${STAGING_SKILL}/vendor/kordoc" "${STAGING_SKILL}/vendor/hwpx" "${STAGING_SKILL}/vendor/fluent-korean"

fetch_checkout() {
  local repository="$1"
  local commit="$2"
  local destination="$3"

  git init -q "${destination}"
  git -C "${destination}" remote add origin "${repository}"
  git -C "${destination}" fetch -q --depth 1 origin "${commit}"
  git -C "${destination}" checkout -q --detach FETCH_HEAD
}

KORDOC_CHECKOUT="${STAGING_ROOT}/kordoc"
fetch_checkout "${KORDOC_REPOSITORY}" "${KORDOC_COMMIT}" "${KORDOC_CHECKOUT}"
cp "${KORDOC_CHECKOUT}/LICENSE" "${STAGING_SKILL}/vendor/kordoc/LICENSE"
cp "${KORDOC_CHECKOUT}/NOTICE" "${STAGING_SKILL}/vendor/kordoc/NOTICE"
npm install --prefix "${STAGING_SKILL}/vendor/kordoc/runtime" --omit=dev --ignore-scripts --no-audit --no-fund "kordoc@${KORDOC_VERSION}"

HWPX_CHECKOUT="${STAGING_ROOT}/hwpx"
fetch_checkout "${HWPX_REPOSITORY}" "${HWPX_COMMIT}" "${HWPX_CHECKOUT}"
tar -C "${HWPX_CHECKOUT}" --exclude='.git' -cf - . | tar -C "${STAGING_SKILL}/vendor/hwpx" -xf -
python3 -m pip install --disable-pip-version-check --no-compile --target "${STAGING_SKILL}/vendor/hwpx/.deps" "lxml==${LXML_VERSION}"

FLUENT_CHECKOUT="${STAGING_ROOT}/fluent-korean"
fetch_checkout "${FLUENT_REPOSITORY}" "${FLUENT_COMMIT}" "${FLUENT_CHECKOUT}"
cp "${FLUENT_CHECKOUT}/plugins/fluent-korean/output-styles/fluent-korean.md" "${STAGING_SKILL}/vendor/fluent-korean/fluent-korean.md"
cp "${FLUENT_CHECKOUT}/LICENSE" "${STAGING_SKILL}/vendor/fluent-korean/LICENSE"

chmod +x "${STAGING_SKILL}/scripts/install.sh" "${STAGING_SKILL}/scripts/doctor.sh" "${STAGING_SKILL}/scripts/run-kordoc.sh" "${STAGING_SKILL}/scripts/run-hwpx.sh" "${STAGING_SKILL}/scripts/document-ui/server.mjs"
"${STAGING_SKILL}/scripts/doctor.sh"

mkdir -p "${INSTALL_BASE}"
mv "${STAGING_SKILL}" "${INSTALL_DIR}"

echo "Installed ${SKILL_NAME} at ${INSTALL_DIR}"
echo "The skill will be available in a new Codex turn."
