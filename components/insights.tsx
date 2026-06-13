"use client"

import { useMemo, useState } from "react"
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  MinusCircle,
  TrendingUp,
  ListChecks,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQualityData } from "@/lib/use-quality-data"
import { aderenciaItens, resumoConformidade, type ItemAderencia } from "@/lib/aggregations"
import { ConformidadePieChart, AderenciaItensChart } from "@/components/dashboard-charts"
import { cn } from "@/lib/utils"

function formatBr(iso: string) {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
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
  tone?: "default" | "good" | "bad" | "muted"
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
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground",
            tone === "good" && "bg-chart-5/15 text-chart-5",
            tone === "bad" && "bg-destructive/15 text-destructive",
          )}
        >
          <Icon className="size-4" />
        </span>
      </CardContent>
    </Card>
  )
}

function truncar(texto: string, n = 30) {
  return texto.length > n ? texto.slice(0, n) + "…" : texto
}

/* Barra de proporção conforme / inconforme / N.A. */
function ProporcaoBar({ item }: { item: ItemAderencia }) {
  const c = item.total ? (item.conforme / item.total) * 100 : 0
  const i = item.total ? (item.inconforme / item.total) * 100 : 0
  const n = item.total ? (item.na / item.total) * 100 : 0
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-secondary" aria-hidden>
      <span style={{ width: `${c}%`, backgroundColor: "#16a34a" }} />
      <span style={{ width: `${i}%`, backgroundColor: "#ef4444" }} />
      <span style={{ width: `${n}%`, backgroundColor: "#94a3b8" }} />
    </div>
  )
}

export function Insights() {
  const { monitorias, checklists, ready } = useQualityData()
  const [carteiraFiltro, setCarteiraFiltro] = useState<string>("todas")
  const [visao, setVisao] = useState<"aderencia" | "oportunidade">("aderencia")
  const [dataInicio, setDataInicio] = useState<string>("")
  const [dataFim, setDataFim] = useState<string>("")

  const carteiras = useMemo(
    () => Array.from(new Set(monitorias.map((m) => m.carteira))),
    [monitorias],
  )

  const filtradas = useMemo(
    () =>
      monitorias.filter((m) => {
        if (carteiraFiltro !== "todas" && m.carteira !== carteiraFiltro) return false
        if (dataInicio && m.data < dataInicio) return false
        if (dataFim && m.data > dataFim) return false
        return true
      }),
    [monitorias, carteiraFiltro, dataInicio, dataFim],
  )

  const periodoLabel = useMemo(() => {
    if (dataInicio && dataFim)
      return dataInicio === dataFim
        ? `Dia ${formatBr(dataInicio)}`
        : `${formatBr(dataInicio)} — ${formatBr(dataFim)}`
    if (dataInicio) return `A partir de ${formatBr(dataInicio)}`
    if (dataFim) return `Até ${formatBr(dataFim)}`
    return "Todo o período"
  }, [dataInicio, dataFim])

  const itens = useMemo(
    () => aderenciaItens(filtradas, checklists),
    [filtradas, checklists],
  )
  const resumo = useMemo(() => resumoConformidade(filtradas), [filtradas])

  const topAderencia = useMemo(
    () => [...itens].sort((a, b) => b.pctConforme - a.pctConforme).slice(0, 8),
    [itens],
  )
  const topOportunidade = useMemo(
    () => [...itens].sort((a, b) => b.pctInconforme - a.pctInconforme).slice(0, 8),
    [itens],
  )
  const topNa = useMemo(
    () => [...itens].sort((a, b) => b.na - a.na).slice(0, 8),
    [itens],
  )

  const tabelaOrdenada = useMemo(
    () =>
      [...itens].sort((a, b) =>
        visao === "aderencia"
          ? b.pctConforme - a.pctConforme
          : b.pctInconforme - a.pctInconforme,
      ),
    [itens, visao],
  )

  const chartData = useMemo(() => {
    const base = visao === "aderencia" ? topAderencia : topOportunidade
    return base.map((it) => ({
      item: truncar(it.texto, 24),
      itemCompleto: it.texto,
      pct: visao === "aderencia" ? it.pctConforme : it.pctInconforme,
      qtd: visao === "aderencia" ? it.conforme : it.inconforme,
    }))
  }, [visao, topAderencia, topOportunidade])

  const pieData = useMemo(
    () => [
      { tipo: "Conforme", qtd: resumo.conforme, cor: "#16a34a" },
      { tipo: "Inconforme", qtd: resumo.inconforme, cor: "#ef4444" },
      { tipo: "Não se aplica", qtd: resumo.na, cor: "#94a3b8" },
    ],
    [resumo],
  )

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
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Carteira</Label>
            <Select value={carteiraFiltro} onValueChange={setCarteiraFiltro}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as carteiras</SelectItem>
                {carteiras.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ins-inicio" className="text-xs text-muted-foreground">
              De
            </Label>
            <Input
              id="ins-inicio"
              type="date"
              value={dataInicio}
              max={dataFim || undefined}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ins-fim" className="text-xs text-muted-foreground">
              Até
            </Label>
            <Input
              id="ins-fim"
              type="date"
              value={dataFim}
              min={dataInicio || undefined}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Atalhos</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDataInicio("")
                setDataFim("")
              }}
            >
              Limpar período
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          <span className="inline-flex size-1.5 rounded-full bg-primary" aria-hidden />
          Exibindo resultados de:{" "}
          <span className="font-medium text-foreground">{periodoLabel}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          icon={ListChecks}
          label="Itens avaliados"
          value={String(resumo.total)}
          sub={`${itens.length} itens distintos`}
        />
        <Kpi
          icon={CheckCircle2}
          label="Conformes"
          value={`${resumo.pctConforme}%`}
          sub={`${resumo.conforme} apontamentos`}
          tone="good"
        />
        <Kpi
          icon={XCircle}
          label="Inconformes"
          value={`${resumo.pctInconforme}%`}
          sub={`${resumo.inconforme} apontamentos`}
          tone="bad"
        />
        <Kpi
          icon={MinusCircle}
          label="Não se aplica"
          value={`${resumo.pctNa}%`}
          sub={`${resumo.na} apontamentos`}
          tone="muted"
        />
      </div>

      {/* Donut consolidado + destaques */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conformidade Geral</CardTitle>
            <p className="text-xs text-muted-foreground">
              Distribuição de Conforme · Inconforme · Não se aplica
            </p>
          </CardHeader>
          <CardContent>
            <ConformidadePieChart data={pieData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4 text-chart-5" />
              Maior Aderência
            </CardTitle>
            <p className="text-xs text-muted-foreground">Itens mais conformes</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {topAderencia.slice(0, 5).map((it) => (
              <div key={it.itemId} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate" title={it.texto}>
                  {it.texto}
                </span>
                <Badge className="shrink-0 border-chart-5/30 bg-chart-5/15 text-chart-5">
                  {it.pctConforme}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="size-4 text-destructive" />
              Oportunidades
            </CardTitle>
            <p className="text-xs text-muted-foreground">Itens mais inconformes</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {topOportunidade.slice(0, 5).map((it) => (
              <div key={it.itemId} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate" title={it.texto}>
                  {it.texto}
                </span>
                <Badge className="shrink-0 border-destructive/30 bg-destructive/15 text-destructive">
                  {it.pctInconforme}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Visão por gráfico (toggle aderência / oportunidade) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">
              {visao === "aderencia" ? "Top Aderência por Item" : "Top Oportunidades por Item"}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {visao === "aderencia"
                ? "% de conformidade por item do checklist"
                : "% de inconformidade por item do checklist"}
            </p>
          </div>
          <Tabs value={visao} onValueChange={(v) => setVisao(v as typeof visao)}>
            <TabsList>
              <TabsTrigger value="aderencia">Aderência</TabsTrigger>
              <TabsTrigger value="oportunidade">Oportunidade</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {chartData.length ? (
            <AderenciaItensChart data={chartData} tipo={visao} />
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Sem dados no período selecionado.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabela detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhamento por Item</CardTitle>
          <p className="text-xs text-muted-foreground">
            Conforme, Inconforme e Não se aplica com percentuais. Ordenado por{" "}
            {visao === "aderencia" ? "maior aderência" : "maior oportunidade"}.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Item do Checklist</TableHead>
                  <TableHead>Carteira</TableHead>
                  <TableHead className="text-right text-chart-5">Conforme</TableHead>
                  <TableHead className="text-right text-destructive">Inconforme</TableHead>
                  <TableHead className="text-right">N.A.</TableHead>
                  <TableHead className="min-w-[140px]">Proporção</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tabelaOrdenada.length ? (
                  tabelaOrdenada.map((it) => (
                    <TableRow key={it.itemId}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          {it.texto}
                          {it.critico && (
                            <Badge
                              variant="outline"
                              className="border-destructive/40 text-destructive"
                            >
                              crítico
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{it.carteira}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className="font-medium text-chart-5">{it.pctConforme}%</span>
                        <span className="ml-1 text-xs text-muted-foreground">({it.conforme})</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className="font-medium text-destructive">{it.pctInconforme}%</span>
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({it.inconforme})
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className="font-medium">{it.pctNa}%</span>
                        <span className="ml-1 text-xs text-muted-foreground">({it.na})</span>
                      </TableCell>
                      <TableCell>
                        <ProporcaoBar item={it} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      Sem dados no período selecionado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Itens com mais "Não se aplica" */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MinusCircle className="size-4 text-muted-foreground" />
            Itens mais marcados como &quot;Não se aplica&quot;
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Itens frequentemente não avaliados podem indicar revisão do checklist
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {topNa.filter((it) => it.na > 0).length ? (
              topNa
                .filter((it) => it.na > 0)
                .map((it) => (
                  <div
                    key={it.itemId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate" title={it.texto}>
                      {it.texto}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {it.na} <span className="text-xs">({it.pctNa}%)</span>
                    </span>
                  </div>
                ))
            ) : (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                Nenhum item marcado como &quot;Não se aplica&quot; no período.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
