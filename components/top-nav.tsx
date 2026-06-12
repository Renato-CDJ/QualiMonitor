"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ClipboardCheck, LayoutDashboard, ListChecks, BarChart3, GanttChartSquare, Users, MessageSquareReply } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/nova-monitoria", label: "Nova Monitoria", icon: ClipboardCheck },
  { href: "/checklists", label: "Editor de Checklist", icon: ListChecks },
  { href: "/analise-notas", label: "Análise de Notas", icon: GanttChartSquare },
  { href: "/operadores", label: "Operadores", icon: Users },
  { href: "/feedback", label: "Feedback", icon: MessageSquareReply },
]

export function TopNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-6 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BarChart3 className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">QualiMonitor</span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground md:inline">
            Dados locais (localStorage)
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
