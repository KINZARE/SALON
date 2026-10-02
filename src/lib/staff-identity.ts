export type StaffTone = "clay" | "sage" | "sand" | "sky" | "lilac";

const tones: readonly StaffTone[] = ["clay", "sage", "sand", "sky", "lilac"];

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return hash;
}

export function getStaffIdentity(staffId: string, name: string): { initials: string; tone: StaffTone } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}` : parts[0]?.slice(0, 2) ?? "?").toUpperCase();
  return {
    initials,
    tone: tones[hashString(staffId) % tones.length],
  };
}
