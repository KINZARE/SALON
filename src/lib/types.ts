export const CURRENCIES = ['EUR','USD','GBP','CHF','SEK','NOK','DKK','THB'] as const;
export type Currency = typeof CURRENCIES[number];
export type SplitMode = 'equal' | 'shares' | 'exact' | 'percentage';
export type GroupType = 'trip' | 'home' | 'couple' | 'dinner' | 'other';
export type Category = 'food' | 'transport' | 'stay' | 'groceries' | 'fun' | 'other';
export interface Member { id:string; name:string }
export interface Split { memberId:string; weight:number; amount:number }
export interface Expense { id:string; title:string; amount:number; paidBy:string; date:string; category:Category; splitMode:SplitMode; splits:Split[]; notes:string; receipt:string|null; createdAt:string; updatedAt:string; deletedAt:string|null }
export interface Payment { id:string; from:string; to:string; amount:number; date:string; deletedAt:string|null }
export interface Activity { id:string; at:string; actor:string; action:string; title:string; before:string|null; after:string|null; entityId:string }
export interface Group { id:string; name:string; type:GroupType; currency:Currency; members:Member[]; selfMemberId:string; expenses:Expense[]; payments:Payment[]; activities:Activity[]; createdAt:string; archivedAt:string|null; sample:boolean }
export interface Workspace { version:1; profileName:string; groups:Group[] }
export interface Balance { memberId:string; paid:number; share:number; sent:number; received:number; total:number }
export interface Transfer { from:string; to:string; amount:number }
export type Action =
 | {type:'create-group'; group:Group}
 | {type:'import-groups'; groups:Group[]}
 | {type:'set-profile'; name:string}
 | {type:'upsert-expense'; groupId:string; expense:Expense; expectedUpdatedAt?:string}
 | {type:'delete-expense'|'restore-expense'; groupId:string; expenseId:string}
 | {type:'add-payment'; groupId:string; payment:Payment}
 | {type:'delete-payment'|'restore-payment'; groupId:string; paymentId:string}
 | {type:'add-member'; groupId:string; member:Member}
 | {type:'rename-member'; groupId:string; memberId:string; name:string}
 | {type:'set-self'; groupId:string; memberId:string}
 | {type:'rename-group'; groupId:string; name:string}
 | {type:'archive-group'; groupId:string; archived:boolean};
export const emptyWorkspace = ():Workspace => ({version:1, profileName:'', groups:[]});
export const uid = () => crypto.randomUUID();
export const today = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export const memberName = (g:Group,id:string) => g.members.find(m=>m.id===id)?.name ?? 'Onbekend';
export const groupTypeNames:Record<GroupType,string> = {trip:'Reis',home:'Huisgenoten',couple:'Samen',dinner:'Etentje',other:'Anders'};
export const categoryNames:Record<Category,string> = {food:'Eten & drinken',transport:'Vervoer',stay:'Verblijf',groceries:'Boodschappen',fun:'Vrije tijd',other:'Overig'};
