#!/bin/bash

set -e

BACKUP_DIR="backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

docker exec -t church-app-postgres pg_dump -U postgres -Fc auth_db > "$BACKUP_DIR/auth_db.backup"
docker exec -t church-app-postgres pg_dump -U postgres -Fc church_core_db > "$BACKUP_DIR/church_core_db.backup"
docker exec -t church-app-postgres pg_dump -U postgres -Fc document_core_db > "$BACKUP_DIR/document_core_db.backup"

echo "Backups saved to $BACKUP_DIR"
