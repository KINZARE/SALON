'use client';
import { useEffect,useRef,useId,type ReactNode } from 'react';
import { X,Utensils,Car,BedDouble,ShoppingBasket,Tickets,Receipt,Plane,House,Heart,Users } from 'lucide-react';
import type { Category,GroupType,Action } from '@/lib/types';
export type Commit=(action:Action,message?:string,undo?:Action)=>Promise<void>;
export function Icon({category,...props}:{category:Category;size?:number;className?:string}){const Component={food:Utensils,transport:Car,stay:BedDouble,groceries:ShoppingBasket,fun:Tickets,other:Receipt}[category];return <Component size={20} strokeWidth={1.7} aria-hidden {...props}/>;}
export function GroupIcon({type}:{type:GroupType}){const Component={trip:Plane,home:House,couple:Heart,dinner:Utensils,other:Users}[type];return <Component size={24} strokeWidth={1.6} aria-hidden/>;}
export function Avatar({name,index=0,small=false}:{name:string;index?:number;small?:boolean}){const letters=name.split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase();return <span className={`avatar avatar-${index%5} ${small?'small':''}`} aria-hidden>{letters}</span>;}
export function Dialog({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}){
 const ref=useRef<HTMLDialogElement>(null),titleId=useId();
 useEffect(()=>{const el=ref.current;el?.showModal();return()=>el?.close();},[]);
 return <dialog ref={ref} className={`dialog ${wide?'wide':''}`} aria-labelledby={titleId} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===ref.current){const r=ref.current.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose();}}}>
  <div className="dialog-head"><h2 id={titleId}>{title}</h2><button className="icon-button" aria-label="Sluiten" onClick={onClose}><X size={20}/></button></div><div className="dialog-content">{children}</div>
 </dialog>;
}
export function FormError({message}:{message:string}){return message?<div className="form-error" role="alert">{message}</div>:null;}
export function Loading(){return <div className="loading-state" role="status"><span className="loading-dot"/> Je groepen openen…</div>;}
export function dateLabel(date:string){return new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short'}).format(new Date(`${date}T12:00:00`));}
export function errorMessage(error:unknown){return error instanceof Error?error.message:'Dit is niet gelukt. Probeer opnieuw.';}
