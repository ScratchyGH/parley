import{fail,now,newId,str,opt,limit,body}from'./util.js'
import{P,loadMember}from'./perms.js'
import{target}from'./servers.js'

export const TYPES=['warn','timeout','kick','ban','unban','note']
export const STATES=['open','appealed','resolved','overturned']

export function caseStmt(c,sid,uid,type,reason,evidence=''){
const t=now()
return c.env.DB.prepare('insert into mod_cases(id,server_id,num,user_id,mod_id,type,reason,evidence,status,created_at,updated_at) values(?,?,(select coalesce(max(num),0)+1 from mod_cases where server_id=?),?,?,?,?,?,?,?,?)').bind(newId('mc'),sid,sid,uid,c.user.id,type,String(reason||'').slice(0,500),String(evidence||'').slice(0,2000),'open',t,t)
}

async function mod(c,sid){
const m=await loadMember(c.env,sid,c.user.id)
if(!m)fail(404,'Server not found')
if(!(m.base&P.MODERATE))fail(403,'You need the Moderate Members permission')
return m
}

export default function(r){
r.add('POST','/api/servers/:sid/members/:uid/warn',async c=>{
limit('warn:'+c.user.id,60,3600000)
const m=await mod(c,c.p.sid)
if(c.p.uid===c.user.id)fail(400,'You cannot warn yourself')
await target(c,m.server.id,c.p.uid,m)
const b=await body(c.req)
const reason=str(b.reason,2,500,'Reason')
let evidence=''
if(b.message_id){
const row=await c.env.DB.prepare('select m.content,m.author_id,m.created_at,ch.name from messages m join channels ch on ch.id=m.room where m.id=? and ch.server_id=?').bind(String(b.message_id),m.server.id).first()
if(!row||row.author_id!==c.p.uid)fail(400,'That message is not from this member in this server')
evidence=`#${row.name} at ${new Date(row.created_at).toISOString()}: ${row.content}`.slice(0,1000)
}
await c.env.DB.batch([caseStmt(c,m.server.id,c.p.uid,'warn',reason,evidence),c.logStmt(m.server.id,'member.warn',c.p.uid,reason)])
c.pub('u_'+c.p.uid,{t:'notice',text:`You received a warning in ${m.server.name}: ${reason}`})
const row=await c.env.DB.prepare('select num from mod_cases where server_id=? order by num desc limit 1').bind(m.server.id).first()
return{ok:true,num:row.num}
})

r.add('POST','/api/servers/:sid/cases',async c=>{
limit('note:'+c.user.id,60,3600000)
const m=await mod(c,c.p.sid)
const b=await body(c.req)
const uid=String(b.user_id||'')
if(!await c.env.DB.prepare('select 1 x from users where id=?').bind(uid).first())fail(404,'User not found')
await c.env.DB.batch([caseStmt(c,m.server.id,uid,'note',str(b.reason,2,500,'Note'),opt(b.evidence,2000,'Evidence'))])
return{ok:true}
})

r.add('GET','/api/servers/:sid/cases',async c=>{
const m=await mod(c,c.p.sid)
const q=c.url.searchParams
const args=[m.server.id]
let where='c.server_id=?'
if(q.get('user')){where+=' and c.user_id=?';args.push(q.get('user'))}
if(TYPES.includes(q.get('type'))){where+=' and c.type=?';args.push(q.get('type'))}
if(STATES.includes(q.get('status'))){where+=' and c.status=?';args.push(q.get('status'))}
const before=parseInt(q.get('before'),10)
if(before>0){where+=' and c.num<?';args.push(before)}
const rows=(await c.env.DB.prepare(`select c.num,c.type,c.reason,c.evidence,c.status,c.created_at,c.updated_at,c.user_id,u.username,u.display_name,c.mod_id,mu.username mod_name from mod_cases c left join users u on u.id=c.user_id left join users mu on mu.id=c.mod_id where ${where} order by c.num desc limit 50`).bind(...args).all()).results
return{cases:rows,next:rows.length===50?rows[rows.length-1].num:null}
})

r.add('PATCH','/api/servers/:sid/cases/:num',async c=>{
const m=await mod(c,c.p.sid)
const b=await body(c.req)
const row=await c.env.DB.prepare('select num,user_id from mod_cases where server_id=? and num=?').bind(m.server.id,parseInt(c.p.num,10)).first()
if(!row)fail(404,'Case not found')
const sets=['updated_at=?'],vals=[now()]
if('reason'in b){sets.push('reason=?');vals.push(str(b.reason,2,500,'Reason'))}
if('evidence'in b){sets.push('evidence=?');vals.push(opt(b.evidence,2000,'Evidence'))}
if('status'in b){if(!STATES.includes(b.status))fail(400,'Invalid status');sets.push('status=?');vals.push(b.status)}
if(sets.length===1)fail(400,'Nothing to change')
await c.env.DB.batch([c.env.DB.prepare(`update mod_cases set ${sets.join(',')} where server_id=? and num=?`).bind(...vals,m.server.id,row.num),c.logStmt(m.server.id,'case.update',row.user_id,`case ${row.num}: ${Object.keys(b).join(',')}`)])
return{ok:true}
})

r.add('DELETE','/api/servers/:sid/cases/:num',async c=>{
const m=await loadMember(c.env,c.p.sid,c.user.id)
if(!m)fail(404,'Server not found')
if(!(m.owner||m.admin))fail(403,'Only the owner or an administrator can delete a case')
const n=parseInt(c.p.num,10)
await c.env.DB.batch([c.env.DB.prepare('delete from mod_cases where server_id=? and num=?').bind(m.server.id,n),c.logStmt(m.server.id,'case.delete',m.server.id,'case '+n)])
return{ok:true}
})
}
