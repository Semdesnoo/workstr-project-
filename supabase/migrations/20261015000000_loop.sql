-- Kernloop (pilaren 1+2): Work Profile ↔ vacature ↔ wederzijdse interesse ↔ chat.
-- Accounts: één auth-gebruiker kan een Work Profile hebben (professional) en/of lid zijn
-- van een bedrijf (members, uit core). Privacy staat hier, niet in de app:
--   * een profiel is alleen zichtbaar voor de eigenaar en voor bedrijfsleden als het
--     'vindbaar' is of als de professional interesse toonde in een vacature van dat bedrijf;
--   * interesse en chat lopen via RPC's, zodat niemand de vlag van de andere kant zet;
--   * 'verified' op certificaten kan een gebruiker zelf nooit zetten.

-- ---------------------------------------------------------------- bedrijfsprofiel + live vacatures
alter table public.companies
  add column city text check (char_length(city) <= 80),
  add column industry text check (char_length(industry) <= 80),
  add column size text check (char_length(size) <= 20),
  add column kvk text check (kvk ~ '^\d{8}$'),
  add column about text check (char_length(about) <= 1000),
  add column workplace text[] not null default '{}' check (cardinality(workplace) <= 10),
  add column media text[] not null default '{}' check (cardinality(media) <= 12),
  add column people jsonb not null default '[]';
-- Bedrijfsprofielen zijn openbaar voor ingelogde gebruikers (professionals moeten ze kunnen zien).
create policy companies_public on public.companies for select to authenticated using (true);

alter table public.vacancies
  add column photo text, add column video text,
  add column team text check (char_length(team) <= 500),
  add column min_years int check (min_years between 0 and 50);
create policy vacancies_live on public.vacancies for select to authenticated using (status = 'live');

-- ---------------------------------------------------------------- Work Profile
create table public.profiles (
  id uuid primary key default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  headline text check (char_length(headline) <= 120),
  city text check (char_length(city) <= 80),
  about text check (char_length(about) <= 1000),
  photo text,
  years int not null default 0 check (years between 0 and 60),
  skills text[] not null default '{}' check (cardinality(skills) <= 60),
  sectors text[] not null default '{}' check (cardinality(sectors) <= 20),
  experience jsonb not null default '[]',
  education jsonb not null default '[]',
  availability text not null default 'now' check (availability in ('now', '2w', '1m', 'date', 'no')),
  available_from date,
  radius_km int not null default 80 check (radius_km between 0 and 1000),
  min_rate numeric(8, 2) not null default 0 check (min_rate >= 0),
  contracts text[] not null default '{}',
  discoverable boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profile_certificates (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null default auth.uid() references public.profiles on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  number text check (char_length(number) <= 60),
  issuer text check (char_length(issuer) <= 120),
  valid_until date,
  verified boolean not null default false,   -- alleen via controle (service role), nooit door de gebruiker
  file_path text
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null default auth.uid() references public.profiles on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  text text check (char_length(text) <= 1000),
  sector text check (char_length(sector) <= 60),
  skills text[] not null default '{}' check (cardinality(skills) <= 30),
  period text check (char_length(period) <= 60),
  photos text[] not null default '{}' check (cardinality(photos) <= 4),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- interesse + chat
create table public.interests (
  id uuid primary key default gen_random_uuid(),
  vacancy_id uuid not null references public.vacancies on delete cascade,
  profile_id uuid not null references public.profiles on delete cascade,
  cand boolean not null default false,
  co boolean not null default false,
  declined text check (declined in ('cand', 'co')),
  note text check (char_length(note) <= 300),
  created_at timestamptz not null default now(),
  unique (vacancy_id, profile_id)
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  interest_id uuid not null references public.interests on delete cascade,
  sender text not null check (sender in ('cand', 'co')),
  author uuid not null default auth.uid() references auth.users on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index chat_messages_interest on public.chat_messages (interest_id, created_at);

-- ---------------------------------------------------------------- helpers (security definer: lezen zonder RLS-recursie)
create function public.member_of_vacancy(v uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.vacancies x join public.members m on m.company_id = x.company_id where x.id = v and m.user_id = auth.uid())
$$;

create function public.can_view_profile(p uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select p = auth.uid()
    or (exists (select 1 from public.profiles where id = p and discoverable)
        and exists (select 1 from public.members where user_id = auth.uid()))
    or exists (select 1 from public.interests i join public.vacancies v on v.id = i.vacancy_id
               join public.members m on m.company_id = v.company_id
               where i.profile_id = p and m.user_id = auth.uid() and (i.cand or i.co))
$$;

-- Welke kant is de huidige gebruiker in deze interesse? 'cand' | 'co' | null
create function public.interest_side(i uuid) returns text language sql stable security definer set search_path = '' as $$
  select case
    when x.profile_id = auth.uid() then 'cand'
    when public.member_of_vacancy(x.vacancy_id) then 'co'
  end from public.interests x where x.id = i
$$;

-- Professional toont interesse / solliciteert (optioneel bericht). Heropent eigen afwijzing.
create function public.show_interest(p_vacancy uuid, p_note text default null) returns uuid language plpgsql security definer set search_path = '' as $$
declare iid uuid;
begin
  if not exists (select 1 from public.profiles where id = auth.uid()) then raise exception 'maak eerst een Work Profile'; end if;
  if not exists (select 1 from public.vacancies where id = p_vacancy and status = 'live') then raise exception 'vacature niet beschikbaar'; end if;
  insert into public.interests (vacancy_id, profile_id, cand, note) values (p_vacancy, auth.uid(), true, nullif(btrim(p_note), ''))
  on conflict (vacancy_id, profile_id) do update
    set cand = true, note = coalesce(excluded.note, public.interests.note),
        declined = case when public.interests.declined = 'cand' then null else public.interests.declined end
  returning id into iid;
  return iid;
end $$;

-- Bedrijf toont interesse in een profiel dat het mag zien, voor een eigen vacature.
create function public.company_interest(p_vacancy uuid, p_profile uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare iid uuid;
begin
  if not public.member_of_vacancy(p_vacancy) then raise exception 'geen toegang tot deze vacature'; end if;
  if not public.can_view_profile(p_profile) then raise exception 'profiel niet zichtbaar'; end if;
  insert into public.interests (vacancy_id, profile_id, co) values (p_vacancy, p_profile, true)
  on conflict (vacancy_id, profile_id) do update
    set co = true, declined = case when public.interests.declined = 'co' then null else public.interests.declined end
  returning id into iid;
  return iid;
end $$;

create function public.decline_interest(p_interest uuid) returns void language plpgsql security definer set search_path = '' as $$
declare side text := public.interest_side(p_interest);
begin
  if side is null then raise exception 'geen toegang'; end if;
  update public.interests set declined = side where id = p_interest;
end $$;

-- ---------------------------------------------------------------- RLS + grants
alter table public.profiles enable row level security;
alter table public.profile_certificates enable row level security;
alter table public.projects enable row level security;
alter table public.interests enable row level security;
alter table public.chat_messages enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (public.can_view_profile(id));
create policy profiles_own on public.profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy certs_read on public.profile_certificates for select to authenticated using (public.can_view_profile(profile_id));
create policy certs_own on public.profile_certificates for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy projects_read on public.projects for select to authenticated using (public.can_view_profile(profile_id));
create policy projects_own on public.projects for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy interests_read on public.interests for select to authenticated using (public.interest_side(id) is not null);

create policy chat_read on public.chat_messages for select to authenticated using (public.interest_side(interest_id) is not null);
create policy chat_send on public.chat_messages for insert to authenticated with check (
  author = auth.uid()
  and sender = public.interest_side(interest_id)
  and exists (select 1 from public.interests i where i.id = interest_id and i.cand and i.co and i.declined is null)
);

grant select, delete on public.profiles to authenticated;
grant insert (name, headline, city, about, photo, years, skills, sectors, experience, education, availability, available_from, radius_km, min_rate, contracts, discoverable),
      update (name, headline, city, about, photo, years, skills, sectors, experience, education, availability, available_from, radius_km, min_rate, contracts, discoverable)
  on public.profiles to authenticated;
grant select, delete on public.profile_certificates to authenticated;
grant insert (id, name, number, issuer, valid_until, file_path), update (name, number, issuer, valid_until, file_path) on public.profile_certificates to authenticated;
grant select, delete on public.projects to authenticated;
grant insert (id, title, text, sector, skills, period, photos), update (title, text, sector, skills, period, photos) on public.projects to authenticated;
grant select on public.interests to authenticated;
grant select on public.chat_messages to authenticated;
grant insert (interest_id, sender, body) on public.chat_messages to authenticated;

revoke execute on function public.show_interest(uuid, text), public.company_interest(uuid, uuid), public.decline_interest(uuid),
  public.member_of_vacancy(uuid), public.can_view_profile(uuid), public.interest_side(uuid) from public, anon;
grant execute on function public.show_interest(uuid, text), public.company_interest(uuid, uuid), public.decline_interest(uuid),
  public.member_of_vacancy(uuid), public.can_view_profile(uuid), public.interest_side(uuid) to authenticated;
