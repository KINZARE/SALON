import { NextResponse } from "next/server";
import { requireAppContext } from "@/lib/auth";
import { isUuid } from "@/lib/validation";
import { issueCustomerSelfServiceToken } from "@/services/customer-self-service";

export async function POST(_request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if(!isUuid(id)) return NextResponse.json({error:"Ongeldige afspraak."},{status:400});
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role)) return NextResponse.json({error:"Geen toegang."},{status:403});
  try{
    const result=await issueCustomerSelfServiceToken(salon.id,id);
    return NextResponse.json({path:`/manage/${result.token}`,expiresAt:result.expiresAt});
  }catch(error){
    const message=error instanceof Error?error.message:"UNKNOWN";
    return NextResponse.json({error:message.includes("ELIGIBLE")?"Deze afspraak kan geen klantlink krijgen.":"Klantlink kon niet worden gemaakt."},{status:400});
  }
}
