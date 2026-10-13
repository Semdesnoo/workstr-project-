-- Workstr core schema (Fase 1). Multi-tenant: every row belongs to a company; RLS limits
-- access to members of that company. Run once in Supabase → SQL Editor.
-- Project settings assumed: "Automatically expose new tables" OFF → explicit grants below.

create type public.member_role as enum ('admin', 'recruiter');
create type public.app_stage as enum ('Nieuw', 'Benaderd', 'Gescreend', 'Gesprek', 'Aanbod', 'Geplaatst', 'Afgewezen');
create type public.channel as enum ('whatsapp', 'email', 'app');
create type public.job_status as enum ('queued', 'retry', 'sent', 'failed', 'dead', 'approval', 'cancelled');

-- ---------------------------------------------------------------- tenancy
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  created_at timestamptz not null default now()
);

create table public.members (
  company_id uuid not null references public.companies on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role public.member_role not null default 'recruiter',
  primary key (company_id, user_id)
);

-- security definer: reads members without recursing into members' own RLS.
create function public.is_member(c uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.members where company_id = c and user_id = auth.uid())
$$;
create function public.is_admin(c uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.members where company_id = c and user_id = auth.uid() and role = 'admin')
$$;

-- Sign-up bootstrap: the caller creates a company and becomes its admin.
create function public.create_company(p_name text) returns uuid language plpgsql security definer set search_path = '' as $$
declare cid uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.companies (name) values (p_name) returning id into cid;
  insert into public.members (company_id, user_id, role) values (cid, auth.uid(), 'admin');
  return cid;
end $$;

-- ---------------------------------------------------------------- ATS / CRM
-- Child tables reference (id, company_id) so a row can never point into another company.
create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  name text not null check (length(name) between 1 and 200),
  headline text, city text, email text, phone text,
  source text not null default 'Handmatig',
  availability text not null default 'now' check (availability in ('now', '2w', '1m', 'date', 'no')),
  rate numeric(8, 2) check (rate >= 0),
  skills text[] not null default '{}', tags text[] not null default '{}',
  consent_at timestamptz,            -- AVG: when the candidate agreed to be in the CRM
  created_at timestamptz not null default now(),
  unique (id, company_id)
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  candidate_id uuid not null,
  name text not null, number text, issuer text,
  valid_until date, verified boolean not null default false,
  file_path text,                    -- Supabase Storage path (Fase 2)
  foreign key (candidate_id, company_id) references public.candidates (id, company_id) on delete cascade
);

create table public.vacancies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  title text not null check (length(title) between 1 and 200),
  city text, sector text, duration text,
  rate_min numeric(10, 2), rate_max numeric(10, 2) check (rate_max is null or rate_min is null or rate_max >= rate_min),
  unit text not null default 'uur' check (unit in ('uur', 'maand')),
  contract text check (contract in ('freelance', 'project', 'vast', 'parttime', 'fulltime')),
  start_date date,
  skills text[] not null default '{}', certs text[] not null default '{}', tasks text[] not null default '{}',
  status text not null default 'live' check (status in ('draft', 'live', 'closed')),
  created_at timestamptz not null default now(),
  unique (id, company_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  candidate_id uuid not null,
  vacancy_id uuid not null,
  stage public.app_stage not null default 'Nieuw',
  screen jsonb,                      -- Screening Agent result {result, reasons[]}
  created_at timestamptz not null default now(),
  unique (candidate_id, vacancy_id),
  foreign key (candidate_id, company_id) references public.candidates (id, company_id) on delete cascade,
  foreign key (vacancy_id, company_id) references public.vacancies (id, company_id) on delete cascade
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  candidate_id uuid not null,
  vacancy_id uuid,
  starts_at timestamptz not null,
  kind text not null default 'Videogesprek',
  foreign key (candidate_id, company_id) references public.candidates (id, company_id) on delete cascade,
  foreign key (vacancy_id, company_id) references public.vacancies (id, company_id) on delete cascade
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  candidate_id uuid not null,
  channel public.channel not null,
  direction text not null check (direction in ('in', 'out')),
  body text not null,
  key text not null default gen_random_uuid()::text,   -- idempotency, shared with outbound_jobs
  workflow text,
  created_at timestamptz not null default now(),
  unique (company_id, key),
  foreign key (candidate_id, company_id) references public.candidates (id, company_id) on delete cascade
);

-- ---------------------------------------------------------------- automation (layer 2)
create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  name text not null, enabled boolean not null default true,
  trigger text not null check (trigger in ('candidate.created', 'stage.changed', 'interview.scheduled', 'no_reply', 'cert.expiring')),
  conditions jsonb not null default '{}', actions jsonb not null default '[]',
  requires_approval boolean not null default false
);

create table public.outbound_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  candidate_id uuid not null,
  key text not null,
  channel public.channel not null,
  body text not null,
  status public.job_status not null default 'queued',
  attempts int not null default 0,
  run_at timestamptz not null default now(),
  error text, workflow text,
  created_at timestamptz not null default now(),
  unique (company_id, key),
  foreign key (candidate_id, company_id) references public.candidates (id, company_id) on delete cascade
);
create index outbound_due on public.outbound_jobs (run_at) where status in ('queued', 'retry');

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  agent text not null, body text not null,
  on_approve jsonb, on_reject jsonb,
  status text not null default 'open' check (status in ('open', 'approved', 'rejected')),
  decided_by uuid references auth.users, decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies on delete cascade,
  actor text not null,
  kind text not null check (kind in ('ai', 'rule', 'human')),
  body text not null,
  at timestamptz not null default now()
);

-- ---------------------------------------------------------------- RLS + grants
alter table public.companies enable row level security;
alter table public.members enable row level security;

create policy companies_read on public.companies for select to authenticated using (public.is_member(id));
create policy companies_admin on public.companies for update to authenticated using (public.is_admin(id)) with check (public.is_admin(id));
create policy members_read on public.members for select to authenticated using (public.is_member(company_id));
create policy members_admin on public.members for all to authenticated using (public.is_admin(company_id)) with check (public.is_admin(company_id));

do $$
declare t text;
begin
  foreach t in array array['candidates', 'certificates', 'vacancies', 'applications', 'events', 'messages', 'workflows', 'outbound_jobs', 'approvals'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy tenant on public.%I for all to authenticated using (public.is_member(company_id)) with check (public.is_member(company_id))', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- audit log is append-only
alter table public.audit_log enable row level security;
create policy audit_read on public.audit_log for select to authenticated using (public.is_member(company_id));
create policy audit_write on public.audit_log for insert to authenticated with check (public.is_member(company_id));
grant select, insert on public.audit_log to authenticated;

grant select, update on public.companies to authenticated;
grant select, insert, update, delete on public.members to authenticated;

revoke execute on function public.create_company(text) from public, anon;
grant execute on function public.create_company(text) to authenticated;
grant execute on function public.is_member(uuid), public.is_admin(uuid) to authenticated;
