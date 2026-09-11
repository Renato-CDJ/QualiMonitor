from django.urls import path
from . import views

urlpatterns = [
    path("carteiras/", views.carteiras),
    path("carteiras/criar/", views.criar_carteira),
    path("operadores/", views.operadores),
]
