"use client"

import { useMemo, useState } from "react"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CardTitleHint } from "@/components/card-title-hint"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useQualityData } from "@/lib/use-quality-data"
import { store } from "@/lib/store"
import { tempoDeEmpresa, formatarData } from "@/lib/analytics"
import type { Operador } from "@/lib/types"

type FormState = {
  nome: string
  carteira: string
  admissao: string
}

const FORM_VAZIO: FormState = { nome: "", carteira: "", admissao: "" }

export function AdminOperadores() {
  const { operadores, ready } = useQualityData()

  const [busca, setBusca] = useState("")
  const [dialogAberto, setDialogAberto] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(FORM_VAZIO)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<Operador | null>(null)

  // Sugestões de carteiras existentes para facilitar o cadastro.
  const carteiras = useMemo(
    () => Array.from(new Set(operadores.map((o) => o.carteira))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [operadores],
  )

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const lista = [...operadores].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    if (!termo) return lista
    return lista.filter(
      (o) =>
        o.nome.toLowerCase().includes(termo) ||
        o.carteira.toLowerCase().includes(termo),
    )
  }, [operadores, busca])

  function abrirNovo() {
    setEditando(null)
    setForm(FORM_VAZIO)
    setErro(null)
    setDialogAberto(true)
  }

  function abrirEdicao(o: Operador) {
    setEditando(o.id)
    setForm({ nome: o.nome, carteira: o.carteira, admissao: o.admissao })
    setErro(null)
    setDialogAberto(true)
  }

  function salvar() {
    setErro(null)
    const nome = form.nome.trim()
    const carteira = form.carteira.trim()
    const admissao = form.admissao.trim()
    if (!nome) return setErro("Informe o nome do operador.")
    if (!carteira) return setErro("Informe a carteira.")
    if (!admissao) return setErro("Informe a data de admissão.")

    const lista = store.getOperadores()

    if (editando) {
      store.setOperadores(
        lista.map((o) => (o.id === editando ? { ...o, nome, carteira, admissao } : o)),
      )
    } else {
      const novo: Operador = { id: store.uid(), nome, carteira, admissao }
      store.setOperadores([...lista, novo])
    }
    setDialogAberto(false)
  }

  function confirmarRemover() {
    if (!confirmarExclusao) return
    const lista = store.getOperadores()
    store.setOperadores(lista.filter((o) => o.id !== confirmarExclusao.id))
    setConfirmarExclusao(null)
  }

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitleHint
            title="Operadores cadastrados"
            description="Adicione, edite e remova operadores. Estes registros alimentam os filtros e relatórios de monitoria."
          />
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar operador..."
                className="w-48 pl-9"
              />
            </div>
            <Button onClick={abrirNovo} size="sm" className="gap-2">
              <Plus className="size-4" />
              Novo operador
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Carteira</TableHead>
                <TableHead>Admissão</TableHead>
                <TableHead>Tempo de empresa</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{o.carteira}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {o.admissao ? formatarData(o.admissao) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{tempoDeEmpresa(o.admissao)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => abrirEdicao(o)}
                        aria-label={`Editar ${o.nome}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setConfirmarExclusao(o)}
                        aria-label={`Excluir ${o.nome}`}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    {busca ? "Nenhum operador encontrado para a busca." : "Nenhum operador cadastrado."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            {filtrados.length} de {operadores.length} operadores
          </p>
        </CardContent>
      </Card>

      {/* Dialog adicionar/editar */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar operador" : "Novo operador"}</DialogTitle>
            <DialogDescription>
              {editando ? "Atualize os dados do operador." : "Cadastre um novo operador na plataforma."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="op-nome">Nome completo</Label>
              <Input
                id="op-nome"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex.: João Pereira"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="op-carteira">Carteira</Label>
              {carteiras.length > 0 ? (
                <Select
                  value={form.carteira}
                  onValueChange={(v) => setForm((f) => ({ ...f, carteira: v ?? "" }))}
                >
                  <SelectTrigger id="op-carteira">
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
              ) : (
                <Input
                  id="op-carteira"
                  value={form.carteira}
                  onChange={(e) => setForm((f) => ({ ...f, carteira: e.target.value }))}
                  placeholder="Ex.: Carteira X"
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="op-admissao">Data de admissão</Label>
              <Input
                id="op-admissao"
                type="date"
                value={form.admissao}
                onChange={(e) => setForm((f) => ({ ...f, admissao: e.target.value }))}
              />
              {form.admissao && (
                <p className="text-xs text-muted-foreground">
                  Tempo de empresa: {tempoDeEmpresa(form.admissao)}
                </p>
              )}
            </div>

            {erro && <p className="text-sm text-destructive">{erro}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar}>{editando ? "Salvar alterações" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <Dialog
        open={!!confirmarExclusao}
        onOpenChange={(o) => {
          if (!o) setConfirmarExclusao(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir operador</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{" "}
              <span className="font-medium text-foreground">{confirmarExclusao?.nome}</span>? Esta ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarExclusao(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarRemover}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
