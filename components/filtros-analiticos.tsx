"use client"

import { useEffect, useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQualityData } from "@/lib/use-quality-data"
import type { Monitoria } from "@/lib/types"

export type FiltrosAnaliticosState = {
  carteira: string
  checklistId: string
  tabulacao: string
}

export function filtrarMonitorias(monitorias: Monitoria[], filtros: FiltrosAnaliticosState) {
  return monitorias.filter((monitoria) => {
    if (filtros.carteira !== "todas" && monitoria.carteira !== filtros.carteira) return false
    if (filtros.checklistId !== "todos" && monitoria.checklistId !== filtros.checklistId) return false
    if (filtros.tabulacao !== "todas" && monitoria.tabulacao !== filtros.tabulacao) return false
    return true
  })
}

export function FiltrosAnaliticos({ value, onChange }: { value: FiltrosAnaliticosState; onChange: (value: FiltrosAnaliticosState) => void }) {
  const { carteiras, checklists, vinculos, monitorias } = useQualityData()
  const checklistSelecionado = checklists.find((checklist) => checklist.id === value.checklistId)

  useEffect(() => {
    if (value.checklistId !== "todos" && !checklistSelecionado) {
      onChange({ ...value, checklistId: "todos", tabulacao: "todas" })
    }
  }, [checklistSelecionado, onChange, value])

  const tabulacoes = useMemo(() => {
    const vinculadas = value.checklistId === "todos" ? vinculos : vinculos.filter((vinculo) => vinculo.checklistId === value.checklistId)
    const nomes = vinculadas.map((vinculo) => vinculo.tabulacao)
    return Array.from(new Set((nomes.length ? nomes : monitorias.map((monitoria) => monitoria.tabulacao)).filter(Boolean))).sort()
  }, [monitorias, value.checklistId, vinculos])

  function update(patch: Partial<FiltrosAnaliticosState>) {
    const next = { ...value, ...patch }
    if (patch.checklistId && patch.checklistId !== value.checklistId) next.tabulacao = "todas"
    onChange(next)
  }

  return <div className="flex flex-wrap items-end gap-4">
    <div className="flex flex-col gap-1.5"><Label className="text-xs text-muted-foreground">Checklist</Label><Select value={value.checklistId} onValueChange={(checklistId) => update({ checklistId: checklistId ?? "todos" })}><SelectTrigger className="w-56"><SelectValue placeholder="Todos os checklists">{value.checklistId === "todos" ? "Todos os checklists" : checklistSelecionado?.nome ?? "Todos os checklists"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="todos">Todos os checklists</SelectItem>{checklists.map((checklist) => <SelectItem key={checklist.id} value={checklist.id}>{checklist.nome}</SelectItem>)}</SelectContent></Select></div>
    <div className="flex flex-col gap-1.5"><Label className="text-xs text-muted-foreground">Tabulação</Label><Select value={value.tabulacao} onValueChange={(tabulacao) => update({ tabulacao: tabulacao ?? "todas" })}><SelectTrigger className="w-48"><SelectValue placeholder="Todas as tabulações" /></SelectTrigger><SelectContent><SelectItem value="todas">Todas as tabulações</SelectItem>{tabulacoes.map((tabulacao) => <SelectItem key={tabulacao} value={tabulacao}>{tabulacao}</SelectItem>)}</SelectContent></Select></div>
    <div className="flex flex-col gap-1.5"><Label className="text-xs text-muted-foreground">Carteira</Label><Select value={value.carteira} onValueChange={(carteira) => update({ carteira: carteira ?? "todas" })}><SelectTrigger className="w-48"><SelectValue placeholder="Todas as carteiras" /></SelectTrigger><SelectContent><SelectItem value="todas">Todas as carteiras</SelectItem>{carteiras.map((carteira) => <SelectItem key={carteira.id} value={carteira.nome}>{carteira.nome}</SelectItem>)}</SelectContent></Select></div>
  </div>
}
