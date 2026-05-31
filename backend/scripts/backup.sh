#!/usr/bin/env bash
# Backup local ArchiveAI data directories
# Run this periodically or via cron on the VM.

set -euo pipefail

BACKEND_DIR="${BACKEND_DIR:-/opt/archiveai/backend}"
BACKUP_DIR="${BACKUP_DIR:-/opt/archiveai/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS="${RETENTION_DAYS:-7}"

echo "========================================"
echo " ArchiveAI Data Backup"
echo "========================================"

mkdir -p "$BACKUP_DIR"

# Create tar.gz of all local data
echo "[1/3] Archiving local data..."
tar -czf "$BACKUP_DIR/archiveai_data_$TIMESTAMP.tar.gz" \
    -C "$BACKEND_DIR" \
    data/uploads \
    data/markdown \
    data/structures

echo "    Backup created: $BACKUP_DIR/archiveai_data_$TIMESTAMP.tar.gz"

# Show backup size
ls -lh "$BACKUP_DIR/archiveai_data_$TIMESTAMP.tar.gz"

# Clean old backups
echo "[2/3] Cleaning backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "archiveai_data_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# List remaining backups
echo "[3/3] Current backups:"
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "    No backups found."

echo ""
echo " Backup complete."
