'use client';
import { useState } from 'react';
import { Check,ArrowUpRight,Copy,Share2 } from 'lucide-react';
import { newGroup } from '@/lib/domain';
import { CURRENCIES,groupTypeNames,uid,type Group,type GroupType,type Currency } from '@/lib/types';
import { encodeSnapshot,independentCopy } from '@/lib/sharing';
import { Dialog,FormError,errorMessage,type Commit } from './ui';
export function CreateGroup({profileName,commit,onClose,onCreated}:{profileName:string;commit:Commit;onClose:()=>void;onCreated:(id:string)=>void}){
 const [name,setName]=useState(''),[self,setSelf]=useState(profileName),[others,setOthers]=useState(''),[type,setType]=useState<GroupType>('trip'),[currency,setCurrency]=useState<Currency>('EUR'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setError('');setBusy(true);try{const names=others.split(',').map(s=>s.trim()).filter(Boolean);if(names.some(n=>n.length>60)||names.length>99)throw new Error('Gebruik maximaal 99 andere deelnemers en namen tot 60 tekens.');const g=newGroup(name,type,currency,self,names);await commit({type:'create-group',group:g},'Groep aangemaakt');onCreated(g.id);onClose();}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}
 return <Dialog title="Een nieuwe groep" onClose={onClose}><form onSubmit={submit} className="form">
  <p className="muted">Voor de grote reis. Of gewoon de boodschappen.</p>
  <label>Jouw naam<input required autoFocus value={self} maxLength={60} onChange={e=>setSelf(e.target.value)} autoComplete="given-name" placeholder="Hoe heet je?"/></label>
  <fieldset><legend>Wat gaan jullie samen doen?</legend><div className="type-options">{Object.entries(groupTypeNames).map(([key,label])=><button type="button" key={key} className={type===key?'chip selected':'chip'} aria-pressed={type===key} onClick={()=>setType(key as GroupType)}>{label}</button>)}</div></fieldset>
  <label>Groepsnaam<input required value={name} maxLength={120} onChange={e=>setName(e.target.value)} placeholder={type==='trip'?'Bijvoorbeeld: Weekend in Lissabon':'Bijvoorbeeld: Ons huis'}/></label>
  <div className="two-fields"><label>Valuta<select value={currency} onChange={e=>setCurrency(e.target.value as Currency)}>{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select></label><span className="field-note">Alle uitgaven in deze groep gebruiken dezelfde valuta.</span></div>
  <label>Andere deelnemers <span className="optional">optioneel</span><input value={others} onChange={e=>setOthers(e.target.value)} placeholder="Lisa, Tim, Bram" maxLength={3000}/><span className="field-note">Scheid namen met een komma. Later toevoegen kan ook.</span></label>
  <FormError message={error}/><button className="button primary full" disabled={busy}>{busy?'Groep aanmaken…':'Groep aanmaken'}<ArrowUpRight size={18}/></button>
  <p className="fine-print">Geen account nodig. Je groep wordt op dit apparaat bewaard.</p>
 </form></Dialog>;
}
export function ShareGroup({group,onClose}:{group:Group;onClose:()=>void}){
 const [copied,setCopied]=useState(false),[error,setError]=useState('');
 let link='';let linkError='';try{link=`${window.location.origin}/#copy=${encodeSnapshot(group)}`;}catch(e){linkError=errorMessage(e);}
 async function copy(){try{await navigator.clipboard.writeText(link);setCopied(true);}catch{setError('Kopiëren is niet gelukt. Selecteer de link en kopieer hem handmatig.');}}
 async function share(){try{if(navigator.share)await navigator.share({title:`${group.name} · Shared Money`,text:'Een onafhankelijke kopie van onze uitgaven. Wijzigingen synchroniseren nog niet.',url:link});else await copy();}catch(e){if(!(e instanceof DOMException&&e.name==='AbortError'))setError('Delen is niet gelukt. Kopieer de link hieronder.');}}
 return <Dialog title="Deel een groepskopie" onClose={onClose}><div className="form"><p>Stuur een kopie van <strong>{group.name}</strong> naar iemand anders.</p><div className="notice"><strong>Een momentopname, zonder live synchronisatie</strong><p>De ontvanger bewaart een eigen kopie. Latere wijzigingen blijven op ieder apparaat apart. Bonfoto’s worden niet meegedeeld.</p></div>{link?<><label>Link naar groepskopie<textarea readOnly value={link} rows={2} onFocus={e=>e.target.select()} className="share-link"/></label><div className="button-row"><button className="button primary" onClick={copy}>{copied?<Check size={18}/>:<Copy size={18}/>} {copied?'Gekopieerd':'Kopieer link'}</button><button className="button secondary" onClick={share}><Share2 size={18}/> Delen</button></div><p className="fine-print">Iedereen met deze link kan de namen en uitgaven in de kopie lezen.</p></>:null}<FormError message={error||linkError}/></div></Dialog>;
}
export function ImportCopy({group,profileName,commit,onClose,onCreated}:{group:Group;profileName:string;commit:Commit;onClose:()=>void;onCreated:(id:string)=>void}){
 const [self,setSelf]=useState('new'),[name,setName]=useState(profileName),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{if(self==='new'&&!name.trim())throw new Error('Vul je naam in.');const copy=independentCopy(group,self,self==='new'?name:undefined);await commit({type:'import-groups',groups:[copy]},'Groepskopie bewaard');onCreated(copy.id);onClose();}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}
 return <Dialog title={group.name} onClose={onClose}><form className="form" onSubmit={submit}><p>{group.members.length} deelnemers · {group.expenses.filter(e=>!e.deletedAt).length} uitgaven · {group.currency}</p><div className="notice"><strong>Je opent een onafhankelijke kopie</strong><p>Nieuwe uitgaven en wijzigingen synchroniseren nog niet met de afzender.</p></div><label>Wie ben jij?<select value={self} onChange={e=>setSelf(e.target.value)}><option value="new">Ik sta nog niet in deze groep</option>{group.members.map(m=><option value={m.id} key={m.id}>{m.name}</option>)}</select></label>{self==='new'?<label>Jouw naam<input required value={name} maxLength={60} autoFocus onChange={e=>setName(e.target.value)}/></label>:null}<FormError message={error}/><button className="button primary full" disabled={busy}>{busy?'Bewaren…':'Kopie op mijn apparaat bewaren'}</button></form></Dialog>;
}
export function newMember(name:string){return {id:uid(),name:name.trim()};}
