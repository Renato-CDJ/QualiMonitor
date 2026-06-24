"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Wallet, ArrowRight, LayoutGrid, LogOut, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { useQualityData } from "@/lib/use-quality-data"
import { cn } from "@/lib/utils"

export function CarteiraSelect() {
  const router = useRouter()
  const { user, selecionarCarteira, logout } = useAuth()
  const { monitorias, ready } = useQualityData()

  const carteiras = useMemo(() => {
    const mapa = new Map<string, { total: number; soma: number }>()
    for (const m of monitorias) {
      const atual = mapa.get(m.carteira) ?? { total: 0, soma: 0 }
      atual.total += 1
      atual.soma += m.nota
      mapa.set(m.carteira, atual)
    }
    return Array.from(mapa.entries())
      .map(([nome, v]) => ({
        nome,
        total: v.total,
        media: v.total ? Math.round(v.soma / v.total) : 0,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome))
  }, [monitorias])

  function escolher(c: string) {
    selecionarCarteira(c)
    router.push("/")
  }

  const primeiroNome = user?.nome.split(" ")[0] ?? ""

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 size-80 animate-pulse rounded-full bg-primary/10 blur-3xl [animation-duration:7s]" />
        <div className="absolute -bottom-32 -right-20 size-96 animate-pulse rounded-full bg-chart-2/10 blur-3xl [animation-duration:9s]" />
      </div>

      <div className="relative w-full max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <LayoutGrid className="size-5" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Olá, {primeiroNome}
          </h1>
          <p className="text-pretty text-sm text-muted-foreground">
            Selecione uma carteira para carregar as informações do dashboard.
          </p>
        </div>

        {!ready ? (
          <p className="text-center text-sm text-muted-foreground">Carregando carteiras...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Todas as carteiras */}
            <button
              type="button"
              onClick={() => escolher("todas")}
              className={cn(
                "group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-primary/30 bg-card p-5 text-left",
                "shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              {/* brilho de destaque no hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-primary/20 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
              />
              <div className="flex items-start justify-between">
                <span className="relative flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30 ring-4 ring-primary/15 transition-transform duration-300 group-hover:scale-105">
                  <LayoutGrid className="size-5" />
                </span>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  Geral
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold leading-tight">Todas as carteiras</p>
                <p className="text-xs text-muted-foreground">Visão consolidada de todas as carteiras</p>
              </div>
              <span className="mt-auto flex items-center justify-between border-t border-border/60 pt-3 text-sm font-medium text-primary">
                Acessar
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </span>
            </button>

            {carteiras.map((c, i) => {
              const tom =
                c.media >= 80
                  ? { texto: "text-chart-2", fundo: "bg-chart-2/10", ponto: "bg-chart-2" }
                  : c.media >= 60
                    ? { texto: "text-primary", fundo: "bg-primary/10", ponto: "bg-primary" }
                    : { texto: "text-destructive", fundo: "bg-destructive/10", ponto: "bg-destructive" }
              return (
                <button
                  key={c.nome}
                  type="button"
                  onClick={() => escolher(c.nome)}
                  style={{ animationDelay: `${(i + 1) * 60}ms` }}
                  className={cn(
                    "group relative flex animate-in fade-in flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 text-left fill-mode-both",
                    "shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  {/* brilho de destaque no hover */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-primary/15 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <div className="flex items-start justify-between">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-foreground ring-4 ring-secondary/40 transition-transform duration-300 group-hover:scale-105">
                      <Wallet className="size-5" />
                    </span>
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", tom.fundo, tom.texto)}>
                      <span className={cn("size-1.5 rounded-full", tom.ponto)} />
                      Média {c.media}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold leading-tight">{c.nome}</p>
                    <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ClipboardList className="size-3.5" />
                      {c.total} monitorias registradas
                    </p>
                  </div>
                  <span className="mt-auto flex items-center justify-between border-t border-border/60 pt-3 text-sm font-medium text-primary">
                    Acessar
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Button variant="ghost" size="sm" onClick={logout} className="gap-2 text-muted-foreground">
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </div>
    </main>
  )
}
