# Sistema de Inventario Ferretería - Backend

Sistema completo de inventario para ferretería con módulos de facturación, recepción de mercaderías, y gestión de proveedores.

## 🚀 Características

- ✅ **Módulo de Facturación Completa** con RUC/Cédula
- ✅ **Recepción de Mercaderías** con actualización automática de stock
- ✅ **Gestión de Proveedores** y relaciones producto-proveedor
- ✅ **Cálculos Automáticos** de IVA y totales
- ✅ **Control de Stock** en tiempo real
- ✅ **Autenticación JWT** con tokens de acceso y refresh
- ✅ **API REST Completa** con filtros y paginación

## 📋 Requisitos

- **Python** 3.8+  
- **Django** 5.0+  
- **PostgreSQL** 12+ (recomendado) o SQLite para desarrollo
- **pip**  
- **Git**  
- **pandas** y **openpyxl** (para importar desde Excel)

## Instalación y configuración

1. **Clona el repositorio**
    ```sh
    git clone https://gitlab.com/capriblack/cabravietnamirachamsinpeladobackend.git
    cd cabravietnamirachamsinpeladobackend
    ```

2. **Crea y activa un entorno virtual**
    ```sh
    python -m venv venv
    venv\Scripts\activate   # En Windows
    # source venv/bin/activate  # En Linux/Mac
    ```

3. **Instala las dependencias**
    ```sh
    pip install -r requirements.txt
    ```

    Si no tienes `requirements.txt`, instala manualmente:
    ```sh
    pip install django==5.0.7 djangorestframework psycopg2 pandas openpyxl django-cors-headers
    ```

4. **Configura la base de datos PostgreSQL**

    Asegúrate de tener una base de datos llamada `ferreteria_inventario` y un usuario con permisos (ver en `inventario_ferreteria/settings.py`):

    ```
    ENGINE: django.db.backends.postgresql
    NAME: ferreteria_inventario
    USER: postgres
    PASSWORD: 210671
    HOST: localhost
    PORT: 5432
    ```

5. **Realiza las migraciones**
    ```sh
    python manage.py makemigrations
    python manage.py migrate
    ```

6. **Crea un superusuario (opcional, para admin)**
    ```sh
    python manage.py createsuperuser
    ```

7. **(Opcional) Importa productos desde Excel**

    - Coloca tu archivo Excel (ej: `Catalogo_Precios_Productos.xlsx`) en la raíz del proyecto.
    - Ejecuta:
      ```sh
      python importar_productos.py
      ```

8. **Levanta el servidor**
    ```sh
    python manage.py runserver
    ```

9. **Accede a la API y admin**

    - API: [http://localhost:8000/api/](http://localhost:8000/api/)
    - Admin: [http://localhost:8000/admin/](http://localhost:8000/admin/)

---

## Versiones recomendadas

- Python: 3.10.x o 3.11.x
- Django: 5.0.7
- djangorestframework: 3.15.x
- psycopg2: 2.9.x
- pandas: 2.x
- openpyxl: 3.x
- django-cors-headers: 4.x
- PostgreSQL: 13 o superior

---

## Notas

- Si tienes problemas con migraciones, revisa que tu base de datos esté limpia y que las migraciones se hayan aplicado correctamente.
- Para importar productos, asegúrate de que las columnas del Excel coincidan exactamente con las usadas en el script.

---

## Contacto

Para dudas o soporte, abre un issue en el repositorio o contacta al equipo de desarrollo.
