"""Save compact, credited previews of public Bilibili video covers."""
from io import BytesIO
from pathlib import Path
import json, requests
from PIL import Image
out=Path(__file__).resolve().parents[1]/'site'/'assets'; raw=json.loads((out.parents[1]/'.cache/sources.json').read_text(encoding='utf8'))
ids=[('BV1n7WT67Ew8','花边帽钩织'),('BV1cTW56MEB5','一起唱歌'),('BV11yp96HEPd','噜噜和噜妹'),('BV1tVyizLEfL','一起吃饭')];album=[]
for i,(bid,label) in enumerate(ids):
 v=next(x for x in raw if x['bvid']==bid);resp=requests.get(v['url'],headers={'Referer':'https://www.bilibili.com/'},timeout=12);resp.raise_for_status()
 im=Image.open(BytesIO(resp.content)).convert('RGB');im.thumbnail((460,280));name='album-'+str(i)+'.webp';im.save(out/name,'WEBP',quality=77,method=6)
 album.append({'label':label,'author':v['author'],'title':v['title'],'href':'https://www.bilibili.com/video/'+bid+'/','image':'./assets/'+name})
(out/'album.json').write_text(json.dumps(album,ensure_ascii=False),encoding='utf8')

