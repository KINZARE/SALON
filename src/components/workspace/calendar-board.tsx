"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useRouter } from "next/navigation";

type Appointment = {
  id: string; starts_at: string; service_ends_at: string; occupied_until: string; status: string;
  customer_name_snapshot: string; service_name_snapshot: string; staff_id: string;
  customer?: { name: string } | null; staff?: { name: string } | null;
};
type Staff = { id: string; name: string; active: boolean };
type Block = { id: string; staff_id: string | null; starts_at: string; ends_at: string; reason: string | null };
type Break = { staff_id: string; weekday: number; start_time: string; end_time: string };

const pxPerMinute = 1.15;
const pad = (value: number) => String(value).padStart(2, "0");
const minuteLabel = (minute: number) => `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`;

function localParts(iso: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}
function toMinute(time: string) { const [hour, minute] = time.slice(0,5).split(":").map(Number); return hour * 60 + minute; }

function DropCell({ staffId, minute, startMinute, disabled }: { staffId: string; minute: number; startMinute: number; disabled: boolean }) {
  const id = `${staffId}|${minute}`;
  const { setNodeRef, isOver } = useDroppable({ id, disabled, data: { staffId, minute } });
  return <div ref={setNodeRef} aria-hidden data-drop-staff={staffId} data-drop-minute={minute} className={`absolute inset-x-0 border-t border-[var(--border)]/70 ${isOver ? "bg-[var(--primary-soft)]" : ""}`} style={{ top: (minute-startMinute)*pxPerMinute, height: 15*pxPerMinute }} />;
}

function AppointmentCard({ item, timezone, canManage }: { item: Appointment; timezone: string; canManage: boolean }) {
  const active = !["completed","cancelled","no_show"].includes(item.status);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useDraggable({ id: item.id, disabled: !canManage || !active, data: { appointment: item } });
  const start = localParts(item.starts_at, timezone).time;
  const end = localParts(item.service_ends_at, timezone).time;
  const customerName = item.customer?.name ?? item.customer_name_snapshot;
  return <div ref={setNodeRef} style={{ transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined, opacity: isDragging ? .62 : 1 }} className="relative z-20 h-full">
    <Link href={`/app/appointments/${item.id}`} data-appointment-id={item.id} className={`block h-full overflow-hidden rounded-[10px] border bg-white px-2.5 py-2 pr-11 shadow-sm transition ${!active ? "opacity-55" : ""}`}>
      <div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-semibold">{customerName}</span><span className="shrink-0 text-[10px] text-[var(--muted)]">{start}</span></div>
      <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">{item.service_name_snapshot} · {start}–{end}</p>
    </Link>
    {canManage && active ? <button
      ref={setActivatorNodeRef}
      type="button"
      data-drag-appointment-id={item.id}
      aria-label={`Verplaats afspraak van ${customerName}`}
      {...attributes}
      {...listeners}
      className="absolute right-1 top-1 z-30 flex h-9 w-9 touch-none cursor-grab items-center justify-center rounded-[8px] border border-[var(--border)] bg-white text-[var(--muted)] shadow-sm active:cursor-grabbing"
    ><span aria-hidden className="text-[15px] leading-none">⋮⋮</span></button> : null}
  </div>;
}

export function CalendarBoard({ date, timezone, appointments, staff, blocks, breaks, canManage, startMinute, endMinute }: {
  date: string; timezone: string; appointments: Appointment[]; staff: Staff[]; blocks: Block[]; breaks: Break[]; canManage: boolean; startMinute: number; endMinute: number;
}) {
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  const [message,setMessage] = useState<string | null>(null);
  const [busy,setBusy] = useState(false);
  const [undo,setUndo] = useState<null | { appointmentId:string; fromStaffId:string; fromStartsAt:string; toStaffId:string; toStartsAt:string }>(null);
  const rows = useMemo(() => Array.from({length:Math.ceil((endMinute-startMinute)/15)},(_,index)=>startMinute+index*15),[startMinute,endMinute]);
  const height=(endMinute-startMinute)*pxPerMinute;

  async function move(payload: { appointmentId:string; staffId:string; localStart:string; expectedStartsAt:string; expectedStaffId:string }) {
    const response=await fetch("/api/internal/move",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const body=await response.json() as {error?:string;startsAt?:string;staffId?:string};
    if(!response.ok) throw new Error(body.error ?? "Verplaatsen is niet gelukt.");
    return body;
  }

  async function onDragEnd(event: DragEndEvent) {
    const appointment=event.active.data.current?.appointment as Appointment | undefined;
    const target=event.over?.data.current as {staffId?:string;minute?:number} | undefined;
    if(!appointment || !target?.staffId || typeof target.minute!=="number") return;
    const localStart=`${date}T${minuteLabel(target.minute)}`;
    if(target.staffId===appointment.staff_id && localParts(appointment.starts_at,timezone).date===date && localParts(appointment.starts_at,timezone).time===minuteLabel(target.minute)) return;
    setBusy(true);setMessage(null);setUndo(null);
    try{
      const result=await move({appointmentId:appointment.id,staffId:target.staffId,localStart,expectedStartsAt:appointment.starts_at,expectedStaffId:appointment.staff_id});
      if(!result.startsAt||!result.staffId) throw new Error("Geen actuele planning ontvangen.");
      setUndo({appointmentId:appointment.id,fromStaffId:appointment.staff_id,fromStartsAt:appointment.starts_at,toStaffId:result.staffId,toStartsAt:result.startsAt});
      setMessage("Afspraak verplaatst.");
      router.refresh();
    }catch(error){setMessage(error instanceof Error?error.message:"Verplaatsen is niet gelukt.");router.refresh();}
    finally{setBusy(false);}
  }

  async function undoMove(){
    if(!undo)return;
    setBusy(true);setMessage(null);
    try{
      const from=localParts(undo.fromStartsAt,timezone);
      await move({appointmentId:undo.appointmentId,staffId:undo.fromStaffId,localStart:`${from.date}T${from.time}`,expectedStartsAt:undo.toStartsAt,expectedStaffId:undo.toStaffId});
      setUndo(null);setMessage("Verplaatsing teruggedraaid.");router.refresh();
    }catch(error){setUndo(null);setMessage(error instanceof Error?error.message:"Undo kon niet veilig worden uitgevoerd.");router.refresh();}
    finally{setBusy(false);}
  }

  if(!staff.length) return <p className="mt-6 text-sm text-[var(--muted)]">Voeg eerst een actieve medewerker toe.</p>;
  return <div className="mt-5">
    <div className="mb-3 flex min-h-10 items-center justify-between gap-3 text-sm"><p role="status" className="text-[var(--muted)]">{busy?"Planning controleren…":message??"Sleep een actieve afspraak naar een vrije tijd/medewerker."}</p>{undo?<button type="button" onClick={undoMove} disabled={busy} className="h-9 rounded-[9px] border border-[var(--border)] bg-white px-3 text-sm font-medium disabled:opacity-50">Undo</button>:null}</div>
    <div className="overflow-x-auto rounded-[12px] border border-[var(--border)] bg-white">
      <div className="min-w-[760px]">
        <div className="grid border-b border-[var(--border)] bg-[#fafaf8]" style={{gridTemplateColumns:`64px repeat(${staff.length},minmax(180px,1fr))`}}>
          <div/><>{staff.map(member=><div key={member.id} className="border-l border-[var(--border)] px-3 py-3 text-sm font-semibold">{member.name}</div>)}</>
        </div>
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid" style={{gridTemplateColumns:`64px repeat(${staff.length},minmax(180px,1fr))`}}>
            <div className="relative" style={{height}}>{rows.filter(minute=>minute%60===0).map(minute=><span key={minute} className="absolute right-2 -translate-y-2 text-[10px] text-[var(--muted)]" style={{top:(minute-startMinute)*pxPerMinute}}>{minuteLabel(minute)}</span>)}</div>
            {staff.map(member=>{
              const memberAppointments=appointments.filter(item=>item.staff_id===member.id);
              const memberBlocks=blocks.filter(block=>!block.staff_id||block.staff_id===member.id);
              const memberBreaks=breaks.filter(item=>item.staff_id===member.id);
              return <div key={member.id} className="relative border-l border-[var(--border)]" style={{height}}>
                {rows.map(minute=><DropCell key={minute} staffId={member.id} minute={minute} startMinute={startMinute} disabled={!canManage||busy}/>)}
                {memberBreaks.map((item,index)=>{const from=toMinute(item.start_time),to=toMinute(item.end_time);return <div key={index} className="pointer-events-none absolute inset-x-1 z-10 rounded-[8px] border border-dashed border-[var(--border)] bg-[#f6f6f2] px-2 py-1 text-[10px] text-[var(--muted)]" style={{top:(from-startMinute)*pxPerMinute,height:Math.max(18,(to-from)*pxPerMinute)}}>Pauze</div>})}
                {memberBlocks.map(block=>{const start=localParts(block.starts_at,timezone),end=localParts(block.ends_at,timezone);if(start.date!==date)return null;const from=toMinute(start.time),to=end.date===date?toMinute(end.time):endMinute;return <div key={block.id} className="pointer-events-none absolute inset-x-1 z-10 rounded-[8px] border border-[#e4d7cb] bg-[#f7f2ed] px-2 py-1 text-[10px] text-[#725b49]" style={{top:(from-startMinute)*pxPerMinute,height:Math.max(18,(to-from)*pxPerMinute)}}>{block.reason||"Geblokkeerd"}</div>})}
                {memberAppointments.map(item=>{const start=localParts(item.starts_at,timezone);if(start.date!==date)return null;const top=(toMinute(start.time)-startMinute)*pxPerMinute;const duration=Math.max(30,(new Date(item.service_ends_at).getTime()-new Date(item.starts_at).getTime())/60_000);return <div key={item.id} className="absolute inset-x-1" style={{top,height:Math.max(42,duration*pxPerMinute)}}><AppointmentCard item={item} timezone={timezone} canManage={canManage}/></div>})}
              </div>
            })}
          </div>
        </DndContext>
      </div>
    </div>
  </div>;
}
