import { NextResponse } from "next/server";
import { getSmartBookingLinkAvailability } from "@/services/smart-booking-links";

export const dynamic="force-dynamic";

export async function GET(request:Request,{params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  const date=new URL(request.url).searchParams.get("date")??"";
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return NextResponse.json({error:"Ongeldige datum."},{status:400});
  try{
    const data=await getSmartBookingLinkAvailability(token,date);
    return NextResponse.json({slots:data.slots});
  }catch{
    return NextResponse.json({error:"Deze booking link is niet meer geldig."},{status:410});
  }
}
