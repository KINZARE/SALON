alter table public.intake_form_fields
  add column if not exists condition jsonb;

alter table public.intake_form_fields
  drop constraint if exists intake_form_fields_condition_object;
alter table public.intake_form_fields
  add constraint intake_form_fields_condition_object
  check (condition is null or jsonb_typeof(condition)='object');

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
  v_condition jsonb;
  v_source_order integer;
  v_operator text;
  v_source_type text;
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

    v_condition:=v_field->'condition';
    if v_condition is not null and jsonb_typeof(v_condition)<>'null' then
      if jsonb_typeof(v_condition)<>'object' then raise exception 'INVALID_CONDITION'; end if;
      begin
        v_source_order:=(v_condition->>'sourceSortOrder')::integer;
      exception when invalid_text_representation or numeric_value_out_of_range then
        raise exception 'INVALID_CONDITION';
      end;
      v_operator:=coalesce(v_condition->>'operator','');
      if v_source_order<0 or v_source_order>=v_index or v_operator not in ('equals','not_equals','is_checked','is_not_checked') then raise exception 'INVALID_CONDITION'; end if;
      v_source_type:=coalesce(p_fields->v_source_order->>'type','');
      if v_operator in ('equals','not_equals') and nullif(trim(coalesce(v_condition->>'value','')),'') is null then raise exception 'INVALID_CONDITION'; end if;
      if v_operator in ('is_checked','is_not_checked') and v_source_type not in ('checkbox','consent') then raise exception 'INVALID_CONDITION'; end if;
    else
      v_condition:=null;
    end if;

    insert into public.intake_form_fields(salon_id,form_id,label,field_type,required,options,sort_order,condition)
    values(p_salon_id,v_id,v_label,v_type,coalesce((v_field->>'required')::boolean,false),coalesce(v_field->'options','[]'::jsonb),v_index,v_condition);
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
