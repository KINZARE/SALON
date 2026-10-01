import { AppNav } from "@/components/app-shell/nav";
import { OperationalSearch } from "@/components/app-shell/operational-search";
import { requireAppContext } from "@/lib/auth";
import { isPreviewDemoMode } from "@/lib/preview-mode";

export default async function AppLayout({children}:{children:React.ReactNode}){
  const context=await requireAppContext();
  const preview=isPreviewDemoMode();
  const canSearch=context.membership.role!=="staff";
  return <div className="min-h-screen md:pl-56">
    <AppNav role={context.membership.role}/>
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-5 sm:px-6 md:pb-8 md:pt-7">
      {preview?<div role="status" className="mb-5 rounded-[11px] border border-[#ead9ae] bg-[#fffaf0] px-3.5 py-3 text-sm text-[#6b5425]"><strong>Preview mode</strong> · uitsluitend synthetic demo-data; wijzigingen blijven alleen in deze previewsessie.</div>:null}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--muted)]">{context.salon.name}</p>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
          {canSearch?<OperationalSearch/>:null}
          <a href={`/book/${context.salon.slug}`} target="_blank" rel="noreferrer" className="hidden shrink-0 text-sm font-medium text-[var(--primary)] sm:inline">Booking ↗</a>
        </div>
      </div>
      {children}
    </main>
  </div>;
}
