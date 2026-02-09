#!/bin/bash
set -e

echo "=========================================="
echo "🗄️  Inicializando PostgreSQL"
echo "=========================================="

# Este script se ejecuta automáticamente en la primera creación del contenedor
# Las migraciones de Django se ejecutarán desde el backend

echo "✅ PostgreSQL inicializado correctamente"
echo "   Base de datos: $POSTGRES_DB"
echo "   Usuario: $POSTGRES_USER"
echo "=========================================="
