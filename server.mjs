import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {advicePrompt} from './site/assessment.js';
const root=fileURLToPath(new URL('./site/',import.meta.url)),port=Number(process.env.PORT||4387),host='127.0.0.1';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.mp3':'audio/mpeg','.json':'application/json','.wav':'audio/wav','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.gz':'application/octet-stream','.data':'application/octet-stream','.txt':'text/plain'};
http.createServer(async(req,res)=>{try{
 if(req.headers.host!==host+':'+port&&req.headers.host!=='localhost:'+port){res.writeHead(403).end();return;}
 const url=new URL(req.url,'http://localhost'),json=(status,obj)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(obj))};
 if(url.pathname==='/api/status')return json(200,{deepseek:!!process.env.DEEPSEEK_API_KEY});
 if(url.pathname==='/api/advice'){
 if(req.method!=='POST'||req.headers.origin!=='http://'+req.headers.host)return json(403,{});
 if(!process.env.DEEPSEEK_API_KEY)return json(503,{});
 let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>16000)return json(413,{})}const data=JSON.parse(raw);
 if(!['fr','it'].includes(data.lang)||typeof data.text!=='string'||data.text.length>450||!Array.isArray(data.issues)||data.issues.length>70)return json(400,{});
 const api=(process.env.DEEPSEEK_BASE_URL||'https://api.deepseek.com').replace(/\/+$/,'');const r=await fetch(api+'/chat/completions',{method:'POST',signal:AbortSignal.timeout(40000),headers:{Authorization:'Bearer '+process.env.DEEPSEEK_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.DEEPSEEK_MODEL||'deepseek-chat',messages:[{role:'system',content:advicePrompt},{role:'user',content:JSON.stringify(data)}],response_format:{type:'json_object'}})});
 if(!r.ok)return json(502,{});const reply=await r.json();return json(200,JSON.parse(reply.choices[0].message.content));
 }
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405).end();return;}
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':fs.statSync(file).size});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
 }catch{if(!res.headersSent)res.writeHead(500);res.end();}}).listen(port,host,()=>console.log('http://'+host+':'+port));

