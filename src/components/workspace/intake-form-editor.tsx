"use client";

import { useTransition } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IntakeEditorSchema, serializeIntakeFields, type IntakeEditorValues } from "@/domain/intake-editor";
import { Button } from "@/components/ui/button";
import { Field,TextAreaField } from "@/components/ui/field";
import type { IntakeFieldType } from "@/domain/intake-form";

type Service={id:string;name:string;active:boolean};
type ExistingField={id:string;label:string;field_type:string;required:boolean;options:unknown;sort_order:number};
type ExistingForm={id:string;title:string;description:string|null;active:boolean;consent_statement:string|null;fields:ExistingField[];service_ids:string[]};

const types:Array<[IntakeFieldType,string]>=[["short_text","Korte tekst"],["long_text","Lange tekst"],["yes_no","Ja / nee"],["select","Keuze"],["checkbox","Checkbox"],["date","Datum"],["consent","Toestemming"]];

export function IntakeFormEditor({item,services,action}:{item?:ExistingForm;services:Service[];action:(formData:FormData)=>void|Promise<void>}){
  const {control,register,handleSubmit,formState:{errors}}=useForm<IntakeEditorValues>({
    resolver:zodResolver(IntakeEditorSchema),
    defaultValues:{title:item?.title??"",fields:item?.fields.toSorted((a,b)=>a.sort_order-b.sort_order).map(field=>({label:field.label,type:field.field_type as IntakeFieldType,required:field.required,options:Array.isArray(field.options)?field.options.filter((value):value is string=>typeof value==="string").join(", "):""}))??[{label:"",type:"short_text",required:false,options:""}]},
  });
  const {fields,append,move,remove}=useFieldArray({control,name:"fields"});
  const values=useWatch({control,name:"fields"});
  const [pending,startTransition]=useTransition();
  const submit=handleSubmit((data,event)=>{
    const payload=new FormData(event?.target as HTMLFormElement);
    payload.set("title",data.title);
    payload.set("fieldsJson",serializeIntakeFields(data.fields));
    startTransition(async()=>{await action(payload)});
  });
  const serialized=serializeIntakeFields(values);
  const controlClass="h-11 min-w-0 rounded-[10px] border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]";

  return <form action={action} onSubmit={submit} className="grid min-w-0 max-w-full gap-6">
    {item?<input type="hidden" name="formId" value={item.id}/>:null}<input type="hidden" name="fieldsJson" value={serialized}/>
    <section className="grid min-w-0 max-w-full gap-4 rounded-[16px] border border-[var(--border)] bg-white p-4 sm:p-5"><div><h3 className="font-semibold">{item?"Intakeformulier bewerken":"Nieuw intakeformulier"}</h3><p className="mt-1 text-xs text-[var(--muted)]">Vraag alleen wat de salon vóór de afspraak echt nodig heeft.</p></div><Field label="Titel" {...register("title")} required maxLength={120}/><TextAreaField label="Uitleg voor klant" name="description" maxLength={600} rows={3} defaultValue={item?.description??""}/><TextAreaField label="Toestemmingstekst (optioneel)" name="consentStatement" maxLength={800} rows={3} defaultValue={item?.consent_statement??""} hint="Wordt apart met tijdstip en versie opgeslagen wanneer de klant akkoord geeft."/><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={item?.active??true}/> Actief</label></section>

    <section className="min-w-0 max-w-full rounded-[16px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h3 className="font-semibold">Velden</h3><p className="mt-1 text-xs text-[var(--muted)]">Volgorde en verplichting zijn direct onderdeel van de formulierversie.</p></div><button type="button" onClick={()=>append({label:"",type:"short_text",required:false,options:""})} disabled={fields.length>=40||pending} className="h-10 self-start rounded-[10px] border border-[var(--border)] bg-white px-3 text-xs font-semibold hover:bg-[var(--surface-soft)]">+ Veld</button></div>
      <div className="mt-4 grid min-w-0 gap-3">{fields.map((field,index)=><div key={field.id} className="grid min-w-0 gap-2 rounded-[10px] bg-[var(--surface-soft)] p-3">
        <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_170px_auto]"><input aria-label={`Label veld ${index+1}`} {...register(`fields.${index}.label`)} aria-invalid={Boolean(errors.fields?.[index]?.label)} placeholder="Vraag of label" maxLength={180} className={controlClass}/><select aria-label={`Type veld ${index+1}`} {...register(`fields.${index}.type`)} className={controlClass}>{types.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><label className="flex min-h-11 items-center gap-2 px-1 text-xs"><input type="checkbox" {...register(`fields.${index}.required`)}/> Verplicht</label></div>
        {values[index]?.type==="select"?<input aria-label={`Opties veld ${index+1}`} {...register(`fields.${index}.options`)} aria-invalid={Boolean(errors.fields?.[index]?.options)} placeholder="Opties gescheiden door komma's" className="h-10 w-full min-w-0 rounded-[10px] border border-[var(--border)] bg-white px-3 text-xs outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]"/>:null}
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex"><button type="button" onClick={()=>move(index,index-1)} disabled={index===0} className="h-9 rounded-[10px] border border-[var(--border)] bg-white px-3 text-xs disabled:opacity-40">Omhoog</button><button type="button" onClick={()=>move(index,index+1)} disabled={index===fields.length-1} className="h-9 rounded-[10px] border border-[var(--border)] bg-white px-3 text-xs disabled:opacity-40">Omlaag</button><button type="button" onClick={()=>remove(index)} disabled={fields.length===1} className="col-span-2 h-9 rounded-[10px] border border-[var(--border)] bg-white px-3 text-xs text-[var(--danger)] disabled:opacity-40 sm:ml-auto">Verwijder</button></div>
      </div>)}</div>
    </section>

    <section className="min-w-0 max-w-full rounded-[16px] border border-[var(--border)] bg-white p-4 sm:p-5"><div><h3 className="font-semibold">Behandelingen</h3><p className="mt-1 text-xs text-[var(--muted)]">Het formulier wordt alleen aangeboden bij gekoppelde behandelingen.</p></div><div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">{services.filter(service=>service.active||item?.service_ids.includes(service.id)).map(service=><label key={service.id} className="flex min-h-11 min-w-0 items-center gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-sm"><input type="checkbox" name="serviceIds" value={service.id} defaultChecked={item?.service_ids.includes(service.id)??false}/><span className="min-w-0 break-words">{service.name}</span></label>)}</div></section>
    {Object.keys(errors).length?<p role="alert" className="text-sm text-[var(--danger)]">Controleer de titel en labels. Keuzevelden hebben minstens één optie nodig; maximaal 40 velden.</p>:null}
    <div><Button size="lg" disabled={pending} variant={item?"secondary":"primary"}>{pending?"Opslaan…":item?"Formulier opslaan":"Formulier toevoegen"}</Button></div>
  </form>;
}
