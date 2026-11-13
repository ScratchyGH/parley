let el=null,tm=0
const TIPS=['Message a friend twice a day to build a streak','Press Ctrl+K to jump anywhere fast','Drag servers to reorder them','Right click a message for quick actions','Pars unlock frames, nameplates and effects','Free voice, video and screen share. No ads']
export function playIntro(force){
try{
document.querySelector('.intro')?.remove()
el=document.createElement('div');el.className='intro'
const logo=document.createElement('div');logo.className='intro-logo'
const img=document.createElement('img');img.src='/logo-192.png';img.alt='';img.draggable=false
const ring=document.createElement('i');ring.className='intro-ring'
logo.append(ring,img)
const wm=document.createElement('div');wm.className='intro-wm';wm.textContent='Parley'
const dots=document.createElement('div');dots.className='intro-dots'
for(let i=0;i<3;i++)dots.append(document.createElement('i'))
const bar=document.createElement('div');bar.className='intro-bar';bar.append(document.createElement('i'))
const tip=document.createElement('div');tip.className='intro-tip';tip.textContent=TIPS[Math.floor(Math.random()*TIPS.length)]
el.append(logo,wm,dots,bar,tip);document.body.append(el)
tm=setTimeout(endLoading,force?1200:10000)
}catch{}
}
export function endLoading(){
clearTimeout(tm)
const e=el;el=null
if(!e)return
e.classList.add('out')
setTimeout(()=>e.remove(),400)
}
