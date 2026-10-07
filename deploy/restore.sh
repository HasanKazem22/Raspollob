#!/usr/bin/env bash
# Restores one environment from a backup made by backup.sh.
#
#   Usage:  /opt/raspollob/restore.sh production 2026-10-07_0330
#           (list available backups: ls /opt/raspollob/backups/production)
#
# REPLACES the current database and photos of that environment with the backup.
set -euo pipefail

ENVIRONMENT="${1:-}"
STAMP="${2:-}"
if [ -z "${ENVIRONMENT}" ] || [ -z "${STAMP}" ]; then
  echo "Usage: $0 <production|staging> <backup-folder-name>"
  echo "Available backups:"; ls -1 "/opt/raspollob/backups/${ENVIRONMENT:-production}" 2>/dev/null || true
  exit 1
fi

STACK_DIR="/opt/raspollob/${ENVIRONMENT}"
SOURCE="/opt/raspollob/backups/${ENVIRONMENT}/${STAMP}"
[ -f "${SOURCE}/database.sql.gz" ] || { echo "No backup at ${SOURCE}"; exit 1; }

echo "This replaces ALL data of '${ENVIRONMENT}' with the backup from ${STAMP}."
read -r -p "Type the environment name to continue: " CONFIRM
[ "${CONFIRM}" = "${ENVIRONMENT}" ] || { echo "Cancelled."; exit 1; }

cd "${STACK_DIR}"
# shellcheck disable=SC1091
set -a; . ./.env; set +a

# Stop the app so nothing writes during the restore (the database keeps running)
docker compose stop server gui

gzip -cd "${SOURCE}/database.sql.gz" | docker compose exec -T db psql -q -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"

if [ -f "${SOURCE}/uploads.tar.gz" ]; then
  docker run --rm \
    -v "raspollob-${ENVIRONMENT}_uploads:/data" \
    -v "${SOURCE}:/backup:ro" \
    alpine sh -c "rm -rf /data/* && tar xzf /backup/uploads.tar.gz -C /data"
fi

docker compose start server gui
echo "Restored ${ENVIRONMENT} from ${STAMP}."
