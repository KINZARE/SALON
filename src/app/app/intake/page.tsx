import { requireAppContext } from "@/lib/auth";
import { getServices } from "@/services/app-data";
import { getIntakeForms } from "@/services/product-completion";
import { IntakeFormEditor } from "@/components/workspace/intake-form-editor";
import { saveIntakeForm } from "./actions";

export default async function IntakePage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))return <div><h1 className="text-3xl font-semibold">Geen toegang</h1><p className="mt-2 text-sm text-[var(--muted)]">Intakeformulieren worden beheerd door owner of manager.</p></div>;
  const [forms,services,query]=await Promise.all([getIntakeForms(salon.id),getServices(salon.id),searchParams]);
  const error=typeof query.error==="string"?query.error:null;

  return <div data-intake-workspace>
    <header>
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--accent)]">Intake</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-[36px]">Formulieren & toestemming</h1>
      <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">Maak korte formulieren per behandeling. Antwoorden blijven gekoppeld aan afspraak, klant en formulierversie.</p>
    </header>
    {error?<p role="alert" className="mt-5 rounded-[14px] border border-[#e8c8c3] bg-[#fbefed] p-3.5 text-sm text-[var(--danger)]">{error}</p>:null}

    <div className="mt-7 grid gap-3">
      {forms.map(form=><details key={form.id} className="group overflow-hidden rounded-[22px] border border-[var(--border)] bg-white">
        <summary className="flex cursor-pointer list-none items-center gap-4 p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><p className="truncate font-semibold">{form.title}</p>{!form.active?<span className="rounded-full bg-[#efeeeb] px-2 py-0.5 text-[9px] font-semibold text-[#77736d]">Inactief</span>:null}</div>
            <p className="mt-1 text-sm text-[var(--muted)]">{form.fields.length} velden · {form.service_ids.length} behandelingen · versie {form.version}</p>
          </div>
          <span className="text-[var(--muted)] transition group-open:rotate-180">⌄</span>
        </summary>
        <div className="border-t border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:p-5"><IntakeFormEditor item={form} services={services} action={saveIntakeForm}/></div>
      </details>)}
      {!forms.length?<div className="rounded-[22px] border border-dashed border-[var(--border-strong)] bg-white p-8 text-center"><p className="font-semibold">Nog geen intakeformulieren</p><p className="mt-1 text-sm text-[var(--muted)]">Maak alleen een formulier wanneer het de voorbereiding van een behandeling echt verbetert.</p></div>:null}
    </div>

    <section className="mt-10 max-w-3xl">
      <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--muted)]">Nieuw</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.04em]">Formulier toevoegen</h2></div>
      <IntakeFormEditor services={services} action={saveIntakeForm}/>
    </section>
  </div>;
}
