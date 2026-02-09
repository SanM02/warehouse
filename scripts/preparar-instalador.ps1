# ==========================================
# PREPARAR PAQUETE DE INSTALACION
# Ejecutar en TU PC antes de ir al cliente
# ==========================================

param(
    [string]$Destino = "C:\FerreteriaSistema_Instalador"
)

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "       PREPARAR PAQUETE DE INSTALACION                        " -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

$PROJECT_ROOT = "C:\Users\San\Desktop\SistemaJadi"

# Crear estructura de carpetas
Write-Host "[*] Creando estructura de carpetas..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $Destino -Force | Out-Null
New-Item -ItemType Directory -Path "$Destino\imagenes" -Force | Out-Null
New-Item -ItemType Directory -Path "$Destino\sistema" -Force | Out-Null

# ==========================================
# PASO 1: Exportar imagenes Docker
# ==========================================
Write-Host ""
Write-Host "[*] Exportando imagenes Docker (esto tarda varios minutos)..." -ForegroundColor Yellow
Write-Host ""

# Verificar nombres de imagenes actuales
$imagenes = docker images --format "{{.Repository}}:{{.Tag}}" | Where-Object { $_ -match "sistemajadi|ferreteria|postgres" }
Write-Host "Imagenes encontradas:" -ForegroundColor White
$imagenes | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }
Write-Host ""

# Exportar PostgreSQL
Write-Host "   [1/3] Exportando PostgreSQL..." -ForegroundColor White
docker save postgres:15-alpine -o "$Destino\imagenes\postgres.tar"
Write-Host "         [OK] postgres.tar" -ForegroundColor Green

# Exportar Backend
Write-Host "   [2/3] Exportando Backend..." -ForegroundColor White
$backendImage = $imagenes | Where-Object { $_ -match "backend" } | Select-Object -First 1
if ($backendImage) {
    docker save $backendImage -o "$Destino\imagenes\backend.tar"
    Write-Host "         [OK] backend.tar ($backendImage)" -ForegroundColor Green
} else {
    Write-Host "         [!] No se encontro imagen de backend" -ForegroundColor Yellow
}

# Exportar Frontend
Write-Host "   [3/3] Exportando Frontend..." -ForegroundColor White
$frontendImage = $imagenes | Where-Object { $_ -match "frontend" } | Select-Object -First 1
if ($frontendImage) {
    docker save $frontendImage -o "$Destino\imagenes\frontend.tar"
    Write-Host "         [OK] frontend.tar ($frontendImage)" -ForegroundColor Green
} else {
    Write-Host "         [!] No se encontro imagen de frontend" -ForegroundColor Yellow
}

# ==========================================
# PASO 2: Copiar archivos del sistema
# ==========================================
Write-Host ""
Write-Host "[*] Copiando archivos del sistema..." -ForegroundColor Yellow

# IMPORTANTE: Usar docker-compose de PRODUCCION (sin rutas locales)
Copy-Item "$PROJECT_ROOT\docker-compose.produccion.yml" "$Destino\sistema\docker-compose.yml" -Force
Write-Host "   [OK] docker-compose.yml (version produccion)" -ForegroundColor Green

Copy-Item "$PROJECT_ROOT\iniciar-sistema.ps1" "$Destino\sistema\" -Force
Write-Host "   [OK] iniciar-sistema.ps1" -ForegroundColor Green

# Copiar script de importacion
Copy-Item "$PROJECT_ROOT\cabravietnamirachamsinpeladobackend\importar_productos.py" "$Destino\sistema\" -Force
Write-Host "   [OK] importar_productos.py" -ForegroundColor Green

# Copiar scripts de utilidades
Copy-Item "$PROJECT_ROOT\scripts\ferreteria\backup-automatico.ps1" "$Destino\sistema\" -Force
Write-Host "   [OK] backup-automatico.ps1" -ForegroundColor Green

Copy-Item "$PROJECT_ROOT\scripts\ferreteria\configurar-backup-automatico.ps1" "$Destino\sistema\" -Force
Write-Host "   [OK] configurar-backup-automatico.ps1" -ForegroundColor Green

Copy-Item "$PROJECT_ROOT\scripts\ferreteria\Abrir-Sistema.ps1" "$Destino\sistema\" -Force
Write-Host "   [OK] Abrir-Sistema.ps1" -ForegroundColor Green

# Copiar icono del sistema
if (Test-Path "$PROJECT_ROOT\icono-ferreteria.ico") {
    Copy-Item "$PROJECT_ROOT\icono-ferreteria.ico" "$Destino\sistema\" -Force
    Write-Host "   [OK] icono-ferreteria.ico" -ForegroundColor Green
}

# ==========================================
# PASO 3: Copiar script de instalacion
# ==========================================
Copy-Item "$PROJECT_ROOT\scripts\instalar-en-cliente.ps1" "$Destino\INSTALAR.ps1" -Force
Write-Host "   [OK] INSTALAR.ps1" -ForegroundColor Green

# ==========================================
# PASO 4: Crear archivo README
# ==========================================
$readme = @"
==============================================================
         SISTEMA DE INVENTARIO - FERRETERIA J&G
                   GUIA DE INSTALACION
==============================================================

REQUISITOS PREVIOS:
-------------------
1. Windows 10/11 Pro (o Home con WSL2)
2. Docker Desktop instalado
   Descargar de: https://www.docker.com/products/docker-desktop
3. Minimo 8GB de RAM

PASOS DE INSTALACION:
---------------------
1. Instalar Docker Desktop si no esta instalado
2. Abrir Docker Desktop y esperar que inicie completamente
3. Clic derecho en INSTALAR.ps1 - Ejecutar con PowerShell
4. Seguir las instrucciones en pantalla
5. Esperar a que complete (puede tardar 5-10 minutos)

DESPUES DE INSTALAR:
--------------------
- Abrir navegador Chrome
- Ir a: http://localhost:4200
- Usuario: admin
- Contrasena: admin123

SOPORTE TECNICO:
----------------
WhatsApp: [TU NUMERO]
Email: [TU EMAIL]

CONTENIDO DE ESTA CARPETA:
--------------------------
INSTALAR.ps1        <- Ejecutar este archivo
README.txt          <- Este archivo
imagenes/           <- Imagenes Docker (no modificar)
   postgres.tar
   backend.tar
   frontend.tar
sistema/            <- Archivos de configuracion
   docker-compose.yml
   iniciar-sistema.ps1
"@

$readme | Out-File "$Destino\README.txt" -Encoding UTF8
Write-Host "   [OK] README.txt" -ForegroundColor Green

# ==========================================
# RESUMEN FINAL
# ==========================================
Write-Host ""
Write-Host "==============================================================" -ForegroundColor Green
Write-Host "           [OK] PAQUETE CREADO EXITOSAMENTE                   " -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Green
Write-Host ""

# Calcular tamano
$totalSize = (Get-ChildItem $Destino -Recurse | Measure-Object -Property Length -Sum).Sum
$sizeGB = [math]::Round($totalSize / 1GB, 2)
$sizeMB = [math]::Round($totalSize / 1MB, 0)

Write-Host "Ubicacion: $Destino" -ForegroundColor Cyan
Write-Host "Tamano total: $sizeGB GB - $sizeMB MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Contenido:" -ForegroundColor White
Get-ChildItem $Destino -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Replace($Destino, "")
    $size = if ($_.PSIsContainer) { "[DIR]" } else { "$([math]::Round($_.Length / 1MB, 1)) MB" }
    Write-Host "   $relativePath - $size" -ForegroundColor Gray
}

Write-Host ""
Write-Host "SIGUIENTE PASO:" -ForegroundColor Yellow
Write-Host "   Copiar la carpeta a un USB o disco externo" -ForegroundColor White
Write-Host "   y llevarla a la computadora del cliente" -ForegroundColor White
Write-Host ""
