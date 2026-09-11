from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import Carteira, Operador


def serialize_carteira(carteira):
    return {"id": carteira.pk, "nome": carteira.nome, "descricao": carteira.descricao, "ativa": carteira.ativa, "criado_em": carteira.criado_em.isoformat()}


@login_required
@require_http_methods(["GET"])
def carteiras(request):
    return JsonResponse({"items": [serialize_carteira(item) for item in Carteira.objects.order_by("nome")]})


@login_required
@require_http_methods(["POST"])
def criar_carteira(request):
    import json
    payload = json.loads(request.body or "{}")
    nome = str(payload.get("nome", "")).strip()
    if not nome:
        return JsonResponse({"error": "O nome da carteira é obrigatório."}, status=400)
    carteira = Carteira.objects.create(nome=nome, descricao=str(payload.get("descricao", "")))
    return JsonResponse(serialize_carteira(carteira), status=201)


@login_required
@require_http_methods(["GET"])
def operadores(request):
    queryset = Operador.objects.select_related("carteira").order_by("nome")
    carteira_id = request.GET.get("carteira")
    if carteira_id:
        queryset = queryset.filter(carteira_id=carteira_id)
    return JsonResponse({"items": [{"id": item.pk, "nome": item.nome, "carteira_id": item.carteira_id, "carteira": item.carteira.nome, "admissao": item.admissao.isoformat(), "ativo": item.ativo} for item in queryset]})
