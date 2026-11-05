import{fail,now,randHex,limit,body}from'./util.js'
import{grant}from'./pars.js'
const get=async(env,k)=>{const r=await env.DB.prepare('select v from app_settings where k=?').bind(k).first();try{return r?JSON.parse(r.v):null}catch{return null}}
const put=(env,k,o)=>env.DB.prepare('insert into app_settings(k,v) values(?,?) on conflict(k) do update set v=excluded.v').bind(k,JSON.stringify(o)).run()
const day=()=>Math.floor(now()/86400000)
const on=()=>{const t=now();return t>=Date.UTC(2026,10,1)&&t<Date.UTC(2026,11,6)}
export default function(r){
r.add('POST','/api/turkey/roll',async c=>{
limit('tk:roll:'+c.user.id,6,60000)
if(!on()||c.user.is_bot)return{spawn:false}
const k='tk:'+c.user.id
const s=(await get(c.env,k))||{}
const d=day()
if(s.last&&now()-s.last<105000)return{spawn:false}
const n=s.day===d?s.n||0:0
const o={last:now(),day:d,n,tok:null,at:0,exp:0,amt:0}
if(n>=5||crypto.getRandomValues(new Uint32Array(1))[0]/4294967296>=.035){await put(c.env,k,o);return{spawn:false}}
o.tok=randHex(16);o.at=now();o.exp=now()+22000;o.amt=3+Math.floor(crypto.getRandomValues(new Uint32Array(1))[0]/4294967296*6)
await put(c.env,k,o)
return{spawn:true,tok:o.tok,ms:o.exp-now()-2000}
})
r.add('POST','/api/turkey/catch',async c=>{
limit('tk:catch:'+c.user.id,10,60000)
const b=await body(c.req,512)
const k='tk:'+c.user.id
const s=await get(c.env,k)
if(!s||!s.tok||typeof b.tok!=='string'||b.tok!==s.tok)fail(400,'That turkey got away')
if(now()>s.exp)fail(400,'That turkey got away')
if(now()-s.at<1200)fail(400,'That turkey got away')
const amt=s.amt
await put(c.env,k,{...s,tok:null,n:(s.n||0)+1})
await grant(c.env,c.user.id,amt,'turkey','turkey','Caught a turkey')
return{earned:amt,left:Math.max(0,5-((s.n||0)+1))}
})
}
