import fs from 'node:fs';const out='site/vendor/';fs.mkdirSync(out,{recursive:true});
const base='node_modules/@echogarden/espeak-ng-emscripten/';let js=fs.readFileSync(base+'espeak-ng.js','utf8'),data=fs.readFileSync(base+'espeak-ng.data'),arr=[];let size=0;
js=js.replace(/\{filename:"([^"]+)",start:(\d+),end:(\d+)\},?/g,(m,n,a,b)=>{if(n.endsWith('_dict')&&!/(fr|it|en)_dict$/.test(n))return '';const start=size;arr.push(data.subarray(+a,+b));size+=b-a;return '{filename:'+JSON.stringify(n)+',start:'+start+',end:'+size+'},';}).replace(/remote_package_size:\d+/,'remote_package_size:'+size);
fs.writeFileSync(out+'espeak-ng.js',js);fs.writeFileSync(out+'espeak-ng.data',Buffer.concat(arr));fs.copyFileSync(base+'COPYING',out+'ESPEAK-LICENSE.txt');fs.copyFileSync('node_modules/vosk-browser/dist/vosk.js',out+'vosk.js');
const icons=['settings-2','book-open','audio-lines','mic','chevron-right','chevron-left','plus','play','volume-2','square','copy','x','check','list-music','headphones','repeat-2'];
const symbols=icons.map(id=>{const s=fs.readFileSync('node_modules/lucide-static/icons/'+id+'.svg','utf8');return '<symbol id="'+id+'" viewBox="0 0 24 24">'+s.split(/<svg[^>]*>/)[1].split('</svg>')[0]+'</symbol>'});
fs.writeFileSync('site/assets/icons.svg','<svg xmlns="http://www.w3.org/2000/svg">'+symbols.join('')+'</svg>');
console.log('voice data',size);

