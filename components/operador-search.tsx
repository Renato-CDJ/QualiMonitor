"use client"

import { useMemo, useRef, useState } from "react"
import { Check, Search, User } from "lucide-react"
import type { Operador } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props {
  operadores: Operador[]
  value: string | null
  onChange: (operadorId: string) => void
  filtroCarteira?: string
}

export function OperadorSearch({ operadores, value, onChange, filtroCarteira }: Props) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selecionado = operadores.find((o) => o.id === value) || null

  const resultados = useMemo(() => {
    const base = filtroCarteira
      ? operadores.filter((o) => o.carteira === filtroCarteira)
      : operadores
    const q = query.trim().toLowerCase()
    if (!q) return base.slice(0, 8)
    return base.filter((o) => o.nome.toLowerCase().includes(q)).slice(0, 8)
  }, [operadores, query, filtroCarteira])

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-md border border-input bg-secondary/40 px-3">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={open ? query : selecionado ? selecionado.nome : query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            setOpen(true)
            setQuery("")
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar operador por nome..."
          className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
          {resultados.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              Nenhum operador encontrado.
            </p>
          ) : (
            <ul className="max-h-64 overflow-auto py-1">
              {resultados.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      onChange(o.id)
                      setOpen(false)
                      setQuery("")
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-secondary",
                      o.id === value && "bg-secondary",
                    )}
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                      <User className="size-3.5" />
                    </span>
                    <span className="flex flex-col">
                      <span className="font-medium leading-tight">{o.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        {o.carteira}
                      </span>
                    </span>
                    {o.id === value && <Check className="ml-auto size-4 text-primary" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
