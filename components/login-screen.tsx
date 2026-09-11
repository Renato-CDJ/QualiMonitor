"use client"

import { useState } from "react"
import { ArrowRight, User, ShieldCheck, Eye, Lock, EyeOff, Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth"
import { NeonTitle } from "@/components/neon-title"
import { TypewriterCredit } from "@/components/typewriter-credit"

export function LoginScreen() {
  const { login, loginVisitante, exigeSenha } = useAuth()
  const [usuario, setUsuario] = useState("")
  const [senha, setSenha] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const precisaSenha = exigeSenha(usuario)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)
    setTimeout(() => {
      const res = login(usuario, senha)
      if (!res.ok) {
        setErro(res.erro ?? "Não foi possível entrar.")
        setCarregando(false)
      }
    }, 450)
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-start overflow-hidden bg-white px-4 pb-10 pt-[18vh] text-[#242424]">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 size-80 animate-pulse rounded-full bg-[#f26522]/10 blur-3xl [animation-duration:6s]" />
        <div className="absolute -bottom-32 -right-20 size-96 animate-pulse rounded-full bg-[#f26522]/10 blur-3xl [animation-duration:8s]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#242424 1px, transparent 1px), linear-gradient(90deg, #242424 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="relative z-10 mb-12 flex w-full select-none flex-col items-center justify-center gap-3 px-4 duration-500 animate-in fade-in slide-in-from-top-4">
        <NeonTitle text="Quali.Monitor" />
        <div className="flex items-center gap-2 rounded-full border border-[#f26522]/20 bg-[#fff4ee] px-3 py-1 text-xs font-medium text-[#a94318] shadow-sm">
          <Sparkles className="size-3.5" /> Acesso simples e seguro
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">
        <div className="rounded-2xl border border-[#242424]/15 bg-white/90 p-6 shadow-[0_18px_50px_rgba(36,36,36,0.12)] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_22px_60px_rgba(242,101,34,0.16)]">
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="usuario" className="text-sm font-medium text-[#242424]">Nome de usuário</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#777] transition-colors duration-200 peer-focus:text-[#f26522]" />
                <Input
                  id="usuario"
                  autoFocus
                  autoComplete="off"
                  placeholder="Digite seu nome de usuário"
                  value={usuario}
                  onChange={(e) => { setUsuario(e.target.value); if (erro) setErro(null) }}
                  className="peer h-10 border-[#242424]/20 bg-white pl-9 text-[#242424] placeholder:text-[#888] transition-all duration-200 focus-visible:-translate-y-0.5 focus-visible:border-[#f26522] focus-visible:ring-[#f26522]/25"
                  aria-invalid={!!erro}
                  aria-describedby={erro ? "login-erro" : undefined}
                />
              {usuario.trim() && !erro && <Check aria-hidden className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#f26522] animate-in zoom-in-50" />}
              </div>
              {!precisaSenha && usuario.trim() && !erro && <p className="text-xs text-[#777] animate-in fade-in">Você entrará com acesso padrão.</p>}
              {erro && <p id="login-erro" className="animate-in text-sm text-red-600 fade-in slide-in-from-top-1">{erro}</p>}
            </div>

            {precisaSenha && (
              <div className="flex animate-in flex-col gap-1.5 fade-in slide-in-from-top-1 duration-300">
                <Label htmlFor="senha" className="text-sm font-medium text-[#242424]">Senha de administrador</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#777]" />
                  <Input
                    id="senha"
                    type={mostrarSenha ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => { setSenha(e.target.value); if (erro) setErro(null) }}
                    className="h-10 border-[#242424]/20 bg-white px-9 text-[#242424] placeholder:text-[#888] transition-all duration-200 focus-visible:-translate-y-0.5 focus-visible:border-[#f26522] focus-visible:ring-[#f26522]/25"
                    aria-invalid={!!erro}
                  />
                  <button type="button" onClick={() => setMostrarSenha((v) => !v)} aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#777] transition-colors hover:text-[#f26522]">
                    {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" disabled={carregando || !usuario.trim() || (precisaSenha && !senha)} className="group mt-1 h-10 gap-2 bg-[#f26522] text-white shadow-[0_8px_20px_rgba(242,101,34,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#d95316] hover:shadow-[0_12px_24px_rgba(242,101,34,0.3)] disabled:translate-y-0 disabled:opacity-60">
              {carregando ? <><span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Entrando...</> : <>Entrar <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" /></>}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-[#242424]/15" /><span className="text-xs uppercase tracking-wide text-[#777]">ou</span><span className="h-px flex-1 bg-[#242424]/15" /></div>

          <Button type="button" variant="outline" onClick={loginVisitante} disabled={carregando} className="group h-10 w-full gap-2 border-[#242424]/20 bg-white text-[#242424] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f26522] hover:bg-[#fff4ee] hover:text-[#242424] hover:shadow-[0_8px_18px_rgba(242,101,34,0.12)]">
            <Eye className="size-4" /> Acessar como Visitante <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Button>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-[#777]"><ShieldCheck className="size-3.5 shrink-0 text-[#f26522]" /> Visitante tem acesso somente para visualizar e filtrar</div>
        </div>
      </div>

      <TypewriterCredit />
    </main>
  )
}
