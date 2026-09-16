"use client"

import { useEffect, useMemo, useRef } from "react"
import { useAuth } from "@/lib/auth"
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

type PeriodoFiltro = { inicio: string; fim: string; onInicioChange: (value: string) => void; onFimChange: (value: string) => void; onTudo: () => void }

export function FiltrosAnaliticos({ value, onChange, periodo }: { value: FiltrosAnaliticosState; onChange: (value: FiltrosAnaliticosState) => void; periodo?: PeriodoFiltro }) {
  const { checklists, vinculos, monitorias } = useQualityData()
  const { carteira: carteiraSelecionada } = useAuth()
  const ultimaCarteiraSelecionada = useRef<string | null>(null)
  const checklistSelecionado = checklists.find((checklist) => checklist.id === value.checklistId)

  useEffect(() => {
    if (!carteiraSelecionada || carteiraSelecionada === ultimaCarteiraSelecionada.current) return
    const carteiraAnterior = ultimaCarteiraSelecionada.current
    ultimaCarteiraSelecionada.current = carteiraSelecionada
    if (value.carteira === "todas" || value.carteira === carteiraAnterior) {
      onChange({ ...value, carteira: carteiraSelecionada })
    }
  }, [carteiraSelecionada, onChange, value])

  useEffect(() => {
    if (value.checklistId !== "todos" && !checklistSelecionado) {
      onChange({ ...value, checklistId: "todos", tabulacao: "todas" })
    }
  }, [checklistSelecionado, onChange, value])

  const tabulacoes = useMemo(() => {
    const monitoriasDoChecklist = value.checklistId === "todos"
      ? monitorias
      : monitorias.filter((monitoria) => monitoria.checklistId === value.checklistId)
    const vinculadas = value.checklistId === "todos"
      ? vinculos
      : vinculos.filter((vinculo) => vinculo.checklistId === value.checklistId)
    const nomesMonitorias = monitoriasDoChecklist.map((monitoria) => monitoria.tabulacao)
    const nomesVinculos = vinculadas.map((vinculo) => vinculo.tabulacao)
    return Array.from(new Set([...nomesMonitorias, ...nomesVinculos].filter(Boolean))).sort()
  }, [monitorias, value.checklistId, vinculos])

  function update(patch: Partial<FiltrosAnaliticosState>) {
    const next = { ...value, ...patch }
    if (patch.checklistId && patch.checklistId !== value.checklistId) next.tabulacao = "todas"
    onChange(next)
  }

  return <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-card/80 to-card p-4 shadow-sm">
    <div className="flex flex-col gap-1.5"><Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Checklist</Label><Select value={value.checklistId} onValueChange={(checklistId) => update({ checklistId: checklistId ?? "todos" })}><SelectTrigger className="w-56"><SelectValue placeholder="Todos os checklists">{value.checklistId === "todos" ? "Todos os checklists" : checklistSelecionado?.nome ?? "Todos os checklists"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="todos">Todos os checklists</SelectItem>{checklists.map((checklist) => <SelectItem key={checklist.id} value={checklist.id}>{checklist.nome}</SelectItem>)}</SelectContent></Select></div>
    <div className="flex flex-col gap-1.5"><Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tabulação</Label><Select value={value.tabulacao} onValueChange={(tabulacao) => update({ tabulacao: tabulacao ?? "todas" })}><SelectTrigger className="w-48"><SelectValue placeholder="Todas as tabulações" /></SelectTrigger><SelectContent><SelectItem value="todas">Todas as tabulações</SelectItem>{tabulacoes.map((tabulacao) => <SelectItem key={tabulacao} value={tabulacao}>{tabulacao}</SelectItem>)}</SelectContent></Select></div>
    {periodo && <>
      <div className="flex flex-col gap-1.5"><Label htmlFor="filtro-data-inicio" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">De</Label><input id="filtro-data-inicio" type="date" value={periodo.inicio} max={periodo.fim || undefined} onChange={(event) => periodo.onInicioChange(event.target.value)} className="h-10 w-40 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
      <div className="flex flex-col gap-1.5"><Label htmlFor="filtro-data-fim" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Até</Label><input id="filtro-data-fim" type="date" value={periodo.fim} min={periodo.inicio || undefined} onChange={(event) => periodo.onFimChange(event.target.value)} className="h-10 w-40 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
      <div className="flex flex-col gap-1.5"><span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Atalhos</span><button type="button" onClick={periodo.onTudo} className="h-10 rounded-md border border-transparent px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/10">Tudo</button></div>
    </>}
  </div>
}
