# ==========================================
# Script para Configurar PostgreSQL para Docker
# Ejecutar como ADMINISTRADOR
# ==========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONFIGURANDO POSTGRESQL PARA DOCKER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ruta del archivo pg_hba.conf
$pgHbaPath = "C:\Program Files\PostgreSQL\16\data\pg_hba.conf"

# Verificar que el archivo existe
if (-not (Test-Path $pgHbaPath)) {
    Write-Host "[ERROR] No se encontro el archivo pg_hba.conf en: $pgHbaPath" -ForegroundColor Red
    Write-Host "   Verifica la ruta de instalacion de PostgreSQL" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Archivo encontrado: $pgHbaPath" -ForegroundColor Green
Write-Host ""

# Hacer backup
$backupPath = "$pgHbaPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host "[INFO] Creando backup en: $backupPath" -ForegroundColor Yellow
try {
    Copy-Item $pgHbaPath $backupPath -Force
    Write-Host "[OK] Backup creado exitosamente" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Error al crear backup: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Leer contenido actual
$content = Get-Content $pgHbaPath

# Verificar si ya existe la configuracion para Docker
$dockerConfigExists = $content | Select-String "172.16.0.0/12"

if ($dockerConfigExists) {
    Write-Host "[INFO] La configuracion para Docker ya existe" -ForegroundColor Yellow
    Write-Host "   No se realizaran cambios" -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Agregando configuracion para Docker..." -ForegroundColor Yellow
    
    # Buscar la línea que contiene "# IPv4 local connections:"
    $ipv4Line = -1
    for ($i = 0; $i -lt $content.Count; $i++) {
        if ($content[$i] -match "# IPv4 local connections:") {
            $ipv4Line = $i
            break
        }
    }
    
    if ($ipv4Line -eq -1) {
        Write-Host "[WARNING] No se encontro la seccion de IPv4 local connections" -ForegroundColor Yellow
        Write-Host "   Agregando al final del archivo..." -ForegroundColor Yellow
        $content += ""
        $content += "# Allow Docker containers (agregado automaticamente)"
        $content += "host    all             all             172.16.0.0/12           scram-sha-256"
    } else {
        # Insertar la configuracion de Docker ANTES de la linea de IPv4
        $newContent = @()
        for ($i = 0; $i -lt $content.Count; $i++) {
            if ($i -eq $ipv4Line) {
                $newContent += "# Allow Docker containers (agregado automaticamente)"
                $newContent += "host    all             all             172.16.0.0/12           scram-sha-256"
                $newContent += ""
            }
            $newContent += $content[$i]
        }
        $content = $newContent
    }
    
    # Guardar el archivo modificado
    try {
        $content | Set-Content $pgHbaPath -Force
        Write-Host "[OK] Configuracion agregada exitosamente" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Error al guardar el archivo: $_" -ForegroundColor Red
        Write-Host "   Restaurando backup..." -ForegroundColor Yellow
        Copy-Item $backupPath $pgHbaPath -Force
        exit 1
    }
}

Write-Host ""
Write-Host "[INFO] Reiniciando servicio PostgreSQL..." -ForegroundColor Yellow
try {
    Restart-Service postgresql-x64-16 -Force
    Start-Sleep -Seconds 3
    Write-Host "[OK] PostgreSQL reiniciado exitosamente" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Error al reiniciar PostgreSQL: $_" -ForegroundColor Red
    Write-Host "   Intenta manualmente: Restart-Service postgresql-x64-16" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONFIGURACION COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resumen de cambios:" -ForegroundColor Cyan
Write-Host "   - Backup creado en: $backupPath" -ForegroundColor White
Write-Host "   - Configuracion Docker agregada al pg_hba.conf" -ForegroundColor White
Write-Host "   - PostgreSQL reiniciado" -ForegroundColor White
Write-Host ""
Write-Host "Ahora puedes ejecutar:" -ForegroundColor Cyan
Write-Host "   docker-compose up" -ForegroundColor White
Write-Host ""
