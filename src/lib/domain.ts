import { splitAmount,money } from './money';
import { validateWorkspace } from './schema';
import { uid, memberName, today, type Action,type Workspace,type Group,type Expense,type Currency,type GroupType,type SplitMode,type Category,type Balance,type Transfer } from './types';
export function newGroup(name:string,type:GroupType,currency:Currency,selfName:string,others:string[]=[]):Group {
 const members=[selfName,...others].map(name=>({id:uid(),name:name.trim()}));
 return {id:uid(),name:name.trim(),type,currency,members,selfMemberId:members[0].id,expenses:[],payments:[],activities:[],createdAt:new Date().toISOString(),archivedAt:null,sample:false};
}
export function makeExpense(group:Group,input:{title:string;amount:number;paidBy:string;date:string;category:Category;splitMode:SplitMode;weights:number[];notes:string;receipt:string|null},existing?:Expense):Expense {
 if(input.weights.length!==group.members.length)throw new Error('De deelnemers zijn gewijzigd. Open de uitgave opnieuw.');
 const amounts=splitAmount(input.amount,input.splitMode,input.weights);
 const splits=group.members.map((m,i)=>({memberId:m.id,weight:input.splitMode==='equal'?(input.weights[i]>0?1:0):input.weights[i],amount:amounts[i]})).filter((s,i)=>input.weights[i]>0);
 const at=new Date().toISOString();
 return {id:existing?.id??uid(),title:input.title.trim(),amount:input.amount,paidBy:input.paidBy,date:input.date,category:input.category,splitMode:input.splitMode,splits,notes:input.notes.trim(),receipt:input.receipt,createdAt:existing?.createdAt??at,updatedAt:at,deletedAt:null};
}
export function getBalances(group:Group):Balance[] {
 const balances=group.members.map(m=>({memberId:m.id,paid:0,share:0,sent:0,received:0,total:0}));
 const map=new Map(balances.map(b=>[b.memberId,b]));
 for(const e of group.expenses){if(e.deletedAt)continue;map.get(e.paidBy)!.paid+=e.amount;for(const s of e.splits)map.get(s.memberId)!.share+=s.amount;}
 for(const p of group.payments){if(p.deletedAt)continue;map.get(p.from)!.sent+=p.amount;map.get(p.to)!.received+=p.amount;}
 for(const b of balances)b.total=b.paid-b.share+b.sent-b.received;
 return balances;
}
export function suggestTransfers(group:Group):Transfer[] {
 const balances=getBalances(group);
 const creditors=balances.filter(b=>b.total>0).map(b=>({...b})).sort((a,b)=>b.total-a.total||a.memberId.localeCompare(b.memberId));
 const debtors=balances.filter(b=>b.total<0).map(b=>({...b})).sort((a,b)=>a.total-b.total||a.memberId.localeCompare(b.memberId));
 const result:Transfer[]=[];let i=0,j=0;
 while(i<creditors.length&&j<debtors.length){const c=creditors[i],d=debtors[j],amount=Math.min(c.total,-d.total);result.push({from:d.memberId,to:c.memberId,amount});c.total-=amount;d.total+=amount;if(c.total===0)i++;if(d.total===0)j++;}
 return result;
}
function expenseSummary(e:Expense,g:Group):string {return `${money(e.amount,g.currency)} · ${memberName(g,e.paidBy)} betaalde · ${e.splits.map(s=>`${memberName(g,s.memberId)} ${money(s.amount,g.currency)}`).join(', ')}`;}
export function mutate(input:Workspace,action:Action):Workspace {
 const state=structuredClone(input);
 if(action.type==='set-profile'){state.profileName=action.name.trim();return validateWorkspace(state);}
 if(action.type==='create-group'){if(state.groups.some(g=>g.id===action.group.id))throw new Error('Deze groep bestaat al.');state.groups.unshift(action.group);if(!state.profileName)state.profileName=memberName(action.group,action.group.selfMemberId);return validateWorkspace(state);}
 if(action.type==='import-groups'){state.groups.unshift(...action.groups);return validateWorkspace(state);}
 const group=state.groups.find(g=>g.id===action.groupId);if(!group)throw new Error('Deze groep bestaat niet meer.');
 if(group.archivedAt&&action.type!=='archive-group'&&action.type!=='set-self')throw new Error('Haal deze groep eerst uit het archief.');
 const at=new Date().toISOString();
 const log=(verb:string,title:string,entityId:string,before:string|null=null,after:string|null=null)=>group.activities.unshift({id:uid(),at,actor:memberName(group,group.selfMemberId),action:verb,title,entityId,before,after});
 switch(action.type){
 case 'upsert-expense':{const e=action.expense;const index=group.expenses.findIndex(x=>x.id===e.id);if(index>=0&&group.expenses[index].deletedAt)throw new Error('Deze uitgave is verwijderd. Herstel hem eerst.');if(index>=0){if(action.expectedUpdatedAt!==group.expenses[index].updatedAt)throw new Error('Deze uitgave is ondertussen gewijzigd. Sluit dit venster en open de nieuwste versie; je invoer is nog zichtbaar.');e.updatedAt=new Date(Math.max(Date.now(),new Date(group.expenses[index].updatedAt).getTime()+1)).toISOString();log('gewijzigd',e.title,e.id,expenseSummary(group.expenses[index],group),expenseSummary(e,group));group.expenses[index]=e;}else{log('toegevoegd',e.title,e.id,null,expenseSummary(e,group));group.expenses.unshift(e);}break;}
 case 'delete-expense':case 'restore-expense':{const e=group.expenses.find(e=>e.id===action.expenseId);if(!e)throw new Error('Uitgave niet gevonden.');e.deletedAt=action.type==='delete-expense'?at:null;e.updatedAt=at;log(action.type==='delete-expense'?'verwijderd':'hersteld',e.title,e.id,action.type==='delete-expense'?expenseSummary(e,group):null,action.type==='restore-expense'?expenseSummary(e,group):null);break;}
 case 'add-payment':{const p=action.payment;const b=getBalances(group),from=b.find(b=>b.memberId===p.from),to=b.find(b=>b.memberId===p.to);if(group.payments.some(x=>x.id===p.id)||!from||!to||p.from===p.to||p.amount>Math.min(-from.total,to.total)||from.total>=0||to.total<=0)throw new Error('De balans is gewijzigd. Controleer de openstaande bedragen opnieuw.');group.payments.unshift(p);log('vastgelegd',`${memberName(group,p.from)} → ${memberName(group,p.to)}`,p.id,null,money(p.amount,group.currency));break;}
 case 'delete-payment':case 'restore-payment':{const p=group.payments.find(p=>p.id===action.paymentId);if(!p)throw new Error('Verrekening niet gevonden.');p.deletedAt=action.type==='delete-payment'?at:null;log(action.type==='delete-payment'?'teruggedraaid':'hersteld',`${memberName(group,p.from)} → ${memberName(group,p.to)}`,p.id,money(p.amount,group.currency));break;}
 case 'add-member':group.members.push(action.member);log('toegevoegd',action.member.name,action.member.id);break;
 case 'rename-member':{const m=group.members.find(m=>m.id===action.memberId);if(!m)throw new Error('Deelnemer niet gevonden.');const before=m.name;m.name=action.name.trim();log('naam gewijzigd',m.name,m.id,before,m.name);break;}
 case 'set-self':group.selfMemberId=action.memberId;break;
 case 'rename-group':{const before=group.name;group.name=action.name.trim();log('groepsnaam gewijzigd',group.name,group.id,before,group.name);break;}
 case 'archive-group':group.archivedAt=action.archived?at:null;log(action.archived?'gearchiveerd':'uit archief gehaald',group.name,group.id);break;
 }
 return validateWorkspace(state);
}
export function sampleGroup(selfName:string):Group {
 const g=newGroup('Weekend in Lissabon','trip','EUR',selfName,['Lisa','Tim','Bram']);g.sample=true;
 const rows:[string,number,number,Category,number[]][]=[['Appartement',64000,2,'stay',[1,1,1,1]],['Diner aan het water',8450,0,'food',[1,1,1,1]],['Taxi naar de stad',2800,1,'transport',[1,1,1,0]],['Boodschappen',4235,0,'groceries',[1,1,1,1]]];
 for(const[title,amount,payer,category,weights]of rows)g.expenses.unshift(makeExpense(g,{title,amount,paidBy:g.members[payer].id,date:today(),category,splitMode:'equal',weights,notes:'Voorbeelduitgave. Je kunt deze wijzigen of verwijderen.',receipt:null}));
 return g;
}
