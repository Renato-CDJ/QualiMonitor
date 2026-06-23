"use client"

import { useMemo, useState } from "react"
import {
  UserCheck,
  ClipboardList,
  TrendingUp,
  CheckCircle2,
  AlertOctagon,
  CalendarDays,
  ChevronDown,
  Wallet,
  Trophy,
  Lightbulb,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useQualityData } from "@/lib/use-quality-data"
import {
  porMonitor,
  conformidadePorMonitor,
  porCarteira,
  conformidadePorCarteira,
} from "@/lib/aggregations"
import {
  MonitorVolumePieChart,
  MonitorConformidadeChart,
  MonitorContagemChart,
  CarteiraBarChart,
  ConformidadeCarteiraChart,
} from "@/components/dashboard-charts"
import { CardTitleHint } from "@/components/card-title-hint"
import { AnaliseCategoria } from "@/components/analise-categoria"
import { cn } from "@/lib/utils"

function formatBr(iso: string) {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

function notaTone(n: number) {
  if (n >= 90) return "text-chart-5"
  if (n >= 75) return "text-foreground"
  if (n >= 60) return "text-chart-3"
  return "text-destructive"
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  tone?: "default" | "good" | "bad"
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold tabular-nums",
              tone === "good" && "text-chart-5",
              tone === "bad" && "text-destructive",
            )}
          >
            {value}
          </p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
          <Icon className="size-4" />
        </span>
      </CardContent>
    </Card>
  )
}

export function ResultadoMonitor() {
  const { monitorias, checklists, ready } = useQualityData()

  const monitores = useMemo(
    () => Array.from(new Set(monitorias.map((m) => m.monitor))).sort(),
    [monitorias],
  )
  const carteiras = useMemo(
    () => Array.from(new Set(monitorias.map((m) => m.carteira))).sort(),
    [monitorias],
  )

  const [monitorFiltro, setMonitorFiltro] = useState<string>("todos")
  // Conjunto vazio = todas as carteiras
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [dataInicio, setDataInicio] = useState<string>("")
  const [dataFim, setDataFim] = useState<string>("")

  const todasCarteiras = selecionadas.size === 0

  function toggleCarteira(c: string) {
    setSelecionadas((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })
  }

  function aplicarPreset(dias: number | "tudo") {
    if (dias === "tudo") {
      setDataInicio("")
      setDataFim("")
      return
    }
    const hoje = new Date()
    const fim = hoje.toISOString().slice(0, 10)
    const inicio = new Date(hoje)
    inicio.setDate(inicio.getDate() - (dias - 1))
    setDataInicio(inicio.toISOString().slice(0, 10))
    setDataFim(fim)
  }

  const filtradas = useMemo(
    () =>
      monitorias.filter((m) => {
        if (monitorFiltro !== "todos" && m.monitor !== monitorFiltro) return false
        if (!todasCarteiras && !selecionadas.has(m.carteira)) return false
        if (dataInicio && m.data < dataInicio) return false
        if (dataFim && m.data > dataFim) return false
        return true
      }),
    [monitorias, monitorFiltro, selecionadas, todasCarteiras, dataInicio, dataFim],
  )

  const rankMonitores = useMemo(() => porMonitor(filtradas), [filtradas])
  const confMonitores = useMemo(() => conformidadePorMonitor(filtradas), [filtradas])
  const contagemMonitores = useMemo(
    () =>
      confMonitores.map((m) => ({
        monitor: m.monitor,
        conforme: m.conforme,
        inconforme: m.inconforme,
      })),
    [confMonitores],
  )
  const rankCarteiras = useMemo(() => porCarteira(filtradas), [filtradas])
  const confCarteiras = useMemo(() => conformidadePorCarteira(filtradas), [filtradas])

  const resumo = useMemo(() => {
    const totalMon = filtradas.length
    const notas = filtradas.map((m) => m.nota)
    const notaMedia = notas.length
      ? Math.round((notas.reduce((s, n) => s + n, 0) / notas.length) * 10) / 10
      : 0
    let conforme = 0
    let inconforme = 0
    for (const m of filtradas) {
      for (const ap of m.apontamentos) {
        if (ap.status === "conforme") conforme++
        else if (ap.status === "inconforme") inconforme++
      }
    }
    const avaliados = conforme + inconforme
    return {
      totalMon,
      notaMedia,
      conforme,
      inconforme,
      nMonitores: rankMonitores.length,
      pctConforme: avaliados ? Math.round((conforme / avaliados) * 1000) / 10 : 0,
      pctInconforme: avaliados ? Math.round((inconforme / avaliados) * 1000) / 10 : 0,
    }
  }, [filtradas, rankMonitores.length])

  // Insights de desempenho por carteira (dentro do recorte filtrado)
  const insights = useMemo(() => {
    if (!confCarteiras.length) return null
    const melhorNota = [...rankCarteiras].sort((a, b) => b.nota - a.nota)[0]
    const piorNota = [...rankCarteiras].sort((a, b) => a.nota - b.nota)[0]
    const maisInconforme = [...confCarteiras].sort(
      (a, b) => b.pctInconforme - a.pctInconforme,
    )[0]
    const maiorVolume = [...rankCarteiras].sort((a, b) => b.volume - a.volume)[0]
    return { melhorNota, piorNota, maisInconforme, maiorVolume }
  }, [confCarteiras, rankCarteiras])

  const periodoLabel = useMemo(() => {
    if (dataInicio && dataFim)
      return dataInicio === dataFim
        ? `Dia ${formatBr(dataInicio)}`
        : `${formatBr(dataInicio)} — ${formatBr(dataFim)}`
    if (dataInicio) return `A partir de ${formatBr(dataInicio)}`
    if (dataFim) return `Até ${formatBr(dataFim)}`
    return "Todo o período"
  }, [dataInicio, dataFim])

  const labelCarteiras = todasCarteiras
    ? "Todas as carteiras"
    : selecionadas.size === 1
      ? Array.from(selecionadas)[0]
      : `${selecionadas.size} carteiras`

  const monitorLabel = monitorFiltro === "todos" ? "Todos os monitores" : monitorFiltro

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filtros */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-medium">
          <CalendarDays className="size-4 text-primary" />
          Filtros
        </div>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 p-4">
          {/* Monitor */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Monitor</Label>
            <Select value={monitorFiltro} onValueChange={setMonitorFiltro}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os monitores</SelectItem>
                {monitores.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Carteiras (multi) */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Carteiras</Label>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="h-9 w-52 justify-between gap-2 font-normal">
                    {labelCarteiras}
                    <ChevronDown className="size-4 shrink-0" />
                  </Button>
                }
              />
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Selecionar carteiras</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault()
                    setSelecionadas(new Set())
                  }}
                >
                  <span className={cn(todasCarteiras && "font-medium text-primary")}>
                    Todas as carteiras
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {carteiras.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c}
                    checked={selecionadas.has(c)}
                    onCheckedChange={() => toggleCarteira(c)}
                    closeOnClick={false}
                  >
                    {c}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Período */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rm-data-inicio" className="text-xs text-muted-foreground">
              De
            </Label>
            <Input
              id="rm-data-inicio"
              type="date"
              value={dataInicio}
              max={dataFim || undefined}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rm-data-fim" className="text-xs text-muted-foreground">
              Até
            </Label>
            <Input
              id="rm-data-fim"
              type="date"
              value={dataFim}
              min={dataInicio || undefined}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-40"
            />
          </div>

          {/* Atalhos */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Atalhos</Label>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => aplicarPreset(7)}>
                7d
              </Button>
              <Button variant="ghost" size="sm" onClick={() => aplicarPreset(30)}>
                30d
              </Button>
              <Button variant="ghost" size="sm" onClick={() => aplicarPreset("tudo")}>
                Tudo
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex size-1.5 rounded-full bg-primary" aria-hidden />
            <span className="font-medium text-foreground">{monitorLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Wallet className="size-3.5" />
            {labelCarteiras}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {periodoLabel}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi
          icon={UserCheck}
          label="Monitores"
          value={String(resumo.nMonitores)}
          sub={monitorFiltro === "todos" ? "ativos no período" : "selecionado"}
        />
        <Kpi
          icon={ClipboardList}
          label="Monitorias"
          value={String(resumo.totalMon)}
          sub={periodoLabel}
        />
        <Kpi
          icon={TrendingUp}
          label="Nota média"
          value={String(resumo.notaMedia)}
          tone={resumo.notaMedia >= 75 ? "good" : "bad"}
        />
        <Kpi
          icon={CheckCircle2}
          label="Conformidades"
          value={String(resumo.conforme)}
          sub={`${resumo.pctConforme}% dos avaliados`}
          tone="good"
        />
        <Kpi
          icon={AlertOctagon}
          label="Inconformidades"
          value={String(resumo.inconforme)}
          sub={`${resumo.pctInconforme}% dos avaliados`}
          tone={resumo.inconforme > 0 ? "bad" : "good"}
        />
      </div>

      {/* Quantidade de monitorias por monitor */}
      <Card>
        <CardHeader>
          <CardTitleHint
            title="Quantidade de Monitorias por Monitor"
            description="Distribuição do volume de monitorias realizadas por cada monitor"
          />
        </CardHeader>
        <CardContent>
          {rankMonitores.length ? (
            <MonitorVolumePieChart data={rankMonitores} />
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Sem dados para os filtros selecionados.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Conformidade x Inconformidade + Contagem */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitleHint
              title="Conformidade x Inconformidade por Monitor"
              description="Percentual de itens conformes e inconformes (exclui N.A.)"
            />
          </CardHeader>
          <CardContent>
            {confMonitores.length ? (
              <MonitorConformidadeChart data={confMonitores} />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Sem apontamentos para os filtros selecionados.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitleHint
              title="Quantidade de Apontamentos por Monitor"
              description="Conformidades e inconformidades pontuadas (contagem)"
            />
          </CardHeader>
          <CardContent>
            {contagemMonitores.length ? (
              <MonitorContagemChart data={contagemMonitores} />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Sem apontamentos para os filtros selecionados.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights de desempenho por carteira */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitleHint
              icon={<Lightbulb className="size-4 text-chart-3" />}
              title="Insights de Desempenho por Carteira"
              description={
                monitorFiltro === "todos"
                  ? "Visão geral das carteiras no recorte atual"
                  : `Carteiras avaliadas por ${monitorFiltro} no recorte atual`
              }
            />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Melhor desempenho</p>
              <p className="mt-1 font-medium">{insights.melhorNota.carteira}</p>
              <p className={cn("text-sm font-semibold tabular-nums", notaTone(insights.melhorNota.nota))}>
                nota {insights.melhorNota.nota}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Requer atenção</p>
              <p className="mt-1 font-medium">{insights.piorNota.carteira}</p>
              <p className={cn("text-sm font-semibold tabular-nums", notaTone(insights.piorNota.nota))}>
                nota {insights.piorNota.nota}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Maior inconformidade</p>
              <p className="mt-1 font-medium">{insights.maisInconforme.carteira}</p>
              <p className="text-sm font-semibold tabular-nums text-destructive">
                {insights.maisInconforme.pctInconforme}% inconforme
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Maior volume</p>
              <p className="mt-1 font-medium">{insights.maiorVolume.carteira}</p>
              <p className="text-sm font-semibold tabular-nums text-muted-foreground">
                {insights.maiorVolume.volume} monitorias
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desempenho por carteira (gráficos) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitleHint
              title="Nota Média por Carteira"
              description="Recorte do(s) monitor(es) filtrado(s)"
            />
          </CardHeader>
          <CardContent>
            {rankCarteiras.length ? (
              <CarteiraBarChart data={rankCarteiras} />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Sem dados para os filtros selecionados.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitleHint
              title="Conformidade x Inconformidade por Carteira"
              description="Percentual por carteira (exclui N.A.)"
            />
          </CardHeader>
          <CardContent>
            {confCarteiras.length ? (
              <ConformidadeCarteiraChart data={confCarteiras} />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Sem apontamentos para os filtros selecionados.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ranking de monitores */}
      <Card>
        <CardHeader>
          <CardTitleHint
            title="Ranking de Monitores"
            description="Desempenho consolidado por monitor no recorte atual"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Monitor</TableHead>
                <TableHead className="text-right">Nota média</TableHead>
                <TableHead className="text-right">Monitorias</TableHead>
                <TableHead className="text-right">Conformes</TableHead>
                <TableHead className="text-right">Inconformes</TableHead>
                <TableHead className="text-right">% Conf.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {confMonitores.length ? (
                confMonitores.map((r, i) => (
                  <TableRow key={r.monitor}>
                    <TableCell>
                      {i < 3 ? (
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Trophy
                            className={cn(
                              "size-4",
                              i === 0 && "text-chart-3",
                              i === 1 && "text-muted-foreground",
                              i === 2 && "text-chart-4",
                            )}
                          />
                          {i + 1}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{i + 1}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{r.monitor}</TableCell>
                    <TableCell className={cn("text-right font-semibold tabular-nums", notaTone(r.nota))}>
                      {r.nota}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {r.volume}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-chart-5">{r.conforme}</TableCell>
                    <TableCell className="text-right tabular-nums text-destructive">{r.inconforme}</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-chart-5/15 text-chart-5 tabular-nums">{r.pctConforme}%</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    Sem dados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Análise por categoria do checklist */}
      <AnaliseCategoria
        monitorias={filtradas}
        checklists={checklists}
        carteira={selecionadas.size === 1 ? Array.from(selecionadas)[0] : "todas"}
      />
    </div>
  )
}
