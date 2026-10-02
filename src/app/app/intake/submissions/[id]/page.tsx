import Link from "next/link";
import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { getIntakeSubmissionDetail } from "@/services/intake";

export default async function IntakeSubmissionPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))return <div><h1 className="text-3xl font-semibold">Geen toegang</h1></div>;
  const detail=await getIntakeSubmissionDetail(salon.id,id);if(!detail)notFound();
  const answers=(detail.answers??{}) as Record<string,unknown>;
  const fields=detail.snapshot?.fields??[];

  return <div className="max-w-3xl">
    <Link href={`/app/customers/${detail.customer_id}`} className="text-sm text-[var(--muted)]">← Klantprofiel</Link>
    <header className="mt-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--accent)]">Intake</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em]">{detail.formTitle}</h1><p className="mt-1 text-sm text-[var(--muted)]">{detail.customerName} · versie {detail.form_version} · {formatInTimeZone(new Date(detail.submitted_at),salon.timezone,"dd MMM yyyy · HH:mm")}</p></header>
    <section className="mt-7 overflow-hidden rounded-[22px] border border-[var(--border)] bg-white">
      {fields.map((field,index)=><div key={field.id} className={`px-4 py-4 sm:px-5 ${index?"border-t border-[var(--border)]":""}`}><p className="text-xs font-medium text-[var(--muted)]">{field.label}</p><p className="mt-1 whitespace-pre-wrap text-sm font-medium">{formatAnswer(answers[field.id])}</p></div>)}
      {!fields.length?<p className="px-5 py-8 text-sm text-[var(--muted)]">De historische formuliersnapshot is niet beschikbaar.</p>:null}
    </section>
  </div>;
}
function formatAnswer(value:unknown){
  if(value===true)return"Ja";if(value===false)return"Nee";if(value==null||value==="")return"—";return String(value);
}
