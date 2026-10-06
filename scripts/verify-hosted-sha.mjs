import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const expected=process.env.SALON_QA_SHA,base=process.env.QA_BASE_URL;
assert.match(expected??'',/^[a-f0-9]{40}$/);assert.ok(base);
const wait=process.argv.includes('--wait');const deadline=Date.now()+(wait?20*60000:0);
let observed;
do{
 try{const response=await fetch(new URL('/api/release',base),{signal:AbortSignal.timeout(15000),cache:'no-store'});if(response.ok)observed=(await response.json()).sha;if(observed===expected)break}catch{}
 if(!wait||Date.now()>deadline)throw new Error(`Hosted SHA mismatch: expected ${expected}, observed ${observed??'unavailable'}`);
 await new Promise(resolve=>setTimeout(resolve,15000));
}while(true);
await mkdir('qa-artifacts/release',{recursive:true});await writeFile('qa-artifacts/release/hosted-sha.json',JSON.stringify({expected,observed,base,verifiedAt:new Date().toISOString()},null,2));
console.log('EXACT_HOSTED_SHA_PASS',JSON.stringify({expected,observed,base}));
