"use client"

import { useMemo, useState } from "react"
import { Wallet } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useQualityData } from "@/lib/use-quality-data"
import { JornadaOperador } from "@/components/jornada-operador"

export function JornadaOperadorView() {
  const { monitorias, operadores } = useQualityData()
  const [carteiraFiltro, setCarteiraFiltro] = useState<string>("todas")

  const carteiras = useMemo(
    () => Array.from(new Set(monitorias.map((m) => m.carteira))).sort(),
    [monitorias],
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="carteira-filtro" className="text-xs text-muted-foreground">
            Carteira
          </Label>
          <Select value={carteiraFiltro} onValueChange={setCarteiraFiltro}>
            <SelectTrigger id="carteira-filtro" className="w-56">
              <span className="flex items-center gap-2">
                <Wallet className="size-4 text-muted-foreground" />
                <SelectValue placeholder="Todas as carteiras" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as carteiras</SelectItem>
              {carteiras.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <JornadaOperador monitorias={monitorias} operadores={operadores} carteira={carteiraFiltro} />
    </div>
  )
}
