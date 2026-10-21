import{fail,now,newId,str,body,clamp,limit,json}from'./util.js'
import{loadMember,P}from'./perms.js'

const DEF={rate:5,dailyHours:12,giftMax:200,giftDaily:500,giftMinAgeHours:24,boostCapMb:300}
const MILE=[[10,10],[50,50],[100,100],[250,250]]
const dayOf=t=>new Date(t).toISOString().slice(0,10)
export async function parsCfg(env){
const r=await env.DB.prepare("select v from app_settings where k='pars_cfg'").first()
let o={}
try{o=r?JSON.parse(r.v):{}}catch{}
const out={...DEF}
for(const k of Object.keys(DEF))if(Number.isFinite(o[k]))out[k]=o[k]
return out
}
const bal=async(env,id)=>(await env.DB.prepare('select pars from users where id=?').bind(id).first())?.pars||0
const txRow=(env,uid,delta,kind,ref,note)=>env.DB.prepare('insert into par_tx(id,user_id,delta,kind,ref,note,created_at) values(?,?,?,?,?,?,?)').bind(newId('pt'),uid,delta,kind,ref||null,note||'',now())
export async function grant(env,uid,n,kind,ref,note){
if(!n)return
await env.DB.batch([txRow(env,uid,n,kind,ref,note),env.DB.prepare('update users set pars=max(0,pars+?) where id=?').bind(n,uid)])
}
export async function boostMb(env,uid,sid){
const a=await env.DB.prepare("select coalesce(sum(i.mb),0) s from par_owned o join par_items i on i.id=o.item_id where o.user_id=? and o.server_id is null and i.kind='boost'").bind(uid).first()
const s=sid?await env.DB.prepare("select coalesce(sum(i.mb),0) s from par_owned o join par_items i on i.id=o.item_id where o.server_id=? and i.kind='boost'").bind(sid).first():{s:0}
return(a?.s||0)+(s?.s||0)
}
export async function ownsVanity(env,sid){
return!!(await env.DB.prepare("select 1 x from par_owned where server_id=? and item_id='vanity' and (expires_at is null or expires_at>?)").bind(sid,now()).first())
}
const permVanity=async(env,sid)=>!!(await env.DB.prepare("select 1 x from par_owned where server_id=? and item_id='vanity' and expires_at is null").bind(sid).first())
export async function expireVanity(env){
await env.DB.prepare("update servers set vanity=null where vanity is not null and not exists(select 1 from par_owned o where o.server_id=servers.id and o.item_id='vanity' and (o.expires_at is null or o.expires_at>?))").bind(now()).run()
}
const COSMETIC=['nameplate','frame','effect','namefx','badge']
const bundleOf=it=>{let d={};try{d=JSON.parse(it.data||'{}')}catch{}return{items:Array.isArray(d.items)?d.items:[],vanity_days:Number(d.vanity_days)||0}}
async function findUser(env,name){
const n=String(name||'').trim().replace(/^@/,'')
if(!/^[a-zA-Z0-9_.-]{3,24}$/.test(n))fail(400,'Enter a username')
const u=await env.DB.prepare('select id,username,display_name,is_bot,created_at from users where lower(username)=lower(?) and deleted_at is null').bind(n).first()
if(!u||u.is_bot)fail(404,'User not found')
return u
}
const shapeItem=i=>({hidden:!i.enabled,id:i.id,kind:i.kind,name:i.name,descr:i.descr,price:i.price,scope:i.scope,mb:i.mb,data:i.data})
export default function(r){
r.add('GET','/api/pars',async c=>{
const cfg=await parsCfg(c.env)
const[items,owned,tx,me,beat]=await Promise.all([
c.env.DB.prepare('select * from par_items where enabled=1 or id in (select item_id from par_owned where user_id=?) order by sort,price').bind(c.user.id).all(),
c.env.DB.prepare('select o.id,o.item_id,o.server_id,o.gift_from,o.created_at,o.expires_at,s.name server_name from par_owned o left join servers s on s.id=o.server_id where o.user_id=? order by o.created_at desc limit 200').bind(c.user.id).all(),
c.env.DB.prepare('select id,delta,kind,note,created_at from par_tx where user_id=? order by created_at desc limit 40').bind(c.user.id).all(),
c.env.DB.prepare('select pars,nameplate,frame,effect,namefx,badge from users where id=?').bind(c.user.id).first(),
c.env.DB.prepare('select total_ms,day,day_ms from par_beats where user_id=?').bind(c.user.id).first()
])
const today=beat&&beat.day===dayOf(now())?beat.day_ms:0
return{balance:me.pars,nameplate:me.nameplate,frame:me.frame,effect:me.effect,namefx:me.namefx,badge:me.badge,rate:cfg.rate,daily_cap_hours:cfg.dailyHours,today_ms:today,total_ms:beat?.total_ms||0,account_boost_mb:await boostMb(c.env,c.user.id,null),items:items.results.map(shapeItem),owned:owned.results,tx:tx.results,gift_max:cfg.giftMax,notice:'Pars are only earned by using Parley. They cannot be bought with money.'}
})
r.add('GET','/api/pars/history',async c=>{
const before=clamp(c.url.searchParams.get('before'),now()+1,0,now()+1)
const rows=(await c.env.DB.prepare('select id,delta,kind,note,created_at from par_tx where user_id=? and created_at<? order by created_at desc limit 50').bind(c.user.id,before).all()).results
return{tx:rows}
})
r.add('POST','/api/pars/beat',async c=>{
const b=await body(c.req,500)
const cfg=await parsCfg(c.env)
const t=now(),day=dayOf(t)
const i=clamp(b.i,0,0,12)
let row=await c.env.DB.prepare('select * from par_beats where user_id=?').bind(c.user.id).first()
if(!row){
await c.env.DB.prepare('insert or ignore into par_beats(user_id,last_beat,day) values(?,?,?)').bind(c.user.id,t,day).run()
return{earned:0,balance:await bal(c.env,c.user.id)}
}
const dt=t-row.last_beat
if(dt<50000)return{earned:0,balance:await bal(c.env,c.user.id)}
if(row.day!==day){row.day=day;row.day_ms=0;row.strikes=0}
const same=i===row.last_i&&i>0&&i<12?row.same+1:0
let strikes=row.strikes
if(same>=6)strikes++
const valid=b.v===true&&i>=4&&dt<=180000&&strikes<3&&same<6
let credit=valid?Math.min(dt,120000):0
const cap=cfg.dailyHours*3600000
if(row.day_ms+credit>cap)credit=Math.max(0,cap-row.day_ms)
const per=3600000/Math.max(1,cfg.rate)
let cm=row.credit_ms+credit
const n=Math.floor(cm/per)
cm-=n*per
const total=row.total_ms+credit
const st=[c.env.DB.prepare('update par_beats set last_beat=?,credit_ms=?,total_ms=?,day=?,day_ms=?,strikes=?,last_i=?,same=? where user_id=?').bind(t,cm,total,day,row.day_ms+credit,strikes,i,same,c.user.id)]
let earned=n
if(n>0)st.push(txRow(c.env,c.user.id,n,'earn','',n+' Par'+(n>1?'s':'')+' for active use'),c.env.DB.prepare('update users set pars=pars+? where id=?').bind(n,c.user.id))
const h0=row.total_ms/3600000,h1=total/3600000
const notes=[]
for(const[h,amt]of MILE)if(h0<h&&h1>=h){
st.push(txRow(c.env,c.user.id,amt,'milestone','ms'+h,h+' hours of active use'),c.env.DB.prepare('update users set pars=pars+? where id=?').bind(amt,c.user.id))
earned+=amt
notes.push(h+' hours milestone: +'+amt)
}
try{await c.env.DB.batch(st)}catch(e){if(!String(e.message).includes('UNIQUE'))throw e}
return{earned,notes,balance:await bal(c.env,c.user.id)}
})
r.add('POST','/api/pars/buy',async c=>{
limit('parb:'+c.user.id,30,60000)
const b=await body(c.req,2000)
const req=str(String(b.req||''),8,40,'Request id')
const it=await c.env.DB.prepare('select * from par_items where id=? and enabled=1').bind(String(b.item||'')).first()
if(!it)fail(404,'That item is not available')
const ref='buy:'+req
const dup=await c.env.DB.prepare("select 1 x from par_tx where user_id=? and kind='purchase' and ref=?").bind(c.user.id,ref).first()
if(dup)return{ok:true,duplicate:true,balance:await bal(c.env,c.user.id)}
let owner=c.user.id,sid=null,from=null,note=it.name,bun=null,todo=[]
if(it.kind==='vanity'||(it.kind==='boost'&&b.target==='server')){
sid=String(b.server_id||'')
const m=await loadMember(c.env,sid,c.user.id)
if(!m)fail(404,'Server not found')
if(it.kind==='vanity'){
if(!m.admin&&!(m.base&P.MANAGE_SERVER))fail(403,'You need the Manage Server permission')
if(await permVanity(c.env,sid))fail(409,'This server already has vanity links unlocked')
}
note+=' for '+m.server.name
}else if(it.kind==='boost'&&b.target==='user'){
const u=await findUser(c.env,b.user)
if(u.id===c.user.id)fail(400,'Use "My account" to boost yourself')
owner=u.id;from=c.user.id;note+=' gift to '+u.username
}else if(it.kind==='boost'&&b.target==='self'){
note+=' for your account'
}else if(COSMETIC.includes(it.kind)){
if(await c.env.DB.prepare('select 1 x from par_owned where user_id=? and item_id=?').bind(c.user.id,it.id).first())fail(409,'You already own this')
}else if(it.kind==='bundle'){
bun=bundleOf(it)
const have=new Set((await c.env.DB.prepare(`select item_id from par_owned where user_id=? and item_id in (${bun.items.map(()=>'?').join(',')})`).bind(c.user.id,...bun.items).all()).results.map(x=>x.item_id))
todo=bun.items.filter(x=>!have.has(x))
if(!todo.length&&!bun.vanity_days)fail(409,'You already own everything in this bundle')
if(bun.vanity_days){
sid=String(b.server_id||'')
const m=await loadMember(c.env,sid,c.user.id)
if(!m)fail(404,'Choose a server for the vanity link')
if(!m.admin&&!(m.base&P.MANAGE_SERVER))fail(403,'You need the Manage Server permission for that server')
if(await permVanity(c.env,sid))fail(409,'That server already has a permanent vanity link')
note+=' for '+m.server.name
}
}else fail(400,'Choose where to apply this')
if(it.kind==='boost'){
const cfg=await parsCfg(c.env)
const cur=await boostMb(c.env,sid?'':owner,sid||null)
if(cur+it.mb>cfg.boostCapMb)fail(409,'That would go over the '+cfg.boostCapMb+' MB boost limit')
}
const ok=await c.env.DB.prepare('update users set pars=pars-? where id=? and pars>=?').bind(it.price,c.user.id,it.price).run()
if(!ok.meta.changes)fail(402,'You need '+it.price+' Pars for this')
try{
const st=[txRow(c.env,c.user.id,-it.price,'purchase',ref,note)]
if(bun){
for(const x of todo)st.push(c.env.DB.prepare('insert into par_owned(id,user_id,item_id,server_id,gift_from,created_at) values(?,?,?,?,?,?)').bind(newId('po'),c.user.id,x,null,'bundle:'+it.id,now()))
if(bun.vanity_days){
const cur=await c.env.DB.prepare("select id,expires_at from par_owned where server_id=? and item_id='vanity' and expires_at is not null order by expires_at desc limit 1").bind(sid).first()
const add=bun.vanity_days*86400000
if(cur&&cur.expires_at>now())st.push(c.env.DB.prepare('update par_owned set expires_at=? where id=?').bind(cur.expires_at+add,cur.id))
else st.push(c.env.DB.prepare('insert into par_owned(id,user_id,item_id,server_id,gift_from,created_at,expires_at) values(?,?,?,?,?,?,?)').bind(newId('po'),c.user.id,'vanity',sid,'bundle:'+it.id,now(),now()+add))
}
}else st.push(c.env.DB.prepare('insert into par_owned(id,user_id,item_id,server_id,gift_from,created_at) values(?,?,?,?,?,?)').bind(newId('po'),owner,it.id,sid,from,now()))
await c.env.DB.batch(st)
}catch(e){
await c.env.DB.prepare('update users set pars=pars+? where id=?').bind(it.price,c.user.id).run()
if(String(e.message).includes('UNIQUE'))return{ok:true,duplicate:true,balance:await bal(c.env,c.user.id)}
throw e
}
if(sid)c.pub?.('s_'+sid,{t:'server.update',server_id:sid})
return json({ok:true,balance:await bal(c.env,c.user.id),spent:it.price},201)
})
r.add('POST','/api/pars/equip',async c=>{
const b=await body(c.req,500)
if(!COSMETIC.includes(b.kind))fail(400,'Invalid cosmetic')
let id=null
if(b.item){
id=String(b.item)
const it=await c.env.DB.prepare('select kind from par_items where id=?').bind(id).first()
if(!it||it.kind!==b.kind)fail(400,'Invalid item')
if(!(await c.env.DB.prepare('select 1 x from par_owned where user_id=? and item_id=?').bind(c.user.id,id).first()))fail(403,'You do not own this')
}
await c.env.DB.prepare(`update users set ${b.kind}=? where id=?`).bind(id,c.user.id).run()
return{ok:true}
})
r.add('POST','/api/pars/gift',async c=>{
limit('parg:'+c.user.id,20,3600000)
const b=await body(c.req,1000)
const cfg=await parsCfg(c.env)
const req=str(String(b.req||''),8,40,'Request id')
const n=Math.floor(Number(b.amount))
if(!Number.isFinite(n)||n<1||n>cfg.giftMax)fail(400,'Send between 1 and '+cfg.giftMax+' Pars')
const to=await findUser(c.env,b.to)
if(to.id===c.user.id)fail(400,'You cannot send Pars to yourself')
const me=await c.env.DB.prepare('select created_at from users where id=?').bind(c.user.id).first()
if(now()-me.created_at<cfg.giftMinAgeHours*3600000)fail(403,'New accounts can send Pars after '+cfg.giftMinAgeHours+' hours')
const ref='gift:'+req
if(await c.env.DB.prepare("select 1 x from par_tx where user_id=? and kind='gift_out' and ref=?").bind(c.user.id,ref).first())return{ok:true,duplicate:true,balance:await bal(c.env,c.user.id)}
const sent=await c.env.DB.prepare("select coalesce(-sum(delta),0) s from par_tx where user_id=? and kind='gift_out' and created_at>?").bind(c.user.id,now()-86400000).first()
if(sent.s+n>cfg.giftDaily)fail(429,'You can send '+cfg.giftDaily+' Pars per day')
const note=typeof b.note==='string'?b.note.slice(0,80):''
const ok=await c.env.DB.prepare('update users set pars=pars-? where id=? and pars>=?').bind(n,c.user.id,n).run()
if(!ok.meta.changes)fail(402,'You do not have enough Pars')
try{
await c.env.DB.batch([txRow(c.env,c.user.id,-n,'gift_out',ref,'Gift to '+to.username+(note?': '+note:'')),txRow(c.env,to.id,n,'gift_in',ref+':'+c.user.id,'Gift from '+c.user.username+(note?': '+note:'')),c.env.DB.prepare('update users set pars=pars+? where id=?').bind(n,to.id)])
}catch(e){
await c.env.DB.prepare('update users set pars=pars+? where id=?').bind(n,c.user.id).run()
if(String(e.message).includes('UNIQUE'))return{ok:true,duplicate:true,balance:await bal(c.env,c.user.id)}
throw e
}
c.pub?.('u_'+to.id,{t:'pars.gift',from:c.user.username,amount:n})
return json({ok:true,balance:await bal(c.env,c.user.id)},201)
})
r.add('POST','/api/me/seen-version',async c=>{
const b=await body(c.req,200)
const v=str(String(b.version||''),1,20,'Version')
await c.env.DB.prepare('update users set seen_version=? where id=?').bind(v,c.user.id).run()
return{ok:true}
})
const guard=c=>{if(!c.user.admin)fail(404,'Not found')}
r.add('GET','/api/admin/pars',async c=>{
guard(c)
const items=(await c.env.DB.prepare('select * from par_items order by sort,price').all()).results
const sup=await c.env.DB.prepare('select coalesce(sum(pars),0) s,count(*) n from users where pars>0').first()
return{cfg:await parsCfg(c.env),items,total_supply:sup.s,holders:sup.n}
})
r.add('PUT','/api/admin/pars/config',async c=>{
guard(c)
const b=await body(c.req,2000)
const cur=await parsCfg(c.env)
const lim={rate:[0,60],dailyHours:[1,24],giftMax:[1,10000],giftDaily:[1,100000],giftMinAgeHours:[0,720],boostCapMb:[0,2000]}
for(const[k,[lo,hi]]of Object.entries(lim))if(b[k]!==undefined){const v=Number(b[k]);if(!Number.isFinite(v)||v<lo||v>hi)fail(400,k+' must be between '+lo+' and '+hi);cur[k]=Math.round(v)}
await c.env.DB.prepare("insert into app_settings(k,v) values('pars_cfg',?) on conflict(k) do update set v=excluded.v").bind(JSON.stringify(cur)).run()
return{cfg:cur}
})
r.add('PUT','/api/admin/pars/items/:id',async c=>{
guard(c)
const b=await body(c.req,2000)
const it=await c.env.DB.prepare('select * from par_items where id=?').bind(c.p.id).first()
if(!it)fail(404,'Item not found')
const price=b.price===undefined?it.price:Math.round(Number(b.price))
if(!Number.isFinite(price)||price<0||price>100000)fail(400,'Price must be between 0 and 100000')
const en=b.enabled===undefined?it.enabled:b.enabled?1:0
await c.env.DB.prepare('update par_items set price=?,enabled=? where id=?').bind(price,en,it.id).run()
return{ok:true}
})
r.add('POST','/api/admin/pars/grant',async c=>{
guard(c)
limit('parad:'+c.user.id,60,60000)
const b=await body(c.req,1000)
const n=Math.round(Number(b.amount))
if(!Number.isFinite(n)||n===0||Math.abs(n)>100000)fail(400,'Amount must be a non-zero number up to 100000')
const u=await findUser(c.env,b.user)
const note=typeof b.note==='string'?b.note.slice(0,80):''
await grant(c.env,u.id,n,'bonus',null,(n>0?'Bonus':'Adjustment')+(note?': '+note:''))
await c.env.DB.prepare('insert into mod_log(id,server_id,actor_id,action,target_id,detail,created_at) values(?,?,?,?,?,?,?)').bind(newId('ml'),null,c.user.id,'pars.grant',u.id,n+' '+note,now()).run()
c.pub?.('u_'+u.id,{t:'pars.gift',from:'Parley',amount:n})
return{ok:true,balance:await bal(c.env,u.id)}
})
}
