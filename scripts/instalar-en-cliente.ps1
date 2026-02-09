# ==========================================
# INSTALADOR - SISTEMA FERRETERIA J&G
# Ejecutar como Administrador
# ==========================================

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "         INSTALADOR - SISTEMA FERRETERIA J&G                  " -ForegroundColor Cyan
Write-Host "                     Version 2.0                              " -ForegroundColor Cyan
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

# Obtener ruta del instalador (donde esta este script)
$INSTALLER_PATH = Split-Path -Parent $MyInvocation.MyCommand.Path
$IMAGES_PATH = Join-Path $INSTALLER_PATH "imagenes"
$SYSTEM_PATH = Join-Path $INSTALLER_PATH "sistema"

# Ruta de instalacion
$INSTALL_PATH = "C:\SistemaFerreteria"

Write-Host "Instalando desde: $INSTALLER_PATH" -ForegroundColor White
Write-Host "Instalando en: $INSTALL_PATH" -ForegroundColor White
Write-Host ""

# ==========================================
# PASO 1: Verificar Docker
# ==========================================
Write-Host "[1/5] Verificando Docker Desktop..." -ForegroundColor Yellow

$dockerRunning = $false
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Docker encontrado: $dockerVersion" -ForegroundColor Green
        
        # Verificar que Docker daemon esta corriendo
        $dockerInfo = docker info 2>$null
        if ($LASTEXITCODE -eq 0) {
            $dockerRunning = $true
            Write-Host "   [OK] Docker esta corriendo" -ForegroundColor Green
        }
    }
} catch {
    $dockerRunning = $false
}

if (-not $dockerRunning) {
    Write-Host ""
    Write-Host "[ERROR] Docker Desktop no esta instalado o no esta corriendo" -ForegroundColor Red
    Write-Host ""
    Write-Host "INSTRUCCIONES:" -ForegroundColor Yellow
    Write-Host "   1. Descargar Docker Desktop de: https://www.docker.com/products/docker-desktop" -ForegroundColor White
    Write-Host "   2. Instalar y reiniciar la computadora" -ForegroundColor White
    Write-Host "   3. Abrir Docker Desktop y esperar que inicie" -ForegroundColor White
    Write-Host "   4. Ejecutar este instalador nuevamente" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

# ==========================================
# PASO 2: Crear directorio de instalacion
# ==========================================
Write-Host ""
Write-Host "[2/5] Creando directorio de instalacion..." -ForegroundColor Yellow

if (Test-Path $INSTALL_PATH) {
    Write-Host "   [!] El directorio ya existe" -ForegroundColor Yellow
    $respuesta = Read-Host "   Desea sobrescribir? (S/N)"
    if ($respuesta -ne "S" -and $respuesta -ne "s") {
        Write-Host "   Instalacion cancelada" -ForegroundColor Red
        exit 0
    }
}

New-Item -ItemType Directory -Path $INSTALL_PATH -Force | Out-Null
New-Item -ItemType Directory -Path "$INSTALL_PATH\backups" -Force | Out-Null
Write-Host "   [OK] Directorio creado: $INSTALL_PATH" -ForegroundColor Green

# ==========================================
# PASO 3: Cargar imagenes Docker
# ==========================================
Write-Host ""
Write-Host "[3/5] Cargando imagenes Docker (esto puede tardar varios minutos)..." -ForegroundColor Yellow

$imagenes = @(
    @{nombre="PostgreSQL"; archivo="postgres.tar"},
    @{nombre="Backend"; archivo="backend.tar"},
    @{nombre="Frontend"; archivo="frontend.tar"}
)

foreach ($img in $imagenes) {
    $archivoImagen = Join-Path $IMAGES_PATH $img.archivo
    if (Test-Path $archivoImagen) {
        Write-Host "   Cargando $($img.nombre)..." -ForegroundColor White
        docker load -i $archivoImagen
        if ($LASTEXITCODE -eq 0) {
            Write-Host "     [OK] $($img.nombre) cargado" -ForegroundColor Green
        } else {
            Write-Host "     [ERROR] Error al cargar $($img.nombre)" -ForegroundColor Red
        }
    } else {
        Write-Host "   [!] No se encontro: $archivoImagen" -ForegroundColor Yellow
    }
}

# ==========================================
# PASO 4: Copiar archivos del sistema
# ==========================================
Write-Host ""
Write-Host "[4/5] Copiando archivos del sistema..." -ForegroundColor Yellow

# Copiar docker-compose.yml
if (Test-Path "$SYSTEM_PATH\docker-compose.yml") {
    Copy-Item "$SYSTEM_PATH\docker-compose.yml" "$INSTALL_PATH\" -Force
    Write-Host "   [OK] docker-compose.yml copiado" -ForegroundColor Green
}

# Copiar scripts
if (Test-Path "$SYSTEM_PATH\iniciar-sistema.ps1") {
    Copy-Item "$SYSTEM_PATH\iniciar-sistema.ps1" "$INSTALL_PATH\" -Force
    Write-Host "   [OK] iniciar-sistema.ps1 copiado" -ForegroundColor Green
}

if (Test-Path "$SYSTEM_PATH\backup-automatico.ps1") {
    Copy-Item "$SYSTEM_PATH\backup-automatico.ps1" "$INSTALL_PATH\" -Force
    Write-Host "   [OK] backup-automatico.ps1 copiado" -ForegroundColor Green
}

if (Test-Path "$SYSTEM_PATH\configurar-backup-automatico.ps1") {
    Copy-Item "$SYSTEM_PATH\configurar-backup-automatico.ps1" "$INSTALL_PATH\" -Force
    Write-Host "   [OK] configurar-backup-automatico.ps1 copiado" -ForegroundColor Green
}

if (Test-Path "$SYSTEM_PATH\Abrir-Sistema.ps1") {
    Copy-Item "$SYSTEM_PATH\Abrir-Sistema.ps1" "$INSTALL_PATH\" -Force
    Write-Host "   [OK] Abrir-Sistema.ps1 copiado" -ForegroundColor Green
}

if (Test-Path "$SYSTEM_PATH\icono-ferreteria.ico") {
    Copy-Item "$SYSTEM_PATH\icono-ferreteria.ico" "$INSTALL_PATH\" -Force
    Write-Host "   [OK] icono-ferreteria.ico copiado" -ForegroundColor Green
}

# ==========================================
# PASO 5: Iniciar el sistema
# ==========================================
Write-Host ""
Write-Host "[5/5] Iniciando el sistema..." -ForegroundColor Yellow

Set-Location $INSTALL_PATH
docker-compose up -d

# Esperar a que los servicios esten listos
Write-Host ""
Write-Host "Esperando que los servicios inicien (60 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# Verificar estado
Write-Host ""
Write-Host "Verificando estado de los servicios..." -ForegroundColor Yellow
docker-compose ps

# ==========================================
# CREAR ACCESO DIRECTO EN ESCRITORIO
# ==========================================
Write-Host ""
Write-Host "Creando acceso directo en el escritorio..." -ForegroundColor Yellow

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:PUBLIC\Desktop\Ferreteria JG.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$INSTALL_PATH\Abrir-Sistema.ps1`""
$Shortcut.WorkingDirectory = $INSTALL_PATH

# Usar icono personalizado si existe, sino usar icono por defecto
if (Test-Path "$INSTALL_PATH\icono-ferreteria.ico") {
    $Shortcut.IconLocation = "$INSTALL_PATH\icono-ferreteria.ico"
} else {
    $Shortcut.IconLocation = "shell32.dll,14"
}

$Shortcut.Description = "Sistema de Inventario - Ferreteria J&G"
$Shortcut.Save()
Write-Host "   [OK] Acceso directo creado en el escritorio" -ForegroundColor Green

# ==========================================
# CONFIGURAR BACKUP AUTOMATICO
# ==========================================
Write-Host ""
Write-Host "Configurando backup automatico..." -ForegroundColor Yellow

if (Test-Path "$INSTALL_PATH\configurar-backup-automatico.ps1") {
    # Ejecutar script de configuracion de backup
    & "$INSTALL_PATH\configurar-backup-automatico.ps1"
    Write-Host "   [OK] Backup automatico configurado" -ForegroundColor Green
} else {
    Write-Host "   [!] Script de backup no encontrado" -ForegroundColor Yellow
}

# ==========================================
# RESUMEN FINAL
# ==========================================
Write-Host ""
Write-Host "==============================================================" -ForegroundColor Green
Write-Host "           [OK] INSTALACION COMPLETADA CON EXITO              " -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Sistema instalado en: $INSTALL_PATH" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para acceder al sistema:" -ForegroundColor White
Write-Host "   - Abrir navegador (Chrome recomendado)" -ForegroundColor White
Write-Host "   - Ir a: http://localhost:4200" -ForegroundColor Yellow
Write-Host "   - O usar el acceso directo en el escritorio" -ForegroundColor White
Write-Host ""
Write-Host "Credenciales iniciales:" -ForegroundColor White
Write-Host "   Usuario: admin" -ForegroundColor Yellow
Write-Host "   Contrasena: admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANTE: Cambiar la contrasena en el primer uso" -ForegroundColor Red
Write-Host ""
Write-Host "Soporte tecnico: [TU NUMERO DE WHATSAPP]" -ForegroundColor White
Write-Host ""
pause
