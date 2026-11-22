let worker,seq=0,ctx,source,utter,cancelPlay,serial=0;const pending=new Map();
function engine(args){if(!worker){worker=new Worker(new URL('./engine-worker.js',import.meta.url),{type:'module'});worker.onmessage=({data})=>{const pair=pending.get(data.id);if(!pair)return;pending.delete(data.id);data.error?pair[1](Error(data.error)):pair[0](data)};worker.onerror=()=>{for(const p of pending.values())p[1](Error('语音组件未加载，请刷新重试。'));pending.clear();worker.terminate();worker=null;};}return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,[resolve,reject]);worker.postMessage({id,...args})});}
export const transcribe=async(lang,words)=>(await engine({lang,words})).ipa;
export function unlock(){ctx??=new (window.AudioContext||window.webkitAudioContext)();return ctx.resume()}
let neural,media,prepared;const jobs=new Map(),cache=new Map();
function render(text,lang,rate){
 const key=JSON.stringify([text,lang,rate]);if(cache.has(key))return Promise.resolve(cache.get(key));
 if(!neural){neural=new Worker(new URL('./natural-worker.js',import.meta.url),{type:'module'});neural.onmessage=({data:d})=>{const job=jobs.get(d.id);if(!job)return;jobs.delete(d.id);if(d.error){job.reject(Error(d.error));return}if(cache.size>=30)cache.delete(cache.keys().next().value);cache.set(job.key,d);job.resolve(d)};neural.onerror=()=>{for(const j of jobs.values())j.reject(Error('自然语音暂不可用。'));jobs.clear();neural.terminate();neural=null;};}
 return new Promise((resolve,reject)=>{const id=++seq;jobs.set(id,{resolve,reject,key});neural.postMessage({id,text,lang,rate})});
}
export function stop(){serial++;cancelPlay?.();cancelPlay=null;media?.pause();media=null;try{source?.stop()}catch{}source=null;}
export async function speak(text,lang,rate=1){
 stop();const id=serial;await unlock();
 prepared??=import('./voice-clips.js').then(m=>m.clips).catch(()=>({}));const path=(await prepared)[lang+'|'+text.toLowerCase().trim()];if(id!==serial)return false;
 if(path){try{return await new Promise((ok,no)=>{const a=media=new Audio(new URL('./clips/'+path,import.meta.url));a.preservesPitch=true;a.playbackRate=rate;a.onended=()=>ok(id===serial);a.onerror=()=>no(Error());cancelPlay=()=>ok(false);a.play().catch(no)})}catch{if(id!==serial)return false}}
 const wait=setTimeout(()=>{if(id===serial)window.dispatchEvent(new Event('preparing-natural-voice'))},900);
 let d;try{d=await render(text,lang,rate)}finally{clearTimeout(wait)}
 if(id!==serial)return false;const b=ctx.createBuffer(1,d.samples.length,d.hz);b.copyToChannel(d.samples,0);
 return new Promise(ok=>{source=ctx.createBufferSource();source.buffer=b;source.connect(ctx.destination);source.onended=()=>ok(id===serial);cancelPlay=()=>ok(false);source.start()});
}
export async function capture(){
 if(!navigator.mediaDevices?.getUserMedia)throw Error('浏览器没有提供麦克风，请用 HTTPS 在 Safari 或 Chrome 中打开。');
 await unlock();const stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true}});
 const input=ctx.createMediaStreamSource(stream),proc=ctx.createScriptProcessor(4096,1,1),silent=ctx.createGain();silent.gain.value=0;const blocks=[];let len=0,closed=false;
 proc.onaudioprocess=e=>{if(len<ctx.sampleRate*30){const a=e.inputBuffer.getChannelData(0).slice();blocks.push(a);len+=a.length}};
 input.connect(proc);proc.connect(silent);silent.connect(ctx.destination);
 return ()=>{if(closed)return;closed=true;input.disconnect();proc.disconnect();silent.disconnect();stream.getTracks().forEach(t=>t.stop());const joined=new Float32Array(len);let i=0;for(const b of blocks){joined.set(b,i);i+=b.length}
 const step=ctx.sampleRate/16000,out=new Float32Array(Math.floor(len/step));for(let j=0;j<out.length;j++){let n=Math.floor(j*step),end=Math.min(len,Math.max(n+1,Math.floor((j+1)*step))),sum=0;for(let a=n;a<end;a++)sum+=joined[a];out[j]=sum/(end-n)}return out;};
}
export function wav(a){const b=new ArrayBuffer(44+a.length*2),d=new DataView(b);const txt=(i,s)=>[...s].forEach((c,j)=>d.setUint8(i+j,c.charCodeAt(0)));txt(0,'RIFF');d.setUint32(4,b.byteLength-8,true);txt(8,'WAVEfmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,16000,true);d.setUint32(28,32000,true);d.setUint16(32,2,true);d.setUint16(34,16,true);txt(36,'data');d.setUint32(40,a.length*2,true);a.forEach((x,i)=>d.setInt16(44+i*2,Math.max(-1,Math.min(1,x))*32767,true));return new Blob([b],{type:'audio/wav'});}

