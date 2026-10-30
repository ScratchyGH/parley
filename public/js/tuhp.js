const TAU=Math.PI*2
const mk=(n,f)=>{const a=[];for(let i=0;i<n;i++)a.push(f(i));return a}
const shell=(n,r)=>mk(n,()=>{const u=Math.random()*2-1,t=Math.random()*TAU,s=Math.sqrt(1-u*u),k=r*(.82+Math.random()*.36);return[k*s*Math.cos(t),k*u,k*s*Math.sin(t)]})
const ring=(n,r0,r1)=>mk(n,()=>{const t=Math.random()*TAU,k=r0+Math.random()*(r1-r0);return[k*Math.cos(t),(Math.random()-.5)*r0*.08,k*Math.sin(t)]})
export function hp3d(box,done){
const cv=document.createElement('canvas')
cv.className='cs-3d'
const W=cv.width=Math.max(480,box.clientWidth>>1),H=cv.height=Math.max(270,box.clientHeight>>1)
box.append(cv)
const g=cv.getContext('2d')
const red=shell(260,1),blue=shell(260,1),pur=shell(340,1),acc=ring(900,1.3,2.2),str=mk(110,()=>{const t=Math.random()*TAU,u=Math.random()*2-1,s=Math.sqrt(1-u*u);return[s*Math.cos(t),u,s*Math.sin(t),Math.random()]})
const F=Math.min(W,H)*1.15,U=Math.min(W,H)*.2
const P=(x,y,z,ry,rx,cz)=>{const c=Math.cos(ry),s=Math.sin(ry),x1=x*c+z*s,z1=-x*s+z*c,c2=Math.cos(rx),s2=Math.sin(rx),y2=y*c2-z1*s2,z2=y*s2+z1*c2,k=F/(F+(z2*U)+cz);return[W/2+x1*U*k,H/2+y2*U*k,k,z2]}
const orb=(pts,cx,cy,cz,r,t,col,core,n)=>{
const c0=P(cx,cy,cz,0,0,0)
const sr=r*U*c0[2]
const gr=g.createRadialGradient(c0[0],c0[1],0,c0[0],c0[1],sr*2.4)
gr.addColorStop(0,col[0]);gr.addColorStop(.35,col[1]);gr.addColorStop(1,col[2])
g.fillStyle=gr;g.beginPath();g.arc(c0[0],c0[1],sr*2.4,0,TAU);g.fill()
g.fillStyle=core;g.beginPath();g.arc(c0[0],c0[1],sr*.82,0,TAU);g.fill()
for(let i=0;i<pts.length;i+=n){const p=pts[i],q=P(cx+p[0]*r,cy+p[1]*r,cz+p[2]*r,t*1.6+i*.0,t*.7,0),a=.35+.5*(q[3]>0?0:1);g.fillStyle=col[3];g.globalAlpha=Math.min(1,a);g.beginPath();g.arc(q[0],q[1],1.1+q[2]*1.6,0,TAU);g.fill()}
g.globalAlpha=1
}
const T0=performance.now()
let raf=0,dead=false,lf=-1
const end=()=>{if(dead)return;dead=true;cancelAnimationFrame(raf);cv.remove();done&&done()}
const frame=now=>{
if(dead)return
const t=(now-T0)/1000
if(t>7.6)return end()
g.setTransform(1,0,0,1,0,0)
g.globalCompositeOperation='source-over'
const fade=t<.6?t/.6:t>7?Math.max(0,(7.6-t)/.6):1
g.globalAlpha=1
g.fillStyle='rgba(2,0,8,'+(.82*fade)+')';g.fillRect(0,0,W,H)
g.globalCompositeOperation='lighter'
g.globalAlpha=fade
const sh=t>2.6&&t<3.1?(Math.random()-.5)*10:0
g.translate(sh,sh*.6)
if(t<3.1){
const k=Math.min(1,t/2.7),e=k*k*(3-2*k),sx=3.1-e*2.85
const ry=t*1.8
const pulse=1+Math.sin(t*14)*.04
orb(red,-sx,-.2*(1-e),0,.9*pulse,ry,['rgba(255,70,60,.95)','rgba(255,40,40,.35)','rgba(255,0,0,0)','#ff6a4a'],'#2a0305',2)
orb(blue,sx,.2*(1-e),0,.9*pulse,-ry,['rgba(70,150,255,.95)','rgba(40,100,255,.35)','rgba(0,40,255,0)','#6ab0ff'],'#030a2a',2)
if(t>1.2){g.strokeStyle='rgba(255,255,255,'+(.15+.35*e)+')';g.lineWidth=1;for(let i=0;i<16;i++){const a=i/16*TAU+t*3,r0=U*(.5+e),r1=r0+U*(.5+Math.random()*1.2)*e;g.beginPath();g.moveTo(W/2+Math.cos(a)*r0,H/2+Math.sin(a)*r0*.7);g.lineTo(W/2+Math.cos(a)*r1,H/2+Math.sin(a)*r1*.7);g.stroke()}}
}else{
const u=t-3.1
const grow=Math.min(1,u/.9),gg=1-Math.pow(1-grow,3)
const fire=u>3.3?(u-3.3)/1.2:0
const cz=-fire*fire*F*.85
const r=(.4+gg*1.35)*(1+Math.sin(u*9)*.03)
const ry=u*1.2,rx=.55+Math.sin(u*.8)*.15
const c0=P(0,0,0,0,0,cz)
const sr=r*U*c0[2]
const halo=g.createRadialGradient(c0[0],c0[1],sr*.6,c0[0],c0[1],sr*3.4)
halo.addColorStop(0,'rgba(190,90,255,.65)');halo.addColorStop(.4,'rgba(130,40,255,.25)');halo.addColorStop(1,'rgba(80,0,200,0)')
g.fillStyle=halo;g.beginPath();g.arc(c0[0],c0[1],sr*3.4,0,TAU);g.fill()
g.save();g.globalCompositeOperation='source-over'
g.fillStyle='#07000f';g.beginPath();g.arc(c0[0],c0[1],sr,0,TAU);g.fill()
g.restore()
g.strokeStyle='rgba(235,190,255,.95)';g.lineWidth=2.5+sr*.04;g.beginPath();g.arc(c0[0],c0[1],sr,0,TAU);g.stroke()
for(const p of acc){const a=Math.atan2(p[2],p[0])+u*(2.4/Math.hypot(p[0],p[2])),d=Math.hypot(p[0],p[2]),q=P(Math.cos(a)*d*r,p[1]*r*6,Math.sin(a)*d*r,0,rx*2+.3,cz);g.fillStyle=d<1.8?'#e6b0ff':'#9a50ff';g.globalAlpha=fade*(.4+.6*Math.min(1,q[2]));g.fillRect(q[0],q[1],1.8+q[2]*2,1.2+q[2]*1.2)}
g.globalAlpha=fade
for(let i=0;i<pur.length;i+=2){const p=pur[i],q=P(p[0]*r*1.04,p[1]*r*1.04,p[2]*r*1.04,ry,rx,cz);if(q[3]<0)continue;g.fillStyle='#d8a0ff';g.globalAlpha=fade*.5;g.fillRect(q[0],q[1],1.4,1.4)}
g.globalAlpha=fade
g.strokeStyle='rgba(200,130,255,.55)';g.lineWidth=1
for(const s of str){const a=s[0]*Math.PI,b=s[1],len=(.6+s[3]*2.6)*(.4+gg),q0=P(s[0]*r*1.2,s[1]*r*1.2,s[2]*r*1.2,ry*.5,rx,cz),q1=P(s[0]*(r*1.2+len),s[1]*(r*1.2+len),s[2]*(r*1.2+len),ry*.5,rx,cz);if(q0[3]<-.2&&q1[3]<-.2)continue;g.beginPath();g.moveTo(q0[0],q0[1]);g.lineTo(q1[0],q1[1]);g.stroke()}
if(u<.16){g.globalAlpha=1-u/.16;g.fillStyle='#fff';g.fillRect(-20,-20,W+40,H+40)}
if(fire>0){g.globalAlpha=Math.min(1,fire*1.4);g.fillStyle='#d8a0ff';g.fillRect(-20,-20,W+40,H+40);const rg=g.createRadialGradient(W/2,H/2,0,W/2,H/2,W*(.1+fire*.9));rg.addColorStop(0,'#fff');rg.addColorStop(1,'rgba(120,0,255,0)');g.fillStyle=rg;g.fillRect(0,0,W,H)}
}
g.setTransform(1,0,0,1,0,0)
g.globalCompositeOperation='source-over'
g.globalAlpha=fade
const vg=g.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.95);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.7)');g.fillStyle=vg;g.fillRect(0,0,W,H)
g.globalAlpha=1
raf=requestAnimationFrame(frame)
}
raf=requestAnimationFrame(frame)
return{stop:end}
}
