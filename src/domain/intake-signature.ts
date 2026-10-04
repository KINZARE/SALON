export function normalizeIntakeSignature(input:string){
  const value=input.trim();
  if(!value)throw new Error("SIGNATURE_REQUIRED");
  if(value.length>160)throw new Error("INVALID_SIGNATURE");
  return value;
}

export function buildIntakePublicPath(token:string){
  const value=token.trim();
  if(value.length<40||!/^[A-Za-z0-9_-]+$/.test(value))throw new Error("INVALID_INTAKE_TOKEN");
  return `/intake/${value}`;
}
