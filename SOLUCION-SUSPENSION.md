# 🔧 Solución para Suspensión del Sistema

## Problema
Cuando la computadora entra en suspensión, Docker y PostgreSQL pierden la conexión, causando que no se carguen los datos.

## Soluciones Implementadas

### 1. ✨ Script de Inicio Rápido
Usa el script `iniciar-sistema.ps1` después de suspender la computadora:

```powershell
# Clic derecho en iniciar-sistema.ps1 → "Ejecutar con PowerShell"
```

O desde PowerShell:
```powershell
cd "C:\Users\San\Desktop\SistemaJadi"
.\iniciar-sistema.ps1
```

### 2. 🔄 Reintentos Automáticos
El frontend ahora reintenta automáticamente 3 veces cuando hay errores de conexión.

### 3. 🗄️ Conexión PostgreSQL Mejorada
- Timeout de conexión: 10 segundos
- Verificación automática de salud de conexiones
- Cierre de conexiones obsoletas

### 4. 🐳 Docker Auto-Restart
Los contenedores tienen `restart: unless-stopped`, lo que significa que Docker los reiniciará automáticamente.

## Uso Diario

### Opción 1: Script Automático (Recomendado)
1. Clic derecho en `iniciar-sistema.ps1`
2. Seleccionar "Ejecutar con PowerShell"
3. Esperar a que diga "Sistema listo!"

### Opción 2: Manual
```powershell
cd "C:\Users\San\Desktop\SistemaJadi"
docker-compose restart
```

### Opción 3: Desde el navegador
Si ves el error "No se encontraron productos":
1. Presiona F5 para recargar la página
2. El interceptor HTTP reintentará automáticamente

## Verificar Estado

Para ver si los contenedores están corriendo:
```powershell
cd "C:\Users\San\Desktop\SistemaJadi"
docker-compose ps
```

Deberías ver:
- ✅ `ferreteria-backend` - Up (healthy)
- ✅ `ferreteria-frontend` - Up

## Solución de Problemas

### Error: "No se pudo conectar con el servidor"
1. Verifica que Docker Desktop esté ejecutándose
2. Ejecuta: `docker-compose restart`
3. Espera 10 segundos y recarga la página (F5)

### Error: "Sesión expirada"
1. Cierra sesión
2. Vuelve a iniciar sesión
3. Los datos se cargarán automáticamente

### PostgreSQL no responde
1. Abre "Servicios" (services.msc)
2. Busca "postgresql"
3. Clic derecho → Iniciar

## Atajo de Teclado (Opcional)

Puedes crear un atajo en el escritorio:
1. Clic derecho en `iniciar-sistema.ps1`
2. "Crear acceso directo"
3. Mover el acceso directo al escritorio
4. Renombrar a "🚀 Iniciar Ferretería"

Ahora solo necesitas hacer doble clic en el icono después de suspender.
