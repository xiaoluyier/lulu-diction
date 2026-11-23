import {template} from './importer.js';
export const frenchExample = '歌名：Chacun le sait\n语言：fr\n\nChacun le sait, chacun le dit,\nLe régiment par excellence.';
export const guide = `请把我提供的材料整理成「噜妹的练声室」能直接导入的纯文本。
第 1 行写“歌名：”和原曲名。材料未注明曲名时，用歌词首句作标题。
第 2 行写“语言：fr”（法语）或“语言：it”（意大利语）。第 3 行留空。从第 4 行开始，每行一个乐句。
只提取原文歌词，保留原顺序、重复句、重音符号、撇号和连字符。去掉词表、音标、中文译文、段落编号和发音笔记，不补写歌词。
每首歌单独输出，便于我逐首复制。只给纯文本，不加 Markdown 围栏或解释。每首最多 200 行歌词、16,000 字符，每行最多 70 个词、450 字符。`;
export const guideWithExamples = [guide,'法语输出示例',frenchExample,'意大利语输出示例',template,'待整理的原始材料（粘贴在这里）：'].join('\n\n');

