"use client"

import { useState } from "react"
import { FiltrosAnaliticos, filtrarMonitorias, type FiltrosAnaliticosState } from "@/components/filtros-analiticos"
import { useQualityData } from "@/lib/use-quality-data"
import { AnaliseCategoria } from "@/components/analise-categoria"
import { AnalisOperadorComparacao } from "@/components/analise-operador-comparacao"

export function AnaliseCategoriaView() {
  const { monitorias, checklists } = useQualityData()
  const [filtrosAnaliticos, setFiltrosAnaliticos] = useState<FiltrosAnaliticosState>({
    carteira: "todas",
    checklistId: "todos",
    tabulacao: "todas",
  })
  const monitoriasFiltradas = filtrarMonitorias(monitorias, filtrosAnaliticos)

  return (
    <div className="flex flex-col gap-6">
      <FiltrosAnaliticos value={filtrosAnaliticos} onChange={setFiltrosAnaliticos} />

      <AnaliseCategoria monitorias={monitoriasFiltradas} checklists={checklists} carteira={filtrosAnaliticos.carteira} />
      <AnalisOperadorComparacao
        monitorias={monitoriasFiltradas}
        checklists={checklists}
        carteira={filtrosAnaliticos.carteira}
      />
    </div>
  )
}
