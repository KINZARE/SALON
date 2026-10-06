-- Preserve event RLS. Like existing status transitions, a narrowly scoped private
-- authority writes the audit event only for a persisted, authorized treatment.
create or replace function private.record_daily_treatment_start(p_salon_id uuid,p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.has_salon_role(p_salon_id,array['owner','manager']::public.membership_role[]) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_salon_id::text,0));
 perform 1 from public.appointments where salon_id=p_salon_id and id=p_id and status='checked_in' and treatment_started_at is not null for update;
 if not found then raise exception 'INVALID_STATUS_TRANSITION'; end if;
 if not exists(select 1 from public.appointment_events where salon_id=p_salon_id and appointment_id=p_id and event_type='treatment_started') then
  insert into public.appointment_events(salon_id,appointment_id,event_type,actor_user_id) values(p_salon_id,p_id,'treatment_started',auth.uid());
 end if;
end;$$;
revoke all on function private.record_daily_treatment_start(uuid,uuid) from public,anon;
grant execute on function private.record_daily_treatment_start(uuid,uuid) to authenticated,service_role;

create or replace function public.daily_appointment_action(
 p_salon_id uuid,p_id uuid,p_action text,p_expected_status text,
 p_expected_started_at timestamptz,p_note text default null,p_expected_note text default null
) returns uuid
language plpgsql security invoker set search_path='' as $$
declare v_a public.appointments%rowtype;
begin
 if not private.has_salon_role(p_salon_id,array['owner','manager']::public.membership_role[]) then
  raise exception 'FORBIDDEN' using errcode='42501';
 end if;
 if p_action is null or p_action not in ('check_in','start','finish','cancel','no_show','note')
  or p_expected_status is null or p_expected_status not in ('pending','confirmed','checked_in','completed','cancelled','no_show') then
  raise exception 'INVALID_INPUT' using errcode='22023';
 end if;
 -- Same salon-before-row order as booking/block/move primitives.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_salon_id::text,0));
 select * into v_a from public.appointments where salon_id=p_salon_id and id=p_id for update;
 if not found then raise exception 'NOT_FOUND' using errcode='P0002'; end if;
 if v_a.status::text is distinct from p_expected_status
  or v_a.treatment_started_at is distinct from p_expected_started_at then
  raise exception 'STALE_APPOINTMENT' using errcode='40001';
 end if;
 case p_action
 when 'check_in' then
  if v_a.status='pending' then perform public.transition_appointment_status(p_id,'confirmed');
  elsif v_a.status<>'confirmed' then raise exception 'INVALID_STATUS_TRANSITION'; end if;
  perform public.transition_appointment_status(p_id,'checked_in');
 when 'start' then
  if v_a.status<>'checked_in' or v_a.treatment_started_at is not null then raise exception 'INVALID_STATUS_TRANSITION'; end if;
  update public.appointments set treatment_started_at=pg_catalog.clock_timestamp() where id=p_id and salon_id=p_salon_id;
  perform private.record_daily_treatment_start(p_salon_id,p_id);
 when 'finish' then
  if v_a.status<>'checked_in' or v_a.treatment_started_at is null then raise exception 'INVALID_STATUS_TRANSITION'; end if;
  perform public.transition_appointment_status(p_id,'completed');
 when 'cancel' then perform public.transition_appointment_status(p_id,'cancelled');
 when 'no_show' then perform public.transition_appointment_status(p_id,'no_show');
 when 'note' then
  if p_note is null or length(p_note)>1000 then raise exception 'INVALID_INPUT'; end if;
  if v_a.note is distinct from p_expected_note then raise exception 'STALE_NOTE' using errcode='40001'; end if;
  perform public.save_workspace_entity(p_salon_id,'note',jsonb_build_object('id',p_id,'note',p_note));
 end case;
 return p_id;
end;$$;
revoke all on function public.daily_appointment_action(uuid,uuid,text,text,timestamptz,text,text) from public,anon;
grant execute on function public.daily_appointment_action(uuid,uuid,text,text,timestamptz,text,text) to authenticated,service_role;
