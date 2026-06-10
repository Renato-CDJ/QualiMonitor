"use client"

import { useMemo, useState } from "react"
import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  ClipboardList,
  TrendingUp,
  RotateCcw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  porCarteira,
  porOperador,
  porTabulacao,
  distribuicaoFaixas,
  paretoItens,
  kpis,
  type Periodicidade,
} from "@/lib/aggregations"
import { notaBadgeClass, faixaNota, formatarData } from "@/lib/analytics"
import {
  TendenciaChart,
  VolumeNotaChart,
  FaixasPieChart,
  TabulacaoPieChart,
  CarteiraBarChart,
  ParetoChart,
  QuartilChart,
} from "@/components/dashboard-charts"
import { cn } from "@/lib/utils"

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
  const [periodo, setPeriodo] = useState<Periodicidade>("diario")
  const [carteiraFiltro, setCarteiraFiltro] = useState<string>("todas")

  const carteiras = useMemo(
    () => Array.from(new Set(monitorias.map((m) => m.carteira))),
    [monitorias],
  )

  const filtradas = useMemo(
    () =>
      carteiraFiltro === "todas"
        ? monitorias
        : monitorias.filter((m) => m.carteira === carteiraFiltro),
    [monitorias, carteiraFiltro],
  )

  const k = useMemo(() => kpis(filtradas), [filtradas])
  const serie = useMemo(() => serieTemporal(filtradas, periodo), [filtradas, periodo])
  const carteiraData = useMemo(() => porCarteira(filtradas), [filtradas])
  const operadorData = useMemo(() => porOperador(filtradas), [filtradas])
  const tabData = useMemo(() => porTabulacao(filtradas), [filtradas])
  const faixaData = useMemo(() => distribuicaoFaixas(filtradas), [filtradas])
  const pareto = useMemo(() => paretoItens(filtradas, checklists), [filtradas, checklists])

  const recentes = useMemo(
    () => [...filtradas].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, 12),
    [filtradas],
  )

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={carteiraFiltro} onValueChange={setCarteiraFiltro}>
          <SelectTrigger className="w-44">
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

        <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as Periodicidade)}>
          <TabsList>
            <TabsTrigger value="diario">Diário</TabsTrigger>
            <TabsTrigger value="semanal">Semanal</TabsTrigger>
            <TabsTrigger value="mensal">Mensal</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="ml-auto">
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
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi icon={ClipboardList} label="Monitorias" value={String(k.total)} sub="no período" />
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
          sub="nota ≥ 75"
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

      {/* Pizza faixas + pizza tabulação + barras carteira */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Faixa</CardTitle>
            <p className="text-xs text-muted-foreground">Gráfico de pizza</p>
          </CardHeader>
          <CardContent>
            <FaixasPieChart data={faixaData} />
            <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
              {faixaData.map((f) => (
                <span key={f.faixa}>
                  {f.faixa}: <span className="text-foreground">{f.qtd}</span>
                </span>
              ))}
            </div>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nota Média por Carteira</CardTitle>
            <p className="text-xs text-muted-foreground">Gráfico de barras</p>
          </CardHeader>
          <CardContent>
            <CarteiraBarChart data={carteiraData} />
          </CardContent>
        </Card>
      </div>

      {/* Pareto + Quartil */}
      <div className="grid gap-4 lg:grid-cols-2">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visão de Quartil das Notas</CardTitle>
            <p className="text-xs text-muted-foreground">
              Intervalo interquartil (Q1–Q3) por operador · linha = meta 75
            </p>
          </CardHeader>
          <CardContent>
            <QuartilChart monitorias={filtradas} />
          </CardContent>
        </Card>
      </div>

      {/* Ranking de operadores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking de Operadores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operador</TableHead>
                <TableHead className="text-right">Monitorias</TableHead>
                <TableHead className="text-right">Nota média</TableHead>
                <TableHead className="text-right">Mín</TableHead>
                <TableHead className="text-right">Mediana</TableHead>
                <TableHead className="text-right">Máx</TableHead>
                <TableHead className="text-right">Faixa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operadorData.slice(0, 10).map((o) => (
                <TableRow key={o.operador}>
                  <TableCell className="font-medium">{o.operador}</TableCell>
                  <TableCell className="text-right tabular-nums">{o.volume}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{o.nota}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {o.quartis.min.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {o.quartis.mediana.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {o.quartis.max.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={notaBadgeClass(o.nota)}>
                      {faixaNota(o.nota)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monitorias recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monitorias Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Carteira</TableHead>
                <TableHead>Tabulação</TableHead>
                <TableHead>EC/Call ID</TableHead>
                <TableHead>Monitor</TableHead>
                <TableHead className="text-right">Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentes.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="tabular-nums">
                    {formatarData(m.data)}
                    {m.horario && (
                      <span className="ml-1 text-xs text-muted-foreground">{m.horario}</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{m.operadorNome}</TableCell>
                  <TableCell className="text-muted-foreground">{m.carteira}</TableCell>
                  <TableCell className="text-muted-foreground">{m.tabulacao}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {m.ecCallId}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.monitor}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={notaBadgeClass(m.nota)}>
                      {m.nota}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
