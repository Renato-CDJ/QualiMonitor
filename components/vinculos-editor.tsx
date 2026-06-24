"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Link2, Plus, Trash2, Wallet, ListChecks, Tags, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
import { TABULACOES, type VinculoTabulacao } from "@/lib/types"

export function VinculosEditor() {
  const { checklists, vinculos, ready } = useQualityData()

  const [carteira, setCarteira] = useState<string>("")
  const [checklistId, setChecklistId] = useState<string>("")
  const [tabulacao, setTabulacao] = useState<string>("")

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
    return TABULACOES.filter((t) => !usadas.has(t))
  }, [vinculos, carteira])

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

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  return (
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
  )
}
