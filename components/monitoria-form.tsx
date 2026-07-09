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
import { useAuth } from "@/lib/auth"
import { type ApontamentoItem, type StatusItem, type Monitoria, type ChecklistItem } from "@/lib/types"
import { store } from "@/lib/store"
import { notaColorClass, faixaNota } from "@/lib/analytics"
import { cn } from "@/lib/utils"

const HOJE = new Date().toISOString().slice(0, 10)
const AGORA = new Date().toTimeString().slice(0, 5)

export function MonitoriaForm() {
  const { checklists, operadores, vinculos, tabulacoes, ready } = useQualityData()
  const { user } = useAuth()
  const responsavel = user?.nome ?? "Responsável"

  const [carteira, setCarteira] = useState<string>("")
  const [data, setData] = useState<string>(HOJE)
  const [horario, setHorario] = useState<string>(AGORA)
  const [ecCallId, setEcCallId] = useState("")
  const [operadorId, setOperadorId] = useState<string | null>(null)
  const [tabulacao, setTabulacao] = useState<string>("")
  const [observacao, setObservacao] = useState("")
  const [statusMap, setStatusMap] = useState<Record<string, StatusItem>>({})

  const carteiras = useMemo(
    () => Array.from(new Set(checklists.map((c) => c.carteira))),
    [checklists],
  )

  // Vínculos da carteira selecionada
  const vinculosCarteira = useMemo(
    () => vinculos.filter((v) => v.carteira === carteira),
    [vinculos, carteira],
  )

  // Operadores que pertencem à carteira selecionada (mostrados no campo de busca).
  const operadoresCarteira = useMemo(
    () => (carteira ? operadores.filter((o) => o.carteira === carteira) : []),
    [operadores, carteira],
  )

  // Tabulações disponíveis para a carteira. Se a carteira tiver vínculos,
  // usamos somente as tabulações vinculadas; caso contrário, lista completa.
  const tabulacoesDisponiveis = useMemo(() => {
    if (vinculosCarteira.length > 0) {
      return Array.from(new Set(vinculosCarteira.map((v) => v.tabulacao)))
    }
    return tabulacoes
  }, [vinculosCarteira, tabulacoes])

  // Checklist carregado: prioriza o vínculo (carteira + tabulação). Sem vínculo,
  // faz fallback para o primeiro checklist da carteira.
  const checklist = useMemo(() => {
    const vinc = vinculosCarteira.find((v) => v.tabulacao === tabulacao)
    if (vinc) {
      return checklists.find((c) => c.id === vinc.checklistId) || null
    }
    return checklists.find((c) => c.carteira === carteira) || null
  }, [checklists, vinculosCarteira, carteira, tabulacao])

  // mostra o checklist apenas após selecionar a tabulação
  const checklistVisivel = Boolean(checklist && tabulacao)

  const SEM_BLOCO = "Sem bloco"

  // Agrupa os itens por bloco preservando a ordem de aparição (mesma lógica do
  // Editor de Checklist), para reproduzir aqui a mesma construção visual.
  const grupos = useMemo(() => {
    if (!checklist) return [] as { bloco: string; itens: ChecklistItem[] }[]
    const ordem: string[] = []
    const mapa = new Map<string, ChecklistItem[]>()
    for (const it of checklist.itens) {
      const b = it.bloco?.trim() || SEM_BLOCO
      if (!mapa.has(b)) {
        mapa.set(b, [])
        ordem.push(b)
      }
      mapa.get(b)!.push(it)
    }
    return ordem.map((bloco) => ({ bloco, itens: mapa.get(bloco)! }))
  }, [checklist])

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

  // Define o status do item diretamente (seletor segmentado do checklist).
  function selecionarStatus(itemId: string, status: StatusItem) {
    setStatusMap((prev) => ({ ...prev, [itemId]: status }))
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
      monitor: responsavel,
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
            <CardTitle className="text-base">Dados da Monitoria</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Carteira</Label>
              <Select
                value={carteira}
                onValueChange={(v) => {
                  setCarteira(v)
                  setOperadorId(null)
                  setTabulacao("")
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
              <Label>Responsável</Label>
              <Input
                value={responsavel}
                readOnly
                aria-readonly="true"
                className="cursor-not-allowed bg-muted/50 text-muted-foreground"
                title="Preenchido automaticamente com o usuário conectado"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Operador (banco de dados)</Label>
                {carteira && (
                  <span className="text-xs text-muted-foreground">
                    {operadoresCarteira.length}{" "}
                    {operadoresCarteira.length === 1 ? "operador" : "operadores"} na {carteira}
                  </span>
                )}
              </div>
              <OperadorSearch
                operadores={operadores}
                value={operadorId}
                onChange={setOperadorId}
                filtroCarteira={carteira || undefined}
              />
              {!carteira ? (
                <p className="text-xs text-muted-foreground">
                  Selecione uma carteira para listar os operadores vinculados a ela.
                </p>
              ) : operadoresCarteira.length === 0 ? (
                <p className="text-xs text-destructive">
                  Nenhum operador cadastrado nesta carteira. Importe os operadores em
                  Administração → Checklists &amp; Operadores.
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Tabulação</Label>
              <Select
                value={tabulacao}
                onValueChange={(v) => {
                  setTabulacao(v)
                  // o checklist pode mudar conforme a tabulação vinculada
                  setStatusMap({})
                }}
                disabled={!carteira}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      carteira ? "Selecione a tabulação" : "Selecione a carteira primeiro"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {tabulacoesDisponiveis.map((t) => (
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
              <div>
                <CardTitle className="text-base">{checklist.nome}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Flegue os itens que o operador NÃO realizou. Itens não flegados
                  são considerados conformes.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={resetItens} className="gap-1.5">
                <RotateCcw className="size-3.5" /> Limpar itens
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {/* Layout em seções: cada bloco é uma seção com cabeçalho e seus
                  itens listados em cards limpos, com status destacado por cor. */}
              {grupos.map((g) => {
                const blocoTotal = g.itens.reduce(
                  (s, i) => s + (i.critico ? 0 : i.peso || 0),
                  0,
                )
                const blocoCritico = g.itens.some((i) => i.critico)
                return (
                  <section key={g.bloco} className="flex flex-col gap-2.5">
                    {/* Cabeçalho do bloco */}
                    <div
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-lg border bg-secondary/40 px-3 py-2.5",
                        blocoCritico && "border-destructive/30 bg-destructive/5",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-md text-sm font-bold tabular-nums",
                            blocoCritico
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-secondary text-secondary-foreground",
                          )}
                        >
                          {blocoTotal}
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold uppercase tracking-wide">
                            {g.bloco}
                          </h3>
                          <p className="text-[11px] text-muted-foreground">
                            {g.itens.length} {g.itens.length === 1 ? "item" : "itens"} ·{" "}
                            {blocoTotal} pts
                          </p>
                        </div>
                      </div>
                      {blocoCritico && (
                        <Badge
                          variant="outline"
                          className="shrink-0 border-destructive/40 bg-destructive/10 text-destructive"
                        >
                          <AlertTriangle className="mr-1 size-3" /> Bloco crítico
                        </Badge>
                      )}
                    </div>

                    {/* Itens do bloco */}
                    <div className="flex flex-col gap-2 pl-1">
                      {g.itens.map((it) => {
                        const status = statusMap[it.id] ?? "conforme"
                        const acento =
                          status === "inconforme"
                            ? "border-l-destructive"
                            : status === "na"
                              ? "border-l-muted-foreground/50"
                              : "border-l-chart-5"
                        return (
                          <div
                            key={it.id}
                            className={cn(
                              "flex flex-col gap-3 rounded-lg border border-l-4 bg-card p-3 transition-colors lg:flex-row lg:items-center lg:justify-between",
                              acento,
                              status === "inconforme" && "bg-destructive/5",
                              status === "na" && "bg-muted/30",
                            )}
                          >
                            {/* Peso + texto do item */}
                            <div className="flex min-w-0 flex-1 items-start gap-3">
                              <span
                                className={cn(
                                  "flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-bold tabular-nums",
                                  it.critico
                                    ? "bg-destructive text-destructive-foreground"
                                    : "bg-secondary text-secondary-foreground",
                                )}
                                title={it.critico ? "Item crítico (zera a nota)" : "Peso do item"}
                              >
                                {it.peso}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium leading-snug text-pretty">
                                  {it.texto}
                                </p>
                                {it.critico && (
                                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-destructive">
                                    <AlertTriangle className="size-3" /> Crítico — zera a nota
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Seletor segmentado de status */}
                            <div
                              role="radiogroup"
                              aria-label={`Status do item: ${it.texto}`}
                              className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background/60 p-1"
                            >
                              <button
                                type="button"
                                role="radio"
                                aria-checked={status === "conforme"}
                                onClick={() => selecionarStatus(it.id, "conforme")}
                                className={cn(
                                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                                  status === "conforme"
                                    ? "bg-chart-5/15 text-chart-5"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                                )}
                              >
                                <CheckCircle2 className="size-4" /> Conforme
                              </button>
                              <button
                                type="button"
                                role="radio"
                                aria-checked={status === "inconforme"}
                                onClick={() => selecionarStatus(it.id, "inconforme")}
                                className={cn(
                                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                                  status === "inconforme"
                                    ? "bg-destructive text-destructive-foreground"
                                    : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                                )}
                              >
                                <XCircle className="size-4" /> Inconforme
                              </button>
                              <button
                                type="button"
                                role="radio"
                                aria-checked={status === "na"}
                                onClick={() => selecionarStatus(it.id, "na")}
                                className={cn(
                                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                                  status === "na"
                                    ? "bg-secondary text-secondary-foreground ring-1 ring-border"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                                )}
                              >
                                <MinusCircle className="size-4" /> Não se aplica
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="text-sm font-medium">Checklist não carregado</p>
              <p className="max-w-sm text-xs text-muted-foreground">
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
            <CardTitle className="text-base">Nota da Monitoria</CardTitle>
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

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border border-border bg-secondary/30 p-2">
                <p className="text-lg font-semibold tabular-nums text-chart-5">
                  {totais.conforme}
                </p>
                <p className="text-[11px] text-muted-foreground">Conforme</p>
              </div>
              <div className="rounded-md border border-border bg-secondary/30 p-2">
                <p className="text-lg font-semibold tabular-nums text-destructive">
                  {totais.inconforme}
                </p>
                <p className="text-[11px] text-muted-foreground">Inconforme</p>
              </div>
              <div className="rounded-md border border-border bg-secondary/30 p-2">
                <p className="text-lg font-semibold tabular-nums text-muted-foreground">
                  {totais.na}
                </p>
                <p className="text-[11px] text-muted-foreground">N/A</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Observações</Label>
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
