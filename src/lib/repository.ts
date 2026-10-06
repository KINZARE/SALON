import { mutate } from './domain';
import { validateWorkspace } from './schema';
import { emptyWorkspace,type Action,type Workspace } from './types';
export interface WorkspaceRepository {load():Promise<Workspace>;commit(action:Action):Promise<Workspace>}
export class LocalRepository implements WorkspaceRepository {
 private connection:Promise<IDBDatabase>|null=null;
 private db:IDBDatabase|null=null;
 constructor(private name='shared-money-v1',private timeoutMs=8000){}
 private open():Promise<IDBDatabase>{
  if(this.connection)return this.connection;
  this.connection=new Promise((resolve,reject)=>{
   if(typeof indexedDB==='undefined'){reject(new Error('Opslag is niet beschikbaar in deze browser. Open de app in een gewone browser.'));return;}
   const request=indexedDB.open(this.name,1);let failed=false;
   const timer=setTimeout(()=>{failed=true;reject(new Error('Opslag reageert niet. Sluit andere tabbladen en probeer opnieuw.'));},this.timeoutMs);
   request.onupgradeneeded=()=>{request.result.createObjectStore('workspace');};
   request.onsuccess=()=>{clearTimeout(timer);if(failed){request.result.close();return;}this.db=request.result;this.db.onversionchange=()=>this.close();resolve(request.result);};
   request.onerror=()=>{failed=true;clearTimeout(timer);reject(new Error('De lokale opslag kon niet worden geopend. Controleer je browserinstellingen.'));};
   request.onblocked=()=>{failed=true;clearTimeout(timer);reject(new Error('Een ander tabblad blokkeert de opslag. Sluit dat tabblad en probeer opnieuw.'));};
  });
  this.connection.catch(()=>{this.connection=null;});
  return this.connection;
 }
 private transaction(mode:IDBTransactionMode,action?:Action):Promise<Workspace>{
  return this.open().then(db=>new Promise((resolve,reject)=>{
   const tx=db.transaction('workspace',mode),store=tx.objectStore('workspace'),request=store.get('current');let result:Workspace;let failure:unknown;
   const timeoutError=new Error('Opslag reageert niet. Je vorige gegevens zijn behouden. Probeer opnieuw.');
   const timer=setTimeout(()=>{failure=timeoutError;try{tx.abort();}catch{}reject(timeoutError);},this.timeoutMs);
   request.onsuccess=()=>{try{const current=request.result===undefined?emptyWorkspace():validateWorkspace(request.result);result=action?mutate(current,action):current;if(action)store.put(result,'current');}catch(e){failure=e;try{tx.abort();}catch{}clearTimeout(timer);reject(e);}};
   tx.oncomplete=()=>{clearTimeout(timer);resolve(result);};
   const failed=()=>{clearTimeout(timer);reject(failure??new Error('Opslaan is niet gelukt. Je vorige gegevens zijn behouden. Probeer opnieuw of maak ruimte vrij op je apparaat.'));};
   tx.onerror=failed;tx.onabort=failed;
  }));
 }
 load():Promise<Workspace>{return this.transaction('readonly');}
 commit(action:Action):Promise<Workspace>{return this.transaction('readwrite',action);}
 close(){this.db?.close();this.db=null;this.connection=null;}
}
export const repository=new LocalRepository();
