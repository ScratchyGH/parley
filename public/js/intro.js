let el=null
export function playIntro(force){
try{
document.querySelector('.intro')?.remove()
el=document.createElement('div');el.className='intro'
const wm=document.createElement('div');wm.className='intro-wm';wm.textContent='Parley'
const sp=document.createElement('div');sp.className='intro-spin'
el.append(wm,sp);document.body.append(el)
setTimeout(endLoading,force?1200:10000)
}catch{}
}
export function endLoading(){
const e=el;el=null
if(!e)return
e.classList.add('out')
setTimeout(()=>e.remove(),300)
}
