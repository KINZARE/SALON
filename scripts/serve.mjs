import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('out');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.png':'image/png','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
createServer(async(req,res)=>{try{let path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}if((await stat(path)).isDirectory())path=resolve(path,'index.html');const file=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream','cache-control':'no-cache'});res.end(file);}catch{res.writeHead(404).end('Not found');}}).listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Static preview ready'));
