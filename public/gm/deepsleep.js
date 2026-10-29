import{kit,txt}from'./kit.js'
const VW=960,VH=540
const SK='parley.ds'
const load=()=>{try{return JSON.parse(localStorage.getItem(SK)||'{}')}catch{return{}}}
const save=o=>{try{localStorage.setItem(SK,JSON.stringify({...load(),...o}))}catch{}}
const ease=p=>p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2
const R=(c,x,y,w,h,f)=>{c.fillStyle=f;c.fillRect(x,y,w,h)}
const O=(c,x,y,r,f)=>{c.fillStyle=f;c.beginPath();c.arc(x,y,r,0,6.283);c.fill()}
function kid(c,x,y,s,head,lie){
c.save()
c.translate(x,y)
c.scale(s,s)
if(lie)c.rotate(-1.5708)
R(c,-9,-34,18,26,'#4b5563')
R(c,-9,-8,7,8,'#374151')
R(c,2,-8,7,8,'#374151')
if(head==='skin'){O(c,0,-44,11,'#f3d9bf');O(c,-4,-45,1.6,'#111');O(c,4,-45,1.6,'#111')}
else if(head==='pumpkin'){c.fillStyle='#f97316';c.beginPath();c.ellipse(0,-46,14,12,0,0,6.283);c.fill();R(c,-2,-60,4,6,'#3f6212');c.fillStyle='#111';c.beginPath();c.moveTo(-8,-50);c.lineTo(-3,-50);c.lineTo(-5.5,-45);c.fill();c.beginPath();c.moveTo(3,-50);c.lineTo(8,-50);c.lineTo(5.5,-45);c.fill();c.fillRect(-7,-41,14,3)}
else{O(c,-9,-46,10,'#f8fafc');O(c,0,-53,12,'#fff');O(c,9,-46,10,'#f1f5f9');O(c,0,-42,10,'#f8fafc');O(c,-3,-46,1.6,'#334155');O(c,4,-46,1.6,'#334155')}
c.restore()
}
function wrap(c,s,w){
const out=[]
let l=''
for(const t of s.split(' ')){const n=l?l+' '+t:t;if(c.measureText(n).width>w&&l){out.push(l);l=t}else l=n}
if(l)out.push(l)
return out
}
function cap(c,who,s){
R(c,60,VH-130,VW-120,100,'rgba(8,8,10,.82)')
c.strokeStyle='rgba(201,200,193,.35)'
c.strokeRect(60.5,VH-129.5,VW-121,99)
c.font='700 22px Figtree,sans-serif'
const ls=wrap(c,s,VW-170)
if(who)txt(c,who,80,VH-102,16,'#c9c8c1')
ls.slice(0,3).forEach((l,i)=>txt(c,l,80,VH-76+i*26,22,'#f6f5ef'))
}
const SEG=[
{d:4,l:[[0,.5,'You','Goodnight, Mom.'],[.5,1,'Mom','Goodnight, sweetheart. Sleep tight.']],f:(c,p)=>{
R(c,0,0,VW,VH,'#2a2118');R(c,0,430,VW,110,'#3b2d20');R(c,120,120,140,200,'#4b3a28');O(c,190,150,30,'rgba(253,224,71,.25)')
R(c,640,300,160,130,'#5b2b2b');R(c,640,260,40,60,'#5b2b2b')
O(c,720,250,22,'#f3d9bf');O(c,720,232,16,'#6b4a2a')
kid(c,300+p*30,430,2,'skin')
}},
{d:3.4,l:[[.2,.9,'','Up the stairs.']],f:(c,p)=>{
const cam=ease(p)*620
c.save();c.translate(-cam,0)
R(c,0,0,1700,VH,'#2a2118');R(c,0,430,1700,110,'#3b2d20')
for(let i=0;i<9;i++)R(c,1000+i*44,430-(i+1)*24,44,(i+1)*24+4,'#4a3826')
R(c,1396,150,300,290,'#1a1410')
const x=300+ease(p)*1130,y=430-Math.max(0,Math.min(9,(x-1000)/44))*24
kid(c,x,y,2,'skin')
c.restore()
}},
{d:3,l:[[.55,1,'','Click.']],f:(c,p)=>{
R(c,0,0,VW,VH,'#0e0b0a');R(c,0,430,VW,110,'#17110d')
const w=240*(1-ease(Math.max(0,(p-.3)/.6)))
R(c,360,120,240,330,'#050404')
if(w>1)R(c,360,120,w,330,'#fde68a')
R(c,360+w,120,240-w,330,'#3a2a1c')
O(c,360+w-8,290,5,'#a1a1aa')
kid(c,480,430,2,'skin')
}},
{d:3.4,l:[],f:(c,p)=>{
R(c,0,0,VW,VH,'#0e0b0a');R(c,0,430,VW,110,'#17110d')
const on=p<.45||(p<.7&&Math.sin(p*90)>0)
R(c,478,0,4,70,'#52525b');O(c,480,78,16,on?'#fef08a':'#3f3f46')
if(on)O(c,480,78,160,'rgba(254,240,138,.12)')
kid(c,480,430,2,'skin')
if(!on)R(c,0,0,VW,VH,'rgba(0,0,0,'+Math.min(.96,(p-.45)*3)+')')
}},
{d:4.6,l:[[.15,.55,'','The light is moving.'],[.6,1,'','It is coming for you.']],f:(c,p)=>{
R(c,0,0,VW,VH,'#030303');R(c,0,430,VW,110,'#070606')
kid(c,480,430,2,'skin')
const e=ease(p),y=78+e*(330-78),r=10+e*34
O(c,480,y,r*5,'rgba(254,240,138,.08)');O(c,480,y,r*2,'rgba(254,240,138,.2)');O(c,480,y,r,'#fef9c3')
}},
{d:4.2,l:[[.1,.4,'','Just sleep.']],f:(c,p)=>{
R(c,0,0,VW,VH,'#0b1020');R(c,0,430,VW,110,'#141a2e');R(c,640,350,280,90,'#334155');R(c,640,320,60,40,'#e2e8f0');O(c,120,90,40,'rgba(226,232,240,.5)')
const wx=300+Math.min(1,p/.45)*300,jp=Math.max(0,Math.min(1,(p-.45)/.25)),jx=wx+jp*140,jy=430-Math.sin(jp*Math.PI)*120-(jp>=1?44:0)
if(p<.7)kid(c,jp>0?jx:wx,jp>0?jy:430,2,'skin')
else{kid(c,780,372,2,'skin',true);const b=Math.min(1,(p-.7)/.25);R(c,650,330,280*b,70,'#7c3aed')}
}},
{d:2.8,l:[],f:(c,p)=>{
R(c,0,0,VW,VH,'#05020c')
const n=Math.pow(p,2)
for(let i=0;i<140;i++){const a=i*2.399,l=(40+((i*53)%200))*(.2+n*4),d=20+n*600;c.strokeStyle='hsla('+(240+i%80)+',90%,'+(55+(i%30))+'%,'+(.3+n*.6)+')';c.lineWidth=1+n*3;c.beginPath();c.moveTo(480+Math.cos(a)*d,270+Math.sin(a)*d);c.lineTo(480+Math.cos(a)*(d+l),270+Math.sin(a)*(d+l));c.stroke()}
R(c,0,0,VW,VH,'rgba(255,255,255,'+Math.max(0,(p-.85)*6)+')')
}},
{d:7,l:[],f:(c,p,k,t)=>{
const f=Math.sin(p*70*(.4+p)+Math.sin(p*23)*3)>.25-p*.5
if(f){const g=c.createLinearGradient(0,0,0,VH);g.addColorStop(0,'#fbcfe8');g.addColorStop(1,'#a5f3fc');c.fillStyle=g;c.fillRect(0,0,VW,VH);O(c,480,520,300,'#bbf7d0')}
else{R(c,0,0,VW,VH,'#12020a');for(let i=0;i<7;i++){O(c,100+i*130+Math.sin(t*3+i)*10,200+(i%3)*60,22,'rgba(220,38,38,.6)');O(c,92+i*130,194+(i%3)*60,4,'#fee2e2');O(c,108+i*130,194+(i%3)*60,4,'#fee2e2')}R(c,0,430,VW,110,'#1a0508')}
const sh=p>.86?(Math.random()-.5)*14:0
kid(c,480+sh,430,3,'pumpkin')
if(p>.86){txt(c,'AAAAAAAAAH!',480+sh,150,80+(p-.86)*300,'#fff','center');R(c,0,0,VW,VH,'rgba(255,255,255,'+Math.min(1,(p-.86)*5)+')')}
}},
{d:3.6,l:[[.45,1,'You','...why do I feel so light?']],f:(c,p)=>{
const g=c.createLinearGradient(0,0,0,VH);g.addColorStop(0,'#fbcfe8');g.addColorStop(1,'#a5f3fc');c.fillStyle=g;c.fillRect(0,0,VW,VH);O(c,480,520,300,'#bbf7d0')
kid(c,480,430,3,p<.45?'pumpkin':'cloud')
R(c,0,0,VW,VH,'rgba(255,255,255,'+Math.max(0,.9-p*2.5)+')')
}}
]
const NPC={
cocoa:['Dr. Cocoa','Ah. A new dreamer, and a cloud for a head. Lovely.','Rest here as long as you like. The island is safe. Pet the sheep, make a wish, collect the wisps.','But do not go into the science lab. The door hums for a reason, and what is inside is not for sleepers.']
}
function run(box,go,o){
const S=load()
let scene=o.scene||(S.seen?'island':'intro')
let seg=0,st=0,sc=1,ox=0,oy=0
let P={x:620,y:520,f:1},cam={x:0,y:0},D=null,wisps=[1,1,1],pats=0,wishes=0,time=0,tut=false
const lab={x:480,y:480}
const talk=(lines,after)=>{D={lines,i:0,n:0,after}}
const adv=()=>{if(!D)return false;const l=D.lines[D.i];if(D.n<l[1].length){D.n=l[1].length;return true}D.i++;D.n=0;if(D.i>=D.lines.length){const a=D.after;D=null;a&&a()}return true}
const IS=[
{x:520,y:470,r:80,t:'Talk',a:()=>{const L=NPC.cocoa;talk(L.slice(1).map(s=>[L[0],s]))}},
{x:900,y:380,r:80,t:'Pat the cloud sheep',a:()=>{pats++;talk([['Cloud Sheep',pats<3?'Baaaa. (It is warm and smells like rain.)':'Baaa. (It slips a wisp of cloud onto your head like a crown.)']])}},
{x:700,y:640,r:90,t:'Make a wish',a:()=>{wishes++;const w=['The pond ripples. A voice that sounds like your mom hums one note and stops.','The pond shows a tall chocolate figure standing at a window, watching you.','The pond shows a long row of beds. Nobody in them is dreaming.'];talk([['Pond',w[(wishes-1)%3]]])}},
{x:350,y:420,r:80,t:'Sit on the bench',a:()=>talk([['Bench','You sit. Somewhere, very far away, someone is humming the song your mom sings at night.'],['You','Why can I remember it so clearly here?']])},
{x:820,y:260,r:60,w:0,t:'Take wisp',a:()=>0},
{x:420,y:300,r:60,w:1,t:'Take wisp',a:()=>0},
{x:1050,y:560,r:60,w:2,t:'Take wisp',a:()=>0},
{x:1000,y:345,r:70,t:'Enter the science lab',a:()=>{talk(wisps.some(x=>x)?[['Dr. Cocoa','(from far behind you) I told you not to!'],['You','The door slides open.']]:[['Dr. Cocoa','(from far behind you) You collected every wisp. Then you must already know. Fine. Look. Then forget.'],['You','The door slides open.']],()=>{scene='lab';P={x:480,y:430,f:1};save({seen:1})})}}
]
const LI=[
{x:170,y:220,r:70,t:'Look in the cell',a:()=>talk([['Cell 1','A girl sleeps standing up, eyes open. Her breath fogs the glass. The tag reads: SUBJECT 01, afraid of the dark.']])},
{x:300,y:220,r:70,t:'Look in the cell',a:()=>talk([['Cell 2','A boy presses both hands to the glass and mouths one word over and over: run.']])},
{x:660,y:220,r:70,t:'Look in the cell',a:()=>talk([['Cell 3','An old man sits perfectly still. His tag: SUBJECT 07. Dreamt of the same hallway for thirty years.']])},
{x:790,y:220,r:70,t:'Look in the cell',a:()=>talk([['Cell 4','The cell is empty. Scratched on the wall: he lets you out when you are not afraid. He never lets you out.']])},
{x:480,y:230,r:90,t:'Read the panel',a:()=>talk([['Panel','Four live feeds. Each prisoner is trapped in the same place: Terror Night. Monsters circle them in the dark. The lights are almost out.'],['Panel','Every minute they survive, a meter on the side fills. It is labelled HARVEST.'],['You','He is feeding on their fear. Dr. Cocoa is not a scientist. He is a farmer.'],['Panel','Sending yourself into the feed could cut their cell open. Press to enter Terror Night?']],()=>{talk([['','Hold on. Survive the night.']],()=>go('terror'))})},
{x:90,y:350,r:70,t:'Read the poster',a:()=>talk([['Poster','A faded poster. Six silhouettes behind a reinforced wall, a drone on the floor, one hatch in the ceiling. HOLD THE LINE. Reinforce. Breach. Win the round.'],['Scribble','drone first. always drone first.']])},
{x:870,y:350,r:70,t:'Use the terminal',a:()=>{tut=true}},
{x:480,y:515,r:60,t:'Leave the lab',a:()=>{scene='island';P={x:1000,y:380,f:1}}}
]
const kitK=kit(box,(dt,k)=>{
time+=dt
const sx=Math.min(k.W/VW,k.H/VH)
sc=sx;ox=(k.W-VW*sx)/2;oy=(k.H-VH*sx)/2
if(scene==='intro'){st+=dt;if(st>=SEG[seg].d){seg++;st=0;if(seg>=SEG.length){scene='island';save({seen:1})}}return}
if(D){D.n=Math.min(D.lines[D.i][1].length,D.n+dt*48);return}
if(tut)return
let mx=0,my=0
const K=k.keys
if(K.arrowleft||K.a)mx--
if(K.arrowright||K.d)mx++
if(K.arrowup||K.w)my--
if(K.arrowdown||K.s)my++
if(k.down&&!(k.py>VH*sc+oy-90)){const wx=(k.px-ox)/sc,wy=(k.py-oy)/sc,sx2=scene==='island'?P.x-cam.x:P.x,sy2=scene==='island'?P.y-cam.y:P.y;const dx=wx-sx2,dy=wy-sy2,d=Math.hypot(dx,dy);if(d>14){mx=dx/d;my=dy/d}}
const l=Math.hypot(mx,my)||1
P.x+=mx/l*230*dt*(mx||my?1:0);P.y+=my/l*230*dt*(mx||my?1:0)
if(mx)P.f=mx>0?1:-1
if(scene==='island'){const ex=(P.x-700)/560,ey=(P.y-450)/330,d=Math.hypot(ex,ey);if(d>1){P.x=700+ex/d*560;P.y=450+ey/d*330}
cam.x=Math.max(0,Math.min(1400-VW,P.x-VW/2));cam.y=Math.max(0,Math.min(900-VH,P.y-VH/2))
for(const e of IS)if(e.w!=null&&wisps[e.w]&&Math.hypot(P.x-e.x,P.y-e.y)<46){wisps[e.w]=0}}
else{P.x=Math.max(100,Math.min(860,P.x));P.y=Math.max(215,Math.min(505,P.y))}
},(c,k)=>{
c.fillStyle='#000';c.fillRect(0,0,k.W,k.H)
c.save();c.translate(ox,oy);c.scale(sc,sc);c.beginPath();c.rect(0,0,VW,VH);c.clip()
if(scene==='intro'){const s=SEG[seg];s.f(c,st/s.d,k,time);const p=st/s.d;for(const l of s.l)if(p>=l[0]&&p<=l[1])cap(c,l[2],l[3])
txt(c,'Skip',VW-24,28,16,'rgba(255,255,255,.55)','right')}
else if(scene==='island')island(c)
else lab_(c)
if(D){const l=D.lines[D.i];cap(c,l[0],l[1].slice(0,Math.floor(D.n)))}
c.restore()
})
function prompt(c,list){
if(D||tut)return
for(const e of list){if(e.w!=null)continue;const px=scene==='island'?e.x-cam.x:e.x,py=scene==='island'?e.y-cam.y:e.y,d=Math.hypot(P.x-e.x,P.y-e.y);if(d<e.r){R(c,VW/2-150,VH-70,300,40,'rgba(8,8,10,.8)');txt(c,e.t+'  (E or tap)',VW/2,VH-43,18,'#f6f5ef','center');return e}}
}
let near=null
function island(c){
const g=c.createLinearGradient(0,0,0,VH);g.addColorStop(0,'#fbcfe8');g.addColorStop(1,'#a5f3fc');c.fillStyle=g;c.fillRect(0,0,VW,VH)
c.save();c.translate(-cam.x,-cam.y)
for(let i=0;i<6;i++)O(c,120+i*260+Math.sin(time*.3+i)*20,90+(i%2)*60,40,'rgba(255,255,255,.6)')
c.fillStyle='#86efac';c.beginPath();c.ellipse(700,450,560,330,0,0,6.283);c.fill()
c.fillStyle='#4ade80';c.beginPath();c.ellipse(700,470,540,310,0,0,6.283);c.fill()
c.fillStyle='#7dd3fc';c.beginPath();c.ellipse(700,660,110,40,0,0,6.283);c.fill()
R(c,320,430,60,12,'#a16207')
O(c,900,380,26,'#fff');O(c,880,372,16,'#f1f5f9');O(c,920,372,16,'#f1f5f9')
R(c,490,470,30,50,'#78350f');O(c,505,455,18,'#92400e');R(c,495,448,20,5,'#451a03')
R(c,960,250,100,95,'#475569');R(c,990,300,40,45,'#0f172a');R(c,960,236,100,16,'#ef4444')
for(let i=0;i<3;i++)if(wisps[i]){const e=IS.find(z=>z.w===i);O(c,e.x,e.y+Math.sin(time*3+i)*6,9,'#fef08a');O(c,e.x,e.y+Math.sin(time*3+i)*6,18,'rgba(254,240,138,.3)')}
kid(c,P.x,P.y,1.6,'cloud')
c.restore()
near=prompt(c,IS)
txt(c,'Wisps '+(3-wisps.reduce((a,b)=>a+b,0))+'/3',16,28,18,'#334155')
}
function lab_(c){
R(c,0,0,VW,VH,'#0c0e12');R(c,0,200,VW,340,'#1a1d24')
for(const x of[120,250,610,740]){R(c,x,110,130,100,'#1f2937');R(c,x+6,116,118,88,'#0b1220');O(c,x+65,160,16,'#334155');R(c,x+49,172,32,32,'#334155')}
R(c,380,100,200,100,'#020617');R(c,386,106,188,88,'#1a0505')
for(let i=0;i<4;i++)O(c,420+i*40,150+Math.sin(time*2+i)*10,6,'#ef4444')
R(c,60,300,60,100,'#d6d3d1');R(c,66,308,48,6,'#7f1d1d');for(let i=0;i<6;i++)O(c,76+(i%3)*14,340+Math.floor(i/3)*18,4,'#44403c')
R(c,850,300,60,90,'#0f172a');R(c,856,306,48,40,'#14532d');R(c,440,520,80,20,'#020617')
kid(c,P.x,P.y,1.6,'cloud')
near=prompt(c,LI)
if(tut){R(c,80,60,VW-160,VH-120,'rgba(2,6,23,.95)');c.strokeStyle='#14532d';c.strokeRect(80.5,60.5,VW-161,VH-121)
txt(c,'Terror Night: what everything does',110,100,24,'#86efac')
BUILD().forEach((b,i)=>{txt(c,b[1],110,136+i*26,18,'#f6f5ef');txt(c,b[2],270,136+i*26,16,'#a1a1aa')})
txt(c,'Abilities',110,320,20,'#86efac')
ABIL().forEach((b,i)=>{txt(c,b[1]+' ['+b[2]+']',110,350+i*24,16,b[5]);txt(c,b[3],300,350+i*24,15,'#a1a1aa')})
txt(c,'Tap or press E to close',VW/2,VH-84,16,'#8f8d84','center')}
}
const act=()=>{
if(scene==='intro'){seg++;st=0;if(seg>=SEG.length){scene='island';save({seen:1})}return}
if(adv())return
if(tut){tut=false;return}
if(near)near.a()
}
kitK.press=c=>{if(c==='e'||c==='enter'||c===' ')act();if(c==='escape'&&scene==='intro'){scene='island';save({seen:1})}}
kitK.tap=(x,y)=>{if(scene==='intro'){const wx=(x-ox)/sc;if(wx>VW-120&&(y-oy)/sc<50){scene='island';save({seen:1})}else act();return}if(D||tut||(near&&y>VH*sc+oy-90)||(near&&Math.abs(((x-ox)/sc)-VW/2)<150&&(y-oy)/sc>VH-70))act()}
if(o.res!=null){scene='lab';P={x:480,y:430,f:1};talk(o.res?[['',"The cells click open one by one. The prisoners blink awake, gasping, alive."],['Dr. Cocoa','(from the doorway, very calm) Sweet dreams.'],['You','Somewhere above you, faint and warm, your mom is humming. You wake up.'],['','Chapter 1 complete. The dream is not finished with you.']]:[['',"The feed cuts out. The cells stay shut. Dr. Cocoa's voice drifts down the hall."],['Dr. Cocoa','Come back when you are less afraid.']])}
return()=>kitK.stop()
}
let BU=null,AB=null
const BUILD=()=>BU||[]
const ABIL=()=>AB||[]
export function play(box){
let stopCur=null,dead=false
import('/js/rushterror.js').then(m=>{BU=m.BUILD;AB=m.ABIL}).catch(()=>{})
const boot=o=>{stopCur=run(box,go,o||{})}
const go=what=>{
stopCur&&stopCur();stopCur=null
if(what==='terror')import('/js/rush.js').then(m=>{
if(dead)return
let fin=false
stopCur=m.playRush(box,r=>{
if(fin)return
fin=true
setTimeout(()=>{if(dead)return;stopCur&&stopCur();stopCur=null;if(r.ok)save({freed:1});boot({scene:'lab',res:!!r.ok})},900)
},'terror')
})
}
boot()
return()=>{dead=true;stopCur&&stopCur()}
}
