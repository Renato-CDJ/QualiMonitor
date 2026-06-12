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

/**
 * Monitoria Invertida: o monitor "chama" o operador para que ele se auto-avalie
 * preenchendo o mesmo checklist da monitoria que o monitor já avaliou.
 * Ao finalizar, comparamos o resultado do monitor com o do operador.
 */
export type StatusFeedback = "pendente" | "concluido"

export interface FeedbackInvertido {
  id: string
  monitoriaId: string
  carteira: string
  checklistId: string
  operadorId: string
  operadorNome: string
  // dados originais da monitoria (resultado do monitor)
  monitor: string
  notaMonitor: number
  apontamentosMonitor: ApontamentoItem[]
  observacaoMonitor: string
  // auto-avaliação do operador
  apontamentosOperador?: ApontamentoItem[]
  notaOperador?: number
  observacaoOperador?: string
  status: StatusFeedback
  criadoEm: string
  concluidoEm?: string
}

/**
 * Recebimento do operador definido manualmente pelo gestor.
 * "alto" ou "baixo" — combinado com a Qualidade (das notas) gera o Quadrante.
 */
export type NivelRecebimento = "alto" | "baixo"

export interface RecebimentoOperador {
  operadorNome: string
  nivel: NivelRecebimento
  atualizadoEm: string
}

/**
 * Matriz de Quadrante (2x2): Qualidade (Alta/Baixa) x Recebimento (Alto/Baixo)
 * - AA = Alta Qualidade + Alto Recebimento  → Q1
 * - AB = Alta Qualidade + Baixo Recebimento → Q2
 * - BA = Baixa Qualidade + Alto Recebimento → Q3
 * - BB = Baixa Qualidade + Baixo Recebimento → Q4
 */
export type SiglaQuadrante = "AA" | "AB" | "BA" | "BB"

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
