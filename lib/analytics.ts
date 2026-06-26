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

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dia = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dia}`
}

/**
 * Normaliza diferentes formatos de data de admissão para ISO (YYYY-MM-DD).
 * Aceita: Date, número serial do Excel, "DD/MM/AAAA", "AAAA-MM-DD" e variações.
 * Retorna "" quando não consegue interpretar.
 */
export function parseAdmissao(valor: unknown): string {
  if (valor == null || valor === "") return ""

  // Já é um objeto Date
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return toISODate(valor)
  }

  // Número serial do Excel (dias desde 30/12/1899)
  if (typeof valor === "number" && Number.isFinite(valor)) {
    const base = new Date(Date.UTC(1899, 11, 30))
    base.setUTCDate(base.getUTCDate() + Math.round(valor))
    return toISODate(base)
  }

  const txt = String(valor).trim()
  if (!txt) return ""

  // DD/MM/AAAA ou DD-MM-AAAA
  const br = txt.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/)
  if (br) {
    const [, d, m, yRaw] = br
    const y = yRaw.length === 2 ? `20${yRaw}` : yRaw
    return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  }

  // AAAA-MM-DD (com possível horário)
  const iso = txt.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) {
    const [, y, m, d] = iso
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  }

  // Fallback: parser nativo
  const dt = new Date(txt)
  if (!isNaN(dt.getTime())) return toISODate(dt)

  return ""
}

/**
 * Calcula o tempo de empresa a partir da data de admissão (ISO).
 * Ex.: "1 ano e 1 mês", "3 meses", "2 anos", "Menos de 1 mês".
 */
export function tempoDeEmpresa(admissaoISO: string, ref: Date = new Date()): string {
  if (!admissaoISO) return "—"
  const [y, m, d] = admissaoISO.split("-").map(Number)
  if (!y || !m || !d) return "—"
  const inicio = new Date(y, m - 1, d)
  if (isNaN(inicio.getTime()) || inicio > ref) return "—"

  let anos = ref.getFullYear() - inicio.getFullYear()
  let meses = ref.getMonth() - inicio.getMonth()
  if (ref.getDate() < inicio.getDate()) meses--
  if (meses < 0) {
    anos--
    meses += 12
  }

  const partes: string[] = []
  if (anos > 0) partes.push(`${anos} ${anos === 1 ? "ano" : "anos"}`)
  if (meses > 0) partes.push(`${meses} ${meses === 1 ? "mês" : "meses"}`)
  if (partes.length === 0) return "Menos de 1 mês"
  return partes.join(" e ")
}

export function dentroDoPeriodo(m: Monitoria, inicio?: string, fim?: string) {
  if (inicio && m.data < inicio) return false
  if (fim && m.data > fim) return false
  return true
}
