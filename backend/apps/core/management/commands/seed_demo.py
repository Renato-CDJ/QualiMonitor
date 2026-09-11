from django.core.management.base import BaseCommand
from apps.core.models import Carteira, Checklist, ChecklistItem, Operador, Tabulacao, VinculoTabulacao
from datetime import date


class Command(BaseCommand):
    help = "Carrega dados demonstrativos idempotentes do QualiMonitor"

    def handle(self, *args, **options):
        carteira, _ = Carteira.objects.get_or_create(nome="Carteira demonstrativa", defaults={"descricao": "Base inicial para configuração"})
        operador, _ = Operador.objects.get_or_create(nome="Operador demonstrativo", carteira=carteira, defaults={"admissao": date.today()})
        checklist, _ = Checklist.objects.get_or_create(carteira=carteira, nome="Checklist padrão")
        ChecklistItem.objects.get_or_create(checklist=checklist, texto="Saudação e identificação", defaults={"peso": 10, "ordem": 1})
        tabulacao, _ = Tabulacao.objects.get_or_create(carteira=carteira, nome="Atendimento")
        VinculoTabulacao.objects.get_or_create(carteira=carteira, checklist=checklist, tabulacao=tabulacao)
        self.stdout.write(self.style.SUCCESS("Dados demonstrativos carregados."))
