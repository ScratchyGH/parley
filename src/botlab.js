import{fail,now,newId,str,int,limit,body,json,randHex,sha,clamp}from'./util.js'
import{P,loadMember}from'./perms.js'
import{nameProblem}from'./names.js'
import{LICENSES,TAGS}from'../public/js/licenses.js'

const LIC=new Set(LICENSES.map(l=>l[0]))
const TAGSET=new Set(TAGS)
const VIS=['private','unlisted','public']
const MAXP=10
const RES=new Set(['meta','mine','new','api','admin'])

const url=(v,n)=>{
if(v==null||v==='')return ''
if(typeof v!=='string'||v.length>200)fail(400,n+' is invalid')
let u
try{u=new URL(v.trim())}catch{fail(400,n+' must be a full https:// link')}
if(u.protocol!=='https:')fail(400,n+' must be a full https:// link')
return u.href
}
const slugOf=n=>n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,32)
const tagList=v=>{
if(v==null)return[]
if(!Array.isArray(v)||v.length>5)fail(400,'Pick up to 5 tags')
const out=[...new Set(v.map(String))]
for(const t of out)if(!TAGSET.has(t))fail(400,'Unknown tag: '+t)
return out
}
const cols='p.id,p.owner_id,p.bot_id,p.slug,p.name,p.summary,p.avatar_id,p.license,p.visibility,p.installs,p.created_at,p.updated_at'

async function withTags(env,rows){
if(!rows.length)return rows
const ids=rows.map(r=>r.id)
const t=await env.DB.prepare(`select project_id,tag from bot_project_tags where project_id in (${ids.map(()=>'?').join(',')})`).bind(...ids).all()
const m={}
for(const x of t.results)(m[x.project_id]||=[]).push(x.tag)
for(const r of rows)r.tags=(m[r.id]||[]).sort()
return rows
}
async function mint(env,bid){
const token='pb_'+randHex(32)
await env.DB.batch([env.DB.prepare('delete from bot_tokens where bot_id=?').bind(bid),env.DB.prepare('insert into bot_tokens(token_hash,bot_id,created_at) values(?,?,?)').bind(await sha(token),bid,now())])
return token
}
async function mine(c,id){
const p=await c.env.DB.prepare('select * from bot_projects where id=? and owner_id=?').bind(id,c.user.id).first()
if(!p)fail(404,'Project not found')
return p
}
async function freeSlug(env,base){
const b=base.length>=3?base:'bot-'+base
for(let i=0;i<6;i++){
const s=i?b.slice(0,28)+'-'+randHex(2):b
if(!RES.has(s)&&!await env.DB.prepare('select 1 x from bot_projects where slug=?').bind(s).first())return s
}
fail(409,'Could not find a free link, pick another name')
}
async function avatarOk(c,id){
if(id==null||id==='')return null
const f=await c.env.DB.prepare("select id from files where id=? and owner_id=? and kind='avatar'").bind(String(id),c.user.id).first()
if(!f)fail(400,'Avatar must be an image you uploaded as an avatar')
return f.id
}
function fields(c,b,cur){
const o={}
if(b.name!==undefined){
o.name=str(b.name,2,32,'Name')
if(/[\u0000-\u001f]/.test(o.name))fail(400,'Name contains invalid characters')
const bad=nameProblem(c.env,o.name,{bot:true})
if(bad&&!c.user.admin)fail(400,bad.replace('username','name'))
}
if(b.summary!==undefined){
if(typeof b.summary!=='string'||b.summary.length>160||/[\n\r]/.test(b.summary))fail(400,'Summary must be one line, up to 160 characters')
o.summary=b.summary.trim()
}
if(b.readme!==undefined){
if(typeof b.readme!=='string'||b.readme.length>20000)fail(400,'Description is limited to 20000 characters')
o.readme=b.readme
}
if(b.license!==undefined){
if(!LIC.has(b.license))fail(400,'Choose a license from the list')
o.license=b.license
}
if(b.license_url!==undefined)o.license_url=url(b.license_url,'License link')
if(b.source_url!==undefined)o.source_url=url(b.source_url,'Source link')
if(b.website_url!==undefined)o.website_url=url(b.website_url,'Website link')
if(b.support_url!==undefined)o.support_url=url(b.support_url,'Support link')
if(b.visibility!==undefined){
if(!VIS.includes(b.visibility))fail(400,'Visibility is invalid')
o.visibility=b.visibility
}
const lic=o.license??cur?.license??'ARR'
const lu=o.license_url??cur?.license_url??''
if(lic==='Custom'&&!lu)fail(400,'Add a link to your license terms')
const vis=o.visibility??cur?.visibility??'private'
const sum=o.summary??cur?.summary??''
if(vis==='public'){
if(sum.length<10)fail(400,'Add a summary of at least 10 characters before listing a bot publicly')
}
return o
}
function shape(p,viewerId){
const out={id:p.id,slug:p.slug,name:p.name,summary:p.summary,avatar_id:p.avatar_id,license:p.license,visibility:p.visibility,installs:p.installs,created_at:p.created_at,updated_at:p.updated_at,tags:p.tags||[],owner:p.owner_name?{id:p.owner_id,name:p.owner_name,username:p.owner_username}:undefined}
if(viewerId&&p.owner_id===viewerId)out.mine=true
return out
}

export default function botlabRoutes(r){
r.add('GET','/api/bothub/meta',async c=>({licenses:LICENSES,tags:TAGS,max:MAXP}))
r.add('GET','/api/bothub/mine',async c=>{
const rows=(await c.env.DB.prepare(`select ${cols} from bot_projects p where p.owner_id=? order by p.updated_at desc`).bind(c.user.id).all()).results
await withTags(c.env,rows)
return{projects:rows.map(p=>shape(p,c.user.id))}
})
r.add('GET','/api/bothub',async c=>{
const u=c.url.searchParams
const q=(u.get('q')||'').trim().slice(0,60).toLowerCase()
const tag=u.get('tag')||''
const lic=u.get('license')||''
const sort=u.get('sort')||'installs'
const limitN=clamp(u.get('limit'),24,1,48)
const off=clamp(u.get('offset'),0,0,5000)
const where=["p.visibility='public'"],args=[]
if(q){where.push("(lower(p.name) like ? escape '\\' or lower(p.summary) like ? escape '\\')");const l='%'+q.replace(/[\\%_]/g,m=>'\\'+m)+'%';args.push(l,l)}
if(tag){if(!TAGSET.has(tag))fail(400,'Unknown tag');where.push('p.id in (select project_id from bot_project_tags where tag=?)');args.push(tag)}
if(lic){if(!LIC.has(lic))fail(400,'Unknown license');where.push('p.license=?');args.push(lic)}
const order=sort==='new'?'p.created_at desc':sort==='updated'?'p.updated_at desc':'p.installs desc,p.updated_at desc'
const rows=(await c.env.DB.prepare(`select ${cols},u.display_name owner_name,u.username owner_username from bot_projects p join users u on u.id=p.owner_id where ${where.join(' and ')} order by ${order} limit ? offset ?`).bind(...args,limitN+1,off).all()).results
const more=rows.length>limitN
if(more)rows.pop()
await withTags(c.env,rows)
return{projects:rows.map(p=>shape(p,c.user.id)),more}
})
r.add('GET','/api/bothub/:slug',async c=>{
const p=await c.env.DB.prepare('select p.*,u.display_name owner_name,u.username owner_username from bot_projects p join users u on u.id=p.owner_id where p.slug=?').bind(c.p.slug).first()
if(!p||(p.visibility==='private'&&p.owner_id!==c.user.id))fail(404,'Bot not found')
await withTags(c.env,[p])
const rel=(await c.env.DB.prepare('select id,version,changelog,created_at from bot_releases where project_id=? order by created_at desc limit 30').bind(p.id).all()).results
const out={...shape(p,c.user.id),readme:p.readme,license_url:p.license_url,source_url:p.source_url,website_url:p.website_url,support_url:p.support_url,bot_id:p.bot_id,releases:rel}
return{project:out}
})
r.add('POST','/api/bothub',async c=>{
if(c.user.is_bot)fail(403,'Bots cannot create bots')
limit('bothub:'+c.user.id,10,3600000)
const b=await body(c.req)
const n=await c.env.DB.prepare('select count(*) n from users where bot_owner=? and deleted_at is null').bind(c.user.id).first()
if(n.n>=MAXP)fail(409,`You can have up to ${MAXP} bots`)
const o=fields(c,{name:b.name,summary:b.summary,readme:b.readme,license:b.license??'MIT',license_url:b.license_url,source_url:b.source_url,website_url:b.website_url,support_url:b.support_url,visibility:b.visibility??'private'},null)
const tags=tagList(b.tags)
const avatar=await avatarOk(c,b.avatar_id)
const slug=await freeSlug(c.env,slugOf(o.name))
const pid=newId('bp'),bid=newId('u'),t=now()
await c.env.DB.batch([
c.env.DB.prepare('insert into users(id,username,display_name,pass_hash,pass_salt,pass_iters,is_bot,bot_owner,avatar_id,created_at) values(?,?,?,?,?,?,1,?,?,?)').bind(bid,'bot_'+randHex(8),o.name,'!','!',1,c.user.id,avatar,t),
c.env.DB.prepare('insert into bot_projects(id,owner_id,bot_id,slug,name,summary,readme,avatar_id,license,license_url,source_url,website_url,support_url,visibility,created_at,updated_at) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(pid,c.user.id,bid,slug,o.name,o.summary??'',o.readme??'',avatar,o.license,o.license_url??'',o.source_url??'',o.website_url??'',o.support_url??'',o.visibility,t,t),
...tags.map(x=>c.env.DB.prepare('insert into bot_project_tags(project_id,tag) values(?,?)').bind(pid,x))
])
return json({id:pid,slug,bot_id:bid,token:await mint(c.env,bid)},201)
})
r.add('PATCH','/api/bothub/:id',async c=>{
const cur=await mine(c,c.p.id)
limit('bothubw:'+c.user.id,60,3600000)
const b=await body(c.req)
const o=fields(c,b,cur)
const st=[]
const sets=[],args=[]
for(const[k,v]of Object.entries(o)){sets.push(k+'=?');args.push(v)}
let avatar
if(b.avatar_id!==undefined){avatar=await avatarOk(c,b.avatar_id);sets.push('avatar_id=?');args.push(avatar)}
if(b.slug!==undefined){
if(typeof b.slug!=='string'||!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(b.slug))fail(400,'Link name must be 3 to 40 lowercase letters, numbers or dashes')
if(RES.has(b.slug))fail(400,'That link name is reserved')
if(b.slug!==cur.slug&&await c.env.DB.prepare('select 1 x from bot_projects where slug=?').bind(b.slug).first())fail(409,'That link name is taken')
sets.push('slug=?');args.push(b.slug)
}
sets.push('updated_at=?');args.push(now())
st.push(c.env.DB.prepare(`update bot_projects set ${sets.join(',')} where id=?`).bind(...args,cur.id))
if(o.name!==undefined||avatar!==undefined){
const us=[],ua=[]
if(o.name!==undefined){us.push('display_name=?');ua.push(o.name)}
if(avatar!==undefined){us.push('avatar_id=?');ua.push(avatar)}
st.push(c.env.DB.prepare(`update users set ${us.join(',')} where id=?`).bind(...ua,cur.bot_id))
}
if(b.tags!==undefined){
const tags=tagList(b.tags)
st.push(c.env.DB.prepare('delete from bot_project_tags where project_id=?').bind(cur.id),...tags.map(x=>c.env.DB.prepare('insert into bot_project_tags(project_id,tag) values(?,?)').bind(cur.id,x)))
}
try{await c.env.DB.batch(st)}catch(e){if(String(e.message).includes('UNIQUE'))fail(409,'That link name is taken');throw e}
return{ok:true}
})
r.add('POST','/api/bothub/:id/token',async c=>{
const p=await mine(c,c.p.id)
limit('bothubt:'+c.user.id,10,3600000)
return{token:await mint(c.env,p.bot_id)}
})
r.add('DELETE','/api/bothub/:id',async c=>{
const p=await mine(c,c.p.id)
await c.env.DB.batch([
c.env.DB.prepare('delete from bot_tokens where bot_id=?').bind(p.bot_id),
c.env.DB.prepare('delete from members where user_id=?').bind(p.bot_id),
c.env.DB.prepare('update users set deleted_at=?,suspended=1,avatar_id=null where id=?').bind(now(),p.bot_id),
c.env.DB.prepare('delete from bot_project_tags where project_id=?').bind(p.id),
c.env.DB.prepare('delete from bot_releases where project_id=?').bind(p.id),
c.env.DB.prepare('delete from bot_installs where project_id=?').bind(p.id),
c.env.DB.prepare('delete from bot_projects where id=?').bind(p.id)
])
return{ok:true}
})
r.add('POST','/api/bothub/:id/releases',async c=>{
const p=await mine(c,c.p.id)
limit('bothubr:'+c.user.id,30,3600000)
const b=await body(c.req)
const version=str(b.version,1,24,'Version')
if(!/^[0-9A-Za-z][0-9A-Za-z.+_-]*$/.test(version))fail(400,'Version can use letters, numbers and . + _ -')
const log=typeof b.changelog==='string'?b.changelog:''
if(log.length>4000)fail(400,'Changelog is limited to 4000 characters')
const n=await c.env.DB.prepare('select count(*) n from bot_releases where project_id=?').bind(p.id).first()
if(n.n>=100)fail(409,'Too many releases')
const id=newId('br'),t=now()
await c.env.DB.batch([c.env.DB.prepare('insert into bot_releases(id,project_id,version,changelog,created_at) values(?,?,?,?,?)').bind(id,p.id,version,log,t),c.env.DB.prepare('update bot_projects set updated_at=? where id=?').bind(t,p.id)])
return json({release:{id,version,changelog:log,created_at:t}},201)
})
r.add('DELETE','/api/bothub/:id/releases/:rid',async c=>{
const p=await mine(c,c.p.id)
await c.env.DB.prepare('delete from bot_releases where id=? and project_id=?').bind(c.p.rid,p.id).run()
return{ok:true}
})
r.add('POST','/api/bothub/:id/install',async c=>{
limit('bothubi:'+c.user.id,30,3600000)
const b=await body(c.req)
const sid=str(b.server_id,1,64,'Server')
const p=await c.env.DB.prepare('select id,owner_id,bot_id,visibility,name from bot_projects where id=?').bind(c.p.id).first()
if(!p||(p.visibility==='private'&&p.owner_id!==c.user.id))fail(404,'Bot not found')
const m=await loadMember(c.env,sid,c.user.id)
if(!m)fail(404,'Server not found')
if(!m.admin&&!(m.base&P.MANAGE_SERVER))fail(403,'You need the Manage server permission to add bots')
const bot=await c.env.DB.prepare('select id,display_name from users where id=? and deleted_at is null and suspended=0').bind(p.bot_id).first()
if(!bot)fail(404,'This bot is no longer available')
const inServer=await c.env.DB.prepare('select 1 x from members where server_id=? and user_id=?').bind(sid,bot.id).first()
if(inServer)fail(409,'This bot is already in that server')
const first=!await c.env.DB.prepare('select 1 x from bot_installs where project_id=? and server_id=?').bind(p.id,sid).first()
const st=[c.env.DB.prepare('insert or ignore into members(server_id,user_id,joined_at) values(?,?,?)').bind(sid,bot.id,now()),c.logStmt(sid,'bot.add',bot.id,bot.display_name)]
if(first)st.push(c.env.DB.prepare('insert or ignore into bot_installs(project_id,server_id,user_id,created_at) values(?,?,?,?)').bind(p.id,sid,c.user.id,now()),c.env.DB.prepare('update bot_projects set installs=installs+1 where id=?').bind(p.id))
await c.env.DB.batch(st)
c.pub('s_'+sid,{t:'member.join',uid:bot.id})
return{ok:true}
})
}
