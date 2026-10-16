import{h,toast,dialog}from'./util.js'
import{displayBlob,isAnimated}from'./codec.js'

async function bitmapOf(file){
try{return await createImageBitmap(file)}catch{}
const b=await displayBlob(file,file.type)
return createImageBitmap(b)
}

export function cropDialog(file,{aspect=1,round=false,width=512,title='Crop image'}){
return new Promise(async res=>{
let bmp
try{bmp=await bitmapOf(file)}catch{res(file);return}
const vw=320
const vh=Math.round(vw/aspect)
const cv=h('canvas',{width:vw,height:vh,style:{width:vw+'px',height:vh+'px',maxWidth:'100%',touchAction:'none',cursor:'grab',borderRadius:round?'50%':'8px',background:'var(--bg)'}})
const g=cv.getContext('2d')
const base=Math.max(vw/bmp.width,vh/bmp.height)
let zoom=1,ox=0,oy=0
const lim=()=>{
const w=bmp.width*base*zoom,hh=bmp.height*base*zoom
const mx=(w-vw)/2,my=(hh-vh)/2
ox=Math.max(-mx,Math.min(mx,ox))
oy=Math.max(-my,Math.min(my,oy))
}
const draw=()=>{
lim()
const w=bmp.width*base*zoom,hh=bmp.height*base*zoom
g.clearRect(0,0,vw,vh)
g.drawImage(bmp,(vw-w)/2+ox,(vh-hh)/2+oy,w,hh)
}
let drag=null
cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,ox,oy};cv.setPointerCapture(e.pointerId);cv.style.cursor='grabbing'})
cv.addEventListener('pointermove',e=>{if(!drag)return;const k=vw/cv.getBoundingClientRect().width;ox=drag.ox+(e.clientX-drag.x)*k;oy=drag.oy+(e.clientY-drag.y)*k;draw()})
cv.addEventListener('pointerup',()=>{drag=null;cv.style.cursor='grab'})
cv.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.min(5,Math.max(1,zoom*(e.deltaY<0?1.08:1/1.08)));draw()},{passive:false})
const zr=h('input',{type:'range',min:'1',max:'5',step:'0.01',value:'1','aria-label':'Zoom',style:{width:'100%'},on:{input:e=>{zoom=parseFloat(e.target.value);draw()}}})
const done=v=>{d.close();res(v)}
const ok=h('button',{class:'btn pri',on:{click:()=>{
const ow=width,oh=Math.round(width/aspect)
const out=document.createElement('canvas')
out.width=ow;out.height=oh
const k=ow/vw
const w=bmp.width*base*zoom*k,hh=bmp.height*base*zoom*k
out.getContext('2d').drawImage(bmp,(ow-w)/2+ox*k,(oh-hh)/2+oy*k,w,hh)
out.toBlob(b=>{
if(!b){done(file);return}
done(new File([b],(file.name.replace(/\.[^.]+$/,'')||'image')+'.webp',{type:b.type}))
},'image/webp',0.92)
}}},'Apply')
const d=dialog(title,h('div',{class:'bd',style:{display:'flex',flexDirection:'column',alignItems:'center',gap:'12px'}},cv,zr,h('div',{class:'hint',style:{margin:0}},'Drag to move, scroll or use the slider to zoom.')),{onclose:()=>res(null),footer:close=>[h('button',{class:'btn',on:{click:()=>{close();res(null)}}},'Cancel'),h('button',{class:'btn',on:{click:()=>done(file)}},'Use original'),ok]})
draw()
})
}

function pick(accept){
return new Promise(res=>{
const i=h('input',{type:'file',accept,style:{display:'none'}})
i.onchange=()=>res(i.files[0]||null)
i.oncancel=()=>res(null)
document.body.append(i)
i.click()
setTimeout(()=>i.remove(),60000)
})
}

export async function pickCropped(opts){
const f=await pick('image/png,image/jpeg,image/webp,image/gif,image/avif,image/jxl')
if(!f)return null
if(await isAnimated(f)){toast('Animated image kept as is (not cropped)','ok');return f}
return cropDialog(f,opts)
}
