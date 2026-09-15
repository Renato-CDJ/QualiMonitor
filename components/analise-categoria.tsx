"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  BarChart3,
  ChevronRight,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  Target,
  TriangleAlert,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CardTitleHint } from "@/components/card-title-hint"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { analiseCategoria } from "@/lib/aggregations"
import type { Checklist, Monitoria } from "@/lib/types"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx"
import { toast } from "sonner"

function slug(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function pctTone(pct: number) {
  if (pct >= 90) return "text-chart-5"
  if (pct >= 75) return "text-chart-1"
  if (pct >= 60) return "text-chart-3"
  return "text-destructive"
}

function progressTone(pct: number) {
  if (pct >= 90) return "bg-chart-5"
  if (pct >= 75) return "bg-chart-1"
  if (pct >= 60) return "bg-chart-3"
  return "bg-destructive"
}

export function AnaliseCategoria({ monitorias, checklists, carteira }: { monitorias: Monitoria[]; checklists: Checklist[]; carteira?: string }) {
  const blocos = useMemo(() => analiseCategoria(monitorias, checklists, carteira), [monitorias, checklists, carteira])
  const [abertos, setAbertos] = useState<Set<string>>(new Set())

  const resumo = useMemo(() => {
    const conforme = blocos.reduce((sum, bloco) => sum + bloco.conforme, 0)
    const inconforme = blocos.reduce((sum, bloco) => sum + bloco.inconforme, 0)
    const na = blocos.reduce((sum, bloco) => sum + bloco.na, 0)
    const avaliados = conforme + inconforme
    const itensCriticos = blocos.flatMap((bloco) => bloco.itens).filter((item) => item.critico && item.inconforme > 0)
    return {
      conforme,
      inconforme,
      na,
      avaliados,
      pctConforme: avaliados ? Math.round((conforme / avaliados) * 1000) / 10 : 0,
      itensCriticos,
      maiorRisco: [...blocos].sort((a, b) => b.pctInconforme - a.pctInconforme)[0],
    }
  }, [blocos])

  function toggle(bloco: string) {
    setAbertos((prev) => {
      const next = new Set(prev)
      if (next.has(bloco)) next.delete(bloco); else next.add(bloco)
      return next
    })
  }

  const todosAbertos = blocos.length > 0 && abertos.size === blocos.length
  function toggleTodos() { setAbertos(todosAbertos ? new Set() : new Set(blocos.map((b) => b.bloco))) }

  function exportarExcel() {
    if (!blocos.length) { toast.warning("Sem dados para exportar no recorte atual"); return }
    const linhas: Record<string, string | number>[] = []
    for (const b of blocos) {
      linhas.push({ Tipo: "Tópico", Tópico: b.bloco, Item: "", Crítico: "", "Qtd Itens": b.qtd, "% Conforme": b.pctConforme, "% Inconforme": b.pctInconforme })
      for (const it of b.itens) linhas.push({ Tipo: "Item", Tópico: b.bloco, Item: it.texto, Crítico: it.critico ? "Sim" : "Não", "Qtd Itens": it.qtd, "% Conforme": it.pctConforme, "% Inconforme": it.pctInconforme })
    }
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhas), "Análise por Categoria")
    XLSX.writeFile(wb, `analise-por-categoria_${carteira && carteira !== "todas" ? slug(carteira) : "todas-carteiras"}.xlsx`)
    toast.success("Análise por Categoria exportada")
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitleHint icon={<Layers className="size-4 text-muted-foreground" />} title="Análise por Categoria do Checklist" description="Encontre rapidamente os tópicos que sustentam o resultado e os itens que exigem ação." />
          {blocos.length > 0 && <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={toggleTodos}>{todosAbertos ? "Recolher tudo" : "Expandir tudo"}</Button><Button variant="outline" size="sm" onClick={exportarExcel}><FileSpreadsheet data-icon="inline-start" />Exportar Excel</Button></div>}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-5">
        {blocos.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">Sem apontamentos para os filtros selecionados.</p> : <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={Target} label="Conformidade geral" value={`${resumo.pctConforme}%`} detail={`${resumo.conforme} conformes de ${resumo.avaliados} avaliados`} tone={pctTone(resumo.pctConforme)} />
            <Metric icon={TriangleAlert} label="Inconformidades" value={String(resumo.inconforme)} detail={`${resumo.avaliados ? Math.round((resumo.inconforme / resumo.avaliados) * 1000) / 10 : 0}% dos itens avaliados`} tone="text-destructive" />
            <Metric icon={ShieldCheck} label="Itens críticos" value={String(resumo.itensCriticos.length)} detail="Com pelo menos um apontamento" tone={resumo.itensCriticos.length ? "text-destructive" : "text-chart-5"} />
            <Metric icon={BarChart3} label="Tópico de maior risco" value={resumo.maiorRisco?.bloco ?? "—"} detail={resumo.maiorRisco ? `${resumo.maiorRisco.pctInconforme}% inconforme` : "Sem dados"} tone="text-foreground" compact />
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-muted/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold">Mapa de desempenho por tópico</p><p className="text-xs text-muted-foreground">Na mesma sequência em que os itens foram criados no checklist.</p></div><Badge variant="secondary">{blocos.length} tópicos</Badge></div>
            <div className="grid gap-3 md:grid-cols-2">
              {blocos.map((b) => <button key={b.bloco} type="button" onClick={() => toggle(b.bloco)} className="rounded-lg border bg-background p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40" aria-label={`Abrir detalhes de ${b.bloco}`}><div className="mb-2 flex items-center justify-between gap-2"><span className="truncate text-sm font-medium">{b.bloco}</span><span className={cn("text-sm font-semibold tabular-nums", pctTone(b.pctConforme))}>{b.pctConforme}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", progressTone(b.pctConforme))} style={{ width: `${Math.min(100, b.pctConforme)}%` }} /></div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{b.itens.length} itens</span><span>{b.inconforme} inconformidades</span></div></button>)}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <div className="min-w-[650px]">
              <div className="grid grid-cols-[minmax(240px,1fr)_84px_104px_104px] items-center gap-2 border-b bg-secondary/50 px-3 py-2 text-xs font-medium text-muted-foreground"><span>Tópico / item do checklist</span><span className="text-right">Qtd. avaliados</span><span className="text-right">Conforme</span><span className="text-right">Inconforme</span></div>
              {blocos.map((b, idx) => { const aberto = abertos.has(b.bloco); return <div key={b.bloco}><button type="button" onClick={() => toggle(b.bloco)} aria-expanded={aberto} className={cn("grid w-full grid-cols-[minmax(240px,1fr)_84px_104px_104px] items-center gap-2 px-3 py-3 text-left transition-colors hover:bg-secondary/40", idx % 2 === 1 && "bg-secondary/20")}><span className="flex items-center gap-2 font-medium"><ChevronRight className={cn("size-4 shrink-0 text-muted-foreground transition-transform", aberto && "rotate-90")} />{b.bloco}<Badge variant={b.pctInconforme >= 20 ? "destructive" : "secondary"} className="hidden sm:inline-flex">{b.itens.length} itens</Badge></span><span className="text-right tabular-nums font-medium">{b.qtd}</span><span className={cn("text-right tabular-nums font-medium", pctTone(b.pctConforme))}>{b.pctConforme}%</span><span className={cn("text-right tabular-nums font-medium", b.pctInconforme > 0 ? "text-destructive" : "text-muted-foreground")}>{b.pctInconforme > 0 ? `${b.pctInconforme}%` : "—"}</span></button>{aberto && b.itens.map((it) => <div key={it.itemId} className="grid grid-cols-[minmax(240px,1fr)_84px_104px_104px] items-center gap-2 border-t border-border/60 bg-background px-3 py-2.5 text-sm"><span className="flex min-w-0 items-center gap-2 pl-6 text-muted-foreground"><span className="truncate">{it.texto}</span>{it.critico && <Badge variant="outline" className="shrink-0 border-destructive/40 bg-destructive/10 text-destructive"><AlertTriangle data-icon="inline-start" />Crítico</Badge>}</span><span className="text-right tabular-nums text-muted-foreground">{it.qtd}</span><span className={cn("text-right tabular-nums", pctTone(it.pctConforme))}>{it.pctConforme}%</span><span className={cn("text-right tabular-nums", it.pctInconforme > 0 ? "text-destructive" : "text-muted-foreground")}>{it.pctInconforme > 0 ? `${it.pctInconforme}%` : "—"}</span></div>)}</div> })}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">N.A. não entra no cálculo de conformidade. Foram considerados {resumo.na} apontamentos N.A. no recorte atual.</p>
        </>}
      </CardContent>
    </Card>
  )
}

function Metric({ icon: Icon, label, value, detail, tone, compact = false }: { icon: typeof Target; label: string; value: string; detail: string; tone: string; compact?: boolean }) {
  return <div className="rounded-xl border bg-background p-4"><div className="mb-3 flex items-center gap-2 text-muted-foreground"><Icon className="size-4" /><span className="text-xs font-medium uppercase tracking-wide">{label}</span></div><p className={cn("truncate font-semibold tracking-tight", compact ? "text-lg" : "text-2xl", tone)}>{value}</p><p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p></div>
}
