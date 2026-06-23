"use client"

import { useAuth } from "@/lib/auth"
import { LoginScreen } from "@/components/login-screen"
import { CarteiraSelect } from "@/components/carteira-select"
import { TopNav } from "@/components/top-nav"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, user, carteira } = useAuth()

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <span className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  if (!user) return <LoginScreen />
  if (!carteira) return <CarteiraSelect />

  return (
    <>
      <TopNav />
      {children}
    </>
  )
}
