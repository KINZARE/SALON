import {test,expect} from '@playwright/test';

test('daily shell, Today hierarchy and secondary destinations',async({page})=>{
 await page.goto('/app/today');
 const nav=page.getByRole('navigation',{name:'Hoofdnavigatie',exact:true});
 await expect(nav.getByRole('link')).toHaveText(['Vandaag','Agenda','Klanten','Meer']);
 await expect(nav.getByRole('link',{name:'Vandaag',exact:true})).toHaveAttribute('aria-current','page');
 await expect(page.getByRole('link',{name:'Nieuwe afspraak',exact:true})).toHaveCount(1);
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
 expect(new URL(page.url()).searchParams.get('customerId')).toBeTruthy();
 await expect(page.getByRole('button',{name:'Andere / nieuwe klant'})).toBeVisible();
 await expect(page.getByLabel('Klantnaam',{exact:true})).toHaveCount(0);
 await expect(page.getByLabel('Notitie (optioneel)')).not.toBeVisible();
 await page.getByText('Meer opties',{exact:true}).click();
 await expect(page.getByLabel('Notitie (optioneel)')).toBeVisible();
 let failed=true;
 await page.route('**/api/internal/availability?*',route=>route.fulfill({status:failed?503:200,contentType:'application/json',body:JSON.stringify(failed?{error:'Tijdelijk niet bereikbaar'}:{slots:[{start:'2026-10-12T08:00:00.000Z'}]})}));
 await page.getByLabel('Datum',{exact:true}).fill('2026-10-12');
 await expect(page.getByRole('alert')).toHaveText('Tijdelijk niet bereikbaar');
 await expect(page.getByRole('button',{name:'Afspraak opslaan'})).toBeDisabled();
 failed=false;
 await page.getByLabel('Datum',{exact:true}).fill('2026-10-13');
 const time=page.getByRole('button',{name:'10:00',exact:true});
 await time.click();
 await expect(time).toHaveAttribute('aria-pressed','true');
 const booking=page.waitForRequest(req=>req.url().includes('/api/internal/book')&&req.method()==='POST');
 await page.route('**/api/internal/book',route=>route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'Deze tijd is zojuist geboekt. Kies een andere tijd.'})}));
 await page.getByRole('button',{name:'Afspraak opslaan'}).click();
 const payload=(await booking).postDataJSON();
 expect(payload.customerId).toBeTruthy();expect(payload.staffId).toBeTruthy();
 await expect(page.getByRole('alert')).toContainText('zojuist geboekt');
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
