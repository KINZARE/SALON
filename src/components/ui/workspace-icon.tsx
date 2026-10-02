import type { SVGProps } from "react";

export type WorkspaceIconName =
  | "today"
  | "calendar"
  | "customers"
  | "more"
  | "services"
  | "staff"
  | "reports"
  | "settings"
  | "blocks";

type Props = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: WorkspaceIconName;
  size?: number;
};

export function WorkspaceIcon({ name, size = 18, ...props }: Props) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  let paths: React.ReactNode;

  switch (name) {
    case "today":
      paths = <><path d="M5 3.5v3M15 3.5v3M3.5 8.5h13"/><rect x="3.5" y="5" width="13" height="11.5" rx="2.5"/><path d="M7 12h2M11 12h2M7 15h2"/></>;
      break;
    case "calendar":
      paths = <><path d="M5 3.5v3M15 3.5v3M3.5 8h13"/><rect x="3.5" y="5" width="13" height="11.5" rx="2.5"/><path d="M7 11h2v2H7zM12 11h2"/></>;
      break;
    case "customers":
      paths = <><circle cx="8" cy="7.5" r="3"/><path d="M3.5 16c.4-3 2-4.6 4.5-4.6S12 13 12.5 16"/><path d="M13 6.5a2.5 2.5 0 0 1 0 5M14 12.3c1.7.6 2.5 1.8 2.8 3.7"/></>;
      break;
    case "services":
      paths = <><path d="M4 6.5h12M4 10h12M4 13.5h8"/><circle cx="6" cy="6.5" r="1"/><circle cx="13" cy="10" r="1"/><circle cx="9" cy="13.5" r="1"/></>;
      break;
    case "staff":
      paths = <><circle cx="7" cy="7" r="3"/><circle cx="14" cy="8" r="2.3"/><path d="M2.8 16c.4-3.1 2.2-4.8 4.2-4.8 2.2 0 4 1.7 4.4 4.8M11.7 12.2c2.7-.5 4.7 1 5.3 3.8"/></>;
      break;
    case "reports":
      paths = <><path d="M4 16V9M9 16V5M14 16v-3M3 16.5h14"/></>;
      break;
    case "settings":
      paths = <><circle cx="10" cy="10" r="2.7"/><path d="M10 2.8v2M10 15.2v2M17.2 10h-2M4.8 10h-2M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4M15.1 15.1l-1.4-1.4M6.3 6.3 4.9 4.9"/></>;
      break;
    case "blocks":
      paths = <><rect x="3.5" y="3.5" width="13" height="13" rx="3"/><path d="m6 14 8-8"/></>;
      break;
    default:
      paths = <><circle cx="5" cy="10" r="1"/><circle cx="10" cy="10" r="1"/><circle cx="15" cy="10" r="1"/></>;
  }

  return <svg data-workspace-icon aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" {...common} {...props}>{paths}</svg>;
}
