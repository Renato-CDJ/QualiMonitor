"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertTriangle,
  CheckCircle2,
  MinusCircle,
  XCircle,
  Save,
  RotateCcw,
  ClipboardList,
  ListChecks,
  Gauge,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OperadorSearch } from "@/components/operador-search"
import { useQualityData } from "@/lib/use-quality-data"
import { TABULACOES, type ApontamentoItem, type StatusItem, type Monitoria } from "@/lib/types"
import { store } from "@/lib/store"
import { notaColorClass, faixaNota } from "@/lib/analytics"
import { cn } from "@/lib/utils"

const HOJE = new Date().toISOString().slice(0, 10)
const AGORA = new Date().toTimeString().slice(0, 5)

export function MonitoriaForm() {
  const { checklists, operadores, ready } = useQualityData()

  const [carteira, setCarteira] = useState<string>("")
  const [data, setData] = useState<string>(HOJE)
  const [horario, setHorario] = useState<string>(AGORA)
  const [ecCallId, setEcCallId] = useState("")
  const [operadorId, setOperadorId] = useState<string | null>(null)
  const [tabulacao, setTabulacao] = useState<string>("")
  const [observacao, setObservacao] = useState("")
  const [monitor, setMonitor] = useState("")
  const [statusMap, setStatusMap] = useState<Record<string, StatusItem>>({})

  const carteiras = useMemo(
    () => Array.from(new Set(checklists.map((c) => c.carteira))),
    [checklists],
  )

  const checklist = useMemo(
    () => checklists.find((c) => c.carteira === carteira) || null,
    [checklists, carteira],
  )

  // mostra o checklist apenas após selecionar a tabulação
  const checklistVisivel = Boolean(checklist && tabulacao)

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

  const totais = useMemo(() => {
    let conforme = 0,
      inconforme = 0,
      na = 0
    apontamentos.forEach((a) => {
      if (a.status === "conforme") conforme++
      else if (a.status === "inconforme") inconforme++
      else na++
    })
    return { conforme, inconforme, na }
  }, [apontamentos])

  function setStatus(itemId: string, status: StatusItem) {
    setStatusMap((prev) => {
      const atual = prev[itemId] ?? "conforme"
      // toggle: clicar de novo volta para conforme
      const novo = atual === status ? "conforme" : status
      return { ...prev, [itemId]: novo }
    })
  }

  function resetItens() {
    setStatusMap({})
  }

  function limparTudo() {
    setCarteira("")
    setData(HOJE)
    setHorario(AGORA)
    setEcCallId("")
    setOperadorId(null)
    setTabulacao("")
    setObservacao("")
    setStatusMap({})
  }

  function salvar() {
    if (!checklist) return toast.error("Selecione a carteira.")
    if (!operadorId) return toast.error("Busque e selecione o operador.")
    if (!ecCallId.trim()) return toast.error("Informe o EC ou Call ID.")
    if (!tabulacao) return toast.error("Selecione a tabulação.")

    const operador = operadores.find((o) => o.id === operadorId)!
    const m: Monitoria = {
      id: store.uid(),
      carteira,
      checklistId: checklist.id,
      data,
      horario,
      ecCallId: ecCallId.trim(),
      operadorId,
      operadorNome: operador.nome,
      tabulacao,
      apontamentos,
      nota,
      observacao: observacao.trim(),
      monitor: monitor.trim() || "Monitor",
      criadoEm: new Date().toISOString(),
    }
    store.addMonitoria(m)
    toast.success(`Monitoria salva — nota ${nota} (${faixaNota(nota)})`)
    limparTudo()
  }

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Coluna principal */}
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4 text-primary" />
              Dados da Monitoria
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Carteira</Label>
              <Select
                value={carteira}
                onValueChange={(v) => {
                  setCarteira(v)
                  setOperadorId(null)
                  setStatusMap({})
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a carteira" />
                </SelectTrigger>
                <SelectContent>
                  {carteiras.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Data da monitoria</Label>
                <Input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Horário da ligação</Label>
                <Input
                  type="time"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>EC ou Call ID</Label>
              <Input
                value={ecCallId}
                onChange={(e) => setEcCallId(e.target.value)}
                placeholder="Ex: EC123456"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Monitor de qualidade</Label>
              <Input
                value={monitor}
                onChange={(e) => setMonitor(e.target.value)}
                placeholder="Seu nome"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Operador (banco de dados)</Label>
              <OperadorSearch
                operadores={operadores}
                value={operadorId}
                onChange={setOperadorId}
                filtroCarteira={carteira || undefined}
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Tabulação</Label>
              <Select value={tabulacao} onValueChange={setTabulacao} disabled={!carteira}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      carteira ? "Selecione a tabulação" : "Selecione a carteira primeiro"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {TABULACOES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        {checklistVisivel && checklist ? (
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ListChecks className="size-4 text-primary" />
                  <span className="truncate">{checklist.nome}</span>
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Flegue os itens que o operador NÃO realizou. Itens não flegados
                  são considerados conformes.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={resetItens} className="gap-1.5 shrink-0">
                <RotateCcw className="size-3.5" /> Limpar itens
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {checklist.itens.map((it, idx) => {
                const status = statusMap[it.id] ?? "conforme"
                return (
                  <div
                    key={it.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-xl border border-border bg-secondary/30 p-3 transition-colors sm:flex-row sm:items-center",
                      status === "conforme" && "border-l-2 border-l-chart-5/60",
                      status === "inconforme" && "border-destructive/40 bg-destructive/5 border-l-2 border-l-destructive",
                      status === "na" && "border-border bg-muted/40 border-l-2 border-l-muted-foreground/40",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-medium tabular-nums",
                          status === "inconforme"
                            ? "bg-destructive/15 text-destructive"
                            : status === "na"
                              ? "bg-muted text-muted-foreground"
                              : "bg-chart-5/15 text-chart-5",
                        )}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm leading-snug">{it.texto}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Peso: {it.peso} pts
                          </span>
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
                        className={cn(
                          "gap-1.5",
                          status === "na" && "ring-1 ring-border",
                        )}
                      >
                        <MinusCircle className="size-4" /> Não se aplica
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground">
                <ListChecks className="size-6" />
              </div>
              <p className="text-sm font-medium">Checklist não carregado</p>
              <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                Selecione a <span className="text-foreground">Carteira</span> e a{" "}
                <span className="text-foreground">Tabulação</span> para carregar o
                checklist de itens da monitoria.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Painel lateral de nota */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="size-4 text-primary" />
              Nota da Monitoria
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-secondary/30 py-6">
              <span className={cn("text-5xl font-semibold tabular-nums", notaColorClass(nota))}>
                {nota}
              </span>
              <span className="text-xs text-muted-foreground">de 100 pontos</span>
              <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    nota >= 90 ? "bg-chart-5" : nota >= 70 ? "bg-chart-3" : "bg-destructive",
                  )}
                  style={{ width: `${Math.max(0, Math.min(100, nota))}%` }}
                  aria-hidden
                />
              </div>
              <Badge variant="outline" className="mt-1">
                {faixaNota(nota)}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center gap-1 rounded-lg border border-chart-5/20 bg-chart-5/5 p-2">
                <CheckCircle2 className="size-4 text-chart-5" />
                <p className="text-lg font-semibold tabular-nums text-chart-5">
                  {totais.conforme}
                </p>
                <p className="text-[11px] text-muted-foreground">Conforme</p>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg border border-destructive/20 bg-destructive/5 p-2">
                <XCircle className="size-4 text-destructive" />
                <p className="text-lg font-semibold tabular-nums text-destructive">
                  {totais.inconforme}
                </p>
                <p className="text-[11px] text-muted-foreground">Inconforme</p>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-secondary/30 p-2">
                <MinusCircle className="size-4 text-muted-foreground" />
                <p className="text-lg font-semibold tabular-nums text-muted-foreground">
                  {totais.na}
                </p>
                <p className="text-[11px] text-muted-foreground">N/A</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="flex items-center gap-1.5">
                <FileText className="size-3.5 text-muted-foreground" /> Observações
              </Label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Feedback e observações da monitoria..."
                rows={4}
                className="w-full resize-none rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={salvar} className="gap-2">
                <Save className="size-4" /> Salvar monitoria
              </Button>
              <Button variant="ghost" onClick={limparTudo} className="gap-2">
                <RotateCcw className="size-4" /> Limpar formulário
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
