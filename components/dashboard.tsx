"use client"

import { useMemo, useState } from "react"
import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  ClipboardList,
  TrendingUp,
  RotateCcw,
  CalendarDays,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useQualityData } from "@/lib/use-quality-data"
import { store } from "@/lib/store"
import {
  serieTemporal,
  porTabulacao,
  distribuicaoFaixas,
  paretoItens,
  kpis,
  type Periodicidade,
} from "@/lib/aggregations"
import {
  TendenciaChart,
  VolumeNotaChart,
  FaixasPieChart,
  TabulacaoPieChart,
  ParetoChart,
} from "@/components/dashboard-charts"
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

export function Dashboard() {
  const { monitorias, checklists, ready } = useQualityData()
  const periodo: Periodicidade = "diario"
  const [carteiraFiltro, setCarteiraFiltro] = useState<string>("todas")
  const [dataInicio, setDataInicio] = useState<string>(() => {
    const hoje = new Date()
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
  })
  const [dataFim, setDataFim] = useState<string>(() => {
    const hoje = new Date()
    return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10)
  })

  const carteiras = useMemo(
    () => Array.from(new Set(monitorias.map((m) => m.carteira))),
    [monitorias],
  )

  function aplicarPreset(dias: number | "tudo" | "hoje") {
    if (dias === "tudo") {
      setDataInicio("")
      setDataFim("")
      return
    }
    const hoje = new Date()
    const fim = hoje.toISOString().slice(0, 10)
    if (dias === "hoje") {
      setDataInicio(fim)
      setDataFim(fim)
      return
    }
    const inicio = new Date(hoje)
    inicio.setDate(inicio.getDate() - (dias - 1))
    setDataInicio(inicio.toISOString().slice(0, 10))
    setDataFim(fim)
  }

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

  const k = useMemo(() => kpis(filtradas), [filtradas])
  const serie = useMemo(() => serieTemporal(filtradas, periodo), [filtradas, periodo])
  const tabData = useMemo(() => porTabulacao(filtradas), [filtradas])
  const faixaData = useMemo(() => distribuicaoFaixas(filtradas), [filtradas])
  const pareto = useMemo(() => paretoItens(filtradas, checklists), [filtradas, checklists])

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filtros */}
      <div className="rounded-xl border border-border bg-card">
        {/* Linha superior: título + reset */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarDays className="size-4 text-primary" />
            Filtros
          </div>
          <Dialog>
            <DialogTrigger
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                className: "gap-2 text-muted-foreground",
              })}
            >
              <RotateCcw className="size-4" /> Resetar dados
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Resetar dados de demonstração?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Isso apaga todas as monitorias e checklists do localStorage e recria os
                dados de exemplo.
              </p>
              <DialogFooter>
                <Button variant="destructive" onClick={() => store.resetAll()}>
                  Resetar agora
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Linha de controles */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 p-4">
          {/* Carteira */}
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

          {/* Período: De / Até */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="data-inicio" className="text-xs text-muted-foreground">
              De
            </Label>
            <Input
              id="data-inicio"
              type="date"
              value={dataInicio}
              max={dataFim || undefined}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="data-fim" className="text-xs text-muted-foreground">
              Até
            </Label>
            <Input
              id="data-fim"
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
              <Button variant="ghost" size="sm" onClick={() => aplicarPreset("tudo")}>
                Tudo
              </Button>
            </div>
          </div>
        </div>

        {/* Rodapé: período ativo */}
        <div className="flex items-center gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          <span className="inline-flex size-1.5 rounded-full bg-primary" aria-hidden />
          Exibindo resultados de:{" "}
          <span className="font-medium text-foreground">{periodoLabel}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi icon={ClipboardList} label="Monitorias" value={String(k.total)} sub={periodoLabel} />
        <Kpi
          icon={TrendingUp}
          label="Nota média"
          value={String(k.notaMedia)}
          sub={`mediana ${k.mediana}`}
          tone={k.notaMedia >= 75 ? "good" : "bad"}
        />
        <Kpi
          icon={CheckCircle2}
          label="Taxa de aprovação"
          value={`${k.aprovacao}%`}
          sub="nota > 85"
          tone={k.aprovacao >= 75 ? "good" : "default"}
        />
        <Kpi
          icon={AlertOctagon}
          label="Notas críticas"
          value={String(k.criticos)}
          sub="abaixo de 60"
          tone={k.criticos > 0 ? "bad" : "good"}
        />
        <Kpi icon={Activity} label="Inconformidades" value={String(k.totalInconf)} sub="total de apontamentos" />
      </div>

      {/* Tendência + comparativo */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução da Nota Média</CardTitle>
            <p className="text-xs text-muted-foreground capitalize">Agrupado por {periodo}</p>
          </CardHeader>
          <CardContent>
            <TendenciaChart data={serie} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Volume vs Nota</CardTitle>
            <p className="text-xs text-muted-foreground">Monitorias realizadas e nota média</p>
          </CardHeader>
          <CardContent>
            <VolumeNotaChart data={serie} />
          </CardContent>
        </Card>
      </div>

      {/* Pizza faixas + pizza tabulação */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Faixa</CardTitle>
            <p className="text-xs text-muted-foreground">Gráfico de pizza</p>
          </CardHeader>
          <CardContent>
            <FaixasPieChart data={faixaData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monitorias por Tabulação</CardTitle>
            <p className="text-xs text-muted-foreground">Gráfico de pizza</p>
          </CardHeader>
          <CardContent>
            <TabulacaoPieChart data={tabData} />
          </CardContent>
        </Card>
      </div>

      {/* Pareto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pareto de Inconformidades</CardTitle>
          <p className="text-xs text-muted-foreground">
            Itens mais reprovados e % acumulado
          </p>
        </CardHeader>
        <CardContent>
          {pareto.length ? (
            <ParetoChart data={pareto} />
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Sem inconformidades no período.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
