import { z } from "zod";

export const INTAKE_FIELD_TYPES=["short_text","long_text","yes_no","select","checkbox","date","consent"] as const;
export type IntakeFieldType=typeof INTAKE_FIELD_TYPES[number];
export type IntakeFieldInput={label:string;type:IntakeFieldType;required:boolean;options?:string[]};
export type IntakeDefinitionInput={title:string;description?:string;fields:IntakeFieldInput[]};

export const IntakeFieldSchema=z.object({
  label:z.string().trim().min(1,"INVALID_FIELD").max(180,"INVALID_FIELD"),
  type:z.enum(INTAKE_FIELD_TYPES),required:z.boolean(),
  options:z.array(z.string()).optional().transform(values=>(values??[]).map(value=>value.trim()).filter(Boolean).slice(0,30)),
}).refine(field=>field.type!=="select"||field.options.length>0,{message:"SELECT_OPTIONS_REQUIRED",path:["options"]});
export const IntakeDefinitionSchema=z.object({
  title:z.string().trim().min(1,"INVALID_TITLE").max(120,"INVALID_TITLE"),
  description:z.string().optional().transform(value=>(value??"").trim().slice(0,600)),
  fields:z.array(IntakeFieldSchema).min(1,"INVALID_FIELD_COUNT").max(40,"INVALID_FIELD_COUNT"),
});

export function validateIntakeDefinition(input:IntakeDefinitionInput){
  const parsed=IntakeDefinitionSchema.safeParse(input);
  if(!parsed.success)throw new Error(parsed.error.issues[0]?.message??"INVALID_FIELDS");
  return {...parsed.data,fields:parsed.data.fields.map((field,sortOrder)=>({...field,sortOrder}))};
}

export function validateIntakeAnswers(fields:Array<{id:string;type:IntakeFieldType;required:boolean;options?:unknown}>,answers:Record<string,unknown>){
  const normalized:Record<string,unknown>={};
  for(const field of fields){
    const value=answers[field.id];
    const empty=value===undefined||value===null||value===""||value===false;
    if(field.required&&empty)throw new Error("REQUIRED_FIELD_MISSING");
    if(empty){normalized[field.id]=value??null;continue}
    if(field.type==="checkbox"||field.type==="consent"){
      if(!z.boolean().safeParse(value).success)throw new Error("INVALID_ANSWER");
      normalized[field.id]=value;continue;
    }
    if(field.type==="yes_no"){
      if(!z.enum(["yes","no"]).safeParse(value).success)throw new Error("INVALID_ANSWER");
      normalized[field.id]=value;continue;
    }
    if(field.type==="select"){
      const options=Array.isArray(field.options)?field.options.filter(option=>typeof option==="string"):[];
      if(typeof value!=="string"||!options.includes(value))throw new Error("INVALID_ANSWER");
      normalized[field.id]=value;continue;
    }
    if(field.type==="date"){
      if(!z.iso.date().safeParse(value).success)throw new Error("INVALID_ANSWER");
      normalized[field.id]=value;continue;
    }
    if(!z.string().max(field.type==="long_text"?4000:500).safeParse(value).success)throw new Error("INVALID_ANSWER");
    normalized[field.id]=(value as string).trim();
  }
  return normalized;
}
