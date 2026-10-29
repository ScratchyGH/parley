const ua=navigator.userAgent
const ios=/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)
const android=/Android/.test(ua)
const win=/Windows/.test(ua)
const mac=!ios&&/Mac/.test(ua)
const p=ios?'ios':android?'android':win?'win':mac?'mac':'linux'
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone
try{if(standalone){location.replace('/')}}catch{}
document.querySelector('[data-p="'+p+'"]')?.classList.add('me')
const go=document.getElementById('go'),steps=document.getElementById('steps'),note=document.getElementById('note'),web=document.getElementById('web')
web.addEventListener('click',()=>{try{localStorage.setItem('parley.web','1')}catch{}})
let dp=null
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e})
window.addEventListener('appinstalled',()=>{note.textContent='Installed. Open Parley from your apps.';steps.hidden=true})
function show(list){steps.hidden=false;steps.replaceChildren();const ol=document.createElement('ol');for(const s of list){const li=document.createElement('li');const parts=s.split('|');li.append(parts[0]);if(parts[1]){const b=document.createElement('b');b.textContent=parts[1];li.append(b);if(parts[2])li.append(parts[2])}ol.append(li)}steps.append(ol);steps.scrollIntoView({behavior:'smooth',block:'center'})}
if(ios){go.textContent='Add to Home Screen';note.textContent=/CriOS|FxiOS|EdgiOS/.test(ua)?'Open this page in Safari to install on iPhone.':'iPhone and iPad install from Safari.'}
go.addEventListener('click',async()=>{
if(ios){show(['Tap the |Share| button in Safari.','Scroll and tap |Add to Home Screen|.','Tap |Add|. Parley now sits on your home screen like any app.']);return}
if(dp){dp.prompt();try{await dp.userChoice}catch{}dp=null;return}
if(android)show(['Open the browser menu.','Tap |Install app| or |Add to Home screen|.','Tap |Install|.'])
else if(mac)show(['In Chrome or Edge, click the install icon in the address bar, or open the menu and choose |Install Parley|.','In Safari, choose |File| then |Add to Dock|.'])
else show(['Click the install icon at the right of the address bar, or open the menu and choose |Install Parley|.','Parley opens in its own window with its own icon.'])
})
