import { NextResponse } from "next/server";
import { isUuid } from "@/lib/validation";
import { joinPublicWaitlist } from "@/services/waitlist";

export async function POST(request:Request,{params}:{params:Promise<{salonSlug:string}>}){
  const {salonSlug}=await params;
  let body:Record<string,unknown>;
  try{body=await request.json() as Record<string,unknown>;}catch{return NextResponse.json({error:"Ongeldige aanvraag."},{status:400});}

  const serviceId=typeof body.serviceId==="string"?body.serviceId:"";
  const staffId=typeof body.staffId==="string"&&body.staffId?body.staffId:null;
  const date=typeof body.date==="string"?body.date:"";
  const customer=body.customer&&typeof body.customer==="object"?body.customer as Record<string,unknown>:{};
  if(!isUuid(serviceId)||(staffId&&!isUuid(staffId)))return NextResponse.json({error:"Ongeldige aanvraag."},{status:400});

  try{
    const id=await joinPublicWaitlist({
      salonSlug,
      serviceId,
      staffId,
      date,
      customer:{
        name:typeof customer.name==="string"?customer.name:"",
        phone:typeof customer.phone==="string"?customer.phone:null,
        email:typeof customer.email==="string"?customer.email:null,
      },
    });
    return NextResponse.json({ok:true,id});
  }catch(error){
    const message=error instanceof Error?error.message:"UNKNOWN";
    const bad=["INVALID_WAITLIST_REQUEST","INVALID_WAITLIST_DATE","SERVICE_NOT_FOUND","STAFF_NOT_ELIGIBLE"].some(code=>message.includes(code));
    if(!bad)console.error("waitlist_join_failed",{message});
    return NextResponse.json({error:bad?"Controleer de gekozen dag en je contactgegevens.":"Aanmelden op de wachtlijst is niet gelukt."},{status:bad?400:500});
  }
}
