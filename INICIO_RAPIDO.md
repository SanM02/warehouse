# ⚡ INICIO RÁPIDO - Sistema Ferretería Dockerizado

## 🚀 PARA TI (DESARROLLO) - AHORA MISMO

### 1. Probar el Sistema Localmente

```powershell
# Abrir PowerShell en la carpeta del proyecto
cd C:\Users\San\Desktop\SistemaJadi

# Ejecutar script de prueba
.\scripts\test-local.ps1
```

Esto hará:
- ✅ Verificar que PostgreSQL esté corriendo
- ✅ Verificar que Docker esté instalado
- ✅ Construir las imágenes
- ✅ Levantar el sistema
- ✅ Abrir el navegador automáticamente

**Acceso:** http://localhost:4200  
**Usuario:** admin  
**Password:** admin123

---

### 2. Cuando Todo Funcione - Exportar para Ferretería

```powershell
# Un solo comando que hace todo
.\scripts\build-and-export.ps1
```

Esto generará:
```
C:\Users\San\Desktop\SistemaJadi\
├── backups\
│   └── backup_2025-11-23_HHMMSS.dump
└── docker-images\
    ├── ferreteria-backend_2025-11-23.tar
    ├── ferreteria-frontend_2025-11-23.tar
    └── postgres-16_2025-11-23.tar
```

---

### 3. Preparar USB para Ferretería

**Descargar (con internet):**
1. Docker Desktop: https://www.docker.com/products/docker-desktop/
2. PostgreSQL 16: https://www.postgresql.org/download/windows/

**Copiar en USB:**
```
USB:/
├── instaladores/
│   ├── DockerDesktopInstaller.exe
│   └── postgresql-16-windows-x64.exe
├── imagenes/
│   ├── ferreteria-backend_2025-11-23.tar
│   ├── ferreteria-frontend_2025-11-23.tar
│   └── postgres-16_2025-11-23.tar
├── config/
│   ├── docker-compose.yml (de la raíz del proyecto)
│   └── .env (de la raíz del proyecto)
├── scripts\ferreteria\ (copiar toda la carpeta)
└── DOCKER_GUIA_COMPLETA.md (documentación)
```

---

## 🏪 EN LA FERRETERÍA (SIN INTERNET)

### Instalación (Solo una vez - 30 minutos)

Seguir **DOCKER_GUIA_COMPLETA.md** paso a paso, o resumido:

1. **Instalar PostgreSQL 16** (del USB)
2. **Configurar pg_hba.conf** (permitir Docker)
3. **Crear base de datos** `ferreteria_inventario`
4. **Instalar Docker Desktop** (del USB)
5. **Copiar archivos** a `C:\SistemaFerreteria`
6. **Importar imágenes:**
   ```powershell
   docker load -i imagenes\ferreteria-backend_2025-11-23.tar
   docker load -i imagenes\ferreteria-frontend_2025-11-23.tar
   docker load -i imagenes\postgres-16_2025-11-23.tar
   ```
7. **Levantar sistema:**
   ```powershell
   .\scripts\ferreteria\iniciar-sistema.ps1
   ```
8. **Configurar backup automático** (ver CONFIGURAR_BACKUP_AUTOMATICO.md)

### Uso Diario

**Iniciar:**
```powershell
C:\SistemaFerreteria\scripts\ferreteria\iniciar-sistema.ps1
```

**Detener:**
```powershell
C:\SistemaFerreteria\scripts\ferreteria\detener-sistema.ps1
```

**Acceso:** http://localhost:4200

---

## 📋 CHECKLIST ANTES DE IR A LA FERRETERÍA

- [ ] Sistema probado localmente (funciona perfecto)
- [ ] Exportado: BD y imágenes Docker
- [ ] Descargado: Docker Desktop installer
- [ ] Descargado: PostgreSQL 16 installer
- [ ] TODO copiado en USB
- [ ] Documentación impresa (DOCKER_GUIA_COMPLETA.md)
- [ ] Laptop con USB listo para llevar

---

## 🆘 PROBLEMAS COMUNES

### "No conecta al backend"
```powershell
# Verificar que PostgreSQL está corriendo
Get-Service postgresql-x64-16
Start-Service postgresql-x64-16
```

### "Frontend no carga"
```powershell
# Ver logs
docker logs ferreteria-frontend
docker logs ferreteria-backend

# Reiniciar
docker-compose restart
```

### "Olvidé la contraseña"
```powershell
docker exec -it ferreteria-backend python manage.py changepassword admin
```

---

## 📞 DOCUMENTACIÓN COMPLETA

- **Guía Completa:** DOCKER_GUIA_COMPLETA.md
- **Resumen Implementación:** RESUMEN_IMPLEMENTACION.md
- **Configurar Backup:** CONFIGURAR_BACKUP_AUTOMATICO.md

---

## 🎯 LO MÁS IMPORTANTE

1. **PostgreSQL es NATIVO** (no en Docker)
   - Datos ultra-seguros
   - Durará 10+ años
   
2. **Backups SEMANALES AUTOMÁTICOS**
   - Cada domingo 23:00
   - NUNCA se eliminan
   - Ubicación: `C:\BackupsFerreteria\`
   
3. **Backend y Frontend en Docker**
   - Fácil actualizar
   - Portable
   - Aislado

---

## ✅ ¿TODO LISTO?

```powershell
# 1. AHORA: Probar
.\scripts\test-local.ps1

# 2. DESPUÉS: Exportar
.\scripts\build-and-export.ps1

# 3. PREPARAR USB con:
#    - Instaladores
#    - Imágenes Docker
#    - Backup BD (opcional)
#    - Configuración
#    - Scripts
#    - Documentación

# 4. IR A FERRETERÍA
#    Seguir DOCKER_GUIA_COMPLETA.md
```

---

**¡Éxito!** 🚀
