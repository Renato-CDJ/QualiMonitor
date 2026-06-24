"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, ShieldCheck, UserRound, Eye, Lock, EyeOff } from "lucide-react"
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
import { useAuth, type Perfil, type UsuarioRegistro } from "@/lib/auth"

const PERFIL_LABEL: Record<Perfil, string> = {
  admin: "Administrador",
  comum: "Comum",
  visitante: "Visitante",
}

function PerfilBadge({ perfil }: { perfil: Perfil }) {
  if (perfil === "admin") {
    return (
      <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/10 text-primary">
        <ShieldCheck className="size-3.5" />
        Administrador
      </Badge>
    )
  }
  if (perfil === "visitante") {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <Eye className="size-3.5" />
        Visitante
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1">
      <UserRound className="size-3.5" />
      Comum
    </Badge>
  )
}

type FormState = {
  usuario: string
  nome: string
  perfil: Perfil
  senha: string
}

const FORM_VAZIO: FormState = { usuario: "", nome: "", perfil: "comum", senha: "" }

export function AdminUsuarios() {
  const { usuarios, user, adicionarUsuario, atualizarUsuario, removerUsuario } = useAuth()

  const [dialogAberto, setDialogAberto] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(FORM_VAZIO)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [confirmarExclusao, setConfirmarExclusao] = useState<UsuarioRegistro | null>(null)
  const [erroExclusao, setErroExclusao] = useState<string | null>(null)

  function abrirNovo() {
    setEditando(null)
    setForm(FORM_VAZIO)
    setMostrarSenha(false)
    setErro(null)
    setDialogAberto(true)
  }

  function abrirEdicao(u: UsuarioRegistro) {
    setEditando(u.usuario)
    setForm({ usuario: u.usuario, nome: u.nome, perfil: u.perfil, senha: "" })
    setMostrarSenha(false)
    setErro(null)
    setDialogAberto(true)
  }

  function salvar() {
    setErro(null)
    const res = editando
      ? atualizarUsuario(editando, {
          usuario: form.usuario,
          nome: form.nome,
          perfil: form.perfil,
          // senha em branco mantém a atual ao editar
          senha: form.senha.trim() ? form.senha : undefined,
        })
      : adicionarUsuario({
          usuario: form.usuario,
          nome: form.nome,
          perfil: form.perfil,
          senha: form.senha,
        })
    if (!res.ok) {
      setErro(res.erro ?? "Não foi possível salvar.")
      return
    }
    setDialogAberto(false)
  }

  function confirmarRemover() {
    if (!confirmarExclusao) return
    setErroExclusao(null)
    const res = removerUsuario(confirmarExclusao.usuario)
    if (!res.ok) {
      setErroExclusao(res.erro ?? "Não foi possível excluir.")
      return
    }
    setConfirmarExclusao(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitleHint
            title="Usuários da plataforma"
            description="Controle quem acessa o sistema. Administradores precisam de senha; usuários comuns entram apenas com o nome de usuário; visitantes têm acesso somente de leitura."
          />
          <Button onClick={abrirNovo} size="sm" className="gap-2">
            <Plus className="size-4" />
            Novo usuário
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => {
                const ehVoce = user?.usuario.toLowerCase() === u.usuario.toLowerCase()
                return (
                  <TableRow key={u.usuario}>
                    <TableCell className="font-medium">
                      {u.nome}
                      {ehVoce && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">(você)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">@{u.usuario}</TableCell>
                    <TableCell>
                      <PerfilBadge perfil={u.perfil} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => abrirEdicao(u)}
                          aria-label={`Editar ${u.nome}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setErroExclusao(null)
                            setConfirmarExclusao(u)
                          }}
                          disabled={ehVoce}
                          aria-label={`Excluir ${u.nome}`}
                          className="text-destructive hover:text-destructive disabled:text-muted-foreground"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {usuarios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                    Nenhum usuário cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de adicionar/editar */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar usuário" : "Novo usuário"}</DialogTitle>
            <DialogDescription>
              {editando
                ? "Atualize os dados do usuário. Deixe a senha em branco para mantê-la."
                : "Cadastre um novo usuário e defina o nível de acesso."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="form-nome">Nome completo</Label>
              <Input
                id="form-nome"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex.: Maria Silva"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="form-usuario">Nome de usuário</Label>
              <Input
                id="form-usuario"
                value={form.usuario}
                onChange={(e) => setForm((f) => ({ ...f, usuario: e.target.value }))}
                placeholder="Ex.: msilva"
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="form-perfil">Perfil de acesso</Label>
              <Select
                value={form.perfil}
                onValueChange={(v) => setForm((f) => ({ ...f, perfil: v as Perfil }))}
              >
                <SelectTrigger id="form-perfil">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{PERFIL_LABEL.admin}</SelectItem>
                  <SelectItem value="comum">{PERFIL_LABEL.comum}</SelectItem>
                  <SelectItem value="visitante">{PERFIL_LABEL.visitante}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {form.perfil === "admin"
                  ? "Acesso total, incluindo a área de administração. Exige senha."
                  : form.perfil === "visitante"
                    ? "Acesso somente de leitura e filtros."
                    : "Acesso padrão à plataforma, sem senha."}
              </p>
            </div>

            {/* Senha apenas para administradores */}
            {form.perfil === "admin" && (
              <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <Label htmlFor="form-senha">Senha</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="form-senha"
                    type={mostrarSenha ? "text" : "password"}
                    value={form.senha}
                    onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                    placeholder={editando ? "Deixe em branco para manter" : "Defina uma senha"}
                    className="px-9"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((v) => !v)}
                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            )}

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

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={!!confirmarExclusao}
        onOpenChange={(o) => {
          if (!o) setConfirmarExclusao(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{" "}
              <span className="font-medium text-foreground">{confirmarExclusao?.nome}</span>? Esta ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {erroExclusao && <p className="text-sm text-destructive">{erroExclusao}</p>}
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
