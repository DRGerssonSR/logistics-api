#!/bin/bash
# Script que ejecuta backups de todas las bases de datos

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "Iniciando backups de todas las bases de datos"
echo "=========================================="
echo ""

# Backup de PostgreSQL
echo "1. Backup de PostgreSQL..."
bash "$SCRIPT_DIR/backup-postgres.sh"

if [ $? -eq 0 ]; then
    echo "✓ PostgreSQL backup OK"
else
    echo "✗ PostgreSQL backup FALLÓ"
fi

echo ""

# Backup de MongoDB
echo "2. Backup de MongoDB..."
bash "$SCRIPT_DIR/backup-mongo.sh"

if [ $? -eq 0 ]; then
    echo "✓ MongoDB backup OK"
else
    echo "✗ MongoDB backup FALLÓ"
fi

echo ""
echo "=========================================="
echo "Backups completados"
echo "=========================================="

