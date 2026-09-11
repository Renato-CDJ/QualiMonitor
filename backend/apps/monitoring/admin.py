from django.contrib import admin
from .models import FeedbackApontamento, FeedbackInvertido, Monitoria, MonitoriaApontamento, RecebimentoOperador

admin.site.register([Monitoria, MonitoriaApontamento, FeedbackInvertido, FeedbackApontamento, RecebimentoOperador])
