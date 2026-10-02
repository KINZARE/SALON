-- Administrator integration suite: no fixture commits and no emails can leave.
begin;
do $$
declare
  tenant uuid:=gen_random_uuid(); member uuid:=gen_random_uuid(); treatment uuid:=gen_random_uuid();
  booking uuid; form uuid; submission uuid; rejected boolean; token text:=encode(gen_random_bytes(32),'hex');
  intake_token text:=encode(gen_random_bytes(32),'hex');
  target date:=current_date+4; initial_start timestamptz; moved_start timestamptz;
begin
  insert into public.salons(id,name,slug) values(tenant,'Rollback product QA','qa-'||tenant);
  insert into public.staff(id,salon_id,name) values(member,tenant,'QA staff');
  insert into public.services(id,salon_id,name,duration_minutes,buffer_minutes,price_cents) values(treatment,tenant,'QA treatment',60,15,6500);
  insert into public.staff_services(salon_id,staff_id,service_id) values(tenant,member,treatment);
  insert into public.opening_hours(salon_id,weekday,is_open,start_time,end_time) select tenant,i,true,'09:00','20:00' from generate_series(0,6) i;
  insert into public.staff_schedules(salon_id,staff_id,weekday,is_working,start_time,end_time) select tenant,member,i,true,'09:00','20:00' from generate_series(0,6) i;
  insert into public.booking_settings(salon_id,min_lead_minutes,max_days_ahead) values(tenant,0,365);
  initial_start:=(target+time '10:00') at time zone 'Europe/Amsterdam';
  moved_start:=(target+time '15:00') at time zone 'Europe/Amsterdam';
  booking:=public.create_appointment_atomic(tenant,treatment,member,initial_start,'QA customer','+31 6 0000 9999','qa@example.com',null,'public_booking');
  if (select count(*) from public.notification_jobs where appointment_id=booking and kind='booking_confirmation')<>1
     or (select count(*) from public.notification_jobs where appointment_id=booking and kind='appointment_reminder')<>1 then raise exception 'FAIL confirmation/reminder outbox';end if;
  insert into public.appointment_self_service_tokens(salon_id,appointment_id,token_hash,expires_at)
  values(tenant,booking,token,initial_start+interval '1 day');
  perform public.self_service_reschedule_appointment(token,member,moved_start);
  if not exists(select 1 from public.appointments where id=booking and starts_at=moved_start and occupied_until=moved_start+interval '75 minutes') then raise exception 'FAIL self service move snapshots';end if;
  if not exists(select 1 from public.notification_jobs where appointment_id=booking and kind='appointment_reminder' and next_attempt_at=moved_start-interval '24 hours') then raise exception 'FAIL reminder follows move';end if;
  execute 'set local role service_role';
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  rejected:=false;
  begin perform public.save_opening_exception(tenant,target,false);exception when others then if sqlerrm='APPOINTMENTS_IN_SCHEDULE' then rejected:=true;else raise;end if;end;
  if not rejected then raise exception 'FAIL opening exception conflict';end if;
  rejected:=false;
  begin perform public.save_staff_schedule_override(tenant,member,target,false);exception when others then if sqlerrm='APPOINTMENTS_IN_SCHEDULE' then rejected:=true;else raise;end if;end;
  if not rejected then raise exception 'FAIL staff override conflict';end if;

  -- Execute the actual form builder as the service role used in no-login mode.
  execute 'set local role service_role';
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  form:=public.save_intake_form(tenant,null,'QA intake','',true,'QA consent','[{"label":"Question","type":"short_text","required":true}]'::jsonb,array[treatment]);
  if not exists(select 1 from public.intake_form_services where form_id=form and service_id=treatment) then raise exception 'FAIL intake service link';end if;
  insert into public.appointment_intake_links(salon_id,appointment_id,form_id,form_version,token_hash,expires_at,form_snapshot)
  values(tenant,booking,form,1,intake_token,now()+interval '1 day','{"consentStatement":"QA consent","fields":[]}'::jsonb);
  rejected:=false;begin perform public.submit_intake_form(intake_token,'QA customer','{}',false);exception when others then if sqlerrm='CONSENT_REQUIRED' then rejected:=true;else raise;end if;end;
  if not rejected then raise exception 'FAIL consent requirement';end if;
  submission:=public.submit_intake_form(intake_token,'QA customer','{"answer":"QA"}',true);
  if not exists(select 1 from public.intake_submissions where id=submission and form_version=1)
     or not exists(select 1 from public.appointment_consents where appointment_id=booking and statement='QA consent' and statement_version=1) then raise exception 'FAIL intake/consent snapshots';end if;
  perform public.save_intake_form(tenant,form,'QA intake revised','',true,'Revised consent','[{"label":"Revised","type":"short_text"}]'::jsonb,array[treatment]);
  if not exists(select 1 from public.intake_forms where id=form and version=2)
     or not exists(select 1 from public.intake_submissions where id=submission and form_version=1) then raise exception 'FAIL intake version history';end if;
  rejected:=false;begin perform public.submit_intake_form(intake_token,'QA customer','{}',true);exception when others then if sqlerrm='FORM_LINK_INVALID' then rejected:=true;else raise;end if;end;
  if not rejected then raise exception 'FAIL intake link replay';end if;
  perform public.self_service_cancel_appointment(token);
  if not exists(select 1 from public.appointments where id=booking and status='cancelled')
     or not exists(select 1 from public.notification_jobs where appointment_id=booking and kind='appointment_reminder' and status='cancelled') then raise exception 'FAIL self service cancel/reminder invalidation';end if;
  rejected:=false;begin perform public.self_service_cancel_appointment(repeat('0',64));exception when insufficient_privilege then rejected:=true;end;
  if not rejected then raise exception 'FAIL invalid self service token';end if;
  execute 'reset role';
end $$;
select 'PASS: public booking, outbox, self-service move/cancel, opening and staff exceptions, intake builder/service link/versioning/consent/replay; rolled back' as result;
rollback;
