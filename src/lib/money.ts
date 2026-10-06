import type { Currency, SplitMode } from './types';
export const MAX_AMOUNT=100_000_000;
export function parseMinor(value:string):number {
  const normalized=value.trim().replace(',','.');
  if(!/^\d{1,9}(\.\d{1,2})?$/.test(normalized)) throw new Error('Vul een geldig bedrag in met maximaal twee decimalen.');
  const [whole,fraction='']=normalized.split('.');
  const amount=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if(!Number.isSafeInteger(amount)||amount<=0||amount>MAX_AMOUNT) throw new Error('Vul een bedrag in tussen 0,01 en 1.000.000.');
  return amount;
}
export function parseWeight(value:string):number {
  if(!/^\d{1,6}([.,]\d{1,2})?$/.test(value.trim())) throw new Error('Gebruik een positief getal met maximaal twee decimalen.');
  const [whole,fraction='']=value.trim().replace(',','.').split('.');
  return Number(whole)*100+Number(fraction.padEnd(2,'0'));
}
export function allocate(amount:number,weights:number[]):number[] {
  if(!Number.isSafeInteger(amount)||amount<1||amount>MAX_AMOUNT||!weights.length||weights.some(w=>!Number.isSafeInteger(w)||w<0||w>MAX_AMOUNT)) throw new Error('Ongeldige verdeling.');
  const total=weights.reduce((sum,w)=>sum+BigInt(w),0n);
  if(total===0n) throw new Error('Kies minstens één deelnemer.');
  const parts=weights.map((w,i)=>{const product=BigInt(amount)*BigInt(w);return {i,amount:Number(product/total),remainder:product%total};});
  let rest=amount-parts.reduce((sum,p)=>sum+p.amount,0);
  const sorted=[...parts].sort((a,b)=>a.remainder>b.remainder?-1:a.remainder<b.remainder?1:a.i-b.i);
  for(const p of sorted){if(rest===0)break;p.amount++;rest--;}
  return parts.map(p=>p.amount);
}
export function splitAmount(amount:number,mode:SplitMode,weights:number[]):number[] {
  if(mode==='exact') {
    if(weights.some(w=>!Number.isSafeInteger(w)||w<0)||weights.reduce((a,b)=>a+b,0)!==amount) throw new Error('De bedragen moeten samen gelijk zijn aan de uitgave.');
    return allocate(amount,weights);
  }
  if(mode==='percentage'&&weights.reduce((a,b)=>a+b,0)!==10000) throw new Error('De percentages moeten samen precies 100% zijn.');
  return allocate(amount,mode==='equal'?weights.map(w=>w>0?1:0):weights);
}
export function money(amount:number,currency:Currency='EUR'):string {return new Intl.NumberFormat('nl-NL',{style:'currency',currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(amount/100);}
export function amountInput(amount:number):string {return `${Math.floor(amount/100)},${String(amount%100).padStart(2,'0')}`;}
