#!/usr/bin/env python3
"""Recolour the mustard accent wall in bedroom-twin-beds to white (owner is repainting).
Usage: python3 tools/recolor_wall.py DIR [brightness] [out.png]
DIR must hold src.webp (the photo before the polish pass). Only mustard-coloured pixels
inside the accent-wall area change; light and shadow are kept. Run tools/polish.py after."""
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
ImageDraw.Draw(pm).polygon([(2075,803),(2142,803),(2145,846),(2166,852),(2168,990),(2032,995),(2036,852),(2072,846)],fill=255)
base=np.asarray(pm.filter(ImageFilter.GaussianBlur(1))).astype(np.float32)/255
w=w*(1-0.75*base)
# curtain panel and rod stay as photographed
cp=Image.new('L',(W,H),0); dr=ImageDraw.Draw(cp)
dr.polygon([(1309,421),(1340,419),(1369,423),(1376,638),(1302,638)],fill=255)
curt=np.asarray(cp.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32)/255
w=w*(1-curt)
w=np.asarray(Image.fromarray((w*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.4))).astype(np.float32)/255
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
# Edge-safe recolour: estimate the wall's local colour before and after, and shift every
# pixel by that difference in proportion to how much wall it contains. Pure wall becomes the
# new white; a pixel that is half curtain / lamp keeps its curtain half untouched (no glow).
def nblur(img3, m, r):
    num=np.stack([np.asarray(Image.fromarray((np.clip(img3[...,i]*m,0,1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) for i in range(3)],-1)
    den=np.asarray(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32)[...,None]
    return num/np.maximum(den,1e-3), den[...,0]/255
pure=(w>0.9).astype(np.float32)
wall_before,cov=nblur(a,pure,10)
wall_after,_=nblur(painted,pure,10)
# where no pure wall is nearby, fall back to the pixel's own painted value
fallback=cov<0.02
wall_before[fallback]=a[fallback]; wall_after[fallback]=painted[fallback]
out=np.where(pure[...,None]>0, painted, np.clip(a+w[...,None]*(wall_after-wall_before),0,1))
out=np.clip(out,0,1)
# curtain: remove the mustard cast the old wall threw on the fabric (colour only, same brightness)
cast=curt*hue_w*smooth(ss,0.12,0.45)
Lc=(out@np.array([.2126,.7152,.0722]))[...,None]
cream=np.array([1.0,0.975,0.93]); cream=cream/(cream@np.array([.2126,.7152,.0722]))
out=out*(1-0.8*cast[...,None])+np.clip(Lc*1.06*cream,0,1)*(0.8*cast[...,None])
out=np.clip(out,0,1)
Image.fromarray((out*255+.5).astype(np.uint8)).save(f'{d}/painted.png' if len(sys.argv)<4 else sys.argv[3])
print('ok',round(float(target),3),round(float(Lw),3),round(float(core.mean()),3))
