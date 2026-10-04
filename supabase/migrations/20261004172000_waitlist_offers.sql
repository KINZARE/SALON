alter table public.waitlist_entries
  drop constraint if exists waitlist_entries_salon_id_id_key;
alter table public.waitlist_entries
  add constraint waitlist_entries_salon_id_id_key unique (salon_id,id);

create table if not exists public.waitlist_offers (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  waitlist_entry_id uuid not null,
  service_id uuid not null,
  staff_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null default 'offered',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint waitlist_offers_salon_entry_fkey foreign key (salon_id,waitlist_entry_id) references public.waitlist_entries(salon_id,id) on delete cascade,
  constraint waitlist_offers_salon_service_fkey foreign key (salon_id,service_id) references public.services(salon_id,id),
  constraint waitlist_offers_salon_staff_fkey foreign key (salon_id,staff_id) references public.staff(salon_id,id),
  constraint waitlist_offers_range_valid check (ends_at>starts_at),
  constraint waitlist_offers_expiry_valid check (expires_at>created_at and expires_at<starts_at),
  constraint waitlist_offers_status_valid check (status in ('offered','expired','cancelled','booked'))
);

create index if not exists idx_waitlist_offers_salon_status_expiry
  on public.waitlist_offers(salon_id,status,expires_at);
create index if not exists idx_waitlist_offers_entry_created
  on public.waitlist_offers(waitlist_entry_id,created_at desc);
create unique index if not exists uq_waitlist_offers_active_entry
  on public.waitlist_offers(waitlist_entry_id)
  where status='offered';

alter table public.waitlist_offers enable row level security;

revoke all on table public.waitlist_offers from public,anon;
grant select,insert,update,delete on table public.waitlist_offers to authenticated,service_role;

drop policy if exists waitlist_offers_manager_select on public.waitlist_offers;
create policy waitlist_offers_manager_select on public.waitlist_offers
for select to authenticated
using (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]));

drop policy if exists waitlist_offers_manager_write on public.waitlist_offers;
create policy waitlist_offers_manager_write on public.waitlist_offers
for all to authenticated
using (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]))
with check (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]));

create or replace function private.expire_waitlist_offers(p_salon_id uuid,p_waitlist_entry_id uuid default null)
returns integer
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_count integer;
begin
  update public.waitlist_offers
  set status='expired',updated_at=now()
  where salon_id=p_salon_id
    and status='offered'
    and expires_at<=now()
    and (p_waitlist_entry_id is null or waitlist_entry_id=p_waitlist_entry_id);
  get diagnostics v_count=row_count;
  return v_count;
end;
$$;

revoke all on function private.expire_waitlist_offers(uuid,uuid) from public,anon;
grant execute on function private.expire_waitlist_offers(uuid,uuid) to authenticated,service_role;
