export const skeleton=n=>String(n).toLowerCase().replace(/[._-]/g,'').replace(/0/g,'o').replace(/[1i]/g,'l').replace(/5/g,'s').replace(/3/g,'e').replace(/4/g,'a').replace(/7/g,'t').replace(/8/g,'b')
const RESERVED=new Set(['admin','administrator','system','parley','support','moderator','mod','staff','root','everyone','here','owner','official','security','help','abuse','null','undefined','anonymous','unknown','deleted','webhook','bot','discord'])
export function nameProblem(env,name,{bot=false}={}){
const sk=skeleton(name)
const admins=(env.ADMIN_USERNAMES||'').toLowerCase().split(',').map(s=>s.trim()).filter(Boolean)
if(admins.includes(name.toLowerCase()))return null
if(RESERVED.has(sk))return'That username is reserved'
if(!bot&&/^(deleted|wh|bot)[_-]/i.test(name))return'That username is reserved'
return null
}
export async function claimOwner(env,name){
return env.DB.prepare('select user_id from username_claims where norm=?').bind(skeleton(name)).first()
}
export function claimStmt(env,userId,name,t){
return env.DB.prepare('insert into username_claims(norm,user_id,name,created_at) values(?,?,?,?) on conflict(norm) do update set created_at=excluded.created_at,name=excluded.name where username_claims.user_id=excluded.user_id').bind(skeleton(name),userId,name,t)
}
export function trimStmt(env,userId){
return env.DB.prepare('delete from username_claims where user_id=? and norm not in (select norm from username_claims where user_id=? order by created_at desc limit 6)').bind(userId,userId)
}
