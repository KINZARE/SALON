create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

alter function public.has_salon_role(uuid, public.membership_role[]) set schema private;
alter function public.is_staff_user_for_appointment(uuid) set schema private;
alter function public.create_appointment_atomic(uuid,uuid,uuid,timestamptz,text,text,text,text,public.appointment_source,uuid,uuid) set schema private;
alter function public.handle_new_user() set schema private;
alter function public.create_salon_with_owner(text,text,text,text,text,char) set schema private;
alter function public.bootstrap_salon(text,text,time,time,smallint[],text,integer,integer,text) set schema private;
alter function public.create_staff_with_schedule(uuid,text,uuid[],smallint[],time,time) set schema private;
alter function public.transition_appointment_status(uuid, public.appointment_status) set schema private;
alter function public.reschedule_appointment_atomic(uuid,uuid,timestamptz) set schema private;

revoke all on function private.has_salon_role(uuid, public.membership_role[]) from public, anon;
grant execute on function private.has_salon_role(uuid, public.membership_role[]) to authenticated, service_role;

revoke all on function private.is_staff_user_for_appointment(uuid) from public, anon;
grant execute on function private.is_staff_user_for_appointment(uuid) to authenticated, service_role;

revoke all on function private.create_appointment_atomic(uuid,uuid,uuid,timestamptz,text,text,text,text,public.appointment_source,uuid,uuid) from public, anon, authenticated;
grant execute on function private.create_appointment_atomic(uuid,uuid,uuid,timestamptz,text,text,text,text,public.appointment_source,uuid,uuid) to service_role;

revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.create_salon_with_owner(text,text,text,text,text,char) from public, anon;
grant execute on function private.create_salon_with_owner(text,text,text,text,text,char) to authenticated, service_role;
revoke all on function private.bootstrap_salon(text,text,time,time,smallint[],text,integer,integer,text) from public, anon;
grant execute on function private.bootstrap_salon(text,text,time,time,smallint[],text,integer,integer,text) to authenticated, service_role;
revoke all on function private.create_staff_with_schedule(uuid,text,uuid[],smallint[],time,time) from public, anon;
grant execute on function private.create_staff_with_schedule(uuid,text,uuid[],smallint[],time,time) to authenticated, service_role;
revoke all on function private.transition_appointment_status(uuid, public.appointment_status) from public, anon;
grant execute on function private.transition_appointment_status(uuid, public.appointment_status) to authenticated, service_role;
revoke all on function private.reschedule_appointment_atomic(uuid,uuid,timestamptz) from public, anon;
grant execute on function private.reschedule_appointment_atomic(uuid,uuid,timestamptz) to authenticated, service_role;

create or replace function public.has_salon_role(
  p_salon_id uuid,
  p_roles public.membership_role[] default null
)
returns boolean
language sql
stable
security invoker
set search_path = public, private
as $$ select private.has_salon_role(p_salon_id, p_roles); $$;

create or replace function public.is_staff_user_for_appointment(p_appointment_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public, private
as $$ select private.is_staff_user_for_appointment(p_appointment_id); $$;

create or replace function public.create_salon_with_owner(
  p_name text,
  p_slug text,
  p_phone text default null,
  p_email text default null,
  p_timezone text default 'Europe/Amsterdam',
  p_currency char(3) default 'EUR'
)
returns uuid
language sql
security invoker
set search_path = public, private
as $$ select private.create_salon_with_owner(p_name,p_slug,p_phone,p_email,p_timezone,p_currency); $$;

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
language sql
security invoker
set search_path = public, private
as $$ select private.bootstrap_salon(p_name,p_slug,p_open_time,p_close_time,p_weekdays,p_service_name,p_duration_minutes,p_price_cents,p_staff_name); $$;

create or replace function public.create_staff_with_schedule(
  p_salon_id uuid,
  p_name text,
  p_service_ids uuid[],
  p_weekdays smallint[],
  p_start_time time,
  p_end_time time
)
returns uuid
language sql
security invoker
set search_path = public, private
as $$ select private.create_staff_with_schedule(p_salon_id,p_name,p_service_ids,p_weekdays,p_start_time,p_end_time); $$;

create or replace function public.transition_appointment_status(
  p_appointment_id uuid,
  p_to_status public.appointment_status
)
returns void
language sql
security invoker
set search_path = public, private
as $$ select private.transition_appointment_status(p_appointment_id,p_to_status); $$;

create or replace function public.reschedule_appointment_atomic(
  p_appointment_id uuid,
  p_staff_id uuid,
  p_starts_at timestamptz
)
returns uuid
language sql
security invoker
set search_path = public, private
as $$ select private.reschedule_appointment_atomic(p_appointment_id,p_staff_id,p_starts_at); $$;

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
language sql
security invoker
set search_path = public, private
as $$ select private.create_appointment_atomic(p_salon_id,p_service_id,p_staff_id,p_starts_at,p_customer_name,p_customer_phone,p_customer_email,p_note,p_source,p_created_by,p_customer_id); $$;

revoke all on function public.has_salon_role(uuid, public.membership_role[]) from public, anon;
grant execute on function public.has_salon_role(uuid, public.membership_role[]) to authenticated, service_role;
revoke all on function public.is_staff_user_for_appointment(uuid) from public, anon;
grant execute on function public.is_staff_user_for_appointment(uuid) to authenticated, service_role;

revoke all on function public.create_salon_with_owner(text,text,text,text,text,char) from public, anon;
grant execute on function public.create_salon_with_owner(text,text,text,text,text,char) to authenticated, service_role;
revoke all on function public.bootstrap_salon(text,text,time,time,smallint[],text,integer,integer,text) from public, anon;
grant execute on function public.bootstrap_salon(text,text,time,time,smallint[],text,integer,integer,text) to authenticated, service_role;
revoke all on function public.create_staff_with_schedule(uuid,text,uuid[],smallint[],time,time) from public, anon;
grant execute on function public.create_staff_with_schedule(uuid,text,uuid[],smallint[],time,time) to authenticated, service_role;
revoke all on function public.transition_appointment_status(uuid, public.appointment_status) from public, anon;
grant execute on function public.transition_appointment_status(uuid, public.appointment_status) to authenticated, service_role;
revoke all on function public.reschedule_appointment_atomic(uuid,uuid,timestamptz) from public, anon;
grant execute on function public.reschedule_appointment_atomic(uuid,uuid,timestamptz) to authenticated, service_role;

revoke all on function public.create_appointment_atomic(uuid,uuid,uuid,timestamptz,text,text,text,text,public.appointment_source,uuid,uuid) from public, anon, authenticated;
grant execute on function public.create_appointment_atomic(uuid,uuid,uuid,timestamptz,text,text,text,text,public.appointment_source,uuid,uuid) to service_role;

drop policy profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
