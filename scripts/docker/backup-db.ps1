# ========================================== 
# Script de Backup Automático de PostgreSQL
# ==========================================
# Uso: .\backup-db.ps1
# Cron: Ejecutar diariamente a las 3 AM

param(
    [int]$DiasRetencion = 30
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================="  -ForegroundColor Cyan
Write-Host "📦 BACKUP AUTOMÁTICO DE BASE DE DATOS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Configuración
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = ".\backups"
$backupFile = "$backupDir\backup_$timestamp.sql"
$containerName = "ferreteria-db"

# Verificar que el directorio existe
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "✅ Directorio de backups creado" -ForegroundColor Green
}

# Verificar que el contenedor está corriendo
Write-Host "🔍 Verificando contenedor PostgreSQL..." -ForegroundColor Yellow
$container = docker ps --filter "name=$containerName" --format "{{.Names}}" 2>$null

if ($container -ne $containerName) {
    Write-Host "❌ ERROR: Contenedor $containerName no está corriendo" -ForegroundColor Red
    Write-Host "   Ejecute: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Contenedor corriendo" -ForegroundColor Green
Write-Host ""

# Realizar backup
Write-Host "💾 Creando backup..." -ForegroundColor Yellow
Write-Host "   Archivo: $backupFile" -ForegroundColor Gray

try {
    docker exec $containerName pg_dump -U postgres ferreteria_inventario > $backupFile
    
    if ($LASTEXITCODE -eq 0) {
        $fileSize = (Get-Item $backupFile).Length / 1KB
        Write-Host "✅ Backup creado exitosamente" -ForegroundColor Green
        Write-Host "   Tamaño: $([math]::Round($fileSize, 2)) KB" -ForegroundColor Gray
    } else {
        throw "Error al crear backup"
    }
} catch {
    Write-Host "❌ ERROR al crear backup: $_" -ForegroundColor Red
    exit 1
}

# Verificar integridad del backup
Write-Host ""
Write-Host "🔍 Verificando integridad..." -ForegroundColor Yellow
if ((Get-Item $backupFile).Length -gt 0) {
    Write-Host "✅ Backup válido" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: Backup vacío o corrupto" -ForegroundColor Red
    Remove-Item $backupFile -Force
    exit 1
}

# Limpiar backups antiguos
Write-Host ""
Write-Host "🧹 Limpiando backups antiguos (>$DiasRetencion días)..." -ForegroundColor Yellow
$fechaLimite = (Get-Date).AddDays(-$DiasRetencion)
$backupsAntiguos = Get-ChildItem $backupDir\backup_*.sql | Where-Object { $_.LastWriteTime -lt $fechaLimite }

if ($backupsAntiguos.Count -gt 0) {
    foreach ($backup in $backupsAntiguos) {
        Remove-Item $backup.FullName -Force
        Write-Host "   🗑️  Eliminado: $($backup.Name)" -ForegroundColor Gray
    }
    Write-Host "✅ $($backupsAntiguos.Count) backup(s) antiguos eliminados" -ForegroundColor Green
} else {
    Write-Host "✅ No hay backups antiguos para eliminar" -ForegroundColor Green
}

# Resumen
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ BACKUP COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📄 Archivo: $backupFile" -ForegroundColor White
Write-Host "📊 Backups totales: $((Get-ChildItem $backupDir\backup_*.sql).Count)" -ForegroundColor White
Write-Host ""
