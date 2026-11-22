export const locales={it:'it-IT',fr:'fr-FR'};
export const norm=s=>s.normalize('NFC').toLocaleLowerCase().replaceAll('’',"'");
export const tokens=s=>s.match(/\p{L}[\p{L}\p{M}]*(?:['’‑-]\p{L}[\p{L}\p{M}]*)*/gu)||[];
export function makeSong(title,lang,raw,id=crypto.randomUUID()){
 if(!locales[lang]||!raw.trim()||raw.length>16000)throw Error('请粘贴 1 至 16,000 字符的法语或意大利语歌词。');
 const lines=raw.normalize('NFC').split(/\r?\n/).map(s=>s.trim()).filter(s=>tokens(s).length);
 if(!lines.length||lines.length>200||lines.some(l=>l.length>450||tokens(l).length>70))throw Error('每个乐句请单独一行，最多 200 行，每行最多 70 个词、450 个字符。');
 return {id,title:(title.trim()||lines[0]).slice(0,100),lang,lines,notes:[],wordQueue:[],lineQueue:[],heardW:[],heardL:[],goals:[]};
}
export function vocab(song){
 const words=new Map;
 song.lines.forEach((line,i)=>tokens(line).forEach((label,j)=>{const key=norm(label);if(!words.has(key))words.set(key,{key,label,line:i,pos:j});}));
 return [...words.values()].sort((a,b)=>Number(song.wordQueue.includes(b.key))-Number(song.wordQueue.includes(a.key)));
}
// Reconcile only the assessed scope; listening and reassessment are distinct operations.
export function recordReview(song,line,issues,scope=null,confirmed=false){
 const relevant=n=>n.line===line&&(scope===null||n.pos===scope);
 const prev=song.notes.filter(relevant);
 const incoming=new Set(issues.map(n=>n.pos));
 song.notes=song.notes.filter(n=>!relevant(n)||(!confirmed&&!incoming.has(n.pos)));
 for(const issue of issues){const label=tokens(song.lines[line])[issue.pos];if(!label)continue;
 song.notes.push({...issue,line,key:norm(label)}); if(!song.wordQueue.includes(norm(label)))song.wordQueue.push(norm(label));
 }
 if(issues.length&&!song.lineQueue.includes(line))song.lineQueue.push(line);
 if(confirmed){song.wordQueue=song.wordQueue.filter(k=>song.notes.some(n=>n.key===k));song.lineQueue=song.lineQueue.filter(i=>song.notes.some(n=>n.line===i));}
}
export function listened(song,kind,key){
 const w=kind==='words', queue=w?'wordQueue':'lineQueue', hist=w?'heardW':'heardL';
 song[queue]=song[queue].filter(x=>x!==key);if(!song[hist].includes(key))song[hist].push(key);
 const total=w?vocab(song).length:song.lines.length,count=song[hist].length;
 const milestone=count===total?'all':w&&count===3?'three':!w&&count===1?'one':'';
 const id=kind+milestone;if(!milestone||song.goals.includes(id))return '';
 song.goals.push(id);return milestone==='all'?(w?'这一首的词，都听过啦。':'每一句，都听过啦。'):w?'三个词，一小步。':'第一个乐句，完成。';
}
export function align(expected,actual){
 const a=expected.map(norm),b=actual.map(norm),d=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i?j?0:i:j));
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+Number(a[i-1]!==b[j-1]));
 const out=[];let i=a.length,j=b.length;while(i||j){
 if(i&&j&&d[i][j]===d[i-1][j-1]+Number(a[i-1]!==b[j-1])){out.push([--i,--j]);}
 else if(i&&d[i][j]===d[i-1][j]+1)out.push([--i,-1]);else out.push([-1,--j]);}
 return out.reverse();
}
export function hint(word,lang){
 const w=norm(word);
 if(lang==='it'&&/([bcdfglmnpqrstvz])\1/.test(w))return '双写辅音要留出时长。先慢读这个词，再放回原句。';
 if(lang==='fr'&&['tu','du','sur','lune','une'].includes(w))return '读 /y/：舌位保持在“衣”，同时把嘴唇收圆。';
 return lang==='it'?'先听重读元音，再跟读整个词。':'先对照元音听一遍，再把这个词放回整句。';
}
export function asrReview(text,observed,lang){
 const ref=tokens(text),hyp=tokens(observed);
 if(!hyp.length)throw Error('这次没有听清。靠近麦克风，再读一遍。');
 const issues=[];for(const [i,j] of align(ref,hyp)){if(i<0||norm(ref[i])===norm(hyp[j]||''))continue;
 issues.push({pos:i,reason:j<0?'这次未辨认出这个词。':'识别结果更接近「'+hyp[j]+'」，建议复听。',tip:hint(ref[i],lang),kind:'review'});}
 return issues;
}
export const demos=()=>[makeSong('Caro mio ben','it','Caro mio ben,\ncredimi almen,\nsenza di te\nlanguisce il cor.','caro'),makeSong('Au clair de la lune','fr','Au clair de la lune,\nmon ami Pierrot,\nprête-moi ta plume\npour écrire un mot.','lune')];

