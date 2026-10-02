import { NextResponse } from "next/server";
import { isUuid } from "@/lib/validation";
import { getCustomerSelfServiceAvailability } from "@/services/customer-self-service";

export const dynamic="force-dynamic";

export async function GET(request:Request,{params}:{params:Promise<{token:string}>}) {
  const {token}=await params;
  const url=new URL(request.url);
  const date=url.searchParams.get("date")??"";
  const staffId=url.searchParams.get("staffId");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||(staffId&&!isUuid(staffId))) return NextResponse.json({error:"Ongeldige aanvraag."},{status:400});
  try{
    const availability=await getCustomerSelfServiceAvailability(token,date,staffId);
    return NextResponse.json({slots:availability.slots});
  }catch{
    return NextResponse.json({error:"Deze link is niet meer geldig of de afspraak kan niet worden aangepast."},{status:410});
  }
}
