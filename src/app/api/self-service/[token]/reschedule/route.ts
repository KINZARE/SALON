import { NextResponse } from "next/server";
import { SelfServiceRescheduleSchema } from "@/lib/schemas";
import { rescheduleCustomerSelfService } from "@/services/customer-self-service";

export async function POST(request:Request,{params}:{params:Promise<{token:string}>}) {
  const {token}=await params;
  let body:Record<string,unknown>;
  try{body=await request.json() as Record<string,unknown>}catch{return NextResponse.json({error:"Ongeldige aanvraag."},{status:400})}
  const parsed=SelfServiceRescheduleSchema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:"Ongeldige aanvraag. Controleer de gegevens."},{status:400});
  const {staffId,startsAt}=parsed.data;
  try{
    await rescheduleCustomerSelfService(token,staffId,startsAt);
    return NextResponse.json({ok:true});
  }catch(error){
    const message=error instanceof Error?error.message:"";
    const conflict=message.includes("SLOT_");
    return NextResponse.json({error:conflict?"Dit tijdstip is niet meer beschikbaar. Kies een ander tijdstip.":"De afspraak kan niet worden verplaatst."},{status:conflict?409:400});
  }
}
