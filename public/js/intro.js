export function playIntro(force){
try{
if(!force){
if(sessionStorage.getItem('intro')||matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.gpu==='0')return
sessionStorage.setItem('intro','1')
}
document.querySelector('.intro')?.remove()
const el=document.createElement('div');el.className='intro'
const glow=document.createElement('div');glow.className='intro-glow'
const im=document.createElement('img');im.src='/mascot.webp';im.alt=''
const wm=document.createElement('div');wm.className='intro-wm';wm.textContent='Parley'
el.append(glow,im,wm);document.body.append(el)
setTimeout(()=>el.remove(),2900)
}catch{}
}
