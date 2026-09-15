"use client"

import { useMemo, useState, type CSSProperties } from "react"
import { CalendarDays, ChevronRight, Download, History, Layers, RotateCcw, Search } from "lucide-react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CardTitleHint } from "@/components/card-title-hint"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { analiseCategoriaPorOperador, historicoApontamentos } from "@/lib/aggregations"
import type { HistoricoApontamento } from "@/lib/aggregations"
import type { Checklist, Monitoria } from "@/lib/types"
import { cn } from "@/lib/utils"

function pctTone(pct: number) {
  if (pct >= 90) return "text-chart-5"
  if (pct >= 75) return "text-chart-1"
  if (pct >= 60) return "text-chart-3"
  return "text-destructive"
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(`${value}T12:00:00`),
  )
}

export function AnalisOperadorComparacao({ monitorias, checklists, carteira }: { monitorias: Monitoria[]; checklists: Checklist[]; carteira?: string }) {
  const dados = useMemo(() => analiseCategoriaPorOperador(monitorias, checklists, carteira), [monitorias, checklists, carteira])
  const operadores = useMemo(() => Array.from(new Set(monitorias.map((m) => m.operadorNome))).sort((a, b) => a.localeCompare(b, "pt-BR")), [monitorias])
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [operadorSelecionado, setOperadorSelecionado] = useState("todos")
  const [buscaOperador, setBuscaOperador] = useState("")
  const operadoresVisiveis = useMemo(
    () => operadores.filter((operador) => operador.toLocaleLowerCase("pt-BR").includes(buscaOperador.toLocaleLowerCase("pt-BR"))),
    [operadores, buscaOperador],
  )
  const dadosVisiveis = useMemo(
    () => operadorSelecionado === "todos" ? dados : dados.filter((item) => item.operador === operadorSelecionado),
    [dados, operadorSelecionado],
  )
  const [operadorFiltro, setOperadorFiltro] = useState("todos")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

  const blocos = useMemo(() => {
    const mapa = new Map<string, typeof dadosVisiveis>()
    for (const item of dadosVisiveis) {
      if (!mapa.has(item.bloco)) mapa.set(item.bloco, [])
      mapa.get(item.bloco)!.push(item)
    }
    const round1 = (n: number) => Math.round(n * 10) / 10
    return Array.from(mapa.entries()).map(([bloco, itens]) => {
      const conforme = itens.reduce((s, i) => s + i.conforme, 0)
      const inconforme = itens.reduce((s, i) => s + i.inconforme, 0)
      const qtd = conforme + inconforme
      return { bloco, conforme, inconforme, qtd, pctConforme: qtd ? round1((conforme / qtd) * 100) : 0, pctInconforme: qtd ? round1((inconforme / qtd) * 100) : 0, itens: itens.sort((a, b) => a.operador.localeCompare(b.operador, "pt-BR")) }
    }).sort((a, b) => a.bloco.localeCompare(b.bloco, "pt-BR"))
  }, [dadosVisiveis])

  const operadorResumo = useMemo(() => operadores.map((operador) => {
    const itens = dados.filter((item) => item.operador === operador)
    const conforme = itens.reduce((sum, item) => sum + item.conforme, 0)
    const inconforme = itens.reduce((sum, item) => sum + item.inconforme, 0)
    const avaliados = conforme + inconforme
    const totalMonitorias = new Set(monitorias.filter((monitoria) => monitoria.operadorNome === operador).map((monitoria) => monitoria.id)).size
    return { operador, monitorias: totalMonitorias, media: avaliados ? Math.round((conforme / avaliados) * 100) : 0 }
  }), [dados, operadores, monitorias])

  const historico = useMemo(() => historicoApontamentos(monitorias, checklists, operadorFiltro === "todos" ? undefined : operadorFiltro).filter((item) => (!dataInicio || item.data >= dataInicio) && (!dataFim || item.data <= dataFim)), [monitorias, checklists, operadorFiltro, dataInicio, dataFim])
  const agrupado = useMemo(() => {
    const mapa = new Map<string, typeof historico>()
    for (const item of historico) {
      const chave = item.data
      if (!mapa.has(chave)) mapa.set(chave, [])
      mapa.get(chave)!.push(item)
    }
    return Array.from(mapa.entries()).sort(([a], [b]) => b.localeCompare(a))
  }, [historico])

  function toggle(bloco: string) {
    setAbertos((prev) => { const next = new Set(prev); next.has(bloco) ? next.delete(bloco) : next.add(bloco); return next })
  }
  const todosAbertos = blocos.length > 0 && abertos.size === blocos.length
  const periodoLabel = dataInicio && dataFim
    ? dataInicio === dataFim
      ? `Em ${formatDate(dataInicio)}`
      : `${formatDate(dataInicio)} até ${formatDate(dataFim)}`
    : dataInicio
      ? `A partir de ${formatDate(dataInicio)}`
      : dataFim
        ? `Até ${formatDate(dataFim)}`
        : "Todo o período"
  const totalConformes = historico.filter((item) => item.status === "conforme").length
  const totalInconformes = historico.filter((item) => item.status === "inconforme").length
  const totalNaoAplicaveis = historico.filter((item) => item.status !== "conforme" && item.status !== "inconforme").length
  const historicoDatas = useMemo(() => Array.from(new Set(historico.map((item) => item.data))).sort((a, b) => a.localeCompare(b)), [historico])
  const historicoItens = useMemo(() => {
    const mapa = new Map<string, { texto: string; bloco: string; porData: Map<string, HistoricoApontamento> }>()
    for (const item of historico) {
      const atual = mapa.get(item.itemId) ?? { texto: item.texto, bloco: item.bloco, porData: new Map() }
      atual.porData.set(item.data, item)
      mapa.set(item.itemId, atual)
    }
    return Array.from(mapa.values()).sort((a, b) => a.bloco.localeCompare(b.bloco, "pt-BR") || a.texto.localeCompare(b.texto, "pt-BR"))
  }, [historico])

  function exportarExcel() {
    if (blocos.length === 0) return

    const resumo = blocos.map((bloco) => ({
      Tópico: bloco.bloco,
      "Quantidade de itens": bloco.qtd,
      "Conformes": bloco.conforme,
      "Inconformes": bloco.inconforme,
      "% Conforme": bloco.pctConforme,
      "% Inconforme": bloco.pctInconforme,
    }))
    const detalhamento = dados.map((item) => ({
      Tópico: item.bloco,
      Item: item.texto,
      "ID do item": item.itemId,
      Operador: item.operador,
      "ID do operador": item.operadorId,
      "Quantidade avaliada": item.qtd,
      Conformes: item.conforme,
      Inconformes: item.inconforme,
      "Não se aplica": item.na,
      "% Conforme": item.pctConforme,
      "% Inconforme": item.pctInconforme,
    }))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(resumo), "Resumo por tópico")
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(detalhamento), "Detalhamento")
    const data = new Intl.DateTimeFormat("pt-BR").format(new Date()).replaceAll("/", "-")
    XLSX.writeFile(workbook, `comparativo-evolucao-${data}.xlsx`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitleHint icon={<Layers className="size-4 text-muted-foreground" />} title="Resultado do Operador por Item" description="Compare os resultados por tópico e acompanhe a conformidade de cada operador nos itens do checklist." />
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="comparativo" className="flex flex-col gap-5">
          <TabsList className="w-fit">
            <TabsTrigger value="comparativo">Visão por tópico</TabsTrigger>
            <TabsTrigger value="historico" className="gap-2"><History className="size-4" /> Histórico de apontamentos</TabsTrigger>
          </TabsList>
          <TabsContent value="comparativo" className="mt-0">
            <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
              <Button type="button" variant="outline" size="sm" onClick={exportarExcel} disabled={blocos.length === 0}>
                <Download data-icon="inline-start" />
                Exportar Excel
              </Button>
              {blocos.length > 0 && <Button type="button" variant="ghost" size="sm" onClick={() => setAbertos(todosAbertos ? new Set() : new Set(blocos.map((b) => b.bloco)))}>{todosAbertos ? "Recolher tudo" : "Expandir tudo"}</Button>}
            </div>
            {operadores.length > 0 && <div className="grid gap-4 rounded-2xl border bg-muted/20 p-4 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="flex min-h-0 flex-col gap-3">
                <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Operadores da carteira</p><p className="mt-1 text-xs text-muted-foreground">Selecione um operador para detalhar os resultados.</p></div>
                <div className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Pesquisar operador" placeholder="Pesquisar operador..." value={buscaOperador} onChange={(event) => setBuscaOperador(event.target.value)} className="pl-9" /></div>
                <div className="max-h-80 overflow-y-auto pr-1">
                  <div className="flex flex-col gap-2">
                    <button type="button" onClick={() => setOperadorSelecionado("todos")} className={cn("rounded-xl border px-4 py-3 text-left transition-colors", operadorSelecionado === "todos" ? "border-primary bg-primary/10" : "bg-background hover:border-primary/40")}><p className="text-sm font-semibold">Todos os operadores</p><p className="mt-1 text-xs text-muted-foreground">Visão consolidada da carteira</p></button>
                    {operadorResumo.filter((item) => operadoresVisiveis.includes(item.operador)).map((item) => <button key={item.operador} type="button" onClick={() => setOperadorSelecionado(item.operador)} className={cn("rounded-xl border px-4 py-3 text-left transition-colors", operadorSelecionado === item.operador ? "border-primary bg-primary/10" : "bg-background hover:border-primary/40")}><p className="truncate text-sm font-semibold">{item.operador}</p><p className="mt-1 text-xs text-muted-foreground">{item.monitorias} monitorias · média {item.media}%</p></button>)}
                  </div>
                </div>
              </div>
              <div className="min-w-0 overflow-hidden rounded-xl border bg-background/70">
                <div className="grid min-w-[600px] grid-cols-[minmax(220px,1fr)_100px_110px_110px] gap-2 border-b bg-secondary/50 px-3 py-2 text-xs font-medium text-muted-foreground"><span>Tópico</span><span className="text-right">Qtd Itens</span><span className="text-right">% Conforme</span><span className="text-right">% Inconforme</span></div>
                {blocos.length === 0 ? <p className="px-4 py-10 text-center text-sm text-muted-foreground">Sem apontamentos para este operador.</p> : <div className="min-w-[600px]">{blocos.map((bloco, idx) => { const aberto = abertos.has(bloco.bloco); return <div key={bloco.bloco}><button type="button" onClick={() => toggle(bloco.bloco)} aria-expanded={aberto} className={cn("grid w-full grid-cols-[minmax(220px,1fr)_100px_110px_110px] items-center gap-2 px-3 py-3 text-left transition-colors hover:bg-secondary/40", idx % 2 === 1 && "bg-secondary/20")}><span className="flex items-center gap-2 font-medium"><ChevronRight className={cn("size-4 text-muted-foreground transition-transform", aberto && "rotate-90")} />{bloco.bloco}</span><span className="text-right tabular-nums font-medium">{bloco.qtd}</span><span className={cn("text-right tabular-nums font-medium", pctTone(bloco.pctConforme))}>{bloco.pctConforme}%</span><span className="text-right tabular-nums font-medium text-destructive">{bloco.pctInconforme > 0 ? `${bloco.pctInconforme}%` : "—"}</span></button>{aberto && <div className="border-t bg-background px-4 py-3">{Array.from(new Map(bloco.itens.map((item) => [item.itemId, item])).values()).map((item) => <div key={item.itemId} className={cn("mb-3 last:mb-0", operadorSelecionado !== "todos" && "grid grid-cols-[minmax(0,1fr)_100px_100px] items-center gap-2 border-b border-border/40 pb-2 last:border-b-0 last:pb-0")}><p className={cn("pl-6 text-sm text-muted-foreground", operadorSelecionado === "todos" && "mb-2")}>{item.texto}</p><div className={cn("ml-6 flex flex-col gap-1", operadorSelecionado !== "todos" && "contents")}>{bloco.itens.filter((i) => i.itemId === item.itemId).map((i) => operadorSelecionado === "todos" ? <div key={i.operadorId} className="grid grid-cols-[1fr_100px_100px] gap-2 text-xs"><span className="truncate text-muted-foreground">{i.operador}</span><span className={cn("text-right tabular-nums", pctTone(i.pctConforme))}>{i.pctConforme}% conforme</span><span className="text-right tabular-nums text-destructive">{i.pctInconforme > 0 ? `${i.pctInconforme}% inconforme` : "—"}</span></div> : <div key={i.operadorId} className="grid grid-cols-[1fr_100px_100px] gap-2 text-xs"><span aria-hidden="true" /><span className={cn("text-right tabular-nums", pctTone(i.pctConforme))}>{i.pctConforme}% conforme</span><span className="text-right tabular-nums text-destructive">{i.pctInconforme > 0 ? `${i.pctInconforme}% inconforme` : "—"}</span></div>)}</div></div>)}</div>}</div> })}</div>}
              </div>
            </div>}
            {false && <div>{/* blocos.map((bloco, idx) => { const aberto = abertos.has(bloco.bloco); return <div key={bloco.bloco}><button type="button" onClick={() => toggle(bloco.bloco)} aria-expanded={aberto} className={cn("grid w-full grid-cols-[1fr_100px_100px_100px] items-center gap-2 px-3 py-3 text-left transition-colors hover:bg-secondary/40", idx % 2 === 1 && "bg-secondary/20")}><span className="flex items-center gap-2 font-medium"><ChevronRight className={cn("size-4 text-muted-foreground transition-transform", aberto && "rotate-90")} />{bloco.bloco}</span><span className="text-right tabular-nums font-medium">{bloco.qtd}</span><span className={cn("text-right tabular-nums font-medium", pctTone(bloco.pctConforme))}>{bloco.pctConforme}%</span><span className="text-right tabular-nums font-medium text-destructive">{bloco.pctInconforme > 0 ? `${bloco.pctInconforme}%` : "—"}</span></button>{aberto && <div className="border-t bg-background px-3 py-3">{Array.from(new Map(bloco.itens.map((item) => [item.itemId, item])).values()).map((item) => <div key={item.itemId} className="mb-3 last:mb-0"><p className="mb-2 pl-6 text-sm text-muted-foreground">{item.texto}</p><div className="ml-6 flex flex-col gap-1">{bloco.itens.filter((i) => i.itemId === item.itemId).map((i) => operadorSelecionado === "todos" ? <div key={i.operadorId} className="grid grid-cols-[1fr_100px_100px] gap-2 text-xs"><span className="truncate text-muted-foreground">{i.operador}</span><span className={cn("text-right tabular-nums", pctTone(i.pctConforme))}>{i.pctConforme}% conforme</span><span className="text-right tabular-nums text-destructive">{i.pctInconforme > 0 ? `${i.pctInconforme}% inconforme` : "—"}</span></div> : <div key={i.operadorId} className="grid grid-cols-[1fr_100px_100px] gap-2 text-xs"><span aria-hidden="true" /><span className={cn("text-right tabular-nums", pctTone(i.pctConforme))}>{i.pctConforme}% conforme</span><span className="text-right tabular-nums text-destructive">{i.pctInconforme > 0 ? `${i.pctInconforme}% inconforme` : "—"}</span></div>)}</div></div>)}</div>}</div> })}*/}</div>}
          </TabsContent>
          <TabsContent value="historico" className="mt-0 flex flex-col gap-4">
            <div className="rounded-xl border bg-secondary/20 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid flex-1 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5"><Label htmlFor="historico-operador" className="text-xs text-muted-foreground">Quem analisar</Label><Select value={operadorFiltro} onValueChange={setOperadorFiltro}><SelectTrigger id="historico-operador"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os operadores</SelectItem>{operadores.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
                  <div className="flex flex-col gap-1.5"><Label htmlFor="historico-inicio" className="text-xs text-muted-foreground">Data inicial</Label><div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input id="historico-inicio" type="date" value={dataInicio} max={dataFim || undefined} onChange={(e) => setDataInicio(e.target.value)} className="pl-9" /></div></div>
                  <div className="flex flex-col gap-1.5"><Label htmlFor="historico-fim" className="text-xs text-muted-foreground">Data final</Label><div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input id="historico-fim" type="date" value={dataFim} min={dataInicio || undefined} onChange={(e) => setDataFim(e.target.value)} className="pl-9" /></div></div>
                </div>
                {(operadorFiltro !== "todos" || dataInicio || dataFim) && <Button type="button" variant="ghost" size="sm" onClick={() => { setOperadorFiltro("todos"); setDataInicio(""); setDataFim("") }}><RotateCcw data-icon="inline-start" />Limpar filtros</Button>}
              </div>
              <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Período exibido</p><p className="mt-1 text-sm font-semibold">{periodoLabel}</p></div>
                <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-secondary px-3 py-1.5 text-muted-foreground"><strong className="text-foreground">{historico.length}</strong> apontamentos</span><span className="rounded-full bg-chart-5/15 px-3 py-1.5 text-chart-5"><strong>{totalConformes}</strong> conformes</span><span className="rounded-full bg-destructive/15 px-3 py-1.5 text-destructive"><strong>{totalInconformes}</strong> inconformes</span>{totalNaoAplicaveis > 0 && <span className="rounded-full bg-secondary px-3 py-1.5 text-muted-foreground"><strong className="text-foreground">{totalNaoAplicaveis}</strong> N.A.</span>}</div>
              </div>
            </div>
            {historicoItens.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">Nenhum apontamento encontrado nesse período.</p> : <div className="overflow-x-auto rounded-xl border"><div className="min-w-[720px]"><div className="grid grid-cols-[minmax(260px,1fr)_repeat(var(--historico-datas),minmax(112px,1fr))] border-b bg-secondary/40" style={{ "--historico-datas": historicoDatas.length } as CSSProperties}><div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Item do checklist</div>{historicoDatas.map((data) => <div key={data} className="border-l px-3 py-3 text-center text-xs font-semibold text-muted-foreground">{formatDate(data)}</div>)}</div>{historicoItens.map((item) => <div key={`${item.bloco}-${item.texto}`} className="grid grid-cols-[minmax(260px,1fr)_repeat(var(--historico-datas),minmax(112px,1fr))] border-b last:border-b-0" style={{ "--historico-datas": historicoDatas.length } as CSSProperties}><div className="flex min-h-16 flex-col justify-center px-4 py-2"><p className="text-sm font-medium">{item.texto}</p><p className="text-xs text-muted-foreground">{item.bloco}</p></div>{historicoDatas.map((data) => { const apontamento = item.porData.get(data); return <div key={data} className="flex min-h-16 items-center justify-center border-l px-2 py-2">{apontamento ? <span className={cn("rounded-full border px-2.5 py-1 text-center text-xs font-semibold", apontamento.status === "conforme" ? "border-chart-5/30 bg-chart-5/10 text-chart-5" : apontamento.status === "inconforme" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-border bg-secondary text-muted-foreground")} title={`${apontamento.monitor} · Nota ${apontamento.nota}`}>{apontamento.status === "conforme" ? "Conforme" : apontamento.status === "inconforme" ? "Inconforme" : "N.A."}</span> : <span className="text-xs text-muted-foreground/40">—</span>}</div>})}</div>)}</div></div>}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
