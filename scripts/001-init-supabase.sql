-- =====================================================================
-- QualiMonitor — Inicialização do banco de dados no Supabase
-- Execute este script no SQL Editor do seu projeto Supabase.
-- =====================================================================
-- Cada tabela guarda a entidade completa em uma coluna JSONB "data",
-- espelhando exatamente as estruturas usadas pela aplicação. Isso mantém
-- a migração simples e robusta a futuras mudanças no formato.
-- =====================================================================

create table if not exists public.checklists (
  id text primary key,
  data jsonb not null,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.operadores (
  id text primary key,
  data jsonb not null
);

create table if not exists public.monitorias (
  id text primary key,
  data jsonb not null,
  criado_em timestamptz not null default now()
);

create table if not exists public.feedbacks (
  id text primary key,
  data jsonb not null,
  criado_em timestamptz not null default now()
);

create table if not exists public.vinculos (
  id text primary key,
  data jsonb not null
);

create table if not exists public.recebimentos (
  operador_nome text primary key,
  data jsonb not null
);

create table if not exists public.tabulacoes (
  nome text primary key
);

create table if not exists public.usuarios (
  usuario text primary key,
  data jsonb not null
);

-- =====================================================================
-- Row Level Security
-- O app possui autenticação própria (não usa Supabase Auth) e acessa o
-- banco com a chave anônima. Liberamos leitura/escrita para a role anon.
-- Ajuste estas políticas se quiser restringir o acesso futuramente.
-- =====================================================================

alter table public.checklists   enable row level security;
alter table public.operadores   enable row level security;
alter table public.monitorias   enable row level security;
alter table public.feedbacks    enable row level security;
alter table public.vinculos     enable row level security;
alter table public.recebimentos enable row level security;
alter table public.tabulacoes   enable row level security;
alter table public.usuarios     enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'checklists','operadores','monitorias','feedbacks',
    'vinculos','recebimentos','tabulacoes','usuarios'
  ]
  loop
    execute format(
      'drop policy if exists "acesso_total_anon" on public.%I;', t
    );
    execute format(
      'create policy "acesso_total_anon" on public.%I for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;
