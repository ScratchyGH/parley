import{fail,now,randHex,sha,body,limit}from'./util.js'
const ipOf=c=>c.req.headers.get('cf-connecting-ip')||'local'
const get=async(env,k)=>{const r=await env.DB.prepare('select v from app_settings where k=?').bind(k).first();try{return r?JSON.parse(r.v):null}catch{return null}}
const put=(env,k,o)=>env.DB.prepare('insert into app_settings(k,v) values(?,?) on conflict(k) do update set v=excluded.v').bind(k,JSON.stringify(o)).run()
const KINDS=['lost','banned','bug','other']
const UA={'user-agent':'Parley/1 (+https://parley.heavengtwashere.workers.dev)',accept:'application/json'}
const P={
roblox:{name:'Roblox',ok:/^[A-Za-z0-9_]{3,20}$/,url:i=>'https://www.roblox.com/users/'+i.id+'/profile',async look(n){
const a=await fetch('https://users.roblox.com/v1/usernames/users',{method:'POST',headers:{...UA,'content-type':'application/json'},body:JSON.stringify({usernames:[n],excludeBannedUsers:true})}).then(r=>r.json())
const u=a.data&&a.data[0];if(!u)return null
const d=await fetch('https://users.roblox.com/v1/users/'+u.id,{headers:UA}).then(r=>r.json())
return{id:String(u.id),name:d.name||u.name,text:d.description||''}}},
github:{name:'GitHub',ok:/^[A-Za-z0-9-]{1,39}$/,url:i=>'https://github.com/'+i.name,async look(n){
const r=await fetch('https://api.github.com/users/'+encodeURIComponent(n),{headers:UA})
if(!r.ok)return null
const d=await r.json()
return{id:String(d.id),name:d.login,text:d.bio||''}}}
}
const pubList=o=>Object.entries(o||{}).filter(([p])=>P[p]).map(([p,v])=>({p,label:P[p].name,name:v.name,url:P[p].url(v),at:v.at}))
export default function(r){
r.add('POST','/api/support',async c=>{
limit('sup:'+ipOf(c),5,3600000)
const b=await body(c.req,8192)
if(b.website)return{ok:true}
const kind=KINDS.includes(b.kind)?b.kind:'other'
const msg=String(b.message||'').trim().slice(0,2000)
if(msg.length<10)fail(400,'Tell us a bit more so we can help')
const id=randHex(5),key=randHex(8)
await put(c.env,'sup:'+id,{id,kh:await sha(key),kind,user:String(b.username||'').trim().slice(0,40),contact:String(b.contact||'').trim().slice(0,120),msg,status:'open',at:now(),reply:'',uid:c.user?.id||null})
return{id,key}
},{auth:false})
r.add('POST','/api/support/status',async c=>{
limit('sups:'+ipOf(c),30,600000)
const b=await body(c.req,512)
const t=await get(c.env,'sup:'+String(b.id||'').slice(0,12))
if(!t||t.kh!==await sha(String(b.key||'')))fail(404,'Ticket not found')
return{status:t.status,reply:t.reply,kind:t.kind,at:t.at}
},{auth:false})
r.add('GET','/api/admin/support',async c=>{
if(!c.user.admin)fail(404,'Not found')
const rows=(await c.env.DB.prepare("select v from app_settings where k like 'sup:%' order by rowid desc limit 150").all()).results
return{tickets:rows.map(x=>{try{const t=JSON.parse(x.v);delete t.kh;return t}catch{return null}}).filter(Boolean)}
})
r.add('POST','/api/admin/support/:id',async c=>{
if(!c.user.admin)fail(404,'Not found')
const t=await get(c.env,'sup:'+c.p.id)
if(!t)fail(404,'Ticket not found')
const b=await body(c.req,4096)
if(typeof b.reply==='string')t.reply=b.reply.trim().slice(0,1500)
if(['open','answered','closed'].includes(b.status))t.status=b.status
else if(t.reply)t.status='answered'
await put(c.env,'sup:'+t.id,t)
return{ok:true}
})
r.add('GET','/api/levelcard',async c=>{
const q=c.url.searchParams,L=Math.max(0,Math.min(999,parseInt(q.get('l'))||0)),m=Math.max(1,Math.min(1e9,parseInt(q.get('m'))||1)),x=Math.max(0,Math.min(m,parseInt(q.get('c'))||0))
const t=(q.get('t')||'Member').replace(/[^\p{L}\p{N} _.'-]/gu,'').slice(0,28)||'Member',w=Math.round(x/m*340)
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="420" height="130" viewBox="0 0 420 130"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#35d0ff"/></linearGradient></defs><rect width="420" height="130" rx="18" fill="#15151a"/><rect x="1" y="1" width="418" height="128" rx="17" fill="none" stroke="#2a2a35" stroke-width="2"/><text x="24" y="44" font-family="system-ui,Segoe UI,sans-serif" font-size="22" font-weight="700" fill="#fff">${t}</text><text x="396" y="44" text-anchor="end" font-family="system-ui,sans-serif" font-size="22" font-weight="700" fill="#35d0ff">Level ${L}</text><rect x="24" y="68" width="372" height="18" rx="9" fill="#2a2a35"/><rect x="24" y="68" width="${Math.max(18,w+16)}" height="18" rx="9" fill="url(#g)"/><text x="24" y="112" font-family="system-ui,sans-serif" font-size="14" fill="#9a9aa8">${x} / ${m} XP</text></svg>`
return new Response(svg,{headers:{'content-type':'image/svg+xml','cache-control':'public, max-age=300','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; style-src 'unsafe-inline'"}})
},{auth:false})
r.add('GET','/api/connections',async c=>{
const o=await get(c.env,'conn:'+c.user.id)
return{list:pubList(o),providers:Object.entries(P).map(([k,v])=>({p:k,label:v.name}))}
})
r.add('POST','/api/connections/start',async c=>{
limit('connst:'+c.user.id,20,3600000)
const b=await body(c.req,512),p=P[b.p]
if(!p)fail(400,'Unknown service')
const n=String(b.name||'').trim()
if(!p.ok.test(n))fail(400,'That username does not look right')
const W='apple river cloud maple tiger stone happy green lemon piano ocean candy forest rabbit silver garden window pencil bridge sunny'.split(' '),pk=()=>W[crypto.getRandomValues(new Uint8Array(1))[0]%W.length],code=pk()+' '+pk()+' '+pk()+' '+pk()
await put(c.env,'connp:'+c.user.id+':'+b.p,{n,code,exp:now()+1800000})
return{code,name:n}
})
r.add('POST','/api/connections/verify',async c=>{
limit('connvf:'+c.user.id,20,3600000)
const b=await body(c.req,256),p=P[b.p]
if(!p)fail(400,'Unknown service')
const k='connp:'+c.user.id+':'+b.p
const s=await get(c.env,k)
if(!s||s.exp<now())fail(400,'Start again, the code expired')
let u
try{u=await p.look(s.n)}catch{fail(502,p.name+' did not answer, try again in a minute')}
if(!u)fail(404,'Could not find that '+p.name+' account')
const nz=t=>String(t||'').toLowerCase().replace(/[^a-z]+/g,' ');if(!(' '+nz(u.text)+' ').includes(' '+nz(s.code)+' '))fail(400,'The code is not on that '+p.name+' profile yet. Save it there and try again.')
const xk='connx:'+b.p+':'+u.id,x=await get(c.env,xk)
if(x&&x!==c.user.id)fail(409,'That '+p.name+' account is already linked to another Parley account')
const o=await get(c.env,'conn:'+c.user.id)||{}
o[b.p]={id:u.id,name:u.name,at:now()}
await put(c.env,'conn:'+c.user.id,o)
await put(c.env,xk,c.user.id)
await c.env.DB.prepare('delete from app_settings where k=?').bind(k).run()
return{list:pubList(o)}
})
r.add('DELETE','/api/connections/:p',async c=>{
const o=await get(c.env,'conn:'+c.user.id)||{}
const v=o[c.p.p]
if(!v)return{list:pubList(o)}
delete o[c.p.p]
await put(c.env,'conn:'+c.user.id,o)
await c.env.DB.prepare('delete from app_settings where k=?').bind('connx:'+c.p.p+':'+v.id).run()
return{list:pubList(o)}
})
r.add('GET','/api/users/:uid/connections',async c=>{
limit('connget:'+c.user.id,120,60000)
return{list:pubList(await get(c.env,'conn:'+c.p.uid))}
})
}
