import{h,GET,POST,icon,sleep}from'./util.js'
import{swatch,parIcon}from'./pars.js'
import{candySvg}from'./hollow.js'
import{hwOn}from'./halloween.js'
let busy=false
let cssOn=false
const loadCss=()=>{if(cssOn)return;cssOn=true;document.head.append(h('link',{rel:'stylesheet',href:'/pumpkin.css'}))}
const shown=new Set()
const reduce=()=>matchMedia('(prefers-reduced-motion:reduce)').matches
const face=(cls,t)=>h('div',{class:'gx-f '+cls,style:{transform:t}})
function box(){
const s=70,faces=[['gx-side','rotateY(0deg) translateZ('+s+'px)'],['gx-side','rotateY(90deg) translateZ('+s+'px)'],['gx-side','rotateY(180deg) translateZ('+s+'px)'],['gx-side','rotateY(-90deg) translateZ('+s+'px)'],['gx-bot','rotateX(-90deg) translateZ('+s+'px)'],['gx-in','rotateX(90deg) translateZ(62px)']]
return h('div',{class:'gx-box'},...faces.map(([c,t])=>face(c,t)))
}
function lid(){
const w=78,hh=22,faces=[['gx-lside','rotateY(0deg) translateZ('+w+'px)'],['gx-lside','rotateY(90deg) translateZ('+w+'px)'],['gx-lside','rotateY(180deg) translateZ('+w+'px)'],['gx-lside','rotateY(-90deg) translateZ('+w+'px)'],['gx-ltop','rotateX(90deg) translateZ('+hh+'px)'],['gx-lbot','rotateX(-90deg) translateZ('+hh+'px)']]
return h('div',{class:'gx-lid'},...faces.map(([c,t])=>face(c,t)),h('div',{class:'gx-bow'},h('i'),h('i'),h('b')))
}
function ribs(){
return Array.from({length:8},(_,i)=>face('gx-rib','rotateY('+i*22.5+'deg)'))
}
function pumpkin(){
return h('div',{class:'gx-box gx-pk'},...ribs(),h('div',{class:'gx-face',style:{transform:'translateZ(77px)'}},h('i',{class:'gx-eye'}),h('i',{class:'gx-eye r'}),h('i',{class:'gx-nose'}),h('i',{class:'gx-mouth'})))
}
function stem(){
const ps=[0,45,90,135].map(a=>face('gx-stm','rotateY('+a+'deg)'))
return h('div',{class:'gx-lid gx-stemw'},...ps,face('gx-leaf','translate3d(10px,26px,0) rotateZ(-30deg)'))
}
function item(g){
if(g.kind==='candy')return h('div',{class:'gx-item'},h('div',{class:'gx-cd'},candySvg(84)),h('b',null,g.label))
if(g.kind==='pars')return h('div',{class:'gx-item'},parIcon(64),h('b',null,g.label))
if(g.kind==='bundle')return h('div',{class:'gx-item'},h('div',{class:'gx-big'},icon('gift')),h('b',null,g.label))
const sw=swatch({kind:g.kind,id:g.item_id,name:g.label,mb:0})
return h('div',{class:'gx-item'},sw?h('div',{class:'gx-sw'},sw):h('div',{class:'gx-big'},icon('gift')),h('b',null,g.label))
}
function play(g){
return new Promise(done=>{
const root=h('div',{class:'gx',role:'dialog','aria-label':'You received a gift'})
const title=h('div',{class:'gx-t'},h('b',null,g.from_name),' sent you a gift')
const it=item(g)
const hw=hwOn()
if(hw)loadCss()
const L=hw?stem():lid(),B=hw?pumpkin():box()
const stage=h('div',{class:'gx-stage'},h('div',{class:'gx-shadow'}),h('div',{class:'gx-3d'},B,L),it)
const ok=h('button',{class:'btn pri gx-ok',on:{click:()=>{root.classList.add('gx-out');setTimeout(()=>{root.remove();done()},350)}}},'Nice!')
if(hw)root.classList.add('gx-hw')
root.append(h('div',{class:'gx-glow'}),title,stage,ok)
document.body.append(root)
if(reduce()){root.classList.add('gx-still');root.insertBefore(it,ok);return}
const three=stage.querySelector('.gx-3d')
let gl=false
if(hw){
const view=h('div',{class:'gx-view'})
stage.insertBefore(view,stage.firstChild)
gl=true
import('/g3d/gift3d.js').then(m=>{
const stop=m.carve(view,{onOpen:()=>root.classList.add('gx-pop','gx-rise')})
const w=setInterval(()=>{if(!root.isConnected){clearInterval(w);stop()}},400)
}).catch(()=>{gl=false;view.remove();start()})
}
let t0=performance.now()
const st={lid:{x:0,y:0,z:0,vx:0,vy:0,rx:0,ry:0,rz:0,vrx:0,vry:0,vrz:0},box:{y:0,vy:0,rz:0,vrz:0},free:false,gone:false,item:0}
const floor=150
const setLid=()=>{const l=st.lid;L.style.transform=`translate3d(${l.x}px,${-92+l.y}px,${l.z}px) rotateX(${l.rx}deg) rotateY(${l.ry}deg) rotateZ(${l.rz}deg)`}
const setBox=()=>{three.style.setProperty('--by',st.box.y+'px');three.style.setProperty('--bz',st.box.rz+'deg')}
setLid()
let last=0,phase='drop',pt=0
const frame=now=>{
if(!root.isConnected){done();return}
const dt=Math.min(.033,(now-last)/1000);last=now;pt+=dt
const l=st.lid
if(phase==='drop'&&pt>0.9){phase='shake';pt=0;root.classList.remove('gx-drop')}
if(phase==='shake'){
const k=Math.min(1,pt/1.5),a=Math.sin(pt*58)*(2+k*9)
l.x=Math.sin(pt*47)*(1+k*5);l.rz=a*.5;l.y=-Math.abs(Math.sin(pt*30))*k*10
B.style.transform=`translateX(${Math.sin(pt*53)*k*3}px) rotateZ(${Math.sin(pt*41)*k*1.5}deg)`
if(pt>1.7){phase='pop';pt=0;l.vy=-560;l.vx=170;l.z=40;l.vrz=360;l.vry=240;l.vrx=140;B.style.transform='';root.classList.add('gx-pop')}
}
if(phase==='pop'||phase==='rest'||phase==='fall'){
l.vy+=1500*dt;l.x+=l.vx*dt;l.y+=l.vy*dt;l.rx+=l.vrx*dt;l.ry+=l.vry*dt;l.rz+=l.vrz*dt
if(phase!=='fall'&&l.y>140){l.y=140;if(Math.abs(l.vy)>140){l.vy*=-.42;l.vx*=.72;l.vrx*=.5;l.vry*=.5;l.vrz*=.55}else{l.vy=0;l.vx*=.9;l.vrx*=.8;l.vry*=.8;l.vrz*=.8}}
if(phase!=='fall'&&l.y>=140&&Math.abs(l.vx)<6&&Math.abs(l.vrz)<8){l.vx=0;l.vrz=0;l.vrx=0;l.vry=0;l.rx=Math.round(l.rx/90)*90;l.ry=Math.round(l.ry/90)*90;l.rz=Math.round(l.rz/90)*90;if(phase==='pop'){phase='rest';pt=0}}
}
if(phase==='pop'&&pt>.25&&!st.item){st.item=1;root.classList.add('gx-rise')}
if(phase==='rest'&&pt>3.2){phase='fall';pt=0;root.classList.add('gx-fall');st.box.vy=0}
if(phase==='fall'){st.box.vy+=1900*dt;st.box.y+=st.box.vy*dt;st.box.vrz+=40*dt;st.box.rz+=st.box.vrz*dt;if(st.box.y>900){phase='end';root.classList.add('gx-end')}}
setLid();setBox()
if(phase!=='end'||pt<9999)requestAnimationFrame(frame)
else done()
}
const start=()=>{last=performance.now();root.classList.add('gx-drop');requestAnimationFrame(frame)}
if(!gl)start()
})
}
async function run(){
if(busy)return
busy=true
try{
for(let n=0;n<10;n++){
let r
try{r=await GET('/api/pars/gifts')}catch{break}
const list=(r.gifts||[]).filter(g=>!shown.has(g.id))
if(!list.length)break
for(const g of list){
shown.add(g.id)
try{await play(g)}catch(e){document.querySelectorAll('.gx').forEach(x=>x.remove())}
try{await POST('/api/pars/gifts/seen',{ids:[g.id]})}catch{}
await sleep(250)
}
}
}finally{busy=false}
}
let started=false
export function checkGifts(){
setTimeout(run,300)
if(started)return
started=true
setInterval(run,45000)
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(run,300)})
addEventListener('focus',()=>setTimeout(run,300))
addEventListener('online',()=>setTimeout(run,1000))
}
export{play as previewGift}
