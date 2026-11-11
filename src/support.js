import{fail,now,randHex,sha,body,limit}from'./util.js'
const ipOf=c=>c.req.headers.get('cf-connecting-ip')||'local'
const nm=v=>{let t=String(v||'').trim();if(/[\/]/.test(t)){t=t.replace(/[?#].*$/,'').replace(/\/+$/,'');t=t.split('/').pop()}return t.replace(/^@/,'')}
const get=async(env,k)=>{const r=await env.DB.prepare('select v from app_settings where k=?').bind(k).first();try{return r?JSON.parse(r.v):null}catch{return null}}
const put=(env,k,o)=>env.DB.prepare('insert into app_settings(k,v) values(?,?) on conflict(k) do update set v=excluded.v').bind(k,JSON.stringify(o)).run()
const KINDS=['lost','banned','bug','other']
const UA={'user-agent':'Parley/1 (+https://parley.heavengtwashere.workers.dev)',accept:'application/json'}
const ent=s=>String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&#x27;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>')
const meta=(h,k)=>{const m=new RegExp('<meta[^>]+(?:property|name)="'+k+'"[^>]+content="([^"]*)"','i').exec(h)||new RegExp('<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="'+k+'"','i').exec(h);return m?ent(m[1]):''}
const page=async u=>{const r=await fetch(u,{headers:{...UA,accept:'text/html'},redirect:'follow'});return r.ok?await r.text():null}
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
,
steam:{name:'Steam',hint:'the profile summary',ok:/^[A-Za-z0-9_-]{2,64}$/,url:i=>'https://steamcommunity.com/profiles/'+i.id,async look(n0){
let n=String(n0||'').trim()
const m=/steamcommunity\.com\/(profiles|id)\/([A-Za-z0-9_-]+)/i.exec(n);if(m)n=m[2]
const dec=t=>String(t||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#0?39;/g,"'").replace(/&amp;/g,'&').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()
const base='https://steamcommunity.com/'+(/^\d{17}$/.test(n)?'profiles/':'id/')+encodeURIComponent(n)+'/'
const hd={'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',accept:'text/html,application/xml,*/*','Accept-Language':'en-US,en;q=0.9',cookie:'birthtime=0; lastagecheckage=1-0-1990; wants_mature_content=1'}
let x=''
try{const r=await fetch(base+'?xml=1',{headers:hd});if(r.ok)x=await r.text()}catch{}
const id=/<steamID64>\s*(\d{17})\s*<\/steamID64>/.exec(x)
if(id){
const nm=/<steamID>([\s\S]*?)<\/steamID>/.exec(x),sm=/<summary>([\s\S]*?)<\/summary>/.exec(x)
const ig=/<inGameInfo>[\s\S]*?<gameName>([\s\S]*?)<\/gameName>[\s\S]*?<gameLink>([\s\S]*?)<\/gameLink>(?:[\s\S]*?<gameIcon>([\s\S]*?)<\/gameIcon>)?/.exec(x)
return{id:id[1],name:dec(nm&&nm[1])||n,text:dec(sm&&sm[1])}
}
let hx='';try{const r=await fetch(base,{headers:hd});if(r.ok)hx=await r.text()}catch{}
const sid=/"steamid":"(\d{17})"/.exec(hx);if(!sid)return null
const pn=/<span class="actual_persona_name">([\s\S]*?)<\/span>/.exec(hx),bio=/<div class="profile_summary[^"]*">([\s\S]*?)<\/div>/.exec(hx)
return{id:sid[1],name:dec(pn&&pn[1])||n,text:dec(bio&&bio[1])}}},
bluesky:{name:'Bluesky',ok:/^[A-Za-z0-9.-]{3,80}$/,url:i=>'https://bsky.app/profile/'+i.name,async look(n){
const r=await fetch('https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor='+encodeURIComponent(n),{headers:UA})
if(!r.ok)return null
const d=await r.json()
return{id:d.did,name:d.handle,text:d.description||''}}},
gitlab:{name:'GitLab',ok:/^[A-Za-z0-9_.-]{2,40}$/,url:i=>'https://gitlab.com/'+i.name,async look(n){
const a=await fetch('https://gitlab.com/api/v4/users?username='+encodeURIComponent(n),{headers:UA}).then(r=>r.json())
const u=Array.isArray(a)&&a[0];if(!u)return null
const d=await fetch('https://gitlab.com/api/v4/users/'+u.id,{headers:UA}).then(r=>r.json())
return{id:String(u.id),name:u.username,text:[d.bio,d.bio_html,d.skype,d.linkedin,d.twitter].filter(Boolean).join(' ')}}},
lichess:{name:'Lichess',ok:/^[A-Za-z0-9_-]{2,30}$/,url:i=>'https://lichess.org/@/'+i.name,async look(n){
const r=await fetch('https://lichess.org/api/user/'+encodeURIComponent(n),{headers:UA})
if(!r.ok)return null
const d=await r.json()
return{id:d.id,name:d.username,text:(d.profile&&d.profile.bio)||''}}},
chessdotcom:{name:'Chess.com',hint:'the Location field of your Chess.com profile',ok:/^[A-Za-z0-9_-]{3,25}$/,url:i=>'https://www.chess.com/member/'+i.name,async look(n){
const r=await fetch('https://api.chess.com/pub/player/'+encodeURIComponent(n.toLowerCase()),{headers:UA})
if(!r.ok)return null
const d=await r.json()
return{id:String(d.player_id),name:d.username,text:d.location||''}}},
youtube:{name:'YouTube',hint:'the very start of your channel description (About)',ok:/^@?[A-Za-z0-9._-]{3,30}$/,url:i=>'https://www.youtube.com/channel/'+i.id,async look(n,env){
if(!env.YOUTUBE_API_KEY){
const h=await page('https://www.youtube.com/@'+encodeURIComponent(n.replace(/^@/,'')))
if(!h)return null
const id=/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{20,})"/.exec(h)
if(!id)return null
return{id:id[1],name:n.replace(/^@/,''),text:meta(h,'og:description')||meta(h,'description')}
}
const d=await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle='+encodeURIComponent('@'+n.replace(/^@/,''))+'&key='+env.YOUTUBE_API_KEY).then(r=>r.json())
const u=d.items&&d.items[0];if(!u)return null
return{id:u.id,name:(u.snippet.customUrl||u.snippet.title||n).replace(/^@/,''),text:u.snippet.description||''}}},
x:{name:'X',hint:'your X bio',ok:/^@?[A-Za-z0-9_]{1,15}$/,url:i=>'https://x.com/'+i.name,async look(n){
const nm=n.replace(/^@/,'')
const r=await fetch('https://api.fxtwitter.com/'+encodeURIComponent(nm),{headers:UA})
if(!r.ok)return null
const u=(await r.json()).user
if(!u)return null
return{id:String(u.id),name:u.screen_name,text:u.description||''}}},
tiktok:{name:'TikTok',hint:'your TikTok bio',ok:/^@?[A-Za-z0-9._]{2,24}$/,url:i=>'https://www.tiktok.com/@'+i.name,async look(n){
const nm=n.replace(/^@/,'')
const h=await page('https://www.tiktok.com/@'+encodeURIComponent(nm))
if(!h)return null
const id=/"uniqueId":"([^"]+)"/.exec(h),sg=/"signature":"((?:[^"\\]|\\.)*)"/.exec(h),ui=/"id":"(\d{6,})","shortId"/.exec(h)
if(!id)return null
let tx='';try{tx=JSON.parse('"'+(sg?sg[1]:'')+'"')}catch{}
return{id:ui?ui[1]:id[1].toLowerCase(),name:id[1],text:tx}}},
kofi:{name:'Ko-fi',hint:'your Ko-fi page About text',ok:/^[A-Za-z0-9_]{2,40}$/,url:i=>'https://ko-fi.com/'+i.name,async look(n){
const h=await page('https://ko-fi.com/'+encodeURIComponent(n))
if(!h)return null
return{id:n.toLowerCase(),name:n,text:meta(h,'og:description')||meta(h,'description')}}},
soundcloud:{name:'SoundCloud',hint:'your SoundCloud bio',ok:/^[A-Za-z0-9_-]{2,40}$/,url:i=>'https://soundcloud.com/'+i.name,async look(n){
const h=await page('https://soundcloud.com/'+encodeURIComponent(n))
if(!h)return null
return{id:n.toLowerCase(),name:n,text:meta(h,'og:description')||meta(h,'description')}}}
}
const ready=(p,env)=>!p.need||p.need.every(k=>env[k])
const L={
youtube:{name:'YouTube',ok:/^@?[A-Za-z0-9._-]{3,30}$/,url:n=>'https://www.youtube.com/@'+n.replace(/^@/,'')}
}
const pubList=o=>Object.entries(o||{}).filter(([p])=>P[p]||L[p]).map(([p,v])=>P[p]&&!v.u?{p,label:P[p].name,name:v.name,url:P[p].url(v),at:v.at,verified:true}:{p,label:(L[p]||P[p]).name,name:v.name,url:(L[p]||{url:()=>P[p].url(v)}).url(v.name),at:v.at,verified:false})
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
const threadOf=t=>t.thread||[{from:'user',text:t.msg,at:t.at},...(t.reply?[{from:'staff',text:t.reply,at:t.at}]:[])]
const pub=t=>({id:t.id,status:t.status,reply:t.reply,kind:t.kind,at:t.at,thread:threadOf(t)})
const owned=async(c,b)=>{const t=await get(c.env,'sup:'+String(b.id||'').slice(0,12));if(!t||t.kh!==await sha(String(b.key||'')))fail(404,'Ticket not found');return t}
r.add('POST','/api/support/status',async c=>{
limit('sups:'+ipOf(c),30,600000)
return pub(await owned(c,await body(c.req,512)))
},{auth:false})
r.add('POST','/api/support/followup',async c=>{
limit('supf:'+ipOf(c),10,3600000)
const b=await body(c.req,4096)
const t=await owned(c,b)
const m=String(b.message||'').trim().slice(0,2000)
if(m.length<2)fail(400,'Write a message first')
if(t.status==='closed')fail(400,'This ticket is closed. Open a new one.')
t.thread=threadOf(t)
if(t.thread.length>60)fail(400,'This ticket is too long. Open a new one.')
t.thread.push({from:'user',text:m,at:now()})
t.status='open'
await put(c.env,'sup:'+t.id,t)
return pub(t)
},{auth:false})
r.add('GET','/api/admin/support',async c=>{
if(!c.user.admin)fail(404,'Not found')
const rows=(await c.env.DB.prepare("select v from app_settings where k like 'sup:%' order by rowid desc limit 150").all()).results
return{tickets:rows.map(x=>{try{const t=JSON.parse(x.v);delete t.kh;t.thread=threadOf(t);return t}catch{return null}}).filter(Boolean)}
})
r.add('POST','/api/admin/support/:id',async c=>{
if(!c.user.admin)fail(404,'Not found')
const t=await get(c.env,'sup:'+c.p.id)
if(!t)fail(404,'Ticket not found')
const b=await body(c.req,4096)
if(typeof b.reply==='string'&&b.reply.trim()){t.reply=b.reply.trim().slice(0,1500);t.thread=threadOf(t).filter(x=>x.text);t.thread.push({from:'staff',text:t.reply,at:now()})}
if(['open','answered','closed'].includes(b.status))t.status=b.status
else if(typeof b.reply==='string'&&b.reply.trim())t.status='answered'
await put(c.env,'sup:'+t.id,t)
return{ok:true}
})
const lcDesign=s=>{try{const j=JSON.parse(atob(String(s).replace(/-/g,'+').replace(/_/g,'/')));const n=(v,a,b,d)=>{v=Number(v);return Number.isFinite(v)?Math.max(a,Math.min(b,Math.round(v*10)/10)):d},col=v=>/^[0-9a-f]{6}$/i.test(v||'')?String(v):null,o={};
for(const k of['n','l','x','k']){const a=j[k];if(Array.isArray(a))o[k]=[n(a[0],-20,110,0),n(a[1],-20,110,0),n(a[2],6,120,16),n(a[3],-180,180,0),Math.round(n(a[4],0,17,0)),col(a[5]),a[6]?1:0]}
let a=j.a;if(Array.isArray(a))o.a=[n(a[0],-20,110,0),n(a[1],-20,110,0),n(a[2],16,220,64),n(a[3],-180,180,0),Math.round(n(a[4],0,2,0)),col(a[5]),a[6]?1:0]
a=j.b;if(Array.isArray(a))o.b=[n(a[0],-20,110,0),n(a[1],-20,110,0),n(a[2],5,100,70),n(a[3],2,60,12),n(a[4],-180,180,0),col(a[5]),a[6]?1:0,col(a[7]),n(a[8],0,30,6)]
o.d=n(j.d,0,90,35)
return o}catch{return null}}
r.add('GET','/api/lc/:k',async c=>{
limit('lc:'+c.user.id,120,60000)
let raw=''
try{raw=atob(String(c.p.k).replace(/-/g,'+').replace(/_/g,'/'))}catch{fail(404,'Not found')}
const[bot,sid,uid,stx]=raw.split('|')
if(!bot||!sid||!uid)fail(404,'Not found')
const me=await c.env.DB.prepare('select 1 x from members where server_id=? and user_id=?').bind(sid,c.user.id).first()
if(!me)fail(404,'Not found')
const u=await c.env.DB.prepare('select id,display_name,avatar_id,banner_id,accent,frame from users where id=? and deleted_at is null').bind(uid).first()
if(!u)fail(404,'Not found')
const xv=await c.env.DB.prepare('select v from bot_vars where bot_id=? and server_id=? and k=?').bind(bot,sid,'xp:'+uid).first()
const xp=Math.max(0,Number(xv&&xv.v)||0)
const L=Math.max(0,Math.floor((-1+Math.sqrt(1+xp/12.5))/2)),lo=50*L*(L+1),hi=50*(L+1)*(L+2)
const rk=await c.env.DB.prepare("select count(*) n from bot_vars where bot_id=? and server_id=? and k like 'xp:%' and cast(v as real)>?").bind(bot,sid,xp).first()
const sp=String(stx||'').split(','),hex=v=>/^#[0-9a-f]{6}$/i.test(v||'')?v:null,en=(v,a,d)=>a.includes(v)?v:d
const style={layout:en(sp[0],['banner','full','custom','blur','solid','split'],'banner'),pfp:en(sp[2],['left','center','ring','square','hidden'],'left'),bar:en(sp[3],['round','square','thin','thick','segment'],'round'),barcolor:hex(sp[4]),textcolor:hex(sp[5]),bg:null}
if(/^[A-Za-z0-9_-]{4,40}$/.test(sp[1]||'')){const f=await c.env.DB.prepare("select id from files where id=? and mime like 'image/%'").bind(sp[1]).first().catch(()=>null);if(f)style.bg=f.id}
const design=sp[7]==='1'?(lcDesign(sp[6]||'')||{}):null
return{design,style,name:u.display_name,id:u.id,avatar_id:u.avatar_id,banner_id:u.banner_id,accent:u.accent,frame:u.frame,level:L,cur:xp-lo,max:hi-lo,xp,rank:(rk&&rk.n||0)+1}
})
r.add('GET','/api/connections',async c=>{
const o=await get(c.env,'conn:'+c.user.id)
return{list:pubList(o),providers:[...Object.entries(P).filter(([k,v])=>ready(v,c.env)).map(([k,v])=>({p:k,label:v.name,verify:true,openid:k==='steam',hint:v.hint||'bio'})),...Object.entries(L).filter(([k])=>!(P[k]&&ready(P[k],c.env))).map(([k,v])=>({p:k,label:v.name,verify:false}))]}
})
r.add('GET','/api/connections/steam/login',async c=>{
limit('stlogin:'+c.user.id,20,3600000)
const origin=new URL(c.req.url).origin,nonce=randHex(16)
await put(c.env,'stn:'+nonce,{u:c.user.id,exp:now()+600000})
const ret=origin+'/api/connections/steam/return?n='+nonce
const q=new URLSearchParams({'openid.ns':'http://specs.openid.net/auth/2.0','openid.mode':'checkid_setup','openid.return_to':ret,'openid.realm':origin,'openid.identity':'http://specs.openid.net/auth/2.0/identifier_select','openid.claimed_id':'http://specs.openid.net/auth/2.0/identifier_select'})
return{url:'https://steamcommunity.com/openid/login?'+q}
})
r.add('GET','/api/connections/steam/return',async c=>{
const u=new URL(c.req.url),home=u.origin+'/settings/connections'
const go=m=>new Response(null,{status:302,headers:{location:home+(m?'?steam='+m:'')}})
const n=u.searchParams.get('n')||'',st=await get(c.env,'stn:'+n)
await c.env.DB.prepare('delete from app_settings where k=?').bind('stn:'+n).run()
if(!st||st.exp<now()||st.u!==c.user.id)return go('expired')
const claimed=u.searchParams.get('openid.claimed_id')||''
const m=/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/.exec(claimed)
if(!m||u.searchParams.get('openid.mode')!=='id_res')return go('cancelled')
if(u.searchParams.get('openid.return_to')!==u.origin+'/api/connections/steam/return?n='+n)return go('failed')
const vp=new URLSearchParams();for(const[k,v]of u.searchParams)if(k.startsWith('openid.'))vp.set(k,v)
vp.set('openid.mode','check_authentication')
let ok=false
try{const t=await fetch('https://steamcommunity.com/openid/login',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:vp}).then(r=>r.text());ok=/is_valid\s*:\s*true/.test(t)}catch{}
if(!ok)return go('failed')
const id=m[1],xk='connx:steam:'+id,x=await get(c.env,xk)
if(x&&x!==c.user.id)return go('taken')
let name=id
try{const t=await fetch('https://steamcommunity.com/profiles/'+id+'/?xml=1',{headers:UA}).then(r=>r.ok?r.text():'');const pn=/<steamID>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/steamID>/.exec(t);if(pn&&pn[1].trim())name=pn[1].trim().slice(0,40)}catch{}
const o=await get(c.env,'conn:'+c.user.id)||{}
o.steam={id,name,at:now()}
await put(c.env,'conn:'+c.user.id,o)
await put(c.env,xk,c.user.id)
return go('ok')
})
r.add('POST','/api/admin/users/:id/steam',async c=>{
if(!c.user.owner)fail(404,'Not found')
const b=await body(c.req,300)
const m=/(\d{17})/.exec(String(b.id||''))
if(!m)fail(400,'Enter a Steam profile link with a 17-digit ID, or the ID itself')
const t=await c.env.DB.prepare('select id from users where id=? and deleted_at is null').bind(c.p.id).first()
if(!t)fail(404,'User not found')
let name=m[1]
try{const x=await fetch('https://steamcommunity.com/profiles/'+m[1]+'/?xml=1',{headers:UA}).then(r=>r.ok?r.text():'');const pn=/<steamID>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/steamID>/.exec(x);if(pn&&pn[1].trim())name=pn[1].trim().slice(0,40)}catch{}
const o=await get(c.env,'conn:'+t.id)||{}
o.steam={id:m[1],name,at:now(),u:1}
await put(c.env,'conn:'+t.id,o)
return{ok:true,name}
})
r.add('POST','/api/connections/start',async c=>{
limit('connst:'+c.user.id,20,3600000)
const b=await body(c.req,512)
const p0=P[b.p]&&ready(P[b.p],c.env)?P[b.p]:null
if(!p0){
const lp=L[b.p]
if(!lp)fail(400,'Unknown service')
const ln=nm(b.name)
if(!lp.ok.test(ln))fail(400,'That username does not look right')
const lo=await get(c.env,'conn:'+c.user.id)||{}
lo[b.p]={id:ln,name:ln.replace(/^@/,''),at:now(),u:1}
await put(c.env,'conn:'+c.user.id,lo)
return{linked:true,list:pubList(lo)}
}
const p=p0
const n=nm(b.name)
if(!p.ok.test(n))fail(400,'That username does not look right')
const W='apple river cloud maple tiger stone happy green lemon piano ocean candy forest rabbit silver garden window pencil bridge sunny'.split(' '),pk=()=>W[crypto.getRandomValues(new Uint8Array(1))[0]%W.length],code=pk()+' '+pk()+' '+pk()+' '+pk()
await put(c.env,'connp:'+c.user.id+':'+b.p,{n,code,exp:now()+1800000})
return{code,name:n}
})
r.add('POST','/api/connections/link',async c=>{
limit('connln:'+c.user.id,30,3600000)
const b=await body(c.req,256),p=L[b.p]
if(!p)fail(400,'Unknown service')
const n=nm(b.name)
if(!p.ok.test(n))fail(400,'That username does not look right')
const o=await get(c.env,'conn:'+c.user.id)||{}
o[b.p]={id:n,name:n.replace(/^@/,''),at:now()}
await put(c.env,'conn:'+c.user.id,o)
return{list:pubList(o)}
})
r.add('POST','/api/connections/verify',async c=>{
limit('connvf:'+c.user.id,20,3600000)
const b=await body(c.req,256),p=P[b.p]
if(!p)fail(400,'Unknown service')
const k='connp:'+c.user.id+':'+b.p
const s=await get(c.env,k)
if(!s||s.exp<now())fail(400,'Start again, the code expired')
let u
try{u=await p.look(s.n,c.env)}catch{fail(502,p.name+' did not answer, try again in a minute')}
if(!u)fail(404,b.p==='steam'?'Steam did not let us read that profile. Use the Sign in with Steam button instead, it needs no public profile.':'Could not find that '+p.name+' account. Paste your profile link or custom ID, and make the profile and its summary public.')
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
const PLAY=new Map()
async function playing(o){
const st=o&&o.steam;if(!st||st.u||!st.id)return null
const hit=PLAY.get(st.id);if(hit&&hit.t>Date.now())return hit.v
let v=null
try{
const x=await fetch('https://steamcommunity.com/profiles/'+st.id+'/?xml=1',{headers:UA}).then(r=>r.ok?r.text():'')
const g=/<inGameInfo>([\s\S]*?)<\/inGameInfo>/.exec(x)
if(g){
const un=t=>String(t||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').trim()
const nm=/<gameName>([\s\S]*?)<\/gameName>/.exec(g[1]),ln=/<gameLink>([\s\S]*?)<\/gameLink>/.exec(g[1])
const app=/\/app\/(\d+)/.exec(un(ln&&ln[1]))
if(nm){
v={game:un(nm[1]).slice(0,80),app:app?app[1]:null,link:app?'https://store.steampowered.com/app/'+app[1]:null,provider:'Steam',desc:''}
if(app){try{const d=await fetch('https://store.steampowered.com/api/appdetails?appids='+app[1]+'&filters=short_description',{headers:UA}).then(r=>r.json());const dd=d&&d[app[1]]&&d[app[1]].data;if(dd&&dd.short_description)v.desc=String(dd.short_description).replace(/<[^>]*>/g,'').slice(0,160)}catch{}}
}}
}catch{}
if(PLAY.size>500)PLAY.clear()
PLAY.set(st.id,{t:Date.now()+(v?60000:30000),v})
return v
}
r.add('GET','/api/users/:uid/connections',async c=>{
limit('connget:'+c.user.id,120,60000)
const o=await get(c.env,'conn:'+c.p.uid)
return{list:pubList(o),playing:await playing(o)}
})
r.add('GET','/api/gameimg/:app',async c=>{
limit('gimg:'+c.user.id,200,60000)
if(!/^\d{1,10}$/.test(c.p.app))fail(404,'Not found')
const res=await fetch('https://cdn.cloudflare.steamstatic.com/steam/apps/'+c.p.app+'/header.jpg',{headers:UA})
if(!res.ok)fail(404,'Not found')
return new Response(res.body,{headers:{'content-type':'image/jpeg','cache-control':'private, max-age=86400','x-content-type-options':'nosniff'}})
})
}
