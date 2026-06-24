"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Plus, Trash2, Save, AlertTriangle, FolderPlus } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

  const SEM_BLOCO = "Sem bloco"

  // Agrupa os itens por bloco preservando a ordem de aparição
  const grupos = useMemo(() => {
    if (!rascunho) return [] as { bloco: string; itens: ChecklistItem[] }[]
    const ordem: string[] = []
    const mapa = new Map<string, ChecklistItem[]>()
    for (const it of rascunho.itens) {
      const b = it.bloco?.trim() || SEM_BLOCO
      if (!mapa.has(b)) {
        mapa.set(b, [])
        ordem.push(b)
      }
      mapa.get(b)!.push(it)
    }
    return ordem.map((bloco) => ({ bloco, itens: mapa.get(bloco)! }))
  }, [rascunho])

  // Lista de blocos existentes (para o datalist de reatribuição)
  const blocosExistentes = useMemo(
    () => grupos.map((g) => g.bloco).filter((b) => b !== SEM_BLOCO),
    [grupos],
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

  function adicionarItem(bloco: string) {
    setRascunho((prev) =>
      prev
        ? {
            ...prev,
            itens: [
              ...prev.itens,
              {
                id: store.uid(),
                texto: "Novo item de checklist",
                bloco: bloco === SEM_BLOCO ? undefined : bloco,
                peso: 5,
                critico: false,
              },
            ],
          }
        : prev,
    )
  }

  function adicionarBloco() {
    setRascunho((prev) => {
      if (!prev) return prev
      // gera um nome único para o novo bloco
      const base = "Novo bloco"
      const usados = new Set(prev.itens.map((i) => i.bloco?.trim() || SEM_BLOCO))
      let nome = base
      let n = 2
      while (usados.has(nome)) {
        nome = `${base} ${n}`
        n++
      }
      return {
        ...prev,
        itens: [
          ...prev.itens,
          { id: store.uid(), texto: "Novo item de checklist", bloco: nome, peso: 5, critico: false },
        ],
      }
    })
  }

  // Renomeia um bloco em todos os itens que pertencem a ele
  function renomearBloco(antigo: string, novo: string) {
    const nomeNovo = novo.trim()
    setRascunho((prev) =>
      prev
        ? {
            ...prev,
            itens: prev.itens.map((i) =>
              (i.bloco?.trim() || SEM_BLOCO) === antigo
                ? { ...i, bloco: nomeNovo || undefined }
                : i,
            ),
          }
        : prev,
    )
  }

  // Remove todos os itens de um bloco
  function removerBloco(bloco: string) {
    setRascunho((prev) =>
      prev
        ? {
            ...prev,
            itens: prev.itens.filter((i) => (i.bloco?.trim() || SEM_BLOCO) !== bloco),
          }
        : prev,
    )
  }

  // Cor de destaque apenas para itens/blocos críticos. Caso contrário, usa o tema.
  function corCritico(critico?: boolean): string | null {
    return critico ? "var(--destructive)" : null
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
            <CardContent className="flex flex-col gap-6">
              <p className="text-xs text-muted-foreground">
                O número representa o peso. Edite o nome direto no card, use o{" "}
                <AlertTriangle className="inline size-3 align-text-bottom" /> para marcar como
                crítico (itens críticos ficam destacados em vermelho) e o seletor para mover o
                item entre blocos.
              </p>

              {/* Diagrama em árvore: blocos à esquerda conectados aos itens à direita */}
              <div className="overflow-x-auto pb-2">
                <div className="flex min-w-[680px] flex-col gap-7">
                  {grupos.map((g) => {
                    const blocoTotal = g.itens.reduce((s, i) => s + (i.peso || 0), 0)
                    const blocoCritico = g.itens.some((i) => i.critico)
                    const blocoCor = corCritico(blocoCritico)
                    return (
                      <div key={g.bloco} className="flex items-center">
                        {/* Card do bloco */}
                        <div
                          className="flex w-60 shrink-0 items-center gap-3 rounded-lg border bg-card p-3"
                          style={
                            blocoCor
                              ? {
                                  backgroundColor: `color-mix(in oklch, ${blocoCor} 16%, var(--card))`,
                                  borderColor: `color-mix(in oklch, ${blocoCor} 45%, transparent)`,
                                }
                              : undefined
                          }
                        >
                          <span
                            className={cn(
                              "flex size-11 shrink-0 items-center justify-center rounded-md text-sm font-bold",
                              !blocoCor && "bg-secondary text-secondary-foreground",
                            )}
                            style={
                              blocoCor
                                ? { backgroundColor: blocoCor, color: "var(--destructive-foreground)" }
                                : undefined
                            }
                          >
                            {blocoTotal}
                          </span>
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <input
                              value={g.bloco === SEM_BLOCO ? "" : g.bloco}
                              placeholder={SEM_BLOCO}
                              onChange={(e) => renomearBloco(g.bloco, e.target.value)}
                              aria-label="Nome do bloco"
                              className="w-full border-0 bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground"
                            />
                            <span className="text-[11px] text-muted-foreground">
                              {g.itens.length} {g.itens.length === 1 ? "item" : "itens"} ·{" "}
                              {blocoTotal} pts
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => adicionarItem(g.bloco)}
                              title="Adicionar item neste bloco"
                              className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                              <Plus className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removerBloco(g.bloco)}
                              title="Excluir bloco"
                              className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>

                        {/* Conector do bloco até a barra vertical */}
                        <div className="relative w-8 shrink-0 self-stretch">
                          <span className="absolute left-0 top-1/2 h-px w-full bg-foreground/20" />
                        </div>

                        {/* Itens do bloco (com barra vertical e ramificações) */}
                        <div className="relative flex-1">
                          {g.itens.length > 1 && (
                            <span className="absolute left-0 top-[22px] bottom-[22px] w-px bg-foreground/20" />
                          )}
                          <div className="flex flex-col gap-3">
                            {g.itens.map((it) => {
                              const cor = corCritico(it.critico)
                              return (
                                <div key={it.id} className="relative flex items-center pl-8">
                                  {/* ramificação horizontal */}
                                  <span className="absolute left-0 top-1/2 h-px w-8 bg-foreground/20" />
                                  <div
                                    className="flex h-11 flex-1 items-center gap-2 overflow-hidden rounded-md border bg-card pr-2"
                                    style={
                                      cor
                                        ? {
                                            backgroundColor: `color-mix(in oklch, ${cor} 13%, var(--card))`,
                                            borderColor: `color-mix(in oklch, ${cor} 40%, transparent)`,
                                          }
                                        : undefined
                                    }
                                  >
                                    {/* peso */}
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={it.peso}
                                      onChange={(e) =>
                                        atualizarItem(it.id, {
                                          peso: Number(e.target.value) || 0,
                                        })
                                      }
                                      readOnly={it.critico}
                                      disabled={it.critico}
                                      aria-label="Peso do item"
                                      title={
                                        it.critico
                                          ? "Item crítico zera o operador (peso fixo em 100)"
                                          : "Peso do item"
                                      }
                                      className={cn(
                                        "h-full w-11 shrink-0 border-0 text-center text-sm font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                                        it.critico && "cursor-not-allowed",
                                        !cor && "bg-secondary text-secondary-foreground",
                                      )}
                                      style={
                                        cor
                                          ? { backgroundColor: cor, color: "var(--destructive-foreground)" }
                                          : undefined
                                      }
                                    />
                                    {/* texto do item */}
                                    <input
                                      value={it.texto}
                                      onChange={(e) =>
                                        atualizarItem(it.id, { texto: e.target.value })
                                      }
                                      aria-label="Texto do item"
                                      className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                                    />
                                    {/* mover para outro bloco */}
                                    <select
                                      value={g.bloco}
                                      onChange={(e) =>
                                        atualizarItem(it.id, {
                                          bloco:
                                            e.target.value === SEM_BLOCO
                                              ? undefined
                                              : e.target.value,
                                        })
                                      }
                                      aria-label="Mover item para bloco"
                                      className="h-7 max-w-[110px] shrink-0 rounded-md border border-border bg-transparent px-1 text-xs text-muted-foreground outline-none"
                                    >
                                      {[...new Set([...blocosExistentes, g.bloco, SEM_BLOCO])].map(
                                        (b) => (
                                          <option key={b} value={b}>
                                            {b}
                                          </option>
                                        ),
                                      )}
                                    </select>
                                    {/* crítico */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const novoCritico = !it.critico
                                        atualizarItem(it.id, {
                                          critico: novoCritico,
                                          // Item crítico zera o operador: peso vai a 100 e fica travado
                                          ...(novoCritico ? { peso: 100 } : {}),
                                        })
                                      }}
                                      title={it.critico ? "Item crítico" : "Marcar como crítico"}
                                      aria-pressed={!!it.critico}
                                      className={cn(
                                        "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
                                        it.critico
                                          ? "text-[var(--chart-4)]"
                                          : "text-muted-foreground hover:text-foreground",
                                      )}
                                    >
                                      <AlertTriangle className="size-4" />
                                    </button>
                                    {/* excluir */}
                                    <button
                                      type="button"
                                      onClick={() => removerItem(it.id)}
                                      title="Excluir item"
                                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-destructive"
                                    >
                                      <Trash2 className="size-4" />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <Button variant="outline" onClick={adicionarBloco} className="gap-2 self-start">
                <FolderPlus className="size-4" /> Adicionar bloco
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
