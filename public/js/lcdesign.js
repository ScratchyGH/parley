import{h,icon,toast,upload,dialog,coverBg,previewFile}from'./util.js'
import{lcDraw,DEFD,FONTS,encDesign,decDesign}from'./lcard.js'
const SAMPLE={name:'Your name',level:7,cur:120,max:350,rank:3}
const NAMES={n:'Name',l:'Level',x:'XP text',k:'Rank',a:'Picture',b:'Level bar'}
const clone=o=>JSON.parse(JSON.stringify(o))
const r1=v=>Math.round(v*10)/10
const cl=(v,a,b)=>Math.max(a,Math.min(b,v))
export function openCardDesigner({design,bgid,onSave}){
let D=Object.assign(clone(DEFD),decDesign(design)||{})
let bg=bgid||'',sel='n'
const stage=h('div',{class:'lcard lcd lcd-edit'})
const chips=h('div',{class:'lcd-chips'})
const panel=h('div',{class:'lcd-panel'})
let els={}
const rotOf=k=>k==='b'?4:3
function paintBg(){
stage.querySelector('.lc-ban')?.remove()
const b=h('div',{class:'lc-ban'}),dim=D.d/100
if(bg)coverBg(b,bg,'linear-gradient(rgba(10,10,16,'+dim+'),rgba(10,10,16,'+dim+'))')
else b.style.background='linear-gradient(135deg,#3a2f6b,#171720)'
stage.prepend(b)
}
function draw(){
for(const e of[...stage.children])e.remove()
stage.classList.remove('lcd')
paintBg()
els=lcDraw(stage,D,SAMPLE,{edit:true,avatar:()=>h('div',{class:'lcd-dummy'},'A')})
for(const[k,el]of Object.entries(els)){
el.addEventListener('pointerdown',e=>drag(e,k))
}
mark()
}
function mark(){
for(const[k,el]of Object.entries(els)){
el.classList.toggle('lcd-sel',k===sel)
el.querySelectorAll('.lcd-hd').forEach(x=>x.remove())
}
const el=els[sel]
if(el){
el.append(h('i',{class:'lcd-hd lcd-rot',title:'Rotate',on:{pointerdown:e=>rotate(e)}}),h('i',{class:'lcd-hd lcd-rs',title:'Resize',on:{pointerdown:e=>resize(e)}}))
}
for(const c of chips.children)c.classList.toggle('on',c.dataset.k===sel)
}
function sw(){return stage.getBoundingClientRect().width}
function follow(move,end){
const mv=e=>{e.preventDefault();move(e)}
const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);if(end)end()}
addEventListener('pointermove',mv,{passive:false});addEventListener('pointerup',up);addEventListener('pointercancel',up)
}
function drag(e,k){
if(e.target.classList.contains('lcd-hd'))return
e.preventDefault()
const first=sel!==k
sel=k;mark();panelDraw()
const a=D[k],x0=a[0],y0=a[1],px=e.clientX,py=e.clientY,rc=stage.getBoundingClientRect()
follow(ev=>{
a[0]=r1(cl(x0+(ev.clientX-px)/rc.width*100,-10,105))
a[1]=r1(cl(y0+(ev.clientY-py)/rc.height*100,-10,105))
els[k].style.left=a[0]+'%';els[k].style.top=a[1]+'%'
},()=>{if(first)panelDraw()})
}
function rotate(e){
e.preventDefault();e.stopPropagation()
const k=sel,el=els[k],rc=el.getBoundingClientRect(),cx=rc.left+rc.width/2,cy=rc.top+rc.height/2,i=rotOf(k)
follow(ev=>{
let ang=Math.atan2(ev.clientY-cy,ev.clientX-cx)*180/Math.PI+90
if(ang>180)ang-=360
if(!ev.altKey)ang=Math.round(ang/5)*5
D[k][i]=r1(ang)
el.style.transform='rotate('+D[k][i]+'deg)'
},panelDraw)
}
function resize(e){
e.preventDefault();e.stopPropagation()
const k=sel,a=D[k],px=e.clientX,py=e.clientY,w=sw(),s0=a[2],h0=a[3]
follow(ev=>{
const dx=(ev.clientX-px)/w
if(k==='b'){a[2]=r1(cl(s0+dx*100,5,100));a[3]=r1(cl(h0+(ev.clientY-py)/w*420,2,60))}
else a[2]=r1(cl(s0+dx*420,k==='a'?16:6,k==='a'?220:120))
draw()
},panelDraw)
}
const rng=(label,min,max,get,set,step=1)=>{
const num=h('b',null,String(get()))
const inp=h('input',{type:'range',min:String(min),max:String(max),step:String(step),value:String(get()),'aria-label':label,on:{input:e=>{const v=Number(e.target.value);set(v);num.textContent=String(v);draw()}}})
return h('label',{class:'lcd-r'},h('span',null,label,num),inp)
}
const col=(label,get,set)=>h('label',{class:'lcd-c'},h('span',null,label),h('input',{type:'color',value:'#'+(get()||'ffffff'),'aria-label':label,on:{input:e=>{set(e.target.value.slice(1));draw()}}}))
function panelDraw(){
const a=D[sel],kids=[]
kids.push(h('label',{class:'bk-check'},h('input',{type:'checkbox',checked:!a[6],on:{change:e=>{a[6]=e.target.checked?0:1;draw();panelDraw()}}}),'Show '+NAMES[sel].toLowerCase()))
if(sel==='n'||sel==='l'||sel==='x'||sel==='k'){
kids.push(h('label',{class:'bk-f'},h('span',null,'Font'),h('select',{class:'inp','aria-label':'Font',on:{change:e=>{const bold=a[4]>=10;a[4]=Number(e.target.value)+(bold?10:0);draw()}}},FONTS.map(([t],i)=>h('option',{value:String(i),selected:a[4]%10===i},t)))))
kids.push(h('label',{class:'bk-check'},h('input',{type:'checkbox',checked:a[4]>=10,on:{change:e=>{a[4]=a[4]%10+(e.target.checked?10:0);draw()}}}),'Bold'))
kids.push(rng('Size',6,60,()=>a[2],v=>{a[2]=v}),rng('Rotate',-180,180,()=>a[3],v=>{a[3]=v}),col('Color',()=>a[5],v=>{a[5]=v}))
}else if(sel==='a'){
kids.push(h('label',{class:'bk-f'},h('span',null,'Shape'),h('select',{class:'inp','aria-label':'Shape',on:{change:e=>{a[4]=Number(e.target.value);draw()}}},[['Circle',0],['Rounded square',1],['Glowing ring',2]].map(([t,v])=>h('option',{value:String(v),selected:a[4]===v},t)))))
kids.push(rng('Size',24,160,()=>a[2],v=>{a[2]=v}),rng('Rotate',-180,180,()=>a[3],v=>{a[3]=v}),col('Ring color',()=>a[5],v=>{a[5]=v}))
}else{
kids.push(rng('Width',10,100,()=>a[2],v=>{a[2]=v}),rng('Height',2,40,()=>a[3],v=>{a[3]=v}),rng('Corners',0,20,()=>a[8],v=>{a[8]=v}),rng('Rotate',-180,180,()=>a[4],v=>{a[4]=v}),col('Fill color',()=>a[5],v=>{a[5]=v}),col('Empty color',()=>a[7],v=>{a[7]=v}))
}
panel.replaceChildren(...kids)
}
const file=h('input',{type:'file',accept:'image/png,image/jpeg,image/webp,image/gif',class:'lcd-file',on:{change:async e=>{
const f=e.target.files[0];e.target.value=''
if(!f||!await previewFile(f,'Use this picture'))return
try{const d=await upload(f,{kind:'banner'});bg=d.id;draw();toast('Picture added','ok')}catch(er){toast(er.message||'Upload failed','err')}
}}})
const bgRow=h('div',{class:'lcd-bg'},
h('button',{class:'btn sm',type:'button',on:{click:()=>file.click()}},icon('plus','s'),bg?'Change picture':'Add background picture'),
h('button',{class:'btn sm',type:'button',on:{click:()=>{bg='';draw()}}},'Remove picture'),
rng('Darken picture',0,90,()=>D.d,v=>{D.d=v}),file)
for(const k of Object.keys(NAMES))chips.append(h('button',{class:'lcd-chip',type:'button','data-k':k,on:{click:()=>{sel=k;mark();panelDraw()}}},NAMES[k]))
const body=h('div',{class:'lcd-wrap'},
h('p',{class:'hint'},'Drag anything to move it. Drag the round handle above it to rotate and the corner to resize. Hold Alt for fine rotation.'),
stage,chips,panel,bgRow)
const dlg=dialog('Design level card',body,{cls:'lcd-dlg',sticky:true,footer:close=>[
h('button',{class:'btn',type:'button',on:{click:()=>{D=clone(DEFD);bg='';sel='n';draw();panelDraw()}}},'Reset layout'),
h('button',{class:'btn',type:'button',on:{click:close}},'Cancel'),
h('button',{class:'btn pri',type:'button',on:{click:()=>{onSave({design:encDesign(D),bgid:bg});close();toast('Card design saved to the block','ok')}}},'Save design')]})
draw();panelDraw()
return dlg
}
