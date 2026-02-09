# ==========================================
# Script: Exportar Base de Datos PostgreSQL
# ==========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📦 EXPORTAR BASE DE DATOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$POSTGRES_BIN = "C:\Program Files\PostgreSQL\16\bin"
$DB_NAME = "ferreteria_inventario"
$DB_USER = "postgres"
$BACKUP_DIR = "C:\Users\San\Desktop\SistemaJadi\backups"
$FECHA = Get-Date -Format "yyyy-MM-dd_HHmmss"
$BACKUP_FILE = "$BACKUP_DIR\backup_$FECHA.dump"

# Crear directorio de backups si no existe
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Host "✅ Directorio de backups creado: $BACKUP_DIR" -ForegroundColor Green
}

# Exportar base de datos
Write-Host "⏳ Exportando base de datos..." -ForegroundColor Yellow
$env:PGPASSWORD = "210671"

& "$POSTGRES_BIN\pg_dump.exe" -h localhost -U $DB_USER -d $DB_NAME -F c -f $BACKUP_FILE

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Base de datos exportada exitosamente" -ForegroundColor Green
    Write-Host "📁 Archivo: $BACKUP_FILE" -ForegroundColor White
    
    # Mostrar tamaño del archivo
    $fileSize = (Get-Item $BACKUP_FILE).Length / 1MB
    Write-Host "📊 Tamaño: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
} else {
    Write-Host "❌ Error al exportar base de datos" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 Proceso completado" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
