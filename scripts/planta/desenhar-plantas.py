import json,os,math,re,sys
from PIL import Image,ImageDraw,ImageFont
S=sys.argv[1]; R='/home/user/mercado-municipal-curitiba/'
T=json.load(open(S+'/T.json'))
ESC={'inferior':0.063,'superior':0.0725,'nivel3':0.0725}
def mp(f,X,Y):
    t=T['superior' if f=='nivel3' else f]; x=t['o'][0]+t['ex'][0]*X+t['ey'][0]*Y; y=t['o'][1]+t['ex'][1]*X+t['ey'][1]*Y
    return (x/ESC[f],-y/ESC[f])
def m2px(f,x,y): return (x/ESC[f],-y/ESC[f])
F=lambda s:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',s)
C={ # contornos (X,Y) do tour 3D
'ext_inferior':[(58,24),(33,24),(33,20),(22,20),(22,24),(12,24),(12,46),(-45,46),(-45,44),(-49,44),(-49,46),(-57,46),(-57,58),(-90,58),(-93,72),(-83,91),(22,91),(22,80),(34,80),(34,78),(46,78),(46,81),(57,81),(57,71),(52,71),(52,49),(22,49),(22,43),(58,43)],
'ext_superior':[(59,1),(-21,1),(-21,42),(2,42),(2,40),(8,40),(8,57),(12,57),(12,70),(5,70),(5,77),(-48,77),(-48,85),(5,85),(5,80),(50,80),(50,71),(42,71),(42,58),(52,58),(52,53),(54,53),(54,45),(22,45),(22,33),(52,33),(52,32),(59,32)],
'ext_nivel3':[(-0.5,5.1),(-23.5,5.1),(-23.5,44),(-18.6,44),(-18.6,41.3),(8.5,41.3),(8.5,35.9),(6.7,24.2),(1,23.8)],
}
AREAS={'inferior':[('Hall Sete de Setembro','#e9d8c4',[(52,49),(23,49),(23,80),(34,80),(34,78),(46,78),(46,81),(57,81),(57,71),(52,71)])],
 'superior':[('Praças Déa / 7 de Setembro','#f0dcc8',[(54,45),(22,45),(22,40),(8,40),(8,57),(12,57),(12,70),(5,70),(5,80),(50,80),(50,71),(42,71),(42,58),(52,58),(52,53),(54,53)]),
   ('Praça de Alimentação Karan','#f0dcc8',[(52,23),(22,23),(22,33),(52,33)]),
   ('Galeria de restaurantes','#f0dcc8',[(5,77),(-48,77),(-48,85),(5,85)])],
 'nivel3':[('3º nível · administração','#dde3ea',[(-0.5,5.1),(-23.5,5.1),(-23.5,44),(-18.6,44),(-18.6,41.3),(8.5,41.3),(8.5,35.9),(6.7,24.2),(1,23.8)])]}
FUROS={'superior':[[(30,58),(16,58),(16,69),(30,69)]],'nivel3':[[(-4.7,25.3),(-16.7,25.3),(-16.7,35.9),(-4.7,35.9)]]}
COR={'inferior':[(21,52.3,-57,52.3,2.0,'Corredor 1'),(21,64.55,-90,64.55,2.3,'Corredor 2'),(21,76.7,-82,76.7,2.0,'Corredor 3'),(21,88.85,-82,88.85,2.3,'Corredor 4 · R. General Carneiro'),
  (57,29.5,13,29.5,2.4,'Anexo'),(57,39,13,39,2.4,''),(17.5,25,17.5,46,2.2,'')]+[(x,53.3,x,75.7,1.7,'') for x in (15.3,4.4,-2,-8.6,-14.9,-21.1,-27.4,-33.6,-40,-52.3,-59)],
 'superior':[(-11,3,-11,41,3.5,'Setor de Orgânicos'),(58,20,22,20,3.0,'Galeria de lojas')],'nivel3':[]}
ESCADAS={'inferior':[(33.5,31.5),(24.5,72),(23.5,53)],'superior':[(6.5,34),(-17.5,9),(8,42)],'nivel3':[(-9,36),(-18,12)]}
LAB3=[('Gerência do Mercado',-12.4,38.5),('Auditório',-18.3,10.4),('Sala de Aula',-20.5,27),('CEAN',-20.5,37.6)]
mods=[json.load(open(R+'public/tour/modules/'+d+'/module.json')) for d in os.listdir(R+'public/tour/modules')]
titles={m['title'] for m in mods}
sys.path.insert(0,S)
MP=json.load(open(S+'/mp.json'))
def poly(d,f,pts,**k): d.polygon([mp(f,*p) for p in pts],**k)
for f,SEMTEXTO in [(a,b) for a in ['inferior','superior','nivel3'] for b in (False,True)]:
    im=Image.new('RGB',(2000,1500),'#f3efe6'); d=ImageDraw.Draw(im)
    if SEMTEXTO: d.text=lambda *a,**k: None
    poly(d,f,C['ext_'+f],fill='#e2dccf',outline='#3a3a3a',width=6)
    for name,col,pts in AREAS.get(f,[]):
        poly(d,f,pts,fill=col)
    for h in FUROS.get(f,[]): poly(d,f,h,fill='#f3efe6',outline='#8a8a8a',width=3)
    for X1,Y1,X2,Y2,w,lab in COR[f]:
        a,b=mp(f,X1,Y1),mp(f,X2,Y2); d.line([a,b],fill='#cfd3d6',width=max(6,int(w/ESC[f]*0.85)))
    poly(d,f,C['ext_'+f],outline='#3a3a3a',width=6)
    for name,col,pts in AREAS.get(f,[]):
        xs=[mp(f,*p) for p in pts]; cx=sum(p[0] for p in xs)/len(xs); cy=sum(p[1] for p in xs)/len(xs)
        d.text((cx,cy),name,font=F(26),fill='#6b4a2a',anchor='mm')
    for X1,Y1,X2,Y2,w,lab in COR[f]:
        if lab: a,b=mp(f,X1,Y1),mp(f,X2,Y2); d.text(((a[0]+b[0])/2,(a[1]+b[1])/2),lab,font=F(22),fill='#555',anchor='mm')
    fl={'inferior':'inferior','superior':'superior'}.get(f)
    for m in mods:
        p=m.get('placement',{})
        if p.get('floor')!=fl or m['type'] not in('box','banca'): continue
        fa=math.radians(p['facing']); dx,dy=math.sin(fa),math.cos(fa); px_,py_=math.cos(fa),-math.sin(fa)
        dep=p.get('depth') or (1.0 if m['type']=='banca' else 2.2); w=p['width']/2
        fx,fy=p['x'],p['y']; bx,by=fx-dx*dep,fy-dy*dep
        pts=[m2px(f,fx+px_*w,fy+py_*w),m2px(f,fx-px_*w,fy-py_*w),m2px(f,bx-px_*w,by-py_*w),m2px(f,bx+px_*w,by+py_*w)]
        ph=m['media']['placeholder']; col=ph.get('facade') or ph.get('color','#999')
        known='não identificado' not in ph.get('sublabel','')
        d.polygon(pts,fill=col if known else '#b9b6ae',outline='#2a2a2a')
    # nomes (um por comerciante, no centro dos seus boxes)
    grp={}
    for m in mods:
        p=m.get('placement',{})
        if p.get('floor')!=fl or m['type'] not in('box','banca'): continue
        ph=m['media']['placeholder']
        if 'não identificado' in ph.get('sublabel',''): continue
        grp.setdefault(m['title'],[]).append(m2px(f,p['x'],p['y']))
    for t,ps in grp.items():
        cx=sum(p[0] for p in ps)/len(ps); cy=sum(p[1] for p in ps)/len(ps)
        s=t if len(t)<=22 else t[:21]+'…'
        d.text((cx,cy),s,font=F(13),fill='#111',anchor='mm',stroke_width=3,stroke_fill='#ffffffcc')
    # lojas do tour 3D sem box na planta: ponto + nome
    code={'inferior':'T','superior':'S','nivel3':'3'}[f]
    for r in MP:
        if r[3]!=code: continue
        x,y=mp(f,r[8],r[9])
        if any(abs(x-a)+abs(y-b)<70 for ps in grp.values() for a,b in ps): continue
        d.ellipse([x-7,y-7,x+7,y+7],fill='#c0392b',outline='white',width=2)
        d.text((x+10,y),r[1][:24],font=F(14),fill='#7a1f1f',anchor='lm',stroke_width=3,stroke_fill='white')
    for X,Y in ESCADAS[f]:
        x,y=mp(f,X,Y); d.rectangle([x-16,y-16,x+16,y+16],fill='#1d4d34'); d.text((x,y),'⇅',font=F(22),fill='white',anchor='mm')
    t={'inferior':'Pavimento inferior (Floor 1)','superior':'Pavimento superior (Floor 2)','nivel3':'3º nível (Floor 3)'}[f]
    d.text((40,40),t,font=F(44),fill='#1d4d34'); d.text((40,95),'Planta esquemática a partir de medidas do tour 3D oficial · confirme no local',font=F(20),fill='#666')
    im.save(R+('public/tour/plantas/piso-' if SEMTEXTO else 'public/tour/plantas/planta-')+f+'.jpg',quality=82)
