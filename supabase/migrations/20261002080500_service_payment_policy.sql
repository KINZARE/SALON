create or replace function public.save_workspace_service(p_salon_id uuid,p_payload jsonb)
returns uuid
language plpgsql
set search_path=''
as $$
declare
  v_id uuid;
  v_mode public.payment_mode;
  v_deposit integer;
  v_price integer;
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

  update public.services
     set payment_mode=v_mode,
         deposit_cents=v_deposit
   where id=v_id and salon_id=p_salon_id;

  return v_id;
end;
$$;

revoke all on function public.save_workspace_service(uuid,jsonb) from public,anon;
grant execute on function public.save_workspace_service(uuid,jsonb) to authenticated,service_role;
