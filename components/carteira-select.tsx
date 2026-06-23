"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Wallet, ArrowRight, LayoutGrid, LogOut, ClipboardList, TrendingUp } from "lucide-react"
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
                "group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 text-left",
                "shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <LayoutGrid className="size-5" />
              </span>
              <div className="space-y-0.5">
                <p className="font-medium">Todas as carteiras</p>
                <p className="text-xs text-muted-foreground">Visão consolidada geral</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
                Acessar
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </button>

            {carteiras.map((c, i) => (
              <button
                key={c.nome}
                type="button"
                onClick={() => escolher(c.nome)}
                style={{ animationDelay: `${(i + 1) * 60}ms` }}
                className={cn(
                  "group flex animate-in fade-in flex-col gap-3 rounded-xl border border-border bg-card p-5 text-left fill-mode-both",
                  "shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground">
                  <Wallet className="size-5" />
                </span>
                <div className="space-y-0.5">
                  <p className="font-medium">{c.nome}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <ClipboardList className="size-3.5" />
                      {c.total} monitorias
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <TrendingUp className="size-3.5" />
                      {c.media}
                    </span>
                  </div>
                </div>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Acessar
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </button>
            ))}
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
