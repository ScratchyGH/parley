import{dpr}from'/js/perf.js'
export function kit(box,step,draw){
const cv=document.createElement('canvas')
cv.style.cssText='width:100%;height:100%;display:block;background:#0b0b0d;touch-action:none;outline:0'
cv.tabIndex=0
box.append(cv)
const ctx=cv.getContext('2d')
const k={cv,ctx,W:0,H:0,keys:{},px:0,py:0,paused:false,down:false}
const fit=()=>{const d=dpr();k.W=box.clientWidth||600;k.H=box.clientHeight||400;cv.width=Math.round(k.W*d);cv.height=Math.round(k.H*d);ctx.setTransform(d,0,0,d,0,0)}
fit()
const ro=new ResizeObserver(fit)
ro.observe(box)
const kd=e=>{const c=e.key.toLowerCase();if(c==='escape')e.stopPropagation();if(c==='p'){k.paused=!k.paused;return}k.keys[c]=1;if(c.startsWith('arrow')||c===' ')e.preventDefault();k.press&&k.press(c)}
const ku=e=>{delete k.keys[e.key.toLowerCase()]}
const pm=e=>{const r=cv.getBoundingClientRect();k.px=e.clientX-r.left;k.py=e.clientY-r.top}
const pd=e=>{pm(e);k.down=true;cv.focus();k.tap&&k.tap(k.px,k.py)}
const pu=()=>{k.down=false}
addEventListener('keydown',kd,true)
addEventListener('keyup',ku)
cv.addEventListener('pointermove',pm)
cv.addEventListener('pointerdown',pd)
addEventListener('pointerup',pu)
let raf=0,last=performance.now()
const loop=t=>{
raf=requestAnimationFrame(loop)
const dt=Math.min(.05,(t-last)/1000)
last=t
if(!k.paused)step(dt,k)
draw(ctx,k)
if(k.paused){ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(0,0,k.W,k.H);ctx.fillStyle='#e8e6df';ctx.font='800 36px sans-serif';ctx.textAlign='center';ctx.fillText('PAUSED',k.W/2,k.H/2);ctx.textAlign='left'}
}
raf=requestAnimationFrame(loop)
k.stop=()=>{cancelAnimationFrame(raf);ro.disconnect();removeEventListener('keydown',kd,true);removeEventListener('keyup',ku);removeEventListener('pointerup',pu);cv.remove()}
return k
}
export const txt=(c,s,x,y,sz,col,al)=>{c.font='800 '+sz+'px Figtree,sans-serif';c.fillStyle=col||'#e8e6df';c.textAlign=al||'left';c.fillText(s,x,y);c.textAlign='left'}
export const over=(c,k,score,best)=>{c.fillStyle='rgba(0,0,0,.6)';c.fillRect(0,0,k.W,k.H);txt(c,'Game over',k.W/2,k.H/2-14,40,'#fff','center');txt(c,'Score '+score+(best!=null?'   Best '+best:''),k.W/2,k.H/2+20,20,'#c9c8c1','center');txt(c,'Tap or press Enter to play again',k.W/2,k.H/2+52,16,'#8f8d84','center')}
export const best=(id,v)=>{const key='parley.best.'+id;let b=0;try{b=Number(localStorage.getItem(key))||0}catch{}if(v!=null&&v>b){b=v;try{localStorage.setItem(key,String(b))}catch{}}return b}
