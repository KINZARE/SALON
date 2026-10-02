import { NextResponse } from "next/server";
import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { escapeCsvCell,resolveReportRange } from "@/domain/reporting";
import { getReportAppointments } from "@/services/reports";

export async function GET(request:Request){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))return NextResponse.json({error:"Geen toegang."},{status:403});
  const url=new URL(request.url);
  const preset=(url.searchParams.get("preset")??"this_month") as "this_week"|"this_month"|"previous_month"|"last30"|"custom";
  const today=formatInTimeZone(new Date(),salon.timezone,"yyyy-MM-dd");
  let range;
  try{
    range=resolveReportRange({preset,today,from:url.searchParams.get("from")??undefined,to:url.searchParams.get("to")??undefined});
  }catch{
    return NextResponse.json({error:"Ongeldige rapportageperiode."},{status:400});
  }
  const rows=await getReportAppointments({salonId:salon.id,timezone:salon.timezone,from:range.from,toExclusive:range.toExclusive});
  const header=["Afspraak ID","Datum","Tijd","Klant","Behandeling","Medewerker","Status","Omzet","Valuta"];
  const lines=[header,...rows.map(row=>[
    row.id,
    formatInTimeZone(new Date(row.starts_at),salon.timezone,"yyyy-MM-dd"),
    formatInTimeZone(new Date(row.starts_at),salon.timezone,"HH:mm"),
    row.customer_name_snapshot??"",
    row.service_name_snapshot,
    row.staff?.name??"",
    row.status,
    (row.status==="completed"?row.price_cents_snapshot/100:0).toFixed(2),
    row.currency_snapshot,
  ])].map(values=>values.map(escapeCsvCell).join(","));
  return new NextResponse("\uFEFF"+lines.join("\r\n"),{
    headers:{
      "Content-Type":"text/csv; charset=utf-8",
      "Content-Disposition":`attachment; filename="salon-rapport-${range.from}-${range.to}.csv"`,
      "Cache-Control":"no-store",
    },
  });
}
