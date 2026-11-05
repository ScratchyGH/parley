import{h,toast}from'./util.js'
import{sv,svg}from'./svg.js'
import{gameBar}from'./gamebar.js'
function css(){
if(document.getElementById('hwcss2'))return
document.head.append(h('link',{id:'hwcss2',rel:'stylesheet',href:'/hollow.css'}))
}
export const candySvg=size=>svg(size,'0 0 32 32',
sv('path',{d:'M4,9L13,16L4,23Z',fill:'#8b5cf6',stroke:'#2e1065','stroke-width':'1.2','stroke-linejoin':'round'}),
sv('path',{d:'M28,9L19,16L28,23Z',fill:'#8b5cf6',stroke:'#2e1065','stroke-width':'1.2','stroke-linejoin':'round'}),
sv('ellipse',{cx:'16',cy:'16',rx:'9',ry:'7.4',fill:'#f97316',stroke:'#431407','stroke-width':'1.4'}),
sv('path',{d:'M9,13C12,11 20,11 23,13',fill:'none',stroke:'#fed7aa','stroke-width':'1.4','stroke-linecap':'round'}))
function shell(label,cls){
css()
const box=h('div',{class:'hw-gamebox'})
const closeBtn=h('button',{class:'btn sm hw-gx','aria-label':'Leave'},'Leave')
const root=h('div',{class:'hw-game'+cls,role:'dialog','aria-modal':'true','aria-label':label},box,closeBtn)
document.body.append(root)
gameBar(root,'parley')
const st={stop:null,over:false}
const end=()=>{if(st.over)return;st.over=true;try{st.stop?.()}catch{}root.remove()}
closeBtn.addEventListener('click',end)
return{box,st,end}
}
async function startRush(mode){
const{playRush}=await import('/js/rush.js')
const s=shell(mode==='terror'?'Terror Night':'Gourd Rush',' hw-rushg')
s.st.stop=playRush(s.box,r=>{
if(s.st.over)return
toast(r.ok?'You held until dawn.':'You were consumed.')
setTimeout(s.end,900)
},mode)
}
async function startNight(night){
let playNight
try{({playNight}=await import('/g3d/doom3d.js'))}catch(e){toast('Hollow Siege could not load: '+(e.message||e),'err');return}
const s=shell('Hollow Siege','')
try{s.st.stop=playNight(night,s.box,r=>{
if(s.st.over)return
toast(r.ok?'Night '+night+' survived.':'The shift ended.')
setTimeout(s.end,r.ok?1800:700)
})}catch(e){toast('Hollow Siege failed to start: '+(e.message||e),'err');s.end()}
}
export const playLocal=(kind,n)=>kind==='night'?startNight(n):startRush(kind)
