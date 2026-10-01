"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

export function createBrowserSupabaseClient() {
  const { url, anonKey } = getPublicEnv();
  return createBrowserClient(url, anonKey);
}
