alter table public.services
  add column if not exists rebook_after_days integer;

alter table public.services
  drop constraint if exists services_rebook_after_days_valid;
alter table public.services
  add constraint services_rebook_after_days_valid
  check (rebook_after_days is null or rebook_after_days between 1 and 730);

alter table public.notification_jobs
  add column if not exists idempotency_key text;

alter table public.notification_jobs
  drop constraint if exists notification_jobs_salon_id_idempotency_key_key;
alter table public.notification_jobs
  add constraint notification_jobs_salon_id_idempotency_key_key
  unique (salon_id,idempotency_key);

create or replace function public.save_workspace_service(p_salon_id uuid,p_payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_id uuid;
  v_mode public.payment_mode;
  v_deposit integer;
  v_price integer;
  v_category uuid;
  v_rebook integer;
begin
  v_id:=public.save_workspace_entity(p_salon_id,'service',p_payload);
  v_mode:=coalesce(nullif(p_payload->>'payment_mode','')::public.payment_mode,'pay_in_salon'::public.payment_mode);
  select price_cents into v_price from public.services where id=v_id and salon_id=p_salon_id;

  if v_mode='deposit' then
    v_deposit:=nullif(p_payload->>'deposit_cents','')::integer;
    if v_deposit is null or v_deposit<=0 or v_deposit>v_price then
      raise exception 'INVALID_DEPOSIT' using errcode='22023';
    end if;
  else
    v_deposit:=null;
  end if;

  if v_mode not in ('pay_in_salon','deposit','full_payment') then
    raise exception 'INVALID_PAYMENT_MODE' using errcode='22023';
  end if;

  if p_payload ? 'category_id' then
    v_category:=nullif(p_payload->>'category_id','')::uuid;
    if v_category is not null and not exists(
      select 1 from public.service_categories c where c.salon_id=p_salon_id and c.id=v_category
    ) then
      raise exception 'INVALID_CATEGORY' using errcode='23503';
    end if;
    update public.services
      set payment_mode=v_mode,deposit_cents=v_deposit,category_id=v_category
      where id=v_id and salon_id=p_salon_id;
  else
    update public.services
      set payment_mode=v_mode,deposit_cents=v_deposit
      where id=v_id and salon_id=p_salon_id;
  end if;

  if p_payload ? 'rebook_after_days' then
    v_rebook:=nullif(p_payload->>'rebook_after_days','')::integer;
    if v_rebook is not null and (v_rebook<1 or v_rebook>730) then
      raise exception 'INVALID_REBOOK_INTERVAL' using errcode='22023';
    end if;
    update public.services
      set rebook_after_days=v_rebook
      where id=v_id and salon_id=p_salon_id;
  end if;

  return v_id;
end;
$$;

create or replace function private.sync_completion_followups()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_email text;
  v_rebook integer;
  v_completed_at timestamptz:=now();
begin
  if new.status<>'completed' or old.status='completed' then
    return new;
  end if;

  select nullif(trim(c.email),'') into v_email
  from public.customers c
  where c.id=new.customer_id and c.salon_id=new.salon_id;

  if v_email is null then
    return new;
  end if;

  if new.service_id is not null then
    select s.rebook_after_days into v_rebook
    from public.services s
    where s.id=new.service_id and s.salon_id=new.salon_id;
  end if;

  insert into public.notification_jobs(
    salon_id,appointment_id,kind,channel,recipient,payload,status,attempt_count,next_attempt_at,last_error,idempotency_key
  ) values (
    new.salon_id,new.id,'feedback_request','email',v_email,
    jsonb_build_object('appointment_id',new.id),'pending',0,v_completed_at+interval '1 day',null,
    'feedback_request/'||new.id::text
  )
  on conflict(salon_id,idempotency_key) do nothing;

  if v_rebook is not null then
    insert into public.notification_jobs(
      salon_id,appointment_id,kind,channel,recipient,payload,status,attempt_count,next_attempt_at,last_error,idempotency_key
    ) values (
      new.salon_id,new.id,'rebook_reminder','email',v_email,
      jsonb_build_object('appointment_id',new.id,'rebook_after_days',v_rebook),'pending',0,
      v_completed_at+make_interval(days=>v_rebook),null,
      'rebook_reminder/'||new.id::text
    )
    on conflict(salon_id,idempotency_key) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function private.sync_completion_followups() from public,anon,authenticated;

drop trigger if exists appointments_sync_completion_followups on public.appointments;
create trigger appointments_sync_completion_followups
after update of status on public.appointments
for each row execute function private.sync_completion_followups();
