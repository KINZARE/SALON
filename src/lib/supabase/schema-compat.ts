type SchemaError={code?:string|null;message?:string|null;details?:string|null;hint?:string|null};

const missingSchemaCodes=new Set(["42703","42P01","PGRST202","PGRST204","PGRST205"]);

export function isMissingSchemaFeatureError(error:SchemaError|null|undefined,featureNames:string[]){
  if(!error||!missingSchemaCodes.has(error.code??""))return false;
  const haystack=[error.message,error.details,error.hint].filter(Boolean).join(" ").toLowerCase();
  return featureNames.some(name=>haystack.includes(name.toLowerCase()));
}
