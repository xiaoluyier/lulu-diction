"""Original pixel sticker, booklet covers and small celebration GIF."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import math,random
out=Path(__file__).resolve().parents[1]/'site'/'assets'
outline='#79434b';fur='#ffc35c';pink='#ed76a2';peach='#ffe7ca';cream='#fff8ed'
def character(frame=0):
 im=Image.new('RGBA',(168,154));d=ImageDraw.Draw(im);dy=[0,-2,-5,-4,-1,0][frame]
 def el(b,c,edge=outline,w=2):d.ellipse((b[0],b[1]+dy,b[2],b[3]+dy),fill=c,outline=edge,width=w)
 def poly(points,c,edge=outline):d.polygon([(x,y+dy) for x,y in points],fill=c,outline=edge,width=2)
 def ln(points,c,w=2):d.line([(x,y+dy) for x,y in points],fill=c,width=w,joint='curve')
 d.ellipse((35,137,138,149),fill='#e5a6ba')
 el((43,80,129,141),'#ffca6b');el((49,129,73,142),fur);el((98,129,123,142),fur)
 poly([(50,99),(116,94),(133,126),(124,132),(114,127),(103,133),(94,128),(82,134),(71,129),(61,133),(46,126)],'#f899b4')
 el((28,29,135,111),fur);el((32,34,50,55),fur);el((118,36,137,57),fur)
 el((22,65,103,108),'#ffbd5e');el((39,76,46,80),'#995c4c',None);el((52,75,59,79),'#995c4c',None)
 if frame==3:ln([(64,61),(68,63),(72,60)],outline);ln([(91,60),(96,62),(99,58)],outline)
 else:
  for x,y in [(68,57),(95,54)]:
   el((x-3,y,x+4,y+10),'#533d3f');el((x-1,y+1,x+1,y+3),'white',None)
 el((105,76,120,83),'#ee9784',None)
 ln([(59,91),(64,95),(71,94),(76,91)],outline)
 for i in range(10):
  a=math.pi+i*math.pi/9;x=83+51*math.cos(a);y=54+30*math.sin(a);el((int(x)-8,int(y)-8,int(x)+8,int(y)+7),cream,'#c38383',1)
 d.arc((35,21+dy,130,85+dy),194,348,fill='#de7ca0',width=5)
 el((73,14,95,34),'#f6a13c');poly([(83,15),(85,7),(96,9),(92,14)],'#6a9c80')
 poly([(119,44),(134,33),(138,46),(134,54),(124,50)],pink)
 poly([(122,47),(117,57),(107,52),(105,42),(114,42)],pink);el((117,44,125,52),'#e96b98')
 el((42,99,58,116),fur)
 arm=5 if frame in (1,2,3) else 0;el((112,91-arm,132,107-arm),fur)
 return im
ch=character();ch.save(out/'lumei.png',optimize=True)
frames=[]
for i in range(6):
 a=character(i).resize((63,58),Image.Resampling.NEAREST);im=Image.new('RGBA',a.size,'#fff4f8');im.alpha_composite(a);frames.append(im.convert('RGB'))
pal=frames[0].quantize(colors=16);fs=[f.quantize(palette=pal,dither=Image.Dither.NONE) for f in frames]
fs[0].save(out/'lumei.gif',save_all=True,append_images=fs[1:],duration=[270,120,160,120,140,280],loop=0,optimize=True)
font=ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf',26)
for lang,bg,ink in [('it','#ffbed3','#842b51'),('fr','#cfcef6','#59487d')]:
 im=Image.new('RGB',(220,242),bg);d=ImageDraw.Draw(im)
 for i in range(0,220,13):d.line((i,0,i,242),fill='#ffd9e5' if lang=='it' else '#e6e0fc',width=3)
 for i in range(0,242,13):d.line((0,i,220,i),fill='#ffd9e5' if lang=='it' else '#e6e0fc',width=3)
 d.ellipse((22,37,197,212),fill='#754654',outline='#fff9fa',width=5)
 for i in [9,15,21,58,65]:d.ellipse((22+i,37+i,197-i,212-i),outline='#ac7b8c',width=2)
 d.ellipse((79,93,142,156),fill=bg,outline=ink,width=2)
 if lang=='it':
  d.polygon([(91,117),(101,109),(111,112),(121,108),(130,117),(126,127),(111,143),(96,129)],fill='#e85577',outline=ink,width=2);d.polygon([(100,106),(109,111),(118,103),(116,111),(125,112),(112,118),(101,116)],fill='#61967e')
  for x,y in [(103,120),(115,126),(108,131),(120,117)]:d.line((x,y,x+1,y+2),fill='white',width=1)
 else:d.ellipse((94,105,130,141),fill='#ffdf87');d.ellipse((105,99,135,130),fill=bg)
 d.rounded_rectangle((12,9,108,37),radius=5,fill='#fff9ee');d.text((19,8),'ITALIA' if lang=='it' else 'FRANCE',font=ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf',19),fill=ink)
 d.text((18,210),'Diction  /  '+('01' if lang=='it' else '02'),font=ImageFont.truetype('C:/Windows/Fonts/georgiai.ttf',18),fill=ink)
 im.save(out/(lang+'-cover.png'),optimize=True)

