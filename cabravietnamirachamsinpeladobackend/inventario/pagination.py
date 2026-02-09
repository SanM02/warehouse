from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Paginacion estandar para listados normales"""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class LargePagination(PageNumberPagination):
    """Paginacion grande para dropdowns y selectores"""
    page_size = 1000
    page_size_query_param = 'page_size'
    max_page_size = 5000
