#!/usr/bin/env python3
"""Clean a compressed photo: smooth JPEG blocking and colour noise in flat areas (sky, water),
light contrast, edge-only sharpening. Used for pool-deck from the original export.
Usage: python3 tools/clean_photo.py IN OUT"""
import sys,numpy as np
from PIL import Image, ImageFilter
src,dst=sys.argv[1],sys.argv[2]
im=Image.open(src).convert('RGB')
# 1) de-block: smooth colour noise strongly, luminance gently (median keeps edges)
ycc=im.convert('YCbCr'); y,cb,cr=ycc.split()
cb=cb.filter(ImageFilter.GaussianBlur(2.2)); cr=cr.filter(ImageFilter.GaussianBlur(2.2))
ym=y.filter(ImageFilter.MedianFilter(3))
ya=np.asarray(y).astype(np.float32); ymf=np.asarray(ym).astype(np.float32)
# smooth more in flat areas (sky, water), keep detail at real edges
grad=np.asarray(y.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(2))).astype(np.float32)
k=np.clip(1-grad/40,0.25,0.85)
yb=np.asarray(ym.filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32)
yn=ya*(1-k)+yb*k
out=Image.merge('YCbCr',(Image.fromarray(np.clip(yn,0,255).astype(np.uint8)),cb,cr)).convert('RGB')
# 2) gentle tone: small midtone lift, light vibrance, no sharpening / clarity
a=np.asarray(out).astype(np.float32)/255
L=a@np.array([.2126,.7152,.0722]); med=float(np.median(L))
g=float(np.clip(np.log(0.56)/np.log(max(min(med,.95),.05)),0.9,1.0))
Ln=np.clip(L,0,1)**g; a=a*(Ln/np.maximum(L,1e-4))[...,None]
Lo=(a@np.array([.2126,.7152,.0722]))[...,None]; mx=a.max(2,keepdims=True); mn=a.min(2,keepdims=True)
sat=(mx-mn)/np.maximum(mx,1e-4); a=Lo+(a-Lo)*(1+0.14*(1-sat)**2)
# clear the haze: set a true black point and a gentle S-curve
a=np.clip((a-0.035)/(1-0.035),0,1)
L=a@np.array([.2126,.7152,.0722]); Lc=L+0.22*L*(1-L)*(L-0.5)*2
a=np.clip(a*(Lc/np.maximum(L,1e-4))[...,None],0,1)
res=Image.fromarray((a*255+.5).astype(np.uint8))
# light sharpening only on real edges (threshold keeps the sky smooth)
res=res.filter(ImageFilter.UnsharpMask(radius=0.9,percent=40,threshold=7))
res.save(dst)
print('median',round(med,2),'gamma',round(g,2))
