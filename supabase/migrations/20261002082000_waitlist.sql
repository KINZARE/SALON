create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  preferred_staff_id uuid references public.staff(id) on delete set null,
  customer_name text not null check (char_length(trim(customer_name)) between 1 and 160),
  phone text,
  email text,
  requested_from date not null,
  requested_to date not null,
  status text not null default 'waiting' check (status in ('waiting','contacted','booked','cancelled')),
  source text not null default 'public_booking',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requested_to >= requested_from),
  check (nullif(trim(phone),'') is not null or nullif(trim(email),'') is not null)
);

alter table public.waitlist_entries enable row level security;
revoke all on public.waitlist_entries from anon,authenticated;
grant select,insert,update,delete on public.waitlist_entries to service_role;

create index idx_waitlist_salon_status_window
  on public.waitlist_entries(salon_id,status,requested_from,requested_to);
create index idx_waitlist_service_status
  on public.waitlist_entries(salon_id,service_id,status);
create index idx_waitlist_staff_status
  on public.waitlist_entries(salon_id,preferred_staff_id,status)
  where preferred_staff_id is not null;
