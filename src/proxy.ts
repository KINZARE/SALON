import { NextResponse, type NextRequest } from "next/server";

// This workspace deliberately uses a no-login server context. Session refresh
// remains in lib/supabase/session-refresh.ts for the future authenticated release.
export function proxy(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/app/:path*", "/login", "/signup", "/onboarding"],
};
