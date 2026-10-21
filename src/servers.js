import{ownsVanity}from'./pars.js'
import{fireHooks}from'./devhooks.js'
import{runPlugins}from'./plugins.js'
import{expCfg,expActive}from'./program.js'
import{raidCheck}from'./perks.js'
import{fail,now,newId,rnd,str,opt,int,color,limit,body,json,clamp,placeholders}from'./util.js'
import{P,ALL,DEFAULT,loadMember,visibleChannels,chanPerms,channelAccess}from'./perms.js'
import{PUBLIC,STATUS,GTAG}from'./auth.js'
import{explicitText,serverText}from'./safety.js'
import{runJoin}from'./blocks.js'
import{caseStmt}from'./cases.js'

const like=s=>'%'+s.replace(/[\\%_]/g,'\\$&')+'%'
const themeOf=v=>{try{return v?JSON.parse(v):null}catch{return null}}
const SRV='id,owner_id,name,description,icon_id,banner_id,is_public,category,accent,theme,tag,tag_emoji,tag_icon_id,welcome,rules,verification,vanity,age_restricted,scan_explicit,created_at'
const CATS=['gaming','tech','art','music','education','science','community','other']

async function mem(c,sid){
const m=await loadMember(c.env,sid,c.user.id)
if(!m)fail(404,'Server not found')
return m
}
const must=(m,bit,msg='You do not have permission to do that')=>{if(!(m.base&bit))fail(403,msg)}
export async function target(c,sid,uid,m){
const t=await loadMember(c.env,sid,uid)
if(!t)fail(404,'Member not found')
if(t.owner)fail(403,'The server owner cannot be targeted')
if(!m.owner&&t.top>=m.top&&!(m.admin&&t.top<1))fail(403,'That member has an equal or higher role than you')
return t
}
export async function purgeServer(env,sid){
const files=(await env.DB.prepare('select f.r2_key from files f where f.room in (select id from channels where server_id=?) or f.server_id=?').bind(sid,sid).all()).results
for(const f of files)await env.FILES.delete(f.r2_key)
await env.DB.batch([
env.DB.prepare('delete from files where room in (select id from channels where server_id=?) or server_id=?').bind(sid,sid),
env.DB.prepare('delete from messages where room in (select id from channels where server_id=?)').bind(sid),
env.DB.prepare('delete from messages where room in (select id from threads where channel_id in (select id from channels where server_id=?))').bind(sid),
env.DB.prepare('delete from read_state where room in (select id from channels where server_id=?)').bind(sid),
env.DB.prepare('delete from member_roles where server_id=?').bind(sid),
...['xf_cfg','xf_state','xf_star','xf_xp','xf_rr','xf_give','xf_count','xf_qotd','xf_conf','xf_bday','xf_sugg','xf_sticky'].map(t=>env.DB.prepare(`delete from ${t} where server_id=?`).bind(sid)),
env.DB.prepare('delete from servers where id=?').bind(sid)
])
}
export async function sweepExplicitServers(env){
const rows=(await env.DB.prepare("select s.id,s.name,s.description,s.welcome,s.rules,s.vanity,(select group_concat(name,' ') from channels where server_id=s.id) ch,(select group_concat(name,' ') from categories where server_id=s.id) ct from servers s").all()).results
const hit=rows.filter(s=>explicitText(serverText(s)+' '+(s.ch||'')+' '+(s.ct||'')))
for(const s of hit)await purgeServer(env,s.id)
return hit.map(s=>s.id)
}
const resync=(c,sid)=>c.pubClose('s_'+sid,{closeAll:true})
const INVIS=/[\u00AD\u034F\u115F\u1160\u180E\u200B-\u200F\u2028-\u202F\u2060-\u206F\u3164\uFE00-\uFE0E\uFEFF\uFFA0]/g
const nameOk=v=>{
const t=v.replace(INVIS,'').replace(/\s+/g,' ').trim()
if(/\p{M}{3,}/u.test(t))fail(400,'Too many stacked marks in that name')
if((t.match(/\p{Extended_Pictographic}/gu)||[]).length>3)fail(400,'Use at most 3 emoji in a server name')
return t}
const clean=v=>{if(explicitText(v))fail(400,'That text is not allowed on Parley');return v}
const channelName=v=>{const n=clean(str(v,1,50,'Channel name'));if(/[\u0000-\u001f]/.test(n))fail(400,'Invalid channel name');return n}

function limitPerms(m,perms,what='permissions'){
const p=int(perms,0,ALL,what)
if(!m.owner&&(p&~m.base)!==0)fail(403,'You cannot grant permissions you do not have')
return p
}

export default function(r){
r.add('POST','/api/servers',async c=>{
limit('mksrv:'+c.user.id,10,3600000)
const b=await body(c.req)
const name=clean(nameOk(str(b.name,2,60,'Server name')))
const desc=clean(opt(b.description,500,'Description'))
const pub=b.is_public?1:0
const cat=b.category&&CATS.includes(b.category)?b.category:''
const sid=newId('sv')
const ev=newId('r')
const cat1=newId('ct'),cat2=newId('ct')
const t=now()
const gen=newId('ch')
await c.env.DB.batch([
c.env.DB.prepare('insert into servers(id,owner_id,name,description,is_public,category,created_at) values(?,?,?,?,?,?,?)').bind(sid,c.user.id,name,desc,pub,cat,t),
c.env.DB.prepare('insert into roles(id,server_id,name,position,perms,is_everyone) values(?,?,?,?,?,1)').bind(ev,sid,'@everyone',0,DEFAULT),
c.env.DB.prepare('insert into members(server_id,user_id,joined_at) values(?,?,?)').bind(sid,c.user.id,t),
c.env.DB.prepare('insert into categories(id,server_id,name,position) values(?,?,?,0),(?,?,?,1)').bind(cat1,sid,'Text channels',cat2,sid,'Voice channels'),
c.env.DB.prepare('insert into channels(id,server_id,category_id,name,type,position,created_at) values(?,?,?,?,?,0,?),(?,?,?,?,?,1,?)').bind(gen,sid,cat1,'general','text',t,newId('ch'),sid,cat2,'Lounge','voice',t)
])
return json({id:sid,default_channel:gen},201)
})

r.add('GET','/api/servers',async c=>{
const rows=(await c.env.DB.prepare('select s.id,s.name,s.tag,s.tag_emoji,s.tag_icon_id,s.icon_id,s.banner_id,s.owner_id,s.is_public,s.accent,m.joined_at from members m join servers s on s.id=m.server_id where m.user_id=? order by m.joined_at').bind(c.user.id).all()).results
return{servers:rows}
})

r.add('GET','/api/servers/:sid',async c=>{
const m=await mem(c,c.p.sid)
const vis=await visibleChannels(c.env,m)
const cats=(await c.env.DB.prepare('select * from categories where server_id=? order by position').bind(m.server.id).all()).results
const roles=(await c.env.DB.prepare('select id,name,color,position,perms,is_everyone from roles where server_id=? order by position desc').bind(m.server.id).all()).results
const count=await c.env.DB.prepare('select count(*) n from members where server_id=?').bind(m.server.id).first()
const emoji=(await c.env.DB.prepare('select id,name,file_id from emoji where server_id=? order by name').bind(m.server.id).all()).results
const s=m.server
const expc=await expCfg(c.env)
return{
server:{id:s.id,owner_id:s.owner_id,name:s.name,description:s.description,icon_id:s.icon_id,banner_id:s.banner_id,is_public:s.is_public,category:s.category,accent:s.accent,tag:s.tag||null,tag_emoji:s.tag_emoji||null,tag_icon_id:s.tag_icon_id||null,theme:themeOf(s.theme),vanity:s.vanity||null,block_ext_emoji:!!s.block_ext_emoji,retention_days:s.retention_days||0,experimental:expActive(s,expc),welcome:s.welcome,rules:s.rules,age_restricted:s.age_restricted,scan_explicit:s.scan_explicit,verification:s.verification,created_at:s.created_at},
me:{perms:m.base,role_ids:m.roleIds,owner:m.owner,nickname:m.nickname,timeout_until:m.timeout_until,top:m.owner?9999:m.top},
categories:cats,
channels:vis.map(({ch,perms})=>({id:ch.id,category_id:ch.category_id,name:ch.name,type:ch.type,topic:ch.topic,position:ch.position,readonly:ch.readonly,locked:ch.locked,slowmode:ch.slowmode,last_msg:ch.last_msg,perms})),
roles,
emoji,
members:count.n
}
})

r.add('PATCH','/api/servers/:sid',async c=>{
const m=await mem(c,c.p.sid)
must(m,P.MANAGE_SERVER)
const b=await body(c.req)
const sets=[],vals=[]
const add=(k,v)=>{sets.push(k+'=?');vals.push(v)}
if('name'in b)add('name',clean(nameOk(str(b.name,2,60,'Server name'))))
if('description'in b)add('description',clean(opt(b.description,500,'Description')))
if('is_public'in b)add('is_public',b.is_public?1:0)
if('category'in b){if(b.category&&!CATS.includes(b.category))fail(400,'Invalid category');add('category',b.category||'')}
if('accent'in b)add('accent',color(b.accent,'Accent'))
if('tag'in b){
const tg=String(b.tag||'').trim().toUpperCase()
if(tg&&!/^[A-Z0-9]{2,4}$/.test(tg))fail(400,'A tag is 2 to 4 letters or numbers')
if(tg&&explicitText(tg))fail(400,'That tag is not allowed on Parley')
add('tag',tg||null)
}
if('tag_emoji'in b){
const em=String(b.tag_emoji||'').trim()
if(em&&([...new Intl.Segmenter().segment(em)].length!==1||em.length>16||!/^\p{Extended_Pictographic}/u.test(em)||/[A-Za-z0-9]/.test(em)))fail(400,'Pick one emoji for the tag')
add('tag_emoji',em||null)
}
if('theme'in b){
if(b.theme===null)add('theme',null)
else{
const t=b.theme
if(typeof t!=='object'||Array.isArray(t))fail(400,'Invalid theme')
const o={}
for(const k of['bg','side','panel','text','accent']){const v=color(t[k],'Theme '+k);if(v)o[k]=v}
o.dim=int(t.dim??55,0,90,'Background dim')
if(t.image){
const f=await c.env.DB.prepare('select id from files where id=? and kind=? and server_id=?').bind(String(t.image),'server_bg',m.server.id).first()
if(!f)fail(400,'Upload the background image first')
o.image=f.id
}
add('theme',JSON.stringify(o))
}
}
if('block_ext_emoji'in b)add('block_ext_emoji',b.block_ext_emoji?1:0)
if('retention_days'in b){if(![0,30,90,365].includes(b.retention_days))fail(400,'Choose off, 30, 90 or 365 days');add('retention_days',b.retention_days)}
if('welcome'in b)add('welcome',clean(opt(b.welcome,1000,'Welcome message')))
if('rules'in b)add('rules',clean(opt(b.rules,3000,'Rules')))
if('verification'in b)add('verification',int(b.verification,0,2,'Verification level'))
if('age_restricted'in b||'scan_explicit'in b){
const age='age_restricted'in b?(b.age_restricted?1:0):m.server.age_restricted
const scan=age?('scan_explicit'in b?(b.scan_explicit?1:0):m.server.scan_explicit):0
if('scan_explicit'in b&&b.scan_explicit&&!age)fail(400,'Turn on 18+ Only before enabling the explicit content scanner')
if(age&&!m.server.age_restricted&&!c.user.adult_ok)fail(403,'Confirm you are 18 or older in Settings first')
if('age_restricted'in b)add('age_restricted',age)
add('scan_explicit',scan)
}
for(const[k,kind]of[['icon_id','server_icon'],['banner_id','server_banner'],['tag_icon_id','server_icon']]){
if(k in b){
if(b[k]===null)add(k,null)
else{
const f=await c.env.DB.prepare('select id from files where id=? and kind=? and server_id=?').bind(String(b[k]),kind,m.server.id).first()
if(!f)fail(400,'Upload the image first')
add(k,f.id)
}
}
}
if(!sets.length)return{ok:true}
await c.env.DB.batch([c.env.DB.prepare(`update servers set ${sets.join(',')} where id=?`).bind(...vals,m.server.id),c.logStmt(m.server.id,'server.update',m.server.id,Object.keys(b).join(','))])
c.pub('s_'+m.server.id,{t:'server.update'})
return{ok:true}
})

r.add('POST','/api/servers/:sid/delete',async c=>{
const m=await mem(c,c.p.sid)
if(!m.owner)fail(403,'Only the owner can delete a server')
const b=await body(c.req)
if(b.name!==m.server.name)fail(400,'Type the server name exactly to confirm')
await purgeServer(c.env,m.server.id)
c.pub('s_'+m.server.id,{t:'server.deleted',id:m.server.id})
c.pubClose('s_'+m.server.id,{closeAll:true})
return{ok:true}
})

r.add('POST','/api/servers/:sid/transfer',async c=>{
const m=await mem(c,c.p.sid)
if(!m.owner)fail(403,'Only the owner can transfer ownership')
const b=await body(c.req)
const t=await c.env.DB.prepare('select 1 x from members where server_id=? and user_id=?').bind(m.server.id,String(b.user_id)).first()
if(!t)fail(404,'That user is not a member')
if(b.user_id===c.user.id)fail(400,'You already own this server')
await c.env.DB.batch([c.env.DB.prepare('update servers set owner_id=? where id=?').bind(b.user_id,m.server.id),c.logStmt(m.server.id,'server.transfer',b.user_id)])
c.pub('s_'+m.server.id,{t:'server.update'})
c.pubClose('s_'+m.server.id,{close:[c.user.id,b.user_id]})
return{ok:true}
})

r.add('POST','/api/servers/:sid/leave',async c=>{
const m=await mem(c,c.p.sid)
if(m.owner)fail(400,'Transfer ownership or delete the server before leaving')
await c.env.DB.batch([
c.env.DB.prepare('delete from member_roles where server_id=? and user_id=?').bind(m.server.id,c.user.id),
c.env.DB.prepare('delete from members where server_id=? and user_id=?').bind(m.server.id,c.user.id),
c.env.DB.prepare('delete from read_state where user_id=? and room in (select id from channels where server_id=?)').bind(c.user.id,m.server.id)
])
c.pub('s_'+m.server.id,{t:'member.leave',uid:c.user.id})
runPlugins(c,m.server.id,'leave',c.user)
c.pubClose('s_'+m.server.id,{close:[c.user.id],purge:true})
return{ok:true}
})

r.add('GET','/api/servers/:sid/activity',async c=>{
const m=await mem(c,c.p.sid)
must(m,P.MANAGE_SERVER)
const t=now()
const q=(s,...a)=>c.env.DB.prepare(s).bind(...a).first()
const [d1,d7,mem7,tot]=await Promise.all([
q('select count(*) n from messages where server_id=? and created_at>?',m.server.id,t-86400000),
q('select count(*) n from messages where server_id=? and created_at>?',m.server.id,t-7*86400000),
q('select count(*) n from members where server_id=? and joined_at>?',m.server.id,t-7*86400000),
q('select count(*) n from members where server_id=?',m.server.id)
])
return{messages_24h:d1.n,messages_7d:d7.n,new_members_7d:mem7.n,members:tot.n}
})

r.add('POST','/api/servers/:sid/categories',async c=>{
const m=await mem(c,c.p.sid)
must(m,P.MANAGE_CHANNELS)
const b=await body(c.req)
const id=newId('ct')
const pos=await c.env.DB.prepare('select coalesce(max(position),-1)+1 p from categories where server_id=?').bind(m.server.id).first()
await c.env.DB.prepare('insert into categories(id,server_id,name,position) values(?,?,?,?)').bind(id,m.server.id,clean(str(b.name,1,40,'Category name')),pos.p).run()
c.pub('s_'+m.server.id,{t:'server.update'})
return json({id},201)
})
r.add('PATCH','/api/servers/:sid/categories/:cid',async c=>{
const m=await mem(c,c.p.sid)
must(m,P.MANAGE_CHANNELS)
const b=await body(c.req)
const res=await c.env.DB.prepare('update categories set name=coalesce(?,name),position=coalesce(?,position) where id=? and server_id=?').bind('name'in b?clean(str(b.name,1,40,'Category name')):null,'position'in b?int(b.position,0,999,'Position'):null,c.p.cid,m.server.id).run()
if(!res.meta.changes)fail(404,'Category not found')
c.pub('s_'+m.server.id,{t:'server.update'})
return{ok:true}
})
r.add('DELETE','/api/servers/:sid/categories/:cid',async c=>{
const m=await mem(c,c.p.sid)
must(m,P.MANAGE_CHANNELS)
await c.env.DB.batch([c.env.DB.prepare('update channels set category_id=null where category_id=? and server_id=?').bind(c.p.cid,m.server.id),c.env.DB.prepare('delete from categories where id=? and server_id=?').bind(c.p.cid,m.server.id)])
c.pub('s_'+m.server.id,{t:'server.update'})
return{ok:true}
})

r.add('POST','/api/servers/:sid/channels',async c=>{
const m=await mem(c,c.p.sid)
must(m,P.MANAGE_CHANNELS)
const b=await body(c.req)
const type=b.type||'text'
if(!['text','announce','voice','forum'].includes(type))fail(400,'Invalid channel type')
const count=await c.env.DB.prepare('select count(*) n from channels where server_id=?').bind(m.server.id).first()
if(count.n>=200)fail(400,'This server has reached the channel limit (200)')
if(b.category_id){const ok=await c.env.DB.prepare('select 1 x from categories where id=? and server_id=?').bind(b.category_id,m.server.id).first();if(!ok)fail(400,'Category not found')}
const pos=await c.env.DB.prepare('select coalesce(max(position),-1)+1 p from channels where server_id=?').bind(m.server.id).first()
const id=newId('ch')
await c.env.DB.batch([
c.env.DB.prepare('insert into channels(id,server_id,category_id,name,type,topic,position,readonly,slowmode,created_at) values(?,?,?,?,?,?,?,?,?,?)').bind(id,m.server.id,b.category_id||null,channelName(b.name),type,clean(opt(b.topic,300,'Topic')),pos.p,b.readonly?1:0,int(b.slowmode??0,0,21600,'Slow mode'),now()),
c.logStmt(m.server.id,'channel.create',id,b.name)
])
resync(c,m.server.id)
return json({id},201)
})

async function chanCtx(c,cid,bit=P.MANAGE_CHANNELS){
const ch=await c.env.DB.prepare('select * from channels where id=?').bind(cid).first()
if(!ch)fail(404,'Channel not found')
const m=await mem(c,ch.server_id)
const a=await channelAccess(c.env,m,cid)
if(!(a.perms&P.VIEW))fail(404,'Channel not found')
if(!(m.base&bit)&&!m.admin)fail(403,'You do not have permission to do that')
return{ch,m}
}

r.add('PATCH','/api/channels/:cid',async c=>{
const{ch,m}=await chanCtx(c,c.p.cid)
const b=await body(c.req)
const sets=[],vals=[]
const add=(k,v)=>{sets.push(k+'=?');vals.push(v)}
if('name'in b)add('name',channelName(b.name))
if('topic'in b)add('topic',clean(opt(b.topic,300,'Topic')))
if('readonly'in b)add('readonly',b.readonly?1:0)
if('locked'in b)add('locked',b.locked?1:0)
if('slowmode'in b)add('slowmode',int(b.slowmode,0,21600,'Slow mode'))
if('position'in b)add('position',int(b.position,0,9999,'Position'))
if('type'in b){if(!['text','announce'].includes(b.type)||!['text','announce'].includes(ch.type))fail(400,'Invalid channel type change');add('type',b.type)}
if('category_id'in b){
if(b.category_id){const ok=await c.env.DB.prepare('select 1 x from categories where id=? and server_id=?').bind(b.category_id,ch.server_id).first();if(!ok)fail(400,'Category not found')}
add('category_id',b.category_id||null)
}
if(!sets.length)return{ok:true}
await c.env.DB.batch([c.env.DB.prepare(`update channels set ${sets.join(',')} where id=?`).bind(...vals,ch.id),c.logStmt(ch.server_id,'channel.update',ch.id,Object.keys(b).join(','))])
c.pub('s_'+ch.server_id,{t:'server.update'})
return{ok:true}
})

r.add('DELETE','/api/channels/:cid',async c=>{
const{ch}=await chanCtx(c,c.p.cid)
const left=await c.env.DB.prepare('select count(*) n from channels where server_id=?').bind(ch.server_id).first()
if(left.n<=1)fail(400,'A server needs at least one channel')
const files=(await c.env.DB.prepare('select r2_key from files where room=?').bind(ch.id).all()).results
for(const f of files)await c.env.FILES.delete(f.r2_key)
await c.env.DB.batch([
c.env.DB.prepare('delete from files where room=?').bind(ch.id),
c.env.DB.prepare('delete from reactions where message_id in (select id from messages where room=?)').bind(ch.id),
c.env.DB.prepare('delete from messages where room=?').bind(ch.id),
c.env.DB.prepare('delete from read_state where room=?').bind(ch.id),
c.env.DB.prepare('delete from channels where id=?').bind(ch.id),
c.logStmt(ch.server_id,'channel.delete',ch.id,ch.name)
])
resync(c,ch.server_id)
return{ok:true}
})

r.add('POST','/api/servers/:sid/reorder',async c=>{
const m=await mem(c,c.p.sid)
must(m,P.MANAGE_CHANNELS)
const b=await body(c.req)
const stmts=[]
for(const x of(Array.isArray(b.channels)?b.channels:[]).slice(0,200))stmts.push(c.env.DB.prepare('update channels set position=?,category_id=? where id=? and server_id=?').bind(int(x.position,0,9999,'Position'),x.category_id||null,String(x.id),m.server.id))
for(const x of(Array.isArray(b.categories)?b.categories:[]).slice(0,100))stmts.push(c.env.DB.prepare('update categories set position=? where id=? and server_id=?').bind(int(x.position,0,9999,'Position'),String(x.id),m.server.id))
if(stmts.length)await c.env.DB.batch(stmts)
c.pub('s_'+m.server.id,{t:'server.update'})
return{ok:true}
})

r.add('PUT','/api/servers/:sid/categories/:cid/overrides',async c=>{
const m=await mem(c,c.p.sid)
must(m,P.MANAGE_CHANNELS)
const b=await body(c.req)
if(!['role','user'].includes(b.target_type))fail(400,'Invalid target type')
const allow=int(b.allow??0,0,ALL,'allow'),deny=int(b.deny??0,0,ALL,'deny')
if(allow&deny)fail(400,'A permission cannot be both allowed and denied')
if(!m.owner&&!m.admin&&((allow|deny)&~m.base)!==0)fail(403,'You cannot change permissions you do not have')
const cat=await c.env.DB.prepare('select id,name from categories where id=? and server_id=?').bind(c.p.cid,m.server.id).first()
if(!cat)fail(404,'Category not found')
const tid=String(b.target_id)
if(b.target_type==='role'){
const role=await c.env.DB.prepare('select id,position,is_everyone from roles where id=? and server_id=?').bind(tid,m.server.id).first()
if(!role)fail(404,'Role not found')
if(!role.is_everyone&&!m.owner&&role.position>=m.top)fail(403,'That role is above yours')
}else if(!await c.env.DB.prepare('select 1 x from members where server_id=? and user_id=?').bind(m.server.id,tid).first())fail(404,'Member not found')
const chans=(await c.env.DB.prepare('select id from channels where category_id=? and server_id=?').bind(cat.id,m.server.id).all()).results
const stmts=[]
let applied=0
for(const ch of chans){
const a=await channelAccess(c.env,m,ch.id)
if(!(a.perms&P.VIEW))continue
applied++
stmts.push(allow||deny?c.env.DB.prepare('insert into overrides(channel_id,target_type,target_id,allow,deny) values(?,?,?,?,?) on conflict(channel_id,target_type,target_id) do update set allow=excluded.allow,deny=excluded.deny').bind(ch.id,b.target_type,tid,allow,deny):c.env.DB.prepare('delete from overrides where channel_id=? and target_type=? and target_id=?').bind(ch.id,b.target_type,tid))
}
stmts.push(c.logStmt(m.server.id,'category.override',cat.id,`${b.target_type}:${tid} allow=${allow} deny=${deny} channels=${applied}`))
await c.env.DB.batch(stmts)
resync(c,m.server.id)
return{ok:true,applied,skipped:chans.length-applied}
})

r.add('GET','/api/channels/:cid/overrides',async c=>{
const{ch}=await chanCtx(c,c.p.cid)
return{overrides:(await c.env.DB.prepare('select target_type,target_id,allow,deny from overrides where channel_id=?').bind(ch.id).all()).results}
})

r.add('PUT','/api/channels/:cid/overrides',async c=>{
const{ch,m}=await chanCtx(c,c.p.cid)
const b=await body(c.req)
if(!['role','user'].includes(b.target_type))fail(400,'Invalid target type')
const allow=int(b.allow??0,0,ALL,'allow'),deny=int(b.deny??0,0,ALL,'deny')
if(allow&deny)fail(400,'A permission cannot be both allowed and denied')
if(!m.owner&&!m.admin&&((allow|deny)&~m.base)!==0)fail(403,'You cannot change permissions you do not have')
const tid=String(b.target_id)
if(b.target_type==='role'){
const role=await c.env.DB.prepare('select id,position,is_everyone from roles where id=? and server_id=?').bind(tid,ch.server_id).first()
if(!role)fail(404,'Role not found')
if(!role.is_everyone&&!m.owner&&role.position>=m.top)fail(403,'That role is above yours')
}else{
const t=await c.env.DB.prepare('select 1 x from members where server_id=? and user_id=?').bind(ch.server_id,tid).first()
if(!t)fail(404,'Member not found')
}
await c.env.DB.batch([
c.env.DB.prepare('insert into overrides(channel_id,target_type,target_id,allow,deny) values(?,?,?,?,?) on conflict(channel_id,target_type,target_id) do update set allow=excluded.allow,deny=excluded.deny').bind(ch.id,b.target_type,tid,allow,deny),
c.logStmt(ch.server_id,'channel.override',ch.id,`${b.target_type}:${tid} allow=${allow} deny=${deny}`)
])
resync(c,ch.server_id)
return{ok:true}
})

r.add('DELETE','/api/channels/:cid/overrides/:type/:tid',async c=>{
const{ch}=await chanCtx(c,c.p.cid)
await c.env.DB.prepare('delete from overrides where channel_id=? and target_type=? and target_id=?').bind(ch.id,c.p.type,c.p.tid).run()
resync(c,ch.server_id)
return{ok:true}
})

r.add('POST','/api/servers/:sid/roles',async c=>{
const m=await mem(c,c.p.sid)
must(m,P.MANAGE_ROLES)
const b=await body(c.req)
if(!m.owner&&m.top<=1)fail(403,'Your highest role must be above the new role')
const n=await c.env.DB.prepare('select count(*) n from roles where server_id=?').bind(m.server.id).first()
if(n.n>=100)fail(400,'Role limit reached (100)')
const perms=limitPerms(m,b.perms??0)
if((perms&P.ADMIN)&&!m.admin)fail(403,'Only administrators can grant Administrator')
const id=newId('r')
await c.env.DB.batch([
c.env.DB.prepare('insert into roles(id,server_id,name,color,position,perms) values(?,?,?,?,?,?)').bind(id,m.server.id,str(b.name,1,40,'Role name'),color(b.color,'Color'),1,perms),
c.logStmt(m.server.id,'role.create',id,b.name)
])
c.pub('s_'+m.server.id,{t:'server.update'})
return json({id},201)
})

async function roleCtx(c){
const m=await mem(c,c.p.sid)
must(m,P.MANAGE_ROLES)
const role=await c.env.DB.prepare('select * from roles where id=? and server_id=?').bind(c.p.rid,m.server.id).first()
if(!role)fail(404,'Role not found')
if(!m.owner&&role.position>=m.top)fail(403,'That role is above your highest role')
return{m,role}
}

r.add('PATCH','/api/servers/:sid/roles/:rid',async c=>{
const{m,role}=await roleCtx(c)
const b=await body(c.req)
const sets=[],vals=[]
const add=(k,v)=>{sets.push(k+'=?');vals.push(v)}
if('name'in b&&!role.is_everyone)add('name',str(b.name,1,40,'Role name'))
if('color'in b)add('color',color(b.color,'Color'))
if('perms'in b){
const p=limitPerms(m,b.perms)
if(((p&P.ADMIN)!==(role.perms&P.ADMIN))&&!m.admin)fail(403,'Only administrators can change Administrator')
add('perms',p)
}
if('position'in b&&!role.is_everyone){
const pos=int(b.position,1,999,'Position')
if(!m.owner&&pos>=m.top)fail(403,'You cannot move a role above your own')
add('position',pos)
}
if(!sets.length)return{ok:true}
await c.env.DB.batch([c.env.DB.prepare(`update roles set ${sets.join(',')} where id=?`).bind(...vals,role.id),c.logStmt(m.server.id,'role.update',role.id,Object.keys(b).join(','))])
resync(c,m.server.id)
return{ok:true}
})

r.add('DELETE','/api/servers/:sid/roles/:rid',async c=>{
const{m,role}=await roleCtx(c)
if(role.is_everyone)fail(400,'The @everyone role cannot be deleted')
await c.env.DB.batch([c.env.DB.prepare('delete from overrides where target_type=? and target_id=?').bind('role',role.id),c.env.DB.prepare('delete from roles where id=?').bind(role.id),c.logStmt(m.server.id,'role.delete',role.id,role.name)])
resync(c,m.server.id)
return{ok:true}
})

r.add('PUT','/api/servers/:sid/members/:uid/roles/:rid',async c=>{
const{m,role}=await roleCtx(c)
if(role.is_everyone)fail(400,'Everyone already has this role')
if(c.p.uid!==c.user.id)await target(c,m.server.id,c.p.uid,m)
else if(!m.owner)fail(403,'You cannot assign roles to yourself')
const t=await c.env.DB.prepare('select 1 x from members where server_id=? and user_id=?').bind(m.server.id,c.p.uid).first()
if(!t)fail(404,'Member not found')
await c.env.DB.batch([c.env.DB.prepare('insert or ignore into member_roles(server_id,user_id,role_id) values(?,?,?)').bind(m.server.id,c.p.uid,role.id),c.logStmt(m.server.id,'role.assign',c.p.uid,role.name)])
c.pubClose('s_'+m.server.id,{close:[c.p.uid]})
c.pub('s_'+m.server.id,{t:'member.update',uid:c.p.uid})
return{ok:true}
})

r.add('DELETE','/api/servers/:sid/members/:uid/roles/:rid',async c=>{
const{m,role}=await roleCtx(c)
if(c.p.uid!==c.user.id)await target(c,m.server.id,c.p.uid,m)
await c.env.DB.batch([c.env.DB.prepare('delete from member_roles where server_id=? and user_id=? and role_id=?').bind(m.server.id,c.p.uid,role.id),c.logStmt(m.server.id,'role.unassign',c.p.uid,role.name)])
c.pubClose('s_'+m.server.id,{close:[c.p.uid]})
c.pub('s_'+m.server.id,{t:'member.update',uid:c.p.uid})
return{ok:true}
})

r.add('GET','/api/servers/:sid/members',async c=>{
const m=await mem(c,c.p.sid)
const q=(c.url.searchParams.get('q')||'').trim().slice(0,40)
const after=c.url.searchParams.get('after')||''
const lim=clamp(c.url.searchParams.get('limit'),50,1,100)
const args=[m.server.id]
let where=''
if(q){where=" and (u.username like ? escape '\\' or u.display_name like ? escape '\\' or m.nickname like ? escape '\\')";args.push(like(q),like(q),like(q))}
args.push(after,lim)
const rows=(await c.env.DB.prepare(`select u.id,u.username,u.display_name,u.avatar_id,u.accent,u.nameplate,u.frame,u.effect,u.namefx,u.badge,u.title,u.bubble,${GTAG},${STATUS},m.nickname,m.joined_at,m.timeout_until,(select group_concat(role_id) from member_roles mr where mr.server_id=m.server_id and mr.user_id=m.user_id) roles from members m join users u on u.id=m.user_id where m.server_id=? and u.deleted_at is null${where} and u.id>? order by u.id limit ?`).bind(...args).all()).results
return{members:rows.map(x=>({...x,roles:x.roles?x.roles.split(','):[]})),next:rows.length===lim?rows[rows.length-1].id:null}
})

r.add('PATCH','/api/servers/:sid/members/:uid',async c=>{
const m=await mem(c,c.p.sid)
const b=await body(c.req)
if(c.p.uid!==c.user.id){must(m,P.MODERATE);await target(c,m.server.id,c.p.uid,m)}
const nick=b.nickname?str(b.nickname,1,32,'Nickname'):null
await c.env.DB.prepare('update members set nickname=? where server_id=? and user_id=?').bind(nick,m.server.id,c.p.uid).run()
c.pub('s_'+m.server.id,{t:'member.update',uid:c.p.uid})
return{ok:true}
})

async function removeMember(c,m,uid,action,reason,extra=[]){
await c.env.DB.batch([
c.env.DB.prepare('delete from member_roles where server_id=? and user_id=?').bind(m.server.id,uid),
c.env.DB.prepare('delete from members where server_id=? and user_id=?').bind(m.server.id,uid),
c.env.DB.prepare('delete from read_state where user_id=? and room in (select id from channels where server_id=?)').bind(uid,m.server.id),
c.logStmt(m.server.id,action,uid,reason),
...extra
])
c.pub('s_'+m.server.id,{t:'member.leave',uid})
c.pubClose('s_'+m.server.id,{close:[uid],purge:true})
c.pub('u_'+uid,{t:'server.removed',id:m.server.id,reason:action==='member.ban'?'banned':'kicked'})
}

r.add('POST','/api/servers/:sid/members/:uid/kick',async c=>{
const m=await mem(c,c.p.sid)
must(m,P.KICK)
await target(c,m.server.id,c.p.uid,m)
const b=await body(c.req).catch(()=>({}))
const kr=opt(b.reason,300,'Reason')
await removeMember(c,m,c.p.uid,'member.kick',kr,[caseStmt(c,m.server.id,c.p.uid,'kick',kr)])
return{ok:true}
})

r.add('POST','/api/servers/:sid/members/:uid/ban',async c=>{
const m=await mem(c,c.p.sid)
must(m,P.BAN)
if(c.p.uid===c.user.id)fail(400,'You cannot ban yourself')
await target(c,m.server.id,c.p.uid,m)
const b=await body(c.req).catch(()=>({}))
const reason=opt(b.reason,300,'Reason')
await removeMember(c,m,c.p.uid,'member.ban',reason,[c.env.DB.prepare('insert or replace into bans(server_id,user_id,reason,by_id,created_at) values(?,?,?,?,?)').bind(m.server.id,c.p.uid,reason,c.user.id,now()),caseStmt(c,m.server.id,c.p.uid,'ban',reason)])
return{ok:true}
})

r.add('DELETE','/api/servers/:sid/bans/:uid',async c=>{
const m=await mem(c,c.p.sid)
must(m,P.BAN)
await c.env.DB.batch([c.env.DB.prepare('delete from bans where server_id=? and user_id=?').bind(m.server.id,c.p.uid),c.logStmt(m.server.id,'member.unban',c.p.uid),caseStmt(c,m.server.id,c.p.uid,'unban','')])
return{ok:true}
})

r.add('GET','/api/servers/:sid/bans',async c=>{
const m=await mem(c,c.p.sid)
must(m,P.BAN)
const rows=(await c.env.DB.prepare('select b.user_id,b.reason,b.created_at,u.username,u.display_name from bans b join users u on u.id=b.user_id where b.server_id=? order by b.created_at desc limit 200').bind(m.server.id).all()).results
return{bans:rows}
})

r.add('POST','/api/servers/:sid/members/:uid/timeout',async c=>{
const m=await mem(c,c.p.sid)
must(m,P.MODERATE)
if(c.p.uid===c.user.id)fail(400,'You cannot time yourself out')
await target(c,m.server.id,c.p.uid,m)
const b=await body(c.req)
const mins=int(b.minutes,0,40320,'Duration')
const until=mins?now()+mins*60000:0
await c.env.DB.batch([c.env.DB.prepare('update members set timeout_until=? where server_id=? and user_id=?').bind(until,m.server.id,c.p.uid),c.logStmt(m.server.id,mins?'member.timeout':'member.untimeout',c.p.uid,`${mins} min ${opt(b.reason,300,'Reason')}`),...(mins?[caseStmt(c,m.server.id,c.p.uid,'timeout',`${mins} min. ${opt(b.reason,300,'Reason')}`)]:[])])
c.pubClose('s_'+m.server.id,{close:[c.p.uid]})
c.pub('u_'+c.p.uid,{t:'notice',text:mins?`You were timed out in ${m.server.name} for ${mins} minutes`:`Your timeout in ${m.server.name} was lifted`})
return{ok:true}
})

r.add('GET','/api/servers/:sid/modlog',async c=>{
const m=await mem(c,c.p.sid)
if(!(m.base&(P.MODERATE|P.MANAGE_SERVER|P.BAN|P.KICK))&&!m.admin)fail(403,'You do not have permission to do that')
const before=clamp(c.url.searchParams.get('before'),9e15,0,9e15)
const rows=(await c.env.DB.prepare('select l.id,l.action,l.target_id,l.detail,l.created_at,u.username actor from mod_log l join users u on u.id=l.actor_id where l.server_id=? and l.created_at<? order by l.created_at desc limit 50').bind(m.server.id,before).all()).results
return{entries:rows}
})

r.add('POST','/api/servers/:sid/invites',async c=>{
const m=await mem(c,c.p.sid)
must(m,P.CREATE_INVITE)
limit('inv:'+c.user.id,30,3600000)
const b=await body(c.req).catch(()=>({}))
const hours=b.max_age_hours==null?168:int(b.max_age_hours,0,8760,'Expiry')
const uses=b.max_uses?int(b.max_uses,1,10000,'Max uses'):null
const code=rnd(8)
await c.env.DB.prepare('insert into invites(code,server_id,inviter_id,expires_at,max_uses,created_at) values(?,?,?,?,?,?)').bind(code,m.server.id,c.user.id,hours?now()+hours*3600000:null,uses,now()).run()
return json({code},201)
})

r.add('GET','/api/servers/:sid/invites',async c=>{
const m=await mem(c,c.p.sid)
const all=!!(m.base&P.MANAGE_SERVER)
const rows=(await c.env.DB.prepare(`select i.code,i.expires_at,i.max_uses,i.uses,i.created_at,u.username inviter from invites i join users u on u.id=i.inviter_id where i.server_id=? and i.revoked=0 and (i.expires_at is null or i.expires_at>?) ${all?'':'and i.inviter_id=?'} order by i.created_at desc limit 100`).bind(...[m.server.id,now(),...(all?[]:[c.user.id])]).all()).results
return{invites:rows}
})

r.add('DELETE','/api/invites/:code',async c=>{
const inv=await c.env.DB.prepare('select * from invites where code=?').bind(c.p.code).first()
if(!inv)fail(404,'Invite not found')
const m=await mem(c,inv.server_id)
if(inv.inviter_id!==c.user.id)must(m,P.MANAGE_SERVER)
await c.env.DB.batch([c.env.DB.prepare('update invites set revoked=1 where code=?').bind(inv.code),c.logStmt(inv.server_id,'invite.revoke',inv.code)])
return{ok:true}
})

async function validInvite(c,code){
const vs=await c.env.DB.prepare('select s.id server_id,s.name,s.description,s.icon_id,s.banner_id,s.accent,s.tag,s.tag_emoji,s.tag_icon_id,s.is_public,u.display_name inviter_name from servers s join users u on u.id=s.owner_id where s.vanity=?').bind(code).first()
if(vs&&await ownsVanity(c.env,vs.server_id))return{...vs,code,vanity:true,revoked:0}
const inv=await c.env.DB.prepare('select i.*,s.name,s.description,s.icon_id,s.banner_id,s.accent,s.tag,s.tag_emoji,s.tag_icon_id,s.is_public,u.display_name inviter_name from invites i join servers s on s.id=i.server_id join users u on u.id=i.inviter_id where i.code=?').bind(code).first()
if(!inv||inv.revoked||(inv.expires_at&&inv.expires_at<now())||(inv.max_uses&&inv.uses>=inv.max_uses))fail(404,'This invite is invalid or has expired')
return inv
}

r.add('GET','/api/invites/:code',async c=>{
limit('invp:'+(c.req.headers.get('cf-connecting-ip')||'local'),60,60000)
const inv=await validInvite(c,c.p.code)
const n=await c.env.DB.prepare('select count(*) n from members where server_id=?').bind(inv.server_id).first()
return{code:inv.code,server:{id:inv.server_id,name:inv.name,description:inv.description,icon_id:inv.icon_id,banner_id:inv.banner_id||null,accent:inv.accent||null,tag:inv.tag||null,tag_emoji:inv.tag_emoji||null,tag_icon_id:inv.tag_icon_id||null},inviter:inv.inviter_name,members:n.n}
},{auth:false})

async function joinServer(c,sid){
await raidCheck(c.env,sid,c.pub)
const ban=await c.env.DB.prepare('select 1 x from bans where server_id=? and user_id=?').bind(sid,c.user.id).first()
if(ban)fail(403,'You are banned from this server')
const s=await c.env.DB.prepare('select verification,name,age_restricted from servers where id=?').bind(sid).first()
if(s.age_restricted&&!c.user.adult_ok)fail(403,'This server is 18+ only. Confirm you are 18 or older in Settings to join')
const age=now()-c.user.created_at
if(s.verification===1&&age<300000)fail(403,'This server requires accounts to be at least 5 minutes old')
if(s.verification===2&&age<600000)fail(403,'This server requires accounts to be at least 10 minutes old')
const count=await c.env.DB.prepare('select count(*) n from members where user_id=?').bind(c.user.id).first()
if(count.n>=100)fail(400,'You have reached the safety limit of 100 servers')
await c.env.DB.prepare('insert or ignore into members(server_id,user_id,joined_at) values(?,?,?)').bind(sid,c.user.id,now()).run()
c.pub('s_'+sid,{t:'member.join',uid:c.user.id})
runPlugins(c,sid,'join',c.user)
fireHooks(c,sid,'member.join',{user:{id:c.user.id,username:c.user.username,display_name:c.user.display_name}})
try{await runJoin(c,sid,c.user)}catch{}
}

r.add('POST','/api/invites/:code/join',async c=>{
limit('join:'+c.user.id,20,3600000)
const inv=await validInvite(c,c.p.code)
const already=await c.env.DB.prepare('select 1 x from members where server_id=? and user_id=?').bind(inv.server_id,c.user.id).first()
if(!already){
const ban=await c.env.DB.prepare('select 1 x from bans where server_id=? and user_id=?').bind(inv.server_id,c.user.id).first()
if(ban)fail(403,'You are banned from this server')
if(!inv.vanity){
const res=await c.env.DB.prepare('update invites set uses=uses+1 where code=? and revoked=0 and (max_uses is null or uses<max_uses) and (expires_at is null or expires_at>?)').bind(inv.code,now()).run()
if(!res.meta.changes)fail(404,'This invite is invalid or has expired')
}
await joinServer(c,inv.server_id)
}
return{server_id:inv.server_id}
})

r.add('POST','/api/servers/:sid/join',async c=>{
limit('join:'+c.user.id,20,3600000)
const s=await c.env.DB.prepare('select id from servers where id=? and is_public=1').bind(c.p.sid).first()
if(!s)fail(404,'Server not found')
await joinServer(c,s.id)
return{server_id:s.id}
})

r.add('POST','/api/servers/:sid/appeal',async c=>{
limit('sappeal:'+c.user.id,5,3600000)
const ban=await c.env.DB.prepare('select 1 x from bans where server_id=? and user_id=?').bind(c.p.sid,c.user.id).first()
if(!ban)fail(404,'You are not banned from this server')
const b=await body(c.req)
await c.env.DB.batch([c.env.DB.prepare('insert into appeals(id,user_id,server_id,message,created_at) values(?,?,?,?,?)').bind(newId('ap'),c.user.id,c.p.sid,str(b.message,10,2000,'Message'),now()),c.env.DB.prepare("update mod_cases set status='appealed',updated_at=? where server_id=? and user_id=? and type='ban' and num=(select max(num) from mod_cases where server_id=? and user_id=? and type='ban')").bind(now(),c.p.sid,c.user.id,c.p.sid,c.user.id)])
return{ok:true}
})

r.add('GET','/api/servers/:sid/appeals',async c=>{
const m=await mem(c,c.p.sid)
must(m,P.BAN)
const rows=(await c.env.DB.prepare("select a.id,a.message,a.created_at,u.id user_id,u.username from appeals a join users u on u.id=a.user_id where a.server_id=? and a.status='open' order by a.created_at desc limit 100").bind(m.server.id).all()).results
return{appeals:rows}
})

r.add('POST','/api/servers/:sid/appeals/:aid',async c=>{
const m=await mem(c,c.p.sid)
must(m,P.BAN)
const b=await body(c.req)
const a=await c.env.DB.prepare("select * from appeals where id=? and server_id=? and status='open'").bind(c.p.aid,m.server.id).first()
if(!a)fail(404,'Appeal not found')
const accept=b.accept===true
await c.env.DB.batch([
c.env.DB.prepare('update appeals set status=? where id=?').bind(accept?'accepted':'denied',a.id),
...(accept?[c.env.DB.prepare('delete from bans where server_id=? and user_id=?').bind(m.server.id,a.user_id)]:[]),
c.logStmt(m.server.id,accept?'appeal.accept':'appeal.deny',a.user_id),
c.env.DB.prepare("update mod_cases set status=?,updated_at=? where server_id=? and user_id=? and type='ban' and status='appealed'").bind(accept?'overturned':'resolved',now(),m.server.id,a.user_id)
])
c.pub('u_'+a.user_id,{t:'notice',text:`Your appeal for ${m.server.name} was ${accept?'accepted. You can rejoin with an invite.':'denied.'}`})
return{ok:true}
})

r.add('GET','/api/discover',async c=>{
const q=(c.url.searchParams.get('q')||'').trim().slice(0,60)
const cat=c.url.searchParams.get('category')||''
const args=[]
let where=c.user.adult_ok?'s.is_public=1':'s.is_public=1 and s.age_restricted=0'
if(q){where+=" and (s.name like ? escape '\\' or s.description like ? escape '\\')";args.push(like(q),like(q))}
if(cat){if(!CATS.includes(cat))fail(400,'Invalid category');where+=' and s.category=?';args.push(cat)}
args.push(clamp(c.url.searchParams.get('limit'),24,1,50),clamp(c.url.searchParams.get('offset'),0,0,5000))
const rows=(await c.env.DB.prepare(`select s.id,s.name,s.description,s.icon_id,s.banner_id,s.accent,s.tag,s.tag_emoji,s.tag_icon_id,s.category,s.age_restricted,(select count(*) from members m where m.server_id=s.id) members from servers s where ${where} order by members desc,s.created_at desc limit ? offset ?`).bind(...args).all()).results
return{servers:rows,categories:CATS}
})

r.add('GET','/api/discover/:sid',async c=>{
const s=await c.env.DB.prepare(`select ${SRV} from servers where id=? and is_public=1`).bind(c.p.sid).first()
if(!s||(s.age_restricted&&!c.user.adult_ok))fail(404,'Server not found')
const ev=await c.env.DB.prepare('select id,perms from roles where server_id=? and is_everyone=1').bind(s.id).first()
const chs=(await c.env.DB.prepare("select * from channels where server_id=? and type!='voice' order by position").bind(s.id).all()).results
const ovs=(await c.env.DB.prepare('select o.* from overrides o join channels c on c.id=o.channel_id where c.server_id=?').bind(s.id).all()).results
const pseudo={admin:false,base:ev.perms,everyone:ev.id,roleIds:[],userId:'',timeout_until:0}
const preview=chs.filter(ch=>chanPerms(pseudo,ch,ovs.filter(o=>o.channel_id===ch.id))&P.VIEW).map(ch=>({id:ch.id,name:ch.name,type:ch.type}))
const n=await c.env.DB.prepare('select count(*) n from members where server_id=?').bind(s.id).first()
return{server:{id:s.id,name:s.name,description:s.description,icon_id:s.icon_id,banner_id:s.banner_id,accent:s.accent,tag:s.tag||null,tag_emoji:s.tag_emoji||null,tag_icon_id:s.tag_icon_id||null,category:s.category,rules:s.rules,welcome:s.welcome,members:n.n,age_restricted:s.age_restricted},channels:preview}
})
}
