# ========================================== 
# MIGRACIÓN A ARQUITECTURA V2
# ==========================================
# Este script migra de PostgreSQL nativo a PostgreSQL en Docker
# con todas las mejoras de robustez del Plan V2

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=========================================="  -ForegroundColor Cyan
Write-Host "🚀 MIGRACIÓN A ARQUITECTURA V2" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este proceso incluye:" -ForegroundColor White
Write-Host "  ✅ PostgreSQL en Docker (no nativo)" -ForegroundColor Gray
Write-Host "  ✅ Valores por defecto robustos" -ForegroundColor Gray
Write-Host "  ✅ Healthchecks inteligentes" -ForegroundColor Gray
Write-Host "  ✅ Volúmenes persistentes" -ForegroundColor Gray
Write-Host "  ✅ Scripts de backup y diagnóstico" -ForegroundColor Gray
Write-Host ""

# ==========================================
# PASO 1: Verificar backup existente
# ==========================================
Write-Host "PASO 1: Verificando backup de datos..." -ForegroundColor Yellow
$latestBackup = Get-ChildItem .\backups\backup_pre_migracion_*.sql | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($latestBackup) {
    Write-Host "✅ Backup encontrado: $($latestBackup.Name)" -ForegroundColor Green
    Write-Host "   Tamaño: $([math]::Round($latestBackup.Length / 1KB, 2)) KB" -ForegroundColor Gray
    Write-Host "   Fecha: $($latestBackup.LastWriteTime)" -ForegroundColor Gray
} else {
    Write-Host "❌ No se encontró backup reciente" -ForegroundColor Red
    Write-Host "   Ejecute primero: pg_dump -U postgres ferreteria_inventario > backups\backup_pre_migracion.sql" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# ==========================================
# PASO 2: Detener sistema actual
# ==========================================
Write-Host "PASO 2: Deteniendo sistema actual..." -ForegroundColor Yellow
docker-compose down 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Sistema detenido" -ForegroundColor Green
} else {
    Write-Host "⚠️  No había contenedores corriendo" -ForegroundColor Gray
}
Write-Host ""

# ==========================================
# PASO 3: Limpiar volúmenes antiguos (opcional)
# ==========================================
Write-Host "PASO 3: ¿Desea limpiar volúmenes antiguos? (OPCIONAL)" -ForegroundColor Yellow
Write-Host "   Esto eliminará datos antiguos en volúmenes Docker" -ForegroundColor Gray
$limpiar = Read-Host "Limpiar volúmenes? (s/N)"

if ($limpiar -eq "s" -or $limpiar -eq "S") {
    docker volume rm ferreteria_backend_static 2>$null
    docker volume rm ferreteria_backend_media 2>$null
    docker volume rm ferreteria_backend_logs 2>$null
    Write-Host "✅ Volúmenes limpiados" -ForegroundColor Green
} else {
    Write-Host "⏭️  Saltando limpieza de volúmenes" -ForegroundColor Gray
}
Write-Host ""

# ==========================================
# PASO 4: Levantar PostgreSQL en Docker
# ==========================================
Write-Host "PASO 4: Iniciando PostgreSQL en Docker..." -ForegroundColor Yellow
docker-compose up -d db

Write-Host "   Esperando a que PostgreSQL esté healthy..." -ForegroundColor Gray
$maxRetries = 30
$retries = 0

while ($retries -lt $maxRetries) {
    $health = docker inspect ferreteria-db --format='{{.State.Health.Status}}' 2>$null
    
    if ($health -eq "healthy") {
        Write-Host "✅ PostgreSQL corriendo y healthy" -ForegroundColor Green
        break
    }
    
    $retries++
    Write-Host "   Intento $retries/$maxRetries..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

if ($retries -eq $maxRetries) {
    Write-Host "❌ PostgreSQL no está healthy después de $maxRetries intentos" -ForegroundColor Red
    Write-Host "   Revise logs: docker-compose logs db" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# ==========================================
# PASO 5: Importar datos
# ==========================================
Write-Host "PASO 5: Importando datos desde backup..." -ForegroundColor Yellow
Write-Host "   Archivo: $($latestBackup.FullName)" -ForegroundColor Gray
Write-Host "   Esto puede tardar varios minutos..." -ForegroundColor Gray

try {
    Get-Content $latestBackup.FullName | docker exec -i ferreteria-db psql -U postgres -d ferreteria_inventario 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Datos importados exitosamente" -ForegroundColor Green
    } else {
        throw "Error al importar datos"
    }
} catch {
    Write-Host "❌ ERROR al importar datos: $_" -ForegroundColor Red
    Write-Host "   Puede intentar manualmente: .\scripts\docker\restore-db.ps1 -BackupFile '$($latestBackup.FullName)'" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# ==========================================
# PASO 6: Levantar backend y frontend
# ==========================================
Write-Host "PASO 6: Levantando backend y frontend..." -ForegroundColor Yellow
docker-compose up -d --build

Write-Host "   Esperando a que los servicios estén healthy..." -ForegroundColor Gray
Start-Sleep -Seconds 30

Write-Host "✅ Servicios iniciados" -ForegroundColor Green
Write-Host ""

# ==========================================
# PASO 7: Verificar salud del sistema
# ==========================================
Write-Host "PASO 7: Ejecutando diagnóstico..." -ForegroundColor Yellow
Write-Host ""

& ".\scripts\docker\diagnostico.ps1"

# ==========================================
# RESUMEN FINAL
# ==========================================
Write-Host ""
Write-Host "=========================================="  -ForegroundColor Cyan
Write-Host "🎉 MIGRACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Acciones post-migración:" -ForegroundColor White
Write-Host ""
Write-Host "1. Verificar que la aplicación funciona:" -ForegroundColor Yellow
Write-Host "   http://localhost" -ForegroundColor White
Write-Host "   http://localhost:8000/admin" -ForegroundColor White
Write-Host ""
Write-Host "2. Configurar backups automáticos:" -ForegroundColor Yellow
Write-Host "   Task Scheduler -> .\scripts\docker\backup-db.ps1" -ForegroundColor White
Write-Host ""
Write-Host "3. (Opcional) Detener PostgreSQL nativo de Windows:" -ForegroundColor Yellow
Write-Host "   Stop-Service postgresql-x64-16" -ForegroundColor White
Write-Host ""
Write-Host "4. Ver logs en tiempo real:" -ForegroundColor Yellow
Write-Host "   docker-compose logs -f" -ForegroundColor White
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
