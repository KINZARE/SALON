import { NextResponse } from "next/server";
import { createUserSupabaseClient } from "@/lib/supabase/server";
import { getCustomerById, searchCustomers } from "@/services/workspace-data";
import { isUuid } from "@/lib/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  const id = url.searchParams.get("id");

  const db = await createUserSupabaseClient();
  const user = (await db.auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  const membership = await db.from("memberships").select("salon_id,role").eq("user_id", user.id).limit(1).maybeSingle();
  if (!membership.data || !["owner","manager"].includes(membership.data.role)) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  const salonId = membership.data.salon_id;

  if (id) {
    if (!isUuid(id)) return NextResponse.json({ error: "Ongeldige klant." }, { status: 400 });
    const customer = await getCustomerById(salonId, id);
    return customer ? NextResponse.json({ customer }, { headers: { "Cache-Control": "no-store" } }) : NextResponse.json({ error: "Klant niet gevonden." }, { status: 404 });
  }
  if (query.length < 2) return NextResponse.json({ customers: [] }, { headers: { "Cache-Control": "no-store" } });
  const customers = await searchCustomers(salonId, query);
  return NextResponse.json({ customers }, { headers: { "Cache-Control": "no-store" } });
}
