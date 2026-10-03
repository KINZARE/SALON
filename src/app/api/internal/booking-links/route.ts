import { NextResponse } from "next/server";
import { requireAppContext } from "@/lib/auth";
import { BookingLinkSchema } from "@/lib/schemas";
import { createSmartBookingLink } from "@/services/smart-booking-links";

export async function POST(request:Request){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))return NextResponse.json({error:"Geen toegang."},{status:403});
  let body:Record<string,unknown>;
  try{body=await request.json() as Record<string,unknown>}catch{return NextResponse.json({error:"Ongeldige aanvraag."},{status:400})}
  const parsed=BookingLinkSchema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:"Ongeldige selectie of datumbereik."},{status:400});
  const {serviceId,staffId,startDate,endDate}=parsed.data;

  try{
    const result=await createSmartBookingLink(salon.id,{serviceId,staffId,startDate,endDate});
    return NextResponse.json({path:`/book-link/${result.token}`,expiresAt:result.expiresAt});
  }catch(error){
    const message=error instanceof Error?error.message:"";
    const friendly=message.includes("PAST")?"Kies vandaag of later.":message.includes("WINDOW")?"Kies een geldig datumbereik.":message.includes("STAFF")?"Deze medewerker kan deze behandeling niet uitvoeren.":"Booking link kon niet worden gemaakt.";
    return NextResponse.json({error:friendly},{status:400});
  }
}
