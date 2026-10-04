import { NextResponse } from "next/server";
import { BookingLinkBookingSchema } from "@/lib/schemas";
import { bookSmartBookingLink } from "@/services/smart-booking-links";

export async function POST(request:Request,{params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  let body:Record<string,unknown>;
  try{body=await request.json() as Record<string,unknown>}catch{return NextResponse.json({error:"Ongeldige aanvraag."},{status:400})}
  const parsed=BookingLinkBookingSchema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:"Ongeldige aanvraag. Controleer de gegevens."},{status:400});
  const {staffId,startsAt,customer}=parsed.data;
  try{
    const result=await bookSmartBookingLink(token,{staffId,startsAt,customer});
    return NextResponse.json(result);
  }catch(error){
    const message=error instanceof Error?error.message:"";
    const conflict=message.includes("SLOT_");
    return NextResponse.json({error:conflict?"Dit tijdstip is net niet meer beschikbaar. Kies een ander tijdstip.":"Boeken via deze link is niet gelukt."},{status:conflict?409:400});
  }
}
