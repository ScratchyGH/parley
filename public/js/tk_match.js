export default function launch(host,api){
const cv=document.createElement('canvas')
cv.style.setProperty('display','block')
cv.style.setProperty('width','100%')
cv.style.setProperty('height','100%')
cv.style.setProperty('touch-action','none')
host.append(cv)
const g=cv.getContext('2d')
const red=api.reduced(),lite=api.lite()
const N=7,K=6,BK='tk_match_best',DUR=75
let W=960,H=540,DPR=1,cs=60,bx=0,by=0,hudH=80
let best=0
try{best=+localStorage.getItem(BK)||0}catch{}
const COL=['#f07a1a','#d6322c','#f2c230','#b07a3c','#e0a050','#c8431e']
const hash=k=>Math.abs(Math.sin(k*127.1)*43758.5453)%1
let spr=[],bgc=null
function ell(x,cx,cy,rx,ry,rot,fill){
x.fillStyle=fill
x.beginPath()
x.ellipse(cx,cy,rx,ry,rot||0,0,7)
x.fill()
}
function rg(x,cx,cy,r0,r1,stops){
const gr=x.createRadialGradient(cx,cy,r0,cx,cy,r1)
stops.forEach((s,i)=>gr.addColorStop(i/(stops.length-1),s))
return gr
}
function drawSpr(ty,u){
const o=document.createElement('canvas')
o.width=o.height=u
const x=o.getContext('2d')
const cx=u/2
x.lineCap='round'
x.lineJoin='round'
if(ty===0){
const cy=u*.58
for(const d of [-.2,.2,-.1,.1,0]){
ell(x,cx+d*u,cy,u*.2,u*.27,0,rg(x,cx+d*u-u*.04,cy-u*.1,u*.02,u*.3,['#ffbe5a','#f07a1a','#a8420a']))
x.strokeStyle='rgba(120,40,0,.35)'
x.lineWidth=u*.012
x.beginPath()
x.ellipse(cx+d*u,cy,u*.2,u*.27,0,0,7)
x.stroke()
}
x.strokeStyle='#5a3a14'
x.lineWidth=u*.07
x.beginPath()
x.moveTo(cx,cy-u*.26)
x.lineTo(cx+u*.02,cy-u*.37)
x.stroke()
x.strokeStyle='#4a8a2a'
x.lineWidth=u*.025
x.beginPath()
x.moveTo(cx+u*.03,cy-u*.3)
x.bezierCurveTo(cx+u*.2,cy-u*.38,cx+u*.24,cy-u*.22,cx+u*.16,cy-u*.2)
x.stroke()
ell(x,cx-u*.12,cy-u*.12,u*.06,u*.1,.5,'rgba(255,255,255,.35)')
}else if(ty===1){
const cy=u*.58
ell(x,cx-u*.1,cy,u*.19,u*.24,0,rg(x,cx-u*.12,cy-u*.1,u*.02,u*.3,['#ff6a5a','#d6322c','#8a1414']))
ell(x,cx+u*.1,cy,u*.19,u*.24,0,rg(x,cx+u*.08,cy-u*.1,u*.02,u*.3,['#ff6a5a','#d6322c','#8a1414']))
x.strokeStyle='#4a2a10'
x.lineWidth=u*.04
x.beginPath()
x.moveTo(cx,cy-u*.18)
x.quadraticCurveTo(cx+u*.02,cy-u*.3,cx+u*.06,cy-u*.36)
x.stroke()
ell(x,cx+u*.15,cy-u*.3,u*.11,u*.05,-.5,'#58a032')
ell(x,cx-u*.14,cy-u*.12,u*.05,u*.09,.5,'rgba(255,255,255,.45)')
}else if(ty===2){
x.translate(cx,cx)
x.rotate(-.6)
ell(x,0,u*.18,u*.1,u*.3,0,'#4a8a2a')
ell(x,-u*.1,u*.2,u*.07,u*.3,.3,'#68b03c')
ell(x,u*.1,u*.2,u*.07,u*.3,-.3,'#58a032')
ell(x,0,-u*.04,u*.13,u*.32,0,rg(x,-u*.04,-u*.1,u*.01,u*.3,['#fff08a','#f2c230','#b8860a']))
x.strokeStyle='rgba(140,90,0,.45)'
x.lineWidth=u*.01
for(let i=-4;i<=4;i++){
x.beginPath()
x.moveTo(i*u*.028,-u*.34)
x.lineTo(i*u*.028,u*.26)
x.stroke()
}
for(let j=-5;j<=4;j++){
x.beginPath()
x.moveTo(-u*.13,j*u*.06)
x.lineTo(u*.13,j*u*.06)
x.stroke()
}
ell(x,-u*.05,-u*.12,u*.025,u*.12,0,'rgba(255,255,255,.4)')
}else if(ty===3){
const cy=u*.6
ell(x,cx,cy+u*.04,u*.17,u*.24,0,rg(x,cx-u*.06,cy-u*.06,u*.02,u*.3,['#e0b070','#b07a3c','#6a4018']))
ell(x,cx,cy-u*.12,u*.22,u*.12,0,rg(x,cx-u*.06,cy-u*.16,u*.02,u*.3,['#8a5a2a','#5a3412','#3a200a']))
x.strokeStyle='rgba(20,10,0,.4)'
x.lineWidth=u*.012
for(let i=-3;i<=3;i++){
x.beginPath()
x.moveTo(cx+i*u*.06,cy-u*.22)
x.lineTo(cx+i*u*.05,cy-u*.04)
x.stroke()
}
x.strokeStyle='#3a200a'
x.lineWidth=u*.05
x.beginPath()
x.moveTo(cx,cy-u*.22)
x.lineTo(cx+u*.02,cy-u*.32)
x.stroke()
ell(x,cx-u*.07,cy+u*.02,u*.03,u*.1,.2,'rgba(255,255,255,.35)')
}else if(ty===4){
const cy=u*.55
ell(x,cx,cy+u*.04,u*.36,u*.26,0,'#7a4a1a')
ell(x,cx,cy,u*.36,u*.26,0,rg(x,cx-u*.1,cy-u*.1,u*.02,u*.4,['#f0c07a','#d99a50','#a8662a']))
for(let i=0;i<14;i++){
const a=i/14*6.283
ell(x,cx+Math.cos(a)*u*.34,cy+Math.sin(a)*u*.24,u*.035,u*.03,a,'#b87a38')
}
ell(x,cx,cy,u*.27,u*.18,0,rg(x,cx-u*.06,cy-u*.06,u*.01,u*.3,['#e08a3a','#c0661a','#8a4010']))
x.strokeStyle='#e8bf70'
x.lineWidth=u*.025
x.beginPath()
for(let i=-2;i<=2;i++){
x.moveTo(cx+i*u*.1-u*.14,cy-u*.16)
x.lineTo(cx+i*u*.1+u*.14,cy+u*.16)
x.moveTo(cx+i*u*.1+u*.14,cy-u*.16)
x.lineTo(cx+i*u*.1-u*.14,cy+u*.16)
}
x.save()
x.beginPath()
x.ellipse(cx,cy,u*.27,u*.18,0,0,7)
x.clip()
x.stroke()
x.restore()
ell(x,cx,cy-u*.04,u*.07,u*.05,0,'#fffaf0')
ell(x,cx,cy-u*.08,u*.04,u*.035,0,'#fff')
}else{
const cy=u*.52
x.translate(cx,cy)
const gr=x.createLinearGradient(-u*.3,-u*.3,u*.3,u*.3)
gr.addColorStop(0,'#ffa030')
gr.addColorStop(.5,'#d6322c')
gr.addColorStop(1,'#8a1a14')
x.fillStyle=gr
x.beginPath()
const P=[[0,-.36],[.06,-.22],[.2,-.28],[.16,-.12],[.32,-.08],[.22,.02],[.3,.14],[.12,.12],[.1,.24],[0,.18],[-.1,.24],[-.12,.12],[-.3,.14],[-.22,.02],[-.32,-.08],[-.16,-.12],[-.2,-.28],[-.06,-.22]]
P.forEach((p,i)=>i?x.lineTo(p[0]*u,p[1]*u):x.moveTo(p[0]*u,p[1]*u))
x.closePath()
x.fill()
x.strokeStyle='rgba(90,10,0,.55)'
x.lineWidth=u*.015
x.beginPath()
x.moveTo(0,u*.2);x.lineTo(0,-u*.3)
x.moveTo(0,0);x.lineTo(u*.22,-u*.08)
x.moveTo(0,0);x.lineTo(-u*.22,-u*.08)
x.moveTo(0,u*.08);x.lineTo(u*.18,u*.12)
x.moveTo(0,u*.08);x.lineTo(-u*.18,u*.12)
x.stroke()
x.strokeStyle='#5a2a10'
x.lineWidth=u*.04
x.beginPath()
x.moveTo(0,u*.18);x.lineTo(0,u*.3)
x.stroke()
}
return o
}
function build(){
spr=[]
const u=Math.ceil(cs)
for(let i=0;i<K;i++)spr.push(drawSpr(i,u))
bgc=document.createElement('canvas')
bgc.width=cv.width
bgc.height=cv.height
const x=bgc.getContext('2d')
const sk=x.createLinearGradient(0,0,0,H)
sk.addColorStop(0,'#2a1230')
sk.addColorStop(.55,'#6a2c28')
sk.addColorStop(1,'#c2662a')
x.fillStyle=sk
x.fillRect(0,0,W,H)
x.fillStyle=rg(x,W*.5,H*.95,10,Math.max(W,H)*.7,['rgba(255,190,100,.55)','rgba(255,150,60,.15)','rgba(255,150,60,0)'])
x.fillRect(0,0,W,H)
const cols=['#3a1a22','#4a1e1c','#5a2a14','#2a1018']
for(let l=0;l<4;l++){
const n=7+l*2
for(let i=0;i<n;i++){
const px=(i+hash(l*40+i))*W/n,hh=H*(.22+l*.07)*(.8+hash(l*9+i)*.5),by2=H*(.74+l*.07)
x.fillStyle=cols[l]
x.fillRect(px-hh*.03,by2-hh*.5,hh*.06,hh*.55)
for(let j=0;j<5;j++){
x.beginPath()
x.arc(px+(hash(i+j*7+l)-.5)*hh*.45,by2-hh*(.55+hash(i*3+j+l)*.35),hh*(.14+hash(j+i)*.1),0,7)
x.fill()
}
}
}
for(let i=0;i<5;i++){
const lx=W*(.1+i*.2),ly=H*(.1+hash(i)*.12)
x.fillStyle=rg(x,lx,ly,2,H*.14,['rgba(255,214,130,.8)','rgba(255,170,70,.18)','rgba(255,170,70,0)'])
x.fillRect(lx-H*.14,ly-H*.14,H*.28,H*.28)
}
}
function resize(){
DPR=Math.min(2,window.devicePixelRatio||1)
const w=Math.max(2,host.clientWidth),h=Math.max(2,host.clientHeight)
cv.width=W=Math.round(w*DPR)
cv.height=H=Math.round(h*DPR)
hudH=Math.min(Math.max(78*DPR,H*.15),124*DPR)
const pad=14*DPR
cs=Math.floor(Math.min((W-pad*2)/N,(H-hudH-pad*2)/N))
cs=Math.max(20,cs)
bx=Math.round((W-cs*N)/2)
by=Math.round(hudH+(H-hudH-cs*N)/2)
build()
}
const ro=new ResizeObserver(resize)
ro.observe(host)
resize()
let ac=null,master=null,nbuf=null,mute=false,nextN=0,nstep=0
function aud(){
if(ac){if(ac.state==='suspended')ac.resume();return}
const C=window.AudioContext||window.webkitAudioContext
if(!C)return
ac=new C()
master=ac.createGain()
master.gain.value=.5
master.connect(ac.destination)
nbuf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate)
const d=nbuf.getChannelData(0)
for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1
nextN=ac.currentTime+.1
}
function tone(f,d,ty,v,sl,at){
if(!ac||mute)return
const o=ac.createOscillator(),gn=ac.createGain(),t0=at||ac.currentTime
o.type=ty
o.frequency.setValueAtTime(f,t0)
if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(20,sl),t0+d)
gn.gain.setValueAtTime(v,t0)
gn.gain.exponentialRampToValueAtTime(.0001,t0+d)
o.connect(gn)
gn.connect(master)
o.start(t0)
o.stop(t0+d+.03)
}
function noise(d,v,f){
if(!ac||mute)return
const s=ac.createBufferSource(),fl=ac.createBiquadFilter(),gn=ac.createGain(),t0=ac.currentTime
s.buffer=nbuf
fl.type='lowpass'
fl.frequency.setValueAtTime(f,t0)
fl.frequency.exponentialRampToValueAtTime(100,t0+d)
gn.gain.setValueAtTime(v,t0)
gn.gain.exponentialRampToValueAtTime(.0001,t0+d)
s.connect(fl)
fl.connect(gn)
gn.connect(master)
s.start(t0)
s.stop(t0+d+.03)
}
const PEN=[392,440,523.25,587.33,659.25,784,880,1046.5]
const PAD=[196,246.94,293.66,329.63]
function music(){
if(!ac||mute||ph==='ready'||ph==='over')return
while(nextN<ac.currentTime+.15){
tone(PAD[nstep%4]*(nstep%8<4?1:1.5),.7,'sine',.035,0,nextN)
if(nstep%2===1)tone(PEN[(nstep*3)%PEN.length]*.5,.4,'triangle',.02,0,nextN)
nstep++
nextN+=.5
}
}
let grid=[],ph='ready',phT=0,sa=null,sb=null,sel=null,cur=[3,3],drag=null
let scoreV=0,shownScore=0,timeL=DUR,elapsed=0,chain=0,idle=0,hint=null,timeUp=false,shake=0,newBest=false,resP=-1,time=0,overT=0,lastTick=0
let parts=[],pops=[],leaves=[]
const LN=lite||red?8:22
for(let i=0;i<LN;i++)leaves.push({x:Math.random(),y:Math.random(),vx:-.02-Math.random()*.03,vy:.03+Math.random()*.05,r:.05+Math.random()*.05,rot:Math.random()*6,vr:(Math.random()-.5)*2,ph:Math.random()*6,c:['#e8741c','#c9331a','#f2b134','#a6521a'][i%4]})
const mk=(r,c,t)=>({t,sp:0,px:c,py:r,vy:0,g:false,sc:1,a:1,rm:0,sq:0,pop:0})
function rnd(){return Math.floor(Math.random()*K)}
function lineAt(r,c,tp){
let h=1,v=1
for(let i=c-1;i>=0&&tp[r][i]===tp[r][c];i--)h++
for(let i=c+1;i<N&&tp[r][i]===tp[r][c];i++)h++
for(let i=r-1;i>=0&&tp[i][c]===tp[r][c];i--)v++
for(let i=r+1;i<N&&tp[i][c]===tp[r][c];i++)v++
return h>=3||v>=3
}
function moveFor(tp){
for(let r=0;r<N;r++)for(let c=0;c<N;c++){
for(const [dr,dc] of [[0,1],[1,0]]){
const r2=r+dr,c2=c+dc
if(r2>=N||c2>=N)continue
const a=tp[r][c];tp[r][c]=tp[r2][c2];tp[r2][c2]=a
const ok=lineAt(r,c,tp)||lineAt(r2,c2,tp)
tp[r2][c2]=tp[r][c];tp[r][c]=a
if(ok)return[r,c,r2,c2]
}
}
return null
}
function types(){
return grid.map(row=>row.map(c=>c?c.t:-1))
}
function fresh(){
let tp
do{
tp=[]
for(let r=0;r<N;r++){
tp.push([])
for(let c=0;c<N;c++){
let t
do{t=rnd()}while((c>1&&tp[r][c-1]===t&&tp[r][c-2]===t)||(r>1&&tp[r-1][c]===t&&tp[r-2][c]===t))
tp[r].push(t)
}
}
}while(!moveFor(tp.map(x=>x.slice())))
return tp
}
function newBoard(){
const tp=fresh()
grid=tp.map((row,r)=>row.map((t,c)=>{const o=mk(r,c,t);o.py=c*-.2-N-r*.15;o.g=true;return o}))
}
function begin(){
aud()
scoreV=0;shownScore=0;timeL=DUR;elapsed=0;chain=0;idle=0;hint=null;timeUp=false;newBest=false;resP=-1
parts=[];pops=[];sel=null;sa=null;sb=null
newBoard()
ph='fall'
tone(392,.12,'triangle',.12)
tone(523.25,.12,'triangle',.12,0,ac&&ac.currentTime+.08)
tone(659.25,.2,'triangle',.12,0,ac&&ac.currentTime+.16)
}
function burst(x,y,n,col,sp,l,k){
if(parts.length>320)return
for(let i=0;i<n;i++){
const a=Math.random()*6.283,s=sp*(.3+Math.random())
parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-sp*.4,l:l*(.6+Math.random()*.6),m:l,c:col,r:(2+Math.random()*3)*DPR,k,rot:Math.random()*6,vr:(Math.random()-.5)*12})
}
}
function pop(x,y,s,c,sz){pops.push({x,y,s,c,sz:sz*DPR,l:1,m:1})}
const cpos=(r,c)=>[bx+(c+.5)*cs,by+(r+.5)*cs]
function busy(){
for(let r=0;r<N;r++)for(let c=0;c<N;c++){
const o=grid[r][c]
if(!o)return true
if(o.rm>0||Math.abs(o.px-c)>.01||Math.abs(o.py-r)>.01||o.g)return true
}
return false
}
function trySwap(r1,c1,r2,c2){
if(ph!=='idle')return
if(Math.abs(r1-r2)+Math.abs(c1-c2)!==1)return
const a=grid[r1][c1],b=grid[r2][c2]
grid[r1][c1]=b
grid[r2][c2]=a
sa=[r2,c2]
sb=[r1,c1]
sel=null
hint=null
idle=0
ph='swap'
tone(300,.06,'triangle',.08,420)
}
function swapBack(){
const a=grid[sa[0]][sa[1]],b=grid[sb[0]][sb[1]]
grid[sa[0]][sa[1]]=b
grid[sb[0]][sb[1]]=a
}
function resolve(swapped){
const cl=new Set(),spawn=[]
const tp=types()
const runs=[]
for(let r=0;r<N;r++){
let c=0
while(c<N){
let e=c
while(e+1<N&&tp[r][e+1]===tp[r][c])e++
if(e-c>=2)runs.push({cells:Array.from({length:e-c+1},(_,i)=>[r,c+i]),h:1})
c=e+1
}
}
for(let c=0;c<N;c++){
let r=0
while(r<N){
let e=r
while(e+1<N&&tp[e+1][c]===tp[r][c])e++
if(e-r>=2)runs.push({cells:Array.from({length:e-r+1},(_,i)=>[r+i,c]),h:0})
r=e+1
}
}
const key=(r,c)=>r*N+c
let sw=null
if(swapped&&sa&&sb){
const A=grid[sa[0]][sa[1]],B=grid[sb[0]][sb[1]]
if(A.sp===2||B.sp===2){
sw=true
const tt=A.sp===2?B.t:A.t
cl.add(key(sa[0],sa[1]));cl.add(key(sb[0],sb[1]))
for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(grid[r][c].t===tt)cl.add(key(r,c))
}
}
if(!runs.length&&!sw)return false
const hv=new Map()
for(const run of runs){
for(const [r,c] of run.cells){
cl.add(key(r,c))
hv.set(key(r,c),(hv.get(key(r,c))||0)+1)
}
}
let bonusT=0,bonusS=0,cx=0,cy=0,cn=0
for(const run of runs){
const L=run.cells.length
if(L>=4){
let o=run.cells.find(([r,c])=>(sa&&sa[0]===r&&sa[1]===c)||(sb&&sb[0]===r&&sb[1]===c))||run.cells[Math.floor(L/2)]
spawn.push([o[0],o[1],L>=5?2:1])
bonusT+=2
bonusS+=L>=5?120:40
}
}
for(const [k,v] of hv)if(v>1){const r=Math.floor(k/N),c=k%N;if(!spawn.find(s=>s[0]===r&&s[1]===c))spawn.push([r,c,1])}
let grew=true
const done=new Set()
while(grew){
grew=false
for(const k of [...cl]){
if(done.has(k))continue
done.add(k)
const r=Math.floor(k/N),c=k%N,o=grid[r][c]
if(spawn.find(s=>s[0]===r&&s[1]===c))continue
if(o.sp===1){
for(let i=0;i<N;i++){cl.add(key(r,i));cl.add(key(i,c))}
grew=true
}else if(o.sp===2){
for(let i=0;i<N;i++)for(let j=0;j<N;j++)if(grid[i][j].t===o.t)cl.add(key(i,j))
grew=true
}
}
}
chain++
let n=0
for(const k of cl){
const r=Math.floor(k/N),c=k%N,o=grid[r][c]
const sp=spawn.find(s=>s[0]===r&&s[1]===c)
if(sp){
o.sp=sp[2]
o.pop=1
const [x,y]=cpos(r,c)
burst(x,y,14,'#ffe08a',cs*5,.7,1)
continue
}
o.rm=1
n++
const [x,y]=cpos(r,c)
cx+=x;cy+=y;cn++
burst(x,y,lite?4:9,COL[o.t],cs*6,.7,0)
burst(x,y,lite?2:4,'#fff',cs*4,.5,1)
}
const gain=n*10*chain+bonusS
scoreV+=gain
timeL=Math.min(99,timeL+bonusT+(chain>=2?Math.min(3,chain-1):0))
if(cn){
pop(cx/cn,cy/cn,'+'+gain,chain>1?'#ffe08a':'#fff',chain>1?34:28)
if(chain>1)pop(cx/cn,cy/cn+cs*.7,'Cascade x'+chain,'#ffb066',22)
}
if(bonusT||chain>=2)pop(bx+cs*N/2,by-cs*.3,'+'+(bonusT+(chain>=2?Math.min(3,chain-1):0))+'s','#9aff9a',22)
shake=Math.min(1,.25+chain*.15+(spawn.length?.2:0))
const nt=Math.min(PEN.length-1,chain-1)
tone(PEN[nt],.2,'triangle',.13)
tone(PEN[nt]*2,.14,'sine',.06,0,ac&&ac.currentTime+.05)
noise(.12,.05,3000)
if(spawn.length)tone(660,.35,'sawtooth',.06,1320)
phT=.22
ph='clear'
return true
}
function doClear(){
for(let c=0;c<N;c++){
const keep=[]
for(let r=N-1;r>=0;r--){
const o=grid[r][c]
if(o&&o.rm===0)keep.push(o)
}
let r=N-1
for(const o of keep){grid[r][c]=o;if(o.py<r-.001||o.py>r+.001){o.g=true;o.vy=0};r--}
const m=r+1
for(let i=r;i>=0;i--){
const o=mk(i,c,rnd())
o.py=i-m-1-(r-i)*.05
o.g=true
grid[i][c]=o
}
}
}
function shuffleBoard(){
const tp=fresh()
for(let r=0;r<N;r++)for(let c=0;c<N;c++){
const o=grid[r][c]
o.t=tp[r][c]
o.sp=0
o.pop=1
}
pop(bx+cs*N/2,by+cs*N/2,'Reshuffle','#fff',34)
tone(220,.4,'sawtooth',.08,880)
}
function afterSettle(){
chain=0
if(timeUp){endGame();return}
const tp=types()
const hasSp=grid.some(row=>row.some(o=>o.sp===2))
if(!hasSp&&!moveFor(tp))shuffleBoard()
ph='idle'
idle=0
hint=null
}
function endGame(){
ph='over'
overT=0
const s=scoreV
newBest=s>best
if(newBest){best=s;try{localStorage.setItem(BK,String(best))}catch{}}
tone(440,.3,'triangle',.12,220)
tone(330,.5,'triangle',.12,165,ac&&ac.currentTime+.25)
const p=api.finish(Math.floor(s/60),Math.round(elapsed))
if(p&&p.then)p.then(d=>{resP=d&&d.pars||0})
else resP=0
}
function update(dt){
time+=dt
shake=Math.max(0,shake-dt*3)
shownScore+=(scoreV-shownScore)*Math.min(1,dt*9)
if(ph!=='ready'&&ph!=='over'){
elapsed+=dt
if(!timeUp){
timeL-=dt
if(timeL<=0){timeL=0;timeUp=true}
else if(timeL<10&&Math.floor(timeL)!==lastTick){lastTick=Math.floor(timeL);tone(880,.06,'square',.05)}
}
}
music()
for(let r=0;r<N;r++)for(let c=0;c<N;c++){
const o=grid[r]&&grid[r][c]
if(!o)continue
if(o.rm>0){
o.rm-=dt*5
o.sc=Math.max(0,o.rm)
o.a=o.sc
if(o.rm<=0)o.rm=0.0001
continue
}
if(o.g){
o.vy+=26*dt
o.py+=o.vy*dt
if(o.py>=r){
o.py=r
o.sq=Math.min(.3,o.vy*.025)
if(o.vy>4)tone(180+r*10,.05,'sine',.05,90)
o.vy=0
o.g=false
}
o.px+=(c-o.px)*Math.min(1,dt*18)
}else{
o.px+=(c-o.px)*Math.min(1,dt*16)
o.py+=(r-o.py)*Math.min(1,dt*16)
if(Math.abs(o.px-c)<.012)o.px=c
if(Math.abs(o.py-r)<.012)o.py=r
}
o.sq*=Math.pow(.0005,dt)
o.pop=Math.max(0,o.pop-dt*3)
}
if(ph==='swap'&&!busy()){
if(!resolve(true)){
swapBack()
ph='back'
tone(200,.12,'sawtooth',.06,120)
}
}else if(ph==='back'&&!busy())ph='idle'
else if(ph==='clear'){
phT-=dt
if(phT<=0){doClear();ph='fall'}
}else if(ph==='fall'&&!busy()){
if(!resolve(false))afterSettle()
}else if(ph==='idle'){
if(timeUp)endGame()
else{
idle+=dt
if(idle>5&&!hint){const m=moveFor(types());if(m)hint=m}
}
}
if(ph==='over')overT+=dt
for(let i=parts.length-1;i>=0;i--){
const p=parts[i]
p.l-=dt
if(p.l<=0){parts.splice(i,1);continue}
p.vy+=(p.k===1?-cs*1.5:cs*14)*dt
p.x+=p.vx*dt
p.y+=p.vy*dt
p.rot+=p.vr*dt
}
for(let i=pops.length-1;i>=0;i--){
const p=pops[i]
p.l-=dt*1.1
p.y-=cs*.8*dt
if(p.l<=0)pops.splice(i,1)
}
const lf=red?.25:1
for(const l of leaves){
l.ph+=dt*2
l.x+=l.vx*dt*lf
l.y+=l.vy*dt*lf
l.rot+=l.vr*dt*lf
if(l.x<-.05){l.x=1.05;l.y=Math.random()*.7}
if(l.y>1.05){l.y=-.05;l.x=Math.random()}
}
}
function rr(x,y,w,h,r){
g.beginPath()
g.moveTo(x+r,y)
g.arcTo(x+w,y,x+w,y+h,r)
g.arcTo(x+w,y+h,x,y+h,r)
g.arcTo(x,y+h,x,y,r)
g.arcTo(x,y,x+w,y,r)
g.closePath()
}
function tx(s,x,y,sz,col,al,w){
g.font=(w||700)+' '+sz+'px Georgia,serif'
g.textAlign=al||'left'
g.textBaseline='alphabetic'
g.fillStyle='rgba(30,10,0,.65)'
g.fillText(s,x+sz*.05,y+sz*.08)
g.fillStyle=col
g.fillText(s,x,y)
}
function drawCell(o,r,c){
if(o.sc<=0)return
const [x,y]=cpos(o.py,o.px)
const hp=hint&&((hint[0]===r&&hint[1]===c)||(hint[2]===r&&hint[3]===c))
const pulse=hp?1+Math.sin(time*9)*.08:1
const s=o.sc*(1+o.pop*.35)*pulse
g.save()
g.translate(x,y+cs*.5*o.sq*.5)
g.scale(s*(1+o.sq*.5),s*(1-o.sq))
g.globalAlpha=o.a
if(o.sp===2){
g.globalCompositeOperation='lighter'
for(let i=0;i<8;i++){
g.save()
g.rotate(time*1.2+i*.785)
g.fillStyle='rgba(255,230,140,.35)'
g.beginPath()
g.moveTo(0,0);g.lineTo(cs*.7,-cs*.07);g.lineTo(cs*.7,cs*.07)
g.fill()
g.restore()
}
g.fillStyle=rg(g,0,0,2,cs*.5,['rgba(255,240,170,.85)','rgba(255,200,80,.25)','rgba(255,200,80,0)'])
g.fillRect(-cs/2,-cs/2,cs,cs)
g.globalCompositeOperation='source-over'
}
const sw=cs*.88
g.drawImage(spr[o.t],-sw/2,-sw/2,sw,sw)
if(o.sp===1){
g.globalCompositeOperation='lighter'
g.strokeStyle='rgba(255,224,120,'+(.6+Math.sin(time*6)*.3)+')'
g.lineWidth=cs*.06
g.beginPath()
g.arc(0,0,cs*.42,0,7)
g.stroke()
g.beginPath()
g.moveTo(-cs*.3,0);g.lineTo(cs*.3,0);g.moveTo(0,-cs*.3);g.lineTo(0,cs*.3)
g.stroke()
g.globalCompositeOperation='source-over'
}
g.restore()
}
function draw(){
g.setTransform(1,0,0,1,0,0)
g.globalAlpha=1
g.drawImage(bgc,0,0)
for(const l of leaves){
g.save()
g.translate(l.x*W,l.y*H)
g.rotate(l.rot)
g.scale(1,.55+Math.abs(Math.sin(l.ph))*.45)
g.globalAlpha=.8
g.fillStyle=l.c
g.beginPath()
g.ellipse(0,0,l.r*cs*.35,l.r*cs*.22,0,0,7)
g.fill()
g.restore()
}
g.globalAlpha=1
g.save()
if(shake>0&&!red)g.translate((Math.random()-.5)*shake*cs*.12,(Math.random()-.5)*shake*cs*.12)
const pad=cs*.2,bw=cs*N
rr(bx-pad,by-pad,bw+pad*2,bw+pad*2,cs*.28)
const wd=g.createLinearGradient(0,by,0,by+bw)
wd.addColorStop(0,'#7a4a24')
wd.addColorStop(1,'#4a2a12')
g.fillStyle=wd
g.fill()
g.strokeStyle='rgba(255,210,140,.35)'
g.lineWidth=cs*.04
g.stroke()
g.fillStyle='rgba(20,8,0,.55)'
rr(bx-cs*.04,by-cs*.04,bw+cs*.08,bw+cs*.08,cs*.2)
g.fill()
for(let r=0;r<N;r++)for(let c=0;c<N;c++){
if((r+c)%2===0){
g.fillStyle='rgba(255,200,120,.07)'
g.fillRect(bx+c*cs,by+r*cs,cs,cs)
}
}
g.save()
g.beginPath()
g.rect(bx-pad,by-pad*.5-cs*.2,bw+pad*2,bw+pad*1.5+cs*.2)
g.clip()
if(ph==='idle'&&sel){
g.fillStyle='rgba(255,224,120,.28)'
rr(bx+sel[1]*cs+cs*.05,by+sel[0]*cs+cs*.05,cs*.9,cs*.9,cs*.18)
g.fill()
g.strokeStyle='#ffe08a'
g.lineWidth=cs*.05
g.stroke()
}
if(ph!=='ready'){
const order=[]
for(let r=0;r<N;r++)for(let c=0;c<N;c++){const o=grid[r][c];if(o)order.push([o,r,c])}
for(const [o,r,c] of order)drawCell(o,r,c)
}
g.restore()
if(ph==='idle'&&!drag){
g.strokeStyle='rgba(255,255,255,.35)'
g.lineWidth=cs*.03
rr(bx+cur[1]*cs+cs*.04,by+cur[0]*cs+cs*.04,cs*.92,cs*.92,cs*.16)
g.stroke()
}
for(const p of parts){
const a=Math.max(0,p.l/p.m)
g.globalAlpha=a
g.fillStyle=p.c
if(p.k===1){
g.globalCompositeOperation='lighter'
g.beginPath()
g.arc(p.x,p.y,p.r*a+DPR,0,7)
g.fill()
g.globalCompositeOperation='source-over'
}else{
g.save()
g.translate(p.x,p.y)
g.rotate(p.rot)
g.fillRect(-p.r,-p.r*.6,p.r*2,p.r*1.2)
g.restore()
}
}
g.globalAlpha=1
g.restore()
for(const p of pops){
g.globalAlpha=Math.min(1,p.l*1.8)
tx(p.s,p.x,p.y,p.sz,p.c,'center')
}
g.globalAlpha=1
hud()
const vg=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.4,W/2,H/2,Math.max(W,H)*.75)
vg.addColorStop(0,'rgba(20,6,0,0)')
vg.addColorStop(1,'rgba(20,6,0,.45)')
g.fillStyle=vg
g.fillRect(0,0,W,H)
overlay()
}
function hud(){
const sz=Math.min(hudH*.34,cs*.7)
tx('Score '+Math.round(shownScore),bx,hudH*.4,sz,'#fff6d6')
tx('Best '+best,bx,hudH*.4+sz*.7,sz*.55,'#ffd98a','left',600)
if(chain>1&&ph!=='idle')tx('x'+chain,bx+cs*N*.5,hudH*.4,sz*1.1,'#ffe08a','center',800)
const by2=hudH*.78,bh=Math.max(8*DPR,hudH*.12),bw=cs*N
g.fillStyle='rgba(30,10,0,.6)'
rr(bx,by2,bw,bh,bh/2)
g.fill()
const k=Math.min(1,timeL/DUR)
const low=timeL<10
g.fillStyle=low?(Math.floor(time*4)%2?'#ff5a3a':'#ffb066'):'#f2b134'
rr(bx,by2,Math.max(bh,bw*k),bh,bh/2)
g.fill()
tx(Math.ceil(timeL)+'s',bx+bw,by2-bh*.3,sz*.6,low?'#ff9a7a':'#fff6d6','right',700)
g.fillStyle='rgba(30,10,0,.5)'
rr(W-cs*.9-10*DPR,H-cs*.8-10*DPR,cs*.8,cs*.7,cs*.15)
g.fill()
g.fillStyle='#fff6d6'
const sx=W-cs*.9-10*DPR+cs*.22,sy=H-cs*.8-10*DPR+cs*.35
g.beginPath()
g.moveTo(sx,sy-cs*.08);g.lineTo(sx+cs*.1,sy-cs*.08);g.lineTo(sx+cs*.22,sy-cs*.2);g.lineTo(sx+cs*.22,sy+cs*.2);g.lineTo(sx+cs*.1,sy+cs*.08);g.lineTo(sx,sy+cs*.08)
g.fill()
if(mute){
g.strokeStyle='#ff9a7a'
g.lineWidth=cs*.04
g.beginPath()
g.moveTo(sx+cs*.28,sy-cs*.12);g.lineTo(sx+cs*.42,sy+cs*.12);g.moveTo(sx+cs*.42,sy-cs*.12);g.lineTo(sx+cs*.28,sy+cs*.12)
g.stroke()
}
}
function overlay(){
if(ph==='ready'){
g.fillStyle='rgba(30,10,0,.6)'
g.fillRect(0,0,W,H)
const s=Math.min(W/700,H/520)
tx('Harvest Match',W/2,H*.38,72*s,'#ffe08a','center',800)
tx('Swap neighbours to match three or more.',W/2,H*.38+60*s,24*s,'#fff6d6','center',600)
tx('Four makes a Cross. Five makes a Harvest Star.',W/2,H*.38+92*s,22*s,'#ffd98a','center',600)
tx('Drag, click or use arrows and Space',W/2,H*.38+124*s,20*s,'#ffd98a','center',600)
g.save()
g.translate(W/2,H*.38+190*s)
const p=1+Math.sin(time*4)*.04
g.scale(p,p)
tx('Click or press Space to start',0,0,32*s,'#fff','center')
g.restore()
}
if(ph==='over'){
const k=Math.min(1,overT*3)
g.fillStyle='rgba(20,6,0,'+k*.6+')'
g.fillRect(0,0,W,H)
const s=Math.min(W/700,H/520)
g.save()
g.translate(W/2,H/2)
g.scale((.85+k*.15)*s,(.85+k*.15)*s)
g.globalAlpha=k
g.fillStyle='rgba(60,28,10,.94)'
rr(-230*DPR,-140*DPR,460*DPR,290*DPR,22*DPR)
g.fill()
g.strokeStyle='#e8a43a'
g.lineWidth=3*DPR
g.stroke()
const d=DPR
tx('Time up',0,-90*d,44*d,'#ffe08a','center',800)
tx(String(scoreV),0,-30*d,64*d,'#fff','center',800)
tx(newBest?'New best':'Best '+best,0,4*d,22*d,newBest?'#9aff9a':'#ffd98a','center',700)
tx(resP<0?'Counting Pars...':resP>0?'+'+resP+' Pars':'Play longer than 15s for Pars',0,48*d,24*d,'#fff6d6','center',700)
if(overT>.7)tx('Space or click to play again',0,110*d,22*d,'#fff','center',700)
g.restore()
}
}
let raf=0,last=0
function frame(ts){
raf=requestAnimationFrame(frame)
const dt=Math.min(.05,(ts-last)/1000||0)
last=ts
update(dt)
draw()
}
grid=fresh().map((row,r)=>row.map((t,c)=>mk(r,c,t)))
raf=requestAnimationFrame(frame)
function cellAt(e){
const r=cv.getBoundingClientRect()
const x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H
return{x,y,c:Math.floor((x-bx)/cs),r:Math.floor((y-by)/cs)}
}
const inb=(r,c)=>r>=0&&r<N&&c>=0&&c<N
function startOrAgain(){
if(ph==='ready')begin()
else if(ph==='over'&&overT>.7)begin()
}
const pd=e=>{
e.preventDefault()
aud()
try{cv.setPointerCapture(e.pointerId)}catch{}
const p=cellAt(e)
if(p.x>W-cs*.9-10*DPR&&p.y>H-cs*.8-10*DPR&&!inb(p.r,p.c)){mute=!mute;return}
if(ph==='ready'||ph==='over'){startOrAgain();return}
if(ph!=='idle'||!inb(p.r,p.c))return
cur=[p.r,p.c]
if(sel&&sel[0]===p.r&&sel[1]===p.c){sel=null;return}
if(sel&&Math.abs(sel[0]-p.r)+Math.abs(sel[1]-p.c)===1){trySwap(sel[0],sel[1],p.r,p.c);drag=null;return}
sel=[p.r,p.c]
drag={x:p.x,y:p.y,r:p.r,c:p.c}
tone(600,.04,'triangle',.06)
}
const pm=e=>{
if(!drag||ph!=='idle')return
const p=cellAt(e)
const dx=p.x-drag.x,dy=p.y-drag.y
if(Math.max(Math.abs(dx),Math.abs(dy))<cs*.35)return
const r=drag.r,c=drag.c
const dr=Math.abs(dy)>Math.abs(dx)?Math.sign(dy):0,dc=dr?0:Math.sign(dx)
drag=null
if(inb(r+dr,c+dc))trySwap(r,c,r+dr,c+dc)
}
const pu=()=>{drag=null}
const kd=e=>{
if(e.key==='m'||e.key==='M'){mute=!mute;return}
if(ph==='ready'||ph==='over'){
if(e.code==='Space'||e.key==='Enter'){e.preventDefault();aud();startOrAgain()}
return
}
if(ph!=='idle')return
const d={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]}[e.key]
if(d){
e.preventDefault()
const nr=cur[0]+d[0],nc=cur[1]+d[1]
if(!inb(nr,nc))return
if(sel){trySwap(cur[0],cur[1],nr,nc);cur=[nr,nc]}
else cur=[nr,nc]
}else if(e.code==='Space'||e.key==='Enter'){
e.preventDefault()
sel=sel?null:[cur[0],cur[1]]
}
}
cv.addEventListener('pointerdown',pd)
cv.addEventListener('pointermove',pm)
cv.addEventListener('pointerup',pu)
cv.addEventListener('pointercancel',pu)
addEventListener('keydown',kd)
return()=>{
cancelAnimationFrame(raf)
ro.disconnect()
removeEventListener('keydown',kd)
cv.removeEventListener('pointerdown',pd)
cv.removeEventListener('pointermove',pm)
cv.removeEventListener('pointerup',pu)
cv.removeEventListener('pointercancel',pu)
if(ac){try{ac.close()}catch{}}
}
}
