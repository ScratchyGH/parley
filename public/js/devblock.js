import{h,dialog,toast}from'./util.js'

const KEY='parley.devblock'
const blocked=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
const block=id=>{try{localStorage.setItem(KEY,JSON.stringify([...new Set([...blocked(),id])].slice(-200)))}catch{}}
const TK='parley.devsound'
const SOUND=new Set(['devtone','devspeak','devmelody'])
const trusted=()=>{try{return JSON.parse(localStorage.getItem(TK)||'[]')}catch{return[]}}
const trust=id=>{try{localStorage.setItem(TK,JSON.stringify([...new Set([...trusted(),id])].slice(-200)))}catch{}}
const sid=x=>/^[0-9a-f]{4}$/i.test(x)?parseInt(x,16):String(x).toLowerCase()
const bytes=dv=>[...new Uint8Array(dv.buffer,dv.byteOffset,dv.byteLength)]
const hex=dv=>bytes(dv).map(x=>x.toString(16).padStart(2,'0')).join('')
const NAMES={
devvibrate:a=>'Vibrate your device',
devspeak:a=>'Read this out loud: "'+a.text+'"',
devtone:a=>'Play a short tone',
devflash:a=>'Flash your screen',
devnotify:a=>'Show a notification: "'+a.title+'"',
devcopy:a=>'Copy to your clipboard: "'+a.text.slice(0,80)+'"',
devopen:a=>'Open '+a.url,
devshare:a=>'Open the share sheet',
devwake:a=>'Keep your screen awake for '+a.seconds+' seconds',
devbattery:a=>'Show your device battery level',
devnet:a=>'Show your connection type',
btscan:a=>'Find a nearby Bluetooth device',
btbattery:a=>'Read a Bluetooth device battery',
btheart:a=>'Watch a Bluetooth heart rate band for '+a.seconds+' seconds',
btread:a=>'Read '+a.char+' from a Bluetooth device',
devmorse:a=>'Flash and beep "'+a.text+'" in Morse code',
devmelody:a=>'Play a short melody',
devtimer:a=>'Start a '+a.seconds+' second timer',
devemoji:a=>'Rain '+a.emoji+' across your screen',
devinfo:a=>'Show your device details',
devfull:a=>'Switch full screen on or off',
devrumble:a=>'Rumble your game controller',
btinfo:a=>'Show details of a Bluetooth device',
btnotify:a=>'Watch '+a.char+' on a Bluetooth device for '+a.seconds+' seconds',
btwritetext:a=>'Send "'+a.text+'" to a Bluetooth gadget',
serialsend:a=>'Send "'+a.text+'" to a USB serial device',
serialread:a=>'Read from a USB serial device for '+a.seconds+' seconds',
usbinfo:a=>'Show details of a USB device',
nfcread:a=>'Read an NFC tag for '+a.seconds+' seconds',
nfcwrite:a=>'Write "'+a.text+'" to an NFC tag',
btwrite:a=>'Send '+a.hex+' to a Bluetooth gadget'
}
const pick=async(a,extra)=>{
if(!navigator.bluetooth)throw new Error('Bluetooth is not supported in this browser')
const optionalServices=[...new Set(['battery_service','device_information',...extra].filter(Boolean).map(sid))]
const o=a.prefix?{filters:[{namePrefix:a.prefix}],optionalServices}:{acceptAllDevices:true,optionalServices}
const d=await navigator.bluetooth.requestDevice(o)
return d
}
const chr=async(d,svc,ch)=>{
const g=await d.gatt.connect()
const s=await g.getPrimaryService(sid(svc))
return[g,await s.getCharacteristic(sid(ch))]
}
const RUN={
devvibrate:async a=>{if(!navigator.vibrate)throw new Error('This device cannot vibrate');navigator.vibrate(a.pattern.replace(/\s/g,'').split(',').map(Number).slice(0,8));return'Vibrating'},
devspeak:async a=>{if(!window.speechSynthesis)throw new Error('Speech is not supported');speechSynthesis.speak(new SpeechSynthesisUtterance(a.text.slice(0,300)));return'Speaking'},
devtone:async a=>{
const C=window.AudioContext||window.webkitAudioContext
if(!C)throw new Error('Audio is not supported')
const c=new C(),o=c.createOscillator(),g=c.createGain()
o.frequency.value=Math.max(100,Math.min(2000,Number(a.freq)||440));g.gain.value=.12
o.connect(g);g.connect(c.destination);o.start()
setTimeout(()=>{o.stop();c.close()},Math.max(50,Math.min(2000,Number(a.ms)||400)))
return'Playing a tone'
},
devflash:async a=>{
const c=String(a.color).replace('#','')
if(!/^[0-9a-f]{6}$/i.test(c))throw new Error('Bad color')
const e=h('div',{class:'devflash','aria-hidden':'true'})
e.style.background='#'+c
document.body.append(e)
setTimeout(()=>e.remove(),Math.max(50,Math.min(3000,Number(a.ms)||400)))
return'Flashed the screen'
},
devnotify:async a=>{
if(!window.Notification)throw new Error('Notifications are not supported')
if(Notification.permission!=='granted'&&await Notification.requestPermission()!=='granted')throw new Error('Notifications are blocked for Parley')
new Notification(a.title.slice(0,60),{body:a.body.slice(0,200),icon:'/logo-192.png'})
return'Notification shown'
},
devcopy:async a=>{await navigator.clipboard.writeText(a.text.slice(0,500));return'Copied'},
devopen:async a=>{
if(!/^https:\/\//i.test(a.url))throw new Error('Only https links can open')
window.open(a.url,'_blank','noopener,noreferrer')
return'Opened the link'
},
devshare:async a=>{if(!navigator.share)throw new Error('Sharing is not supported here');await navigator.share({text:a.text.slice(0,300)});return'Shared'},
devwake:async a=>{
if(!navigator.wakeLock)throw new Error('Keeping the screen awake is not supported')
const l=await navigator.wakeLock.request('screen')
setTimeout(()=>l.release().catch(()=>{}),Math.max(1,Math.min(300,Number(a.seconds)||30))*1000)
return'Screen kept awake'
},
devbattery:async()=>{
if(!navigator.getBattery)throw new Error('Battery info is not available here')
const b=await navigator.getBattery()
return'Battery '+Math.round(b.level*100)+'%'+(b.charging?', charging':'')
},
devnet:async()=>{
const c=navigator.connection
if(!c)return navigator.onLine?'Online':'Offline'
return(navigator.onLine?'Online':'Offline')+(c.effectiveType?', '+c.effectiveType:'')+(c.downlink?', about '+c.downlink+' Mbps':'')
},
btscan:async a=>{const d=await pick(a,[]);return'Found '+(d.name||'a device without a name')},
btbattery:async a=>{
const d=await pick(a,['battery_service'])
const[g,c]=await chr(d,'battery_service','battery_level')
const v=await c.readValue()
g.disconnect()
return(d.name||'Device')+' battery '+v.getUint8(0)+'%'
},
btheart:async(a,out)=>{
const d=await pick(a,['heart_rate'])
const[g,c]=await chr(d,'heart_rate','heart_rate_measurement')
await c.startNotifications()
const secs=Math.max(3,Math.min(60,Number(a.seconds)||15))
await new Promise(res=>{
const on=e=>{const dv=e.target.value;out((d.name||'Band')+': '+((dv.getUint8(0)&1)?dv.getUint16(1,true):dv.getUint8(1))+' BPM')}
c.addEventListener('characteristicvaluechanged',on)
setTimeout(()=>{c.removeEventListener('characteristicvaluechanged',on);res()},secs*1000)
})
g.disconnect()
return'Heart rate watch finished'
},
btread:async a=>{
const d=await pick(a,[a.service])
const[g,c]=await chr(d,a.service,a.char)
const v=await c.readValue()
g.disconnect()
const n=v.byteLength
const val=a.as==='text'?new TextDecoder().decode(v):a.as==='number'?String(n===1?v.getUint8(0):n===2?v.getUint16(0,true):n===4?v.getUint32(0,true):hex(v)):hex(v)
return(d.name||'Device')+': '+val
},
btwrite:async a=>{
const x=String(a.hex).replace(/\s/g,'')
if(!/^([0-9a-f]{2}){1,32}$/i.test(x))throw new Error('Bad bytes')
const d=await pick(a,[a.service])
const[g,c]=await chr(d,a.service,a.char)
const b=new Uint8Array(x.match(/../g).map(y=>parseInt(y,16)))
if(c.writeValueWithoutResponse)await c.writeValueWithoutResponse(b);else await c.writeValue(b)
g.disconnect()
return'Sent '+x.toUpperCase()+' to '+(d.name||'the device')
}
}
const MORSE={a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.'}
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const SEMI={C:0,D:2,E:4,F:5,G:7,A:9,B:11}
const ctx=()=>{const C=window.AudioContext||window.webkitAudioContext;if(!C)throw new Error('Audio is not supported');return new C()}
const beep=async(c,f,ms)=>{const o=c.createOscillator(),g=c.createGain();o.frequency.value=f;g.gain.value=.12;o.connect(g);g.connect(c.destination);o.start();await sleep(ms);o.stop()}
const flashEl=()=>{const e=h('div',{class:'devflash','aria-hidden':'true'});e.style.background='#fff';e.style.opacity='0';document.body.append(e);return e}
const scanPort=async(baud)=>{
if(!navigator.serial)throw new Error('USB serial needs Chrome or Edge on a computer')
const p=await navigator.serial.requestPort()
await p.open({baudRate:Number(baud)||9600})
return p
}
RUN.devmorse=async a=>{
const c=ctx(),f=flashEl()
const seq=String(a.text).toLowerCase().slice(0,40).split('')
const t0=Date.now()
try{
for(const ch of seq){
if(Date.now()-t0>25000)break
if(ch===' '){await sleep(480);continue}
for(const sym of MORSE[ch]||''){
f.style.opacity='1'
await beep(c,700,sym==='.'?120:360)
f.style.opacity='0'
await sleep(120)
}
await sleep(240)
}
}finally{f.remove();c.close()}
return'Sent in Morse code'
}
RUN.devmelody=async a=>{
const c=ctx()
try{
for(const n of String(a.notes).trim().split(/\s+/).slice(0,16)){
const m=n.match(/^([A-G])([#b]?)(\d)$/)
if(!m)continue
const midi=12*(Number(m[3])+1)+SEMI[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0)
await beep(c,440*2**((midi-69)/12),300)
await sleep(40)
}
}finally{c.close()}
return'Melody played'
}
RUN.devtimer=async a=>{
const s=Math.max(1,Math.min(3600,Number(a.seconds)||60))
setTimeout(async()=>{
toast(String(a.label||'Timer done').slice(0,60))
try{const c=ctx();await beep(c,880,300);c.close()}catch{}
if(window.Notification&&Notification.permission==='granted')new Notification(String(a.label||'Timer done').slice(0,60),{icon:'/logo-192.png'})
},s*1000)
return'Timer set for '+s+' seconds'
}
RUN.devemoji=async a=>{
const e=String(a.emoji).slice(0,8),n=Math.max(1,Math.min(40,Number(a.count)||20))
for(let i=0;i<n;i++){
const x=h('span',{class:'devemo','aria-hidden':'true'},e)
x.style.left=Math.random()*96+'%'
x.style.animationDelay=Math.random()*1.2+'s'
document.body.append(x)
setTimeout(()=>x.remove(),4200)
}
return'Emoji sent'
}
RUN.devinfo=async()=>[navigator.language,screen.width+'x'+screen.height,'ratio '+window.devicePixelRatio,(navigator.userAgentData&&navigator.userAgentData.platform)||navigator.platform,navigator.hardwareConcurrency?navigator.hardwareConcurrency+' cores':'',navigator.deviceMemory?navigator.deviceMemory+' GB memory':''].filter(Boolean).join(', ')
RUN.devfull=async()=>{if(document.fullscreenElement){await document.exitFullscreen();return'Left full screen'}await document.documentElement.requestFullscreen();return'Full screen on'}
RUN.devrumble=async a=>{
const p=[...(navigator.getGamepads?navigator.getGamepads():[])].find(x=>x&&x.vibrationActuator)
if(!p)throw new Error('No game controller found. Press a button on it first')
await p.vibrationActuator.playEffect('dual-rumble',{duration:Math.max(50,Math.min(2000,Number(a.ms)||500)),strongMagnitude:1,weakMagnitude:1})
return'Rumbling'
}
RUN.btinfo=async a=>{const d=await pick(a,[]);return(d.name||'Unnamed device')+', ID '+String(d.id).slice(0,10)}
RUN.btnotify=async(a,out)=>{
const d=await pick(a,[a.service])
const[g,c]=await chr(d,a.service,a.char)
await c.startNotifications()
const show=dv=>a.as==='text'?new TextDecoder().decode(dv):a.as==='number'?String(dv.byteLength===1?dv.getUint8(0):dv.byteLength===2?dv.getUint16(0,true):dv.byteLength===4?dv.getUint32(0,true):hex(dv)):hex(dv)
await new Promise(res=>{
const on=e=>out((d.name||'Device')+': '+show(e.target.value))
c.addEventListener('characteristicvaluechanged',on)
setTimeout(()=>{c.removeEventListener('characteristicvaluechanged',on);res()},Math.max(3,Math.min(60,Number(a.seconds)||15))*1000)
})
g.disconnect()
return'Finished watching'
}
RUN.btwritetext=async a=>{
const d=await pick(a,[a.service])
const[g,c]=await chr(d,a.service,a.char)
const b=new TextEncoder().encode(String(a.text).slice(0,20))
if(c.writeValueWithoutResponse)await c.writeValueWithoutResponse(b);else await c.writeValue(b)
g.disconnect()
return'Sent to '+(d.name||'the device')
}
RUN.serialsend=async a=>{
const p=await scanPort(a.baud)
const w=p.writable.getWriter()
await w.write(new TextEncoder().encode(String(a.text).slice(0,200)+(a.newline==='1'?'\n':'')))
w.releaseLock()
await p.close()
return'Sent over USB serial'
}
RUN.serialread=async(a,out)=>{
const p=await scanPort(a.baud)
const r=p.readable.getReader(),dec=new TextDecoder()
let all=''
const stop=setTimeout(()=>r.cancel().catch(()=>{}),Math.max(1,Math.min(60,Number(a.seconds)||10))*1000)
try{for(;;){const{value,done}=await r.read();if(done)break;all=(all+dec.decode(value)).slice(-300);out(all.trim()||'Listening')}}catch{}
clearTimeout(stop)
try{r.releaseLock();await p.close()}catch{}
return all.trim()||'Nothing was sent'
}
RUN.usbinfo=async()=>{
if(!navigator.usb)throw new Error('USB needs Chrome or Edge')
const d=await navigator.usb.requestDevice({filters:[]})
return(d.productName||'USB device')+', vendor 0x'+d.vendorId.toString(16)+', product 0x'+d.productId.toString(16)
}
RUN.nfcread=async(a,out)=>{
if(!window.NDEFReader)throw new Error('NFC needs Chrome on an Android phone')
const r=new NDEFReader(),ac=new AbortController()
await r.scan({signal:ac.signal})
let got=''
r.onreading=e=>{got=e.message.records.map(x=>{try{return new TextDecoder(x.encoding||'utf-8').decode(x.data)}catch{return x.recordType}}).join(' | ').slice(0,200);out(got)}
await sleep(Math.max(3,Math.min(60,Number(a.seconds)||15))*1000)
ac.abort()
return got||'No tag was read'
}
RUN.nfcwrite=async a=>{
if(!window.NDEFReader)throw new Error('NFC needs Chrome on an Android phone')
await new NDEFReader().write(String(a.text).slice(0,200))
return'Written to the tag'
}
const open=new Set()
export function deviceRequest(m){
const acts=(Array.isArray(m.acts)?m.acts:[]).filter(x=>x&&NAMES[x.k]&&x.a&&typeof x.a==='object').slice(0,5)
if(!acts.length||blocked().includes(m.bot)||open.has(m.bot))return
if(acts.every(x=>SOUND.has(x.k))&&trusted().includes(m.bot)){
acts.forEach(x=>{Promise.resolve().then(()=>RUN[x.k](x.a,()=>{})).catch(()=>{})})
return
}
open.add(m.bot)
const res=acts.map(()=>h('li',{class:'dv-r'},'Waiting'))
const list=h('ul',{class:'dv-l'},acts.map((x,i)=>h('li',null,h('b',null,NAMES[x.k](x.a)),res[i])))
const body=h('div',{class:'bd dv'},h('p',null,h('b',null,String(m.name||'A bot')),' started this when you used it. It only runs if you tap Allow.'),list)
let ran=false
const soundOnly=acts.every(x=>SOUND.has(x.k))
const always=h('input',{type:'checkbox'})
if(soundOnly)body.append(h('label',{class:'dv-a'},always,' Always allow sound from this bot'))
dialog('Allow device actions?',body,{onclose:()=>open.delete(m.bot),footer:close=>{
const allow=h('button',{class:'btn pri',on:{click:async()=>{
if(ran){close();return}
ran=true
if(soundOnly&&always.checked)trust(m.bot)
allow.disabled=true
for(let i=0;i<acts.length;i++){
res[i].textContent='Working'
try{res[i].textContent=await RUN[acts[i].k](acts[i].a,t=>{res[i].textContent=t})}catch(e){res[i].textContent=(e&&e.name==='NotFoundError'?'No device chosen':e&&e.message)||'Could not do that'}
}
allow.textContent='Done';allow.disabled=false
}}},'Allow')
return[
h('button',{class:'btn dng',on:{click:()=>{block(m.bot);toast('That bot can no longer ask to use your device');close()}}},'Block this bot'),
h('button',{class:'btn',on:{click:close}},'Not now'),
allow]
}})
}
