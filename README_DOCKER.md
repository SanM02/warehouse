# 🐳 Sistema de Ferretería - Versión Dockerizada

## 🚀 INICIO RÁPIDO

### Para Desarrollo (tu PC):

```powershell
# 1. Levantar sistema
docker-compose up -d

# 2. Acceder
# Frontend: http://localhost:4200
# Backend: http://localhost:8000/api
# Admin: http://localhost:8000/admin (admin/admin123)

# 3. Detener
docker-compose down
```

### Para Producción (Ferretería):

Ver guía completa en: **[DOCKER_GUIA_COMPLETA.md](DOCKER_GUIA_COMPLETA.md)**

---

## 📁 ESTRUCTURA DEL PROYECTO

```
SistemaJadi/
├── cabravietnamirachamsinpeladobackend/    # Backend Django
│   ├── Dockerfile                          # Construcción backend
│   ├── docker-entrypoint.sh                # Script inicio
│   └── ...
├── cabravietnamirachamsinpeladofrontend/   # Frontend Angular
│   ├── Dockerfile                          # Construcción frontend
│   ├── nginx.conf                          # Servidor web
│   └── ...
├── scripts/                                # Scripts de ayuda
│   ├── export-database.ps1                 # Exportar BD
│   ├── export-images.ps1                   # Exportar Docker
│   ├── build-and-export.ps1                # TODO en uno
│   └── ferreteria/                         # Scripts para ferretería
│       ├── iniciar-sistema.ps1
│       ├── detener-sistema.ps1
│       ├── backup-semanal.ps1
│       └── restaurar-backup.ps1
├── docker-compose.yml                      # Orquestación
├── .env                                    # Variables de entorno
└── DOCKER_GUIA_COMPLETA.md                 # Documentación completa
```

---

## 🔧 COMANDOS ÚTILES

### Construir imágenes:
```powershell
docker-compose build
```

### Levantar sistema:
```powershell
docker-compose up -d
```

### Ver logs:
```powershell
docker-compose logs -f
```

### Ver estado:
```powershell
docker-compose ps
```

### Detener sistema:
```powershell
docker-compose down
```

### Exportar para ferretería:
```powershell
.\scripts\build-and-export.ps1
```

---

## 💾 BACKUPS

### Backup manual:
```powershell
.\scripts\export-database.ps1
```

### Backup semanal (ferretería):
```powershell
.\scripts\ferreteria\backup-semanal.ps1
```

Los backups se guardan en `C:\BackupsFerreteria\` y **NUNCA se eliminan automáticamente**.

---

## 🏗️ ARQUITECTURA

- **PostgreSQL:** Nativo en Windows (máxima durabilidad)
- **Backend:** Docker (Django + Gunicorn)
- **Frontend:** Docker (Angular + Nginx)

---

## 📚 DOCUMENTACIÓN

- **Guía Completa:** [DOCKER_GUIA_COMPLETA.md](DOCKER_GUIA_COMPLETA.md)
- **Backend README:** [cabravietnamirachamsinpeladobackend/README.md](cabravietnamirachamsinpeladobackend/README.md)
- **Frontend README:** [cabravietnamirachamsinpeladofrontend/README.md](cabravietnamirachamsinpeladofrontend/README.md)

---

## 🔐 CREDENCIALES POR DEFECTO

**Superusuario Django:**
- Usuario: `admin`
- Password: `admin123`

**PostgreSQL:**
- Usuario: `postgres`
- Password: `210671`
- Base de datos: `ferreteria_inventario`

⚠️ **Cambiar en producción**

---

## 🆘 AYUDA

Ver sección "Solución de Problemas" en [DOCKER_GUIA_COMPLETA.md](DOCKER_GUIA_COMPLETA.md)
