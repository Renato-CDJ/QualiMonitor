from django.urls import path
from . import views

urlpatterns = [
    path("monitorias/", views.monitorias),
    path("monitorias/criar/", views.criar_monitoria),
]
