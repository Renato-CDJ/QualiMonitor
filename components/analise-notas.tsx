"use client"

import { useMemo, useState } from "react"
import {
  Activity,
  TrendingUp,
  Target,
  Gauge,
  BarChart3,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Download,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  quartisPorCarteira,
  porOperador,
} from "@/lib/aggregations"
import { notaBadgeClass, faixaNota } from "@/lib/analytics"
import {
  QuartilChart,
  QuartilCarteiraChart,
} from "@/components/dashboard-charts"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx"

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

type SortKey =
  | "operador"
  | "volume"
  | "nota"
  | "min"
  | "mediana"
  | "max"
  | "iqr"
  | "faixa"
type SortDir = "asc" | "desc"

function inicioDoMes() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

export function AnaliseNotas() {
  const { monitorias, ready } = useQualityData()
  const [carteiraFiltro, setCarteiraFiltro] = useState<string>("todas")
  const [dataInicio, setDataInicio] = useState<string>(inicioDoMes)
  const [dataFim, setDataFim] = useState<string>(hojeISO)
  const [sortKey, setSortKey] = useState<SortKey>("nota")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

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

  const k = useMemo(() => kpis(filtradas), [filtradas])
  const carteiraQuartis = useMemo(() => quartisPorCarteira(filtradas), [filtradas])
  const operadores = useMemo(() => porOperador(filtradas), [filtradas])

  const operadoresOrdenados = useMemo(() => {
    const valor = (o: (typeof operadores)[number]) => {
      switch (sortKey) {
        case "operador":
          return o.operador
        case "volume":
          return o.volume
        case "nota":
          return o.nota
        case "min":
          return o.quartis.min
        case "mediana":
          return o.quartis.mediana
        case "max":
          return o.quartis.max
        case "iqr":
          return o.quartis.q3 - o.quartis.q1
        case "faixa":
          return o.nota
      }
    }
    const arr = [...operadores].sort((a, b) => {
      const va = valor(a)
      const vb = valor(b)
      if (typeof va === "string" && typeof vb === "string") {
        return va.localeCompare(vb, "pt-BR")
      }
      return (va as number) - (vb as number)
    })
    return sortDir === "desc" ? arr.reverse() : arr
  }, [operadores, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir(key === "operador" ? "asc" : "desc")
    }
  }

  function exportarExcel() {
    const linhas = operadoresOrdenados.map((o) => ({
      Operador: o.operador,
      Monitorias: o.volume,
      Média: o.nota,
      Mín: Number(o.quartis.min.toFixed(0)),
      Mediana: Number(o.quartis.mediana.toFixed(0)),
      Máx: Number(o.quartis.max.toFixed(0)),
      IQR: Number((o.quartis.q3 - o.quartis.q1).toFixed(0)),
      Faixa: faixaNota(o.nota),
    }))
    const ws = XLSX.utils.json_to_sheet(linhas)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Estatísticas")
    const carteiraNome = carteiraFiltro === "todas" ? "todas" : carteiraFiltro
    XLSX.writeFile(
      wb,
      `estatisticas-operadores_${carteiraNome}_${dataInicio}_a_${dataFim}.xlsx`,
    )
  }

  function SortHeader({
    label,
    sortKey: key,
    align = "right",
  }: {
    label: string
    sortKey: SortKey
    align?: "left" | "right"
  }) {
    const active = sortKey === key
    const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown
    return (
      <TableHead className={align === "right" ? "text-right" : undefined}>
        <button
          type="button"
          onClick={() => toggleSort(key)}
          className={`inline-flex items-center gap-1 hover:text-foreground ${
            align === "right" ? "flex-row-reverse" : ""
          } ${active ? "text-foreground" : ""}`}
        >
          {label}
          <Icon className="size-3.5 opacity-70" />
        </button>
      </TableHead>
    )
  }

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
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Carteira</Label>
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
        </div>
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setDataInicio(inicioDoMes())
            setDataFim(hojeISO())
          }}
        >
          Mês atual
        </Button>
        <span className="pb-1.5 text-xs text-muted-foreground">
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
            Cada operador é representado por um boxplot. Quanto menor a caixa, mais
            consistentes são as notas; quanto mais alta, melhor o desempenho.
          </p>
        </CardHeader>
        <CardContent>
          <QuartilChart monitorias={filtradas} maxOperadores={15} altura={420} />
          {/* Legenda explicativa do boxplot */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-4 w-0.5 bg-foreground/60" />
              Haste: nota mínima e máxima
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-4 rounded-sm border border-foreground/60 bg-foreground/40" />
              Caixa: 50% central das notas (Q1–Q3)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1 w-4 rounded-full bg-card ring-1 ring-foreground/60" />
              Linha clara: mediana
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rotate-45 border border-foreground bg-card" />
              Losango: média
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-chart-3" />
              Meta 75
            </span>
            <span className="flex items-center gap-1.5">
              Cores:
              <span className="text-chart-5">verde ≥ 75</span> ·
              <span className="text-chart-3">amarelo 60–74</span> ·
              <span className="text-destructive">vermelho &lt; 60</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quartil por carteira */}
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

      {/* Tabela estatística por operador */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="size-4 text-muted-foreground" />
                Estatísticas Detalhadas por Operador
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Clique no cabeçalho de uma coluna para ordenar
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportarExcel}
              disabled={!operadoresOrdenados.length}
            >
              <Download className="size-4" />
              Exportar Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader label="Operador" sortKey="operador" align="left" />
                <SortHeader label="Monitorias" sortKey="volume" />
                <SortHeader label="Média" sortKey="nota" />
                <SortHeader label="Mín" sortKey="min" />
                <SortHeader label="Mediana" sortKey="mediana" />
                <SortHeader label="Máx" sortKey="max" />
                <SortHeader label="IQR" sortKey="iqr" />
                <SortHeader label="Faixa" sortKey="faixa" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {operadoresOrdenados.map((o) => (
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
                    {o.quartis.mediana.toFixed(0)}
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
