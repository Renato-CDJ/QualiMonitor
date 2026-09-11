from decimal import Decimal
from typing import Iterable


def calcular_nota(itens: Iterable[object], status_por_item: dict[int, str]) -> Decimal:
    """Aplica a regra oficial: crítico inconforme zera; demais pesos descontam de 100."""
    nota = Decimal("100")
    for item in itens:
        status = status_por_item.get(item.id)
        if status == "inconforme" and item.critico:
            return Decimal("0")
        if status == "inconforme":
            nota -= item.peso
    return max(Decimal("0"), min(Decimal("100"), nota))
