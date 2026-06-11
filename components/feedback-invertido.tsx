"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  MinusCircle,
  PhoneCall,
  Save,
  Trash2,
  XCircle,
  ClipboardList,
  TrendingDown,
  TrendingUp,
  Equal,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OperadorSearch } from "@/components/operador-search"
import { useQualityData } from "@/lib/use-quality-data"
import type {
  ApontamentoItem,
  Checklist,
  FeedbackInvertido as TFeedback,
  Monitoria,
  StatusItem,
} from "@/lib/types"
import { store } from "@/lib/store"
import { notaColorClass, notaBadgeClass, faixaNota, formatarData } from "@/lib/analytics"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<StatusItem, string> = {
  conforme: "Conforme",
  inconforme: "Inconforme",
  na: "Não se aplica",
}

function statusIcon(status: StatusItem) {
  if (status === "inconforme") return <XCircle className="size-3.5" />
  if (status === "na") return <MinusCircle className="size-3.5" />
  return <CheckCircle2 className="size-3.5" />
}

function statusClass(status: StatusItem) {
  if (status === "inconforme") return "border-destructive/40 bg-destructive/10 text-destructive"
  if (status === "na") return "border-border bg-muted/50 text-muted-foreground"
  return "border-chart-5/30 bg-chart-5/10 text-chart-5"
}

export function FeedbackInvertido() {
  const { checklists, operadores, monitorias, feedbacks, ready, refresh } = useQualityData()
  const [avaliandoId, setAvaliandoId] = useState<string | null>(null)

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  const feedbackAtivo = feedbacks.find((f) => f.id === avaliandoId) || null
  if (feedbackAtivo) {
    const checklist = checklists.find((c) => c.id === feedbackAtivo.checklistId) || null
    return (
      <AutoAvaliacao
        feedback={feedbackAtivo}
        checklist={checklist}
        onVoltar={() => setAvaliandoId(null)}
        onConcluido={() => {
          setAvaliandoId(null)
          refresh()
        }}
      />
    )
  }

  const pendentes = feedbacks.filter((f) => f.status === "pendente")
  const concluidos = feedbacks.filter((f) => f.status === "concluido")

  return (
    <Tabs defaultValue="chamar" className="flex flex-col gap-6">
      <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
        <TabsTrigger value="chamar" className="gap-2">
          <PhoneCall className="size-4" /> Chamar operador
        </TabsTrigger>
        <TabsTrigger value="pendentes" className="gap-2">
          <ClipboardList className="size-4" /> Pendentes
          {pendentes.length > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">
              {pendentes.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="concluidos" className="gap-2">
          <UserCheck className="size-4" /> Concluídos
          {concluidos.length > 0 && (
            <span className="ml-1 rounded-full bg-secondary px-1.5 text-[11px] font-medium text-muted-foreground">
              {concluidos.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="chamar" className="mt-0">
        <ChamarOperador
          monitorias={monitorias}
          operadores={operadores}
          feedbacks={feedbacks}
          checklists={checklists}
          onCriado={refresh}
        />
      </TabsContent>

      <TabsContent value="pendentes" className="mt-0">
        <ListaPendentes pendentes={pendentes} onAvaliar={(id) => setAvaliandoId(id)} onRefresh={refresh} />
      </TabsContent>

      <TabsContent value="concluidos" className="mt-0">
        <ListaConcluidos concluidos={concluidos} checklists={checklists} onRefresh={refresh} />
      </TabsContent>
    </Tabs>
  )
}

/* ------------------------------------------------------------------ */
/* 1. Chamar operador — cria a monitoria invertida a partir de uma     */
/*    monitoria já avaliada pelo monitor                               */
/* ------------------------------------------------------------------ */

function ChamarOperador({
  monitorias,
  operadores,
  feedbacks,
  checklists,
  onCriado,
}: {
  monitorias: Monitoria[]
  operadores: ReturnType<typeof useQualityData>["operadores"]
  feedbacks: TFeedback[]
  checklists: Checklist[]
  onCriado: () => void
}) {
  const [operadorId, setOperadorId] = useState<string | null>(null)

  const monitoriasDoOperador = useMemo(() => {
    if (!operadorId) return []
    return monitorias
      .filter((m) => m.operadorId === operadorId)
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  }, [monitorias, operadorId])

  const jaChamada = (monitoriaId: string) => feedbacks.some((f) => f.monitoriaId === monitoriaId)

  function chamar(m: Monitoria) {
    if (jaChamada(m.id)) {
      toast.error("Essa monitoria já foi enviada para auto-avaliação.")
      return
    }
    const f: TFeedback = {
      id: store.uid(),
      monitoriaId: m.id,
      carteira: m.carteira,
      checklistId: m.checklistId,
      operadorId: m.operadorId,
      operadorNome: m.operadorNome,
      monitor: m.monitor,
      notaMonitor: m.nota,
      apontamentosMonitor: m.apontamentos,
      observacaoMonitor: m.observacao,
      status: "pendente",
      criadoEm: new Date().toISOString(),
    }
    store.addFeedback(f)
    toast.success(`${m.operadorNome} foi chamado para se auto-avaliar.`)
    onCriado()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="lg:sticky lg:top-20 lg:self-start">
        <CardHeader>
          <CardTitle className="text-base">Selecione o operador</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <OperadorSearch operadores={operadores} value={operadorId} onChange={setOperadorId} />
          <p className="text-xs text-muted-foreground">
            Busque o operador para listar as monitorias já avaliadas pelo monitor. Escolha uma
            para enviá-la à auto-avaliação (monitoria invertida).
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {!operadorId ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <PhoneCall className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium">Nenhum operador selecionado</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Busque um operador ao lado para ver as monitorias disponíveis.
              </p>
            </CardContent>
          </Card>
        ) : monitoriasDoOperador.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <p className="text-sm font-medium">Sem monitorias para este operador</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Não há monitorias avaliadas registradas para o operador selecionado.
              </p>
            </CardContent>
          </Card>
        ) : (
          monitoriasDoOperador.map((m) => {
            const chk = checklists.find((c) => c.id === m.checklistId)
            const usada = jaChamada(m.id)
            return (
              <Card key={m.id} className={cn(usada && "opacity-60")}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{chk?.nome ?? m.carteira}</span>
                      <Badge variant="outline">{m.carteira}</Badge>
                      <Badge variant="outline">{m.tabulacao}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatarData(m.data)}
                      {m.horario ? ` · ${m.horario}` : ""} · {m.ecCallId} · Monitor: {m.monitor}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={cn("text-xl font-semibold tabular-nums", notaColorClass(m.nota))}>
                        {m.nota}
                      </p>
                      <p className="text-[11px] text-muted-foreground">nota do monitor</p>
                    </div>
                    {usada ? (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="size-3" /> Enviada
                      </Badge>
                    ) : (
                      <Button size="sm" className="gap-1.5" onClick={() => chamar(m)}>
                        <PhoneCall className="size-4" /> Chamar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 2. Lista de pendentes                                               */
/* ------------------------------------------------------------------ */

function ListaPendentes({
  pendentes,
  onAvaliar,
  onRefresh,
}: {
  pendentes: TFeedback[]
  onAvaliar: (id: string) => void
  onRefresh: () => void
}) {
  if (pendentes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <ClipboardList className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">Nenhuma auto-avaliação pendente</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Use a aba “Chamar operador” para enviar uma monitoria à auto-avaliação.
          </p>
        </CardContent>
      </Card>
    )
  }

  function cancelar(id: string) {
    store.removeFeedback(id)
    toast.success("Chamado cancelado.")
    onRefresh()
  }

  return (
    <div className="flex flex-col gap-3">
      {pendentes.map((f) => (
        <Card key={f.id}>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{f.operadorNome}</span>
                <Badge variant="outline">{f.carteira}</Badge>
                <Badge variant="outline" className="border-chart-3/40 bg-chart-3/10 text-chart-3">
                  Aguardando operador
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Chamado em {formatarData(f.criadoEm.slice(0, 10))} · Monitor: {f.monitor}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => cancelar(f.id)}>
                <Trash2 className="size-4" /> Cancelar
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => onAvaliar(f.id)}>
                <UserCheck className="size-4" /> Auto-avaliar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Formulário de auto-avaliação do operador                         */
/* ------------------------------------------------------------------ */

function AutoAvaliacao({
  feedback,
  checklist,
  onVoltar,
  onConcluido,
}: {
  feedback: TFeedback
  checklist: Checklist | null
  onVoltar: () => void
  onConcluido: () => void
}) {
  const [statusMap, setStatusMap] = useState<Record<string, StatusItem>>({})
  const [observacao, setObservacao] = useState("")

  const apontamentos: ApontamentoItem[] = useMemo(() => {
    if (!checklist) return []
    return checklist.itens.map((it) => ({
      itemId: it.id,
      status: statusMap[it.id] ?? "conforme",
    }))
  }, [checklist, statusMap])

  const nota = useMemo(() => {
    if (!checklist) return 100
    return store.calcularNota(checklist, apontamentos)
  }, [checklist, apontamentos])

  function setStatus(itemId: string, status: StatusItem) {
    setStatusMap((prev) => {
      const atual = prev[itemId] ?? "conforme"
      const novo = atual === status ? "conforme" : status
      return { ...prev, [itemId]: novo }
    })
  }

  function finalizar() {
    if (!checklist) return
    store.updateFeedback(feedback.id, {
      apontamentosOperador: apontamentos,
      notaOperador: nota,
      observacaoOperador: observacao.trim(),
      status: "concluido",
      concluidoEm: new Date().toISOString(),
    })
    toast.success("Auto-avaliação concluída! Veja o comparativo na aba Concluídos.")
    onConcluido()
  }

  if (!checklist) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm font-medium">Checklist não encontrado</p>
          <Button variant="outline" size="sm" onClick={onVoltar} className="gap-1.5">
            <ArrowLeft className="size-4" /> Voltar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onVoltar} className="gap-1.5">
          <ArrowLeft className="size-4" /> Voltar
        </Button>
        <Badge variant="outline" className="gap-1.5">
          <UserCheck className="size-3.5" /> Auto-avaliação · {feedback.operadorNome}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{checklist.nome}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {feedback.operadorNome}, avalie a sua própria ligação flegando os itens que você
              acredita NÃO ter realizado. A nota do monitor permanece oculta até finalizar.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {checklist.itens.map((it, idx) => {
              const status = statusMap[it.id] ?? "conforme"
              return (
                <div
                  key={it.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-lg border border-border bg-secondary/30 p-3 sm:flex-row sm:items-center",
                    status === "inconforme" && "border-destructive/40 bg-destructive/5",
                    status === "na" && "border-border bg-muted/40",
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-xs text-muted-foreground">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm leading-snug">{it.texto}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">Peso: {it.peso} pts</span>
                        {it.critico && (
                          <Badge
                            variant="outline"
                            className="border-destructive/40 bg-destructive/10 text-destructive"
                          >
                            <AlertTriangle className="mr-1 size-3" /> Crítico (zera nota)
                          </Badge>
                        )}
                        {status === "conforme" && (
                          <span className="flex items-center gap-1 text-xs text-chart-5">
                            <CheckCircle2 className="size-3" /> Conforme
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={status === "inconforme" ? "destructive" : "outline"}
                      onClick={() => setStatus(it.id, "inconforme")}
                      className="gap-1.5"
                    >
                      <XCircle className="size-4" /> Inconforme
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={status === "na" ? "secondary" : "outline"}
                      onClick={() => setStatus(it.id, "na")}
                      className={cn("gap-1.5", status === "na" && "ring-1 ring-border")}
                    >
                      <MinusCircle className="size-4" /> Não se aplica
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sua nota</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-secondary/30 py-6">
                <span className={cn("text-5xl font-semibold tabular-nums", notaColorClass(nota))}>
                  {nota}
                </span>
                <span className="text-xs text-muted-foreground">de 100 pontos</span>
                <Badge variant="outline" className="mt-1">
                  {faixaNota(nota)}
                </Badge>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Sua justificativa</label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Comente sua própria avaliação..."
                  rows={4}
                  className="w-full resize-none rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                />
              </div>

              <Button onClick={finalizar} className="gap-2">
                <Save className="size-4" /> Finalizar auto-avaliação
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 4. Lista de concluídos + comparativo                                */
/* ------------------------------------------------------------------ */

function ListaConcluidos({
  concluidos,
  checklists,
  onRefresh,
}: {
  concluidos: TFeedback[]
  checklists: Checklist[]
  onRefresh: () => void
}) {
  const [abertoId, setAbertoId] = useState<string | null>(null)

  if (concluidos.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <UserCheck className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">Nenhuma monitoria invertida concluída</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Quando um operador finalizar a auto-avaliação, o comparativo aparecerá aqui.
          </p>
        </CardContent>
      </Card>
    )
  }

  function excluir(id: string) {
    store.removeFeedback(id)
    toast.success("Registro removido.")
    if (abertoId === id) setAbertoId(null)
    onRefresh()
  }

  return (
    <div className="flex flex-col gap-3">
      {concluidos.map((f) => {
        const checklist = checklists.find((c) => c.id === f.checklistId) || null
        const aberto = abertoId === f.id
        const diff = (f.notaOperador ?? 0) - f.notaMonitor
        return (
          <Card key={f.id}>
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{f.operadorNome}</span>
                    <Badge variant="outline">{f.carteira}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {checklist?.nome ?? ""} · Monitor: {f.monitor}
                    {f.concluidoEm ? ` · Concluído em ${formatarData(f.concluidoEm.slice(0, 10))}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className={cn("text-xl font-semibold tabular-nums", notaColorClass(f.notaMonitor))}>
                      {f.notaMonitor}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Monitor</p>
                  </div>
                  <div className="text-center">
                    <p className={cn("text-xl font-semibold tabular-nums", notaColorClass(f.notaOperador ?? 0))}>
                      {f.notaOperador ?? 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Operador</p>
                  </div>
                  <DiffBadge diff={diff} />
                  <Button variant="outline" size="sm" onClick={() => setAbertoId(aberto ? null : f.id)}>
                    {aberto ? "Ocultar" : "Comparar"}
                  </Button>
                </div>
              </div>

              {aberto && checklist && <Comparativo feedback={f} checklist={checklist} onExcluir={() => excluir(f.id)} />}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function DiffBadge({ diff }: { diff: number }) {
  if (diff === 0) {
    return (
      <Badge variant="outline" className="gap-1 border-chart-5/30 bg-chart-5/10 text-chart-5">
        <Equal className="size-3" /> Alinhado
      </Badge>
    )
  }
  if (diff > 0) {
    return (
      <Badge variant="outline" className="gap-1 border-chart-3/40 bg-chart-3/10 text-chart-3">
        <TrendingUp className="size-3" /> +{diff} (operador maior)
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1 border-destructive/40 bg-destructive/10 text-destructive">
      <TrendingDown className="size-3" /> {diff} (operador menor)
    </Badge>
  )
}

function Comparativo({
  feedback,
  checklist,
  onExcluir,
}: {
  feedback: TFeedback
  checklist: Checklist
  onExcluir: () => void
}) {
  const mapMonitor = new Map(feedback.apontamentosMonitor.map((a) => [a.itemId, a.status]))
  const mapOperador = new Map((feedback.apontamentosOperador ?? []).map((a) => [a.itemId, a.status]))

  const total = checklist.itens.length
  const divergencias = checklist.itens.filter(
    (it) => (mapMonitor.get(it.id) ?? "conforme") !== (mapOperador.get(it.id) ?? "conforme"),
  ).length
  const concordancia = total > 0 ? Math.round(((total - divergencias) / total) * 100) : 100

  const notaMonitor = feedback.notaMonitor
  const notaOperador = feedback.notaOperador ?? 0
  const diff = notaOperador - notaMonitor
  const maxNota = Math.max(notaMonitor, notaOperador, 1)

  return (
    <div className="flex flex-col gap-5 border-t border-border pt-5">
      {/* Placar visual: monitor vs operador */}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
        <ScoreCard
          label="Avaliação do monitor"
          sub={feedback.monitor}
          icon={<ClipboardList className="size-4" />}
          nota={notaMonitor}
          accent="monitor"
        />
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-1 rounded-full border border-border bg-secondary/40 px-3 py-2 sm:px-2 sm:py-4">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">vs</span>
            <DiffBadge diff={diff} />
          </div>
        </div>
        <ScoreCard
          label="Auto-avaliação do operador"
          sub={feedback.operadorNome}
          icon={<UserCheck className="size-4" />}
          nota={notaOperador}
          accent="operador"
        />
      </div>

      {/* Barras comparativas */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/20 p-4">
        <ScoreBar label="Monitor" nota={notaMonitor} max={maxNota} tone="monitor" />
        <ScoreBar label="Operador" nota={notaOperador} max={maxNota} tone="operador" />
      </div>

      {/* Concordância */}
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Concordância da avaliação</span>
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              concordancia >= 80 ? "text-chart-5" : concordancia >= 50 ? "text-chart-3" : "text-destructive",
            )}
          >
            {concordancia}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              concordancia >= 80 ? "bg-chart-5" : concordancia >= 50 ? "bg-chart-3" : "bg-destructive",
            )}
            style={{ width: `${concordancia}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {total - divergencias} de {total} itens avaliados igualmente ·{" "}
          <span className={cn("font-medium", divergencias > 0 ? "text-chart-3" : "text-chart-5")}>
            {divergencias} {divergencias === 1 ? "divergência" : "divergências"}
          </span>
        </p>
      </div>

      {/* Detalhamento item a item */}
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-border bg-secondary/40 px-4 py-2.5 text-xs font-medium text-muted-foreground">
          <span>Item avaliado</span>
          <span className="w-28 text-center sm:w-32">Monitor</span>
          <span className="w-28 text-center sm:w-32">Operador</span>
        </div>
        <div className="divide-y divide-border/60">
          {checklist.itens.map((it, idx) => {
            const sm = (mapMonitor.get(it.id) ?? "conforme") as StatusItem
            const so = (mapOperador.get(it.id) ?? "conforme") as StatusItem
            const divergente = sm !== so
            return (
              <div
                key={it.id}
                className={cn(
                  "grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3",
                  divergente && "bg-chart-3/5",
                )}
              >
                <div className="flex min-w-0 items-start gap-2">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-secondary text-[11px] text-muted-foreground">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="text-sm leading-snug">{it.texto}</span>
                    {it.critico && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 text-[11px] font-medium text-destructive">
                        <AlertTriangle className="size-3" /> crítico
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex w-28 justify-center sm:w-32">
                  <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs", statusClass(sm))}>
                    {statusIcon(sm)} {STATUS_LABEL[sm]}
                  </span>
                </div>
                <div className="flex w-28 items-center justify-center gap-1.5 sm:w-32">
                  <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs", statusClass(so))}>
                    {statusIcon(so)} {STATUS_LABEL[so]}
                  </span>
                  {divergente && (
                    <span
                      className="size-2 shrink-0 rounded-full bg-chart-3"
                      title="Divergente do monitor"
                      aria-label="Divergente do monitor"
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Observações lado a lado */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border-l-2 border-l-chart-1 border-t border-r border-b border-border bg-secondary/30 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ClipboardList className="size-3.5" /> Observação do monitor
          </p>
          <p className="text-sm leading-relaxed">{feedback.observacaoMonitor || "—"}</p>
        </div>
        <div className="rounded-lg border-l-2 border-l-chart-2 border-t border-r border-b border-border bg-secondary/30 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <UserCheck className="size-3.5" /> Justificativa do operador
          </p>
          <p className="text-sm leading-relaxed">{feedback.observacaoOperador || "—"}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={onExcluir}>
          <Trash2 className="size-4" /> Excluir registro
        </Button>
      </div>
    </div>
  )
}

function ScoreCard({
  label,
  sub,
  icon,
  nota,
  accent,
}: {
  label: string
  sub: string
  icon: React.ReactNode
  nota: number
  accent: "monitor" | "operador"
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border bg-card p-4",
        accent === "monitor" ? "border-chart-1/30" : "border-chart-2/30",
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium",
            accent === "monitor" ? "text-chart-1" : "text-chart-2",
          )}
        >
          {icon} {label}
        </span>
        <span className="truncate text-sm text-muted-foreground">{sub}</span>
        <Badge variant="outline" className="mt-1 w-fit text-[11px]">
          {faixaNota(nota)}
        </Badge>
      </div>
      <div className="flex flex-col items-end leading-none">
        <span className={cn("text-4xl font-semibold tabular-nums", notaColorClass(nota))}>{nota}</span>
        <span className="mt-1 text-[11px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  )
}

function ScoreBar({
  label,
  nota,
  max,
  tone,
}: {
  label: string
  nota: number
  max: number
  tone: "monitor" | "operador"
}) {
  const width = Math.round((nota / max) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all", tone === "monitor" ? "bg-chart-1" : "bg-chart-2")}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className={cn("w-9 shrink-0 text-right text-sm font-semibold tabular-nums", notaColorClass(nota))}>
        {nota}
      </span>
    </div>
  )
}
