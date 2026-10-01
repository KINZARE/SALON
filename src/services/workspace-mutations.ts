import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function saveWorkspaceEntity(salonId: string, kind: string, payload: Record<string, unknown>) {
  const db = createAdminSupabaseClient();
  const { data, error } = await db.rpc("save_workspace_entity", { p_salon_id: salonId, p_kind: kind, p_payload: payload });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function moveWorkspaceAppointment(args: {
  appointmentId: string;
  staffId: string;
  startsAt: string;
  expectedStartsAt?: string | null;
  expectedStaffId?: string | null;
}) {
  const db = createAdminSupabaseClient();
  const { data, error } = await db.rpc("move_workspace_appointment", {
    p_id: args.appointmentId,
    p_staff_id: args.staffId,
    p_starts_at: args.startsAt,
    p_expected_starts_at: args.expectedStartsAt ?? null,
    p_expected_staff_id: args.expectedStaffId ?? null,
  });
  if (error) throw new Error(error.message);
  return data as string;
}
