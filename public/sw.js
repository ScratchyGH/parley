self.addEventListener('install',()=>self.skipWaiting())
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()))
self.addEventListener('push',e=>{
let d={}
try{d=e.data?e.data.json():{}}catch{}
const url=d.sid?`/s/${d.sid}/${d.room}?m=${d.mid}`:d.room?`/dm/${d.room}?m=${d.mid}`:'/'
e.waitUntil((async()=>{
const wins=await self.clients.matchAll({type:'window',includeUncontrolled:true})
if(wins.some(w=>w.visibilityState==='visible'&&w.focused))return
await self.registration.showNotification(d.title||'Parley',{body:d.body||'',tag:d.room||'parley',renotify:true,icon:'/logo-192.png',data:{url}})
})())
})
self.addEventListener('notificationclick',e=>{
e.notification.close()
const url=e.notification.data?.url||'/'
e.waitUntil((async()=>{
const wins=await self.clients.matchAll({type:'window',includeUncontrolled:true})
for(const w of wins){
if('focus'in w){
await w.focus()
w.postMessage({t:'goto',url})
return
}
}
await self.clients.openWindow(url)
})())
})

