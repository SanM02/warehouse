# ========================================== 
# Script de Diagnóstico del Sistema
# ==========================================
# Verifica la salud completa del sistema Docker

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "=========================================="  -ForegroundColor Cyan
Write-Host "🔍 DIAGNÓSTICO DEL SISTEMA DE FERRETERÍA" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$allOk = $true

# ==========================================
# 1. Verificar Docker
# ==========================================
Write-Host "1️⃣  Verificando Docker..." -ForegroundColor Yellow
$dockerVersion = docker --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Docker instalado: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Docker no está instalado o no responde" -ForegroundColor Red
    $allOk = $false
}
Write-Host ""

# ==========================================
# 2. Estado de Contenedores
# ==========================================
Write-Host "2️⃣  Estado de contenedores:" -ForegroundColor Yellow
Write-Host ""

$containers = @("ferreteria-db", "ferreteria-api", "ferreteria-web")

foreach ($container in $containers) {
    $state = docker inspect $container --format='{{.State.Status}}' 2>$null
    $health = docker inspect $container --format='{{.State.Health.Status}}' 2>$null
    
    if ($state -eq "running") {
        Write-Host "   📦 $container" -ForegroundColor White
        Write-Host "      Estado: $state" -ForegroundColor Green
        
        if ($health) {
            if ($health -eq "healthy") {
                Write-Host "      Health: $health" -ForegroundColor Green
            } else {
                Write-Host "      Health: $health" -ForegroundColor Yellow
                $allOk = $false
            }
        }
    } else {
        Write-Host "   📦 $container" -ForegroundColor White
        Write-Host "      Estado: $state (❌ NO CORRIENDO)" -ForegroundColor Red
        $allOk = $false
    }
    Write-Host ""
}

# ==========================================
# 3. Healthchecks HTTP
# ==========================================
Write-Host "3️⃣  Verificando endpoints de salud:" -ForegroundColor Yellow
Write-Host ""

# Backend
Write-Host "   🔌 Backend (http://localhost:8000/api/health/)..." -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health/" -UseBasicParsing -TimeoutSec 5 2>$null
    if ($response.StatusCode -eq 200) {
        Write-Host "      ✅ Responde OK (200)" -ForegroundColor Green
    } else {
        Write-Host "      ⚠️  Responde con código $($response.StatusCode)" -ForegroundColor Yellow
        $allOk = $false
    }
} catch {
    Write-Host "      ❌ No responde" -ForegroundColor Red
    $allOk = $false
}
Write-Host ""

# Frontend
Write-Host "   🌐 Frontend (http://localhost/health)..." -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "http://localhost/health" -UseBasicParsing -TimeoutSec 5 2>$null
    if ($response.StatusCode -eq 200) {
        Write-Host "      ✅ Responde OK (200)" -ForegroundColor Green
    } else {
        Write-Host "      ⚠️  Responde con código $($response.StatusCode)" -ForegroundColor Yellow
        $allOk = $false
    }
} catch {
    Write-Host "      ❌ No responde" -ForegroundColor Red
    $allOk = $false
}
Write-Host ""

# Frontend alternativo (puerto 4200)
Write-Host "   🌐 Frontend alternativo (http://localhost:4200/health)..." -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4200/health" -UseBasicParsing -TimeoutSec 5 2>$null
    if ($response.StatusCode -eq 200) {
        Write-Host "      ✅ Responde OK (200)" -ForegroundColor Green
    } else {
        Write-Host "      ⚠️  Responde con código $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "      ⚠️  No responde (esperado si solo usa puerto 80)" -ForegroundColor Gray
}
Write-Host ""

# ==========================================
# 4. Volúmenes Docker
# ==========================================
Write-Host "4️⃣  Volúmenes Docker:" -ForegroundColor Yellow
Write-Host ""

$volumes = @("ferreteria_postgres_data", "ferreteria_backend_static", "ferreteria_backend_media", "ferreteria_backend_logs")

foreach ($vol in $volumes) {
    $exists = docker volume inspect $vol 2>$null
    if ($exists) {
        Write-Host "   ✅ $vol" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $vol (no existe)" -ForegroundColor Red
        $allOk = $false
    }
}
Write-Host ""

# ==========================================
# 5. Red Docker
# ==========================================
Write-Host "5️⃣  Red Docker:" -ForegroundColor Yellow
$network = docker network inspect ferreteria-network 2>$null
if ($network) {
    Write-Host "   ✅ ferreteria-network existe" -ForegroundColor Green
} else {
    Write-Host "   ❌ ferreteria-network no existe" -ForegroundColor Red
    $allOk = $false
}
Write-Host ""

# ==========================================
# 6. Espacio en Disco
# ==========================================
Write-Host "6️⃣  Espacio en disco:" -ForegroundColor Yellow
$disk = Get-PSDrive C 2>$null
if ($disk) {
    $freeGB = [math]::Round($disk.Free / 1GB, 2)
    $usedGB = [math]::Round($disk.Used / 1GB, 2)
    $totalGB = [math]::Round(($disk.Free + $disk.Used) / 1GB, 2)
    
    Write-Host "   Unidad C:\" -ForegroundColor White
    Write-Host "      Total: $totalGB GB" -ForegroundColor Gray
    Write-Host "      Usado: $usedGB GB" -ForegroundColor Gray
    Write-Host "      Libre: $freeGB GB" -ForegroundColor Gray
    
    if ($freeGB -lt 5) {
        Write-Host "      ⚠️  ADVERTENCIA: Menos de 5GB libres" -ForegroundColor Yellow
        $allOk = $false
    } else {
        Write-Host "      ✅ Espacio suficiente" -ForegroundColor Green
    }
}
Write-Host ""

# ==========================================
# 7. Logs Recientes
# ==========================================
Write-Host "7️⃣  Últimas líneas de logs:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   📋 Backend (últimas 3 líneas):" -ForegroundColor White
docker logs ferreteria-api --tail 3 2>$null | ForEach-Object {
    Write-Host "      $_" -ForegroundColor Gray
}
Write-Host ""

# ==========================================
# RESUMEN FINAL
# ==========================================
Write-Host "==========================================" -ForegroundColor Cyan
if ($allOk) {
    Write-Host "✅ SISTEMA OPERANDO CORRECTAMENTE" -ForegroundColor Green
} else {
    Write-Host "⚠️  SE DETECTARON PROBLEMAS" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Acciones recomendadas:" -ForegroundColor Yellow
    Write-Host "  1. Revisar logs: docker-compose logs" -ForegroundColor White
    Write-Host "  2. Reiniciar servicios: docker-compose restart" -ForegroundColor White
    Write-Host "  3. Reconstruir si es necesario: docker-compose up -d --build" -ForegroundColor White
}
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
