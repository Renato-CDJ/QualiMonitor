"use client"

import { useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
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
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"

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
  const [mostrarNotas, setMostrarNotas] = useState(false)
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setMostrarNotas((v) => !v)}
        className="absolute right-0 -top-10 z-10 gap-1.5"
      >
        {mostrarNotas ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        {mostrarNotas ? "Ocultar notas" : "Exibir notas"}
      </Button>
      <ChartContainer config={config} className="h-[260px] w-full">
        <ComposedChart data={data} margin={{ left: -16, right: 8, top: 24 }}>
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
            dot={{ r: 3, fill: "var(--color-nota)" }}
          >
            {mostrarNotas && (
              <LabelList
                dataKey="nota"
                position="top"
                offset={10}
                fontSize={12}
                fontWeight={600}
                fill="var(--foreground)"
              />
            )}
          </Line>
        </ComposedChart>
      </ChartContainer>
    </div>
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

/* ---------- Quartil por carteira (boxplot) ---------- */
export function QuartilCarteiraChart({
  data,
}: {
  data: { carteira: string; min: number; q1: number; mediana: number; q3: number; max: number; media: number }[]
}) {
  const linha = data.map((d) => ({
    operador: d.carteira,
    media: d.media,
    base: d.min,
    span: d.max - d.min,
    ...d,
  }))
  const config = {
    span: { label: "Distribuição", color: "var(--chart-2)" },
  } satisfies ChartConfig
  return (
    <ChartContainer config={config} className="h-[300px] w-full">
      <BarChart data={linha} margin={{ left: -16, right: 8, top: 8, bottom: 8 }} barCategoryGap="20%">
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="carteira" tickLine={false} axisLine={false} fontSize={11} interval={0} />
        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} width={36} />
        <ChartTooltip cursor={{ fill: "var(--muted)", fillOpacity: 0.3 }} content={<BoxplotTooltip />} />
        <Bar dataKey="base" stackId="q" fill="transparent" isAnimationActive={false} />
        <Bar dataKey="span" stackId="q" shape={<BoxplotShape />} isAnimationActive={false} />
        <ReferenceLine y={75} stroke="var(--chart-3)" strokeDasharray="4 4" />
      </BarChart>
    </ChartContainer>
  )
}

/* ---------- Boxplot por operador ----------
   Desenha um boxplot real: haste mín–máx, caixa interquartil (Q1–Q3),
   linha de mediana e ponto de média. A cor reflete o nível da mediana. */
function corPorMediana(mediana: number) {
  return mediana >= 75
    ? "var(--chart-5)"
    : mediana >= 60
      ? "var(--chart-3)"
      : "var(--destructive)"
}

function BoxplotShape(props: any) {
  const { x, y, width, height, payload } = props
  if (!payload) return null
  const { min, q1, mediana, q3, max, media } = payload
  const range = max - min || 1
  // y/height representam a faixa [min, max] (barra base+span)
  const px = (v: number) => y + (height * (max - v)) / range
  const cx = x + width / 2
  const boxW = Math.min(width * 0.7, 46)
  const capW = boxW * 0.55
  const boxX = cx - boxW / 2
  const yMin = px(min)
  const yMax = px(max)
  const yQ1 = px(q1)
  const yQ3 = px(q3)
  const yMed = px(mediana)
  const yMedia = px(media)
  const cor = corPorMediana(mediana)
  return (
    <g>
      {/* haste vertical mín–máx */}
      <line x1={cx} x2={cx} y1={yMax} y2={yMin} stroke={cor} strokeWidth={1.5} strokeOpacity={0.7} />
      {/* tampas mín e máx */}
      <line x1={cx - capW / 2} x2={cx + capW / 2} y1={yMax} y2={yMax} stroke={cor} strokeWidth={1.5} />
      <line x1={cx - capW / 2} x2={cx + capW / 2} y1={yMin} y2={yMin} stroke={cor} strokeWidth={1.5} />
      {/* caixa interquartil Q1–Q3 */}
      <rect
        x={boxX}
        y={yQ3}
        width={boxW}
        height={Math.max(yQ1 - yQ3, 2)}
        fill={cor}
        fillOpacity={0.35}
        stroke={cor}
        strokeWidth={1.5}
        rx={3}
      />
      {/* linha de mediana */}
      <line x1={boxX} x2={boxX + boxW} y1={yMed} y2={yMed} stroke={cor} strokeWidth={3} />
      {/* ponto de média */}
      <circle cx={cx} cy={yMedia} r={3} fill="var(--background)" stroke={cor} strokeWidth={1.5} />
    </g>
  )
}

/* Tooltip único para o boxplot (evita entrada duplicada das 2 barras) */
function BoxplotTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  if (!p) return null
  const cor = corPorMediana(p.mediana)
  const linhas = [
    ["Máx", p.max],
    ["Q3", p.q3],
    ["Mediana", p.mediana],
    ["Q1", p.q1],
    ["Mín", p.min],
  ] as const
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="mb-1.5 flex items-center gap-1.5 font-medium text-popover-foreground">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: cor }} />
        {p.operadorNome ?? p.carteira}
        {p.volume != null && (
          <span className="font-normal text-muted-foreground">· {p.volume} mon.</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 tabular-nums text-muted-foreground">
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo} className="flex justify-between gap-3">
            <span>{rotulo}</span>
            <span className="font-medium text-popover-foreground">{Number(valor).toFixed(0)}</span>
          </div>
        ))}
        <div className="col-span-2 mt-1 flex justify-between gap-3 border-t border-border pt-1">
          <span>Média</span>
          <span className="font-medium text-popover-foreground">{Number(p.media).toFixed(1)}</span>
        </div>
      </div>
    </div>
  )
}

export function QuartilChart({
  monitorias,
  maxOperadores = 8,
  altura = 300,
}: {
  monitorias: Monitoria[]
  maxOperadores?: number
  altura?: number
}) {
  // top operadores por mediana
  const grupos = new Map<string, number[]>()
  for (const m of monitorias) {
    if (!grupos.has(m.operadorNome)) grupos.set(m.operadorNome, [])
    grupos.get(m.operadorNome)!.push(m.nota)
  }
  const data = Array.from(grupos.entries())
    .filter(([, n]) => n.length >= 2)
    .map(([operador, notas]) => {
      const q = resumoQuartis(notas)
      const med = notas.reduce((a, b) => a + b, 0) / notas.length
      return {
        operador: operador.split(" ")[0],
        operadorNome: operador,
        volume: notas.length,
        media: med,
        base: q.min, // base invisível até o mínimo
        span: q.max - q.min, // a barra cobre toda a faixa mín–máx
        min: q.min,
        mediana: q.mediana,
        q1: q.q1,
        q3: q.q3,
        max: q.max,
      }
    })
    .sort((a, b) => b.mediana - a.mediana)
    .slice(0, maxOperadores)

  const config = {
    span: { label: "Distribuição", color: "var(--chart-1)" },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="w-full" style={{ height: altura }}>
      <BarChart data={data} margin={{ left: -16, right: 8, top: 8, bottom: 8 }} barCategoryGap="22%">
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="operador" tickLine={false} axisLine={false} fontSize={11} interval={0} angle={-30} textAnchor="end" height={50} />
        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} width={36} />
        <ChartTooltip cursor={{ fill: "var(--muted)", fillOpacity: 0.3 }} content={<BoxplotTooltip />} />
        {/* base transparente + span desenhado como boxplot */}
        <Bar dataKey="base" stackId="q" fill="transparent" isAnimationActive={false} />
        <Bar dataKey="span" stackId="q" shape={<BoxplotShape />} isAnimationActive={false} />
        <ReferenceLine y={75} stroke="var(--chart-3)" strokeDasharray="4 4" label={{ value: "meta 75", position: "right", fontSize: 10, fill: "var(--muted-foreground)" }} />
      </BarChart>
    </ChartContainer>
  )
}
