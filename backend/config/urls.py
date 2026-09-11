from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(request):
    return JsonResponse({"status": "ok", "service": "qualimonitor"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health),
    path("api/", include("apps.core.urls")),
]
