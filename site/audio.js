let worker,seq=0,ctx,source,utter,cancelPlay,serial=0;const pending=new Map();
function engine(args){if(!worker){worker=new Worker(new URL('./engine-worker.js',import.meta.url),{type:'module'});worker.onmessage=({data})=>{const pair=pending.get(data.id);if(!pair)return;pending.delete(data.id);data.error?pair[1](Error(data.error)):pair[0](data)};worker.onerror=()=>{for(const p of pending.values())p[1](Error('语音组件未加载，请刷新重试。'));pending.clear();worker.terminate();worker=null;};}return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,[resolve,reject]);worker.postMessage({id,...args})});}
export const transcribe=async(lang,words)=>(await engine({lang,words})).ipa;
export function unlock(){ctx??=new (window.AudioContext||window.webkitAudioContext)();return ctx.resume()}
export function stop(){serial++;if(cancelPlay)cancelPlay();cancelPlay=null;try{window.speechSynthesis?.cancel();source?.stop()}catch{}source=null;utter=null;}
export async function speak(text,lang,rate=1){
 stop();const id=serial;await unlock();const synth=window.speechSynthesis;
 const voice=synth?.getVoices().find(v=>v.lang.toLowerCase().startsWith(lang));
 if(voice){try{const ok=await new Promise((res,rej)=>{const u=new SpeechSynthesisUtterance(text);utter=u;u.voice=voice;u.lang=voice.lang;u.rate=rate;const timer=setTimeout(()=>{synth.cancel();rej(Error())},Math.max(7000,text.length*300));cancelPlay=()=>{clearTimeout(timer);res(false)};u.onend=()=>{clearTimeout(timer);res(id===serial)};u.onerror=()=>{clearTimeout(timer);rej(Error())};synth.speak(u)});return ok;}catch{if(id!==serial)return false}}
 const d=await engine({lang,text,rate});if(id!==serial)return false;
 if(!d.samples.length)throw Error('没有生成示范音频。');const b=ctx.createBuffer(1,d.samples.length,d.hz);b.copyToChannel(Float32Array.from(d.samples,x=>x/32768),0);
 return new Promise(res=>{source=ctx.createBufferSource();source.buffer=b;source.connect(ctx.destination);source.onended=()=>res(id===serial);cancelPlay=()=>res(false);source.start()});
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

