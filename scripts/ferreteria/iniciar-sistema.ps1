# ==========================================
# Script: Iniciar Sistema Ferretería
# ==========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 INICIANDO SISTEMA FERRETERÍA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

cd C:\SistemaFerreteria

Write-Host "⏳ Levantando contenedores..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Sistema iniciado exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Accesos:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:4200" -ForegroundColor White
    Write-Host "   Backend API: http://localhost:8000/api" -ForegroundColor White
    Write-Host "   Admin Django: http://localhost:8000/admin" -ForegroundColor White
    Write-Host ""
    Write-Host "👤 Usuario por defecto:" -ForegroundColor Cyan
    Write-Host "   Usuario: admin" -ForegroundColor White
    Write-Host "   Password: admin123" -ForegroundColor White
    Write-Host ""
    
    # Mostrar estado de contenedores
    Write-Host "📊 Estado de contenedores:" -ForegroundColor Cyan
    docker-compose ps
} else {
    Write-Host "❌ Error al iniciar el sistema" -ForegroundColor Red
    Write-Host "💡 Ver logs con: docker-compose logs" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
