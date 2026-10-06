import {test,expect} from './fixtures.mjs';

test('Today opens daily contexts without routing and traps mobile focus',async({page,runtimeErrors})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/app/today');
 await page.getByRole('button',{name:'Nieuwe afspraak',exact:true}).click();
 const sheet=page.getByRole('dialog',{name:'Nieuwe afspraak',exact:true});
 await expect(sheet).toBeVisible();
 await expect(page).toHaveURL(/\/app\/today/);
 await expect(sheet.getByLabel('Zoek bestaande klant')).toBeVisible();
 await page.keyboard.press('Escape');await expect(sheet).not.toBeVisible();
 await expect(page.getByRole('button',{name:'Nieuwe afspraak',exact:true})).toBeFocused();
 for(const width of [320,360,375,390,430,768,1024,1280,1440]){
  await page.setViewportSize({width,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 }
 expect(runtimeErrors).toEqual([]);
});

import {randomUUID} from 'node:crypto';
import {formatInTimeZone,fromZonedTime} from 'date-fns-tz';
import {qaDatabase} from './fixtures.mjs';
const checked=async q=>{const r=await q;if(r.error)throw r.error;return r.data};
test('synthetic full workday stays on Today and removes every fixture',async({page,runtimeErrors})=>{
 const db=qaDatabase();const prefix=`QA day ${randomUUID().slice(0,8)}`;
 const salon=await checked(db.from('salons').select('id,timezone').eq('slug','salon').single());
 const date=formatInTimeZone(new Date(),salon.timezone,'yyyy-MM-dd');
 const st=randomUUID(),svc=randomUUID(),customer=randomUUID(),ids=[randomUUID(),randomUUID(),randomUUID()];
 const instant=time=>fromZonedTime(`${date}T${time}:00`,salon.timezone).toISOString();
 const mutations=[];page.on('request',req=>{if(req.method()==='POST'&&/\/api\/internal\/(today|book|move)/.test(req.url()))mutations.push(req.url())});
 await page.setViewportSize({width:390,height:844});
 try{
  await checked(db.from('staff').insert({id:st,salon_id:salon.id,name:prefix,active:true}));
  await checked(db.from('services').insert({id:svc,salon_id:salon.id,name:prefix,duration_minutes:30,buffer_minutes:0,price_cents:3500,active:true,online_bookable:true}));
  await checked(db.from('staff_services').insert({salon_id:salon.id,staff_id:st,service_id:svc}));
  await checked(db.from('staff_schedules').insert(Array.from({length:7},(_,weekday)=>({salon_id:salon.id,staff_id:st,weekday,is_working:true,start_time:'09:00',end_time:'20:00'}))));
  await checked(db.from('customers').insert({id:customer,salon_id:salon.id,name:prefix}));
  await checked(db.from('appointments').insert(ids.map((id,index)=>({id,salon_id:salon.id,staff_id:st,service_id:svc,customer_id:customer,customer_name_snapshot:`${prefix} ${index}`,service_name_snapshot:prefix,starts_at:instant(`${10+index}:00`),service_ends_at:instant(`${10+index}:30`),occupied_until:instant(`${10+index}:30`),duration_minutes_snapshot:30,buffer_minutes_snapshot:0,price_cents_snapshot:3500,currency_snapshot:'EUR',status:'confirmed',source:'internal'}))));
  await page.goto('/app/today');
  const open=async id=>{await page.locator(`[data-appointment-id="${id}"]`).click();await expect(page.locator('[data-daily-appointment]')).toBeVisible()};
  await open(ids[0]);
  await page.getByRole('button',{name:'Klant bekijken',exact:true}).click();await expect(page.getByRole('heading',{name:prefix,exact:true})).toBeVisible();await page.getByRole('button',{name:'← Afspraak',exact:true}).click();
  await page.getByRole('button',{name:'Inchecken',exact:true}).click();await expect(page.getByRole('button',{name:'Start behandeling',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Start behandeling',exact:true}).dblclick();await expect(page.getByRole('button',{name:'Afronden',exact:true})).toBeVisible();
  await page.getByText('Notities',{exact:true}).click();await page.getByLabel('Afspraaknotitie').fill('Synthetic workday note');await page.getByRole('button',{name:'Notitie opslaan',exact:true}).click();await expect(page.getByRole('button',{name:'Afronden',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Afronden',exact:true}).click();await expect(page.locator('[data-daily-status]')).toHaveText('Afgerond');
  await page.getByText('Betaling',{exact:true}).click();await expect(page.getByText(/Nog niet betaald/)).toBeVisible();
  await page.getByRole('button',{name:'Opnieuw boeken',exact:true}).click();
  const rebook=page.getByRole('dialog',{name:'Opnieuw boeken',exact:true});await expect(rebook.getByRole('button',{name:'Andere / nieuwe klant'})).toBeVisible();await expect(rebook.getByRole('combobox',{name:/^Behandeling/})).toHaveValue(svc);
  const future=new Date(`${date}T12:00Z`);future.setUTCDate(future.getUTCDate()+7);const futureDate=future.toISOString().slice(0,10);
  await rebook.getByLabel('Datum',{exact:true}).fill(futureDate);const times=rebook.getByRole('button',{name:/^\d\d:\d\d$/});await times.first().click();await rebook.getByRole('button',{name:'Afspraak opslaan',exact:true}).click();await expect(rebook).not.toBeVisible();
  await expect(page).toHaveURL(/\/app\/today/);
  // New appointment in a visible gap, using a dedicated test employee/service.
  await page.getByRole('button',{name:'Nieuwe afspraak',exact:true}).click();const form=page.getByRole('dialog',{name:'Nieuwe afspraak',exact:true});await form.getByLabel('Klantnaam',{exact:true}).fill(`${prefix} new`);await form.getByRole('combobox',{name:/^Behandeling/}).selectOption(svc);
  await form.getByRole('button',{name:/^\d\d:\d\d$/}).first().click();await form.getByRole('button',{name:'Afspraak opslaan',exact:true}).click();await expect(form).not.toBeVisible();
  await open(ids[1]);await page.getByRole('button',{name:'Verplaatsen',exact:true}).click();const move=page.getByRole('dialog',{name:'Afspraak verplaatsen',exact:true});await move.getByRole('button',{name:/^\d\d:\d\d$/}).last().click();await move.getByRole('button',{name:'Afspraak verplaatsen',exact:true}).click();await expect(move).not.toBeVisible();
  await open(ids[2]);await page.getByRole('dialog').getByText('Meer',{exact:true}).click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Niet verschenen',exact:true}).click();await expect(page.locator('[data-daily-status]')).toHaveText('No-show');await page.getByRole('button',{name:'Sluiten',exact:true}).click();
  // Dedicated staff keeps pause/block regression independent from normal bookings.
  const addBlock=async(mode,start,end)=>{
   await page.getByRole('heading',{name:'Vrije ruimte',exact:true}).locator('..').getByText('Meer',{exact:true}).click();await page.getByRole('button',{name:mode,exact:true}).filter({visible:true}).first().click();const sheet=page.getByRole('dialog',{name:mode,exact:true});await sheet.getByRole('combobox',{name:/^Medewerker/}).selectOption(st);await sheet.getByLabel('Start',{exact:true}).fill(`${date}T${start}`);await sheet.getByLabel('Einde',{exact:true}).fill(`${date}T${end}`);await sheet.getByRole('button',{name:mode,exact:true}).click();await expect(sheet).not.toBeVisible();
  };
  await addBlock('Pauze toevoegen','16:00','16:15');await addBlock('Tijd blokkeren','16:30','16:45');
  const pauseRow=page.locator('[data-daily-timeline] > div').filter({hasText:'16:00'}).filter({hasText:'tot 16:15'});await expect(pauseRow.getByText('Pauze',{exact:true})).toBeVisible();await expect(page).toHaveURL(/\/app\/today/);
  expect(runtimeErrors).toEqual([]);
  const final=await checked(db.from('appointments').select('status,note,treatment_started_at').eq('id',ids[0]).single());expect(final.status).toBe('completed');expect(final.note).toBe('Synthetic workday note');expect(final.treatment_started_at).not.toBeNull();
  expect(mutations.filter(url=>url.includes('/today')).length).toBe(7);
 }finally{
  await checked(db.from('blocks').delete().eq('salon_id',salon.id).eq('staff_id',st));
  await checked(db.from('appointments').delete().eq('salon_id',salon.id).eq('staff_id',st));
  await checked(db.from('customers').delete().eq('salon_id',salon.id).like('name',`${prefix}%`));
  await checked(db.from('staff').delete().eq('salon_id',salon.id).eq('id',st));
  await checked(db.from('services').delete().eq('salon_id',salon.id).eq('id',svc));
 }
});

// Isolated browser contract: no fixture mutation reaches the server.
test('note drafts survive status changes and recover a conflicting server note',async({page})=>{
 const id='10000000-0000-4000-8000-000000000001';
 const appointment={id,staff_id:id,service_id:id,customer_id:id,customer_name_snapshot:'Synthetic note customer',service_name_snapshot:'Synthetic treatment',starts_at:new Date().toISOString(),service_ends_at:new Date(Date.now()+1800000).toISOString(),status:'confirmed',treatment_started_at:null,note:null,payment_status:'unpaid',price_cents_snapshot:1000,currency_snapshot:'EUR'};
 let firstNote=true;
 await page.route('**/api/internal/today?kind=appointment*',r=>r.fulfill({json:{appointment,customer:null,intake:{forms:[],submissions:[]},previous:null,next:null,consents:[]}}));
 await page.route('**/api/internal/today',async r=>{
  const payload=r.request().postDataJSON();
  if(payload.action==='note'&&firstNote){firstNote=false;appointment.note='Colleague note';return r.fulfill({status:409,json:{error:'De notitie is intussen gewijzigd.'}})}
  if(payload.action==='note'){expect(payload.expectedNote).toBe('Colleague note');appointment.note=payload.note}
  else appointment.status='checked_in';
  await r.fulfill({json:{ok:true}});
 });
 await page.setViewportSize({width:390,height:844});
 await page.goto(`/app/today?appointment=${id}`);
 await page.getByText('Notities',{exact:true}).click();
 await page.getByLabel('Afspraaknotitie').fill('My unsaved draft');
 await page.getByRole('button',{name:'Inchecken',exact:true}).click();
 await expect(page.getByRole('button',{name:'Start behandeling',exact:true})).toBeVisible();
 await expect(page.getByLabel('Afspraaknotitie')).toHaveValue('My unsaved draft');
 await page.getByRole('button',{name:'Notitie opslaan',exact:true}).click();
 await expect(page.getByText('Colleague note',{exact:true})).toBeVisible();
 await expect(page.getByLabel('Afspraaknotitie')).toHaveValue('My unsaved draft');
 await expect(page.getByRole('button',{name:'Notitie opslaan',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Mijn concept behouden',exact:true}).click();
 await page.getByRole('button',{name:'Notitie opslaan',exact:true}).click();
 await expect(page.getByRole('status').filter({hasText:'Notitie opgeslagen.'})).toBeVisible();
});

test('desktop context replacement resets booking and block drafts',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('/app/today');
 await page.getByRole('button',{name:'Nieuwe afspraak',exact:true}).click();
 await page.getByLabel('Klantnaam',{exact:true}).fill('Synthetic abandoned draft');
 const gap=page.getByRole('button',{name:'+ Afspraak',exact:true}).first();
 await expect(gap).toBeVisible();page.once('dialog',d=>d.accept());await gap.click();
 await expect(page.getByLabel('Klantnaam',{exact:true})).toHaveValue('');
 const more=page.getByRole('heading',{name:'Vrije ruimte',exact:true}).locator('..').getByText('Meer',{exact:true});
 await more.click();await page.getByRole('button',{name:'Tijd blokkeren',exact:true}).filter({visible:true}).first().click();
 await page.getByLabel('Reden (optioneel)').fill('Synthetic abandoned block');
 await more.click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Pauze toevoegen',exact:true}).filter({visible:true}).first().click();
 await expect(page.getByLabel('Reden (optioneel)')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'15 min',exact:true})).toBeVisible();
});

test('booking conflict refreshes slots without losing customer draft',async({page})=>{
 const id='10000000-0000-4000-8000-000000000002';let attempts=0;let availabilityReads=0;
 const at=hour=>new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),new Date().getUTCDate()+1,hour)).toISOString();
 await page.route('**/api/internal/today?kind=catalog',r=>r.fulfill({json:{services:[{id,name:'Synthetic service',duration_minutes:30}],staff:[{id,name:'Synthetic staff'}],staffByService:{[id]:[{id,name:'Synthetic staff'}]}}}));
 await page.route('**/api/internal/availability?*',r=>{availabilityReads++;return r.fulfill({json:{slots:[{start:at(availabilityReads===1?10:11)}]}})});
 await page.route('**/api/internal/book',r=>{attempts++;return r.fulfill(attempts===1?{status:409,json:{error:'Tijdstip intussen geboekt.'}}:{status:201,json:{appointmentId:id}})});
 await page.goto('/app/today');await page.getByRole('button',{name:'Nieuwe afspraak',exact:true}).click();
 await page.getByLabel('Klantnaam',{exact:true}).fill('Synthetic preserved customer');
 await page.getByRole('button',{name:/^\d\d:\d\d$/}).first().click();
 await page.getByRole('button',{name:'Afspraak opslaan',exact:true}).click();
 await expect(page.locator('form').getByRole('alert')).toHaveText('Tijdstip intussen geboekt.');
 await expect(page.getByRole('button',{name:'Afspraak opslaan',exact:true})).toBeDisabled();
 await expect(page.getByLabel('Klantnaam',{exact:true})).toHaveValue('Synthetic preserved customer');
 await expect.poll(()=>availabilityReads).toBeGreaterThan(1);
 await page.getByRole('button',{name:/^\d\d:\d\d$/}).first().click();await page.getByRole('button',{name:'Afspraak opslaan',exact:true}).dblclick();
 await expect(page.getByLabel('Klantnaam',{exact:true})).toHaveCount(0);expect(attempts).toBe(2);
});