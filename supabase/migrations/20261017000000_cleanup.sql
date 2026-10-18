-- Een beslisser verwijderen mag een goedkeuring niet blokkeren (AVG-verwijdering).
alter table public.approvals drop constraint if exists approvals_decided_by_fkey,
  add constraint approvals_decided_by_fkey foreign key (decided_by) references auth.users on delete set null;

-- Account verwijderen ruimt ook bedrijven op waarvan je het enige lid was (met hun vacatures),
-- zodat geen verweesde vacatures in Discover blijven staan.
create or replace function public.delete_account() returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from public.companies c
   where exists (select 1 from public.members m where m.company_id = c.id and m.user_id = auth.uid())
     and not exists (select 1 from public.members m where m.company_id = c.id and m.user_id <> auth.uid());
  delete from auth.users where id = auth.uid();
end $$;

-- Eenmalig: testaccounts (alleen @mailinator.com, aangemaakt door de CI/e2e-tests) en hun bedrijven
-- weghalen vóór livegang, zodat Discover en de funnel alleen echte data tonen. De tests ruimen voortaan zelf op.
delete from public.companies c
 where exists (select 1 from public.members m join auth.users u on u.id = m.user_id where m.company_id = c.id and u.email like '%@mailinator.com')
   and not exists (select 1 from public.members m join auth.users u on u.id = m.user_id where m.company_id = c.id and u.email not like '%@mailinator.com');
delete from auth.users where email like '%@mailinator.com';
delete from public.client_errors where message like 'test:%';
