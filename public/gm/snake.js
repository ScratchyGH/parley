import{kit,txt,over,best}from'./kit.js'
export function play(box){
const N=22
let sn,dir,nd,food,t,score,dead,spd
const rs=()=>{sn=[[11,11],[10,11],[9,11]];dir=[1,0];nd=[1,0];t=0;score=0;dead=false;spd=.12;food=[5,5]}
const put=()=>{do{food=[Math.floor(Math.random()*N),Math.floor(Math.random()*N)]}while(sn.some(s=>s[0]===food[0]&&s[1]===food[1]))}
rs()
const turn=(x,y)=>{if(x!==-dir[0]||y!==-dir[1])nd=[x,y]}
const k=kit(box,dt=>{
if(dead)return
const K=k.keys
if(K.arrowup||K.w)turn(0,-1);else if(K.arrowdown||K.s)turn(0,1);else if(K.arrowleft||K.a)turn(-1,0);else if(K.arrowright||K.d)turn(1,0)
t+=dt
if(t<spd)return
t=0
dir=nd
const h=[sn[0][0]+dir[0],sn[0][1]+dir[1]]
if(h[0]<0||h[1]<0||h[0]>=N||h[1]>=N||sn.some(s=>s[0]===h[0]&&s[1]===h[1])){dead=true;best('snake',score);return}
sn.unshift(h)
if(h[0]===food[0]&&h[1]===food[1]){score++;spd=Math.max(.05,spd-.003);put()}else sn.pop()
},(c,k)=>{
c.fillStyle='#0b0b0d';c.fillRect(0,0,k.W,k.H)
const s=Math.floor(Math.min(k.W,k.H-30)/N),ox=Math.floor((k.W-s*N)/2),oy=28
c.fillStyle='#16161a';c.fillRect(ox,oy,s*N,s*N)
c.fillStyle='#ef4444';c.fillRect(ox+food[0]*s+2,oy+food[1]*s+2,s-4,s-4)
sn.forEach((p,i)=>{c.fillStyle=i?'#a9a8a0':'#f6f5ef';c.fillRect(ox+p[0]*s+1,oy+p[1]*s+1,s-2,s-2)})
txt(c,'Score '+score+'   Best '+best('snake'),ox,20,16)
if(dead)over(c,k,score,best('snake'))
})
k.press=c=>{if(dead&&c==='enter')rs()}
k.tap=(x,y)=>{if(dead){rs();return}const cx=k.W/2,cy=k.H/2,dx=x-cx,dy=y-cy;if(Math.abs(dx)>Math.abs(dy))turn(dx>0?1:-1,0);else turn(0,dy>0?1:-1)}
return k.stop
}
