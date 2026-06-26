import { getSupabase } from "./supabase/client"
import type {
  Checklist,
  Operador,
  Monitoria,
  ApontamentoItem,
  FeedbackInvertido,
  RecebimentoOperador,
  NivelRecebimento,
  VinculoTabulacao,
} from "./types"
import { TABULACOES } from "./types"

/**
 * Store da aplicação respaldado pelo Supabase.
 *
 * Para preservar a API síncrona já consumida por todos os componentes,
 * mantemos um cache em memória que é hidratado do Supabase no carregamento
 * (store.hydrate()). Os getters leem do cache (síncrono) e as mutações
 * fazem "write-through": atualizam o cache, disparam o evento "qm:update"
 * (para a UI reagir imediatamente) e persistem no Supabase em segundo plano.
 */

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

/* ---------------- SEED ---------------- */

const SEED_CHECKLISTS: Checklist[] = [
  {
    id: "chk-carteira-x",
    carteira: "Carteira X",
    nome: "Checklist Padrão de Vendas",
    atualizadoEm: new Date().toISOString(),
    itens: [
      { id: "i1", texto: "Realizou abordagem inicial padrão", bloco: "Abertura", peso: 5 },
      { id: "i2", texto: "Confirmou dados cadastrais do cliente", bloco: "Abertura", peso: 10, critico: true },
      { id: "i3", texto: "Sondou a necessidade do cliente", bloco: "Procedimento", peso: 8 },
      { id: "i4", texto: "Ofertou o produto corretamente", bloco: "Procedimento", peso: 10 },
      { id: "i5", texto: "Informou valores e condições com clareza", bloco: "Procedimento", peso: 12 },
      { id: "i6", texto: "Contornou objeções de forma adequada", bloco: "Argumentação", peso: 8 },
      { id: "i7", texto: "Realizou script de segurança/LGPD", bloco: "Segurança", peso: 15, critico: true },
      { id: "i8", texto: "Manteve cordialidade durante o atendimento", bloco: "Postura", peso: 7 },
      { id: "i9", texto: "Confirmou aceite e fechamento da venda", bloco: "Fechamento", peso: 10 },
      { id: "i10", texto: "Realizou encerramento padrão", bloco: "Finalização", peso: 5 },
    ],
  },
  {
    id: "chk-carteira-y",
    carteira: "Carteira Y",
    nome: "Checklist de Retenção",
    atualizadoEm: new Date().toISOString(),
    itens: [
      { id: "y1", texto: "Identificou motivo do cancelamento", bloco: "Abertura", peso: 12, critico: true },
      { id: "y2", texto: "Apresentou oferta de retenção", bloco: "Procedimento", peso: 15 },
      { id: "y3", texto: "Demonstrou empatia com o cliente", bloco: "Postura", peso: 8 },
      { id: "y4", texto: "Registrou tabulação correta no sistema", bloco: "Procedimento", peso: 10 },
      { id: "y5", texto: "Seguiu script de segurança", bloco: "Segurança", peso: 15, critico: true },
      { id: "y6", texto: "Confirmou decisão final do cliente", bloco: "Fechamento", peso: 10 },
      { id: "y7", texto: "Encerramento cordial", bloco: "Finalização", peso: 5 },
    ],
  },
  {
    id: "chk-carteira-z",
    carteira: "Carteira Z",
    nome: "Checklist de Cobrança",
    atualizadoEm: new Date().toISOString(),
    itens: [
      { id: "z1", texto: "Confirmou identidade do devedor", bloco: "Abertura", peso: 15, critico: true },
      { id: "z2", texto: "Informou valor e vencimento da dívida", bloco: "Apresentação da dívida", peso: 12 },
      { id: "z3", texto: "Negociou condições de pagamento", bloco: "Negociação", peso: 10 },
      { id: "z4", texto: "Manteve tom respeitoso (sem constrangimento)", bloco: "Postura", peso: 15, critico: true },
      { id: "z5", texto: "Ofereceu canais de pagamento", bloco: "Negociação", peso: 8 },
      { id: "z6", texto: "Registrou acordo corretamente", bloco: "Fechamento", peso: 10 },
      { id: "z7", texto: "Encerramento padrão", bloco: "Finalização", peso: 5 },
    ],
  },
]

const SEED_VINCULOS: VinculoTabulacao[] = [
  { id: "vinc-x-venda", carteira: "Carteira X", checklistId: "chk-carteira-x", tabulacao: "Venda", criadoEm: new Date().toISOString() },
  { id: "vinc-x-naovenda", carteira: "Carteira X", checklistId: "chk-carteira-x", tabulacao: "Não Venda", criadoEm: new Date().toISOString() },
  { id: "vinc-y-retencao", carteira: "Carteira Y", checklistId: "chk-carteira-y", tabulacao: "Retenção", criadoEm: new Date().toISOString() },
  { id: "vinc-y-cancelamento", carteira: "Carteira Y", checklistId: "chk-carteira-y", tabulacao: "Cancelamento", criadoEm: new Date().toISOString() },
  { id: "vinc-z-cobranca", carteira: "Carteira Z", checklistId: "chk-carteira-z", tabulacao: "Cobrança", criadoEm: new Date().toISOString() },
  { id: "vinc-z-agendamento", carteira: "Carteira Z", checklistId: "chk-carteira-z", tabulacao: "Agendamento", criadoEm: new Date().toISOString() },
]

const NOMES = [
  "Ana Souza", "Bruno Lima", "Carla Mendes", "Diego Rocha", "Eduarda Alves",
  "Felipe Castro", "Gabriela Dias", "Henrique Nunes", "Isabela Cruz", "João Pereira",
  "Karina Melo", "Lucas Barros", "Marina Teixeira", "Nathan Gomes", "Olívia Faria",
]
const CARTEIRAS = ["Carteira X", "Carteira Y", "Carteira Z"]

const SEED_OPERADORES: Operador[] = NOMES.map((nome, i) => {
  // Datas de admissão variadas para demonstrar o cálculo de tempo de empresa.
  const adm = new Date()
  adm.setMonth(adm.getMonth() - (2 + i * 3))
  const admissao = `${adm.getFullYear()}-${String(adm.getMonth() + 1).padStart(2, "0")}-${String(
    adm.getDate(),
  ).padStart(2, "0")}`
  return {
    id: `op-${i + 1}`,
    nome,
    carteira: CARTEIRAS[i % 3],
    admissao,
  }
})

const MONITORES = ["Sofia Andrade", "Rafael Pinto", "Camila Duarte"]
const TABS = ["Venda", "Não Venda", "Retenção", "Cobrança", "Suporte Técnico", "Reclamação"]

function calcularNota(checklist: Checklist, apontamentos: ApontamentoItem[]): number {
  let nota = 100
  let zerou = false
  for (const ap of apontamentos) {
    if (ap.status !== "inconforme") continue
    const item = checklist.itens.find((it) => it.id === ap.itemId)
    if (!item) continue
    if (item.critico) zerou = true
    nota -= item.peso
  }
  if (zerou) nota = 0
  return Math.max(0, Math.min(100, nota))
}

function gerarMonitoriasSeed(): Monitoria[] {
  const lista: Monitoria[] = []
  const hoje = new Date()
  for (let d = 0; d < 90; d++) {
    const dia = new Date(hoje)
    dia.setDate(hoje.getDate() - d)
    const qtd = 1 + Math.floor(Math.random() * 2)
    for (let k = 0; k < qtd; k++) {
      const op = SEED_OPERADORES[Math.floor(Math.random() * SEED_OPERADORES.length)]
      const checklist = SEED_CHECKLISTS.find((c) => c.carteira === op.carteira)!
      const tabsCarteira = SEED_VINCULOS.filter((v) => v.carteira === op.carteira).map((v) => v.tabulacao)
      const tabulacaoSeed =
        tabsCarteira.length > 0
          ? tabsCarteira[Math.floor(Math.random() * tabsCarteira.length)]
          : TABS[Math.floor(Math.random() * TABS.length)]
      const apontamentos: ApontamentoItem[] = checklist.itens.map((it) => {
        const r = Math.random()
        let status: ApontamentoItem["status"] = "conforme"
        if (r < 0.12) status = "inconforme"
        else if (r < 0.16) status = "na"
        return { itemId: it.id, status }
      })
      const nota = calcularNota(checklist, apontamentos)
      lista.push({
        id: uid(),
        carteira: op.carteira,
        checklistId: checklist.id,
        data: dia.toISOString().slice(0, 10),
        ecCallId: `EC${Math.floor(100000 + Math.random() * 899999)}`,
        operadorId: op.id,
        operadorNome: op.nome,
        tabulacao: tabulacaoSeed,
        apontamentos,
        nota,
        observacao: "",
        monitor: MONITORES[Math.floor(Math.random() * MONITORES.length)],
        criadoEm: dia.toISOString(),
      })
    }
  }
  return lista
}

/* ---------------- CACHE EM MEMÓRIA ---------------- */

interface Cache {
  checklists: Checklist[]
  operadores: Operador[]
  monitorias: Monitoria[]
  feedbacks: FeedbackInvertido[]
  recebimentos: RecebimentoOperador[]
  vinculos: VinculoTabulacao[]
  tabulacoes: string[]
}

const cache: Cache = {
  checklists: [],
  operadores: [],
  monitorias: [],
  feedbacks: [],
  recebimentos: [],
  vinculos: [],
  tabulacoes: [...TABULACOES],
}

let hydrated = false
let hydrating: Promise<void> | null = null

function emitUpdate(key: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent("qm:update", { detail: { key } }))
}

function logErro(contexto: string, error: unknown) {
  if (error) console.error(`[v0] Supabase erro (${contexto}):`, error)
}

/* ---------------- PERSISTÊNCIA (write-through) ---------------- */

/**
 * Sincroniza uma coleção inteira com a tabela: faz upsert dos itens atuais
 * e remove do banco os ids que não existem mais. A diff usa os ids antigos
 * (do cache antes da escrita) para saber o que apagar.
 */
async function persistJson<T>(
  table: string,
  pk: string,
  getId: (t: T) => string,
  oldIds: string[],
  next: T[],
) {
  const sb = getSupabase()
  if (next.length > 0) {
    const rows = next.map((item) => ({ [pk]: getId(item), data: item }))
    const { error } = await sb.from(table).upsert(rows, { onConflict: pk })
    logErro(`upsert ${table}`, error)
  }
  const novoSet = new Set(next.map(getId))
  const remover = oldIds.filter((id) => !novoSet.has(id))
  if (remover.length > 0) {
    const { error } = await sb.from(table).delete().in(pk, remover)
    logErro(`delete ${table}`, error)
  }
}

async function persistTabulacoes(oldArr: string[], next: string[]) {
  const sb = getSupabase()
  if (next.length > 0) {
    const rows = next.map((nome) => ({ nome }))
    const { error } = await sb.from("tabulacoes").upsert(rows, { onConflict: "nome" })
    logErro("upsert tabulacoes", error)
  }
  const novoSet = new Set(next)
  const remover = oldArr.filter((n) => !novoSet.has(n))
  if (remover.length > 0) {
    const { error } = await sb.from("tabulacoes").delete().in("nome", remover)
    logErro("delete tabulacoes", error)
  }
}

/* Escritas que atualizam o cache + disparam evento + persistem em background. */

function setChecklists(v: Checklist[]) {
  const old = cache.checklists.map((c) => c.id)
  cache.checklists = v
  emitUpdate("checklists")
  void persistJson("checklists", "id", (c: Checklist) => c.id, old, v)
}

function setOperadores(v: Operador[]) {
  const old = cache.operadores.map((o) => o.id)
  cache.operadores = v
  emitUpdate("operadores")
  void persistJson("operadores", "id", (o: Operador) => o.id, old, v)
}

function setMonitorias(v: Monitoria[]) {
  const old = cache.monitorias.map((m) => m.id)
  cache.monitorias = v
  emitUpdate("monitorias")
  void persistJson("monitorias", "id", (m: Monitoria) => m.id, old, v)
}

function setFeedbacks(v: FeedbackInvertido[]) {
  const old = cache.feedbacks.map((f) => f.id)
  cache.feedbacks = v
  emitUpdate("feedbacks")
  void persistJson("feedbacks", "id", (f: FeedbackInvertido) => f.id, old, v)
}

function setVinculos(v: VinculoTabulacao[]) {
  const old = cache.vinculos.map((x) => x.id)
  cache.vinculos = v
  emitUpdate("vinculos")
  void persistJson("vinculos", "id", (x: VinculoTabulacao) => x.id, old, v)
}

function setRecebimentos(v: RecebimentoOperador[]) {
  const old = cache.recebimentos.map((r) => r.operadorNome)
  cache.recebimentos = v
  emitUpdate("recebimentos")
  void persistJson("recebimentos", "operador_nome", (r: RecebimentoOperador) => r.operadorNome, old, v)
}

function setTabulacoes(v: string[]) {
  const old = [...cache.tabulacoes]
  cache.tabulacoes = v
  emitUpdate("tabulacoes")
  void persistTabulacoes(old, v)
}

/* ---------------- HIDRATAÇÃO / SEED ---------------- */

async function carregarTabela<T>(table: string): Promise<{ data: T }[] | null> {
  const sb = getSupabase()
  const { data, error } = await sb.from(table).select("*")
  logErro(`select ${table}`, error)
  if (error) return null
  return (data ?? []) as { data: T }[]
}

async function seedInicial() {
  // Define o cache com os seeds e persiste tudo no Supabase.
  cache.checklists = SEED_CHECKLISTS
  cache.operadores = SEED_OPERADORES
  cache.vinculos = SEED_VINCULOS
  cache.tabulacoes = [...TABULACOES]
  cache.monitorias = gerarMonitoriasSeed()
  cache.feedbacks = []
  cache.recebimentos = []

  await Promise.all([
    persistJson("checklists", "id", (c: Checklist) => c.id, [], cache.checklists),
    persistJson("operadores", "id", (o: Operador) => o.id, [], cache.operadores),
    persistJson("vinculos", "id", (x: VinculoTabulacao) => x.id, [], cache.vinculos),
    persistTabulacoes([], cache.tabulacoes),
    persistJson("monitorias", "id", (m: Monitoria) => m.id, [], cache.monitorias),
  ])
}

/** Carrega todos os dados do Supabase para o cache. Faz seed se vazio. */
async function hydrate(): Promise<void> {
  if (hydrated) return
  if (hydrating) return hydrating
  hydrating = (async () => {
    const [
      checklists,
      operadores,
      monitorias,
      feedbacks,
      vinculos,
      recebimentos,
      tabulacoesRows,
    ] = await Promise.all([
      carregarTabela<Checklist>("checklists"),
      carregarTabela<Operador>("operadores"),
      carregarTabela<Monitoria>("monitorias"),
      carregarTabela<FeedbackInvertido>("feedbacks"),
      carregarTabela<VinculoTabulacao>("vinculos"),
      carregarTabela<RecebimentoOperador>("recebimentos"),
      getSupabase().from("tabulacoes").select("nome"),
    ])

    const tabRows = (tabulacoesRows.data ?? []) as { nome: string }[]

    const bancoVazio =
      (checklists?.length ?? 0) === 0 &&
      (tabRows?.length ?? 0) === 0 &&
      (operadores?.length ?? 0) === 0

    if (bancoVazio) {
      await seedInicial()
    } else {
      cache.checklists = (checklists ?? []).map((r) => r.data)
      cache.operadores = (operadores ?? []).map((r) => r.data)
      cache.monitorias = (monitorias ?? []).map((r) => r.data)
      cache.feedbacks = (feedbacks ?? []).map((r) => r.data)
      cache.vinculos = (vinculos ?? []).map((r) => r.data)
      cache.recebimentos = (recebimentos ?? []).map((r) => r.data)
      cache.tabulacoes = tabRows.map((r) => r.nome)
    }

    hydrated = true
    emitUpdate("hydrate")
  })()
  return hydrating
}

/* ---------------- API ---------------- */

export const store = {
  calcularNota,
  uid,
  hydrate,
  get hydrated() {
    return hydrated
  },

  getChecklists: () => cache.checklists,
  setChecklists,
  getOperadores: () => cache.operadores,
  setOperadores,
  getMonitorias: () => cache.monitorias,
  setMonitorias,
  addMonitoria: (m: Monitoria) => {
    setMonitorias([m, ...cache.monitorias])
  },
  removeMonitoria: (id: string) => {
    setMonitorias(cache.monitorias.filter((m) => m.id !== id))
  },

  getFeedbacks: () => cache.feedbacks,
  setFeedbacks,
  addFeedback: (f: FeedbackInvertido) => {
    setFeedbacks([f, ...cache.feedbacks])
  },
  updateFeedback: (id: string, patch: Partial<FeedbackInvertido>) => {
    setFeedbacks(cache.feedbacks.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  },
  removeFeedback: (id: string) => {
    setFeedbacks(cache.feedbacks.filter((f) => f.id !== id))
  },

  getVinculos: () => cache.vinculos,
  setVinculos,
  addVinculo: (v: VinculoTabulacao) => {
    setVinculos([v, ...cache.vinculos])
  },
  removeVinculo: (id: string) => {
    setVinculos(cache.vinculos.filter((v) => v.id !== id))
  },

  getTabulacoes: () => cache.tabulacoes,
  setTabulacoes,
  addTabulacao: (nome: string) => {
    if (cache.tabulacoes.some((t) => t.toLowerCase() === nome.toLowerCase())) return false
    setTabulacoes([...cache.tabulacoes, nome])
    return true
  },
  renameTabulacao: (antigo: string, novo: string) => {
    if (
      cache.tabulacoes.some(
        (t) => t.toLowerCase() === novo.toLowerCase() && t.toLowerCase() !== antigo.toLowerCase(),
      )
    ) {
      return false
    }
    setTabulacoes(cache.tabulacoes.map((t) => (t === antigo ? novo : t)))
    // Propaga o novo nome para vínculos e monitorias.
    setVinculos(cache.vinculos.map((v) => (v.tabulacao === antigo ? { ...v, tabulacao: novo } : v)))
    setMonitorias(cache.monitorias.map((m) => (m.tabulacao === antigo ? { ...m, tabulacao: novo } : m)))
    return true
  },
  countVinculosPorTabulacao: (nome: string) => {
    return cache.vinculos.filter((v) => v.tabulacao === nome).length
  },
  removeTabulacao: (nome: string) => {
    setTabulacoes(cache.tabulacoes.filter((t) => t !== nome))
  },

  getRecebimentos: () => cache.recebimentos,
  setRecebimentos,
  setRecebimentoOperador: (operadorNome: string, nivel: NivelRecebimento) => {
    const existe = cache.recebimentos.some((r) => r.operadorNome === operadorNome)
    const atualizado = existe
      ? cache.recebimentos.map((r) =>
          r.operadorNome === operadorNome
            ? { ...r, nivel, atualizadoEm: new Date().toISOString() }
            : r,
        )
      : [...cache.recebimentos, { operadorNome, nivel, atualizadoEm: new Date().toISOString() }]
    setRecebimentos(atualizado)
  },
  removeRecebimento: (operadorNome: string) => {
    setRecebimentos(cache.recebimentos.filter((r) => r.operadorNome !== operadorNome))
  },

  resetAll: async () => {
    const sb = getSupabase()
    // Limpa todas as tabelas e refaz o seed.
    await Promise.all([
      sb.from("monitorias").delete().neq("id", ""),
      sb.from("feedbacks").delete().neq("id", ""),
      sb.from("vinculos").delete().neq("id", ""),
      sb.from("checklists").delete().neq("id", ""),
      sb.from("operadores").delete().neq("id", ""),
      sb.from("recebimentos").delete().neq("operador_nome", ""),
      sb.from("tabulacoes").delete().neq("nome", ""),
    ])
    await seedInicial()
    emitUpdate("reset")
  },
}
