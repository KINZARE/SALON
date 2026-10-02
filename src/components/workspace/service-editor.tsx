import { Button } from "@/components/ui/button";
import { Field,TextAreaField } from "@/components/ui/field";

type Staff={id:string;name:string;active:boolean};
type Category={id:string;name:string;active:boolean};
type ServiceItem={id:string;name:string;description:string|null;duration_minutes:number;buffer_minutes:number;price_cents:number;currency:string;active:boolean;online_bookable:boolean;payment_mode:"none"|"pay_in_salon"|"deposit"|"full_payment";deposit_cents:number|null;staff_ids:string[];category_id:string|null};

export function ServiceEditor({item,staff,categories,action}:{item?:ServiceItem;staff:Staff[];categories:Category[];action:(formData:FormData)=>void|Promise<void>}){
  const mode=item?.payment_mode==="none"?"pay_in_salon":item?.payment_mode??"pay_in_salon";
  return <form data-service-editor action={action} className="grid min-w-0 max-w-full gap-6">
    {item?<input type="hidden" name="id" value={item.id}/>:null}
    <section className="grid min-w-0 max-w-full gap-4 rounded-[22px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div><h3 className="font-semibold">{item?"Behandeling bewerken":"Nieuwe behandeling"}</h3><p className="mt-1 text-xs text-[var(--muted)]">Prijs, tijd, categorie en boekbaarheid op één plek.</p></div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Field label="Naam" name="name" required maxLength={120} defaultValue={item?.name??""}/>
        <label className="grid gap-1.5 text-sm font-medium"><span>Categorie</span><select name="categoryId" defaultValue={item?.category_id??""} className="h-11 w-full min-w-0 rounded-[13px] border border-[var(--border)] bg-white px-3.5"><option value="">Geen categorie</option>{categories.filter(category=>category.active||category.id===item?.category_id).map(category=><option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        <Field label="Duur (min)" name="duration" type="number" min={5} max={720} defaultValue={item?.duration_minutes??60} required/>
        <Field label="Buffer (min)" name="buffer" type="number" min={0} max={180} defaultValue={item?.buffer_minutes??0} required/>
        <Field label="Prijs (€)" name="price" inputMode="decimal" defaultValue={item?(item.price_cents/100).toFixed(2).replace(".",","):"65,00"} required/>
      </div>
      <TextAreaField label="Beschrijving" name="description" maxLength={600} rows={3} defaultValue={item?.description??""}/>
      <div className="flex flex-wrap gap-5">
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={item?.active??true}/> Actief</label>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="onlineBookable" defaultChecked={item?.online_bookable??true}/> Online boekbaar</label>
      </div>
    </section>
    <section className="min-w-0 max-w-full rounded-[22px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div><h3 className="font-semibold">No-show bescherming</h3><p className="mt-1 text-xs text-[var(--muted)]">Configureer de betaalregel zonder de boekingsflow zwaarder te maken.</p></div>
      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium"><span>Betaalregel</span><select name="paymentMode" defaultValue={mode} className="h-11 w-full min-w-0 rounded-[13px] border border-[var(--border)] bg-white px-3.5"><option value="pay_in_salon">Betalen in salon</option><option value="deposit">Vaste aanbetaling</option><option value="full_payment">Volledig vooraf</option></select></label>
        <Field label="Aanbetaling (€)" name="deposit" inputMode="decimal" placeholder="Bijv. 20,00" defaultValue={item?.deposit_cents?(item.deposit_cents/100).toFixed(2).replace(".",","):""} hint="Alleen gebruikt bij ‘Vaste aanbetaling’."/>
      </div>
    </section>
    <section className="min-w-0 max-w-full rounded-[22px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div><h3 className="font-semibold">Medewerkers</h3><p className="mt-1 text-xs text-[var(--muted)]">Wie mag deze behandeling uitvoeren?</p></div>
      <div className="mt-4 grid min-w-0 gap-2 lg:grid-cols-2">{staff.filter(member=>member.active||item?.staff_ids.includes(member.id)).map(member=><label key={member.id} className="flex min-h-11 min-w-0 items-center gap-3 rounded-[13px] border border-[var(--border)] bg-[var(--background)] px-3 text-sm"><input type="checkbox" name="staffIds" value={member.id} defaultChecked={item?.staff_ids.includes(member.id)??false}/><span className="min-w-0 break-words">{member.name}</span></label>)}</div>
    </section>
    <div><Button variant={item?"secondary":"primary"} size="lg">{item?"Wijzigingen opslaan":"Behandeling toevoegen"}</Button></div>
  </form>;
}
