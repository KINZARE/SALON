alter table public.blocks add column if not exists daily_request_id uuid;
create unique index if not exists blocks_daily_request on public.blocks(salon_id,daily_request_id) where daily_request_id is not null;
create or replace function public.daily_create_block(p_salon_id uuid,p_staff_id uuid,p_starts_at timestamptz,p_ends_at timestamptz,p_reason text,p_request_id uuid) returns uuid
language plpgsql security invoker set search_path='' as $$
declare v_b public.blocks%rowtype; v_id uuid;
begin
 if not private.has_salon_role(p_salon_id,array['owner','manager']::public.membership_role[]) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if p_request_id is null or p_starts_at is null or p_ends_at is null or p_starts_at>=p_ends_at or length(coalesce(p_reason,''))>160 then raise exception 'INVALID_INPUT'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_salon_id::text,0));
 select * into v_b from public.blocks where salon_id=p_salon_id and daily_request_id=p_request_id;
 if found then
  if v_b.staff_id is distinct from p_staff_id or v_b.starts_at is distinct from p_starts_at or v_b.ends_at is distinct from p_ends_at or coalesce(v_b.reason,'')<>coalesce(p_reason,'') then raise exception 'REQUEST_ALREADY_USED'; end if;
  return v_b.id;
 end if;
 v_id:=public.save_workspace_entity(p_salon_id,'block',jsonb_build_object('staff_id',p_staff_id,'starts_at',p_starts_at,'ends_at',p_ends_at,'reason',p_reason));
 update public.blocks set daily_request_id=p_request_id where id=v_id and salon_id=p_salon_id;
 return v_id;
end;$$;
revoke all on function public.daily_create_block(uuid,uuid,timestamptz,timestamptz,text,uuid) from public,anon;
grant execute on function public.daily_create_block(uuid,uuid,timestamptz,timestamptz,text,uuid) to authenticated,service_role;
