import type { Checklist, Monitoria, RecebimentoOperador, SiglaQuadrante } from "./types"
import { media, resumoQuartis } from "./analytics"

export type Periodicidade = "diario" | "semanal" | "mensal"

function chaveSemana(iso: string) {
  const d = new Date(iso + "T00:00:00")
  const onejan = new Date(d.getFullYear(), 0, 1)
  const dias = Math.floor((d.getTime() - onejan.getTime()) / 86400000)
  const semana = Math.ceil((dias + onejan.getDay() + 1) / 7)
  return `${d.getFullYear()}-S${String(semana).padStart(2, "0")}`
}

function chaveMes(iso: string) {
  return iso.slice(0, 7) // YYYY-MM
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

export function rotuloPeriodo(chave: string, p: Periodicidade) {
  if (p === "mensal") {
    const [, m] = chave.split("-")
    return MESES[Number(m) - 1] ?? chave
  }
  if (p === "semanal") return chave.split("-")[1] ?? chave
  // diario YYYY-MM-DD
  const [, m, d] = chave.split("-")
  return `${d}/${m}`
}

export function serieTemporal(monitorias: Monitoria[], p: Periodicidade) {
  const grupos = new Map<string, number[]>()
  for (const m of monitorias) {
    const chave =
      p === "mensal" ? chaveMes(m.data) : p === "semanal" ? chaveSemana(m.data) : m.data
    if (!grupos.has(chave)) grupos.set(chave, [])
    grupos.get(chave)!.push(m.nota)
  }
  return Array.from(grupos.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, notas]) => ({
      chave,
      rotulo: rotuloPeriodo(chave, p),
      nota: Math.round(media(notas) * 10) / 10,
      volume: notas.length,
    }))
}

export function porCarteira(monitorias: Monitoria[]) {
  const grupos = new Map<string, number[]>()
  for (const m of monitorias) {
    if (!grupos.has(m.carteira)) grupos.set(m.carteira, [])
    grupos.get(m.carteira)!.push(m.nota)
  }
  return Array.from(grupos.entries())
    .map(([carteira, notas]) => ({
      carteira,
      nota: Math.round(media(notas) * 10) / 10,
      volume: notas.length,
    }))
    .sort((a, b) => b.nota - a.nota)
}

export function porOperador(monitorias: Monitoria[]) {
  const grupos = new Map<string, number[]>()
  for (const m of monitorias) {
    if (!grupos.has(m.operadorNome)) grupos.set(m.operadorNome, [])
    grupos.get(m.operadorNome)!.push(m.nota)
  }
  return Array.from(grupos.entries())
    .map(([operador, notas]) => ({
      operador,
      nota: Math.round(media(notas) * 10) / 10,
      volume: notas.length,
      quartis: resumoQuartis(notas),
      // Quadrantes por faixa de nota:
      // Q1 = Excelente (90+), Q2 = Bom (75-89), Q3 = Regular (60-74), Q4 = Crítico (<60)
      faixas: {
        excelente: notas.filter((n) => n >= 90).length,
        bom: notas.filter((n) => n >= 75 && n < 90).length,
        regular: notas.filter((n) => n >= 60 && n < 75).length,
        critico: notas.filter((n) => n < 60).length,
      },
    }))
    .sort((a, b) => b.nota - a.nota)
}

export interface ResumoOperador {
  operador: string
  carteira: string
  volume: number // qtd de monitorias
  nota: number // nota média
  conforme: number
  inconforme: number
  na: number
  avaliados: number // conforme + inconforme
  pctConforme: number
  pctInconforme: number
  criticos: number // qtd de monitorias com nota < 60
}

/**
 * Resumo consolidado por operador a partir das monitorias já filtradas.
 * Inclui nota média, volume, apontamentos conformes/inconformes/N.A. e
 * quantidade de notas críticas (abaixo de 60). % calculados sobre os
 * itens avaliados (exclui N.A.).
 */
export function resumoOperadores(monitorias: Monitoria[]): ResumoOperador[] {
  const grupos = new Map<
    string,
    { notas: number[]; carteira: string; conforme: number; inconforme: number; na: number; criticos: number }
  >()
  for (const m of monitorias) {
    if (!grupos.has(m.operadorNome)) {
      grupos.set(m.operadorNome, {
        notas: [],
        carteira: m.carteira,
        conforme: 0,
        inconforme: 0,
        na: 0,
        criticos: 0,
      })
    }
    const g = grupos.get(m.operadorNome)!
    g.notas.push(m.nota)
    if (m.nota < 60) g.criticos++
    for (const ap of m.apontamentos) {
      if (ap.status === "conforme") g.conforme++
      else if (ap.status === "inconforme") g.inconforme++
      else g.na++
    }
  }
  const round1 = (n: number) => Math.round(n * 10) / 10
  return Array.from(grupos.entries())
    .map(([operador, g]) => {
      const avaliados = g.conforme + g.inconforme
      return {
        operador,
        carteira: g.carteira,
        volume: g.notas.length,
        nota: round1(media(g.notas)),
        conforme: g.conforme,
        inconforme: g.inconforme,
        na: g.na,
        avaliados,
        pctConforme: avaliados ? round1((g.conforme / avaliados) * 100) : 0,
        pctInconforme: avaliados ? round1((g.inconforme / avaliados) * 100) : 0,
        criticos: g.criticos,
      }
    })
    .sort((a, b) => b.nota - a.nota)
}

export function porMonitor(monitorias: Monitoria[]) {
  const grupos = new Map<string, number[]>()
  for (const m of monitorias) {
    if (!grupos.has(m.monitor)) grupos.set(m.monitor, [])
    grupos.get(m.monitor)!.push(m.nota)
  }
  return Array.from(grupos.entries())
    .map(([monitor, notas]) => ({
      monitor,
      nota: Math.round(media(notas) * 10) / 10,
      volume: notas.length,
    }))
    .sort((a, b) => b.nota - a.nota)
}

export interface ConformidadeMonitor {
  monitor: string
  volume: number
  nota: number
  conforme: number
  inconforme: number
  na: number
  avaliados: number
  pctConforme: number
  pctInconforme: number
}

/**
 * Consolida, por monitor, a quantidade de itens conformes/inconformes/N.A.
 * apontados em suas monitorias, além da nota média e do volume.
 * % calculados sobre os itens avaliados (exclui N.A.).
 */
export function conformidadePorMonitor(monitorias: Monitoria[]): ConformidadeMonitor[] {
  const grupos = new Map<
    string,
    { notas: number[]; conforme: number; inconforme: number; na: number }
  >()
  for (const m of monitorias) {
    if (!grupos.has(m.monitor)) {
      grupos.set(m.monitor, { notas: [], conforme: 0, inconforme: 0, na: 0 })
    }
    const g = grupos.get(m.monitor)!
    g.notas.push(m.nota)
    for (const ap of m.apontamentos) {
      if (ap.status === "conforme") g.conforme++
      else if (ap.status === "inconforme") g.inconforme++
      else g.na++
    }
  }
  const round1 = (n: number) => Math.round(n * 10) / 10
  return Array.from(grupos.entries())
    .map(([monitor, g]) => {
      const avaliados = g.conforme + g.inconforme
      return {
        monitor,
        volume: g.notas.length,
        nota: round1(media(g.notas)),
        conforme: g.conforme,
        inconforme: g.inconforme,
        na: g.na,
        avaliados,
        pctConforme: avaliados ? round1((g.conforme / avaliados) * 100) : 0,
        pctInconforme: avaliados ? round1((g.inconforme / avaliados) * 100) : 0,
      }
    })
    .sort((a, b) => b.nota - a.nota)
}

export function porTabulacao(monitorias: Monitoria[]) {
  const grupos = new Map<string, number>()
  for (const m of monitorias) {
    grupos.set(m.tabulacao, (grupos.get(m.tabulacao) ?? 0) + 1)
  }
  return Array.from(grupos.entries())
    .map(([tabulacao, qtd]) => ({ tabulacao, qtd }))
    .sort((a, b) => b.qtd - a.qtd)
}

export function distribuicaoFaixas(monitorias: Monitoria[]) {
  const faixas = [
    { faixa: "Crítico (<60)", min: 0, max: 59.9999, qtd: 0 },
    { faixa: "Regular (60-74)", min: 60, max: 74.9999, qtd: 0 },
    { faixa: "Bom (75-89)", min: 75, max: 89.9999, qtd: 0 },
    { faixa: "Excelente (90+)", min: 90, max: 100, qtd: 0 },
  ]
  for (const m of monitorias) {
    const f = faixas.find((x) => m.nota >= x.min && m.nota <= x.max)
    if (f) f.qtd++
  }
  return faixas
}

/** Histograma de notas em faixas de 10 pontos (0-9, 10-19, ... 90-100) */
export function histogramaNotas(monitorias: Monitoria[]) {
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    faixa: i === 9 ? "90-100" : `${i * 10}-${i * 10 + 9}`,
    min: i * 10,
    max: i === 9 ? 100 : i * 10 + 9.9999,
    qtd: 0,
  }))
  for (const m of monitorias) {
    const b = buckets.find((x) => m.nota >= x.min && m.nota <= x.max)
    if (b) b.qtd++
  }
  return buckets
}

/** Resumo estatístico por carteira (quartis + média) para boxplots */
export function quartisPorCarteira(monitorias: Monitoria[]) {
  const grupos = new Map<string, number[]>()
  for (const m of monitorias) {
    if (!grupos.has(m.carteira)) grupos.set(m.carteira, [])
    grupos.get(m.carteira)!.push(m.nota)
  }
  return Array.from(grupos.entries())
    .map(([carteira, notas]) => {
      const q = resumoQuartis(notas)
      return {
        carteira,
        volume: notas.length,
        media: Math.round(media(notas) * 10) / 10,
        ...q,
      }
    })
    .sort((a, b) => b.mediana - a.mediana)
}

/** Pareto dos itens mais reprovados (inconformes) */
export function paretoItens(monitorias: Monitoria[], checklists: Checklist[]) {
  const mapa = new Map<string, { texto: string; qtd: number }>()
  const itemTexto = (id: string) => {
    for (const c of checklists) {
      const it = c.itens.find((i) => i.id === id)
      if (it) return it.texto
    }
    return id
  }
  for (const m of monitorias) {
    for (const ap of m.apontamentos) {
      if (ap.status !== "inconforme") continue
      const texto = itemTexto(ap.itemId)
      const atual = mapa.get(texto) ?? { texto, qtd: 0 }
      atual.qtd++
      mapa.set(texto, atual)
    }
  }
  const ordenado = Array.from(mapa.values()).sort((a, b) => b.qtd - a.qtd).slice(0, 8)
  const total = ordenado.reduce((s, x) => s + x.qtd, 0)
  let acum = 0
  return ordenado.map((x) => {
    acum += x.qtd
    return {
      item: x.texto.length > 28 ? x.texto.slice(0, 28) + "…" : x.texto,
      itemCompleto: x.texto,
      qtd: x.qtd,
      acumulado: total ? Math.round((acum / total) * 1000) / 10 : 0,
    }
  })
}

export interface ItemAderencia {
  itemId: string
  texto: string
  carteira: string
  critico: boolean
  conforme: number
  inconforme: number
  na: number
  total: number // total de apontamentos (inclui N.A.)
  avaliados: number // conforme + inconforme (exclui N.A.)
  pctConforme: number // conforme / avaliados
  pctInconforme: number // inconforme / avaliados
  pctNa: number // na / total
}

/**
 * Aderência por item do checklist. Para cada item conta quantas vezes foi
 * marcado como Conforme, Inconforme e Não se aplica, calculando os percentuais.
 * - % Conforme e % Inconforme usam como base os itens avaliados (exclui N.A.)
 * - % N.A. usa como base o total de apontamentos do item
 */
export function aderenciaItens(monitorias: Monitoria[], checklists: Checklist[]): ItemAderencia[] {
  const meta = new Map<string, { texto: string; carteira: string; critico: boolean }>()
  for (const c of checklists) {
    for (const it of c.itens) {
      if (!meta.has(it.id)) {
        meta.set(it.id, { texto: it.texto, carteira: c.carteira, critico: !!it.critico })
      }
    }
  }

  const mapa = new Map<string, { conforme: number; inconforme: number; na: number }>()
  for (const m of monitorias) {
    for (const ap of m.apontamentos) {
      const atual = mapa.get(ap.itemId) ?? { conforme: 0, inconforme: 0, na: 0 }
      if (ap.status === "conforme") atual.conforme++
      else if (ap.status === "inconforme") atual.inconforme++
      else atual.na++
      mapa.set(ap.itemId, atual)
    }
  }

  const round1 = (n: number) => Math.round(n * 10) / 10
  return Array.from(mapa.entries())
    .map(([itemId, c]) => {
      const info = meta.get(itemId)
      const total = c.conforme + c.inconforme + c.na
      const avaliados = c.conforme + c.inconforme
      return {
        itemId,
        texto: info?.texto ?? itemId,
        carteira: info?.carteira ?? "—",
        critico: info?.critico ?? false,
        conforme: c.conforme,
        inconforme: c.inconforme,
        na: c.na,
        total,
        avaliados,
        pctConforme: avaliados ? round1((c.conforme / avaliados) * 100) : 0,
        pctInconforme: avaliados ? round1((c.inconforme / avaliados) * 100) : 0,
        pctNa: total ? round1((c.na / total) * 100) : 0,
      }
    })
    .sort((a, b) => b.pctConforme - a.pctConforme)
}

export interface ConformidadeCarteira {
  carteira: string
  volume: number // qtd de monitorias
  nota: number // nota média
  conforme: number
  inconforme: number
  na: number
  avaliados: number // conforme + inconforme
  pctConforme: number
  pctInconforme: number
}

/**
 * Ranking de carteiras por conformidade/inconformidade dos apontamentos.
 * Considera todos os itens apontados nas monitorias de cada carteira.
 * % são calculados sobre os itens avaliados (exclui N.A.).
 */
export function conformidadePorCarteira(monitorias: Monitoria[]): ConformidadeCarteira[] {
  const grupos = new Map<
    string,
    { notas: number[]; conforme: number; inconforme: number; na: number }
  >()
  for (const m of monitorias) {
    if (!grupos.has(m.carteira)) {
      grupos.set(m.carteira, { notas: [], conforme: 0, inconforme: 0, na: 0 })
    }
    const g = grupos.get(m.carteira)!
    g.notas.push(m.nota)
    for (const ap of m.apontamentos) {
      if (ap.status === "conforme") g.conforme++
      else if (ap.status === "inconforme") g.inconforme++
      else g.na++
    }
  }
  const round1 = (n: number) => Math.round(n * 10) / 10
  return Array.from(grupos.entries())
    .map(([carteira, g]) => {
      const avaliados = g.conforme + g.inconforme
      return {
        carteira,
        volume: g.notas.length,
        nota: round1(media(g.notas)),
        conforme: g.conforme,
        inconforme: g.inconforme,
        na: g.na,
        avaliados,
        pctConforme: avaliados ? round1((g.conforme / avaliados) * 100) : 0,
        pctInconforme: avaliados ? round1((g.inconforme / avaliados) * 100) : 0,
      }
    })
    .sort((a, b) => b.pctConforme - a.pctConforme)
}

export interface ItemCategoria {
  itemId: string
  texto: string
  critico: boolean
  conforme: number
  inconforme: number
  na: number
  qtd: number // avaliados (conforme + inconforme)
  pctConforme: number
  pctInconforme: number
}

export interface BlocoCategoria {
  bloco: string
  conforme: number
  inconforme: number
  na: number
  qtd: number // soma de avaliados do bloco
  pctConforme: number
  pctInconforme: number
  itens: ItemCategoria[]
}

const SEM_BLOCO = "Sem bloco"

/**
 * Análise por Categoria do Checklist: agrupa os apontamentos por bloco/categoria
 * e, dentro de cada bloco, por item. Para cada nível calcula a quantidade de
 * avaliações (conforme + inconforme, exclui N.A.) e os percentuais de conformidade.
 * Opcionalmente filtra por carteira.
 */
export function analiseCategoria(
  monitorias: Monitoria[],
  checklists: Checklist[],
  carteira?: string,
): BlocoCategoria[] {
  // meta: itemId -> { texto, bloco, critico, carteira }
  const meta = new Map<
    string,
    { texto: string; bloco: string; critico: boolean; carteira: string }
  >()
  for (const c of checklists) {
    for (const it of c.itens) {
      if (!meta.has(it.id)) {
        meta.set(it.id, {
          texto: it.texto,
          bloco: it.bloco?.trim() || SEM_BLOCO,
          critico: !!it.critico,
          carteira: c.carteira,
        })
      }
    }
  }

  const contagem = new Map<string, { conforme: number; inconforme: number; na: number }>()
  for (const m of monitorias) {
    if (carteira && carteira !== "todas" && m.carteira !== carteira) continue
    for (const ap of m.apontamentos) {
      const atual = contagem.get(ap.itemId) ?? { conforme: 0, inconforme: 0, na: 0 }
      if (ap.status === "conforme") atual.conforme++
      else if (ap.status === "inconforme") atual.inconforme++
      else atual.na++
      contagem.set(ap.itemId, atual)
    }
  }

  const round1 = (n: number) => Math.round(n * 10) / 10

  // agrupa por bloco
  const blocos = new Map<string, ItemCategoria[]>()
  for (const [itemId, c] of contagem.entries()) {
    const info = meta.get(itemId)
    if (carteira && carteira !== "todas" && info && info.carteira !== carteira) continue
    const bloco = info?.bloco ?? SEM_BLOCO
    const qtd = c.conforme + c.inconforme
    const item: ItemCategoria = {
      itemId,
      texto: info?.texto ?? itemId,
      critico: info?.critico ?? false,
      conforme: c.conforme,
      inconforme: c.inconforme,
      na: c.na,
      qtd,
      pctConforme: qtd ? round1((c.conforme / qtd) * 100) : 0,
      pctInconforme: qtd ? round1((c.inconforme / qtd) * 100) : 0,
    }
    if (!blocos.has(bloco)) blocos.set(bloco, [])
    blocos.get(bloco)!.push(item)
  }

  return Array.from(blocos.entries())
    .map(([bloco, itens]) => {
      const conforme = itens.reduce((s, i) => s + i.conforme, 0)
      const inconforme = itens.reduce((s, i) => s + i.inconforme, 0)
      const na = itens.reduce((s, i) => s + i.na, 0)
      const qtd = conforme + inconforme
      return {
        bloco,
        conforme,
        inconforme,
        na,
        qtd,
        pctConforme: qtd ? round1((conforme / qtd) * 100) : 0,
        pctInconforme: qtd ? round1((inconforme / qtd) * 100) : 0,
        itens: itens.sort((a, b) => a.texto.localeCompare(b.texto, "pt-BR")),
      }
    })
    .sort((a, b) => a.bloco.localeCompare(b.bloco, "pt-BR"))
}

/** Totais consolidados de conforme/inconforme/N.A. para todos os apontamentos */
export function resumoConformidade(monitorias: Monitoria[]) {
  let conforme = 0
  let inconforme = 0
  let na = 0
  for (const m of monitorias) {
    for (const ap of m.apontamentos) {
      if (ap.status === "conforme") conforme++
      else if (ap.status === "inconforme") inconforme++
      else na++
    }
  }
  const total = conforme + inconforme + na
  const avaliados = conforme + inconforme
  const round1 = (n: number) => Math.round(n * 10) / 10
  return {
    conforme,
    inconforme,
    na,
    total,
    avaliados,
    pctConforme: avaliados ? round1((conforme / avaliados) * 100) : 0,
    pctInconforme: avaliados ? round1((inconforme / avaliados) * 100) : 0,
    pctNa: total ? round1((na / total) * 100) : 0,
  }
}

export function kpis(monitorias: Monitoria[]) {
  const notas = monitorias.map((m) => m.nota)
  const q = resumoQuartis(notas)
  const totalInconf = monitorias.reduce(
    (s, m) => s + m.apontamentos.filter((a) => a.status === "inconforme").length,
    0,
  )
  return {
    total: monitorias.length,
    notaMedia: Math.round(media(notas) * 10) / 10,
    mediana: Math.round(q.mediana * 10) / 10,
    aprovacao: notas.length
      ? Math.round((notas.filter((n) => n > 85).length / notas.length) * 1000) / 10
      : 0,
    criticos: notas.filter((n) => n < 60).length,
    totalInconf,
    quartis: q,
  }
}

/* ---------------- QUADRANTE (Qualidade x Recebimento) ---------------- */

export interface QuadranteInfo {
  sigla: SiglaQuadrante
  quadrante: "Q1" | "Q2" | "Q3" | "Q4"
  nome: string
  descricao: string
}

/**
 * Mapa do Quadrante. A combinação Performance(A/B) + Qualidade(A/B) gera a sigla.
 * A 1ª letra é a Performance (Recebimento) e a 2ª letra é a Qualidade.
 * - AA → Q1 · Alta Performance + Alta Qualidade
 * - AB → Q2 · Alta Performance + Baixa Qualidade
 * - BA → Q3 · Baixa Performance + Alta Qualidade
 * - BB → Q4 · Baixa Performance + Baixa Qualidade
 */
export const QUADRANTE_MAPA: Record<SiglaQuadrante, QuadranteInfo> = {
  AA: {
    sigla: "AA",
    quadrante: "Q1",
    nome: "Alta Performance · Alta Qualidade",
    descricao: "Destaque: entrega alta performance de recebimento e qualidade.",
  },
  AB: {
    sigla: "AB",
    quadrante: "Q2",
    nome: "Alta Performance · Baixa Qualidade",
    descricao: "Performance alta, mas a qualidade precisa melhorar.",
  },
  BA: {
    sigla: "BA",
    quadrante: "Q3",
    nome: "Baixa Performance · Alta Qualidade",
    descricao: "Qualidade alta, porém a performance de recebimento está abaixo.",
  },
  BB: {
    sigla: "BB",
    quadrante: "Q4",
    nome: "Baixa Performance · Baixa Qualidade",
    descricao: "Atenção: performance e qualidade abaixo do esperado.",
  },
}

export interface OperadorQuadrante {
  operador: string
  carteira: string
  volume: number
  nota: number
  qualidade: "alta" | "baixa"
  recebimento: "alto" | "baixo" | null
  sigla: SiglaQuadrante | null
  info: QuadranteInfo | null
}

/**
 * Calcula o quadrante de cada operador combinando:
 * - Qualidade: derivada da nota média (>= meta = Alta, senão Baixa)
 * - Recebimento: definido manualmente (RecebimentoOperador) — pode estar pendente
 */
export function quadranteOperadores(
  monitorias: Monitoria[],
  recebimentos: RecebimentoOperador[],
  metaQualidade = 75,
): OperadorQuadrante[] {
  const grupos = new Map<string, { notas: number[]; carteira: string }>()
  for (const m of monitorias) {
    if (!grupos.has(m.operadorNome)) {
      grupos.set(m.operadorNome, { notas: [], carteira: m.carteira })
    }
    grupos.get(m.operadorNome)!.notas.push(m.nota)
  }
  const recMap = new Map(recebimentos.map((r) => [r.operadorNome, r.nivel]))

  return Array.from(grupos.entries())
    .map(([operador, { notas, carteira }]) => {
      const nota = Math.round(media(notas) * 10) / 10
      const qualidade: "alta" | "baixa" = nota >= metaQualidade ? "alta" : "baixa"
      const rec = recMap.get(operador) ?? null
      let sigla: SiglaQuadrante | null = null
      if (rec) {
        // 1ª letra = Performance (Recebimento), 2ª letra = Qualidade
        const p = rec === "alto" ? "A" : "B"
        const q = qualidade === "alta" ? "A" : "B"
        sigla = `${p}${q}` as SiglaQuadrante
      }
      return {
        operador,
        carteira,
        volume: notas.length,
        nota,
        qualidade,
        recebimento: rec,
        sigla,
        info: sigla ? QUADRANTE_MAPA[sigla] : null,
      }
    })
    .sort((a, b) => b.nota - a.nota)
}
