import sys,numpy as np
from PIL import Image, ImageDraw, ImageFilter
d=sys.argv[1]
im=Image.open(f'{d}/src.webp').convert('RGB'); a=np.asarray(im).astype(np.float32)/255
H,W=a.shape[:2]
mx=a.max(2); mn=a.min(2); c=mx-mn; r,g,b=a[...,0],a[...,1],a[...,2]
hh=np.zeros_like(mx); m=c>1e-6
hr=(mx==r)&m; hg=(mx==g)&m&~hr; hb=m&~hr&~hg
hh[hr]=((g-b)[hr]/c[hr])%6; hh[hg]=((b-r)[hg]/c[hg])+2; hh[hb]=((r-g)[hb]/c[hb])+4; hh*=60
ss=np.where(mx>0,c/np.maximum(mx,1e-6),0)
L=r*.2126+g*.7152+b*.0722
def smooth(x,e0,e1):
    t=np.clip((x-e0)/(e1-e0),0,1); return t*t*(3-2*t)
# how "mustard" each pixel is: hue near the wall's hue and clearly saturated
hue_w=smooth(hh,14,26)*(1-smooth(hh,48,60))
sat_w=smooth(ss,0.22,0.55)
# only the accent-wall area (feathered): right of the window, above the nightstand
reg=Image.new('L',(W,H),0)
ImageDraw.Draw(reg).polygon([(1150,330),(2200,0),(2200,1000),(1985,978),(2010,602),(1250,636),(1150,640)],fill=255)
reg=np.asarray(reg.filter(ImageFilter.GaussianBlur(3))).astype(np.float32)/255
w=hue_w*sat_w*reg
pm=Image.new('L',(W,H),0)
ImageDraw.Draw(pm).polygon([(2075,803),(2152,803),(2155,846),(2195,850),(2200,995),(2032,995),(2036,852),(2072,846)],fill=255)
base=np.asarray(pm.filter(ImageFilter.GaussianBlur(2))).astype(np.float32)/255
w=w*(1-0.7*base)
w=np.asarray(Image.fromarray((w*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32)/255
# target: the brightness of the room's existing white walls, keeping this wall's light and shadow
Ls=np.asarray(Image.fromarray((L*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.0))).astype(np.float32)/255
core=w>0.85
Lw=np.median(Ls[core])
ref=a[200:700,500:900].reshape(-1,3)@np.array([.2126,.7152,.0722])
target=float(sys.argv[2]) if len(sys.argv)>2 else 0.9  # bright, clean white
white=np.array([1.0,0.988,0.968])  # crisp white with a hint of warmth
rel=np.clip(1+(np.clip(Ls/Lw,0.3,1.8)-1)*0.55,0.5,1.25)
v=target*rel
v=np.where(v>0.9,0.9+0.1*np.tanh((v-0.9)/0.1),v)  # soft roll-off, no blown-out patches
painted=np.clip(white/white.mean()*v[...,None],0,1)
out=a*(1-w[...,None])+painted*w[...,None]
Image.fromarray((out*255+.5).astype(np.uint8)).save(f'{d}/painted.png' if len(sys.argv)<4 else sys.argv[3])
print('ok',round(float(target),3),round(float(Lw),3),round(float(core.mean()),3))
