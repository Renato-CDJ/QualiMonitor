"use client"

import { useMemo, useState } from "react"
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
import { porOperador } from "@/lib/aggregations"
import { notaBadgeClass, faixaNota, formatarData } from "@/lib/analytics"

export function Operadores() {
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

  const operadorData = useMemo(() => porOperador(filtradas), [filtradas])

  const recentes = useMemo(
    () => [...filtradas].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, 20),
    [filtradas],
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
          {filtradas.length} monitorias · {operadorData.length} operadores
        </span>
      </div>

      {/* Ranking de operadores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking de Operadores</CardTitle>
          <p className="text-xs text-muted-foreground">
            Ordenado por nota média
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
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
              {operadorData.map((o, i) => (
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
