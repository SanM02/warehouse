# ==========================================
# SCRIPT DE ACTUALIZACIÓN - SISTEMA FERRETERIA
# ==========================================
# Actualiza el sistema en el cliente SIN PERDER DATOS
# Ejecutar en el directorio de instalación (C:\SistemaFerreteria)
# ==========================================

param(
    [string]$OrigenActualizacion = "",
    [switch]$SkipBackup = $false
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "      ACTUALIZACIÓN SISTEMA FERRETERIA - SIN PÉRDIDA DATOS   " -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$currentPath = Get-Location
Write-Host "📂 Directorio actual: $currentPath" -ForegroundColor White
Write-Host ""

if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ ERROR: No se encontró docker-compose.yml" -ForegroundColor Red
    Write-Host "   Debe ejecutar este script en el directorio de instalación" -ForegroundColor Yellow
    Write-Host "   Ejemplo: cd C:\SistemaFerreteria" -ForegroundColor Yellow
    exit 1
}

# Solicitar origen de actualización si no se proporcionó
if ($OrigenActualizacion -eq "") {
    Write-Host "📦 Origen de los archivos de actualización:" -ForegroundColor Yellow
    Write-Host "   Ejemplo: D:\actualizacion_sistema" -ForegroundColor Gray
    Write-Host "   Ejemplo: \\servidor\compartido\sistema_nuevo" -ForegroundColor Gray
    $OrigenActualizacion = Read-Host "Ingrese la ruta"
    
    if ($OrigenActualizacion -eq "") {
        Write-Host "❌ Debe proporcionar la ruta de origen" -ForegroundColor Red
        exit 1
    }
}

# Verificar que existe el origen
if (-not (Test-Path $OrigenActualizacion)) {
    Write-Host "❌ ERROR: No se encontró el directorio: $OrigenActualizacion" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Origen encontrado: $OrigenActualizacion" -ForegroundColor Green
Write-Host ""

# ==========================================
# PASO 1: BACKUP AUTOMÁTICO DE BD
# ==========================================
if (-not $SkipBackup) {
    Write-Host "==============================================================" -ForegroundColor Cyan
    Write-Host "PASO 1/7: BACKUP DE BASE DE DATOS" -ForegroundColor Cyan
    Write-Host "==============================================================" -ForegroundColor Cyan
    Write-Host ""
    
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $backupDir = ".\backups"
    $backupFile = "$backupDir\backup_pre_actualizacion_$timestamp.sql"
    
    # Crear directorio si no existe
    if (!(Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }
    
    Write-Host "💾 Creando backup de seguridad..." -ForegroundColor Yellow
    Write-Host "   Archivo: $backupFile" -ForegroundColor Gray
    
    try {
        docker exec ferreteria-db pg_dump -U postgres ferreteria_inventario > $backupFile
        
        if ($LASTEXITCODE -eq 0) {
            $fileSize = [math]::Round((Get-Item $backupFile).Length / 1KB, 2)
            Write-Host "✅ Backup creado exitosamente ($fileSize KB)" -ForegroundColor Green
            Write-Host "   Ubicación: $backupFile" -ForegroundColor Gray
        } else {
            throw "Error al crear backup"
        }
    } catch {
        Write-Host "❌ ERROR al crear backup: $_" -ForegroundColor Red
        Write-Host ""
        $continuar = Read-Host "¿Desea continuar sin backup? (S/N)"
        if ($continuar -ne "S" -and $continuar -ne "s") {
            exit 1
        }
    }
    Write-Host ""
} else {
    Write-Host "⚠️  SALTANDO BACKUP (parámetro -SkipBackup activado)" -ForegroundColor Yellow
    Write-Host ""
}

# ==========================================
# PASO 2: DETENER CONTENEDORES
# ==========================================
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "PASO 2/7: DETENER CONTENEDORES" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🛑 Deteniendo contenedores..." -ForegroundColor Yellow
docker-compose down
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Contenedores detenidos" -ForegroundColor Green
} else {
    Write-Host "⚠️  Error al detener contenedores (continuando...)" -ForegroundColor Yellow
}
Write-Host ""

# ==========================================
# PASO 3: RESPALDAR CONFIGURACIÓN ACTUAL
# ==========================================
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "PASO 3/7: RESPALDAR ARCHIVOS ACTUALES" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

$backupConfigDir = ".\backups\config_anterior_$timestamp"
Write-Host "📋 Respaldando configuración actual..." -ForegroundColor Yellow

New-Item -ItemType Directory -Path $backupConfigDir -Force | Out-Null

# Respaldar archivos importantes
$archivosRespaldar = @(
    "docker-compose.yml",
    "docker-compose.produccion.yml"
)

foreach ($archivo in $archivosRespaldar) {
    if (Test-Path $archivo) {
        Copy-Item $archivo -Destination $backupConfigDir -Force
        Write-Host "   ✓ $archivo" -ForegroundColor Gray
    }
}
Write-Host "✅ Configuración respaldada en: $backupConfigDir" -ForegroundColor Green
Write-Host ""

# ==========================================
# PASO 4: COPIAR ARCHIVOS NUEVOS
# ==========================================
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "PASO 4/7: COPIAR ARCHIVOS ACTUALIZADOS" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📁 Copiando archivos desde: $OrigenActualizacion" -ForegroundColor Yellow
Write-Host ""

# Directorios a actualizar
$directoriosActualizar = @(
    "cabravietnamirachamsinpeladobackend",
    "cabravietnamirachamsinpeladofrontend",
    "scripts"
)

foreach ($dir in $directoriosActualizar) {
    $origen = Join-Path $OrigenActualizacion $dir
    $destino = ".\$dir"
    
    if (Test-Path $origen) {
        Write-Host "   📂 Actualizando $dir..." -ForegroundColor Cyan
        
        # Eliminar directorio anterior con fuerza
        if (Test-Path $destino) {
            Remove-Item $destino -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        # Copiar nuevo directorio
        Copy-Item $origen -Destination $destino -Recurse -Force
        Write-Host "      ✅ $dir actualizado" -ForegroundColor Green
    } else {
        Write-Host "      ⚠️  No se encontró $dir en origen (omitiendo)" -ForegroundColor Yellow
    }
}

# Archivos de configuración (si existen en origen)
$archivosActualizar = @(
    "docker-compose.yml",
    "docker-compose.produccion.yml",
    "iniciar-sistema.ps1"
)

foreach ($archivo in $archivosActualizar) {
    $origen = Join-Path $OrigenActualizacion $archivo
    if (Test-Path $origen) {
        Copy-Item $origen -Destination ".\$archivo" -Force
        Write-Host "   ✅ $archivo actualizado" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Archivos actualizados correctamente" -ForegroundColor Green
Write-Host ""

# ==========================================
# PASO 5: RECONSTRUIR IMÁGENES DOCKER
# ==========================================
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "PASO 5/7: RECONSTRUIR IMÁGENES DOCKER" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔨 Reconstruyendo imágenes (esto puede tardar 3-5 minutos)..." -ForegroundColor Yellow
Write-Host ""

docker-compose build --no-cache backend frontend

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Imágenes reconstruidas exitosamente" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ ERROR al reconstruir imágenes" -ForegroundColor Red
    Write-Host "   Revise los logs arriba para más detalles" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# ==========================================
# PASO 6: APLICAR MIGRACIONES DE BD
# ==========================================
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "PASO 6/7: APLICAR MIGRACIONES DE BASE DE DATOS" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 Iniciando contenedores..." -ForegroundColor Yellow
docker-compose up -d db backend

Write-Host "⏳ Esperando que la BD esté lista..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "📊 Aplicando migraciones de Django..." -ForegroundColor Yellow
docker-compose exec -T backend python manage.py migrate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migraciones aplicadas correctamente" -ForegroundColor Green
} else {
    Write-Host "⚠️  Hubo un problema con las migraciones" -ForegroundColor Yellow
    Write-Host "   Revise los logs arriba" -ForegroundColor Gray
}
Write-Host ""

# ==========================================
# PASO 7: INICIAR SISTEMA COMPLETO
# ==========================================
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "PASO 7/7: INICIAR SISTEMA COMPLETO" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 Iniciando todos los servicios..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "⏳ Esperando que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "🔍 Verificando estado de los contenedores..." -ForegroundColor Yellow
Write-Host ""
docker-compose ps
Write-Host ""

# ==========================================
# VERIFICACIÓN FINAL
# ==========================================
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "VERIFICACIÓN FINAL" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

$todosOk = $true

# Verificar cada contenedor
$contenedores = @("ferreteria-db", "ferreteria-api", "ferreteria-web")
foreach ($contenedor in $contenedores) {
    $estado = docker inspect -f '{{.State.Status}}' $contenedor 2>$null
    if ($estado -eq "running") {
        Write-Host "✅ $contenedor: Corriendo" -ForegroundColor Green
    } else {
        Write-Host "❌ $contenedor: $estado" -ForegroundColor Red
        $todosOk = $false
    }
}

Write-Host ""

if ($todosOk) {
    Write-Host "==============================================================" -ForegroundColor Green
    Write-Host "           ✅ ACTUALIZACIÓN COMPLETADA EXITOSAMENTE           " -ForegroundColor Green
    Write-Host "==============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 El sistema está disponible en:" -ForegroundColor White
    Write-Host "   http://localhost" -ForegroundColor Cyan
    Write-Host "   http://localhost:4200" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Backup de seguridad guardado en:" -ForegroundColor White
    Write-Host "   $backupFile" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📋 Configuración anterior guardada en:" -ForegroundColor White
    Write-Host "   $backupConfigDir" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "==============================================================" -ForegroundColor Yellow
    Write-Host "     ⚠️  ACTUALIZACIÓN COMPLETADA CON ADVERTENCIAS           " -ForegroundColor Yellow
    Write-Host "==============================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Algunos contenedores no están corriendo correctamente." -ForegroundColor Yellow
    Write-Host "Revise los logs con: docker-compose logs" -ForegroundColor White
    Write-Host ""
    Write-Host "Puede restaurar el backup con:" -ForegroundColor White
    Write-Host "   .\scripts\docker\restore-db.ps1 -BackupFile '$backupFile'" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "Presione cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
