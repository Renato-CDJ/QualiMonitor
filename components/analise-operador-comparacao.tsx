"use client"

import { useMemo, useState } from "react"
import { ChevronRight, Layers } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CardTitleHint } from "@/components/card-title-hint"
import { analiseCategoriaPorOperador } from "@/lib/aggregations"
import type { Checklist, Monitoria } from "@/lib/types"
import { cn } from "@/lib/utils"

function pctTone(pct: number) {
  if (pct >= 90) return "text-chart-5"
  if (pct >= 75) return "text-chart-1"
  if (pct >= 60) return "text-chart-3"
  return "text-destructive"
}

export function AnalisOperadorComparacao({
  monitorias,
  checklists,
  carteira,
}: {
  monitorias: Monitoria[]
  checklists: Checklist[]
  carteira?: string
}) {
  const dados = useMemo(
    () => analiseCategoriaPorOperador(monitorias, checklists, carteira),
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

  // Agrupa por bloco
  const blocoOperador = new Map<string, typeof dados>()
  for (const item of dados) {
    const key = `${item.bloco}`
    if (!blocoOperador.has(key)) blocoOperador.set(key, [])
    blocoOperador.get(key)!.push(item)
  }

  const blocos = Array.from(blocoOperador.entries())
    .map(([bloco, itens]) => {
      const conforme = itens.reduce((s, i) => s + i.conforme, 0)
      const inconforme = itens.reduce((s, i) => s + i.inconforme, 0)
      const qtd = conforme + inconforme
      const round1 = (n: number) => Math.round(n * 10) / 10
      return {
        bloco,
        conforme,
        inconforme,
        qtd,
        pctConforme: qtd ? round1((conforme / qtd) * 100) : 0,
        pctInconforme: qtd ? round1((inconforme / qtd) * 100) : 0,
        itens: itens.sort((a, b) => a.operador.localeCompare(b.operador, "pt-BR")),
      }
    })
    .sort((a, b) => a.bloco.localeCompare(b.bloco, "pt-BR"))

  const todosAbertos = blocos.length > 0 && abertos.size === blocos.length

  function toggleTodos() {
    setAbertos(todosAbertos ? new Set() : new Set(blocos.map((b) => b.bloco)))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitleHint
            icon={<Layers className="size-4 text-muted-foreground" />}
            title="Análise por Operador e Item"
            description="Desempenho de cada operador por item do checklist. Clique em um tópico para abrir e ver como cada operador foi avaliado."
          />
          {blocos.length > 0 && (
            <button
              type="button"
              onClick={toggleTodos}
              className="text-xs font-medium text-primary hover:text-primary/80"
            >
              {todosAbertos ? "Recolher tudo" : "Expandir tudo"}
            </button>
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
            <div className="grid grid-cols-[1fr_100px_100px_100px] items-center gap-2 border-b border-border bg-secondary/50 px-3 py-2 text-xs font-medium text-muted-foreground">
              <span>Tópico</span>
              <span className="text-right">Qtd Itens</span>
              <span className="text-right">% Conforme</span>
              <span className="text-right">% Inconforme</span>
            </div>

            {blocos.map((bloco, idx) => {
              const aberto = abertos.has(bloco.bloco)
              return (
                <div key={bloco.bloco}>
                  {/* Linha do bloco */}
                  <button
                    type="button"
                    onClick={() => toggle(bloco.bloco)}
                    aria-expanded={aberto}
                    className={cn(
                      "grid w-full grid-cols-[1fr_100px_100px_100px] items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-secondary/40",
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
                      {bloco.bloco}
                    </span>
                    <span className="text-right tabular-nums font-medium">{bloco.qtd}</span>
                    <span className={cn("text-right tabular-nums font-medium", pctTone(bloco.pctConforme))}>
                      {bloco.pctConforme}%
                    </span>
                    <span
                      className={cn(
                        "text-right tabular-nums font-medium",
                        bloco.pctInconforme > 0 ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {bloco.pctInconforme > 0 ? `${bloco.pctInconforme}%` : "—"}
                    </span>
                  </button>

                  {/* Itens expandidos */}
                  {aberto &&
                    Array.from(new Map(bloco.itens.map((item) => [item.itemId, item])).values()).map((item) => (
                      <div
                        key={item.itemId}
                        className="border-t border-border/60 bg-background px-3 py-2.5 text-sm"
                      >
                        <div className="mb-2 flex items-start gap-2 pl-6">
                          <span className="flex-1 text-muted-foreground">{item.texto}</span>
                        </div>
                        <div className="ml-6 grid grid-cols-[120px_120px_120px_120px] gap-2 text-xs">
                          <span className="font-medium text-muted-foreground">Operador</span>
                          <span className="text-right font-medium text-muted-foreground">Conforme</span>
                          <span className="text-right font-medium text-muted-foreground">% Conforme</span>
                          <span className="text-right font-medium text-muted-foreground">% Inconforme</span>
                        </div>
                        <div className="ml-6 flex flex-col gap-1">
                          {bloco.itens
                            .filter((operadorItem) => operadorItem.itemId === item.itemId)
                            .sort((a, b) => a.operador.localeCompare(b.operador, "pt-BR"))
                            .map((operadorItem) => (
                              <div key={operadorItem.operadorId} className="grid grid-cols-[120px_120px_120px_120px] gap-2 py-1 text-xs">
                                <span className="truncate text-muted-foreground">{operadorItem.operador}</span>
                                <span className="text-right tabular-nums">{operadorItem.conforme}</span>
                                <span className={cn("text-right tabular-nums", pctTone(operadorItem.pctConforme))}>
                                  {operadorItem.pctConforme}%
                                </span>
                                <span className={cn("text-right tabular-nums", operadorItem.pctInconforme > 0 ? "text-destructive" : "text-muted-foreground")}>
                                  {operadorItem.pctInconforme > 0 ? `${operadorItem.pctInconforme}%` : "—"}
                                </span>
                              </div>
                            ))}
                        </div>
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
