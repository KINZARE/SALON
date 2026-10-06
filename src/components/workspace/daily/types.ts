import type {getDailyAppointment,getDailyCatalog,getDailyIntake} from '@/services/today-context';
import type {TodayWorkspaceData} from '@/services/today-workspace';
export type DailyDetail=NonNullable<Awaited<ReturnType<typeof getDailyAppointment>>>;
export type DailyCatalog=Awaited<ReturnType<typeof getDailyCatalog>>;
export type DailyIntake=NonNullable<Awaited<ReturnType<typeof getDailyIntake>>>;
export type BookingSeed={customer?:{id:string;name:string;phone:string|null;email:string|null};newCustomer?:{name:string;phone:string|null;email:string|null};serviceId?:string;staffId?:string;date?:string;startsAt?:string;endsAt?:string};
export type DailyContext={kind:'appointment';id:string;view:'appointment'|'customer'|'intake';submissionId?:string}|{kind:'booking';seed:BookingSeed;title:string}|{kind:'reschedule';detail:DailyDetail}|{kind:'block';seed:BookingSeed;mode:'pause'|'block'};
export type DailyData=TodayWorkspaceData;
