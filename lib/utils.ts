import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normaliza um nome de carteira para comparação robusta: remove acentos,
 * espaços extras e diferenças de maiúsculas/minúsculas. Usado para vincular
 * operadores, checklists e vínculos mesmo quando a carteira foi digitada de
 * forma ligeiramente diferente (ex.: "Cobrança" x "cobranca ").
 */
export function normalizarCarteira(valor: string | null | undefined): string {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}
