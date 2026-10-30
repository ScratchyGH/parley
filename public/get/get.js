const APP='https://parley.heavengtwashere.workers.dev'
const ua=navigator.userAgent
const ios=/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)
const android=/Android/.test(ua)
const win=/Windows/.test(ua)
const mac=!ios&&/Mac/.test(ua)
const ut=/Ubuntu/.test(ua)&&/Mobile|Tablet/.test(ua)
const p=ut?'ut':ios?'ios':android?'android':win?'win':mac?'mac':'linux'
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone
try{if(standalone&&location.origin===APP){location.replace('/')}}catch{}
document.querySelector('.tiles [data-p="'+p+'"]')?.classList.add('me')
const go=document.getElementById('go'),steps=document.getElementById('steps'),note=document.getElementById('note'),web=document.getElementById('web')
web.addEventListener('click',()=>{try{localStorage.setItem('parley.web','1')}catch{}})
let dp=null
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e})
window.addEventListener('appinstalled',()=>{note.textContent='Installed. Open Parley from your apps.';steps.hidden=true})
function show(list){steps.hidden=false;steps.replaceChildren();const ol=document.createElement('ol');for(const s of list){const li=document.createElement('li');const parts=s.split('|');li.append(parts[0]);if(parts[1]){const b=document.createElement('b');b.textContent=parts[1];li.append(b);if(parts[2])li.append(parts[2])}ol.append(li)}steps.append(ol);steps.scrollIntoView({behavior:'smooth',block:'center'})}
async function install(){
if(location.origin!==APP){location.href=APP+'/get/';return}
if(ios){show(['Tap the |Share| button in Safari.','Scroll and tap |Add to Home Screen|.','Tap |Add|. Parley now sits on your home screen like any app.']);return}
if(dp){dp.prompt();try{await dp.userChoice}catch{}dp=null;return}
if(android)show(['Open the browser menu.','Tap |Install app| or |Add to Home screen|.','Tap |Install|.'])
else if(mac)show(['In Chrome or Edge, click the install icon in the address bar, or open the menu and choose |Install Parley|.','In Safari, choose |File| then |Add to Dock|.'])
else show(['Click the install icon at the right of the address bar, or open the menu and choose |Install Parley|.','Parley opens in its own window with its own icon.'])
}
for(const a of document.querySelectorAll('[data-act]'))a.addEventListener('click',e=>{e.preventDefault();install()})
const names={win:'Windows',mac:'Mac',linux:'Linux',ut:'Ubuntu Touch'}
const key={win:'windows',mac:'mac',linux:'linux',ut:'ubuntutouch'}
if(names[p]){
const a=document.querySelector('[data-dl="'+key[p]+'"]')
go.textContent='Download for '+names[p]
go.href=a?a.href:'#devices'
go.setAttribute('download','')
note.textContent=p==='mac'?'Not signed by Apple. Right-click the app and choose Open the first time.':p==='win'?'Windows may warn that the app is unsigned.':''
}else if(ios){go.textContent='Add to Home Screen';note.textContent=/CriOS|FxiOS|EdgiOS/.test(ua)?'Open this page in Safari to install on iPhone.':'iPhone and iPad install from Safari.'}
else if(android){go.textContent='Install Parley'}
if(ios||android)go.addEventListener('click',e=>{e.preventDefault();install()})
if(location.origin===APP)fetch('/api/app/downloads').then(r=>r.ok?r.json():null).then(d=>{
if(!d)return
const kb=x=>x.size>=1048576?' '+(x.size/1048576).toFixed(0)+' MB':''
for(const a of document.querySelectorAll('[data-dl]')){
const x=d[a.dataset.dl]
if(!x||!x.url)continue
a.href=x.url
if(x.size){const s=document.createElement('small');s.textContent=kb(x).trim();a.append(s)}
}
if(names[p]){const x=d[key[p]];if(x&&x.url)go.href=x.url}
}).catch(()=>{})

const sp=document.getElementById('seg-p'),sk=document.getElementById('seg-k'),kd=document.getElementById('kids'),pt=document.getElementById('pt')
const mode=k=>{sp.setAttribute('aria-pressed',String(!k));sk.setAttribute('aria-pressed',String(k));kd.hidden=!k;pt.hidden=k;steps.hidden=true}
sp.addEventListener('click',()=>mode(false))
sk.addEventListener('click',()=>mode(true))
if(location.hash==='#kids'||new URLSearchParams(location.search).has('kids'))mode(true)
