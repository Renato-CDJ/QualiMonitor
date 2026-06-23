"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

export interface Usuario {
  usuario: string
  nome: string
}

/* Usuários locais (sem senha) */
const USUARIOS_LOCAIS: Usuario[] = [
  { usuario: "Renjesus", nome: "Renato C Jesus" },
]

const KEY_USER = "qm.auth.user.v1"
const KEY_CARTEIRA = "qm.auth.carteira.v1"

interface AuthContextValue {
  ready: boolean
  user: Usuario | null
  carteira: string | null
  login: (usuario: string) => { ok: boolean; erro?: string }
  logout: () => void
  selecionarCarteira: (carteira: string) => void
  limparCarteira: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<Usuario | null>(null)
  const [carteira, setCarteira] = useState<string | null>(null)

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem(KEY_USER)
      if (rawUser) setUser(JSON.parse(rawUser) as Usuario)
      const rawCart = localStorage.getItem(KEY_CARTEIRA)
      if (rawCart) setCarteira(rawCart)
    } catch {
      /* ignore */
    }
    setReady(true)
  }, [])

  const login = useCallback((usuario: string) => {
    const limpo = usuario.trim()
    if (!limpo) return { ok: false, erro: "Informe o nome de usuário." }
    const encontrado = USUARIOS_LOCAIS.find(
      (u) => u.usuario.toLowerCase() === limpo.toLowerCase(),
    )
    if (!encontrado) return { ok: false, erro: "Usuário não encontrado." }
    setUser(encontrado)
    localStorage.setItem(KEY_USER, JSON.stringify(encontrado))
    return { ok: true }
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

  return (
    <AuthContext.Provider
      value={{ ready, user, carteira, login, logout, selecionarCarteira, limparCarteira }}
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
