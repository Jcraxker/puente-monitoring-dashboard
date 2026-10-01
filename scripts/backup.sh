#!/bin/sh
# Respaldo diario de la base (pg_dump con fecha). Configurar en cron del host.
# Daily DB backup. Add to host crontab.
set -eu
cd "$(dirname "$0")/.."
STAMP=$(date +%F_%H%M)
mkdir -p backups
docker compose exec -T db pg_dump -U "${POSTGRES_USER:-puente}" "${POSTGRES_DB:-puente}" | gzip > "backups/puente_${STAMP}.sql.gz"
echo "backup: backups/puente_${STAMP}.sql.gz"
