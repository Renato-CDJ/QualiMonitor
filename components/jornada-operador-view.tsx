"use client"

import { useState } from "react"
import { useQualityData } from "@/lib/use-quality-data"
import { JornadaOperador } from "@/components/jornada-operador"
import { FiltrosAnaliticos, filtrarMonitorias, type FiltrosAnaliticosState } from "@/components/filtros-analiticos"

export function JornadaOperadorView() {
  const { monitorias, operadores } = useQualityData()
  const [filtrosAnaliticos, setFiltrosAnaliticos] = useState<FiltrosAnaliticosState>({ carteira: "todas", checklistId: "todos", tabulacao: "todas" })
  const carteiraFiltro = filtrosAnaliticos.carteira

  return (
    <div className="flex flex-col gap-6">
      <FiltrosAnaliticos value={filtrosAnaliticos} onChange={setFiltrosAnaliticos} />

      <JornadaOperador monitorias={filtrarMonitorias(monitorias, filtrosAnaliticos)} operadores={operadores} carteira={carteiraFiltro} />
    </div>
  )
}
