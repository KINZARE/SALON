import "server-only";
import { redirect } from "next/navigation";
import { createUserSupabaseClient } from "@/lib/supabase/server";

export type AppContext = {
  user: { id: string; email?: string };
  membership: { salonId: string; role: "owner" | "manager" | "staff" };
  salon: { id: string; name: string; slug: string; timezone: string; currency: string };
};

export async function requireUser() {
  const supabase = await createUserSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return { supabase, user: data.user };
}

export async function requireAppContext(): Promise<AppContext> {
  const { supabase, user } = await requireUser();
  const membershipResult = await supabase
    .from("memberships")
    .select("salon_id,role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (membershipResult.error) throw membershipResult.error;
  if (!membershipResult.data) redirect("/onboarding");

  const salonResult = await supabase
    .from("salons")
    .select("id,name,slug,timezone,currency")
    .eq("id", membershipResult.data.salon_id)
    .single();
  if (salonResult.error) throw salonResult.error;

  return {
    user: { id: user.id, email: user.email },
    membership: { salonId: membershipResult.data.salon_id, role: membershipResult.data.role },
    salon: salonResult.data,
  } as AppContext;
}
