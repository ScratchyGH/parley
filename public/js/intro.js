export function playIntro(force){
try{
if(!force){
if(sessionStorage.getItem('intro')||matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.gpu==='0')return
sessionStorage.setItem('intro','1')
}
document.querySelector('.intro')?.remove()
const el=document.createElement('div');el.className='intro'
const im=document.createElement('img');im.src='/logo-192.png';im.alt=''
el.append(im);document.body.append(el)
setTimeout(()=>el.remove(),2000)
}catch{}
}
