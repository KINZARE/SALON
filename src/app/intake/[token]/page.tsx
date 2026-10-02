import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { getPublicIntakeContext } from "@/services/intake";
import { submitIntakeAction } from "./actions";

export const dynamic="force-dynamic";

export default async function IntakePublicPage({params,searchParams}:{params:Promise<{token:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {token}=await params;const query=await searchParams;
  if(query.done==="1")return <main className="min-h-screen bg-[var(--background)] px-5 py-10"><div className="mx-auto max-w-xl rounded-[24px] border border-[var(--border)] bg-white p-6 text-center sm:p-8"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">✓</div><h1 className="mt-4 text-2xl font-semibold">Formulier ontvangen</h1><p className="mt-2 text-sm text-[var(--muted)]">De salon heeft je antwoorden en eventuele toestemming veilig ontvangen.</p></div></main>;
  const context=await getPublicIntakeContext(token);if(!context)notFound();
  const action=submitIntakeAction.bind(null,token);
  const error=typeof query.error==="string"?query.error:null;
  const date=formatInTimeZone(new Date(context.appointment.starts_at),context.salon.timezone,"EEEE d MMMM · HH:mm");

  return <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:py-10">
    <div className="mx-auto max-w-xl rounded-[24px] border border-[var(--border)] bg-white p-5 sm:p-8">
      <header className="border-b border-[var(--border)] pb-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--accent)]">{context.salon.name}</p><h1 className="mt-2 text-2xl font-semibold tracking-[-.04em]">{context.snapshot.title}</h1><p className="mt-2 text-sm text-[var(--muted)]">{context.snapshot.description||"Vul dit formulier in ter voorbereiding op je afspraak."}</p><p className="mt-4 text-xs text-[var(--muted)]">{context.appointment.service_name_snapshot} · {date}</p></header>
      {error?<p role="alert" className="mt-5 rounded-[13px] border border-[#e8c8c3] bg-[#fbefed] p-3 text-sm text-[var(--danger)]">{error}</p>:null}
      <form action={action} className="mt-6 grid gap-5">
        <label className="grid gap-1.5 text-sm font-medium"><span>Naam</span><input name="customerName" defaultValue={context.appointment.customer_name_snapshot??""} required maxLength={160} className="h-11 rounded-[13px] border border-[var(--border)] bg-white px-3.5"/></label>
        {context.snapshot.fields.map(field=><FieldControl key={field.id} field={field}/>)}
        {context.snapshot.consentStatement?<label className="flex items-start gap-3 rounded-[14px] bg-[var(--surface-soft)] p-4 text-sm leading-6"><input className="mt-1" type="checkbox" name="__consent" required/><span>{context.snapshot.consentStatement}</span></label>:null}
        <button className="h-12 rounded-[14px] bg-[var(--ink)] px-5 text-sm font-semibold text-white">Versturen</button>
      </form>
    </div>
  </main>;
}

function FieldControl({field}:{field:{id:string;label:string;type:string;required:boolean;options:string[]}}){
  const name=`field:${field.id}`;const common="h-11 rounded-[13px] border border-[var(--border)] bg-white px-3.5";
  if(field.type==="long_text")return <label className="grid gap-1.5 text-sm font-medium"><span>{field.label}</span><textarea name={name} required={field.required} rows={4} maxLength={4000} className="rounded-[13px] border border-[var(--border)] bg-white px-3.5 py-3"/></label>;
  if(field.type==="yes_no")return <label className="grid gap-1.5 text-sm font-medium"><span>{field.label}</span><select name={name} required={field.required} className={common}><option value="">Kies</option><option value="yes">Ja</option><option value="no">Nee</option></select></label>;
  if(field.type==="select")return <label className="grid gap-1.5 text-sm font-medium"><span>{field.label}</span><select name={name} required={field.required} className={common}><option value="">Kies</option>{field.options.map(option=><option key={option} value={option}>{option}</option>)}</select></label>;
  if(field.type==="checkbox"||field.type==="consent")return <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name={name} required={field.required}/><span>{field.label}</span></label>;
  return <label className="grid gap-1.5 text-sm font-medium"><span>{field.label}</span><input name={name} type={field.type==="date"?"date":"text"} required={field.required} maxLength={field.type==="short_text"?500:undefined} className={common}/></label>;
}
