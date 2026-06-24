"use client"

import { useEffect, useState } from "react"

const TEXTO = "Desenvolvido por: Renato Calixto de Jesus"
const VELOCIDADE_DIGITACAO = 90
const VELOCIDADE_APAGAR = 45
const PAUSA_COMPLETO = 1800
const PAUSA_VAZIO = 600

export function TypewriterCredit() {
  const [texto, setTexto] = useState("")
  const [apagando, setApagando] = useState(false)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (!apagando && texto === TEXTO) {
      timeout = setTimeout(() => setApagando(true), PAUSA_COMPLETO)
    } else if (apagando && texto === "") {
      timeout = setTimeout(() => setApagando(false), PAUSA_VAZIO)
    } else {
      timeout = setTimeout(
        () => {
          setTexto((atual) =>
            apagando ? atual.slice(0, -1) : TEXTO.slice(0, atual.length + 1),
          )
        },
        apagando ? VELOCIDADE_APAGAR : VELOCIDADE_DIGITACAO,
      )
    }

    return () => clearTimeout(timeout)
  }, [texto, apagando])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-10 flex justify-center px-4">
      <span className="flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm backdrop-blur-sm">
        <span className="font-medium text-foreground" aria-label={TEXTO}>
          {texto}
        </span>
        <span className="inline-block h-3.5 w-px animate-pulse bg-primary" aria-hidden="true" />
      </span>
    </div>
  )
}
