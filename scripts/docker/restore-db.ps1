# ========================================== 
# Script de Restauración de Backup
# ==========================================
# Uso: .\restore-db.ps1 -BackupFile "backups\backup_2025-12-13.sql"

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================="  -ForegroundColor Cyan
Write-Host "♻️  RESTAURAR BACKUP DE BASE DE DATOS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$containerName = "ferreteria-db"

# Verificar que el archivo existe
if (!(Test-Path $BackupFile)) {
    Write-Host "❌ ERROR: Archivo no encontrado: $BackupFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "Backups disponibles:" -ForegroundColor Yellow
    Get-ChildItem .\backups\*.sql | Sort-Object LastWriteTime -Descending | Select-Object -First 10 | ForEach-Object {
        Write-Host "   - $($_.Name) [$($_.LastWriteTime)]" -ForegroundColor Gray
    }
    exit 1
}

Write-Host "📄 Archivo de backup: $BackupFile" -ForegroundColor White
Write-Host ""

# Confirmar acción
Write-Host "⚠️  ADVERTENCIA: Esta acción reemplazará TODOS los datos actuales" -ForegroundColor Yellow
$confirmacion = Read-Host "¿Desea continuar? (escriba 'SI' para confirmar)"

if ($confirmacion -ne "SI") {
    Write-Host "❌ Operación cancelada" -ForegroundColor Red
    exit 0
}

# Verificar contenedor
Write-Host ""
Write-Host "🔍 Verificando contenedor PostgreSQL..." -ForegroundColor Yellow
$container = docker ps --filter "name=$containerName" --format "{{.Names}}" 2>$null

if ($container -ne $containerName) {
    Write-Host "❌ ERROR: Contenedor $containerName no está corriendo" -ForegroundColor Red
    Write-Host "   Ejecute: docker-compose up -d db" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Contenedor corriendo" -ForegroundColor Green

# Detener backend para evitar conexiones activas
Write-Host ""
Write-Host "🛑 Deteniendo backend..." -ForegroundColor Yellow
docker-compose stop backend 2>$null
docker-compose stop frontend 2>$null
Write-Host "✅ Servicios detenidos" -ForegroundColor Green

# Restaurar backup
Write-Host ""
Write-Host "♻️  Restaurando backup..." -ForegroundColor Yellow
Write-Host "   Esto puede tardar varios minutos..." -ForegroundColor Gray

try {
    # Eliminar conexiones activas
    docker exec $containerName psql -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'ferreteria_inventario' AND pid <> pg_backend_pid();" 2>$null | Out-Null
    
    # Eliminar base de datos
    docker exec $containerName psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS ferreteria_inventario;" 2>$null
    
    # Crear base de datos nueva
    docker exec $containerName psql -U postgres -d postgres -c "CREATE DATABASE ferreteria_inventario;" 2>$null
    
    # Restaurar datos
    Get-Content $BackupFile | docker exec -i $containerName psql -U postgres -d ferreteria_inventario 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup restaurado exitosamente" -ForegroundColor Green
    } else {
        throw "Error al restaurar backup"
    }
} catch {
    Write-Host "❌ ERROR al restaurar backup: $_" -ForegroundColor Red
    Write-Host "   Intente crear la base de datos manualmente" -ForegroundColor Yellow
    exit 1
}

# Reiniciar servicios
Write-Host ""
Write-Host "🔄 Reiniciando servicios..." -ForegroundColor Yellow
docker-compose up -d

Start-Sleep -Seconds 5

# Verificar salud
Write-Host ""
Write-Host "🏥 Verificando salud del sistema..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$backendHealth = docker inspect ferreteria-api --format='{{.State.Health.Status}}' 2>$null
if ($backendHealth -eq "healthy") {
    Write-Host "✅ Backend: healthy" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend: $backendHealth" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ RESTAURACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
