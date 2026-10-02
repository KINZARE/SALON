-- Pure normalization helpers are called by the invoker CRUD RPC.
grant execute on function public.normalize_phone(text),public.normalize_email(text) to authenticated;
-- Staff see contact/context only for customers attached to their own appointments.
create policy customers_assigned_staff_select on public.customers for select to authenticated using (
  exists(select 1 from public.appointments a join public.staff s on s.id=a.staff_id and s.salon_id=a.salon_id
    where a.customer_id=customers.id and a.salon_id=customers.salon_id and s.user_id=auth.uid())
);
