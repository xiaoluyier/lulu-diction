"""Build web mascot sizes from the TorchAI portrait and render the song covers."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
out=Path(__file__).resolve().parents[1]/'site'/'assets'
portrait=Image.open(out.parents[1]/'artwork'/'lumei.webp').convert('RGBA')
portrait.thumbnail((256,256),Image.Resampling.LANCZOS)
portrait.save(out/'lumei.png',optimize=True)
frames=[]
for angle,dy in [(0,0),(-3,-1),(-6,-2),(-3,-1),(0,0),(2,0)]:
    sticker=portrait.resize((52,52),Image.Resampling.LANCZOS).rotate(angle,Image.Resampling.BICUBIC,expand=True)
    canvas=Image.new('RGBA',(68,60),'#fff4f8')
    canvas.alpha_composite(sticker,((68-sticker.width)//2,57-sticker.height+dy))
    frames.append(canvas.convert('RGB'))
pal=frames[0].quantize(colors=40)
fs=[f.quantize(palette=pal,dither=Image.Dither.NONE) for f in frames]
fs[0].save(out/'lumei.gif',save_all=True,append_images=fs[1:],duration=[640,150,230,150,160,260],loop=0,optimize=True)
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

