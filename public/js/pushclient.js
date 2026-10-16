import{GET,POST}from'./util.js'
export const pushSupported=()=>'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window
const b64=s=>{const p='='.repeat((4-s.length%4)%4);const r=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(r,c=>c.charCodeAt(0))}
async function reg(){return navigator.serviceWorker.register('/sw.js',{scope:'/'}).then(()=>navigator.serviceWorker.ready)}
export async function pushEnabled(){
const k=await GET('/api/push/key')
if(!k.enabled)return{configured:false,on:false}
const r=await navigator.serviceWorker.getRegistration('/')
const sub=r?await r.pushManager.getSubscription():null
return{configured:true,on:!!sub&&Notification.permission==='granted'}
}
export async function pushEnable(){
const k=await GET('/api/push/key')
if(!k.enabled)throw new Error('Push is not configured on this server')
if(await Notification.requestPermission()!=='granted')throw new Error('Notifications are blocked in your browser settings')
const r=await reg()
let sub=await r.pushManager.getSubscription()
if(!sub)sub=await r.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(k.key)})
const j=sub.toJSON()
await POST('/api/push/subscribe',{endpoint:j.endpoint,keys:j.keys})
}
export async function pushDisable(){
const r=await navigator.serviceWorker.getRegistration('/')
const sub=r?await r.pushManager.getSubscription():null
if(!sub)return
await POST('/api/push/unsubscribe',{endpoint:sub.endpoint}).catch(()=>{})
await sub.unsubscribe()
}
