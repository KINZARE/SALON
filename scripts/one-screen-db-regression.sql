-- Run inside BEGIN/ROLLBACK with the candidate migration; all data is synthetic.
do $$
declare
 tenant uuid:=gen_random_uuid(); other_tenant uuid:=gen_random_uuid(); st uuid:=gen_random_uuid(); svc uuid:=gen_random_uuid(); ap uuid; started timestamptz; rejected boolean; uid uuid:=gen_random_uuid();
 slot timestamptz:=((current_date+2)::text||' 10:00 Europe/Amsterdam')::timestamptz;
begin
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 insert into public.salons(id,slug,name) values(tenant,'qa-day-'||tenant,'Synthetic daily QA');
 insert into public.salons(id,slug,name) values(other_tenant,'qa-day-'||other_tenant,'Other synthetic tenant');
 insert into public.staff(id,salon_id,name) values(st,tenant,'Synthetic employee');
 insert into public.services(id,salon_id,name,duration_minutes,buffer_minutes,price_cents) values(svc,tenant,'Synthetic service',60,15,6500);
 insert into public.staff_services(salon_id,staff_id,service_id) values(tenant,st,svc);
 insert into public.booking_settings(salon_id,min_lead_minutes,max_days_ahead) values(tenant,0,365);
 insert into public.opening_hours(salon_id,weekday,is_open,start_time,end_time) select tenant,d,true,'09:00'::time,'20:00'::time from generate_series(0,6) d;
 insert into public.staff_schedules(salon_id,staff_id,weekday,is_working,start_time,end_time) select tenant,st,d,true,'09:00'::time,'20:00'::time from generate_series(0,6) d;
 ap:=public.create_appointment_atomic(tenant,svc,st,slot,'Synthetic daily customer',null,null,null,'internal',null,null);
 rejected:=false;
 begin perform public.daily_appointment_action(other_tenant,ap,'check_in','confirmed',null); exception when no_data_found then rejected:=true; end;
 if not rejected then raise exception 'TENANT_ISOLATION_FAILED'; end if;
 perform public.daily_appointment_action(tenant,ap,'check_in','confirmed',null);
 rejected:=false;
 begin perform public.daily_appointment_action(tenant,ap,'check_in','confirmed',null); exception when serialization_failure then rejected:=true; end;
 if not rejected then raise exception 'DUPLICATE_CHECKIN_FAILED'; end if;
 perform public.daily_appointment_action(tenant,ap,'start','checked_in',null);
 select treatment_started_at into started from public.appointments where id=ap;
 if started is null then raise exception 'START_NOT_PERSISTED'; end if;
 rejected:=false;
 begin perform public.create_appointment_atomic(tenant,svc,st,slot,'Collision',null,null,null,'internal',null,null); exception when exclusion_violation then rejected:=true; end;
 if not rejected then raise exception 'TREATMENT_RELEASED_CAPACITY'; end if;
 rejected:=false;
 begin perform public.save_workspace_entity(tenant,'block',jsonb_build_object('staff_id',st,'starts_at',slot,'ends_at',slot+interval '30 minutes','reason','Synthetic pause')); exception when others then if sqlerrm like '%APPOINTMENTS_IN_BLOCK%' then rejected:=true; else raise; end if; end;
 if not rejected then raise exception 'PAUSE_OVERLAP_FAILED'; end if;
 perform public.daily_appointment_action(tenant,ap,'note','checked_in',started,'First note',null);
 rejected:=false;
 begin perform public.daily_appointment_action(tenant,ap,'note','checked_in',started,'Lost update',null); exception when serialization_failure then rejected:=true; end;
 if not rejected then raise exception 'NOTE_CAS_FAILED'; end if;
 perform public.daily_appointment_action(tenant,ap,'finish','checked_in',started);
 if (select status from public.appointments where id=ap)<>'completed' then raise exception 'FINISH_FAILED'; end if;
 if (select payment_status from public.appointments where id=ap)<>'unpaid' then raise exception 'PAYMENT_TRUTH_CHANGED'; end if;
 if has_function_privilege('anon','public.daily_appointment_action(uuid,uuid,text,text,timestamptz,text,text)','EXECUTE') then raise exception 'ANON_RPC_EXPOSED'; end if;
 insert into auth.users(id,email) values(uid,'qa-'||uid||'@example.com');
 insert into public.memberships(salon_id,user_id,role) values(tenant,uid,'staff');
 perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',uid)::text,true);
 rejected:=false;
 begin perform public.daily_appointment_action(tenant,ap,'note','completed',started,'Unauthorized','First note'); exception when insufficient_privilege then rejected:=true; end;
 if not rejected then raise exception 'STAFF_AUTHORIZATION_FAILED'; end if;
 -- Exercise actual RLS as authenticated manager (not merely JWT claims as postgres).
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 update public.memberships set role='manager' where salon_id=tenant and user_id=uid;
 ap:=public.create_appointment_atomic(tenant,svc,st,slot+interval '1 day','Authenticated synthetic customer',null,null,null,'internal',null,null);
 perform public.daily_appointment_action(tenant,ap,'check_in','confirmed',null);
 perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',uid)::text,true);
 execute 'set local role authenticated';
 if (select count(*) from public.salons where id=other_tenant)<>0 then raise exception 'RLS_CROSS_TENANT_READ'; end if;
 perform public.daily_appointment_action(tenant,ap,'start','checked_in',null);
 if (select count(*) from public.appointment_events where appointment_id=ap and event_type='treatment_started')<>1 then raise exception 'AUTHENTICATED_START_EVENT_FAILED'; end if;
 execute 'reset role';
end;$$;
select 'ONE_SCREEN_DB_REGRESSION_PASS' as result;
