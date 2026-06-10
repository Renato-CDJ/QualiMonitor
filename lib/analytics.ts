import type { Monitoria } from "./types"

export function notaColorClass(nota: number) {
  if (nota >= 90) return "text-chart-5"
  if (nota >= 75) return "text-chart-3"
  if (nota >= 60) return "text-chart-3"
  return "text-destructive"
}

export function notaBadgeClass(nota: number) {
  if (nota >= 90) return "bg-chart-5/15 text-chart-5 border-chart-5/30"
  if (nota >= 75) return "bg-chart-3/15 text-chart-3 border-chart-3/30"
  if (nota >= 60) return "bg-chart-3/15 text-chart-3 border-chart-3/30"
  return "bg-destructive/15 text-destructive border-destructive/30"
}

export function faixaNota(nota: number) {
  if (nota >= 90) return "Excelente"
  if (nota >= 75) return "Bom"
  if (nota >= 60) return "Regular"
  return "Crítico"
}

export function media(valores: number[]) {
  if (!valores.length) return 0
  return valores.reduce((a, b) => a + b, 0) / valores.length
}

/** Calcula um quartil (0..1) usando interpolação linear */
export function quantil(valores: number[], q: number) {
  if (!valores.length) return 0
  const arr = [...valores].sort((a, b) => a - b)
  const pos = (arr.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (arr[base + 1] !== undefined) {
    return arr[base] + rest * (arr[base + 1] - arr[base])
  }
  return arr[base]
}

export function resumoQuartis(notas: number[]) {
  const arr = [...notas].sort((a, b) => a - b)
  return {
    min: arr[0] ?? 0,
    q1: quantil(arr, 0.25),
    mediana: quantil(arr, 0.5),
    q3: quantil(arr, 0.75),
    max: arr[arr.length - 1] ?? 0,
  }
}

export function formatarData(iso: string) {
  const [y, m, d] = iso.split("-")
  if (!y) return iso
  return `${d}/${m}/${y}`
}

export function dentroDoPeriodo(m: Monitoria, inicio?: string, fim?: string) {
  if (inicio && m.data < inicio) return false
  if (fim && m.data > fim) return false
  return true
}
