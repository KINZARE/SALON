"use server";

import { redirect } from "next/navigation";
import { createUserSupabaseClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}

function eurosToCents(value: string) {
  const normalized = value.trim().replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : null;
}

export async function bootstrapSalon(formData: FormData) {
  const name = String(formData.get("salonName") ?? "").trim();
  const serviceName = String(formData.get("serviceName") ?? "").trim();
  const staffName = String(formData.get("staffName") ?? "").trim();
  const openTime = String(formData.get("openTime") ?? "09:00");
  const closeTime = String(formData.get("closeTime") ?? "18:00");
  const duration = Number(formData.get("duration") ?? 60);
  const priceCents = eurosToCents(String(formData.get("price") ?? ""));
  const weekdays = formData.getAll("weekdays").map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  if (!name || !serviceName || !staffName || priceCents === null || duration < 5 || weekdays.length === 0) {
    redirect("/onboarding?error=Controleer+de+ingevulde+gegevens.");
  }
  const slugBase = slugify(name) || "salon";
  const slug = `${slugBase}-${crypto.randomUUID().slice(0, 4)}`;
  const supabase = await createUserSupabaseClient();
  const { error } = await supabase.rpc("bootstrap_salon", {
    p_name: name,
    p_slug: slug,
    p_open_time: openTime,
    p_close_time: closeTime,
    p_weekdays: weekdays,
    p_service_name: serviceName,
    p_duration_minutes: duration,
    p_price_cents: priceCents,
    p_staff_name: staffName,
  });
  if (error) {
    console.error("bootstrap_salon_failed", { code: error.code, message: error.message });
    redirect("/onboarding?error=Je+salon+kon+niet+worden+aangemaakt.+Probeer+het+opnieuw.");
  }
  redirect("/app/today");
}
