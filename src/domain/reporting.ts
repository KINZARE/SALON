import { ReportRangeSchema } from "../lib/schemas.ts";
type Preset="this_week"|"this_month"|"previous_month"|"last30"|"custom";
type Input={preset:Preset;today:string;from?:string;to?:string};

function date(value:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("INVALID_DATE");
  const result=new Date(value+"T12:00:00Z");
  if(Number.isNaN(result.getTime())||result.toISOString().slice(0,10)!==value) throw new Error("INVALID_DATE");
  return result;
}
function iso(value:Date){return value.toISOString().slice(0,10)}
function add(value:string,days:number){const result=date(value);result.setUTCDate(result.getUTCDate()+days);return iso(result)}
function distance(a:string,b:string){return Math.round((date(b).getTime()-date(a).getTime())/86400000)}
function monday(value:string){const result=date(value);const weekday=result.getUTCDay();return add(value,weekday===0?-6:1-weekday)}
function first(value:string){return value.slice(0,7)+"-01"}
function nextMonth(value:string){const result=date(first(value));result.setUTCMonth(result.getUTCMonth()+1);return iso(result)}

export function resolveReportRange(input:Input){
  if(!ReportRangeSchema.safeParse(input).success)throw new Error("INVALID_DATE");
  date(input.today);
  let from:string;
  let to:string;
  if(input.preset==="this_week"){from=monday(input.today);to=add(from,6)}
  else if(input.preset==="this_month"){from=first(input.today);to=add(nextMonth(input.today),-1)}
  else if(input.preset==="previous_month"){const current=first(input.today);to=add(current,-1);from=first(to)}
  else if(input.preset==="last30"){to=input.today;from=add(to,-29)}
  else{if(!input.from||!input.to)throw new Error("RANGE_REQUIRED");date(input.from);date(input.to);from=input.from;to=input.to}
  const span=distance(from,to);
  if(span<0)throw new Error("INVALID_RANGE");
  if(span>366)throw new Error("RANGE_TOO_WIDE");
  return{from,to,toExclusive:add(to,1)};
}
