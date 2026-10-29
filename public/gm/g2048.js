import{kit,txt,over,best}from'./kit.js'
const COL={0:'#1c1c20',2:'#4a4944',4:'#5a5850',8:'#7a756b',16:'#8d8579',32:'#a39a86',64:'#b8ae96',128:'#c9bd7c',256:'#d6c45f',512:'#e1c93f',1024:'#ecd01f',2048:'#f6dc00'}
export function play(box){
let g,score,dead,sx=0,sy=0
const add=()=>{const e=[];g.forEach((v,i)=>{if(!v)e.push(i)});if(e.length)g[e[Math.floor(Math.random()*e.length)]]=Math.random()<.9?2:4}
const rs=()=>{g=Array(16).fill(0);score=0;dead=false;add();add()}
rs()
const line=a=>{const v=a.filter(x=>x);for(let i=0;i<v.length-1;i++)if(v[i]===v[i+1]){v[i]*=2;score+=v[i];v.splice(i+1,1)}while(v.length<4)v.push(0);return v}
const mv=d=>{
if(dead)return
let ch=false
for(let i=0;i<4;i++){
const idx=[0,1,2,3].map(j=>d===0?i*4+j:d===1?i*4+3-j:d===2?j*4+i:(3-j)*4+i)
const o=idx.map(x=>g[x]),n=line(o)
n.forEach((v,j)=>{if(g[idx[j]]!==v){ch=true;g[idx[j]]=v}})
}
if(ch){add();best('2048',score)}
if(!g.includes(0)){const ok=[...Array(16).keys()].some(i=>(i%4<3&&g[i]===g[i+1])||(i<12&&g[i]===g[i+4]));if(!ok)dead=true}
}
const k=kit(box,()=>{},(c,k)=>{
c.fillStyle='#0b0b0d';c.fillRect(0,0,k.W,k.H)
const s=Math.floor(Math.min(k.W-20,k.H-60)/4),ox=Math.floor((k.W-s*4)/2),oy=44
txt(c,'Score '+score+'   Best '+best('2048'),ox,28,18)
g.forEach((v,i)=>{const x=ox+(i%4)*s,y=oy+Math.floor(i/4)*s;c.fillStyle=COL[v]||'#f6dc00';c.beginPath();c.roundRect(x+4,y+4,s-8,s-8,10);c.fill();if(v)txt(c,String(v),x+s/2,y+s/2+s*.12,v>999?s*.26:s*.34,v>4?'#fff':'#e8e6df','center')})
if(dead)over(c,k,score,best('2048'))
})
k.press=c=>{if(dead&&c==='enter'){rs();return}const d={arrowleft:0,a:0,arrowright:1,d:1,arrowup:2,w:2,arrowdown:3,s:3}[c];if(d!=null)mv(d)}
k.tap=(x,y)=>{if(dead){rs();return}sx=x;sy=y}
const up=e=>{if(!sx&&!sy)return;const r=k.cv.getBoundingClientRect(),dx=e.clientX-r.left-sx,dy=e.clientY-r.top-sy;sx=sy=0;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;mv(Math.abs(dx)>Math.abs(dy)?(dx<0?0:1):(dy<0?2:3))}
addEventListener('pointerup',up)
return()=>{removeEventListener('pointerup',up);k.stop()}
}
