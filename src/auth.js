import{checkSecondFactor}from'./totp.js'
import{nameProblem,claimOwner,claimStmt,trimStmt}from'./names.js'
import{fail,now,newId,randHex,sha,pbkdf2,safeEq,str,opt,color,gradient,limit,body,json}from'./util.js'

export const STATUS="(case when u.status_until is null or u.status_until>cast(strftime('%s','now') as integer)*1000 then u.status_text else '' end) status_text"
export const GTAG="(select s.tag from servers s where s.id=u.tag_server and s.tag is not null and exists(select 1 from members mm where mm.server_id=s.id and mm.user_id=u.id)) guild_tag"
export const PUBLIC=`u.id,u.username,u.display_name,u.avatar_id,u.banner_id,u.bio,u.pronouns,${STATUS},u.status_until,u.links,u.accent,${GTAG},u.created_at`
const SESSION_MS=30*86400000
const NAME=/^[a-zA-Z0-9_.-]{3,24}$/

export function cookie(url,token,maxAge){
const secure=url.protocol==='https:'?'; Secure':''
return `sid=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

export const isOwner=(env,name)=>String(name||'').toLowerCase()===(env.OWNER_USERNAME||'ParleyOfficial').toLowerCase()
export function badgesOf(env,u){
const b=[]
if(isOwner(env,u.username))b.push('owner')
else if(u.is_admin)b.push('staff')
if(u.labs)b.push('experimental')
if(u.is_bot)b.push('bot')
return b
}
export async function sessionUser(env,req){
const ah=req.headers.get('authorization')||''
const bm=ah.match(/^Bot (pb_[a-f0-9]{64})$/)
if(bm){
const row=await env.DB.prepare('select u.* from bot_tokens t join users u on u.id=t.bot_id where t.token_hash=? and u.is_bot=1 and u.deleted_at is null and u.suspended=0').bind(await sha(bm[1])).first()
if(!row)return null
row.admin=false
return row
}
const c=req.headers.get('cookie')||''
const m=c.match(/(?:^|;\s*)sid=([a-f0-9]{64})/)
if(!m)return null
const id=await sha(m[1])
const row=await env.DB.prepare('select u.*,s.id sid,s.last_seen from sessions s join users u on u.id=s.user_id where s.id=? and s.expires_at>? and u.deleted_at is null and u.suspended=0').bind(id,now()).first()
if(!row)return null
if(now()-row.last_seen>3600000)await env.DB.prepare('update sessions set last_seen=?,expires_at=? where id=?').bind(now(),now()+SESSION_MS,id).run()
row.owner=isOwner(env,row.username)
row.admin=!!row.is_admin||row.owner||(env.ADMIN_USERNAMES||'').toLowerCase().split(',').map(s=>s.trim()).filter(Boolean).includes(row.username.toLowerCase())
return row
}

export const SETTINGS_KEYS={theme:['dimmed','silver','light','contrast'],density:['compact','comfortable','spacious'],dm_policy:['everyone','friends','none'],friend_policy:['everyone','none']}
export function cleanSettings(o){
if(!o||typeof o!=='object'||Array.isArray(o))fail(400,'Invalid settings')
const out={}
for(const[k,v]of Object.entries(o)){
if(k in SETTINGS_KEYS){if(!SETTINGS_KEYS[k].includes(v))fail(400,k+' is invalid');out[k]=v}
else if(['reduced_motion','show_presence','sound','desktop','dnd','quiet_on','send_ctrl_enter','link_previews'].includes(k)){if(typeof v!=='boolean')fail(400,k+' is invalid');out[k]=v}
else if(k==='font_size'){if(!Number.isInteger(v)||v<12||v>22)fail(400,'font_size is invalid');out.font_size=v}
else if(k==='ui_color'||k==='ui_bg'){if(typeof v!=='string'||(v!==''&&!/^#[0-9a-fA-F]{6}$/.test(v)))fail(400,k+' is invalid');out[k]=v.toLowerCase()}
else if(k==='quiet_start'||k==='quiet_end'){if(typeof v!=='string'||!/^\d\d:\d\d$/.test(v))fail(400,k+' is invalid');out[k]=v}
else if(k==='mute'){
if(!v||typeof v!=='object'||Object.keys(v).length>500)fail(400,'mute is invalid')
const mm={}
for(const[id,lvl]of Object.entries(v)){if(!['all','mentions','none'].includes(lvl))fail(400,'mute is invalid');mm[id.slice(0,40)]=lvl}
out.mute=mm
}
else fail(400,'Unknown setting '+k)
}
return out
}

export function linksOf(v){
try{const a=JSON.parse(v||'[]');return Array.isArray(a)?a.filter(x=>x&&typeof x.url==='string').slice(0,5).map(x=>({label:String(x.label||'').slice(0,24),url:x.url})):[]}catch{return[]}
}
function cleanLinks(v){
if(!Array.isArray(v)||v.length>5)fail(400,'Add up to 5 links')
return v.map(x=>{
const label=str(String(x&&x.label||''),1,24,'Link label')
let u
try{u=new URL(String(x&&x.url||''))}catch{fail(400,'Link addresses must be full https:// URLs')}
if(u.protocol!=='https:'||u.href.length>200)fail(400,'Link addresses must be https:// URLs under 200 characters')
return{label,url:u.href}
})
}
export function me(u){
let settings={}
try{settings=JSON.parse(u.settings)}catch{}
return{id:u.id,username:u.username,display_name:u.display_name,avatar_id:u.avatar_id,banner_id:u.banner_id,bio:u.bio,pronouns:u.pronouns,status_text:u.status_until&&u.status_until<=now()?'':u.status_text,presence:u.presence,accent:u.accent,settings,admin:u.admin,owner:!!u.owner,links:linksOf(u.links),status_until:u.status_until&&u.status_until>now()?u.status_until:null,totp_on:!!u.totp_on,labs:!!u.labs,adult_ok:!!u.adult_ok,tag_server:u.tag_server||null,created_at:u.created_at}
}

const tokenOf=(req,name)=>{
const m=(req.headers.get('cookie')||'').match(new RegExp('(?:^|;\\s*)'+name+'=([^;]*)'))
return m?m[1]:''
}
export function readStash(req){
return tokenOf(req,'sx').split('~').map(x=>{const i=x.lastIndexOf('.');return{uid:x.slice(0,i),token:x.slice(i+1)}}).filter(x=>/^u_[a-z0-9]+$/.test(x.uid)&&/^[a-f0-9]{64}$/.test(x.token)).slice(0,4)
}
export function stashCookie(url,list){
const secure=url.protocol==='https:'?'; Secure':''
return `sx=${list.map(x=>x.uid+'.'+x.token).join('~')}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${list.length?SESSION_MS/1000:0}${secure}`
}
export async function liveSession(env,token){
if(!/^[a-f0-9]{64}$/.test(token||''))return null
return env.DB.prepare('select s.id sid,u.id,u.username,u.display_name,u.avatar_id,u.accent from sessions s join users u on u.id=s.user_id where s.id=? and s.expires_at>? and u.deleted_at is null and u.suspended=0').bind(await sha(token),now()).first()
}
export async function makeSession(c,uid){
const token=randHex(32)
await c.env.DB.prepare('insert into sessions(id,user_id,created_at,expires_at,last_seen,ua,ip) values(?,?,?,?,?,?,?)').bind(await sha(token),uid,now(),now()+SESSION_MS,now(),(c.req.headers.get('user-agent')||'').slice(0,200),(c.req.headers.get('cf-connecting-ip')||'').split(':').slice(0,4).join(':').slice(0,45)).run()
const stash=readStash(c.req).filter(x=>x.uid!==uid)
const old=tokenOf(c.req,'sid')
const cur=old?await liveSession(c.env,old):null
if(cur&&cur.id!==uid&&!stash.some(x=>x.uid===cur.id))stash.unshift({uid:cur.id,token:old})
return[cookie(c.url,token,SESSION_MS/1000),stashCookie(c.url,stash.slice(0,4))]
}

export const ip=c=>c.req.headers.get('cf-connecting-ip')||'local'
export const iters=env=>Math.min(100000,Math.max(1000,parseInt(env.PBKDF2_ITERS)||100000))
export const recoveryCode=()=>{const h=randHex(10);return h.match(/.{5}/g).join('-')}

async function attempts(env,key){
const r=await env.DB.prepare('select n,reset_at from login_attempts where k=?').bind(key).first()
return r&&r.reset_at>now()?r.n:0
}
async function bump(env,key){
const t=now()
await env.DB.prepare('insert into login_attempts(k,n,reset_at) values(?,1,?) on conflict(k) do update set n=case when reset_at>? then n+1 else 1 end,reset_at=case when reset_at>? then reset_at else ? end').bind(key,t+900000,t,t,t+900000).run()
}

export function authRoutes(r){
r.add('POST','/api/auth/register',async c=>{
if(c.env.REGISTRATION_OPEN==='false')fail(403,'Registration is closed')
limit('reg:'+ip(c),10,3600000)
const b=await body(c.req)
const username=str(b.username,3,24,'Username')
if(!NAME.test(username))fail(400,'Username may only contain letters, numbers, dots, dashes and underscores')
const bad=nameProblem(c.env,username)
if(bad)fail(400,bad)
if(await claimOwner(c.env,username))fail(409,'That username is taken or too similar to an existing or previously used one')
const pw=str(b.password,10,200,'Password')
const dn=b.display_name?str(b.display_name,1,32,'Display name'):username
const salt=randHex(16)
const n=iters(c.env)
const hash=await pbkdf2(pw,salt,n)
const code=recoveryCode()
const id=newId('u')
try{
const t0=now()
await c.env.DB.batch([c.env.DB.prepare('insert into users(id,username,display_name,pass_hash,pass_salt,pass_iters,recovery_hash,created_at) values(?,?,?,?,?,?,?,?)').bind(id,username,dn,hash,salt,n,await sha(code),t0),claimStmt(c.env,id,username,t0)])
}catch(e){
if(String(e.message).includes('UNIQUE'))fail(409,'That username is taken or too similar to an existing or previously used one')
throw e
}
const setCookie=await makeSession(c,id)
const u=await c.env.DB.prepare('select * from users where id=?').bind(id).first()
u.owner=isOwner(c.env,username)
u.admin=u.owner||(c.env.ADMIN_USERNAMES||'').toLowerCase().split(',').map(s=>s.trim()).includes(username.toLowerCase())
return json({user:me(u),recovery_code:code},201,{'set-cookie':setCookie})
},{auth:false})

r.add('POST','/api/auth/login',async c=>{
limit('login:'+ip(c),30,900000)
const b=await body(c.req)
const username=str(b.username,1,40,'Username').toLowerCase()
const pw=str(b.password,1,200,'Password')
const key='u:'+username
if(await attempts(c.env,key)>=8||await attempts(c.env,'i:'+ip(c))>=40)fail(429,'Too many failed attempts. Try again in 15 minutes.')
const u=await c.env.DB.prepare('select * from users where username=? and deleted_at is null').bind(username).first()
const salt=u?u.pass_salt:'00'.repeat(16)
const h=await pbkdf2(pw,salt,u?u.pass_iters:iters(c.env))
if(!u||!safeEq(h,u.pass_hash)){
await bump(c.env,key)
await bump(c.env,'i:'+ip(c))
fail(401,'Invalid username or password')
}
if(u.suspended)fail(403,'This account is suspended. You can submit an appeal at /appeal.')
if(u.totp_on){
if(!b.totp)return json({error:'Enter your two-factor code',need_totp:true},401)
if(!await checkSecondFactor(c.env,u,String(b.totp))){await bump(c.env,key);await bump(c.env,'i:'+ip(c));return json({error:'Invalid two-factor code',need_totp:true},401)}
}
await c.env.DB.prepare('delete from login_attempts where k=?').bind(key).run()
const setCookie=await makeSession(c,u.id)
u.owner=isOwner(c.env,u.username)
u.admin=!!u.is_admin||u.owner||(c.env.ADMIN_USERNAMES||'').toLowerCase().split(',').map(s=>s.trim()).includes(u.username.toLowerCase())
return json({user:me(u)},200,{'set-cookie':setCookie})
},{auth:false})

r.add('POST','/api/auth/logout',async c=>{
await c.env.DB.prepare('delete from sessions where id=?').bind(c.user.sid).run()
return json({ok:true},200,{'set-cookie':cookie(c.url,'',0)})
})

r.add('GET','/api/accounts',async c=>{
const out=[]
if(c.user&&!c.user.is_bot)out.push({id:c.user.id,username:c.user.username,display_name:c.user.display_name,avatar_id:c.user.avatar_id,accent:c.user.accent,current:true})
for(const x of readStash(c.req)){
const s=await liveSession(c.env,x.token)
if(s&&s.id===x.uid&&!out.some(o=>o.id===s.id))out.push({id:s.id,username:s.username,display_name:s.display_name,avatar_id:s.avatar_id,accent:s.accent,current:false})
}
return{accounts:out}
},{auth:false})

r.add('POST','/api/accounts/switch',async c=>{
limit('swa:'+ip(c),60,600000)
const b=await body(c.req)
const stash=readStash(c.req)
const t=stash.find(x=>x.uid===String(b.user_id))
if(!t)fail(404,'That account is not saved on this device')
const s=await liveSession(c.env,t.token)
if(!s||s.id!==t.uid)fail(401,'That session expired. Sign in to the account again.')
const rest=stash.filter(x=>x!==t)
const old=tokenOf(c.req,'sid')
if(c.user&&old)rest.unshift({uid:c.user.id,token:old})
return json({ok:true},200,{'set-cookie':[cookie(c.url,t.token,SESSION_MS/1000),stashCookie(c.url,rest.slice(0,4))]})
},{auth:false})

r.add('POST','/api/accounts/remove',async c=>{
const b=await body(c.req)
const stash=readStash(c.req)
const t=stash.find(x=>x.uid===String(b.user_id))
if(!t)fail(404,'That account is not saved on this device')
await c.env.DB.prepare('delete from sessions where id=?').bind(await sha(t.token)).run()
return json({ok:true},200,{'set-cookie':stashCookie(c.url,stash.filter(x=>x!==t))})
},{auth:false})

r.add('POST','/api/auth/recover',async c=>{
limit('rec:'+ip(c),8,3600000)
const b=await body(c.req)
const username=str(b.username,1,40,'Username').toLowerCase()
const code=str(b.recovery_code,5,40,'Recovery code')
const pw=str(b.password,10,200,'Password')
if(await attempts(c.env,'r:'+username)>=5)fail(429,'Too many attempts. Try again later.')
const u=await c.env.DB.prepare('select * from users where username=? and deleted_at is null').bind(username).first()
if(!u||!u.recovery_hash||!safeEq(await sha(code.toLowerCase()),u.recovery_hash)){await bump(c.env,'r:'+username);fail(401,'Invalid username or recovery code')}
const salt=randHex(16)
const n=iters(c.env)
const next=recoveryCode()
await c.env.DB.batch([
c.env.DB.prepare('update users set pass_hash=?,pass_salt=?,pass_iters=?,recovery_hash=? where id=?').bind(await pbkdf2(pw,salt,n),salt,n,await sha(next),u.id),
c.env.DB.prepare('delete from sessions where user_id=?').bind(u.id)
])
return json({ok:true,recovery_code:next})
},{auth:false})

r.add('GET','/api/me',async c=>({user:me(c.user)}))

r.add('PATCH','/api/me',async c=>{
const b=await body(c.req,16384)
const sets=[],vals=[]
const add=(col,v)=>{sets.push(col+'=?');vals.push(v)}
if('display_name'in b)add('display_name',str(b.display_name,1,32,'Display name'))
if('bio'in b)add('bio',opt(b.bio,500,'Bio'))
if('pronouns'in b)add('pronouns',opt(b.pronouns,32,'Pronouns'))
if('status_text'in b){
add('status_text',opt(b.status_text,100,'Status'))
if(!('status_until'in b))add('status_until',null)
}
if('status_until'in b){
if(b.status_until===null)add('status_until',null)
else{
const t=Number(b.status_until)
if(!Number.isFinite(t)||t<=now()||t>now()+30*86400000)fail(400,'Status expiry must be within the next 30 days')
add('status_until',Math.floor(t))
}
}
if('links'in b)add('links',JSON.stringify(cleanLinks(b.links)))
if('accent'in b)add('accent',gradient(b.accent,'Accent'))
if('tag_server'in b){
if(b.tag_server===null)add('tag_server',null)
else{
const ok=await c.env.DB.prepare('select 1 x from members m join servers s on s.id=m.server_id where m.server_id=? and m.user_id=? and s.tag is not null').bind(String(b.tag_server),c.user.id).first()
if(!ok)fail(400,'Pick a server you are in that has a tag')
add('tag_server',String(b.tag_server))
}
}
if('presence'in b){if(!['online','idle','busy','invisible'].includes(b.presence))fail(400,'Invalid presence');add('presence',b.presence)}
if('settings'in b){
const cur=JSON.parse(c.user.settings||'{}')
const merged={...cur,...cleanSettings(b.settings)}
const s=JSON.stringify(merged)
if(s.length>8192)fail(400,'Settings are too large')
add('settings',s)
}
for(const k of['avatar_id','banner_id']){
if(k in b){
if(b[k]===null)add(k,null)
else{
const f=await c.env.DB.prepare('select id from files where id=? and owner_id=? and kind=?').bind(String(b[k]),c.user.id,k==='avatar_id'?'avatar':'banner').first()
if(!f)fail(400,'Upload the image first')
add(k,f.id)
}
}
}
const imgs=[]
for(const k of['avatar_id','banner_id'])if(b[k])imgs.push(k)
let renamed=null
if('username'in b){
limit('un:'+c.user.id,3,86400000)
const un=str(b.username,3,24,'Username')
if(!NAME.test(un))fail(400,'Username may only contain letters, numbers, dots, dashes and underscores')
const bad=nameProblem(c.env,un)
if(bad)fail(400,bad)
const own=await claimOwner(c.env,un)
if(own&&own.user_id!==c.user.id)fail(409,'That username is taken or too similar to an existing or previously used one')
add('username',un)
renamed=un
}
if(!sets.length)return{user:me(c.user)}
try{
const st=[c.env.DB.prepare(`update users set ${sets.join(',')} where id=?`).bind(...vals,c.user.id)]
if(renamed)st.push(claimStmt(c.env,c.user.id,renamed,now()),trimStmt(c.env,c.user.id))
for(const k of imgs){
const kind=k==='avatar_id'?'avatar':'banner'
st.push(c.env.DB.prepare('insert into profile_images(user_id,kind,file_id,created_at) values(?,?,?,?) on conflict(user_id,kind,file_id) do update set created_at=excluded.created_at').bind(c.user.id,kind,String(b[k]),now()))
}
await c.env.DB.batch(st)
}catch(e){if(String(e.message).includes('UNIQUE'))fail(409,'That username is taken or too similar to an existing or previously used one');throw e}
for(const k of imgs){
const kind=k==='avatar_id'?'avatar':'banner'
const old=(await c.env.DB.prepare('select p.file_id,f.r2_key from profile_images p left join files f on f.id=p.file_id where p.user_id=? and p.kind=? order by p.created_at desc limit -1 offset 24').bind(c.user.id,kind).all()).results
for(const o of old){
if(o.r2_key)await c.env.FILES.delete(o.r2_key)
await c.env.DB.batch([c.env.DB.prepare('delete from profile_images where user_id=? and kind=? and file_id=?').bind(c.user.id,kind,o.file_id),c.env.DB.prepare('delete from files where id=?').bind(o.file_id)])
}
}
const u=await c.env.DB.prepare('select * from users where id=?').bind(c.user.id).first()
u.admin=c.user.admin
u.owner=c.user.owner
c.pub('u_'+u.id,{t:'me.update'})
return{user:me(u)}
})

r.add('GET','/api/me/images',async c=>{
const kind=c.url.searchParams.get('kind')
if(kind!=='avatar'&&kind!=='banner')fail(400,'Choose avatar or banner')
const rows=(await c.env.DB.prepare('select p.file_id id,p.created_at,f.mime,f.size from profile_images p join files f on f.id=p.file_id where p.user_id=? and p.kind=? order by p.created_at desc limit 24').bind(c.user.id,kind).all()).results
const cur=kind==='avatar'?c.user.avatar_id:c.user.banner_id
return{images:rows.map(r=>({...r,current:r.id===cur}))}
})

r.add('DELETE','/api/me/images/:id',async c=>{
const kind=c.url.searchParams.get('kind')
if(kind!=='avatar'&&kind!=='banner')fail(400,'Choose avatar or banner')
const cur=kind==='avatar'?c.user.avatar_id:c.user.banner_id
if(c.p.id===cur)fail(400,'Switch to another image or remove it first')
const f=await c.env.DB.prepare('select r2_key from files where id=? and owner_id=? and kind=?').bind(c.p.id,c.user.id,kind).first()
if(!f)fail(404,'Image not found')
await c.env.FILES.delete(f.r2_key)
await c.env.DB.batch([c.env.DB.prepare('delete from profile_images where user_id=? and kind=? and file_id=?').bind(c.user.id,kind,c.p.id),c.env.DB.prepare('delete from files where id=?').bind(c.p.id)])
return{ok:true}
})

r.add('POST','/api/me/password',async c=>{
limit('pw:'+c.user.id,10,3600000)
const b=await body(c.req)
const cur=str(b.current_password,1,200,'Current password')
const pw=str(b.new_password,10,200,'New password')
if(!safeEq(await pbkdf2(cur,c.user.pass_salt,c.user.pass_iters),c.user.pass_hash))fail(403,'Current password is incorrect')
const salt=randHex(16)
const n=iters(c.env)
await c.env.DB.batch([
c.env.DB.prepare('update users set pass_hash=?,pass_salt=?,pass_iters=? where id=?').bind(await pbkdf2(pw,salt,n),salt,n,c.user.id),
c.env.DB.prepare('delete from sessions where user_id=? and id!=?').bind(c.user.id,c.user.sid)
])
return{ok:true}
})

r.add('POST','/api/me/recovery',async c=>{
limit('rcv:'+c.user.id,5,3600000)
const b=await body(c.req)
if(c.user.pass_hash==='!'){if(b.confirm!==c.user.username)fail(403,'Type your username to confirm')}
else if(!safeEq(await pbkdf2(str(b.password,1,200,'Password'),c.user.pass_salt,c.user.pass_iters),c.user.pass_hash))fail(403,'Password is incorrect')
const code=recoveryCode()
await c.env.DB.prepare('update users set recovery_hash=? where id=?').bind(await sha(code),c.user.id).run()
return{recovery_code:code}
})

r.add('GET','/api/sessions',async c=>{
const rows=(await c.env.DB.prepare('select id,created_at,last_seen,ua,ip from sessions where user_id=? and expires_at>? order by last_seen desc').bind(c.user.id,now()).all()).results
return{sessions:rows.map(s=>({...s,current:s.id===c.user.sid}))}
})

r.add('DELETE','/api/sessions/:id',async c=>{
await c.env.DB.prepare('delete from sessions where id=? and user_id=?').bind(c.p.id,c.user.id).run()
return{ok:true}
})

r.add('DELETE','/api/sessions',async c=>{
await c.env.DB.prepare('delete from sessions where user_id=? and id!=?').bind(c.user.id,c.user.sid).run()
return{ok:true}
})

r.add('POST','/api/me/delete',async c=>{
limit('del:'+c.user.id,5,3600000)
const b=await body(c.req)
if(c.user.pass_hash==='!'){if(b.confirm!==c.user.username)fail(403,'Type your username to confirm')}
else if(!safeEq(await pbkdf2(str(b.password,1,200,'Password'),c.user.pass_salt,c.user.pass_iters),c.user.pass_hash))fail(403,'Password is incorrect')
const owned=(await c.env.DB.prepare('select id,name from servers where owner_id=?').bind(c.user.id).all()).results
if(owned.length)return json({error:'Transfer or delete your servers first',servers:owned},409)
const files=(await c.env.DB.prepare('select r2_key from files where owner_id=? and kind!=?').bind(c.user.id,'attachment').all()).results
for(const f of files)await c.env.FILES.delete(f.r2_key)
await c.env.DB.batch([
c.env.DB.prepare('delete from members where user_id=?').bind(c.user.id),
c.env.DB.prepare('delete from member_roles where user_id=?').bind(c.user.id),
c.env.DB.prepare('delete from conv_members where user_id=?').bind(c.user.id),
c.env.DB.prepare('delete from friends where a=? or b=?').bind(c.user.id,c.user.id),
c.env.DB.prepare('delete from blocks where user_id=? or blocked_id=?').bind(c.user.id,c.user.id),
c.env.DB.prepare('delete from notifications where user_id=?').bind(c.user.id),
c.env.DB.prepare('delete from saved where user_id=?').bind(c.user.id),
c.env.DB.prepare('delete from read_state where user_id=?').bind(c.user.id),
c.env.DB.prepare('delete from sessions where user_id=?').bind(c.user.id),
c.env.DB.prepare('delete from oauth_identities where user_id=?').bind(c.user.id),
c.env.DB.prepare('delete from passkeys where user_id=?').bind(c.user.id),
c.env.DB.prepare('delete from files where owner_id=? and kind!=?').bind(c.user.id,'attachment'),
c.env.DB.prepare("update users set username=?,display_name='Deleted user',pass_hash='',pass_salt='00',recovery_hash=null,avatar_id=null,banner_id=null,bio='',pronouns='',status_text='',settings='{}',deleted_at=? where id=?").bind('deleted_'+c.user.id.slice(2,12),now(),c.user.id)
])
return json({ok:true},200,{'set-cookie':cookie(c.url,'',0)})
})

r.add('GET','/api/me/export',async c=>{
const q=(s,...a)=>c.env.DB.prepare(s).bind(...a).all().then(x=>x.results)
const data={
exported_at:now(),
profile:me(c.user),
servers:await q('select s.id,s.name,m.joined_at from members m join servers s on s.id=m.server_id where m.user_id=?',c.user.id),
friends:await q('select * from friends where a=? or b=?',c.user.id,c.user.id),
blocks:await q('select * from blocks where user_id=?',c.user.id),
saved:await q('select * from saved where user_id=?',c.user.id),
files:await q('select id,kind,name,mime,size,created_at from files where owner_id=?',c.user.id),
messages:await q('select id,room,content,created_at,edited_at,deleted_at from messages where author_id=? order by id desc limit 20000',c.user.id)
}
return new Response(JSON.stringify(data,null,1),{headers:{'content-type':'application/json','content-disposition':'attachment; filename="parley-export.json"','cache-control':'no-store'}})
})

r.add('POST','/api/appeals',async c=>{
limit('appeal:'+ip(c),5,3600000)
const b=await body(c.req)
const u=await c.env.DB.prepare('select id,suspended,pass_hash,pass_salt,pass_iters from users where username=? and deleted_at is null').bind(str(b.username,1,40,'Username').toLowerCase()).first()
if(!u||!u.suspended)fail(404,'No suspended account matches')
if(!safeEq(await pbkdf2(str(b.password,1,200,'Password'),u.pass_salt,u.pass_iters),u.pass_hash))fail(401,'Invalid credentials')
await c.env.DB.prepare('insert into appeals(id,user_id,server_id,message,created_at) values(?,?,?,?,?)').bind(newId('ap'),u.id,null,str(b.message,10,2000,'Message'),now()).run()
return{ok:true}
},{auth:false})
}
