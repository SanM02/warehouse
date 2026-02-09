# ==========================================
# Script: Probar Sistema Localmente
# ==========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🧪 PRUEBA LOCAL DEL SISTEMA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$PROJECT_ROOT = "C:\Users\San\Desktop\SistemaJadi"
cd $PROJECT_ROOT

# Verificar PostgreSQL
Write-Host "🔍 Verificando PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql-x64-16" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -eq "Running") {
    Write-Host "✅ PostgreSQL está corriendo" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL no está corriendo o no está instalado" -ForegroundColor Red
    Write-Host "💡 Iniciar con: Start-Service postgresql-x64-16" -ForegroundColor Yellow
    exit 1
}

# Verificar Docker
Write-Host "🔍 Verificando Docker..." -ForegroundColor Yellow
docker --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker está instalado" -ForegroundColor Green
} else {
    Write-Host "❌ Docker no está instalado" -ForegroundColor Red
    exit 1
}

# Verificar archivo .env
Write-Host "🔍 Verificando configuración..." -ForegroundColor Yellow
if (Test-Path "$PROJECT_ROOT\.env") {
    Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Archivo .env no encontrado, creando desde .env.example..." -ForegroundColor Yellow
    Copy-Item "$PROJECT_ROOT\.env.example" "$PROJECT_ROOT\.env"
    Write-Host "✅ Archivo .env creado" -ForegroundColor Green
}

# Construir imágenes
Write-Host ""
Write-Host "🔨 Construyendo imágenes Docker..." -ForegroundColor Yellow
docker-compose build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al construir imágenes" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Imágenes construidas exitosamente" -ForegroundColor Green

# Levantar servicios
Write-Host ""
Write-Host "🚀 Levantando servicios..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al levantar servicios" -ForegroundColor Red
    exit 1
}

# Esperar a que los servicios estén listos
Write-Host ""
Write-Host "⏳ Esperando a que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Verificar estado
Write-Host ""
Write-Host "📊 Estado de contenedores:" -ForegroundColor Cyan
docker-compose ps

# Mostrar logs del backend
Write-Host ""
Write-Host "📋 Últimas líneas del backend:" -ForegroundColor Cyan
docker logs ferreteria-backend --tail 10

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ SISTEMA LEVANTADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 ACCESOS:" -ForegroundColor Cyan
Write-Host "   Frontend:   http://localhost:4200" -ForegroundColor White
Write-Host "   Backend:    http://localhost:8000/api" -ForegroundColor White
Write-Host "   Admin:      http://localhost:8000/admin" -ForegroundColor White
Write-Host ""
Write-Host "👤 CREDENCIALES:" -ForegroundColor Cyan
Write-Host "   Usuario:    admin" -ForegroundColor White
Write-Host "   Password:   admin123" -ForegroundColor White
Write-Host ""
Write-Host "📝 COMANDOS ÚTILES:" -ForegroundColor Cyan
Write-Host "   Ver logs:       docker-compose logs -f" -ForegroundColor White
Write-Host "   Reiniciar:      docker-compose restart" -ForegroundColor White
Write-Host "   Detener:        docker-compose down" -ForegroundColor White
Write-Host ""
Write-Host "💡 El frontend puede tardar unos segundos en cargar" -ForegroundColor Yellow
Write-Host ""

# Intentar abrir el navegador
Start-Sleep -Seconds 5
Write-Host "🌐 Abriendo navegador..." -ForegroundColor Yellow
Start-Process "http://localhost:4200"
