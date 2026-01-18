#!/bin/bash
# Script de backup para MongoDB usando Docker

# Configuración
CONTAINER_NAME="logistics-mongodb"
MONGO_DB="logistics_tracking_prod"
BACKUP_DIR="./backups/mongo"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"

# Nombre del archivo de backup
BACKUP_FILE="${BACKUP_DIR}/mongo_backup_${TIMESTAMP}"

echo "Iniciando backup de MongoDB..."
echo "Contenedor: $CONTAINER_NAME"
echo "Base de datos: $MONGO_DB"

# Ejecutar backup desde dentro del contenedor Docker
docker exec "$CONTAINER_NAME" mongodump --db "$MONGO_DB" --out /tmp/mongo_backup

if [ $? -eq 0 ]; then
    # Copiar backup del contenedor al host
    docker cp "${CONTAINER_NAME}:/tmp/mongo_backup/${MONGO_DB}" "$BACKUP_FILE"
    
    # Limpiar backup temporal del contenedor
    docker exec "$CONTAINER_NAME" rm -rf /tmp/mongo_backup
    
    # Comprimir el backup
    tar -czf "${BACKUP_FILE}.tar.gz" -C "$BACKUP_DIR" "mongo_backup_${TIMESTAMP}"
    rm -rf "$BACKUP_FILE"
    
    echo "Backup completado: ${BACKUP_FILE}.tar.gz"
    ls -lh "${BACKUP_FILE}.tar.gz"
else
    echo "Error: El backup falló"
    echo "Verifica que el contenedor esté corriendo: docker ps"
    exit 1
fi

