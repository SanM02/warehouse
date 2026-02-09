# ==========================================
# Script: Construir y Exportar Todo
# ==========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 BUILD Y EXPORTACIÓN COMPLETA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$PROJECT_ROOT = "C:\Users\San\Desktop\SistemaJadi"
cd $PROJECT_ROOT

# 1. Construir imágenes Docker
Write-Host "🔨 Paso 1: Construyendo imágenes Docker..." -ForegroundColor Yellow
docker-compose build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al construir imágenes" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Imágenes construidas exitosamente" -ForegroundColor Green
Write-Host ""

# 2. Exportar base de datos
Write-Host "📦 Paso 2: Exportando base de datos..." -ForegroundColor Yellow
& "$PROJECT_ROOT\scripts\export-database.ps1"
Write-Host ""

# 3. Exportar imágenes Docker
Write-Host "🐳 Paso 3: Exportando imágenes Docker..." -ForegroundColor Yellow
& "$PROJECT_ROOT\scripts\export-images.ps1"
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 TODO EXPORTADO EXITOSAMENTE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📁 Archivos generados en:" -ForegroundColor White
Write-Host "   - Backups BD: $PROJECT_ROOT\backups\" -ForegroundColor White
Write-Host "   - Imágenes Docker: $PROJECT_ROOT\docker-images\" -ForegroundColor White
