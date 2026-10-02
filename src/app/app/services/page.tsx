import { requireAppContext } from "@/lib/auth";
import { getWorkspaceServices } from "@/services/workspace-data";
import { getStaff } from "@/services/app-data";
import { getServiceCategoryWorkspace } from "@/services/service-categories";
import { formatMoney } from "@/lib/format";
import { ServiceEditor } from "@/components/workspace/service-editor";
import { saveCategory,saveService } from "./actions";

export default async function ServicesPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {salon,membership}=await requireAppContext();
  if(membership.role==="staff")return <AccessDenied/>;
  const [baseItems,staff,categoryData,query]=await Promise.all([getWorkspaceServices(salon.id),getStaff(salon.id),getServiceCategoryWorkspace(salon.id),searchParams]);
  const items=baseItems.map(item=>({...item,category_id:categoryData.categoryByService.get(item.id)??null}));
  const error=typeof query.error==="string"?query.error:null;
  const canManage=["owner","manager"].includes(membership.role);
  const groups=[...categoryData.categories.map(category=>({id:category.id,name:category.name,active:category.active,items:items.filter(item=>item.category_id===category.id)})),{id:"uncategorized",name:"Zonder categorie",active:true,items:items.filter(item=>!item.category_id)}].filter(group=>group.items.length>0);

  return <div data-services-workspace className="min-w-0 max-w-full">
    <header className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--accent)]">Services</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-[36px]">Behandelingen</h1><p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">Behandelingen rustig gegroepeerd op categorie, met prijs, tijd en team op dezelfde plek.</p></div>
      <span className="self-start whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[var(--muted)] ring-1 ring-[var(--border)] lg:self-auto">{items.filter(item=>item.active).length} actief</span>
    </header>
    {error?<p role="alert" className="mt-5 rounded-[14px] border border-[#e8c8c3] bg-[#fbefed] p-3.5 text-sm text-[var(--danger)]">{error}</p>:null}
    {canManage?<section className="mt-7 min-w-0 max-w-full rounded-[22px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div><h2 className="font-semibold">Categorieën</h2><p className="mt-1 text-xs text-[var(--muted)]">Gebruik alleen categorieën die de boekingskeuze sneller maken.</p></div>
      <div className="mt-4 grid gap-2">
        {categoryData.categories.map(category=><form key={category.id} action={saveCategory} className="grid gap-2 rounded-[13px] bg-[var(--background)] p-2.5 lg:grid-cols-[minmax(0,1fr)_90px_auto_auto] sm:items-center">
          <input type="hidden" name="id" value={category.id}/><input aria-label="Categorienaam" name="name" defaultValue={category.name} required maxLength={80} className="h-10 w-full min-w-0 rounded-[11px] border border-[var(--border)] bg-white px-3 text-sm"/><input aria-label="Volgorde" name="sortOrder" type="number" min={0} max={10000} defaultValue={category.sort_order} className="h-10 w-full min-w-0 rounded-[11px] border border-[var(--border)] bg-white px-3 text-sm"/><label className="flex min-h-10 items-center gap-2 text-xs"><input type="checkbox" name="active" defaultChecked={category.active}/> Actief</label><button className="h-10 rounded-[11px] border border-[var(--border)] bg-white px-3 text-xs font-semibold hover:bg-[var(--surface-soft)]">Opslaan</button>
        </form>)}
        <form action={saveCategory} className="grid gap-2 rounded-[13px] border border-dashed border-[var(--border-strong)] p-2.5 lg:grid-cols-[minmax(0,1fr)_90px_auto_auto] sm:items-center">
          <input name="name" required maxLength={80} placeholder="Nieuwe categorie" className="h-10 w-full min-w-0 rounded-[11px] border border-[var(--border)] bg-white px-3 text-sm"/><input aria-label="Volgorde" name="sortOrder" type="number" min={0} max={10000} defaultValue={categoryData.categories.length*10} className="h-10 w-full min-w-0 rounded-[11px] border border-[var(--border)] bg-white px-3 text-sm"/><label className="flex min-h-10 items-center gap-2 text-xs"><input type="checkbox" name="active" defaultChecked/> Actief</label><button className="h-10 rounded-[11px] bg-[var(--ink)] px-3 text-xs font-semibold text-white">Toevoegen</button>
        </form>
      </div>
    </section>:null}

    <div className="mt-8 grid min-w-0 gap-8">
      {groups.map(group=><section key={group.id} className="min-w-0 max-w-full">
        <div className="mb-3 flex items-center gap-2"><h2 className="text-sm font-semibold">{group.name}</h2>{!group.active?<span className="text-[10px] text-[var(--muted)]">inactief</span>:null}<span className="text-[10px] text-[var(--muted)]">{group.items.length}</span></div>
        <div className="grid min-w-0 gap-3">{group.items.map(item=><details key={item.id} className="group min-w-0 max-w-full overflow-hidden rounded-[22px] border border-[var(--border)] bg-white">
          <summary className="flex min-w-0 cursor-pointer list-none items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="min-w-0 flex-1"><div className="flex min-w-0 items-center gap-2"><p className="truncate font-semibold">{item.name}</p>{!item.active?<span className="rounded-full bg-[#efeeeb] px-2 py-0.5 text-[9px] font-semibold text-[#77736d]">Inactief</span>:null}</div><p className="mt-1 truncate text-sm text-[var(--muted)]">{item.duration_minutes} min · {item.buffer_minutes} min buffer · {item.online_bookable?"Online boekbaar":"Alleen intern"} · {item.staff_ids.length} medewerkers</p></div>
            <p className="shrink-0 text-sm font-semibold">{formatMoney(item.price_cents,item.currency)}</p><span className="text-[var(--muted)] transition group-open:rotate-180" aria-hidden>⌄</span>
          </summary>
          {canManage?<div className="border-t border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:p-5"><ServiceEditor item={item} staff={staff} categories={categoryData.categories} action={saveService}/></div>:null}
        </details>)}</div>
      </section>)}
      {!items.length?<div className="rounded-[22px] border border-dashed border-[var(--border-strong)] bg-white p-8 text-center"><p className="font-semibold">Nog geen behandelingen</p><p className="mt-1 text-sm text-[var(--muted)]">Voeg de eerste behandeling hieronder toe.</p></div>:null}
    </div>
    {canManage?<section className="mt-10 min-w-0 max-w-3xl"><div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--muted)]">Nieuw</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.04em]">Behandeling toevoegen</h2></div><ServiceEditor staff={staff} categories={categoryData.categories} action={saveService}/></section>:null}
  </div>;
}
function AccessDenied(){return <div><h1 className="text-3xl font-semibold">Geen toegang</h1><p className="mt-2 text-sm text-[var(--muted)]">Services worden beheerd door owner of manager.</p></div>}
