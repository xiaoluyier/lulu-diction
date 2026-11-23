"""Build the nine album photos and animated rewards from numbered screenshots and cutouts."""
import argparse
from pathlib import Path
from PIL import Image, ImageOps
import json

assets = Path(__file__).resolve().parents[1] / 'site' / 'assets'
photos = [
    ('一起说晚安', (45, 784, 1228, 1640)),
    ('抱抱噜妹', (140, 797, 1080, 1778)),
    ('噜妹噘嘴', (12, 788, 1260, 1723)),
    ('歪头看你', (172, 773, 987, 1723)),
    ('一起站好', (68, 809, 1236, 1677)),
    ('举起锅铲', (568, 1088, 1111, 1659)),
    ('沙发上贴贴', (127, 831, 1080, 1546)),
    ('鼓起腮帮', (122, 1042, 1150, 1619)),
    ('草莓裙笑脸', (122, 1042, 1150, 1619)),
]

def build(screens, stickers):
    entries = []
    folder = assets / 'moments'
    folder.mkdir(exist_ok=True)
    for number, (label, box) in enumerate(photos, 1):
        base = f'{number:02d}'
        frame = Image.open(screens / f'{number}.img').convert('RGB').crop(box)
        frame.thumbnail((900, 760), Image.Resampling.LANCZOS)
        frame.save(folder / f'{base}.webp', quality=83, method=6)
        actor = Image.open(next(stickers.glob(f'{base}-*.png'))).convert('RGBA')
        actor.thumbnail((240, 240), Image.Resampling.LANCZOS)
        square = Image.new('RGBA', (244,244))
        square.alpha_composite(actor, ((244-actor.width)//2, (244-actor.height)//2))
        square.save(folder / f'{base}-face.webp', quality=90, method=6)
        frames = []
        for tilt, up in ((0,0),(-3,1),(-6,3),(-3,1),(0,0),(2,0)):
            small = square.resize((53,53), Image.Resampling.LANCZOS)
            small = small.rotate(tilt, resample=Image.Resampling.BICUBIC, expand=True)
            canvas = Image.new('RGBA',(68,60),'#fff4f8')
            canvas.alpha_composite(small, ((68-small.width)//2,57-small.height-up))
            frames.append(canvas.convert('RGB'))
        palette=frames[0].quantize(colors=48)
        gif=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
        gif[0].save(folder / f'{base}.gif',save_all=True,append_images=gif[1:],duration=[650,140,220,140,150,240],loop=0,optimize=True)
        entries.append({'id':base,'label':label,'image':f'./assets/moments/{base}.webp'})
    (assets/'album.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('screens',type=Path)
    parser.add_argument('stickers',type=Path)
    args=parser.parse_args()
    build(args.screens,args.stickers)

