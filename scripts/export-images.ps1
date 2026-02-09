# ==========================================
# Script: Exportar Imágenes Docker
# ==========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🐳 EXPORTAR IMÁGENES DOCKER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$EXPORT_DIR = "C:\Users\San\Desktop\SistemaJadi\docker-images"
$FECHA = Get-Date -Format "yyyy-MM-dd"

# Crear directorio de exportación si no existe
if (-not (Test-Path $EXPORT_DIR)) {
    New-Item -ItemType Directory -Path $EXPORT_DIR | Out-Null
    Write-Host "✅ Directorio de exportación creado: $EXPORT_DIR" -ForegroundColor Green
}

# Exportar imagen del backend
Write-Host "⏳ Exportando imagen del backend..." -ForegroundColor Yellow
docker save -o "$EXPORT_DIR\ferreteria-backend_$FECHA.tar" ferreteria-backend:latest
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend exportado exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al exportar backend" -ForegroundColor Red
}

# Exportar imagen del frontend
Write-Host "⏳ Exportando imagen del frontend..." -ForegroundColor Yellow
docker save -o "$EXPORT_DIR\ferreteria-frontend_$FECHA.tar" ferreteria-frontend:latest
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend exportado exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al exportar frontend" -ForegroundColor Red
}

# Exportar imagen de PostgreSQL
Write-Host "⏳ Exportando imagen de PostgreSQL..." -ForegroundColor Yellow
docker pull postgres:16
docker save -o "$EXPORT_DIR\postgres-16_$FECHA.tar" postgres:16
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PostgreSQL exportado exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al exportar PostgreSQL" -ForegroundColor Red
}

# Mostrar tamaños
Write-Host ""
Write-Host "📊 Tamaños de los archivos:" -ForegroundColor Cyan
Get-ChildItem "$EXPORT_DIR\*_$FECHA.tar" | ForEach-Object {
    $size = $_.Length / 1MB
    Write-Host "   $($_.Name): $([math]::Round($size, 2)) MB" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 Imágenes exportadas en: $EXPORT_DIR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
