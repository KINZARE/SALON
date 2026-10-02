"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore, type ComponentProps } from "react";
import type { CalendarBoard as Board } from "@/components/workspace/calendar-board";

const CalendarBoard = dynamic(() => import("./calendar-board").then(module => module.CalendarBoard), {
  ssr: false,
  loading: () => <div role="status" aria-label="Agenda laden" className="mt-6 h-[600px] animate-pulse rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)]" />,
});

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(min-width: 768px)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
const isDesktop = () => window.matchMedia("(min-width: 768px)").matches;
const serverSnapshot = () => false;

// The server renders the mobile timeline. Desktop DnD is fetched only when a
// desktop board is actually visible, including when the viewport changes.
export function DesktopCalendar(props: ComponentProps<typeof Board>) {
  const desktop = useSyncExternalStore(subscribe, isDesktop, serverSnapshot);
  return desktop ? <CalendarBoard {...props} /> : null;
}
