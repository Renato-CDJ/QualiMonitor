"use client"

import { useMemo, useState } from "react"
import { Activity, TrendingUp, Target, Gauge, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useQualityData } from "@/lib/use-quality-data"
import {
  kpis,
  histogramaNotas,
  quartisPorCarteira,
  porOperador,
} from "@/lib/aggregations"
import { notaBadgeClass, faixaNota } from "@/lib/analytics"
import {
  QuartilChart,
  HistogramaChart,
  QuartilCarteiraChart,
} from "@/components/dashboard-charts"
import { cn } from "@/lib/utils"

function Stat({
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

export function AnaliseNotas() {
  const { monitorias, ready } = useQualityData()
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
  const histograma = useMemo(() => histogramaNotas(filtradas), [filtradas])
  const carteiraQuartis = useMemo(() => quartisPorCarteira(filtradas), [filtradas])
  const operadores = useMemo(() => porOperador(filtradas), [filtradas])

  const desvioPadrao = useMemo(() => {
    const notas = filtradas.map((m) => m.nota)
    if (notas.length < 2) return 0
    const m = notas.reduce((a, b) => a + b, 0) / notas.length
    const v = notas.reduce((s, n) => s + (n - m) ** 2, 0) / notas.length
    return Math.round(Math.sqrt(v) * 10) / 10
  }, [filtradas])

  const amplitude = useMemo(
    () => Math.round((k.quartis.max - k.quartis.min) * 10) / 10,
    [k],
  )

  const iqr = useMemo(
    () => Math.round((k.quartis.q3 - k.quartis.q1) * 10) / 10,
    [k],
  )

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filtro */}
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
        <span className="text-xs text-muted-foreground">
          {filtradas.length} monitorias analisadas
        </span>
      </div>

      {/* Estatísticas descritivas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          icon={TrendingUp}
          label="Nota média"
          value={String(k.notaMedia)}
          sub={`mediana ${k.mediana}`}
          tone={k.notaMedia >= 75 ? "good" : "bad"}
        />
        <Stat
          icon={Gauge}
          label="Desvio padrão"
          value={String(desvioPadrao)}
          sub="dispersão das notas"
        />
        <Stat
          icon={Activity}
          label="Amplitude interquartil"
          value={String(iqr)}
          sub={`Q1 ${k.quartis.q1.toFixed(0)} · Q3 ${k.quartis.q3.toFixed(0)}`}
        />
        <Stat
          icon={Target}
          label="Amplitude total"
          value={String(amplitude)}
          sub={`mín ${k.quartis.min.toFixed(0)} · máx ${k.quartis.max.toFixed(0)}`}
        />
      </div>

      {/* Quartil por operador — destaque principal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Visão de Quartil das Notas por Operador
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Caixa = intervalo interquartil (Q1–Q3) · linha tracejada = meta 75. Quanto
            menor a caixa, mais consistente é o operador.
          </p>
        </CardHeader>
        <CardContent>
          <QuartilChart monitorias={filtradas} maxOperadores={15} altura={420} />
        </CardContent>
      </Card>

      {/* Histograma + quartil por carteira */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Notas (Histograma)</CardTitle>
            <p className="text-xs text-muted-foreground">
              Frequência de notas em faixas de 10 pontos
            </p>
          </CardHeader>
          <CardContent>
            <HistogramaChart data={histograma} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quartil por Carteira</CardTitle>
            <p className="text-xs text-muted-foreground">
              Intervalo interquartil (Q1–Q3) por carteira · linha = meta 75
            </p>
          </CardHeader>
          <CardContent>
            {carteiraQuartis.length ? (
              <QuartilCarteiraChart data={carteiraQuartis} />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Sem dados no período.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela estatística por operador */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="size-4 text-muted-foreground" />
            Estatísticas Detalhadas por Operador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operador</TableHead>
                <TableHead className="text-right">Monitorias</TableHead>
                <TableHead className="text-right">Média</TableHead>
                <TableHead className="text-right">Mín</TableHead>
                <TableHead className="text-right">Q1</TableHead>
                <TableHead className="text-right">Mediana</TableHead>
                <TableHead className="text-right">Q3</TableHead>
                <TableHead className="text-right">Máx</TableHead>
                <TableHead className="text-right">IQR</TableHead>
                <TableHead className="text-right">Faixa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operadores.map((o) => (
                <TableRow key={o.operador}>
                  <TableCell className="font-medium">{o.operador}</TableCell>
                  <TableCell className="text-right tabular-nums">{o.volume}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {o.nota}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {o.quartis.min.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {o.quartis.q1.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {o.quartis.mediana.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {o.quartis.q3.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {o.quartis.max.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {(o.quartis.q3 - o.quartis.q1).toFixed(0)}
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
    </div>
  )
}
