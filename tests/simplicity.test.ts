import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=(path:string)=>readFileSync(path,'utf8');
test('desktop and mobile use the same daily navigation without a management sidebar',()=>{
 const nav=source('src/components/app-shell/nav.tsx');
 assert.doesNotMatch(nav,/desktopPrimary|secondary\.map|>Beheer</);
 assert.match(nav,/aria-current/);
});
test('Today puts the next appointment before the compact summary',()=>{
 const today=source('src/components/workspace/daily/daily-workspace.tsx');
 assert.ok(today.indexOf('data-orsira-next-appointment')<today.indexOf('<TodaySummary'));
 const summary=source('src/components/workspace/today-summary.tsx');
 assert.doesNotMatch(summary,/grid-cols|items\.map/);
 assert.match(summary,/staffRole/);
});
test('Today has one create action and only useful gaps',()=>{
 const actions=source('src/components/workspace/quick-actions.tsx');
 assert.match(actions,/Nieuwe afspraak/);
 assert.doesNotMatch(actions,/Blokkeer tijd|Deel tijden|Klant toevoegen/);
 const today=source('src/components/workspace/daily/daily-workspace.tsx');
 assert.match(today,/data\.gaps\.length/);
});
test('booking starts with customer and discloses notes while retaining server slot authority',()=>{
 const form=source('src/components/appointments/new-appointment-form.tsx');
 assert.ok(form.indexOf('Zoek bestaande klant')<form.indexOf('<span>Behandeling</span>'));
 assert.match(form,/<summary[^>]*>Meer opties/);
 assert.match(form,/\/api\/internal\/availability/);
 assert.match(form,/\/api\/internal\/book/);
 assert.match(form,/staff\.length\s*>\s*1/);
});
test('appointment cancellation remains a secondary confirmed action',()=>{
 const detail=source('src/app/app/appointments/[id]/page.tsx');
 assert.match(detail,/<summary[^>]*>Meer acties/);
 assert.match(detail,/ConfirmButton/);
});
