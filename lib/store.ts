import type {
  Checklist,
  Operador,
  Monitoria,
  ApontamentoItem,
  FeedbackInvertido,
  RecebimentoOperador,
  NivelRecebimento,
} from "./types"

const KEYS = {
  checklists: "qm.checklists.v1",
  operadores: "qm.operadores.v1",
  monitorias: "qm.monitorias.v1",
  feedbacks: "qm.feedbacks.v1",
  recebimentos: "qm.recebimentos.v1",
  seeded: "qm.seeded.v1",
}

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

const NOMES = [
  "Ana Souza", "Bruno Lima", "Carla Mendes", "Diego Rocha", "Eduarda Alves",
  "Felipe Castro", "Gabriela Dias", "Henrique Nunes", "Isabela Cruz", "João Pereira",
  "Karina Melo", "Lucas Barros", "Marina Teixeira", "Nathan Gomes", "Olívia Faria",
]
const SUPERVISORES = ["Roberto Silva", "Patrícia Ramos", "Marcelo Antunes"]
const CARTEIRAS = ["Carteira X", "Carteira Y", "Carteira Z"]

const SEED_OPERADORES: Operador[] = NOMES.map((nome, i) => ({
  id: `op-${i + 1}`,
  nome,
  matricula: `M${(10234 + i * 7).toString()}`,
  carteira: CARTEIRAS[i % 3],
  supervisor: SUPERVISORES[i % 3],
}))

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
  // gera ~120 monitorias nos últimos 90 dias
  for (let d = 0; d < 90; d++) {
    const dia = new Date(hoje)
    dia.setDate(hoje.getDate() - d)
    const qtd = 1 + Math.floor(Math.random() * 2)
    for (let k = 0; k < qtd; k++) {
      const op = SEED_OPERADORES[Math.floor(Math.random() * SEED_OPERADORES.length)]
      const checklist = SEED_CHECKLISTS.find((c) => c.carteira === op.carteira)!
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
        tabulacao: TABS[Math.floor(Math.random() * TABS.length)],
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

/* ---------------- STORAGE HELPERS ---------------- */

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent("qm:update", { detail: { key } }))
}

export function ensureSeed() {
  if (typeof window === "undefined") return
  if (localStorage.getItem(KEYS.seeded)) return
  write(KEYS.checklists, SEED_CHECKLISTS)
  write(KEYS.operadores, SEED_OPERADORES)
  write(KEYS.monitorias, gerarMonitoriasSeed())
  localStorage.setItem(KEYS.seeded, "1")
}

/* ---------------- API ---------------- */

export const store = {
  KEYS,
  calcularNota,
  uid,
  getChecklists: () => read<Checklist[]>(KEYS.checklists, []),
  setChecklists: (v: Checklist[]) => write(KEYS.checklists, v),
  getOperadores: () => read<Operador[]>(KEYS.operadores, []),
  setOperadores: (v: Operador[]) => write(KEYS.operadores, v),
  getMonitorias: () => read<Monitoria[]>(KEYS.monitorias, []),
  setMonitorias: (v: Monitoria[]) => write(KEYS.monitorias, v),
  addMonitoria: (m: Monitoria) => {
    const all = read<Monitoria[]>(KEYS.monitorias, [])
    write(KEYS.monitorias, [m, ...all])
  },
  removeMonitoria: (id: string) => {
    const all = read<Monitoria[]>(KEYS.monitorias, [])
    write(
      KEYS.monitorias,
      all.filter((m) => m.id !== id),
    )
  },
  getFeedbacks: () => read<FeedbackInvertido[]>(KEYS.feedbacks, []),
  setFeedbacks: (v: FeedbackInvertido[]) => write(KEYS.feedbacks, v),
  addFeedback: (f: FeedbackInvertido) => {
    const all = read<FeedbackInvertido[]>(KEYS.feedbacks, [])
    write(KEYS.feedbacks, [f, ...all])
  },
  updateFeedback: (id: string, patch: Partial<FeedbackInvertido>) => {
    const all = read<FeedbackInvertido[]>(KEYS.feedbacks, [])
    write(
      KEYS.feedbacks,
      all.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    )
  },
  removeFeedback: (id: string) => {
    const all = read<FeedbackInvertido[]>(KEYS.feedbacks, [])
    write(
      KEYS.feedbacks,
      all.filter((f) => f.id !== id),
    )
  },
  getRecebimentos: () => read<RecebimentoOperador[]>(KEYS.recebimentos, []),
  setRecebimentos: (v: RecebimentoOperador[]) => write(KEYS.recebimentos, v),
  setRecebimentoOperador: (operadorNome: string, nivel: NivelRecebimento) => {
    const all = read<RecebimentoOperador[]>(KEYS.recebimentos, [])
    const existe = all.some((r) => r.operadorNome === operadorNome)
    const atualizado = existe
      ? all.map((r) =>
          r.operadorNome === operadorNome
            ? { ...r, nivel, atualizadoEm: new Date().toISOString() }
            : r,
        )
      : [...all, { operadorNome, nivel, atualizadoEm: new Date().toISOString() }]
    write(KEYS.recebimentos, atualizado)
  },
  removeRecebimento: (operadorNome: string) => {
    const all = read<RecebimentoOperador[]>(KEYS.recebimentos, [])
    write(
      KEYS.recebimentos,
      all.filter((r) => r.operadorNome !== operadorNome),
    )
  },
  resetAll: () => {
    localStorage.removeItem(KEYS.seeded)
    localStorage.removeItem(KEYS.checklists)
    localStorage.removeItem(KEYS.operadores)
    localStorage.removeItem(KEYS.monitorias)
    localStorage.removeItem(KEYS.feedbacks)
    localStorage.removeItem(KEYS.recebimentos)
    ensureSeed()
  },
}
