import { z } from "zod";
import { INTAKE_FIELD_TYPES, type IntakeFieldType } from "./intake-types.ts";

export { INTAKE_FIELD_TYPES, type IntakeFieldType } from "./intake-types.ts";
export const INTAKE_CONDITION_OPERATORS=["equals","not_equals","is_checked","is_not_checked"] as const;
export type IntakeConditionOperator=typeof INTAKE_CONDITION_OPERATORS[number];
export type IntakeCondition={sourceSortOrder:number;operator:IntakeConditionOperator;value?:string};
export type IntakeFieldInput={label:string;type:IntakeFieldType;required:boolean;options?:string[];condition?:IntakeCondition|null};
export type IntakeDefinitionInput={title:string;description?:string;fields:IntakeFieldInput[]};

type IntakeAnswerField={id:string;type:IntakeFieldType;required:boolean;options?:unknown;sortOrder?:number;condition?:IntakeCondition|null};

const IntakeConditionSchema=z.object({
  sourceSortOrder:z.number().int().min(0),
  operator:z.enum(INTAKE_CONDITION_OPERATORS),
  value:z.string().optional().transform(value=>(value??"").trim().slice(0,500)),
});

export const IntakeFieldSchema=z.object({
  label:z.string().trim().min(1,"INVALID_FIELD").max(180,"INVALID_FIELD"),
  type:z.enum(INTAKE_FIELD_TYPES),required:z.boolean(),
  options:z.array(z.string()).optional().transform(values=>(values??[]).map(value=>value.trim()).filter(Boolean).slice(0,30)),
  condition:IntakeConditionSchema.nullable().optional(),
}).refine(field=>field.type!=="select"||field.options.length>0,{message:"SELECT_OPTIONS_REQUIRED",path:["options"]});
export const IntakeDefinitionSchema=z.object({
  title:z.string().trim().min(1,"INVALID_TITLE").max(120,"INVALID_TITLE"),
  description:z.string().optional().transform(value=>(value??"").trim().slice(0,600)),
  fields:z.array(IntakeFieldSchema).min(1,"INVALID_FIELD_COUNT").max(40,"INVALID_FIELD_COUNT"),
});

export function validateIntakeDefinition(input:IntakeDefinitionInput){
  const parsed=IntakeDefinitionSchema.safeParse(input);
  if(!parsed.success)throw new Error(parsed.error.issues[0]?.message??"INVALID_FIELDS");
  const fields=parsed.data.fields.map((field,sortOrder)=>({...field,condition:field.condition??undefined,sortOrder}));
  for(const field of fields){
    if(!field.condition)continue;
    const source=fields[field.condition.sourceSortOrder];
    if(!source||field.condition.sourceSortOrder>=field.sortOrder)throw new Error("INVALID_CONDITION");
    if((field.condition.operator==="equals"||field.condition.operator==="not_equals")&&!field.condition.value)throw new Error("INVALID_CONDITION");
    if((field.condition.operator==="is_checked"||field.condition.operator==="is_not_checked")&&!(["checkbox","consent"] as IntakeFieldType[]).includes(source.type))throw new Error("INVALID_CONDITION");
  }
  return {...parsed.data,fields};
}

function sourceFieldFor(condition:IntakeCondition,fields:IntakeAnswerField[]){
  return fields.find((field,index)=>(field.sortOrder??index)===condition.sourceSortOrder);
}

function isChecked(value:unknown){return value===true||value==="on"||value==="true";}

export function isIntakeFieldVisible(field:IntakeAnswerField,fields:IntakeAnswerField[],answers:Record<string,unknown>){
  const condition=field.condition;
  if(!condition)return true;
  const source=sourceFieldFor(condition,fields);
  if(!source)return false;
  const value=answers[source.id];
  if(condition.operator==="is_checked")return isChecked(value);
  if(condition.operator==="is_not_checked")return !isChecked(value);
  const expected=condition.value??"";
  const actual=value==null?"":String(value);
  return condition.operator==="equals"?actual===expected:actual!==expected;
}

export function validateIntakeAnswers(fields:IntakeAnswerField[],answers:Record<string,unknown>){
  const normalized:Record<string,unknown>={};
  const ordered=fields.map((field,index)=>({...field,sortOrder:field.sortOrder??index})).toSorted((a,b)=>a.sortOrder-b.sortOrder);
  for(const field of ordered){
    if(!isIntakeFieldVisible(field,ordered,{...answers,...normalized}))continue;
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
