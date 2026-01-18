# Scripts de Backup

Scripts simples para hacer backups de las bases de datos PostgreSQL y MongoDB.

## Scripts Disponibles

### `backup-postgres.sh`
Hace backup de PostgreSQL y lo comprime en formato `.sql.gz`.

### `backup-mongo.sh`
Hace backup de MongoDB y lo comprime en formato `.tar.gz`.

### `backup-all.sh`
Ejecuta ambos backups (PostgreSQL y MongoDB).

## Uso

### Hacer backup de PostgreSQL
```bash
bash scripts/backup-postgres.sh
```

### Hacer backup de MongoDB
```bash
bash scripts/backup-mongo.sh
```

### Hacer backup de todo
```bash
bash scripts/backup-all.sh
```

### Configurar backups automáticos (Cron)
```bash
bash scripts/setup-cron.sh
```

Esto configurará backups automáticos diarios a las 2:00 AM.

**Nota:** Solo funciona en Linux/Mac.

## Cómo Probar

### 1. Asegúrate de que Docker esté corriendo
```bash
docker compose --env-file .env.docker ps
```

### 2. Ejecuta el script (desde Git Bash)
```bash
bash scripts/backup-postgres.sh
```

### 3. Verifica que se creó el archivo
```bash
ls -lh backups/postgres/
```

Deberías ver un archivo como: `postgres_backup_20240101_020000.sql.gz`

