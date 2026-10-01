"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { getAppointmentTone, getStatusMeta, type AppointmentTone, type StatusTone } from "@/lib/calendar-ui";

type Appointment = {
  id: string;
  starts_at: string;
  service_ends_at: string;
  occupied_until: string;
  status: string;
  payment_status: string;
  customer_name_snapshot: string;
  service_name_snapshot: string;
  staff_id: string;
  price_cents_snapshot: number;
  currency_snapshot: string;
  duration_minutes_snapshot: number;
  note: string | null;
  customer?: { name: string } | null;
  staff?: { name: string } | null;
};
type Staff = { id: string; name: string; active: boolean };
type Block = { id: string; staff_id: string | null; starts_at: string; ends_at: string; reason: string | null };
type Break = { staff_id: string; weekday: number; start_time: string; end_time: string };

const pxPerMinute = 1.08;
const pad = (value: number) => String(value).padStart(2, "0");
const minuteLabel = (minute: number) => `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`;

const toneClasses: Record<AppointmentTone, string> = {
  blue: "border-[#9bc8f8] bg-[#eaf5ff] text-[#214c74]",
  violet: "border-[#c9b6f7] bg-[#f1edff] text-[#514278]",
  rose: "border-[#f6adc6] bg-[#fff0f5] text-[#7b3851]",
  amber: "border-[#f1ce79] bg-[#fff8dd] text-[#6e5720]",
  mint: "border-[#9fddba] bg-[#eaf9f0] text-[#2d6545]",
  sky: "border-[#9fdbe9] bg-[#eaf9fd] text-[#2b6070]",
  success: "border-[#9fddba] bg-[#eaf9f0] text-[#2d6545]",
  danger: "border-[#f6b0ad] bg-[#fff0ef] text-[#8c3430]",
  muted: "border-[#d8dee7] bg-[#f4f6f8] text-[#68758a]",
};

const statusClasses: Record<StatusTone, string> = {
  info: "bg-[#eaf2ff] text-[#285daf]",
  warning: "bg-[#fff4d8] text-[#8a6517]",
  success: "bg-[#e6f7ed] text-[#257244]",
  danger: "bg-[#ffedec] text-[#b13c35]",
  muted: "bg-[#f1f3f6] text-[#677489]",
};

function localParts(iso: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}
function toMinute(time: string) { const [hour, minute] = time.slice(0,5).split(":").map(Number); return hour * 60 + minute; }

function DropCell({ staffId, minute, startMinute, disabled }: { staffId: string; minute: number; startMinute: number; disabled: boolean }) {
  const id = `${staffId}|${minute}`;
  const { setNodeRef, isOver } = useDroppable({ id, disabled, data: { staffId, minute } });
  return <div ref={setNodeRef} aria-hidden data-drop-staff={staffId} data-drop-minute={minute} className={`absolute inset-x-0 border-t border-[#edf0f5] ${isOver ? "bg-[#eaf2ff]" : ""}`} style={{ top: (minute-startMinute)*pxPerMinute, height: 15*pxPerMinute }} />;
}

function AppointmentCard({ item, timezone, canManage, selected, onSelect }: { item: Appointment; timezone: string; canManage: boolean; selected: boolean; onSelect: () => void }) {
  const active = !["completed","cancelled","no_show"].includes(item.status);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useDraggable({ id: item.id, disabled: !canManage || !active, data: { appointment: item } });
  const start = localParts(item.starts_at, timezone).time;
  const end = localParts(item.service_ends_at, timezone).time;
  const customerName = item.customer?.name ?? item.customer_name_snapshot;
  const tone=getAppointmentTone(item.service_name_snapshot,item.status);

  return <div ref={setNodeRef} style={{ transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined, opacity: isDragging ? .68 : 1 }} className="relative z-20 h-full">
    <button type="button" onClick={onSelect} data-appointment-id={item.id} aria-pressed={selected} className={`block h-full w-full overflow-hidden rounded-[9px] border-l-[3px] px-2.5 py-2 pr-9 text-left shadow-[0_1px_2px_rgba(15,23,42,.04)] transition hover:-translate-y-px hover:shadow-md ${toneClasses[tone]} ${selected ? "ring-2 ring-[#2563eb]/25" : ""}`}>
      <span className="block text-[10px] font-medium opacity-75">{start}–{end}</span>
      <span className="mt-0.5 block truncate text-xs font-semibold text-[#16233b]">{customerName}</span>
      <span className="mt-0.5 block truncate text-[10px] font-medium opacity-80">{item.service_name_snapshot}</span>
    </button>
    {canManage && active ? <button
      ref={setActivatorNodeRef}
      type="button"
      data-drag-appointment-id={item.id}
      aria-label={`Verplaats afspraak van ${customerName}`}
      {...attributes}
      {...listeners}
      className="absolute right-1.5 top-1.5 z-30 flex h-7 w-7 touch-none cursor-grab items-center justify-center rounded-[7px] bg-white/80 text-[#6f7d92] shadow-sm ring-1 ring-black/5 backdrop-blur active:cursor-grabbing"
    ><span aria-hidden className="text-[12px] leading-none">⋮⋮</span></button> : null}
  </div>;
}

function AppointmentPanel({ item, timezone }: { item: Appointment | null; timezone: string }) {
  if(!item) return <aside className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.04)]">
    <div className="grid min-h-[260px] place-items-center text-center"><div><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f3f6fb] text-lg text-[#8290a5]">↗</div><p className="mt-3 text-sm font-semibold">Selecteer een afspraak</p><p className="mt-1 max-w-[220px] text-xs leading-5 text-[var(--muted)]">Klik op een kaart in de agenda om details te bekijken.</p></div></div>
  </aside>;

  const status=getStatusMeta(item.status);
  const start=localParts(item.starts_at,timezone).time;
  const end=localParts(item.service_ends_at,timezone).time;
  const dateLabel=new Intl.DateTimeFormat("nl-NL",{weekday:"short",day:"numeric",month:"short",year:"numeric",timeZone:timezone}).format(new Date(item.starts_at));
  const customerName=item.customer?.name ?? item.customer_name_snapshot;

  return <aside data-calendar-detail className="rounded-2xl border border-[var(--border)] bg-white shadow-[0_8px_30px_rgba(15,23,42,.04)]">
    <div className="border-b border-[var(--border)] p-5">
      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClasses[status.tone]}`}>{status.label}</span>
      <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em]">{customerName}</h2>
      <p className="mt-1 text-sm font-medium text-[var(--muted)]">{item.service_name_snapshot}</p>
      <div className="mt-4 flex items-center gap-2 text-xs text-[#53627a]"><span aria-hidden>◷</span><span>{dateLabel} · {start}–{end}</span></div>
      <Link href={`/app/appointments/${item.id}`} className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-hover)]">Open afspraak</Link>
    </div>
    <div className="divide-y divide-[var(--border)] px-5">
      <div className="py-4"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#9aa5b5]">Klant</p><p className="mt-1.5 text-sm font-semibold">{customerName}</p></div>
      <div className="py-4"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#9aa5b5]">Behandeling</p><div className="mt-1.5 flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{item.service_name_snapshot}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.duration_minutes_snapshot} min</p></div><p className="text-sm font-semibold">{formatMoney(item.price_cents_snapshot,item.currency_snapshot)}</p></div></div>
      <div className="py-4"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#9aa5b5]">Medewerker</p><p className="mt-1.5 text-sm font-semibold">{item.staff?.name ?? "Medewerker"}</p></div>
      <div className="py-4"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#9aa5b5]">Betaling</p><p className="mt-1.5 text-sm font-semibold capitalize">{item.payment_status.replaceAll("_"," ")}</p></div>
      <div className="py-4"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#9aa5b5]">Notitie</p><p className="mt-1.5 whitespace-pre-wrap text-sm leading-5 text-[#52627a]">{item.note || "Geen notitie."}</p></div>
    </div>
  </aside>;
}

export function CalendarBoard({ date, timezone, appointments, staff, blocks, breaks, canManage, startMinute, endMinute }: {
  date: string; timezone: string; appointments: Appointment[]; staff: Staff[]; blocks: Block[]; breaks: Break[]; canManage: boolean; startMinute: number; endMinute: number;
}) {
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  const [message,setMessage] = useState<string | null>(null);
  const [busy,setBusy] = useState(false);
  const [selectedId,setSelectedId]=useState<string | null>(appointments[0]?.id ?? null);
  const [undo,setUndo] = useState<null | { appointmentId:string; fromStaffId:string; fromStartsAt:string; toStaffId:string; toStartsAt:string }>(null);
  const rows = useMemo(() => Array.from({length:Math.ceil((endMinute-startMinute)/15)},(_,index)=>startMinute+index*15),[startMinute,endMinute]);
  const height=(endMinute-startMinute)*pxPerMinute;
  const selected=appointments.find(item=>item.id===selectedId) ?? null;

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

  if(!staff.length) return <p className="mt-6 rounded-xl border border-[var(--border)] bg-white p-5 text-sm text-[var(--muted)]">Voeg eerst een actieve medewerker toe.</p>;

  return <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_318px] xl:items-start">
    <div className="min-w-0">
      <div className="mb-2.5 flex min-h-9 items-center justify-between gap-3">
        <p role="status" className="text-xs text-[var(--muted)]">{busy?"Planning controleren…":message??(canManage?"Sleep een actieve afspraak naar een vrije tijd of medewerker.":"Dagplanning")}</p>
        {undo?<button type="button" onClick={undoMove} disabled={busy} className="h-9 rounded-[9px] border border-[var(--border)] bg-white px-3 text-xs font-semibold disabled:opacity-50">Undo</button>:null}
      </div>
      <div className="calendar-scroll overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-[0_8px_30px_rgba(15,23,42,.035)]">
        <div className="min-w-[850px]">
          <div className="grid border-b border-[var(--border)] bg-[#fbfcfe]" style={{gridTemplateColumns:`70px repeat(${staff.length},minmax(170px,1fr))`}}>
            <div className="flex items-center justify-center text-[10px] font-semibold uppercase tracking-[.1em] text-[#9aa5b5]">Tijd</div>
            {staff.map(member=>{
              const initials=member.name.split(/\s+/).slice(0,2).map(part=>part[0]).join("").toUpperCase();
              return <div key={member.id} className="flex items-center gap-2.5 border-l border-[var(--border)] px-3 py-3.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#edf3ff] text-[10px] font-bold text-[var(--primary)]">{initials}</span>
                <div className="min-w-0"><p className="truncate text-xs font-semibold">{member.name}</p><p className="mt-0.5 text-[10px] text-[var(--muted)]">Beschikbaar</p></div>
              </div>;
            })}
          </div>
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <div className="grid" style={{gridTemplateColumns:`70px repeat(${staff.length},minmax(170px,1fr))`}}>
              <div className="relative bg-[#fbfcfe]" style={{height}}>{rows.filter(minute=>minute%60===0).map(minute=><span key={minute} className="absolute right-3 -translate-y-2 text-[10px] font-medium text-[#8d99aa]" style={{top:(minute-startMinute)*pxPerMinute}}>{minuteLabel(minute)}</span>)}</div>
              {staff.map(member=>{
                const memberAppointments=appointments.filter(item=>item.staff_id===member.id);
                const memberBlocks=blocks.filter(block=>!block.staff_id||block.staff_id===member.id);
                const memberBreaks=breaks.filter(item=>item.staff_id===member.id);
                return <div key={member.id} className="relative border-l border-[var(--border)] bg-white" style={{height}}>
                  {rows.map(minute=><DropCell key={minute} staffId={member.id} minute={minute} startMinute={startMinute} disabled={!canManage||busy}/>)}
                  {memberBreaks.map((item,index)=>{const from=toMinute(item.start_time),to=toMinute(item.end_time);return <div key={index} className="pointer-events-none absolute inset-x-1.5 z-10 overflow-hidden rounded-[7px] border border-dashed border-[#d3d9e3] bg-[repeating-linear-gradient(135deg,#f8f9fb,#f8f9fb_6px,#eef1f5_6px,#eef1f5_12px)] px-2 py-1 text-[10px] font-medium text-[#7b8799]" style={{top:(from-startMinute)*pxPerMinute,height:Math.max(18,(to-from)*pxPerMinute)}}>Pauze</div>})}
                  {memberBlocks.map(block=>{const start=localParts(block.starts_at,timezone),end=localParts(block.ends_at,timezone);if(start.date!==date)return null;const from=toMinute(start.time),to=end.date===date?toMinute(end.time):endMinute;return <div key={block.id} className="pointer-events-none absolute inset-x-1.5 z-10 overflow-hidden rounded-[7px] border border-[#e6d9ca] bg-[#faf5ee] px-2 py-1 text-[10px] font-medium text-[#82664c]" style={{top:(from-startMinute)*pxPerMinute,height:Math.max(18,(to-from)*pxPerMinute)}}>{block.reason||"Geblokkeerd"}</div>})}
                  {memberAppointments.map(item=>{const start=localParts(item.starts_at,timezone);if(start.date!==date)return null;const top=(toMinute(start.time)-startMinute)*pxPerMinute;const duration=Math.max(30,(new Date(item.service_ends_at).getTime()-new Date(item.starts_at).getTime())/60_000);return <div key={item.id} className="absolute inset-x-1.5" style={{top,height:Math.max(44,duration*pxPerMinute)}}><AppointmentCard item={item} timezone={timezone} canManage={canManage} selected={selectedId===item.id} onSelect={()=>setSelectedId(item.id)}/></div>})}
                </div>;
              })}
            </div>
          </DndContext>
        </div>
      </div>
    </div>
    <AppointmentPanel item={selected} timezone={timezone}/>
  </div>;
}
