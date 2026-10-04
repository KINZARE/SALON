import { test as base, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { formatInTimeZone } from "date-fns-tz";

export const test = base.extend({
  runtimeErrors: [async ({ page }, provide, testInfo) => {
    const errors=[];
    page.on("console", message => {if(message.type()==="error")errors.push(`console: ${message.text()}`)});
    page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
    await provide(errors);
    if(testInfo.status!==testInfo.expectedStatus) {
      await testInfo.attach("page-url",{body:page.url(),contentType:"text/plain"});
      await testInfo.attach("console-errors",{body:JSON.stringify(errors,null,2),contentType:"application/json"});
    }
  },{auto:true}],
  qaCalendarDate: async ({},provide) => {
    if(process.env.QA_CALENDAR_DATE) {await provide(process.env.QA_CALENDAR_DATE);return}
    const db=qaDatabase();
    const {data:salon,error:salonError}=await db.from("salons").select("id,timezone").eq("slug","salon").single();
    if(salonError)throw salonError;
    const {data,error}=await db.from("appointments").select("starts_at").eq("salon_id",salon.id).in("status",["pending","confirmed","checked_in"]).order("starts_at",{ascending:false}).limit(1);
    if(error)throw error;
    if(!data?.length)throw new Error("QA requires one active appointment or explicit QA_CALENDAR_DATE; never assume today has appointments.");
    await provide(formatInTimeZone(new Date(data[0].starts_at),salon.timezone,"yyyy-MM-dd"));
  },
});
export {expect};
export function qaDatabase(){
  if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw new Error("QA database configuration missing");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}
