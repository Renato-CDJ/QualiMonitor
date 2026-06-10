"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { Monitoria } from "@/lib/types"
import { resumoQuartis } from "@/lib/analytics"

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

/* ---------- Tendência (linha/área) ---------- */
export function TendenciaChart({
  data,
}: {
  data: { rotulo: string; nota: number; volume: number }[]
}) {
  const config = {
    nota: { label: "Nota média", color: "var(--chart-1)" },
  } satisfies ChartConfig
  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillNota" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-nota)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-nota)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="nota"
          stroke="var(--color-nota)"
          strokeWidth={2}
          fill="url(#fillNota)"
        />
      </AreaChart>
    </ChartContainer>
  )
}

/* ---------- Comparativo de volume vs nota (composto) ---------- */
export function VolumeNotaChart({
  data,
}: {
  data: { rotulo: string; nota: number; volume: number }[]
}) {
  const config = {
    volume: { label: "Monitorias", color: "var(--chart-2)" },
    nota: { label: "Nota média", color: "var(--chart-1)" },
  } satisfies ChartConfig
  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <ComposedChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis yAxisId="left" tickLine={false} axisLine={false} fontSize={12} width={32} />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          width={32}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar yAxisId="left" dataKey="volume" fill="var(--color-volume)" radius={[4, 4, 0, 0]} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="nota"
          stroke="var(--color-nota)"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ChartContainer>
  )
}

/* ---------- Pizza: distribuição por faixa ---------- */
export function FaixasPieChart({
  data,
}: {
  data: { faixa: string; qtd: number }[]
}) {
  const config: ChartConfig = data.reduce((acc, d, i) => {
    acc[d.faixa] = { label: d.faixa, color: PIE_COLORS[i % PIE_COLORS.length] }
    return acc
  }, {} as ChartConfig)
  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-[260px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="faixa" />} />
        <Pie data={data} dataKey="qtd" nameKey="faixa" innerRadius={55} outerRadius={95} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}

/* ---------- Pizza: tabulação ---------- */
export function TabulacaoPieChart({
  data,
}: {
  data: { tabulacao: string; qtd: number }[]
}) {
  const config: ChartConfig = data.reduce((acc, d, i) => {
    acc[d.tabulacao] = { label: d.tabulacao, color: PIE_COLORS[i % PIE_COLORS.length] }
    return acc
  }, {} as ChartConfig)
  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-[260px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="tabulacao" />} />
        <Pie data={data} dataKey="qtd" nameKey="tabulacao" outerRadius={95}>
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}

/* ---------- Barras: por carteira ---------- */
export function CarteiraBarChart({
  data,
}: {
  data: { carteira: string; nota: number; volume: number }[]
}) {
  const config = {
    nota: { label: "Nota média", color: "var(--chart-1)" },
  } satisfies ChartConfig
  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} />
        <YAxis
          type="category"
          dataKey="carteira"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          width={80}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="nota" fill="var(--color-nota)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

/* ---------- Pareto: itens mais reprovados ---------- */
export function ParetoChart({
  data,
}: {
  data: { item: string; qtd: number; acumulado: number }[]
}) {
  const config = {
    qtd: { label: "Inconformidades", color: "var(--chart-4)" },
    acumulado: { label: "% acumulado", color: "var(--chart-3)" },
  } satisfies ChartConfig
  return (
    <ChartContainer config={config} className="h-[300px] w-full">
      <ComposedChart data={data} margin={{ left: -16, right: 8, top: 8, bottom: 60 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="item"
          tickLine={false}
          axisLine={false}
          fontSize={11}
          angle={-35}
          textAnchor="end"
          interval={0}
          height={60}
        />
        <YAxis yAxisId="left" tickLine={false} axisLine={false} fontSize={12} width={32} />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          width={36}
          unit="%"
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar yAxisId="left" dataKey="qtd" fill="var(--color-qtd)" radius={[4, 4, 0, 0]} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="acumulado"
          stroke="var(--color-acumulado)"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ChartContainer>
  )
}

/* ---------- Histograma de notas ---------- */
export function HistogramaChart({
  data,
}: {
  data: { faixa: string; qtd: number; min: number }[]
}) {
  const config = {
    qtd: { label: "Monitorias", color: "var(--chart-1)" },
  } satisfies ChartConfig
  const cor = (min: number) =>
    min < 60 ? "var(--destructive)" : min < 75 ? "var(--chart-3)" : "var(--chart-5)"
  return (
    <ChartContainer config={config} className="h-[300px] w-full">
      <BarChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="faixa" tickLine={false} axisLine={false} fontSize={11} interval={0} angle={-30} textAnchor="end" height={50} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="qtd" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={cor(d.min)} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

/* ---------- Quartil por carteira ---------- */
export function QuartilCarteiraChart({
  data,
}: {
  data: { carteira: string; min: number; q1: number; mediana: number; q3: number; max: number; media: number }[]
}) {
  const linha = data.map((d) => ({
    carteira: d.carteira,
    base: d.q1,
    caixa: d.q3 - d.q1,
    ...d,
  }))
  const config = {
    caixa: { label: "Intervalo Q1–Q3", color: "var(--chart-2)" },
  } satisfies ChartConfig
  return (
    <ChartContainer config={config} className="h-[300px] w-full">
      <BarChart data={linha} margin={{ left: -16, right: 8, top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="carteira" tickLine={false} axisLine={false} fontSize={11} interval={0} />
        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} width={36} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name, item) => {
                const p = item?.payload
                if (!p) return null
                return (
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span>Média: {p.media.toFixed(1)}</span>
                    <span>Mín: {p.min.toFixed(0)}</span>
                    <span>Q1: {p.q1.toFixed(0)}</span>
                    <span>Mediana: {p.mediana.toFixed(0)}</span>
                    <span>Q3: {p.q3.toFixed(0)}</span>
                    <span>Máx: {p.max.toFixed(0)}</span>
                  </div>
                )
              }}
            />
          }
        />
        <Bar dataKey="base" stackId="q" fill="transparent" />
        <Bar dataKey="caixa" stackId="q" fill="var(--color-caixa)" radius={2} fillOpacity={0.5} />
        <ReferenceLine y={75} stroke="var(--chart-3)" strokeDasharray="4 4" />
      </BarChart>
    </ChartContainer>
  )
}

/* ---------- Quartil (boxplot simplificado por operador) ---------- */
export function QuartilChart({
  monitorias,
  maxOperadores = 8,
  altura = 300,
}: {
  monitorias: Monitoria[]
  maxOperadores?: number
  altura?: number
}) {
  // top operadores por volume
  const grupos = new Map<string, number[]>()
  for (const m of monitorias) {
    if (!grupos.has(m.operadorNome)) grupos.set(m.operadorNome, [])
    grupos.get(m.operadorNome)!.push(m.nota)
  }
  const data = Array.from(grupos.entries())
    .filter(([, n]) => n.length >= 2)
    .map(([operador, notas]) => {
      const q = resumoQuartis(notas)
      return {
        operador: operador.split(" ")[0],
        min: q.min,
        // base invisível até q1, depois caixa interquartil
        base: q.q1,
        caixa: q.q3 - q.q1,
        mediana: q.mediana,
        q1: q.q1,
        q3: q.q3,
        max: q.max,
      }
    })
    .sort((a, b) => b.mediana - a.mediana)
    .slice(0, maxOperadores)

  const config = {
    caixa: { label: "Intervalo Q1–Q3", color: "var(--chart-1)" },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="w-full" style={{ height: altura }}>
      <BarChart data={data} margin={{ left: -16, right: 8, top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="operador" tickLine={false} axisLine={false} fontSize={11} interval={0} />
        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} width={36} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name, item) => {
                const p = item?.payload
                if (!p) return null
                return (
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span>Mín: {p.min.toFixed(0)}</span>
                    <span>Q1: {p.q1.toFixed(0)}</span>
                    <span>Mediana: {p.mediana.toFixed(0)}</span>
                    <span>Q3: {p.q3.toFixed(0)}</span>
                    <span>Máx: {p.max.toFixed(0)}</span>
                  </div>
                )
              }}
            />
          }
        />
        {/* base transparente para "levantar" a caixa interquartil */}
        <Bar dataKey="base" stackId="q" fill="transparent" />
        <Bar dataKey="caixa" stackId="q" fill="var(--color-caixa)" radius={2} fillOpacity={0.45}>
          {data.map((d, i) => (
            <Cell key={i} />
          ))}
        </Bar>
        <ReferenceLine y={75} stroke="var(--chart-3)" strokeDasharray="4 4" />
      </BarChart>
    </ChartContainer>
  )
}
