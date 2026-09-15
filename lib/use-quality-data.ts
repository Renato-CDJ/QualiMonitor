"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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
  const snapshotRef = useRef<{
    carteiras: Carteira[]
    checklists: Checklist[]
    operadores: Operador[]
    monitorias: Monitoria[]
    feedbacks: FeedbackInvertido[]
    recebimentos: RecebimentoOperador[]
    vinculos: VinculoTabulacao[]
    tabulacoes: string[]
  } | null>(null)

  const refresh = useCallback(() => {
    const next = {
      carteiras: store.getCarteiras(),
      checklists: store.getChecklists(),
      operadores: store.getOperadores(),
      monitorias: store.getMonitorias(),
      feedbacks: store.getFeedbacks(),
      recebimentos: store.getRecebimentos(),
      vinculos: store.getVinculos(),
      tabulacoes: store.getTabulacoes(),
    }
    const previous = snapshotRef.current
    if (previous) {
      const mudou = (Object.keys(next) as (keyof typeof next)[]).some((key) => next[key] !== previous[key])
      if (!mudou) return
    }
    snapshotRef.current = next
    setCarteirasState(next.carteiras)
    setChecklistsState(next.checklists)
    setOperadoresState(next.operadores)
    setMonitoriasState(next.monitorias)
    setFeedbacksState(next.feedbacks)
    setRecebimentosState(next.recebimentos)
    setVinculosState(next.vinculos)
    setTabulacoesState(next.tabulacoes)
  }, [])

  useEffect(() => {
    let ativo = true
    let frame: number | null = null
    const handler = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(() => {
        frame = null
        refresh()
      })
    }
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
      if (frame !== null) window.cancelAnimationFrame(frame)
    }
  }, [refresh])

  return { carteiras, checklists, operadores, monitorias, feedbacks, recebimentos, vinculos, tabulacoes, ready, refresh, store }
}
