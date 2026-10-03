"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { getAppointmentVisual, getStatusMeta, type StatusTone } from "@/lib/calendar-ui";
import { getStaffIdentity, type StaffTone } from "@/lib/staff-identity";
import { getDraggedTargetMinute, shiftAppointmentTimes } from "@/domain/calendar-drag";

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
const slotMinutes = 15;
const pad = (value: number) => String(value).padStart(2, "0");
const minuteLabel = (minute: number) => `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`;

const railClasses: Record<StaffTone, string> = {
  clay: "border-l-[#c57747]",
  sage: "border-l-[#75917d]",
  sand: "border-l-[#b79761]",
  sky: "border-l-[#7797a0]",
  lilac: "border-l-[#9887a4]",
};

const statusClasses: Record<StatusTone, string> = {
  info: "bg-[#e8f0f2] text-[#48676f]",
  warning: "bg-[#f7ecd4] text-[#7a5a1f]",
  success: "bg-[#e5eee7] text-[#42654e]",
  complete: "bg-[#ebe9e5] text-[#4b4945]",
  danger: "bg-[#f8e7e4] text-[#9b4338]",
  muted: "bg-[#efeeeb] text-[#77736d]",
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();
function localParts(iso: string, timezone: string) {
  let formatter=formatterCache.get(timezone);
  if(!formatter){
    formatter=new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    formatterCache.set(timezone,formatter);
  }
  const parts = formatter.formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}
function toMinute(time: string) { const [hour, minute] = time.slice(0,5).split(":").map(Number); return hour * 60 + minute; }

function AppointmentVisual({ item, timezone, selected=false, overlay=false }: { item: Appointment; timezone: string; selected?: boolean; overlay?: boolean }) {
  const start = localParts(item.starts_at, timezone).time;
  const end = localParts(item.service_ends_at, timezone).time;
  const customerName = item.customer?.name ?? item.customer_name_snapshot;
  const visual = getAppointmentVisual(item.status, item.staff_id);
  const status = getStatusMeta(item.status);
  const terminal = ["cancelled", "no_show", "completed"].includes(item.status);

  return <div className={`h-full w-full overflow-hidden rounded-[10px] border border-[var(--border)] border-l-[4px] ${railClasses[visual.railTone]} bg-white px-2.5 py-2 pr-8 text-left ${terminal ? "opacity-70" : ""} ${selected ? "ring-2 ring-[var(--primary-soft)] ring-offset-1 ring-offset-white" : ""} ${overlay ? "min-h-[58px] w-[200px] rotate-[1deg] shadow-lg" : ""}`}>
    <div className="flex min-w-0 items-center gap-2">
      <span className="block shrink-0 text-[10px] font-semibold tabular-nums text-[var(--muted)]">{start}–{end}</span>
      <span className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${status.tone === "danger" ? "bg-[var(--status-no-show)]" : status.tone === "warning" ? "bg-[var(--status-pending)]" : status.tone === "success" ? "bg-[var(--status-confirmed)]" : status.tone === "info" ? "bg-[var(--status-checked-in)]" : "bg-[var(--status-completed)]"}`} aria-label={status.label} />
    </div>
    <span className="mt-1 block truncate text-xs font-semibold text-[var(--ink)]">{customerName}</span>
    <span className="mt-0.5 block truncate text-[10px] font-medium text-[var(--muted)]">{item.service_name_snapshot}</span>
  </div>;
}
function AppointmentCard({ item, timezone, canManage, selected, onSelect }: { item: Appointment; timezone: string; canManage: boolean; selected: boolean; onSelect: () => void }) {
  const active = !["completed","cancelled","no_show"].includes(item.status);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: item.id,
    disabled: !canManage || !active,
    data: { appointment: item },
  });

  return <div ref={setNodeRef} className={`relative z-20 h-full transition-opacity ${isDragging ? "opacity-25" : ""}`}>
    <button
      ref={setActivatorNodeRef}
      type="button"
      onClick={onSelect}
      data-appointment-id={item.id}
      {...attributes}
      {...listeners}
      aria-pressed={selected}
      className={`block h-full w-full cursor-pointer select-none text-left transition hover:-translate-y-px ${canManage && active ? "sm:cursor-grab sm:active:cursor-grabbing" : ""}`}
    >
      <AppointmentVisual item={item} timezone={timezone} selected={selected}/>
    </button>
    {canManage && active ? <span aria-hidden className="pointer-events-none absolute right-2 top-2 text-[11px] font-bold text-[var(--muted)]">⋮⋮</span> : null}
  </div>;
}

function StaffDropColumn({ member, disabled, children, height }: { member: Staff; disabled: boolean; children: React.ReactNode; height: number }) {
  const { setNodeRef, isOver }=useDroppable({
    id: `staff:${member.id}`,
    disabled,
    data: { staffId: member.id },
  });

  return <div
    ref={setNodeRef}
    data-drop-staff={member.id}
    className={`relative border-l border-[var(--border)] transition-colors ${isOver ? "bg-[var(--primary-soft)]" : "bg-white"}`}
    style={{
      height,
      backgroundImage: "linear-gradient(to bottom, transparent calc(100% - 1px), #ece8e2 calc(100% - 1px))",
      backgroundSize: `100% ${slotMinutes*pxPerMinute}px`,
    }}
  >{children}</div>;
}

function AppointmentPanel({ item, timezone }: { item: Appointment | null; timezone: string }) {
  if(!item) return <aside className="rounded-[16px] border border-[var(--border)] bg-white p-5">
    <div className="grid min-h-[260px] place-items-center text-center"><div><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[var(--primary-soft)] text-lg text-[var(--primary)]">↗</div><p className="mt-3 text-sm font-semibold">Selecteer een afspraak</p><p className="mt-1 max-w-[220px] text-xs leading-5 text-[var(--muted)]">Klik op een kaart in de agenda om details te bekijken.</p></div></div>
  </aside>;

  const status=getStatusMeta(item.status);
  const start=localParts(item.starts_at,timezone).time;
  const end=localParts(item.service_ends_at,timezone).time;
  const dateLabel=new Intl.DateTimeFormat("nl-NL",{weekday:"short",day:"numeric",month:"short",year:"numeric",timeZone:timezone}).format(new Date(item.starts_at));
  const customerName=item.customer?.name ?? item.customer_name_snapshot;

  return <aside data-calendar-detail className="rounded-[16px] border border-[var(--border)] bg-white">
    <div className="border-b border-[var(--border)] p-5">
      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClasses[status.tone]}`}>{status.label}</span>
      <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em]">{customerName}</h2>
      <p className="mt-1 text-sm font-medium text-[var(--muted)]">{item.service_name_snapshot}</p>
      <div className="mt-4 flex items-center gap-2 text-xs text-[var(--muted)]"><span aria-hidden>◷</span><span>{dateLabel} · {start}–{end}</span></div>
      <Link href={`/app/appointments/${item.id}`} className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-[10px] bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">Open afspraak</Link>
    </div>
    <div className="divide-y divide-[var(--border)] px-5">
      <div className="py-4"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--muted)]">Klant</p><p className="mt-1.5 text-sm font-semibold">{customerName}</p></div>
      <div className="py-4"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--muted)]">Behandeling</p><div className="mt-1.5 flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{item.service_name_snapshot}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.duration_minutes_snapshot} min</p></div><p className="text-sm font-semibold">{formatMoney(item.price_cents_snapshot,item.currency_snapshot)}</p></div></div>
      <div className="py-4"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--muted)]">Medewerker</p><p className="mt-1.5 text-sm font-semibold">{item.staff?.name ?? "Medewerker"}</p></div>
      <div className="py-4"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--muted)]">Betaling</p><p className="mt-1.5 text-sm font-semibold capitalize">{item.payment_status.replaceAll("_"," ")}</p></div>
      <div className="py-4"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--muted)]">Notitie</p><p className="mt-1.5 whitespace-pre-wrap text-sm leading-5 text-[var(--muted)]">{item.note || "Geen notitie."}</p></div>
    </div>
  </aside>;
}

export function CalendarBoard({ date, timezone, appointments, staff, blocks, breaks, canManage, startMinute, endMinute }: {
  date: string; timezone: string; appointments: Appointment[]; staff: Staff[]; blocks: Block[]; breaks: Break[]; canManage: boolean; startMinute: number; endMinute: number;
}) {
  const router = useRouter();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 7 } }),
    useSensor(KeyboardSensor),
  );
  const [localAppointments,setLocalAppointments]=useState(appointments);
  const [message,setMessage] = useState<string | null>(null);
  const [busy,setBusy] = useState(false);
  const [activeId,setActiveId]=useState<string | null>(null);
  const [selectedId,setSelectedId]=useState<string | null>(appointments[0]?.id ?? null);
  const [undo,setUndo] = useState<null | { appointmentId:string; fromStaffId:string; fromStartsAt:string; toStaffId:string; toStartsAt:string }>(null);
  const height=(endMinute-startMinute)*pxPerMinute;
  const nowLocal=localParts(new Date().toISOString(),timezone);
  const isToday=nowLocal.date===date;
  const nowMinute=toMinute(nowLocal.time);
  const hourRows=useMemo(()=>Array.from({length:Math.ceil((endMinute-startMinute)/60)+1},(_,index)=>startMinute+index*60).filter(value=>value<=endMinute),[startMinute,endMinute]);

  useEffect(()=>{
    setLocalAppointments(appointments);
    setSelectedId(current=>current && appointments.some(item=>item.id===current) ? current : appointments[0]?.id ?? null);
  },[appointments]);

  const selected=localAppointments.find(item=>item.id===selectedId) ?? null;
  const activeAppointment=localAppointments.find(item=>item.id===activeId) ?? null;

  const appointmentsByStaff=useMemo(()=>{
    const grouped=new Map<string,Appointment[]>();
    for(const member of staff) grouped.set(member.id,[]);
    for(const item of localAppointments) grouped.get(item.staff_id)?.push(item);
    return grouped;
  },[localAppointments,staff]);

  const breaksByStaff=useMemo(()=>{
    const grouped=new Map<string,Break[]>();
    for(const member of staff) grouped.set(member.id,[]);
    for(const item of breaks) grouped.get(item.staff_id)?.push(item);
    return grouped;
  },[breaks,staff]);

  const blocksByStaff=useMemo(()=>{
    const grouped=new Map<string,Block[]>();
    for(const member of staff) grouped.set(member.id,[]);
    for(const block of blocks){
      if(block.staff_id) grouped.get(block.staff_id)?.push(block);
      else for(const member of staff) grouped.get(member.id)?.push(block);
    }
    return grouped;
  },[blocks,staff]);

  async function move(payload: { appointmentId:string; staffId:string; localStart:string; expectedStartsAt:string; expectedStaffId:string }) {
    const response=await fetch("/api/internal/move",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const body=await response.json() as {error?:string;startsAt?:string;staffId?:string};
    if(!response.ok) throw new Error(body.error ?? "Verplaatsen is niet gelukt.");
    return body;
  }

  function onDragStart(event:DragStartEvent){
    const appointment=event.active.data.current?.appointment as Appointment|undefined;
    if(!appointment)return;
    setActiveId(appointment.id);
    setSelectedId(appointment.id);
    setMessage(null);
  }

  function onDragCancel(){setActiveId(null);}

  async function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const appointment=event.active.data.current?.appointment as Appointment | undefined;
    const target=event.over?.data.current as {staffId?:string} | undefined;
    if(!appointment || !target?.staffId) return;

    const originalTime=localParts(appointment.starts_at,timezone).time;
    const originalMinute=toMinute(originalTime);
    const occupiedMinutes=Math.max(slotMinutes,Math.round((new Date(appointment.occupied_until).getTime()-new Date(appointment.starts_at).getTime())/60_000));
    const targetMinute=getDraggedTargetMinute({
      originalMinute,
      deltaY:event.delta.y,
      pxPerMinute,
      stepMinutes:slotMinutes,
      startMinute,
      endMinute,
      occupiedMinutes,
    });
    const deltaMinutes=targetMinute-originalMinute;
    if(target.staffId===appointment.staff_id && deltaMinutes===0)return;

    const targetStaff=staff.find(member=>member.id===target.staffId);
    if(!targetStaff)return;

    const before=localAppointments.find(item=>item.id===appointment.id) ?? appointment;
    const shifted=shiftAppointmentTimes({
      startsAt:before.starts_at,
      serviceEndsAt:before.service_ends_at,
      occupiedUntil:before.occupied_until,
      deltaMinutes,
    });
    const optimistic:Appointment={
      ...before,
      starts_at:shifted.startsAt,
      service_ends_at:shifted.serviceEndsAt,
      occupied_until:shifted.occupiedUntil,
      staff_id:target.staffId,
      staff:{name:targetStaff.name},
    };

    setLocalAppointments(current=>current.map(item=>item.id===appointment.id?optimistic:item));
    setBusy(true);
    setMessage("Afspraak opslaan…");
    setUndo(null);

    try{
      const result=await move({
        appointmentId:appointment.id,
        staffId:target.staffId,
        localStart:`${date}T${minuteLabel(targetMinute)}`,
        expectedStartsAt:before.starts_at,
        expectedStaffId:before.staff_id,
      });
      if(!result.startsAt||!result.staffId)throw new Error("Geen actuele planning ontvangen.");

      const confirmedDelta=Math.round((new Date(result.startsAt).getTime()-new Date(before.starts_at).getTime())/60_000);
      const confirmedTimes=shiftAppointmentTimes({
        startsAt:before.starts_at,
        serviceEndsAt:before.service_ends_at,
        occupiedUntil:before.occupied_until,
        deltaMinutes:confirmedDelta,
      });
      setLocalAppointments(current=>current.map(item=>item.id===appointment.id?{
        ...item,
        starts_at:result.startsAt!,
        service_ends_at:confirmedTimes.serviceEndsAt,
        occupied_until:confirmedTimes.occupiedUntil,
        staff_id:result.staffId!,
        staff:{name:targetStaff.name},
      }:item));
      setUndo({appointmentId:appointment.id,fromStaffId:before.staff_id,fromStartsAt:before.starts_at,toStaffId:result.staffId,toStartsAt:result.startsAt});
      setMessage("Afspraak verplaatst.");
    }catch(error){
      setLocalAppointments(current=>current.map(item=>item.id===appointment.id?before:item));
      setMessage(error instanceof Error?error.message:"Verplaatsen is niet gelukt.");
      router.refresh();
    }finally{
      setBusy(false);
    }
  }

  async function undoMove(){
    if(!undo)return;
    const current=localAppointments.find(item=>item.id===undo.appointmentId);
    if(!current)return;
    const targetStaff=staff.find(member=>member.id===undo.fromStaffId);
    if(!targetStaff)return;

    const deltaMinutes=Math.round((new Date(undo.fromStartsAt).getTime()-new Date(current.starts_at).getTime())/60_000);
    const shifted=shiftAppointmentTimes({
      startsAt:current.starts_at,
      serviceEndsAt:current.service_ends_at,
      occupiedUntil:current.occupied_until,
      deltaMinutes,
    });
    setLocalAppointments(items=>items.map(item=>item.id===undo.appointmentId?{
      ...item,
      starts_at:shifted.startsAt,
      service_ends_at:shifted.serviceEndsAt,
      occupied_until:shifted.occupiedUntil,
      staff_id:undo.fromStaffId,
      staff:{name:targetStaff.name},
    }:item));
    setBusy(true);setMessage("Undo opslaan…");

    try{
      const from=localParts(undo.fromStartsAt,timezone);
      await move({appointmentId:undo.appointmentId,staffId:undo.fromStaffId,localStart:`${from.date}T${from.time}`,expectedStartsAt:undo.toStartsAt,expectedStaffId:undo.toStaffId});
      setUndo(null);
      setMessage("Verplaatsing teruggedraaid.");
    }catch(error){
      setLocalAppointments(items=>items.map(item=>item.id===current.id?current:item));
      setUndo(null);
      setMessage(error instanceof Error?error.message:"Undo kon niet veilig worden uitgevoerd.");
      router.refresh();
    }finally{setBusy(false);}
  }

  if(!staff.length) return <p className="mt-6 rounded-[12px] border border-[var(--border)] bg-white p-5 text-sm text-[var(--muted)]">Voeg eerst een actieve medewerker toe.</p>;

  return <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_318px] xl:items-start">
    <div className="min-w-0">
      <div className="mb-2.5 flex min-h-9 items-center justify-between gap-3">
        <p role="status" className="text-xs text-[var(--muted)]">{message??(canManage?"Sleep een afspraak direct naar de gewenste tijd of medewerker.":"Dagplanning")}</p>
        {undo?<button type="button" onClick={undoMove} disabled={busy} className="h-9 rounded-[9px] border border-[var(--border)] bg-white px-3 text-xs font-semibold hover:bg-[var(--surface-soft)] disabled:opacity-50">Undo</button>:null}
      </div>
      <div className="calendar-scroll overflow-x-auto rounded-[16px] border border-[var(--border)] bg-white">
        <div className="min-w-[850px]">
          <div className="grid border-b border-[var(--border)] bg-[var(--surface-soft)]" style={{gridTemplateColumns:`70px repeat(${staff.length},minmax(170px,1fr))`}}>
            <div className="flex items-center justify-center text-[10px] font-semibold uppercase tracking-[.1em] text-[var(--muted)]">Tijd</div>
            {staff.map(member=>{
              const identity=getStaffIdentity(member.id,member.name);
              const avatarClass:Record<StaffTone,string>={clay:"bg-[#f4e4da] text-[#8a4a25]",sage:"bg-[#e4ece6] text-[#4f6c57]",sand:"bg-[#f2eadc] text-[#80683f]",sky:"bg-[#e4ecef] text-[#4f7078]",lilac:"bg-[#ece6ef] text-[#6e5d78]"};
              return <div key={member.id} data-staff-identity={member.id} className="flex items-center gap-2.5 border-l border-[var(--border)] px-3 py-3.5">
                <span className={`grid h-8 w-8 place-items-center rounded-full text-[10px] font-bold ${avatarClass[identity.tone]}`}>{identity.initials}</span>
                <div className="min-w-0"><p className="truncate text-xs font-semibold">{member.name}</p><p className="mt-0.5 text-[10px] text-[var(--muted)]">Beschikbaar</p></div>
              </div>;
            })}
          </div>
          <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={onDragStart} onDragCancel={onDragCancel} onDragEnd={onDragEnd}>
            <div className="relative grid" style={{gridTemplateColumns:`70px repeat(${staff.length},minmax(170px,1fr))`}}>
              {isToday && nowMinute>=startMinute && nowMinute<=endMinute ? <div data-current-time-line className="pointer-events-none absolute left-[70px] right-0 z-40 border-t border-[var(--primary)]" style={{top:(nowMinute-startMinute)*pxPerMinute}}><span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-[var(--primary)]" /></div> : null}
              <div className="relative bg-[var(--surface-soft)]" style={{height}}>{hourRows.map(minute=><span key={minute} className="absolute right-3 -translate-y-2 text-[10px] font-medium text-[var(--muted)]" style={{top:(minute-startMinute)*pxPerMinute}}>{minuteLabel(minute)}</span>)}</div>
              {staff.map(member=>{
                const memberAppointments=appointmentsByStaff.get(member.id)??[];
                const memberBlocks=blocksByStaff.get(member.id)??[];
                const memberBreaks=breaksByStaff.get(member.id)??[];
                return <StaffDropColumn key={member.id} member={member} disabled={!canManage||busy} height={height}>
                  {memberBreaks.map((item,index)=>{const from=toMinute(item.start_time),to=toMinute(item.end_time);return <div key={index} className="pointer-events-none absolute inset-x-1.5 z-10 overflow-hidden rounded-[7px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] px-2 py-1 text-[10px] font-medium text-[var(--muted)]" style={{top:(from-startMinute)*pxPerMinute,height:Math.max(18,(to-from)*pxPerMinute)}}>Pauze</div>})}
                  {memberBlocks.map(block=>{const start=localParts(block.starts_at,timezone),end=localParts(block.ends_at,timezone);if(start.date!==date)return null;const from=toMinute(start.time),to=end.date===date?toMinute(end.time):endMinute;return <div key={block.id} className="pointer-events-none absolute inset-x-1.5 z-10 overflow-hidden rounded-[7px] border border-[#e6d9ca] bg-[#faf5ee] px-2 py-1 text-[10px] font-medium text-[#82664c]" style={{top:(from-startMinute)*pxPerMinute,height:Math.max(18,(to-from)*pxPerMinute)}}>{block.reason||"Geblokkeerd"}</div>})}
                  {memberAppointments.map(item=>{const start=localParts(item.starts_at,timezone);if(start.date!==date)return null;const top=(toMinute(start.time)-startMinute)*pxPerMinute;const duration=Math.max(30,(new Date(item.service_ends_at).getTime()-new Date(item.starts_at).getTime())/60_000);return <div key={item.id} className="absolute inset-x-1.5" style={{top,height:Math.max(44,duration*pxPerMinute)}}><AppointmentCard item={item} timezone={timezone} canManage={canManage} selected={selectedId===item.id} onSelect={()=>setSelectedId(item.id)}/></div>})}
                </StaffDropColumn>;
              })}
            </div>
            <DragOverlay dropAnimation={{duration:120,easing:"ease-out"}}>
              {activeAppointment?<AppointmentVisual item={activeAppointment} timezone={timezone} overlay/>:null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
    <AppointmentPanel item={selected} timezone={timezone}/>
  </div>;
}
