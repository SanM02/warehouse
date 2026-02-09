# ==========================================
# Script: Restaurar Backup
# ==========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📥 RESTAURAR BACKUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$POSTGRES_BIN = "C:\Program Files\PostgreSQL\16\bin"
$DB_NAME = "ferreteria_inventario"
$DB_USER = "postgres"
$DB_PASSWORD = "210671"
$BACKUP_DIR = "C:\BackupsFerreteria"

# Listar backups disponibles
Write-Host "📚 Backups disponibles:" -ForegroundColor Cyan
$backups = Get-ChildItem "$BACKUP_DIR\*.dump" | Sort-Object LastWriteTime -Descending
$i = 1
$backups | ForEach-Object {
    $size = $_.Length / 1MB
    Write-Host "   [$i] $($_.Name) - $([math]::Round($size, 2)) MB - $($_.LastWriteTime)" -ForegroundColor White
    $i++
}

Write-Host ""
Write-Host "⚠️  ADVERTENCIA: Esto sobrescribirá la base de datos actual" -ForegroundColor Yellow
$respuesta = Read-Host "¿Desea continuar? (S/N)"

if ($respuesta -ne "S" -and $respuesta -ne "s") {
    Write-Host "❌ Restauración cancelada" -ForegroundColor Red
    exit 0
}

$seleccion = Read-Host "Ingrese el número del backup a restaurar"
$backupFile = $backups[$seleccion - 1].FullName

if (-not $backupFile) {
    Write-Host "❌ Selección inválida" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📥 Restaurando: $backupFile" -ForegroundColor Yellow
$env:PGPASSWORD = $DB_PASSWORD

& "$POSTGRES_BIN\pg_restore.exe" -h localhost -U $DB_USER -d $DB_NAME -c $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup restaurado exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al restaurar backup" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 Restauración completada" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
