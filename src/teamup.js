import{fail,body,limit}from'./util.js'
export default function(r){
r.add('POST','/api/teamup/invite',async c=>{
const b=await body(c.req)
limit('tuinv:'+c.user.id,20,60000)
const code=String(b.code||'').toUpperCase()
if(!/^[A-Z0-9]{6}$/.test(code))fail(400,'That party code is not valid')
const name=String(b.username||'').replace(/^@/,'').trim()
const u=await c.env.DB.prepare('select id,display_name from users where lower(username)=lower(?) and deleted_at is null and is_bot=0').bind(name).first()
if(!u||u.id===c.user.id)fail(404,'No one with that username')
const f=await c.env.DB.prepare("select 1 x from friends where status='accepted' and ((a=?1 and b=?2) or (a=?2 and b=?1))").bind(c.user.id,u.id).first()
if(!f)fail(403,'You can only invite friends')
const blk=await c.env.DB.prepare('select 1 x from blocks where user_id=? and blocked_id=?').bind(u.id,c.user.id).first()
if(!blk)c.pub('u_'+u.id,{t:'tu.invite',code,from:c.user.display_name||c.user.username})
return{ok:true}
})
}
