import {requireAppContext} from '@/lib/auth';
import {getTodayWorkspace} from '@/services/today-workspace';
import {DailyWorkspace} from '@/components/workspace/daily/daily-workspace';
import {UuidSchema} from '@/lib/schemas';
export default async function TodayPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {salon,membership}=await requireAppContext();
 const [data,query]=await Promise.all([getTodayWorkspace(salon.id,salon.timezone,{includeWaitlist:membership.role!=='staff'}),searchParams]);
 const requested=UuidSchema.safeParse(query.appointment);
 const dateLabel=new Intl.DateTimeFormat('nl-NL',{weekday:'long',day:'numeric',month:'long',timeZone:salon.timezone}).format(new Date());
 return <DailyWorkspace data={data} timezone={salon.timezone} currency={salon.currency} role={membership.role} dateLabel={dateLabel} initialAppointmentId={requested.success?requested.data:undefined}/>;
}
