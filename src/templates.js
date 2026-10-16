import{fail,now,newId,str,opt,limit,body,json,rnd}from'./util.js'
import{P,DEFAULT,loadMember}from'./perms.js'
import{explicitText}from'./safety.js'
import{cleanLayout}from'./lab.js'

async function snapshot(c,sid){
const cats=(await c.env.DB.prepare('select id,name from categories where server_id=? order by position').bind(sid).all()).results
const chs=(await c.env.DB.prepare('select category_id,name,type,topic from channels where server_id=? order by position').bind(sid).all()).results
const roles=(await c.env.DB.prepare('select name,color from roles where server_id=? and is_everyone=0 order by position desc').bind(sid).all()).results
const ids=new Set(cats.map(x=>x.id))
if(chs.some(y=>!ids.has(y.category_id)))cats.push({id:null,name:'Channels'})
return{description:'',welcome:'',rules:'',categories:cats.map(x=>({name:x.name,channels:chs.filter(y=>x.id===null?!ids.has(y.category_id):y.category_id===x.id).map(y=>({name:y.name,type:y.type,topic:y.topic||''}))})).filter(x=>x.channels.length),roles:roles.map(x=>({name:x.name,color:x.color||null}))}
}

const summary=lay=>({categories:lay.categories.map(x=>({name:x.name,channels:x.channels.map(y=>({name:y.name,type:y.type}))})),roles:lay.roles.map(x=>x.name)})

export default function(r){
r.add('POST','/api/servers/:sid/templates',async c=>{
limit('tpl:'+c.user.id,20,3600000)
const m=await loadMember(c.env,c.p.sid,c.user.id)
if(!m)fail(404,'Server not found')
if(!(m.base&P.MANAGE_SERVER))fail(403,'You need the Manage Server permission')
const b=await body(c.req)
const name=str(b.name,2,60,'Template name')
const description=opt(b.description,300,'Description')
if(explicitText(name+' '+description))fail(400,'That text is not allowed on Parley')
const n=await c.env.DB.prepare('select count(*) n from server_templates where server_id=?').bind(m.server.id).first()
if(n.n>=5)fail(400,'A server can have 5 templates. Delete one first')
const lay=cleanLayout(await snapshot(c,m.server.id))
if(b.text!==false){lay.description=(m.server.description||'').slice(0,500);lay.welcome=(m.server.welcome||'').slice(0,1000);lay.rules=(m.server.rules||'').slice(0,3000)}
const code=rnd(8)
await c.env.DB.batch([c.env.DB.prepare('insert into server_templates(code,server_id,name,description,layout,created_by,created_at) values(?,?,?,?,?,?,?)').bind(code,m.server.id,name,description,JSON.stringify(lay),c.user.id,now()),c.logStmt(m.server.id,'template.create',m.server.id,name)])
return{code}
})

r.add('GET','/api/servers/:sid/templates',async c=>{
const m=await loadMember(c.env,c.p.sid,c.user.id)
if(!m)fail(404,'Server not found')
if(!(m.base&P.MANAGE_SERVER))fail(403,'You need the Manage Server permission')
const rows=(await c.env.DB.prepare('select code,name,description,uses,created_at from server_templates where server_id=? order by created_at desc').bind(m.server.id).all()).results
return{templates:rows}
})

r.add('DELETE','/api/servers/:sid/templates/:code',async c=>{
const m=await loadMember(c.env,c.p.sid,c.user.id)
if(!m)fail(404,'Server not found')
if(!(m.base&P.MANAGE_SERVER))fail(403,'You need the Manage Server permission')
await c.env.DB.batch([c.env.DB.prepare('delete from server_templates where code=? and server_id=?').bind(c.p.code,m.server.id),c.logStmt(m.server.id,'template.delete',m.server.id,c.p.code)])
return{ok:true}
})

r.add('GET','/api/templates/:code',async c=>{
limit('tplv:'+c.user.id,60,600000)
const t=await c.env.DB.prepare('select t.code,t.name,t.description,t.uses,t.layout,s.name server_name from server_templates t join servers s on s.id=t.server_id where t.code=?').bind(c.p.code).first()
if(!t)fail(404,'Template not found')
return{template:{code:t.code,name:t.name,description:t.description,uses:t.uses,server_name:t.server_name,...summary(JSON.parse(t.layout))}}
})

r.add('POST','/api/templates/:code/create',async c=>{
limit('mksrv:'+c.user.id,10,3600000)
const t=await c.env.DB.prepare('select code,layout,description from server_templates where code=?').bind(c.p.code).first()
if(!t)fail(404,'Template not found')
const b=await body(c.req)
const name=str(b.name,2,60,'Server name')
if(explicitText(name))fail(400,'That text is not allowed on Parley')
const lay=cleanLayout(JSON.parse(t.layout))
const own=await c.env.DB.prepare('select count(*) n from members where user_id=?').bind(c.user.id).first()
if(own.n>=100)fail(400,'You have reached the safety limit of 100 servers')
const sid=newId('sv'),ts=now()
const st=[
c.env.DB.prepare('insert into servers(id,owner_id,name,description,welcome,rules,is_public,category,created_at) values(?,?,?,?,?,?,0,?,?)').bind(sid,c.user.id,name,lay.description||'',lay.welcome||'',lay.rules||'','',ts),
c.env.DB.prepare('insert into roles(id,server_id,name,position,perms,is_everyone) values(?,?,?,?,?,1)').bind(newId('r'),sid,'@everyone',0,DEFAULT),
c.env.DB.prepare('insert into members(server_id,user_id,joined_at) values(?,?,?)').bind(sid,c.user.id,ts)
]
let cp=0,hp=0,first=null
for(const cat of lay.categories){
const cid=newId('ct')
st.push(c.env.DB.prepare('insert into categories(id,server_id,name,position) values(?,?,?,?)').bind(cid,sid,cat.name,cp++))
for(const ch of cat.channels){
const id=newId('ch')
if(!first&&ch.type==='text')first=id
st.push(c.env.DB.prepare('insert into channels(id,server_id,category_id,name,type,topic,position,readonly,slowmode,created_at) values(?,?,?,?,?,?,?,0,0,?)').bind(id,sid,cid,ch.name,ch.type,ch.topic||'',hp++,ts))
}
}
let rp=1
for(const ro of lay.roles)st.push(c.env.DB.prepare('insert into roles(id,server_id,name,color,position,perms) values(?,?,?,?,?,0)').bind(newId('r'),sid,ro.name,ro.color,rp++))
st.push(c.env.DB.prepare('update server_templates set uses=uses+1 where code=?').bind(t.code))
await c.env.DB.batch(st)
return json({id:sid,default_channel:first},201)
})
}
