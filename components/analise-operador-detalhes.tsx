"use client"

import { useMemo, useState } from "react"
import { ChevronRight, Layers } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CardTitleHint } from "@/components/card-title-hint"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { analiseCategoriaPorOperador } from "@/lib/aggregations"
import type { Checklist, Monitoria } from "@/lib/types"
import { cn } from "@/lib/utils"

function pctTone(pct: number) {
  if (pct >= 90) return "text-chart-5"
  if (pct >= 75) return "text-chart-1"
  if (pct >= 60) return "text-chart-3"
  return "text-destructive"
}

export function AnalisOperadorDetalhes({
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

  const operadores = useMemo(
    () =>
      Array.from(new Set(dados.map((d) => d.operadorId)))
        .map((id) => {
          const item = dados.find((d) => d.operadorId === id)
          return { id, nome: item?.operador || id }
        })
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [dados],
  )

  const [operadorSelecionado, setOperadorSelecionado] = useState<string>(operadores[0]?.id || "")
  const [abertos, setAbertos] = useState<Set<string>>(new Set())

  const operadorAtivo = operadores.some((operador) => operador.id === operadorSelecionado)
    ? operadorSelecionado
    : operadores[0]?.id || ""

  const dadosOperador = useMemo(
    () => dados.filter((d) => d.operadorId === operadorAtivo),
    [dados, operadorAtivo],
  )

  function toggle(bloco: string) {
    setAbertos((prev) => {
      const next = new Set(prev)
      if (next.has(bloco)) next.delete(bloco)
      else next.add(bloco)
      return next
    })
  }

  // Agrupa por bloco
  const blocoItens = new Map<string, typeof dadosOperador>()
  for (const item of dadosOperador) {
    const key = item.bloco
    if (!blocoItens.has(key)) blocoItens.set(key, [])
    blocoItens.get(key)!.push(item)
  }

  const blocos = Array.from(blocoItens.entries())
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
        itens: itens.sort((a, b) => a.texto.localeCompare(b.texto, "pt-BR")),
      }
    })
    .sort((a, b) => a.bloco.localeCompare(b.bloco, "pt-BR"))

  const todosAbertos = blocos.length > 0 && abertos.size === blocos.length

  function toggleTodos() {
    setAbertos(todosAbertos ? new Set() : new Set(blocos.map((b) => b.bloco)))
  }

  const operadorNome = operadores.find((o) => o.id === operadorAtivo)?.nome || "—"

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <CardTitleHint
            icon={<Layers className="size-4 text-muted-foreground" />}
            title="Resultado do Operador por Item"
            description="Desempenho detalhado de um operador específico em cada item do checklist."
          />
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="operador-filtro" className="text-xs text-muted-foreground">
                Operador
              </Label>
              <Select value={operadorAtivo} onValueChange={setOperadorSelecionado}>
                <SelectTrigger id="operador-filtro" className="w-56">
                  <SelectValue>{operadorNome}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {operadores.map((op) => (
                    <SelectItem key={op.id} value={op.id}>
                      {op.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
        </div>
      </CardHeader>
      <CardContent>
        {blocos.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Sem apontamentos para o operador {operadorNome} nos filtros selecionados.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {/* Cabeçalho */}
            <div className="grid grid-cols-[1fr_80px_104px_104px] items-center gap-2 border-b border-border bg-secondary/50 px-3 py-2 text-xs font-medium text-muted-foreground">
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
                      "grid w-full grid-cols-[1fr_80px_104px_104px] items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-secondary/40",
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

                  {/* Itens do bloco */}
                  {aberto &&
                    bloco.itens.map((item) => (
                      <div
                        key={item.itemId}
                        className="grid grid-cols-[1fr_80px_104px_104px] items-center gap-2 border-t border-border/30 bg-background px-3 py-1.5 text-sm leading-5"
                      >
                        <span className="flex items-center gap-1.5 pl-6 text-muted-foreground">
                          <span className="truncate">{item.texto}</span>
                        </span>
                        <span className="text-right tabular-nums text-muted-foreground">
                          {item.qtd}
                        </span>
                        <span className={cn("text-right tabular-nums", pctTone(item.pctConforme))}>
                          {item.pctConforme}%
                        </span>
                        <span
                          className={cn(
                            "text-right tabular-nums",
                            item.pctInconforme > 0 ? "text-destructive" : "text-muted-foreground",
                          )}
                        >
                          {item.pctInconforme > 0 ? `${item.pctInconforme}%` : "—"}
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
