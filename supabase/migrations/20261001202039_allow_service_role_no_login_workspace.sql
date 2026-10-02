create or replace function private.has_salon_role(
  p_salon_id uuid,
  p_roles public.membership_role[] default null::public.membership_role[]
)
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $function$
  select
    coalesce(
      (coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'role') = 'service_role',
      false
    )
    or exists (
      select 1
      from public.memberships m
      where m.salon_id = p_salon_id
        and m.user_id = auth.uid()
        and (p_roles is null or m.role = any(p_roles))
    );
$function$;
