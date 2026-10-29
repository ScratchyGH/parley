import{h,toast}from'./util.js'
export function gameBar(root,name){
const key=()=>dispatchEvent(new KeyboardEvent('keydown',{key:'p',bubbles:true}))
const shot=()=>{
const cs=[...root.querySelectorAll('canvas')].sort((a,b)=>b.width*b.height-a.width*a.height)
const c=cs[0]
if(!c){toast('Nothing to capture','err');return}
requestAnimationFrame(()=>c.toBlob(b=>{
if(!b){toast('Could not capture','err');return}
const u=URL.createObjectURL(b)
const a=document.createElement('a')
a.href=u
a.download=(name||'parley-game')+'-'+Date.now()+'.png'
document.body.append(a)
a.click()
a.remove()
setTimeout(()=>URL.revokeObjectURL(u),4000)
toast('Screenshot saved','ok')
},'image/png'))
}
const fs=()=>{
try{document.fullscreenElement?document.exitFullscreen():root.requestFullscreen?.()}catch{}
}
const bar=h('div',{class:'gbar'},
h('button',{class:'btn sm','aria-label':'Pause or resume',on:{click:key}},'Pause'),
h('button',{class:'btn sm','aria-label':'Save a screenshot',on:{click:shot}},'Screenshot'),
h('button',{class:'btn sm','aria-label':'Toggle fullscreen',on:{click:fs}},'Fullscreen'))
root.append(bar)
}
export const gaming=()=>!!document.querySelector('.hw-game,.gm-game,.itch-fr')
