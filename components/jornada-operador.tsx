"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts"
import { Route, Users, FileSpreadsheet } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CardTitleHint } from "@/components/card-title-hint"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { jornadaOperador } from "@/lib/aggregations"
import type { Monitoria, Operador } from "@/lib/types"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx"
import { toast } from "sonner"

/* Quadrantes de qualidade (Q1..Q4) com cores semânticas */
const QUADRANTES = [
  { key: "pctQ1", qtdKey: "q1", label: "Q1 · Excelente (90+)", short: "Q1", color: "#16a34a" },
  { key: "pctQ2", qtdKey: "q2", label: "Q2 · Bom (75-89)", short: "Q2", color: "#3b82f6" },
  { key: "pctQ3", qtdKey: "q3", label: "Q3 · Regular (60-74)", short: "Q3", color: "#f97316" },
  { key: "pctQ4", qtdKey: "q4", label: "Q4 · Crítico (<60)", short: "Q4", color: "#ef4444" },
] as const

function notaTone(nota: number) {
  if (nota >= 90) return "text-chart-5"
  if (nota >= 75) return "text-chart-1"
  if (nota >= 60) return "text-chart-3"
  return "text-destructive"
}

export function JornadaOperador({
  monitorias,
  operadores,
  carteira,
}: {
  monitorias: Monitoria[]
  operadores: Operador[]
  carteira?: string
}) {
  const segmentos = useMemo(
    () => jornadaOperador(monitorias, operadores, carteira),
    [monitorias, operadores, carteira],
  )

  const totalOperadores = segmentos.reduce((s, x) => s + x.operadores, 0)
  const semDados = totalOperadores === 0

  // dados do gráfico de nota média por segmento
  const dadosNota = useMemo(
    () => segmentos.map((s) => ({ segmento: s.segmento, nota: s.nota, operadores: s.operadores })),
    [segmentos],
  )

  const configNota = {
    nota: { label: "Nota média", color: "var(--chart-1)" },
  } satisfies ChartConfig

  const configQuadrantes = {
    pctQ1: { label: "Q1 · Excelente", color: QUADRANTES[0].color },
    pctQ2: { label: "Q2 · Bom", color: QUADRANTES[1].color },
    pctQ3: { label: "Q3 · Regular", color: QUADRANTES[2].color },
    pctQ4: { label: "Q4 · Crítico", color: QUADRANTES[3].color },
  } satisfies ChartConfig

  function exportarExcel() {
    if (semDados) {
      toast.warning("Sem dados para exportar no recorte atual")
      return
    }
    const linhas = segmentos.map((s) => ({
      "Tempo de empresa": s.segmento,
      "Qtd Operadores": s.operadores,
      Monitorias: s.monitorias,
      "Nota média": s.nota,
      "Q1 (qtd)": s.q1,
      "Q1 (%)": s.pctQ1,
      "Q2 (qtd)": s.q2,
      "Q2 (%)": s.pctQ2,
      "Q3 (qtd)": s.q3,
      "Q3 (%)": s.pctQ3,
      "Q4 (qtd)": s.q4,
      "Q4 (%)": s.pctQ4,
    }))
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(linhas)
    XLSX.utils.book_append_sheet(wb, ws, "Jornada do Operador")
    const sufixo = carteira && carteira !== "todas" ? "carteira" : "todas-carteiras"
    XLSX.writeFile(wb, `jornada-do-operador_${sufixo}.xlsx`)
    toast.success("Jornada do Operador exportada")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Resumo + tabela */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitleHint
              icon={<Route className="size-4 text-muted-foreground" />}
              title="Jornada do Operador por Tempo de Empresa"
              description="Compara os operadores em três faixas de tempo de empresa (0 a 3, 4 a 6 e acima de 7 meses). Para cada faixa: nota média, quantidade de operadores e a distribuição deles nos quadrantes de qualidade Q1 a Q4 (classificados pela nota média individual)."
            />
            {!semDados && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={exportarExcel}>
                <FileSpreadsheet className="size-4" />
                Exportar Excel
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {semDados ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Sem operadores com monitorias e tempo de empresa cadastrado para os filtros selecionados.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 pl-4 pr-3 font-semibold">Tempo de empresa</th>
                    <th className="px-3 py-3 text-center font-semibold">Operadores</th>
                    <th className="px-3 py-3 text-center font-semibold">Monitorias</th>
                    <th className="px-3 py-3 text-center font-semibold">Nota média</th>
                    {QUADRANTES.map((q) => (
                      <th key={q.key} className="px-3 py-3 text-center font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="size-2 rounded-full" style={{ backgroundColor: q.color }} aria-hidden />
                          {q.short}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {segmentos.map((s, idx) => (
                    <tr
                      key={s.id}
                      className={cn(
                        "border-b border-border/50 align-middle last:border-0",
                        idx % 2 === 1 && "bg-secondary/20",
                      )}
                    >
                      <td className="py-3 pl-4 pr-3 font-medium">{s.segmento}</td>
                      <td className="px-3 py-3 text-center tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="size-3.5 text-muted-foreground" />
                          {s.operadores}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums text-muted-foreground">
                        {s.monitorias}
                      </td>
                      <td className={cn("px-3 py-3 text-center font-semibold tabular-nums", notaTone(s.nota))}>
                        {s.nota.toFixed(1)}
                      </td>
                      {QUADRANTES.map((q) => {
                        const qtd = s[q.qtdKey as "q1" | "q2" | "q3" | "q4"]
                        const pct = s[q.key as "pctQ1" | "pctQ2" | "pctQ3" | "pctQ4"]
                        return (
                          <td key={q.key} className="px-3 py-3 text-center tabular-nums">
                            {qtd > 0 ? (
                              <span className="inline-flex flex-col leading-tight">
                                <span className="font-medium" style={{ color: q.color }}>
                                  {pct}%
                                </span>
                                <span className="text-[11px] text-muted-foreground">{qtd} op.</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {!semDados && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gráfico de colunas: nota média por tempo de empresa */}
          <Card>
            <CardHeader>
              <CardTitleHint
                title="Nota média por tempo de empresa"
                description="Comparativo da nota média das monitorias entre as faixas de tempo de empresa."
              />
            </CardHeader>
            <CardContent>
              <ChartContainer config={configNota} className="h-[300px] w-full">
                <BarChart data={dadosNota} margin={{ left: -16, right: 8, top: 24, bottom: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="segmento" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="nota" fill="var(--color-nota)" radius={[6, 6, 0, 0]} maxBarSize={72}>
                    <LabelList
                      dataKey="nota"
                      position="top"
                      offset={10}
                      fontSize={13}
                      fontWeight={600}
                      fill="var(--foreground)"
                      formatter={(v: number) => v.toFixed(1)}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Gráfico de colunas agrupadas: % de operadores por quadrante */}
          <Card>
            <CardHeader>
              <CardTitleHint
                title="Distribuição por quadrante (Q1 a Q4)"
                description="Percentual de operadores em cada quadrante de qualidade, comparando as faixas de tempo de empresa."
              />
            </CardHeader>
            <CardContent>
              <ChartContainer config={configQuadrantes} className="h-[300px] w-full">
                <BarChart data={segmentos} margin={{ left: -16, right: 8, top: 24, bottom: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="segmento" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <YAxis domain={[0, 100]} unit="%" tickLine={false} axisLine={false} fontSize={12} width={44} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {QUADRANTES.map((q) => (
                    <Bar key={q.key} dataKey={q.key} fill={q.color} radius={[4, 4, 0, 0]} maxBarSize={32} />
                  ))}
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
