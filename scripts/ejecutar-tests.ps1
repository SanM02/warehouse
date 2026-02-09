# Script para ejecutar TODOS los tests del sistema
# Ejecutar desde: c:\Users\San\Desktop\SistemaJadi

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  EJECUTANDO TODOS LOS TESTS DEL SISTEMA" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que los contenedores estén corriendo
Write-Host "📦 Verificando contenedores..." -ForegroundColor Yellow
$containers = docker ps --format "{{.Names}}" | Select-String "ferreteria-api"

if (-not $containers) {
    Write-Host "⚠️  Contenedores no están corriendo. Iniciando..." -ForegroundColor Yellow
    docker-compose up -d
    Start-Sleep -Seconds 10
}

Write-Host "✓ Contenedores activos" -ForegroundColor Green
Write-Host ""

# Ejecutar tests
Write-Host "🧪 Ejecutando 83 tests..." -ForegroundColor Yellow
Write-Host ""

docker exec ferreteria-api python manage.py test inventario --verbosity=2

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  TESTS COMPLETADOS" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ver resumen en:" -ForegroundColor White
Write-Host "  - TESTS_RESUMEN_EJECUTIVO.md" -ForegroundColor Cyan
Write-Host "  - RESUMEN_TESTS_COMPLETO_FINAL.md" -ForegroundColor Cyan
Write-Host ""
