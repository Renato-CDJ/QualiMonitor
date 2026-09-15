"use client"

import { useMemo, useState } from "react"
import { CalendarDays, CheckCircle2, ChevronRight, ClipboardList, Layers3, Search, ShieldCheck, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useQualityData } from "@/lib/use-quality-data"
import { normalizarCarteira } from "@/lib/utils"
import type { Checklist } from "@/lib/types"

const SEM_BLOCO = "Sem bloco"

function formatarData(data: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(data))
}

export function AdminVisualizarChecklists() {
  const { checklists, operadores, ready } = useQualityData()
  const [busca, setBusca] = useState("")
  const [carteira, setCarteira] = useState("todas")
  const [selecionado, setSelecionado] = useState<Checklist | null>(null)

  const carteiras = useMemo(() => Array.from(new Set(checklists.map((item) => item.carteira))).sort(), [checklists])
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase()
    return checklists.filter((item) => {
      const correspondeBusca = !termo || `${item.nome} ${item.carteira}`.toLocaleLowerCase().includes(termo)
      return correspondeBusca && (carteira === "todas" || item.carteira === carteira)
    })
  }, [busca, carteira, checklists])
  const totalItens = filtrados.reduce((total, item) => total + item.itens.length, 0)
  const totalCriticos = filtrados.reduce((total, item) => total + item.itens.filter((subitem) => subitem.critico).length, 0)

  if (!ready) return <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">Carregando checklists...</div>

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <Summary icon={ClipboardList} label="Checklists exibidos" value={filtrados.length} />
        <Summary icon={Layers3} label="Itens avaliáveis" value={totalItens} />
        <Summary icon={ShieldCheck} label="Itens críticos" value={totalCriticos} accent />
      </section>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-secondary/20 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-lg tracking-tight">Biblioteca de checklists</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Consulte a estrutura dos checklists cadastrados sem alterar os dados.</p>
            </div>
            <Badge variant="outline" className="w-fit gap-1.5 px-3 py-1"><CheckCircle2 className="size-3.5 text-emerald-500" />Somente visualização</Badge>
          </div>
          <div className="flex flex-col gap-3 pt-2 md:flex-row">
            <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar por nome ou carteira..." className="pl-9" /></div>
            <select value={carteira} onChange={(event) => setCarteira(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground md:w-56"><option value="todas">Todas as carteiras</option>{carteiras.map((item) => <option key={item} value={item}>{item}</option>)}</select>
            <Button type="button" variant="outline" onClick={() => { setBusca(""); setCarteira("todas") }}>Exibir todos</Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {filtrados.length === 0 ? <div className="rounded-xl border border-dashed p-12 text-center"><ClipboardList className="mx-auto size-8 text-muted-foreground/50" /><p className="mt-3 font-medium">Nenhum checklist encontrado</p><p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros para visualizar outros registros.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtrados.map((item) => <ChecklistCard key={item.id} checklist={item} operadores={operadores.filter((op) => normalizarCarteira(op.carteira) === normalizarCarteira(item.carteira)).length} onOpen={() => setSelecionado(item)} />)}</div>}
        </CardContent>
      </Card>

      <ChecklistReadOnly checklist={selecionado} onClose={() => setSelecionado(null)} />
    </div>
  )
}

function Summary({ icon: Icon, label, value, accent = false }: { icon: typeof ClipboardList; label: string; value: number; accent?: boolean }) {
  return <Card className="border-border/70 bg-card/70 shadow-sm"><CardContent className="flex items-center gap-3 p-4"><span className={`flex size-10 items-center justify-center rounded-xl ${accent ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"}`}><Icon className="size-5" /></span><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-0.5 text-2xl font-semibold tracking-tight">{value}</p></div></CardContent></Card>
}

function ChecklistCard({ checklist, operadores, onOpen }: { checklist: Checklist; operadores: number; onOpen: () => void }) {
  const blocos = new Set(checklist.itens.map((item) => item.bloco?.trim() || SEM_BLOCO)).size
  return <button type="button" onClick={onOpen} className="group flex min-h-52 flex-col items-start rounded-xl border border-border/70 bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"><div className="flex w-full items-start justify-between gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ClipboardList className="size-5" /></span><ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></div><p className="mt-5 line-clamp-2 font-semibold tracking-tight">{checklist.nome}</p><p className="mt-1 text-sm text-muted-foreground">{checklist.carteira}</p><div className="mt-auto flex w-full flex-wrap gap-2 pt-5 text-xs text-muted-foreground"><span className="rounded-md bg-secondary px-2 py-1">{checklist.itens.length} itens</span><span className="rounded-md bg-secondary px-2 py-1">{blocos} {blocos === 1 ? "bloco" : "blocos"}</span><span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1"><Users className="size-3" />{operadores}</span></div></button>
}

function ChecklistReadOnly({ checklist, onClose }: { checklist: Checklist | null; onClose: () => void }) {
  const grupos = useMemo(() => { if (!checklist) return []; const mapa = new Map<string, typeof checklist.itens>(); for (const item of checklist.itens) { const grupo = item.bloco?.trim() || SEM_BLOCO; mapa.set(grupo, [...(mapa.get(grupo) ?? []), item]) } return Array.from(mapa.entries()) }, [checklist])
  const totalCriticos = checklist?.itens.filter((item) => item.critico).length ?? 0
  const totalPeso = checklist?.itens.reduce((total, item) => total + item.peso, 0) ?? 0

  return (
    <Dialog open={Boolean(checklist)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-[70vw] max-w-[70vw] min-w-[860px] overflow-hidden border-border/70 bg-background/95 p-0 shadow-2xl backdrop-blur-xl">
        <div className="max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-border/60 bg-gradient-to-br from-primary/10 via-background to-background px-6 py-6 pr-14">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-sm"><ClipboardList className="size-6" /></div>
              <div className="min-w-0">
                <DialogTitle className="text-xl tracking-tight">{checklist?.nome}</DialogTitle>
                <DialogDescription className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"><Badge variant="secondary">{checklist?.carteira}</Badge><span className="text-border">•</span><span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" />Atualizado em {checklist && formatarData(checklist.atualizadoEm)}</span></DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-6 p-6">
            <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-border/60 bg-card/60 p-4"><p className="text-xs font-medium text-muted-foreground">Itens avaliáveis</p><p className="mt-1 text-2xl font-semibold tracking-tight">{checklist?.itens.length ?? 0}</p></div><div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"><p className="text-xs font-medium text-muted-foreground">Itens críticos</p><p className="mt-1 text-2xl font-semibold tracking-tight text-amber-500">{totalCriticos}</p></div><div className="rounded-xl border border-border/60 bg-card/60 p-4"><p className="text-xs font-medium text-muted-foreground">Peso total</p><p className="mt-1 text-2xl font-semibold tracking-tight">{totalPeso}</p></div></div>
            <div className="flex flex-col gap-6">{grupos.map(([grupo, itens], grupoIndex) => <section key={grupo}><div className="mb-3 flex items-center gap-3"><span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">{String(grupoIndex + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><h3 className="font-semibold tracking-tight">{grupo}</h3><p className="text-xs text-muted-foreground">Itens deste bloco de avaliação</p></div><Badge variant="secondary" className="shrink-0">{itens.length} {itens.length === 1 ? "item" : "itens"}</Badge></div><div className="overflow-hidden rounded-xl border border-border/60 bg-card/30">{itens.map((item, index) => <div key={item.id} className="flex gap-3 border-b border-border/50 p-4 last:border-0 transition-colors hover:bg-secondary/20"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><p className="font-medium leading-5">{item.texto}</p>{item.critico && <Badge variant="destructive" className="shrink-0">Crítico</Badge>}</div>{item.descricao && <p className="mt-1.5 max-w-2xl text-sm leading-5 text-muted-foreground">{item.descricao}</p>}<div className="mt-3"><Badge variant="outline" className="bg-background/60">Peso {item.peso}</Badge></div></div></div>)}</div></section>)}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
