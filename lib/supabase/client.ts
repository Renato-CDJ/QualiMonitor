import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Cliente Supabase para o navegador (singleton).
 * Usa a chave anônima (pública) — segura para uso no client.
 * As credenciais vêm das variáveis de ambiente NEXT_PUBLIC_*.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (client) return client
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    )
  }
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  })
  return client
}

/** Indica se as variáveis de ambiente do Supabase estão presentes. */
export const supabaseConfigurado = Boolean(supabaseUrl && supabaseAnonKey)
