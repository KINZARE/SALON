import { NextResponse } from "next/server";
import { requireAppContext } from "@/lib/auth";
import { isUuid } from "@/lib/validation";
import { issueAppointmentIntakeToken } from "@/services/intake";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  if(!isUuid(id))return NextResponse.json({error:"Ongeldige afspraak."},{status:400});
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))return NextResponse.json({error:"Geen toegang."},{status:403});
  const body=await request.json().catch(()=>null) as {formId?:string}|null;
  if(!body?.formId||!isUuid(body.formId))return NextResponse.json({error:"Kies een geldig formulier."},{status:400});
  try{
    const result=await issueAppointmentIntakeToken({salonId:salon.id,appointmentId:id,formId:body.formId});
    return NextResponse.json({path:`/intake/${result.token}`,expiresAt:result.expiresAt});
  }catch{
    return NextResponse.json({error:"Intakelink kon niet worden gemaakt."},{status:400});
  }
}
