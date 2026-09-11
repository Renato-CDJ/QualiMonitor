from django.conf import settings
from django.db import models


class AuditModel(models.Model):
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Carteira(AuditModel):
    nome = models.CharField(max_length=120, unique=True)
    descricao = models.TextField(blank=True)
    ativa = models.BooleanField(default=True)

    def __str__(self):
        return self.nome


class Operador(AuditModel):
    nome = models.CharField(max_length=160)
    carteira = models.ForeignKey(Carteira, on_delete=models.PROTECT, related_name="operadores")
    admissao = models.DateField()
    ativo = models.BooleanField(default=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["nome", "carteira"], name="operador_nome_carteira_unico")]
        indexes = [models.Index(fields=["carteira", "ativo"])]

    def __str__(self):
        return self.nome


class Checklist(AuditModel):
    carteira = models.ForeignKey(Carteira, on_delete=models.CASCADE, related_name="checklists")
    nome = models.CharField(max_length=160)
    ativo = models.BooleanField(default=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["carteira", "nome"], name="checklist_nome_carteira_unico")]


class ChecklistItem(AuditModel):
    checklist = models.ForeignKey(Checklist, on_delete=models.CASCADE, related_name="itens")
    texto = models.CharField(max_length=500)
    bloco = models.CharField(max_length=120, blank=True)
    peso = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    critico = models.BooleanField(default=False)
    ordem = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["ordem", "id"]


class Tabulacao(AuditModel):
    carteira = models.ForeignKey(Carteira, on_delete=models.CASCADE, related_name="tabulacoes")
    nome = models.CharField(max_length=160)
    ativa = models.BooleanField(default=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["carteira", "nome"], name="tabulacao_nome_carteira_unico")]


class VinculoTabulacao(AuditModel):
    carteira = models.ForeignKey(Carteira, on_delete=models.CASCADE, related_name="vinculos")
    checklist = models.ForeignKey(Checklist, on_delete=models.CASCADE, related_name="vinculos")
    tabulacao = models.ForeignKey(Tabulacao, on_delete=models.CASCADE, related_name="vinculos")

    class Meta:
        constraints = [models.UniqueConstraint(fields=["carteira", "checklist", "tabulacao"], name="vinculo_unico")]


class UsuarioPerfil(AuditModel):
    usuario = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="perfil")
    perfil = models.CharField(max_length=30, choices=[("admin", "Administrador"), ("comum", "Comum"), ("visitante", "Visitante")], default="comum")

    def __str__(self):
        return f"{self.usuario.username} ({self.perfil})"
