# Imagen base de Python
FROM python:3.12-slim

# Variables de entorno para Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Instalar dependencias del sistema (incluye curl para healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    libpq-dev \
    gcc \
    python3-dev \
    build-essential \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Directorio de trabajo
WORKDIR /app

# Copiar requirements e instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt gunicorn

# Copiar código del proyecto
COPY . .

# Copiar y dar permisos al script de entrada
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Crear directorios para archivos estáticos y media
RUN mkdir -p /app/staticfiles /app/mediafiles

# Exponer puerto
EXPOSE 8000

# Punto de entrada
ENTRYPOINT ["/docker-entrypoint.sh"]
