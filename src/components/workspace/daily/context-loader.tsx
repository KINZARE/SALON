'use client';
import {useEffect,useState,useCallback} from 'react';
import {Button} from '@/components/ui/button';
import {NewAppointmentForm} from '@/components/appointments/new-appointment-form';
import {RescheduleForm} from '@/components/appointments/reschedule-form';
import {AppointmentContext,CustomerContext} from './appointment-context';
import {BlockContext} from './block-context';
import type {DailyContext,DailyDetail,DailyCatalog,DailyIntake,BookingSeed} from './types';
export function ContextLoader({context,timezone,canManage,onSelect,onSaved,onRefresh,setDirty}:{context:DailyContext;timezone:string;canManage:boolean;onSelect:(context:DailyContext)=>void;onSaved:()=>void;onRefresh:()=>void;setDirty:(value:boolean)=>void}){
 const [detail,setDetail]=useState<DailyDetail|null>(null);const [catalog,setCatalog]=useState<DailyCatalog|null>(null);const [intake,setIntake]=useState<DailyIntake|null>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [retry,setRetry]=useState(0);
 const endpoint=context.kind==='appointment'?(context.view==='intake'?`kind=intake&id=${context.submissionId}`:`kind=appointment&id=${context.id}`):'kind=catalog';
 const load=useCallback(async(signal:AbortSignal)=>{setLoading(true);setError('');try{const response=await fetch(`/api/internal/today?${endpoint}`,{signal:AbortSignal.any([signal,AbortSignal.timeout(12000)])});const body=await response.json();if(!response.ok)throw new Error(body.error);if(signal.aborted)return;if(endpoint.startsWith('kind=appointment'))setDetail(body);else if(endpoint.startsWith('kind=intake'))setIntake(body);else setCatalog(body)}catch(e){if(signal.aborted)return;setError(e instanceof Error?e.message:'Gegevens konden niet worden geladen.')}finally{if(!signal.aborted)setLoading(false)}},[endpoint]);
 useEffect(()=>{const controller=new AbortController();void load(controller.signal);return()=>controller.abort()},[load,retry]);
 async function changed(){onRefresh();await load(new AbortController().signal)}
 if(loading)return <p role="status" className="py-5 text-sm text-[var(--muted)]">Gegevens laden…</p>;
 if(error)return <div className="grid gap-3"><p role="alert" className="text-sm text-[var(--danger)]">{error}</p><Button variant="secondary" onClick={()=>setRetry(r=>r+1)}>Opnieuw proberen</Button></div>;
 function rebook(d:DailyDetail){const seed:BookingSeed={customer:d.customer??undefined,serviceId:d.appointment.service_id??undefined,staffId:d.appointment.staff_id};onSelect({kind:'booking',seed,title:'Opnieuw boeken'})}
 if(context.kind==='appointment'){
  if(context.view==='intake'&&intake){const answers=(intake.answers??{}) as Record<string,unknown>;return <div><button type="button" onClick={()=>onSelect({...context,view:'appointment'})} className="min-h-11 text-sm text-[var(--muted)]">← Afspraak</button><h3 className="my-4 text-lg font-semibold">{intake.formTitle}</h3>{intake.snapshot?.fields.map(f=><div className="border-t border-[var(--border)] py-3" key={f.id}><p className="text-xs text-[var(--muted)]">{f.label}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{answers[f.id]===true?'Ja':answers[f.id]===false?'Nee':String(answers[f.id]??'—')}</p></div>)}{!intake.snapshot?<p className="text-sm text-[var(--muted)]">Historische formuliersnapshot niet beschikbaar.</p>:null}{intake.snapshot?.consentStatement?<p className="mt-4 whitespace-pre-wrap break-words text-sm">{intake.snapshot.consentStatement}</p>:null}</div>}
  if(!detail)return null;
  if(context.view==='customer')return <CustomerContext detail={detail} timezone={timezone} onBack={()=>onSelect({...context,view:'appointment'})} onRebook={()=>rebook(detail)}/>;
  return <AppointmentContext key={`${detail.appointment.id}-${detail.appointment.status}-${detail.appointment.treatment_started_at}`} detail={detail} timezone={timezone} canManage={canManage} onChanged={changed} onView={(view,submissionId)=>onSelect({...context,view,submissionId})} onRebook={()=>rebook(detail)} onMove={()=>onSelect({kind:'reschedule',detail})} setDirty={setDirty}/>;
 }
 if(!catalog)return null;
 if(context.kind==='booking')return catalog.services.length?<NewAppointmentForm services={catalog.services} staffByService={catalog.staffByService} timezone={timezone} initialCustomer={context.seed.customer} initialNewCustomer={context.seed.newCustomer} initialServiceId={context.seed.serviceId} initialStaffId={context.seed.staffId} initialDate={context.seed.date} initialStartsAt={context.seed.startsAt} initialEndsAt={context.seed.endsAt} onSaved={onSaved} onDirty={setDirty}/>:<p className="text-sm">Maak eerst een actieve behandeling aan.</p>;
 if(context.kind==='reschedule'){const a=context.detail.appointment;return <RescheduleForm appointmentId={a.id} serviceId={a.service_id??''} staff={catalog.staffByService[a.service_id??'']??[]} initialStaffId={a.staff_id} initialStartsAt={a.starts_at} timezone={timezone} onSaved={onSaved} onDirty={setDirty}/>}
 return <BlockContext seed={context.seed} mode={context.mode} catalog={catalog} timezone={timezone} onSaved={onSaved} setDirty={setDirty}/>;
}
