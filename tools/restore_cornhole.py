import sys,numpy as np
from PIL import Image, ImageDraw, ImageFilter
S=sys.argv[1]
o=Image.open(f'{S}/drive/orig/02.jpg').convert('RGB')
n=Image.open('/root/.claude/uploads/cea7ac78-bd78-57e0-99e0-a893f63ef4d4/e895fa1f-image.png').convert('RGB')
# 1) exact centre: axis of the back door / columns is x=818
ax=818; half=min(ax,n.width-ax); n=n.crop((ax-half,0,ax+half,n.height)); W,H=n.size
N=np.asarray(n).astype(np.float32)
# 2) colour match: original pavers -> enhanced pavers
op=np.asarray(o.crop((330,585,600,625))).reshape(-1,3).astype(np.float32)
npv=N[805:860,450:1150].reshape(-1,3)
def mapc(a): return np.clip((a-op.mean(0))/op.std(0)*npv.std(0)*0.9+npv.mean(0),0,255)
boards=[
 dict(poly=[(18,566),(103,511),(302,562),(300,592),(250,634),(28,634),(16,588)],extra=[(268,604,322,640)],box=(10,505,325,642),top=[(19,572),(103,508),(304,562),(246,635)]),
 dict(poly=[(910,566),(1110,511),(1150,524),(1192,540),(1196,574),(1186,634),(968,636),(908,602)],extra=[(878,584,909,613)],box=(875,505,1200,642),top=[(914,568),(1110,509),(1193,572),(976,636)]),
]
targets=[(14,880),(W-14,880)]  # left board: left edge x; right board: right edge x; bottom y
sc=1.45
out=n.copy()
for i,b in enumerate(boards):
    x0,y0,x1,y1=b['box']
    m=Image.new('L',o.size,0); d=ImageDraw.Draw(m); d.polygon(b['poly'],fill=255)
    for e in b['extra']: d.rounded_rectangle(e,radius=4,fill=255)
    patch=o.crop(b['box']); mp=m.crop(b['box'])
    # drop original paver pixels inside the outline (keep board, frame, legs, bags, dark shadow)
    pa0=np.asarray(patch).astype(np.float32)/255
    mx=pa0.max(2); mn=pa0.min(2); sat=(mx-mn)/np.maximum(mx,1e-4); L=pa0@np.array([.2126,.7152,.0722])
    paver=(sat<0.22)&(L>0.42)&(L<0.80)
    tq=Image.new('L',o.size,0); ImageDraw.Draw(tq).polygon(b['top'],fill=255); tq=np.asarray(tq.crop(b['box']))>0
    paver&=~tq
    pm=Image.fromarray((paver*255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.MinFilter(3))
    keep=(np.asarray(mp)>0)&~(np.asarray(pm)>0)
    km=Image.fromarray((keep*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    mp=Image.fromarray(np.minimum(np.asarray(mp),np.asarray(km)))
    pw,ph=round((x1-x0)*sc),round((y1-y0)*sc)
    patch=patch.resize((pw,ph),Image.LANCZOS); mp=mp.resize((pw,ph),Image.LANCZOS)
    pa=mapc(np.asarray(patch).astype(np.float32))
    # gentle sharpen to match the crisp look
    patch=Image.fromarray(pa.astype(np.uint8)).filter(ImageFilter.UnsharpMask(radius=1.4,percent=70,threshold=2))
    mp=mp.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.5))
    px=targets[i][0] if i==0 else targets[i][0]-pw
    py=targets[i][1]-ph
    # soft contact shadow under the board
    sh=Image.new('L',(W,H),0); sd=ImageDraw.Draw(sh)
    sd.ellipse((px+pw*0.08,py+ph*0.62,px+pw*0.95,py+ph*1.04),fill=110)
    sh=np.asarray(sh.filter(ImageFilter.GaussianBlur(18))).astype(np.float32)/255
    A=np.asarray(out).astype(np.float32)*(1-0.55*sh[...,None])
    out=Image.fromarray(A.clip(0,255).astype(np.uint8))
    out.paste(patch,(px,py),mp)
out.save(f'{S}/corn/final.png')
print(out.size)
