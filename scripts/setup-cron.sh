#!/bin/bash
# Script para configurar cron jobs automáticos de backup

# Verificar si crontab está disponible
if ! command -v crontab &> /dev/null; then
    echo "crontab no está disponible en este sistema."
    echo ""
    echo "Este script solo funciona en Linux/Mac."
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-all.sh"

echo "Configurando backups automáticos diarios a las 2:00 AM..."
echo ""

# Entrada de cron (backup diario a las 2 AM)
CRON_ENTRY="0 2 * * * bash $BACKUP_SCRIPT"

# Agregar entrada al crontab
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

if [ $? -eq 0 ]; then
    echo "✓ Cron job configurado exitosamente"
    echo ""
    echo "Para ver tus cron jobs: crontab -l"
    echo "Para eliminar: crontab -e (y borra la línea)"
else
    echo "✗ Error al configurar cron job"
    exit 1
fi

