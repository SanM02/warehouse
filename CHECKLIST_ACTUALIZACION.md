# 🚀 CHECKLIST RÁPIDO - ACTUALIZACIÓN CLIENTE

**Imprimir esta página y marcar cada paso**

---

## 📋 ANTES DE IR AL CLIENTE

- [ ] Archivos del sistema copiados a USB/servidor compartido
- [ ] Script `actualizar-cliente.ps1` incluido en los archivos
- [ ] Credenciales de acceso al sistema del cliente
- [ ] Teléfono de contacto del cliente
- [ ] Esta checklist impresa

---

## 🎯 EN EL CLIENTE

### PASO 1: Preparación (5 min)

- [ ] Conectar USB o acceder a servidor compartido
- [ ] Verificar que el sistema está corriendo: **http://localhost:4200**
- [ ] Anotar cantidad de productos actuales: ________
- [ ] Anotar cantidad de facturas actuales: ________
- [ ] Abrir PowerShell como Administrador

### PASO 2: Ejecutar Actualización (10 min)

```powershell
cd C:\SistemaFerreteria
.\scripts\actualizar-cliente.ps1 -OrigenActualizacion "D:\ActualizacionCliente"
```

- [ ] Script iniciado correctamente
- [ ] Backup creado ✅ (anotar nombre archivo: __________________)
- [ ] Contenedores detenidos ✅
- [ ] Archivos copiados ✅
- [ ] Imágenes reconstruidas ✅ (3-5 min)
- [ ] Migraciones aplicadas ✅
- [ ] Sistema reiniciado ✅

### PASO 3: Verificación (5 min)

- [ ] Sistema carga en navegador: **http://localhost:4200**
- [ ] Login funciona correctamente
- [ ] Cantidad de productos: ________ (debe ser igual al PASO 1)
- [ ] Cantidad de facturas: ________ (debe ser igual al PASO 1)

**Probar nuevas funcionalidades:**

- [ ] Inventario → Botón "Editar" (amarillo) está visible
- [ ] Editar un producto → Campo "Precio Costo" cambia → Verificar que "Precio Venta" se calcula automáticamente
- [ ] Crear producto nuevo sin código → Funciona ✅
- [ ] La descripción se ve en la tabla
- [ ] Historial Facturas → Botón "Nueva Factura" funciona

### PASO 4: Finalización

- [ ] Tomar captura de pantalla del sistema funcionando
- [ ] Anotar ruta del backup: _________________________________
- [ ] Explicar al cliente nuevas funcionalidades
- [ ] Dejar esta guía impresa con el cliente

---

## ⚠️ SI ALGO SALE MAL

### Restaurar Sistema Anterior

```powershell
cd C:\SistemaFerreteria
.\scripts\docker\restore-db.ps1 -BackupFile "backups\backup_pre_actualizacion_XXXX.sql"
docker-compose restart
```

- [ ] Backup restaurado
- [ ] Sistema funcional con versión anterior
- [ ] Cliente notificado

### Contactar Soporte

- [ ] Logs guardados: `docker-compose logs > error_log.txt`
- [ ] Captura de error tomada
- [ ] Información enviada a soporte

---

## 📝 NOTAS ADICIONALES

```
__________________________________________________________________________

__________________________________________________________________________

__________________________________________________________________________

__________________________________________________________________________
```

---

**Cliente**: ________________________________  
**Fecha**: ___ / ___ / 2026  
**Hora inicio**: _____  
**Hora fin**: _____  
**Técnico**: ________________________________  
**Firma cliente**: ________________________________
