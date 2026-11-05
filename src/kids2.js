import{fail,now,newId,body,limit}from'./util.js'
import{moderate}from'./kidsmod.js'
const IT=[
['fr_gold','frame','Gold ring',120],['fr_sky','frame','Sky ring',80],['fr_rose','frame','Rose ring',80],['fr_mint','frame','Mint ring',80],['fr_ice','frame','Frost ring',150],['fr_leaf','frame','Leaf ring',150],['fr_fire','frame','Flame ring',220],['fr_rainbow','frame','Rainbow ring',320],
['bg_sun','bg','Sunrise',60],['bg_ocean','bg','Ocean',60],['bg_forest','bg','Forest',60],['bg_candy','bg','Candy',60],['bg_mono','bg','Paper',40],['bg_night','bg','Midnight',100],['bg_aurora','bg','Aurora',160],['bg_lava','bg','Lava',160],
['nc_gold','name','Gold name',90],['nc_sky','name','Sky name',70],['nc_rose','name','Rose name',70],['nc_lime','name','Lime name',70],['nc_violet','name','Violet name',70],['nc_flame','name','Flame name',180]
]
const BY=Object.fromEntries(IT.map(x=>[x[0],{id:x[0],kind:x[1],name:x[2],price:x[3]}]))
const KINDS=['frame','bg','name']
const TG={dash:[400,60],stack:[4,40],match:[10,40],catch:[300,40],forage:[500,60]}
const DAILY=200
const COLORS=['blue','pink','sun','mint','violet','coral']
const SC=v=>v==='verified'?{own:3,mem:25,chan:6}:{own:1,mem:6,chan:3}
const day=()=>new Date().toISOString().slice(0,10)
export default function(r,H){
const{ensure,myChild,parentOf,logp,vet,P}=H
const wal=async(env,id)=>{
await env.DB.prepare('insert or ignore into kp_wallet(child_id) values(?)').bind(id).run()
return env.DB.prepare('select * from kp_wallet where child_id=?').bind(id).first()
}
const eqOf=w=>{try{return JSON.parse(w.eq||'{}')}catch{return{}}}
P('GET','/api/kids/pars',async c=>{
const me=await myChild(c)
limit('kpw:'+me.id,60,60000)
const w=await wal(c.env,me.id)
const o=await c.env.DB.prepare('select item from kp_owned where child_id=?').bind(me.id).all()
return{pars:w.pars,eq:eqOf(w),owned:o.results.map(x=>x.item),items:IT.map(x=>BY[x[0]]),bonus:w.bonus_day!==day(),earned:w.day===day()?w.earned:0,cap:DAILY}
})
P('POST','/api/kids/pars/bonus',async c=>{
const me=await myChild(c)
limit('kpb:'+me.id,10,60000)
await wal(c.env,me.id)
const x=await c.env.DB.prepare('update kp_wallet set pars=pars+15,bonus_day=? where child_id=? and bonus_day!=?').bind(day(),me.id,day()).run()
if(!x.meta.changes)fail(409,'You already got today\'s bonus')
return{ok:true,pars:15}
})
P('POST','/api/kids/games/finish',async c=>{
const me=await myChild(c)
limit('kg:'+me.id,20,60000)
const b=await body(c.req,200)
const g=TG[String(b.game)]
if(!g)fail(404,'No such game')
const score=Math.max(0,Math.min(Number(b.score)||0,100000))
const secs=Math.max(0,Math.min(Number(b.secs)||0,3600))
if(secs<15)return{pars:0}
const raw=Math.max(1,Math.floor(score/g[0]))+Math.floor(secs/g[1])
const w=await wal(c.env,me.id)
const left=Math.max(0,DAILY-(w.day===day()?w.earned:0))
const pars=Math.min(raw,left)
if(pars>0)await c.env.DB.prepare('update kp_wallet set pars=pars+?1,earned=(case when day=?2 then earned else 0 end)+?1,day=?2 where child_id=?3').bind(pars,day(),me.id).run()
return{pars,capped:pars<raw}
})
P('POST','/api/kids/shop/buy',async c=>{
const me=await myChild(c)
limit('kps:'+me.id,20,60000)
const b=await body(c.req,200)
const it=BY[String(b.item)]
if(!it)fail(404,'No such item')
await wal(c.env,me.id)
if(await c.env.DB.prepare('select 1 x from kp_owned where child_id=? and item=?').bind(me.id,it.id).first())fail(409,'You already own this')
const x=await c.env.DB.prepare('update kp_wallet set pars=pars-? where child_id=? and pars>=?').bind(it.price,me.id,it.price).run()
if(!x.meta.changes)fail(402,'You need more Pars')
await c.env.DB.prepare('insert or ignore into kp_owned(child_id,item,at) values(?,?,?)').bind(me.id,it.id,now()).run()
return{ok:true}
})
P('POST','/api/kids/shop/equip',async c=>{
const me=await myChild(c)
limit('kpe:'+me.id,30,60000)
const b=await body(c.req,200)
const k=String(b.kind||'')
if(!KINDS.includes(k))fail(400,'Bad kind')
const w=await wal(c.env,me.id)
const eq=eqOf(w)
if(b.item){
const it=BY[String(b.item)]
if(!it||it.kind!==k)fail(404,'No such item')
if(!await c.env.DB.prepare('select 1 x from kp_owned where child_id=? and item=?').bind(me.id,it.id).first())fail(403,'You do not own this')
eq[k]=it.id
}else delete eq[k]
await c.env.DB.prepare('update kp_wallet set eq=? where child_id=?').bind(JSON.stringify(eq),me.id).run()
return{ok:true,eq}
})
const lim=async(env,me)=>{
const pr=await env.DB.prepare('select id_status from kp_parents where id=?').bind(me.parent_id).first()
return SC(pr&&pr.id_status)
}
const mem=(env,sid,cid)=>env.DB.prepare('select * from kp_smem where server_id=? and child_id=?').bind(sid,cid).first()
const need=async(c,me,sid)=>{
const m=await mem(c.env,sid,me.id)
if(!m||m.status!=='active')fail(404,'No such server')
return m
}
const owner=async(c,me,sid)=>{
const m=await need(c,me,sid)
if(m.role!=='owner')fail(403,'Only the owner can do that')
return m
}
const clean=(v,min,max,what)=>{
const t=String(v||'').replace(/\s+/g,' ').trim()
if(t.length<min||t.length>max)fail(400,what+' needs '+min+' to '+max+' characters')
if(!/^[\p{L}\p{N} ._-]+$/u.test(t))fail(400,what+' uses letters, numbers and spaces')
const v2=moderate(t)
if(!v2.ok)fail(422,'Pick a friendlier '+what.toLowerCase())
return t
}
P('GET','/api/kids/servers',async c=>{
const me=await myChild(c)
limit('kpv2:'+me.id,120,60000)
const rows=await c.env.DB.prepare('select s.id,s.name,s.color,m.role,m.status,(select count(*) from kp_smem where server_id=s.id and status=\'active\') n,(select display_name from kp_children where id=m.inv_by) by_name from kp_smem m join kp_servers s on s.id=m.server_id where m.child_id=?').bind(me.id).all()
return{servers:rows.results,caps:await lim(c.env,me)}
})
P('POST','/api/kids/servers',async c=>{
const me=await myChild(c)
limit('kpc:'+me.id,5,600000)
const b=await body(c.req,300)
const name=clean(b.name,2,24,'Server name')
const color=COLORS.includes(b.color)?b.color:'blue'
const cap=await lim(c.env,me)
const n=await c.env.DB.prepare('select count(*) n from kp_smem where child_id=? and role=\'owner\'').bind(me.id).first()
if(n.n>=cap.own)fail(403,'You can own '+cap.own+' server'+(cap.own>1?'s':'')+'. Ask your parent about the ID check for more.')
const id=newId('sv'),cid=newId('ch'),t=now()
await c.env.DB.batch([
c.env.DB.prepare('insert into kp_servers(id,owner,name,color,created_at) values(?,?,?,?,?)').bind(id,me.id,name,color,t),
c.env.DB.prepare('insert into kp_smem(server_id,child_id,role,status,at) values(?,?,\'owner\',\'active\',?)').bind(id,me.id,t),
c.env.DB.prepare('insert into kp_chan(id,server_id,name,at) values(?,?,\'general\',?)').bind(cid,id,t),
logp(c.env,me.parent_id,'server',me.display_name+' made a server called '+name)
])
return{ok:true,id}
})
P('GET','/api/kids/servers/:id',async c=>{
const me=await myChild(c)
limit('kpv3:'+me.id,120,60000)
const m=await need(c,me,c.p.id)
const sv=await c.env.DB.prepare('select id,name,color,owner from kp_servers where id=?').bind(c.p.id).first()
if(!sv)fail(404,'No such server')
const ch=await c.env.DB.prepare('select id,name from kp_chan where server_id=? order by at').bind(sv.id).all()
const ms=await c.env.DB.prepare('select m.child_id id,m.role,m.status,k.display_name,k.avatar,k.last_seen,w.eq from kp_smem m join kp_children k on k.id=m.child_id left join kp_wallet w on w.child_id=k.id where m.server_id=? and (m.status=\'active\' or (?=\'owner\' and m.status in(\'invited\',\'review\')))').bind(sv.id,m.role).all()
const t=now()
return{server:sv,role:m.role,channels:ch.results,members:ms.results.map(x=>({id:x.id,role:x.role,status:x.status,display_name:x.display_name,avatar:x.avatar,online:x.last_seen>t-90000,eq:x.eq||'{}'})),caps:await lim(c.env,me)}
})
P('POST','/api/kids/servers/:id/channels',async c=>{
const me=await myChild(c)
limit('kpch:'+me.id,10,600000)
await owner(c,me,c.p.id)
const b=await body(c.req,200)
const name=clean(b.name,2,16,'Channel name').toLowerCase().replace(/ /g,'-')
const cap=await lim(c.env,me)
const n=await c.env.DB.prepare('select count(*) n from kp_chan where server_id=?').bind(c.p.id).first()
if(n.n>=cap.chan)fail(403,'This server has the most channels allowed')
await c.env.DB.prepare('insert into kp_chan(id,server_id,name,at) values(?,?,?,?)').bind(newId('ch'),c.p.id,name,now()).run()
return{ok:true}
})
P('POST','/api/kids/servers/:id/invite',async c=>{
const me=await myChild(c)
limit('kpiv:'+me.id,20,600000)
await owner(c,me,c.p.id)
const b=await body(c.req,200)
const x=String(b.child||'')
const f=await c.env.DB.prepare('select 1 y from kp_friends where status=\'active\' and ((a=?1 and b=?2) or (a=?2 and b=?1))').bind(me.id,x).first()
if(!f)fail(403,'You can only invite your friends')
if(await mem(c.env,c.p.id,x))fail(409,'Already invited')
const cap=await lim(c.env,me)
const n=await c.env.DB.prepare('select count(*) n from kp_smem where server_id=?').bind(c.p.id).first()
if(n.n>=cap.mem)fail(403,'This server is full. Ask your parent about the ID check for more room.')
await c.env.DB.prepare('insert into kp_smem(server_id,child_id,role,status,inv_by,at) values(?,?,\'member\',\'invited\',?,?)').bind(c.p.id,x,me.id,now()).run()
return{ok:true}
})
P('POST','/api/kids/servers/:id/join',async c=>{
const me=await myChild(c)
limit('kpj:'+me.id,20,600000)
const b=await body(c.req,100)
const m=await mem(c.env,c.p.id,me.id)
if(!m||m.status!=='invited')fail(404,'No invite')
const sv=await c.env.DB.prepare('select name from kp_servers where id=?').bind(c.p.id).first()
if(!b.accept){await c.env.DB.prepare('delete from kp_smem where server_id=? and child_id=?').bind(c.p.id,me.id).run();return{ok:true}}
await c.env.DB.batch([
c.env.DB.prepare('update kp_smem set status=\'review\' where server_id=? and child_id=?').bind(c.p.id,me.id),
logp(c.env,me.parent_id,'server',me.display_name+' wants to join the server '+(sv?sv.name:'')+'. Approve it in Servers.')
])
return{ok:true}
})
P('POST','/api/kids/servers/:id/leave',async c=>{
const me=await myChild(c)
const m=await mem(c.env,c.p.id,me.id)
if(!m)fail(404,'No such server')
if(m.role==='owner'){
await c.env.DB.batch([
c.env.DB.prepare('delete from kp_smsg where chan in(select id from kp_chan where server_id=?)').bind(c.p.id),
c.env.DB.prepare('delete from kp_chan where server_id=?').bind(c.p.id),
c.env.DB.prepare('delete from kp_smem where server_id=?').bind(c.p.id),
c.env.DB.prepare('delete from kp_servers where id=?').bind(c.p.id)
])
}else await c.env.DB.prepare('delete from kp_smem where server_id=? and child_id=?').bind(c.p.id,me.id).run()
return{ok:true}
})
P('POST','/api/kids/servers/:id/kick',async c=>{
const me=await myChild(c)
await owner(c,me,c.p.id)
const b=await body(c.req,100)
if(String(b.child)===me.id)fail(400,'Use Leave instead')
await c.env.DB.prepare('delete from kp_smem where server_id=? and child_id=?').bind(c.p.id,String(b.child||'')).run()
return{ok:true}
})
const chan=async(c,sid,cid)=>{
const ch=await c.env.DB.prepare('select id from kp_chan where id=? and server_id=?').bind(cid,sid).first()
if(!ch)fail(404,'No such channel')
}
P('GET','/api/kids/servers/:id/c/:cid',async c=>{
const me=await myChild(c)
limit('kpg3:'+me.id,120,60000)
await need(c,me,c.p.id)
await chan(c,c.p.id,c.p.cid)
const after=Number(c.url.searchParams.get('after'))||0
const rows=await c.env.DB.prepare('select m.id,m.from_child,m.body,m.at,k.display_name,k.avatar,w.eq from kp_smsg m join kp_children k on k.id=m.from_child left join kp_wallet w on w.child_id=k.id where m.chan=? and m.id>? order by m.id desc limit 60').bind(c.p.cid,after).all()
return{messages:rows.results.reverse().map(m=>({id:m.id,mine:m.from_child===me.id,name:m.display_name,avatar:m.avatar,eq:m.eq||'{}',body:m.body,at:m.at}))}
})
P('POST','/api/kids/servers/:id/c/:cid',async c=>{
const me=await myChild(c)
limit('kpm2:'+me.id,20,60000)
await need(c,me,c.p.id)
await chan(c,c.p.id,c.p.cid)
const b=await body(c.req,800)
const text=String(b.text||'').replace(/\s+/g,' ').trim()
await vet(c,me,text)
await c.env.DB.prepare('insert into kp_smsg(chan,from_child,body,at) values(?,?,?,?)').bind(c.p.cid,me.id,text,now()).run()
return{ok:true}
})
P('POST','/api/kids/servers/:id/report',async c=>{
const me=await myChild(c)
limit('kpr3:'+me.id,10,600000)
await need(c,me,c.p.id)
const b=await body(c.req,200)
const m=await c.env.DB.prepare('select m.* from kp_smsg m join kp_chan h on h.id=m.chan where m.id=? and h.server_id=?').bind(Number(b.msg)||0,c.p.id).first()
if(!m||m.from_child===me.id)fail(404,'No such message')
await c.env.DB.batch([
c.env.DB.prepare('insert into kp_reports(id,reporter,about,msg_id,body,at,src) values(?,?,?,?,?,?,\'s\')').bind(newId('rp'),me.id,m.from_child,m.id,m.body.slice(0,300),now()),
logp(c.env,me.parent_id,'safety',me.display_name+' reported a message in a server')
])
return{ok:true}
})
P('GET','/api/connect/servers',async c=>{
await ensure(c.env)
const p=await parentOf(c)
const rows=await c.env.DB.prepare('select m.server_id sid,m.child_id cid,m.status,m.role,s.name,k.display_name child,(select display_name from kp_children where id=m.inv_by) by_name from kp_smem m join kp_servers s on s.id=m.server_id join kp_children k on k.id=m.child_id where k.parent_id=? and m.status in(\'review\',\'active\') order by m.at desc').bind(p.id).all()
return{servers:rows.results}
})
const mine=async(c,p)=>{
const x=await c.env.DB.prepare('select m.status,k.display_name from kp_smem m join kp_children k on k.id=m.child_id where m.server_id=? and m.child_id=? and k.parent_id=?').bind(c.p.sid,c.p.cid,p.id).first()
if(!x)fail(404,'Nothing to review')
return x
}
P('POST','/api/connect/servers/:sid/:cid/approve',async c=>{
const p=await parentOf(c)
const x=await mine(c,p)
if(x.status!=='review')fail(409,'Already handled')
await c.env.DB.batch([c.env.DB.prepare('update kp_smem set status=\'active\' where server_id=? and child_id=?').bind(c.p.sid,c.p.cid),logp(c.env,p.id,'server','Approved '+x.display_name+' joining a server')])
return{ok:true}
})
P('POST','/api/connect/servers/:sid/:cid/remove',async c=>{
const p=await parentOf(c)
const x=await mine(c,p)
await c.env.DB.batch([c.env.DB.prepare('delete from kp_smem where server_id=? and child_id=? and role!=\'owner\'').bind(c.p.sid,c.p.cid),logp(c.env,p.id,'server',x.display_name+' was removed from a server')])
return{ok:true}
})
}
