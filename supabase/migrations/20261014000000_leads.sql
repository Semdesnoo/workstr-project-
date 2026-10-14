-- Website: early-access and demo requests. Anyone may insert, nobody can read back
-- through the API (no select grant) — leads are only visible in the Supabase dashboard.
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('professional', 'company')),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  email text not null check (char_length(email) <= 200 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  company text check (char_length(company) <= 160),
  role text check (char_length(role) <= 120),
  phone text check (char_length(phone) <= 40),
  size text check (char_length(size) <= 20),
  interests text[] not null default '{}' check (cardinality(interests) <= 6),
  message text check (char_length(message) <= 1000),
  source text check (char_length(source) <= 60),
  check (kind = 'professional' or char_length(btrim(coalesce(company, ''))) >= 2)
);
alter table public.leads enable row level security;
create policy leads_signup on public.leads for insert to anon, authenticated with check (true);
grant insert on public.leads to anon, authenticated;
