from django.db import models
from apps.core.models import AuditModel, Carteira, Checklist, ChecklistItem, Operador, Tabulacao


class Monitoria(AuditModel):
    carteira = models.ForeignKey(Carteira, on_delete=models.PROTECT, related_name="monitorias")
    checklist = models.ForeignKey(Checklist, on_delete=models.PROTECT, related_name="monitorias")
    operador = models.ForeignKey(Operador, on_delete=models.PROTECT, related_name="monitorias")
    tabulacao = models.ForeignKey(Tabulacao, on_delete=models.PROTECT, related_name="monitorias")
    data = models.DateField()
    horario = models.TimeField(null=True, blank=True)
    ec_call_id = models.CharField(max_length=160)
    nota = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    observacao = models.TextField(blank=True)
    monitor = models.CharField(max_length=160)

    class Meta:
        indexes = [models.Index(fields=["carteira", "data"]), models.Index(fields=["operador", "data"])]


class MonitoriaApontamento(models.Model):
    monitoria = models.ForeignKey(Monitoria, on_delete=models.CASCADE, related_name="apontamentos")
    item = models.ForeignKey(ChecklistItem, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=[("conforme", "Conforme"), ("inconforme", "Inconforme"), ("na", "N/A")])

    class Meta:
        constraints = [models.UniqueConstraint(fields=["monitoria", "item"], name="apontamento_item_unico")]


class FeedbackInvertido(AuditModel):
    monitoria = models.OneToOneField(Monitoria, on_delete=models.CASCADE, related_name="feedback_invertido")
    status = models.CharField(max_length=20, choices=[("pendente", "Pendente"), ("concluido", "Concluído")], default="pendente")
    nota_operador = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    observacao_operador = models.TextField(blank=True)
    concluido_em = models.DateTimeField(null=True, blank=True)


class FeedbackApontamento(models.Model):
    feedback = models.ForeignKey(FeedbackInvertido, on_delete=models.CASCADE, related_name="apontamentos_operador")
    item = models.ForeignKey(ChecklistItem, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=[("conforme", "Conforme"), ("inconforme", "Inconforme"), ("na", "N/A")])


class RecebimentoOperador(AuditModel):
    operador = models.OneToOneField(Operador, on_delete=models.CASCADE, related_name="recebimento")
    nivel = models.CharField(max_length=10, choices=[("alto", "Alto"), ("baixo", "Baixo")])
