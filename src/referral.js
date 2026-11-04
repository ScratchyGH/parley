import{fail,now,randHex,sha,body,limit}from'./util.js'
import{grant}from'./pars.js'
import{deviceOf}from'./devices.js'
const ipOf=c=>c.req.headers.get('cf-connecting-ip')||'local'
const get=async(env,k)=>{const r=await env.DB.prepare('select v from app_settings where k=?').bind(k).first();try{return r?JSON.parse(r.v):null}catch{return null}}
const put=(env,k,o)=>env.DB.prepare('insert into app_settings(k,v) values(?,?) on conflict(k) do update set v=excluded.v').bind(k,JSON.stringify(o)).run()
const MAX=5,PARS=50
export async function redeemReferral(c,code,newId){
if(!/^[a-f0-9]{12}$/.test(String(code||'')))return
const r=await get(c.env,'ref:'+code)
if(!r||r.u===newId)return
const own=await get(c.env,'refu:'+r.u)
if(!own||own.code!==code||own.done>=MAX)return
const ih=await sha('ip:'+ipOf(c)),dh=deviceOf(c.req)
const devs=(await c.env.DB.prepare('select hash from user_devices where user_id=?').bind(r.u).all()).results.map(x=>x.hash)
if((r.ih||[]).includes(ih)||(dh&&devs.includes(dh)))return
await c.env.DB.prepare('delete from app_settings where k=?').bind('ref:'+code).run()
own.done++
own.code=''
await put(c.env,'refu:'+r.u,own)
await grant(c.env,r.u,PARS,'referral',newId,'Referral reward')
c.pub?.('u_'+r.u,{t:'pars.gift',from:'Parley',amount:PARS})
}
export default function(r){
r.add('GET','/api/referral',async c=>{
limit('refg:'+c.user.id,30,60000)
let own=await get(c.env,'refu:'+c.user.id)||{code:'',done:0}
const ih=await sha('ip:'+ipOf(c))
if(own.done<MAX){
if(!own.code){own.code=randHex(6);await put(c.env,'refu:'+c.user.id,own)}
await put(c.env,'ref:'+own.code,{u:c.user.id,ih:[ih]})
}
return{code:own.code,done:own.done,max:MAX,pars:PARS}
})
}
