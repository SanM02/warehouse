# ==========================================
# Script: Detener Sistema Ferretería
# ==========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "⏸️  DETENIENDO SISTEMA FERRETERÍA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

cd C:\SistemaFerreteria

Write-Host "⏳ Deteniendo contenedores..." -ForegroundColor Yellow
docker-compose down

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Sistema detenido correctamente" -ForegroundColor Green
    Write-Host "💾 Los datos están seguros en PostgreSQL" -ForegroundColor White
} else {
    Write-Host "❌ Error al detener el sistema" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
