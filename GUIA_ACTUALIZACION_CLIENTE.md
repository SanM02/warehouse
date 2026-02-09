# 🔄 GUÍA DE ACTUALIZACIÓN PARA CLIENTES

Esta guía te ayudará a actualizar el sistema en el cliente **SIN PERDER DATOS**.

---

## 📋 Pre-Requisitos

Antes de comenzar, asegúrate de tener:

- ✅ Acceso al servidor/PC del cliente donde está instalado el sistema
- ✅ Los archivos del sistema actualizado (en un USB, servidor compartido, etc.)
- ✅ Conexión a Internet (para reconstruir imágenes Docker)
- ✅ Credenciales de acceso al sistema

---

## 📦 Preparar la Actualización

### 1. Preparar los archivos en TU PC (desarrollo)

```powershell
# En tu PC de desarrollo, ejecutar:
cd C:\Users\San\Desktop\SistemaJadi

# Copiar SOLO los archivos necesarios a una carpeta para llevar al cliente
New-Item -ItemType Directory -Path "C:\ActualizacionCliente" -Force
Copy-Item .\cabravietnamirachamsinpeladobackend -Destination C:\ActualizacionCliente -Recurse
Copy-Item .\cabravietnamirachamsinpeladofrontend -Destination C:\ActualizacionCliente -Recurse
Copy-Item .\scripts -Destination C:\ActualizacionCliente -Recurse
Copy-Item .\docker-compose.yml -Destination C:\ActualizacionCliente
Copy-Item .\iniciar-sistema.ps1 -Destination C:\ActualizacionCliente
```

### 2. Transferir al cliente

- Copia `C:\ActualizacionCliente` a un **USB** o **servidor compartido**
- Llévalo al cliente

---

## 🚀 Proceso de Actualización en el Cliente

### OPCIÓN 1: Actualización Automática (Recomendado)

```powershell
# 1. Conectar el USB o acceder al servidor compartido con los archivos

# 2. Abrir PowerShell como Administrador

# 3. Ir al directorio de instalación del sistema
cd C:\SistemaFerreteria

# 4. Ejecutar el script de actualización
.\scripts\actualizar-cliente.ps1 -OrigenActualizacion "D:\ActualizacionCliente"
# (Cambia D:\ por la letra de tu USB o ruta del servidor)

# 5. El script hará TODO automáticamente:
#    - Backup de la BD actual
#    - Detener contenedores
#    - Copiar archivos nuevos
#    - Reconstruir imágenes
#    - Aplicar migraciones
#    - Reiniciar sistema
```

### OPCIÓN 2: Actualización Manual (Paso a Paso)

Si prefieres hacerlo manualmente o el script automático falla:

#### Paso 1: Backup de Base de Datos

```powershell
cd C:\SistemaFerreteria

# Crear backup manual
docker exec ferreteria-db pg_dump -U postgres ferreteria_inventario > "backups\backup_manual_$(Get-Date -Format 'yyyy-MM-dd_HH-mm').sql"
```

#### Paso 2: Detener Sistema

```powershell
docker-compose down
```

#### Paso 3: Copiar Archivos Nuevos

```powershell
# Copiar backend
Remove-Item .\cabravietnamirachamsinpeladobackend -Recurse -Force
Copy-Item D:\ActualizacionCliente\cabravietnamirachamsinpeladobackend -Destination . -Recurse

# Copiar frontend
Remove-Item .\cabravietnamirachamsinpeladofrontend -Recurse -Force
Copy-Item D:\ActualizacionCliente\cabravietnamirachamsinpeladofrontend -Destination . -Recurse

# Copiar scripts
Remove-Item .\scripts -Recurse -Force
Copy-Item D:\ActualizacionCliente\scripts -Destination . -Recurse

# Copiar configuraciones
Copy-Item D:\ActualizacionCliente\docker-compose.yml -Destination . -Force
Copy-Item D:\ActualizacionCliente\iniciar-sistema.ps1 -Destination . -Force
```

#### Paso 4: Reconstruir Imágenes Docker

```powershell
# Reconstruir backend y frontend con el nuevo código
docker-compose build --no-cache backend frontend
```

⏰ **Esto tomará 3-5 minutos** dependiendo de la velocidad del PC

#### Paso 5: Aplicar Migraciones de Base de Datos

```powershell
# Iniciar BD y backend
docker-compose up -d db backend

# Esperar 10 segundos
Start-Sleep -Seconds 10

# Aplicar migraciones
docker-compose exec backend python manage.py migrate
```

Verás algo como:
```
Running migrations:
  Applying inventario.0013_alter_producto_codigo... OK
```

#### Paso 6: Iniciar Sistema Completo

```powershell
# Iniciar todos los servicios
docker-compose up -d

# Verificar estado
docker-compose ps
```

Deberías ver:
```
NAME             STATUS
ferreteria-api   Up (healthy)
ferreteria-db    Up (healthy)
ferreteria-web   Up (healthy)
```

---

## ✅ Verificación Post-Actualización

### 1. Verificar que el sistema carga

Abrir navegador en: **http://localhost** o **http://localhost:4200**

### 2. Verificar funcionalidades nuevas

- ✅ Ir a **Inventario** → Verificar botones de editar/eliminar productos
- ✅ Crear/editar un producto → Precio venta se calcula automáticamente (+30%)
- ✅ Verificar que la descripción del producto se muestra
- ✅ Ir a **Historial de Facturas** → Crear una factura completa

### 3. Verificar datos existentes

- ✅ Los productos anteriores están todos ahí
- ✅ Las facturas anteriores no se perdieron
- ✅ Los clientes siguen existiendo

---

## 🆘 Solución de Problemas

### Problema: "Error al aplicar migraciones"

**Solución:**
```powershell
# Ver logs del backend
docker-compose logs backend

# Si hay conflictos, aplicar manualmente
docker-compose exec backend python manage.py showmigrations
docker-compose exec backend python manage.py migrate inventario
```

### Problema: "Contenedor no inicia correctamente"

**Solución:**
```powershell
# Ver logs del servicio problemático
docker-compose logs ferreteria-api
docker-compose logs ferreteria-web

# Reconstruir forzadamente
docker-compose build --no-cache
docker-compose up -d
```

### Problema: "Los datos se perdieron"

**Solución:**
```powershell
# Restaurar desde backup
.\scripts\docker\restore-db.ps1 -BackupFile "backups\backup_pre_actualizacion_2026-02-08_10-30-00.sql"

# Reiniciar sistema
docker-compose restart
```

---

## 📝 Cambios en Esta Actualización

### Nuevas Funcionalidades:

1. **Precio de Venta Automático**
   - El sistema ahora calcula automáticamente precio_venta = precio_costo + 30%
   - Se aplica en creación, edición y recepción de productos

2. **Edición Completa de Productos**
   - Botón "Editar" (amarillo) en ambas vistas de inventario
   - Modal para editar todos los campos del producto

3. **Código de Producto Opcional**
   - El campo "código" ya no es obligatorio
   - Útil para productos sin código de barras

4. **Descripción Visible**
   - La descripción del producto se muestra en las tablas
   - Más información visible sin entrar al detalle

5. **Facturas con Productos**
   - Historial de facturas ahora permite crear facturas completas
   - Similar a facturas de compra pero para ventas

### Migraciones de Base de Datos:

- **0013_alter_producto_codigo.py**: Hace el campo código opcional (nullable)

---

## 🔐 Seguridad y Backups

### Backups Automáticos

El sistema sigue haciendo backups automáticos cada noche a las 3 AM.

Para verificar:
```powershell
# Ver backups existentes
Get-ChildItem C:\SistemaFerreteria\backups

# Configurar backup automático (si no está configurado)
cd C:\SistemaFerreteria
.\scripts\ferreteria\configurar-backup-automatico.ps1
```

### Backup Manual Adicional

```powershell
cd C:\SistemaFerreteria\scripts\docker
.\backup-db.ps1
```

---

## 📞 Soporte

Si encuentras algún problema durante la actualización:

1. **Revisa los logs**: `docker-compose logs`
2. **Verifica el backup**: Existe en `C:\SistemaFerreteria\backups`
3. **Contacta soporte técnico** con:
   - Mensaje de error exacto
   - Logs del contenedor problemático
   - Ruta del backup de seguridad

---

## ⏰ Tiempo Estimado de Actualización

- **Automática**: 5-10 minutos
- **Manual**: 10-15 minutos

La mayor parte del tiempo es la reconstrucción de imágenes Docker.

---

## ✨ Mejoras Futuras

Para próximas actualizaciones, estamos trabajando en:

- 🔄 Sistema de actualización remota
- 📊 Dashboard de estadísticas
- 📱 Versión móvil responsive
- 🔔 Notificaciones de stock bajo
- 📄 Reportes en PDF mejorados

---

**Última actualización**: 8 de Febrero de 2026  
**Versión**: 2.1
