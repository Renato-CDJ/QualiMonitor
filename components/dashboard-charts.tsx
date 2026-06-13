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
  ReferenceArea,
  ReferenceLine,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { Monitoria } from "@/lib/types"
import { resumoQuartis } from "@/lib/analytics"
import { porOperador } from "@/lib/aggregations"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

/* Cores semânticas por faixa de nota */
const FAIXA_CORES: Record<string, string> = {
  excelente: "#16a34a", // verde
  bom: "#3b82f6", // azul
  regular: "#f97316", // laranja
  critico: "#ef4444", // vermelho
}

function corFaixa(faixa: string, fallback: string) {
  const f = faixa
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
  if (f.includes("excelente")) return FAIXA_CORES.excelente
  if (f.includes("bom")) return FAIXA_CORES.bom
  if (f.includes("regular")) return FAIXA_CORES.regular
  if (f.includes("critico")) return FAIXA_CORES.critico
  return fallback
}

const RADIAN = Math.PI / 180

/* Rótulo externo com linha de conexão (leader line) ligada à fatia */
function makeLeaderLabel(corResolver: (name: string, index: number) => string, mostrarValor: boolean) {
  return function LeaderLabel(props: any) {
    const { cx, cy, midAngle, outerRadius, percent, name, value, index } = props
    const cor = corResolver(name, index)
    const cos = Math.cos(-RADIAN * midAngle)
    const sin = Math.sin(-RADIAN * midAngle)
    const sx = cx + (outerRadius + 2) * cos
    const sy = cy + (outerRadius + 2) * sin
    const mx = cx + (outerRadius + 12) * cos
    const my = cy + (outerRadius + 12) * sin
    const dir = cos >= 0 ? 1 : -1
    const ex = mx + dir * 12
    const ey = my
    const anchor = cos >= 0 ? "start" : "end"
    const tx = ex + dir * 5
    return (
      <g>
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={cor} fill="none" strokeWidth={1.25} />
        <circle cx={sx} cy={sy} r={2.5} fill={cor} stroke="none" />
        <text
          x={tx}
          y={ey - (mostrarValor ? 6 : 0)}
          textAnchor={anchor}
          dominantBaseline="central"
          fontSize={11}
          fontWeight={600}
          fill="var(--foreground)"
        >
          {name}
        </text>
        {mostrarValor && (
          <text
            x={tx}
            y={ey + 8}
            textAnchor={anchor}
            dominantBaseline="central"
            fontSize={10}
            fill="var(--muted-foreground)"
          >
            {`${value} (${Math.round((percent ?? 0) * 100)}%)`}
          </text>
        )}
      </g>
    )
  }
}

/* ---------- Botão reutilizável: exibir/ocultar notas ---------- */
function ToggleNotasButton({
  mostrar,
  onToggle,
}: {
  mostrar: boolean
  onToggle: () => void
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggle}
      className="absolute right-0 -top-16 z-10 size-8"
      title={mostrar ? "Ocultar notas" : "Exibir notas"}
      aria-label={mostrar ? "Ocultar notas" : "Exibir notas"}
    >
      {mostrar ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
    </Button>
  )
}

/* ---------- Tendência (linha/área) ---------- */
export function TendenciaChart({
  data,
}: {
  data: { rotulo: string; nota: number; volume: number }[]
}) {
  const config = {
    nota: { label: "Nota média", color: "var(--chart-1)" },
  } satisfies ChartConfig
  const [mostrarNotas, setMostrarNotas] = useState(false)
  return (
    <div className="relative">
      <ToggleNotasButton mostrar={mostrarNotas} onToggle={() => setMostrarNotas((v) => !v)} />
      <ChartContainer config={config} className="h-[260px] w-full">
        <AreaChart data={data} margin={{ left: -16, right: 8, top: 24 }}>
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
          </Area>
        </AreaChart>
      </ChartContainer>
    </div>
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
      <ToggleNotasButton mostrar={mostrarNotas} onToggle={() => setMostrarNotas((v) => !v)} />
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
    acc[d.faixa] = { label: d.faixa, color: corFaixa(d.faixa, PIE_COLORS[i % PIE_COLORS.length]) }
    return acc
  }, {} as ChartConfig)
  const [mostrarNotas, setMostrarNotas] = useState(false)
  return (
    <div className="relative">
      <ToggleNotasButton mostrar={mostrarNotas} onToggle={() => setMostrarNotas((v) => !v)} />
      <ChartContainer config={config} className="mx-auto h-[300px] w-full">
        <PieChart margin={{ top: 24, right: 110, bottom: 24, left: 110 }}>
          <ChartTooltip content={<ChartTooltipContent nameKey="faixa" />} />
          <Pie
            data={data}
            dataKey="qtd"
            nameKey="faixa"
            innerRadius={48}
            outerRadius={78}
            paddingAngle={2}
            labelLine={false}
            label={makeLeaderLabel((name, i) => corFaixa(name, PIE_COLORS[i % PIE_COLORS.length]), mostrarNotas)}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={corFaixa(d.faixa, PIE_COLORS[i % PIE_COLORS.length])} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
    </div>
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
  const [mostrarNotas, setMostrarNotas] = useState(false)
  return (
    <div className="relative">
      <ToggleNotasButton mostrar={mostrarNotas} onToggle={() => setMostrarNotas((v) => !v)} />
      <ChartContainer config={config} className="mx-auto h-[300px] w-full">
        <PieChart margin={{ top: 24, right: 120, bottom: 24, left: 120 }}>
          <ChartTooltip content={<ChartTooltipContent nameKey="tabulacao" />} />
          <Pie
            data={data}
            dataKey="qtd"
            nameKey="tabulacao"
            outerRadius={70}
            labelLine={false}
            label={makeLeaderLabel((_, i) => PIE_COLORS[i % PIE_COLORS.length], mostrarNotas)}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
    </div>
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
  const [mostrarNotas, setMostrarNotas] = useState(false)
  return (
    <div className="relative">
      <ToggleNotasButton mostrar={mostrarNotas} onToggle={() => setMostrarNotas((v) => !v)} />
      <ChartContainer config={config} className="h-[260px] w-full">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 16 }}>
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
          <Bar dataKey="nota" fill="var(--color-nota)" radius={[0, 4, 4, 0]}>
            {mostrarNotas && (
              <LabelList
                dataKey="nota"
                position="right"
                offset={8}
                fontSize={12}
                fontWeight={600}
                fill="var(--foreground)"
              />
            )}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
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
  const [mostrarNotas, setMostrarNotas] = useState(false)
  return (
    <div className="relative">
      <ToggleNotasButton mostrar={mostrarNotas} onToggle={() => setMostrarNotas((v) => !v)} />
      <ChartContainer config={config} className="h-[300px] w-full">
        <ComposedChart data={data} margin={{ left: -16, right: 8, top: 24, bottom: 60 }}>
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
          <Bar yAxisId="left" dataKey="qtd" fill="var(--color-qtd)" radius={[4, 4, 0, 0]}>
            {mostrarNotas && (
              <LabelList
                dataKey="qtd"
                position="top"
                offset={8}
                fontSize={12}
                fontWeight={600}
                fill="var(--foreground)"
              />
            )}
          </Bar>
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="acumulado"
            stroke="var(--color-acumulado)"
            strokeWidth={2}
            dot={{ r: 3 }}
          >
            {mostrarNotas && (
              <LabelList
                dataKey="acumulado"
                position="top"
                offset={10}
                fontSize={11}
                fontWeight={600}
                fill="var(--color-acumulado)"
                formatter={(v: number) => `${Math.round(v)}%`}
              />
            )}
          </Line>
        </ComposedChart>
      </ChartContainer>
    </div>
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
  return mediana >= 90
    ? "var(--chart-5)" // Q1 Excelente
    : mediana >= 75
      ? "var(--chart-1)" // Q2 Bom
      : mediana >= 60
        ? "var(--chart-3)" // Q3 Regular
        : "var(--destructive)" // Q4 Crítico
}

function BoxplotShape(props: any) {
  const { x, y, width, height, payload } = props
  if (!payload) return null
  const { min, q1, mediana, q3, max, media } = payload
  const range = max - min || 1
  // y/height representam a faixa [min, max] (barra base+span)
  const px = (v: number) => y + (height * (max - v)) / range
  const cx = x + width / 2
  const boxW = Math.min(width * 0.78, 40)
  const capW = boxW
  const boxX = cx - boxW / 2
  const yMin = px(min)
  const yMax = px(max)
  const yQ1 = px(q1)
  const yQ3 = px(q3)
  const yMed = px(mediana)
  const yMedia = px(media)
  const cor = corPorMediana(mediana)
  const boxH = Math.max(yQ1 - yQ3, 3)
  return (
    <g>
      {/* haste vertical mín–máx */}
      <line x1={cx} x2={cx} y1={yMax} y2={yQ3} stroke={cor} strokeWidth={2} strokeOpacity={0.8} />
      <line x1={cx} x2={cx} y1={yQ1} y2={yMin} stroke={cor} strokeWidth={2} strokeOpacity={0.8} />
      {/* tampas mín e máx */}
      <line x1={cx - capW / 2} x2={cx + capW / 2} y1={yMax} y2={yMax} stroke={cor} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx - capW / 2} x2={cx + capW / 2} y1={yMin} y2={yMin} stroke={cor} strokeWidth={2.5} strokeLinecap="round" />
      {/* caixa interquartil Q1–Q3 (preenchimento sólido) */}
      <rect
        x={boxX}
        y={yQ3}
        width={boxW}
        height={boxH}
        fill={cor}
        fillOpacity={0.55}
        stroke={cor}
        strokeWidth={2}
        rx={4}
      />
      {/* linha de mediana destacada (clara, com contraste) */}
      <line x1={boxX} x2={boxX + boxW} y1={yMed} y2={yMed} stroke="var(--card)" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={boxX} x2={boxX + boxW} y1={yMed} y2={yMed} stroke={cor} strokeWidth={1.5} strokeLinecap="round" />
      {/* ponto de média (losango) */}
      <rect
        x={cx - 3.5}
        y={yMedia - 3.5}
        width={7}
        height={7}
        transform={`rotate(45 ${cx} ${yMedia})`}
        fill="var(--card)"
        stroke={cor}
        strokeWidth={2}
      />
      {/* rótulo da mediana */}
      <text
        x={boxX + boxW + 5}
        y={yMed}
        dy={3.5}
        fontSize={10}
        fontWeight={600}
        fill={cor}
      >
        {Math.round(mediana)}
      </text>
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

/* ---------- Dispersão por quadrantes de desempenho ----------
   O gráfico é dividido em 4 quadrantes fixos por faixa de desempenho:
   superior-esquerdo = Excelente (90+), superior-direito = Bom (75-89),
   inferior-esquerdo = Regular (60-74), inferior-direito = Crítico (<60).
   Cada operador é posicionado dentro do quadrante da sua faixa. */
export function DispersaoOperadoresChart({
  monitorias,
  altura = 420,
}: {
  monitorias: Monitoria[]
  altura?: number
}) {
  const base = porOperador(monitorias).map((o) => ({
    operador: o.operador,
    nota: o.nota,
    volume: o.volume,
    mediana: Math.round(o.quartis.mediana),
    faixa:
      o.nota >= 90
        ? "excelente"
        : o.nota >= 75
          ? "bom"
          : o.nota >= 60
            ? "regular"
            : "critico",
  }))

  // Quadrantes: cada um ocupa um canto do plano 0-100 (divisão em 50/50).
  const quadrantes = {
    excelente: { label: "Excelente (90+)", cor: FAIXA_CORES.excelente, xMin: 4, xMax: 46, yMin: 54, yMax: 96 },
    bom: { label: "Bom (75-89)", cor: FAIXA_CORES.bom, xMin: 54, xMax: 96, yMin: 54, yMax: 96 },
    regular: { label: "Regular (60-74)", cor: FAIXA_CORES.regular, xMin: 4, xMax: 46, yMin: 4, yMax: 46 },
    critico: { label: "Crítico (<60)", cor: FAIXA_CORES.critico, xMin: 54, xMax: 96, yMin: 4, yMax: 46 },
  } as const

  type FaixaKey = keyof typeof quadrantes

  // Distribui os operadores de cada faixa em uma grade dentro do seu quadrante.
  const dados = (Object.keys(quadrantes) as FaixaKey[]).flatMap((faixa) => {
    const itens = base.filter((d) => d.faixa === faixa)
    const q = quadrantes[faixa]
    const n = itens.length
    const cols = Math.max(1, Math.ceil(Math.sqrt(n)))
    const rows = Math.max(1, Math.ceil(n / cols))
    return itens.map((it, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = q.xMin + ((col + 0.5) / cols) * (q.xMax - q.xMin)
      const y = q.yMax - ((row + 0.5) / rows) * (q.yMax - q.yMin)
      return { ...it, qx: x, qy: y }
    })
  })

  const config: ChartConfig = Object.fromEntries(
    (Object.entries(quadrantes) as [FaixaKey, (typeof quadrantes)[FaixaKey]][]).map(([k, v]) => [
      k,
      { label: v.label, color: v.cor },
    ]),
  )

  if (!base.length) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Sem dados no período.
      </p>
    )
  }

  const contagem = (faixa: FaixaKey) => base.filter((d) => d.faixa === faixa).length

  return (
    <ChartContainer config={config} className="w-full" style={{ height: altura }}>
      <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <XAxis type="number" dataKey="qx" domain={[0, 100]} hide />
        <YAxis type="number" dataKey="qy" domain={[0, 100]} hide />
        <ZAxis type="number" dataKey="volume" range={[80, 500]} />

        {/* Áreas dos quadrantes com rótulo e contagem */}
        {(Object.entries(quadrantes) as [FaixaKey, (typeof quadrantes)[FaixaKey]][]).map(
          ([k, v]) => (
            <ReferenceArea
              key={k}
              x1={v.xMin - 4}
              x2={v.xMax + 4}
              y1={v.yMin - 4}
              y2={v.yMax + 4}
              fill={v.cor}
              fillOpacity={0.08}
              stroke={v.cor}
              strokeOpacity={0.35}
              strokeDasharray="4 4"
              label={{
                value: `${v.label} · ${contagem(k)}`,
                position: "insideTopLeft",
                fontSize: 12,
                fontWeight: 600,
                fill: v.cor,
              }}
            />
          ),
        )}

        {/* Linhas divisórias centrais */}
        <ReferenceLine x={50} stroke="var(--border)" />
        <ReferenceLine y={50} stroke="var(--border)" />

        <ChartTooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const p = payload[0].payload as (typeof dados)[number]
            return (
              <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                <p className="font-medium text-foreground">{p.operador}</p>
                <p className="mt-1 text-muted-foreground">
                  Nota média: <span className="font-medium text-foreground">{p.nota}</span>
                </p>
                <p className="text-muted-foreground">
                  Mediana: <span className="font-medium text-foreground">{p.mediana}</span>
                </p>
                <p className="text-muted-foreground">
                  Monitorias: <span className="font-medium text-foreground">{p.volume}</span>
                </p>
              </div>
            )
          }}
        />
        {(Object.entries(quadrantes) as [FaixaKey, (typeof quadrantes)[FaixaKey]][]).map(
          ([k, v]) => (
            <Scatter
              key={k}
              name={v.label}
              data={dados.filter((d) => d.faixa === k)}
              dataKey="qy"
              fill={v.cor}
              fillOpacity={0.75}
              stroke={v.cor}
              strokeWidth={1}
            />
          ),
        )}
      </ScatterChart>
    </ChartContainer>
  )
}

/* ---------- Insights: cores de conformidade ---------- */
const CONFORMIDADE_CORES = {
  conforme: "#16a34a", // verde
  inconforme: "#ef4444", // vermelho
  na: "#94a3b8", // cinza
}

/* ---------- Insights: donut consolidado conforme / inconforme / N.A. ---------- */
export function ConformidadePieChart({
  data,
}: {
  data: { tipo: string; qtd: number; cor: string }[]
}) {
  const config: ChartConfig = data.reduce((acc, d) => {
    acc[d.tipo] = { label: d.tipo, color: d.cor }
    return acc
  }, {} as ChartConfig)
  const [mostrarNotas, setMostrarNotas] = useState(true)
  return (
    <div className="relative">
      <ToggleNotasButton mostrar={mostrarNotas} onToggle={() => setMostrarNotas((v) => !v)} />
      <ChartContainer config={config} className="mx-auto h-[300px] w-full">
        <PieChart margin={{ top: 24, right: 110, bottom: 24, left: 110 }}>
          <ChartTooltip content={<ChartTooltipContent nameKey="tipo" />} />
          <Pie
            data={data}
            dataKey="qtd"
            nameKey="tipo"
            innerRadius={48}
            outerRadius={78}
            paddingAngle={2}
            labelLine={false}
            label={makeLeaderLabel((name) => {
              const d = data.find((x) => x.tipo === name)
              return d?.cor ?? PIE_COLORS[0]
            }, mostrarNotas)}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.cor} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
    </div>
  )
}

/* ---------- Insights: barras horizontais de aderência por item ----------
   Usa o % de conforme (aderência) ou inconforme (oportunidade). A cor é fixa
   conforme o tipo de visão (verde p/ aderência, vermelho p/ oportunidade). */
export function AderenciaItensChart({
  data,
  tipo,
}: {
  data: { item: string; itemCompleto: string; pct: number; qtd: number }[]
  tipo: "aderencia" | "oportunidade"
}) {
  const cor = tipo === "aderencia" ? CONFORMIDADE_CORES.conforme : CONFORMIDADE_CORES.inconforme
  const config = {
    pct: {
      label: tipo === "aderencia" ? "% Conforme" : "% Inconforme",
      color: cor,
    },
  } satisfies ChartConfig
  const altura = Math.max(200, data.length * 40 + 40)
  return (
    <ChartContainer config={config} className="w-full" style={{ height: altura }}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40, top: 8, bottom: 8 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" domain={[0, 100]} unit="%" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis
          type="category"
          dataKey="item"
          tickLine={false}
          axisLine={false}
          fontSize={11}
          width={150}
        />
        <ChartTooltip
          content={<ChartTooltipContent nameKey="item" labelKey="item" />}
        />
        <Bar dataKey="pct" fill={cor} radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="pct"
            position="right"
            offset={8}
            fontSize={11}
            fontWeight={600}
            fill="var(--foreground)"
            formatter={(v: number) => `${v}%`}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
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
        {/* Faixas de fundo dos 4 quadrantes (Q1–Q4) */}
        <ReferenceArea y1={90} y2={100} fill="var(--chart-5)" fillOpacity={0.07} ifOverflow="extendDomain" />
        <ReferenceArea y1={75} y2={90} fill="var(--chart-1)" fillOpacity={0.07} ifOverflow="extendDomain" />
        <ReferenceArea y1={60} y2={75} fill="var(--chart-3)" fillOpacity={0.07} ifOverflow="extendDomain" />
        <ReferenceArea y1={0} y2={60} fill="var(--destructive)" fillOpacity={0.07} ifOverflow="extendDomain" />
        <XAxis dataKey="operador" tickLine={false} axisLine={false} fontSize={11} interval={0} angle={-30} textAnchor="end" height={50} />
        <YAxis domain={[0, 100]} ticks={[0, 60, 75, 90, 100]} tickLine={false} axisLine={false} fontSize={12} width={36} />
        <ChartTooltip cursor={{ fill: "var(--muted)", fillOpacity: 0.3 }} content={<BoxplotTooltip />} />
        {/* base transparente + span desenhado como boxplot */}
        <Bar dataKey="base" stackId="q" fill="transparent" isAnimationActive={false} />
        <Bar dataKey="span" stackId="q" shape={<BoxplotShape />} isAnimationActive={false} />
        <ReferenceLine y={90} stroke="var(--chart-5)" strokeDasharray="4 4" strokeOpacity={0.5} />
        <ReferenceLine y={75} stroke="var(--chart-3)" strokeDasharray="4 4" label={{ value: "meta 75", position: "right", fontSize: 10, fill: "var(--muted-foreground)" }} />
        <ReferenceLine y={60} stroke="var(--destructive)" strokeDasharray="4 4" strokeOpacity={0.5} />
      </BarChart>
    </ChartContainer>
  )
}
