"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { LoginScreen } from "@/components/login-screen"
import { CarteiraSelect } from "@/components/carteira-select"
import { TopNav } from "@/components/top-nav"

// Rotas de edição/cadastro bloqueadas para o perfil visitante.
const ROTAS_RESTRITAS = [
  "/nova-monitoria",
  "/checklists",
  "/feedback",
  "/resultado-monitor",
  "/exportar-relatorio",
]

function rotaRestrita(pathname: string) {
  return ROTAS_RESTRITAS.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`))
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, user, carteira, isVisitante } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const bloqueado = isVisitante && rotaRestrita(pathname)

  // Visitante que acessa rota restrita diretamente é redirecionado ao dashboard.
  useEffect(() => {
    if (bloqueado) router.replace("/")
  }, [bloqueado, router])

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <span className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  if (!user) return <LoginScreen />
  if (!carteira) return <CarteiraSelect />

  if (bloqueado) {
    return (
      <>
        <TopNav />
        <div className="flex min-h-[60svh] items-center justify-center bg-background px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Esta área é restrita. Redirecionando para o painel...
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <TopNav />
      {children}
    </>
  )
}
