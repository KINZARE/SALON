-- One salon-level transaction lock covers booking/moving and configuration writes.
-- Acquired before any availability validation to prevent cross-table races.
create function private.workspace_schedule_conflict(p_salon_id uuid,p_staff_id uuid default null) returns boolean
language sql security invoker set search_path='' as $$
select exists(
  select 1 from public.appointments a
  join public.salons sa on sa.id=a.salon_id
  join public.staff st on st.id=a.staff_id and st.salon_id=a.salon_id
  left join public.opening_hours h on h.salon_id=a.salon_id and h.weekday=extract(dow from a.starts_at at time zone sa.timezone)::int
  left join public.staff_schedules w on w.staff_id=a.staff_id and w.salon_id=a.salon_id and w.weekday=extract(dow from a.starts_at at time zone sa.timezone)::int
  where a.salon_id=p_salon_id and (p_staff_id is null or a.staff_id=p_staff_id) and st.active
    and a.status in ('pending','confirmed','checked_in') and a.starts_at>=now()
    and (
      not coalesce(h.is_open,false) or not coalesce(w.is_working,false)
      or (a.starts_at at time zone sa.timezone)::date<>(a.occupied_until at time zone sa.timezone)::date
      or (a.starts_at at time zone sa.timezone)::time<h.start_time or (a.occupied_until at time zone sa.timezone)::time>h.end_time
      or (a.starts_at at time zone sa.timezone)::time<w.start_time or (a.occupied_until at time zone sa.timezone)::time>w.end_time
      or exists(select 1 from public.breaks b where b.salon_id=a.salon_id and b.staff_id=a.staff_id and b.active and b.weekday=w.weekday and
        tsrange(a.starts_at at time zone sa.timezone,a.occupied_until at time zone sa.timezone,'[)') && tsrange((a.starts_at at time zone sa.timezone)::date+b.start_time,(a.starts_at at time zone sa.timezone)::date+b.end_time,'[)'))
    )
);$$;
revoke all on function private.workspace_schedule_conflict(uuid,uuid) from public,anon;
grant execute on function private.workspace_schedule_conflict(uuid,uuid) to authenticated,service_role;

create or replace function public.create_appointment_atomic(
 p_salon_id uuid,p_service_id uuid,p_staff_id uuid,p_starts_at timestamptz,p_customer_name text,
 p_customer_phone text default null,p_customer_email text default null,p_note text default null,
 p_source public.appointment_source default 'public_booking',p_created_by uuid default null,p_customer_id uuid default null
) returns uuid language plpgsql security invoker set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_salon_id::text,0));
 if p_starts_at<now() then raise exception 'SLOT_UNAVAILABLE';end if;
 return private.create_appointment_atomic(p_salon_id,p_service_id,p_staff_id,p_starts_at,p_customer_name,p_customer_phone,p_customer_email,p_note,p_source,p_created_by,p_customer_id);
end;$$;

create or replace function public.reschedule_appointment_atomic(p_appointment_id uuid,p_staff_id uuid,p_starts_at timestamptz) returns uuid
language plpgsql security invoker set search_path='' as $$
declare v_salon uuid;
begin
 select salon_id into v_salon from public.appointments where id=p_appointment_id;
 if not found then raise exception 'APPOINTMENT_NOT_FOUND';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_salon::text,0));
 if p_starts_at<now() then raise exception 'SLOT_UNAVAILABLE';end if;
 return private.reschedule_appointment_atomic(p_appointment_id,p_staff_id,p_starts_at);
end;$$;

create or replace function public.save_workspace_entity(p_salon_id uuid,p_kind text,p_payload jsonb) returns uuid
language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_row jsonb; v_item uuid; v_a public.appointments%rowtype; v_day integer; v_seen integer;
begin
  if not private.has_salon_role(p_salon_id,array['owner','manager']::public.membership_role[]) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_salon_id::text,0));
  if jsonb_typeof(p_payload) <> 'object' or octet_length(p_payload::text)>65536 then raise exception 'INVALID_INPUT'; end if;
  v_id:=nullif(p_payload->>'id','')::uuid;
  case p_kind
  when 'customer' then
    if length(trim(p_payload->>'name')) not between 1 and 160 then raise exception 'INVALID_INPUT'; end if;
    if v_id is null then
      insert into public.customers(salon_id,name,phone,email,phone_normalized,email_normalized,internal_notes) values(p_salon_id,trim(p_payload->>'name'),nullif(p_payload->>'phone',''),nullif(p_payload->>'email',''),public.normalize_phone(p_payload->>'phone'),public.normalize_email(p_payload->>'email'),p_payload->>'internal_notes') returning id into v_id;
    else
      update public.customers set name=trim(p_payload->>'name'),phone=nullif(p_payload->>'phone',''),email=nullif(p_payload->>'email',''),phone_normalized=public.normalize_phone(p_payload->>'phone'),email_normalized=public.normalize_email(p_payload->>'email'),internal_notes=p_payload->>'internal_notes' where id=v_id and salon_id=p_salon_id;
      if not found then raise exception 'NOT_FOUND'; end if;
    end if;
  when 'service' then
    if v_id is null then
      insert into public.services(salon_id,name,description,duration_minutes,buffer_minutes,price_cents,currency,active,online_bookable) select p_salon_id,trim(p_payload->>'name'),p_payload->>'description',(p_payload->>'duration_minutes')::int,(p_payload->>'buffer_minutes')::int,(p_payload->>'price_cents')::int,s.currency,(p_payload->>'active')::boolean,(p_payload->>'online_bookable')::boolean from public.salons s where s.id=p_salon_id returning id into v_id;
    else
      update public.services set name=trim(p_payload->>'name'),description=p_payload->>'description',duration_minutes=(p_payload->>'duration_minutes')::int,buffer_minutes=(p_payload->>'buffer_minutes')::int,price_cents=(p_payload->>'price_cents')::int,active=(p_payload->>'active')::boolean,online_bookable=(p_payload->>'online_bookable')::boolean where id=v_id and salon_id=p_salon_id;
      if not found then raise exception 'NOT_FOUND'; end if;
    end if;
    delete from public.staff_services where salon_id=p_salon_id and service_id=v_id;
    for v_item in select value::uuid from jsonb_array_elements_text(p_payload->'staff_ids') loop
      insert into public.staff_services(salon_id,staff_id,service_id) values(p_salon_id,v_item,v_id);
    end loop;
  when 'staff' then
    if v_id is null then
      insert into public.staff(salon_id,name,email,operational_role,active) values(p_salon_id,trim(p_payload->>'name'),nullif(p_payload->>'email',''),p_payload->>'role',(p_payload->>'active')::boolean) returning id into v_id;
    else
      update public.staff set name=trim(p_payload->>'name'),email=nullif(p_payload->>'email',''),operational_role=p_payload->>'role',active=(p_payload->>'active')::boolean where id=v_id and salon_id=p_salon_id;
      if not found then raise exception 'NOT_FOUND'; end if;
    end if;
    if jsonb_array_length(p_payload->'schedules')<>7 then raise exception 'INVALID_INPUT'; end if;
    select count(distinct (value->>'weekday')::int) into v_seen from jsonb_array_elements(p_payload->'schedules');
    if v_seen<>7 then raise exception 'INVALID_INPUT'; end if;
    delete from public.staff_services where salon_id=p_salon_id and staff_id=v_id;
    for v_item in select value::uuid from jsonb_array_elements_text(p_payload->'service_ids') loop
      insert into public.staff_services(salon_id,staff_id,service_id) values(p_salon_id,v_id,v_item);
    end loop;
    for v_row in select value from jsonb_array_elements(p_payload->'schedules') loop
      insert into public.staff_schedules(salon_id,staff_id,weekday,is_working,start_time,end_time) values(p_salon_id,v_id,(v_row->>'weekday')::smallint,(v_row->>'is_working')::boolean,case when (v_row->>'is_working')::boolean then (v_row->>'start_time')::time end,case when (v_row->>'is_working')::boolean then (v_row->>'end_time')::time end) on conflict(staff_id,weekday) do update set is_working=excluded.is_working,start_time=excluded.start_time,end_time=excluded.end_time;
    end loop;
    delete from public.breaks where salon_id=p_salon_id and staff_id=v_id;
    for v_row in select value from jsonb_array_elements(p_payload->'breaks') loop
      v_day:=(v_row->>'weekday')::int;
      if not exists(select 1 from public.staff_schedules where staff_id=v_id and weekday=v_day and is_working and start_time<=(v_row->>'start_time')::time and end_time>=(v_row->>'end_time')::time) then raise exception 'INVALID_INPUT'; end if;
      insert into public.breaks(salon_id,staff_id,weekday,start_time,end_time,label) values(p_salon_id,v_id,v_day,(v_row->>'start_time')::time,(v_row->>'end_time')::time,'Pauze');
    end loop;
  when 'block' then
    if exists(select 1 from public.appointments a where a.salon_id=p_salon_id and a.status in ('pending','confirmed','checked_in') and (nullif(p_payload->>'staff_id','') is null or a.staff_id=(p_payload->>'staff_id')::uuid) and tstzrange(a.starts_at,a.occupied_until,'[)') && tstzrange((p_payload->>'starts_at')::timestamptz,(p_payload->>'ends_at')::timestamptz,'[)')) then raise exception 'APPOINTMENTS_IN_BLOCK'; end if;
    insert into public.blocks(salon_id,staff_id,starts_at,ends_at,reason,created_by) values(p_salon_id,nullif(p_payload->>'staff_id','')::uuid,(p_payload->>'starts_at')::timestamptz,(p_payload->>'ends_at')::timestamptz,p_payload->>'reason',auth.uid()) returning id into v_id;
  when 'deleteBlock' then
    delete from public.blocks where salon_id=p_salon_id and id=v_id;
    if not found then raise exception 'NOT_FOUND'; end if;
  when 'status' then
    select * into v_a from public.appointments where salon_id=p_salon_id and id=v_id for update;
    if not found then raise exception 'NOT_FOUND'; end if;
    if v_a.status not in ('pending','confirmed','checked_in') then raise exception 'INVALID_STATUS_TRANSITION'; end if;
    if p_payload->>'status' not in ('completed','cancelled','no_show') then raise exception 'INVALID_INPUT'; end if;
    if p_payload->>'status'='cancelled' then perform public.transition_appointment_status(v_id,'cancelled');
    else
      if v_a.status='pending' then perform public.transition_appointment_status(v_id,'confirmed'); v_a.status:='confirmed'; end if;
      if p_payload->>'status'='completed' then
        if v_a.status='confirmed' then perform public.transition_appointment_status(v_id,'checked_in'); end if;
        perform public.transition_appointment_status(v_id,'completed');
      else
        if v_a.status='checked_in' then raise exception 'INVALID_STATUS_TRANSITION'; end if;
        perform public.transition_appointment_status(v_id,'no_show');
      end if;
    end if;
  when 'note' then
    if length(p_payload->>'note')>1000 then raise exception 'INVALID_INPUT'; end if;
    update public.appointments set note=p_payload->>'note' where salon_id=p_salon_id and id=v_id;
    if not found then raise exception 'NOT_FOUND'; end if;
  when 'settings' then
    if jsonb_array_length(p_payload->'openingHours')<>7 then raise exception 'INVALID_INPUT'; end if;
    select count(distinct (value->>'weekday')::int) into v_seen from jsonb_array_elements(p_payload->'openingHours');if v_seen<>7 then raise exception 'INVALID_INPUT';end if;
    update public.salons set name=trim(p_payload->'salon'->>'name'),phone=nullif(p_payload->'salon'->>'phone',''),email=nullif(p_payload->'salon'->>'email',''),address=nullif(p_payload->'salon'->>'address','') where id=p_salon_id;
    v_row:=p_payload->'settings';
    update public.booking_settings set slot_interval_minutes=(v_row->>'slot_interval_minutes')::int,min_lead_minutes=(v_row->>'min_lead_minutes')::int,max_days_ahead=(v_row->>'max_days_ahead')::int,allow_staff_choice=(v_row->>'allow_staff_choice')::boolean,cancellation_hours=(v_row->>'cancellation_hours')::int where salon_id=p_salon_id;
    for v_row in select value from jsonb_array_elements(p_payload->'openingHours') loop
      insert into public.opening_hours(salon_id,weekday,is_open,start_time,end_time) values(p_salon_id,(v_row->>'weekday')::smallint,(v_row->>'is_open')::boolean,case when (v_row->>'is_open')::boolean then (v_row->>'start_time')::time end,case when (v_row->>'is_open')::boolean then (v_row->>'end_time')::time end) on conflict(salon_id,weekday) do update set is_open=excluded.is_open,start_time=excluded.start_time,end_time=excluded.end_time;
    end loop;
    v_id:=p_salon_id;
  else raise exception 'INVALID_INPUT';
  end case;
  if p_kind in ('staff','settings') and private.workspace_schedule_conflict(p_salon_id,case when p_kind='staff' then v_id else null end) then raise exception 'APPOINTMENTS_IN_SCHEDULE';end if;
  return v_id;
end; $$;
revoke all on function public.save_workspace_entity(uuid,text,jsonb) from public,anon;
grant execute on function public.save_workspace_entity(uuid,text,jsonb) to authenticated;

create or replace function public.move_workspace_appointment(p_id uuid,p_staff_id uuid,p_starts_at timestamptz,p_expected_starts_at timestamptz default null,p_expected_staff_id uuid default null) returns uuid
language plpgsql security invoker set search_path='' as $$
declare v_a public.appointments%rowtype;v_salon uuid;
begin
  select salon_id into v_salon from public.appointments where id=p_id;
  if not found then raise exception 'NOT_FOUND';end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_salon::text,0));
  select * into v_a from public.appointments where id=p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if not private.has_salon_role(v_a.salon_id,array['owner','manager']::public.membership_role[]) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if (p_expected_starts_at is not null and v_a.starts_at<>p_expected_starts_at) or (p_expected_staff_id is not null and v_a.staff_id<>p_expected_staff_id) then raise exception 'STALE_APPOINTMENT'; end if;
  if p_starts_at<now() then raise exception 'SLOT_UNAVAILABLE';end if;
  return public.reschedule_appointment_atomic(p_id,p_staff_id,p_starts_at);
end; $$;
revoke all on function public.move_workspace_appointment(uuid,uuid,timestamptz,timestamptz,uuid) from public,anon;
grant execute on function public.move_workspace_appointment(uuid,uuid,timestamptz,timestamptz,uuid) to authenticated;

