import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireAppContext} from '@/lib/auth';
import {createAdminSupabaseClient} from '@/lib/supabase/admin';
import {getDailyAppointment,getDailyCatalog,getDailyIntake} from '@/services/today-context';
import {validateDailyMutation} from '@/domain/today-actions';
import {UuidSchema} from '@/lib/schemas';
import {saveWorkspaceEntity} from '@/services/workspace-mutations';
import {parseUnambiguousLocalDateTime} from '@/domain/local-time';
import {revalidatePath} from 'next/cache';
const headers={'Cache-Control':'private, no-store'};
const blockSchema=z.object({kind:z.literal('block'),staffId:UuidSchema.nullable(),startsAt:z.string().max(30),endsAt:z.string().max(30),reason:z.string().max(160),requestId:UuidSchema});
export async function GET(request:Request){
 const {salon,membership}=await requireAppContext();
 const canManage=membership.role!=='staff';const query=new URL(request.url).searchParams;
 const kind=query.get('kind');const id=query.get('id');
 if(kind==='catalog'){if(!canManage)return NextResponse.json({error:'Geen toegang.'},{status:403,headers});return NextResponse.json(await getDailyCatalog(salon.id),{headers})}
 if(!UuidSchema.safeParse(id).success)return NextResponse.json({error:'Ongeldige selectie.'},{status:400,headers});
 if(kind==='intake'&&!canManage)return NextResponse.json({error:'Geen toegang.'},{status:403,headers});
 if(kind!=='intake'&&kind!=='appointment')return NextResponse.json({error:'Ongeldige selectie.'},{status:400,headers});
 try{
  const detail=kind==='intake'?await getDailyIntake(salon.id,id!):await getDailyAppointment(salon.id,id!,canManage);
  return detail?NextResponse.json(detail,{headers}):NextResponse.json({error:'Niet gevonden. Vernieuw de planning.'},{status:404,headers});
 }catch{return NextResponse.json({error:'Gegevens konden niet worden geladen. Probeer opnieuw.'},{status:503,headers})}
}
export async function POST(request:Request){
 const {salon,membership}=await requireAppContext();
 if(membership.role==='staff')return NextResponse.json({error:'Geen toestemming voor deze actie.'},{status:403,headers});
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({error:'Ongeldige aanvraag.'},{status:400,headers})}
 const mutation=validateDailyMutation(body);const block=blockSchema.safeParse(body);
 if(!mutation&&!block.success)return NextResponse.json({error:'Controleer de ingevulde gegevens.'},{status:400,headers});
 try{
  if(block.success){
   const {staffId,startsAt,endsAt,reason,requestId}=block.data;
   const start=parseUnambiguousLocalDateTime(startsAt,salon.timezone);const end=parseUnambiguousLocalDateTime(endsAt,salon.timezone);
   if(!start||!end||start>=end)return NextResponse.json({error:'Kies geldige start- en eindtijden; controleer de klokwisseling.'},{status:400,headers});
   // Tenant/staff FK and salon serialization are enforced by the existing RPC.
   await saveWorkspaceEntity(salon.id,'block',{staff_id:staffId,starts_at:start.toISOString(),ends_at:end.toISOString(),reason,idempotency_key:requestId});
  }else if(mutation){
   const db=createAdminSupabaseClient();const {error}=await db.rpc('daily_appointment_action',{p_salon_id:salon.id,p_id:mutation.appointmentId,p_action:mutation.action,p_expected_status:mutation.expectedStatus,p_expected_started_at:mutation.expectedStartedAt,p_note:mutation.note??null,p_expected_note:mutation.expectedNote??null});
   if(error)throw error;
  }
  revalidatePath('/app/today');revalidatePath('/app/calendar');return NextResponse.json({ok:true},{headers});
 }catch(error){
  const message=error instanceof Error?error.message:typeof error==='object'&&error&&'message' in error?String(error.message):'';
  const conflict=['STALE_APPOINTMENT','STALE_NOTE','APPOINTMENTS_IN_BLOCK','INVALID_STATUS_TRANSITION'].some(c=>message.includes(c));
  return NextResponse.json({error:conflict?'De planning of notitie is intussen gewijzigd, of deze tijd overlapt een afspraak. Controleer de actuele gegevens en probeer opnieuw.':'Opslaan is niet gelukt. Je gegevens zijn behouden; probeer opnieuw.'},{status:conflict?409:400,headers});
 }
}
