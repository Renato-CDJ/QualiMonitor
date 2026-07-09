"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertTriangle,
  MinusCircle,
  XCircle,
  Save,
  RotateCcw,
  Pencil,
  Check,
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
  // Recolhe o bloco "Dados da Monitoria" assim que o checklist é carregado,
  // dando foco total ao preenchimento do checklist.
  const [dadosColapsados, setDadosColapsados] = useState(false)

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

  const operadorNome = useMemo(
    () => operadores.find((o) => o.id === operadorId)?.nome ?? "",
    [operadores, operadorId],
  )

  // Alterna o status do item. Como só existem os botões "Inconforme" e
  // "Não se aplica", clicar no status já ativo volta o item para "conforme".
  function alternarStatus(itemId: string, status: StatusItem) {
    setStatusMap((prev) => {
      const atual = prev[itemId] ?? "conforme"
      return { ...prev, [itemId]: atual === status ? "conforme" : status }
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
    setDadosColapsados(false)
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
        {/* Resumo compacto: aparece quando o checklist está carregado, ocultando
            o formulário longo de dados já preenchidos. */}
        {dadosColapsados && checklistVisivel && (
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="font-semibold">{carteira}</span>
                <span className="text-muted-foreground">·</span>
                <span className="truncate">{operadorNome || "Operador não selecionado"}</span>
                <Badge variant="secondary" className="font-normal">
                  {tabulacao}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {data.split("-").reverse().join("/")} · {horario}
                  {ecCallId ? ` · ${ecCallId}` : ""}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDadosColapsados(false)}
                className="gap-1.5"
              >
                <Pencil className="size-3.5" /> Editar dados
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className={cn(dadosColapsados && checklistVisivel && "hidden")}>
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">Dados da Monitoria</CardTitle>
            {checklistVisivel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDadosColapsados(true)}
                className="gap-1.5"
              >
                <Check className="size-3.5" /> Concluir
              </Button>
            )}
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
                  setDadosColapsados(false)
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
                  // recolhe o bloco de dados para dar foco ao checklist
                  if (v) setDadosColapsados(true)
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
                  <section
                    key={g.bloco}
                    className={cn(
                      "grid gap-4 rounded-xl border bg-card/40 p-3 md:grid-cols-[220px_1fr] md:gap-5 md:p-4",
                      blocoCritico && "border-destructive/25",
                    )}
                  >
                    {/* Cabeçalho do bloco (lateral) */}
                    <div className="flex flex-col gap-3 md:sticky md:top-4 md:self-start">
                      <div
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3",
                          blocoCritico
                            ? "border-destructive/30 bg-destructive/[0.06]"
                            : "border-border bg-secondary/50",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-11 shrink-0 items-center justify-center rounded-lg text-base font-bold tabular-nums",
                            blocoCritico
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-primary text-primary-foreground",
                          )}
                        >
                          {blocoTotal}
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold leading-tight text-balance">
                            {g.bloco}
                          </h3>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {g.itens.length} {g.itens.length === 1 ? "item" : "itens"} ·{" "}
                            {blocoTotal} pts
                          </p>
                        </div>
                      </div>
                      {blocoCritico && (
                        <span className="inline-flex w-fit items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive">
                          <AlertTriangle className="size-3" /> Bloco crítico
                        </span>
                      )}
                    </div>

                    {/* Itens do bloco */}
                    <div className="flex flex-col gap-2.5">
                      {g.itens.map((it) => {
                        const status = statusMap[it.id] ?? "conforme"
                        const acento =
                          status === "inconforme"
                            ? "border-l-destructive"
                            : status === "na"
                              ? "border-l-muted-foreground/50"
                              : "border-l-chart-5/70"
                        return (
                          <div
                            key={it.id}
                            className={cn(
                              "flex flex-col gap-3 rounded-lg border border-l-[3px] bg-background p-3.5 shadow-sm transition-colors lg:flex-row lg:items-center lg:justify-between",
                              acento,
                              status === "inconforme" && "bg-destructive/[0.05]",
                              status === "na" && "bg-muted/50",
                            )}
                          >
                            {/* Texto do item + indicador de status atual */}
                            <div className="flex min-w-0 flex-1 items-start gap-3">
                              <span
                                className={cn(
                                  "flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums",
                                  it.critico
                                    ? "bg-destructive text-destructive-foreground"
                                    : "bg-secondary text-secondary-foreground",
                                )}
                                title={it.critico ? "Item crítico (zera a nota)" : "Peso do item"}
                              >
                                {it.peso}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium leading-relaxed text-pretty">
                                  {it.texto}
                                </p>
                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1.5 text-[11px] font-medium",
                                      status === "inconforme"
                                        ? "text-destructive"
                                        : status === "na"
                                          ? "text-muted-foreground"
                                          : "text-chart-5",
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "size-1.5 rounded-full",
                                        status === "inconforme"
                                          ? "bg-destructive"
                                          : status === "na"
                                            ? "bg-muted-foreground"
                                            : "bg-chart-5",
                                      )}
                                    />
                                    {status === "inconforme"
                                      ? "Inconforme"
                                      : status === "na"
                                        ? "Não se aplica"
                                        : "Conforme"}
                                  </span>
                                  {it.critico && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive">
                                      <AlertTriangle className="size-3" /> Crítico — zera a nota
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Ações: apenas Inconforme e Não se aplica (toggle) */}
                            <div className="flex shrink-0 items-center gap-2 lg:pl-3">
                              <button
                                type="button"
                                onClick={() => alternarStatus(it.id, "inconforme")}
                                aria-pressed={status === "inconforme"}
                                className={cn(
                                  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors lg:flex-none",
                                  status === "inconforme"
                                    ? "border-destructive bg-destructive text-destructive-foreground"
                                    : "border-border bg-transparent text-muted-foreground hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive",
                                )}
                              >
                                <XCircle className="size-4" /> Inconforme
                              </button>
                              <button
                                type="button"
                                onClick={() => alternarStatus(it.id, "na")}
                                aria-pressed={status === "na"}
                                className={cn(
                                  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors lg:flex-none",
                                  status === "na"
                                    ? "border-foreground/30 bg-secondary text-secondary-foreground"
                                    : "border-border bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
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
