from django.contrib.auth.decorators import login_required
from django.db.models import Count
from django.shortcuts import render

from apps.core.models import Carteira, Operador, Checklist, Tabulacao
from apps.monitoring.models import Monitoria, FeedbackInvertido


@login_required
def dashboard(request):
    context = {
        "carteiras": Carteira.objects.filter(ativa=True).annotate(total_operadores=Count("operadores")).order_by("nome"),
        "total_carteiras": Carteira.objects.filter(ativa=True).count(),
        "total_operadores": Operador.objects.filter(ativo=True).count(),
        "total_checklists": Checklist.objects.filter(ativo=True).count(),
        "total_monitorias": Monitoria.objects.count(),
        "feedbacks_pendentes": FeedbackInvertido.objects.filter(status="pendente").count(),
        "monitorias_recentes": Monitoria.objects.select_related("carteira", "operador", "tabulacao").order_by("-data", "-id")[:8],
    }
    return render(request, "dashboard.html", context)


@login_required
def health_dashboard(request):
    return dashboard(request)


def login_redirect(request):
    from django.contrib.auth.views import LoginView
    return LoginView.as_view(template_name="registration/login.html")(request)


def logout_redirect(request):
    from django.contrib.auth import logout
    from django.shortcuts import redirect
    logout(request)
    return redirect("login")


def login_page(request):
    from django.contrib.auth.views import LoginView
    return LoginView.as_view(template_name="registration/login.html")(request)


def logout_page(request):
    from django.contrib.auth import logout
    from django.shortcuts import redirect
    logout(request)
    return redirect("login")


def login_view(request):
    from django.contrib.auth.views import LoginView
    return LoginView.as_view(template_name="registration/login.html")(request)


def logout_view(request):
    from django.contrib.auth import logout
    from django.shortcuts import redirect
    logout(request)
    return redirect("login")


def login(request):
    from django.contrib.auth.views import LoginView
    return LoginView.as_view(template_name="registration/login.html")(request)


def logout(request):
    from django.contrib.auth import logout as django_logout
    from django.shortcuts import redirect
    django_logout(request)
    return redirect("login")


def sign_in(request):
    from django.contrib.auth.views import LoginView
    return LoginView.as_view(template_name="registration/login.html")(request)


def sign_out(request):
    from django.contrib.auth import logout as django_logout
    from django.shortcuts import redirect
    django_logout(request)
    return redirect("login")


# Compatibilidade explícita para o endpoint configurado no projeto.
def login_page_view(request):
    from django.contrib.auth.views import LoginView
    return LoginView.as_view(template_name="registration/login.html")(request)


def logout_page_view(request):
    from django.contrib.auth import logout as django_logout
    from django.shortcuts import redirect
    django_logout(request)
    return redirect("login")


# Use as views nameadas simples no URLConf.
def authentication_login(request):
    from django.contrib.auth.views import LoginView
    return LoginView.as_view(template_name="registration/login.html")(request)


def authentication_logout(request):
    from django.contrib.auth import logout as django_logout
    from django.shortcuts import redirect
    django_logout(request)
    return redirect("login")


# Aliases mantidos para instalações antigas do dashboard.
login = authentication_login
logout = authentication_logout
