-- Service-role-only atomic notification queue claiming.
-- SKIP LOCKED prevents concurrent workers from processing the same job.
-- Stale processing jobs can be reclaimed after 15 minutes.

create or replace function public.claim_notification_jobs(p_limit integer default 20)
returns setof public.notification_jobs
language sql
volatile
set search_path = ''
as $$
  with due as (
    select id
    from public.notification_jobs
    where (
      (status in ('pending','failed') and next_attempt_at <= now())
      or (status='processing' and updated_at < now()-interval '15 minutes')
    )
    order by next_attempt_at,id
    for update skip locked
    limit greatest(1,least(coalesce(p_limit,20),100))
  )
  update public.notification_jobs n
     set status='processing',
         attempt_count=n.attempt_count+1,
         updated_at=now()
    from due
   where n.id=due.id
  returning n.*;
$$;

revoke all on function public.claim_notification_jobs(integer) from public,anon,authenticated;
grant execute on function public.claim_notification_jobs(integer) to service_role;
