# ==========================================
# ABRIR SISTEMA FERRETERIA J&G
# Script para acceso rapido
# ==========================================

$INSTALL_PATH = "C:\SistemaFerreteria"
$URL = "http://localhost:4200"

# Verificar que el sistema este instalado
if (-not (Test-Path $INSTALL_PATH)) {
    [System.Windows.Forms.MessageBox]::Show(
        "El sistema no esta instalado en C:\SistemaFerreteria",
        "Error - Sistema no encontrado",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    )
    exit 1
}

# Verificar que Docker este corriendo
$dockerRunning = $false
try {
    $dockerInfo = docker info 2>$null
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
    }
} catch {
    $dockerRunning = $false
}

if (-not $dockerRunning) {
    $resultado = [System.Windows.Forms.MessageBox]::Show(
        "Docker Desktop no esta corriendo.`n`n¿Desea abrir Docker Desktop?",
        "Sistema Ferreteria J&G",
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Warning
    )
    
    if ($resultado -eq [System.Windows.Forms.DialogResult]::Yes) {
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        [System.Windows.Forms.MessageBox]::Show(
            "Espere a que Docker Desktop inicie completamente (icono en la barra de tareas).`n`nLuego ejecute este acceso directo nuevamente.",
            "Sistema Ferreteria J&G",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Information
        )
    }
    exit 0
}

# Verificar que los contenedores esten corriendo
Set-Location $INSTALL_PATH
$containers = docker-compose ps --services --filter "status=running" 2>$null

if ($containers -and $containers.Count -ge 2) {
    # Los contenedores estan corriendo, abrir navegador
    Start-Process $URL
} else {
    # Los contenedores no estan corriendo, preguntar si desea iniciarlos
    $resultado = [System.Windows.Forms.MessageBox]::Show(
        "El sistema no esta corriendo.`n`n¿Desea iniciar el sistema?`n(Esto puede tardar 1-2 minutos)",
        "Sistema Ferreteria J&G",
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Question
    )
    
    if ($resultado -eq [System.Windows.Forms.DialogResult]::Yes) {
        # Iniciar sistema
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$INSTALL_PATH'; Write-Host 'Iniciando Sistema Ferreteria J&G...' -ForegroundColor Cyan; docker-compose up -d; Start-Sleep -Seconds 45; Write-Host ''; Write-Host 'Sistema iniciado. Abriendo navegador...' -ForegroundColor Green; Start-Process '$URL'; Write-Host ''; Write-Host 'Puede cerrar esta ventana.' -ForegroundColor Gray" -Verb RunAs
    }
}
