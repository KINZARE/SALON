import { NextResponse } from "next/server";
import { WaitlistSchema } from "@/lib/schemas";
import { joinPublicWaitlist } from "@/services/waitlist";

export async function POST(request:Request,{params}:{params:Promise<{salonSlug:string}>}){
  const {salonSlug}=await params;
  let body:Record<string,unknown>;
  try{body=await request.json() as Record<string,unknown>;}catch{return NextResponse.json({error:"Ongeldige aanvraag."},{status:400});}

  const parsed=WaitlistSchema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:"Controleer de gekozen dag en je contactgegevens."},{status:400});
  const {serviceId,staffId,date,customer}=parsed.data;

  try{
    const id=await joinPublicWaitlist({
      salonSlug,
      serviceId,
      staffId,
      date,
      customer,
    });
    return NextResponse.json({ok:true,id});
  }catch(error){
    const message=error instanceof Error?error.message:"UNKNOWN";
    const bad=["INVALID_WAITLIST_REQUEST","INVALID_WAITLIST_DATE","SERVICE_NOT_FOUND","STAFF_NOT_ELIGIBLE"].some(code=>message.includes(code));
    if(!bad)console.error("waitlist_join_failed",{message});
    return NextResponse.json({error:bad?"Controleer de gekozen dag en je contactgegevens.":"Aanmelden op de wachtlijst is niet gelukt."},{status:bad?400:500});
  }
}
