import{fail,body}from'./util.js'
const h=s=>{let x=0;for(let i=0;i<s.length;i++)x=(x*31+s.charCodeAt(i))>>>0;return x}
const get=async(env,k)=>{const r=await env.DB.prepare('select v from app_settings where k=?').bind(k).first();try{return r?JSON.parse(r.v):null}catch{return null}}
export default function(r){
r.add('GET','/api/ab/me',async c=>({ab:await get(c.env,'ab:'+c.user.id)||{on:false,avatar_id:null}}))
r.add('PUT','/api/ab/me',async c=>{
const b=await body(c.req,1024)
let avatar_id=null
if(b.avatar_id){
const f=await c.env.DB.prepare("select id from files where id=? and owner_id=? and kind='avatar'").bind(String(b.avatar_id),c.user.id).first()
if(!f)fail(400,'Upload that picture as an avatar first')
avatar_id=f.id
}
const o={on:!!b.on&&!!avatar_id,avatar_id}
await c.env.DB.prepare('insert into app_settings(k,v) values(?,?) on conflict(k) do update set v=excluded.v').bind('ab:'+c.user.id,JSON.stringify(o)).run()
return{ab:o}
})
r.add('GET','/api/ab',async c=>{
const rows=(await c.env.DB.prepare("select k,v from app_settings where k>='ab:' and k<'ab;' limit 500").all()).results
const m={}
for(const x of rows){
const uid=x.k.slice(3)
if(uid===c.user.id)continue
let o;try{o=JSON.parse(x.v)}catch{continue}
if(o&&o.on&&o.avatar_id&&h(c.user.id+uid)%2===1)m[uid]=o.avatar_id
}
return{map:m}
})
}
