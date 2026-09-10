"use client"

import { useMemo, useState } from "react"
import {
  User,
  CalendarClock,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Activity,
  ClipboardList,
  Grid2x2,
  MessageSquareReply,
  Briefcase,
  ShieldCheck,
  Download,
  Search,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CardTitleHint } from "@/components/card-title-hint"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OperadorSearch } from "@/components/operador-search"
import { useQualityData } from "@/lib/use-quality-data"
import {
  serieTemporal,
  aderenciaItens,
  resumoConformidade,
  porTabulacao,
  distribuicaoFaixas,
  QUADRANTE_MAPA,
  type Periodicidade,
} from "@/lib/aggregations"
import { media, resumoQuartis } from "@/lib/analytics"
import { notaBadgeClass, faixaNota, formatarData, tempoDeEmpresa } from "@/lib/analytics"
import {
  TendenciaChart,
  FaixasPieChart,
  ConformidadePieChart,
  TabulacaoPieChart,
} from "@/components/dashboard-charts"
import { cn } from "@/lib/utils"
import type { SiglaQuadrante } from "@/lib/types"
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
  tone?: "default" | "good" | "bad" | "muted" | "excelente" | "bom" | "regular" | "critico"
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

const PERIODICIDADES: { value: Periodicidade; label: string }[] = [
  { value: "diario", label: "Diário" },
  { value: "semanal", label: "Semanal" },
  { value: "mensal", label: "Mensal" },
]

export function HistoricoOperador() {
  const { monitorias, operadores, checklists, feedbacks, recebimentos, ready } = useQualityData()
  const [operadorId, setOperadorId] = useState<string | null>(null)
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>("mensal")

  const operadorSelecionado = useMemo(
    () => operadores.find((o) => o.id === operadorId) ?? null,
    [operadores, operadorId],
  )

  // Só calcula o consolidado quando há um operador selecionado.
  const dados = useMemo(() => {
    if (!operadorSelecionado) return null

    // Filtra monitorias por id ou por nome (fallback para dados sem id consistente).
    const minhas = monitorias
      .filter(
        (m) =>
          m.operadorId === operadorSelecionado.id ||
          m.operadorNome === operadorSelecionado.nome,
      )
      .sort((a, b) => a.data.localeCompare(b.data))

    if (minhas.length === 0) {
      return { vazio: true as const }
    }

    const notas = minhas.map((m) => m.nota)
    const quartis = resumoQuartis(notas)
    const notaMedia = Math.round(media(notas) * 10) / 10

    const primeira = minhas[0]
    const ultima = minhas[minhas.length - 1]

    // Tendência ao longo do tempo
    const serie = serieTemporal(minhas, periodicidade)

    // Distribuição por faixa
    const faixas = distribuicaoFaixas(minhas)
    const faixasPie = faixas
      .map((f) => ({ faixa: f.faixa, qtd: f.qtd }))
      .filter((f) => f.qtd > 0)

    // Conformidade consolidada (todas as abas usam apontamentos)
    const conf = resumoConformidade(minhas)
    const confPie = [
      { tipo: "Conforme", qtd: conf.conforme, cor: "#16a34a" },
      { tipo: "Inconforme", qtd: conf.inconforme, cor: "#ef4444" },
      { tipo: "Não se aplica", qtd: conf.na, cor: "#94a3b8" },
    ].filter((d) => d.qtd > 0)

    // Tabulações
    const tabs = porTabulacao(minhas)

    // Aderência por item (oportunidades de melhoria do operador)
    const itens = aderenciaItens(minhas, checklists)
    const oportunidades = [...itens]
      .filter((i) => i.inconforme > 0)
      .sort((a, b) => b.pctInconforme - a.pctInconforme)
      .slice(0, 6)

    // Faixas de desempenho (contagem)
    const contagemFaixas = {
      excelente: notas.filter((n) => n >= 90).length,
      bom: notas.filter((n) => n >= 75 && n < 90).length,
      regular: notas.filter((n) => n >= 60 && n < 75).length,
      critico: notas.filter((n) => n < 60).length,
    }

    // Quadrante (Performance x Qualidade)
    const rec = recebimentos.find((r) => r.operadorNome === operadorSelecionado.nome)?.nivel ?? null
    const qualidade: "alta" | "baixa" = notaMedia >= 75 ? "alta" : "baixa"
    let siglaQuadrante: SiglaQuadrante | null = null
    if (rec) {
      // 1ª letra = Performance (Recebimento), 2ª letra = Qualidade
      const p = rec === "alto" ? "A" : "B"
      const q = qualidade === "alta" ? "A" : "B"
      siglaQuadrante = `${p}${q}` as SiglaQuadrante
    }
    const quadranteInfo = siglaQuadrante ? QUADRANTE_MAPA[siglaQuadrante] : null

    // Feedbacks invertidos do operador
    const meusFeedbacks = feedbacks
      .filter(
        (f) =>
          f.operadorId === operadorSelecionado.id ||
          f.operadorNome === operadorSelecionado.nome,
      )
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    const feedbacksConcluidos = meusFeedbacks.filter((f) => f.status === "concluido")
    const gapMedio =
      feedbacksConcluidos.length > 0
        ? Math.round(
            (feedbacksConcluidos.reduce(
              (s, f) => s + Math.abs((f.notaOperador ?? 0) - f.notaMonitor),
              0,
            ) /
              feedbacksConcluidos.length) *
              10,
          ) / 10
        : null

    // Monitores que avaliaram o operador
    const monitoresSet = Array.from(new Set(minhas.map((m) => m.monitor)))

    return {
      vazio: false as const,
      minhas,
      notas,
      quartis,
      notaMedia,
      primeira,
      ultima,
      serie,
      faixasPie,
      conf,
      confPie,
      tabs,
      oportunidades,
      contagemFaixas,
      rec,
      qualidade,
      siglaQuadrante,
      quadranteInfo,
      meusFeedbacks,
      feedbacksConcluidos,
      gapMedio,
      monitoresSet,
    }
  }, [operadorSelecionado, monitorias, checklists, feedbacks, recebimentos, periodicidade])

  function exportarExcel() {
    if (!dados || dados.vazio || !operadorSelecionado) return
    const linhas = dados.minhas.map((m) => ({
      Data: formatarData(m.data),
      "EC/Call": m.ecCallId,
      Carteira: m.carteira,
      Tabulação: m.tabulacao,
      Monitor: m.monitor,
      Nota: m.nota,
      Faixa: faixaNota(m.nota),
      Inconformidades: m.apontamentos.filter((a) => a.status === "inconforme").length,
    }))
    const ws = XLSX.utils.json_to_sheet(linhas)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Histórico")
    XLSX.writeFile(
      wb,
      `historico_${operadorSelecionado.nome.replace(/\s+/g, "-").toLowerCase()}.xlsx`,
    )
  }

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de pesquisa */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs text-muted-foreground">
              Selecione o operador para carregar o histórico
            </label>
            <OperadorSearch
              operadores={operadores}
              value={operadorId}
              onChange={setOperadorId}
            />
          </div>
          {operadorSelecionado && (
            <Button variant="outline" onClick={() => setOperadorId(null)}>
              Limpar seleção
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Estado inicial: nenhum operador selecionado */}
      {!operadorSelecionado && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Search className="size-6" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium">Nenhum operador selecionado</p>
              <p className="max-w-md text-sm text-muted-foreground text-pretty">
                Use a barra de pesquisa acima para escolher um operador. O histórico
                consolidado será carregado somente após a seleção, mantendo a tela leve
                e otimizada.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operador sem monitorias */}
      {operadorSelecionado && dados?.vazio && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <AlertTriangle className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              {operadorSelecionado.nome} ainda não possui monitorias analisadas
            </p>
            <p className="text-sm text-muted-foreground">
              Assim que houver registros, o histórico aparecerá aqui.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Consolidado do operador */}
      {operadorSelecionado && dados && !dados.vazio && (
        <>
          {/* Cabeçalho do operador */}
          <Card>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="size-6" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold leading-tight">
                    {operadorSelecionado.nome}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Briefcase className="size-3.5" />
                      {operadorSelecionado.carteira}
                    </span>
                    {operadorSelecionado.admissao && (
                      <span className="flex items-center gap-1">
                        <CalendarClock className="size-3.5" />
                        Admissão {formatarData(operadorSelecionado.admissao)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="size-3.5" />
                      {tempoDeEmpresa(operadorSelecionado.admissao)} de empresa
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn("text-sm", notaBadgeClass(dados.notaMedia))}>
                  Média {dados.notaMedia} · {faixaNota(dados.notaMedia)}
                </Badge>
                <Button variant="outline" size="sm" onClick={exportarExcel}>
                  <Download className="size-4" />
                  Exportar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* KPIs principais */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat
              icon={ClipboardList}
              label="Monitorias analisadas"
              value={String(dados.minhas.length)}
              sub={`${dados.monitoresSet.length} monitor(es)`}
            />
            <Stat
              icon={TrendingUp}
              label="Nota média"
              value={String(dados.notaMedia)}
              sub={`mediana ${dados.quartis.mediana.toFixed(0)} · IQR ${(dados.quartis.q3 - dados.quartis.q1).toFixed(0)}`}
              tone={dados.notaMedia >= 75 ? "good" : "bad"}
            />
            <Stat
              icon={CalendarClock}
              label="Primeira monitoria"
              value={formatarData(dados.primeira.data)}
              sub={`última em ${formatarData(dados.ultima.data)}`}
            />
            <Stat
              icon={AlertTriangle}
              label="Críticas (<60)"
              value={String(dados.contagemFaixas.critico)}
              sub={`${dados.conf.inconforme} inconformidades`}
              tone={dados.contagemFaixas.critico > 0 ? "bad" : "good"}
            />
          </div>

          {/* Distribuição por faixa de desempenho */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat
              icon={Award}
              label="Excelente (90+)"
              value={String(dados.contagemFaixas.excelente)}
              tone="excelente"
            />
            <Stat
              icon={CheckCircle2}
              label="Bom (75-89)"
              value={String(dados.contagemFaixas.bom)}
              tone="bom"
            />
            <Stat
              icon={Activity}
              label="Regular (60-74)"
              value={String(dados.contagemFaixas.regular)}
              tone="regular"
            />
            <Stat
              icon={AlertTriangle}
              label="Crítico (<60)"
              value={String(dados.contagemFaixas.critico)}
              tone="critico"
            />
          </div>

          {/* Evolução temporal */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <div>
                <CardTitleHint
                  title="Evolução da Nota"
                  description="Tendência da nota média do operador ao longo do tempo"
                />
              </div>
              <div className="flex gap-1 rounded-md bg-secondary p-0.5">
                {PERIODICIDADES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPeriodicidade(p.value)}
                    className={cn(
                      "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                      periodicidade === p.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <TendenciaChart data={dados.serie} />
            </CardContent>
          </Card>

          {/* Gráficos consolidados */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitleHint
                  title="Faixas de Desempenho"
                  description="Distribuição das notas por faixa"
                />
              </CardHeader>
              <CardContent>
                {dados.faixasPie.length ? (
                  <FaixasPieChart data={dados.faixasPie} />
                ) : (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    Sem dados.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitleHint
                  title="Conformidade Geral"
                  description="Conforme · Inconforme · Não se aplica"
                />
              </CardHeader>
              <CardContent>
                {dados.confPie.length ? (
                  <ConformidadePieChart data={dados.confPie} />
                ) : (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    Sem dados.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitleHint
                  title="Tabulações"
                  description="Distribuição das ligações monitoradas"
                />
              </CardHeader>
              <CardContent>
                {dados.tabs.length ? (
                  <TabulacaoPieChart data={dados.tabs} />
                ) : (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    Sem dados.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Conformidade + Quadrante */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitleHint
                  icon={<XCircle className="size-4 text-destructive" />}
                  title="Principais Oportunidades de Melhoria"
                  description="Itens do checklist com maior % de inconformidade do operador"
                />
              </CardHeader>
              <CardContent>
                {dados.oportunidades.length ? (
                  <div className="flex flex-col gap-2.5">
                    {dados.oportunidades.map((it) => (
                      <div key={it.itemId} className="flex items-center gap-3 text-sm">
                        <span className="min-w-0 flex-1 truncate" title={it.texto}>
                          {it.texto}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {it.inconforme}/{it.avaliados}
                        </span>
                        <Badge className="shrink-0 border-destructive/30 bg-destructive/15 text-destructive">
                          {it.pctInconforme}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    Nenhuma inconformidade registrada. Excelente desempenho!
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitleHint
                  icon={<Grid2x2 className="size-4 text-muted-foreground" />}
                  title="Quadrante"
                  description="Performance x Qualidade"
                />
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {dados.quadranteInfo ? (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                        {dados.quadranteInfo.quadrante}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{dados.quadranteInfo.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          Sigla {dados.quadranteInfo.sigla}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground text-pretty">
                      {dados.quadranteInfo.descricao}
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Badge variant="outline" className="w-fit">
                      Qualidade {dados.qualidade === "alta" ? "Alta" : "Baixa"}
                    </Badge>
                    <p className="text-sm text-muted-foreground text-pretty">
                      O nível de recebimento ainda não foi definido na aba Quadrante.
                      Defina-o para classificar o operador no quadrante completo.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Feedback invertido */}
          {dados.meusFeedbacks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitleHint
                  icon={<MessageSquareReply className="size-4 text-muted-foreground" />}
                  title="Feedbacks (Monitoria Invertida)"
                  description={
                    <>
                      {dados.feedbacksConcluidos.length} concluído(s) de{" "}
                      {dados.meusFeedbacks.length}
                      {dados.gapMedio !== null &&
                        ` · gap médio de auto-avaliação ${dados.gapMedio} pts`}
                    </>
                  }
                />
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Nota Monitor</TableHead>
                        <TableHead className="text-right">Nota Operador</TableHead>
                        <TableHead className="text-right">Gap</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dados.meusFeedbacks.map((f) => {
                        const gap =
                          f.notaOperador != null
                            ? Math.abs(f.notaOperador - f.notaMonitor)
                            : null
                        return (
                          <TableRow key={f.id}>
                            <TableCell className="text-muted-foreground">
                              {formatarData(f.criadoEm.slice(0, 10))}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  f.status === "concluido"
                                    ? "border-chart-5/30 bg-chart-5/15 text-chart-5"
                                    : "border-chart-3/30 bg-chart-3/15 text-chart-3"
                                }
                              >
                                {f.status === "concluido" ? "Concluído" : "Pendente"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {f.notaMonitor}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {f.notaOperador ?? "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {gap != null ? gap : "—"}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico completo de monitorias */}
          <Card>
            <CardHeader>
              <CardTitleHint
                icon={<ClipboardList className="size-4 text-muted-foreground" />}
                title="Histórico Completo de Monitorias"
                description={
                  <>
                    Todas as {dados.minhas.length} monitorias do operador, da mais recente à
                    primeira analisada
                  </>
                }
              />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>EC/Call</TableHead>
                      <TableHead>Carteira</TableHead>
                      <TableHead>Tabulação</TableHead>
                      <TableHead>Monitor</TableHead>
                      <TableHead className="text-right">Inconform.</TableHead>
                      <TableHead className="text-right">Nota</TableHead>
                      <TableHead className="text-right">Faixa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...dados.minhas].reverse().map((m) => {
                      const inconf = m.apontamentos.filter(
                        (a) => a.status === "inconforme",
                      ).length
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {formatarData(m.data)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{m.ecCallId}</TableCell>
                          <TableCell>{m.carteira}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {m.tabulacao}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{m.monitor}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {inconf || "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {m.nota}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className={notaBadgeClass(m.nota)}>
                              {faixaNota(m.nota)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
