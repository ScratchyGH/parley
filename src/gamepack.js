import{fail,now,newId,body,limit}from'./util.js'
import{seasonWindow}from'./seasons.js'
const PACKS={hollow:{name:'Haunted Hollow games',price:25,season:'hollow',desc:'Gourd Rush, Terror Night, Hollow Siege and Gourd Rush: Teamup. Yours to play in the app any time, even after the season ends.'}}
const owned=(env,uid,id)=>env.DB.prepare('select 1 x from game_unlocks where user_id=? and pack=?').bind(uid,id).first()
const TG={dash:[400,6,60],stack:[4,6,40],match:[10,6,40]}
const tgLive=()=>{const d=new Date();return d.getUTCMonth()===10}
export default function(r){
r.add('GET','/api/games/turkey',async c=>{return{live:tgLive()}})
r.add('POST','/api/games/turkey/finish',async c=>{
if(!tgLive())fail(409,'Thanksgiving games are over')
limit('tg:'+c.user.id,20,60000)
const b=await body(c.req,200)
const g=TG[String(b.game)]
if(!g)fail(404,'No such game')
const score=Math.max(0,Math.min(Number(b.score)||0,100000))
const secs=Math.max(0,Number(b.secs)||0)
let pars=0
if(secs>=15)pars=Math.max(1,Math.floor(score/g[0]))+Math.floor(secs/g[2])
if(pars>0){
await c.env.DB.batch([c.env.DB.prepare('update users set pars=pars+? where id=?').bind(pars,c.user.id),c.env.DB.prepare('insert into par_tx(id,user_id,delta,kind,ref,note,created_at) values(?,?,?,?,?,?,?)').bind(newId('pt'),c.user.id,pars,'tgame',String(b.game),'Thanksgiving game',now())])
}
return{pars}
})
r.add('GET','/api/games/packs',async c=>{
const u=await c.env.DB.prepare('select pars from users where id=?').bind(c.user.id).first()
const packs=[]
for(const[id,p]of Object.entries(PACKS)){
const w=seasonWindow(p.season)
packs.push({id,name:p.name,price:p.price,desc:p.desc,owned:!!(await owned(c.env,c.user.id,id)),live:!!(w&&w.live)})
}
return{pars:u?.pars||0,packs}
})
r.add('POST','/api/games/buy',async c=>{
limit('gp:buy:'+c.user.id,10,60000)
const b=await body(c.req,200)
const id=String(b.pack||'')
const p=PACKS[id]
if(!p)fail(404,'No such game pack')
if(await owned(c.env,c.user.id,id))fail(409,'You already own this pack')
const t=now()
await c.env.DB.batch([
c.env.DB.prepare('insert into game_unlocks(user_id,pack,created_at) select ?1,?2,?3 where (select pars from users where id=?1)>=?4').bind(c.user.id,id,t,p.price),
c.env.DB.prepare('update users set pars=pars-?2 where id=?1 and pars>=?2 and exists(select 1 from game_unlocks where user_id=?1 and pack=?3 and created_at=?4)').bind(c.user.id,p.price,id,t),
c.env.DB.prepare('insert into par_tx(id,user_id,delta,kind,ref,note,created_at) select ?1,?2,?3,?4,?5,?6,?7 where exists(select 1 from game_unlocks where user_id=?2 and pack=?5 and created_at=?7)').bind(newId('pt'),c.user.id,-p.price,'game_pack',id,p.name,t)
])
if(!(await owned(c.env,c.user.id,id)))fail(402,'You need '+p.price+' Pars to unlock this pack')
const u=await c.env.DB.prepare('select pars from users where id=?').bind(c.user.id).first()
return{ok:true,pars:u?.pars||0}
})
}
