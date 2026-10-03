import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { resolveReportRange } from "@/domain/reporting";
import { formatMoney } from "@/lib/format";
import { buildReportSummary,getReportAppointments,getReturningCustomerIds } from "@/services/reports";

type Preset="this_week"|"this_month"|"previous_month"|"last30"|"custom";
const presets:[Preset,string][]=[
  ["this_week","Deze week"],
  ["this_month","Deze maand"],
  ["previous_month","Vorige maand"],
  ["last30","Laatste 30 dagen"],
];

export default async function ReportsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const {salon,membership}=await requireAppContext();
  if(membership.role==="staff")return <div><h1 className="text-3xl font-semibold tracking-[-0.04em]">Geen toegang</h1><p className="mt-2 text-sm text-[var(--muted)]">Rapportage is alleen beschikbaar voor owner en manager.</p></div>;

  const query=await searchParams;
  const preset=(query.preset==="this_week"||query.preset==="previous_month"||query.preset==="last30"||query.preset==="custom"?"".concat(query.preset):"this_month") as Preset;
  const today=formatInTimeZone(new Date(),salon.timezone,"yyyy-MM-dd");
  let range;
  let rangeError:string|null=null;
  try{
    range=resolveReportRange({
      preset,
      today,
      from:typeof query.from==="string"?query.from:undefined,
      to:typeof query.to==="string"?query.to:undefined,
    });
  }catch{
    range=resolveReportRange({preset:"this_month",today});
    rangeError="De gekozen periode was ongeldig. Deze maand wordt getoond.";
  }

  const rows=await getReportAppointments({salonId:salon.id,timezone:salon.timezone,from:range.from,toExclusive:range.toExclusive});
  const customerIds=[...new Set(rows.map(row=>row.customer_id))];
  const returning=await getReturningCustomerIds({salonId:salon.id,timezone:salon.timezone,before:range.from,customerIds});
  const summary=buildReportSummary(rows,returning);
  const metrics=[
    [formatMoney(summary.revenueCents,salon.currency),"omzet afgerond"],
    [String(summary.appointments),"afspraken"],
    [String(summary.completed),"afgerond"],
    [formatMoney(summary.averageCents,salon.currency),"gem. afspraak"],
    [String(summary.cancellations),"annuleringen"],
    [String(summary.noShows),"no-shows"],
    [String(summary.newCustomers),"nieuwe klanten"],
    [String(summary.returningCustomers),"terugkerend"],
    [`${summary.repeatRate}%`,"terugkeerpercentage"],
  ];
  const exportParams=new URLSearchParams({preset,from:range.from,to:range.to});

  return <div data-reports-workspace>
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--primary)]">Reports</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-[36px]">Rapportage</h1><p className="mt-1 text-sm text-[var(--muted)]">Operationele cijfers voor de gekozen periode, zonder BI-overload.</p></div>
      <a href={`/api/internal/reports/export?${exportParams.toString()}`} className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[var(--border)] bg-white px-4 text-sm font-semibold hover:bg-[var(--surface-soft)]">CSV exporteren</a>
    </header>

    {rangeError?<p role="alert" className="mt-5 rounded-[10px] border border-[#e8c8c3] bg-[#fbefed] p-3.5 text-sm text-[var(--danger)]">{rangeError}</p>:null}

    <section className="mt-6 rounded-[16px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap gap-2">
        {presets.map(([value,label])=><Link key={value} href={`/app/reports?preset=${value}`} className={`inline-flex min-h-10 items-center rounded-[10px] px-3 text-xs font-semibold ${preset===value?"bg-[var(--primary)] text-white":"border border-[var(--border)] bg-white text-[var(--muted)] hover:bg-[var(--surface-soft)]"}`}>{label}</Link>)}
      </div>
      <form method="get" className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <input type="hidden" name="preset" value="custom"/>
        <label className="grid gap-1.5 text-sm font-medium"><span>Van</span><input name="from" type="date" defaultValue={preset==="custom"?range.from:""} className="h-11 min-w-0 rounded-[10px] border border-[var(--border)] bg-white px-3 outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]"/></label>
        <label className="grid gap-1.5 text-sm font-medium"><span>Tot en met</span><input name="to" type="date" defaultValue={preset==="custom"?range.to:""} className="h-11 min-w-0 rounded-[10px] border border-[var(--border)] bg-white px-3 outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]"/></label>
        <button className="h-11 rounded-[10px] bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">Toepassen</button>
      </form>
      <p className="mt-3 text-xs text-[var(--muted)]">{new Intl.DateTimeFormat("nl-NL",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(`${range.from}T12:00:00Z`))} – {new Intl.DateTimeFormat("nl-NL",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(`${range.to}T12:00:00Z`))}</p>
    </section>

    <section className="mt-5 overflow-hidden rounded-[16px] border border-[var(--border)] bg-white" aria-label="Kerncijfers">
      <div className="grid grid-cols-2 sm:grid-cols-3">{metrics.map(([value,label],index)=><div key={label} className={`min-w-0 px-4 py-4 sm:px-5 ${index%2!==0?"border-l border-[var(--border)] sm:border-l-0":""} ${index%3!==0?"sm:border-l sm:border-[var(--border)]":""} ${index>=2?"border-t border-[var(--border)] sm:border-t-0":""} ${index>=3?"sm:border-t sm:border-[var(--border)]":""}`}><p className="truncate text-xl font-semibold tracking-[-.04em] sm:text-2xl">{value}</p><p className="mt-1 text-xs text-[var(--muted)]">{label}</p></div>)}</div>
    </section>

    <div className="mt-7 grid gap-5 xl:grid-cols-2">
      <Breakdown title="Per behandeling" rows={summary.services} currency={salon.currency}/>
      <Breakdown title="Per medewerker" rows={summary.staff} currency={salon.currency}/>
    </div>

    <p className="mt-5 max-w-2xl text-xs leading-5 text-[var(--muted)]">Omzet telt alleen afgeronde afspraken. Nieuwe klanten hebben vóór deze periode nog geen afspraak in deze salon; overige unieke klanten tellen als terugkerend.</p>
  </div>;
}

function Breakdown({title,rows,currency}:{title:string;rows:Array<{name:string;appointments:number;completed:number;revenueCents:number}>;currency:string}){
  return <section className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-white">
    <div className="border-b border-[var(--border)] px-4 py-4 sm:px-5"><h2 className="font-semibold">{title}</h2></div>
    <div className="divide-y divide-[var(--border)]">
      {rows.slice(0,20).map(row=><div key={row.name} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-4 py-3.5 sm:px-5">
        <div className="min-w-0"><p className="truncate text-sm font-semibold">{row.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{row.appointments} afspraken · {row.completed} afgerond</p></div>
        <p className="self-center text-sm font-semibold">{formatMoney(row.revenueCents,currency)}</p>
      </div>)}
      {!rows.length?<p className="px-5 py-8 text-sm text-[var(--muted)]">Geen data in deze periode.</p>:null}
    </div>
  </section>;
}
