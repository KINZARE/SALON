import Link from "next/link";
import { getOpeningHours,getStaff } from "@/services/app-data";
import { getAppointmentsForRange,getMonthAppointments,getOpeningExceptions } from "@/services/product-completion";
import { getMonthGrid,getWeekDates,shiftCalendarDate } from "@/domain/calendar-range";
import { MonthCalendarOverview,WeekCalendarOverview } from "@/components/workspace/calendar-overviews";

export async function CalendarPeriodView({salonId,timezone,date,view,staffFilter}:{salonId:string;timezone:string;date:string;view:"week"|"month";staffFilter:string|null}){
  if(view==="week"){
    const dates=getWeekDates(date);
    const [allStaff,items]=await Promise.all([
      getStaff(salonId),
      getAppointmentsForRange(salonId,timezone,dates[0],shiftCalendarDate(dates[6],1),staffFilter),
    ]);
    const staff=allStaff.filter(member=>member.active);
    const appointments=items;
    return <>
      <div className="calendar-scroll mt-5 flex gap-2 overflow-x-auto pb-1">
        <Link href={`/app/calendar?view=week&date=${date}`} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${!staffFilter?"border-[var(--ink)] bg-[var(--ink)] text-white":"border-[var(--border)] bg-white"}`}>Iedereen</Link>
        {staff.map(member=><Link key={member.id} href={`/app/calendar?view=week&date=${date}&staff=${member.id}`} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${staffFilter===member.id?"border-[var(--ink)] bg-[var(--ink)] text-white":"border-[var(--border)] bg-white"}`}>{member.name}</Link>)}
      </div>
      <WeekCalendarOverview dates={dates} appointments={appointments} timezone={timezone}/>
    </>;
  }
  const dates=getMonthGrid(date);
  const last=dates.at(-1)??dates[0];
  const [appointments,opening,exceptions]=await Promise.all([
    getMonthAppointments(salonId,timezone,dates[0],shiftCalendarDate(last,1)),
    getOpeningHours(salonId),
    getOpeningExceptions(salonId,dates[0],last),
  ]);
  return <MonthCalendarOverview dates={dates} month={date.slice(0,7)} appointments={appointments} timezone={timezone} opening={opening} exceptions={exceptions}/>;
}
