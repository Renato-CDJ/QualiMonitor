"use client"

import type * as React from "react"
import { Info } from "lucide-react"
import { CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CardTitleHintProps {
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

/**
 * Título de card/tabela/gráfico cuja descrição fica oculta por padrão
 * e só aparece (como tooltip) ao passar o mouse ou focar o título.
 */
export function CardTitleHint({ title, description, icon, className }: CardTitleHintProps) {
  if (!description) {
    return (
      <CardTitle className={cn("flex items-center gap-2 text-base", className)}>
        {icon}
        {title}
      </CardTitle>
    )
  }

  return (
    <div className="group relative w-fit">
      <CardTitle
        tabIndex={0}
        role="button"
        aria-label="Passe o mouse ou foque para ver a descrição"
        className={cn(
          "flex w-fit cursor-help items-center gap-1.5 rounded-sm text-base outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className,
        )}
      >
        {icon}
        {title}
        <Info className="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
      </CardTitle>
      <div
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-50 mt-2 hidden w-max max-w-sm rounded-md border bg-popover p-3 text-pretty text-xs leading-relaxed text-popover-foreground shadow-md group-hover:block group-focus-within:block"
      >
        {description}
      </div>
    </div>
  )
}
