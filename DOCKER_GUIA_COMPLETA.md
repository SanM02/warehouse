# 🐳 GUÍA COMPLETA - SISTEMA FERRETERÍA DOCKERIZADO

## 📋 ÍNDICE
1. [Requisitos](#requisitos)
2. [Instalación en PC de Desarrollo](#instalación-desarrollo)
3. [Preparar Paquete para Ferretería](#preparar-paquete)
4. [Instalación en Ferretería](#instalación-ferretería)
5. [Uso Diario](#uso-diario)
6. [Backups](#backups)
7. [Solución de Problemas](#problemas)

---

## 🔧 REQUISITOS {#requisitos}

### PC de Desarrollo (con internet):
- Windows 10/11
- Docker Desktop instalado
- PostgreSQL 16 instalado
- Python 3.12+
- Node.js 18+

### PC de Ferretería (sin internet):
- Windows 10/11
- Mínimo 8 GB RAM
- 50 GB espacio en disco
- Docker Desktop (llevar instalador en USB)
- PostgreSQL 16 (llevar instalador en USB)

---

## 💻 INSTALACIÓN EN PC DE DESARROLLO {#instalación-desarrollo}

### 1. Configurar PostgreSQL Nativo

Editar archivo: `C:\Program Files\PostgreSQL\16\data\pg_hba.conf`

Agregar al final:
```conf
host    all             all             172.17.0.0/16           md5
host    all             all             172.18.0.0/16           md5
```

Reiniciar servicio PostgreSQL:
```powershell
Restart-Service postgresql-x64-16
```

### 2. Construir Imágenes Docker

```powershell
cd C:\Users\San\Desktop\SistemaJadi
docker-compose build
```

### 3. Probar Localmente

```powershell
docker-compose up -d
```

Acceder a:
- Frontend: http://localhost:4200
- Backend API: http://localhost:8000/api
- Admin: http://localhost:8000/admin (admin/admin123)

### 4. Detener

```powershell
docker-compose down
```

---

## 📦 PREPARAR PAQUETE PARA FERRETERÍA {#preparar-paquete}

### 1. Exportar Base de Datos

```powershell
.\scripts\export-database.ps1
```

Genera: `backups\backup_YYYY-MM-DD_HHMMSS.dump`

### 2. Exportar Imágenes Docker

```powershell
.\scripts\export-images.ps1
```

Genera en `docker-images\`:
- `ferreteria-backend_YYYY-MM-DD.tar`
- `ferreteria-frontend_YYYY-MM-DD.tar`
- `postgres-16_YYYY-MM-DD.tar`

### 3. TODO EN UNO (Recomendado)

```powershell
.\scripts\build-and-export.ps1
```

### 4. Preparar USB

Copiar en USB:
```
USB:/
├── instaladores/
│   ├── DockerDesktopInstaller.exe (descargar de docker.com)
│   └── postgresql-16-windows-x64.exe (descargar de postgresql.org)
├── imagenes/
│   ├── ferreteria-backend_YYYY-MM-DD.tar
│   ├── ferreteria-frontend_YYYY-MM-DD.tar
│   └── postgres-16_YYYY-MM-DD.tar
├── backup/
│   └── backup_YYYY-MM-DD_HHMMSS.dump
├── config/
│   ├── docker-compose.yml
│   └── .env
└── scripts/
    └── ferreteria/ (todos los scripts)
```

---

## 🏪 INSTALACIÓN EN FERRETERÍA {#instalación-ferretería}

### Paso 1: Instalar PostgreSQL

1. Ejecutar `postgresql-16-windows-x64.exe`
2. Password: `210671`
3. Puerto: `5432`
4. Instalar como servicio: **SÍ**

### Paso 2: Configurar PostgreSQL

Editar: `C:\Program Files\PostgreSQL\16\data\pg_hba.conf`

Agregar:
```conf
host    all             all             172.17.0.0/16           md5
host    all             all             172.18.0.0/16           md5
```

Reiniciar servicio:
```powershell
Restart-Service postgresql-x64-16
```

### Paso 3: Crear Base de Datos

```powershell
cd "C:\Program Files\PostgreSQL\16\bin"
.\psql.exe -U postgres -c "CREATE DATABASE ferreteria_inventario;"
```

Password: `210671`

### Paso 4: Restaurar Backup (Opcional)

Si tienes datos iniciales:
```powershell
.\pg_restore.exe -U postgres -d ferreteria_inventario C:\ruta\backup.dump
```

O dejar que Django cree las tablas vacías (recomendado para instalación nueva).

### Paso 5: Instalar Docker Desktop

1. Ejecutar `DockerDesktopInstaller.exe`
2. Reiniciar PC cuando lo solicite
3. Abrir Docker Desktop y esperar que inicie

### Paso 6: Copiar Archivos del Sistema

Copiar del USB a:
```
C:\SistemaFerreteria\
├── docker-compose.yml
├── .env
└── scripts\ferreteria\ (todos)
```

### Paso 7: Importar Imágenes Docker

```powershell
cd C:\SistemaFerreteria
docker load -i D:\imagenes\postgres-16_YYYY-MM-DD.tar
docker load -i D:\imagenes\ferreteria-backend_YYYY-MM-DD.tar
docker load -i D:\imagenes\ferreteria-frontend_YYYY-MM-DD.tar
```

### Paso 8: Levantar Sistema

```powershell
cd C:\SistemaFerreteria
.\scripts\ferreteria\iniciar-sistema.ps1
```

¡Listo! Acceder a http://localhost:4200

---

## 🔄 USO DIARIO {#uso-diario}

### Iniciar Sistema

```powershell
cd C:\SistemaFerreteria
.\scripts\ferreteria\iniciar-sistema.ps1
```

O manualmente:
```powershell
docker-compose up -d
```

### Detener Sistema

```powershell
.\scripts\ferreteria\detener-sistema.ps1
```

O manualmente:
```powershell
docker-compose down
```

### Ver Estado

```powershell
docker-compose ps
```

### Ver Logs

```powershell
# Todos los servicios
docker-compose logs -f

# Solo backend
docker logs ferreteria-backend -f

# Solo frontend
docker logs ferreteria-frontend -f
```

---

## 💾 BACKUPS {#backups}

### Backup Semanal Automático

El script `backup-semanal.ps1` debe ejecutarse **cada semana**.

#### Configurar Tarea Programada en Windows:

1. Abrir "Programador de tareas"
2. Crear tarea básica
3. Nombre: "Backup Semanal Ferretería"
4. Desencadenador: Semanal, día Domingo, 23:00
5. Acción: Iniciar programa
   - Programa: `powershell.exe`
   - Argumentos: `-ExecutionPolicy Bypass -File "C:\SistemaFerreteria\scripts\ferreteria\backup-semanal.ps1"`
6. Finalizar

### Backup Manual

```powershell
cd C:\SistemaFerreteria
.\scripts\ferreteria\backup-semanal.ps1
```

### Restaurar Backup

```powershell
.\scripts\ferreteria\restaurar-backup.ps1
```

Seguir las instrucciones en pantalla.

### Ubicación de Backups

```
C:\BackupsFerreteria\
├── backup_semanal_2025-11-23_230000.dump
├── backup_semanal_2025-11-30_230000.dump
├── backup_semanal_2025-12-07_230000.dump
└── backup_log.txt
```

**IMPORTANTE:** Los backups NO se eliminan automáticamente. Se mantienen PERMANENTEMENTE.

---

## 🔧 SOLUCIÓN DE PROBLEMAS {#problemas}

### Backend no conecta a PostgreSQL

**Síntoma:** Error "could not connect to server"

**Solución:**
1. Verificar que PostgreSQL está corriendo:
   ```powershell
   Get-Service postgresql-x64-16
   ```
2. Si está detenido, iniciarlo:
   ```powershell
   Start-Service postgresql-x64-16
   ```
3. Verificar configuración `pg_hba.conf`

### Frontend no carga

**Síntoma:** Página en blanco o error 502

**Solución:**
1. Verificar que backend está corriendo:
   ```powershell
   docker logs ferreteria-backend
   ```
2. Reiniciar contenedores:
   ```powershell
   docker-compose restart
   ```

### Contenedor no inicia

**Síntoma:** `docker-compose up` falla

**Solución:**
1. Ver logs detallados:
   ```powershell
   docker-compose logs
   ```
2. Verificar que no hay conflictos de puertos:
   ```powershell
   netstat -ano | findstr "4200"
   netstat -ano | findstr "8000"
   ```
3. Reconstruir contenedores:
   ```powershell
   docker-compose down
   docker-compose up -d --force-recreate
   ```

### Base de datos corrupta

**Síntoma:** Errores al hacer consultas

**Solución:**
1. Restaurar último backup:
   ```powershell
   .\scripts\ferreteria\restaurar-backup.ps1
   ```

### Olvidé la contraseña de admin

**Síntoma:** No puedo entrar al sistema

**Solución:**
```powershell
docker exec -it ferreteria-backend python manage.py changepassword admin
```

---

## 📞 SOPORTE

Para problemas no listados:
1. Revisar logs: `docker-compose logs`
2. Verificar servicios: `docker-compose ps`
3. Reiniciar sistema completo:
   ```powershell
   docker-compose down
   Restart-Service postgresql-x64-16
   docker-compose up -d
   ```

---

## 📊 ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────┐
│     PC FERRETERÍA (Windows)                 │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │      DOCKER DESKTOP                │    │
│  │                                    │    │
│  │  ┌──────────────────────────┐     │    │
│  │  │  Backend (Django)        │     │    │
│  │  │  Puerto: 8000            │     │    │
│  │  └──────────┬───────────────┘     │    │
│  │             │                      │    │
│  │             │ host.docker.internal │    │
│  │             │                      │    │
│  │  ┌──────────────────────────┐     │    │
│  │  │  Frontend (Angular)      │     │    │
│  │  │  Puerto: 4200            │     │    │
│  │  └──────────────────────────┘     │    │
│  └────────────────────────────────────┘    │
│                │                            │
│                │ TCP/IP                     │
│                ↓                            │
│  ┌────────────────────────────────────┐    │
│  │  PostgreSQL 16 NATIVO              │    │
│  │  Puerto: 5432                      │    │
│  │  BD: ferreteria_inventario         │    │
│  └────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE INSTALACIÓN

- [ ] PostgreSQL 16 instalado
- [ ] PostgreSQL configurado (pg_hba.conf)
- [ ] Base de datos creada
- [ ] Docker Desktop instalado
- [ ] Imágenes Docker importadas
- [ ] Archivos de configuración copiados
- [ ] Sistema levantado con éxito
- [ ] Acceso a frontend verificado
- [ ] Backup semanal programado
- [ ] Usuario admin funcional

---

**Versión:** 1.0  
**Fecha:** 23 de Noviembre 2025  
**Sistema:** Ferretería Inventario & Facturación
