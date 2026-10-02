export const INTAKE_FIELD_TYPES=["short_text","long_text","yes_no","select","checkbox","date","consent"] as const;
export type IntakeFieldType=typeof INTAKE_FIELD_TYPES[number];
export type IntakeFieldInput={label:string;type:IntakeFieldType;required:boolean;options?:string[]};
export type IntakeDefinitionInput={title:string;description?:string;fields:IntakeFieldInput[]};

export function validateIntakeDefinition(input:IntakeDefinitionInput){
  const title=input.title.trim();
  if(!title||title.length>120)throw new Error("INVALID_TITLE");
  if(input.fields.length<1||input.fields.length>40)throw new Error("INVALID_FIELD_COUNT");
  const allowed=new Set<string>(INTAKE_FIELD_TYPES);
  const fields=input.fields.map((field,index)=>{
    const label=field.label.trim();
    if(!label||label.length>180||!allowed.has(field.type))throw new Error("INVALID_FIELD");
    const options=(field.options??[]).map(value=>value.trim()).filter(Boolean).slice(0,30);
    if(field.type==="select"&&options.length<1)throw new Error("SELECT_OPTIONS_REQUIRED");
    return{label,type:field.type,required:Boolean(field.required),options,sortOrder:index};
  });
  return{title,description:(input.description??"").trim().slice(0,600),fields};
}

export function validateIntakeAnswers(fields:Array<{id:string;type:IntakeFieldType;required:boolean;options?:unknown}>,answers:Record<string,unknown>){
  const normalized:Record<string,unknown>={};
  for(const field of fields){
    const value=answers[field.id];
    const empty=value===undefined||value===null||value===""||value===false;
    if(field.required&&empty)throw new Error("REQUIRED_FIELD_MISSING");
    if(empty){normalized[field.id]=value??null;continue}
    if(field.type==="checkbox"||field.type==="consent"){
      if(typeof value!=="boolean")throw new Error("INVALID_ANSWER");
      normalized[field.id]=value;continue;
    }
    if(field.type==="yes_no"){
      if(value!=="yes"&&value!=="no")throw new Error("INVALID_ANSWER");
      normalized[field.id]=value;continue;
    }
    if(field.type==="select"){
      const options=Array.isArray(field.options)?field.options.filter(option=>typeof option==="string"):[];
      if(typeof value!=="string"||!options.includes(value))throw new Error("INVALID_ANSWER");
      normalized[field.id]=value;continue;
    }
    if(field.type==="date"){
      if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error("INVALID_ANSWER");
      normalized[field.id]=value;continue;
    }
    if(typeof value!=="string"||value.length>(field.type==="long_text"?4000:500))throw new Error("INVALID_ANSWER");
    normalized[field.id]=value.trim();
  }
  return normalized;
}
