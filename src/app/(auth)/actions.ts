"use server";

import { redirect } from "next/navigation";
import { createUserSupabaseClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createUserSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=Controleer+je+e-mail+en+wachtwoord.");
  redirect("/app/today");
}

export async function signUp(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (name.length < 2 || password.length < 8) redirect("/signup?error=Vul+geldige+gegevens+in.");
  const supabase = await createUserSupabaseClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
  if (error) redirect(`/signup?error=${encodeURIComponent("Registreren is niet gelukt.")}`);
  if (data.session) redirect("/onboarding");
  redirect("/login?message=Controleer+je+e-mail+om+je+account+te+bevestigen.");
}

export async function signOut() {
  const supabase = await createUserSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
