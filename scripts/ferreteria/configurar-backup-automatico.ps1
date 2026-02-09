# ==========================================
# CONFIGURAR BACKUP AUTOMATICO
# Crea tarea programada en Windows
# ==========================================

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "       CONFIGURAR BACKUP AUTOMATICO - FERRETERIA J&G          " -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] Debe ejecutar este script como Administrador" -ForegroundColor Red
    Write-Host "   Clic derecho - Ejecutar como administrador" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

$INSTALL_PATH = "C:\SistemaFerreteria"
$SCRIPT_PATH = "$INSTALL_PATH\backup-automatico.ps1"

# Verificar que el script existe
if (-not (Test-Path $SCRIPT_PATH)) {
    Write-Host "[ERROR] No se encontro el script de backup en:" -ForegroundColor Red
    Write-Host "   $SCRIPT_PATH" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

# Eliminar tarea existente si existe
$tareaExistente = Get-ScheduledTask -TaskName "FerreteriaBD_BackupAutomatico" -ErrorAction SilentlyContinue
if ($tareaExistente) {
    Write-Host "[*] Eliminando tarea programada existente..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName "FerreteriaBD_BackupAutomatico" -Confirm:$false
}

# Crear nueva tarea programada
Write-Host "[*] Creando tarea programada..." -ForegroundColor Yellow

# Accion: Ejecutar el script de backup
$accion = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$SCRIPT_PATH`""

# Disparador: Cada domingo a las 2:00 AM
$disparadorSemanal = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 2:00AM

# Disparador adicional: Al inicio del sistema (retraso de 10 minutos)
$disparadorInicio = New-ScheduledTaskTrigger -AtStartup
$disparadorInicio.Delay = "PT10M"

# Configuracion: Ejecutar como SYSTEM, incluso si no hay usuario logueado
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Settings adicionales
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable:$false

# Registrar la tarea
Register-ScheduledTask -TaskName "FerreteriaBD_BackupAutomatico" `
                       -Description "Backup automatico de la base de datos del Sistema Ferreteria J&G" `
                       -Action $accion `
                       -Trigger $disparadorSemanal,$disparadorInicio `
                       -Principal $principal `
                       -Settings $settings `
                       -Force | Out-Null

if ($?) {
    Write-Host ""
    Write-Host "[OK] Tarea programada creada exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "Configuracion:" -ForegroundColor Cyan
    Write-Host "   Nombre: FerreteriaBD_BackupAutomatico" -ForegroundColor White
    Write-Host "   Frecuencia: Cada domingo a las 2:00 AM" -ForegroundColor White
    Write-Host "   Tambien: 10 minutos despues de iniciar el sistema" -ForegroundColor White
    Write-Host "   Ubicacion: $INSTALL_PATH\backups\" -ForegroundColor White
    Write-Host "   Retencion: 30 dias" -ForegroundColor White
    Write-Host ""
    Write-Host "[INFO] Los backups antiguos se eliminan automaticamente" -ForegroundColor Cyan
    Write-Host ""
    
    # Mostrar proxima ejecucion
    $tarea = Get-ScheduledTask -TaskName "FerreteriaBD_BackupAutomatico"
    $proximaEjecucion = ($tarea | Get-ScheduledTaskInfo).NextRunTime
    Write-Host "Proxima ejecucion programada: $proximaEjecucion" -ForegroundColor Yellow
    Write-Host ""
    
    # Preguntar si desea ejecutar un backup ahora
    $respuesta = Read-Host "¿Desea ejecutar un backup ahora para probar? (S/N)"
    if ($respuesta -eq "S" -or $respuesta -eq "s") {
        Write-Host ""
        Write-Host "[*] Ejecutando backup de prueba..." -ForegroundColor Yellow
        Write-Host ""
        Start-ScheduledTask -TaskName "FerreteriaBD_BackupAutomatico"
        Start-Sleep -Seconds 5
        
        # Esperar a que termine
        $timeout = 60
        $elapsed = 0
        while ($elapsed -lt $timeout) {
            $estado = (Get-ScheduledTask -TaskName "FerreteriaBD_BackupAutomatico").State
            if ($estado -ne "Running") {
                break
            }
            Start-Sleep -Seconds 2
            $elapsed += 2
        }
        
        # Verificar resultado
        $lastResult = (Get-ScheduledTaskInfo -TaskName "FerreteriaBD_BackupAutomatico").LastTaskResult
        if ($lastResult -eq 0) {
            Write-Host ""
            Write-Host "[OK] Backup de prueba completado exitosamente" -ForegroundColor Green
            Write-Host ""
            Write-Host "Verifique el archivo en:" -ForegroundColor Cyan
            Write-Host "   $INSTALL_PATH\backups\" -ForegroundColor White
            Write-Host ""
            
            # Abrir carpeta de backups
            Start-Process explorer "$INSTALL_PATH\backups"
        } else {
            Write-Host ""
            Write-Host "[!] El backup finalizo con codigo: $lastResult" -ForegroundColor Yellow
            Write-Host ""
        }
    }
    
} else {
    Write-Host ""
    Write-Host "[ERROR] Error al crear la tarea programada" -ForegroundColor Red
    Write-Host ""
}

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""
pause
