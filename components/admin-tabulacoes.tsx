"use client"

import { useMemo, useState } from "react"
import { ArrowRight, Check, Layers3, Pencil, Plus, Trash2, Unlink } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { useQualityData } from "@/lib/use-quality-data"
import { store } from "@/lib/store"

export function AdminTabulacoes() {
  const { carteiras, tabulacoes, vinculos, checklists, ready } = useQualityData()
  const [nome, setNome] = useState("")
  const [carteira, setCarteira] = useState("")
  const [checklistId, setChecklistId] = useState("")
  const [selecionadas, setSelecionadas] = useState<string[]>([])
  const [editando, setEditando] = useState<string | null>(null)
  const carteirasAtivas = useMemo(() => carteiras.filter((item) => item.ativa), [carteiras])
  const checklistsDaCarteira = useMemo(() => checklists.filter((item) => item.carteira === carteira), [checklists, carteira])
  const vinculadas = useMemo(() => new Set(vinculos.filter((item) => item.carteira === carteira && item.checklistId === checklistId).map((item) => item.tabulacao)), [vinculos, carteira, checklistId])

  function salvarTabulacao() {
    const valor = nome.trim()
    if (!valor) return toast.error("Informe o nome da tabulação.")
    if (editando) {
      if (!store.renameTabulacao(editando, valor)) return toast.error("Essa tabulação já existe.")
      setEditando(null); setNome(""); return toast.success("Tabulação atualizada.")
    }
    if (!store.addTabulacao(valor)) return toast.error("Essa tabulação já existe.")
    setNome(""); toast.success("Tabulação adicionada.")
  }

  function vincularSelecionadas() {
    if (!carteira || !checklistId) return toast.error("Selecione carteira e checklist.")
    const novas = selecionadas.filter((item) => !vinculadas.has(item))
    if (!novas.length) return toast.error("Selecione pelo menos uma tabulação nova.")
    novas.forEach((tabulacao) => store.addVinculo({ id: store.uid(), carteira, checklistId, tabulacao, criadoEm: new Date().toISOString() }))
    setSelecionadas([])
    toast.success(`${novas.length} ${novas.length === 1 ? "tabulação vinculada" : "tabulações vinculadas"}.`)
  }

  function alternarTabulacao(item: string) {
    setSelecionadas((atual) => atual.includes(item) ? atual.filter((valor) => valor !== item) : [...atual, item])
  }

  if (!ready) return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>

  return (
    <main className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader title="Tabulações" description="Cadastre opções e configure rapidamente em quais carteiras elas estarão disponíveis." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-5"><div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Layers3 className="size-5" /></div><div><p className="text-2xl font-semibold">{tabulacoes.length}</p><p className="text-xs text-muted-foreground">Tabulações cadastradas</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-5"><div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500"><Check className="size-5" /></div><div><p className="text-2xl font-semibold">{vinculos.length}</p><p className="text-xs text-muted-foreground">Vínculos configurados</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-5"><div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500"><ArrowRight className="size-5" /></div><div><p className="text-2xl font-semibold">{carteirasAtivas.length}</p><p className="text-xs text-muted-foreground">Carteiras disponíveis</p></div></CardContent></Card>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="min-w-0">
          <CardHeader><CardTitle>Vincular tabulações</CardTitle><CardDescription>Escolha uma carteira, um checklist e marque uma ou várias tabulações de uma vez.</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid gap-4 md:grid-cols-2"><div className="flex flex-col gap-2"><Label>Carteira</Label><Select value={carteira} onValueChange={(value) => { setCarteira(value ?? ""); setChecklistId(""); setSelecionadas([]) }}><SelectTrigger><SelectValue placeholder="Selecione uma carteira" /></SelectTrigger><SelectContent>{carteirasAtivas.map((item) => <SelectItem key={item.id} value={item.nome}>{item.nome}</SelectItem>)}</SelectContent></Select></div><div className="flex flex-col gap-2"><Label>Checklist</Label><Select value={checklistId} onValueChange={(value) => { setChecklistId(value ?? ""); setSelecionadas([]) }} disabled={!carteira}><SelectTrigger><SelectValue placeholder={carteira ? "Selecione um checklist" : "Escolha a carteira primeiro"} /></SelectTrigger><SelectContent>{checklistsDaCarteira.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="rounded-xl border border-border bg-muted/20 p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="font-medium">Tabulações disponíveis</p><p className="text-xs text-muted-foreground">Marque várias opções para vincular em uma única ação.</p></div><Badge variant="secondary">{selecionadas.length} selecionadas</Badge></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{tabulacoes.map((item) => { const disabled = vinculadas.has(item); const checked = selecionadas.includes(item) || disabled; return <label key={item} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-colors ${disabled ? "cursor-not-allowed border-emerald-500/30 bg-emerald-500/5 text-muted-foreground" : checked ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/50"}`}><input type="checkbox" checked={checked} disabled={disabled || !checklistId} onChange={() => alternarTabulacao(item)} className="size-4 accent-primary" /><span className="min-w-0 flex-1 truncate">{item}</span>{disabled && <Check className="size-4 shrink-0 text-emerald-500" />}</label> })}</div>{!checklistId && <p className="mt-3 text-center text-xs text-muted-foreground">Selecione a carteira e o checklist para liberar as tabulações.</p>}</div>
            <div className="flex justify-end"><Button onClick={vincularSelecionadas} disabled={!carteira || !checklistId || !selecionadas.length} className="gap-2"><ArrowRight className="size-4" />Vincular selecionadas</Button></div>
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-6"><CardHeader><CardTitle>{editando ? "Editar tabulação" : "Nova tabulação"}</CardTitle><CardDescription>{editando ? "Atualize o nome e salve." : "Cadastre uma opção disponível para a operação."}</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><div className="flex flex-col gap-2"><Label htmlFor="tab-nome">Nome da tabulação</Label><Input id="tab-nome" value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Ex.: Venda concluída" /></div><div className="flex flex-wrap gap-2"><Button onClick={salvarTabulacao} className="gap-2"><Plus className="size-4" />{editando ? "Salvar" : "Adicionar"}</Button>{editando && <Button variant="outline" onClick={() => { setEditando(null); setNome("") }}>Cancelar</Button>}</div></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Tabulações cadastradas <span className="text-sm font-normal text-muted-foreground">({tabulacoes.length})</span></CardTitle><CardDescription>Edite ou exclua opções existentes.</CardDescription></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{tabulacoes.map((item) => <div key={item} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-3 py-3"><span className="truncate text-sm font-medium">{item}</span><div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" onClick={() => { setEditando(item); setNome(item) }} aria-label={`Editar ${item}`}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { store.removeTabulacao(item); toast.success("Tabulação excluída.") }} aria-label={`Excluir ${item}`}><Trash2 className="size-4" /></Button></div></div>)}</CardContent></Card>

      <Card><CardHeader><CardTitle>Vínculos por carteira</CardTitle><CardDescription>Confira as tabulações disponíveis em cada carteira.</CardDescription></CardHeader><CardContent className="grid gap-4 lg:grid-cols-2">{carteirasAtivas.map((item) => { const items = vinculos.filter((vinculo) => vinculo.carteira === item.nome); return <div key={item.id} className="rounded-xl border border-border bg-muted/10 p-4"><div className="mb-3 flex items-start justify-between gap-3"><div><p className="font-semibold">{item.nome}</p><p className="text-xs text-muted-foreground">{items.length ? "Tabulações disponíveis" : "Ainda sem tabulações vinculadas"}</p></div><Badge variant={items.length ? "secondary" : "outline"}>{items.length} vínculos</Badge></div>{items.length ? <div className="flex flex-col gap-2">{items.map((vinculo) => <div key={vinculo.id} className="flex items-center justify-between rounded-lg border border-border/70 bg-background px-3 py-2"><span className="text-sm">{vinculo.tabulacao}</span><Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => { store.removeVinculo(vinculo.id); toast.success("Vínculo removido.") }} aria-label={`Remover vínculo de ${vinculo.tabulacao}`}><Unlink className="size-4" /></Button></div>)}</div> : <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">Nenhum vínculo configurado.</p>}</div> })}</CardContent></Card>
    </main>
  )
}
