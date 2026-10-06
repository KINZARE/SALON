import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE_URL;if(!base)throw new Error('QA_BASE_URL required');
const cases=[['/app/today',390],['/app/today',1440],['/app/calendar?view=day',390],['/app/calendar?view=day',1440],['/app/customers',390],['/app/reports',390],['/book/salon',390]];
const browser=await chromium.launch(process.env.QA_CHROMIUM_PATH?{executablePath:process.env.QA_CHROMIUM_PATH,args:['--no-sandbox']}:{});const results=[];
try{for(const [route,width]of cases)for(let run=0;run<2;run++){
 const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();
 await page.addInitScript(()=>{window.__dailyPerf={lcp:null,cls:0};new PerformanceObserver(list=>{for(const e of list.getEntries())window.__dailyPerf.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__dailyPerf.cls+=e.value}).observe({type:'layout-shift',buffered:true})});
 const response=await page.goto(new URL(route,base).href,{waitUntil:'networkidle'});if(!response.ok())throw new Error(`${route}: ${response.status()}`);
 const metrics=await page.evaluate(()=>{const nav=performance.getEntriesByType('navigation')[0];const js=performance.getEntriesByType('resource').filter(x=>new URL(x.name).pathname.endsWith('.js'));return{ttfbMs:nav.responseStart,lcpMs:window.__dailyPerf.lcp,cls:window.__dailyPerf.cls,transferredJs:js.reduce((s,x)=>s+x.transferSize,0)}});
 results.push({route,width,run,...metrics});await context.close();
}await mkdir('qa-artifacts/performance',{recursive:true});await writeFile(`qa-artifacts/performance/simplicity-${process.env.QA_PROFILE_LABEL??'after'}.json`,JSON.stringify({base,sha:process.env.SALON_QA_SHA,conditions:'Two cold navigations per case; hosted Chromium, no throttle; lab only, not field CWV. Production before / preview after have network variance.',results},null,2));console.log(JSON.stringify(results));}finally{await browser.close()}
