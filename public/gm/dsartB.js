export const K='#0e0720'
export const T=Math.PI*2
export const mk=(w,h,S,Q)=>{Q=Q||1;const c=document.createElement('canvas');c.width=Math.ceil(w*S*Q);c.height=Math.ceil(h*S*Q);const g=c.getContext('2d');g.scale(S*Q,S*Q);g.lineJoin='round';g.lineCap='round';return[c,g]}
export const rg=(g,x,y,r0,r1,st)=>{const q=g.createRadialGradient(x,y,r0,x,y,r1);st.forEach(([o,c])=>q.addColorStop(o,c));return q}
export const lg=(g,x0,y0,x1,y1,st)=>{const q=g.createLinearGradient(x0,y0,x1,y1);st.forEach(([o,c])=>q.addColorStop(o,c));return q}
export const glow=(g,x,y,r,c)=>{g.save();g.globalCompositeOperation='lighter';g.fillStyle=rg(g,x,y,0,r,[[0,c],[1,'rgba(0,0,0,0)']]);g.fillRect(x-r,y-r,r*2,r*2);g.restore()}
export const spr=(w,h,ax,ay,S,fn,Q)=>{const[c,g]=mk(w,h,S,Q||1.5);fn(g);return{c,w,h,ax,ay}}
export const draw=(c,s,x,y,k,flip)=>{k=k||1;c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.drawImage(s.c,-s.ax*k,-s.ay*k,s.w*k,s.h*k);c.restore()}
export const seed=n=>{let s=n;return()=>(s=(s*16807)%2147483647)/2147483647}
export const ell=(g,x,y,rx,ry,r)=>{r=r||0;g.moveTo(x+rx*Math.cos(r),y+rx*Math.sin(r));g.ellipse(x,y,rx,ry,r,0,T)}
export const poly=(g,p)=>{g.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)g.lineTo(p[i],p[i+1]);g.closePath()}
export const sm=(g,p)=>{const n=p.length/2,m=i=>[(p[i*2%p.length]+p[(i+1)*2%p.length])/2,(p[i*2%p.length+1]+p[(i+1)*2%p.length+1])/2],s=m(n-1);g.moveTo(s[0],s[1]);for(let i=0;i<n;i++){const e=m(i);g.quadraticCurveTo(p[i*2],p[i*2+1],e[0],e[1])}g.closePath()}
export const cap=(g,x1,y1,x2,y2,r1,r2)=>{const a=Math.atan2(y2-y1,x2-x1),q=Math.PI/2;g.moveTo(x1+r1*Math.cos(a+q),y1+r1*Math.sin(a+q));g.arc(x1,y1,r1,a+q,a+q*3);g.arc(x2,y2,r2,a-q,a+q);g.closePath()}
export const rib=(g,p,w0,w1)=>{const n=p.length/2,L=[],R=[];for(let i=0;i<n;i++){const a=p[Math.min(n-1,i+1)*2]-p[Math.max(0,i-1)*2],b=p[Math.min(n-1,i+1)*2+1]-p[Math.max(0,i-1)*2+1],d=Math.hypot(a,b)||1,w=(w0+(w1-w0)*i/(n-1))/2;L.push(p[i*2]-b/d*w,p[i*2+1]+a/d*w);R.unshift(p[i*2]+b/d*w,p[i*2+1]-a/d*w)}sm(g,L.concat(R))}
export const star=(g,x,y,r)=>{poly(g,[x,y-r,x+r*.26,y-r*.26,x+r,y,x+r*.26,y+r*.26,x,y+r,x-r*.26,y+r*.26,x-r,y,x-r*.26,y-r*.26])}
export const moon=(g,x,y,r)=>{g.moveTo(x+.2*r,y-r);g.bezierCurveTo(x-1.5*r,y-.9*r,x-1.5*r,y+.9*r,x+.2*r,y+r);g.bezierCurveTo(x-.7*r,y+.6*r,x-.7*r,y-.6*r,x+.2*r,y-r);g.closePath()}
export const ln=(g,p,w,c,a)=>{g.beginPath();g.moveTo(p[0],p[1]);if(p.length===4)g.lineTo(p[2],p[3]);else{for(let i=1;i<p.length/2-1;i++)g.quadraticCurveTo(p[i*2],p[i*2+1],(p[i*2]+p[i*2+2])/2,(p[i*2+1]+p[i*2+3])/2);g.lineTo(p[p.length-2],p[p.length-1])}g.strokeStyle=c||K;g.lineWidth=w||1;if(a!=null)g.globalAlpha=a;g.stroke();g.globalAlpha=1}
export const fx=(g,f,c,dx,dy)=>{g.save();g.translate(dx||0,dy||0);g.beginPath();f(g);g.fillStyle=c;g.fill();g.restore()}
const sc=new Map()
const tmp=g=>{const c=g.canvas,k=c.width+'x'+c.height;let t=sc.get(k);if(!t){const e=document.createElement('canvas');e.width=c.width;e.height=c.height;t=e.getContext('2d');sc.set(k,t)}t.setTransform(1,0,0,1,0,0);t.clearRect(0,0,c.width,c.height);t.setTransform(g.getTransform());t.lineJoin='round';t.lineCap='round';t.globalCompositeOperation='source-over';return t}
export const band=(g,f,dx,dy,paint)=>{const t=tmp(g);paint(t);t.globalCompositeOperation='destination-out';t.save();t.translate(dx,dy);t.beginPath();f(t);t.fillStyle='#000';t.fill();t.restore();g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(t.canvas,0,0);g.restore()}
let jr=12345
const jn=()=>(jr=(jr*16807)%2147483647)/2147483647-.5
export const cel=(g,f,p,o)=>{
o=o||{}
const jj=o.j?()=>jn()*o.j:()=>0
const k=o.k||1,w=(o.w||1.15)*k,t=(o.t==null?1.7:o.t)*k,a=(o.a||2.4)*k,b=(o.b||5.2)*k,lx=o.lx==null?-.6:o.lx,ly=o.ly==null?-.8:o.ly
g.save()
g.translate(-lx*t+jj(),-ly*t+jj());g.beginPath();f(g);g.lineWidth=w*2;g.strokeStyle=K;g.fillStyle=K;g.stroke();g.fill()
g.restore()
g.save()
g.save();g.translate(jj(),jj());g.beginPath();f(g);g.lineWidth=w*2;g.strokeStyle=K;g.stroke();g.restore();g.beginPath();f(g);g.fillStyle=p[0];g.fill();g.clip()
if(p[1])fx(g,f,p[1],lx*a+jj(),ly*a+jj())
if(p[2])fx(g,f,p[2],lx*b+jj(),ly*b+jj())
if(o.h)band(g,f,lx*a,ly*a,t=>{t.strokeStyle=o.hc||'rgba(14,7,32,.42)';t.fillStyle=t.strokeStyle;const sp=(o.hs||1.9)*k;if(o.h===2){for(let y=-20;y<340;y+=sp)for(let x=-20+((Math.round(y/sp))%2?sp/2:0);x<340;x+=sp){t.beginPath();t.arc(x,y,sp*.2,0,T);t.fill()}}else{t.lineWidth=.55*k;t.beginPath();for(let i=-340;i<340;i+=sp*(o.j?.6+jn()+.5:1)){t.moveTo(i,340);t.lineTo(i+340+(o.j?jn()*40:0),0)}t.stroke()}})
if(o.r)band(g,f,lx*2.8*k,ly*2.8*k,t=>{t.save();t.translate(lx*k,ly*k);t.beginPath();f(t);t.fillStyle=o.r;t.fill();t.restore()})
if(o.s)for(const[x,y,rx,ry,r]of o.s){g.beginPath();ell(g,x,y,rx,ry,r||0);g.fillStyle=o.sc||'#fff';g.fill()}
g.restore()
}
const SK=['#b95a4a','#ec9c70','#ffd4aa'],HR=['#32121e','#74332a','#c9693a'],PJ=['#25156a','#4631c2','#8a76ff'],PJf=['#1a0f50','#35249a','#6252d6'],PT=['#0a3a52','#146f86','#3bc3ca'],PTf=['#062a3d','#0f5367','#27909a'],SL=['#7d72b8','#d8d2f6','#ffffff'],SLf=['#5d548f','#a8a2d0','#e0dcf5'],SC=['#8c0f55','#e3248d','#ff80c4'],GD=['#b86a0a','#ffb21f','#fff07a']
const CY='rgba(90,235,255,.8)'
const leg=(g,hx,hy,fx,fy,bd,pal,sp)=>{
const kx=(hx+fx)/2+bd,ky=(hy+fy)/2-1
cel(g,g=>{cap(g,hx,hy,kx,ky,4.7,4.2);cap(g,kx,ky,fx,fy-2.6,4.2,3.7)},pal,{k:.8,h:1,hs:1.6})
cel(g,g=>sm(g,[fx-6.4,fy-3.8,fx,fy-5.6,fx+5.6,fy-4.2,fx+8.4,fy-.6,fx+6.6,fy+2.5,fx-5.6,fy+2.7,fx-7.4,fy-.4]),sp,{k:.8,r:CY})
ln(g,[fx-6,fy+1.5,fx,fy+3.3,fx+6.4,fy+1.7],1.4,'#e3248d')
}
const arm=(g,sx,sy,th,pal)=>{
const hx=sx+Math.sin(th)*11.5,hy=sy+Math.cos(th)*10.5-(th>0?th*2.6:0)
cel(g,g=>cap(g,sx,sy,hx,hy-1.2,4,3.3),pal,{k:.75,h:1,hs:1.5})
ln(g,[hx-3,hy-2.6,hx+3,hy-2.2],1.3,'#e3248d')
cel(g,g=>{ell(g,hx,hy+1.2,3.5,3.7);ell(g,hx+2.4,hy-.2,1.6,2)},SK,{k:.6,t:1.2})
}
const torso=(g,f)=>{
cel(g,g=>{g.moveTo(17.6,42);g.quadraticCurveTo(28,36.2,39.4,42);g.lineTo(41,58.5);g.quadraticCurveTo(28.5,64.5,16,58.5);g.closePath()},PJ,{h:1,r:CY})
ln(g,[16.8,58,28.5,62.6,40.4,58],1.6,'#e3248d')
ln(g,[22,55,28,58.6,35,55],1,K,.75)
g.fillStyle=GD[1]
for(const[x,y,r]of[[22,48,2],[34.5,51.5,1.6],[27,45,1.1]]){g.beginPath();star(g,x,y,r);g.fill()}
}
const scarf=(g,f,sw)=>{
const ty=[47,44,46,43][f]
cel(g,g=>rib(g,[24,41.5,18,43+sw,12,ty,6,ty-2+sw*2,1.5,ty+1],5,1.4),SC,{k:.6,h:1,hs:1.4})
cel(g,g=>ell(g,29.5,41.5,12,4.6,.03),SC,{k:.8,r:CY})
}
const pend=(g)=>{glow(g,29,50.5,7,'rgba(255,200,80,.7)');cel(g,g=>moon(g,29.5,50.5,3),GD,{k:.45,t:.8,w:.8})}
const nose=(g,x,y)=>ln(g,[x,y,x+1.4,y+.9],.8,K)
const eye=(g,x,y,s,d,ip)=>{
g.beginPath();ell(g,x,y,3.7*s,4.6*s);g.fillStyle='#fdfcff';g.fill()
cel(g,g=>ell(g,x+d*.8,y+.5*s,2.6*s,3.5*s),(ip||['#150c3d','#2b2aa6','#40b8f4']),{k:.5*s,t:0,w:.1,lx:0,ly:.95,a:1.2,b:2.4})
g.beginPath();ell(g,x+d*.8,y+.5*s,1.2*s,1.7*s);g.fillStyle='#07031a';g.fill()
g.fillStyle='#fff';g.beginPath();ell(g,x-.5*s+d*.8,y-1.5*s,1.15*s,1.25*s);g.fill();g.beginPath();ell(g,x+1.4*s+d*.8,y+2.3*s,.6*s,.6*s);g.fill()
ln(g,[x-4*s,y-1.2*s,x-2*s,y-4.3*s,x+1.6*s,y-5.1*s,x+4.2*s,y-3.2*s],1.5*s)
ln(g,[x-4*s,y-1.2*s,x-5.4*s,y-2.8*s],1.2*s)
}
const headSkin=(g,cx,cy,f)=>{
const dy=[1.4,-1.2,1.4,-1.2][f],bx=[-2.6,-.8,-2.6,-.8][f]
cel(g,g=>sm(g,[cx-12,cy-2,cx-18+bx,cy+5,cx-22+bx*1.6,cy+12+dy*.5,cx-12,cy+9.5,cx-6,cy+5]),HR,{k:.8})
cel(g,g=>ell(g,cx-13.8,cy+3,2.8,3.8),SK,{k:.5})
cel(g,g=>sm(g,[cx-15.5,cy+1,cx-14,cy-9,cx-2,cy-14.5,cx+12,cy-11.5,cx+16.5,cy-.5,cx+15,cy+8.5,cx+6,cy+15,cx-4,cy+15,cx-12.5,cy+10.5]),SK,{k:.9,r:CY,s:[[cx-7,cy+9,2.4,1,-.4]],sc:'rgba(255,255,255,.5)'})
g.fillStyle='rgba(255,70,140,.55)';g.beginPath();ell(g,cx-4.5,cy+8,3.2,1.9);g.fill()
eye(g,cx+1,cy+2.2,1.12,0);eye(g,cx+11.6,cy+2.4,.86,.5)
nose(g,cx+7.6,cy+7)
g.beginPath();g.moveTo(cx+3.6,cy+10);g.quadraticCurveTo(cx+7.4,cy+14,cx+11,cy+9.8);g.quadraticCurveTo(cx+7.4,cy+10.8,cx+3.6,cy+10);g.fillStyle='#8a1738';g.fill();g.strokeStyle=K;g.lineWidth=1;g.stroke()
cel(g,g=>poly(g,[cx-17+bx*.3,cy-3,cx-18,cy-13,cx-8,cy-19,cx+5,cy-20.5,cx+16.5,cy-14,cx+17.5,cy-6,cx+13.5,cy-5,cx+10.5,cy-9,cx+7,cy-5,cx+3,cy-9,cx-1,cy-5+dy,cx-4.5,cy-8.5,cx-8.5,cy-4.5+dy*.6,cx-12,cy-8]),HR,{k:.9,h:1,hs:1.7,s:[[cx-4,cy-15,5,1.3,-.25],[cx+9,cy-13.2,2.4,1,.3]],sc:'rgba(255,225,170,.85)'})
cel(g,g=>rib(g,[cx-1,cy-17.5,cx+1,cy-22,cx+4+dy*.8,cy-25.5,cx+8.5+dy,cy-26.5],5,1.2),HR,{k:.6})
}
const headPumpkin=(g,cx,cy,f)=>{
const dy=[.6,-.5,.6,-.5][f]
cel(g,g=>rib(g,[cx-1,cy-11,cx,cy-16,cx+2,cy-20.5+dy],6,4.2),['#0b4a44','#1b9a68','#86e8a0'],{k:.7})
cel(g,g=>rib(g,[cx+2,cy-17,cx+8,cy-19+dy,cx+13,cy-17.5],4.4,.6),['#0b4a44','#1b9a68','#86e8a0'],{k:.5,t:.8})
ln(g,[cx+3,cy-20,cx+9,cy-24+dy,cx+13,cy-22,cx+10.5,cy-20.5],1.1,'#4de0a0')
cel(g,g=>{ell(g,cx-10.5,cy+1.2,8.6,13.4);ell(g,cx+10.8,cy+1.2,8.6,13.4);ell(g,cx,cy+.4,10.8,14.6)},['#8a1a0e','#f2640f','#ffb630'],{k:1,h:1,hs:1.8,r:CY,s:[[cx-7,cy-8,3.2,1.5,-.9]],sc:'rgba(255,245,200,.8)'})
for(const[x,s]of[[-5.4,-1],[5.4,1]])ln(g,[cx+x,cy-13.4,cx+x+s*2.4,cy-4,cx+x+s*2.2,cy+5,cx+x,cy+13.6],1.1,'#6a1204',.85)
glow(g,cx+6,cy+3,15,'rgba(255,190,50,.5)')
const cv=(f)=>{g.beginPath();f(g);g.fillStyle=rg(g,cx+4,cy+3,0,16,[[0,'#fffbd0'],[.5,'#ffd23a'],[1,'#ff8a1a']]);g.fill();g.lineWidth=1.3;g.strokeStyle=K;g.stroke()}
cv(g=>poly(g,[cx-3.4,cy-.6,cx+1.6,cy-7.4,cx+6.2,cy-.6]))
cv(g=>poly(g,[cx+8.4,cy-.6,cx+11.6,cy-6,cx+14.8,cy-.6]))
cv(g=>poly(g,[cx+6.6,cy+1.6,cx+8.2,cy+4,cx+5.6,cy+4]))
cv(g=>poly(g,[cx-5,cy+5.4,cx+1,cy+6.4,cx+8,cy+6.8,cx+15,cy+5.6,cx+13.5,cy+11,cx+11,cy+9.2,cx+8.6,cy+12,cx+5.4,cy+9.4,cx+2.4,cy+12,cx-.4,cy+9.4,cx-3.2,cy+10.6]))
glow(g,cx+6,cy+3,14,'rgba(255,190,50,.28)')
}
const headCloud=(g,cx,cy,f)=>{
const sw=[1,-1,1,-1][f]
cel(g,g=>{ell(g,cx-21,cy+11+sw,2.8,2.6);ell(g,cx-17,cy+13-sw,2,1.9)},['#7580d6','#c4cdfc','#f8faff'],{k:.5,t:.8})
cel(g,g=>{ell(g,cx-10,cy+4,9.6,8.2);ell(g,cx-4,cy-5.5,11.6,10.6);ell(g,cx+7.5,cy-4.5,11,10.4);ell(g,cx+12.4,cy+4.4,9,8.4);ell(g,cx+1,cy+7.4,11.6,9)},['#5f6bc9','#b3bff9','#f6f8ff'],{k:1.1,h:2,hs:2,r:CY,s:[[cx-8,cy-11,3.6,1.5,-.6],[cx+10,cy-10.4,2,.9,.2]],sc:'#fff'})
g.fillStyle='rgba(255,110,170,.55)';g.beginPath();ell(g,cx-.5,cy+8,3.4,2);ell(g,cx+15,cy+7.4,2.6,1.7);g.fill()
for(const[x,s,d]of[[cx+5,1,0],[cx+13.5,.8,.5]]){g.beginPath();ell(g,x,cy+2.4,2.5*s,3.4*s);g.fillStyle='#1d1650';g.fill();g.fillStyle='#fff';g.beginPath();ell(g,x-.6*s+d,cy+1*s,1*s,1.1*s);g.fill();g.beginPath();ell(g,x+.9*s+d,cy+3.8*s,.5*s,.5*s);g.fill()}
g.beginPath();g.moveTo(cx+6.5,cy+9);g.quadraticCurveTo(cx+9.5,cy+12.4,cx+12.5,cy+9);g.strokeStyle='#1d1650';g.lineWidth=1.3;g.stroke()
g.fillStyle='#ffd23a';g.beginPath();star(g,cx-9,cy-15+sw*.5,2.6);g.fill();g.fillStyle='#ff80c4';g.beginPath();star(g,cx+19,cy-11,1.6);g.fill()
}
const body=(g,f,hd)=>{
const bob=[1.3,-1,1.3,-1][f],sw=[0,-1,0,1][f]
const NL=[[37,75.2,2.4],[29.5,75.2,2],[20.5,72.6,1],[31,69,4.2]][f],FL=[[21,72.6,1],[31.5,69,4.2],[37,75.2,2.4],[30,75.2,2]][f]
const th=[-.55,-.05,.55,.05][f]
leg(g,32,60+bob*.5,FL[0],FL[1],FL[2],PTf,SLf)
leg(g,25,60+bob*.5,NL[0],NL[1],NL[2],PT,SL)
g.save();g.translate(0,bob)
arm(g,38.8,43.5,-th*.9+.1,PJf)
cel(g,g=>g.roundRect(18.5,55.5,20,9,4),PT,{k:.7,t:.8})
cel(g,g=>ell(g,20,39.5,10,6.5),['#150c58','#2c1d94','#5a48c8'],{k:.8})
torso(g,f)
arm(g,18.2,43.5,th,PJ)
scarf(g,f,sw)
pend(g)
;(hd==='skin'?headSkin:hd==='pumpkin'?headPumpkin:headCloud)(g,29.5,25,f)
g.restore()
}
const MH=['#2c1220','#68304a','#b8607a']
const mom=(g)=>{
for(const x of[37,63])cel(g,g=>sm(g,[x-9,98,x-2,95,x+9,98,x+11,104.6,x,106.4,x-10,104.6]),['#a02060','#ec6fb0','#ffc4e4'],{k:.9,r:CY})
cel(g,g=>{g.moveTo(31,46);g.quadraticCurveTo(50,40,69,46);g.quadraticCurveTo(80,76,88,102);g.quadraticCurveTo(50,110,12,102);g.quadraticCurveTo(20,76,31,46);g.closePath()},['#3a0a28','#8e1f55','#e24c8a'],{h:1,hs:2,r:CY,k:1.2})
cel(g,g=>{g.moveTo(37,50);g.quadraticCurveTo(50,45,63,50);g.lineTo(69,100);g.quadraticCurveTo(50,105,31,100);g.closePath()},['#3c2a86','#7c5ed8','#d3c2ff'],{k:1.1,h:1,hs:2})
ln(g,[50,52,50,102],1.2,K,.55)
g.fillStyle='#ffc21a'
for(const[x,y,r]of[[40,66,2.2],[60,76,2.6],[43,88,1.8],[58,92,1.6],[38,78,1.3]]){g.beginPath();star(g,x,y,r);g.fill()}
cel(g,g=>g.roundRect(54,82,10,9,2),['#2a1c66','#5a42b8','#9f86ee'],{k:.6,t:1})
for(const s of[-1,1]){const sx=50+s*21,hx=50+s*5.5
cel(g,g=>{cap(g,sx,52,50+s*14,70,7.4,6);cap(g,50+s*14,70,hx,79,6,5)},['#3a0a28','#8e1f55','#e24c8a'],{k:1,h:1,hs:1.8,r:CY})
cel(g,g=>ell(g,50+s*9.5,76.5,6.4,3.2,s*-.8),['#c9b8ee','#f1e8ff','#ffffff'],{k:.6})
}
cel(g,g=>{ell(g,46.6,82,5.6,5);ell(g,53.4,82,5.6,5)},['#b95a4a','#ec9c70','#ffd4aa'],{k:.8})
ln(g,[46,80,50,84,54,80],1,K,.7)
glow(g,50,60,9,'rgba(255,200,80,.6)')
cel(g,g=>ell(g,50,59,3.4,3.9),['#b86a0a','#ffb21f','#fff07a'],{k:.5,t:.8,w:.9})
cel(g,g=>rib(g,[44,44,50,46.6,56,44],5,5),['#b95a4a','#ec9c70','#ffd4aa'],{k:.7})
cel(g,g=>sm(g,[28,30,25,12,36,3,50,2,64,3,75,12,72,30,66,34,34,34]),MH,{k:1.1,h:1,hs:1.8})
cel(g,g=>ell(g,50,5.5,10,8.2),MH,{k:1,h:2,hs:1.8,s:[[46,2.6,3.6,1.3,-.5]],sc:'rgba(255,230,230,.8)'})
ln(g,[44,5,50,1.2,56,5],1,'#e24c8a',1)
cel(g,g=>sm(g,[35,24,34,34,38,43,50,48,62,43,66,34,65,24,58,14,50,12,42,14]),['#b95a4a','#ec9c70','#ffd4aa'],{k:1.1,r:CY,s:[[41,22,3,1.3,-.6]],sc:'rgba(255,255,255,.45)'})
g.fillStyle='rgba(255,70,140,.5)';g.beginPath();ell(g,41,38.5,4.2,2.4);ell(g,59,38.5,4.2,2.4);g.fill()
for(const[x,d]of[[43.4,0],[56.6,0]])eye(g,x,33,.88,d,['#2a1208','#7a3a18','#e0902a'])
cel(g,g=>sm(g,[34,26,36,15,50,12,64,15,66,26,60,26,54,21,50,25,46,21,40,26]),MH,{k:1,h:1,hs:1.8,s:[[42,17,6,1.2,-.2]],sc:'rgba(255,230,230,.8)'})
ln(g,[49,37,50,38.4,51,37],.9,K)
g.beginPath();g.moveTo(44,41);g.quadraticCurveTo(50,47,56,41);g.quadraticCurveTo(50,42.4,44,41);g.fillStyle='#8a1738';g.fill();g.strokeStyle=K;g.lineWidth=1.1;g.stroke()
g.fillStyle='#ffd23a';g.beginPath();star(g,70,6,2.4);g.fill()
}
const cocoaHead=(g,cx,cy,f)=>{
const dy=[.6,-.4,.6,-.4][f],CH=['#240a06','#5e2a14','#b0602e']
for(const s of[-1,1])cel(g,g=>sm(g,[cx+s*20,cy-8,cx+s*27,cy-14+dy*2,cx+s*29,cy-5,cx+s*25,cy+3+dy,cx+s*19,cy+2]),['#6e78c4','#cdd4ff','#ffffff'],{k:.7,h:2,hs:1.8})
cel(g,g=>g.roundRect(cx-21,cy-19,42,38,9),CH,{k:1.1,h:1,hs:1.8,r:CY})
for(const[x,y]of[[-17,-15],[-1,-15],[-17,-1],[-1,-1]])cel(g,g=>g.roundRect(cx+x,cy+y,15,13.4,3),CH,{k:.55,t:.9,w:.8,lx:-.5,ly:-.7,a:1.3,b:2.6})
g.fillStyle='rgba(255,210,150,.9)';g.beginPath();ell(g,cx-13,cy-12,4,1.1,-.2);ell(g,cx+3,cy-12,2.6,1,-.2);g.fill()
cel(g,g=>{sm(g,[cx-20,cy-19,cx-15,cy-23,cx-10,cy-19,cx-6,cy-24,cx-3,cy-18]);ell(g,cx-6,cy-18,3,5)},['#a85a00','#ffa30f','#ffe27a'],{k:.5,t:.8,w:.9})
cel(g,g=>rib(g,[cx-22,cy-3,cx-26,cy+4,cx-22,cy+11],3,2),['#a85a00','#ffa30f','#ffe27a'],{k:.5,t:.6})
ln(g,[cx-21,cy-8,cx+21,cy-8],3.4,'#1a0a14',1)
cel(g,g=>{ell(g,cx-9,cy-3,10.5,10.5);ell(g,cx+10.5,cy-3,10.5,10.5)},['#12202f','#2a4a63','#5a8aa8'],{k:.9,t:1.5})
for(const x of[cx-9,cx+10.5]){g.beginPath();ell(g,x,cy-3,8.2,8.2);g.fillStyle=rg(g,x-1,cy-4,0,9,[[0,'#f0ffff'],[.55,'#7ae8ff'],[1,'#0aa0d8']]);g.fill();g.strokeStyle=K;g.lineWidth=1;g.stroke()
g.beginPath();ell(g,x+1.4,cy-2,3.3,3.5);g.fillStyle='#0a1a2a';g.fill();g.fillStyle='#fff';g.beginPath();ell(g,x-.3,cy-3.4,1.2,1.3);g.fill()
g.beginPath();ell(g,x-4,cy-6,2.6,1,-.7);g.fillStyle='rgba(255,255,255,.9)';g.fill()}
glow(g,cx,cy-3,28,'rgba(90,230,255,.3)')
cel(g,g=>sm(g,[cx-12,cy+7,cx-3,cy+5.4,cx,cy+8,cx+3,cy+5.4,cx+12,cy+7,cx+10,cy+10.6,cx,cy+9.4,cx-10,cy+10.6]),['#c9b08e','#fff0d6','#ffffff'],{k:.6,t:.8})
g.beginPath();g.moveTo(cx-6,cy+13.4);g.quadraticCurveTo(cx,cy+17.6,cx+6,cy+13.4);g.quadraticCurveTo(cx,cy+14.6,cx-6,cy+13.4);g.fillStyle='#fff6e6';g.fill();g.strokeStyle=K;g.lineWidth=1;g.stroke()
}
const cocoa=(g,f)=>{
const bob=[1.2,-1,1.2,-1][f],NL=[[26,100,5],[33,101.5,0],[44,100,-5],[37,101.5,0]][f],FL=[[44,100,-5],[37,101.5,0],[26,100,5],[33,101.5,0]][f],th=[-.5,-.05,.5,.05][f]
const lg_=(x,hy,fx,fy,pal)=>{cel(g,g=>{cap(g,x,hy,(x+fx)/2,(hy+fy)/2-4,5.4,5);cap(g,(x+fx)/2,(hy+fy)/2-4,fx,fy-4,5,4.6)},pal,{k:.9,h:1,hs:1.7});cel(g,g=>sm(g,[fx-9,fy-8,fx-1,fy-10,fx+8,fy-7,fx+11,fy-1,fx+9,fy+4,fx-8,fy+4.6,fx-10,fy-2]),['#1a0a06','#4a2412','#9a5a30'],{k:.8,r:CY});ln(g,[fx-8,fy+2,fx+9,fy+2.4],1.2,'#ffa30f')}
lg_(36,78+bob*.5,FL[0]+4,FL[1],['#0e1230','#232a66','#4a58b0'])
lg_(30,78+bob*.5,NL[0]+4,NL[1],['#141a42','#303a8a','#6676d0'])
g.save();g.translate(0,bob)
const arm=(sx,t,far)=>{const hx=sx+Math.sin(t)*13,hy=57+Math.cos(t)*14-(t>0?t*3:0);cel(g,g=>cap(g,sx,52,hx,hy-2,5.6,4.6),far?['#6b73b8','#b5bdf2','#e6ebff']:['#8a94d6','#dde3ff','#ffffff'],{k:.85,h:1,hs:1.8,r:CY});cel(g,g=>ell(g,hx,hy+1.4,4.8,5),['#a85a00','#ffc21a','#fff27a'],{k:.7,t:1.2})}
arm(53,-th*.9,1)
cel(g,g=>{g.moveTo(15,47);g.quadraticCurveTo(35,42,55,47);g.lineTo(58+(f%2?1:-1),90);g.quadraticCurveTo(46,94,35,91.4);g.quadraticCurveTo(24,94,12,90);g.closePath()},['#7983c6','#d5dcff','#ffffff'],{h:1,hs:2,r:CY,k:1.3})
ln(g,[35,50,35,91.4],1.3,K,.5)
cel(g,g=>poly(g,[27,45,35,58,29,64,21,52]),['#7983c6','#d5dcff','#ffffff'],{k:.6,t:.8})
cel(g,g=>poly(g,[43,45,35,58,41,64,49,52]),['#7983c6','#d5dcff','#ffffff'],{k:.6,t:.8})
cel(g,g=>ell(g,35,72,2.2,2.2),['#8c0f55','#e3248d','#ff80c4'],{k:.5,t:.6,w:.8})
cel(g,g=>g.roundRect(40,70,10,9,2),['#7983c6','#d5dcff','#ffffff'],{k:.55,t:.8})
for(const[x,c]of[[42.5,'#ff3a8a'],[45.5,'#38d8ff'],[48,'#ffc21a']]){g.fillStyle=c;g.fillRect(x-.8,66.4,1.6,5);g.strokeStyle=K;g.lineWidth=.4;g.strokeRect(x-.8,66.4,1.6,5)}
g.fillStyle='#38d8ff';g.beginPath();star(g,24,80,2);g.fill()
arm(17,th,0)
cocoaHead(g,35,25,f)
g.restore()
}
const WL=['#5a63b8','#b9c4ff','#fbfcff']
const sheep=(g)=>{
for(const[x,d]of[[28,0],[36,1],[58,0],[66,1]])cel(g,g=>{g.roundRect(x-3.4,50,7,13,2.5)},d?['#0e0824','#2a1d5a','#5a4ca8']:['#1b1038','#3a2a6a','#6a58b0'],{k:.7,t:1})
for(const x of[28,36,58,66]){g.fillStyle='#ffc21a';g.fillRect(x-3,60.4,6,2)}
cel(g,g=>sm(g,[78,36,76,26,88,22,92,28,84,36]),['#1b1038','#3a2a6a','#6a58b0'],{k:.8})
cel(g,g=>{ell(g,22,38,15.4,13.4);ell(g,36,26,17.4,15.4);ell(g,54,28,17.4,15.4);ell(g,30,48,15.4,12.4);ell(g,50,48,15.4,12.4);ell(g,66,40,11.4,11)},WL,{k:1.3,h:2,hs:2.1,r:CY,s:[[30,17,6,2,-.5],[50,19,5,2,-.4],[16,32,3,1.4,-.9]]})
for(const[x,y,r]of[[20,40,8],[34,30,9],[48,44,9],[60,32,7]])ln(g,[x-r*.6,y+r*.4,x,y+r*.9,x+r*.7,y+r*.3],.9,'#5a63b8',.8)
cel(g,g=>sm(g,[66,40,67,30,77,26,87,30,90,40,86,50,76,53,68,50]),['#1b1038','#3a2a6a','#7a68c8'],{k:.9,r:CY,s:[[74,31,3,1.2,-.3]],sc:'rgba(255,255,255,.55)'})
cel(g,g=>{ell(g,70,26,8,6);ell(g,76,22,6.5,5.4)},WL,{k:.8,h:2,hs:2})
cel(g,g=>sm(g,[84,26,92,20,98,24,94,31,88,31]),['#1b1038','#3a2a6a','#6a58b0'],{k:.6})
g.beginPath();ell(g,79,38,3.6,4.2);g.fillStyle='#fff';g.fill();g.beginPath();ell(g,80,38.6,2.2,2.7);g.fillStyle='#120a30';g.fill();g.fillStyle='#fff';g.beginPath();ell(g,79.4,37.4,.9,.9);g.fill()
g.beginPath();ell(g,87,41,2.5,1.9);g.fillStyle='#ff80c4';g.fill();g.strokeStyle=K;g.lineWidth=.8;g.stroke()
ln(g,[80,46,84,48,87,45.6],.9,'#ff80c4')
g.fillStyle='rgba(255,90,170,.55)';g.beginPath();ell(g,73,44,3,1.8);g.fill()
glow(g,64,52,8,'rgba(255,200,80,.6)')
cel(g,g=>ell(g,64,52,3,3.4),['#b86a0a','#ffb21f','#fff07a'],{k:.5,t:.7,w:.8})
g.fillStyle='#ffd23a';g.beginPath();star(g,20,12,2.6);g.fill()
}
const bench=(g)=>{
const W1=['#3e170c','#9a4a1e','#f0a050'],MT=['#0c2a3a','#1c6a82','#58c8d8']
for(const x of[8,62])cel(g,g=>{g.roundRect(x,16,4,22,1.5);g.roundRect(x-1.5,34,7,4.4,1.5)},MT,{k:.6,t:1})
for(const x of[9,65])cel(g,g=>{g.moveTo(x,17);g.quadraticCurveTo(x+9,13,x+8,24)},MT,{k:.4,t:.6,w:.8})
for(const y of[3,11])cel(g,g=>g.roundRect(4,y,72,7,2.4),W1,{k:.9,h:1,hs:1.6,r:'rgba(255,200,120,.8)'})
cel(g,g=>{g.moveTo(2,21);g.lineTo(78,21);g.lineTo(76,26.4);g.lineTo(4,26.4);g.closePath()},['#5a2410','#d07030','#ffc070'],{k:.9,h:1,hs:1.6})
cel(g,g=>g.roundRect(3,26,74,6,2),W1,{k:.8,h:1,hs:1.6})
for(const y of[7,15])for(const x of[10,70]){g.fillStyle=K;g.beginPath();ell(g,x,y-4+ (y>10?0:0)+ (y===7?0:-0),1,1);}
g.fillStyle='#ffd8a0'
for(const[x,y]of[[8,6.4],[72,6.4],[8,14.4],[72,14.4]]){g.beginPath();ell(g,x,y,.9,.9);g.fill()}
for(const[x,y,w]of[[16,6.4,14],[44,6.4,10],[26,14.4,12],[52,14.4,14],[14,23.4,16],[44,23.4,12]])ln(g,[x,y,x+w*.5,y+.5,x+w,y],.6,'#4a1c0a',.55)
}
const labB=(g)=>{
const ST=['#1c2358','#3d4fa0','#8fa4f0']
cel(g,g=>g.roundRect(14,62,162,98,9),ST,{k:1.3,h:1,hs:2.2,r:CY})
for(const x of[24,150])cel(g,g=>g.roundRect(x,84,22,64,3),['#141a44','#2a3578','#5a6cc8'],{k:.7,t:1.1})
for(let y=70;y<150;y+=14)ln(g,[16,y,174,y],.6,'#0e0720',.35)
for(const x of[20,170])for(const y of[68,150]){g.fillStyle='#cfd8ff';g.beginPath();ell(g,x,y,1.3,1.3);g.fill()}
for(const x of[35,161]){cel(g,g=>g.roundRect(x-14,90,28,26,4),['#06141c','#0e4a52','#2ec4b6'],{k:.7,t:1.1});glow(g,x,103,24,'rgba(60,255,210,.45)');ln(g,[x-10,94,x-4,94],1.4,'rgba(255,255,255,.7)')
ln(g,[x,90,x,116],.8,K);ln(g,[x-14,103,x+14,103],.8,K)}
cel(g,g=>{g.moveTo(26,66);g.bezierCurveTo(26,16,164,16,164,66);g.closePath()},['#0c3a5a','#2a98c8','#9af0ff'],{k:1.4,t:2.2,r:CY,s:[[60,34,12,3,-.7],[48,48,2.4,1.2,-.9]],sc:'rgba(255,255,255,.8)'})
glow(g,95,48,52,'rgba(90,255,220,.38)')
g.save();g.beginPath();g.moveTo(34,64);g.bezierCurveTo(34,24,156,24,156,64);g.clip()
for(const[x,y,r]of[[70,52,5],[84,44,3],[110,50,6],[124,40,3.4],[98,36,2.4],[56,44,3]]){g.beginPath();ell(g,x,y,r,r);g.strokeStyle='rgba(220,255,255,.85)';g.lineWidth=.9;g.stroke()}
g.restore()
ln(g,[95,24,95,14],2.2);ln(g,[95,24,95,14],1.2,'#58c8d8')
glow(g,95,10,16,'rgba(255,60,160,.75)')
cel(g,g=>ell(g,95,9,4,4),['#8c0f55','#ff2d8a','#ffc0e0'],{k:.5,t:.7,w:.8})
cel(g,g=>g.roundRect(70,98,50,62,6),['#0a0f2a','#161f4a','#2a3a80'],{k:1,t:1.6})
cel(g,g=>g.roundRect(76,104,38,32,3),['#06201a','#14907a','#5af0c8'],{k:.6,t:1,r:'rgba(255,255,255,.5)'})
glow(g,95,120,30,'rgba(70,255,200,.4)')
ln(g,[95,104,95,136],1,K);ln(g,[76,120,114,120],1,K)
cel(g,g=>g.roundRect(104,144,8,5,1.5),['#8c0f55','#e3248d','#ff80c4'],{k:.4,t:.6,w:.8})
for(let x=70;x<120;x+=10){g.fillStyle=(x/10)%2?'#ffc21a':'#1a1030';g.beginPath();poly(g,[x,154,x+7,154,x+3,160,x-4,160]);g.fill()}
cel(g,g=>g.roundRect(42,68,106,15,4),['#6a0a3a','#e01e7a','#ff86c4'],{k:.9,h:1,hs:1.8})
g.fillStyle='#fff';g.font='800 10.4px sans-serif';g.textAlign='center';g.textBaseline='alphabetic'
g.strokeStyle=K;g.lineWidth=2.4;g.strokeText('SCIENCE LAB',95,79.4);g.fillText('SCIENCE LAB',95,79.4)
}
const wisp=(g,f)=>{
const s=[0,1,0,-1][f],h=[0,1.5,0,1][f]
glow(g,20,22,20,'rgba(120,230,255,.55)')
cel(g,g=>{g.moveTo(20+s*1.4,3-h);g.bezierCurveTo(24,10,32,16,31,24);g.bezierCurveTo(31,32,26,35,20,35);g.bezierCurveTo(14,35,9,32,9,24);g.bezierCurveTo(9,16,17,11,20+s*1.4,3-h);g.closePath()},['#1a6ac0','#5ad4ff','#f2ffff'],{k:.8,t:1.1,r:'rgba(255,120,220,.8)',s:[[16,17,2.2,4,.4]],sc:'#fff'})
for(const x of[16.4,23.6]){g.beginPath();ell(g,x,25,1.7,2.4);g.fillStyle='#0a1a4a';g.fill()}
g.fillStyle='rgba(255,100,190,.6)';g.beginPath();ell(g,13.5,28.5,2,1.2);ell(g,26.5,28.5,2,1.2);g.fill()
g.fillStyle='#ffe27a';g.beginPath();star(g,33,9+h,2.2);g.fill();g.beginPath();star(g,6,14-h,1.6);g.fill()
}
const tree=(g,f)=>{
const s=Math.sin(f*Math.PI/2)*1.6,TK=['#10102e','#3a2a66','#7a62c0']
cel(g,g=>{g.moveTo(26,96);g.quadraticCurveTo(31,88,31,74);g.lineTo(40,74);g.quadraticCurveTo(40,88,46,96);g.quadraticCurveTo(36,93,26,96);g.closePath()},TK,{k:1,h:1,hs:1.7,r:CY})
ln(g,[33,92,34,80],.7,K,.5);ln(g,[38,88,37,78],.7,K,.5)
cel(g,g=>{g.moveTo(34,76);g.quadraticCurveTo(26,66,16+s*.4,56)},TK,{k:.5,t:.8,w:.9})
ln(g,[34,76,26,66,17+s*.5,57],4,K);ln(g,[34,76,26,66,17+s*.5,57],2,TK[1])
ln(g,[38,76,46,66,54+s*.5,56],4,K);ln(g,[38,76,46,66,54+s*.5,56],2,TK[1])
const BL=['#5a0a5c','#cc2c98','#ff90d4']
const cl=(x,y,r,d)=>cel(g,g=>{ell(g,x+s*d,y,r,r*.92)},BL,{k:r/16,h:2,hs:2,r:'rgba(120,240,255,.8)',s:[[x+s*d-r*.35,y-r*.45,r*.3,r*.13,-.6]],sc:'rgba(255,255,255,.7)',a:r*.2,b:r*.45})
cl(14,48,12,.6);cl(56,48,12,.6);cl(35,40,18,1);cl(22,30,13,1.3);cl(48,30,13,1.3);cl(35,17,13,1.7)
g.fillStyle='#ffe27a'
for(const[x,y,r,d]of[[28,24,1.3,1.4],[44,36,1.1,1],[18,40,1.2,.6],[52,22,1,1.5],[35,10,1.2,1.7],[40,48,1.3,1]]){g.beginPath();ell(g,x+s*d,y,r,r);g.fill()}
for(const[x,y]of[[10,66],[60,72],[46,84]])glow(g,x+s,y+Math.abs(s)*2,6,'rgba(255,120,210,.7)')
}
const pris=(g,t)=>{
const P=[{sk:['#a8684a','#e0966c','#ffcfa4'],hr:['#1a0a24','#4a2060','#8a50b8'],sh:['#5a0a3a','#c02a78','#ff80c0'],pt:['#14224a','#2a4a98','#5a88e0']},{sk:['#7a4a30','#b87a4e','#e8b080'],hr:['#2a1408','#6a3a14','#c07a30'],sh:['#0a3a3a','#1a8a80','#60e0c8'],pt:['#2a2a38','#52526a','#8c8ca8']},{sk:['#b8806a','#eab090','#ffd8c0'],hr:['#6a6a84','#c0c0d8','#fafaff'],sh:['#4a3a10','#a8861e','#f0d060'],pt:['#2a1a3a','#4a3470','#8a70c0']}][t]
const J=.8
for(const x of[24,32])cel(g,g=>cap(g,x,58,x+(x<28?-.5:.5),72,4.2,3.8),P.pt,{k:.8,j:J,h:1,hs:1.8})
for(const x of[23,33])cel(g,g=>g.roundRect(x-5,72,10,5,2.4),['#14101c','#3a3048','#6a5a80'],{k:.7,j:J})
for(const s of[-1,1])cel(g,g=>cap(g,28+s*9.5,43,28+s*11.5,56,3.9,3.3),P.sh,{k:.75,j:J,h:1,hs:1.7})
cel(g,g=>{g.moveTo(17,42);g.quadraticCurveTo(28,37,39,42);g.lineTo(40,61);g.quadraticCurveTo(28,64,16,61);g.closePath()},P.sh,{j:J,h:1,hs:1.6})
for(const s of[-1,1])cel(g,g=>ell(g,28+s*11.8,57.5,3.3,3.5),P.sk,{k:.6,j:J})
if(t===0){ln(g,[22,50,34,50],1.2,K,.6);g.fillStyle='#ffd23a';g.beginPath();star(g,28,47,2.2);g.fill()}
if(t===1){ln(g,[21,45,35,58],1.1,K,.6);ln(g,[35,45,21,58],1.1,K,.6)}
if(t===2){ln(g,[28,40,28,62],1.2,K,.6);for(const y of[48,54])g.fillStyle='#2a1a3a',g.fillRect(26,y,4,1.6)}
const cx=28,cy=26
if(t===2){cel(g,g=>sm(g,[cx-13,cy+2,cx-14,cy-8,cx,cy-14,cx+13,cy-8,cx+14,cy+2,cx+10,cy+16,cx,cy+22,cx-10,cy+16]),P.hr,{k:.9,j:J,h:1,hs:1.7})}
if(t===0)cel(g,g=>sm(g,[cx-15,cy+24,cx-18,cy+4,cx-12,cy-10,cx,cy-16,cx+12,cy-10,cx+18,cy+4,cx+15,cy+24,cx+8,cy+14,cx-8,cy+14]),P.hr,{k:.9,j:J,h:1,hs:1.7})
cel(g,g=>sm(g,[cx-13,cy+1,cx-12,cy-9,cx,cy-13,cx+12,cy-9,cx+13,cy+2,cx+10,cy+11,cx,cy+15,cx-10,cy+11]),P.sk,{k:.9,j:J,r:CY})
cel(g,g=>{ell(g,cx-13,cy+2,2.4,3.2);ell(g,cx+13,cy+2,2.4,3.2)},P.sk,{k:.4,j:J})
if(t===0)cel(g,g=>poly(g,[cx-13,cy-2,cx-13,cy-11,cx,cy-15,cx+13,cy-11,cx+13,cy-2,cx+8,cy-8,cx+3,cy-4,cx-3,cy-9,cx-8,cy-4]),P.hr,{k:.9,j:J,h:1,hs:1.7})
if(t===1)cel(g,g=>poly(g,[cx-14,cy-1,cx-14,cy-12,cx-6,cy-17,cx,cy-14,cx+6,cy-18,cx+14,cy-12,cx+14,cy-1,cx+10,cy-8,cx+4,cy-9,cx-4,cy-6,cx-9,cy-9]),P.hr,{k:.9,j:J,h:1,hs:1.7})
if(t===2){ln(g,[cx-13,cy-6,cx-8,cy-11,cx,cy-9],2.4,P.hr[2]);ln(g,[cx+13,cy-6,cx+8,cy-11,cx,cy-9],2.4,P.hr[2])}
const ey=t===2?cy+1.4:cy+1
for(const s of[-1,1]){const x=cx+s*5;g.beginPath();ell(g,x,ey,2.8,t===2?2.2:3.6);g.fillStyle='#fdfcff';g.fill();g.strokeStyle=K;g.lineWidth=.8;g.stroke();g.beginPath();ell(g,x+.4,ey+.5,1.5,t===2?1.5:2.2);g.fillStyle=t===0?'#2a7a5a':t===1?'#5a3410':'#4a6a9a';g.fill();g.fillStyle='#fff';g.beginPath();ell(g,x-.2,ey-.6,.6,.6);g.fill();ln(g,[x-3,ey-2.8,x,ey-4.2,x+3,ey-2.8],1,K)}
if(t===2){ln(g,[cx-8,cy-5,cx-3,cy-6.4],1.2,P.hr[1]);ln(g,[cx+8,cy-5,cx+3,cy-6.4],1.2,P.hr[1]);ln(g,[cx-9,cy+6,cx-7,cy+9],.6,K,.6);ln(g,[cx+9,cy+6,cx+7,cy+9],.6,K,.6);ln(g,[cx-5,cy+12,cx,cy+13.4,cx+5,cy+12],1.2,'#d8d8ec')}
if(t===1){ln(g,[cx-8,cy-4.4,cx-3,cy-5.4],1.3,P.hr[0]);ln(g,[cx+8,cy-4.4,cx+3,cy-5.4],1.3,P.hr[0])}
ln(g,[cx-.6,cy+5.4,cx+.8,cy+6.2],.8,K,.8)
g.beginPath();g.moveTo(cx-3,cy+9.6);g.quadraticCurveTo(cx,cy+(t===1?9.4:11.8),cx+3,cy+9.6);g.strokeStyle='#7a1f38';g.lineWidth=1.1;g.stroke()
g.fillStyle='rgba(255,80,130,.4)';g.beginPath();ell(g,cx-8,cy+7,2.4,1.5);ell(g,cx+8,cy+7,2.4,1.5);g.fill()
}
export function island(S){
const W=1400,H=900,[c,g]=mk(W,H,S,1),R=seed(7)
glow(g,700,800,520,'rgba(10,6,40,.5)')
const rock=g=>{g.moveTo(130,470);g.bezierCurveTo(170,700,420,800,520,860);g.lineTo(560,820);g.lineTo(600,900-30);g.lineTo(650,840);g.lineTo(700,878);g.lineTo(760,830);g.lineTo(810,872);g.lineTo(850,820);g.bezierCurveTo(1000,790,1230,700,1270,470);g.closePath()}
cel(g,rock,['#0a0624','#2a2468','#6a5ec0'],{k:5,w:1,t:1.2,a:2,b:4,r:'rgba(255,90,200,.55)'})
g.save();g.beginPath();rock(g);g.clip()
for(let i=0;i<16;i++){const x=200+R()*1000,y=500+R()*300,w=24+R()*50;g.beginPath();ell(g,x,y,w,w*.34);g.fillStyle='rgba(8,4,30,.35)';g.fill()}
g.strokeStyle='rgba(8,4,30,.5)';g.lineWidth=3;for(let i=0;i<11;i++){g.beginPath();g.moveTo(150+i*20,510+i*38);g.quadraticCurveTo(700,580+i*26,1250-i*20,510+i*38);g.stroke()}
g.restore()
for(const[x,y,s,col]of[[430,760,1,'#ff2d9a'],[980,770,1.2,'#38d8ff'],[300,640,.8,'#38d8ff'],[1120,660,.9,'#ff2d9a'],[700,860,1.1,'#ffc21a']]){glow(g,x,y,60*s,col==='#ff2d9a'?'rgba(255,60,170,.5)':col==='#38d8ff'?'rgba(60,220,255,.5)':'rgba(255,200,40,.5)');cel(g,g=>poly(g,[x-12*s,y+6,x-6*s,y-30*s,x,y-44*s,x+7*s,y-26*s,x+13*s,y+6]),col==='#ff2d9a'?['#5a0a4a','#ff2d9a','#ffc0e8']:col==='#38d8ff'?['#043a5a','#38d8ff','#e0ffff']:['#6a3a00','#ffc21a','#fff7b0'],{k:1.8,t:1.2,w:.9})}
for(const x of[240,560,860,1160]){ln(g,[x,640+R()*60,x+14,700,x+4,760],6,K);ln(g,[x,640,x+14,700,x+4,760],3,'#1f7a68')}
cel(g,g=>ell(g,700,478,560,330),['#2a1230','#6a3a52','#c0805a'],{k:5,w:1,t:1,a:1.5,b:3})
const gr=g=>ell(g,700,444,560,324)
cel(g,gr,['#063a46','#16907c','#5ce8a4'],{k:5,w:1,t:.9,a:2.2,b:4.6,r:'rgba(120,255,230,.55)',s:[[420,200,160,22,-.25]],sc:'rgba(200,255,230,.18)'})
g.save();g.beginPath();gr(g);g.clip()
g.fillStyle=rg(g,640,360,20,560,[[0,'rgba(190,255,200,.45)'],[1,'rgba(0,0,0,0)']]);g.fillRect(0,0,W,H)
for(let i=0;i<22;i++){const x=150+R()*1100,y=170+R()*560,w=30+R()*60;g.beginPath();ell(g,x,y,w,w*.3);g.fillStyle='rgba(4,40,50,.2)';g.fill()}
g.beginPath();g.moveTo(480,560);g.bezierCurveTo(620,520,800,470,1000,350)
g.lineWidth=54;g.strokeStyle=K;g.stroke();g.lineWidth=46;g.strokeStyle='#a07a58';g.stroke();g.lineWidth=34;g.strokeStyle='#e0c8a0';g.stroke();g.lineWidth=22;g.strokeStyle='#f8ecd0';g.stroke()
for(let i=0;i<46;i++){const t=R(),x=480+t*520+(R()-.5)*30,y=560-t*210+(R()-.5)*20;g.beginPath();ell(g,x,y,3+R()*4,2+R()*2);g.fillStyle=R()>.5?'#c0a078':'#fff6dc';g.fill();g.strokeStyle='rgba(14,7,32,.6)';g.lineWidth=.9;g.stroke()}
for(let i=0;i<300;i++){const x=150+R()*1100,y=150+R()*620;g.strokeStyle=R()>.5?'rgba(4,50,60,.7)':'rgba(150,255,190,.6)';g.lineWidth=2.4;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x-3,y-8,x-5,y-13);g.moveTo(x+4,y);g.quadraticCurveTo(x+5,y-8,x+8,y-12);g.stroke()}
for(let i=0;i<90;i++){const x=150+R()*1100,y=150+R()*620,k=i%3,col=['#ff4aa8','#38d8ff','#ffd23a'][k];glow(g,x,y,18,['rgba(255,60,170,.45)','rgba(60,220,255,.45)','rgba(255,200,40,.45)'][k]);g.fillStyle=K;for(let p=0;p<5;p++){g.beginPath();ell(g,x+Math.cos(p*1.257)*4.4,y+Math.sin(p*1.257)*4.4,3.6,3.6);g.fill()}g.fillStyle=col;for(let p=0;p<5;p++){g.beginPath();ell(g,x+Math.cos(p*1.257)*4.2,y+Math.sin(p*1.257)*4.2,2.8,2.8);g.fill()}g.fillStyle='#fff7c0';g.beginPath();ell(g,x,y,2,2);g.fill()}
g.restore()
const pond=g=>ell(g,700,660,124,46)
cel(g,pond,['#031a3a','#1a6ab8','#7ae8ff'],{k:3,w:1,t:1,a:3,b:7,r:'rgba(255,255,255,.35)'})
glow(g,700,660,110,'rgba(60,220,255,.35)')
g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=2;for(const[x,y,w]of[[650,655,26],[740,670,20],[700,645,12]]){g.beginPath();g.ellipse(x,y,w,w*.3,0,Math.PI*1.1,Math.PI*1.9);g.stroke()}
for(let i=0;i<16;i++){const a=i/16*T;cel(g,g=>ell(g,700+Math.cos(a)*130,660+Math.sin(a)*50,10+R()*4,7+R()*2,a*.3),['#2a2450','#7a72b8','#d0c8f8'],{k:1.5,w:.9,t:.9,h:2,hs:2})}
return{c,W,H}
}
export function lab(S){
const W=960,H=540,[c,g]=mk(W,H,S,1)
g.fillStyle=lg(g,0,0,0,210,[[0,'#050818'],[1,'#10204a']]);g.fillRect(0,0,W,210)
g.fillStyle=lg(g,0,200,0,H,[[0,'#16264a'],[1,'#060a1c']]);g.fillRect(0,200,W,H-200)
for(let x=-400;x<=1360;x+=96){g.strokeStyle='rgba(90,160,255,.16)';g.lineWidth=1.4;g.beginPath();g.moveTo(480+(x-480)*.35,210);g.lineTo(x,H);g.stroke()}
for(let y=0;y<9;y++){const yy=210+Math.pow(y/8,1.7)*330;g.strokeStyle='rgba(90,160,255,.16)';g.beginPath();g.moveTo(0,yy);g.lineTo(W,yy);g.stroke()}
for(let x=20;x<W;x+=120){cel(g,g=>g.roundRect(x,26,70,126,4),['#060c20','#0e1c42','#1c3a7a'],{k:.9,t:1.2});glow(g,x+35,90,50,'rgba(80,170,255,.14)')}
for(const y of[8,22])ln(g,[0,y,W,y],5,K),ln(g,[0,y,W,y],2.6,'#2a4a8a')
for(const x of[60,300,560,880]){ln(g,[x,0,x,26],6,K);ln(g,[x,0,x,26],3,'#3a5aa0')}
cel(g,g=>g.rect(-10,192,W+20,22),['#0c1230','#26386a','#5a78c0'],{k:1,t:1.4,h:1,hs:2})
for(let x=0;x<W;x+=48){g.fillStyle=(x/48)%2?'#ffc21a':'#1a1030';g.beginPath();poly(g,[x,205,x+20,205,x+28,212,x+8,212]);g.fill()}
for(const x of[120,250,610,740]){
cel(g,g=>g.roundRect(x-4,96,142,120,8),['#0a1230','#243a74','#5a82d0'],{k:1.1,t:1.6,r:CY})
cel(g,g=>g.roundRect(x+6,108,118,96,5),['#021a2a','#0a5a6a','#2ad0c0'],{k:.9,t:1.2,w:1})
g.save();g.beginPath();g.roundRect(x+6,108,118,96,5);g.clip();g.fillStyle=lg(g,0,108,0,204,[[0,'rgba(60,255,220,.08)'],[1,'rgba(60,255,200,.5)']]);g.fillRect(x,108,130,100)
for(let i=0;i<9;i++){g.beginPath();ell(g,x+16+((i*37)%98),130+((i*53)%70),2+i%3,2+i%3);g.strokeStyle='rgba(220,255,255,.7)';g.lineWidth=1;g.stroke()}
g.fillStyle='rgba(255,255,255,.18)';g.beginPath();poly(g,[x+14,108,x+34,108,x+10,204,x+6,204]);g.fill();g.restore()
glow(g,x+65,160,80,'rgba(60,255,210,.22)')
g.fillStyle='#ff2d6a';g.beginPath();ell(g,x+124,100,3,3);g.fill();glow(g,x+124,100,10,'rgba(255,45,106,.8)')
for(const bx of[x+4,x+130])cel(g,g=>g.roundRect(bx,92,6,126,2),['#1a1030','#3a2a60','#7a68b8'],{k:.5,t:.7,w:.8})}
cel(g,g=>g.roundRect(372,92,216,120,9),['#04060f','#0c1a34','#1c3a6a'],{k:1.3,t:1.8,r:CY})
g.fillStyle='#04120c';g.beginPath();g.roundRect(384,102,192,100,5);g.fill()
g.strokeStyle='rgba(60,255,160,.18)';g.lineWidth=1;for(let y=106;y<200;y+=4){g.beginPath();g.moveTo(386,y);g.lineTo(574,y);g.stroke()}
cel(g,g=>g.roundRect(60,300,66,112,4),['#8a6a3a','#e0c898','#fff0d0'],{k:1,t:1.3,h:1,hs:2})
cel(g,g=>g.roundRect(68,308,50,18,2),['#3a0510','#a0182a','#e04058'],{k:.5,t:.8})
g.fillStyle='#fff';g.font='900 9px sans-serif';g.textAlign='center';g.fillText('HOLD THE LINE',93,320)
g.fillStyle='#3a2a14';for(let i=0;i<6;i++){g.beginPath();ell(g,77+(i%3)*16,344+Math.floor(i/3)*20,5,5);g.fill();g.fillRect(73+(i%3)*16,349+Math.floor(i/3)*20,8,8)}
g.fillStyle='#a0182a';g.fillRect(70,388,46,4);g.fillStyle='#3a2a14';g.font='700 7px sans-serif';g.fillText('REINFORCE. BREACH.',93,401)
cel(g,g=>g.roundRect(852,296,62,100,5),['#04060f','#1a2a52','#4a68b0'],{k:1,t:1.4,r:CY})
cel(g,g=>g.roundRect(858,302,50,56,3),['#010806','#04160f','#0a3a28'],{k:.7,t:1})
glow(g,883,330,50,'rgba(60,255,160,.2)')
for(const[x,col]of[[864,'#ff2d6a'],[876,'#ffc21a'],[888,'#38ffa8']]){g.fillStyle=col;g.beginPath();ell(g,x,376,3,3);g.fill();glow(g,x,376,9,col==='#ff2d6a'?'rgba(255,45,106,.6)':'rgba(120,255,160,.4)')}
cel(g,g=>g.roundRect(440,516,80,24,4),['#020308','#0a1228','#1a2a54'],{k:.8,t:1})
g.fillStyle='rgba(120,255,200,.6)';g.fillRect(446,520,68,3)
g.strokeStyle='rgba(255,255,255,.04)'
return{c,W,H}
}
export function room(S,kind){
const W=960,H=540,[c,g]=mk(W,H,S,1)
if(kind==='living'){
g.fillStyle=lg(g,0,0,0,430,[[0,'#1c1040'],[1,'#3a1a4a']]);g.fillRect(0,0,W,430)
for(let x=0;x<W;x+=48){g.fillStyle=x%96?'rgba(255,170,220,.05)':'rgba(0,0,10,.18)';g.fillRect(x,0,24,430)}
for(let x=0;x<W;x+=48)ln(g,[x,0,x,430],1,K,.25)
g.fillStyle=lg(g,0,430,0,H,[[0,'#6a3a3a'],[1,'#2a1218']]);g.fillRect(0,430,W,110)
for(let x=0;x<W;x+=90)ln(g,[x,430,x-30,H],2,K,.5)
for(let y=450;y<H;y+=24)ln(g,[0,y,W,y],1,K,.25)
cel(g,g=>g.rect(-6,396,W+12,36),['#1a0a1c','#5a2a48','#a05a78'],{k:1.1,t:1.3,h:1,hs:2})
cel(g,g=>g.roundRect(114,84,162,218,8),['#3a2410','#a0682c','#f0b868'],{k:1.5,t:2})
g.fillStyle=lg(g,0,96,0,294,[[0,'#2a2a90'],[.6,'#14185a'],[1,'#080c30']]);g.fillRect(126,96,138,198)
for(let i=0;i<22;i++){g.fillStyle='rgba(255,255,255,'+(.4+(i%3)*.2)+')';g.beginPath();star(g,128+(i*47)%134,100+(i*71)%190,1+i%2);g.fill()}
glow(g,215,150,60,'rgba(255,250,200,.4)')
cel(g,g=>ell(g,215,150,19,19),['#a09060','#f0e6a8','#ffffff'],{k:.7,t:.9})
g.fillStyle='rgba(120,110,80,.4)';g.beginPath();ell(g,210,155,4,3);ell(g,222,146,3,2.4);g.fill()
for(const[x,y,w,h]of[[195,96,6,198],[126,192,138,6]]){g.fillStyle='#a0682c';g.fillRect(x,y,w,h);g.strokeStyle=K;g.lineWidth=1.4;g.strokeRect(x,y,w,h)}
cel(g,g=>g.rect(104,296,182,12),['#3a2410','#a0682c','#f0b868'],{k:.8,t:1.2})
cel(g,g=>ell(g,480,480,206,38),['#3a0a3a','#9a2a6a','#e86aa8'],{k:1.5,t:1.6,h:2,hs:3})
g.beginPath();ell(g,480,480,150,25);g.strokeStyle='#ffd88a';g.lineWidth=2.4;g.stroke();g.beginPath();ell(g,480,480,110,17);g.strokeStyle='#38d8ff';g.lineWidth=1.6;g.stroke()
cel(g,g=>g.roundRect(330,110,70,90,4),['#3a2410','#a0682c','#f0b868'],{k:1,t:1.3})
g.fillStyle=lg(g,0,118,0,192,[[0,'#2a7ac0'],[1,'#7a3ab0']]);g.fillRect(338,118,54,74);g.fillStyle='#ffd23a';g.beginPath();g.moveTo(338,170);g.lineTo(360,148);g.lineTo(374,162);g.lineTo(392,140);g.lineTo(392,192);g.lineTo(338,192);g.fill()
cel(g,g=>g.roundRect(540,130,60,76,4),['#3a2410','#a0682c','#f0b868'],{k:1,t:1.3})
g.fillStyle=lg(g,0,137,0,199,[[0,'#d06a8a'],[1,'#5a2a6a']]);g.fillRect(547,137,46,62);g.fillStyle='#fff0c0';g.beginPath();ell(g,570,160,9,9);g.fill()
glow(g,860,200,240,'rgba(255,170,90,.18)')
}else if(kind==='hall'){
g.fillStyle=lg(g,0,0,0,H,[[0,'#2a1d2a'],[1,'#1a1220']]);g.fillRect(0,0,W,H)
for(let x=0;x<1700;x+=60){g.fillStyle='rgba(255,255,255,.03)';g.fillRect(x,0,30,430)}
g.fillStyle='#2a1810';g.fillRect(0,430,W*2,110)
}
return{c,W,H}
}
export function art(S){
const A={kid:{}}
for(const t of['skin','pumpkin','cloud'])A.kid[t]=[0,1,2,3].map(f=>spr(56,80,28,76,S,g=>body(g,f,t),2))
A.mom=spr(100,110,50,106,S,mom,1.6)
A.cocoa=[0,1,2,3].map(f=>spr(70,110,35,106,S,g=>cocoa(g,f),1.6))
A.pris=[0,1,2].map(i=>spr(56,80,28,76,S,g=>pris(g,i),2))
A.sheep=spr(100,70,45,64,S,sheep,1.6)
A.bench=spr(80,40,40,38,S,bench,2)
A.lab=spr(190,170,95,160,S,labB,1.3)
A.wispF=[0,1,2,3].map(f=>spr(40,40,20,20,S,g=>wisp(g,f),2))
A.wisp=A.wispF[0]
A.treeF=[0,1,2,3].map(f=>spr(70,100,35,96,S,g=>tree(g,f),1.6))
A.tree=A.treeF[0]
return A
}
