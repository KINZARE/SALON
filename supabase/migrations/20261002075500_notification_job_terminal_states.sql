alter table public.notification_jobs
  drop constraint notification_jobs_status_check;

alter table public.notification_jobs
  add constraint notification_jobs_status_check
  check (status in ('pending','processing','sent','failed','cancelled','dead'));
