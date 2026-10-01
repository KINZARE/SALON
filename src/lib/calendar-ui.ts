export type AppointmentTone = "blue" | "violet" | "rose" | "amber" | "mint" | "sky" | "success" | "danger" | "muted";
export type StatusTone = "info" | "warning" | "success" | "danger" | "muted";

export function getAppointmentTone(serviceName: string, status: string): AppointmentTone {
  if (status === "no_show") return "danger";
  if (status === "cancelled") return "muted";
  if (status === "completed") return "success";

  const normalized = serviceName.toLocaleLowerCase("nl-NL");
  if (normalized.includes("balayage")) return "rose";
  if (normalized.includes("kleur")) return "violet";
  if (normalized.includes("treatment")) return "mint";
  if (normalized.includes("heren")) return "blue";
  if (normalized.includes("föhn")) return "sky";
  if (normalized.includes("knip")) return "amber";
  return "blue";
}

export function getStatusMeta(status: string): { label: string; tone: StatusTone } {
  switch (status) {
    case "pending": return { label: "In afwachting", tone: "warning" };
    case "confirmed": return { label: "Bevestigd", tone: "info" };
    case "checked_in": return { label: "In salon", tone: "info" };
    case "completed": return { label: "Afgerond", tone: "success" };
    case "cancelled": return { label: "Geannuleerd", tone: "muted" };
    case "no_show": return { label: "No-show", tone: "danger" };
    default: return { label: status.replaceAll("_", " "), tone: "muted" };
  }
}
