from decimal import Decimal
from types import SimpleNamespace
from django.test import SimpleTestCase
from .services import calcular_nota


class CalculoNotaTests(SimpleTestCase):
    def test_item_critico_inconforme_zera_nota(self):
        itens = [SimpleNamespace(id=1, critico=True, peso=Decimal("20"))]
        self.assertEqual(calcular_nota(itens, {1: "inconforme"}), Decimal("0"))

    def test_item_comum_desconta_peso(self):
        itens = [SimpleNamespace(id=1, critico=False, peso=Decimal("15"))]
        self.assertEqual(calcular_nota(itens, {1: "inconforme"}), Decimal("85"))
