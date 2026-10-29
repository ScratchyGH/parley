import{toast}from'./util.js'
import{sv,svg}from'./svg.js'
const still=()=>matchMedia('(prefers-reduced-motion:reduce)').matches
export function banhammerHit(uid,by){
toast(by+' swung the ban hammer',undefined)
const els=[...document.querySelectorAll('.av[data-uid="'+uid+'"]')]
if(!els.length||still())return
for(const el of els)playOn(el)
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
function face(w,h,t,bg,css){
const f=document.createElement('div')
f.style.cssText='position:absolute;left:'+(-w/2)+'px;top:'+(-h/2)+'px;width:'+w+'px;height:'+h+'px;background:'+bg+';display:flex;align-items:center;justify-content:center;backface-visibility:hidden;'+css
if(t){f.textContent=t;f.style.font='900 '+Math.round(h*.62)+'px/1 Impact,Arial Black,sans-serif';f.style.color='#111827';f.style.textShadow='0 1px 0 rgba(255,255,255,.55)';f.style.letterSpacing='2px'}
return f
}
function cuboid(w,h,d,bgs,t){
const c=document.createElement('div')
c.style.cssText='position:absolute;left:0;top:0;transform-style:preserve-3d'
c.append(
face(w,h,t,bgs[0],'transform:translateZ('+d/2+'px)'),
face(w,h,t,bgs[1],'transform:rotateY(180deg) translateZ('+d/2+'px)'),
face(d,h,t,bgs[2],'transform:rotateY(90deg) translateZ('+w/2+'px)'),
face(d,h,t,bgs[2],'transform:rotateY(-90deg) translateZ('+w/2+'px)'),
face(w,d,t,bgs[3],'transform:rotateX(90deg) translateZ('+h/2+'px)'),
face(w,d,null,bgs[4],'transform:rotateX(-90deg) translateZ('+h/2+'px)'))
return c
}
function hammer3d(k){
const hm=document.createElement('div')
hm.style.cssText='position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d'
const steel='linear-gradient(135deg,#e5e7eb,#9ca3af 45%,#6b7280)'
const dark='linear-gradient(135deg,#9ca3af,#4b5563)'
const wood='linear-gradient(90deg,#b7793a,#8a5a2b 50%,#6b4423)'
const head=cuboid(78*k,38*k,38*k,[steel,steel,dark,'linear-gradient(135deg,#f3f4f6,#cbd5e1)',dark],'BAN')
const band=cuboid(86*k,10*k,42*k,['#374151','#374151','#1f2937','#4b5563','#1f2937'])
band.style.transform="none"
const hand=cuboid(13*k,120*k,13*k,[wood,wood,'#6b4423','#c98d4b','#5a3a1c'])
hand.style.transform='translateY('+(-78*k)+'px)'
const cap=cuboid(17*k,12*k,17*k,['#7f1d1d','#7f1d1d','#450a0a','#b91c1c','#450a0a'])
cap.style.transform='translateY('+(-140*k)+'px)'
hm.append(hand,head,band,cap)
return hm
}
function playOn(host){
const r=host.getBoundingClientRect()
if(r.width<8)return
const k=Math.max(.9,Math.min(2.4,r.width/46))
const wrap=document.createElement('div')
wrap.style.cssText='position:fixed;left:'+r.left+'px;top:'+r.top+'px;width:'+r.width+'px;height:'+r.height+'px;z-index:2147483000;pointer-events:none;perspective:'+Math.round(700*k)+'px'
const hm=hammer3d(k)
const T=(y,z,yy,x)=>'translate3d('+(y)+'px,'+(yy)+'px,0) rotateX('+x+'deg) rotateY(-28deg) rotateZ('+z+'deg)'
hm.style.transform=T(60*k,40,-260*k,12)
const crack=document.createElement('div')
crack.style.cssText='position:absolute;inset:0;opacity:0;filter:drop-shadow(0 0 3px #000)'
crack.append(crackSvg())
const ring=document.createElement('div')
ring.style.cssText='position:absolute;inset:0;border-radius:50%;border:3px solid #fff;opacity:0'
const x=document.createElement('div')
x.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0'
x.append(xSvg())
wrap.append(ring,crack,hm,x)
document.body.append(wrap)
hm.animate([
{transform:T(60*k,40,-260*k,12),offset:0},
{transform:T(70*k,62,-300*k,18),offset:.3},
{transform:T(0,-6,-r.height*.05,2),offset:.5},
{transform:T(4*k,-2,-r.height*.05,2),offset:.62},
{transform:T(-30*k,18,-220*k,14),opacity:0,offset:1}],{duration:1300,easing:'cubic-bezier(.5,0,.6,1)',fill:'forwards'})
host.animate([{transform:'none'},{transform:'translate(-5px,3px) rotate(-3deg)'},{transform:'translate(5px,-3px) rotate(3deg)'},{transform:'none'}],{duration:320,delay:640})
setTimeout(()=>{ring.animate([{opacity:.9,transform:'scale(.6)'},{opacity:0,transform:'scale(2.2)'}],{duration:520,fill:'forwards'});crack.style.opacity=1;crack.animate([{opacity:0},{opacity:1},{opacity:1},{opacity:.35}],{duration:900,fill:'forwards'})},640)
setTimeout(()=>{x.style.opacity=1;x.animate([{opacity:0,transform:'scale(.4) rotate(-20deg)'},{opacity:1,transform:'scale(1) rotate(0)'}],{duration:320,fill:'forwards'})},1500)
setTimeout(()=>wrap.remove(),3400)
}
