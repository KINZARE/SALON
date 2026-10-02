-- CORE workspace performance cleanup.
-- Keeps RLS semantics unchanged while avoiding per-row auth.uid() evaluation
-- and adds covering indexes for the highest-frequency operational foreign-key paths.

create index if not exists idx_appointments_salon_customer_start
  on public.appointments (salon_id, customer_id, starts_at desc);

create index if not exists idx_appointments_salon_service_start
  on public.appointments (salon_id, service_id, starts_at);

create index if not exists idx_blocks_salon_staff_time
  on public.blocks (salon_id, staff_id, starts_at, ends_at);

create index if not exists idx_breaks_salon_staff_weekday
  on public.breaks (salon_id, staff_id, weekday);

create index if not exists idx_staff_schedules_salon_staff_weekday
  on public.staff_schedules (salon_id, staff_id, weekday);

create index if not exists idx_staff_services_salon_staff
  on public.staff_services (salon_id, staff_id);

create index if not exists idx_staff_services_salon_service
  on public.staff_services (salon_id, service_id);

create index if not exists idx_notification_jobs_salon
  on public.notification_jobs (salon_id);

create index if not exists idx_notification_jobs_appointment
  on public.notification_jobs (appointment_id);

alter policy customers_assigned_staff_select
on public.customers
using (
  exists (
    select 1
    from public.appointments a
    join public.staff s
      on s.id = a.staff_id
     and s.salon_id = a.salon_id
    where a.customer_id = customers.id
      and a.salon_id = customers.salon_id
      and s.user_id = (select auth.uid())
  )
);
