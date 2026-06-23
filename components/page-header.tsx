import { Info } from "lucide-react"

interface Props {
  title: string
  description?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, children }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {description ? (
          <div className="group relative inline-block">
            <h1
              tabIndex={0}
              role="button"
              aria-label={`${title}. Passe o mouse para ver a descrição`}
              className="flex cursor-help items-center gap-1.5 text-2xl font-semibold tracking-tight text-balance outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
            >
              {title}
              <Info className="size-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />
            </h1>
            <div
              role="tooltip"
              className="pointer-events-none absolute left-0 top-full z-50 mt-2 hidden w-max max-w-md rounded-md border bg-popover p-3 text-pretty text-sm leading-relaxed text-popover-foreground shadow-md group-hover:block group-focus-within:block"
            >
              {description}
            </div>
          </div>
        ) : (
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
