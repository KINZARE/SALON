import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
async function files(path){return (await Promise.all((await readdir(path,{withFileTypes:true})).map(d=>d.isDirectory()?files(`${path}/${d.name}`):`${path}/${d.name}`))).flat();}
const assets=(await files('out/_next/static')).sort();
const digest=createHash('sha256');for(const asset of assets)digest.update(await readFile(asset));digest.update(await readFile('out/index.html'));
const version=digest.digest('hex').slice(0,16);
const urls=['/','/icon.svg','/manifest.webmanifest',...assets.map(a=>'/'+a.slice(4))];
let template=await readFile('public/sw.js','utf8');template=template.replace("'shared-money-shell-v1'",`'shared-money-shell-${version}'`).replace("['/','/icon.svg','/manifest.webmanifest']",JSON.stringify(urls));
await writeFile('out/sw.js',template);console.log(`Offline shell ${version}: ${urls.length} assets precached`);
