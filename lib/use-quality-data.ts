"use client"

import { useCallback, useEffect, useState } from "react"
import { ensureSeed, store } from "./store"
import type { Checklist, Monitoria, Operador } from "./types"

export function useQualityData() {
  const [checklists, setChecklistsState] = useState<Checklist[]>([])
  const [operadores, setOperadoresState] = useState<Operador[]>([])
  const [monitorias, setMonitoriasState] = useState<Monitoria[]>([])
  const [ready, setReady] = useState(false)

  const refresh = useCallback(() => {
    setChecklistsState(store.getChecklists())
    setOperadoresState(store.getOperadores())
    setMonitoriasState(store.getMonitorias())
  }, [])

  useEffect(() => {
    ensureSeed()
    refresh()
    setReady(true)
    const handler = () => refresh()
    window.addEventListener("qm:update", handler)
    window.addEventListener("storage", handler)
    return () => {
      window.removeEventListener("qm:update", handler)
      window.removeEventListener("storage", handler)
    }
  }, [refresh])

  return { checklists, operadores, monitorias, ready, refresh, store }
}
