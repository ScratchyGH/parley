import{fail,now}from'./util.js'
import{P}from'./perms.js'
const S=new Map()
const norm=s=>String(s||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()
const URL_RE=/https?:\/\/[^\s<>"')]+/gi
function strikeOf(id,t){
let s=S.get(id)
if(!s){s={hits:[],until:0};if(S.size>5000)S.delete(S.keys().next().value);S.set(id,s)}
s.hits=s.hits.filter(x=>t-x<600000)
return s
}
function verdict(content,recent,room,t,hasFiles){
const c=String(content||'')
const n=norm(c)
const fast=recent.filter(m=>t-m.created_at<5000).length
if(fast>=5)return'You are sending messages too fast. Take a breath.'
if(n.length>=4){
const same=recent.filter(m=>t-m.created_at<90000&&norm(m.content)===n)
if(same.length>=2||(same.length&&same[0].room===room&&t-same[0].created_at<20000&&n.length>8))return'That looks like a repeat of your last message.'
}
const ids=new Set((c.match(/<@[^>\s]+>/g)||[]))
if(ids.size>6||((c.match(/@everyone|@here/g)||[]).length>2))return'Too many mentions in one message.'
const urls=(c.match(URL_RE)||[]).map(u=>u.toLowerCase())
if(urls.length>4)return'Too many links in one message.'
if(urls.length){
const hits=recent.filter(m=>t-m.created_at<120000&&urls.some(u=>String(m.content).toLowerCase().includes(u))).length
if(hits>=2)return'You already shared that link a few times.'
if(/free\s+(nitro|robux|v-?bucks|gift)|steam\s+gift|airdrop|claim\s+your\s+(prize|reward)|\bgiveaway\b.*\bclick/i.test(c))return'That message looks like a scam.'
}
const letters=c.replace(/[^\p{L}]/gu,'')
if(letters.length>=25&&letters.replace(/[^\p{Lu}]/gu,'').length/letters.length>.8)return'Please do not type everything in capitals.'
if(/(.)\1{24,}/su.test(c))return'Too many repeated characters.'
if((c.match(/[̀-ͯ]/g)||[]).length>30)return'That message has too many combining marks.'
return''
}
export async function antispam(c,rr,content,hasFiles){
if(c.user.is_bot||c.user.admin)return
if(rr.kind==='channel'&&(rr.perms&(P.MANAGE_MESSAGES|P.MODERATE)))return
if(rr.kind==='channel'&&rr.m&&rr.m.server&&rr.m.server.owner_id===c.user.id)return
const t=now()
const st=strikeOf(c.user.id,t)
if(st.until>t)fail(429,`Auto-moderation paused your messages. Try again in ${Math.ceil((st.until-t)/1000)}s.`)
const recent=(await c.env.DB.prepare('select content,room,created_at from messages where author_id=? and created_at>? and deleted_at is null order by id desc limit 8').bind(c.user.id,t-120000).all()).results
const why=verdict(content,recent,rr.room,t,hasFiles)
if(!why)return
st.hits.push(t)
if(st.hits.length>=3){
st.until=t+(st.hits.length>=5?600000:180000)
if(rr.kind==='channel'&&st.hits.length>=5){
await c.env.DB.batch([
c.env.DB.prepare('update members set timeout_until=? where server_id=? and user_id=?').bind(t+600000,rr.serverId,c.user.id),
c.env.DB.prepare('insert into mod_log(id,server_id,actor_id,action,target_id,detail,created_at) values(?,?,?,?,?,?,?)').bind('ml_'+t.toString(36)+Math.random().toString(36).slice(2,8),rr.serverId,'ai','member.timeout',c.user.id,'Auto spam timeout: '+why,t)
])
}
fail(429,'Auto-moderation paused your messages for a few minutes because of repeated spam.')
}
fail(429,why)
}
