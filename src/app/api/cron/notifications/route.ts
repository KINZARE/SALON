import { NextResponse } from "next/server";
import { isEmailDeliveryConfigured } from "@/services/email-provider";
import { processDueNotificationJobs } from "@/services/notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Notification worker is not configured." }, { status: 503 });

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Fail before claiming. Jobs remain pending until a real provider is configured.
  if (!isEmailDeliveryConfigured()) {
    return NextResponse.json({ error: "Email delivery provider is not configured." }, { status: 503 });
  }

  try {
    const result = await processDueNotificationJobs(20);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("notification_worker_failed", {
      message: error instanceof Error ? error.message : "UNKNOWN",
    });
    return NextResponse.json({ error: "Notification processing failed." }, { status: 500 });
  }
}
