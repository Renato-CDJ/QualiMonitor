"use client"

import { useState } from "react"
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth"

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
    <main className="min-h-svh bg-[#f7f7f5] text-[#242424]">
      <div className="mx-auto flex min-h-svh w-full max-w-[1440px] flex-col lg:flex-row">
        <section className="relative flex min-h-[270px] flex-1 flex-col justify-between overflow-hidden bg-[#f26522] p-7 text-white sm:p-10 lg:min-h-svh lg:p-14">
          <div aria-hidden className="absolute -right-20 -top-20 size-72 rounded-full border-[32px] border-white/15 sm:size-96" />
          <div aria-hidden className="absolute -bottom-36 -left-24 size-80 rounded-full border-[42px] border-[#242424]/10" />

          <div className="relative z-10 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#242424] text-sm font-black tracking-tight text-white">QM</span>
            <span className="text-sm font-bold uppercase tracking-[0.18em]">QualiMonitor</span>
          </div>

          <div className="relative z-10 mt-10 max-w-xl lg:mt-0">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-white/75">Qualidade que gera resultado</p>
            <h1 className="max-w-lg text-balance text-4xl font-black leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Monitore melhor. Evolua sempre.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/85 sm:text-lg">
              Uma visão mais clara para transformar cada atendimento em uma experiência melhor.
            </p>
          </div>

          <div className="relative z-10 mt-8 flex items-end justify-between gap-6 lg:mt-0">
            <p className="max-w-[190px] text-xs font-medium leading-5 text-white/70">Plataforma de monitoria e desenvolvimento de equipes.</p>
            <div className="hidden w-40 shrink-0 sm:block lg:w-52">
              <img src="/images/headphone-icon.png" alt="Headset representando atendimento e escuta de qualidade" className="w-full object-contain drop-shadow-2xl" />
            </div>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center bg-white px-6 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#f26522]">Acesso seguro</p>
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-[#242424] sm:text-4xl">Bem-vindo de volta</h2>
              <p className="mt-3 text-sm leading-6 text-[#6b6b6b]">Entre para acompanhar a qualidade da sua operação.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="usuario" className="text-sm font-semibold text-[#242424]">Nome de usuário</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8b8b8b]" />
                  <Input
                    id="usuario"
                    autoFocus
                    autoComplete="off"
                    placeholder="Digite seu nome de usuário"
                    value={usuario}
                    onChange={(e) => { setUsuario(e.target.value); if (erro) setErro(null) }}
                    className="h-12 rounded-xl border-[#dededb] bg-[#fbfbfa] pl-11 text-[#242424] placeholder:text-[#a5a5a0] focus-visible:border-[#f26522] focus-visible:ring-[#f26522]/25"
                    aria-invalid={!!erro}
                    aria-describedby={erro ? "login-erro" : undefined}
                  />
                </div>
                {erro && <p id="login-erro" className="text-sm text-red-600">{erro}</p>}
              </div>

              {precisaSenha && (
                <div className="flex animate-in flex-col gap-2 fade-in slide-in-from-top-1 duration-300">
                  <Label htmlFor="senha" className="text-sm font-semibold text-[#242424]">Senha de administrador</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8b8b8b]" />
                    <Input
                      id="senha"
                      type={mostrarSenha ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Digite sua senha"
                      value={senha}
                      onChange={(e) => { setSenha(e.target.value); if (erro) setErro(null) }}
                      className="h-12 rounded-xl border-[#dededb] bg-[#fbfbfa] px-11 text-[#242424] placeholder:text-[#a5a5a0] focus-visible:border-[#f26522] focus-visible:ring-[#f26522]/25"
                      aria-invalid={!!erro}
                    />
                    <button type="button" onClick={() => setMostrarSenha((v) => !v)} aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#8b8b8b] hover:text-[#242424]">
                      {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={carregando} className="mt-2 h-12 w-full gap-2 rounded-xl bg-[#242424] text-white hover:bg-[#f26522]">
                {carregando ? <><span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Entrando...</> : <>Entrar <ArrowRight className="size-4" /></>}
              </Button>
            </form>

            <div className="my-7 flex items-center gap-4"><span className="h-px flex-1 bg-[#e6e6e2]" /><span className="text-xs font-medium uppercase tracking-wider text-[#999993]">ou</span><span className="h-px flex-1 bg-[#e6e6e2]" /></div>

            <Button type="button" variant="outline" onClick={loginVisitante} disabled={carregando} className="h-12 w-full gap-2 rounded-xl border-[#dededb] bg-white text-[#242424] hover:border-[#f26522] hover:bg-[#fff4ee] hover:text-[#242424]">
              <Eye className="size-4" /> Acessar como visitante <ArrowRight className="size-4" />
            </Button>

            <div className="mt-6 flex items-start justify-center gap-2 text-center text-xs leading-5 text-[#8b8b86]"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#f26522]" /> Visitante tem acesso somente para visualizar e filtrar</div>
          </div>
        </section>
      </div>
    </main>
  )
}
