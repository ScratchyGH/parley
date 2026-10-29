import{h}from'./util.js'
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v))
export function openMedia(list,start){
const layer=document.getElementById('layer')||document.body
let i=clamp(start||0,0,list.length-1)
const st={s:1,x:0,y:0,r:0,f:1}
let el=null,nat={w:0,h:0}
const stage=h('div',{class:'mv-stage'})
const label=h('button',{class:'mv-pct',title:'Reset view'},'100%')
const cap=h('div',{class:'mv-cap'})
const root=h('div',{class:'mv',role:'dialog','aria-modal':'true','aria-label':'Media viewer',tabindex:'0'})
const apply=()=>{
if(!el)return
el.style.transform='translate('+st.x+'px,'+st.y+'px) rotate('+st.r+'deg) scale('+st.s*st.f+','+st.s+')'
label.textContent=Math.round(st.s*100)+'%'
stage.classList.toggle('mv-zoomed',st.s>1.001)
}
const reset=()=>{st.s=1;st.x=0;st.y=0;st.r=0;st.f=1;apply()}
const zoomAt=(k,cx,cy)=>{
const ns=clamp(st.s*k,.2,16)
const r=stage.getBoundingClientRect()
const ox=cx-(r.left+r.width/2),oy=cy-(r.top+r.height/2)
st.x=ox-(ox-st.x)*(ns/st.s)
st.y=oy-(oy-st.y)*(ns/st.s)
st.s=ns
if(st.s<=1.001&&Math.abs(st.r%180)<1){st.x*=.6;st.y*=.6}
apply()
}
const zoomC=k=>{const r=stage.getBoundingClientRect();zoomAt(k,r.left+r.width/2,r.top+r.height/2)}
const oneToOne=()=>{
if(!el||!nat.w)return
const b=el.getBoundingClientRect()
const cur=b.width/(Math.abs(st.s)||1)
const w=el.tagName==='VIDEO'?nat.w:nat.w
st.s=clamp(w/(cur||w),.2,16)
st.x=0;st.y=0
apply()
}
const show=()=>{
const it=list[i]
stage.textContent=''
reset()
nat={w:0,h:0}
if(it.type==='video'){
el=h('video',{src:it.src,controls:true,autoplay:true,playsinline:true,class:'mv-media'})
el.addEventListener('loadedmetadata',()=>{nat={w:el.videoWidth,h:el.videoHeight}})
}else{
el=h('img',{src:it.src,alt:it.name||'',class:'mv-media',draggable:'false'})
el.addEventListener('load',()=>{nat={w:el.naturalWidth,h:el.naturalHeight}})
}
stage.append(el)
cap.textContent=(it.name||'')+(list.length>1?'   '+(i+1)+' / '+list.length:'')
dl.href=it.src
dl.setAttribute('download',it.name||'')
open_.href=it.src
spd.style.display=lp.style.display=pip.style.display=it.type==='video'?'':'none'
prev.style.display=next.style.display=list.length>1?'':'none'
}
const go=d=>{i=(i+d+list.length)%list.length;show()}
const mkb=(t,fn,ttl)=>h('button',{class:'mv-b',title:ttl||t,'aria-label':ttl||t,on:{click:e=>{e.stopPropagation();fn(e)}}},t)
const prev=mkb('Prev',()=>go(-1),'Previous')
const next=mkb('Next',()=>go(1),'Next')
const dl=h('a',{class:'mv-b',title:'Download',href:'#',download:''},'Download')
const open_=h('a',{class:'mv-b',title:'Open original',href:'#',target:'_blank',rel:'noopener'},'Original')
const spd=h('select',{class:'mv-b mv-sel',title:'Playback speed',on:{change:()=>{if(el&&el.tagName==='VIDEO')el.playbackRate=Number(spd.value)}}},...[.25,.5,.75,1,1.25,1.5,2].map(v=>h('option',{value:String(v),selected:v===1?true:null},v+'x')))
const lp=mkb('Loop',()=>{if(el&&el.tagName==='VIDEO'){el.loop=!el.loop;lp.classList.toggle('on',el.loop)}},'Loop video')
const pip=mkb('Pop out',async()=>{try{if(el&&el.requestPictureInPicture)await el.requestPictureInPicture()}catch{}},'Picture in picture')
const close=()=>{document.removeEventListener('keydown',key,true);if(document.fullscreenElement)document.exitFullscreen?.();root.remove()}
const fs=mkb('Fullscreen',()=>{if(document.fullscreenElement)document.exitFullscreen?.();else root.requestFullscreen?.()},'Fullscreen')
label.addEventListener('click',e=>{e.stopPropagation();reset()})
const bar=h('div',{class:'mv-bar'},prev,next,mkb('-',()=>zoomC(1/1.25),'Zoom out'),label,mkb('+',()=>zoomC(1.25),'Zoom in'),mkb('1:1',oneToOne,'Actual size'),mkb('Fit',reset,'Fit to screen'),mkb('Rotate left',()=>{st.r-=90;apply()}),mkb('Rotate right',()=>{st.r+=90;apply()}),mkb('Flip',()=>{st.f*=-1;apply()},'Flip horizontally'),spd,lp,pip,fs,dl,open_,mkb('Close',close))
bar.addEventListener('click',e=>e.stopPropagation())
root.append(stage,cap,bar)
const ptrs=new Map()
let pd=0,drag=null,moved=0
stage.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.deltaY<0?1.15:1/1.15,e.clientX,e.clientY)},{passive:false})
stage.addEventListener('pointerdown',e=>{
ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY})
stage.setPointerCapture?.(e.pointerId)
moved=0
if(ptrs.size===2){const[a,b]=[...ptrs.values()];pd=Math.hypot(a.x-b.x,a.y-b.y);drag=null}
else drag={x:e.clientX,y:e.clientY,ox:st.x,oy:st.y}
})
stage.addEventListener('pointermove',e=>{
if(!ptrs.has(e.pointerId))return
ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY})
if(ptrs.size===2){
const[a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y)
if(pd)zoomAt(d/pd,(a.x+b.x)/2,(a.y+b.y)/2)
pd=d
moved+=5
return
}
if(drag){
const vid=el&&el.tagName==='VIDEO'
if(vid&&!e.shiftKey&&st.s<=1.001)return
const dx=e.clientX-drag.x,dy=e.clientY-drag.y
moved=Math.max(moved,Math.abs(dx)+Math.abs(dy))
if(vid&&!e.shiftKey)return
st.x=drag.ox+dx
st.y=drag.oy+dy
apply()
}
})
const end=e=>{ptrs.delete(e.pointerId);if(ptrs.size<2)pd=0;if(!ptrs.size)drag=null}
stage.addEventListener('pointerup',end)
stage.addEventListener('pointercancel',end)
stage.addEventListener('dblclick',e=>{
e.preventDefault()
if(st.s>1.05)reset()
else zoomAt(2.5,e.clientX,e.clientY)
})
stage.addEventListener('click',e=>{if(e.target===stage&&moved<4)close()})
function key(e){
if(!root.isConnected){document.removeEventListener('keydown',key,true);return}
if(e.target.tagName==='SELECT')return
const k=e.key
if(k==='Escape'){e.stopPropagation();close()}
else if(k==='+'||k==='='){zoomC(1.25)}
else if(k==='-'){zoomC(1/1.25)}
else if(k==='0'){reset()}
else if(k==='r'||k==='R'){st.r+=e.shiftKey?-90:90;apply()}
else if(k==='f'||k==='F'){fs.click()}
else if(k==='ArrowRight'&&list.length>1&&st.s<=1.001){go(1)}
else if(k==='ArrowLeft'&&list.length>1&&st.s<=1.001){go(-1)}
else if(k==='ArrowLeft'||k==='ArrowRight'||k==='ArrowUp'||k==='ArrowDown'){if(st.s>1.001){const d=60;if(k==='ArrowLeft')st.x+=d;if(k==='ArrowRight')st.x-=d;if(k==='ArrowUp')st.y+=d;if(k==='ArrowDown')st.y-=d;apply()}}
else return
e.preventDefault()
}
document.addEventListener('keydown',key,true)
layer.append(root)
show()
root.focus()
}
