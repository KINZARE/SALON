create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create type public.membership_role as enum ('owner','manager','staff');
create type public.appointment_status as enum ('pending','confirmed','checked_in','completed','cancelled','no_show');
create type public.payment_status as enum ('unpaid','pending','paid','partially_refunded','refunded','failed');
create type public.payment_mode as enum ('none','pay_in_salon','deposit','full_payment');
create type public.appointment_source as enum ('public_booking','internal','import');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table public.salons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  phone text,
  email text,
  address text,
  timezone text not null default 'Europe/Amsterdam',
  currency char(3) not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null,
  created_at timestamptz not null default now(),
  unique (salon_id, user_id)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  duration_minutes integer not null check (duration_minutes between 5 and 720),
  price_cents integer not null check (price_cents >= 0),
  currency char(3) not null default 'EUR',
  buffer_minutes integer not null default 0 check (buffer_minutes between 0 and 180),
  active boolean not null default true,
  online_bookable boolean not null default true,
  payment_mode public.payment_mode not null default 'pay_in_salon',
  deposit_cents integer check (deposit_cents is null or deposit_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id, id),
  check (payment_mode <> 'deposit' or deposit_cents is not null)
);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  photo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id, id),
  unique (salon_id, user_id)
);

create table public.staff_services (
  salon_id uuid not null,
  staff_id uuid not null,
  service_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (staff_id, service_id),
  foreign key (salon_id, staff_id) references public.staff(salon_id, id) on delete cascade,
  foreign key (salon_id, service_id) references public.services(salon_id, id) on delete cascade
);

create table public.opening_hours (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  is_open boolean not null default true,
  start_time time,
  end_time time,
  unique (salon_id, weekday),
  check (
    (is_open and start_time is not null and end_time is not null and start_time < end_time)
    or
    (not is_open and start_time is null and end_time is null)
  )
);

create table public.staff_schedules (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null,
  staff_id uuid not null,
  weekday smallint not null check (weekday between 0 and 6),
  is_working boolean not null default true,
  start_time time,
  end_time time,
  unique (staff_id, weekday),
  foreign key (salon_id, staff_id) references public.staff(salon_id, id) on delete cascade,
  check (
    (is_working and start_time is not null and end_time is not null and start_time < end_time)
    or
    (not is_working and start_time is null and end_time is null)
  )
);

create table public.breaks (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null,
  staff_id uuid not null,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  label text,
  active boolean not null default true,
  foreign key (salon_id, staff_id) references public.staff(salon_id, id) on delete cascade,
  check (start_time < end_time)
);

create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  staff_id uuid,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (starts_at < ends_at),
  foreign key (salon_id, staff_id) references public.staff(salon_id, id) on delete cascade
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  phone text,
  phone_normalized text,
  email text,
  email_normalized text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id, id)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  customer_id uuid not null,
  staff_id uuid not null,
  service_id uuid,
  starts_at timestamptz not null,
  service_ends_at timestamptz not null,
  occupied_until timestamptz not null,
  customer_name_snapshot text not null,
  service_name_snapshot text not null,
  duration_minutes_snapshot integer not null check (duration_minutes_snapshot > 0),
  buffer_minutes_snapshot integer not null default 0 check (buffer_minutes_snapshot >= 0),
  price_cents_snapshot integer not null check (price_cents_snapshot >= 0),
  currency_snapshot char(3) not null,
  status public.appointment_status not null default 'confirmed',
  payment_status public.payment_status not null default 'unpaid',
  note text,
  source public.appointment_source not null default 'internal',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (salon_id, customer_id) references public.customers(salon_id, id) on delete restrict,
  foreign key (salon_id, staff_id) references public.staff(salon_id, id) on delete restrict,
  foreign key (salon_id, service_id) references public.services(salon_id, id) on delete restrict,
  check (starts_at < service_ends_at and service_ends_at <= occupied_until)
);

alter table public.appointments
  add constraint appointments_no_staff_overlap
  exclude using gist (
    salon_id with =,
    staff_id with =,
    tstzrange(starts_at, occupied_until, '[)') with &&
  )
  where (status in ('pending','confirmed','checked_in'));

create table public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  event_type text not null,
  from_status public.appointment_status,
  to_status public.appointment_status,
  metadata jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  provider text,
  provider_payment_id text,
  amount_cents integer not null check (amount_cents >= 0),
  currency char(3) not null,
  status public.payment_status not null default 'pending',
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id),
  unique (salon_id, idempotency_key)
);

create table public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete cascade,
  kind text not null,
  channel text not null,
  recipient text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.booking_settings (
  salon_id uuid primary key references public.salons(id) on delete cascade,
  slot_interval_minutes integer not null default 15 check (slot_interval_minutes in (5,10,15,20,30,60)),
  min_lead_minutes integer not null default 60 check (min_lead_minutes >= 0),
  max_days_ahead integer not null default 90 check (max_days_ahead between 1 and 365),
  allow_staff_choice boolean not null default true,
  cancellation_hours integer not null default 24 check (cancellation_hours >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_memberships_user on public.memberships(user_id, salon_id);
create index idx_services_salon_active on public.services(salon_id, active, online_bookable);
create index idx_staff_salon_active on public.staff(salon_id, active);
create index idx_blocks_salon_time on public.blocks(salon_id, starts_at, ends_at);
create index idx_customers_salon_name on public.customers(salon_id, lower(name));
create index idx_customers_salon_phone on public.customers(salon_id, phone_normalized) where phone_normalized is not null;
create index idx_customers_salon_email on public.customers(salon_id, email_normalized) where email_normalized is not null;
create index idx_appointments_salon_start on public.appointments(salon_id, starts_at);
create index idx_appointments_staff_start on public.appointments(staff_id, starts_at);
create index idx_appointments_customer_start on public.appointments(customer_id, starts_at desc);
create index idx_notification_jobs_due on public.notification_jobs(status, next_attempt_at) where status in ('pending','failed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger salons_set_updated_at before update on public.salons for each row execute function public.set_updated_at();
create trigger services_set_updated_at before update on public.services for each row execute function public.set_updated_at();
create trigger staff_set_updated_at before update on public.staff for each row execute function public.set_updated_at();
create trigger customers_set_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger appointments_set_updated_at before update on public.appointments for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger notification_jobs_set_updated_at before update on public.notification_jobs for each row execute function public.set_updated_at();
create trigger booking_settings_set_updated_at before update on public.booking_settings for each row execute function public.set_updated_at();

create or replace function public.has_salon_role(p_salon_id uuid, p_roles public.membership_role[] default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.salon_id = p_salon_id
      and m.user_id = auth.uid()
      and (p_roles is null or m.role = any(p_roles))
  );
$$;

revoke all on function public.has_salon_role(uuid, public.membership_role[]) from public;
grant execute on function public.has_salon_role(uuid, public.membership_role[]) to authenticated;

create or replace function public.is_staff_user_for_appointment(p_appointment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.appointments a
    join public.staff s on s.id = a.staff_id and s.salon_id = a.salon_id
    where a.id = p_appointment_id and s.user_id = auth.uid()
  );
$$;

revoke all on function public.is_staff_user_for_appointment(uuid) from public;
grant execute on function public.is_staff_user_for_appointment(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.salons enable row level security;
alter table public.memberships enable row level security;
alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.staff_services enable row level security;
alter table public.opening_hours enable row level security;
alter table public.staff_schedules enable row level security;
alter table public.breaks enable row level security;
alter table public.blocks enable row level security;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_events enable row level security;
alter table public.payments enable row level security;
alter table public.notification_jobs enable row level security;
alter table public.booking_settings enable row level security;

create policy profiles_self_select on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy salons_member_select on public.salons for select to authenticated using (public.has_salon_role(id));
create policy salons_owner_update on public.salons for update to authenticated using (public.has_salon_role(id, array['owner']::public.membership_role[])) with check (public.has_salon_role(id, array['owner']::public.membership_role[]));

create policy memberships_member_select on public.memberships for select to authenticated using (public.has_salon_role(salon_id));
create policy memberships_owner_write on public.memberships for all to authenticated using (public.has_salon_role(salon_id, array['owner']::public.membership_role[])) with check (public.has_salon_role(salon_id, array['owner']::public.membership_role[]));

create policy services_member_select on public.services for select to authenticated using (public.has_salon_role(salon_id));
create policy services_owner_write on public.services for all to authenticated using (public.has_salon_role(salon_id, array['owner']::public.membership_role[])) with check (public.has_salon_role(salon_id, array['owner']::public.membership_role[]));

create policy staff_member_select on public.staff for select to authenticated using (public.has_salon_role(salon_id));
create policy staff_owner_write on public.staff for all to authenticated using (public.has_salon_role(salon_id, array['owner']::public.membership_role[])) with check (public.has_salon_role(salon_id, array['owner']::public.membership_role[]));

create policy staff_services_member_select on public.staff_services for select to authenticated using (public.has_salon_role(salon_id));
create policy staff_services_owner_write on public.staff_services for all to authenticated using (public.has_salon_role(salon_id, array['owner']::public.membership_role[])) with check (public.has_salon_role(salon_id, array['owner']::public.membership_role[]));

create policy opening_hours_member_select on public.opening_hours for select to authenticated using (public.has_salon_role(salon_id));
create policy opening_hours_owner_write on public.opening_hours for all to authenticated using (public.has_salon_role(salon_id, array['owner']::public.membership_role[])) with check (public.has_salon_role(salon_id, array['owner']::public.membership_role[]));

create policy staff_schedules_member_select on public.staff_schedules for select to authenticated using (public.has_salon_role(salon_id));
create policy staff_schedules_owner_write on public.staff_schedules for all to authenticated using (public.has_salon_role(salon_id, array['owner']::public.membership_role[])) with check (public.has_salon_role(salon_id, array['owner']::public.membership_role[]));

create policy breaks_member_select on public.breaks for select to authenticated using (public.has_salon_role(salon_id));
create policy breaks_manager_write on public.breaks for all to authenticated using (public.has_salon_role(salon_id, array['owner','manager']::public.membership_role[])) with check (public.has_salon_role(salon_id, array['owner','manager']::public.membership_role[]));

create policy blocks_member_select on public.blocks for select to authenticated using (public.has_salon_role(salon_id));
create policy blocks_manager_write on public.blocks for all to authenticated using (public.has_salon_role(salon_id, array['owner','manager']::public.membership_role[])) with check (public.has_salon_role(salon_id, array['owner','manager']::public.membership_role[]));

create policy customers_manager_select on public.customers for select to authenticated using (public.has_salon_role(salon_id, array['owner','manager']::public.membership_role[]));
create policy customers_manager_write on public.customers for all to authenticated using (public.has_salon_role(salon_id, array['owner','manager']::public.membership_role[])) with check (public.has_salon_role(salon_id, array['owner','manager']::public.membership_role[]));

create policy appointments_team_select on public.appointments for select to authenticated using (
  public.has_salon_role(salon_id, array['owner','manager']::public.membership_role[])
  or public.is_staff_user_for_appointment(id)
);
create policy appointments_manager_write on public.appointments for all to authenticated using (public.has_salon_role(salon_id, array['owner','manager']::public.membership_role[])) with check (public.has_salon_role(salon_id, array['owner','manager']::public.membership_role[]));

create policy appointment_events_team_select on public.appointment_events for select to authenticated using (
  public.has_salon_role(salon_id, array['owner','manager']::public.membership_role[])
  or public.is_staff_user_for_appointment(appointment_id)
);

create policy payments_owner_manager_select on public.payments for select to authenticated using (public.has_salon_role(salon_id, array['owner','manager']::public.membership_role[]));
create policy notification_jobs_owner_manager_select on public.notification_jobs for select to authenticated using (public.has_salon_role(salon_id, array['owner','manager']::public.membership_role[]));
create policy booking_settings_member_select on public.booking_settings for select to authenticated using (public.has_salon_role(salon_id));
create policy booking_settings_owner_write on public.booking_settings for all to authenticated using (public.has_salon_role(salon_id, array['owner']::public.membership_role[])) with check (public.has_salon_role(salon_id, array['owner']::public.membership_role[]));

create or replace function public.normalize_phone(value text)
returns text
language sql
immutable
as $$
  select nullif(regexp_replace(coalesce(value,''), '[^0-9+]', '', 'g'), '');
$$;

create or replace function public.normalize_email(value text)
returns text
language sql
immutable
as $$
  select nullif(lower(trim(coalesce(value,''))), '');
$$;

create or replace function public.create_appointment_atomic(
  p_salon_id uuid,
  p_service_id uuid,
  p_staff_id uuid,
  p_starts_at timestamptz,
  p_customer_name text,
  p_customer_phone text default null,
  p_customer_email text default null,
  p_note text default null,
  p_source public.appointment_source default 'public_booking',
  p_created_by uuid default null,
  p_customer_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service public.services%rowtype;
  v_staff public.staff%rowtype;
  v_salon public.salons%rowtype;
  v_settings public.booking_settings%rowtype;
  v_opening public.opening_hours%rowtype;
  v_schedule public.staff_schedules%rowtype;
  v_customer_id uuid;
  v_appointment_id uuid := gen_random_uuid();
  v_service_end timestamptz;
  v_occupied_until timestamptz;
  v_local_start timestamp;
  v_local_service_end timestamp;
  v_local_occupied_end timestamp;
  v_weekday smallint;
  v_phone_norm text := public.normalize_phone(p_customer_phone);
  v_email_norm text := public.normalize_email(p_customer_email);
begin
  if nullif(trim(p_customer_name),'') is null then
    raise exception using errcode = '22023', message = 'CUSTOMER_NAME_REQUIRED';
  end if;

  if p_starts_at is null then
    raise exception using errcode = '22023', message = 'INVALID_START_TIME';
  end if;

  select * into v_salon from public.salons where id = p_salon_id;
  if not found then raise exception using errcode = 'P0002', message = 'SALON_NOT_FOUND'; end if;

  select * into v_service
  from public.services
  where id = p_service_id and salon_id = p_salon_id and active = true
    and (p_source <> 'public_booking' or online_bookable = true)
  for share;
  if not found then raise exception using errcode = 'P0002', message = 'SERVICE_NOT_FOUND'; end if;

  select * into v_staff
  from public.staff
  where id = p_staff_id and salon_id = p_salon_id and active = true
  for share;
  if not found then raise exception using errcode = 'P0002', message = 'STAFF_NOT_FOUND'; end if;

  if not exists (
    select 1 from public.staff_services ss
    where ss.salon_id = p_salon_id and ss.staff_id = p_staff_id and ss.service_id = p_service_id
  ) then
    raise exception using errcode = '23514', message = 'STAFF_CANNOT_PERFORM_SERVICE';
  end if;

  v_service_end := p_starts_at + make_interval(mins => v_service.duration_minutes);
  v_occupied_until := v_service_end + make_interval(mins => v_service.buffer_minutes);
  v_local_start := p_starts_at at time zone v_salon.timezone;
  v_local_service_end := v_service_end at time zone v_salon.timezone;
  v_local_occupied_end := v_occupied_until at time zone v_salon.timezone;
  v_weekday := extract(dow from v_local_start)::smallint;

  if p_source = 'public_booking' then
    select * into v_settings from public.booking_settings where salon_id = p_salon_id;
    if not found then
      raise exception using errcode = '23514', message = 'BOOKING_SETTINGS_MISSING';
    end if;
    if p_starts_at < now() + make_interval(mins => v_settings.min_lead_minutes) then
      raise exception using errcode = '23514', message = 'BOOKING_TOO_SOON';
    end if;
    if v_local_start::date < (now() at time zone v_salon.timezone)::date
       or v_local_start::date > ((now() at time zone v_salon.timezone)::date + v_settings.max_days_ahead) then
      raise exception using errcode = '23514', message = 'BOOKING_OUTSIDE_WINDOW';
    end if;
  end if;

  select * into v_opening
  from public.opening_hours
  where salon_id = p_salon_id and weekday = v_weekday and is_open = true;
  if not found
     or v_local_start::date <> v_local_occupied_end::date
     or v_local_start::time < v_opening.start_time
     or v_local_occupied_end::time > v_opening.end_time then
    raise exception using errcode = '23514', message = 'SALON_CLOSED';
  end if;

  select * into v_schedule
  from public.staff_schedules
  where salon_id = p_salon_id and staff_id = p_staff_id and weekday = v_weekday and is_working = true;
  if not found
     or v_local_start::date <> v_local_occupied_end::date
     or v_local_start::time < v_schedule.start_time
     or v_local_occupied_end::time > v_schedule.end_time then
    raise exception using errcode = '23514', message = 'STAFF_NOT_WORKING';
  end if;

  if exists (
    select 1 from public.breaks b
    where b.salon_id = p_salon_id
      and b.staff_id = p_staff_id
      and b.weekday = v_weekday
      and b.active = true
      and tsrange(v_local_start, v_local_occupied_end, '[)') &&
          tsrange(v_local_start::date + b.start_time, v_local_start::date + b.end_time, '[)')
  ) then
    raise exception using errcode = '23514', message = 'STAFF_BREAK';
  end if;

  if exists (
    select 1 from public.blocks bl
    where bl.salon_id = p_salon_id
      and (bl.staff_id is null or bl.staff_id = p_staff_id)
      and tstzrange(bl.starts_at, bl.ends_at, '[)') && tstzrange(p_starts_at, v_occupied_until, '[)')
  ) then
    raise exception using errcode = '23514', message = 'TIME_BLOCKED';
  end if;

  if p_customer_id is not null then
    select c.id into v_customer_id
    from public.customers c
    where c.id = p_customer_id and c.salon_id = p_salon_id;
    if not found then
      raise exception using errcode = 'P0002', message = 'CUSTOMER_NOT_FOUND';
    end if;
  else
    select c.id into v_customer_id
    from public.customers c
    where c.salon_id = p_salon_id
      and (
        (v_phone_norm is not null and c.phone_normalized = v_phone_norm)
        or (v_email_norm is not null and c.email_normalized = v_email_norm)
      )
    order by case when v_phone_norm is not null and c.phone_normalized = v_phone_norm then 0 else 1 end, c.created_at
    limit 1;
  end if;

  if v_customer_id is null then
    insert into public.customers (salon_id, name, phone, phone_normalized, email, email_normalized)
    values (p_salon_id, trim(p_customer_name), p_customer_phone, v_phone_norm, p_customer_email, v_email_norm)
    returning id into v_customer_id;
  else
    update public.customers
    set name = coalesce(nullif(trim(p_customer_name),''), name),
        phone = coalesce(nullif(trim(p_customer_phone),''), phone),
        phone_normalized = coalesce(v_phone_norm, phone_normalized),
        email = coalesce(nullif(trim(p_customer_email),''), email),
        email_normalized = coalesce(v_email_norm, email_normalized)
    where id = v_customer_id;
  end if;

  begin
    insert into public.appointments (
      id, salon_id, customer_id, staff_id, service_id,
      starts_at, service_ends_at, occupied_until,
      customer_name_snapshot, service_name_snapshot, duration_minutes_snapshot, buffer_minutes_snapshot,
      price_cents_snapshot, currency_snapshot,
      status, payment_status, note, source, created_by
    ) values (
      v_appointment_id, p_salon_id, v_customer_id, p_staff_id, p_service_id,
      p_starts_at, v_service_end, v_occupied_until,
      trim(p_customer_name), v_service.name, v_service.duration_minutes, v_service.buffer_minutes,
      v_service.price_cents, v_service.currency,
      'confirmed', 'unpaid', nullif(trim(p_note),''), p_source, p_created_by
    );
  exception
    when exclusion_violation then
      raise exception using errcode = '23P01', message = 'SLOT_JUST_BOOKED';
  end;

  insert into public.appointment_events (
    salon_id, appointment_id, event_type, to_status, actor_user_id,
    metadata
  ) values (
    p_salon_id, v_appointment_id, 'created', 'confirmed', p_created_by,
    jsonb_build_object('source', p_source)
  );

  insert into public.notification_jobs (
    salon_id, appointment_id, kind, channel, recipient, payload
  )
  select p_salon_id, v_appointment_id, 'booking_confirmation', 'email', p_customer_email,
         jsonb_build_object('appointment_id', v_appointment_id)
  where p_customer_email is not null and trim(p_customer_email) <> '';

  return v_appointment_id;
end;
$$;

revoke all on function public.create_appointment_atomic(uuid,uuid,uuid,timestamptz,text,text,text,text,public.appointment_source,uuid,uuid) from public, anon, authenticated;
grant execute on function public.create_appointment_atomic(uuid,uuid,uuid,timestamptz,text,text,text,text,public.appointment_source,uuid,uuid) to service_role;

comment on function public.create_appointment_atomic is
'Atomic authoritative booking function. Intended for trusted server-side use only; database exclusion constraint prevents concurrent double booking.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.create_salon_with_owner(
  p_name text,
  p_slug text,
  p_phone text default null,
  p_email text default null,
  p_timezone text default 'Europe/Amsterdam',
  p_currency char(3) default 'EUR'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_salon_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if nullif(trim(p_name),'') is null then
    raise exception using errcode = '22023', message = 'SALON_NAME_REQUIRED';
  end if;
  if p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception using errcode = '22023', message = 'INVALID_SLUG';
  end if;

  insert into public.salons (name, slug, phone, email, timezone, currency)
  values (trim(p_name), p_slug, nullif(trim(p_phone),''), nullif(trim(p_email),''), p_timezone, upper(p_currency))
  returning id into v_salon_id;

  insert into public.memberships (salon_id, user_id, role)
  values (v_salon_id, v_user_id, 'owner');

  insert into public.booking_settings (salon_id) values (v_salon_id);

  return v_salon_id;
end;
$$;

revoke all on function public.create_salon_with_owner(text,text,text,text,text,char) from public, anon;
grant execute on function public.create_salon_with_owner(text,text,text,text,text,char) to authenticated;


create or replace function public.bootstrap_salon(
  p_name text,
  p_slug text,
  p_open_time time,
  p_close_time time,
  p_weekdays smallint[],
  p_service_name text,
  p_duration_minutes integer,
  p_price_cents integer,
  p_staff_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_salon_id uuid;
  v_service_id uuid;
  v_staff_id uuid;
  v_day smallint;
begin
  if v_user_id is null then raise exception using errcode = '42501', message = 'AUTH_REQUIRED'; end if;
  if nullif(trim(p_name),'') is null or nullif(trim(p_service_name),'') is null or nullif(trim(p_staff_name),'') is null then
    raise exception using errcode = '22023', message = 'REQUIRED_FIELDS_MISSING';
  end if;
  if p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception using errcode = '22023', message = 'INVALID_SLUG'; end if;
  if p_open_time >= p_close_time then raise exception using errcode = '22023', message = 'INVALID_OPENING_HOURS'; end if;
  if p_duration_minutes < 5 or p_duration_minutes > 720 or p_price_cents < 0 then
    raise exception using errcode = '22023', message = 'INVALID_SERVICE';
  end if;
  if coalesce(array_length(p_weekdays, 1), 0) = 0 then
    raise exception using errcode = '22023', message = 'OPEN_DAY_REQUIRED';
  end if;

  insert into public.salons (name, slug)
  values (trim(p_name), p_slug)
  returning id into v_salon_id;

  insert into public.memberships (salon_id, user_id, role)
  values (v_salon_id, v_user_id, 'owner');

  insert into public.booking_settings (salon_id) values (v_salon_id);

  for v_day in 0..6 loop
    if v_day = any(p_weekdays) then
      insert into public.opening_hours (salon_id, weekday, is_open, start_time, end_time)
      values (v_salon_id, v_day, true, p_open_time, p_close_time);
    else
      insert into public.opening_hours (salon_id, weekday, is_open, start_time, end_time)
      values (v_salon_id, v_day, false, null, null);
    end if;
  end loop;

  insert into public.services (salon_id, name, duration_minutes, price_cents, currency, online_bookable)
  values (v_salon_id, trim(p_service_name), p_duration_minutes, p_price_cents, 'EUR', true)
  returning id into v_service_id;

  insert into public.staff (salon_id, name)
  values (v_salon_id, trim(p_staff_name))
  returning id into v_staff_id;

  insert into public.staff_services (salon_id, staff_id, service_id)
  values (v_salon_id, v_staff_id, v_service_id);

  for v_day in 0..6 loop
    if v_day = any(p_weekdays) then
      insert into public.staff_schedules (salon_id, staff_id, weekday, is_working, start_time, end_time)
      values (v_salon_id, v_staff_id, v_day, true, p_open_time, p_close_time);
    else
      insert into public.staff_schedules (salon_id, staff_id, weekday, is_working, start_time, end_time)
      values (v_salon_id, v_staff_id, v_day, false, null, null);
    end if;
  end loop;

  return v_salon_id;
end;
$$;

revoke all on function public.bootstrap_salon(text,text,time,time,smallint[],text,integer,integer,text) from public, anon;
grant execute on function public.bootstrap_salon(text,text,time,time,smallint[],text,integer,integer,text) to authenticated;

create or replace function public.create_staff_with_schedule(
  p_salon_id uuid,
  p_name text,
  p_service_ids uuid[],
  p_weekdays smallint[],
  p_start_time time,
  p_end_time time
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff_id uuid;
  v_service_id uuid;
  v_day smallint;
begin
  if not public.has_salon_role(p_salon_id, array['owner']::public.membership_role[]) then
    raise exception using errcode = '42501', message = 'FORBIDDEN';
  end if;
  if nullif(trim(p_name), '') is null then
    raise exception using errcode = '22023', message = 'STAFF_NAME_REQUIRED';
  end if;
  if p_start_time >= p_end_time then
    raise exception using errcode = '22023', message = 'INVALID_WORKING_HOURS';
  end if;
  if coalesce(array_length(p_service_ids, 1), 0) = 0 then
    raise exception using errcode = '22023', message = 'STAFF_SERVICE_REQUIRED';
  end if;
  if coalesce(array_length(p_weekdays, 1), 0) = 0 then
    raise exception using errcode = '22023', message = 'STAFF_WORKDAY_REQUIRED';
  end if;
  if exists (
    select 1 from unnest(p_service_ids) as requested(service_id)
    where not exists (
      select 1 from public.services s
      where s.id = requested.service_id and s.salon_id = p_salon_id and s.active = true
    )
  ) then
    raise exception using errcode = '23514', message = 'INVALID_STAFF_SERVICE';
  end if;

  insert into public.staff (salon_id, name)
  values (p_salon_id, trim(p_name))
  returning id into v_staff_id;

  foreach v_service_id in array p_service_ids loop
    insert into public.staff_services (salon_id, staff_id, service_id)
    values (p_salon_id, v_staff_id, v_service_id);
  end loop;

  for v_day in 0..6 loop
    if v_day = any(p_weekdays) then
      insert into public.staff_schedules (salon_id, staff_id, weekday, is_working, start_time, end_time)
      values (p_salon_id, v_staff_id, v_day, true, p_start_time, p_end_time);
    else
      insert into public.staff_schedules (salon_id, staff_id, weekday, is_working, start_time, end_time)
      values (p_salon_id, v_staff_id, v_day, false, null, null);
    end if;
  end loop;

  return v_staff_id;
end;
$$;

revoke all on function public.create_staff_with_schedule(uuid,text,uuid[],smallint[],time,time) from public, anon;
grant execute on function public.create_staff_with_schedule(uuid,text,uuid[],smallint[],time,time) to authenticated;

create or replace function public.transition_appointment_status(
  p_appointment_id uuid,
  p_to_status public.appointment_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment public.appointments%rowtype;
  v_allowed boolean := false;
begin
  select * into v_appointment from public.appointments where id = p_appointment_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'APPOINTMENT_NOT_FOUND'; end if;
  if not public.has_salon_role(v_appointment.salon_id, array['owner','manager']::public.membership_role[]) then
    raise exception using errcode = '42501', message = 'FORBIDDEN';
  end if;

  v_allowed := case v_appointment.status
    when 'pending' then p_to_status in ('confirmed','cancelled')
    when 'confirmed' then p_to_status in ('checked_in','cancelled','no_show')
    when 'checked_in' then p_to_status in ('completed','cancelled')
    else false
  end;
  if not v_allowed then raise exception using errcode = '23514', message = 'INVALID_STATUS_TRANSITION'; end if;

  update public.appointments set status = p_to_status where id = p_appointment_id;
  insert into public.appointment_events (salon_id, appointment_id, event_type, from_status, to_status, actor_user_id)
  values (v_appointment.salon_id, p_appointment_id, 'status_changed', v_appointment.status, p_to_status, auth.uid());
end;
$$;

revoke all on function public.transition_appointment_status(uuid, public.appointment_status) from public, anon;
grant execute on function public.transition_appointment_status(uuid, public.appointment_status) to authenticated;

create or replace function public.reschedule_appointment_atomic(
  p_appointment_id uuid,
  p_staff_id uuid,
  p_starts_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment public.appointments%rowtype;
  v_staff public.staff%rowtype;
  v_salon public.salons%rowtype;
  v_opening public.opening_hours%rowtype;
  v_schedule public.staff_schedules%rowtype;
  v_service_end timestamptz;
  v_occupied_until timestamptz;
  v_local_start timestamp;
  v_local_occupied_end timestamp;
  v_weekday smallint;
begin
  select * into v_appointment from public.appointments where id = p_appointment_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'APPOINTMENT_NOT_FOUND'; end if;
  if not public.has_salon_role(v_appointment.salon_id, array['owner','manager']::public.membership_role[]) then
    raise exception using errcode = '42501', message = 'FORBIDDEN';
  end if;
  if v_appointment.status in ('completed','cancelled','no_show') then
    raise exception using errcode = '23514', message = 'APPOINTMENT_NOT_RESCHEDULABLE';
  end if;

  select * into v_salon from public.salons where id = v_appointment.salon_id;
  select * into v_staff from public.staff where id = p_staff_id and salon_id = v_appointment.salon_id and active = true;
  if not found then raise exception using errcode = 'P0002', message = 'STAFF_NOT_FOUND'; end if;
  if v_appointment.service_id is not null and not exists (
    select 1 from public.staff_services ss where ss.salon_id = v_appointment.salon_id and ss.staff_id = p_staff_id and ss.service_id = v_appointment.service_id
  ) then raise exception using errcode = '23514', message = 'STAFF_CANNOT_PERFORM_SERVICE'; end if;

  v_service_end := p_starts_at + make_interval(mins => v_appointment.duration_minutes_snapshot);
  v_occupied_until := v_service_end + make_interval(mins => v_appointment.buffer_minutes_snapshot);
  v_local_start := p_starts_at at time zone v_salon.timezone;
  v_local_occupied_end := v_occupied_until at time zone v_salon.timezone;
  v_weekday := extract(dow from v_local_start)::smallint;

  select * into v_opening from public.opening_hours where salon_id = v_appointment.salon_id and weekday = v_weekday and is_open = true;
  if not found or v_local_start::date <> v_local_occupied_end::date or v_local_start::time < v_opening.start_time or v_local_occupied_end::time > v_opening.end_time then
    raise exception using errcode = '23514', message = 'SALON_CLOSED';
  end if;

  select * into v_schedule from public.staff_schedules where salon_id = v_appointment.salon_id and staff_id = p_staff_id and weekday = v_weekday and is_working = true;
  if not found or v_local_start::time < v_schedule.start_time or v_local_occupied_end::time > v_schedule.end_time then
    raise exception using errcode = '23514', message = 'STAFF_NOT_WORKING';
  end if;

  if exists (
    select 1 from public.breaks b
    where b.salon_id = v_appointment.salon_id and b.staff_id = p_staff_id and b.weekday = v_weekday and b.active = true
      and tsrange(v_local_start, v_local_occupied_end, '[)') && tsrange(v_local_start::date + b.start_time, v_local_start::date + b.end_time, '[)')
  ) then raise exception using errcode = '23514', message = 'STAFF_BREAK'; end if;

  if exists (
    select 1 from public.blocks bl
    where bl.salon_id = v_appointment.salon_id and (bl.staff_id is null or bl.staff_id = p_staff_id)
      and tstzrange(bl.starts_at, bl.ends_at, '[)') && tstzrange(p_starts_at, v_occupied_until, '[)')
  ) then raise exception using errcode = '23514', message = 'TIME_BLOCKED'; end if;

  begin
    update public.appointments
    set staff_id = p_staff_id, starts_at = p_starts_at, service_ends_at = v_service_end, occupied_until = v_occupied_until
    where id = p_appointment_id;
  exception when exclusion_violation then
    raise exception using errcode = '23P01', message = 'SLOT_JUST_BOOKED';
  end;

  insert into public.appointment_events (salon_id, appointment_id, event_type, actor_user_id, metadata)
  values (
    v_appointment.salon_id,
    p_appointment_id,
    'rescheduled',
    auth.uid(),
    jsonb_build_object('from_start', v_appointment.starts_at, 'to_start', p_starts_at, 'from_staff_id', v_appointment.staff_id, 'to_staff_id', p_staff_id)
  );

  insert into public.notification_jobs (salon_id, appointment_id, kind, channel, recipient, payload)
  select v_appointment.salon_id, p_appointment_id, 'reschedule', 'email', c.email, jsonb_build_object('appointment_id', p_appointment_id)
  from public.customers c where c.id = v_appointment.customer_id and c.email is not null and trim(c.email) <> '';

  return p_appointment_id;
end;
$$;

revoke all on function public.reschedule_appointment_atomic(uuid,uuid,timestamptz) from public, anon;
grant execute on function public.reschedule_appointment_atomic(uuid,uuid,timestamptz) to authenticated;


-- Security hardening: trigger/helper functions are not public API.
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.normalize_phone(text) from public, anon, authenticated;
revoke all on function public.normalize_email(text) from public, anon, authenticated;
