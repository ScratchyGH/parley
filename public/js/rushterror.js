const C=2
const mk=(gw,gh,S)=>{const c=document.createElement('canvas');c.width=gw*C*S;c.height=gh*C*S;const g=c.getContext('2d');g.imageSmoothingEnabled=false;return[c,g]}
const px=(gw,gh,ax,ay,S,fn)=>{
const[c,g]=mk(gw,gh,S)
const k=C*S
const r=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round(x*k),Math.round(y*k),Math.round(w*k),Math.round(h*k))}
fn(r,g,k)
return{c,w:gw*C,h:gh*C,ax:ax*C,ay:ay*C}
}
const K='#07040c'
const eyes=(r,x,y,col,gap)=>{r(x,y,2,2,col);r(x+gap,y,2,2,col)}
const body=(r,x,y,w,h,a,b)=>{r(x-1,y-1,w+2,h+2,K);r(x,y,w,h,a);r(x,y+h*.55,w,h*.45,b)}
export const TXT={
crawler:{r:11,hp:14,sp:125,dmg:6,xp:2,spr:'crawler'},
lurker:{r:13,hp:42,sp:72,dmg:14,xp:5,spr:'lurker'},
screamer:{r:12,hp:28,sp:60,dmg:6,xp:4,spr:'screamer'},
hanged:{r:14,hp:130,sp:34,dmg:12,xp:8,spr:'hanged'},
wraith:{r:13,hp:38,sp:58,dmg:8,xp:5,spr:'wraith'},
bat:{r:7,hp:5,sp:150,dmg:4,xp:1,spr:'bat'},
stitched:{r:20,hp:160,sp:48,dmg:18,xp:12,spr:'stitched'},
mimic:{r:12,hp:52,sp:0,dmg:12,xp:6,spr:'mimic'},
spitter:{r:12,hp:32,sp:50,dmg:7,xp:4,spr:'spitter'},
weeper:{r:13,hp:72,sp:95,dmg:20,xp:9,spr:'weeper'},
bloater:{r:17,hp:72,sp:38,dmg:8,xp:7,spr:'bloater'}
}
export function terrorArt(S){
const A={}
A.crawler=[0,1].map(f=>px(22,12,11,11,S,r=>{
const l=f?1:0
for(let i=0;i<4;i++){r(1+i*2,5+(i%2?l:1-l),1,5,K);r(20-i*2,5+(i%2?1-l:l),1,5,K);r(0+i,2+i,1,3,K);r(21-i,2+i,1,3,K)}
r(5,3,12,7,K);r(6,4,10,5,'#2a1a2e');r(7,4,8,2,'#4a2c4a')
r(7,5,2,2,'#ff2a2a');r(10,5,2,2,'#ff2a2a');r(13,5,2,2,'#ff2a2a')
r(8,8,1,2,'#e8e2cc');r(13,8,1,2,'#e8e2cc')
}))
A.lurker=[0,1].map(f=>px(18,32,9,31,S,r=>{
const s=f?1:0
r(5,2,8,9,K);r(6,3,6,8,'#120a1c')
r(4,11,10,15,K);r(5,11,8,15,'#0c0614')
r(0,12+s,4,16,K);r(14,12+(1-s),4,16,K);r(1,13+s,2,15,'#15091f');r(15,13+(1-s),2,15,'#15091f')
r(5,26,3,6,K);r(10,26,3,6,K)
r(6,5,2,2,'#fff');r(10,5,2,2,'#fff')
r(6,8,6,1,'#e8e2cc');r(7,9,1,1,'#e8e2cc');r(9,9,1,1,'#e8e2cc');r(11,9,1,1,'#e8e2cc')
}))
A.screamer=[0,1].map(f=>px(22,30,11,28,S,r=>{
const s=f?1:0
r(5,0,12,24,K);r(6,1,10,22,'#d8dce8');r(6,1,10,6,'#14101c')
r(3,6,3,18+s,'#14101c');r(16,6,3,18+(1-s),'#14101c');r(1,10,3,14,'#14101c');r(18,10,3,14,'#14101c')
r(7,24,8,3+s,'#b8bcd0');r(8,27+s,6,2,'#8a8ea6')
r(7,8,3,3,K);r(12,8,3,3,K);r(8,9,1,1,'#ff2a2a');r(13,9,1,1,'#ff2a2a')
r(8,13,6,8,K);r(9,14,4,6,'#5a0a14')
}))
A.hanged=[0,1].map(f=>px(18,40,9,38,S,r=>{
const s=f?1:0
r(8,0,2,10,'#6a5436')
r(5,8,8,8,K);r(6,9,6,6,'#9aa08a');r(6,9,6,2,'#3a3420')
r(7,11,1,2,K);r(10,11,1,2,K)
r(4,16,10,14,K);r(5,16,8,13,'#3b3a2a');r(5,22,8,2,'#2a281c')
r(1+s,17,3,14,'#9aa08a');r(14-s,17,3,14,'#9aa08a')
r(6,30,2,8,'#9aa08a');r(10,30,2,8,'#9aa08a')
}))
A.wraith=[0,1].map(f=>px(24,30,12,26,S,r=>{
const s=f?1:0
r(6,0,12,6,K);r(5,4,14,20,K);r(7,1,10,6,'#1c2a3c');r(6,6,12,17,'#12202e')
r(8,4,8,5,K);r(9,5,2,2,'#7dffd0');r(13,5,2,2,'#7dffd0')
for(let i=0;i<6;i++)r(5+i*3,22+((i+s)%2)*2,3,5+(i%2)*2,'#0c1824')
r(2,10,4,10+s,'#12202e');r(18,10,4,10+(1-s),'#12202e')
}))
A.bat=[0,1].map(f=>px(20,12,10,6,S,r=>{
const s=f?1:0
r(8,3,4,5,K);r(9,4,2,3,'#2a1a2e')
r(1,2+s*2,7,4,K);r(12,2+s*2,7,4,K);r(2,3+s*2,5,2,'#3a2440');r(13,3+s*2,5,2,'#3a2440')
r(0,5+s*2,3,3,K);r(17,5+s*2,3,3,K)
r(8,4,1,1,'#ff2a2a');r(11,4,1,1,'#ff2a2a')
}))
A.stitched=[0,1].map(f=>px(30,36,15,34,S,r=>{
const s=f?1:0
r(8,0,14,12,K);r(9,1,12,10,'#a8a07a');r(9,1,12,3,'#5a4a2a')
r(11,5,3,3,K);r(17,5,3,3,K);r(12,6,1,1,'#ff2a2a');r(18,6,1,1,'#ff2a2a')
r(10,9,10,1,K);for(let i=0;i<5;i++)r(11+i*2,8,1,3,K)
r(5,12,20,16,K);r(6,12,18,15,'#6a5a3a');r(6,18,18,9,'#4a3e28');r(14,12,1,16,K);for(let i=0;i<5;i++)r(12,13+i*3,5,1,'#c9c0a0')
r(0,13+s,6,16,K);r(24,13+(1-s),6,16,K);r(1,14+s,4,14,'#a8a07a');r(25,14+(1-s),4,14,'#a8a07a')
r(7,28,6,7,K);r(17,28,6,7,K);r(8,28,4,6,'#4a3e28');r(18,28,4,6,'#4a3e28')
r(26,24+(1-s),3,10,'#5a5a66');r(24,32+(1-s),7,3,'#8a8a96')
}))
A.mimic=[0,1].map(f=>px(24,22,12,20,S,r=>{
const s=f?1:0
r(1,6,22,14,K);r(2,7,20,12,'#7a4a22');r(2,12,20,2,'#d6b25a')
r(1,1,22,8+s,K);r(2,2,20,6+s,'#9a5c2a');r(11,5+s,2,3,'#d6b25a')
for(let i=0;i<7;i++){r(3+i*3,8+s,2,3,'#f4f0dc');r(4+i*3,12,2,3,'#f4f0dc')}
r(5,3,3,3,'#ff2a2a');r(16,3,3,3,'#ff2a2a')
r(8,14,8,5,'#7a0a1a');r(9,16,6,2,'#c8203a')
}))
A.spitter=[0,1].map(f=>px(24,26,12,24,S,r=>{
const s=f?1:0
r(3,6,18,16,K);r(4,7,16,14,'#7a9a62');r(4,14,16,7,'#566e44')
r(5,2,5,6,K);r(14,2,5,6,K);r(6,3,3,4,'#cfe88a');r(15,3,3,4,'#cfe88a');r(7,4,1,2,K);r(16,4,1,2,K)
r(6,12,12,5+s,K);r(7,13,10,3+s,'#2a0a14');r(8,13,1,2,'#e8e2cc');r(15,13,1,2,'#e8e2cc')
r(1,10,3,8,'#566e44');r(20,10,3,8,'#566e44');r(5,22,4,2,K);r(15,22,4,2,K)
r(9,8,2,2,'#b8ff4a');r(14,9,2,2,'#b8ff4a')
}))
const weep=(open)=>px(22,36,11,34,S,r=>{
r(6,0,10,10,K);r(7,1,8,8,'#a8a8b4')
r(4,6,14,22,K);r(5,7,12,20,'#9a9aa6');r(5,18,12,9,'#7a7a88')
if(open){r(7,2,3,2,'#ff2a2a');r(12,2,3,2,'#ff2a2a');r(8,6,6,2,K);r(1,0,4,16,K);r(2,1,2,14,'#a8a8b4');r(17,0,4,16,K);r(18,1,2,14,'#a8a8b4')}
else{r(6,3,10,6,'#8a8a96');r(3,4,5,12,K);r(4,5,3,10,'#a8a8b4');r(14,4,5,12,K);r(15,5,3,10,'#a8a8b4');r(1,0,4,14,K);r(17,0,4,14,K)}
r(6,27,4,7,K);r(12,27,4,7,K)
})
A.weeper=[weep(false),weep(true)]
A.bloater=[0,1].map(f=>px(34,28,17,26,S,r=>{
const s=f?1:0
r(3,3,28,22,K);r(4,4,26,20,'#8a9a52');r(4,14,26,10,'#5e6a34')
r(8,6+s,5,5,'#d6e66a');r(21,9,6,5,'#d6e66a');r(14,16,5,5,'#d6e66a');r(6,17,4,4,'#e6f08a')
r(11,8,3,3,K);r(20,6,3,3,K);r(12,9,1,1,'#ff2a2a');r(21,7,1,1,'#ff2a2a')
r(10,19,14,3,K);for(let i=0;i<6;i++)r(11+i*2,19,1,2,'#e8e2cc')
r(7,24,5,3,K);r(22,24,5,3,K)
}))
A.chapel=px(40,40,20,38,S,r=>{
r(14,0,12,2,K);r(19,0,2,8,'#c8c0a0');r(16,3,8,2,'#c8c0a0')
r(6,12,28,26,K);r(7,13,26,24,'#6a6478');r(7,13,26,3,'#8a8498');r(7,30,26,7,'#4a4458')
r(12,8,16,6,K);r(13,9,14,5,'#5a546a')
r(16,18,8,12,K);r(17,19,6,10,'#ffd27a');r(19,19,2,10,'#9a6a2a');r(17,23,6,2,'#9a6a2a')
r(9,20,4,6,'#ffd27a');r(27,20,4,6,'#ffd27a')
r(16,30,8,8,K);r(17,31,6,7,'#2a1a14')
})
A.tower=px(18,44,9,43,S,r=>{
r(2,0,14,8,K);r(3,1,12,6,'#5a2a2a');r(7,2,4,4,'#ff6a3a');r(8,3,2,2,'#fff0a0')
r(3,8,12,32,K);r(4,8,10,31,'#54505e');r(4,8,3,31,'#6e6a7a')
for(let i=0;i<5;i++)r(4,12+i*6,10,1,'#3a3644')
r(7,18,4,5,K);r(8,19,2,3,'#ffd27a')
r(1,38,16,5,K);r(2,39,14,3,'#3a3644')
})
A.crypt=px(34,28,17,26,S,r=>{
r(2,6,30,20,K);r(3,7,28,18,'#4a4a56');r(3,7,28,3,'#6a6a78')
r(0,2,34,6,K);r(1,3,32,4,'#5a5a68');r(14,0,6,4,'#6a6a78')
r(11,12,12,14,K);r(12,13,10,13,'#0a1a10')
r(13,16,2,2,'#4aff7a');r(19,16,2,2,'#4aff7a');r(14,20,6,1,'#4aff7a')
r(4,10,4,14,'#3a3a46');r(26,10,4,14,'#3a3a46')
r(12,13,1,13,'#2a2a30');r(16,13,1,13,'#2a2a30');r(20,13,1,13,'#2a2a30')
})
A.well=px(22,20,11,18,S,r=>{
r(3,6,16,12,K);r(4,7,14,10,'#6a6a78');r(4,13,14,4,'#4a4a56')
r(6,6,10,5,K);r(7,7,8,3,'#4ac8ff');r(9,7,4,1,'#c8f0ff')
r(2,0,2,10,'#5a4226');r(18,0,2,10,'#5a4226');r(2,0,18,2,'#7a5a36')
})
A.barricade=px(30,14,15,12,S,r=>{
r(0,8,30,4,K);r(1,9,28,2,'#5a4226')
for(let i=0;i<6;i++){r(i*5+1,0,3,12,K);r(i*5+2,1,1,10,'#7a5a36');r(i*5+2,0,1,2,'#c8c0a0')}
r(0,5,30,2,'#3a2a18')
})
A.shrine=px(20,26,10,24,S,r=>{
r(2,14,16,10,K);r(3,15,14,8,'#5a5470');r(3,15,14,2,'#7a7490')
r(4,8,12,8,K);r(5,9,10,6,'#6a6484')
for(const x of[5,9,13]){r(x,4,2,5,'#e8e2cc');r(x,1,2,3,'#ffb347');r(x,0,2,1,'#fff3b0')}
r(8,17,4,4,'#8fe3ff')
})
return A
}
export const BUILD=[
['chapel','Chapel','Heals you and slows the dark inside its light',54],
['tower','Watchtower','Fires on anything that comes near',40],
['crypt','Crypt','Spawns monsters until you burn it down',38],
['well','Wishing Well','Grants experience once',28],
['barricade','Barricade','Enemies cannot walk through',34],
['shrine','Lantern Shrine','Stand on it to refresh your abilities',30]
]
export const ABIL=[
['dash','Dash','SPACE','Burst forward, untouchable for a moment',3.2,'#8fe3ff'],
['flare','Flare','E','Throw a flare that blinds and scares everything near it',12,'#ff8a3a'],
['ward','Ward','Q','A shield that soaks up hits for a few seconds',16,'#ffe27a'],
['rift','Grave Rift','R','Drag every enemy in and crush them',20,'#b48aff'],
['drain','Soul Drain','F','Rip life out of everything around you',18,'#ff4a6a']
]
