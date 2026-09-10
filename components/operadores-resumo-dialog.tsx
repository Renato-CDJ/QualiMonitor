"use client"

import { useMemo, type ReactNode } from "react"
import { CheckCircle2, XCircle, AlertOctagon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { resumoOperadores, type ResumoOperador } from "@/lib/aggregations"
import { notaColorClass, faixaNota } from "@/lib/analytics"
import { useNotasGlobais } from "@/lib/notas-context"
import type { Monitoria } from "@/lib/types"
import { cn } from "@/lib/utils"

type Variante = "monitorias" | "criticas" | "inconformidades"

const CONFIG: Record<
  Variante,
  { titulo: string; descricao: string; vazio: string }
> = {
  monitorias: {
    titulo: "Operadores monitorados",
    descricao: "Operadores avaliados no período e filtro selecionados.",
    vazio: "Nenhum operador monitorado no período.",
  },
  criticas: {
    titulo: "Operadores com notas críticas",
    descricao: "Operadores com ao menos uma monitoria abaixo de 60 no período.",
    vazio: "Nenhuma nota crítica no período.",
  },
  inconformidades: {
    titulo: "Operadores com inconformidades",
    descricao: "Operadores com apontamentos inconformes no período.",
    vazio: "Nenhuma inconformidade no período.",
  },
}

export function OperadoresResumoDialog({
  monitorias,
  variante,
  periodoLabel,
  children,
}: {
  monitorias: Monitoria[]
  variante: Variante
  periodoLabel: string
  children: ReactNode
}) {
  const { mostrarTodas } = useNotasGlobais()
  const cfg = CONFIG[variante]

  const lista = useMemo<ResumoOperador[]>(() => {
    const base = resumoOperadores(monitorias)
    if (variante === "criticas") {
      return base.filter((o) => o.criticos > 0).sort((a, b) => b.criticos - a.criticos)
    }
    if (variante === "inconformidades") {
      return base.filter((o) => o.inconforme > 0).sort((a, b) => b.inconforme - a.inconforme)
    }
    return base
  }, [monitorias, variante])

  return (
    <Dialog>
      <DialogTrigger className="group/kpi block w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {children}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{cfg.titulo}</DialogTitle>
          <DialogDescription>
            {cfg.descricao} <span className="text-foreground">{periodoLabel}</span>
          </DialogDescription>
        </DialogHeader>

        {lista.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{cfg.vazio}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {lista.map((o) => (
              <li
                key={o.operador}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{o.operador}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {o.carteira} · {o.volume} {o.volume === 1 ? "monitoria" : "monitorias"}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {/* Nota média */}
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Nota média
                    </span>
                    {mostrarTodas ? (
                      <span className={cn("text-sm font-semibold tabular-nums", notaColorClass(o.nota))}>
                        {o.nota}{" "}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          {faixaNota(o.nota)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">•••</span>
                    )}
                  </div>

                  {/* Conformes */}
                  <Badge variant="secondary" className="gap-1 tabular-nums">
                    <CheckCircle2 className="size-3 text-chart-5" />
                    {o.conforme}
                  </Badge>

                  {/* Inconformes */}
                  <Badge variant="secondary" className="gap-1 tabular-nums">
                    <XCircle className="size-3 text-destructive" />
                    {o.inconforme}
                  </Badge>

                  {/* Notas críticas (somente quando relevante) */}
                  {(variante === "criticas" || o.criticos > 0) && (
                    <Badge variant="secondary" className="gap-1 tabular-nums">
                      <AlertOctagon className="size-3 text-destructive" />
                      {o.criticos}
                    </Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
