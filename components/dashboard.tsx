"use client"

import { useMemo, useState } from "react"
import {
  Activity,
  AlertOctagon,
  ClipboardList,
  CalendarDays,
  TrendingUp,
  Eye,
  EyeOff,
  BarChart3,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CardTitleHint } from "@/components/card-title-hint"
import { Button } from "@/components/ui/button"
import { useQualityData } from "@/lib/use-quality-data"
import { useAuth } from "@/lib/auth"
import { useNotasGlobais } from "@/lib/notas-context"
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
  ChartFullscreen,
} from "@/components/dashboard-charts"
import { OperadoresResumoDialog } from "@/components/operadores-resumo-dialog"
import { cn } from "@/lib/utils"
import { FiltrosAnaliticos, filtrarMonitorias, type FiltrosAnaliticosState } from "@/components/filtros-analiticos"

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
  interactive = false,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  tone?: "default" | "good" | "bad"
  interactive?: boolean
}) {
  return (
    <Card
      className={cn(
        "h-full",
        interactive && "transition-colors group-hover/kpi:border-primary/50 group-hover/kpi:bg-accent/40",
      )}
    >
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 text-left">
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
  const { carteira: carteiraSelecionada } = useAuth()
  const { mostrarTodas, setMostrarTodas } = useNotasGlobais()
  const [comparativoMensal, setComparativoMensal] = useState(false)
  const periodo: Periodicidade = comparativoMensal ? "mensal" : "diario"
  const [filtrosAnaliticos, setFiltrosAnaliticos] = useState<FiltrosAnaliticosState>({ carteira: carteiraSelecionada ?? "todas", checklistId: "todos", tabulacao: "todas" })
  const [dataInicio, setDataInicio] = useState<string>(() => {
    const hoje = new Date()
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
  })
  const [dataFim, setDataFim] = useState<string>(() => {
    const hoje = new Date()
    return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10)
  })


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
      filtrarMonitorias(monitorias, filtrosAnaliticos).filter((m) => {
    if (dataInicio && m.data < dataInicio) return false
        if (dataFim && m.data > dataFim) return false
        return true
      }),
    [monitorias, filtrosAnaliticos, dataInicio, dataFim],
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
          <div className="flex items-center gap-2">
          <Button
            variant={comparativoMensal ? "default" : "outline"}
            size="sm"
            onClick={() => setComparativoMensal((ativo) => !ativo)}
            className="gap-2"
            aria-pressed={comparativoMensal}
            title="Comparar resultados mês a mês"
          >
            <BarChart3 className="size-4" />
            <span className="hidden sm:inline">Comparativo Mensal</span>
          </Button>
          <Button
            variant={mostrarTodas ? "default" : "outline"}
            size="sm"
            onClick={() => setMostrarTodas(!mostrarTodas)}
            className="gap-2"
          >
            {mostrarTodas ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {mostrarTodas ? "Ocultar notas" : "Exibir notas"}
          </Button>
          </div>
        </div>

        {/* Linha de controles */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 p-4">
  <FiltrosAnaliticos value={filtrosAnaliticos} onChange={setFiltrosAnaliticos} periodo={{ inicio: dataInicio, fim: dataFim, onInicioChange: setDataInicio, onFimChange: setDataFim, onTudo: () => aplicarPreset("tudo") }} />
        </div>

        {/* Rodapé: período ativo */}
        <div className="flex items-center gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          <span className="inline-flex size-1.5 rounded-full bg-primary" aria-hidden />
          Exibindo resultados de:{" "}
          <span className="font-medium text-foreground">{periodoLabel}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <OperadoresResumoDialog monitorias={filtradas} variante="monitorias" periodoLabel={periodoLabel}>
          <Kpi icon={ClipboardList} label="Monitorias" value={String(k.total)} sub={periodoLabel} interactive />
        </OperadoresResumoDialog>
        <Kpi
          icon={TrendingUp}
          label="Nota média"
          value={String(k.notaMedia)}
          sub={`mediana ${k.mediana}`}
          tone={k.notaMedia >= 75 ? "good" : "bad"}
        />
        <OperadoresResumoDialog monitorias={filtradas} variante="criticas" periodoLabel={periodoLabel}>
          <Kpi
            icon={AlertOctagon}
            label="Notas críticas"
            value={String(k.criticos)}
            sub="abaixo de 60"
            tone={k.criticos > 0 ? "bad" : "good"}
            interactive
          />
        </OperadoresResumoDialog>
        <OperadoresResumoDialog monitorias={filtradas} variante="inconformidades" periodoLabel={periodoLabel}>
          <Kpi icon={Activity} label="Inconformidades" value={String(k.totalInconf)} sub="total de apontamentos" interactive />
        </OperadoresResumoDialog>
      </div>

      {/* Tendência + comparativo */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitleHint
              title={comparativoMensal ? "Comparativo Mensal da Nota Média" : "Evolução da Nota Média"}
              description={<span>{comparativoMensal ? "Cada ponto representa um mês" : `Agrupado por ${periodo}`}</span>}
            />
          </CardHeader>
          <CardContent>
            <ChartFullscreen title="Evolução da Nota Média"><TendenciaChart data={serie} /></ChartFullscreen>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitleHint
              title={comparativoMensal ? "Comparativo Mensal: Volume vs Nota" : "Volume vs Nota"}
              description={comparativoMensal ? "Barras por mês com volume e nota média" : "Monitorias realizadas e nota média"}
            />
          </CardHeader>
          <CardContent>
            <ChartFullscreen title="Volume vs Nota"><VolumeNotaChart data={serie} /></ChartFullscreen>
          </CardContent>
        </Card>
      </div>

      {/* Pizza faixas + pizza tabulação */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitleHint
              title="Distribuição por Faixa"
              description="Pizza ou barras"
            />
          </CardHeader>
          <CardContent>
            <ChartFullscreen title="Distribuição por Faixa"><FaixasPieChart data={faixaData} monitorias={filtradas} /></ChartFullscreen>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitleHint
              title="Monitorias por Tabulação"
              description="Gráfico de pizza"
            />
          </CardHeader>
          <CardContent>
            <ChartFullscreen title="Monitorias por Tabulação"><TabulacaoPieChart data={tabData} /></ChartFullscreen>
          </CardContent>
        </Card>
      </div>

      {/* Pareto */}
      <Card>
        <CardHeader>
          <CardTitleHint
            title="Pareto de Inconformidades"
            description="Itens mais reprovados e % acumulado"
          />
        </CardHeader>
        <CardContent>
          {pareto.length ? (
            <ChartFullscreen title="Pareto de Inconformidades"><ParetoChart data={pareto} /></ChartFullscreen>
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
