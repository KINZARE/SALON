import Link from "next/link";
import { requireAppContext } from "@/lib/auth";
import { getWidgetSettings } from "@/services/product-completion";
import { saveWidgetSettings } from "./actions";

export default async function WidgetSettingsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))return <div><h1 className="text-3xl font-semibold">Geen toegang</h1></div>;
  const [settings,query]=await Promise.all([getWidgetSettings(salon.id),searchParams]);
  const error=typeof query.error==="string"?query.error:null;
  const publicPath=`/book/${salon.slug}`;
  const embedPath=`/embed/${salon.slug}`;
  const buttonCode=`<a href="${publicPath}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 18px;border-radius:12px;background:${settings.accent_color};color:#fff;text-decoration:none;font:600 14px system-ui">${settings.button_label}</a>`;
  const iframeCode=`<iframe src="${embedPath}" width="${settings.width}" height="${settings.height}" style="border:0;max-width:100%" loading="lazy" title="Online afspraak maken"></iframe>`;

  return <div data-widget-settings className="max-w-4xl">
    <header><Link href="/app/settings" className="text-xs font-semibold text-[var(--accent-dark)]">← Settings</Link><p className="mt-4 text-xs font-semibold uppercase tracking-[.14em] text-[var(--accent)]">Booking widget</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em]">Boeken op je eigen website</h1><p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">Gebruik dezelfde publieke bookingflow als SALON zelf. Alleen label, accent en formaat zijn aanpasbaar.</p></header>
    {error?<p role="alert" className="mt-5 rounded-[14px] border border-[#e8c8c3] bg-[#fbefed] p-3.5 text-sm text-[var(--danger)]">{error}</p>:null}

    <form action={saveWidgetSettings} className="mt-7 grid gap-4 rounded-[22px] border border-[var(--border)] bg-white p-5 sm:grid-cols-2">
      <label className="grid gap-1.5 text-sm font-medium sm:col-span-2"><span>Knoptekst</span><input name="buttonLabel" defaultValue={settings.button_label} required maxLength={60} className="h-11 rounded-[13px] border border-[var(--border)] px-3.5"/></label>
      <label className="grid gap-1.5 text-sm font-medium"><span>Accentkleur</span><input name="accentColor" type="color" defaultValue={settings.accent_color} className="h-11 w-full rounded-[13px] border border-[var(--border)] bg-white px-2"/></label>
      <div className="grid grid-cols-2 gap-3"><label className="grid gap-1.5 text-sm font-medium"><span>Breedte</span><input name="width" type="number" min={280} max={1200} defaultValue={settings.width} className="h-11 rounded-[13px] border border-[var(--border)] px-3"/></label><label className="grid gap-1.5 text-sm font-medium"><span>Hoogte</span><input name="height" type="number" min={420} max={1400} defaultValue={settings.height} className="h-11 rounded-[13px] border border-[var(--border)] px-3"/></label></div>
      <button className="h-11 rounded-[13px] bg-[var(--ink)] px-4 text-sm font-semibold text-white sm:col-span-2">Widget opslaan</button>
    </form>

    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <CodeBlock title="Knop" value={buttonCode}/>
      <CodeBlock title="Embed" value={iframeCode}/>
    </div>
    <div className="mt-5 flex flex-wrap gap-2"><a href={publicPath} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-[12px] border border-[var(--border)] bg-white px-3 text-xs font-semibold">Publieke booking ↗</a><a href={embedPath} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-[12px] border border-[var(--border)] bg-white px-3 text-xs font-semibold">Embed preview ↗</a></div>
  </div>;
}
function CodeBlock({title,value}:{title:string;value:string}){return <section className="rounded-[22px] border border-[var(--border)] bg-white p-4"><h2 className="text-sm font-semibold">{title}</h2><textarea readOnly value={value} rows={6} onFocus={undefined} className="mt-3 w-full resize-none rounded-[12px] bg-[var(--background)] p-3 font-mono text-[11px] leading-5 text-[var(--muted)]"/></section>}
