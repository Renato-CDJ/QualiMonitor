"use client"

import { createContext, useContext, useState } from "react"

interface NotasContextValue {
  mostrarTodas: boolean
  setMostrarTodas: (v: boolean) => void
}

const NotasContext = createContext<NotasContextValue>({
  mostrarTodas: false,
  setMostrarTodas: () => {},
})

export function NotasProvider({ children }: { children: React.ReactNode }) {
  const [mostrarTodas, setMostrarTodas] = useState(false)
  return (
    <NotasContext.Provider value={{ mostrarTodas, setMostrarTodas }}>
      {children}
    </NotasContext.Provider>
  )
}

export function useNotasGlobais() {
  return useContext(NotasContext)
}
