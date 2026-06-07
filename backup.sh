#!/bin/bash
# Script de backup de la base de datos PostgreSQL

BACKUP_DIR="./backups"
DB_USER="electoral"
DB_NAME="testigos_electorales"
DATE=$(date +%Y_%m_%d_%H_%M)

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Archivo de salida
OUTPUT_FILE="$BACKUP_DIR/backup_${DB_NAME}_${DATE}.sql"

# Realizar el dump usando docker exec (asume que se corre en el host donde está docker)
echo "Iniciando backup de $DB_NAME en $OUTPUT_FILE"
docker exec electoral-postgres pg_dump -U $DB_USER $DB_NAME > $OUTPUT_FILE

if [ $? -eq 0 ]; then
  echo "Backup completado exitosamente: $OUTPUT_FILE"
  # Comprimir el archivo
  gzip $OUTPUT_FILE
  
  # Mantener solo los últimos 30 backups
  echo "Limpiando backups antiguos (manteniendo los últimos 30)..."
  ls -t $BACKUP_DIR/backup_${DB_NAME}_*.sql.gz | tail -n +31 | xargs -r rm --
  echo "Limpieza completada."
else
  echo "Error al realizar el backup."
  rm -f $OUTPUT_FILE
  exit 1
fi
