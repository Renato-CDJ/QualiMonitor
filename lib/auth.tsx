"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

export type Perfil = "admin" | "comum" | "visitante"

export interface Usuario {
  usuario: string
  nome: string
  perfil: Perfil
}

/** Registro completo de usuário (inclui senha, usada apenas para admins). */
export interface UsuarioRegistro extends Usuario {
  senha?: string
}

/* Usuários iniciais (seed). O admin já vem com uma senha padrão que pode ser
   alterada na área de Administração. Usuários "comuns" entram sem senha. */
const SEED_USUARIOS: UsuarioRegistro[] = [
  { usuario: "Renjesus", nome: "Renato C Jesus", perfil: "admin", senha: "admin123" },
]

/* Usuário visitante: apenas leitura e filtros */
const USUARIO_VISITANTE: Usuario = {
  usuario: "visitante",
  nome: "Visitante",
  perfil: "visitante",
}

const KEY_USER = "qm.auth.user.v1"
const KEY_CARTEIRA = "qm.auth.carteira.v1"
const KEY_USUARIOS = "qm.usuarios.v1"

function lerUsuarios(): UsuarioRegistro[] {
  if (typeof window === "undefined") return SEED_USUARIOS
  try {
    const raw = localStorage.getItem(KEY_USUARIOS)
    if (!raw) return SEED_USUARIOS
    const lista = JSON.parse(raw) as UsuarioRegistro[]
    return Array.isArray(lista) && lista.length > 0 ? lista : SEED_USUARIOS
  } catch {
    return SEED_USUARIOS
  }
}

function gravarUsuarios(lista: UsuarioRegistro[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY_USUARIOS, JSON.stringify(lista))
}

/** Remove a senha antes de expor/armazenar a sessão. */
function semSenha(u: UsuarioRegistro): Usuario {
  return { usuario: u.usuario, nome: u.nome, perfil: u.perfil }
}

interface AuthContextValue {
  ready: boolean
  user: Usuario | null
  carteira: string | null
  isVisitante: boolean
  isAdmin: boolean
  usuarios: UsuarioRegistro[]
  /** true se o usuário digitado existe e tem perfil admin (precisa de senha). */
  exigeSenha: (usuario: string) => boolean
  login: (usuario: string, senha?: string) => { ok: boolean; erro?: string }
  loginVisitante: () => void
  logout: () => void
  selecionarCarteira: (carteira: string) => void
  limparCarteira: () => void
  adicionarUsuario: (u: UsuarioRegistro) => { ok: boolean; erro?: string }
  atualizarUsuario: (usuarioOriginal: string, patch: Partial<UsuarioRegistro>) => { ok: boolean; erro?: string }
  removerUsuario: (usuario: string) => { ok: boolean; erro?: string }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<Usuario | null>(null)
  const [carteira, setCarteira] = useState<string | null>(null)
  const [usuarios, setUsuarios] = useState<UsuarioRegistro[]>(SEED_USUARIOS)

  useEffect(() => {
    try {
      // Garante o seed inicial de usuários.
      const rawUsuarios = localStorage.getItem(KEY_USUARIOS)
      if (!rawUsuarios) gravarUsuarios(SEED_USUARIOS)
      setUsuarios(lerUsuarios())

      const rawUser = localStorage.getItem(KEY_USER)
      if (rawUser) setUser(JSON.parse(rawUser) as Usuario)
      const rawCart = localStorage.getItem(KEY_CARTEIRA)
      if (rawCart) setCarteira(rawCart)
    } catch {
      /* ignore */
    }
    setReady(true)
  }, [])

  const exigeSenha = useCallback(
    (usuario: string) => {
      const limpo = usuario.trim().toLowerCase()
      if (!limpo) return false
      const encontrado = usuarios.find((u) => u.usuario.toLowerCase() === limpo)
      return encontrado?.perfil === "admin"
    },
    [usuarios],
  )

  const login = useCallback(
    (usuario: string, senha?: string) => {
      const limpo = usuario.trim()
      if (!limpo) return { ok: false, erro: "Informe o nome de usuário." }
      const encontrado = usuarios.find(
        (u) => u.usuario.toLowerCase() === limpo.toLowerCase(),
      )
      if (!encontrado) return { ok: false, erro: "Usuário não encontrado." }
      if (encontrado.perfil === "admin") {
        if (!senha?.trim()) return { ok: false, erro: "Informe a senha de administrador." }
        if (senha !== encontrado.senha) return { ok: false, erro: "Senha incorreta." }
      }
      const sessao = semSenha(encontrado)
      setUser(sessao)
      localStorage.setItem(KEY_USER, JSON.stringify(sessao))
      return { ok: true }
    },
    [usuarios],
  )

  const loginVisitante = useCallback(() => {
    setUser(USUARIO_VISITANTE)
    localStorage.setItem(KEY_USER, JSON.stringify(USUARIO_VISITANTE))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setCarteira(null)
    localStorage.removeItem(KEY_USER)
    localStorage.removeItem(KEY_CARTEIRA)
  }, [])

  const selecionarCarteira = useCallback((c: string) => {
    setCarteira(c)
    localStorage.setItem(KEY_CARTEIRA, c)
  }, [])

  const limparCarteira = useCallback(() => {
    setCarteira(null)
    localStorage.removeItem(KEY_CARTEIRA)
  }, [])

  const adicionarUsuario = useCallback(
    (u: UsuarioRegistro) => {
      const limpo = u.usuario.trim()
      if (!limpo) return { ok: false, erro: "Informe o nome de usuário." }
      if (!u.nome.trim()) return { ok: false, erro: "Informe o nome completo." }
      if (u.perfil === "admin" && !u.senha?.trim()) {
        return { ok: false, erro: "Defina uma senha para o administrador." }
      }
      const existe = usuarios.some((x) => x.usuario.toLowerCase() === limpo.toLowerCase())
      if (existe) return { ok: false, erro: "Já existe um usuário com esse nome." }
      const novo: UsuarioRegistro = {
        usuario: limpo,
        nome: u.nome.trim(),
        perfil: u.perfil,
        senha: u.perfil === "admin" ? u.senha : undefined,
      }
      const atualizada = [...usuarios, novo]
      setUsuarios(atualizada)
      gravarUsuarios(atualizada)
      return { ok: true }
    },
    [usuarios],
  )

  const atualizarUsuario = useCallback(
    (usuarioOriginal: string, patch: Partial<UsuarioRegistro>) => {
      const idx = usuarios.findIndex((x) => x.usuario.toLowerCase() === usuarioOriginal.toLowerCase())
      if (idx === -1) return { ok: false, erro: "Usuário não encontrado." }

      const novoNomeUsuario = (patch.usuario ?? usuarios[idx].usuario).trim()
      if (!novoNomeUsuario) return { ok: false, erro: "Informe o nome de usuário." }
      const conflito = usuarios.some(
        (x, i) => i !== idx && x.usuario.toLowerCase() === novoNomeUsuario.toLowerCase(),
      )
      if (conflito) return { ok: false, erro: "Já existe um usuário com esse nome." }

      const perfil = patch.perfil ?? usuarios[idx].perfil
      // Mantém a senha existente se não vier nova; exige senha ao virar admin sem senha.
      const senha = perfil === "admin" ? (patch.senha?.trim() ? patch.senha : usuarios[idx].senha) : undefined
      if (perfil === "admin" && !senha?.trim()) {
        return { ok: false, erro: "Defina uma senha para o administrador." }
      }

      // Impede remover o último admin (rebaixando de perfil).
      if (usuarios[idx].perfil === "admin" && perfil !== "admin") {
        const totalAdmins = usuarios.filter((x) => x.perfil === "admin").length
        if (totalAdmins <= 1) return { ok: false, erro: "É necessário ao menos um administrador." }
      }

      const atualizado: UsuarioRegistro = {
        usuario: novoNomeUsuario,
        nome: (patch.nome ?? usuarios[idx].nome).trim(),
        perfil,
        senha,
      }
      const lista = usuarios.map((x, i) => (i === idx ? atualizado : x))
      setUsuarios(lista)
      gravarUsuarios(lista)

      // Se o usuário logado é o que está sendo editado, sincroniza a sessão.
      if (user && user.usuario.toLowerCase() === usuarioOriginal.toLowerCase()) {
        const sessao = semSenha(atualizado)
        setUser(sessao)
        localStorage.setItem(KEY_USER, JSON.stringify(sessao))
      }
      return { ok: true }
    },
    [usuarios, user],
  )

  const removerUsuario = useCallback(
    (usuario: string) => {
      const alvo = usuarios.find((x) => x.usuario.toLowerCase() === usuario.toLowerCase())
      if (!alvo) return { ok: false, erro: "Usuário não encontrado." }
      if (alvo.perfil === "admin") {
        const totalAdmins = usuarios.filter((x) => x.perfil === "admin").length
        if (totalAdmins <= 1) return { ok: false, erro: "É necessário ao menos um administrador." }
      }
      const lista = usuarios.filter((x) => x.usuario.toLowerCase() !== usuario.toLowerCase())
      setUsuarios(lista)
      gravarUsuarios(lista)
      return { ok: true }
    },
    [usuarios],
  )

  return (
    <AuthContext.Provider
      value={{
        ready,
        user,
        carteira,
        isVisitante: user?.perfil === "visitante",
        isAdmin: user?.perfil === "admin",
        usuarios,
        exigeSenha,
        login,
        loginVisitante,
        logout,
        selecionarCarteira,
        limparCarteira,
        adicionarUsuario,
        atualizarUsuario,
        removerUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider")
  return ctx
}
