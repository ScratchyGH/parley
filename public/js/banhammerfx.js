import{toast}from'./util.js'
import{sv,svg}from'./svg.js'
const still=()=>matchMedia('(prefers-reduced-motion:reduce)').matches
export function banhammerHit(uid,by){
toast(by+' swung the ban hammer',undefined)
const els=[...document.querySelectorAll('.av[data-uid="'+uid+'"]')]
if(!els.length||still())return
for(const el of els)playOn(el)
}
function hammerSvg(){
return svg(34,'0 0 40 40',
sv('rect',{x:'4',y:'22',width:'10',height:'14',rx:'2',fill:'#8a5a2b'}),
sv('rect',{x:'2',y:'4',width:'36',height:'16',rx:'3',fill:'#9ca3af',stroke:'#4b5563','stroke-width':'1.5'}),
sv('text',{x:'20',y:'15','font-size':'8','font-weight':'700','text-anchor':'middle',fill:'#1f2937'},'BAN'))
}
function crackSvg(){
return svg('100%','0 0 100 100',
sv('g',{stroke:'#fff','stroke-width':'2.2',fill:'none',opacity:'.9'},
sv('path',{d:'M50,50L20,10M50,50L85,18M50,50L8,60M50,50L40,95M50,50L90,70M50,50L70,92'})))
}
function xSvg(){
return svg('60%','0 0 40 40',
sv('path',{d:'M8,8L32,32M32,8L8,32',stroke:'#ef4444','stroke-width':'6','stroke-linecap':'round'}))
}
function cakeSvg(){
return svg(40,'0 0 40 40',
sv('rect',{x:'5',y:'22',width:'30',height:'13',rx:'2',fill:'#f8e3c4',stroke:'#7a4a1f','stroke-width':'1.4'}),
sv('rect',{x:'5',y:'22',width:'30',height:'5',fill:'#fff'}),
sv('rect',{x:'9',y:'14',width:'22',height:'9',rx:'2',fill:'#fbcfe8',stroke:'#7a4a1f','stroke-width':'1.2'}),
sv('rect',{x:'17',y:'4',width:'3',height:'10',fill:'#fde68a'}),
sv('circle',{cx:'18.5',cy:'3',r:'2.6',fill:'#f97316'}))
}
export function birthdayCake(uid,by){
toast(by+' slammed a birthday cake into your profile',undefined)
const els=[...document.querySelectorAll('.av[data-uid="'+uid+'"]')]
if(!els.length||still())return
for(const el of els)playCakeOn(el)
}
function playCakeOn(host){
import('./cakefx.js').then(m=>m.throwCake(host))
}
function playOn(host){
const r=host.getBoundingClientRect()
if(r.width<8)return
const wrap=document.createElement('div')
wrap.style.cssText='position:fixed;left:'+r.left+'px;top:'+r.top+'px;width:'+r.width+'px;height:'+r.height+'px;z-index:2147483000;pointer-events:none'
const hammer=document.createElement('div')
hammer.style.cssText='position:absolute;left:50%;top:-60px;width:34px;height:34px;transform:translate(-50%,0) rotate(-35deg);transform-origin:70% 90%'
hammer.append(hammerSvg())
const crack=document.createElement('div')
crack.style.cssText='position:absolute;inset:0;opacity:0'
crack.append(crackSvg())
const x=document.createElement('div')
x.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0'
x.append(xSvg())
wrap.append(hammer,crack,x)
document.body.append(wrap)
host.animate([{transform:'none'},{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'none'}],{duration:260,delay:420})
hammer.animate([{transform:'translate(-50%,0) rotate(-35deg)'},{transform:'translate(-50%,'+(r.height*.55)+'px) rotate(10deg)'},{transform:'translate(-50%,'+(r.height*.1)+'px) rotate(-20deg)'},{transform:'translate(-50%,-60px) rotate(-35deg)',opacity:0}],{duration:900,easing:'cubic-bezier(.3,.9,.4,1)'})
setTimeout(()=>{crack.style.opacity=1;crack.animate([{opacity:0},{opacity:1},{opacity:0}],{duration:650})},400)
setTimeout(()=>{x.style.opacity=1;x.animate([{opacity:0,transform:'scale(.5)'},{opacity:1,transform:'scale(1)'}],{duration:300,fill:'forwards'})},760)
setTimeout(()=>wrap.remove(),2600)
}
