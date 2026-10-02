-- Idempotent confirmation/reminder outbox support.
-- Delivery remains an application concern; database truth only schedules jobs.

create unique index if not exists uq_notification_confirmation_appointment_channel
  on public.notification_jobs (appointment_id, channel)
  where appointment_id is not null and kind='booking_confirmation';

create unique index if not exists uq_notification_reminder_appointment_channel
  on public.notification_jobs (appointment_id, channel)
  where appointment_id is not null and kind='appointment_reminder';

create or replace function private.sync_appointment_email_reminder()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
begin
  select c.email into v_email
  from public.customers c
  where c.id = new.customer_id
    and c.salon_id = new.salon_id;

  if new.status not in ('pending','confirmed','checked_in')
     or nullif(trim(v_email),'') is null
     or new.starts_at <= now() + interval '24 hours' then
    update public.notification_jobs
       set status='cancelled',
           updated_at=now()
     where appointment_id=new.id
       and kind='appointment_reminder'
       and channel='email'
       and status<>'sent';
    return new;
  end if;

  insert into public.notification_jobs(
    salon_id,appointment_id,kind,channel,recipient,payload,status,attempt_count,next_attempt_at,last_error
  ) values (
    new.salon_id,new.id,'appointment_reminder','email',v_email,
    jsonb_build_object('appointment_id',new.id),'pending',0,new.starts_at-interval '24 hours',null
  )
  on conflict (appointment_id,channel)
  where appointment_id is not null and kind='appointment_reminder'
  do update set
    salon_id=excluded.salon_id,
    recipient=excluded.recipient,
    payload=excluded.payload,
    status='pending',
    attempt_count=0,
    next_attempt_at=excluded.next_attempt_at,
    last_error=null,
    updated_at=now();

  return new;
end;
$$;

revoke all on function private.sync_appointment_email_reminder() from public, anon, authenticated;

drop trigger if exists appointments_sync_email_reminder on public.appointments;
create trigger appointments_sync_email_reminder
after insert or update of starts_at,status,customer_id
on public.appointments
for each row execute function private.sync_appointment_email_reminder();

insert into public.notification_jobs(
  salon_id,appointment_id,kind,channel,recipient,payload,status,attempt_count,next_attempt_at,last_error
)
select
  a.salon_id,
  a.id,
  'appointment_reminder',
  'email',
  c.email,
  jsonb_build_object('appointment_id',a.id),
  'pending',
  0,
  a.starts_at-interval '24 hours',
  null
from public.appointments a
join public.customers c
  on c.id=a.customer_id
 and c.salon_id=a.salon_id
where a.status in ('pending','confirmed','checked_in')
  and a.starts_at > now()+interval '24 hours'
  and nullif(trim(c.email),'') is not null
on conflict (appointment_id,channel)
where appointment_id is not null and kind='appointment_reminder'
do nothing;
