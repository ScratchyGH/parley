const im=new Image()
let ok=0
const q=[]
im.onload=()=>{ok=1;q.forEach(f=>f())}
im.src='/kandie.webp'
export function kandieArt(w){
const c=document.createElement('canvas'),H=Math.round(w*1.2)
c.width=w;c.height=H
const g=c.getContext('2d')
const d=()=>{g.clearRect(0,0,w,H);g.imageSmoothingQuality='high';g.drawImage(im,0,0,w,H)}
if(ok)d();else q.push(d)
return c
}
const bi=new Image()
let bok=0
const bq=[]
bi.onload=()=>{bok=1;bq.forEach(f=>f())}
bi.src='/britc.webp'
export function britArt(w){
const c=document.createElement('canvas'),H=Math.round(w*1.02)
c.width=w;c.height=H
const g=c.getContext('2d')
const d=()=>{g.clearRect(0,0,w,H);g.imageSmoothingQuality='high';g.drawImage(bi,0,0,w,H)}
if(bok)d();else bq.push(d)
return c
}
