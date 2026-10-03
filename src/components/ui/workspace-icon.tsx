import type { SVGProps } from "react";
import { CalendarDays, Calendar, Users, Ellipsis, ListChecks, UsersRound, ChartNoAxesColumn, Settings, Ban } from "lucide-react";

export type WorkspaceIconName = "today" | "calendar" | "customers" | "more" | "services" | "staff" | "reports" | "settings" | "blocks";
type Props = Omit<SVGProps<SVGSVGElement>, "name"> & { name: WorkspaceIconName; size?: number };
const icons = { today: CalendarDays, calendar: Calendar, customers: Users, more: Ellipsis, services: ListChecks, staff: UsersRound, reports: ChartNoAxesColumn, settings: Settings, blocks: Ban };

export function WorkspaceIcon({ name, size = 18, ...props }: Props) {
  const Icon = icons[name];
  return <Icon data-workspace-icon aria-hidden="true" focusable="false" size={size} strokeWidth={1.8} {...props} />;
}
