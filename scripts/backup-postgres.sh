#!/bin/bash
# Script de backup para PostgreSQL usando Docker

# Configuración
CONTAINER_NAME="logistics-postgres"
DB_USER="produser"
DB_NAME="logistics_prod"
BACKUP_DIR="./backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"

# Nombre del archivo de backup
BACKUP_FILE="${BACKUP_DIR}/postgres_backup_${TIMESTAMP}.sql.gz"

echo "Iniciando backup de PostgreSQL..."
echo "Contenedor: $CONTAINER_NAME"
echo "Base de datos: $DB_NAME"

# Ejecutar backup desde dentro del contenedor Docker
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup completado: $BACKUP_FILE"
    ls -lh "$BACKUP_FILE"
else
    echo "Error: El backup falló"
    echo "Verifica que el contenedor esté corriendo: docker ps"
    exit 1
fi

