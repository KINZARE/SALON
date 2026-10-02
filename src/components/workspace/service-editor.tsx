import { Button } from "@/components/ui/button";
import { Field, TextAreaField } from "@/components/ui/field";

type Staff={id:string;name:string;active:boolean};
type ServiceItem={
  id:string;
  name:string;
  description:string|null;
  duration_minutes:number;
  buffer_minutes:number;
  price_cents:number;
  currency:string;
  active:boolean;
  online_bookable:boolean;
  staff_ids:string[];
};

export function ServiceEditor({item,staff,action}:{item?:ServiceItem;staff:Staff[];action:(formData:FormData)=>void|Promise<void>}){
  return <form data-service-editor action={action} className="grid gap-6">
    {item?<input type="hidden" name="id" value={item.id}/>:null}
    <section className="grid gap-4 rounded-[22px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div><h3 className="font-semibold">{item?"Behandeling bewerken":"Nieuwe behandeling"}</h3><p className="mt-1 text-xs text-[var(--muted)]">Prijs, tijd en boekbaarheid op één plek.</p></div>
      <Field label="Naam" name="name" required maxLength={120} defaultValue={item?.name??""}/>
      <div className="grid gap-4 sm:grid-cols-3">
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

    <section className="rounded-[22px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div><h3 className="font-semibold">Medewerkers</h3><p className="mt-1 text-xs text-[var(--muted)]">Wie mag deze behandeling uitvoeren?</p></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">{staff.filter(member=>member.active||item?.staff_ids.includes(member.id)).map(member=><label key={member.id} className="flex min-h-11 items-center gap-3 rounded-[13px] border border-[var(--border)] bg-[var(--background)] px-3 text-sm"><input type="checkbox" name="staffIds" value={member.id} defaultChecked={item?.staff_ids.includes(member.id)??false}/><span>{member.name}</span></label>)}</div>
    </section>

    <div><Button variant={item?"secondary":"primary"} size="lg">{item?"Wijzigingen opslaan":"Behandeling toevoegen"}</Button></div>
  </form>;
}
