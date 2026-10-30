import{fail,now,newId,body,limit}from'./util.js'
import{seasonWindow}from'./seasons.js'
const PACKS={hollow:{name:'Haunted Hollow games',price:25,season:'hollow',desc:'Gourd Rush, Terror Night, Hollow Siege and Gourd Rush: Teamup. Yours to play in the app any time, even after the season ends.'}}
const owned=(env,uid,id)=>env.DB.prepare('select 1 x from game_unlocks where user_id=? and pack=?').bind(uid,id).first()
export default function(r){
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
