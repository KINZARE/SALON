import {test,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';
import {qaDatabase} from './fixtures.mjs';

test('daily shell, Today hierarchy and secondary destinations',async({page})=>{
 await page.goto('/app/today');
 const nav=page.getByRole('navigation',{name:'Hoofdnavigatie',exact:true});
 await expect(nav.getByRole('link')).toHaveText(['Vandaag','Agenda','Klanten','Meer']);
 await expect(nav.getByRole('link',{name:'Vandaag',exact:true})).toHaveAttribute('aria-current','page');
 await expect(page.getByRole('button',{name:'Nieuwe afspraak',exact:true})).toHaveCount(1);
 const next=page.locator('[data-orsira-next-appointment]');
 const summary=page.getByRole('region',{name:'Vandaag samengevat'});
 expect((await next.boundingBox()).y).toBeLessThan((await summary.boundingBox()).y);
 for(const path of ['/app/services','/app/staff','/app/reports','/app/settings/schedule']){
  await page.goto(path);
  await expect(nav.getByRole('link',{name:'Meer',exact:true})).toHaveAttribute('aria-current','page');
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
 }
 await page.goto('/app/more');
 for(const name of ['Salon','Boekingen','Inzicht','Instellingen'])await expect(page.getByRole('heading',{name,exact:true})).toBeVisible();
 await page.getByRole('link',{name:/Openingstijden/}).click();
 await expect(page.locator('#opening-hours')).toBeVisible();
});

test('rebook retains customer and booking uses authoritative slots with retryable failure',async({page})=>{
 await page.goto('/app/customers');
 await page.locator('a[href^="/app/customers/"]').first().click();
 await page.getByRole('link',{name:'Opnieuw boeken',exact:true}).click();
 await expect(page).toHaveURL(/\/app\/calendar\/new\?customerId=/);
 await expect(page.getByRole('button',{name:'Andere / nieuwe klant'})).toBeVisible();
 await expect(page.getByLabel('Klantnaam',{exact:true})).toHaveCount(0);
 await expect(page.getByLabel('Notitie (optioneel)')).not.toBeVisible();
 await page.getByText('Meer opties',{exact:true}).click();
 await expect(page.getByLabel('Notitie (optioneel)')).toBeVisible();
 const future=new Date();future.setUTCDate(future.getUTCDate()+14);
 const firstDate=future.toISOString().slice(0,10);future.setUTCDate(future.getUTCDate()+1);const secondDate=future.toISOString().slice(0,10);
 let failed=true;
 await page.route('**/api/internal/availability?*',route=>route.fulfill({status:failed?503:200,contentType:'application/json',body:JSON.stringify(failed?{error:'Tijdelijk niet bereikbaar'}:{slots:[{start:`${secondDate}T08:00:00.000Z`}]})}));
 await page.getByLabel('Datum',{exact:true}).fill(firstDate);
 await expect(page.locator('form').getByRole('alert')).toHaveText('Tijdelijk niet bereikbaar');
 await expect(page.getByRole('button',{name:'Afspraak opslaan'})).toBeDisabled();
 failed=false;
 await page.getByLabel('Datum',{exact:true}).fill(secondDate);
 const slotLabel=new Intl.DateTimeFormat('nl-NL',{timeZone:'Europe/Amsterdam',hour:'2-digit',minute:'2-digit'}).format(new Date(`${secondDate}T08:00:00.000Z`));
 const time=page.getByRole('button',{name:slotLabel,exact:true});
 await time.click();
 await expect(time).toHaveAttribute('aria-pressed','true');
 const booking=page.waitForRequest(req=>req.url().includes('/api/internal/book')&&req.method()==='POST');
 await page.route('**/api/internal/book',route=>route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'Deze tijd is zojuist geboekt. Kies een andere tijd.'})}));
 await page.getByRole('button',{name:'Afspraak opslaan'}).click();
 const payload=(await booking).postDataJSON();
 expect(payload.customerId).toBeTruthy();expect(payload.staffId).toBeTruthy();
 expect(payload.customer.name).toBe(await page.locator('input[name="name"]').inputValue());
 expect(payload.customer.phone).toBe(await page.locator('input[name="phone"]').inputValue());
 expect(payload.customer.email).toBe(await page.locator('input[name="email"]').inputValue());
 await expect(page.locator('form').getByRole('alert')).toContainText('zojuist geboekt');
 await expect(page.getByRole('button',{name:'Afspraak opslaan'})).toBeEnabled();
});

test('Reports offers four primary metrics and keeps advanced controls available',async({page})=>{
 await page.goto('/app/reports');
 const metrics=page.getByRole('region',{name:'Kerncijfers'});
 await expect(metrics.locator('p').filter({hasText:/Afgeronde behandelwaarde|Geplande waarde|Afspraken|No-showpercentage/})).toHaveCount(4);
 await expect(page.getByLabel('Van',{exact:true})).not.toBeVisible();
 await page.getByText('Andere periode kiezen',{exact:true}).click();
 await expect(page.getByLabel('Van',{exact:true})).toBeVisible();
 await page.getByText('Meer details',{exact:true}).click();
 await expect(page.getByText('Annuleringspercentage',{exact:true})).toBeVisible();
 await expect(page.getByRole('link',{name:'CSV exporteren'})).toBeVisible();
});


test('secondary destructive actions can be dismissed without changing appointment',async({page})=>{
 const db=qaDatabase();
 const {data:salon,error:salonError}=await db.from('salons').select('id').eq('slug','salon').single();if(salonError)throw salonError;
 const {data:item,error}=await db.from('appointments').select('id,status').eq('salon_id',salon.id).eq('status','confirmed').limit(1).single();if(error)throw error;
 await page.goto(`/app/appointments/${item.id}`);
 await expect(page.getByRole('button',{name:'Annuleren',exact:true})).not.toBeVisible();
 await page.getByText('Meer acties',{exact:true}).click();
 page.once('dialog',dialog=>dialog.dismiss());
 await page.getByRole('button',{name:'Annuleren',exact:true}).click();
 await expect(page.getByRole('button',{name:'Annuleren',exact:true})).toBeVisible();
 const {data:unchanged,error:readError}=await db.from('appointments').select('status').eq('id',item.id).eq('salon_id',salon.id).single();if(readError)throw readError;
 expect(unchanged.status).toBe(item.status);
});


test('new appointment finishes and confirmed cancellation applies only to disposable booking',async({page})=>{
 const db=qaDatabase();const customerName=`QA simplicity ${randomUUID()}`;const testStaff=randomUUID(),testService=randomUUID();
 const {data:salon,error:salonError}=await db.from('salons').select('id,timezone').eq('slug','salon').single();if(salonError)throw salonError;
 try{
  for(const query of [db.from('staff').insert({id:testStaff,salon_id:salon.id,name:customerName,active:true}),db.from('services').insert({id:testService,salon_id:salon.id,name:customerName,duration_minutes:30,buffer_minutes:0,price_cents:1000,active:true})]){const r=await query;if(r.error)throw r.error}
  for(const query of [db.from('staff_services').insert({salon_id:salon.id,staff_id:testStaff,service_id:testService}),db.from('staff_schedules').insert(Array.from({length:7},(_,weekday)=>({salon_id:salon.id,staff_id:testStaff,weekday,is_working:true,start_time:'09:00',end_time:'20:00'})))]){const r=await query;if(r.error)throw r.error}
  await page.goto('/app/calendar/new');
  await page.getByRole('combobox',{name:/^Behandeling/}).selectOption(testService);
  await page.getByLabel('Klantnaam',{exact:true}).fill(customerName);
  let slot=null;
  for(let offset=1;offset<8&&!slot;offset++){
   const date=new Date();date.setUTCDate(date.getUTCDate()+offset);const dateString=date.toISOString().slice(0,10);
   const response=page.waitForResponse(r=>r.url().includes('/api/internal/availability?')&&new URL(r.url()).searchParams.get('date')===dateString);
   await page.getByLabel('Datum',{exact:true}).fill(dateString);
   const result=await response;expect(result.status()).toBe(200);const body=await result.json();slot=body.slots?.[0]?.start??null;
  }
  expect(slot).toBeTruthy();
  const time=new Intl.DateTimeFormat('nl-NL',{timeZone:salon.timezone,hour:'2-digit',minute:'2-digit'}).format(new Date(slot));
  await page.getByRole('button',{name:time,exact:true}).click();
  const result=page.waitForResponse(r=>r.url().endsWith('/api/internal/book')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Afspraak opslaan'}).click();
  const response=await result;expect(response.status()).toBe(201);const {appointmentId}=await response.json();
  await expect(page).toHaveURL(new RegExp(`/app/appointments/${appointmentId}$`));
  await expect(page.getByRole('heading',{name:customerName,exact:true})).toBeVisible();
  await page.getByText('Meer acties',{exact:true}).click();
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Annuleren',exact:true}).click();
  await expect(page.locator('[data-status-chip]')).toHaveText('Geannuleerd');
  const {data:booking,error}=await db.from('appointments').select('status,customer_id').eq('id',appointmentId).eq('salon_id',salon.id).single();if(error)throw error;
  expect(booking.status).toBe('cancelled');
 }finally{
  const {data:customers,error}=await db.from('customers').select('id').eq('salon_id',salon.id).eq('name',customerName);if(error)throw error;
  for(const customer of customers??[]){const deleted=await db.from('appointments').delete().eq('salon_id',salon.id).eq('customer_id',customer.id);if(deleted.error)throw deleted.error;const cleaned=await db.from('customers').delete().eq('salon_id',salon.id).eq('id',customer.id).eq('name',customerName);if(cleaned.error)throw cleaned.error;}
  for(const query of [db.from('appointments').delete().eq('salon_id',salon.id).eq('staff_id',testStaff),db.from('staff').delete().eq('salon_id',salon.id).eq('id',testStaff),db.from('services').delete().eq('salon_id',salon.id).eq('id',testService)]){const r=await query;if(r.error)throw r.error}
 }
});
