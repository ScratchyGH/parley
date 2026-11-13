let el=null,tm=0
export function playIntro(force){
try{
document.querySelector('.intro')?.remove()
el=document.createElement('div');el.className='intro'
const img=document.createElement('img');img.className='intro-logo';img.src='/logo-192.png';img.alt='';img.draggable=false
const wm=document.createElement('div');wm.className='intro-wm'
'Parley'.split('').forEach((ch,i)=>{const s=document.createElement('span');s.textContent=ch;s.style.animationDelay=(.25+i*.06)+'s';wm.append(s)})
const ln=document.createElement('i');ln.className='intro-ln'
el.append(img,wm,ln);document.body.append(el)
tm=setTimeout(endLoading,force?1200:10000)
}catch{}
}
export function endLoading(){
clearTimeout(tm)
const e=el;el=null
if(!e)return
e.classList.add('out')
setTimeout(()=>e.remove(),300)
}
