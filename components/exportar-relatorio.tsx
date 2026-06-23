"use client"

import { useMemo, useState } from "react"
import {
  LayoutDashboard,
  Wallet,
  GanttChartSquare,
  Lightbulb,
  Grid2x2,
  ClipboardCheck,
  CalendarDays,
  Download,
  FileDown,
  FileSpreadsheet,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useQualityData } from "@/lib/use-quality-data"
import type {
  Checklist,
  FeedbackInvertido,
  Monitoria,
  RecebimentoOperador,
} from "@/lib/types"
import {
  serieTemporal,
  porTabulacao,
  distribuicaoFaixas,
  paretoItens,
  porCarteira,
  conformidadePorCarteira,
  porOperador,
  aderenciaItens,
  resumoConformidade,
  quadranteOperadores,
  porMonitor,
  conformidadePorMonitor,
} from "@/lib/aggregations"
import { faixaNota } from "@/lib/analytics"
import * as XLSX from "xlsx"
import { toast } from "sonner"

const META_QUALIDADE = 85

/* ----------------------------- Tipos ----------------------------- */

type Linha = Record<string, string | number>
type Planilha = { aba: string; linhas: Linha[] }

interface ExportContext {
  monitorias: Monitoria[]
  checklists: Checklist[]
  recebimentos: RecebimentoOperador[]
  feedbacks: FeedbackInvertido[]
}

interface ItemExport {
  id: string
  nome: string
  descricao: string
  build: (ctx: ExportContext) => Planilha[]
}

interface GrupoExport {
  id: string
  titulo: string
  origem: string
  icon: LucideIcon
  itens: ItemExport[]
}

/* --------------------------- Utilidades --------------------------- */

const round1 = (n: number) => Math.round(n * 10) / 10

/** Sanitiza o nome de uma aba do Excel (máx. 31 caracteres, sem caracteres inválidos). */
function abaSegura(nome: string) {
  return nome.replace(/[[\]:*?/\\]/g, " ").slice(0, 31).trim()
}

function baixarExcel(arquivo: string, planilhas: Planilha[]) {
  const wb = XLSX.utils.book_new()
  const usados = new Set<string>()
  let adicionadas = 0

  for (const p of planilhas) {
    if (!p.linhas.length) continue
    let nome = abaSegura(p.aba) || "Planilha"
    // garante unicidade dos nomes de aba
    let sufixo = 2
    let base = nome
    while (usados.has(nome)) {
      const corte = base.slice(0, 31 - String(sufixo).length - 1)
      nome = `${corte} ${sufixo}`
      sufixo++
    }
    usados.add(nome)
    const ws = XLSX.utils.json_to_sheet(p.linhas)
    XLSX.utils.book_append_sheet(wb, ws, nome)
    adicionadas++
  }

  if (!adicionadas) {
    const ws = XLSX.utils.json_to_sheet([
      { Aviso: "Não há dados para os filtros selecionados." },
    ])
    XLSX.utils.book_append_sheet(wb, ws, "Sem dados")
  }

  XLSX.writeFile(wb, arquivo)
}

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/* ----------------- Registro de exportações por seção ----------------- */

const GRUPOS: GrupoExport[] = [
  {
    id: "dashboard",
    titulo: "Dashboard",
    origem: "Analítico · Dashboard",
    icon: LayoutDashboard,
    itens: [
      {
        id: "evolucao-nota",
        nome: "Evolução da Nota Média",
        descricao: "Nota média ao longo do tempo (diário)",
        build: ({ monitorias }) => [
          {
            aba: "Evolução da Nota",
            linhas: serieTemporal(monitorias, "diario").map((s) => ({
              Período: s.chave,
              Rótulo: s.rotulo,
              "Nota Média": s.nota,
              Volume: s.volume,
            })),
          },
        ],
      },
      {
        id: "volume-nota",
        nome: "Volume vs Nota",
        descricao: "Monitorias realizadas e nota média por período",
        build: ({ monitorias }) => [
          {
            aba: "Volume vs Nota",
            linhas: serieTemporal(monitorias, "diario").map((s) => ({
              Período: s.chave,
              Rótulo: s.rotulo,
              "Volume de Monitorias": s.volume,
              "Nota Média": s.nota,
            })),
          },
        ],
      },
      {
        id: "distribuicao-faixa",
        nome: "Distribuição por Faixa",
        descricao: "Quantidade de notas por faixa de desempenho",
        build: ({ monitorias }) => [
          {
            aba: "Distribuição por Faixa",
            linhas: distribuicaoFaixas(monitorias).map((f) => ({
              Faixa: f.faixa,
              Quantidade: f.qtd,
            })),
          },
        ],
      },
      {
        id: "monitorias-tabulacao",
        nome: "Monitorias por Tabulação",
        descricao: "Distribuição das monitorias por tipo de tabulação",
        build: ({ monitorias }) => [
          {
            aba: "Por Tabulação",
            linhas: porTabulacao(monitorias).map((t) => ({
              Tabulação: t.tabulacao,
              Quantidade: t.qtd,
            })),
          },
        ],
      },
      {
        id: "pareto-inconformidades",
        nome: "Pareto de Inconformidades",
        descricao: "Itens mais reprovados e percentual acumulado",
        build: ({ monitorias, checklists }) => [
          {
            aba: "Pareto Inconformidades",
            linhas: paretoItens(monitorias, checklists).map((p) => ({
              Item: p.itemCompleto,
              Quantidade: p.qtd,
              "% Acumulado": p.acumulado,
            })),
          },
        ],
      },
    ],
  },
  {
    id: "notas-carteira",
    titulo: "Notas por Carteira",
    origem: "Analítico · Notas Carteira",
    icon: Wallet,
    itens: [
      {
        id: "nota-media-carteira",
        nome: "Nota Média por Carteira",
        descricao: "Comparativo das notas médias por carteira",
        build: ({ monitorias }) => [
          {
            aba: "Nota por Carteira",
            linhas: porCarteira(monitorias).map((c) => ({
              Carteira: c.carteira,
              "Nota Média": c.nota,
              Monitorias: c.volume,
            })),
          },
        ],
      },
      {
        id: "conformidade-carteira",
        nome: "Conformidade x Inconformidade por Carteira",
        descricao: "Percentual de itens conformes e inconformes por carteira",
        build: ({ monitorias }) => [
          {
            aba: "Conformidade Carteira",
            linhas: conformidadePorCarteira(monitorias).map((c) => ({
              Carteira: c.carteira,
              Monitorias: c.volume,
              "Nota Média": c.nota,
              Conforme: c.conforme,
              Inconforme: c.inconforme,
              "Não se aplica": c.na,
              Avaliados: c.avaliados,
              "% Conforme": c.pctConforme,
              "% Inconforme": c.pctInconforme,
            })),
          },
        ],
      },
    ],
  },
  {
    id: "analise-notas",
    titulo: "Análise de Notas",
    origem: "Analítico · Análise de Notas",
    icon: GanttChartSquare,
    itens: [
      {
        id: "estatisticas-operador",
        nome: "Estatísticas por Operador (Dispersão)",
        descricao: "Média, quartis, IQR e contagem por faixa de cada operador",
        build: ({ monitorias }) => [
          {
            aba: "Estatísticas Operador",
            linhas: porOperador(monitorias).map((o) => ({
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
            })),
          },
        ],
      },
    ],
  },
  {
    id: "insights",
    titulo: "Insights",
    origem: "Analítico · Insights",
    icon: Lightbulb,
    itens: [
      {
        id: "conformidade-geral",
        nome: "Conformidade Geral",
        descricao: "Distribuição de Conforme · Inconforme · Não se aplica",
        build: ({ monitorias }) => {
          const r = resumoConformidade(monitorias)
          return [
            {
              aba: "Conformidade Geral",
              linhas: [
                { Tipo: "Conforme", Quantidade: r.conforme, "%": r.pctConforme },
                { Tipo: "Inconforme", Quantidade: r.inconforme, "%": r.pctInconforme },
                { Tipo: "Não se aplica", Quantidade: r.na, "%": r.pctNa },
                { Tipo: "Total", Quantidade: r.total, "%": 100 },
              ],
            },
          ]
        },
      },
      {
        id: "aderencia-itens",
        nome: "Aderência e Oportunidades por Item",
        descricao: "Conformidade, inconformidade e N.A. por item do checklist",
        build: ({ monitorias, checklists }) => [
          {
            aba: "Aderência por Item",
            linhas: aderenciaItens(monitorias, checklists).map((it) => ({
              Item: it.texto,
              Carteira: it.carteira,
              Crítico: it.critico ? "Sim" : "Não",
              Conforme: it.conforme,
              Inconforme: it.inconforme,
              "Não se aplica": it.na,
              "% Conforme": it.pctConforme,
              "% Inconforme": it.pctInconforme,
              "% N.A.": it.pctNa,
            })),
          },
        ],
      },
    ],
  },
  {
    id: "quadrante",
    titulo: "Quadrante",
    origem: "Analítico · Quadrante",
    icon: Grid2x2,
    itens: [
      {
        id: "quadrante-operadores",
        nome: "Quadrante · Performance x Qualidade",
        descricao: "Classificação dos operadores na matriz de quadrante",
        build: ({ monitorias, recebimentos }) => [
          {
            aba: "Quadrante",
            linhas: quadranteOperadores(monitorias, recebimentos, META_QUALIDADE).map(
              (o) => ({
                Operador: o.operador,
                Carteira: o.carteira,
                Monitorias: o.volume,
                "Nota Média": o.nota,
                Performance: o.recebimento
                  ? o.recebimento === "alto"
                    ? "Alta"
                    : "Baixa"
                  : "Pendente",
                Qualidade: o.qualidade === "alta" ? "Alta" : "Baixa",
                Sigla: o.sigla ?? "—",
                Quadrante: o.info?.quadrante ?? "—",
                Classificação: o.info?.nome ?? "Pendente",
              }),
            ),
          },
        ],
      },
    ],
  },
  {
    id: "monitoria",
    titulo: "Monitoria",
    origem: "Monitoria · Resultado Monitor / Feedback",
    icon: ClipboardCheck,
    itens: [
      {
        id: "monitorias-por-monitor",
        nome: "Quantidade de Monitorias por Monitor",
        descricao: "Volume de monitorias e nota média de cada monitor",
        build: ({ monitorias }) => [
          {
            aba: "Volume por Monitor",
            linhas: porMonitor(monitorias).map((m) => ({
              Monitor: m.monitor,
              "Nota Média": m.nota,
              Monitorias: m.volume,
            })),
          },
        ],
      },
      {
        id: "conformidade-monitor",
        nome: "Conformidade x Inconformidade por Monitor",
        descricao: "Apontamentos conformes/inconformes pontuados por monitor",
        build: ({ monitorias }) => [
          {
            aba: "Conformidade Monitor",
            linhas: conformidadePorMonitor(monitorias).map((m) => ({
              Monitor: m.monitor,
              Monitorias: m.volume,
              "Nota Média": m.nota,
              Conforme: m.conforme,
              Inconforme: m.inconforme,
              "Não se aplica": m.na,
              Avaliados: m.avaliados,
              "% Conforme": m.pctConforme,
              "% Inconforme": m.pctInconforme,
            })),
          },
        ],
      },
      {
        id: "ranking-monitores",
        nome: "Ranking de Monitores",
        descricao: "Desempenho consolidado por monitor",
        build: ({ monitorias }) => [
          {
            aba: "Ranking Monitores",
            linhas: conformidadePorMonitor(monitorias).map((m, i) => ({
              "#": i + 1,
              Monitor: m.monitor,
              "Nota Média": m.nota,
              Monitorias: m.volume,
              Conformes: m.conforme,
              Inconformes: m.inconforme,
              "% Conforme": m.pctConforme,
            })),
          },
        ],
      },
      {
        id: "feedback-comparativo",
        nome: "Feedback · Comparativo de Auto-avaliação",
        descricao: "Nota do monitor x nota do operador (monitoria invertida)",
        build: ({ feedbacks }) => [
          {
            aba: "Feedback Comparativo",
            linhas: feedbacks
              .filter((f) => f.status === "concluido")
              .map((f) => ({
                Operador: f.operadorNome,
                Carteira: f.carteira,
                Monitor: f.monitor,
                "Nota Monitor": f.notaMonitor,
                "Nota Operador": f.notaOperador ?? "—",
                Diferença:
                  f.notaOperador != null
                    ? round1(f.notaOperador - f.notaMonitor)
                    : "—",
                "Concluído em": f.concluidoEm ? f.concluidoEm.slice(0, 10) : "—",
              })),
          },
        ],
      },
    ],
  },
]

/* ------------------------------ UI ------------------------------ */

function formatBr(iso: string) {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

export function ExportarRelatorio() {
  const { monitorias, checklists, recebimentos, feedbacks, ready } = useQualityData()
  const [carteiraFiltro, setCarteiraFiltro] = useState<string>("todas")
  const [dataInicio, setDataInicio] = useState<string>("")
  const [dataFim, setDataFim] = useState<string>("")

  const carteiras = useMemo(
    () => Array.from(new Set(monitorias.map((m) => m.carteira))).sort(),
    [monitorias],
  )

  const monitoriasFiltradas = useMemo(
    () =>
      monitorias.filter((m) => {
        if (carteiraFiltro !== "todas" && m.carteira !== carteiraFiltro) return false
        if (dataInicio && m.data < dataInicio) return false
        if (dataFim && m.data > dataFim) return false
        return true
      }),
    [monitorias, carteiraFiltro, dataInicio, dataFim],
  )

  const feedbacksFiltrados = useMemo(
    () =>
      feedbacks.filter((f) => {
        if (carteiraFiltro !== "todas" && f.carteira !== carteiraFiltro) return false
        const ref = (f.concluidoEm ?? f.criadoEm).slice(0, 10)
        if (dataInicio && ref < dataInicio) return false
        if (dataFim && ref > dataFim) return false
        return true
      }),
    [feedbacks, carteiraFiltro, dataInicio, dataFim],
  )

  const ctx: ExportContext = useMemo(
    () => ({
      monitorias: monitoriasFiltradas,
      checklists,
      recebimentos,
      feedbacks: feedbacksFiltrados,
    }),
    [monitoriasFiltradas, checklists, recebimentos, feedbacksFiltrados],
  )

  const periodoLabel = useMemo(() => {
    if (dataInicio && dataFim)
      return dataInicio === dataFim
        ? `Dia ${formatBr(dataInicio)}`
        : `${formatBr(dataInicio)} — ${formatBr(dataFim)}`
    if (dataInicio) return `A partir de ${formatBr(dataInicio)}`
    if (dataFim) return `Até ${formatBr(dataFim)}`
    return "Todo o período"
  }, [dataInicio, dataFim])

  const sufixoArquivo = useMemo(() => {
    const carteiraNome = carteiraFiltro === "todas" ? "todas-carteiras" : slug(carteiraFiltro)
    const periodo = dataInicio || dataFim ? `_${dataInicio || "inicio"}_a_${dataFim || "fim"}` : ""
    return `${carteiraNome}${periodo}`
  }, [carteiraFiltro, dataInicio, dataFim])

  const totalGraficos = useMemo(
    () => GRUPOS.reduce((s, g) => s + g.itens.length, 0),
    [],
  )

  function exportarItem(grupo: GrupoExport, item: ItemExport) {
    const planilhas = item.build(ctx)
    const temDados = planilhas.some((p) => p.linhas.length)
    baixarExcel(`${slug(item.nome)}_${sufixoArquivo}.xlsx`, planilhas)
    if (temDados) toast.success(`Exportado: ${item.nome}`)
    else toast.warning(`${item.nome}: sem dados no recorte atual`)
  }

  function exportarGrupo(grupo: GrupoExport) {
    const planilhas = grupo.itens.flatMap((it) => it.build(ctx))
    baixarExcel(`secao_${slug(grupo.titulo)}_${sufixoArquivo}.xlsx`, planilhas)
    const temDados = planilhas.some((p) => p.linhas.length)
    if (temDados) toast.success(`Seção exportada: ${grupo.titulo}`)
    else toast.warning(`${grupo.titulo}: sem dados no recorte atual`)
  }

  function exportarTudo() {
    const planilhas = GRUPOS.flatMap((g) => g.itens.flatMap((it) => it.build(ctx)))
    baixarExcel(`relatorio-completo_${sufixoArquivo}.xlsx`, planilhas)
    toast.success("Relatório completo exportado")
  }

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filtros globais */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-medium">
          <CalendarDays className="size-4 text-primary" />
          Filtros aplicados a todas as exportações
        </div>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 p-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Carteira</Label>
            <Select value={carteiraFiltro} onValueChange={(v) => setCarteiraFiltro(v ?? "todas")}>
              <SelectTrigger className="w-48">
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
            <Label htmlFor="exp-inicio" className="text-xs text-muted-foreground">
              De
            </Label>
            <Input
              id="exp-inicio"
              type="date"
              value={dataInicio}
              max={dataFim || undefined}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exp-fim" className="text-xs text-muted-foreground">
              Até
            </Label>
            <Input
              id="exp-fim"
              type="date"
              value={dataFim}
              min={dataInicio || undefined}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Atalhos</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCarteiraFiltro("todas")
                setDataInicio("")
                setDataFim("")
              }}
            >
              Limpar filtros
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex size-1.5 rounded-full bg-primary" aria-hidden />
            Exportando: <span className="font-medium text-foreground">{periodoLabel}</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-medium text-foreground">
              {monitoriasFiltradas.length} monitorias
            </span>
          </span>
          <Button size="sm" onClick={exportarTudo} className="gap-2">
            <FileSpreadsheet className="size-4" />
            Exportar tudo ({totalGraficos} gráficos)
          </Button>
        </div>
      </div>

      {/* Seções de exportação */}
      <div className="grid gap-4 lg:grid-cols-2">
        {GRUPOS.map((grupo) => {
          const Icon = grupo.icon
          return (
            <Card key={grupo.id} className="flex flex-col">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                        <Icon className="size-4" />
                      </span>
                      {grupo.titulo}
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">{grupo.origem}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="shrink-0 tabular-nums">
                      {grupo.itens.length} gráfico{grupo.itens.length > 1 ? "s" : ""}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => exportarGrupo(grupo)}
                    >
                      <FileDown className="size-4" />
                      Seção
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-2">
                {grupo.itens.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.descricao}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 gap-1.5"
                      onClick={() => exportarItem(grupo, item)}
                    >
                      <Download className="size-4" />
                      Excel
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
