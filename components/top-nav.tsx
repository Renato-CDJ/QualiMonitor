"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
  BarChart3,
  GanttChartSquare,
  MessageSquareReply,
  Grid2x2,
  Lightbulb,
  Wallet,
  UserCheck,
  LineChart,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const MENUS: { id: string; label: string; icon: React.ComponentType<{ className?: string }>; items: NavItem[] }[] = [
  {
    id: "monitoria",
    label: "Monitoria",
    icon: ClipboardCheck,
    items: [
      { href: "/nova-monitoria", label: "Nova Monitoria", icon: ClipboardCheck },
      { href: "/checklists", label: "Editor de Checklist", icon: ListChecks },
      { href: "/feedback", label: "Feedback", icon: MessageSquareReply },
      { href: "/resultado-monitor", label: "Resultado Monitor", icon: UserCheck },
    ],
  },
  {
    id: "analitico",
    label: "Analítico",
    icon: LineChart,
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/notas-carteira", label: "Notas Carteira", icon: Wallet },
      { href: "/analise-notas", label: "Análise de Notas", icon: GanttChartSquare },
      { href: "/insights", label: "Insights", icon: Lightbulb },
      { href: "/quadrante", label: "Quadrante", icon: Grid2x2 },
    ],
  },
]

function isItemActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}

export function TopNav() {
  const pathname = usePathname()

  // Determine which menu owns the current route.
  const menuForPath =
    MENUS.find((menu) => menu.items.some((item) => isItemActive(item.href, pathname)))?.id ?? MENUS[0].id

  const [openMenu, setOpenMenu] = useState<string>(menuForPath)

  // Keep the active menu in sync when navigating between sections.
  useEffect(() => {
    setOpenMenu(menuForPath)
  }, [menuForPath])

  const activeMenu = MENUS.find((menu) => menu.id === openMenu) ?? MENUS[0]

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background shadow-sm">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6">
        {/* Primary row: brand + menus */}
        <div className="flex h-14 items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BarChart3 className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">QualiMonitor</span>
          </Link>

          <nav className="flex items-center gap-1">
            {MENUS.map((menu) => {
              const Icon = menu.icon
              const isOpen = menu.id === openMenu
              return (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => setOpenMenu(menu.id)}
                  aria-pressed={isOpen}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isOpen
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {menu.label}
                  <ChevronDown
                    className={cn("size-3.5 transition-transform", isOpen ? "rotate-180" : "rotate-0")}
                  />
                </button>
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

        {/* Secondary row: tabs of the selected menu */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-border/60 py-2">
          {activeMenu.items.map((item) => {
            const active = isItemActive(item.href, pathname)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
