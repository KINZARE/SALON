create policy appointment_self_service_tokens_deny_clients
on public.appointment_self_service_tokens
for all
to anon,authenticated
using (false)
with check (false);

create policy smart_booking_links_deny_clients
on public.smart_booking_links
for all
to anon,authenticated
using (false)
with check (false);

create policy waitlist_entries_deny_clients
on public.waitlist_entries
for all
to anon,authenticated
using (false)
with check (false);

create index if not exists idx_smart_booking_links_service_fk on public.smart_booking_links(service_id);
create index if not exists idx_smart_booking_links_staff_fk on public.smart_booking_links(staff_id) where staff_id is not null;
create index if not exists idx_waitlist_entries_service_fk on public.waitlist_entries(service_id);
create index if not exists idx_waitlist_entries_staff_fk on public.waitlist_entries(preferred_staff_id) where preferred_staff_id is not null;
