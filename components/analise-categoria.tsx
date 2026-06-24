"use client"

import { useMemo, useState } from "react"
import { ChevronRight, AlertTriangle, Layers, FileSpreadsheet } from "lucide-react"
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
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function pctTone(pct: number) {
  if (pct >= 90) return "text-chart-5"
  if (pct >= 75) return "text-chart-1"
  if (pct >= 60) return "text-chart-3"
  return "text-destructive"
}

export function AnaliseCategoria({
  monitorias,
  checklists,
  carteira,
}: {
  monitorias: Monitoria[]
  checklists: Checklist[]
  carteira?: string
}) {
  const blocos = useMemo(
    () => analiseCategoria(monitorias, checklists, carteira),
    [monitorias, checklists, carteira],
  )

  const [abertos, setAbertos] = useState<Set<string>>(new Set())

  function toggle(bloco: string) {
    setAbertos((prev) => {
      const next = new Set(prev)
      if (next.has(bloco)) next.delete(bloco)
      else next.add(bloco)
      return next
    })
  }

  const todosAbertos = blocos.length > 0 && abertos.size === blocos.length

  function toggleTodos() {
    setAbertos(todosAbertos ? new Set() : new Set(blocos.map((b) => b.bloco)))
  }

  function exportarExcel() {
    if (!blocos.length) {
      toast.warning("Sem dados para exportar no recorte atual")
      return
    }

    const linhas: Record<string, string | number>[] = []
    for (const b of blocos) {
      linhas.push({
        Tipo: "Tópico",
        Tópico: b.bloco,
        Item: "",
        Crítico: "",
        "Qtd Itens": b.qtd,
        "% Conforme": b.pctConforme,
        "% Inconforme": b.pctInconforme,
      })
      for (const it of b.itens) {
        linhas.push({
          Tipo: "Item",
          Tópico: b.bloco,
          Item: it.texto,
          Crítico: it.critico ? "Sim" : "Não",
          "Qtd Itens": it.qtd,
          "% Conforme": it.pctConforme,
          "% Inconforme": it.pctInconforme,
        })
      }
    }

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(linhas)
    XLSX.utils.book_append_sheet(wb, ws, "Análise por Categoria")
    const sufixo = carteira && carteira !== "todas" ? slug(carteira) : "todas-carteiras"
    XLSX.writeFile(wb, `analise-por-categoria_${sufixo}.xlsx`)
    toast.success("Análise por Categoria exportada")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitleHint
            icon={<Layers className="size-4 text-muted-foreground" />}
            title="Análise por Categoria do Checklist"
            description="Conformidade agrupada por bloco do checklist. Clique em um bloco para abrir e ver os itens que o compõem."
          />
          {blocos.length > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={toggleTodos}>
                {todosAbertos ? "Recolher tudo" : "Expandir tudo"}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={exportarExcel}>
                <FileSpreadsheet className="size-4" />
                Exportar Excel
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {blocos.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Sem apontamentos para os filtros selecionados.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {/* Cabeçalho */}
            <div className="grid grid-cols-[1fr_84px_104px_104px] items-center gap-2 border-b border-border bg-secondary/50 px-3 py-2 text-xs font-medium text-muted-foreground">
              <span>Tópico</span>
              <span className="text-right">Qtd Itens</span>
              <span className="text-right">% Conforme</span>
              <span className="text-right">% Inconforme</span>
            </div>

            {blocos.map((b, idx) => {
              const aberto = abertos.has(b.bloco)
              return (
                <div key={b.bloco}>
                  {/* Linha do bloco */}
                  <button
                    type="button"
                    onClick={() => toggle(b.bloco)}
                    aria-expanded={aberto}
                    className={cn(
                      "grid w-full grid-cols-[1fr_84px_104px_104px] items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-secondary/40",
                      idx % 2 === 1 && "bg-secondary/20",
                    )}
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <ChevronRight
                        className={cn(
                          "size-4 shrink-0 text-muted-foreground transition-transform",
                          aberto && "rotate-90",
                        )}
                      />
                      {b.bloco}
                    </span>
                    <span className="text-right tabular-nums font-medium">{b.qtd}</span>
                    <span
                      className={cn(
                        "text-right tabular-nums font-medium",
                        pctTone(b.pctConforme),
                      )}
                    >
                      {b.pctConforme}%
                    </span>
                    <span
                      className={cn(
                        "text-right tabular-nums font-medium",
                        b.pctInconforme > 0 ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {b.pctInconforme > 0 ? `${b.pctInconforme}%` : "—"}
                    </span>
                  </button>

                  {/* Itens do bloco */}
                  {aberto &&
                    b.itens.map((it) => (
                      <div
                        key={it.itemId}
                        className="grid grid-cols-[1fr_84px_104px_104px] items-center gap-2 border-t border-border/60 bg-background px-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-1.5 pl-6 text-muted-foreground">
                          <span className="truncate">{it.texto}</span>
                          {it.critico && (
                            <Badge
                              variant="outline"
                              className="shrink-0 border-destructive/40 bg-destructive/10 text-destructive"
                            >
                              <AlertTriangle className="mr-1 size-3" /> Crítico
                            </Badge>
                          )}
                        </span>
                        <span className="text-right tabular-nums text-muted-foreground">
                          {it.qtd}
                        </span>
                        <span className={cn("text-right tabular-nums", pctTone(it.pctConforme))}>
                          {it.pctConforme}%
                        </span>
                        <span
                          className={cn(
                            "text-right tabular-nums",
                            it.pctInconforme > 0 ? "text-destructive" : "text-muted-foreground",
                          )}
                        >
                          {it.pctInconforme > 0 ? `${it.pctInconforme}%` : "—"}
                        </span>
                      </div>
                    ))}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
