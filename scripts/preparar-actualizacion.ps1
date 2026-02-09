# 🔄 Script de Preparación para Actualización

# Este script prepara los archivos necesarios para llevar al cliente
# Ejecutar en tu PC de desarrollo

param(
    [string]$DestinoUSB = "D:\ActualizacionCliente"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "   PREPARAR ACTUALIZACIÓN PARA CLIENTE" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ ERROR: Ejecutar este script desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

# Solicitar destino si no se proporcionó
if ($DestinoUSB -eq "") {
    Write-Host "📂 ¿Dónde desea preparar los archivos?" -ForegroundColor Yellow
    Write-Host "   Ejemplos: D:\ActualizacionCliente, E:\USB\Sistema, etc." -ForegroundColor Gray
    $DestinoUSB = Read-Host "Ingrese la ruta"
}

Write-Host ""
Write-Host "📦 Preparando actualización en: $DestinoUSB" -ForegroundColor Yellow
Write-Host ""

# Crear directorio destino
if (Test-Path $DestinoUSB) {
    Write-Host "⚠️  El directorio ya existe. Se sobrescribirá." -ForegroundColor Yellow
    $continuar = Read-Host "¿Continuar? (S/N)"
    if ($continuar -ne "S" -and $continuar -ne "s") {
        exit 0
    }
    Remove-Item $DestinoUSB -Recurse -Force
}

New-Item -ItemType Directory -Path $DestinoUSB -Force | Out-Null
Write-Host "✅ Directorio creado" -ForegroundColor Green
Write-Host ""

# Copiar backend
Write-Host "📁 Copiando Backend..." -ForegroundColor Cyan
Copy-Item .\cabravietnamirachamsinpeladobackend -Destination $DestinoUSB -Recurse -Force
Write-Host "   ✅ Backend copiado" -ForegroundColor Green

# Copiar frontend
Write-Host "📁 Copiando Frontend..." -ForegroundColor Cyan
Copy-Item .\cabravietnamirachamsinpeladofrontend -Destination $DestinoUSB -Recurse -Force
Write-Host "   ✅ Frontend copiado" -ForegroundColor Green

# Copiar scripts
Write-Host "📁 Copiando Scripts..." -ForegroundColor Cyan
Copy-Item .\scripts -Destination $DestinoUSB -Recurse -Force
Write-Host "   ✅ Scripts copiados" -ForegroundColor Green

# Copiar archivos de configuración
Write-Host "📁 Copiando configuraciones..." -ForegroundColor Cyan
Copy-Item .\docker-compose.yml -Destination $DestinoUSB -Force
Copy-Item .\docker-compose.produccion.yml -Destination $DestinoUSB -Force -ErrorAction SilentlyContinue
Copy-Item .\iniciar-sistema.ps1 -Destination $DestinoUSB -Force -ErrorAction SilentlyContinue
Write-Host "   ✅ Configuraciones copiadas" -ForegroundColor Green

# Copiar guías
Write-Host "📁 Copiando guías de actualización..." -ForegroundColor Cyan
Copy-Item .\GUIA_ACTUALIZACION_CLIENTE.md -Destination $DestinoUSB -Force -ErrorAction SilentlyContinue
Copy-Item .\CHECKLIST_ACTUALIZACION.md -Destination $DestinoUSB -Force -ErrorAction SilentlyContinue
Write-Host "   ✅ Guías copiadas" -ForegroundColor Green

# Crear archivo README en el destino
Write-Host "📝 Creando README..." -ForegroundColor Cyan
$readmeContent = @"
# ACTUALIZACIÓN SISTEMA FERRETERIA J&G

## 🚀 INICIO RÁPIDO

1. Conectar este USB/disco al servidor del cliente
2. Abrir PowerShell como Administrador
3. Ejecutar:

``````powershell
cd C:\SistemaFerreteria
.\scripts\actualizar-cliente.ps1 -OrigenActualizacion "D:\ActualizacionCliente"
``````

(Cambiar D:\ por la letra correcta del USB)

## 📚 Documentación

- **GUIA_ACTUALIZACION_CLIENTE.md**: Guía completa paso a paso
- **CHECKLIST_ACTUALIZACION.md**: Lista para imprimir y marcar

## 📋 Contenido

- cabravietnamirachamsinpeladobackend/: Código backend actualizado
- cabravietnamirachamsinpeladofrontend/: Código frontend actualizado
- scripts/: Scripts de actualización y mantenimiento
- docker-compose.yml: Configuración Docker

## ⚠️ IMPORTANTE

- El script hace backup automático ANTES de actualizar
- NO se pierden datos durante la actualización
- Tiempo estimado: 10-15 minutos

## 🆘 Soporte

En caso de problemas, contactar con soporte técnico.

---
Preparado el: $(Get-Date -Format "dd/MM/yyyy HH:mm")
"@

$readmeContent | Out-File -FilePath "$DestinoUSB\README.txt" -Encoding UTF8
Write-Host "   ✅ README creado" -ForegroundColor Green

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Green
Write-Host "         ✅ PREPARACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📂 Archivos listos en: $DestinoUSB" -ForegroundColor White
Write-Host ""

# Calcular tamaño total
$tamanoTotal = (Get-ChildItem $DestinoUSB -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "💾 Tamaño total: $([math]::Round($tamanoTotal, 2)) MB" -ForegroundColor White
Write-Host ""

# Listar archivos principales
Write-Host "📋 Archivos incluidos:" -ForegroundColor Yellow
Get-ChildItem $DestinoUSB -Directory | ForEach-Object {
    Write-Host "   📁 $($_.Name)" -ForegroundColor Gray
}
Get-ChildItem $DestinoUSB -File | ForEach-Object {
    Write-Host "   📄 $($_.Name)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Listo para llevar al cliente" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Siguiente paso:" -ForegroundColor Yellow
Write-Host "   1. Copiar $DestinoUSB a USB/servidor compartido" -ForegroundColor White
Write-Host "   2. Imprimir CHECKLIST_ACTUALIZACION.md" -ForegroundColor White
Write-Host "   3. Ir donde el cliente y ejecutar actualización" -ForegroundColor White
Write-Host ""

# Abrir explorador en el destino
Write-Host "¿Desea abrir la carpeta en el explorador? (S/N): " -NoNewline -ForegroundColor Yellow
$respuesta = Read-Host
if ($respuesta -eq "S" -or $respuesta -eq "s") {
    explorer $DestinoUSB
}

Write-Host ""
Write-Host "Presione cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
