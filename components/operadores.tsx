"use client"

import { useMemo, useState } from "react"
import { ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CardTitleHint } from "@/components/card-title-hint"
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
import { porOperador } from "@/lib/aggregations"
import { notaBadgeClass, faixaNota } from "@/lib/analytics"

type SortKey = "operador" | "volume" | "nota" | "min" | "mediana" | "max" | "faixa"
type SortDir = "asc" | "desc"

function inicioDoMes() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

export function Operadores() {
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

  const operadorData = useMemo(() => porOperador(filtradas), [filtradas])

  const operadorOrdenado = useMemo(() => {
    const valor = (o: (typeof operadorData)[number]) => {
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
        case "faixa":
          return o.quartis.max - o.quartis.min
      }
    }
    const arr = [...operadorData].sort((a, b) => {
      const va = valor(a)
      const vb = valor(b)
      if (typeof va === "string" && typeof vb === "string") {
        return va.localeCompare(vb, "pt-BR")
      }
      return (va as number) - (vb as number)
    })
    return sortDir === "desc" ? arr.reverse() : arr
  }, [operadorData, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      // texto começa A-Z (asc), números começam do maior (desc)
      setSortDir(key === "operador" ? "asc" : "desc")
    }
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
          {filtradas.length} monitorias · {operadorData.length} operadores
        </span>
      </div>

      {/* Ranking de operadores */}
      <Card>
        <CardHeader>
          <CardTitleHint
            title="Ranking de Operadores"
            description="Clique no cabeçalho de uma coluna para ordenar"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <SortHeader label="Operador" sortKey="operador" align="left" />
                <SortHeader label="Monitorias" sortKey="volume" />
                <SortHeader label="Nota média" sortKey="nota" />
                <SortHeader label="Mín" sortKey="min" />
                <SortHeader label="Mediana" sortKey="mediana" />
                <SortHeader label="Máx" sortKey="max" />
                <SortHeader label="Faixa" sortKey="faixa" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {operadorOrdenado.map((o, i) => (
                <TableRow key={o.operador}>
                  <TableCell className="tabular-nums text-muted-foreground">{i + 1}</TableCell>
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
              {operadorOrdenado.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                    Nenhuma monitoria no período selecionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
