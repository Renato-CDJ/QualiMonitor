from django.contrib import admin
from .models import Carteira, Checklist, ChecklistItem, Operador, Tabulacao, VinculoTabulacao, UsuarioPerfil

admin.site.register([Carteira, Checklist, ChecklistItem, Operador, Tabulacao, VinculoTabulacao, UsuarioPerfil])
