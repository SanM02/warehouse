# Script para iniciar el sistema de ferretería después de suspensión
Write-Host "🚀 Iniciando Sistema de Ferretería..." -ForegroundColor Cyan

# Verificar si Docker Desktop está ejecutándose
$dockerProcess = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
if (-not $dockerProcess) {
    Write-Host "⚠️  Docker Desktop no está ejecutándose" -ForegroundColor Yellow
    Write-Host "   Iniciando Docker Desktop..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Write-Host "   Esperando 30 segundos para que Docker Desktop inicie..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
}

# Verificar PostgreSQL
Write-Host "`n📊 Verificando PostgreSQL..." -ForegroundColor Cyan
$pgService = Get-Service "postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -ne "Running") {
    Write-Host "   Iniciando PostgreSQL..." -ForegroundColor Yellow
    Start-Service $pgService.Name
    Start-Sleep -Seconds 3
}

# Ir al directorio del proyecto
Set-Location $PSScriptRoot

# Verificar estado de contenedores
Write-Host "`n🐳 Verificando contenedores Docker..." -ForegroundColor Cyan
docker-compose ps

# Reiniciar contenedores
Write-Host "`n🔄 Reiniciando contenedores..." -ForegroundColor Cyan
docker-compose restart

# Esperar a que los servicios estén listos
Write-Host "`n⏳ Esperando a que los servicios estén listos..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Verificar estado final
Write-Host "`n✅ Estado final de contenedores:" -ForegroundColor Green
docker-compose ps

Write-Host "`n🎉 Sistema listo!" -ForegroundColor Green
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:4200" -ForegroundColor White
Write-Host "`nPresiona cualquier tecla para cerrar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
