-- SALON product completion: integrate date exceptions and staff overrides into the existing scheduling authority.

create or replace function private.workspace_schedule_conflict(p_salon_id uuid,p_staff_id uuid default null) returns boolean
language sql security invoker set search_path='' as $$
select exists(
  select 1
  from public.appointments a
  join public.salons sa on sa.id=a.salon_id
  join public.staff st on st.id=a.staff_id and st.salon_id=a.salon_id
  left join public.opening_hours h
    on h.salon_id=a.salon_id
   and h.weekday=extract(dow from a.starts_at at time zone sa.timezone)::int
  left join public.opening_exceptions oe
    on oe.salon_id=a.salon_id
   and oe.exception_date=(a.starts_at at time zone sa.timezone)::date
  left join public.staff_schedules w
    on w.staff_id=a.staff_id
   and w.salon_id=a.salon_id
   and w.weekday=extract(dow from a.starts_at at time zone sa.timezone)::int
  left join public.staff_schedule_overrides so
    on so.salon_id=a.salon_id
   and so.staff_id=a.staff_id
   and so.override_date=(a.starts_at at time zone sa.timezone)::date
  where a.salon_id=p_salon_id
    and (p_staff_id is null or a.staff_id=p_staff_id)
    and st.active
    and a.status in ('pending','confirmed','checked_in')
    and a.starts_at>=now()
    and (
      not coalesce(oe.is_open,h.is_open,false)
      or (a.starts_at at time zone sa.timezone)::date<>(a.occupied_until at time zone sa.timezone)::date
      or (a.starts_at at time zone sa.timezone)::time < coalesce(oe.start_time,h.start_time)
      or (a.occupied_until at time zone sa.timezone)::time > coalesce(oe.end_time,h.end_time)
      or not coalesce(so.is_working,w.is_working,false)
      or (a.starts_at at time zone sa.timezone)::time < coalesce(so.start_time,w.start_time)
      or (a.occupied_until at time zone sa.timezone)::time > coalesce(so.end_time,w.end_time)
      or exists(
        select 1 from public.breaks b
        where b.salon_id=a.salon_id and b.staff_id=a.staff_id and b.active
          and b.weekday=extract(dow from a.starts_at at time zone sa.timezone)::int
          and tsrange(a.starts_at at time zone sa.timezone,a.occupied_until at time zone sa.timezone,'[)')
              && tsrange((a.starts_at at time zone sa.timezone)::date+b.start_time,(a.starts_at at time zone sa.timezone)::date+b.end_time,'[)')
      )
    )
);$$;

create or replace function private.create_appointment_atomic(
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
  v_opening_exception public.opening_exceptions%rowtype;
  v_schedule public.staff_schedules%rowtype;
  v_schedule_override public.staff_schedule_overrides%rowtype;
  v_customer_id uuid;
  v_appointment_id uuid := gen_random_uuid();
  v_service_end timestamptz;
  v_occupied_until timestamptz;
  v_local_start timestamp;
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
  v_local_occupied_end := v_occupied_until at time zone v_salon.timezone;
  v_weekday := extract(dow from v_local_start)::smallint;

  if p_source = 'public_booking' then
    select * into v_settings from public.booking_settings where salon_id = p_salon_id;
    if not found then raise exception using errcode = '23514', message = 'BOOKING_SETTINGS_MISSING'; end if;
    if p_starts_at < now() + make_interval(mins => v_settings.min_lead_minutes) then
      raise exception using errcode = '23514', message = 'BOOKING_TOO_SOON';
    end if;
    if v_local_start::date < (now() at time zone v_salon.timezone)::date
       or v_local_start::date > ((now() at time zone v_salon.timezone)::date + v_settings.max_days_ahead) then
      raise exception using errcode = '23514', message = 'BOOKING_OUTSIDE_WINDOW';
    end if;
  end if;

  select * into v_opening_exception
  from public.opening_exceptions
  where salon_id=p_salon_id and exception_date=v_local_start::date;

  if found then
    if not v_opening_exception.is_open
       or v_local_start::date<>v_local_occupied_end::date
       or v_local_start::time<v_opening_exception.start_time
       or v_local_occupied_end::time>v_opening_exception.end_time then
      raise exception using errcode='23514',message='SALON_CLOSED';
    end if;
  else
    select * into v_opening from public.opening_hours
    where salon_id=p_salon_id and weekday=v_weekday and is_open=true;
    if not found
       or v_local_start::date<>v_local_occupied_end::date
       or v_local_start::time<v_opening.start_time
       or v_local_occupied_end::time>v_opening.end_time then
      raise exception using errcode='23514',message='SALON_CLOSED';
    end if;
  end if;

  select * into v_schedule_override
  from public.staff_schedule_overrides
  where salon_id=p_salon_id and staff_id=p_staff_id and override_date=v_local_start::date;

  if found then
    if not v_schedule_override.is_working
       or v_local_start::date<>v_local_occupied_end::date
       or v_local_start::time<v_schedule_override.start_time
       or v_local_occupied_end::time>v_schedule_override.end_time then
      raise exception using errcode='23514',message='STAFF_NOT_WORKING';
    end if;
  else
    select * into v_schedule from public.staff_schedules
    where salon_id=p_salon_id and staff_id=p_staff_id and weekday=v_weekday and is_working=true;
    if not found
       or v_local_start::date<>v_local_occupied_end::date
       or v_local_start::time<v_schedule.start_time
       or v_local_occupied_end::time>v_schedule.end_time then
      raise exception using errcode='23514',message='STAFF_NOT_WORKING';
    end if;
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
    select c.id into v_customer_id from public.customers c where c.id=p_customer_id and c.salon_id=p_salon_id;
    if not found then raise exception using errcode='P0002',message='CUSTOMER_NOT_FOUND'; end if;
  else
    select c.id into v_customer_id
    from public.customers c
    where c.salon_id=p_salon_id
      and ((v_phone_norm is not null and c.phone_normalized=v_phone_norm) or (v_email_norm is not null and c.email_normalized=v_email_norm))
    order by case when v_phone_norm is not null and c.phone_normalized=v_phone_norm then 0 else 1 end,c.created_at
    limit 1;
  end if;

  if v_customer_id is null then
    insert into public.customers(salon_id,name,phone,phone_normalized,email,email_normalized)
    values(p_salon_id,trim(p_customer_name),p_customer_phone,v_phone_norm,p_customer_email,v_email_norm)
    returning id into v_customer_id;
  else
    update public.customers
    set name=coalesce(nullif(trim(p_customer_name),''),name),
        phone=coalesce(nullif(trim(p_customer_phone),''),phone),
        phone_normalized=coalesce(v_phone_norm,phone_normalized),
        email=coalesce(nullif(trim(p_customer_email),''),email),
        email_normalized=coalesce(v_email_norm,email_normalized)
    where id=v_customer_id;
  end if;

  begin
    insert into public.appointments(
      id,salon_id,customer_id,staff_id,service_id,starts_at,service_ends_at,occupied_until,
      customer_name_snapshot,service_name_snapshot,duration_minutes_snapshot,buffer_minutes_snapshot,
      price_cents_snapshot,currency_snapshot,status,payment_status,note,source,created_by
    ) values(
      v_appointment_id,p_salon_id,v_customer_id,p_staff_id,p_service_id,p_starts_at,v_service_end,v_occupied_until,
      trim(p_customer_name),v_service.name,v_service.duration_minutes,v_service.buffer_minutes,
      v_service.price_cents,v_service.currency,'confirmed','unpaid',nullif(trim(p_note),''),p_source,p_created_by
    );
  exception when exclusion_violation then
    raise exception using errcode='23P01',message='SLOT_JUST_BOOKED';
  end;

  insert into public.appointment_events(salon_id,appointment_id,event_type,to_status,actor_user_id,metadata)
  values(p_salon_id,v_appointment_id,'created','confirmed',p_created_by,jsonb_build_object('source',p_source));

  insert into public.notification_jobs(salon_id,appointment_id,kind,channel,recipient,payload)
  select p_salon_id,v_appointment_id,'booking_confirmation','email',p_customer_email,jsonb_build_object('appointment_id',v_appointment_id)
  where p_customer_email is not null and trim(p_customer_email)<>'';

  return v_appointment_id;
end;
$$;

create or replace function private.reschedule_appointment_atomic(
  p_appointment_id uuid,p_staff_id uuid,p_starts_at timestamptz
) returns uuid
language plpgsql security definer set search_path=public as $$
declare
  v_appointment public.appointments%rowtype;
  v_staff public.staff%rowtype;
  v_salon public.salons%rowtype;
  v_opening public.opening_hours%rowtype;
  v_opening_exception public.opening_exceptions%rowtype;
  v_schedule public.staff_schedules%rowtype;
  v_schedule_override public.staff_schedule_overrides%rowtype;
  v_service_end timestamptz;
  v_occupied_until timestamptz;
  v_local_start timestamp;
  v_local_occupied_end timestamp;
  v_weekday smallint;
begin
  select * into v_appointment from public.appointments where id=p_appointment_id for update;
  if not found then raise exception using errcode='P0002',message='APPOINTMENT_NOT_FOUND'; end if;
  if not public.has_salon_role(v_appointment.salon_id,array['owner','manager']::public.membership_role[]) then raise exception using errcode='42501',message='FORBIDDEN'; end if;
  if v_appointment.status in('completed','cancelled','no_show') then raise exception using errcode='23514',message='APPOINTMENT_NOT_RESCHEDULABLE'; end if;

  select * into v_salon from public.salons where id=v_appointment.salon_id;
  select * into v_staff from public.staff where id=p_staff_id and salon_id=v_appointment.salon_id and active=true;
  if not found then raise exception using errcode='P0002',message='STAFF_NOT_FOUND'; end if;
  if v_appointment.service_id is not null and not exists(
    select 1 from public.staff_services ss where ss.salon_id=v_appointment.salon_id and ss.staff_id=p_staff_id and ss.service_id=v_appointment.service_id
  ) then raise exception using errcode='23514',message='STAFF_CANNOT_PERFORM_SERVICE'; end if;

  v_service_end:=p_starts_at+make_interval(mins=>v_appointment.duration_minutes_snapshot);
  v_occupied_until:=v_service_end+make_interval(mins=>v_appointment.buffer_minutes_snapshot);
  v_local_start:=p_starts_at at time zone v_salon.timezone;
  v_local_occupied_end:=v_occupied_until at time zone v_salon.timezone;
  v_weekday:=extract(dow from v_local_start)::smallint;

  select * into v_opening_exception from public.opening_exceptions
  where salon_id=v_appointment.salon_id and exception_date=v_local_start::date;
  if found then
    if not v_opening_exception.is_open or v_local_start::date<>v_local_occupied_end::date
       or v_local_start::time<v_opening_exception.start_time or v_local_occupied_end::time>v_opening_exception.end_time
    then raise exception using errcode='23514',message='SALON_CLOSED'; end if;
  else
    select * into v_opening from public.opening_hours where salon_id=v_appointment.salon_id and weekday=v_weekday and is_open=true;
    if not found or v_local_start::date<>v_local_occupied_end::date or v_local_start::time<v_opening.start_time or v_local_occupied_end::time>v_opening.end_time
    then raise exception using errcode='23514',message='SALON_CLOSED'; end if;
  end if;

  select * into v_schedule_override from public.staff_schedule_overrides
  where salon_id=v_appointment.salon_id and staff_id=p_staff_id and override_date=v_local_start::date;
  if found then
    if not v_schedule_override.is_working or v_local_start::time<v_schedule_override.start_time or v_local_occupied_end::time>v_schedule_override.end_time
    then raise exception using errcode='23514',message='STAFF_NOT_WORKING'; end if;
  else
    select * into v_schedule from public.staff_schedules where salon_id=v_appointment.salon_id and staff_id=p_staff_id and weekday=v_weekday and is_working=true;
    if not found or v_local_start::time<v_schedule.start_time or v_local_occupied_end::time>v_schedule.end_time
    then raise exception using errcode='23514',message='STAFF_NOT_WORKING'; end if;
  end if;

  if exists(
    select 1 from public.breaks b
    where b.salon_id=v_appointment.salon_id and b.staff_id=p_staff_id and b.weekday=v_weekday and b.active=true
      and tsrange(v_local_start,v_local_occupied_end,'[)') && tsrange(v_local_start::date+b.start_time,v_local_start::date+b.end_time,'[)')
  ) then raise exception using errcode='23514',message='STAFF_BREAK'; end if;

  if exists(
    select 1 from public.blocks bl
    where bl.salon_id=v_appointment.salon_id and (bl.staff_id is null or bl.staff_id=p_staff_id)
      and tstzrange(bl.starts_at,bl.ends_at,'[)') && tstzrange(p_starts_at,v_occupied_until,'[)')
  ) then raise exception using errcode='23514',message='TIME_BLOCKED'; end if;

  begin
    update public.appointments set staff_id=p_staff_id,starts_at=p_starts_at,service_ends_at=v_service_end,occupied_until=v_occupied_until
    where id=p_appointment_id;
  exception when exclusion_violation then
    raise exception using errcode='23P01',message='SLOT_JUST_BOOKED';
  end;

  insert into public.appointment_events(salon_id,appointment_id,event_type,actor_user_id,metadata)
  values(v_appointment.salon_id,p_appointment_id,'rescheduled',auth.uid(),
    jsonb_build_object('from_start',v_appointment.starts_at,'to_start',p_starts_at,'from_staff_id',v_appointment.staff_id,'to_staff_id',p_staff_id));

  insert into public.notification_jobs(salon_id,appointment_id,kind,channel,recipient,payload)
  select v_appointment.salon_id,p_appointment_id,'reschedule','email',c.email,jsonb_build_object('appointment_id',p_appointment_id)
  from public.customers c where c.id=v_appointment.customer_id and c.email is not null and trim(c.email)<>'';

  return p_appointment_id;
end;
$$;
