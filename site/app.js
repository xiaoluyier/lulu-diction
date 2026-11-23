import {tokens,norm,vocab,listened,recordReview,demos} from './core.js';import {template,parseTXT} from './importer.js';
import {guideWithExamples} from './import-guide.js';
import {unlock,speak,stop,capture,wav,transcribe} from './audio.js';import {localReview,azureReview,addAdvice} from './assessment.js';
const $=s=>document.querySelector(s),app=$('#app'),modal=$('#modal'),store='lulu.diction.v1';
const e=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ico=n=>'<svg aria-hidden="true"><use href="./assets/icons.svg#'+n+'"/></svg>';
const btn=(name,title,icon,cls='action',v='')=>'<button class="'+cls+'" data-do="'+name+'" data-v="'+e(v)+'" title="'+e(title)+'" aria-label="'+e(title)+'">'+ico(icon)+(cls==='play'||cls==='tool'?'':e(title))+'</button>';
const option=(value,label,sel)=>'<option value="'+e(value)+'" '+(sel?'selected':'')+'>'+e(label)+'</option>';
const rateOptions=()=>[0.5,0.7,0.85,1,1.15].map(x=>option(x,x+' ×',x===data.rate)).join('');
let data;try{data=JSON.parse(localStorage.getItem(store));if(!data?.songs?.length)throw Error()}catch{data={songs:demos(),id:'caro',rate:1,gifts:true}}
let view='home',line=0,pos=-1,run=0,busy=false,rec=null,recTimer=null,recURL='',runStatus='',playing='',report='',tt,rt;
const opt={azure:'',region:'',deep:'',bridge:false,model:'deepseek-chat'},song=()=>data.songs.find(s=>s.id===data.id)||data.songs[0];
if(['127.0.0.1','localhost'].includes(location.hostname))fetch('./api/status').then(r=>r.json()).then(v=>opt.bridge=!!v.deepseek).catch(()=>{});
const titles={words:'逐词跟读',lines:'逐句连读',review:'发音纠正'},icons={words:'book-open',lines:'audio-lines',review:'mic'};
const labelLang=lang=>lang==='it'?'意大利语':'法语';
function msg(s){$('#toast').textContent=s;clearTimeout(tt);tt=setTimeout(()=>$('#toast').textContent='',3500)}
function save(){try{localStorage.setItem(store,JSON.stringify(data))}catch{msg('设备存储空间不足，本次进度未保存。')}}
let coverCursor = 0;
try { coverCursor = Number(localStorage.getItem('lumei.coverIndex') || 0) % 9; } catch {}
const momentId = index => String(index + 1).padStart(2, '0');
const coverImage = './assets/moments/' + momentId(coverCursor) + '-face.webp';
try { localStorage.setItem('lumei.coverIndex', String((coverCursor + 1) % 9)); } catch {}
function reward(s) {
 if (!s || !data.gifts) return;
 const index = Number(data.rewardIndex || 0) % 9;
 const base = './assets/moments/' + momentId(index);
 $('#reward source').srcset = base + '-face.webp';
 $('#reward img').src = base + '.gif';
 data.rewardIndex = (index + 1) % 9;
 save();
 $('#rewardText').textContent = s;
 $('#reward').hidden = false;
 clearTimeout(rt);
 rt = setTimeout(() => $('#reward').hidden = true, 3000);
}
async function openAlbum() {
 const response = await fetch('./assets/album.json?v=moments');
 if (!response.ok) throw Error('相册暂时未能打开。');
 const photos = await response.json();
 const cards = photos.map(photo =>
  '<a target="_blank" rel="noopener" href="'+e(photo.image)+'"><img src="'+e(photo.image)+'" alt="'+e(photo.label)+'"><strong>'+e(photo.label)+'</strong></a>'
 );
 sheet('<h2>噜妹相册</h2><div class="gallery moments">'+cards.join('')+'</div>');
}
function reset(){run++;busy=false;playing='';stop();clearTimeout(recTimer);if(rec){rec();rec=null}if(recURL){URL.revokeObjectURL(recURL);recURL=''}runStatus='';report=''}
function go(v,i=0,j=-1){reset();view=v;line=i;pos=j;draw();window.scrollTo({top:0})}
function sheet(content){$('#dialogBody').innerHTML='<div class="split" style="justify-content:flex-end">'+btn('close','关闭','x','tool')+'</div>'+content;modal.showModal()}
const cache=new Map(),pending=new Set();
function ipaKey(lang,w){return lang+'|'+norm(w)}
function loadIPA(s){const ws=vocab(s).map(w=>w.key).filter(w=>!cache.has(ipaKey(s.lang,w))&&!pending.has(ipaKey(s.lang,w)));if(!ws.length)return;
 ws.forEach(w=>pending.add(ipaKey(s.lang,w)));transcribe(s.lang,ws).then(r=>{for(const w of ws)cache.set(ipaKey(s.lang,w),r[w]||'');if(song()===s)fillIPA()}).catch(()=>{if(song()===s)document.querySelectorAll('[data-ipa]').forEach(x=>{x.textContent='音标暂不可用'})}).finally(()=>ws.forEach(w=>pending.delete(ipaKey(s.lang,w))))}
function fillIPA(){document.querySelectorAll('[data-ipa]').forEach(x=>{const v=cache.get(ipaKey(song().lang,x.dataset.ipa));x.textContent=v?'/'+v+'/':v===''?'音标待核对':'…'})}
function notes(s,kind,key){const n=s.notes.filter(n=>kind==='words'?n.key===key:n.line===key);if(!n.length)return '';return '<details><summary>纠音记录 · '+n.length+'</summary>'+n.map(v=>'<p class="note">第 '+(v.line+1)+' 句 · '+e(tokens(s.lines[v.line])[v.pos])+'：'+e(v.reason)+' '+e(v.tip)+'</p>').join('')+'</details>'}
function marked(s,i){let j=0;return s.lines[i].replace(/[^\p{L}\p{M}'’‑-]+|\p{L}[\p{L}\p{M}]*(?:['’‑-]\p{L}[\p{L}\p{M}]*)*|./gu,t=>{if(!tokens(t).length)return e(t);const index=j++;const issue=s.notes.some(n=>n.line===i&&n.pos===index);return issue?'<span class="marked">'+e(t)+'</span>':e(t)})}
function draw(){const s=song(),ws=vocab(s),wq=s.wordQueue.length,lq=s.lineQueue.length;
 if(view==='home'){app.innerHTML='<div class="titleline"><h1>歌曲手帖</h1>'+btn('import','导入歌曲','plus')+'</div><div class="songhead"><img alt="" class="cover" src="./assets/'+s.lang+'-cover.png"><div><div class="meta"><span class="tag">'+labelLang(s.lang)+'</span><span>'+ws.length+' 个词 · '+s.lines.length+' 句</span></div><h2 lang="'+s.lang+'">'+e(s.title)+'</h2><select class="songSelect" id="selectSong" aria-label="选择歌曲">'+data.songs.map(x=>option(x.id,x.title,x.id===s.id)).join('')+'</select></div><button class="starPhoto" data-do="album" aria-label="打开噜妹相册"><img width="123" height="113" src="'+coverImage+'" alt="噜妹"><span>噜妹相册</span></button></div><section class="section"><div class="titleline"><h2>练习目录</h2><small>本曲进度</small></div><div class="modules">'+Object.keys(titles).map((k,i)=>{const n=[wq,lq,0][i];return '<button class="module" data-do="go" data-v="'+k+'"><span class="tile">'+ico(icons[k])+'</span><span><strong>'+titles[k]+'</strong><small>'+[s.heardW.length+' / '+ws.length+' 个词已听',s.heardL.length+' / '+s.lines.length+' 句已听',s.notes.length?'已记录 '+s.notes.length+' 处复练提示':'选择一句或一个词录音'][i]+'</small></span>'+ico('chevron-right')+(n?'<b class="badge" aria-label="'+n+' 项待复听">'+n+'</b>':'')+'</button>'}).join('')+'</div></section>';return}
 let top=btn('home','曲目','chevron-left','back')+'<div class="titleline"><div><small>'+e(s.title)+' · '+labelLang(s.lang)+'</small><h1>'+titles[view]+'</h1></div></div>';
 if(view==='review'){const txt=target(),words=tokens(s.lines[line]);app.innerHTML=top+'<div class="sheet stack"><label>选择原句<select id="lineSel" '+(busy?'disabled':'')+'>'+s.lines.map((l,i)=>option(i,(i+1)+' · '+l,i===line)).join('')+'</select></label><label>练习范围<select id="posSel" '+(busy?'disabled':'')+'>'+option(-1,'整句',pos<0)+words.map((w,j)=>option(j,w,j===pos)).join('')+'</select></label><div class="focus" lang="'+s.lang+'">'+e(txt)+'</div><div class="actions">'+btn('sample','听示范','volume-2')+btn('record',rec?'结束并纠音':'开始录音',rec?'square':'mic',rec?'action rec':'primary')+'</div><div id="status" class="busy" role="status">'+e(runStatus||((opt.azure?'专业发音评测':'本机辨读')+' · 最长 30 秒'))+'</div>'+(recURL?'<audio controls src="'+recURL+'"></audio>':'')+'</div>'+report+notes(s,'lines',line);const b=$('[data-do=record]');b.disabled=busy&&!rec;$('[data-do=sample]').disabled=busy;return}
 const w=view==='words',items=w?ws:s.lines.map((_,i)=>i);
 app.innerHTML=top+'<div class="toolbar">'+btn('auto',playing==='auto'?'暂停带读':w?'逐词带读':'连续朗读',playing==='auto'?'square':'play','primary')+'<select id="rate" aria-label="朗读速度">'+rateOptions()+'</select><small>'+((w?wq:lq)?(w?wq:lq)+' 项待复听':'暂无待复听')+'</small></div><div class="list">'+items.map((item,idx)=>{const key=w?item.key:item,title=w?item.label:s.lines[item],unread=(w?s.wordQueue:s.lineQueue).includes(key),heard=(w?s.heardW:s.heardL).includes(key);return '<div class="row '+(unread?'issue ':'')+(playing===String(key)?' active':'')+'"><span class="num">'+String(idx+1).padStart(2,'0')+'</span><div><button class="'+(w?'word':'lineText')+'" lang="'+s.lang+'" data-do="listen" data-v="'+e(key)+'">'+(w?e(title):marked(s,item))+'</button>'+(w?'<div class="ipa" data-ipa="'+e(item.key)+'"></div>':'')+(unread?'<small class="note">待复听</small>':heard?'<small class="quiet">已听</small>':'')+notes(s,view,key)+'</div><div class="iconWrap">'+btn('listen','听'+title,'volume-2','play',key)+btn('check','纠正发音','mic','tool',key)+'</div></div>'}).join('')+'</div>';if(w){fillIPA();loadIPA(s)}
}
function target(){const s=song();return pos<0?s.lines[line]:tokens(s.lines[line])[pos]}
async function listen(key,token){const s=song(),v=view,w=v==='words',value=w?key:Number(key),text=w?vocab(s).find(x=>x.key===key)?.label:s.lines[value];if(!text)return;const ok=await speak(text,s.lang,data.rate);if(ok&&run===token&&view===v&&song()===s){const gift=listened(s,v,value);save();draw();reward(gift)}return ok}
async function playOne(key){reset();const n=run;playing=key;draw();try{await listen(key,n)}catch{msg('示范未能播放，请重试。')}if(run===n){playing='';draw()}}
async function auto(){if(playing==='auto'){reset();draw();return}reset();const n=run,w=view==='words',list=w?vocab(song()).map(x=>x.key):song().lines.map((_,i)=>String(i));playing='auto';draw();try{for(const key of list){if(run!==n||!await listen(key,n))break;await new Promise(r=>setTimeout(r,w?1400:2100))}}catch{msg('示范未能播放，请重试。')}if(run===n){playing='';draw()}}
function importSheet(){sheet('<h2>导入歌曲</h2><p class="tip">把提示词和例子复制给 AI，在末尾附上原材料。将整理好的一首歌粘贴到下方。</p><div class="actions">'+btn('copyGuide','复制提示词＋例子','copy')+'</div><details id="guideDetails"><summary>查看提示词和法语、意大利语示例</summary><textarea id="guideText" aria-label="提示词和例子" readonly>'+e(guideWithExamples)+'</textarea></details><form id="importForm" class="stack"><textarea id="raw" aria-label="歌曲纯文本" required maxlength="16500" placeholder="'+e(template)+'"></textarea><div class="actions">'+btn('template','填入模板','list-music')+btn('copy','复制模板','copy')+'</div><p class="err" id="impErr" role="alert"></p><button class="primary">加入曲目</button></form>');$('#importForm').onsubmit=ev=>{ev.preventDefault();try{const s=parseTXT($('#raw').value);const same=data.songs.find(x=>x.lang===s.lang&&x.title===s.title&&x.lines.join('\n')===s.lines.join('\n'));if(!same)data.songs.push(s);data.id=(same||s).id;save();modal.close();go('home');msg(same?'已切换到这首歌。':'已加入曲目。')}catch(err){$('#impErr').textContent=err.message}}}
function settings(){sheet('<h2>练习设置</h2><form id="prefs" class="stack"><label>朗读速度<select id="prefRate">'+rateOptions()+'</select></label><label><input style="display:inline;width:auto" type="checkbox" id="gifts" '+(data.gifts?'checked':'')+'> 完成小目标时显示噜妹</label><details><summary>纠音服务</summary><p class="tip">默认用本机辨读，录音留在设备。填写 Azure 后，录音会发送至你的专业评测服务。DeepSeek 只接收目标文本和问题提示。密钥只在本次页面中使用。</p><div class="stack"><label>Azure 区域<input id="region" placeholder="例如 eastasia" value="'+e(opt.region)+'"></label><label>Azure Speech 密钥<input type="password" autocomplete="off" id="azkey" value="'+e(opt.azure)+'"></label><label>DeepSeek 密钥'+(opt.bridge?'（本机服务已连接）':'（选填）')+'<input type="password" autocomplete="off" id="dskey" value="'+e(opt.deep)+'"></label><label>DeepSeek 模型<input id="model" value="'+e(opt.model)+'"></label></div></details><button class="primary">保存</button></form>');$('#prefs').onsubmit=ev=>{ev.preventDefault();opt.azure=$('#azkey').value.trim();opt.region=$('#region').value.trim();opt.deep=$('#dskey').value.trim();opt.model=$('#model').value.trim();data.rate=Number($('#prefRate').value);data.gifts=$('#gifts').checked;save();modal.close();draw()}}
async function record(){const s=song(),token=run;if(rec){clearTimeout(recTimer);const samples=rec();rec=null;const text=target();try{
 if(samples.length<4000||Math.sqrt(samples.reduce((a,x)=>a+x*x,0)/samples.length)<.002)throw Error('录音太短或声音太轻，请再读一遍。');
 recURL=URL.createObjectURL(wav(samples));runStatus=opt.azure?'正在评测朗读…':'正在本机辨读，首次使用本语言需加载约 '+(s.lang==='it'?'50':'42')+' MB…';draw();
 const result=opt.azure?await azureReview(samples,s.lang,text,opt.azure,opt.region):await localReview(samples,s.lang,text);if(run!==token)return;
 let extra='';try{await addAdvice(result,text,s.lang,opt)}catch{extra=' · 已使用基础练法'}
 if(run!==token)return;const issues=result.issues.map(n=>({...n,pos:pos<0?n.pos:pos}));recordReview(s,line,issues,pos<0?null:pos,result.confirmed);save();
 runStatus=result.source+extra;report='<div class="sheet"><h2>'+(!issues.length?'本次未标出复练词':issues.length+' 处建议复练')+'</h2><p class="tip">'+(result.heard?'辨读结果：'+e(result.heard)+'。':'')+(result.confirmed?'':'辨读相符不代表每个音都读准。')+'</p>'+issues.map(n=>'<p class="note"><b>第 '+(line+1)+' 句 · '+e(tokens(s.lines[line])[n.pos])+'</b>　'+e(n.reason)+' '+e(n.tip)+'</p>').join('')+(issues.length?btn('go','去词表复听','book-open','action','words'):'')+'</div>';
 if(!s.goals.includes('record')){s.goals.push('record');save();reward('第一次认真听自己。')}
 }catch(err){if(run===token)runStatus=err.message}finally{if(run===token){busy=false;draw()}}return;}
 if(busy)return;stop();busy=true;report='';if(recURL){URL.revokeObjectURL(recURL);recURL=''}runStatus='正在打开麦克风…';draw();try{const finish=await capture();if(run!==token){finish();return}rec=finish;runStatus='正在录音，读完点「结束并纠音」。';draw();recTimer=setTimeout(()=>{if(rec&&run===token)record()},30000)}catch{if(run===token){busy=false;runStatus='未能打开麦克风，请检查浏览器的麦克风权限。';draw()}}}
document.addEventListener('click',async ev=>{const b=ev.target.closest('[data-do]');if(!b)return;const a=b.dataset.do,v=b.dataset.v;try{
 if(a==='copyGuide'){try{await navigator.clipboard.writeText(guideWithExamples);msg('提示词和两个例子已复制。')}catch{$('#guideDetails').open=true;$('#guideText').focus();$('#guideText').select();msg('已选中提示词和例子，请复制。')}}else if(a==='album'){await openAlbum()}else if(a==='close')modal.close();else if(a==='import')importSheet();else if(a==='template'){ev.preventDefault();$('#raw').value=template} else if(a==='copy'){ev.preventDefault();try{await navigator.clipboard.writeText(template);msg('模板已复制。')}catch{$('#raw').value=template;$('#raw').select()}}
 else if(a==='home'||a==='go')go(a==='home'?'home':v);else if(a==='listen')await playOne(v);else if(a==='auto')await auto();else if(a==='check'){if(view==='lines')go('review',+v);else{const x=vocab(song()).find(w=>w.key===v);const n=song().notes.find(z=>z.key===v);go('review',n?.line??x.line,n?.pos??x.pos)}}else if(a==='record')await record();else if(a==='sample'){await speak(target(),song().lang,data.rate)}
 }catch(err){msg(err.message||'请重试。')}});
document.addEventListener('change',ev=>{const id=ev.target.id,v=ev.target.value;if(id==='selectSong'){data.id=v;save();go('home')}else if(id==='lineSel')go('review',+v);else if(id==='posSel')go('review',line,+v);else if(id==='rate'){data.rate=Number(v);save()}});
$('#home').onclick=()=>go('home');$('#settings').onclick=()=>{if(busy){msg('请先结束录音或评测。');return}settings()};window.addEventListener('pagehide',reset);draw();

window.addEventListener('preparing-natural-voice',()=>msg('正在准备自然语音；首次使用需下载语音包。'));
