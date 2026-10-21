import{fail,now,newId,msgId,body,randHex,limit}from'./util.js'
import{P,loadMember}from'./perms.js'
import{hydrate}from'./messages.js'
import{signMsg}from'./sign.js'

export const CATALOG={
welcome:{name:'Welcome message',descr:'Posts a greeting in a channel when someone joins.',fields:[['channel_id','channel','Channel'],['text','text','Message']],def:{channel_id:'',text:'Welcome to {server}, {user}!'}},
goodbye:{name:'Leave notice',descr:'Posts a short note in a channel when someone leaves.',fields:[['channel_id','channel','Channel'],['text','text','Message']],def:{channel_id:'',text:'{user} left {server}.'}},
autorole:{name:'Auto role',descr:'Gives every new member a role when they join.',fields:[['role_id','role','Role']],def:{role_id:''}}
}
const fill=(t,u,s)=>String(t||'').replace(/\{user\}/g,u.display_name).replace(/\{username\}/g,u.username).replace(/\{server\}/g,s).slice(0,1000)
export async function pluginBot(env,sid){
const row=await env.DB.prepare("select config from server_plugins where server_id=? and plugin='_bot'").bind(sid).first()
if(row){try{return JSON.parse(row.config).user_id}catch{}}
const id=newId('u'),t=now()
await env.DB.batch([
env.DB.prepare('insert into users(id,username,display_name,pass_hash,pass_salt,pass_iters,is_bot,created_at) values(?,?,?,?,?,?,1,?)').bind(id,'pl_'+randHex(8),'Server plugins','!','!',1,t),
env.DB.prepare("insert into server_plugins(server_id,plugin,enabled,config,updated_at) values(?,?,?,?,?)").bind(sid,'_bot',0,JSON.stringify({user_id:id}),t)
])
return id
}
export async function post(c,sid,channelId,content,replyTo=null){
const ch=await c.env.DB.prepare('select id,server_id,type from channels where id=? and server_id=?').bind(channelId,sid).first()
if(!ch||!['text','announce'].includes(ch.type))return null
const bot=await pluginBot(c.env,sid)
const id=msgId(),t=now()
const sig=await signMsg(c.env,{id,room:ch.id,author_id:bot,created_at:t,edited_at:null,content})
await c.env.DB.batch([
c.env.DB.prepare('insert into messages(id,room,server_id,author_id,content,reply_to,created_at,sig) values(?,?,?,?,?,?,?,?)').bind(id,ch.id,sid,bot,content,replyTo,t,sig),
c.env.DB.prepare('update channels set last_msg=? where id=?').bind(id,ch.id)
])
const[message]=await hydrate(c.env,[await c.env.DB.prepare('select * from messages where id=?').bind(id).first()],bot)
c.pub('s_'+sid,{t:'msg.new',m:message,ment:{users:[],everyone:false,roles:[]}},{ch:ch.id})
return id
}
export function runPlugins(c,sid,event,user){
c.ec.waitUntil((async()=>{
const rows=(await c.env.DB.prepare("select plugin,config from server_plugins where server_id=? and enabled=1 and plugin!='_bot'").bind(sid).all()).results
if(!rows.length)return
const srv=await c.env.DB.prepare('select name from servers where id=?').bind(sid).first()
if(!srv)return
for(const r of rows){
let cfg={};try{cfg=JSON.parse(r.config)}catch{}
try{
if(event==='join'&&r.plugin==='welcome'&&cfg.channel_id)await post(c,sid,cfg.channel_id,fill(cfg.text,user,srv.name))
else if(event==='leave'&&r.plugin==='goodbye'&&cfg.channel_id)await post(c,sid,cfg.channel_id,fill(cfg.text,user,srv.name))
else if(event==='join'&&r.plugin==='autorole'&&cfg.role_id){
const role=await c.env.DB.prepare('select id from roles where id=? and server_id=? and is_everyone=0').bind(cfg.role_id,sid).first()
if(role)await c.env.DB.prepare('insert or ignore into member_roles(server_id,user_id,role_id) values(?,?,?)').bind(sid,user.id,role.id).run()
}
}catch{}
}
})().catch(()=>{}))
}
async function mgr(c,sid){
const m=await loadMember(c.env,sid,c.user.id)
if(!m)fail(404,'Server not found')
if(!(m.base&P.MANAGE_SERVER))fail(403,'You need the Manage server permission')
return m
}
export default function(r){
r.add('GET','/api/servers/:sid/plugins',async c=>{
await mgr(c,c.p.sid)
const rows=(await c.env.DB.prepare("select plugin,enabled,config from server_plugins where server_id=? and plugin!='_bot'").bind(c.p.sid).all()).results
const by=new Map(rows.map(x=>[x.plugin,x]))
return{plugins:Object.entries(CATALOG).map(([id,p])=>{let cfg={};try{cfg=JSON.parse(by.get(id)?.config||'{}')}catch{}return{id,name:p.name,descr:p.descr,fields:p.fields,enabled:!!by.get(id)?.enabled,config:{...p.def,...cfg}}})}
})
r.add('PUT','/api/servers/:sid/plugins/:id',async c=>{
await mgr(c,c.p.sid)
limit('plug:'+c.user.id,60,3600000)
const p=CATALOG[c.p.id]
if(!p)fail(404,'Unknown plugin')
const b=await body(c.req)
const cfg={}
for(const[k,kind]of p.fields){
const v=String(b.config?.[k]??p.def[k]??'')
if(kind==='channel'){
if(v){const ch=await c.env.DB.prepare("select id from channels where id=? and server_id=? and type in ('text','announce')").bind(v,c.p.sid).first();if(!ch)fail(400,'Pick a text channel in this server')}
cfg[k]=v
}else if(kind==='role'){
if(v){const ro=await c.env.DB.prepare('select id from roles where id=? and server_id=? and is_everyone=0').bind(v,c.p.sid).first();if(!ro)fail(400,'Pick a role in this server')}
cfg[k]=v
}else cfg[k]=v.slice(0,500)
}
const en=b.enabled?1:0
if(en&&p.fields.some(([k,kind])=>kind!=='text'&&!cfg[k]))fail(400,'Finish choosing the options before turning it on')
await c.env.DB.prepare('insert into server_plugins(server_id,plugin,enabled,config,updated_at) values(?,?,?,?,?) on conflict(server_id,plugin) do update set enabled=excluded.enabled,config=excluded.config,updated_at=excluded.updated_at').bind(c.p.sid,c.p.id,en,JSON.stringify(cfg),now()).run()
return{ok:true}
})
}
