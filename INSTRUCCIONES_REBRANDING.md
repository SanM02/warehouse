# 🎨 INSTRUCCIONES PARA COMPLETAR EL REBRANDING

## ✅ CAMBIOS YA APLICADOS

1. **Dominio personalizado** - `ferreteria-jg.local` configurado en sistema
2. **Título de página** - "Ferreteria J&G - Sistema de Gestión"
3. **Nombre en navbar** - "Ferreteria J&G"
4. **Tag de favicon** - Agregado en HTML

---

## 📝 PASOS PENDIENTES PARA EL USUARIO

### PASO 1: Configurar archivo hosts de Windows (REQUERIDO)

**Para que funcione http://ferreteria-jg.local**

1. **Abrir Bloc de Notas como ADMINISTRADOR**
   - Buscar "Bloc de Notas" en el menú inicio
   - Click derecho → "Ejecutar como administrador"

2. **Abrir el archivo hosts**
   - Menú: Archivo → Abrir
   - Navegar a: `C:\Windows\System32\drivers\etc`
   - Cambiar filtro de "Documentos de texto" a **"Todos los archivos"**
   - Seleccionar el archivo `hosts` (sin extensión)

3. **Agregar esta línea al final**
   ```
   127.0.0.1    ferreteria-jg.local
   ```

4. **Guardar** (Ctrl + S) y cerrar

5. **Probar en el navegador**
   - http://ferreteria-jg.local

---

### PASO 2: Agregar logo de la empresa (OPCIONAL)

El sistema ya está configurado para mostrar un favicon, solo falta reemplazar la imagen.

**Ubicación del archivo:**
```
cabravietnamirachamsinpeladofrontend/src/assets/favicon.png
```

**Opciones:**

#### Opción A: Usar logo existente
Si ya tiene un logo:
1. Convertirlo a PNG (32x32 o 64x64 píxeles)
2. Renombrarlo a `favicon.png`
3. Reemplazar el archivo en `cabravietnamirachamsinpeladofrontend/src/assets/`
4. Reconstruir: `docker-compose up -d --build frontend`

#### Opción B: Crear favicon desde cero
1. Visitar: https://favicon.io/favicon-generator/
2. Crear favicon con las letras "J&G"
3. Descargar el favicon.png generado
4. Copiarlo a `cabravietnamirachamsinpeladofrontend/src/assets/favicon.png`
5. Reconstruir: `docker-compose up -d --build frontend`

#### Opción C: Dejar el favicon por defecto
- El sistema funcionará normalmente
- Mostrará el favicon que viene con la plantilla

---

## 🌐 FORMAS DE ACCESO

Después de configurar el archivo hosts, podrá acceder de 3 formas:

| URL | Descripción |
|-----|-------------|
| http://localhost | Acceso tradicional |
| http://localhost:4200 | Acceso alternativo |
| http://ferreteria-jg.local | **Acceso con dominio personalizado** |

---

## 🔄 SI NECESITA DESHACER LOS CAMBIOS

```powershell
# Volver a los valores anteriores en .env
# ALLOWED_HOSTS=localhost,127.0.0.1,ferreteria-backend

# Reconstruir frontend
docker-compose up -d --build frontend
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Dominio .local**: Solo funciona en LA COMPUTADORA donde se configure el archivo hosts
   - Para que otros equipos accedan: Repetir configuración del hosts en cada PC
   - O usar la IP del servidor: `http://192.168.x.x`

2. **Favicon**: No es obligatorio, pero mejora la imagen profesional

3. **Acceso remoto**: Otros equipos en la red local pueden acceder usando:
   - La IP del servidor en lugar de localhost
   - Ejemplo: `http://192.168.1.100`

4. **HTTPS**: Este sistema usa HTTP. Para HTTPS se requiere certificado SSL (configuración adicional)

---

## ✅ VERIFICACIÓN

Después de configurar el hosts, verificar que todo funciona:

```powershell
# Probar accesos
curl http://localhost
curl http://ferreteria-jg.local

# Ver estado del sistema
docker-compose ps
```

---

## 📞 RESUMEN RÁPIDO

**YA ESTÁ HECHO:**
- ✅ Título cambiado
- ✅ Navbar actualizada
- ✅ Dominio configurado en backend/frontend
- ✅ Tag de favicon agregado

**PENDIENTE (USUARIO):**
1. ⏳ Editar archivo hosts (5 minutos)
2. ⏳ Reemplazar logo/favicon (opcional)

**RESULTADO FINAL:**
- 🌐 Sistema accesible en http://ferreteria-jg.local
- 🏢 Nombre "Ferreteria J&G" en toda la aplicación
- 🎨 Logo personalizado (cuando se agregue)
