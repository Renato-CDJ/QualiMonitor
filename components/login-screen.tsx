"use client"

import { useState } from "react"
import { ArrowRight, User, ShieldCheck, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth"
import { NeonTitle } from "@/components/neon-title"

export function LoginScreen() {
  const { login, loginVisitante } = useAuth()
  const [usuario, setUsuario] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)
    // pequena espera para a animação do botão, sem travar a UI
    setTimeout(() => {
      const res = login(usuario)
      if (!res.ok) {
        setErro(res.erro ?? "Não foi possível entrar.")
        setCarregando(false)
      }
    }, 450)
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-start overflow-hidden bg-background px-4 pb-10 pt-[18vh]">
      {/* Fundo decorativo com animação leve (apenas opacidade/transform suave) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 size-80 animate-pulse rounded-full bg-primary/10 blur-3xl [animation-duration:6s]" />
        <div className="absolute -bottom-32 -right-20 size-96 animate-pulse rounded-full bg-chart-2/10 blur-3xl [animation-duration:8s]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      {/* Título da marca fora da caixa, centralizado na tela, com efeito neon animado (SVG) */}
      <div className="mb-16 flex w-full select-none justify-center px-4 duration-500 animate-in fade-in slide-in-from-top-4">
        <NeonTitle text="QualiMonitor" />
      </div>

      <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">
        <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-xl backdrop-blur-sm">
          {/* Formulário */}
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="usuario" className="text-sm">
                Nome de usuário
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="usuario"
                  autoFocus
                  autoComplete="off"
                  placeholder="Digite seu nome de usuário"
                  value={usuario}
                  onChange={(e) => {
                    setUsuario(e.target.value)
                    if (erro) setErro(null)
                  }}
                  className="pl-9"
                  aria-invalid={!!erro}
                  aria-describedby={erro ? "login-erro" : undefined}
                />
              </div>
              {erro && (
                <p id="login-erro" className="animate-in fade-in slide-in-from-top-1 text-sm text-destructive">
                  {erro}
                </p>
              )}
            </div>

            <Button type="submit" disabled={carregando} className="group mt-1 gap-2">
              {carregando ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>

          {/* Divisor */}
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground">ou</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Acesso como visitante (somente leitura) */}
          <Button
            type="button"
            variant="outline"
            onClick={loginVisitante}
            disabled={carregando}
            className="group w-full gap-2"
          >
            <Eye className="size-4" />
            Acessar como Visitante
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Button>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 shrink-0" />
            Visitante tem acesso somente para visualizar e filtrar
          </div>
        </div>
      </div>
    </main>
  )
}
