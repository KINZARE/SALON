import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function getServiceCategoryWorkspace(salonId:string){
  const db=createAdminSupabaseClient();
  const [categories,assignments]=await Promise.all([
    db.from("service_categories").select("id,name,sort_order,active").eq("salon_id",salonId).order("sort_order").order("name"),
    db.from("services").select("id,category_id").eq("salon_id",salonId),
  ]);
  if(categories.error)throw categories.error;
  if(assignments.error)throw assignments.error;
  return{categories:categories.data??[],categoryByService:new Map((assignments.data??[]).map(row=>[row.id,row.category_id]))};
}
