import{fail,now,newId,str,int,limit,body,json,randHex,sha,placeholders}from'./util.js'
import{P,loadMember}from'./perms.js'
import{skeleton}from'./names.js'

const nm=(v,n,min=1,max=32)=>{
const s=str(v,min,max,n)
if(/[\u0000-\u001f]/.test(s))fail(400,n+' contains invalid characters')
return s
}
async function srv(c,sid,bit){
const m=await loadMember(c.env,sid,c.user.id)
if(!m)fail(404,'Server not found')
if(bit&&!m.admin&&!(m.base&bit))fail(403,'You do not have permission to do that')
return m
}
export async function stickerFor(env,id,userId){
const s=await env.DB.prepare('select * from stickers where id=?').bind(id).first()
if(!s)return null
if(s.owner_id)return s.owner_id===userId?s:null
return await loadMember(env,s.server_id,userId)?s:null
}
export async function raidCheck(env,sid,pub){
const s=await env.DB.prepare('select automod,lockdown_until from servers where id=?').bind(sid).first()
if(!s)return
if(s.lockdown_until>now())fail(403,'This server is temporarily not accepting new members')
let a={}
try{a=JSON.parse(s.automod||'{}')}catch{}
const n=a.raid_joins|0
if(n>0){
const c=await env.DB.prepare('select count(*) n from members where server_id=? and joined_at>?').bind(sid,now()-60000).first()
if(c.n>=n){
await env.DB.prepare('update servers set lockdown_until=? where id=?').bind(now()+600000,sid).run()
pub?.('s_'+sid,{t:'notice',text:'Raid protection locked this server to new members for 10 minutes.'})
fail(403,'This server is temporarily not accepting new members')
}
}
}
export default function(r){
r.add('GET','/api/stickers',async c=>{
const mine=(await c.env.DB.prepare('select id,name,file_id from stickers where owner_id=? order by name').bind(c.user.id).all()).results
const rows=(await c.env.DB.prepare('select s.id,s.name,s.file_id,s.server_id,sv.name server_name from stickers s join members m on m.server_id=s.server_id join servers sv on sv.id=s.server_id where m.user_id=? order by sv.name,s.name').bind(c.user.id).all()).results
const by={}
for(const x of rows)(by[x.server_id]||(by[x.server_id]={server_id:x.server_id,name:x.server_name,stickers:[]})).stickers.push({id:x.id,name:x.name,file_id:x.file_id})
return{personal:mine,servers:Object.values(by)}
})
async function addSticker(c,serverId,ownerId,b,max){
const name=nm(b.name,'Name',2,32)
if(!/^[a-zA-Z0-9_ -]+$/.test(name))fail(400,'Name can use letters, numbers, spaces, dashes and underscores')
const n=await c.env.DB.prepare(serverId?'select count(*) n from stickers where server_id=?':'select count(*) n from stickers where owner_id=?').bind(serverId||ownerId).first()
if(n.n>=max)fail(409,`The limit is ${max} stickers`)
const f=await c.env.DB.prepare("select id from files where id=? and owner_id=? and kind='sticker' and server_id is ?").bind(String(b.file_id),c.user.id,serverId||null).first()
if(!f)fail(400,'Upload the image first')
await c.env.DB.prepare('insert into stickers(id,server_id,owner_id,name,file_id,created_at) values(?,?,?,?,?,?)').bind(newId('st'),serverId||null,serverId?null:ownerId,name,f.id,now()).run()
}
r.add('POST','/api/servers/:sid/stickers',async c=>{
const m=await srv(c,c.p.sid,P.MANAGE_SERVER)
limit('stk:'+c.user.id,30,60000)
await addSticker(c,m.server.id,null,await body(c.req),60)
c.pub('s_'+m.server.id,{t:'emoji.changed',server_id:m.server.id})
return json({ok:true},201)
})
r.add('POST','/api/me/stickers',async c=>{
limit('stk:'+c.user.id,30,60000)
await addSticker(c,null,c.user.id,await body(c.req),50)
return json({ok:true},201)
})
r.add('DELETE','/api/stickers/:id',async c=>{
const s=await c.env.DB.prepare('select * from stickers where id=?').bind(c.p.id).first()
if(!s)fail(404,'Sticker not found')
if(s.owner_id){if(s.owner_id!==c.user.id)fail(403,'Not your sticker')}
else await srv(c,s.server_id,P.MANAGE_SERVER)
const f=await c.env.DB.prepare('select r2_key from files where id=?').bind(s.file_id).first()
if(f)await c.env.FILES.delete(f.r2_key)
await c.env.DB.batch([c.env.DB.prepare('delete from stickers where id=?').bind(s.id),c.env.DB.prepare('delete from files where id=?').bind(s.file_id)])
return{ok:true}
})

r.add('POST','/api/servers/:sid/lockdown',async c=>{
const m=await srv(c,c.p.sid,P.MANAGE_SERVER)
const b=await body(c.req)
const until=b.on?now()+(int(b.minutes??60,1,1440,'Minutes'))*60000:0
await c.env.DB.batch([c.env.DB.prepare('update servers set lockdown_until=? where id=?').bind(until,m.server.id),c.logStmt(m.server.id,b.on?'lockdown.on':'lockdown.off',m.server.id,'')])
return{lockdown_until:until}
})
r.add('GET','/api/servers/:sid/lockdown',async c=>{
const m=await srv(c,c.p.sid,P.MANAGE_SERVER)
const s=await c.env.DB.prepare('select lockdown_until from servers where id=?').bind(m.server.id).first()
return{lockdown_until:s.lockdown_until>now()?s.lockdown_until:0}
})

r.add('PUT','/api/servers/:sid/vanity',async c=>{
const m=await srv(c,c.p.sid,P.MANAGE_SERVER)
const b=await body(c.req)
let slug=b.slug==null||b.slug===''?null:String(b.slug).toLowerCase()
if(slug!==null){
if(!/^[a-z0-9-]{3,32}$/.test(slug))fail(400,'Use 3 to 32 letters, numbers or dashes')
if(/^[a-z0-9]{8,12}$/.test(slug)&&!slug.includes('-'))fail(400,'That looks like a random invite code. Add a dash or change the length.')
if(skeleton(slug)==='parley'||['admin','support','discover','invite','api'].includes(slug))fail(400,'That name is reserved')
}
try{await c.env.DB.prepare('update servers set vanity=? where id=?').bind(slug,m.server.id).run()}
catch(e){if(String(e.message).includes('UNIQUE'))fail(409,'That vanity link is taken');throw e}
return{vanity:slug}
})

const owns=async(c,bid)=>{
const b=await c.env.DB.prepare('select id,username,display_name,created_at from users where id=? and bot_owner=? and deleted_at is null').bind(bid,c.user.id).first()
if(!b)fail(404,'Bot not found')
return b
}
const mint=async(c,bid)=>{
const token='pb_'+randHex(32)
await c.env.DB.batch([c.env.DB.prepare('delete from bot_tokens where bot_id=?').bind(bid),c.env.DB.prepare('insert into bot_tokens(token_hash,bot_id,created_at) values(?,?,?)').bind(await sha(token),bid,now())])
return token
}
r.add('GET','/api/bots',async c=>({bots:(await c.env.DB.prepare('select id,display_name,created_at from users where bot_owner=? and deleted_at is null order by created_at').bind(c.user.id).all()).results}))
r.add('POST','/api/bots',async c=>{
if(c.user.is_bot)fail(403,'Bots cannot create bots')
limit('bot:'+c.user.id,10,3600000)
const b=await body(c.req)
const name=nm(b.name,'Name',2,32)
const n=await c.env.DB.prepare('select count(*) n from users where bot_owner=? and deleted_at is null').bind(c.user.id).first()
if(n.n>=5)fail(409,'You can have up to 5 bots')
const id=newId('u')
await c.env.DB.prepare('insert into users(id,username,display_name,pass_hash,pass_salt,pass_iters,is_bot,bot_owner,created_at) values(?,?,?,?,?,?,1,?,?)').bind(id,'bot_'+randHex(8),name,'!','!',1,c.user.id,now()).run()
return json({id,name,token:await mint(c,id)},201)
})
r.add('POST','/api/bots/:bid/token',async c=>{
const b=await owns(c,c.p.bid)
return{token:await mint(c,b.id)}
})
r.add('DELETE','/api/bots/:bid',async c=>{
const b=await owns(c,c.p.bid)
await c.env.DB.batch([c.env.DB.prepare('delete from bot_tokens where bot_id=?').bind(b.id),c.env.DB.prepare('delete from members where user_id=?').bind(b.id),c.env.DB.prepare('update users set deleted_at=?,suspended=1 where id=?').bind(now(),b.id)])
return{ok:true}
})
r.add('POST','/api/servers/:sid/bots/:bid',async c=>{
const m=await srv(c,c.p.sid,P.MANAGE_SERVER)
const b=await owns(c,c.p.bid)
await c.env.DB.batch([c.env.DB.prepare('insert or ignore into members(server_id,user_id,joined_at) values(?,?,?)').bind(m.server.id,b.id,now()),c.logStmt(m.server.id,'bot.add',b.id,b.display_name)])
c.pub('s_'+m.server.id,{t:'member.join',uid:b.id})
return{ok:true}
})
r.add('DELETE','/api/servers/:sid/bots/:bid',async c=>{
const m=await srv(c,c.p.sid,P.MANAGE_SERVER)
await c.env.DB.prepare('delete from members where server_id=? and user_id=? and user_id in (select id from users where is_bot=1)').bind(m.server.id,c.p.bid).run()
c.pub('s_'+m.server.id,{t:'member.leave',uid:c.p.bid})
return{ok:true}
})
}
