export type ItemTipo = "checklist"

export interface ChecklistItem {
  id: string
  texto: string
  peso: number // pontos descontados quando "Inconforme"
  critico?: boolean // item crítico (zera a nota se inconforme)
}

export interface Checklist {
  id: string
  carteira: string
  nome: string
  itens: ChecklistItem[]
  atualizadoEm: string
}

export interface Operador {
  id: string
  nome: string
  matricula: string
  carteira: string
  supervisor: string
}

export type StatusItem = "conforme" | "inconforme" | "na"

export interface ApontamentoItem {
  itemId: string
  status: StatusItem
}

export interface Monitoria {
  id: string
  carteira: string
  checklistId: string
  data: string // ISO date da monitoria
  horario?: string // HH:MM horário da ligação
  ecCallId: string
  operadorId: string
  operadorNome: string
  tabulacao: string
  apontamentos: ApontamentoItem[]
  nota: number
  observacao: string
  monitor: string
  criadoEm: string
}

export const TABULACOES = [
  "Venda",
  "Não Venda",
  "Retenção",
  "Cobrança",
  "Suporte Técnico",
  "Reclamação",
  "Cancelamento",
  "Agendamento",
]
