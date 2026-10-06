import { z } from 'zod';
import { CURRENCIES } from './types';
import { MAX_AMOUNT, splitAmount } from './money';
export const MAX_BACKUP_BYTES=32_000_000;
const id=z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
const name=z.string().trim().min(1).max(60);
const amount=z.number().int().min(1).max(MAX_AMOUNT);
const nonnegative=z.number().int().min(0).max(MAX_AMOUNT);
const timestamp=z.string().datetime();
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>{const d=new Date(`${s}T12:00:00Z`);return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;},'Ongeldige datum');
const memberSchema=z.object({id,name}).strict();
const splitSchema=z.object({memberId:id,weight:nonnegative,amount:nonnegative}).strict();
export const expenseSchema=z.object({id,title:z.string().trim().min(1).max(160),amount,paidBy:id,date,category:z.enum(['food','transport','stay','groceries','fun','other']),splitMode:z.enum(['equal','shares','exact','percentage']),splits:z.array(splitSchema).min(1).max(100),notes:z.string().max(1000),receipt:z.string().max(2_800_000).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/).nullable(),createdAt:timestamp,updatedAt:timestamp,deletedAt:timestamp.nullable()}).strict();
export const paymentSchema=z.object({id,from:id,to:id,amount,date,deletedAt:timestamp.nullable()}).strict();
const activitySchema=z.object({id,at:timestamp,actor:z.string().min(1).max(60),action:z.string().max(80),title:z.string().max(200),before:z.string().max(16000).nullable(),after:z.string().max(16000).nullable(),entityId:id}).strict();
export const groupSchema=z.object({id,name:z.string().trim().min(1).max(120),type:z.enum(['trip','home','couple','dinner','other']),currency:z.enum(CURRENCIES),members:z.array(memberSchema).min(1).max(100),selfMemberId:id,expenses:z.array(expenseSchema).max(5000),payments:z.array(paymentSchema).max(5000),activities:z.array(activitySchema).max(20000),createdAt:timestamp,archivedAt:timestamp.nullable(),sample:z.boolean()}).strict().superRefine((g,ctx)=>{
 const fail=(message:string)=>ctx.addIssue({code:'custom',message});
 const members=new Set(g.members.map(m=>m.id));
 if(members.size!==g.members.length||!members.has(g.selfMemberId))fail('Ongeldige deelnemers.');
 if(new Set(g.expenses.map(e=>e.id)).size!==g.expenses.length||new Set(g.payments.map(p=>p.id)).size!==g.payments.length)fail('Dubbele transactie.');
 for(const e of g.expenses){
  if(!members.has(e.paidBy)||e.splits.some(s=>!members.has(s.memberId))||new Set(e.splits.map(s=>s.memberId)).size!==e.splits.length)fail('Onbekende deelnemer bij uitgave.');
  try{const allocated=splitAmount(e.amount,e.splitMode,e.splits.map(s=>s.weight));if(allocated.some((a,i)=>a!==e.splits[i].amount))fail('De verdeling klopt niet.');}catch{fail('De verdeling klopt niet.');}
 }
 for(const p of g.payments)if(!members.has(p.from)||!members.has(p.to)||p.from===p.to)fail('Ongeldige verrekening.');
});
export const workspaceSchema=z.object({version:z.literal(1),profileName:z.string().trim().max(60),groups:z.array(groupSchema).max(100)}).strict().superRefine((w,ctx)=>{if(new TextEncoder().encode(JSON.stringify(w)).byteLength>MAX_BACKUP_BYTES)ctx.addIssue({code:'custom',message:'Je gegevens zijn groter dan 32 MB. Gebruik kleinere bonfoto’s of bewaar een kopie op een ander apparaat.'});if(new Set(w.groups.map(g=>g.id)).size!==w.groups.length)ctx.addIssue({code:'custom',message:'Dubbele groepen.'});});
export function validateWorkspace(input:unknown){const result=workspaceSchema.safeParse(input);if(!result.success)throw new Error(result.error.issues.some(i=>i.message.includes('32 MB'))?'Je gegevens zijn groter dan 32 MB. Gebruik kleinere bonfoto’s; je vorige gegevens zijn behouden.':'De gegevens zijn ongeldig of horen bij een andere versie. Je bestaande gegevens zijn behouden.');return result.data;}
