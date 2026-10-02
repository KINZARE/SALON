alter table public.appointment_intake_links
  add column if not exists form_snapshot jsonb not null default '{}'::jsonb;
alter table public.appointment_intake_links
  drop constraint if exists appointment_intake_links_snapshot_object;
alter table public.appointment_intake_links
  add constraint appointment_intake_links_snapshot_object check (jsonb_typeof(form_snapshot)='object');

create or replace function public.save_intake_form(
  p_salon_id uuid,
  p_form_id uuid,
  p_title text,
  p_description text,
  p_active boolean,
  p_consent_statement text,
  p_fields jsonb,
  p_service_ids uuid[]
) returns uuid
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_id uuid;
  v_field jsonb;
  v_index integer:=0;
  v_type text;
  v_label text;
begin
  if not private.has_salon_role(p_salon_id,array['owner','manager']::public.membership_role[]) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if nullif(trim(p_title),'') is null or char_length(trim(p_title))>120 or jsonb_typeof(p_fields)<>'array' or jsonb_array_length(p_fields)<1 or jsonb_array_length(p_fields)>40 then raise exception 'INVALID_FORM'; end if;
  if p_form_id is null then
    insert into public.intake_forms(salon_id,title,description,active,consent_statement)
    values(p_salon_id,trim(p_title),nullif(trim(p_description),''),p_active,nullif(trim(p_consent_statement),''))
    returning id into v_id;
  else
    update public.intake_forms set title=trim(p_title),description=nullif(trim(p_description),''),active=p_active,
      consent_statement=nullif(trim(p_consent_statement),''),version=version+1,updated_at=now()
    where id=p_form_id and salon_id=p_salon_id returning id into v_id;
    if v_id is null then raise exception 'FORM_NOT_FOUND'; end if;
    delete from public.intake_form_fields where salon_id=p_salon_id and form_id=v_id;
    delete from public.intake_form_services where salon_id=p_salon_id and form_id=v_id;
  end if;

  for v_field in select value from jsonb_array_elements(p_fields) loop
    v_label:=trim(coalesce(v_field->>'label',''));
    v_type:=coalesce(v_field->>'type','');
    if v_label='' or char_length(v_label)>180 or v_type not in ('short_text','long_text','yes_no','select','checkbox','date','consent') then raise exception 'INVALID_FIELD'; end if;
    if v_type='select' and (jsonb_typeof(coalesce(v_field->'options','[]'::jsonb))<>'array' or jsonb_array_length(coalesce(v_field->'options','[]'::jsonb))<1) then raise exception 'SELECT_OPTIONS_REQUIRED'; end if;
    insert into public.intake_form_fields(salon_id,form_id,label,field_type,required,options,sort_order)
    values(p_salon_id,v_id,v_label,v_type,coalesce((v_field->>'required')::boolean,false),coalesce(v_field->'options','[]'::jsonb),v_index);
    v_index:=v_index+1;
  end loop;

  if coalesce(array_length(p_service_ids,1),0)>0 then
    if exists(select 1 from unnest(p_service_ids) id where not exists(select 1 from public.services s where s.salon_id=p_salon_id and s.id=id)) then raise exception 'INVALID_SERVICE'; end if;
    insert into public.intake_form_services(salon_id,form_id,service_id)
    select p_salon_id,v_id,id from unnest(p_service_ids) id;
  end if;
  return v_id;
end $$;
revoke all on function public.save_intake_form(uuid,uuid,text,text,boolean,text,jsonb,uuid[]) from public,anon;
grant execute on function public.save_intake_form(uuid,uuid,text,text,boolean,text,jsonb,uuid[]) to authenticated,service_role;

create or replace function public.submit_intake_form(
  p_token_hash text,
  p_customer_name text,
  p_answers jsonb,
  p_consent_accepted boolean
) returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_link public.appointment_intake_links%rowtype;
  v_appointment public.appointments%rowtype;
  v_statement text;
  v_submission_id uuid;
begin
  select * into v_link from public.appointment_intake_links
  where token_hash=p_token_hash for update;
  if not found or v_link.completed_at is not null or v_link.expires_at<=now() then raise exception 'FORM_LINK_INVALID'; end if;
  select * into v_appointment from public.appointments where id=v_link.appointment_id and salon_id=v_link.salon_id;
  if not found then raise exception 'APPOINTMENT_NOT_FOUND'; end if;
  if jsonb_typeof(p_answers)<>'object' then raise exception 'INVALID_ANSWERS'; end if;
  v_statement:=nullif(trim(v_link.form_snapshot->>'consentStatement'),'');
  if v_statement is not null and not p_consent_accepted then raise exception 'CONSENT_REQUIRED'; end if;

  insert into public.intake_submissions(salon_id,appointment_id,customer_id,form_id,form_version,answers)
  values(v_link.salon_id,v_link.appointment_id,v_appointment.customer_id,v_link.form_id,v_link.form_version,p_answers)
  returning id into v_submission_id;

  if v_statement is not null then
    if nullif(trim(p_customer_name),'') is null then raise exception 'CUSTOMER_NAME_REQUIRED'; end if;
    insert into public.appointment_consents(salon_id,appointment_id,customer_id,form_id,statement,statement_version,customer_name)
    values(v_link.salon_id,v_link.appointment_id,v_appointment.customer_id,v_link.form_id,v_statement,v_link.form_version,trim(p_customer_name));
  end if;

  update public.appointment_intake_links set completed_at=now() where id=v_link.id;
  return v_submission_id;
end $$;
revoke all on function public.submit_intake_form(text,text,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.submit_intake_form(text,text,jsonb,boolean) to service_role;
