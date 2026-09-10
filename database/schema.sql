-- ============================================================================
-- QualiMonitor - Schema do banco de dados (Supabase / PostgreSQL)
-- ----------------------------------------------------------------------------
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute.
-- Os IDs sao TEXT (nao UUID) de proposito, para serem compativeis com os IDs
-- que o app ja gera (ex.: "chk-carteira-x", "i1", "op-1", "vinc-x-venda").
--
-- Tabelas:
--   usuarios               -> login/perfis (admin, comum, visitante)
--   checklists             -> 1 checklist por carteira/tabulacao
--   checklist_itens        -> itens de cada checklist (peso, critico, bloco)
--   operadores             -> 700+ operadores monitorados
--   tabulacoes             -> lista de tabulacoes disponiveis
--   vinculos_tabulacao     -> carteira + checklist + tabulacao
--   monitorias             -> cada monitoria realizada (cabecalho + nota)
--   monitoria_apontamentos -> respostas item a item (MAIOR volume de dados)
--   feedbacks_invertidos   -> auto-avaliacao do operador vs monitor
--   recebimentos_operador  -> nivel de performance manual (quadrante)
-- ============================================================================

-- Extensao util (gen_random_uuid), caso queira gerar ids no banco futuramente.
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- USUARIOS (autenticacao a nivel de aplicacao)
-- ATENCAO: a senha aqui fica em texto. Em producao, prefira Supabase Auth ou
-- ao menos armazenar apenas hash. Mantido simples para espelhar o app atual.
-- ----------------------------------------------------------------------------
create table if not exists public.usuarios (
  usuario       text primary key,
  nome          text not null,
  perfil        text not null default 'comum' check (perfil in ('admin', 'comum', 'visitante')),
  senha         text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- CHECKLISTS
-- ----------------------------------------------------------------------------
create table if not exists public.checklists (
  id            text primary key,
  carteira      text not null,
  nome          text not null,
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_checklists_carteira on public.checklists (carteira);

-- ----------------------------------------------------------------------------
-- ITENS DO CHECKLIST
-- ----------------------------------------------------------------------------
create table if not exists public.checklist_itens (
  id           text not null,
  checklist_id text not null references public.checklists (id) on delete cascade,
  texto        text not null,
  bloco        text,
  peso         integer not null default 0,
  critico      boolean not null default false,
  ordem        integer not null default 0,
  primary key (checklist_id, id)
);

create index if not exists idx_checklist_itens_checklist on public.checklist_itens (checklist_id);

-- ----------------------------------------------------------------------------
-- OPERADORES
-- ----------------------------------------------------------------------------
create table if not exists public.operadores (
  id        text primary key,
  nome      text not null,
  carteira  text not null,
  admissao  date
);

create index if not exists idx_operadores_carteira on public.operadores (carteira);
create index if not exists idx_operadores_nome on public.operadores (nome);

-- ----------------------------------------------------------------------------
-- TABULACOES (lista simples de nomes)
-- ----------------------------------------------------------------------------
create table if not exists public.tabulacoes (
  nome text primary key
);

-- ----------------------------------------------------------------------------
-- VINCULOS DE TABULACAO (carteira + checklist + tabulacao)
-- ----------------------------------------------------------------------------
create table if not exists public.vinculos_tabulacao (
  id           text primary key,
  carteira     text not null,
  checklist_id text not null references public.checklists (id) on delete cascade,
  tabulacao    text not null,
  criado_em    timestamptz not null default now(),
  unique (carteira, checklist_id, tabulacao)
);

create index if not exists idx_vinculos_carteira on public.vinculos_tabulacao (carteira);
create index if not exists idx_vinculos_tabulacao on public.vinculos_tabulacao (tabulacao);

-- ----------------------------------------------------------------------------
-- MONITORIAS (cabecalho)
-- ----------------------------------------------------------------------------
create table if not exists public.monitorias (
  id            text primary key,
  carteira      text not null,
  checklist_id  text references public.checklists (id) on delete set null,
  data          date not null,
  horario       text,
  ec_call_id    text,
  operador_id   text references public.operadores (id) on delete set null,
  operador_nome text not null,
  tabulacao     text,
  nota          numeric(5,2) not null default 0,
  observacao    text default '',
  monitor       text,
  criado_em     timestamptz not null default now()
);

create index if not exists idx_monitorias_data on public.monitorias (data);
create index if not exists idx_monitorias_carteira on public.monitorias (carteira);
create index if not exists idx_monitorias_operador on public.monitorias (operador_id);
create index if not exists idx_monitorias_operador_nome on public.monitorias (operador_nome);
create index if not exists idx_monitorias_checklist on public.monitorias (checklist_id);

-- ----------------------------------------------------------------------------
-- APONTAMENTOS (resposta item a item) -- maior volume de dados
-- ----------------------------------------------------------------------------
create table if not exists public.monitoria_apontamentos (
  monitoria_id text not null references public.monitorias (id) on delete cascade,
  item_id      text not null,
  status       text not null check (status in ('conforme', 'inconforme', 'na')),
  primary key (monitoria_id, item_id)
);

create index if not exists idx_apontamentos_monitoria on public.monitoria_apontamentos (monitoria_id);
create index if not exists idx_apontamentos_item on public.monitoria_apontamentos (item_id);
create index if not exists idx_apontamentos_status on public.monitoria_apontamentos (status);

-- ----------------------------------------------------------------------------
-- FEEDBACKS INVERTIDOS (auto-avaliacao do operador vs monitor)
-- Os apontamentos do monitor e do operador ficam em JSONB (baixo volume,
-- pouca consulta analitica). Formato: [{ "itemId": "...", "status": "..." }]
-- ----------------------------------------------------------------------------
create table if not exists public.feedbacks_invertidos (
  id                   text primary key,
  monitoria_id         text references public.monitorias (id) on delete set null,
  carteira             text not null,
  checklist_id         text references public.checklists (id) on delete set null,
  operador_id          text references public.operadores (id) on delete set null,
  operador_nome        text not null,
  monitor              text,
  nota_monitor         numeric(5,2) not null default 0,
  apontamentos_monitor jsonb not null default '[]'::jsonb,
  observacao_monitor   text default '',
  apontamentos_operador jsonb,
  nota_operador        numeric(5,2),
  observacao_operador  text,
  status               text not null default 'pendente' check (status in ('pendente', 'concluido')),
  criado_em            timestamptz not null default now(),
  concluido_em         timestamptz
);

create index if not exists idx_feedbacks_status on public.feedbacks_invertidos (status);
create index if not exists idx_feedbacks_operador on public.feedbacks_invertidos (operador_id);

-- ----------------------------------------------------------------------------
-- RECEBIMENTOS DO OPERADOR (nivel de performance manual -> quadrante)
-- ----------------------------------------------------------------------------
create table if not exists public.recebimentos_operador (
  operador_nome text primary key,
  nivel         text not null check (nivel in ('alto', 'baixo')),
  atualizado_em timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
-- O app usa autenticacao a nivel de aplicacao (nao Supabase Auth), entao por
-- padrao ele acessa via chave anon. As policies abaixo LIBERAM acesso para a
-- role anon para o app funcionar imediatamente.
--
-- >> RECOMENDACAO DE SEGURANCA <<
-- Quando migrar para Supabase Auth, REMOVA estas policies permissivas e crie
-- policies baseadas em auth.uid()/perfil. Como sao 700 operadores e ate ~30
-- usuarios internos, o ideal e exigir login real antes de expor os dados.
-- ============================================================================
alter table public.usuarios               enable row level security;
alter table public.checklists             enable row level security;
alter table public.checklist_itens        enable row level security;
alter table public.operadores             enable row level security;
alter table public.tabulacoes             enable row level security;
alter table public.vinculos_tabulacao     enable row level security;
alter table public.monitorias             enable row level security;
alter table public.monitoria_apontamentos enable row level security;
alter table public.feedbacks_invertidos   enable row level security;
alter table public.recebimentos_operador  enable row level security;

-- Policies permissivas (acesso total) -- ajuste depois conforme a recomendacao acima.
do $$
declare
  t text;
  tabelas text[] := array[
    'usuarios', 'checklists', 'checklist_itens', 'operadores', 'tabulacoes',
    'vinculos_tabulacao', 'monitorias', 'monitoria_apontamentos',
    'feedbacks_invertidos', 'recebimentos_operador'
  ];
begin
  foreach t in array tabelas loop
    execute format('drop policy if exists "acesso_total_%1$s" on public.%1$s;', t);
    execute format(
      'create policy "acesso_total_%1$s" on public.%1$s for all using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- ============================================================================
-- SEED OPCIONAL: usuario admin inicial (igual ao app atual)
-- Remova/comente se for cadastrar os usuarios manualmente.
-- ============================================================================
insert into public.usuarios (usuario, nome, perfil, senha)
values ('Renjesus', 'Renato C Jesus', 'admin', 'admin123')
on conflict (usuario) do nothing;

-- ============================================================================
-- FIM
-- ============================================================================
