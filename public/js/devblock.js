import{h,dialog,toast}from'./util.js'

const KEY='parley.devblock'
const blocked=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
const block=id=>{try{localStorage.setItem(KEY,JSON.stringify([...new Set([...blocked(),id])].slice(-200)))}catch{}}
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
const open=new Set()
export function deviceRequest(m){
const acts=(Array.isArray(m.acts)?m.acts:[]).filter(x=>x&&NAMES[x.k]&&x.a&&typeof x.a==='object').slice(0,5)
if(!acts.length||blocked().includes(m.bot)||open.has(m.bot))return
open.add(m.bot)
const res=acts.map(()=>h('li',{class:'dv-r'},'Waiting'))
const list=h('ul',{class:'dv-l'},acts.map((x,i)=>h('li',null,h('b',null,NAMES[x.k](x.a)),res[i])))
const body=h('div',{class:'bd dv'},h('p',null,h('b',null,String(m.name||'A bot')),' started this when you used it. It only runs if you tap Allow.'),list)
let ran=false
dialog('Allow device actions?',body,{onclose:()=>open.delete(m.bot),footer:close=>{
const allow=h('button',{class:'btn pri',on:{click:async()=>{
if(ran){close();return}
ran=true
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
