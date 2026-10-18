-- Pilaren 3, 5, 6 + wat de app nodig heeft om echt te draaien.

-- ---------------------------------------------------------------- 3. opslag (foto's en video's)
-- ponytail: één publieke bucket met onraadbare paden (<user-id>/<uuid>.<ext>). Goed voor
-- profiel-, project- en bedrijfsbeelden. Gevoelige documenten (certificaatscans, cv's) krijgen
-- later een private bucket met signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 62914560, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy media_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and owner_id = auth.uid()::text);
create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and owner_id = auth.uid()::text);

-- ---------------------------------------------------------------- bedrijf aanmaken met client-id
-- De app kent het bedrijfs-id vóór het opslaan (vacatures verwijzen ernaar).
drop function public.create_company(text);
create function public.create_company(p_name text, p_id uuid default gen_random_uuid()) returns uuid
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.companies (id, name) values (p_id, p_name);
  insert into public.members (company_id, user_id, role) values (p_id, auth.uid(), 'admin');
  return p_id;
end $$;
revoke execute on function public.create_company(text, uuid) from public, anon;
grant execute on function public.create_company(text, uuid) to authenticated;

-- ---------------------------------------------------------------- 5. funnelmeting
-- Geen tracking-tabel: de funnel volgt uit de echte data. Alleen het Workstr-team (staff) ziet hem.
create table public.staff (user_id uuid primary key references auth.users on delete cascade);
alter table public.staff enable row level security;
create policy staff_self on public.staff for select to authenticated using (user_id = auth.uid());
grant select on public.staff to authenticated;
-- Jezelf toevoegen (eenmalig, SQL editor):  insert into public.staff select id from auth.users where email = 'jij@voorbeeld.nl';

create function public.funnel_stats(p_days int default 3650) returns table (step text, total bigint)
language plpgsql stable security definer set search_path = '' as $$
declare since timestamptz := now() - make_interval(days => greatest(p_days, 1));
begin
  if not exists (select 1 from public.staff where user_id = auth.uid()) then raise exception 'geen toegang'; end if;
  return query
    select 'accounts', count(*) from auth.users where created_at >= since
    union all select 'work_profiles', count(*) from public.profiles where created_at >= since
    union all select 'profielen_met_project', count(distinct p.profile_id) from public.projects p where p.created_at >= since
    union all select 'bedrijven', count(*) from public.companies c where c.created_at >= since and exists (select 1 from public.members m where m.company_id = c.id)
    union all select 'vacatures_live', count(*) from public.vacancies v where v.status = 'live' and v.created_at >= since
    union all select 'sollicitaties', count(*) from public.interests i where i.cand and i.created_at >= since
    union all select 'bedrijf_toont_interesse', count(*) from public.interests i where i.co and i.created_at >= since
    union all select 'matches', count(*) from public.interests i where i.cand and i.co and i.created_at >= since
    union all select 'gesprekken', count(*) from public.interests i where i.created_at >= since
      and exists (select 1 from public.chat_messages m where m.interest_id = i.id and m.sender = 'cand')
      and exists (select 1 from public.chat_messages m where m.interest_id = i.id and m.sender = 'co');
end $$;
revoke execute on function public.funnel_stats(int) from public, anon;
grant execute on function public.funnel_stats(int) to authenticated;

-- ---------------------------------------------------------------- 6. account verwijderen + foutmeldingen
-- AVG: een gebruiker verwijdert zijn eigen account; profiel, projecten, certificaten, interesse
-- en lidmaatschappen gaan mee (cascade). De app wist eerst de eigen bestanden via de Storage-API
-- (direct verwijderen uit storage.objects is niet toegestaan).
create function public.delete_account() returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;

-- Fouten uit de browser, zodat we zien wat stukgaat. Alleen schrijven; lezen via het dashboard.
create table public.client_errors (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid default auth.uid(),
  message text not null check (char_length(message) <= 500),
  source text check (char_length(source) <= 300),
  page text check (char_length(page) <= 300)
);
alter table public.client_errors enable row level security;
create policy client_errors_write on public.client_errors for insert to anon, authenticated with check (true);
grant insert (message, source, page) on public.client_errors to anon, authenticated;
