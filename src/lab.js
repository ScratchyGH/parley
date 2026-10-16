import{fail,now,newId,str,limit,body,clamp}from'./util.js'
import{P,resolveRoom,loadMember}from'./perms.js'
import{explicitText}from'./safety.js'
import{sweepExplicitServers}from'./servers.js'

const POLL='https://gen.pollinations.ai'
const TYPES=['text','announce','voice','forum']
const listed=(env,u)=>(env.EXPERIMENTAL_USERNAMES||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean).includes(u.username)
const labsOn=(c)=>!!c.user.labs||listed(c.env,c.user)
const gate=c=>{if(c.user.is_bot||!labsOn(c))fail(404,'Not found')}
const modelOk=m=>typeof m==='string'&&/^[a-zA-Z0-9._:\/-]{1,60}$/.test(m)

async function models(c){
const key=new Request('https://lab.cache/models')
const hit=await caches.default.match(key)
if(hit)return hit.json()
const res=await fetch(POLL+'/v1/models',{headers:{accept:'application/json'}})
if(!res.ok)fail(502,'Pollinations could not list models right now')
const raw=await res.json()
const out=(Array.isArray(raw&&raw.data)?raw.data:[]).filter(m=>m&&modelOk(m.id)&&m.category==='text'&&!m.paid_only&&(!m.output_modalities||m.output_modalities.includes('text'))&&(!m.supported_endpoints||m.supported_endpoints.includes('/v1/chat/completions'))).map(m=>({name:m.id,description:String(m.title||m.description||'').slice(0,120)})).slice(0,60)
c.ec.waitUntil(caches.default.put(key,new Response(JSON.stringify(out),{headers:{'cache-control':'public, max-age=3600'}})))
return out
}

async function ask(c,model,system,user,key){
if(!modelOk(model))fail(400,'Pick a model')
const list=await models(c)
if(!list.some(m=>m.name===model))fail(400,'That model is not available')
const ctl=new AbortController()
const timer=setTimeout(()=>ctl.abort(),40000)
try{
const hd={'content-type':'application/json'}
const tok=typeof key==='string'&&/^[A-Za-z0-9_.-]{8,200}$/.test(key)?key:c.env.POLLINATIONS_KEY
if(tok)hd.authorization='Bearer '+tok
const res=await fetch(POLL+'/v1/chat/completions',{method:'POST',signal:ctl.signal,headers:hd,body:JSON.stringify({model,messages:[{role:'system',content:system},{role:'user',content:user}]})})
if(res.status===429)fail(429,'Pollinations is busy. Wait about 15 seconds and try again')
if(res.status===401||res.status===402)fail(502,'Pollinations needs an API key for this request. Paste yours in the Pollinations key box (or ask the server operator to set POLLINATIONS_KEY)')
if(!res.ok)fail(502,'Pollinations returned an error ('+res.status+')')
const j=await res.json()
const text=j&&j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content
if(typeof text!=='string'||!text.trim())fail(502,'The model returned nothing')
return text
}catch(e){
if(e&&e.name==='AbortError')fail(504,'The model took too long')
throw e
}finally{clearTimeout(timer)}
}

const slug=s=>String(s||'').toLowerCase().trim().replace(/[\s_]+/g,'-').replace(/[^\p{L}\p{N}-]/gu,'').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,50)
const txt=(v,max)=>typeof v==='string'?v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim().slice(0,max):''

export function cleanLayout(raw){
let o=raw
if(typeof o==='string'){
const a=o.indexOf('{'),b=o.lastIndexOf('}')
if(a<0||b<a)fail(422,'The model did not return a layout')
try{o=JSON.parse(o.slice(a,b+1))}catch{fail(422,'The model returned a layout that could not be read')}
}
if(!o||typeof o!=='object'||Array.isArray(o))fail(422,'The model did not return a layout')
const out={description:txt(o.description,500),welcome:txt(o.welcome,1000),rules:txt(o.rules,3000),categories:[],roles:[]}
for(const cat of(Array.isArray(o.categories)?o.categories:[]).slice(0,8)){
const name=txt(cat&&cat.name,40)
if(!name)continue
const channels=[]
for(const ch of(Array.isArray(cat.channels)?cat.channels:[]).slice(0,10)){
const type=TYPES.includes(ch&&ch.type)?ch.type:'text'
const n=type==='voice'?txt(ch&&ch.name,50):slug(ch&&ch.name)
if(!n)continue
channels.push({name:n,type,topic:type==='voice'?'':txt(ch.topic,300)})
}
if(channels.length)out.categories.push({name,channels})
}
for(const r of(Array.isArray(o.roles)?o.roles:[]).slice(0,10)){
const name=txt(r&&r.name,40)
if(!name||/^@?everyone$/i.test(name))continue
out.roles.push({name,color:/^#[0-9a-fA-F]{6}$/.test(r.color||'')?r.color.toLowerCase():null})
}
if(!out.categories.length)fail(422,'The layout had no channels')
const all=JSON.stringify(out)
if(explicitText(all))fail(422,'That layout contains text that is not allowed. Try a different prompt')
return out
}

const SYSTEM='You design Discord-style community server layouts. Reply with one JSON object only, no markdown. Shape: {"description":string,"welcome":string,"rules":string,"categories":[{"name":string,"channels":[{"name":string,"type":"text"|"announce"|"voice"|"forum","topic":string}]}],"roles":[{"name":string,"color":"#rrggbb"}]}. Use 3 to 6 categories, 2 to 6 channels each, at most 8 roles. Text channel names are lowercase with dashes. Keep everything safe for work.'

export default function(r){
r.add('GET','/api/lab/status',async c=>({labs:labsOn(c)}))

r.add('POST','/api/me/adult',async c=>{
const b=await body(c.req)
const on=b.confirm===true?1:0
await c.env.DB.prepare('update users set adult_ok=? where id=?').bind(on,c.user.id).run()
return{adult_ok:!!on}
})

r.add('POST','/api/admin/users/:id/labs',async c=>{
if(!c.user.admin)fail(404,'Not found')
const b=await body(c.req)
const res=await c.env.DB.prepare('update users set labs=? where id=? and is_bot=0').bind(b.on?1:0,c.p.id).run()
if(!res.meta.changes)fail(404,'User not found')
return{ok:true}
})

r.add('POST','/api/admin/sweep',async c=>{
if(!c.user.admin)fail(404,'Not found')
const ids=await sweepExplicitServers(c.env)
return{removed:ids.length}
})

r.add('GET','/api/lab/models',async c=>{
gate(c)
return{models:await models(c)}
})

r.add('POST','/api/lab/ai/layout',async c=>{
gate(c)
limit('lab-ai:'+c.user.id,6,60000)
const b=await body(c.req)
const prompt=str(b.prompt,8,600,'Prompt')
if(explicitText(prompt))fail(400,'That prompt is not allowed')
const text=await ask(c,b.model,SYSTEM,prompt,b.key)
return{layout:cleanLayout(text)}
})

r.add('POST','/api/lab/ai/validate',async c=>{
gate(c)
const b=await body(c.req)
return{layout:cleanLayout(b.layout)}
})

const applyLayout=async c=>{
limit('lab-apply:'+c.user.id,10,3600000)
const m=await loadMember(c.env,c.p.sid,c.user.id)
if(!m)fail(404,'Server not found')
if(!(m.base&P.MANAGE_CHANNELS))fail(403,'You need the Manage Channels permission')
const b=await body(c.req)
const lay=cleanLayout(b.layout)
const withRoles=lay.roles.length&&b.roles!==false
if(withRoles&&!(m.base&P.MANAGE_ROLES))fail(403,'You need the Manage Roles permission to add roles. Apply without roles instead')
const withText=b.text===true
if(withText&&!(m.base&P.MANAGE_SERVER))fail(403,'You need the Manage Server permission to change the description and rules')
const chCount=lay.categories.reduce((n,x)=>n+x.channels.length,0)
const have=await c.env.DB.prepare('select (select count(*) from channels where server_id=?) ch,(select count(*) from roles where server_id=?) ro,(select coalesce(max(position),-1)+1 from categories where server_id=?) cp,(select coalesce(max(position),-1)+1 from channels where server_id=?) hp').bind(m.server.id,m.server.id,m.server.id,m.server.id).first()
if(have.ch+chCount>200)fail(400,'That would pass the 200 channel limit')
if(withRoles&&have.ro+lay.roles.length>100)fail(400,'That would pass the 100 role limit')
const t=now()
const st=[]
let cp=have.cp,hp=have.hp
for(const cat of lay.categories){
const cid=newId('ct')
st.push(c.env.DB.prepare('insert into categories(id,server_id,name,position) values(?,?,?,?)').bind(cid,m.server.id,cat.name,cp++))
for(const ch of cat.channels)st.push(c.env.DB.prepare('insert into channels(id,server_id,category_id,name,type,topic,position,readonly,slowmode,created_at) values(?,?,?,?,?,?,?,0,0,?)').bind(newId('ch'),m.server.id,cid,ch.name,ch.type,ch.topic||'',hp++,t))
}
if(withRoles)for(const ro of lay.roles)st.push(c.env.DB.prepare('insert into roles(id,server_id,name,color,position,perms) values(?,?,?,?,?,0)').bind(newId('r'),m.server.id,ro.name,ro.color,1))
if(withText){
const sets=[],vals=[]
for(const k of['description','welcome','rules'])if(lay[k]){sets.push(k+'=?');vals.push(lay[k])}
if(sets.length)st.push(c.env.DB.prepare(`update servers set ${sets.join(',')} where id=?`).bind(...vals,m.server.id))
}
st.push(c.logStmt(m.server.id,'lab.layout',m.server.id,`${lay.categories.length} categories, ${chCount} channels`))
await c.env.DB.batch(st)
c.pubClose('s_'+m.server.id,{closeAll:true})
return{categories:lay.categories.length,channels:chCount,roles:withRoles?lay.roles.length:0}
}
r.add('POST','/api/lab/servers/:sid/apply',async c=>{
gate(c)
return applyLayout(c)
})
r.add('POST','/api/servers/:sid/template',applyLayout)
r.add('GET','/api/servers/:sid/template',async c=>{
const m=await loadMember(c.env,c.p.sid,c.user.id)
if(!m)fail(404,'Server not found')
if(!(m.base&P.MANAGE_SERVER))fail(403,'You need the Manage Server permission')
const cats=(await c.env.DB.prepare('select id,name from categories where server_id=? order by position').bind(m.server.id).all()).results
const chs=(await c.env.DB.prepare('select category_id,name,type,topic from channels where server_id=? order by position').bind(m.server.id).all()).results
const roles=(await c.env.DB.prepare('select name,color from roles where server_id=? and is_everyone=0 order by position desc').bind(m.server.id).all()).results
return{layout:{name:m.server.name,description:m.server.description||'',rules:m.server.rules||'',welcome:m.server.welcome||'',categories:cats.map(x=>({name:x.name,channels:chs.filter(y=>y.category_id===x.id).map(y=>({name:y.name,type:y.type,topic:y.topic||''}))})).filter(x=>x.channels.length),roles:roles.map(x=>({name:x.name,color:x.color||'#99aab5'}))}}
})

r.add('POST','/api/lab/ai/summary',async c=>{
gate(c)
limit('lab-ai:'+c.user.id,6,60000)
const b=await body(c.req)
const rr=await resolveRoom(c.env,String(b.room||''),c.user.id)
if(rr.kind!=='channel')fail(400,'Only server channels can be summarised')
const rows=(await c.env.DB.prepare("select u.display_name n,m.content from messages m join users u on u.id=m.author_id where m.room=? and m.deleted_at is null and m.content!='' order by m.created_at desc limit 120").bind(rr.room).all()).results.reverse()
if(rows.length<5)fail(400,'There are not enough messages to summarise yet')
let t=rows.map(x=>x.n+': '+x.content.replace(/<@&?[a-z0-9_]+>/g,'@someone')).join('\n')
t=t.slice(-12000)
const text=await ask(c,b.model,'Summarise this chat log in under 150 words. Start with the main topic, then list decisions and open questions as short bullet lines starting with "- ". Plain text only.',t,b.key)
return{summary:text.slice(0,2000),count:rows.length}
})

r.add('GET','/api/lab/health/:sid',async c=>{
gate(c)
const m=await loadMember(c.env,c.p.sid,c.user.id)
if(!m||!(m.base&P.MANAGE_SERVER))fail(403,'You need the Manage Server permission')
const sid=m.server.id,w=now()-7*86400000,mo=now()-30*86400000
const q=(sql,...a)=>c.env.DB.prepare(sql).bind(...a)
const[tot,busy,quiet,posters]=await c.env.DB.batch([
q('select (select count(*) from members where server_id=?) members,(select count(*) from members where server_id=? and joined_at>?) joined,(select count(*) from messages where server_id=? and created_at>? and deleted_at is null) msgs,(select count(distinct author_id) from messages where server_id=? and created_at>? and deleted_at is null) active,(select count(*) from roles where server_id=?) roles,(select count(*) from channels where server_id=?) channels,(select count(*) from bans where server_id=?) bans',sid,sid,w,sid,w,sid,w,sid,sid,sid),
q('select ch.id,ch.name,count(*) n from messages m join channels ch on ch.id=m.room where m.server_id=? and m.created_at>? and m.deleted_at is null group by ch.id order by n desc limit 5',sid,w),
q("select ch.id,ch.name from channels ch where ch.server_id=? and ch.type!='voice' and not exists(select 1 from messages m where m.room=ch.id and m.created_at>? and m.deleted_at is null) order by ch.position limit 20",sid,mo),
q('select u.display_name name,count(*) n from messages m join users u on u.id=m.author_id where m.server_id=? and m.created_at>? and m.deleted_at is null group by m.author_id order by n desc limit 5',sid,w)
])
return{totals:tot.results[0],busiest:busy.results,quiet:quiet.results,posters:posters.results}
})

r.add('GET','/api/lab/export/:room',async c=>{
gate(c)
limit('lab-export:'+c.user.id,10,3600000)
const rr=await resolveRoom(c.env,c.p.room,c.user.id)
const n=clamp(c.url.searchParams.get('limit'),1000,1,5000)
const rows=(await c.env.DB.prepare("select u.display_name n,m.content,m.created_at t from messages m join users u on u.id=m.author_id where m.room=? and m.deleted_at is null order by m.created_at desc limit ?").bind(rr.room,n).all()).results.reverse()
const fmt=c.url.searchParams.get('fmt')==='json'
const outp=fmt?JSON.stringify(rows.map(x=>({author:x.n,at:new Date(x.t).toISOString(),content:x.content})),null,1):rows.map(x=>`[${new Date(x.t).toISOString()}] ${x.n}: ${x.content}`).join('\n')
return new Response(outp,{headers:{'content-type':fmt?'application/json':'text/plain; charset=utf-8','content-disposition':`attachment; filename="parley-export.${fmt?'json':'txt'}"`,'cache-control':'no-store','x-content-type-options':'nosniff'}})
})
}
