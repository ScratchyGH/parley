import{h,POST,toast}from'./util.js'
import{S}from'./state.js'
import{sv,svg}from'./svg.js'
const art=()=>svg(96,'0 0 96 96',
sv('path',{d:'M22 52C6 44 4 22 14 12c4 10 10 14 18 14-6-10-4-18 2-22 4 10 10 14 16 16-2-8 2-14 8-16 2 8 6 12 12 14 10 8 12 24 4 34z',fill:'#b4531c',stroke:'#4a1d08','stroke-width':'3','stroke-linejoin':'round'}),
sv('ellipse',{cx:'50',cy:'60',rx:'26',ry:'22',fill:'#8a4a22',stroke:'#4a1d08','stroke-width':'3'}),
sv('path',{d:'M66 58c10-6 18-18 14-30-6-4-12 2-12 8 0 8-2 14-8 18z',fill:'#8a4a22',stroke:'#4a1d08','stroke-width':'3','stroke-linejoin':'round'}),
sv('circle',{cx:'78',cy:'28',r:'9',fill:'#a35a2a',stroke:'#4a1d08','stroke-width':'3'}),
sv('circle',{cx:'81',cy:'26',r:'2.4',fill:'#fff'}),sv('circle',{cx:'82',cy:'26',r:'1.2',fill:'#111'}),
sv('path',{d:'M86 30l9 3-9 4z',fill:'#f0b429',stroke:'#4a1d08','stroke-width':'2','stroke-linejoin':'round'}),
sv('path',{d:'M84 38c2 8 0 12-4 14-2-6-2-10 0-14z',fill:'#d6362b',stroke:'#4a1d08','stroke-width':'2'}),
sv('path',{d:'M40 82v10M58 82v10M34 92h12M52 92h12',stroke:'#f0b429','stroke-width':'4','stroke-linecap':'round'}))
let busy=false
export function runTurkey(tok,ms){
if(busy)return
busy=true
const t=h('button',{class:'tk-run','aria-label':'Catch the turkey'},art())
const y=12+Math.random()*60
t.style.setProperty('--y',y+'vh')
t.style.setProperty('--d',Math.max(4,Math.min(8,ms/1000/1.6))+'s')
if(Math.random()<.5)t.classList.add('l')
let done=false
const end=()=>{if(t.isConnected)t.remove();busy=false}
t.addEventListener('animationend',e=>{if(e.animationName==='tkrun'||e.animationName==='tkrunl')end()})
t.addEventListener('click',async()=>{
if(done)return
done=true
t.classList.add('caught')
try{const d=await POST('/api/turkey/catch',{tok});toast('Gotcha! +'+d.earned+' Pars','ok');if(S.me)S.me.pars=(S.me.pars||0)+d.earned}catch(e){toast(e.message||'It got away','err')}
setTimeout(end,500)
})
document.body.append(t)
}
async function roll(){
if(document.hidden||!S.me)return
try{const d=await POST('/api/turkey/roll',{});if(d.spawn)runTurkey(d.tok,d.ms)}catch{}
}
export function turkeyBoot(){
setInterval(roll,120000)
}
