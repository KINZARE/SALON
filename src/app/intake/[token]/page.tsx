import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { ConditionalIntakeFields } from "@/components/intake/conditional-intake-fields";
import { getPublicIntakeContext } from "@/services/intake";
import { submitIntakeAction } from "./actions";

export const dynamic="force-dynamic";

export default async function IntakePublicPage({params,searchParams}:{params:Promise<{token:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {token}=await params;const query=await searchParams;
  if(query.done==="1")return <main className="min-h-screen bg-[var(--background)] px-5 py-10"><div className="mx-auto max-w-xl rounded-[16px] border border-[var(--border)] bg-white p-6 text-center sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--primary)]">ORSIRA</p><div className="mx-auto mt-5 grid h-11 w-11 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">✓</div><h1 className="mt-4 font-display text-2xl">Formulier ontvangen</h1><p className="mt-2 text-sm text-[var(--muted)]">De salon heeft je antwoorden en eventuele toestemming veilig ontvangen.</p></div></main>;
  const context=await getPublicIntakeContext(token);if(!context)notFound();
  const action=submitIntakeAction.bind(null,token);
  const error=typeof query.error==="string"?query.error:null;
  const date=formatInTimeZone(new Date(context.appointment.starts_at),context.salon.timezone,"EEEE d MMMM · HH:mm");

  return <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:py-10">
    <div className="mx-auto max-w-xl rounded-[16px] border border-[var(--border)] bg-white p-5 sm:p-8">
      <header className="border-b border-[var(--border)] pb-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--primary)]">ORSIRA · {context.salon.name}</p><h1 className="mt-2 font-display text-2xl tracking-[-.03em]">{context.snapshot.title}</h1><p className="mt-2 text-sm text-[var(--muted)]">{context.snapshot.description||"Vul dit formulier in ter voorbereiding op je afspraak."}</p><p className="mt-4 text-xs text-[var(--muted)]">{context.appointment.service_name_snapshot} · {date}</p></header>
      {error?<p role="alert" className="mt-5 rounded-[10px] border border-[#e8c8c3] bg-[#fbefed] p-3 text-sm text-[var(--danger)]">{error}</p>:null}
      <form action={action} className="mt-6 grid gap-5">
        <label className="grid gap-1.5 text-sm font-medium"><span>Naam</span><input name="customerName" defaultValue={context.appointment.customer_name_snapshot??""} required maxLength={160} className="h-11 rounded-[10px] border border-[var(--border)] bg-white px-3.5 outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]"/></label>
        <ConditionalIntakeFields fields={context.snapshot.fields}/>
        {context.snapshot.consentStatement?<label className="flex items-start gap-3 rounded-[10px] bg-[var(--surface-soft)] p-4 text-sm leading-6"><input className="mt-1" type="checkbox" name="__consent" required/><span>{context.snapshot.consentStatement}</span></label>:null}
        <button className="h-12 rounded-[10px] bg-[var(--primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">Versturen</button>
      </form>
    </div>
  </main>;
}
