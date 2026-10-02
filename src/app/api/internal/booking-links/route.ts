import { NextResponse } from "next/server";
import { requireAppContext } from "@/lib/auth";
import { isUuid } from "@/lib/validation";
import { createSmartBookingLink } from "@/services/smart-booking-links";

export async function POST(request:Request){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))return NextResponse.json({error:"Geen toegang."},{status:403});
  let body:Record<string,unknown>;
  try{body=await request.json() as Record<string,unknown>}catch{return NextResponse.json({error:"Ongeldige aanvraag."},{status:400})}
  const serviceId=typeof body.serviceId==="string"?body.serviceId:"";
  const staffId=typeof body.staffId==="string"&&body.staffId?body.staffId:null;
  const startDate=typeof body.startDate==="string"?body.startDate:"";
  const endDate=typeof body.endDate==="string"?body.endDate:"";
  if(!isUuid(serviceId)||(staffId&&!isUuid(staffId)))return NextResponse.json({error:"Ongeldige selectie."},{status:400});
  try{
    const result=await createSmartBookingLink(salon.id,{serviceId,staffId,startDate,endDate});
    return NextResponse.json({path:`/book-link/${result.token}`,expiresAt:result.expiresAt});
  }catch(error){
    const message=error instanceof Error?error.message:"";
    const friendly=message.includes("PAST")?"Kies vandaag of later.":message.includes("WINDOW")?"Kies een geldig datumbereik.":message.includes("STAFF")?"Deze medewerker kan deze behandeling niet uitvoeren.":"Booking link kon niet worden gemaakt.";
    return NextResponse.json({error:friendly},{status:400});
  }
}
