"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  GripVertical,
  FolderPlus,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useQualityData } from "@/lib/use-quality-data"
import { store } from "@/lib/store"
import type { Checklist, ChecklistItem } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ChecklistEditor() {
  const { checklists, ready } = useQualityData()
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
  const [rascunho, setRascunho] = useState<Checklist | null>(null)

  // nova carteira dialog
  const [novaCarteira, setNovaCarteira] = useState("")
  const [novoNome, setNovoNome] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (!ready) return
    if (!selecionadoId && checklists.length) {
      setSelecionadoId(checklists[0].id)
    }
  }, [ready, checklists, selecionadoId])

  useEffect(() => {
    const found = checklists.find((c) => c.id === selecionadoId)
    setRascunho(found ? structuredClone(found) : null)
  }, [selecionadoId, checklists])

  const pesoTotal = useMemo(
    () => rascunho?.itens.reduce((s, i) => s + (i.peso || 0), 0) ?? 0,
    [rascunho],
  )

  function atualizarItem(id: string, patch: Partial<ChecklistItem>) {
    setRascunho((prev) =>
      prev
        ? { ...prev, itens: prev.itens.map((i) => (i.id === id ? { ...i, ...patch } : i)) }
        : prev,
    )
  }

  function removerItem(id: string) {
    setRascunho((prev) =>
      prev ? { ...prev, itens: prev.itens.filter((i) => i.id !== id) } : prev,
    )
  }

  function adicionarItem() {
    setRascunho((prev) =>
      prev
        ? {
            ...prev,
            itens: [
              ...prev.itens,
              { id: store.uid(), texto: "Novo item de checklist", peso: 5, critico: false },
            ],
          }
        : prev,
    )
  }

  function salvar() {
    if (!rascunho) return
    if (!rascunho.itens.length) return toast.error("Adicione ao menos um item.")
    const atualizado: Checklist = { ...rascunho, atualizadoEm: new Date().toISOString() }
    const todos = store.getChecklists()
    store.setChecklists(todos.map((c) => (c.id === atualizado.id ? atualizado : c)))
    toast.success("Checklist salvo com sucesso.")
  }

  function criarCarteira() {
    if (!novaCarteira.trim()) return toast.error("Informe o nome da carteira.")
    const novo: Checklist = {
      id: store.uid(),
      carteira: novaCarteira.trim(),
      nome: novoNome.trim() || "Novo Checklist",
      atualizadoEm: new Date().toISOString(),
      itens: [{ id: store.uid(), texto: "Novo item", peso: 5, critico: false }],
    }
    store.setChecklists([...store.getChecklists(), novo])
    setSelecionadoId(novo.id)
    setNovaCarteira("")
    setNovoNome("")
    setDialogOpen(false)
    toast.success("Carteira criada.")
  }

  function excluirChecklist() {
    if (!rascunho) return
    const restantes = store.getChecklists().filter((c) => c.id !== rascunho.id)
    store.setChecklists(restantes)
    setSelecionadoId(restantes[0]?.id ?? null)
    toast.success("Checklist excluído.")
  }

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Lista de carteiras */}
      <aside className="flex flex-col gap-3">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            className={buttonVariants({
              variant: "outline",
              className: "w-full justify-start gap-2",
            })}
          >
            <FolderPlus className="size-4" /> Nova carteira / checklist
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova carteira</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label>Nome da carteira</Label>
                <Input
                  value={novaCarteira}
                  onChange={(e) => setNovaCarteira(e.target.value)}
                  placeholder="Ex: Carteira W"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Nome do checklist</Label>
                <Input
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Checklist de Vendas"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={criarCarteira} className="gap-2">
                <Plus className="size-4" /> Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col gap-1">
          {checklists.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelecionadoId(c.id)}
              className={cn(
                "flex flex-col items-start rounded-md border border-transparent px-3 py-2 text-left transition-colors",
                selecionadoId === c.id
                  ? "border-border bg-secondary"
                  : "hover:bg-secondary/50",
              )}
            >
              <span className="text-sm font-medium">{c.carteira}</span>
              <span className="text-xs text-muted-foreground">{c.nome}</span>
              <span className="mt-1 text-[11px] text-muted-foreground">
                {c.itens.length} itens
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Editor */}
      {rascunho ? (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuração do Checklist</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Carteira</Label>
                <Input
                  value={rascunho.carteira}
                  onChange={(e) =>
                    setRascunho({ ...rascunho, carteira: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Nome do checklist</Label>
                <Input
                  value={rascunho.nome}
                  onChange={(e) => setRascunho({ ...rascunho, nome: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-base">Itens e Pesos</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Defina os pesos (pontos descontados quando inconforme) e marque itens
                  críticos que zeram a nota.
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  pesoTotal > 100 && "border-destructive/40 bg-destructive/10 text-destructive",
                )}
              >
                Peso total: {pesoTotal} pts
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {rascunho.itens.map((it, idx) => (
                <div
                  key={it.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/30 p-3 md:flex-row md:items-center"
                >
                  <span className="hidden text-muted-foreground md:block">
                    <GripVertical className="size-4" />
                  </span>
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-xs text-muted-foreground">
                    {idx + 1}
                  </span>
                  <Input
                    value={it.texto}
                    onChange={(e) => atualizarItem(it.id, { texto: e.target.value })}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-muted-foreground">Peso</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={it.peso}
                        onChange={(e) =>
                          atualizarItem(it.id, { peso: Number(e.target.value) || 0 })
                        }
                        className="w-20"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={!!it.critico}
                        onCheckedChange={(v) => atualizarItem(it.id, { critico: v })}
                      />
                      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <AlertTriangle className="size-3" /> Crítico
                      </Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removerItem(it.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={adicionarItem} className="mt-2 gap-2">
                <Plus className="size-4" /> Adicionar item
              </Button>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={excluirChecklist}
              className="gap-2 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" /> Excluir checklist
            </Button>
            <Button onClick={salvar} className="gap-2">
              <Save className="size-4" /> Salvar alterações
            </Button>
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-sm font-medium">Nenhum checklist selecionado</p>
            <p className="text-xs text-muted-foreground">
              Crie uma nova carteira para começar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
