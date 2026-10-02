import { NextResponse } from "next/server";
import { isUuid } from "@/lib/validation";
import { rescheduleCustomerSelfService } from "@/services/customer-self-service";

export async function POST(request:Request,{params}:{params:Promise<{token:string}>}) {
  const {token}=await params;
  let body:Record<string,unknown>;
  try{body=await request.json() as Record<string,unknown>}catch{return NextResponse.json({error:"Ongeldige aanvraag."},{status:400})}
  const staffId=typeof body.staffId==="string"?body.staffId:"";
  const startsAt=typeof body.startsAt==="string"?body.startsAt:"";
  if(!isUuid(staffId)||Number.isNaN(Date.parse(startsAt))) return NextResponse.json({error:"Ongeldige aanvraag."},{status:400});
  try{
    await rescheduleCustomerSelfService(token,staffId,startsAt);
    return NextResponse.json({ok:true});
  }catch(error){
    const message=error instanceof Error?error.message:"";
    const conflict=message.includes("SLOT_");
    return NextResponse.json({error:conflict?"Dit tijdstip is niet meer beschikbaar. Kies een ander tijdstip.":"De afspraak kan niet worden verplaatst."},{status:conflict?409:400});
  }
}
