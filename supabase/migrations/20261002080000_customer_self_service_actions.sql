create or replace function public.self_service_reschedule_appointment(
  p_token_hash text,
  p_staff_id uuid,
  p_starts_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token public.appointment_self_service_tokens%rowtype;
  v_appointment public.appointments%rowtype;
  v_staff public.staff%rowtype;
  v_salon public.salons%rowtype;
  v_settings public.booking_settings%rowtype;
  v_opening public.opening_hours%rowtype;
  v_schedule public.staff_schedules%rowtype;
  v_service_end timestamptz;
  v_occupied_until timestamptz;
  v_local_start timestamp;
  v_local_occupied_end timestamp;
  v_weekday smallint;
begin
  select * into v_token
  from public.appointment_self_service_tokens
  where token_hash=p_token_hash
  for update;
  if not found or v_token.revoked_at is not null or v_token.expires_at<=now() then
    raise exception using errcode='42501',message='INVALID_SELF_SERVICE_TOKEN';
  end if;

  select * into v_appointment
  from public.appointments
  where id=v_token.appointment_id and salon_id=v_token.salon_id
  for update;
  if not found then raise exception using errcode='P0002',message='APPOINTMENT_NOT_FOUND';end if;
  if v_appointment.status not in ('pending','confirmed') then
    raise exception using errcode='23514',message='APPOINTMENT_NOT_RESCHEDULABLE';
  end if;
  if v_appointment.service_id is null then
    raise exception using errcode='23514',message='SERVICE_NOT_FOUND';
  end if;

  select * into v_settings from public.booking_settings where salon_id=v_appointment.salon_id;
  if not found then raise exception using errcode='23514',message='BOOKING_SETTINGS_MISSING';end if;
  if v_appointment.starts_at<=now()+make_interval(hours=>v_settings.cancellation_hours) then
    raise exception using errcode='23514',message='CANCELLATION_WINDOW_CLOSED';
  end if;
  if p_starts_at<=now()+make_interval(mins=>v_settings.min_lead_minutes) then
    raise exception using errcode='23514',message='BOOKING_TOO_SOON';
  end if;

  select * into v_salon from public.salons where id=v_appointment.salon_id;
  select * into v_staff from public.staff
  where id=p_staff_id and salon_id=v_appointment.salon_id and active=true;
  if not found then raise exception using errcode='P0002',message='STAFF_NOT_FOUND';end if;

  if not exists(
    select 1 from public.staff_services ss
    where ss.salon_id=v_appointment.salon_id
      and ss.staff_id=p_staff_id
      and ss.service_id=v_appointment.service_id
  ) then raise exception using errcode='23514',message='STAFF_CANNOT_PERFORM_SERVICE';end if;

  v_service_end:=p_starts_at+make_interval(mins=>v_appointment.duration_minutes_snapshot);
  v_occupied_until:=v_service_end+make_interval(mins=>v_appointment.buffer_minutes_snapshot);
  v_local_start:=p_starts_at at time zone v_salon.timezone;
  v_local_occupied_end:=v_occupied_until at time zone v_salon.timezone;
  v_weekday:=extract(dow from v_local_start)::smallint;

  select * into v_opening from public.opening_hours
  where salon_id=v_appointment.salon_id and weekday=v_weekday and is_open=true;
  if not found
     or v_local_start::date<>v_local_occupied_end::date
     or v_local_start::time<v_opening.start_time
     or v_local_occupied_end::time>v_opening.end_time then
    raise exception using errcode='23514',message='SALON_CLOSED';
  end if;

  select * into v_schedule from public.staff_schedules
  where salon_id=v_appointment.salon_id and staff_id=p_staff_id and weekday=v_weekday and is_working=true;
  if not found
     or v_local_start::time<v_schedule.start_time
     or v_local_occupied_end::time>v_schedule.end_time then
    raise exception using errcode='23514',message='STAFF_NOT_WORKING';
  end if;

  if exists(
    select 1 from public.breaks b
    where b.salon_id=v_appointment.salon_id
      and b.staff_id=p_staff_id
      and b.weekday=v_weekday
      and b.active=true
      and tsrange(v_local_start,v_local_occupied_end,'[)') &&
          tsrange(v_local_start::date+b.start_time,v_local_start::date+b.end_time,'[)')
  ) then raise exception using errcode='23514',message='STAFF_BREAK';end if;

  if exists(
    select 1 from public.blocks bl
    where bl.salon_id=v_appointment.salon_id
      and (bl.staff_id is null or bl.staff_id=p_staff_id)
      and tstzrange(bl.starts_at,bl.ends_at,'[)') &&
          tstzrange(p_starts_at,v_occupied_until,'[)')
  ) then raise exception using errcode='23514',message='TIME_BLOCKED';end if;

  begin
    update public.appointments
       set staff_id=p_staff_id,
           starts_at=p_starts_at,
           service_ends_at=v_service_end,
           occupied_until=v_occupied_until
     where id=v_appointment.id;
  exception when exclusion_violation then
    raise exception using errcode='23P01',message='SLOT_JUST_BOOKED';
  end;

  insert into public.appointment_events(salon_id,appointment_id,event_type,actor_user_id,metadata)
  values(
    v_appointment.salon_id,v_appointment.id,'rescheduled',null,
    jsonb_build_object('source','self_service','from_start',v_appointment.starts_at,'to_start',p_starts_at,'from_staff_id',v_appointment.staff_id,'to_staff_id',p_staff_id)
  );

  return v_appointment.id;
end;
$$;

create or replace function public.self_service_cancel_appointment(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token public.appointment_self_service_tokens%rowtype;
  v_appointment public.appointments%rowtype;
  v_settings public.booking_settings%rowtype;
begin
  select * into v_token
  from public.appointment_self_service_tokens
  where token_hash=p_token_hash
  for update;
  if not found or v_token.revoked_at is not null or v_token.expires_at<=now() then
    raise exception using errcode='42501',message='INVALID_SELF_SERVICE_TOKEN';
  end if;

  select * into v_appointment
  from public.appointments
  where id=v_token.appointment_id and salon_id=v_token.salon_id
  for update;
  if not found then raise exception using errcode='P0002',message='APPOINTMENT_NOT_FOUND';end if;
  if v_appointment.status not in ('pending','confirmed') then
    raise exception using errcode='23514',message='APPOINTMENT_NOT_CANCELLABLE';
  end if;

  select * into v_settings from public.booking_settings where salon_id=v_appointment.salon_id;
  if not found then raise exception using errcode='23514',message='BOOKING_SETTINGS_MISSING';end if;
  if v_appointment.starts_at<=now()+make_interval(hours=>v_settings.cancellation_hours) then
    raise exception using errcode='23514',message='CANCELLATION_WINDOW_CLOSED';
  end if;

  update public.appointments set status='cancelled' where id=v_appointment.id;

  insert into public.appointment_events(salon_id,appointment_id,event_type,from_status,to_status,actor_user_id,metadata)
  values(v_appointment.salon_id,v_appointment.id,'status_changed',v_appointment.status,'cancelled',null,jsonb_build_object('source','self_service'));

  return v_appointment.id;
end;
$$;

revoke all on function public.self_service_reschedule_appointment(text,uuid,timestamptz) from public,anon,authenticated;
revoke all on function public.self_service_cancel_appointment(text) from public,anon,authenticated;
grant execute on function public.self_service_reschedule_appointment(text,uuid,timestamptz) to service_role;
grant execute on function public.self_service_cancel_appointment(text) to service_role;
