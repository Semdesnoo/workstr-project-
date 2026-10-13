-- Fase 1b: what the Business UI needs on top of the core schema.

-- Sourced profiles keep their source id so they're never imported twice.
alter table public.candidates add column external_id text;
alter table public.candidates add constraint candidates_external_unique unique (company_id, external_id);

-- Recruiter to-dos created by workflows and agents.
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  candidate_id uuid,
  text text not null,
  key text,                          -- idempotency for agent-created tasks
  done boolean not null default false,
  created_at timestamptz not null default now(),
  unique (company_id, key),
  foreign key (candidate_id, company_id) references public.candidates (id, company_id) on delete cascade
);
alter table public.tasks enable row level security;
create policy tenant on public.tasks for all to authenticated using (public.is_member(company_id)) with check (public.is_member(company_id));
grant select, insert, update, delete on public.tasks to authenticated;
