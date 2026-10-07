#!/usr/bin/env bash
# Nightly backup of one environment: database (SQL dump) + uploaded photos.
#
#   Usage:  /opt/raspollob/backup.sh production      (or: staging)
#   Output: /opt/raspollob/backups/<env>/<date>/{database.sql.gz,uploads.tar.gz}
#   Keeps:  the last 14 days (change KEEP_DAYS below)
#
# Installed by setup-vps.sh as a daily cron job. Safe to run by hand at any time.
set -euo pipefail

ENVIRONMENT="${1:-production}"
KEEP_DAYS=14
STACK_DIR="/opt/raspollob/${ENVIRONMENT}"
BACKUP_ROOT="/opt/raspollob/backups/${ENVIRONMENT}"
STAMP="$(date +%Y-%m-%d_%H%M)"
TARGET="${BACKUP_ROOT}/${STAMP}"

[ -f "${STACK_DIR}/.env" ] || { echo "No stack at ${STACK_DIR}"; exit 1; }
cd "${STACK_DIR}"
# shellcheck disable=SC1091
set -a; . ./.env; set +a

mkdir -p "${TARGET}"

# 1. Database: a consistent dump while the shop keeps running
docker compose exec -T db pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --no-owner --clean --if-exists \
  | gzip -9 > "${TARGET}/database.sql.gz"

# 2. Photos: the uploads volume of this stack
docker run --rm \
  -v "raspollob-${ENVIRONMENT}_uploads:/data:ro" \
  -v "${TARGET}:/backup" \
  alpine tar czf /backup/uploads.tar.gz -C /data .

# 3. Sanity check: an empty dump means something went wrong
if [ ! -s "${TARGET}/database.sql.gz" ] || [ "$(gzip -cd "${TARGET}/database.sql.gz" | head -c 100 | wc -c)" -lt 50 ]; then
  echo "Backup of ${ENVIRONMENT} looks empty: ${TARGET}" >&2
  exit 1
fi

# 4. Remove backups older than KEEP_DAYS
find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d -mtime +"${KEEP_DAYS}" -exec rm -rf {} +

echo "Backup of ${ENVIRONMENT} saved to ${TARGET} ($(du -sh "${TARGET}" | cut -f1))"
