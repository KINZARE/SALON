import { addDays, differenceInCalendarDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ReportRangeSchema } from "../lib/schemas.ts";
import { parseDateOnly, formatDateOnly } from "./date-only.ts";

type Preset="this_week"|"this_month"|"previous_month"|"last30"|"custom";
type Input={preset:Preset;today:string;from?:string;to?:string};

export type AppointmentKpiRow = {
  status: string;
  price_cents_snapshot: number;
};

export type AppointmentKpiSummary = {
  appointments: number;
  plannedValueCents: number;
  completed: number;
  completedValueCents: number;
  averageCompletedValueCents: number;
  cancellations: number;
  cancellationRate: number;
  noShows: number;
  noShowRate: number;
};

function percentage(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 1_000) / 10;
}

export function calculateAppointmentKpis(rows: AppointmentKpiRow[]): AppointmentKpiSummary {
  const nonCancelled = rows.filter((row) => row.status !== "cancelled");
  const completedRows = rows.filter((row) => row.status === "completed");
  const cancellations = rows.filter((row) => row.status === "cancelled").length;
  const noShows = rows.filter((row) => row.status === "no_show").length;
  const completedValueCents = completedRows.reduce((sum, row) => sum + row.price_cents_snapshot, 0);

  return {
    appointments: nonCancelled.length,
    plannedValueCents: nonCancelled.reduce((sum, row) => sum + row.price_cents_snapshot, 0),
    completed: completedRows.length,
    completedValueCents,
    averageCompletedValueCents: completedRows.length ? Math.round(completedValueCents / completedRows.length) : 0,
    cancellations,
    cancellationRate: percentage(cancellations, rows.length),
    noShows,
    noShowRate: percentage(noShows, completedRows.length + noShows),
  };
}

export function resolveReportRange(input:Input){
  if(!ReportRangeSchema.safeParse(input).success)throw new Error("INVALID_DATE");
  const today=parseDateOnly(input.today);
  let start:Date,end:Date;
  if(input.preset==="this_week"){start=startOfWeek(today,{weekStartsOn:1});end=endOfWeek(today,{weekStartsOn:1})}
  else if(input.preset==="this_month"){start=startOfMonth(today);end=endOfMonth(today)}
  else if(input.preset==="previous_month"){const previous=subMonths(today,1);start=startOfMonth(previous);end=endOfMonth(previous)}
  else if(input.preset==="last30"){end=today;start=addDays(today,-29)}
  else{if(!input.from||!input.to)throw new Error("RANGE_REQUIRED");start=parseDateOnly(input.from);end=parseDateOnly(input.to)}
  const span=differenceInCalendarDays(end,start);
  if(span<0)throw new Error("INVALID_RANGE");
  if(span>366)throw new Error("RANGE_TOO_WIDE");
  return{from:formatDateOnly(start),to:formatDateOnly(end),toExclusive:formatDateOnly(addDays(end,1))};
}
