"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Link2, Plus, Trash2, Wallet, ListChecks, Tags, ArrowRight, Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useQualityData } from "@/lib/use-quality-data"
import { store } from "@/lib/store"
import { type VinculoTabulacao } from "@/lib/types"

export function VinculosEditor() {
  const { checklists, vinculos, tabulacoes, ready } = useQualityData()

  const [carteira, setCarteira] = useState<string>("")
  const [checklistId, setChecklistId] = useState<string>("")
  const [tabulacao, setTabulacao] = useState<string>("")

  // Estado do gerenciamento de tabulações
  const [novaTabulacao, setNovaTabulacao] = useState<string>("")
  const [editando, setEditando] = useState<string | null>(null)
  const [editValor, setEditValor] = useState<string>("")

  // Carteiras disponíveis a partir dos checklists cadastrados
  const carteiras = useMemo(
    () => Array.from(new Set(checklists.map((c) => c.carteira))),
    [checklists],
  )

  // Checklists da carteira selecionada
  const checklistsDaCarteira = useMemo(
    () => checklists.filter((c) => c.carteira === carteira),
    [checklists, carteira],
  )

  // Tabulações ainda não vinculadas para a carteira selecionada
  const tabulacoesDisponiveis = useMemo(() => {
    const usadas = new Set(
      vinculos.filter((v) => v.carteira === carteira).map((v) => v.tabulacao),
    )
    return tabulacoes.filter((t) => !usadas.has(t))
  }, [vinculos, tabulacoes, carteira])

  // Vínculos agrupados por carteira para exibição
  const grupos = useMemo(() => {
    const ordem: string[] = []
    const mapa = new Map<string, VinculoTabulacao[]>()
    for (const v of vinculos) {
      if (!mapa.has(v.carteira)) {
        mapa.set(v.carteira, [])
        ordem.push(v.carteira)
      }
      mapa.get(v.carteira)!.push(v)
    }
    return ordem
      .sort((a, b) => a.localeCompare(b))
      .map((cart) => ({ carteira: cart, itens: mapa.get(cart)! }))
  }, [vinculos])

  function nomeChecklist(id: string) {
    return checklists.find((c) => c.id === id)?.nome ?? "Checklist removido"
  }

  function vincular() {
    if (!carteira) return toast.error("Selecione a carteira.")
    if (!checklistId) return toast.error("Selecione o checklist.")
    if (!tabulacao) return toast.error("Selecione a tabulação.")

    const duplicado = vinculos.some(
      (v) => v.carteira === carteira && v.tabulacao === tabulacao,
    )
    if (duplicado) {
      return toast.error("Já existe um vínculo para esta carteira e tabulação.")
    }

    const novo: VinculoTabulacao = {
      id: store.uid(),
      carteira,
      checklistId,
      tabulacao,
      criadoEm: new Date().toISOString(),
    }
    store.addVinculo(novo)
    setTabulacao("")
    toast.success("Vínculo criado com sucesso.")
  }

  function remover(id: string) {
    store.removeVinculo(id)
    toast.success("Vínculo removido.")
  }

  /* ----- Gerenciamento de Tabulações ----- */

  function adicionarTabulacao() {
    const nome = novaTabulacao.trim()
    if (!nome) return toast.error("Informe o nome da tabulação.")
    const ok = store.addTabulacao(nome)
    if (!ok) return toast.error("Já existe uma tabulação com esse nome.")
    setNovaTabulacao("")
    toast.success("Tabulação adicionada.")
  }

  function iniciarEdicao(nome: string) {
    setEditando(nome)
    setEditValor(nome)
  }

  function cancelarEdicao() {
    setEditando(null)
    setEditValor("")
  }

  function salvarEdicao(antigo: string) {
    const novo = editValor.trim()
    if (!novo) return toast.error("Informe o nome da tabulação.")
    if (novo === antigo) {
      cancelarEdicao()
      return
    }
    const ok = store.renameTabulacao(antigo, novo)
    if (!ok) return toast.error("Já existe uma tabulação com esse nome.")
    cancelarEdicao()
    toast.success("Tabulação atualizada. Vínculos e monitorias foram ajustados.")
  }

  function excluirTabulacao(nome: string) {
    const emUso = store.countVinculosPorTabulacao(nome)
    if (emUso > 0) {
      return toast.error(
        `Não é possível excluir: ${emUso} ${emUso === 1 ? "vínculo usa" : "vínculos usam"} esta tabulação.`,
      )
    }
    store.removeTabulacao(nome)
    toast.success("Tabulação excluída.")
  }

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Gerenciamento de Tabulações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tags className="size-4 text-primary" />
            Gerenciar Tabulações
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Cadastre, edite ou exclua as tabulações usadas nos vínculos e nas
            monitorias. Renomear uma tabulação atualiza automaticamente os
            vínculos e monitorias existentes.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={novaTabulacao}
              onChange={(e) => setNovaTabulacao(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") adicionarTabulacao()
              }}
              placeholder="Nova tabulação (ex.: Promessa de Pagamento)"
              className="sm:max-w-xs"
            />
            <Button onClick={adicionarTabulacao} className="gap-2">
              <Plus className="size-4" /> Adicionar
            </Button>
          </div>

          {tabulacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma tabulação cadastrada.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tabulacoes.map((t) => {
                const emEdicao = editando === t
                const usos = store.countVinculosPorTabulacao(t)
                return (
                  <div
                    key={t}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 p-1.5 pl-3"
                  >
                    {emEdicao ? (
                      <>
                        <Input
                          value={editValor}
                          onChange={(e) => setEditValor(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") salvarEdicao(t)
                            if (e.key === "Escape") cancelarEdicao()
                          }}
                          autoFocus
                          className="h-7 w-40 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-primary"
                          onClick={() => salvarEdicao(t)}
                          aria-label="Salvar"
                        >
                          <Check className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          onClick={cancelarEdicao}
                          aria-label="Cancelar"
                        >
                          <X className="size-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-1.5 text-sm">
                          <Tags className="size-3.5 text-muted-foreground" />
                          {t}
                          {usos > 0 && (
                            <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px]">
                              {usos}
                            </Badge>
                          )}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-primary"
                          onClick={() => iniciarEdicao(t)}
                          aria-label={`Editar ${t}`}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => excluirTabulacao(t)}
                          aria-label={`Excluir ${t}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      {/* Formulário de vínculo */}
      <Card className="lg:sticky lg:top-20 lg:self-start">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="size-4 text-primary" />
            Novo vínculo
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Associe uma carteira a um checklist e a uma tabulação. Esse vínculo
            define qual checklist será carregado na Nova Monitoria conforme a
            tabulação monitorada.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-1.5">
              <Wallet className="size-3.5 text-muted-foreground" /> Carteira
            </Label>
            <Select
              value={carteira}
              onValueChange={(v) => {
                setCarteira(v)
                setChecklistId("")
                setTabulacao("")
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a carteira" />
              </SelectTrigger>
              <SelectContent>
                {carteiras.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-1.5">
              <ListChecks className="size-3.5 text-muted-foreground" /> Checklist
            </Label>
            <Select
              value={checklistId}
              onValueChange={setChecklistId}
              disabled={!carteira}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    carteira ? "Selecione o checklist" : "Selecione a carteira primeiro"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {checklistsDaCarteira.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-1.5">
              <Tags className="size-3.5 text-muted-foreground" /> Tabulação
            </Label>
            <Select
              value={tabulacao}
              onValueChange={setTabulacao}
              disabled={!carteira}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !carteira
                      ? "Selecione a carteira primeiro"
                      : tabulacoesDisponiveis.length
                        ? "Selecione a tabulação"
                        : "Todas as tabulações já vinculadas"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {tabulacoesDisponiveis.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={vincular} className="mt-1 gap-2">
            <Plus className="size-4" /> Vincular
          </Button>
        </CardContent>
      </Card>

      {/* Lista de vínculos existentes */}
      <div className="flex flex-col gap-6">
        {grupos.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Link2 className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium">Nenhum vínculo cadastrado</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Use o formulário ao lado para vincular uma carteira a um checklist
                e a uma tabulação.
              </p>
            </CardContent>
          </Card>
        ) : (
          grupos.map((g) => (
            <Card key={g.carteira}>
              <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet className="size-4 text-primary" />
                  {g.carteira}
                </CardTitle>
                <Badge variant="outline">
                  {g.itens.length} {g.itens.length === 1 ? "vínculo" : "vínculos"}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {g.itens.map((v) => (
                  <div
                    key={v.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3"
                  >
                    <Badge className="gap-1.5 bg-primary/10 text-primary hover:bg-primary/10">
                      <Tags className="size-3" />
                      {v.tabulacao}
                    </Badge>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex min-w-0 items-center gap-1.5 text-sm">
                      <ListChecks className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{nomeChecklist(v.checklistId)}</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remover(v.id)}
                      className="ml-auto gap-1.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only sm:not-sr-only">Remover</span>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
      </div>
    </div>
  )
}
