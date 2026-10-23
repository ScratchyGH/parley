import{fail,now,newId,body,limit}from'./util.js'
import{seasonWindow}from'./seasons.js'
const SEASON='hollow'
const DAY=864e5
const GRACE=DAY
const GIFT_COST=40
const GIFT_POOL=['bd_spook2','ti_spook','nf_spook','ef_spook2','fr_spook']
const TRICKS=['A rubber spider that squeaks','A bag of suspiciously quiet candy','A tape labelled DO NOT PLAY','A very polite ghost','A fog machine with no off switch','One (1) cursed paperclip']
let cache=null,cacheAt=0
const win=()=>seasonWindow(SEASON)
const live=()=>{const w=win();return!!(w&&w.live)}
const claimable=()=>{const w=win();return!!(w&&(w.live||now()<w.end+GRACE))}
async function quests(env){
if(cache&&now()-cacheAt<60000)return cache
cache=(await env.DB.prepare('select * from event_quests where season=? and enabled=1 order by case kind when ? then 0 when ? then 1 else 2 end,seq,id').bind(SEASON,'night','daily').all()).results
cacheAt=now()
return cache
}
const dayNum=()=>Math.floor(now()/DAY)
const wallet=(env,uid)=>env.DB.prepare('insert or ignore into event_wallet(user_id,season,updated_at) values(?,?,?)').bind(uid,SEASON,now()).run()
const addWallet=(env,uid,candy,xp)=>env.DB.prepare('update event_wallet set candy=candy+?,xp=xp+?,updated_at=? where user_id=? and season=?').bind(candy,xp,now(),uid,SEASON)
export async function bump(c,uid,metric,n=1){
try{
if(!live())return
const qs=(await quests(c.env)).filter(q=>q.metric===metric)
if(!qs.length)return
const day=dayNum(),t=now()
await c.env.DB.batch(qs.map(q=>c.env.DB.prepare('insert into event_progress(user_id,quest_id,day,n,updated_at) values(?,?,?,min(?,?),?) on conflict(user_id,quest_id,day) do update set n=min(n+?,?),updated_at=excluded.updated_at').bind(uid,q.id,q.kind==='daily'?day:0,n,q.target,t,n,q.target)))
}catch{}
}
export const hollowBump=(c,uid,metric,n)=>{
try{c.ec.waitUntil(bump(c,uid,metric,n))}catch{}
}
async function grant(env,uid,itemId,src){
const it=await env.DB.prepare('select kind,name from par_items where id=?').bind(itemId).first()
if(!it)return{candy:50,duplicate:true}
const have=await env.DB.prepare('select 1 x from par_owned where user_id=? and item_id=?').bind(uid,itemId).first()
if(have)return{candy:50,duplicate:true,item:{id:itemId,kind:it.kind,name:it.name}}
await env.DB.prepare('insert into par_owned(id,user_id,item_id,gift_from,created_at) values(?,?,?,?,?)').bind(newId('po'),uid,itemId,src,now()).run()
return{candy:0,item:{id:itemId,kind:it.kind,name:it.name}}
}
const roll=n=>{const b=crypto.getRandomValues(new Uint32Array(1))[0];return b%n}
async function awardBoard(env,uid){
const w=win()
if(!w||now()<w.end)return
const key=SEASON+':lb'
const res=await env.DB.prepare('insert or ignore into event_claims(user_id,key,created_at) values(?,?,?)').bind(uid,key,now()).run()
if(!res.meta.changes)return
const me=await env.DB.prepare('select xp from event_wallet where user_id=? and season=?').bind(uid,SEASON).first()
if(!me||!me.xp)return
const rank=1+(await env.DB.prepare('select count(*) n from event_wallet where season=? and (xp>? or (xp=? and updated_at<(select updated_at from event_wallet where user_id=? and season=?)))').bind(SEASON,me.xp,me.xp,uid,SEASON).first()).n
if(rank<=3)await grant(env,uid,'fr_grave_legend','event:hollow')
if(rank<=10)await grant(env,uid,'ti_grave_shift_legend','event:hollow')
}
export default function(r){
r.add('GET','/api/events/halloween',async c=>{
const uid=c.user.id,env=c.env,w=win()
if(!w)fail(404,'No event')
await wallet(env,uid)
if(now()>=w.end)c.ec.waitUntil(awardBoard(env,uid).catch(()=>{}))
const day=dayNum()
const[qs,prog,claims,wal,tiers,pk,finds,sent]=await Promise.all([
quests(env),
env.DB.prepare('select quest_id,day,n from event_progress where user_id=? and (day=0 or day=?)').bind(uid,day).all(),
env.DB.prepare("select key from event_claims where user_id=? and key like 'hollow:%'").bind(uid).all(),
env.DB.prepare('select candy,xp,night_max from event_wallet where user_id=? and season=?').bind(uid,SEASON).first(),
env.DB.prepare('select t.tier,t.xp_needed,t.candy,t.item_id,i.kind,i.name from event_tiers t left join par_items i on i.id=t.item_id where t.season=? order by t.tier').bind(SEASON).all(),
env.DB.prepare('select id,slot from event_pumpkins where season=?').bind(SEASON).all(),
env.DB.prepare('select pumpkin_id from event_finds where user_id=?').bind(uid).all(),
env.DB.prepare('select count(*) n from event_gifts where from_user=? and created_at>?').bind(uid,now()-DAY).first()
])
const ck=new Set(claims.results.map(x=>x.key))
const pr={}
for(const p of prog.results)pr[p.quest_id]=p.n
const nightIds=qs.filter(q=>q.kind==='night').map(q=>q.id)
const out=qs.map(q=>{
const key=q.kind==='daily'?`hollow:q:${q.id}:${day}`:`hollow:q:${q.id}`
const i=nightIds.indexOf(q.id)
return{id:q.id,kind:q.kind,seq:q.seq,title:q.title,descr:q.descr,metric:q.metric,target:q.target,n:Math.min(pr[q.id]||0,q.target),candy:q.candy,xp:q.xp,claimed:ck.has(key),locked:q.kind==='night'&&i>0&&!ck.has(`hollow:q:${nightIds[i-1]}`)}
})
const found=new Set(finds.results.map(x=>x.pumpkin_id))
const xp=wal.xp
const rank=1+(await env.DB.prepare('select count(*) n from event_wallet where season=? and xp>?').bind(SEASON,xp).first()).n
return{
season:{key:SEASON,name:'Haunted Hollow',start:w.start,end:w.end,live:w.live,grace:!w.live&&claimable()},
wallet:{candy:wal.candy,xp,tier:Math.min(24,Math.floor(xp/100)),night_max:wal.night_max},
quests:out,
daily_resets_at:(day+1)*DAY,
tiers:tiers.results.map(t=>({tier:t.tier,xp:t.xp_needed,candy:t.candy,item:t.item_id?{id:t.item_id,kind:t.kind,name:t.name}:null,claimed:ck.has(`hollow:t:${t.tier}`)})),
pumpkins:{found:found.size,total:pk.results.length,open:pk.results.filter(p=>!found.has(p.id)).map(p=>({id:p.id,slot:p.slot}))},
gifts:{cost:GIFT_COST,sent_today:sent.n,max_per_day:5},
me:{rank,id:uid}
}
})
async function claimTo(c,key,candy,xp,itemId){
const res=await c.env.DB.prepare('insert or ignore into event_claims(user_id,key,created_at) values(?,?,?)').bind(c.user.id,key,now()).run()
if(!res.meta.changes)return{ok:true,duplicate:true}
let g=null,extra=0
if(itemId){g=await grant(c.env,c.user.id,itemId,'event:hollow');extra=g.candy||0}
await addWallet(c.env,c.user.id,candy+extra,xp).run()
return{ok:true,candy:candy+extra,xp,item:g?.item||null,duplicate:!!g?.duplicate}
}
r.add('POST','/api/events/halloween/claim',async c=>{
if(!claimable())fail(409,'The event is over')
limit('hw:claim:'+c.user.id,60,60000)
const b=await body(c.req,300)
await wallet(c.env,c.user.id)
if(b.kind==='quest'){
const q=(await quests(c.env)).find(x=>x.id===String(b.id))
if(!q)fail(404,'No such quest')
const day=dayNum()
const p=await c.env.DB.prepare('select n from event_progress where user_id=? and quest_id=? and day=?').bind(c.user.id,q.id,q.kind==='daily'?day:0).first()
if(!p||p.n<q.target)fail(409,'Not finished yet')
if(q.kind==='night'&&q.seq>1){
const prev=(await quests(c.env)).find(x=>x.kind==='night'&&x.seq===q.seq-1)
if(prev&&!(await c.env.DB.prepare('select 1 x from event_claims where user_id=? and key=?').bind(c.user.id,`hollow:q:${prev.id}`).first()))fail(409,'Claim the previous night first')
}
const out=await claimTo(c,q.kind==='daily'?`hollow:q:${q.id}:${day}`:`hollow:q:${q.id}`,q.candy,q.xp,null)
if(q.kind==='daily'&&!out.duplicate)await bump(c,c.user.id,'daily_done',1)
return out
}
if(b.kind==='tier'){
const t=await c.env.DB.prepare('select * from event_tiers where season=? and tier=?').bind(SEASON,Number(b.id)|0).first()
if(!t)fail(404,'No such tier')
const wal=await c.env.DB.prepare('select xp from event_wallet where user_id=? and season=?').bind(c.user.id,SEASON).first()
if(wal.xp<t.xp_needed)fail(409,'Not enough XP')
return claimTo(c,`hollow:t:${t.tier}`,t.candy,0,t.item_id)
}
fail(400,'Invalid claim')
})
r.add('POST','/api/events/halloween/claim-all',async c=>{
if(!claimable())fail(409,'The event is over')
limit('hw:claimall:'+c.user.id,10,60000)
await wallet(c.env,c.user.id)
const wal=await c.env.DB.prepare('select xp from event_wallet where user_id=? and season=?').bind(c.user.id,SEASON).first()
const ts=(await c.env.DB.prepare('select * from event_tiers where season=? and xp_needed<=? order by tier').bind(SEASON,wal.xp).all()).results
const got=[]
let candy=0
for(const t of ts){
const o=await claimTo(c,`hollow:t:${t.tier}`,t.candy,0,t.item_id)
if(!o.duplicate){candy+=o.candy||0;if(o.item)got.push(o.item)}
}
return{ok:true,candy,items:got}
})
r.add('POST','/api/events/halloween/pumpkin',async c=>{
if(!live())fail(409,'The event is over')
limit('hw:pk:'+c.user.id,40,60000)
const b=await body(c.req,200)
const p=await c.env.DB.prepare('select id from event_pumpkins where id=? and season=?').bind(String(b.id||''),SEASON).first()
if(!p)fail(404,'No such pumpkin')
await wallet(c.env,c.user.id)
const res=await c.env.DB.prepare('insert or ignore into event_finds(user_id,pumpkin_id,found_at) values(?,?,?)').bind(c.user.id,p.id,now()).run()
if(res.meta.changes){
await addWallet(c.env,c.user.id,10,10).run()
await bump(c,c.user.id,'pumpkin',1)
}
const n=(await c.env.DB.prepare('select count(*) n from event_finds where user_id=?').bind(c.user.id).first()).n
return{ok:true,new:!!res.meta.changes,found:n}
})
r.add('GET','/api/events/halloween/leaderboard',async c=>{
const rows=(await c.env.DB.prepare('select w.user_id,w.xp,w.candy,u.username,u.display_name,u.avatar_id,u.accent,u.frame from event_wallet w join users u on u.id=w.user_id where w.season=? and w.xp>0 order by w.xp desc,w.updated_at asc limit 25').bind(SEASON).all()).results
return{rows:rows.map((x,i)=>({rank:i+1,id:x.user_id,username:x.username,display_name:x.display_name,avatar_id:x.avatar_id,accent:x.accent,frame:x.frame,xp:x.xp,me:x.user_id===c.user.id}))}
})
r.add('POST','/api/events/halloween/gift',async c=>{
if(!live())fail(409,'The event is over')
limit('hw:gift:'+c.user.id,20,60000)
const b=await body(c.req,300)
const to=await c.env.DB.prepare('select id,username from users where username=? collate nocase').bind(String(b.to||'').trim().replace(/^@/,'')).first()
if(!to)fail(404,'No user with that name')
if(to.id===c.user.id)fail(400,'Send it to someone else')
const sent=(await c.env.DB.prepare('select count(*) n from event_gifts where from_user=? and created_at>?').bind(c.user.id,now()-DAY).first()).n
if(sent>=5)fail(429,'You can send 5 pumpkins a day')
const pair=await c.env.DB.prepare('select 1 x from event_gifts where from_user=? and to_user=? and created_at>?').bind(c.user.id,to.id,now()-DAY).first()
if(pair)fail(429,'You already sent them one today')
await wallet(c.env,c.user.id)
const d=await c.env.DB.prepare('update event_wallet set candy=candy-?,updated_at=? where user_id=? and season=? and candy>=?').bind(GIFT_COST,now(),c.user.id,SEASON,GIFT_COST).run()
if(!d.meta.changes)fail(402,'Not enough candy')
await wallet(c.env,to.id)
let kind='candy',itemId=null,label,amount=0
const trick=roll(100)<30
if(trick){amount=25;label='Trick! '+TRICKS[roll(TRICKS.length)]+' and 25 candy'}
else{
const rare=roll(100)===0
const pool=rare?['fr_hollow_king']:GIFT_POOL
const own=new Set((await c.env.DB.prepare(`select item_id from par_owned where user_id=? and item_id in (${pool.map(()=>'?').join(',')})`).bind(to.id,...pool).all()).results.map(x=>x.item_id))
const left=pool.filter(x=>!own.has(x))
if(left.length){
itemId=left[roll(left.length)]
const it=await c.env.DB.prepare('select kind,name from par_items where id=?').bind(itemId).first()
await c.env.DB.prepare('insert into par_owned(id,user_id,item_id,gift_from,created_at) values(?,?,?,?,?)').bind(newId('po'),to.id,itemId,'event:hollow',now()).run()
kind=it.kind;label=it.name
}else{amount=60;label='Treat! 60 candy'}
}
if(amount)await addWallet(c.env,to.id,amount,0).run()
await c.env.DB.batch([
c.env.DB.prepare('insert into gift_inbox(id,user_id,from_name,kind,item_id,label,amount,created_at) values(?,?,?,?,?,?,?,?)').bind(newId('gf'),to.id,c.user.display_name,kind,itemId,label,amount,now()),
c.env.DB.prepare('insert into event_gifts(id,season,from_user,to_user,created_at) values(?,?,?,?,?)').bind(newId('eg'),SEASON,c.user.id,to.id,now())
])
await bump(c,c.user.id,'gift_send',1)
c.pub('u_'+to.id,{t:'pars.gift'})
return{ok:true,to:to.username,trick}
})
r.add('POST','/api/events/halloween/night/start',async c=>{
if(!live())fail(409,'The event is over')
limit('hw:nstart:'+c.user.id,30,60000)
const b=await body(c.req,200)
const night=Number(b.night)|0
await wallet(c.env,c.user.id)
const wal=await c.env.DB.prepare('select night_max from event_wallet where user_id=? and season=?').bind(c.user.id,SEASON).first()
if(night<1||night>5||night>wal.night_max)fail(409,'That night is locked')
const id=newId('nr')
await c.env.DB.prepare('insert into event_night_runs(id,user_id,night,started_at) values(?,?,?,?)').bind(id,c.user.id,night,now()).run()
return{run:id}
})
r.add('POST','/api/events/halloween/night/finish',async c=>{
if(!live())fail(409,'The event is over')
limit('hw:nfin:'+c.user.id,30,60000)
const b=await body(c.req,200)
const run=await c.env.DB.prepare('select * from event_night_runs where id=? and user_id=?').bind(String(b.run||''),c.user.id).first()
if(!run||run.finished_at)fail(404,'No such run')
const ok=b.ok===true&&now()-run.started_at>=55000
await c.env.DB.prepare('update event_night_runs set finished_at=?,ok=? where id=?').bind(now(),ok?1:0,run.id).run()
let candy=0,max=null
if(ok){
candy=30*run.night
const wal=await c.env.DB.prepare('select night_max from event_wallet where user_id=? and season=?').bind(c.user.id,SEASON).first()
max=wal.night_max
if(run.night===max&&max<5)max++
await c.env.DB.prepare('update event_wallet set candy=candy+?,xp=xp+?,night_max=?,updated_at=? where user_id=? and season=?').bind(candy,run.night*10,max,now(),c.user.id,SEASON).run()
await bump(c,c.user.id,'night_win',1)
}
return{ok,candy,night_max:max}
})
r.add('POST','/api/events/halloween/rush/start',async c=>{
if(!live())fail(409,'The event is over')
limit('hw:rstart:'+c.user.id,30,60000)
await wallet(c.env,c.user.id)
const id=newId('nr')
await c.env.DB.prepare('insert into event_night_runs(id,user_id,night,started_at) values(?,?,0,?)').bind(id,c.user.id,now()).run()
return{run:id}
})
r.add('POST','/api/events/halloween/rush/finish',async c=>{
if(!live())fail(409,'The event is over')
limit('hw:rfin:'+c.user.id,30,60000)
const b=await body(c.req,300)
const run=await c.env.DB.prepare('select * from event_night_runs where id=? and user_id=? and night=0').bind(String(b.run||''),c.user.id).first()
if(!run||run.finished_at)fail(404,'No such run')
const el=Math.floor((now()-run.started_at)/1000)
const secs=Math.max(0,Math.min(Number(b.secs)|0,el+3,360))
const kills=Math.max(0,Math.min(Number(b.kills)|0,secs*7))
const win=b.ok===true&&secs>=340
const paid=(await c.env.DB.prepare('select count(*) n from event_night_runs where user_id=? and night=0 and ok=1 and finished_at>?').bind(c.user.id,now()-DAY).first()).n
let candy=0
if(secs>=20&&paid<8){
candy=Math.min(150,Math.floor(secs/6)+Math.floor(kills/8)+(win?60:0))
await c.env.DB.prepare('update event_wallet set candy=candy+?,xp=xp+?,updated_at=? where user_id=? and season=?').bind(candy,Math.ceil(candy/3),now(),c.user.id,SEASON).run()
}
await c.env.DB.prepare('update event_night_runs set finished_at=?,ok=? where id=?').bind(now(),candy>0?1:0,run.id).run()
return{ok:win,candy,secs,kills,left:Math.max(0,8-paid-(candy>0?1:0))}
})
}
