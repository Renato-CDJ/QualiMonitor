"use client"

import { useState } from "react"
import { Plus, Pencil, Power, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/page-header"
import { useQualityData } from "@/lib/use-quality-data"
import type { Carteira } from "@/lib/types"
import { store } from "@/lib/store"

export function AdminCarteiras() {
  const { carteiras, ready } = useQualityData()
  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [editando, setEditando] = useState<string | null>(null)

  function salvar() {
    const valor = nome.trim()
    if (!valor) return toast.error("Informe o nome da carteira.")
    if (carteiras.some((c) => c.nome.toLowerCase() === valor.toLowerCase() && c.id !== editando)) {
      return toast.error("Já existe uma carteira com esse nome.")
    }
    if (editando) {
      store.setCarteiras(carteiras.map((c) => c.id === editando ? { ...c, nome: valor, descricao: descricao.trim() } : c))
    } else {
      const nova: Carteira = { id: store.uid(), nome: valor, descricao: descricao.trim(), ativa: true, criadoEm: new Date().toISOString() }
      store.addCarteira(nova)
    }
    setNome(""); setDescricao(""); setEditando(null)
    toast.success(editando ? "Carteira atualizada." : "Carteira criada.")
  }

  function editar(carteira: Carteira) {
    setEditando(carteira.id); setNome(carteira.nome); setDescricao(carteira.descricao ?? "")
  }

  if (!ready) return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  return <main className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
    <PageHeader title="Carteiras" description="Crie e gerencie as carteiras disponíveis para os usuários da plataforma." />
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader><h2 className="font-semibold">{editando ? "Editar carteira" : "Nova carteira"}</h2></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5"><Label htmlFor="carteira-nome">Nome</Label><Input id="carteira-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Carteira Premium" /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="carteira-descricao">Descrição</Label><Input id="carteira-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Opcional" /></div>
          <div className="flex gap-2"><Button onClick={salvar} className="gap-2"><Plus className="size-4" />{editando ? "Salvar" : "Criar carteira"}</Button>{editando && <Button variant="ghost" onClick={() => { setEditando(null); setNome(""); setDescricao("") }}>Cancelar</Button>}</div>
        </CardContent>
      </Card>
      <Card><CardHeader><h2 className="font-semibold">Carteiras cadastradas <span className="text-sm font-normal text-muted-foreground">({carteiras.length})</span></h2></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">
        {carteiras.map((c) => <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-4"><div><p className="font-medium">{c.nome}</p><p className="text-sm text-muted-foreground">{c.descricao || "Sem descrição"}</p><Badge variant={c.ativa ? "secondary" : "outline"} className="mt-2">{c.ativa ? "Ativa" : "Inativa"}</Badge></div><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => editar(c)} aria-label={`Editar ${c.nome}`}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" onClick={() => store.setCarteiras(carteiras.map((item) => item.id === c.id ? { ...item, ativa: !item.ativa } : item))} aria-label={`Alternar ${c.nome}`}><Power className="size-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => store.setCarteiras(carteiras.filter((item) => item.id !== c.id))} aria-label={`Excluir ${c.nome}`}><Trash2 className="size-4" /></Button></div></div>)}
      </CardContent></Card>
    </div>
  </main>
}
