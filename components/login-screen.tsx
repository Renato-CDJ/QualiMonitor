"use client"

import { useState } from "react"
import { BarChart3, ArrowRight, User, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth"

export function LoginScreen() {
  const { login } = useAuth()
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
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-10">
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

      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="rounded-2xl border border-border bg-card/80 p-8 shadow-xl backdrop-blur-sm">
          {/* Marca */}
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform duration-300 hover:scale-105">
              <BarChart3 className="size-6" />
            </span>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight">QualiMonitor</h1>
              <p className="text-pretty text-sm text-muted-foreground">
                Acesse a plataforma de monitoria de qualidade
              </p>
            </div>
          </div>

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
                  placeholder="Ex.: Renjesus"
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

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Acesso somente com nome de usuário
          </div>
        </div>
      </div>
    </main>
  )
}
