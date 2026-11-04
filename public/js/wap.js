export function weAreParley(){
history.replaceState(null,'','/weareparley')
const root=document.createElement('div')
root.className='wap'
const cv=document.createElement('canvas')
root.append(cv)
document.body.append(root)
const ctx=cv.getContext('2d')
let W,H,raf,t0=performance.now(),done=false
const size=()=>{W=cv.width=innerWidth;H=cv.height=innerHeight}
size()
addEventListener('resize',size)
const cubes=Array.from({length:70},()=>({x:Math.random(),y:Math.random(),z:.2+Math.random()*.8,s:4+Math.random()*10}))
const P=document.createElement('canvas')
P.width=64;P.height=24
const pc=P.getContext('2d')
pc.fillStyle='#fff'
pc.font='bold 20px monospace'
pc.textBaseline='top'
pc.fillText('Parley',2,2)
const px=pc.getImageData(0,0,64,24).data
const dots=[]
for(let y=0;y<24;y++)for(let x=0;x<64;x++)if(px[(y*64+x)*4+3]>140)dots.push([x,y])
const fin=()=>{
if(done)return
done=true
cancelAnimationFrame(raf)
try{document.exitFullscreen?.()}catch{}
try{au?.close()}catch{}
removeEventListener('resize',size)
root.remove()
location.replace('/')
}
let au
const noise=()=>{
try{
au=new (window.AudioContext||window.webkitAudioContext)()
const g=au.createGain()
g.gain.value=.12
g.connect(au.destination)
for(const f of[110,117,233]){const o=au.createOscillator();o.type='sawtooth';o.frequency.value=f;o.connect(g);o.start()}
const lfo=au.createOscillator();lfo.frequency.value=7;const lg=au.createGain();lg.gain.value=.08;lfo.connect(lg).connect(g.gain);lfo.start()
}catch{}
}
const start=async()=>{
try{await root.requestFullscreen()}catch{}
noise()
}
root.addEventListener('click',start,{once:true})
start()
const frame=now=>{
const t=(now-t0)/1000
ctx.fillStyle='#000'
ctx.fillRect(0,0,W,H)
const cx=W/2,cy=H/2,sc=Math.max(4,Math.floor(Math.min(W/80,H/40)))
for(const c of cubes){
c.x-=.002+c.z*.012
if(c.x<-.05){c.x=1.05;c.y=Math.random()}
const x=c.x*W,y=c.y*H,s=c.s*c.z
ctx.shadowColor='#7c3aed'
ctx.shadowBlur=14*c.z
ctx.fillStyle='#050505'
ctx.fillRect(x,y,s*2,s*2)
ctx.strokeStyle='rgba(167,139,250,'+(.35+c.z*.5)+')'
ctx.strokeRect(x,y,s*2,s*2)
}
ctx.shadowBlur=0
const ox=cx-32*sc,oy=cy-12*sc-H*.08
const j=t>3?(Math.random()-.5)*Math.min(8,(t-3)*2):0
ctx.fillStyle='#e6edf3'
for(const[x,y]of dots)ctx.fillRect(Math.round(ox+x*sc+j),Math.round(oy+y*sc),sc,sc)
ctx.font='bold '+Math.round(sc*2.4)+'px monospace'
ctx.textAlign='center'
ctx.fillStyle='rgba(248,81,73,'+Math.min(1,t/2)+')'
ctx.fillText('Your not supposed to be here',cx,cy+14*sc)
if(t>9)return fin()
raf=requestAnimationFrame(frame)
}
raf=requestAnimationFrame(frame)
}
