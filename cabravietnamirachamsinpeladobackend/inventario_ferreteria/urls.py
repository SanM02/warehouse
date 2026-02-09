"""
URL configuration for inventario_ferreteria project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from inventario.views import (ProtectedView, CategoriaViewSet, SubcategoriaViewSet, ProductoViewSet, 
                            MovimientoViewSet, productos_stock_bajo, FacturaViewSet,
                            ProveedorViewSet, OrdenCompraViewSet, RecepcionMercaderiaViewSet, 
                            ProductoProveedorViewSet, ClienteViewSet, FacturaCompraViewSet, health_check,
                            productos_dropdown, proveedores_dropdown)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'subcategorias', SubcategoriaViewSet, basename='subcategoria')
router.register(r'productos', ProductoViewSet, basename='producto')
router.register(r'movimientos', MovimientoViewSet, basename='movimiento')
router.register(r'facturas', FacturaViewSet, basename='factura')
# Endpoints para módulo de recepción de mercaderías
router.register(r'proveedores', ProveedorViewSet, basename='proveedor')
router.register(r'ordenes-compra', OrdenCompraViewSet, basename='orden-compra')
router.register(r'recepciones', RecepcionMercaderiaViewSet, basename='recepcion')
router.register(r'producto-proveedores', ProductoProveedorViewSet, basename='producto-proveedor')
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'facturas-compra', FacturaCompraViewSet, basename='factura-compra')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),  # Healthcheck sin autenticación
    # Endpoints para dropdowns (sin paginacion)
    path('api/productos/dropdown/', productos_dropdown, name='productos-dropdown'),
    path('api/proveedores/dropdown/', proveedores_dropdown, name='proveedores-dropdown'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # path('api/protected/', ProtectedView.as_view(), name='protected'),
    path('api/productos/stock-bajo/', productos_stock_bajo, name='productos_stock_bajo'),
    path('api/', include(router.urls)),
]

