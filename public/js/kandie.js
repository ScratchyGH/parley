const TAU=Math.PI*2
export function kandieArt(w){
const c=document.createElement('canvas'),H=Math.round(w*1.4)
c.width=w;c.height=H
const g=c.getContext('2d'),u=w/40
const R=(x,y,a,b,f)=>{g.fillStyle=f;g.fillRect(Math.round(x*u),Math.round(y*u),Math.ceil(a*u),Math.ceil(b*u))}
const C=(x,y,r,f)=>{g.fillStyle=f;g.beginPath();g.arc(x*u,y*u,r*u,0,TAU);g.fill()}
R(9,30,22,22,'#1e2a52')
R(9,30,22,3,'#f4f0f6')
R(17,31,6,6,'#ff4a6a')
R(12,50,6,6,'#f6d2b8');R(22,50,6,6,'#f6d2b8')
R(11,56,8,2,'#2a2230');R(21,56,8,2,'#2a2230')
C(20,16,13,'#3a2030')
R(7,16,6,22,'#3a2030');R(27,16,6,22,'#3a2030')
C(20,19,10,'#f6d2b8')
R(9,9,22,7,'#3a2030')
C(20,10,10,'#3a2030')
R(11,13,18,4,'#3a2030')
R(13,19,4,5,'#2a1a2e');R(23,19,4,5,'#2a1a2e')
R(14,19,2,2,'#fff');R(24,19,2,2,'#fff')
C(12,25,2,'rgba(255,120,150,.55)');C(28,25,2,'rgba(255,120,150,.55)')
R(18,27,4,1.4,'#c2486a')
R(26,5,6,4,'#ff7aa8');R(25,6,2,2,'#ff7aa8')
return c
}
