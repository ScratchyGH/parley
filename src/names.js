export const skeleton=n=>String(n).toLowerCase().replace(/[._-]/g,'').replace(/0/g,'o').replace(/[1i]/g,'l').replace(/5/g,'s').replace(/3/g,'e').replace(/4/g,'a').replace(/7/g,'t').replace(/8/g,'b')
const RESERVED=new Set(['admin','administrator','system','parley','support','moderator','mod','staff','root','everyone','here','owner','official','security','help','abuse','null','undefined','anonymous','unknown','deleted','webhook','bot','discord'])
const FOLD={'@':'a','$':'s','!':'i','+':'t','€':'e','£':'l','¡':'i'}
const SUB='nigger,nigga,nigg,cunt,clit,bitch,slut,whore,faggot,retard,tranny,motherfuck,fuck,shit,pussy,cocksuck,dickhead,asshole,bastard,wanker,twat,hitler,jizz,cum,penis,vagina,rapist,molest,putain,salope,connard,merde,enculer,scheisse,scheiße,hurensohn,arschloch,fotze,wichser,puta,puto,mierda,pendejo,cabron,chinga,culo,joder,coño,hijueputa,gilipollas,cazzo,stronzo,vaffanculo,puttana,kurwa,pizda,blyat,pidor,huesos,mamahuevo,mamaguevo,kanker,tering,sikerim,orospu,sharmuta,chutiya,madarchod,behenchod,bhosdi,lauda,chinko,manko,shibal,gaesaekki,caonima,shabi,sb'.split(',')
const TOK=new Set(['ass','fag','dyke','rape','spic','chink','kike','tit','tits','cock','nude','nudes','cum','culo','puto','puta'])
const skip=new Set(['cum','culo','puto','puta'])
const LONG=SUB.filter(w=>w.length>=4&&!skip.has(w))
const SHORT=new Set([...SUB.filter(w=>w.length<4||skip.has(w)),...TOK])
export function badName(s){
const t=String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
const f=[...t].map(c=>FOLD[c]||c).join('').replace(/0/g,'o').replace(/1/g,'i').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b')
const sq=f.replace(/[^\p{L}]/gu,'').replace(/(.)\1+/gu,'$1')
for(const w of LONG)if(sq.includes(w.replace(/(.)\1+/g,'$1')))return true
const tk=f.split(/[^\p{L}]+/u).filter(Boolean)
return tk.some(x=>SHORT.has(x.replace(/(.)\1+/gu,'$1')))
}
export const dnProblem=s=>badName(s)?'That name is not allowed':null
export function nameProblem(env,name,{bot=false}={}){
const sk=skeleton(name)
const admins=(env.ADMIN_USERNAMES||'').toLowerCase().split(',').map(s=>s.trim()).filter(Boolean)
if(admins.includes(name.toLowerCase()))return null
if(RESERVED.has(sk))return'That username is reserved'
if(badName(name))return'That username is not allowed'
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
