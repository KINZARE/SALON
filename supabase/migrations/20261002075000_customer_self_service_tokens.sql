create table public.appointment_self_service_tokens (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id)
);

alter table public.appointment_self_service_tokens enable row level security;
revoke all on public.appointment_self_service_tokens from anon, authenticated;
grant select,insert,update,delete on public.appointment_self_service_tokens to service_role;

create index idx_self_service_tokens_salon_appointment
  on public.appointment_self_service_tokens(salon_id,appointment_id);
