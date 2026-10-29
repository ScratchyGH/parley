import{fail,now,newId,body,limit}from'./util.js'
export const PACKS={winter:{name:'Winter games',price:500},spring:{name:'Spring games',price:500},summer:{name:'Summer games',price:500}}
export default function(r){
r.add('GET','/api/games',async c=>{
const o=(await c.env.DB.prepare('select pack from game_unlocks where user_id=?').bind(c.user.id).all()).results.map(x=>x.pack)
const u=await c.env.DB.prepare('select pars from users where id=?').bind(c.user.id).first()
return{unlocked:o,packs:PACKS,balance:u?.pars||0}
})
r.add('POST','/api/games/unlock',async c=>{
limit('gu:'+c.user.id,10,60000)
const b=await body(c.req,500)
const p=PACKS[String(b.pack||'')]
if(!p)fail(404,'Unknown game pack')
if(await c.env.DB.prepare('select 1 x from game_unlocks where user_id=? and pack=?').bind(c.user.id,b.pack).first())return{ok:true,duplicate:true}
const ok=await c.env.DB.prepare('update users set pars=pars-? where id=? and pars>=?').bind(p.price,c.user.id,p.price).run()
if(!ok.meta.changes)fail(402,'You need '+p.price+' Pars to unlock this')
try{
await c.env.DB.batch([
c.env.DB.prepare('insert into game_unlocks(user_id,pack,created_at) values(?,?,?)').bind(c.user.id,b.pack,now()),
c.env.DB.prepare('insert into par_tx(id,user_id,delta,kind,ref,note,created_at) values(?,?,?,?,?,?,?)').bind(newId('pt'),c.user.id,-p.price,'purchase','game:'+b.pack,p.name,now())
])
}catch(e){
await c.env.DB.prepare('update users set pars=pars+? where id=?').bind(p.price,c.user.id).run()
throw e
}
const u=await c.env.DB.prepare('select pars from users where id=?').bind(c.user.id).first()
return{ok:true,balance:u?.pars||0}
})
}
