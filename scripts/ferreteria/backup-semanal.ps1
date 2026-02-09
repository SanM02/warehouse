# ==========================================
# Script: Backup Semanal Automático
# ==========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "💾 BACKUP SEMANAL FERRETERÍA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$POSTGRES_BIN = "C:\Program Files\PostgreSQL\16\bin"
$DB_NAME = "ferreteria_inventario"
$DB_USER = "postgres"
$DB_PASSWORD = "210671"
$BACKUP_DIR = "C:\BackupsFerreteria"
$FECHA = Get-Date -Format "yyyy-MM-dd_HHmmss"
$DIA_SEMANA = (Get-Date).DayOfWeek
$BACKUP_FILE = "$BACKUP_DIR\backup_semanal_$FECHA.dump"

# Crear directorio de backups si no existe
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Host "✅ Directorio de backups creado" -ForegroundColor Green
}

# Realizar backup
Write-Host "⏳ Realizando backup de la base de datos..." -ForegroundColor Yellow
$env:PGPASSWORD = $DB_PASSWORD

& "$POSTGRES_BIN\pg_dump.exe" -h localhost -U $DB_USER -d $DB_NAME -F c -f $BACKUP_FILE

if ($LASTEXITCODE -eq 0) {
    $fileSize = (Get-Item $BACKUP_FILE).Length / 1MB
    Write-Host "✅ Backup completado exitosamente" -ForegroundColor Green
    Write-Host "📁 Archivo: $BACKUP_FILE" -ForegroundColor White
    Write-Host "📊 Tamaño: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
    Write-Host "📅 Fecha: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor White
    
    # Registrar en log
    $logFile = "$BACKUP_DIR\backup_log.txt"
    $logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Backup exitoso - $([math]::Round($fileSize, 2)) MB"
    Add-Content -Path $logFile -Value $logEntry
    
} else {
    Write-Host "❌ Error al realizar backup" -ForegroundColor Red
    
    # Registrar error en log
    $logFile = "$BACKUP_DIR\backup_log.txt"
    $logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - ERROR en backup"
    Add-Content -Path $logFile -Value $logEntry
    
    exit 1
}

# Información sobre retención
Write-Host ""
Write-Host "ℹ️  POLÍTICA DE RETENCIÓN:" -ForegroundColor Cyan
Write-Host "   📦 Los backups se mantienen PERMANENTEMENTE" -ForegroundColor White
Write-Host "   🔒 NO se eliminan automáticamente" -ForegroundColor White
Write-Host "   📂 Ubicación: $BACKUP_DIR" -ForegroundColor White
Write-Host ""

# Mostrar backups existentes
Write-Host "📚 Backups existentes:" -ForegroundColor Cyan
$backups = Get-ChildItem "$BACKUP_DIR\*.dump" | Sort-Object LastWriteTime -Descending
$totalSize = ($backups | Measure-Object -Property Length -Sum).Sum / 1GB

Write-Host "   Total de backups: $($backups.Count)" -ForegroundColor White
Write-Host "   Espacio usado: $([math]::Round($totalSize, 2)) GB" -ForegroundColor White
Write-Host ""
Write-Host "   Últimos 5 backups:" -ForegroundColor Yellow
$backups | Select-Object -First 5 | ForEach-Object {
    $size = $_.Length / 1MB
    Write-Host "   - $($_.Name) ($([math]::Round($size, 2)) MB) - $($_.LastWriteTime)" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 Backup semanal completado" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
