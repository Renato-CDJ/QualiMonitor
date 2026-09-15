"use client"

import { useCallback, useEffect, useState } from "react"
import { store } from "./store"
import type {
  Carteira,
  Checklist,
  Monitoria,
  Operador,
  FeedbackInvertido,
  RecebimentoOperador,
  VinculoTabulacao,
} from "./types"

export function useQualityData() {
  const [carteiras, setCarteirasState] = useState<Carteira[]>([])
  const [checklists, setChecklistsState] = useState<Checklist[]>([])
  const [operadores, setOperadoresState] = useState<Operador[]>([])
  const [monitorias, setMonitoriasState] = useState<Monitoria[]>([])
  const [feedbacks, setFeedbacksState] = useState<FeedbackInvertido[]>([])
  const [recebimentos, setRecebimentosState] = useState<RecebimentoOperador[]>([])
  const [vinculos, setVinculosState] = useState<VinculoTabulacao[]>([])
  const [tabulacoes, setTabulacoesState] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  const refresh = useCallback(() => {
    setCarteirasState(store.getCarteiras())
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
    // A fonte de dados da aplicação é o cache persistido no localStorage.
    store
      .hydrate()
      .catch((err) => console.error("[v0] Falha ao carregar dados locais:", err))
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

  return { carteiras, checklists, operadores, monitorias, feedbacks, recebimentos, vinculos, tabulacoes, ready, refresh, store }
}
