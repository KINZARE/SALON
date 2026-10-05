export type CompletionFollowUpKind="feedback_request"|"rebook_reminder";
export type CompletionFollowUpJob={kind:CompletionFollowUpKind;recipient:string;nextAttemptAt:string;idempotencyKey:string;payload:Record<string,unknown>};

export function buildCompletionFollowUpJobs(input:{appointmentId:string;completedAt:string;recipient:string;rebookAfterDays?:number|null}):CompletionFollowUpJob[]{
  const recipient=input.recipient.trim().toLowerCase();
  if(!recipient)return[];
  const completed=new Date(input.completedAt);
  if(Number.isNaN(completed.getTime()))throw new Error("INVALID_COMPLETED_AT");
  const rebook=input.rebookAfterDays;
  if(rebook!=null&&(!Number.isInteger(rebook)||rebook<1||rebook>730))throw new Error("INVALID_REBOOK_INTERVAL");
  const addDays=(days:number)=>new Date(completed.getTime()+days*24*60*60*1000).toISOString();
  const jobs:CompletionFollowUpJob[]=[{
    kind:"feedback_request",recipient,nextAttemptAt:addDays(1),
    idempotencyKey:`feedback_request/${input.appointmentId}`,
    payload:{appointment_id:input.appointmentId},
  }];
  if(rebook!=null)jobs.push({
    kind:"rebook_reminder",recipient,nextAttemptAt:addDays(rebook),
    idempotencyKey:`rebook_reminder/${input.appointmentId}`,
    payload:{appointment_id:input.appointmentId,rebook_after_days:rebook},
  });
  return jobs;
}
