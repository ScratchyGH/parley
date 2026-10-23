import{h}from'./util.js'
import{sv,svg}from'./svg.js'
let cssDone=false
function css(){
if(cssDone||document.getElementById('hwcss3'))return
cssDone=true
document.head.append(h('link',{id:'hwcss3',rel:'stylesheet',href:'/nightshift.css'}))
}
const still=()=>matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.classList.contains('rm')||document.documentElement.classList.contains('perf')
const lerp=(a,b,t)=>a+(b-a)*t
const stop=(o,c,w)=>sv('stop',{offset:o,'stop-color':c})
function art(kind,size){
const o='#120707'
if(kind==='gus')return svg(size,'0 0 100 140',
sv('defs',null,sv('radialGradient',{id:'gg',cx:'.4',cy:'.35',r:'.8'},stop('0','#fdba74'),stop('.55','#f97316'),stop('1','#7c2d12'))),
sv('path',{d:'M18,140V92C18,76 34,70 50,70C66,70 82,76 82,92V140Z',fill:'#2a1b3d',stroke:o,'stroke-width':'3'}),
sv('path',{d:'M50,72L40,84L50,90L60,84Z',fill:'#8b1a2f',stroke:o,'stroke-width':'2'}),
sv('ellipse',{cx:'50',cy:'40',rx:'34',ry:'32',fill:'url(#gg)',stroke:o,'stroke-width':'3'}),
sv('path',{d:'M50,8C50,3 54,1 58,0',fill:'none',stroke:'#3f6212','stroke-width':'5','stroke-linecap':'round'}),
sv('path',{d:'M26,34L42,28L40,44ZM74,34L58,28L60,44ZM30,56L40,50L50,60L60,50L70,56L62,68L38,68Z',fill:'#fde047',stroke:o,'stroke-width':'2','stroke-linejoin':'round'}),
sv('circle',{cx:'36',cy:'38',r:'3',fill:'#fff'}),sv('circle',{cx:'64',cy:'38',r:'3',fill:'#fff'}))
if(kind==='pippa')return svg(size,'0 0 100 140',
sv('path',{d:'M50,6C26,6 14,26 14,52V120L24,112L32,128L42,112L50,130L58,112L68,128L76,112L86,120V52C86,26 74,6 50,6Z',fill:'#e8eef2',stroke:'#0b1015','stroke-width':'3','stroke-linejoin':'round'}),
sv('ellipse',{cx:'36',cy:'48',rx:'9',ry:'13',fill:'#05080b'}),sv('ellipse',{cx:'64',cy:'48',rx:'9',ry:'13',fill:'#05080b'}),
sv('ellipse',{cx:'50',cy:'78',rx:'7',ry:'10',fill:'#05080b'}),
sv('path',{d:'M50,0V-30M14,52L-6,40M86,52L106,40',stroke:'#94a3b8','stroke-width':'1.5'}))
return svg(size,'0 0 100 140',
sv('rect',{x:'14',y:'92',width:'72',height:'48',rx:'4',fill:'#7c2d12',stroke:o,'stroke-width':'3'}),
sv('path',{d:'M34,92C30,78 70,78 66,92M32,80C28,68 72,68 68,80',fill:'none',stroke:'#cbd5e1','stroke-width':'4','stroke-linecap':'round'}),
sv('path',{d:'M26,32C26,8 74,8 74,32C74,40 68,44 68,54H32C32,44 26,40 26,32Z',fill:'#f1f5f9',stroke:o,'stroke-width':'3','stroke-linejoin':'round'}),
sv('circle',{cx:'40',cy:'32',r:'7',fill:'#05080b'}),sv('circle',{cx:'60',cy:'32',r:'7',fill:'#05080b'}),sv('circle',{cx:'40',cy:'32',r:'2',fill:'#ef4444'}),sv('circle',{cx:'60',cy:'32',r:'2',fill:'#ef4444'}),
sv('path',{d:'M44,42L50,38L56,42M38,54V46M46,54V47M54,54V47M62,54V46',stroke:o,'stroke-width':'2',fill:'none'}),
sv('path',{d:'M24,16H76L72,8H28Z',fill:'#1e1b4b',stroke:o,'stroke-width':'2.5','stroke-linejoin':'round'}))
}
const FEED={
stage:'Stage',hall:'Hall',box:'Music Box'
}
const TIMES=['12 AM','1 AM','2 AM','3 AM','4 AM','5 AM','6 AM']
function mkAudio(){
let ac=null,hum=null
const init=()=>{
if(ac)return
try{
ac=new(window.AudioContext||window.webkitAudioContext)()
const o=ac.createOscillator(),g=ac.createGain()
o.type='sawtooth';o.frequency.value=52;g.gain.value=.012
o.connect(g);g.connect(ac.destination);o.start()
hum={o,g}
}catch{ac=null}
}
const noise=(dur,vol,hp)=>{
if(!ac)return
const n=Math.floor(ac.sampleRate*dur),b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0)
for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n)
const s=ac.createBufferSource(),g=ac.createGain(),f=ac.createBiquadFilter()
f.type=hp?'highpass':'lowpass';f.frequency.value=hp?900:400
g.gain.value=vol
s.buffer=b;s.connect(f);f.connect(g);g.connect(ac.destination);s.start()
}
const beep=(fr,dur,vol)=>{
if(!ac)return
const o=ac.createOscillator(),g=ac.createGain()
o.type='square';o.frequency.value=fr;g.gain.value=vol
g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur)
o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+dur)
}
return{init,thud:()=>noise(.35,.5,false),click:()=>beep(900,.06,.03),scare:()=>{noise(1,.8,true);beep(180,.9,.12)},win:()=>{beep(660,.25,.05);setTimeout(()=>beep(880,.4,.05),220)},close:()=>{try{hum?.o.stop();ac?.close()}catch{}}}
}
export function playNight(night,mount,done){
css()
const reduce=still()
const A=mkAudio()
const dur=60,hard=1+(night-1)*.28
const S={t:0,power:100,door:false,lamp:false,cams:false,cam:'stage',gus:'stage',gusT:0,gusAt:0,pip:false,pipT:0,pipLit:0,pipNext:9/hard,box:100,out:false,outT:0,over:false,started:false,hour:-1,startT:0}
const root=h('div',{class:'ns ns-intro'})
const view=h('div',{class:'ns-view'})
const room=h('div',{class:'ns-room'})
const P=(c,kids)=>h('div',{class:'ns-p '+c},kids)
const doorCh=h('div',{class:'ns-ch ns-gus'},art('gus',150))
const doorSlab=h('div',{class:'ns-slab'})
const doorway=h('div',{class:'ns-doorway'},h('div',{class:'ns-hallbg'}),doorCh,doorSlab,h('div',{class:'ns-doorlit'}))
const winCh=h('div',{class:'ns-ch ns-pip'},art('pippa',120))
const lit=h('div',{class:'ns-lit'})
const win=h('div',{class:'ns-win'},h('div',{class:'ns-hallbg'}),winCh,lit,h('div',{class:'ns-mullion'}))
const tube=h('div',{class:'ns-tube'})
room.append(
P('ns-back',[h('div',{class:'ns-sign'},'HOLLOWGRIN HARVEST HALL  NIGHT SECURITY'),h('div',{class:'ns-clock'}),h('div',{class:'ns-poster'},art('gus',46)),h('div',{class:'ns-poster p2'},art('pippa',40))]),
P('ns-left',win),
P('ns-right',doorway),
P('ns-floor'),
P('ns-ceil',tube),
P('ns-desk',[h('div',{class:'ns-mon'},h('i'),h('b',null,'CAM'))]))
view.append(room)
const hudTime=h('b',null,'12 AM'),hudNight=h('span',null,'NIGHT '+night)
const pbar=h('i'),pTxt=h('span',null,'100%')
const top=h('div',{class:'ns-top'},h('div',{class:'ns-t1'},hudTime,hudNight),h('div',{class:'ns-pw'},h('span',null,'POWER'),h('div',{class:'ns-pbar'},pbar),pTxt),h('div',{class:'ns-rec hw-rec'},'REC'))
const bDoor=h('button',{class:'ns-btn','aria-label':'Door'},'DOOR  [D]')
const bLamp=h('button',{class:'ns-btn','aria-label':'Lamp'},'LAMP  [L]')
const bCam=h('button',{class:'ns-btn ns-bcam','aria-label':'Cameras'},'CAMERAS  [C]')
const dock=h('div',{class:'ns-dock'},bDoor,bLamp,bCam)
const feedBox=h('div',{class:'ns-fbox'})
const noise=h('canvas',{class:'ns-noise',width:96,height:54})
const nctx=noise.getContext('2d')
const feedChars=h('div',{class:'ns-fchars'})
const feedTitle=h('b',null,'CAM 1  Stage')
const windBtn=h('button',{class:'ns-btn ns-wind'},'WIND  [W]')
const mbar=h('i'),mwrap=h('div',{class:'ns-mw'},h('span',null,'MUSIC BOX'),h('div',{class:'ns-pbar'},mbar))
const feedBtns=Object.keys(FEED).map((k,i)=>{const b=h('button',{class:'ns-cb'+(k==='stage'?' on':'')},(i+1)+' '+FEED[k]);b.addEventListener('click',()=>setCam(k));return b})
feedBox.append(h('div',{class:'ns-fscene'},h('div',{class:'ns-fbg'}),feedChars,noise),h('div',{class:'ns-fbar'},feedTitle,mwrap,windBtn),h('div',{class:'ns-fbtns'},...feedBtns))
const cams=h('div',{class:'ns-cams'},feedBox)
const title=h('div',{class:'ns-title'},h('span',null,'NIGHT '+night),h('b',null,TIMES[0]),h('em',null,'Hold the hall until six'))
const hint=h('div',{class:'ns-hint'},'Close the door when something is at it. Hold the lamp at the window. Wind the music box on the cameras.')
const scare=h('div',{class:'ns-scare'})
const end=h('div',{class:'ns-end'})
root.append(view,top,dock,cams,title,hint,scare,end,h('div',{class:'ns-vig hw-vig'}),h('div',{class:'ns-scan'}))
mount.append(root)
function fit(){
const w=root.clientWidth||900,hh=root.clientHeight||560
room.style.setProperty('--sc',String(Math.max(.45,Math.min(w/960,hh/640)*1.0)))
}
fit()
const ro=new ResizeObserver(fit)
ro.observe(root)
let tx=0,ty=0,cx=0,cy=0
const onMove=e=>{const r=root.getBoundingClientRect();tx=((e.clientX-r.left)/r.width-.5)*2;ty=((e.clientY-r.top)/r.height-.5)*2}
root.addEventListener('pointermove',onMove)
function setDoor(v){
if(S.out||S.over)return
S.door=v
doorSlab.classList.toggle('on',v)
bDoor.classList.toggle('on',v)
A.thud()
}
function lamp(v){
if(S.out||S.over)return
S.lamp=v
lit.classList.toggle('on',v)
bLamp.classList.toggle('on',v)
}
function setCams(v){
if(S.out||S.over)return
S.cams=v
cams.classList.toggle('on',v)
bCam.classList.toggle('on',v)
if(v){A.click();drawFeed()}
}
function setCam(k){
S.cam=k
feedBox.dataset.cam=k
feedBtns.forEach((b,i)=>b.classList.toggle('on',Object.keys(FEED)[i]===k))
feedTitle.textContent='CAM '+(Object.keys(FEED).indexOf(k)+1)+'  '+FEED[k]
mwrap.style.display=k==='box'?'':'none'
windBtn.style.display=k==='box'?'':'none'
A.click()
drawFeed()
}
function wind(){if(S.cam==='box'&&!S.over){S.box=Math.min(100,S.box+20);A.click()}}
function drawFeed(){
feedChars.replaceChildren()
if(S.cam==='stage'&&S.gus==='stage')feedChars.append(h('div',{class:'ns-fc',style:{left:'42%'}},art('gus',90)))
if(S.cam==='hall'&&S.gus==='hall')feedChars.append(h('div',{class:'ns-fc',style:{left:'56%'}},art('gus',100)))
if(S.cam==='hall'&&S.pip)feedChars.append(h('div',{class:'ns-fc',style:{left:'18%'}},art('pippa',70)))
if(S.cam==='box'&&S.box<26)feedChars.append(h('div',{class:'ns-fc',style:{left:'40%'}},art('jack',S.box<12?120:90)))
else if(S.cam==='box')feedChars.append(h('div',{class:'ns-fc ns-boxc',style:{left:'40%'}},art('jack',64)))
}
bDoor.addEventListener('click',()=>setDoor(!S.door))
bCam.addEventListener('click',()=>setCams(!S.cams))
const lampDown=e=>{e.preventDefault();lamp(true)}
const lampUp=()=>lamp(false)
bLamp.addEventListener('pointerdown',lampDown)
addEventListener('pointerup',lampUp)
addEventListener('pointercancel',lampUp)
windBtn.addEventListener('click',wind)
const kd=e=>{
if(e.repeat)return
const k=e.key.toLowerCase()
if(k==='d')setDoor(!S.door)
else if(k==='l')lamp(true)
else if(k==='c'||k===' '){e.preventDefault();setCams(!S.cams)}
else if(k==='w')wind()
else if(k==='1')setCam('stage')
else if(k==='2')setCam('hall')
else if(k==='3')setCam('box')
}
const ku=e=>{if(e.key.toLowerCase()==='l')lamp(false)}
addEventListener('keydown',kd)
addEventListener('keyup',ku)
function jump(who){
if(S.over)return
S.over=true
A.scare()
scare.replaceChildren(art(who,360))
scare.classList.add('on')
root.classList.add('ns-lost')
setTimeout(()=>finish(false),1700)
}
let finished=false
function finish(ok){
if(finished)return
finished=true
if(ok){A.win();end.textContent='6 AM';end.classList.add('on')}
setTimeout(()=>done({ok,night}),ok?1400:0)
}
function setGus(p){
S.gus=p
S.gusT=0
doorCh.classList.toggle('on',p==='door')
if(S.cams)drawFeed()
}
function tick(dt){
S.t+=dt
const hr=Math.min(6,Math.floor(S.t/(dur/6)))
if(hr!==S.hour){S.hour=hr;hudTime.textContent=TIMES[hr]}
if(S.t>=dur&&!S.over){S.over=true;finish(true);return}
const use=.55+(S.door?.9:0)+(S.lamp?.9:0)+(S.cams?.5:0)
if(!S.out){
S.power=Math.max(0,S.power-use*dt*(1+night*.04))
if(S.power<=0){S.out=true;S.outT=0;S.door=false;S.lamp=false;S.cams=false;doorSlab.classList.remove('on');lit.classList.remove('on');cams.classList.remove('on');root.classList.add('ns-dark');A.thud()}
}else{
S.outT+=dt
if(S.outT>5.5&&!S.over)jump('gus')
}
S.gusT+=dt
if(S.gus==='stage'&&S.gusT>7/hard&&Math.random()<.5*dt*hard+.02){setGus('hall')}
else if(S.gus==='hall'&&S.gusT>6/hard&&Math.random()<.45*dt*hard+.02){setGus('door');S.gusAt=0}
else if(S.gus==='door'){
S.gusAt+=dt
if(S.door&&!S.out){if(S.gusAt>1.2){A.thud();setGus('stage')}}
else if(S.gusAt>2.6&&!S.over)jump('gus')
}
if(night>=2){
if(!S.pip){
S.pipNext-=dt
if(S.pipNext<=0){S.pip=true;S.pipT=0;S.pipLit=0;winCh.classList.add('on');if(S.cams)drawFeed()}
}else{
S.pipT+=dt
if(S.lamp&&!S.out){S.pipLit+=dt;if(S.pipLit>1.1){S.pip=false;S.pipNext=(7+Math.random()*5)/hard;winCh.classList.remove('on');if(S.cams)drawFeed()}}
else if(S.pipT>3.4&&!S.over)jump('pippa')
}
}
if(night>=3&&!S.out){
S.box-=dt*(3.2+night*.9)*(S.cam==='box'&&S.cams?1:1)
if(S.box<=0&&!S.over)jump('jack')
}
}
const hudUpdate=()=>{
pbar.style.transform='scaleX('+(S.power/100)+')'
pTxt.textContent=Math.ceil(S.power)+'%'
pbar.classList.toggle('low',S.power<22)
mbar.style.transform='scaleX('+Math.max(0,S.box/100)+')'
mbar.classList.toggle('low',S.box<30)
}
let last=0,raf=0,hudAt=0,nAt=0,dead=false,goT=0
const intro=setTimeout(()=>{root.classList.remove('ns-intro');title.classList.add('out');S.started=true;A.init();setTimeout(()=>hint.classList.add('out'),6000)},2200)
const frame=now=>{
if(dead)return
raf=requestAnimationFrame(frame)
if(!last){last=now;return}
let dt=(now-last)/1000
last=now
if(document.hidden)return
dt=Math.min(dt,.1)
if(S.started&&!S.over)tick(dt)
if(!reduce){
cx=lerp(cx,tx,Math.min(1,dt*5));cy=lerp(cy,ty,Math.min(1,dt*5))
room.style.setProperty('--py',(cx*30).toFixed(2)+'deg')
room.style.setProperty('--px',(-cy*7).toFixed(2)+'deg')
}
hudAt+=dt
if(hudAt>.12){hudAt=0;hudUpdate()}
if(S.cams&&!reduce){nAt+=dt;if(nAt>.07){nAt=0;noiseDraw()}}
}
function noiseDraw(){
const w=96,hh=54,im=nctx.createImageData(w,hh),d=im.data
for(let i=0;i<d.length;i+=4){const v=Math.random()*70|0;d[i]=v;d[i+1]=v+20;d[i+2]=v;d[i+3]=255}
nctx.putImageData(im,0,0)
}
setCam('stage')
mwrap.style.display='none'
windBtn.style.display='none'
hudUpdate()
raf=requestAnimationFrame(frame)
return()=>{
dead=true
cancelAnimationFrame(raf)
clearTimeout(intro)
ro.disconnect()
removeEventListener('keydown',kd)
removeEventListener('keyup',ku)
removeEventListener('pointerup',lampUp)
removeEventListener('pointercancel',lampUp)
A.close()
root.remove()
}
}
