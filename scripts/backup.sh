#!/bin/bash
set -e

# Database backup script for Shifoxona CRM
# Usage: ./scripts/backup.sh [output_dir]

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="${DB_NAME:-shifoxona_db}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

echo "=== Shifoxona CRM Database Backup ==="
echo "Database: $DB_NAME@$DB_HOST:$DB_PORT"
echo "Output: $BACKUP_DIR"
echo "Started: $(date)"
echo ""

# Dump database
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"
echo "Creating backup: $BACKUP_FILE"
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-acl \
  --verbose \
  | gzip > "$BACKUP_FILE"

echo ""
echo "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"

# Create symlink to latest
ln -sf "$BACKUP_FILE" "$BACKUP_DIR/latest.sql.gz"

# Clean old backups
echo ""
echo "Cleaning backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "Remaining backups:"
ls -lh "$BACKUP_DIR/"*.sql.gz 2>/dev/null | awk '{print "  " $5 " " $9}'

echo ""
echo "=== Backup completed: $(date) ==="
