create table public.smart_booking_links (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete set null,
  token_hash text not null unique,
  starts_on date not null,
  ends_on date not null,
  expires_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint smart_booking_links_window check (ends_on>=starts_on and ends_on<=starts_on+30)
);

alter table public.smart_booking_links enable row level security;
revoke all on public.smart_booking_links from anon,authenticated;
grant select,insert,update,delete on public.smart_booking_links to service_role;

create index idx_smart_booking_links_salon on public.smart_booking_links(salon_id,created_at desc);
create index idx_smart_booking_links_service on public.smart_booking_links(salon_id,service_id);
create index idx_smart_booking_links_staff on public.smart_booking_links(salon_id,staff_id) where staff_id is not null;
