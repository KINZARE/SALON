"use client";

import { useMemo,useState } from "react";
import { Button } from "@/components/ui/button";
import { Field,TextAreaField } from "@/components/ui/field";
import type { IntakeFieldType } from "@/domain/intake-form";

type Service={id:string;name:string;active:boolean};
type ExistingField={id:string;label:string;field_type:string;required:boolean;options:unknown;sort_order:number};
type ExistingForm={
  id:string;
  title:string;
  description:string|null;
  active:boolean;
  consent_statement:string|null;
  fields:ExistingField[];
  service_ids:string[];
};
type DraftField={key:string;label:string;type:IntakeFieldType;required:boolean;options:string};

const types:Array<[IntakeFieldType,string]>=[
  ["short_text","Korte tekst"],
  ["long_text","Lange tekst"],
  ["yes_no","Ja / nee"],
  ["select","Keuze"],
  ["checkbox","Checkbox"],
  ["date","Datum"],
  ["consent","Toestemming"],
];

function makeKey(){return Math.random().toString(36).slice(2)}

export function IntakeFormEditor({item,services,action}:{item?:ExistingForm;services:Service[];action:(formData:FormData)=>void|Promise<void>}){
  const initial=useMemo<DraftField[]>(()=>item?.fields.toSorted((a,b)=>a.sort_order-b.sort_order).map(field=>({
    key:field.id,
    label:field.label,
    type:field.field_type as IntakeFieldType,
    required:field.required,
    options:Array.isArray(field.options)?field.options.filter((value):value is string=>typeof value==="string").join(", "):"",
  }))??[{key:makeKey(),label:"",type:"short_text",required:false,options:""}],[item]);
  const [fields,setFields]=useState(initial);

  function patch(index:number,partial:Partial<DraftField>){setFields(current=>current.map((field,i)=>i===index?{...field,...partial}:field))}
  function move(index:number,delta:number){
    setFields(current=>{
      const target=index+delta;if(target<0||target>=current.length)return current;
      const copy=[...current];[copy[index],copy[target]]=[copy[target],copy[index]];return copy;
    });
  }
  const serialized=JSON.stringify(fields.map(field=>({
    label:field.label,
    type:field.type,
    required:field.required,
    options:field.type==="select"?field.options.split(",").map(value=>value.trim()).filter(Boolean):[],
  })));

  return <form action={action} className="grid gap-6">
    {item?<input type="hidden" name="formId" value={item.id}/>:null}
    <input type="hidden" name="fieldsJson" value={serialized}/>

    <section className="grid gap-4 rounded-[22px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div><h3 className="font-semibold">{item?"Intakeformulier bewerken":"Nieuw intakeformulier"}</h3><p className="mt-1 text-xs text-[var(--muted)]">Vraag alleen wat de salon vóór de afspraak echt nodig heeft.</p></div>
      <Field label="Titel" name="title" required maxLength={120} defaultValue={item?.title??""}/>
      <TextAreaField label="Uitleg voor klant" name="description" maxLength={600} rows={3} defaultValue={item?.description??""}/>
      <TextAreaField label="Toestemmingstekst (optioneel)" name="consentStatement" maxLength={800} rows={3} defaultValue={item?.consent_statement??""} hint="Wordt apart met tijdstip en versie opgeslagen wanneer de klant akkoord geeft."/>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={item?.active??true}/> Actief</label>
    </section>

    <section className="rounded-[22px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4"><div><h3 className="font-semibold">Velden</h3><p className="mt-1 text-xs text-[var(--muted)]">Volgorde en verplichting zijn direct onderdeel van de formulierversie.</p></div><button type="button" onClick={()=>setFields(current=>[...current,{key:makeKey(),label:"",type:"short_text",required:false,options:""}])} className="h-10 rounded-[11px] border border-[var(--border)] bg-white px-3 text-xs font-semibold">+ Veld</button></div>
      <div className="mt-4 grid gap-3">{fields.map((field,index)=><div key={field.key} className="grid gap-2 rounded-[14px] bg-[var(--background)] p-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_170px_auto]">
          <input aria-label={`Label veld ${index+1}`} value={field.label} onChange={event=>patch(index,{label:event.target.value})} placeholder="Vraag of label" maxLength={180} className="h-11 min-w-0 rounded-[11px] border border-[var(--border)] bg-white px-3 text-sm"/>
          <select aria-label={`Type veld ${index+1}`} value={field.type} onChange={event=>patch(index,{type:event.target.value as IntakeFieldType})} className="h-11 rounded-[11px] border border-[var(--border)] bg-white px-3 text-sm">{types.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
          <label className="flex min-h-11 items-center gap-2 px-1 text-xs"><input type="checkbox" checked={field.required} onChange={event=>patch(index,{required:event.target.checked})}/> Verplicht</label>
        </div>
        {field.type==="select"?<input aria-label={`Opties veld ${index+1}`} value={field.options} onChange={event=>patch(index,{options:event.target.value})} placeholder="Opties gescheiden door komma's" className="h-10 rounded-[11px] border border-[var(--border)] bg-white px-3 text-xs"/>:null}
        <div className="flex gap-2">
          <button type="button" onClick={()=>move(index,-1)} disabled={index===0} className="h-9 rounded-[10px] border border-[var(--border)] bg-white px-3 text-xs disabled:opacity-40">Omhoog</button>
          <button type="button" onClick={()=>move(index,1)} disabled={index===fields.length-1} className="h-9 rounded-[10px] border border-[var(--border)] bg-white px-3 text-xs disabled:opacity-40">Omlaag</button>
          <button type="button" onClick={()=>setFields(current=>current.filter((_,i)=>i!==index))} disabled={fields.length===1} className="ml-auto h-9 rounded-[10px] border border-[var(--border)] bg-white px-3 text-xs text-[var(--danger)] disabled:opacity-40">Verwijder</button>
        </div>
      </div>)}</div>
    </section>

    <section className="rounded-[22px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div><h3 className="font-semibold">Behandelingen</h3><p className="mt-1 text-xs text-[var(--muted)]">Het formulier wordt alleen aangeboden bij gekoppelde behandelingen.</p></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">{services.filter(service=>service.active||item?.service_ids.includes(service.id)).map(service=><label key={service.id} className="flex min-h-11 items-center gap-3 rounded-[13px] border border-[var(--border)] bg-[var(--background)] px-3 text-sm"><input type="checkbox" name="serviceIds" value={service.id} defaultChecked={item?.service_ids.includes(service.id)??false}/><span>{service.name}</span></label>)}</div>
    </section>

    <div><Button size="lg" variant={item?"secondary":"primary"}>{item?"Formulier opslaan":"Formulier toevoegen"}</Button></div>
  </form>;
}
