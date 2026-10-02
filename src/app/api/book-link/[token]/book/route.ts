import { NextResponse } from "next/server";
import { isUuid } from "@/lib/validation";
import { bookSmartBookingLink } from "@/services/smart-booking-links";

export async function POST(request:Request,{params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  let body:Record<string,unknown>;
  try{body=await request.json() as Record<string,unknown>}catch{return NextResponse.json({error:"Ongeldige aanvraag."},{status:400})}
  const startsAt=typeof body.startsAt==="string"?body.startsAt:"";
  const staffId=typeof body.staffId==="string"&&body.staffId?body.staffId:null;
  const customer=body.customer&&typeof body.customer==="object"?body.customer as Record<string,unknown>:{};
  const name=typeof customer.name==="string"?customer.name.trim():"";
  const phone=typeof customer.phone==="string"?customer.phone.trim():"";
  const email=typeof customer.email==="string"?customer.email.trim():"";
  const note=typeof customer.note==="string"?customer.note.trim():null;
  if(Number.isNaN(Date.parse(startsAt))||(staffId&&!isUuid(staffId))||!name||!phone||!email)return NextResponse.json({error:"Vul alle verplichte gegevens in."},{status:400});
  try{
    const result=await bookSmartBookingLink(token,{staffId,startsAt,customer:{name,phone,email,note}});
    return NextResponse.json(result);
  }catch(error){
    const message=error instanceof Error?error.message:"";
    const conflict=message.includes("SLOT_");
    return NextResponse.json({error:conflict?"Dit tijdstip is net niet meer beschikbaar. Kies een ander tijdstip.":"Boeken via deze link is niet gelukt."},{status:conflict?409:400});
  }
}
