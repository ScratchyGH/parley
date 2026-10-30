import{Hub}from'./hub.js'
import{HttpError,json,fail,now,newId,limit}from'./util.js'
import{sessionUser,authRoutes}from'./auth.js'
import{loadMember,visibleChannels,P}from'./perms.js'
import fileRoutes from'./files.js'
import serverRoutes from'./servers.js'
import messageRoutes from'./messages.js'
import socialRoutes from'./social.js'
import adminRoutes from'./admin.js'
import extraRoutes from'./extras.js'
import totpRoutes from'./totp.js'
import pushRoutes from'./push.js'
import perkRoutes from'./perks.js'
import parsRoutes,{expireVanity}from'./pars.js'
import programRoutes from'./program.js'
import screenRoutes from'./screen.js'
import aiRoutes from'./ai.js'
import appRoutes from'./apps.js'
import deviceRoutes,{checkDevice}from'./devices.js'
import botlabRoutes from'./botlab.js'
import signinRoutes from'./signin.js'
import labRoutes from'./lab.js'
import xlabsRoutes,{xlabsCron}from'./xlabs.js'
import gifRoutes from'./gifs.js'
import caseRoutes from'./cases.js'
import emailRoutes from'./email.js'
import templateRoutes from'./templates.js'
import{sweepExplicitServers}from'./servers.js'
import botxRoutes from'./botx.js'
import{roleOf}from'./botlab.js'
import hookRoutes from'./devhooks.js'
import pluginRoutes from'./plugins.js'
import backupRoutes,{dailyBackup}from'./backup.js'
import legalRoutes from'./legal.js'
import modaiRoutes from'./modai.js'
import banhammerRoutes from'./banhammer.js'
import toolsRoutes,{deliverReminders}from'./tools.js'
import streakRoutes from'./streaks.js'
import hollowRoutes from'./hollow.js'
import teamupRoutes from'./teamup.js'
import gamepackRoutes from'./gamepack.js'
import voiceRoutes from'./voice.js'
import{TOS_VERSION,tosExempt}from'./tos.js'
import scheduleRoutes,{deliverDue}from'./schedule.js'
import{d1Store}from'./store.js'
import{tursoDb}from'./turso.js'
import{ensureSchema}from'./migrate.js'
export{Hub}

const routes=[]
const router={add(method,path,handler,opts={}){
const keys=[]
const re=new RegExp('^'+path.replace(/:(\w+)/g,(_,k)=>{keys.push(k);return'([^/]+)'})+'$')
routes.push({method,re,keys,handler,auth:opts.auth!==false})
}}
authRoutes(router)
fileRoutes(router)
serverRoutes(router)
messageRoutes(router)
socialRoutes(router)
adminRoutes(router)
extraRoutes(router)
totpRoutes(router)
pushRoutes(router)
perkRoutes(router)
parsRoutes(router)
programRoutes(router)
screenRoutes(router)
aiRoutes(router)
appRoutes(router)
deviceRoutes(router)
botxRoutes(router)
hookRoutes(router)
pluginRoutes(router)
backupRoutes(router)
botlabRoutes(router)
xlabsRoutes(router)
scheduleRoutes(router)
legalRoutes(router)
modaiRoutes(router)
banhammerRoutes(router)
hollowRoutes(router)
teamupRoutes(router)
gamepackRoutes(router)
toolsRoutes(router)
streakRoutes(router)
voiceRoutes(router)
caseRoutes(router)
emailRoutes(router)
templateRoutes(router)
gifRoutes(router)
signinRoutes(router)
labRoutes(router)

router.add('GET','/api/health',async c=>{
if(!c.url.searchParams.has('lite'))await c.env.DB.prepare('select 1').first()
return{ok:true,time:now(),build:(c.env.CF_VERSION_METADATA&&c.env.CF_VERSION_METADATA.id)||null}
},{auth:false})

router.add('GET','/api/get/parley.mobileconfig',async c=>{
const o=c.url.origin
const ic=await c.env.ASSETS.fetch(new Request(o+'/apple-touch-icon.png'))
const b=new Uint8Array(await ic.arrayBuffer());let t='';for(let i=0;i<b.length;i+=8192)t+=String.fromCharCode(...b.subarray(i,i+8192))
const x='<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>PayloadContent</key><array><dict><key>FullScreen</key><true/><key>IsRemovable</key><true/><key>Icon</key><data>'+btoa(t)+'</data><key>Label</key><string>Parley</string><key>PayloadDisplayName</key><string>Parley</string><key>PayloadIdentifier</key><string>app.parley.webclip</string><key>PayloadType</key><string>com.apple.webClip.managed</string><key>PayloadUUID</key><string>7B1D6A52-3C0E-4F7A-9A44-5D2E8B1C9F01</string><key>PayloadVersion</key><integer>1</integer><key>URL</key><string>'+o+'/?web=1</string></dict></array><key>PayloadDescription</key><string>Adds Parley to your Home Screen.</string><key>PayloadDisplayName</key><string>Parley</string><key>PayloadIdentifier</key><string>app.parley.profile</string><key>PayloadOrganization</key><string>Parley</string><key>PayloadType</key><string>Configuration</string><key>PayloadUUID</key><string>2C9E4F10-8A3B-4D65-B7E2-91F0A6D3C805</string><key>PayloadVersion</key><integer>1</integer></dict></plist>'
return new Response(x,{headers:{'content-type':'application/x-apple-aspen-config','content-disposition':'attachment; filename="Parley.mobileconfig"','cache-control':'public,max-age=3600'}})
},{auth:false})

router.add('GET','/api/rtc/ice',async c=>{
limit('ice:'+c.user.id,30,60000)
const fallback=[{urls:['stun:stun.cloudflare.com:3478','stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302','stun:global.stun.twilio.com:3478','stun:stun2.l.google.com:19302','stun:stun3.l.google.com:19302','stun:stun.stunprotocol.org:3478','stun:stun.services.mozilla.com:3478']}]
const relay=[{urls:['turn:openrelay.metered.ca:80','turn:openrelay.metered.ca:443','turn:openrelay.metered.ca:443?transport=tcp','turns:openrelay.metered.ca:443?transport=tcp'],username:'openrelayproject',credential:'openrelayproject'},{urls:['turn:numb.viagenie.ca'],username:'webrtc@live.com',credential:'muazkh'},{urls:['turn:192.158.29.39:3478?transport=udp','turn:192.158.29.39:3478?transport=tcp'],username:'28224511:1379330808',credential:'JZEOEt2V3Qb0y27GRntt2u2PAYA='},{urls:['turn:turn.bistri.com:80'],username:'homeo',credential:'homeo'},{urls:['turn:turn.anyfirewall.com:443?transport=tcp'],username:'webrtc',credential:'webrtc'}]
if(!c.env.TURN_KEY_ID||!c.env.TURN_API_TOKEN)return{iceServers:[...fallback,...relay],turn:true}
try{
const res=await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${c.env.TURN_KEY_ID}/credentials/generate-ice-servers`,{method:'POST',headers:{authorization:'Bearer '+c.env.TURN_API_TOKEN,'content-type':'application/json'},body:JSON.stringify({ttl:43200})})
if(!res.ok)return{iceServers:[...fallback,...relay],turn:true}
const d=await res.json()
const list=Array.isArray(d.iceServers)?d.iceServers:d.iceServers?[d.iceServers]:[]
return{iceServers:[...fallback,...list.filter(s=>s.username),...relay],turn:true}
}catch{return{iceServers:[...fallback,...relay],turn:true}}
})

let maint={v:false,t:0}
async function maintenance(env){
if(now()-maint.t<20000)return maint.v
const r=await env.DB.prepare("select v from app_settings where k='maintenance'").first()
maint={v:r?.v==='1',t:now()}
return maint.v
}
export const invalidateMaintenance=()=>{maint.t=0}

async function api(req,env,ec,url,asUser){
const method=req.method
if(method!=='GET'&&method!=='HEAD'){
const origin=req.headers.get('origin')
if(origin&&origin!==url.origin)fail(403,'Cross-origin request blocked')
const sfs=req.headers.get('sec-fetch-site')
if(!origin&&sfs&&sfs!=='same-origin'&&sfs!=='none')fail(403,'Cross-origin request blocked')
}
let hit=null,params={}
for(const r of routes){
if(r.method!==method)continue
const m=url.pathname.match(r.re)
if(m){hit=r;r.keys.forEach((k,i)=>{try{params[k]=decodeURIComponent(m[i+1])}catch{fail(400,'Bad path')}});break}
}
if(!hit)fail(404,'Not found')
const user=asUser||await sessionUser(env,req)
if(!asUser)await checkDevice(env,req,user,url.pathname)
if(hit.auth&&!user)fail(401,'Not signed in')
if(user&&user.is_bot&&!/^\/api\/(rooms|channels|threads|upload|files|stickers)\b|^\/api\/me$|^\/api\/servers\/[^/]+$/.test(url.pathname))fail(403,'Bots cannot use this endpoint')
if(user&&user.is_bot&&/^\/api\/(me|servers\/[^/]+)$/.test(url.pathname)&&method!=='GET')fail(403,'Bots cannot use this endpoint')
if(user&&!user.is_bot&&!env.TOS_OFF&&user.tos_version!==TOS_VERSION&&method!=='GET'&&method!=='HEAD'&&!tosExempt(url.pathname))throw Object.assign(new HttpError(403,'Accept the Terms and Privacy Policy to continue'),{tos:true})
if(user)limit('api:'+user.id,600,60000)
else limit('anon:'+(req.headers.get('cf-connecting-ip')||'local'),120,60000)
if(user&&!user.admin&&await maintenance(env)&&!/^\/api\/auth\/logout$/.test(url.pathname))fail(503,'Parley is in maintenance mode. Please try again shortly.')
const c={req,env,ec,url,p:params,user}
c.pub=(hub,e,opts={})=>{
const stub=env.HUB.get(env.HUB.idFromName(hub))
ec.waitUntil(stub.fetch('https://hub/publish',{method:'POST',body:JSON.stringify({e,...opts})}).then(r=>r.text()).catch(()=>{}))
}
c.pubClose=(hub,opts)=>c.pub(hub,null,opts)
c.logStmt=(serverId,action,target,detail='')=>env.DB.prepare('insert into mod_log(id,server_id,actor_id,action,target_id,detail,created_at) values(?,?,?,?,?,?,?)').bind(newId('ml'),serverId,user.id,action,target,String(detail).slice(0,500),now())
const out=await hit.handler(c)
return out instanceof Response?out:json(out)
}

async function ws(req,env,url){
const user=await sessionUser(env,req)
if(!user)return new Response('Unauthorized',{status:401})
const origin=req.headers.get('origin')
if(origin&&origin!==url.origin)return new Response('Forbidden',{status:403})
const room=url.searchParams.get('room')||''
let access={v:'*',c:'*'}
if(room.startsWith('s_')){
const m=await loadMember(env,room.slice(2),user.id)
if(!m)return new Response('Not a member',{status:403})
const vis=await visibleChannels(env,m)
access={v:vis.map(x=>x.ch.id),c:vis.filter(x=>x.perms&P.CONNECT).map(x=>x.ch.id)}
}else if(room.startsWith('cv_')){
const ok=await env.DB.prepare('select 1 x from conv_members where conv_id=? and user_id=?').bind(room,user.id).first()
if(!ok)return new Response('Not a member',{status:403})
}else if(room.startsWith('u_')){
if(room!=='u_'+user.id)return new Response('Forbidden',{status:403})
}else if(room.startsWith('bw_')){
const p=await env.DB.prepare('select id,owner_id from bot_projects where id=?').bind(room.slice(3)).first()
if(!p||!await roleOf(env,p,user.id))return new Response('Not a collaborator',{status:403})
}else if(!/^tu_[A-Z0-9]{6}$/.test(room))return new Response('Bad room',{status:400})
const stub=env.HUB.get(env.HUB.idFromName(room))
const r2=new Request(req)
r2.headers.set('x-uid',user.id)
r2.headers.set('x-tu',room.startsWith('tu_')?'1':'0')
r2.headers.set('x-access',JSON.stringify(access))
let hide=false
try{hide=JSON.parse(user.settings||'{}').show_presence===false}catch{}
r2.headers.set('x-pres',hide?'invisible':user.presence)
return stub.fetch(r2)
}

const SEC={'x-content-type-options':'nosniff','referrer-policy':'same-origin','x-frame-options':'DENY'}

let tdb=null
async function wrap(env0){
const env={...env0}
if(env0.TURSO_URL){
if(!tdb)tdb=tursoDb(env0)
env.DB=tdb
await ensureSchema(tdb)
}
if(!env0.FILES)env.FILES=d1Store(env)
return env
}

export default{
async fetch(req,env0,ec){
const env=await wrap(env0)
const url=new URL(req.url)
try{
if(url.pathname==='/ws')return await ws(req,env,url)
if(!url.pathname.startsWith('/api/')){
const res=await env.ASSETS.fetch(req)
const h=new Headers(res.headers)
for(const[k,v]of Object.entries(SEC))h.set(k,v)
return new Response(res.body,{status:res.status,statusText:res.statusText,headers:h})
}
const res=await api(req,env,ec,url)
const h=new Headers(res.headers)
for(const[k,v]of Object.entries(SEC))if(!h.has(k))h.set(k,v)
return new Response(res.body,{status:res.status,statusText:res.statusText,headers:h})
}catch(e){
if(e instanceof HttpError)return json({error:e.message,...(e.tos?{tos:true}:{})},e.status,SEC)
const msg=String(e&&e.message||e)
console.error('unhandled',msg)
if(/exceeded|quota|limit/i.test(msg)&&/D1|row|daily/i.test(msg))return json({error:'The free database quota for today has been used up. It resets at 00:00 UTC.'},503,SEC)
return json({error:'Something went wrong on the server'},500,SEC)
}
},
async scheduled(ev,env0){
const env=await wrap(env0)
const t=now()
try{await env.DB.prepare("insert into app_settings(k,v) values('last_cron',?) on conflict(k) do update set v=excluded.v").bind(String(t)).run()}catch{}
try{
const pend=[]
const ec={waitUntil:p=>{pend.push(p)}}
await deliverDue(env,async(u,method,path,b)=>{
const url=new URL('https://parley.internal'+path)
const res=await api(new Request(url,{method,headers:{'content-type':'application/json'},body:JSON.stringify(b)}),env,ec,url,u)
if(!res.ok){let m='Failed';try{m=(await res.json()).error||m}catch{}throw new Error(m)}
})
await Promise.allSettled(pend)
await xlabsCron(env,ec)
await deliverReminders(env,ec).catch(()=>{})
await Promise.allSettled(pend)
}catch(e){console.error('scheduled send',String(e&&e.message||e))}
const ks=(await env.DB.prepare("select k,v from app_settings where k in ('last_sweep','prune_v1')").all().catch(()=>({results:[]}))).results
const last=ks.find(x=>x.k==='last_sweep')
if(last&&t-Number(last.v)<20*3600000){
if(!ks.some(x=>x.k==='prune_v1')){
await env.DB.prepare("insert or ignore into app_settings(k,v) values('prune_v1','1')").run().catch(()=>{})
await prune(env,t)
}
return
}
await env.DB.prepare("insert into app_settings(k,v) values('last_sweep',?) on conflict(k) do update set v=excluded.v").bind(String(t)).run()
try{await dailyBackup(env)}catch(e){console.error('backup',String(e&&e.message||e))}
try{await expireVanity(env)}catch(e){}
const orphans=(await env.DB.prepare('select id,r2_key from files where kind=? and message_id is null and created_at<?').bind('attachment',t-86400000).all()).results
for(const f of orphans)await env.FILES.delete(f.r2_key)
const stale=(await env.DB.prepare('select id,r2_key,upload_id from uploads where created_at<?').bind(t-86400000).all()).results
for(const u of stale){try{await env.FILES.resumeMultipartUpload(u.r2_key,u.upload_id).abort()}catch(e){}}
await env.DB.batch([
env.DB.prepare('delete from files where kind=? and message_id is null and created_at<?').bind('attachment',t-86400000),
env.DB.prepare('delete from uploads where created_at<?').bind(t-86400000),
env.DB.prepare('delete from sessions where expires_at<?').bind(t),
env.DB.prepare('delete from login_attempts where reset_at<?').bind(t),
env.DB.prepare('delete from invites where (expires_at is not null and expires_at<?) or revoked=1').bind(t-7*86400000),
env.DB.prepare('delete from notifications where created_at<?').bind(t-60*86400000)
])
try{await sweepExplicitServers(env)}catch(e){}
try{
const D=86400000
await env.DB.batch([30,90,365].map(n=>env.DB.prepare("update messages set deleted_at=?,content='' where deleted_at is null and pinned=0 and created_at<? and server_id in (select id from servers where retention_days=?)").bind(t,t-n*D,n)))
await env.DB.prepare('delete from client_errors where created_at<?').bind(t-30*D).run()
}catch(e){}
await prune(env,t)
try{await env.DB.exec('PRAGMA optimize')}catch(e){}
}
}
async function prune(env,t){
const D=86400000
const q=[
"delete from event_night_runs where started_at<"+(t-D),
"delete from mod_log where created_at<"+(t-14*D)+" and (action like 'db.%' or action like 'channel.%' or action like 'maintenance.%' or action in ('automod.update','server.update','pars.grant'))",
"delete from mod_log where created_at<"+(t-180*D),
"delete from bot_versions where id in (select id from (select id,row_number() over (partition by project_id order by rev desc) n from bot_versions) where n>3)",
"delete from client_errors where created_at<"+(t-7*D),
"delete from webauthn_challenges where expires_at<"+t,
"delete from notifications where created_at<"+(t-30*D),
"delete from sessions where expires_at<"+t,
"delete from login_attempts where reset_at<"+t
]
for(const x of q)await env.DB.prepare(x).run().catch(()=>{})
}
