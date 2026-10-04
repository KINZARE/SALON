"use client";

import { useState } from "react";
import { isIntakeFieldVisible, type IntakeCondition } from "@/domain/intake-form";

type PublicField={
  id:string;
  label:string;
  type:"short_text"|"long_text"|"yes_no"|"select"|"checkbox"|"date"|"consent";
  required:boolean;
  options:string[];
  sortOrder:number;
  condition?:IntakeCondition;
};

export function ConditionalIntakeFields({fields}:{fields:PublicField[]}){
  const [answers,setAnswers]=useState<Record<string,unknown>>({});
  const update=(id:string,value:unknown)=>setAnswers(current=>({...current,[id]:value}));
  return <>{fields.toSorted((a,b)=>a.sortOrder-b.sortOrder).map(field=>{
    if(!isIntakeFieldVisible(field,fields,answers))return null;
    return <FieldControl key={field.id} field={field} onAnswer={value=>update(field.id,value)}/>;
  })}</>;
}

function FieldControl({field,onAnswer}:{field:PublicField;onAnswer:(value:unknown)=>void}){
  const name=`field:${field.id}`;
  const common="h-11 rounded-[10px] border border-[var(--border)] bg-white px-3.5 outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]";
  if(field.type==="long_text")return <label className="grid gap-1.5 text-sm font-medium"><span>{field.label}</span><textarea name={name} required={field.required} rows={4} maxLength={4000} onChange={event=>onAnswer(event.target.value)} className="rounded-[10px] border border-[var(--border)] bg-white px-3.5 py-3 outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]"/></label>;
  if(field.type==="yes_no")return <label className="grid gap-1.5 text-sm font-medium"><span>{field.label}</span><select name={name} required={field.required} onChange={event=>onAnswer(event.target.value)} className={common}><option value="">Kies</option><option value="yes">Ja</option><option value="no">Nee</option></select></label>;
  if(field.type==="select")return <label className="grid gap-1.5 text-sm font-medium"><span>{field.label}</span><select name={name} required={field.required} onChange={event=>onAnswer(event.target.value)} className={common}><option value="">Kies</option>{field.options.map(option=><option key={option} value={option}>{option}</option>)}</select></label>;
  if(field.type==="checkbox"||field.type==="consent")return <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name={name} required={field.required} onChange={event=>onAnswer(event.target.checked)}/><span>{field.label}</span></label>;
  return <label className="grid gap-1.5 text-sm font-medium"><span>{field.label}</span><input name={name} type={field.type==="date"?"date":"text"} required={field.required} maxLength={field.type==="short_text"?500:undefined} onChange={event=>onAnswer(event.target.value)} className={common}/></label>;
}
