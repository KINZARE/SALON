-- SALON product completion: additive product data model.
-- Existing production app remains compatible until the new workspace starts using these tables.

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id,id)
);
create unique index if not exists service_categories_salon_name_unique on public.service_categories(salon_id,lower(name));

alter table public.services add column if not exists category_id uuid null;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='services_salon_category_fkey') then
    alter table public.services
      add constraint services_salon_category_fkey
      foreign key(salon_id,category_id)
      references public.service_categories(salon_id,id)
      on delete set null;
  end if;
end $$;
create index if not exists idx_services_category on public.services(salon_id,category_id);

create table if not exists public.opening_exceptions (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  exception_date date not null,
  is_open boolean not null default false,
  start_time time null,
  end_time time null,
  note text null check (note is null or char_length(note)<=240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(salon_id,exception_date),
  check ((not is_open and start_time is null and end_time is null) or (is_open and start_time is not null and end_time is not null and start_time < end_time))
);
create index if not exists idx_opening_exceptions_salon_date on public.opening_exceptions(salon_id,exception_date);

create table if not exists public.staff_schedule_overrides (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  staff_id uuid not null,
  override_date date not null,
  is_working boolean not null default false,
  start_time time null,
  end_time time null,
  reason text null check (reason is null or char_length(reason)<=240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(salon_id,staff_id,override_date),
  foreign key(salon_id,staff_id) references public.staff(salon_id,id) on delete cascade,
  check ((not is_working and start_time is null and end_time is null) or (is_working and start_time is not null and end_time is not null and start_time < end_time))
);
create index if not exists idx_staff_schedule_overrides_salon_date on public.staff_schedule_overrides(salon_id,override_date,staff_id);

create table if not exists public.intake_forms (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text null check (description is null or char_length(description)<=600),
  active boolean not null default true,
  version integer not null default 1 check (version>=1),
  consent_statement text null check (consent_statement is null or char_length(consent_statement)<=800),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(salon_id,id)
);

create table if not exists public.intake_form_fields (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  form_id uuid not null,
  label text not null check (char_length(trim(label)) between 1 and 180),
  field_type text not null check (field_type in ('short_text','long_text','yes_no','select','checkbox','date','consent')),
  required boolean not null default false,
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options)='array'),
  sort_order integer not null default 0 check (sort_order between 0 and 1000),
  created_at timestamptz not null default now(),
  unique(salon_id,id),
  foreign key(salon_id,form_id) references public.intake_forms(salon_id,id) on delete cascade
);
create index if not exists idx_intake_form_fields_form on public.intake_form_fields(salon_id,form_id,sort_order);

create table if not exists public.intake_form_services (
  salon_id uuid not null references public.salons(id) on delete cascade,
  form_id uuid not null,
  service_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(form_id,service_id),
  foreign key(salon_id,form_id) references public.intake_forms(salon_id,id) on delete cascade,
  foreign key(salon_id,service_id) references public.services(salon_id,id) on delete cascade
);
create index if not exists idx_intake_form_services_service on public.intake_form_services(salon_id,service_id);

create table if not exists public.appointment_intake_links (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  form_id uuid not null,
  form_version integer not null check (form_version>=1),
  token_hash text not null unique check (char_length(token_hash)=64),
  expires_at timestamptz not null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  foreign key(salon_id,form_id) references public.intake_forms(salon_id,id) on delete cascade
);
create index if not exists idx_appointment_intake_links_appointment on public.appointment_intake_links(salon_id,appointment_id);

create table if not exists public.intake_submissions (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  form_id uuid not null,
  form_version integer not null check (form_version>=1),
  answers jsonb not null check (jsonb_typeof(answers)='object'),
  submitted_at timestamptz not null default now(),
  unique(appointment_id,form_id,form_version),
  foreign key(salon_id,form_id) references public.intake_forms(salon_id,id) on delete restrict
);
create index if not exists idx_intake_submissions_customer on public.intake_submissions(salon_id,customer_id,submitted_at desc);

create table if not exists public.appointment_consents (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  form_id uuid null,
  statement text not null check (char_length(statement) between 1 and 1000),
  statement_version integer not null check (statement_version>=1),
  customer_name text not null check (char_length(trim(customer_name)) between 1 and 160),
  consented_at timestamptz not null default now(),
  foreign key(salon_id,form_id) references public.intake_forms(salon_id,id) on delete set null
);
create index if not exists idx_appointment_consents_customer on public.appointment_consents(salon_id,customer_id,consented_at desc);

create table if not exists public.booking_widget_settings (
  salon_id uuid primary key references public.salons(id) on delete cascade,
  button_label text not null default 'Boek afspraak' check (char_length(trim(button_label)) between 1 and 60),
  accent_color text not null default '#B66B4D' check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  width integer not null default 420 check (width between 280 and 1200),
  height integer not null default 720 check (height between 420 and 1400),
  updated_at timestamptz not null default now()
);

alter table public.service_categories enable row level security;
alter table public.opening_exceptions enable row level security;
alter table public.staff_schedule_overrides enable row level security;
alter table public.intake_forms enable row level security;
alter table public.intake_form_fields enable row level security;
alter table public.intake_form_services enable row level security;
alter table public.appointment_intake_links enable row level security;
alter table public.intake_submissions enable row level security;
alter table public.appointment_consents enable row level security;
alter table public.booking_widget_settings enable row level security;

create policy service_categories_member_select on public.service_categories for select to authenticated
using (private.has_salon_role(salon_id));
create policy service_categories_manager_write on public.service_categories for all to authenticated
using (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]))
with check (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]));

create policy opening_exceptions_member_select on public.opening_exceptions for select to authenticated
using (private.has_salon_role(salon_id));
create policy opening_exceptions_manager_write on public.opening_exceptions for all to authenticated
using (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]))
with check (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]));

create policy staff_schedule_overrides_member_select on public.staff_schedule_overrides for select to authenticated
using (private.has_salon_role(salon_id));
create policy staff_schedule_overrides_manager_write on public.staff_schedule_overrides for all to authenticated
using (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]))
with check (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]));

create policy intake_forms_manager_access on public.intake_forms for all to authenticated
using (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]))
with check (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]));
create policy intake_form_fields_manager_access on public.intake_form_fields for all to authenticated
using (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]))
with check (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]));
create policy intake_form_services_manager_access on public.intake_form_services for all to authenticated
using (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]))
with check (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]));
create policy appointment_intake_links_manager_access on public.appointment_intake_links for all to authenticated
using (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]))
with check (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]));
create policy intake_submissions_manager_access on public.intake_submissions for select to authenticated
using (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]));
create policy appointment_consents_manager_access on public.appointment_consents for select to authenticated
using (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]));
create policy booking_widget_settings_member_select on public.booking_widget_settings for select to authenticated
using (private.has_salon_role(salon_id));
create policy booking_widget_settings_manager_write on public.booking_widget_settings for all to authenticated
using (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]))
with check (private.has_salon_role(salon_id,array['owner','manager']::public.membership_role[]));

create or replace function public.save_opening_exception(
  p_salon_id uuid,p_date date,p_is_open boolean,p_start time default null,p_end time default null,p_note text default null
) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_tz text;
begin
  if not private.has_salon_role(p_salon_id,array['owner','manager']::public.membership_role[]) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if p_date is null or (p_is_open and (p_start is null or p_end is null or p_start>=p_end)) or (not p_is_open and (p_start is not null or p_end is not null)) then raise exception 'INVALID_INPUT'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_salon_id::text,0));
  select timezone into v_tz from public.salons where id=p_salon_id;
  if not found then raise exception 'SALON_NOT_FOUND'; end if;
  if exists(
    select 1 from public.appointments a
    where a.salon_id=p_salon_id and a.status in('pending','confirmed','checked_in') and a.starts_at>=now()
      and (a.starts_at at time zone v_tz)::date=p_date
      and (not p_is_open or (a.starts_at at time zone v_tz)::date<>(a.occupied_until at time zone v_tz)::date
        or (a.starts_at at time zone v_tz)::time<p_start or (a.occupied_until at time zone v_tz)::time>p_end)
  ) then raise exception 'APPOINTMENTS_IN_SCHEDULE'; end if;
  insert into public.opening_exceptions(salon_id,exception_date,is_open,start_time,end_time,note)
  values(p_salon_id,p_date,p_is_open,p_start,p_end,nullif(trim(p_note),''))
  on conflict(salon_id,exception_date) do update set is_open=excluded.is_open,start_time=excluded.start_time,end_time=excluded.end_time,note=excluded.note,updated_at=now()
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.save_opening_exception(uuid,date,boolean,time,time,text) from public,anon;
grant execute on function public.save_opening_exception(uuid,date,boolean,time,time,text) to authenticated,service_role;

create or replace function public.delete_opening_exception(p_salon_id uuid,p_date date)
returns void language plpgsql security invoker set search_path='' as $$
declare v_tz text; v_day int; v_open public.opening_hours%rowtype;
begin
  if not private.has_salon_role(p_salon_id,array['owner','manager']::public.membership_role[]) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_salon_id::text,0));
  select timezone into v_tz from public.salons where id=p_salon_id;
  v_day:=extract(dow from p_date)::int;
  select * into v_open from public.opening_hours where salon_id=p_salon_id and weekday=v_day;
  if exists(
    select 1 from public.appointments a where a.salon_id=p_salon_id and a.status in('pending','confirmed','checked_in') and a.starts_at>=now()
    and (a.starts_at at time zone v_tz)::date=p_date
    and (not coalesce(v_open.is_open,false) or (a.starts_at at time zone v_tz)::time<v_open.start_time or (a.occupied_until at time zone v_tz)::time>v_open.end_time)
  ) then raise exception 'APPOINTMENTS_IN_SCHEDULE'; end if;
  delete from public.opening_exceptions where salon_id=p_salon_id and exception_date=p_date;
end $$;
revoke all on function public.delete_opening_exception(uuid,date) from public,anon;
grant execute on function public.delete_opening_exception(uuid,date) to authenticated,service_role;

create or replace function public.save_staff_schedule_override(
  p_salon_id uuid,p_staff_id uuid,p_date date,p_is_working boolean,p_start time default null,p_end time default null,p_reason text default null
) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_tz text;
begin
  if not private.has_salon_role(p_salon_id,array['owner','manager']::public.membership_role[]) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if not exists(select 1 from public.staff where salon_id=p_salon_id and id=p_staff_id) then raise exception 'STAFF_NOT_FOUND'; end if;
  if p_date is null or (p_is_working and (p_start is null or p_end is null or p_start>=p_end)) or (not p_is_working and (p_start is not null or p_end is not null)) then raise exception 'INVALID_INPUT'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_salon_id::text,0));
  select timezone into v_tz from public.salons where id=p_salon_id;
  if exists(
    select 1 from public.appointments a
    where a.salon_id=p_salon_id and a.staff_id=p_staff_id and a.status in('pending','confirmed','checked_in') and a.starts_at>=now()
      and (a.starts_at at time zone v_tz)::date=p_date
      and (not p_is_working or (a.starts_at at time zone v_tz)::date<>(a.occupied_until at time zone v_tz)::date
        or (a.starts_at at time zone v_tz)::time<p_start or (a.occupied_until at time zone v_tz)::time>p_end)
  ) then raise exception 'APPOINTMENTS_IN_SCHEDULE'; end if;
  insert into public.staff_schedule_overrides(salon_id,staff_id,override_date,is_working,start_time,end_time,reason)
  values(p_salon_id,p_staff_id,p_date,p_is_working,p_start,p_end,nullif(trim(p_reason),''))
  on conflict(salon_id,staff_id,override_date) do update set is_working=excluded.is_working,start_time=excluded.start_time,end_time=excluded.end_time,reason=excluded.reason,updated_at=now()
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.save_staff_schedule_override(uuid,uuid,date,boolean,time,time,text) from public,anon;
grant execute on function public.save_staff_schedule_override(uuid,uuid,date,boolean,time,time,text) to authenticated,service_role;

create or replace function public.delete_staff_schedule_override(p_salon_id uuid,p_staff_id uuid,p_date date)
returns void language plpgsql security invoker set search_path='' as $$
declare v_tz text; v_day int; v_week public.staff_schedules%rowtype;
begin
  if not private.has_salon_role(p_salon_id,array['owner','manager']::public.membership_role[]) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_salon_id::text,0));
  select timezone into v_tz from public.salons where id=p_salon_id;
  v_day:=extract(dow from p_date)::int;
  select * into v_week from public.staff_schedules where salon_id=p_salon_id and staff_id=p_staff_id and weekday=v_day;
  if exists(
    select 1 from public.appointments a where a.salon_id=p_salon_id and a.staff_id=p_staff_id and a.status in('pending','confirmed','checked_in') and a.starts_at>=now()
    and (a.starts_at at time zone v_tz)::date=p_date
    and (not coalesce(v_week.is_working,false) or (a.starts_at at time zone v_tz)::time<v_week.start_time or (a.occupied_until at time zone v_tz)::time>v_week.end_time)
  ) then raise exception 'APPOINTMENTS_IN_SCHEDULE'; end if;
  delete from public.staff_schedule_overrides where salon_id=p_salon_id and staff_id=p_staff_id and override_date=p_date;
end $$;
revoke all on function public.delete_staff_schedule_override(uuid,uuid,date) from public,anon;
grant execute on function public.delete_staff_schedule_override(uuid,uuid,date) to authenticated,service_role;
