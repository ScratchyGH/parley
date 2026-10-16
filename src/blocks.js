import{now,msgId,limit}from'./util.js'
import{resolveRoom,P}from'./perms.js'
import{signMsg}from'./sign.js'
import{hydrate,publishMsg}from'./messages.js'
import{execute}from'./blockrun.js'

async function say(c,rr,botId,text,replyTo){
const brr=await resolveRoom(c.env,rr.room,botId)
if(!(brr.perms&P.SEND))return
const id=msgId(),t=now()
await c.env.DB.batch([
c.env.DB.prepare('insert into messages(id,room,server_id,author_id,content,reply_to,created_at,nonce,sig) values(?,?,?,?,?,?,?,?,?)').bind(id,rr.room,rr.serverId||null,botId,text,replyTo||null,t,null,await signMsg(c.env,{id,room:rr.room,author_id:botId,created_at:t,content:text})),
c.env.DB.prepare('update channels set last_msg=? where id=?').bind(id,rr.room)
])
const row=await c.env.DB.prepare('select * from messages where id=?').bind(id).first()
const[message]=await hydrate(c.env,[row],botId)
await publishMsg(c,brr,{t:'msg.new',m:message,ment:{users:[],everyone:false,roles:[]}})
}

async function react(c,rr,botId,mid,emoji){
const brr=await resolveRoom(c.env,rr.room,botId)
if(!(brr.perms&P.REACT)||/[\s<>\u0000-\u001f]/.test(emoji))return
const ex=await c.env.DB.prepare('select count(distinct emoji) n,max(emoji=?) has from reactions where message_id=?').bind(emoji,mid).first()
if(!ex.has&&ex.n>=20)return
const res=await c.env.DB.prepare('insert or ignore into reactions(message_id,user_id,emoji) values(?,?,?)').bind(mid,botId,emoji).run()
if(res.meta.changes)await publishMsg(c,brr,{t:'reaction',room:rr.room,mid,emoji,uid:botId,add:true})
}

async function counter(c,botId,sid,k,by){
await c.env.DB.prepare('insert into bot_vars(bot_id,server_id,k,v) values(?,?,?,?) on conflict(bot_id,server_id,k) do update set v=v+excluded.v').bind(botId,sid,k,by).run()
const r=await c.env.DB.prepare('select v from bot_vars where bot_id=? and server_id=? and k=?').bind(botId,sid,k).first()
return r?r.v:0
}

export async function runBlocks(c,rr,message){
if(rr.kind!=='channel'||rr.thread||!message.content)return
const rows=(await c.env.DB.prepare('select p.bot_id,p.blocks from bot_installs i join bot_projects p on p.id=i.project_id join members m on m.server_id=i.server_id and m.user_id=p.bot_id where i.server_id=? and p.blocks is not null limit 5').bind(rr.serverId).all()).results
for(const row of rows){
let graph
try{graph=JSON.parse(row.blocks)}catch{continue}
try{limit('blk:'+row.bot_id+':'+rr.room,30,60000)}catch{continue}
const ctx={user:message.author||{id:message.author_id,username:'',display_name:''},channel:rr.ch.name,server:rr.m.server.name,text:message.content}
const io={
send:(text,reply)=>say(c,rr,row.bot_id,text,reply?message.id:null),
react:e=>react(c,rr,row.bot_id,message.id,e),
count:(k,by)=>counter(c,row.bot_id,rr.serverId,k,by)
}
try{await execute(graph,ctx,io)}catch{}
}
}

export async function dryRun(graph,text,user){
const sent=[]
const io={send:async(t,r)=>{sent.push({say:t,reply:!!r})},react:async e=>{sent.push({react:e})},count:async(k,by)=>by}
const log=await execute(graph,{user,channel:'general',server:'Your server',text},io)
return{log,sent}
}
