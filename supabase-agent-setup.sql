-- ================================================================
-- AGENT IA — Esquema Fase A
-- Crea la tabla agent_tasks y la columna preferences en memberships.
-- Ejecutar en Supabase tras revisar.
-- ================================================================

-- Tabla principal: cola de tareas del agente
create table if not exists agent_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Definición de la tarea
  goal text not null,
  confirmation_mode text not null check (confirmation_mode in
    ('step_by_step', 'milestones', 'autonomous')),

  -- Estado de la cola/ejecución
  status text not null default 'pending' check (status in
    ('pending', 'running', 'awaiting_user', 'awaiting_confirmation',
     'completed', 'failed', 'cancelled')),

  -- Historial de pasos (array de objetos JSONB)
  steps jsonb not null default '[]'::jsonb,

  -- Resultado final cuando status='completed'
  result jsonb,

  -- Estado pendiente: qué espera el agente del usuario
  pending_request jsonb,

  -- Créditos
  credits_estimated int not null default 0,
  credits_consumed int not null default 0,

  -- Modelo y métricas
  model text not null default 'claude-sonnet-4-6',
  total_tokens_input int not null default 0,
  total_tokens_output int not null default 0,
  step_count int not null default 0,

  -- Errores
  error_message text,
  error_step_index int,

  -- Timestamps
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Índices
create index if not exists agent_tasks_org_id_idx
  on agent_tasks(org_id, created_at desc);
create index if not exists agent_tasks_user_id_idx
  on agent_tasks(user_id, created_at desc);
create index if not exists agent_tasks_status_idx
  on agent_tasks(status)
  where status in ('pending', 'running', 'awaiting_user', 'awaiting_confirmation');

-- Trigger para updated_at automático
create or replace function update_agent_tasks_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists agent_tasks_updated_at on agent_tasks;
create trigger agent_tasks_updated_at
  before update on agent_tasks
  for each row execute function update_agent_tasks_updated_at();

-- Row Level Security
alter table agent_tasks enable row level security;

-- Lectura: solo el creador (cada usuario ve solo sus propias tareas)
create policy "Usuarios ven solo sus propias tareas"
  on agent_tasks for select
  using (
    user_id = auth.uid()
    and org_id in (select org_id from memberships where user_id = auth.uid())
  );

-- Inserción: solo el propio usuario en su propia org
create policy "Usuarios crean tareas en su org"
  on agent_tasks for insert
  with check (
    org_id in (select org_id from memberships where user_id = auth.uid())
    and user_id = auth.uid()
  );

-- Actualización: solo el creador (para responder a pending_request).
-- El worker usa service_role y bypassa RLS.
create policy "Usuarios actualizan sus tareas"
  on agent_tasks for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Columna preferences en memberships (preferencias arbitrarias por usuario)
alter table memberships
  add column if not exists preferences jsonb not null default '{}'::jsonb;

-- Comentario para documentar la estructura prevista
comment on column memberships.preferences is
  'Preferencias por usuario en formato JSON. Claves previstas:
   agent_default_mode (step_by_step|milestones|autonomous),
   y otras a añadir en el futuro sin migraciones.';
