#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Iniciando Backend Ferretería"
echo "=========================================="

# Esperar a que PostgreSQL esté disponible (30 reintentos = 60 segundos)
echo "⏳ Esperando PostgreSQL en $DB_HOST:$DB_PORT..."
MAX_RETRIES=30
RETRY_COUNT=0

until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ ERROR: No se pudo conectar a PostgreSQL después de $MAX_RETRIES intentos"
    echo "   Verifique que el contenedor de base de datos esté corriendo"
    echo "   Comando de diagnóstico: docker-compose logs db"
    exit 1
  fi
  
  echo "   Intento $RETRY_COUNT/$MAX_RETRIES - PostgreSQL no disponible, reintentando en 2 segundos..."
  sleep 2
done
echo "✅ PostgreSQL conectado exitosamente"

# Ejecutar migraciones con verificación completa
echo "🔧 Ejecutando migraciones de base de datos..."

# Primero, verificar si hay migraciones fake (registradas pero no aplicadas)
# Esto soluciona el problema de migraciones huérfanas
python manage.py shell <<MIGRATE_CHECK
from django.db import connection
from django.core.management import call_command

# Verificar si la tabla inventario_cliente existe y tiene todas las columnas
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'inventario_cliente'")
        columns = [row[0] for row in cursor.fetchall()]
        
        required_columns = ['fecha_actualizacion', 'total_compras', 'monto_total_compras']
        missing = [col for col in required_columns if col not in columns]
        
        if missing and columns:  # Tabla existe pero incompleta
            print(f"⚠️ Tabla inventario_cliente incompleta, recreando...")
            cursor.execute("DROP TABLE IF EXISTS inventario_cliente CASCADE")
            # Limpiar registro de migración para forzar re-ejecución
            cursor.execute("DELETE FROM django_migrations WHERE name LIKE '%cliente%'")
except Exception as e:
    print(f"Verificación de esquema: {e}")

# Verificar columna exonerado_iva en factura
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'inventario_factura' AND column_name = 'exonerado_iva'")
        if not cursor.fetchone():
            print("⚠️ Agregando columna exonerado_iva...")
            cursor.execute("ALTER TABLE inventario_factura ADD COLUMN IF NOT EXISTS exonerado_iva BOOLEAN NOT NULL DEFAULT FALSE")
except Exception as e:
    print(f"Verificación exonerado_iva: {e}")
MIGRATE_CHECK

python manage.py migrate --noinput
echo "✅ Migraciones completadas"

# Recolectar archivos estáticos
echo "📦 Recolectando archivos estáticos..."
python manage.py collectstatic --noinput --clear
echo "✅ Archivos estáticos listos"

# Crear superusuario si no existe (solo en primera ejecución)
echo "👤 Verificando superusuario..."
python manage.py shell <<EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@ferreteria.local', 'admin123')
    print('✅ Superusuario "admin" creado (password: admin123)')
else:
    print('✅ Superusuario ya existe')
EOF

echo "=========================================="
echo "🎉 Backend iniciado correctamente"
echo "=========================================="

# Iniciar servidor con Gunicorn
exec gunicorn inventario_ferreteria.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
