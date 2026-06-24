"use client"

import { useCallback, useEffect, useState } from "react"
import { store } from "./store"
import type {
  Checklist,
  Monitoria,
  Operador,
  FeedbackInvertido,
  RecebimentoOperador,
  VinculoTabulacao,
} from "./types"

export function useQualityData() {
  const [checklists, setChecklistsState] = useState<Checklist[]>([])
  const [operadores, setOperadoresState] = useState<Operador[]>([])
  const [monitorias, setMonitoriasState] = useState<Monitoria[]>([])
  const [feedbacks, setFeedbacksState] = useState<FeedbackInvertido[]>([])
  const [recebimentos, setRecebimentosState] = useState<RecebimentoOperador[]>([])
  const [vinculos, setVinculosState] = useState<VinculoTabulacao[]>([])
  const [tabulacoes, setTabulacoesState] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  const refresh = useCallback(() => {
    setChecklistsState(store.getChecklists())
    setOperadoresState(store.getOperadores())
    setMonitoriasState(store.getMonitorias())
    setFeedbacksState(store.getFeedbacks())
    setRecebimentosState(store.getRecebimentos())
    setVinculosState(store.getVinculos())
    setTabulacoesState(store.getTabulacoes())
  }, [])

  useEffect(() => {
    let ativo = true
    const handler = () => refresh()
    window.addEventListener("qm:update", handler)
    window.addEventListener("storage", handler)
    // Hidrata o cache a partir do Supabase e só então libera a UI.
    store
      .hydrate()
      .catch((err) => console.error("[v0] Falha ao hidratar dados:", err))
      .finally(() => {
        if (!ativo) return
        refresh()
        setReady(true)
      })
    return () => {
      ativo = false
      window.removeEventListener("qm:update", handler)
      window.removeEventListener("storage", handler)
    }
  }, [refresh])

  return { checklists, operadores, monitorias, feedbacks, recebimentos, vinculos, tabulacoes, ready, refresh, store }
}
