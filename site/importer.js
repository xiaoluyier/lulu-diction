import {makeSong} from './core.js';
export const template='歌名：Caro mio ben\n语言：it\n\nCaro mio ben,\ncredimi almen,\nsenza di te\nlanguisce il cor.';
export function parseTXT(raw){
 const rows=raw.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split('\n');
 const title=/^歌名[：:]\s*(.{1,100})$/u.exec(rows[0]?.trim())?.[1]?.trim();
 if(!title)throw Error('第 1 行应为「歌名：歌曲名称」，名称不超过 100 字。');
 const lang=/^语言[：:]\s*(it|fr)$/u.exec(rows[1]?.trim())?.[1];
 if(!lang)throw Error('第 2 行应为「语言：it」或「语言：fr」。');
 if(rows[2]?.trim()!==''||rows.length<4)throw Error('第 3 行留空，第 4 行起每行写一句歌词。');
 return makeSong(title,lang,rows.slice(3).join('\n'));
}
