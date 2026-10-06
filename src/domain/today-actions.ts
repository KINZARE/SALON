import {z} from 'zod';
import {UuidSchema,InstantSchema} from '../lib/schemas.ts';
export type DailyState={status:string;treatment_started_at:string|null};
export function getDailyPrimaryAction(appointment:DailyState):{label:string;action:'check_in'|'start'|'finish'}|null{
 switch(appointment.status){
  case 'pending':case 'confirmed':return {label:'Inchecken',action:'check_in'};
  case 'checked_in':return appointment.treatment_started_at?{label:'Afronden',action:'finish'}:{label:'Start behandeling',action:'start'};
  default:return null;
 }
}
export function selectCurrentNext<T extends {status:string;starts_at:string;service_ends_at?:string;treatment_started_at:string|null}>(appointments:T[],now:Date):{current:T|null;next:T|null}{
 const active=appointments.filter(a=>['pending','confirmed','checked_in'].includes(a.status)).toSorted((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at));
 const current=active.find(a=>a.status==='checked_in'&&a.treatment_started_at)??active.find(a=>a.status==='checked_in')??active.find(a=>Date.parse(a.starts_at)<=now.getTime()&&a.service_ends_at&&Date.parse(a.service_ends_at)>now.getTime())??null;
 const next=active.find(a=>a!==current&&Date.parse(a.starts_at)<=now.getTime())??active.find(a=>a!==current)??null;
 return {current,next};
}
const dailyMutationSchema=z.object({appointmentId:UuidSchema,action:z.enum(['check_in','start','finish','cancel','no_show','note']),expectedStatus:z.enum(['pending','confirmed','checked_in','completed','cancelled','no_show']),expectedStartedAt:InstantSchema.nullable(),note:z.string().max(1000).optional(),expectedNote:z.string().max(1000).nullable().optional()}).refine(v=>v.action!=='note'||(typeof v.note==='string'&&v.expectedNote!==undefined));
export function validateDailyMutation(input:unknown){const parsed=dailyMutationSchema.safeParse(input);return parsed.success?parsed.data:null}
