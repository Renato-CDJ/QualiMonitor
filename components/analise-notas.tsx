"use client"

import { useMemo, useState } from "react"
import {
  Activity,
  TrendingUp,
  Award,
  ThumbsUp,
  AlertTriangle,
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
import { kpis, porOperador } from "@/lib/aggregations"
import { notaBadgeClass, faixaNota } from "@/lib/analytics"
import { DispersaoOperadoresChart } from "@/components/dashboard-charts"
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
  tone?: "default" | "good" | "bad" | "excelente" | "bom" | "regular" | "critico"
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold tabular-nums",
              (tone === "good" || tone === "excelente") && "text-chart-5",
              tone === "bom" && "text-chart-1",
              tone === "regular" && "text-chart-3",
              (tone === "bad" || tone === "critico") && "text-destructive",
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
  | "q1"
  | "q2"
  | "q3"
  | "q4"
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
  const [faixaFiltro, setFaixaFiltro] = useState<string>("todas")
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
        if (faixaFiltro === "excelente" && m.nota < 90) return false
        if (faixaFiltro === "bom" && (m.nota < 75 || m.nota >= 90)) return false
        if (faixaFiltro === "regular" && (m.nota < 60 || m.nota >= 75)) return false
        if (faixaFiltro === "critico" && m.nota >= 60) return false
        return true
      }),
    [monitorias, carteiraFiltro, dataInicio, dataFim, faixaFiltro],
  )

  const k = useMemo(() => kpis(filtradas), [filtradas])
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
        case "q1":
          return o.faixas.excelente
        case "q2":
          return o.faixas.bom
        case "q3":
          return o.faixas.regular
        case "q4":
          return o.faixas.critico
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
      "Q1 Excelente (90+)": o.faixas.excelente,
      "Q2 Bom (75-89)": o.faixas.bom,
      "Q3 Regular (60-74)": o.faixas.regular,
      "Q4 Crítico (<60)": o.faixas.critico,
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

  const faixaContagem = useMemo(() => {
    const c = { excelente: 0, bom: 0, regular: 0, critico: 0 }
    for (const m of filtradas) {
      if (m.nota >= 90) c.excelente++
      else if (m.nota >= 75) c.bom++
      else if (m.nota >= 60) c.regular++
      else c.critico++
    }
    return c
  }, [filtradas])

  const totalNotas = filtradas.length
  const pctFaixa = (n: number) =>
    totalNotas ? Math.round((n / totalNotas) * 100) : 0

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
          <Label className="text-xs text-muted-foreground">Faixa</Label>
          <Select value={faixaFiltro} onValueChange={setFaixaFiltro}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as faixas</SelectItem>
              <SelectItem value="excelente">Q1 · Excelente (90+)</SelectItem>
              <SelectItem value="bom">Q2 · Bom (75-89)</SelectItem>
              <SelectItem value="regular">Q3 · Regular (60-74)</SelectItem>
              <SelectItem value="critico">Q4 · Crítico (&lt;60)</SelectItem>
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

      {/* Distribuição por faixa de desempenho */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat
          icon={TrendingUp}
          label="Nota média"
          value={String(k.notaMedia)}
          sub={`mediana ${k.mediana}`}
          tone={k.notaMedia >= 75 ? "good" : "bad"}
        />
        <Stat
          icon={Award}
          label="Excelente (90+)"
          value={String(faixaContagem.excelente)}
          sub={`${pctFaixa(faixaContagem.excelente)}% das notas`}
          tone="excelente"
        />
        <Stat
          icon={ThumbsUp}
          label="Bom (75-89)"
          value={String(faixaContagem.bom)}
          sub={`${pctFaixa(faixaContagem.bom)}% das notas`}
          tone="bom"
        />
        <Stat
          icon={Activity}
          label="Regular (60-74)"
          value={String(faixaContagem.regular)}
          sub={`${pctFaixa(faixaContagem.regular)}% das notas`}
          tone="regular"
        />
        <Stat
          icon={AlertTriangle}
          label="Crítico (<60)"
          value={String(faixaContagem.critico)}
          sub={`${pctFaixa(faixaContagem.critico)}% das notas`}
          tone="critico"
        />
      </div>

      {/* Dispersão de notas por operador — destaque principal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Dispersão das Notas por Operador
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Os operadores são distribuídos em quatro quadrantes conforme a faixa de
            desempenho da nota média. O tamanho do ponto indica o volume de
            monitorias.
          </p>
        </CardHeader>
        <CardContent>
          <DispersaoOperadoresChart monitorias={filtradas} altura={420} />
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:flex sm:flex-wrap sm:items-center sm:gap-x-5">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full bg-chart-5" />
              Sup. esquerdo · Excelente (90+)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full bg-chart-1" />
              Sup. direito · Bom (75-89)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full bg-chart-3" />
              Inf. esquerdo · Regular (60-74)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full bg-destructive" />
              Inf. direito · Crítico (&lt;60)
            </span>
          </div>
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
                Clique no cabeçalho para ordenar · Q1 Excelente (90+) · Q2 Bom
                (75-89) · Q3 Regular (60-74) · Q4 Crítico (&lt;60)
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
                <SortHeader label="Q1" sortKey="q1" />
                <SortHeader label="Q2" sortKey="q2" />
                <SortHeader label="Q3" sortKey="q3" />
                <SortHeader label="Q4" sortKey="q4" />
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
                  <TableCell className="text-right tabular-nums font-medium text-chart-5">
                    {o.faixas.excelente || "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-chart-1">
                    {o.faixas.bom || "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-chart-3">
                    {o.faixas.regular || "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-destructive">
                    {o.faixas.critico || "—"}
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
