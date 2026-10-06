import { groupSchema,validateWorkspace,MAX_BACKUP_BYTES } from './schema';
import { uid,type Group } from './types';
import { amountInput } from './money';
export const MAX_LINK=16000;
export function encodeSnapshot(group:Group):string {
 const safe=structuredClone(group);safe.expenses=safe.expenses.filter(e=>!e.deletedAt).map(e=>({...e,receipt:null}));safe.payments=safe.payments.filter(p=>!p.deletedAt);safe.activities=[];
 const bytes=new TextEncoder().encode(JSON.stringify({format:'shared-money-copy-v1',group:safe}));
 let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
 const payload=btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
 if(payload.length>MAX_LINK)throw new Error('Deze groep is te groot voor een link. Deel een reservekopie als bestand via Instellingen.');
 return payload;
}
export function decodeSnapshot(payload:string):Group {
 if(payload.length>MAX_LINK||!/^[A-Za-z0-9_-]+$/.test(payload))throw new Error('Deze groepskopie is ongeldig. Vraag om een nieuwe link.');
 try{const text=atob(payload.replaceAll('-','+').replaceAll('_','/'));const parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(text,c=>c.charCodeAt(0))));if(parsed.format!=='shared-money-copy-v1')throw new Error();const group=groupSchema.parse(parsed.group);return {...group,expenses:group.expenses.map(e=>({...e,receipt:null})),activities:[]};}catch{throw new Error('Deze groepskopie is ongeldig of onvolledig. Vraag om een nieuwe link.');}
}
export function independentCopy(group:Group,selfMemberId:string,newName?:string):Group {
 const copy=structuredClone(group),map=new Map(copy.members.map(m=>[m.id,uid()]));
 copy.id=uid();copy.sample=false;copy.createdAt=new Date().toISOString();copy.archivedAt=null;copy.activities=[];
 copy.members=copy.members.map(m=>({...m,id:map.get(m.id)!}));
 copy.expenses=copy.expenses.map(e=>({...e,id:uid(),paidBy:map.get(e.paidBy)!,splits:e.splits.map(s=>({...s,memberId:map.get(s.memberId)!}))}));
 copy.payments=copy.payments.map(p=>({...p,id:uid(),from:map.get(p.from)!,to:map.get(p.to)!}));
 if(newName){const m={id:uid(),name:newName.trim()};copy.members.push(m);copy.selfMemberId=m.id;}else copy.selfMemberId=map.get(selfMemberId)!;
 return groupSchema.parse(copy);
}
export function parseBackup(text:string){if(new TextEncoder().encode(text).byteLength>MAX_BACKUP_BYTES)throw new Error('Dit bestand is te groot (maximaal 32 MB).');try{return validateWorkspace(JSON.parse(text));}catch{throw new Error('Dit is geen geldige Shared Money-reservekopie. Je bestaande gegevens zijn behouden.');}}
function cell(value:string):string {const safe=/^[=+@\-\t\r]/.test(value)?`'${value}`:value;return `"${safe.replaceAll('"','""')}"`;}
export function exportCsv(group:Group):string {
 const rows=[['Datum','Omschrijving','Bedrag','Valuta','Betaald door','Verdeling','Notities']];
 for(const e of group.expenses.filter(e=>!e.deletedAt))rows.push([e.date,e.title,amountInput(e.amount),group.currency,group.members.find(m=>m.id===e.paidBy)!.name,e.splits.map(s=>`${group.members.find(m=>m.id===s.memberId)!.name}: ${amountInput(s.amount)}`).join(' | '),e.notes]);
 return '\uFEFF'+rows.map(r=>r.map(cell).join(';')).join('\r\n');
}
export function downloadFile(name:string,content:string,type='application/json') {const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
