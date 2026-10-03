import Link from "next/link";
import { headers } from "next/headers";
import { requireAppContext } from "@/lib/auth";
import { getWidgetSettings } from "@/services/product-completion";
import { saveWidgetSettings } from "./actions";
import { WidgetCodeBlock } from "@/components/workspace/widget-code-block";

export default async function WidgetSettingsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))return <div><h1 className="text-3xl font-semibold">Geen toegang</h1></div>;
  const [settings,query,requestHeaders]=await Promise.all([getWidgetSettings(salon.id),searchParams,headers()]);
  const error=typeof query.error==="string"?query.error:null;
  const publicPath=`/book/${salon.slug}`;
  const embedPath=`/embed/${salon.slug}`;
  const forwardedHost=(requestHeaders.get("x-forwarded-host")??requestHeaders.get("host")??"").split(",")[0].trim();
  const forwardedProto=(requestHeaders.get("x-forwarded-proto")??(forwardedHost.startsWith("localhost")?"http":"https")).split(",")[0].trim();
  const origin=forwardedHost?`${forwardedProto}://${forwardedHost}`:"";
  const publicUrl=`${origin}${publicPath}`;
  const embedUrl=`${origin}${embedPath}`;
  const safeLabel=settings.button_label.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  const buttonCode=`<a href="${publicUrl}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 18px;border-radius:10px;background:${settings.accent_color};color:#fff;text-decoration:none;font:600 14px system-ui">${safeLabel}</a>`;
  const iframeCode=`<iframe src="${embedUrl}" width="${settings.width}" height="${settings.height}" style="border:0;max-width:100%" loading="lazy" title="Online afspraak maken"></iframe>`;

  return <div data-widget-settings className="max-w-4xl">
    <header><Link href="/app/settings" className="text-xs font-semibold text-[var(--primary)]">← Settings</Link><p className="mt-4 text-xs font-semibold uppercase tracking-[.14em] text-[var(--primary)]">Booking widget</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em]">Boeken op je eigen website</h1><p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">Gebruik dezelfde publieke bookingflow als ORSIRA zelf. Alleen label, accent en formaat zijn aanpasbaar.</p></header>
    {error?<p role="alert" className="mt-5 rounded-[10px] border border-[#e8c8c3] bg-[#fbefed] p-3.5 text-sm text-[var(--danger)]">{error}</p>:null}

    <form action={saveWidgetSettings} className="mt-7 grid gap-4 rounded-[16px] border border-[var(--border)] bg-white p-5 sm:grid-cols-2">
      <label className="grid gap-1.5 text-sm font-medium sm:col-span-2"><span>Knoptekst</span><input name="buttonLabel" defaultValue={settings.button_label} required maxLength={60} className="h-11 rounded-[10px] border border-[var(--border)] px-3.5 outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]"/></label>
      <label className="grid gap-1.5 text-sm font-medium"><span>Accentkleur</span><input name="accentColor" type="color" defaultValue={settings.accent_color} className="h-11 w-full rounded-[10px] border border-[var(--border)] bg-white px-2"/></label>
      <div className="grid grid-cols-2 gap-3"><label className="grid gap-1.5 text-sm font-medium"><span>Breedte</span><input name="width" type="number" min={280} max={1200} defaultValue={settings.width} className="h-11 min-w-0 rounded-[10px] border border-[var(--border)] px-3 outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]"/></label><label className="grid gap-1.5 text-sm font-medium"><span>Hoogte</span><input name="height" type="number" min={420} max={1400} defaultValue={settings.height} className="h-11 min-w-0 rounded-[10px] border border-[var(--border)] px-3 outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]"/></label></div>
      <button className="h-11 rounded-[10px] bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] sm:col-span-2">Widget opslaan</button>
    </form>

    <div className="mt-6 grid gap-5 lg:grid-cols-2"><WidgetCodeBlock title="Knop" value={buttonCode}/><WidgetCodeBlock title="Embed" value={iframeCode}/></div>
    <div className="mt-5 flex flex-wrap gap-2"><a href={publicPath} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--border)] bg-white px-3 text-xs font-semibold hover:bg-[var(--surface-soft)]">Publieke booking ↗</a><a href={embedPath} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--border)] bg-white px-3 text-xs font-semibold hover:bg-[var(--surface-soft)]">Embed preview ↗</a></div>
  </div>;
}
