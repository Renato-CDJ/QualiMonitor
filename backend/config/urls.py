from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from apps.core.pages import dashboard


def health(request):
    return JsonResponse({"status": "ok", "service": "qualimonitor"})


urlpatterns = [
    path("", dashboard),
    path("admin/", admin.site.urls),
    path("health/", health),
    path("api/", include("apps.core.urls")),
    path("api/", include("apps.monitoring.urls")),
]
