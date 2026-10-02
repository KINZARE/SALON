import { NextResponse } from "next/server";
import { cancelCustomerSelfService } from "@/services/customer-self-service";

export async function POST(_request:Request,{params}:{params:Promise<{token:string}>}) {
  const {token}=await params;
  try{
    await cancelCustomerSelfService(token);
    return NextResponse.json({ok:true});
  }catch{
    return NextResponse.json({error:"De afspraak kan niet meer via deze link worden geannuleerd."},{status:400});
  }
}
