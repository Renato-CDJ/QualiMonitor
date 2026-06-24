export type ItemTipo = "checklist"

export interface ChecklistItem {
  id: string
  texto: string
  bloco?: string // bloco/categoria do item (ex: "Abertura", "Procedimento")
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

/**
 * Vínculo de Tabulação: associa uma Carteira a um Checklist e a uma Tabulação.
 * Permite que a mesma carteira use checklists diferentes conforme a tabulação
 * que está sendo monitorada (ex.: "Venda" usa o checklist de vendas, "Cobrança"
 * usa o checklist de cobrança). Usado na tela de Nova Monitoria para filtrar as
 * tabulações disponíveis e carregar o checklist correto.
 */
export interface VinculoTabulacao {
  id: string
  carteira: string
  checklistId: string
  tabulacao: string
  criadoEm: string
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
 * Performance (recebimento) do operador definida manualmente pelo gestor.
 * "alto" ou "baixo" — combinada com a Qualidade (das notas) gera o Quadrante.
 */
export type NivelRecebimento = "alto" | "baixo"

export interface RecebimentoOperador {
  operadorNome: string
  nivel: NivelRecebimento
  atualizadoEm: string
}

/**
 * Matriz de Quadrante (2x2): Performance (Alta/Baixa) x Qualidade (Alta/Baixa).
 * A 1ª letra é a Performance (Recebimento) e a 2ª letra é a Qualidade.
 * - AA = Alta Performance + Alta Qualidade  → Q1
 * - AB = Alta Performance + Baixa Qualidade → Q2
 * - BA = Baixa Performance + Alta Qualidade → Q3
 * - BB = Baixa Performance + Baixa Qualidade → Q4
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
