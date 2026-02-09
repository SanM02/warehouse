# 🚀 GUÍA DE MIGRACIÓN A ARQUITECTURA V2

## ✨ Qué incluye la Arquitectura V2

### Mejoras Principales

✅ **PostgreSQL en Docker** (no nativo de Windows)
- Mayor portabilidad
- Backups más simples
- Independiente del SO

✅ **Valores por defecto robustos**
- Todas las variables tienen defaults en `docker-compose.yml`
- El sistema funciona incluso sin archivo `.env`

✅ **Healthchecks inteligentes**
- PostgreSQL: Verifica que responde
- Backend: Endpoint `/api/health/` que verifica DB
- Frontend: Endpoint `/health`

✅ **Volúmenes persistentes nombrados**
- `ferreteria_postgres_data`: Datos de PostgreSQL
- `ferreteria_backend_static`: Archivos estáticos
- `ferreteria_backend_media`: Archivos media
- `ferreteria_backend_logs`: Logs del backend

✅ **Scripts de gestión**
- `backup-db.ps1`: Backup automático con retención
- `restore-db.ps1`: Restaurar desde backup
- `diagnostico.ps1`: Verificar salud del sistema
- `migrar-a-v2.ps1`: Migración automática

---

## 📋 MIGRACIÓN AUTOMÁTICA (Recomendado)

### Opción 1: Script Automático

```powershell
# Ejecutar script de migración
.\scripts\docker\migrar-a-v2.ps1
```

El script hace TODO automáticamente:
1. ✅ Verifica backup existente
2. ✅ Detiene sistema actual
3. ✅ Levanta PostgreSQL en Docker
4. ✅ Importa datos
5. ✅ Levanta backend y frontend
6. ✅ Ejecuta diagnóstico

**Tiempo estimado: 5-10 minutos**

---

## 🛠️ MIGRACIÓN MANUAL (Paso a Paso)

### Paso 1: Backup de Seguridad

```powershell
# Exportar datos actuales (ya hecho)
$env:PGPASSWORD='solosanti'
pg_dump -U postgres -h localhost ferreteria_inventario > backups\backup_seguridad.sql
```

### Paso 2: Detener Sistema Actual

```powershell
# Detener contenedores actuales
docker-compose down
```

### Paso 3: Levantar PostgreSQL en Docker

```powershell
# Solo base de datos
docker-compose up -d db

# Esperar que esté healthy (30-60 segundos)
docker ps
```

### Paso 4: Importar Datos

```powershell
# Opción A: Con script
.\scripts\docker\restore-db.ps1 -BackupFile "backups\backup_seguridad.sql"

# Opción B: Manual
Get-Content backups\backup_seguridad.sql | docker exec -i ferreteria-db psql -U postgres -d ferreteria_inventario
```

### Paso 5: Levantar Todo el Sistema

```powershell
# Reconstruir y levantar
docker-compose up -d --build
```

### Paso 6: Verificar

```powershell
# Ejecutar diagnóstico
.\scripts\docker\diagnostico.ps1

# O verificar manualmente
docker-compose ps
curl http://localhost:8000/api/health/
curl http://localhost/health
```

---

## 🔍 VERIFICACIÓN POST-MIGRACIÓN

### 1. Estado de Contenedores

```powershell
docker-compose ps
```

Debería mostrar:
```
ferreteria-db       running (healthy)
ferreteria-api      running (healthy)
ferreteria-web      running (healthy)
```

### 2. Endpoints de Salud

- **Backend**: http://localhost:8000/api/health/
  - Respuesta esperada: `{"status":"healthy","database":"connected","service":"backend"}`

- **Frontend**: http://localhost/health
  - Respuesta esperada: `healthy`

### 3. Aplicación Funcional

- **Frontend**: http://localhost
- **Admin Django**: http://localhost:8000/admin/
- **Login**: Probar inicio de sesión

---

## 📦 BACKUPS AUTOMÁTICOS

### Configurar Backup Diario

**Windows Task Scheduler**:

1. Abrir Task Scheduler
2. Crear tarea básica:
   - **Nombre**: Backup Ferretería
   - **Trigger**: Diario a las 3:00 AM
   - **Acción**: Iniciar programa
   - **Programa**: `powershell.exe`
   - **Argumentos**: `-File "C:\Users\San\Desktop\SistemaJadi\scripts\docker\backup-db.ps1"`
   - **Directorio**: `C:\Users\San\Desktop\SistemaJadi`

### Backup Manual

```powershell
# Crear backup ahora
.\scripts\docker\backup-db.ps1

# Con retención personalizada (días)
.\scripts\docker\backup-db.ps1 -DiasRetencion 60
```

---

## 🔧 COMANDOS ÚTILES

### Gestión de Contenedores

```powershell
# Ver estado
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f db
docker-compose logs -f backend
docker-compose logs -f frontend

# Reiniciar un servicio
docker-compose restart backend

# Reconstruir imágenes
docker-compose up -d --build

# Detener todo
docker-compose down

# Detener y eliminar volúmenes (¡CUIDADO!)
docker-compose down -v
```

### Acceso Directo a PostgreSQL

```powershell
# Conectar a PostgreSQL desde Windows
docker exec -it ferreteria-db psql -U postgres -d ferreteria_inventario

# Ejecutar query desde PowerShell
docker exec ferreteria-db psql -U postgres -d ferreteria_inventario -c "SELECT COUNT(*) FROM inventario_producto;"
```

### Diagnóstico

```powershell
# Ejecutar diagnóstico completo
.\scripts\docker\diagnostico.ps1

# Ver salud de contenedores
docker inspect ferreteria-db --format='{{.State.Health.Status}}'
docker inspect ferreteria-api --format='{{.State.Health.Status}}'
docker inspect ferreteria-web --format='{{.State.Health.Status}}'
```

---

## 🔄 ROLLBACK (Volver a PostgreSQL Nativo)

Si algo sale mal, puedes volver al sistema anterior:

### 1. Detener Docker

```powershell
docker-compose down
```

### 2. Iniciar PostgreSQL Nativo

```powershell
Start-Service postgresql-x64-16
```

### 3. Restaurar docker-compose.yml Anterior

Cambiar en `docker-compose.yml`:
- Eliminar servicio `db`
- En backend: `DB_HOST: host.docker.internal`
- Eliminar `depends_on` del backend

### 4. Levantar Contenedores

```powershell
docker-compose up -d
```

---

## ⚠️ PROBLEMAS COMUNES Y SOLUCIONES

### Error: "No se puede conectar a la base de datos"

**Solución**:
```powershell
# Verificar que DB está healthy
docker inspect ferreteria-db --format='{{.State.Health.Status}}'

# Ver logs de DB
docker-compose logs db

# Reiniciar DB
docker-compose restart db
```

### Error: "Healthcheck failing"

**Solución**:
```powershell
# Verificar que curl está instalado en contenedores
docker exec ferreteria-api curl --version
docker exec ferreteria-web curl --version

# Si falta, reconstruir imágenes
docker-compose up -d --build
```

### Error: "Port 5432 already in use"

**Solución**: PostgreSQL nativo está corriendo

```powershell
# Detener PostgreSQL nativo
Stop-Service postgresql-x64-16

# O cambiar puerto en docker-compose.yml:
# ports: - "5433:5432"  # Usar 5433 en lugar de 5432
```

### Error: "Volume already exists"

**Solución**:
```powershell
# Eliminar volúmenes antiguos (¡CUIDADO: Elimina datos!)
docker volume rm ferreteria_postgres_data
docker volume rm ferreteria_backend_static
docker volume rm ferreteria_backend_media
docker volume rm ferreteria_backend_logs
```

---

## 📊 MONITOREO CONTINUO

### Dashboard de Logs

```powershell
# Ver logs de todos los servicios
docker-compose logs -f --tail=100
```

### Verificar Espacio en Disco

```powershell
# Ver espacio usado por Docker
docker system df

# Limpiar recursos no usados
docker system prune -a
```

### Probar Endpoints

```powershell
# Healthcheck backend
curl http://localhost:8000/api/health/

# Healthcheck frontend
curl http://localhost/health

# Login (probar autenticación)
Invoke-RestMethod -Uri "http://localhost:8000/api/token/" -Method POST -Body (@{username="admin";password="admin123"} | ConvertTo-Json) -ContentType "application/json"
```

---

## 🎯 VENTAJAS DE LA ARQUITECTURA V2

### ✅ Antes (PostgreSQL Nativo)
- Depende de instalación de Windows
- Difícil de migrar
- Backups complejos
- Requiere configuración manual

### ✅ Después (PostgreSQL Docker)
- 100% portable
- Migración = copiar carpeta
- Backups con un comando
- Auto-configurable con defaults

### 🔒 Seguridad de Datos

- **Volumen nombrado persistente**: Los datos están en disco físico
- **Backups automáticos**: Retención de 30 días por defecto
- **Healthchecks**: Detecta problemas automáticamente
- **Logs persistentes**: Auditoría completa

---

## 📞 SOPORTE

### Logs para Depuración

```powershell
# Logs completos del backend
docker-compose logs backend > logs_backend.txt

# Logs de PostgreSQL
docker-compose logs db > logs_db.txt

# Estado de salud
.\scripts\docker\diagnostico.ps1 > diagnostico.txt
```

---

## 🔐 SEGURIDAD POST-MIGRACIÓN

### 1. Cambiar Contraseñas

Editar `.env`:
```env
DB_PASSWORD=TuPasswordSegura123!@#
SECRET_KEY=GenerarNuevaClave...
```

Recrear contenedores:
```powershell
docker-compose down
docker-compose up -d
```

### 2. Deshabilitar PostgreSQL Nativo

```powershell
# Detener servicio
Stop-Service postgresql-x64-16

# Deshabilitar inicio automático
Set-Service postgresql-x64-16 -StartupType Disabled
```

### 3. Firewall (Opcional)

Si NO necesitas acceso externo a PostgreSQL:
```powershell
# Eliminar exposición del puerto en docker-compose.yml
# Cambiar:
#   ports:
#     - "5432:5432"
# Por: (comentar o eliminar la línea)
```

---

## ✅ CHECKLIST FINAL

- [ ] Backup creado y verificado
- [ ] PostgreSQL en Docker corriendo
- [ ] Datos importados correctamente
- [ ] Backend responde en `/api/health/`
- [ ] Frontend responde en `/health`
- [ ] Login funciona
- [ ] Productos se visualizan
- [ ] Backups automáticos configurados
- [ ] Diagnóstico ejecutado sin errores
- [ ] PostgreSQL nativo detenido (opcional)

---

## 🎉 ¡MIGRACIÓN EXITOSA!

Tu sistema ahora tiene:
- ✅ Máxima robustez
- ✅ Auto-recuperación
- ✅ Portabilidad total
- ✅ Backups automáticos
- ✅ Monitoreo de salud
- ✅ Preparado para 10+ años de operación

**Próximo paso**: Configurar backups automáticos en Task Scheduler
