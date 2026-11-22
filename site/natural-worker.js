import * as ort from './voices/ort.wasm.min.mjs';
import espeak from './vendor/espeak-ng.js';
ort.env.wasm.numThreads=1;
ort.env.wasm.wasmPaths=new URL('./voices/',import.meta.url).href;
const engine=espeak({locateFile:n=>new URL('./vendor/'+n,import.meta.url).href}).then(m=>new m.eSpeakNGWorker());
let chain=Promise.resolve(),current,session,config;
async function synth({id,text,lang,rate}){
 if(current!==lang){
  if(session)await session.release();session=null;current=null;
  const configRes=await fetch(new URL('./voices/'+lang+'.onnx.json',import.meta.url));if(!configRes.ok)throw Error('语音包未下载完成。');
  config=await configRes.json();session=await ort.InferenceSession.create(new URL('./voices/'+lang+'.onnx',import.meta.url).href,{executionProviders:['wasm'],graphOptimizationLevel:'all'});current=lang;
 }
 const e=await engine;e.set_voice(config.espeak.voice);
 const map=config.phoneme_id_map,hz=config.audio.sample_rate,blocks=[];
 for(const match of text.matchAll(/([^.,;:!?…\n]+)([.,;:!?…]*)/gu)){
  const phrase=match[1].trim();if(!phrase)continue;
  const raw=e.synthesize_ipa(phrase).ipa.trim().replaceAll('_','').replace(/-\s/g,' ').replace(/-$/,'');
  const ids=[...map['^'],...map['_']];for(const p of (raw+(match[2]||'.')).normalize('NFD')){if(map[p])ids.push(...map[p],...map['_']);}ids.push(...map['$']);
  const inf=config.inference;
  const args={input:new ort.Tensor('int64',BigInt64Array.from(ids,BigInt),[1,ids.length]),input_lengths:new ort.Tensor('int64',BigInt64Array.of(BigInt(ids.length)),[1]),scales:new ort.Tensor('float32',Float32Array.of(inf.noise_scale,inf.length_scale/rate,inf.noise_w),[3])};
  const result=await session.run(args);const wave=result[session.outputNames[0]];blocks.push(wave.data.slice());wave.dispose();Object.values(args).forEach(t=>t.dispose());
  if(match[2])blocks.push(new Float32Array(Math.floor(hz*.105)));
 }
 const samples=new Float32Array(blocks.reduce((sum,b)=>sum+b.length,0));let pos=0,peak=.01;for(const b of blocks){samples.set(b,pos);pos+=b.length;for(const x of b)peak=Math.max(peak,Math.abs(x))}if(!pos)throw Error('没有可朗读的文字。');for(let i=0;i<pos;i++)samples[i]*=.94/peak;
 postMessage({id,samples,hz},[samples.buffer]);
}
onmessage=({data})=>{chain=chain.then(()=>synth(data)).catch(()=>postMessage({id:data.id,error:'自然语音未能加载，请检查网络后再试。'}))};

