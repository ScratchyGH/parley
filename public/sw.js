const VER='e5b8c0f261'
const SHELL=["/","/go.js","/style.css","/design.css","/perf.css","/manifest.webmanifest","/logo-192.png","/mascot.webp","/fonts/schibsted.woff2","/fonts/onest.woff2","/fonts/onest-cyrillic.woff2","/fonts/parli-bold.woff2","/fonts/bricolage.woff2","/fonts/figtree.woff2","/js/accounts.js","/js/activity.js","/js/admin.js","/js/appupd.js","/js/auth.js","/js/banhammerfx.js","/js/bgm.js","/js/blocks.js","/js/botspage.js","/js/cakefx.js","/js/catmenu.js","/js/changelog.js","/js/chat.js","/js/chatx.js","/js/cmdopts.js","/js/codec.js","/js/connicons.js","/js/cropper.js","/js/devblock.js","/js/diag.js","/js/dialogs.js","/js/dialogs2.js","/js/emoji.js","/js/errscreens.js","/js/exp.js","/js/gamebar.js","/js/gifs.js","/js/giftreveal.js","/js/gmerge.js","/js/guipreview.js","/js/home.js","/js/imghist.js","/js/intro.js","/js/kandie.js","/js/labs.js","/js/lcard.js","/js/lcdesign.js","/js/legal.js","/js/licenses.js","/js/main.js","/js/md.js","/js/mergekey.js","/js/modai.js","/js/modcases.js","/js/nav.js","/js/net.js","/js/notify.js","/js/onboard.js","/js/overlay.js","/js/p2p/core.js","/js/p2p/frames.js","/js/p2p/hist.js","/js/p2p/index.js","/js/p2p/rtc.js","/js/p2p/sha.js","/js/p2p/store.js","/js/p2p/swarm.js","/js/p2p/verify.js","/js/pages.js","/js/panels.js","/js/pars.js","/js/perf.js","/js/prefs.js","/js/provider.js","/js/pushclient.js","/js/revamp.js","/js/schedule.js","/js/screenui.js","/js/settings.js","/js/shell.js","/js/slash.js","/js/slashui.js","/js/ssettings.js","/js/state.js","/js/status.js","/js/streakui.js","/js/studio.js","/js/svg.js","/js/testupd.js","/js/tools.js","/js/tour.js","/js/tweaks.js","/js/update.js","/js/uploader.js","/js/util.js","/js/voice.js","/js/voiceclip.js","/js/webauthn.js","/js/whatsnew.js","/js/xlabs.js"]
const CACHE='parley-shell-'+VER
const RT='parley-rt-'+VER
const MAX=500
self.addEventListener('install',e=>{
e.waitUntil((async()=>{
const c=await caches.open(CACHE)
await Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))
await self.skipWaiting()
})())
})
self.addEventListener('activate',e=>{
e.waitUntil((async()=>{
const keys=await caches.keys()
const had=keys.some(k=>k.startsWith('parley-')&&k!==CACHE&&k!==RT)
await Promise.all(keys.filter(k=>k.startsWith('parley-')&&k!==CACHE&&k!==RT).map(k=>caches.delete(k)))
await self.clients.claim()
if(had)for(const w of await self.clients.matchAll({type:'window'}))w.postMessage({t:'sw-updated'})
})())
})
const ASSET=/^\/(js|g3d|m|fonts|vendor\/codecs|vendor)\/|\.(css|webp|png|svg|woff2|webmanifest)$/
const PAGES=/^\/(get|connect|kids|support|lab|go|api|ws)(\/|$)/
async function trim(c){
const ks=await c.keys()
if(ks.length>MAX)await Promise.all(ks.slice(0,ks.length-MAX).map(k=>c.delete(k)))
}
async function swr(req){
const c=await caches.open(RT)
const hit=await caches.match(req)
const net=fetch(req).then(r=>{
if(r&&r.status===200&&r.type==='basic'){c.put(req,r.clone()).then(()=>trim(c)).catch(()=>{})}
return r
}).catch(()=>null)
if(hit){net.catch(()=>{});return hit}
const r=await net
return r||Response.error()
}
async function nav(req){
const c=await caches.open(CACHE)
const shell=()=>c.match('/')
const net=fetch(req).then(r=>{
if(r&&r.status===200&&(r.headers.get('content-type')||'').includes('text/html'))c.put('/',r.clone()).catch(()=>{})
return r
})
const slow=new Promise(res=>setTimeout(()=>res(null),2500))
try{
const r=await Promise.race([net,slow])
if(r)return r
const h=await shell()
return h||await net
}catch{
const h=await shell()
return h||Response.error()
}
}
self.addEventListener('fetch',e=>{
const r=e.request
if(r.method!=='GET'||r.headers.has('range'))return
const u=new URL(r.url)
if(u.origin!==location.origin)return
if(u.pathname==='/sw.js'||PAGES.test(u.pathname))return
if(r.mode==='navigate'){e.respondWith(nav(r));return}
if(ASSET.test(u.pathname))e.respondWith(swr(r))
})
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
