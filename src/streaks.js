import{now,newId}from'./util.js'
const DAY=86400000
const MILE=[[7,10],[14,20],[30,50],[50,75],[100,150],[200,300],[365,500]]
const hash=s=>{let h=0;const x=String(s||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'');for(let i=0;i<x.length;i++)h=(h*31+x.charCodeAt(i))>>>0;return h.toString(36)}
const dayOf=t=>Math.floor(t/DAY)
export function view(r,me,t=now()){
const d=dayOf(t),alive=d-r.last_day<=1&&r.last_day>0
const done=r.day===d&&r.a_n>=2&&r.b_n>=2
const mine=me===r.a?r.a_n:r.b_n,theirs=me===r.a?r.b_n:r.a_n
return{id:r.id,friend:me===r.a?r.b:r.a,count:alive?r.count:0,best:r.best,done_today:done,at_risk:alive&&r.last_day===d-1&&!done,mine:r.day===d?mine:0,theirs:r.day===d?theirs:0,ends_at:(r.last_day+2)*DAY}
}
export async function touchStreak(c,conv,content){
const text=String(content||'').trim()
if(text.length<3)return
const t=now(),d=dayOf(t),me=c.user.id
const o=await c.env.DB.prepare('select user_id from conv_members where conv_id=? and user_id!=?').bind(conv,me).first()
if(!o)return
const other=o.user_id
const[a,b]=me<other?[me,other]:[other,me]
const ages=(await c.env.DB.prepare('select id,created_at,is_bot from users where id in (?,?)').bind(me,other).all()).results
if(ages.length<2||ages.some(u=>u.is_bot))return
const id=a+':'+b
let r=await c.env.DB.prepare('select * from streaks where id=?').bind(id).first()
if(!r){
await c.env.DB.prepare('insert or ignore into streaks(id,a,b,created_at) values(?,?,?,?)').bind(id,a,b,t).run()
r=await c.env.DB.prepare('select * from streaks where id=?').bind(id).first()
}
if(r.day!==d){r.day=d;r.a_n=0;r.b_n=0}
const side=me===a?'a':'b',h=hash(text)
if(h===r[side+'_h'])return
r[side+'_n']++
r[side+'_h']=h
let bonus=0,hit=null
if(r.a_n>=2&&r.b_n>=2&&r.last_day<d){
r.count=r.last_day===d-1?r.count+1:1
r.last_day=d
r.best=Math.max(r.best,r.count)
hit=r.count
const old=ages.every(u=>t-u.created_at>3*DAY)
if(old)for(const[n,amt]of MILE)if(r.count>=n&&r.claimed<n){r.claimed=n;bonus=amt}
}
const st=[c.env.DB.prepare('update streaks set count=?,best=?,last_day=?,day=?,a_n=?,b_n=?,a_h=?,b_h=?,claimed=? where id=?').bind(r.count,r.best,r.last_day,r.day,r.a_n,r.b_n,r.a_h,r.b_h,r.claimed,id)]
if(bonus)for(const u of[a,b])st.push(c.env.DB.prepare('insert into par_tx(id,user_id,delta,kind,ref,note,created_at) values(?,?,?,?,?,?,?)').bind(newId('pt'),u,bonus,'streak','st'+id+':'+r.claimed,r.claimed+' day streak',t),c.env.DB.prepare('update users set pars=pars+? where id=?').bind(bonus,u))
try{await c.env.DB.batch(st)}catch(e){if(!String(e&&e.message).includes('UNIQUE'))throw e}
if(hit)for(const u of[a,b])c.pub('u_'+u,{t:'streak',conv,count:hit,bonus,friend:u===a?b:a})
else c.pub('u_'+other,{t:'streak.sync',conv})
}
export default function(r){
r.add('GET','/api/streaks',async c=>{
const me=c.user.id
const rows=(await c.env.DB.prepare('select * from streaks where (a=? or b=?) and last_day>=? order by count desc limit 100').bind(me,me,dayOf(now())-1).all()).results
const out=rows.map(x=>view(x,me)).filter(x=>x.count>0||x.mine||x.theirs)
return{streaks:out}
})
}
