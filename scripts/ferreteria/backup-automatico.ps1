# ==========================================
# BACKUP AUTOMATICO - SISTEMA FERRETERIA J&G
# Se ejecuta automaticamente cada semana
# ==========================================

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "           BACKUP AUTOMATICO - FERRETERIA J&G                 " -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

$INSTALL_PATH = "C:\SistemaFerreteria"
$BACKUP_DIR = "$INSTALL_PATH\backups"
$FECHA = Get-Date -Format "yyyy-MM-dd_HH-mm"
$BACKUP_FILE = "$BACKUP_DIR\backup_automatico_$FECHA.sql"

# Crear directorio de backups si no existe
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
}

Write-Host "[*] Iniciando backup automatico..." -ForegroundColor Yellow
Write-Host "    Fecha: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor White
Write-Host ""

# Verificar que el contenedor este corriendo
$containerStatus = docker ps --filter "name=ferreteria-db" --format "{{.Status}}"
if (-not $containerStatus) {
    Write-Host "[ERROR] El contenedor de base de datos no esta corriendo" -ForegroundColor Red
    Write-Host ""
    Add-Content "$BACKUP_DIR\backup_error.log" "$(Get-Date) - ERROR: Contenedor no esta corriendo"
    exit 1
}

# Realizar backup
Write-Host "[*] Exportando base de datos..." -ForegroundColor Yellow
docker exec ferreteria-db pg_dump -U postgres -d ferreteria_inventario > $BACKUP_FILE

if ($LASTEXITCODE -eq 0 -and (Test-Path $BACKUP_FILE)) {
    $fileSize = (Get-Item $BACKUP_FILE).Length / 1MB
    Write-Host ""
    Write-Host "[OK] Backup completado exitosamente" -ForegroundColor Green
    Write-Host "    Archivo: $BACKUP_FILE" -ForegroundColor White
    Write-Host "    Tamano: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
    Write-Host ""
    
    # Log exitoso
    Add-Content "$BACKUP_DIR\backup_success.log" "$(Get-Date) - Backup exitoso: $BACKUP_FILE ($([math]::Round($fileSize, 2)) MB)"
    
    # Limpiar backups antiguos (mantener ultimos 30 dias)
    Write-Host "[*] Limpiando backups antiguos (>30 dias)..." -ForegroundColor Yellow
    $fechaLimite = (Get-Date).AddDays(-30)
    Get-ChildItem $BACKUP_DIR -Filter "backup_automatico_*.sql" | 
        Where-Object { $_.LastWriteTime -lt $fechaLimite } | 
        ForEach-Object {
            Write-Host "    Eliminando: $($_.Name)" -ForegroundColor Gray
            Remove-Item $_.FullName -Force
        }
    
    # Contar backups restantes
    $backupCount = (Get-ChildItem $BACKUP_DIR -Filter "backup_automatico_*.sql").Count
    Write-Host ""
    Write-Host "[INFO] Total de backups automaticos: $backupCount" -ForegroundColor Cyan
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "[ERROR] Error al crear el backup" -ForegroundColor Red
    Write-Host ""
    Add-Content "$BACKUP_DIR\backup_error.log" "$(Get-Date) - ERROR: Fallo al crear backup"
    exit 1
}

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""
