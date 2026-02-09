# 📅 CONFIGURAR BACKUP SEMANAL AUTOMÁTICO

## 🎯 OBJETIVO
Ejecutar backup automático cada domingo a las 23:00

---

## 📋 PASOS PARA CONFIGURAR

### 1. Abrir Programador de Tareas

- Presionar `Win + R`
- Escribir: `taskschd.msc`
- Presionar Enter

### 2. Crear Nueva Tarea

1. Click derecho en "Biblioteca del Programador de tareas"
2. Seleccionar "Crear tarea básica..."

### 3. Configurar Tarea

#### Pestaña "General":
- **Nombre:** `Backup Semanal Ferretería`
- **Descripción:** `Backup automático de la base de datos del sistema de ferretería`
- **Opciones de seguridad:**
  - ☑ Ejecutar con los privilegios más altos
  - ☑ Ejecutar tanto si el usuario inició sesión como si no

#### Pestaña "Desencadenadores":
1. Click en "Nuevo..."
2. Configurar:
   - **Iniciar la tarea:** Según una programación
   - **Configuración:** Semanal
   - **Repetir cada:** 1 semana
   - **Días:** ☑ Domingo
   - **Hora:** 23:00:00
   - **Activado:** ☑ Sí

#### Pestaña "Acciones":
1. Click en "Nuevo..."
2. Configurar:
   - **Acción:** Iniciar un programa
   - **Programa o script:**
     ```
     powershell.exe
     ```
   - **Agregar argumentos:**
     ```
     -ExecutionPolicy Bypass -NoProfile -File "C:\SistemaFerreteria\scripts\ferreteria\backup-semanal.ps1"
     ```
   - **Iniciar en:**
     ```
     C:\SistemaFerreteria
     ```

#### Pestaña "Condiciones":
- ☐ Iniciar la tarea solo si el equipo está conectado a la corriente alterna (desmarcar)
- ☑ Activar la tarea si el equipo no se está usando (opcional)

#### Pestaña "Configuración":
- ☑ Permitir que la tarea se ejecute a petición
- ☑ Ejecutar la tarea tan pronto como sea posible después de perder una ejecución programada
- ☑ Si la tarea falla, reiniciarla cada: 1 minuto (3 intentos)

### 4. Guardar

Click en "Aceptar"

---

## ✅ VERIFICAR CONFIGURACIÓN

### Ejecutar Manualmente:
1. Buscar la tarea "Backup Semanal Ferretería"
2. Click derecho → "Ejecutar"
3. Verificar que se crea el backup en `C:\BackupsFerreteria\`

### Ver Historial:
1. Click en la tarea
2. Pestaña "Historial"
3. Revisar ejecuciones

---

## 📂 UBICACIÓN DE BACKUPS

```
C:\BackupsFerreteria\
├── backup_semanal_2025-11-24_230000.dump
├── backup_semanal_2025-12-01_230000.dump
├── backup_semanal_2025-12-08_230000.dump
└── backup_log.txt
```

---

## ⚠️ IMPORTANTE

- Los backups **NO se eliminan automáticamente**
- Se mantienen **PERMANENTEMENTE**
- Revisar espacio en disco periódicamente
- Copiar backups importantes a USB/disco externo mensualmente

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### La tarea no se ejecuta:

1. Verificar que el usuario tiene permisos de administrador
2. Verificar que la ruta del script es correcta
3. Ver historial de errores en el Programador de Tareas

### Error al ejecutar script:

1. Ejecutar manualmente desde PowerShell:
   ```powershell
   cd C:\SistemaFerreteria
   .\scripts\ferreteria\backup-semanal.ps1
   ```
2. Revisar mensajes de error
3. Verificar que PostgreSQL está corriendo

---

## 📝 COMANDO ALTERNATIVO (PowerShell como Admin)

Si prefieres configurar vía PowerShell:

```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument '-ExecutionPolicy Bypass -NoProfile -File "C:\SistemaFerreteria\scripts\ferreteria\backup-semanal.ps1"' `
    -WorkingDirectory "C:\SistemaFerreteria"

$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 23:00

$principal = New-ScheduledTaskPrincipal -UserId "NT AUTHORITY\SYSTEM" -LogonType ServiceAccount -RunLevel Highest

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
    -TaskName "Backup Semanal Ferretería" `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings `
    -Description "Backup automático semanal de la base de datos del sistema de ferretería"
```

---

**¡Listo!** El backup se ejecutará automáticamente cada domingo a las 23:00
