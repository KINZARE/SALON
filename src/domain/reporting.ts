import { addDays, differenceInCalendarDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ReportRangeSchema } from "../lib/schemas.ts";
import { parseDateOnly, formatDateOnly } from "./date-only.ts";

type Preset="this_week"|"this_month"|"previous_month"|"last30"|"custom";
type Input={preset:Preset;today:string;from?:string;to?:string};

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
