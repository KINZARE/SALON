import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { parseDateOnly, formatDateOnly } from "./date-only.ts";

export function getWeekDates(value: string): string[] {
  const date=parseDateOnly(value);
  return eachDayOfInterval({start:startOfWeek(date,{weekStartsOn:1}),end:endOfWeek(date,{weekStartsOn:1})}).map(formatDateOnly);
}
export function getMonthGrid(value: string): string[] {
  const date=parseDateOnly(value);
  return eachDayOfInterval({start:startOfWeek(startOfMonth(date),{weekStartsOn:1}),end:endOfWeek(endOfMonth(date),{weekStartsOn:1})}).map(formatDateOnly);
}
export function shiftCalendarDate(value: string, amount: number): string {
  return formatDateOnly(addDays(parseDateOnly(value),amount));
}
export function shiftCalendarMonth(value: string, amount: number): string {
  return formatDateOnly(addMonths(startOfMonth(parseDateOnly(value)),amount));
}
