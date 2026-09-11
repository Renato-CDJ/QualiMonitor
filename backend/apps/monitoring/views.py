import json
from datetime import date
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from apps.core.models import Checklist, ChecklistItem, Operador, Tabulacao
from .models import Monitoria, MonitoriaApontamento, FeedbackInvertido
from .services import calcular_nota


def _monitoria_json(item):
    return {
        "id": item.id,
        "carteira_id": item.carteira_id,
        "checklist_id": item.checklist_id,
        "operador_id": item.operador_id,
        "tabulacao_id": item.tabulacao_id,
        "data": item.data.isoformat(),
        "ec_call_id": item.ec_call_id,
        "nota": str(item.nota),
        "observacao": item.observacao,
        "monitor": item.monitor,
    }


@login_required
@require_http_methods(["GET"])
def monitorias(request):
    queryset = Monitoria.objects.select_related("operador", "carteira", "checklist", "tabulacao").order_by("-data", "-id")
    carteira_id = request.GET.get("carteira")
    operador_id = request.GET.get("operador")
    if carteira_id:
        queryset = queryset.filter(carteira_id=carteira_id)
    if operador_id:
        queryset = queryset.filter(operador_id=operador_id)
    return JsonResponse({"items": [_monitoria_json(item) for item in queryset[:500]]})


@login_required
@require_http_methods(["POST"])
@transaction.atomic
def criar_monitoria(request):
    payload = json.loads(request.body or "{}")
    required = ["carteira_id", "checklist_id", "operador_id", "tabulacao_id", "ec_call_id", "monitor"]
    missing = [field for field in required if not payload.get(field)]
    if missing:
        return JsonResponse({"error": "Campos obrigatórios ausentes.", "fields": missing}, status=400)
    try:
        checklist = Checklist.objects.get(pk=payload["checklist_id"])
        itens = list(ChecklistItem.objects.filter(checklist=checklist))
        operador = Operador.objects.get(pk=payload["operador_id"])
        tabulacao = Tabulacao.objects.get(pk=payload["tabulacao_id"])
        if operador.carteira_id != int(payload["carteira_id"]) or checklist.carteira_id != int(payload["carteira_id"]) or tabulacao.carteira_id != int(payload["carteira_id"]):
            return JsonResponse({"error": "Os vínculos devem pertencer à mesma carteira."}, status=400)
    except (Checklist.DoesNotExist, Operador.DoesNotExist, Tabulacao.DoesNotExist, ValueError):
        return JsonResponse({"error": "Referência inválida para a monitoria."}, status=400)
    status_por_item = {int(key): value for key, value in payload.get("apontamentos", {}).items()}
    nota = calcular_nota(itens, status_por_item)
    monitoria = Monitoria.objects.create(
        carteira_id=payload["carteira_id"], checklist=checklist, operador=operador, tabulacao=tabulacao,
        data=payload.get("data") or date.today(), ec_call_id=str(payload["ec_call_id"]), nota=nota,
        observacao=str(payload.get("observacao", "")), monitor=str(payload["monitor"]),
    )
    MonitoriaApontamento.objects.bulk_create([MonitoriaApontamento(monitoria=monitoria, item=item, status=status_por_item.get(item.id, "na")) for item in itens])
    FeedbackInvertido.objects.create(monitoria=monitoria)
    return JsonResponse(_monitoria_json(monitoria), status=201)
