const K=new Map(),P=new Set()
const url=el=>{const m=/url\(["']?(.+?)["']?\)\s*$/.exec(getComputedStyle(el).backgroundImage||'');return m&&m[1]}
const measure=u=>new Promise(res=>{
const im=new Image()
im.onerror=()=>res(null)
im.onload=()=>{try{
const N=96,c=document.createElement('canvas')
c.width=c.height=N
const g=c.getContext('2d',{willReadFrequently:true})
g.drawImage(im,0,0,N,N)
const d=g.getImageData(0,0,N,N).data
const clr=i=>d[i*4+3]<48
const s0=(N>>1)*N+(N>>1)
if(!clr(s0))return res(null)
const seen=new Uint8Array(N*N),st=[s0]
seen[s0]=1
let x0=N,x1=0,y0=N,y1=0,n=0
while(st.length){
const i=st.pop(),x=i%N,y=(i/N)|0
n++
if(x<x0)x0=x
if(x>x1)x1=x
if(y<y0)y0=y
if(y>y1)y1=y
for(const j of[i-1,i+1,i-N,i+N]){
if(j<0||j>=N*N||seen[j]||Math.abs(j%N-x)>1)continue
if(clr(j)){seen[j]=1;st.push(j)}
}
}
if(!x0||!y0||x1===N-1||y1===N-1)return res(null)
const bw=x1-x0+1,bh=y1-y0+1
res({w:bw/N,h:bh/N,cx:(x0+x1+1)/2/N-.5,cy:(y0+y1+1)/2/N-.5,r:Math.min(.5,Math.sqrt(Math.max(0,1-n/(bw*bh))/(4-Math.PI)))})
}catch{res(null)}}
im.src=u
})
const apply=(av,v)=>{
if(!v)return
av.style.setProperty('--fs',v.s)
av.style.setProperty('--fx',v.dx+'%')
av.style.setProperty('--fy',v.dy+'%')
av.style.setProperty('--fb',v.r+'%')
av.dataset.fit='1'
}
async function fit(av){
if(av.dataset.fit)return
const f=av.querySelector(':scope>.frm'),c=[...av.classList].find(x=>x.startsWith('fr_'))
if(!f||!c)return
let m=K.get(c)
if(m===undefined){
const u=url(f)
if(!u)return
m=measure(u)
K.set(c,m)
}
if(!av.offsetWidth){const n=(+av.dataset.tries||0)+1;if(n<6){av.dataset.tries=n;setTimeout(()=>{P.add(av);if(!q)q=requestAnimationFrame(flush)},400*n)}return}
const kx=f.offsetWidth/av.offsetWidth,ky=f.offsetHeight/av.offsetHeight
let v=await m
if(!v){const cs=getComputedStyle(av),w=parseFloat(cs.getPropertyValue('--fhole'));if(w>0)v={w,h:w,cx:0,cy:0,r:(parseFloat(cs.getPropertyValue('--fround'))||0)/100}}
apply(av,v&&{s:+(Math.min(v.w*kx,v.h*ky)*1.03).toFixed(3),dx:+(v.cx*kx*100).toFixed(2),dy:+(v.cy*ky*100).toFixed(2),r:+(v.r*100).toFixed(1)})
}
const scan=root=>{
if(root.nodeType!==1)return
if(root.matches('.av'))P.add(root)
for(const a of root.querySelectorAll('.av[class*=" fr_"]'))P.add(a)
}
let q=0
const flush=()=>{q=0;const l=[...P];P.clear();for(const a of l)fit(a)}
export function frameFit(){
scan(document.body)
new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)scan(n);if(P.size&&!q)q=requestAnimationFrame(flush)}).observe(document.body,{childList:true,subtree:true})
flush()
}
