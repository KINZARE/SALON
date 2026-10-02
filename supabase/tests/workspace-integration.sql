-- Run against the migrated database as a test administrator. Every fixture rolls back.
begin;
do $$
declare
  tenant uuid:=gen_random_uuid(); other_tenant uuid:=gen_random_uuid();
  owner_id uuid:=gen_random_uuid(); manager_id uuid:=gen_random_uuid(); staff_user uuid:=gen_random_uuid(); stranger uuid:=gen_random_uuid();
  member uuid:=gen_random_uuid(); colleague uuid:=gen_random_uuid(); treatment uuid:=gen_random_uuid(); customer uuid; booking uuid; second_booking uuid; saved uuid;
  schedules jsonb; payload jsonb; before_snapshot jsonb; after_snapshot jsonb; rejected boolean;
begin
  insert into auth.users(id,email) values(owner_id,owner_id||'@qa.invalid'),(manager_id,manager_id||'@qa.invalid'),(staff_user,staff_user||'@qa.invalid'),(stranger,stranger||'@qa.invalid');
  insert into public.salons(id,name,slug) values(tenant,'QA rollback', 'qa-'||tenant),(other_tenant,'Other QA rollback','qa-'||other_tenant);
  insert into public.memberships(salon_id,user_id,role) values(tenant,owner_id,'owner'),(tenant,manager_id,'manager'),(tenant,staff_user,'staff'),(other_tenant,stranger,'owner');
  insert into public.staff(id,salon_id,name,user_id) values(member,tenant,'Assigned',staff_user),(colleague,tenant,'Colleague',null);
  insert into public.services(id,salon_id,name,duration_minutes,buffer_minutes,price_cents) values(treatment,tenant,'Original treatment',60,15,6500);
  insert into public.staff_services(salon_id,staff_id,service_id) values(tenant,member,treatment),(tenant,colleague,treatment);
  insert into public.opening_hours(salon_id,weekday,is_open,start_time,end_time) select tenant,i,true,'09:00','20:00' from generate_series(0,6) i;
  insert into public.staff_schedules(salon_id,staff_id,weekday,is_working,start_time,end_time) select tenant,s,i,true,'09:00','20:00' from unnest(array[member,colleague]) s cross join generate_series(0,6) i;
  insert into public.booking_settings(salon_id,min_lead_minutes,max_days_ahead) values(tenant,0,365);
  booking:=public.create_appointment_atomic(tenant,treatment,member,(current_date+1+time '10:00') at time zone 'Europe/Amsterdam','QA assigned','0611111111','assigned@qa.invalid',null,'internal',owner_id);
  second_booking:=public.create_appointment_atomic(tenant,treatment,colleague,(current_date+1+time '10:00') at time zone 'Europe/Amsterdam','QA colleague','0622222222','colleague@qa.invalid',null,'internal',owner_id);
  select customer_id,to_jsonb(a)-array['updated_at','starts_at','service_ends_at','occupied_until','staff_id'] into customer,before_snapshot from public.appointments a where id=booking;
  rejected:=false;
  begin perform public.create_appointment_atomic(tenant,treatment,member,(current_date+1+time '10:30') at time zone 'Europe/Amsterdam','Overlap',null,null,null,'internal',owner_id); exception when exclusion_violation then rejected:=true;end;
  if not rejected then raise exception 'FAIL database overlap';end if;
  -- Adjacent occupancy boundary is legal (buffer included).
  perform public.create_appointment_atomic(tenant,treatment,member,(current_date+1+time '11:15') at time zone 'Europe/Amsterdam','Adjacent',null,null,null,'internal',owner_id);
  select jsonb_agg(jsonb_build_object('weekday',i,'is_working',true,'start_time','09:00','end_time','20:00')) into schedules from generate_series(0,6) i;
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  if (select count(*) from public.salons)<>1 then raise exception 'FAIL owner tenant isolation';end if;
  saved:=public.save_workspace_entity(tenant,'customer',jsonb_build_object('name','Owner customer','phone','06 3333 3333','email','OWNER@QA.INVALID'));
  if not exists(select 1 from public.customers where id=saved and email_normalized='owner@qa.invalid') then raise exception 'FAIL owner CRUD normalization';end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',manager_id,'role','authenticated')::text,true);
  saved:=public.save_workspace_entity(tenant,'staff',jsonb_build_object('name','Manager-created staff','email',null,'role','manager','active',true,'service_ids',jsonb_build_array(treatment),'schedules',schedules,'breaks',jsonb_build_array(jsonb_build_object('weekday',1,'start_time','13:00','end_time','13:30'))));
  if (select count(*) from public.staff_schedules where staff_id=saved)<>7 or (select count(*) from public.breaks where staff_id=saved)<>1 then raise exception 'FAIL atomic staff schedule breaks';end if;
  if exists(select 1 from public.memberships where user_id=saved) then raise exception 'FAIL staff role changed login';end if;
  perform public.save_workspace_service(tenant,jsonb_build_object('id',treatment,'name','Changed treatment','description','','duration_minutes',90,'buffer_minutes',20,'price_cents',9900,'active',true,'online_bookable',false,'staff_ids',jsonb_build_array(member,colleague),'payment_mode','deposit','deposit_cents',2000));
  if not exists(select 1 from public.services where id=treatment and salon_id=tenant and payment_mode='deposit' and deposit_cents=2000) then raise exception 'FAIL transactional deposit policy';end if;
  select to_jsonb(a)-array['updated_at','starts_at','service_ends_at','occupied_until','staff_id'] into after_snapshot from public.appointments a where id=booking;
  if after_snapshot<>before_snapshot then raise exception 'FAIL historical snapshots';end if;
  rejected:=false;begin perform public.save_workspace_entity(other_tenant,'customer',jsonb_build_object('name','Forbidden'));exception when insufficient_privilege then rejected:=true;end;
  if not rejected then raise exception 'FAIL manager other tenant mutation';end if;
  -- Snapshot duration/buffer retained after service change and cross-staff move.
  perform public.move_workspace_appointment(booking,colleague,(current_date+1+time '15:00') at time zone 'Europe/Amsterdam');
  if not exists(select 1 from public.appointments where id=booking and service_ends_at-starts_at=interval '60 minutes' and occupied_until-service_ends_at=interval '15 minutes') then raise exception 'FAIL move snapshots';end if;
  rejected:=false;begin perform public.move_workspace_appointment(booking,member,(current_date+1+time '16:30') at time zone 'Europe/Amsterdam',(current_date+1+time '10:00') at time zone 'Europe/Amsterdam',member);exception when others then if sqlerrm='STALE_APPOINTMENT' then rejected:=true;else raise;end if;end;
  if not rejected then raise exception 'FAIL stale move';end if;
  rejected:=false;begin perform public.save_workspace_entity(tenant,'block',jsonb_build_object('staff_id',colleague,'starts_at',(current_date+1+time '15:00') at time zone 'Europe/Amsterdam','ends_at',(current_date+1+time '16:00') at time zone 'Europe/Amsterdam'));exception when others then if sqlerrm='APPOINTMENTS_IN_BLOCK' then rejected:=true;else raise;end if;end;
  if not rejected then raise exception 'FAIL block appointment protection';end if;
  perform public.save_workspace_entity(tenant,'status',jsonb_build_object('id',booking,'status','completed'));
  if not exists(select 1 from public.appointments where id=booking and status='completed') then raise exception 'FAIL simplified complete';end if;
  rejected:=false;begin perform public.save_workspace_entity(tenant,'status',jsonb_build_object('id',booking,'status','cancelled'));exception when others then if sqlerrm='INVALID_STATUS_TRANSITION' then rejected:=true;else raise;end if;end;
  if not rejected then raise exception 'FAIL terminal transition';end if;
  -- Restore booking's staff for the staff visibility assertion, only inside rollback fixture.
  execute 'reset role';update public.appointments set staff_id=member where id=booking;
  execute 'set local role authenticated';perform set_config('request.jwt.claims',jsonb_build_object('sub',staff_user,'role','authenticated')::text,true);
  if not exists(select 1 from public.appointments where id=booking) or exists(select 1 from public.appointments where id=second_booking) then raise exception 'FAIL staff appointment scope';end if;
  if not exists(select 1 from public.customers where id=customer) or exists(select 1 from public.customers where id=saved) then raise exception 'FAIL relevant customer context';end if;
  rejected:=false;begin perform public.save_workspace_entity(tenant,'customer',jsonb_build_object('name','Staff forbidden'));exception when insufficient_privilege then rejected:=true;end;
  if not rejected then raise exception 'FAIL staff mutation permission';end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',stranger,'role','authenticated')::text,true);
  if exists(select 1 from public.appointments) or exists(select 1 from public.customers) then raise exception 'FAIL foreign tenant data';end if;
  execute 'reset role';
  if to_regprocedure('public.workspace_preview_read(uuid,jsonb)') is not null or to_regprocedure('public.workspace_preview_write(uuid,integer,jsonb)') is not null then raise exception 'FAIL legacy preview functions still exist';end if;
  if has_function_privilege('anon','public.claim_notification_jobs(integer)','EXECUTE') or has_function_privilege('authenticated','public.claim_notification_jobs(integer)','EXECUTE') or not has_function_privilege('service_role','public.claim_notification_jobs(integer)','EXECUTE') then raise exception 'FAIL notification claim privilege';end if;
  if has_table_privilege('anon','public.appointment_self_service_tokens','SELECT') or has_table_privilege('authenticated','public.appointment_self_service_tokens','SELECT') then raise exception 'FAIL self service direct access';end if;
  if has_table_privilege('anon','public.smart_booking_links','SELECT') or has_table_privilege('authenticated','public.smart_booking_links','SELECT') then raise exception 'FAIL smart link direct access';end if;
  if has_table_privilege('anon','public.waitlist_entries','SELECT') or has_table_privilege('authenticated','public.waitlist_entries','SELECT') then raise exception 'FAIL waitlist direct access';end if;
  if (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('appointment_self_service_tokens','smart_booking_links','waitlist_entries') and c.relrowsecurity)<>3 then raise exception 'FAIL server-only table RLS';end if;
end $$;
select 'PASS: owner/manager CRUD, tenant isolation, staff scope, overlap, snapshots, deposit policy, stale move, blocks, transitions, server-only public workflows' as result;
rollback;
