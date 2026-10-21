import{fail,now,newId,body,limit}from'./util.js'
import{P,loadMember}from'./perms.js'
import{expCfg,expActive}from'./program.js'
import{post,pluginBot}from'./plugins.js'
import{explicitText}from'./safety.js'

const DANGER=P.ADMIN|P.MANAGE_ROLES|P.MANAGE_SERVER|P.BAN|P.KICK|P.MODERATE|P.MANAGE_CHANNELS
export const FEATURES={
starboard:{name:'Starboard',descr:'Reposts messages that collect enough star reactions into a showcase channel. Only messages from channels everyone can see are reposted.',def:{channel_id:'',threshold:3,emoji:'⭐'}},
levels:{name:'Levels and leaderboard',descr:'Members earn XP for chatting (once a minute), level up, and can win roles at chosen levels.',def:{channel_id:'',rewards:[]}},
reactionroles:{name:'Reaction roles',descr:'Members pick up or drop a role by reacting to a message.',def:{}},
giveaways:{name:'Giveaways',descr:'Timed giveaways entered with a reaction. Winners are drawn at random when time runs out.',def:{}},
counting:{name:'Counting channel',descr:'A channel where members count upward together. Wrong numbers and double turns are rejected.',def:{channel_id:''}},
qotd:{name:'Question of the day',descr:'Posts the next question from your queue once a day.',def:{channel_id:'',hour:15}},
confessions:{name:'Anonymous confessions',descr:'Members post anonymously through a bot. Moderators can see who wrote a confession and can block people from using it.',def:{channel_id:''}},
birthdays:{name:'Birthdays',descr:'Members who add their birthday get a shout-out on the day (UTC).',def:{channel_id:''}},
suggestions:{name:'Suggestions',descr:'Members submit ideas with vote reactions. Moderators approve or decline them with a note.',def:{channel_id:''}},
sticky:{name:'Sticky messages',descr:'Keeps a message at the bottom of a channel by reposting it as people chat.',def:{}},
reminders:{name:'Event reminders',descr:'Pings people who RSVPed 15 minutes before a server event starts.',def:{channel_id:''}}
}
const KEYS=Object.keys(FEATURES)
const level=xp=>Math.floor(Math.sqrt(xp/60))
const parse=s=>{try{return JSON.parse(s)||{}}catch{return{}}}

async function activeFeatures(env,server){
if(!server||!server.exp_on||server.exp_block)return null
const cfg=await expCfg(env)
if(!expActive(server,cfg))return null
const rows=(await env.DB.prepare('select feature,config from xf_cfg where server_id=? and enabled=1').bind(server.id).all()).results
const out={}
for(const r of rows)if(FEATURES[r.feature])out[r.feature]={...FEATURES[r.feature].def,...parse(r.config)}
return out
}
async function mgr(c,sid,bit=P.MANAGE_SERVER){
const m=await loadMember(c.env,sid,c.user.id)
if(!m)fail(404,'Server not found')
if(!m.admin&&!(m.base&bit))fail(403,'You need the '+(bit===P.MODERATE?'Moderate members':'Manage server')+' permission')
return m
}
async function member(c,sid){
const m=await loadMember(c.env,sid,c.user.id)
if(!m)fail(404,'Server not found')
return m
}
async function needFeature(c,m,key){
const f=await activeFeatures(c.env,m.server)
if(!f)fail(403,'This server is not taking part in the Experimental Servers Program')
if(!f[key])fail(409,FEATURES[key].name+' is turned off in this server')
return f[key]
}
async function textChannel(env,sid,id,what='Channel'){
const x=await env.DB.prepare('select id,type,name from channels where id=? and server_id=?').bind(String(id||''),sid).first()
if(!x||!['text','announce'].includes(x.type))fail(400,what+' must be a text channel in this server')
return x
}
async function manageableRole(env,m,id){
const r=await env.DB.prepare('select id,name,perms,position,is_everyone from roles where id=? and server_id=?').bind(String(id||''),m.server.id).first()
if(!r||r.is_everyone)fail(400,'Pick a role from this server')
if(!m.owner){
if(!m.admin&&r.position>=m.top)fail(403,'That role is higher than your own')
if(r.perms&DANGER)fail(403,'Only the server owner can hand out a role that has moderation permissions')
}
return r
}
function mkc(env,ec){
return{env,ec,pub:(hub,e,opts={})=>{ec.waitUntil(env.HUB.get(env.HUB.idFromName(hub)).fetch('https://hub/publish',{method:'POST',body:JSON.stringify({e,...opts})}).then(r=>r.text()).catch(()=>{}))}}
}
async function botReact(c,sid,channel,mid,emoji){
const bot=await pluginBot(c.env,sid)
await c.env.DB.prepare('insert or ignore into reactions(message_id,user_id,emoji) values(?,?,?)').bind(mid,bot,emoji).run()
c.pub('s_'+sid,{t:'reaction',room:channel,mid,emoji,uid:bot,add:true},{ch:channel})
}
async function dropMessage(c,sid,channel,id){
await c.env.DB.batch([
c.env.DB.prepare("update messages set deleted_at=?,content='',pinned=0 where id=? and deleted_at is null").bind(now(),id),
c.env.DB.prepare('delete from reactions where message_id=?').bind(id)
])
c.pub('s_'+sid,{t:'msg.delete',room:channel,id},{ch:channel})
}
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
const dayKey=t=>new Date(t).toISOString().slice(0,10)
const state=async(env,sid,k)=>(await env.DB.prepare('select v from xf_state where server_id=? and k=?').bind(sid,k).first())?.v
const setState=(env,sid,k,v)=>env.DB.prepare('insert into xf_state(server_id,k,v) values(?,?,?) on conflict(server_id,k) do update set v=excluded.v').bind(sid,k,String(v)).run()
const text=(v,min,max,n)=>{
const t=typeof v==='string'?v.replace(/\r\n/g,'\n').trim():''
if(t.length<min||t.length>max)fail(400,`${n} must be ${min} to ${max} characters`)
if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(t))fail(400,n+' contains invalid characters')
if(explicitText(t))fail(400,'That text is not allowed on Parley')
return t
}

export async function beforeSend(c,rr,content){
if(rr.kind!=='channel'||rr.thread||!rr.m.server.exp_on)return
const f=await activeFeatures(c.env,rr.m.server)
if(!f||!f.counting||f.counting.channel_id!==rr.room)return
const sid=rr.serverId
await c.env.DB.prepare('insert or ignore into xf_count(server_id) values(?)').bind(sid).run()
const st=await c.env.DB.prepare('select last_n,last_user,best from xf_count where server_id=?').bind(sid).first()
const want=st.last_n+1
if(!/^\d{1,9}$/.test(content.trim()))fail(400,`This is the counting channel. The next number is ${want}`)
const n=Number(content.trim())
if(n!==want)fail(400,`The next number is ${want}`)
if(st.last_user===c.user.id)fail(400,'Someone else has to count the next number')
const res=await c.env.DB.prepare('update xf_count set last_n=?,last_user=?,best=max(best,?) where server_id=? and last_n=?').bind(n,c.user.id,n,sid,st.last_n).run()
if(!res.meta.changes)fail(409,'Someone counted at the same moment. Try again')
}

async function levelUp(c,sid,cfg,uid,lvl,room){
const target=cfg.channel_id||room
await post(c,sid,target,`<@${uid}> reached level ${lvl}.`)
for(const rw of cfg.rewards||[]){
if(rw.level>lvl)continue
const role=await c.env.DB.prepare('select id from roles where id=? and server_id=? and is_everyone=0').bind(rw.role_id,sid).first()
if(role)await c.env.DB.prepare('insert or ignore into member_roles(server_id,user_id,role_id) select ?,?,? where exists(select 1 from members where server_id=? and user_id=?)').bind(sid,uid,role.id,sid,uid).run()
}
}
async function afterWork(c,rr,message){
const sid=rr.serverId
const f=await activeFeatures(c.env,rr.m.server)
if(!f)return
const uid=message.author_id||c.user.id
if(f.levels&&!c.user.is_bot){
const row=await c.env.DB.prepare('select xp,last_at from xf_xp where server_id=? and user_id=?').bind(sid,uid).first()
const t=now()
if(!row)await c.env.DB.prepare('insert or ignore into xf_xp(server_id,user_id,xp,msgs,last_at) values(?,?,?,1,?)').bind(sid,uid,15+crypto.getRandomValues(new Uint8Array(1))[0]%11,t).run()
else if(t-row.last_at>=60000){
const gain=15+crypto.getRandomValues(new Uint8Array(1))[0]%11
const res=await c.env.DB.prepare('update xf_xp set xp=xp+?,msgs=msgs+1,last_at=? where server_id=? and user_id=? and last_at=?').bind(gain,t,sid,uid,row.last_at).run()
if(res.meta.changes&&level(row.xp+gain)>level(row.xp))await levelUp(c,sid,f.levels,uid,level(row.xp+gain),rr.room)
}else await c.env.DB.prepare('update xf_xp set msgs=msgs+1 where server_id=? and user_id=?').bind(sid,uid).run()
}
if(f.sticky){
const st=await c.env.DB.prepare('select * from xf_sticky where channel_id=?').bind(rr.room).first()
const bot=await pluginBot(c.env,sid)
if(st&&message.author_id!==bot&&now()-st.last_at>=6000){
const claim=await c.env.DB.prepare('update xf_sticky set last_at=? where channel_id=? and last_at=?').bind(now(),st.channel_id,st.last_at).run()
if(claim.meta.changes){
if(st.last_post)await dropMessage(c,sid,rr.room,st.last_post)
const id=await post(c,sid,rr.room,st.content)
await c.env.DB.prepare('update xf_sticky set last_post=? where channel_id=?').bind(id,rr.room).run()
}
}
}
}
export function afterSend(c,rr,message){
if(rr.kind!=='channel'||rr.thread||!rr.m.server.exp_on)return
c.ec.waitUntil(afterWork(c,rr,message).catch(()=>{}))
}

async function reactWork(c,rr,m,emoji,uid,add){
const sid=rr.serverId
const f=await activeFeatures(c.env,rr.m.server)
if(!f)return
if(f.reactionroles){
const map=await c.env.DB.prepare('select role_id from xf_rr where message_id=? and emoji=? and server_id=?').bind(m.id,emoji,sid).first()
if(map){
const role=await c.env.DB.prepare('select id from roles where id=? and server_id=? and is_everyone=0').bind(map.role_id,sid).first()
if(role){
if(add)await c.env.DB.prepare('insert or ignore into member_roles(server_id,user_id,role_id) select ?,?,? where exists(select 1 from members where server_id=? and user_id=?)').bind(sid,uid,role.id,sid,uid).run()
else await c.env.DB.prepare('delete from member_roles where server_id=? and user_id=? and role_id=?').bind(sid,uid,role.id).run()
}
}
}
const sb=f.starboard
if(add&&sb&&sb.channel_id&&emoji===sb.emoji&&rr.room!==sb.channel_id&&rr.ovs.length===0&&!m.deleted_at){
const n=(await c.env.DB.prepare('select count(*) n from reactions where message_id=? and emoji=? and user_id!=?').bind(m.id,emoji,m.author_id).first()).n
if(n>=sb.threshold){
const claim=await c.env.DB.prepare('insert or ignore into xf_star(message_id,server_id,post_id,created_at) values(?,?,?,?)').bind(m.id,sid,'',now()).run()
if(claim.meta.changes){
const au=await c.env.DB.prepare('select display_name from users where id=?').bind(m.author_id).first()
const quote=String(m.content||'').slice(0,700).split('\n').map(l=>'> '+l).join('\n')
const att=(await c.env.DB.prepare('select count(*) n from files where message_id=?').bind(m.id).first()).n
const id=await post(c,sid,sb.channel_id,`${sb.emoji} **${n}** in #${rr.ch.name} from **${au?au.display_name:'someone'}**\n${quote||'> (no text)'}${att?`\n*${att} attachment${att>1?'s':''}*`:''}`)
if(id)await c.env.DB.prepare('update xf_star set post_id=? where message_id=?').bind(id,m.id).run()
else await c.env.DB.prepare('delete from xf_star where message_id=?').bind(m.id).run()
}
}
}
}
export function onReaction(c,rr,m,emoji,uid,add){
if(rr.kind!=='channel'||!rr.m.server.exp_on)return
c.ec.waitUntil(reactWork(c,rr,m,emoji,uid,add).catch(()=>{}))
}

async function endGiveaway(c,g,manual){
const claim=await c.env.DB.prepare('update xf_give set ended=1 where id=? and ended=0').bind(g.id).run()
if(!claim.meta.changes&&!manual)return
await drawGiveaway(c,g)
}
async function drawGiveaway(c,g){
const bot=await pluginBot(c.env,g.server_id)
const ids=(await c.env.DB.prepare("select r.user_id from reactions r join members m on m.server_id=? and m.user_id=r.user_id join users u on u.id=r.user_id where r.message_id=? and r.emoji='🎉' and r.user_id!=? and u.is_bot=0 and u.deleted_at is null").bind(g.server_id,g.message_id,bot).all()).results.map(x=>x.user_id)
const win=shuffle(ids).slice(0,g.winners)
await c.env.DB.prepare('update xf_give set winner_ids=? where id=?').bind(JSON.stringify(win),g.id).run()
const msg=win.length?`🎉 Congratulations ${win.map(u=>`<@${u}>`).join(', ')}! You won **${g.prize}**.`:`Nobody entered the giveaway for **${g.prize}**.`
await post(c,g.server_id,g.channel_id,msg,g.message_id)
}
async function eachServer(env,key){
const cfg=await expCfg(env)
if(cfg.paused)return[]
const rows=(await env.DB.prepare('select x.server_id,x.config from xf_cfg x join servers s on s.id=x.server_id where x.feature=? and x.enabled=1 and s.exp_on=1 and s.exp_block=0').bind(key).all()).results
return rows.map(r=>({sid:r.server_id,cfg:{...FEATURES[key].def,...parse(r.config)}}))
}
async function pickQuestion(c,sid,channel){
const q=await c.env.DB.prepare('select id,text from xf_qotd where server_id=? and used_at is null order by created_at limit 1').bind(sid).first()
if(!q)return false
const claim=await c.env.DB.prepare('update xf_qotd set used_at=? where id=? and used_at is null').bind(now(),q.id).run()
if(!claim.meta.changes)return false
const id=await post(c,sid,channel,`**Question of the day**\n${q.text}`)
if(!id){await c.env.DB.prepare('update xf_qotd set used_at=null where id=?').bind(q.id).run();return false}
return true
}
export async function xlabsCron(env,ec){
const c=mkc(env,ec)
const t=now()
const due=(await env.DB.prepare('select * from xf_give where ended=0 and ends_at<=? order by ends_at limit 20').bind(t).all()).results
for(const g of due){
const on=await env.DB.prepare('select 1 x from servers where id=? and exp_on=1 and exp_block=0').bind(g.server_id).first()
if(on)await endGiveaway(c,g,false).catch(()=>{})
}
const day=dayKey(t),hr=new Date(t).getUTCHours()
for(const s of await eachServer(env,'qotd')){
if(!s.cfg.channel_id||hr!==Number(s.cfg.hour)||await state(env,s.sid,'qotd_day')===day)continue
if(await pickQuestion(c,s.sid,s.cfg.channel_id).catch(()=>false))await setState(env,s.sid,'qotd_day',day)
}
for(const s of await eachServer(env,'birthdays')){
if(!s.cfg.channel_id||await state(env,s.sid,'bday_day')===day)continue
await setState(env,s.sid,'bday_day',day)
const d=new Date(t)
const rows=(await env.DB.prepare('select b.user_id from xf_bday b join members m on m.server_id=b.server_id and m.user_id=b.user_id where b.server_id=? and b.m=? and b.d=? limit 25').bind(s.sid,d.getUTCMonth()+1,d.getUTCDate()).all()).results
if(rows.length)await post(c,s.sid,s.cfg.channel_id,`🎂 Happy birthday ${rows.map(r=>`<@${r.user_id}>`).join(', ')}!`).catch(()=>{})
}
for(const s of await eachServer(env,'reminders')){
if(!s.cfg.channel_id)continue
const evs=(await env.DB.prepare('select id,title,starts_at from events where server_id=? and starts_at>? and starts_at<=?').bind(s.sid,t,t+15*60000).all()).results
for(const e of evs){
if(await state(env,s.sid,'rem:'+e.id))continue
await setState(env,s.sid,'rem:'+e.id,t)
const who=(await env.DB.prepare("select r.user_id from event_rsvps r join members m on m.server_id=? and m.user_id=r.user_id where r.event_id=? and r.state in ('going','interested') limit 25").bind(s.sid,e.id).all()).results.map(x=>x.user_id)
const mins=Math.max(1,Math.round((e.starts_at-t)/60000))
const id=await post(c,s.sid,s.cfg.channel_id,`**${e.title}** starts in ${mins} minute${mins===1?'':'s'}.${who.length?'\n'+who.map(u=>`<@${u}>`).join(' '):''}`).catch(()=>null)
if(id)await env.DB.batch(who.map(u=>env.DB.prepare('insert into notifications(id,user_id,type,data,created_at) values(?,?,?,?,?)').bind(newId('n'),u,'mention',JSON.stringify({room:s.cfg.channel_id,server_id:s.sid,message_id:id,from:e.title}),t)))
}
}
await env.DB.prepare("delete from xf_state where k like 'rem:%' and cast(v as integer)<?").bind(t-7*86400000).run().catch(()=>{})
}

async function clean(c,m,key,b){
const d=FEATURES[key].def,sid=m.server.id
const out={...d}
if('channel_id' in d&&key!=='sticky'){
if(b.channel_id)out.channel_id=(await textChannel(c.env,sid,b.channel_id)).id
else out.channel_id=''
}
if(key==='starboard'){
const th=Number(b.threshold)
if(!Number.isInteger(th)||th<1||th>50)fail(400,'Stars needed must be 1 to 50')
out.threshold=th
const em=typeof b.emoji==='string'?b.emoji.trim():''
if(!em||em.length>40||/[\s<>]/.test(em))fail(400,'Pick a single emoji')
out.emoji=em
}
if(key==='levels'){
const rw=Array.isArray(b.rewards)?b.rewards.slice(0,10):[]
out.rewards=[]
for(const r of rw){
const lv=Number(r.level)
if(!Number.isInteger(lv)||lv<1||lv>200)fail(400,'Reward levels must be 1 to 200')
const role=await manageableRole(c.env,m,r.role_id)
out.rewards.push({level:lv,role_id:role.id})
}
}
if(key==='qotd'){
const hr=Number(b.hour)
if(!Number.isInteger(hr)||hr<0||hr>23)fail(400,'Hour must be 0 to 23 (UTC)')
out.hour=hr
}
return out
}

export default function(r){
const base='/api/servers/:sid/labs'
r.add('GET',base,async c=>{
const m=await member(c,c.p.sid)
const f=await activeFeatures(c.env,m.server)
const rows=f?(await c.env.DB.prepare('select feature,enabled,config from xf_cfg where server_id=?').bind(m.server.id).all()).results:[]
const feats={}
for(const k of KEYS){
const row=rows.find(x=>x.feature===k)
feats[k]={name:FEATURES[k].name,descr:FEATURES[k].descr,enabled:!!(row&&row.enabled),config:{...FEATURES[k].def,...(row?parse(row.config):{})}}
}
return{active:!!f,features:feats}
})
r.add('PUT',base+'/:key',async c=>{
const m=await mgr(c,c.p.sid)
if(!FEATURES[c.p.key])fail(404,'Unknown feature')
if(!await activeFeatures(c.env,m.server))fail(403,'This server is not taking part in the Experimental Servers Program')
limit('xfcfg:'+c.user.id,60,60000)
const b=await body(c.req,4000)
const row=await c.env.DB.prepare('select config,enabled from xf_cfg where server_id=? and feature=?').bind(m.server.id,c.p.key).first()
const enabled=b.enabled===undefined?!!(row&&row.enabled):!!b.enabled
const cfg=b.config===undefined?{...FEATURES[c.p.key].def,...(row?parse(row.config):{})}:await clean(c,m,c.p.key,b.config||{})
if(enabled&&'channel_id' in FEATURES[c.p.key].def&&c.p.key!=='sticky'&&!cfg.channel_id)fail(400,'Pick a channel first')
await c.env.DB.batch([
c.env.DB.prepare('insert into xf_cfg(server_id,feature,enabled,config,updated_at) values(?,?,?,?,?) on conflict(server_id,feature) do update set enabled=excluded.enabled,config=excluded.config,updated_at=excluded.updated_at').bind(m.server.id,c.p.key,enabled?1:0,JSON.stringify(cfg),now()),
c.logStmt(m.server.id,'labs.'+c.p.key,'',enabled?'on':'off')
])
return{ok:true,enabled,config:cfg}
})

r.add('GET',base+'/leaderboard',async c=>{
const m=await member(c,c.p.sid)
await needFeature(c,m,'levels')
const rows=(await c.env.DB.prepare('select x.user_id,x.xp,x.msgs,u.username,u.display_name,u.avatar_id from xf_xp x join members mm on mm.server_id=x.server_id and mm.user_id=x.user_id join users u on u.id=x.user_id where x.server_id=? order by x.xp desc limit 25').bind(m.server.id).all()).results
const me=await c.env.DB.prepare('select xp,msgs from xf_xp where server_id=? and user_id=?').bind(m.server.id,c.user.id).first()
const rank=me?(await c.env.DB.prepare('select count(*)+1 n from xf_xp where server_id=? and xp>?').bind(m.server.id,me.xp).first()).n:null
const lvl=me?level(me.xp):0
return{top:rows.map((x,i)=>({rank:i+1,user_id:x.user_id,username:x.username,display_name:x.display_name,avatar_id:x.avatar_id,xp:x.xp,msgs:x.msgs,level:level(x.xp)})),me:me?{xp:me.xp,msgs:me.msgs,level:lvl,rank,next_at:60*(lvl+1)*(lvl+1)}:null}
})

r.add('GET',base+'/rr',async c=>{
const m=await mgr(c,c.p.sid)
const rows=(await c.env.DB.prepare('select x.message_id,x.emoji,x.role_id,r.name role_name,substr(coalesce(g.content,\'\'),1,80) preview,g.room channel_id from xf_rr x left join roles r on r.id=x.role_id left join messages g on g.id=x.message_id where x.server_id=? order by x.message_id desc').bind(m.server.id).all()).results
return{items:rows}
})
r.add('POST',base+'/rr',async c=>{
const m=await mgr(c,c.p.sid)
await needFeature(c,m,'reactionroles')
limit('xfrr:'+c.user.id,30,60000)
const b=await body(c.req,1000)
const em=typeof b.emoji==='string'?b.emoji.trim():''
if(!em||em.length>40||/[\s<>]/.test(em))fail(400,'Pick a single emoji')
const msg=await c.env.DB.prepare('select g.id,g.room from messages g join channels c on c.id=g.room where g.id=? and c.server_id=? and g.deleted_at is null').bind(String(b.message_id||''),m.server.id).first()
if(!msg)fail(404,'Message not found in this server')
const role=await manageableRole(c.env,m,b.role_id)
const n=(await c.env.DB.prepare('select count(*) n from xf_rr where server_id=?').bind(m.server.id).first()).n
if(n>=50)fail(400,'A server can have up to 50 reaction roles')
const res=await c.env.DB.prepare('insert or ignore into xf_rr(message_id,emoji,server_id,role_id) values(?,?,?,?)').bind(msg.id,em,m.server.id,role.id).run()
if(!res.meta.changes)fail(409,'That emoji already gives a role on this message')
await botReact(c,m.server.id,msg.room,msg.id,em).catch(()=>{})
return{ok:true}
})
r.add('DELETE',base+'/rr/:mid/:emoji',async c=>{
const m=await mgr(c,c.p.sid)
await c.env.DB.prepare('delete from xf_rr where message_id=? and emoji=? and server_id=?').bind(c.p.mid,c.p.emoji,m.server.id).run()
return{ok:true}
})

r.add('GET',base+'/giveaways',async c=>{
const m=await member(c,c.p.sid)
const rows=(await c.env.DB.prepare('select id,channel_id,message_id,prize,winners,host_id,ends_at,ended,winner_ids,created_at from xf_give where server_id=? order by created_at desc limit 25').bind(m.server.id).all()).results
return{items:rows.map(g=>{let w=[];try{w=JSON.parse(g.winner_ids)}catch{}return{...g,ended:!!g.ended,winner_ids:Array.isArray(w)?w:[]}})}
})
r.add('POST',base+'/giveaways',async c=>{
const m=await mgr(c,c.p.sid)
await needFeature(c,m,'giveaways')
limit('xfgive:'+c.user.id,10,3600000)
const b=await body(c.req,1000)
const prize=text(b.prize,1,100,'Prize')
const winners=Number(b.winners),mins=Number(b.minutes)
if(!Number.isInteger(winners)||winners<1||winners>10)fail(400,'Winners must be 1 to 10')
if(!Number.isFinite(mins)||mins<1||mins>43200)fail(400,'Duration must be 1 minute to 30 days')
const chn=await textChannel(c.env,m.server.id,b.channel_id)
const open=(await c.env.DB.prepare('select count(*) n from xf_give where server_id=? and ended=0').bind(m.server.id).first()).n
if(open>=10)fail(400,'End one of your running giveaways first')
const t=now(),ends=t+Math.round(mins*60000)
const id=newId('gw')
const mid=await post(c,m.server.id,chn.id,`🎉 **Giveaway: ${prize}**\nReact with 🎉 to enter. ${winners} winner${winners>1?'s':''}. Ends <t:${Math.floor(ends/1000)}:R>.`)
if(!mid)fail(400,'Could not post in that channel')
await c.env.DB.prepare('insert into xf_give(id,server_id,channel_id,message_id,prize,winners,host_id,ends_at,created_at) values(?,?,?,?,?,?,?,?,?)').bind(id,m.server.id,chn.id,mid,prize,winners,c.user.id,ends,t).run()
await botReact(c,m.server.id,chn.id,mid,'🎉').catch(()=>{})
return{ok:true,id}
})
r.add('POST',base+'/giveaways/:gid/end',async c=>{
const m=await mgr(c,c.p.sid)
const g=await c.env.DB.prepare('select * from xf_give where id=? and server_id=?').bind(c.p.gid,m.server.id).first()
if(!g)fail(404,'Giveaway not found')
if(g.ended)fail(409,'This giveaway has already ended')
await endGiveaway(c,g,false)
return{ok:true}
})
r.add('POST',base+'/giveaways/:gid/reroll',async c=>{
const m=await mgr(c,c.p.sid)
const g=await c.env.DB.prepare('select * from xf_give where id=? and server_id=?').bind(c.p.gid,m.server.id).first()
if(!g)fail(404,'Giveaway not found')
if(!g.ended)fail(409,'This giveaway is still running')
limit('xfreroll:'+c.user.id,10,3600000)
await drawGiveaway(c,g)
return{ok:true}
})

r.add('GET',base+'/counting',async c=>{
const m=await member(c,c.p.sid)
await needFeature(c,m,'counting')
const st=await c.env.DB.prepare('select last_n,best from xf_count where server_id=?').bind(m.server.id).first()
return{last:st?st.last_n:0,best:st?st.best:0}
})
r.add('POST',base+'/counting/reset',async c=>{
const m=await mgr(c,c.p.sid)
await c.env.DB.prepare('update xf_count set last_n=0,last_user=null where server_id=?').bind(m.server.id).run()
return{ok:true}
})

r.add('GET',base+'/qotd',async c=>{
const m=await mgr(c,c.p.sid)
const rows=(await c.env.DB.prepare('select id,text,used_at from xf_qotd where server_id=? order by used_at is not null,created_at desc limit 100').bind(m.server.id).all()).results
return{items:rows}
})
r.add('POST',base+'/qotd',async c=>{
const m=await mgr(c,c.p.sid)
await needFeature(c,m,'qotd')
limit('xfq:'+c.user.id,30,60000)
const b=await body(c.req,2000)
const t=text(b.text,5,300,'Question')
const n=(await c.env.DB.prepare('select count(*) n from xf_qotd where server_id=? and used_at is null').bind(m.server.id).first()).n
if(n>=200)fail(400,'The queue can hold 200 unused questions')
await c.env.DB.prepare('insert into xf_qotd(id,server_id,text,created_at) values(?,?,?,?)').bind(newId('qd'),m.server.id,t,now()).run()
return{ok:true}
})
r.add('DELETE',base+'/qotd/:id',async c=>{
const m=await mgr(c,c.p.sid)
await c.env.DB.prepare('delete from xf_qotd where id=? and server_id=?').bind(c.p.id,m.server.id).run()
return{ok:true}
})
r.add('POST',base+'/qotd/ask',async c=>{
const m=await mgr(c,c.p.sid)
const cfg=await needFeature(c,m,'qotd')
if(!cfg.channel_id)fail(400,'Pick a channel first')
limit('xfask:'+c.user.id,10,3600000)
if(!await pickQuestion(c,m.server.id,cfg.channel_id))fail(409,'There are no unused questions in the queue')
return{ok:true}
})

r.add('POST',base+'/confessions',async c=>{
const m=await member(c,c.p.sid)
const cfg=await needFeature(c,m,'confessions')
if(await state(c.env,m.server.id,'cban:'+c.user.id))fail(403,'You cannot post confessions in this server')
limit('xfconf:'+c.user.id,3,3600000)
const b=await body(c.req,4000)
const t=text(b.text,5,1500,'Confession')
if(/<@[&a-z0-9_]+>|@everyone|@here/.test(t))fail(400,'Mentions are not allowed in confessions')
const n=(await c.env.DB.prepare('select count(*) n from xf_conf where server_id=?').bind(m.server.id).first()).n+1
const id=newId('cf')
const mid=await post(c,m.server.id,cfg.channel_id,`**Anonymous confession #${n}**\n${t}`)
if(!mid)fail(400,'The confession channel is not available')
await c.env.DB.prepare('insert into xf_conf(id,server_id,user_id,text,message_id,created_at) values(?,?,?,?,?,?)').bind(id,m.server.id,c.user.id,t,mid,now()).run()
return{ok:true}
})
r.add('GET',base+'/confessions',async c=>{
const m=await mgr(c,c.p.sid,P.MODERATE)
const rows=(await c.env.DB.prepare('select f.id,f.text,f.message_id,f.user_id,f.created_at,u.display_name,u.username from xf_conf f left join users u on u.id=f.user_id where f.server_id=? order by f.created_at desc limit 50').bind(m.server.id).all()).results
const banned=new Set((await c.env.DB.prepare("select k from xf_state where server_id=? and k like 'cban:%'").bind(m.server.id).all()).results.map(x=>x.k.slice(5)))
return{items:rows.map(x=>({...x,banned:banned.has(x.user_id)}))}
})
r.add('POST',base+'/confessions/:id/remove',async c=>{
const m=await mgr(c,c.p.sid,P.MODERATE)
const f=await c.env.DB.prepare('select * from xf_conf where id=? and server_id=?').bind(c.p.id,m.server.id).first()
if(!f)fail(404,'Confession not found')
if(f.message_id){
const g=await c.env.DB.prepare('select room from messages where id=?').bind(f.message_id).first()
if(g)await dropMessage(c,m.server.id,g.room,f.message_id)
}
await c.env.DB.batch([c.env.DB.prepare("update xf_conf set text='' where id=?").bind(f.id),c.logStmt(m.server.id,'labs.confession.remove',f.id,'')])
return{ok:true}
})
r.add('POST',base+'/confessions/:id/block',async c=>{
const m=await mgr(c,c.p.sid,P.MODERATE)
const b=await body(c.req,500)
const f=await c.env.DB.prepare('select user_id from xf_conf where id=? and server_id=?').bind(c.p.id,m.server.id).first()
if(!f)fail(404,'Confession not found')
if(b.on===false)await c.env.DB.prepare('delete from xf_state where server_id=? and k=?').bind(m.server.id,'cban:'+f.user_id).run()
else await setState(c.env,m.server.id,'cban:'+f.user_id,1)
await c.env.DB.prepare('insert into mod_log(id,server_id,actor_id,action,target_id,detail,created_at) values(?,?,?,?,?,?,?)').bind(newId('ml'),m.server.id,c.user.id,'labs.confession.block',f.user_id,b.on===false?'unblocked':'blocked',now()).run()
return{ok:true}
})

r.add('GET',base+'/birthdays',async c=>{
const m=await member(c,c.p.sid)
await needFeature(c,m,'birthdays')
const rows=(await c.env.DB.prepare('select b.user_id,b.m,b.d,u.display_name,u.username from xf_bday b join members mm on mm.server_id=b.server_id and mm.user_id=b.user_id join users u on u.id=b.user_id where b.server_id=? order by b.m,b.d limit 200').bind(m.server.id).all()).results
const mine=rows.find(x=>x.user_id===c.user.id)
return{items:rows,mine:mine?{m:mine.m,d:mine.d}:null}
})
r.add('PUT',base+'/me/birthday',async c=>{
const m=await member(c,c.p.sid)
await needFeature(c,m,'birthdays')
limit('xfbd:'+c.user.id,10,3600000)
const b=await body(c.req,300)
const mo=Number(b.m),d=Number(b.d)
const days=[31,29,31,30,31,30,31,31,30,31,30,31]
if(!Number.isInteger(mo)||mo<1||mo>12||!Number.isInteger(d)||d<1||d>days[mo-1])fail(400,'Enter a real date')
await c.env.DB.prepare('insert into xf_bday(server_id,user_id,m,d) values(?,?,?,?) on conflict(server_id,user_id) do update set m=excluded.m,d=excluded.d').bind(m.server.id,c.user.id,mo,d).run()
return{ok:true}
})
r.add('DELETE',base+'/me/birthday',async c=>{
const m=await member(c,c.p.sid)
await c.env.DB.prepare('delete from xf_bday where server_id=? and user_id=?').bind(m.server.id,c.user.id).run()
return{ok:true}
})

r.add('GET',base+'/suggestions',async c=>{
const m=await member(c,c.p.sid)
await needFeature(c,m,'suggestions')
const rows=(await c.env.DB.prepare('select s.id,s.text,s.status,s.note,s.created_at,s.user_id,u.display_name from xf_sugg s left join users u on u.id=s.user_id where s.server_id=? order by s.created_at desc limit 50').bind(m.server.id).all()).results
return{items:rows,can_review:m.admin||!!(m.base&(P.MODERATE|P.MANAGE_SERVER))}
})
r.add('POST',base+'/suggestions',async c=>{
const m=await member(c,c.p.sid)
const cfg=await needFeature(c,m,'suggestions')
limit('xfsug:'+c.user.id,5,600000)
const b=await body(c.req,3000)
const t=text(b.text,5,1000,'Suggestion')
if(/<@[&a-z0-9_]+>|@everyone|@here/.test(t))fail(400,'Mentions are not allowed in suggestions')
const mid=await post(c,m.server.id,cfg.channel_id,`**Suggestion from ${m.nickname||c.user.display_name}**\n${t}`)
if(!mid)fail(400,'The suggestions channel is not available')
const id=newId('sg')
await c.env.DB.prepare('insert into xf_sugg(id,server_id,user_id,text,message_id,created_at) values(?,?,?,?,?,?)').bind(id,m.server.id,c.user.id,t,mid,now()).run()
await botReact(c,m.server.id,cfg.channel_id,mid,'👍').catch(()=>{})
await botReact(c,m.server.id,cfg.channel_id,mid,'👎').catch(()=>{})
return{ok:true,id}
})
r.add('PATCH',base+'/suggestions/:id',async c=>{
const m=await member(c,c.p.sid)
if(!m.admin&&!(m.base&(P.MODERATE|P.MANAGE_SERVER)))fail(403,'You need the Moderate members or Manage server permission')
const cfg=await needFeature(c,m,'suggestions')
const b=await body(c.req,2000)
if(!['approved','declined','considering','open'].includes(b.status))fail(400,'Pick a status')
const note=b.note?text(b.note,1,300,'Note'):''
const s=await c.env.DB.prepare('select * from xf_sugg where id=? and server_id=?').bind(c.p.id,m.server.id).first()
if(!s)fail(404,'Suggestion not found')
await c.env.DB.batch([c.env.DB.prepare('update xf_sugg set status=?,note=? where id=?').bind(b.status,note,s.id),c.logStmt(m.server.id,'labs.suggestion.'+b.status,s.id,note)])
if(s.message_id&&b.status!=='open')await post(c,m.server.id,cfg.channel_id,`Suggestion ${b.status}${note?': '+note:'.'}`,s.message_id).catch(()=>{})
return{ok:true}
})

r.add('GET',base+'/sticky',async c=>{
const m=await mgr(c,c.p.sid)
const rows=(await c.env.DB.prepare('select s.channel_id,s.content,c.name from xf_sticky s join channels c on c.id=s.channel_id where s.server_id=?').bind(m.server.id).all()).results
return{items:rows}
})
r.add('PUT',base+'/sticky/:cid',async c=>{
const m=await mgr(c,c.p.sid)
await needFeature(c,m,'sticky')
limit('xfst:'+c.user.id,20,60000)
const b=await body(c.req,4000)
const chn=await textChannel(c.env,m.server.id,c.p.cid)
const t=text(b.content,1,1500,'Sticky message')
const n=(await c.env.DB.prepare('select count(*) n from xf_sticky where server_id=? and channel_id!=?').bind(m.server.id,chn.id).first()).n
if(n>=10)fail(400,'A server can have up to 10 sticky messages')
const old=await c.env.DB.prepare('select last_post from xf_sticky where channel_id=?').bind(chn.id).first()
if(old&&old.last_post)await dropMessage(c,m.server.id,chn.id,old.last_post)
const id=await post(c,m.server.id,chn.id,t)
await c.env.DB.prepare('insert into xf_sticky(channel_id,server_id,content,last_post,last_at) values(?,?,?,?,?) on conflict(channel_id) do update set content=excluded.content,last_post=excluded.last_post,last_at=excluded.last_at').bind(chn.id,m.server.id,t,id,now()).run()
return{ok:true}
})
r.add('DELETE',base+'/sticky/:cid',async c=>{
const m=await mgr(c,c.p.sid)
const old=await c.env.DB.prepare('select last_post from xf_sticky where channel_id=? and server_id=?').bind(c.p.cid,m.server.id).first()
if(old&&old.last_post)await dropMessage(c,m.server.id,c.p.cid,old.last_post)
await c.env.DB.prepare('delete from xf_sticky where channel_id=? and server_id=?').bind(c.p.cid,m.server.id).run()
return{ok:true}
})
}
