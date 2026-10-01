import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createUserSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type AppContext = {
  user: { id: string; email?: string };
  membership: { salonId: string; role: "owner" | "manager" | "staff" };
  salon: { id: string; name: string; slug: string; timezone: string; currency: string };
};

export async function requireUser() {
  const supabase = await createUserSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/app/today");
  return { supabase, user: data.user };
}

export const requireAppContext = cache(async (): Promise<AppContext> => {
  const db = createAdminSupabaseClient();
  const salonResult = await db
    .from("salons")
    .select("id,name,slug,timezone,currency")
    .eq("slug", "salon")
    .single();
  if (salonResult.error) throw salonResult.error;

  return {
    user: { id: "00000000-0000-0000-0000-000000000000" },
    membership: { salonId: salonResult.data.id, role: "owner" },
    salon: salonResult.data,
  } as AppContext;
});
