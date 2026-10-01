import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getCustomerById, searchCustomers } from "@/services/workspace-data";
import { isUuid } from "@/lib/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  const id = url.searchParams.get("id");
  const db = createAdminSupabaseClient();
  const salon = await db.from("salons").select("id").eq("slug","salon").single();
  if (!salon.data) return NextResponse.json({ error: "Salon niet gevonden." }, { status: 404 });
  const salonId = salon.data.id;

  if (id) {
    if (!isUuid(id)) return NextResponse.json({ error: "Ongeldige klant." }, { status: 400 });
    const customer = await getCustomerById(salonId, id);
    return customer ? NextResponse.json({ customer }, { headers: { "Cache-Control": "no-store" } }) : NextResponse.json({ error: "Klant niet gevonden." }, { status: 404 });
  }
  if (query.length < 2) return NextResponse.json({ customers: [] }, { headers: { "Cache-Control": "no-store" } });
  const customers = await searchCustomers(salonId, query);
  return NextResponse.json({ customers }, { headers: { "Cache-Control": "no-store" } });
}
