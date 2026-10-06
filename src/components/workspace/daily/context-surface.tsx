'use client';
import {useEffect,useRef,type ReactNode} from 'react';
export function ContextSurface({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);const heading=useRef<HTMLHeadingElement>(null);const close=useRef(onClose);useEffect(()=>{close.current=onClose},[onClose]);
 useEffect(()=>{
  const dialog=ref.current!;const trigger=document.activeElement as HTMLElement|null;
  const media=window.matchMedia('(min-width: 1024px)');
  function open(){if(dialog.open)dialog.close();if(media.matches)dialog.show();else dialog.showModal();dialog.setAttribute('aria-modal',String(!media.matches));heading.current?.focus()}
  open();media.addEventListener('change',open);
  return()=>{media.removeEventListener('change',open);dialog.close();if(trigger?.isConnected)trigger.focus()};
 },[]);
 useEffect(()=>{heading.current?.focus()},[title]);
 return <dialog ref={ref} className="daily-context" aria-labelledby="daily-context-title" onCancel={event=>{event.preventDefault();close.current()}} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();close.current()}}}>
  <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-white px-5 py-4"><h2 id="daily-context-title" ref={heading} tabIndex={-1} className="min-w-0 break-words text-lg font-semibold outline-none">{title}</h2><button type="button" onClick={onClose} aria-label="Sluiten" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] text-xl hover:bg-[var(--surface-soft)]">×</button></header>
  <div className="min-w-0 p-5">{children}</div>
 </dialog>;
}
