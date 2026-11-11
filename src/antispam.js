import{fail,now}from'./util.js'
import{P}from'./perms.js'
const S=new Map()
const R=new Map()
const remember=(id,m)=>{let a=R.get(id);if(!a){if(R.size>8000)R.delete(R.keys().next().value);a=[];R.set(id,a)}a.push(m);while(a.length>10)a.shift()}
const INVITE=/(?:discord(?:app)?\.(?:gg|com\/invite)|invite\.gg|dsc\.gg|t\.me\/(?:joinchat|\+)|chat\.whatsapp\.com)\/?[\w-]*/i
const PHISH=/(?:verify|confirm|secure|restore|unlock)\s+(?:your\s+)?(?:account|wallet|login)|your\s+account\s+(?:has\s+been|will\s+be)\s+(?:suspended|banned|locked|disabled)|seed\s+phrase|(?:double|2x)\s+your\s+(?:crypto|btc|eth)|dm\s+me\s+for\s+(?:cheap|free)\s+(?:nitro|robux)/i
const norm=s=>String(s||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()
const URL_RE=/https?:\/\/[^\s<>"')]+/gi
function strikeOf(id,t){
let s=S.get(id)
if(!s){s={hits:[],until:0};if(S.size>5000)S.delete(S.keys().next().value);S.set(id,s)}
s.hits=s.hits.filter(x=>t-x<600000)
return s
}
function verdict(content,recent,room,t,hasFiles,age){
const c=String(content||'')
const n=norm(c)
const fast=recent.filter(m=>t-m.created_at<5000).length
if(fast>=5||recent.filter(m=>t-m.created_at<30000).length>=9)return'You are sending messages too fast. Take a breath.'
const rooms=new Set(recent.filter(m=>t-m.created_at<60000&&norm(m.content)===norm(c)&&norm(c).length>=6).map(m=>m.room))
if(rooms.size>=2&&!rooms.has(room)||rooms.size>=3)return'That message was posted in several places already.'
if(n.length>=4){
const same=recent.filter(m=>t-m.created_at<90000&&norm(m.content)===n)
if(same.length>=2||(same.length&&same[0].room===room&&t-same[0].created_at<20000&&n.length>8))return'That looks like a repeat of your last message.'
}
const ids=new Set((c.match(/<@[^>\s]+>/g)||[]))
if(ids.size>6||((c.match(/@everyone|@here/g)||[]).length>2))return'Too many mentions in one message.'
const urls=(c.match(URL_RE)||[]).map(u=>u.toLowerCase())
if(INVITE.test(c)&&age<86400000)return'New accounts cannot share server invites yet.'
if(PHISH.test(c)&&(urls.length||/dm\s+me/i.test(c)))return'That message looks like a scam.'
if(age<600000&&urls.length&&recent.some(m=>t-m.created_at<120000&&URL_RE.test(String(m.content))))return'New accounts can share one link every two minutes.'
URL_RE.lastIndex=0
if(urls.length>4)return'Too many links in one message.'
if(urls.length){
const hits=recent.filter(m=>t-m.created_at<120000&&urls.some(u=>String(m.content).toLowerCase().includes(u))).length
if(hits>=2)return'You already shared that link a few times.'
if(/free\s+(nitro|robux|v-?bucks|gift)|steam\s+gift|airdrop|claim\s+your\s+(prize|reward)|\bgiveaway\b.*\bclick/i.test(c))return'That message looks like a scam.'
}
const letters=c.replace(/[^\p{L}]/gu,'')
if(letters.length>=25&&letters.replace(/[^\p{Lu}]/gu,'').length/letters.length>.8)return'Please do not type everything in capitals.'
if(/(.)\1{24,}/su.test(c))return'Too many repeated characters.'
if((c.match(/[\u200b-\u200f\u2060\ufeff\u00ad]/g)||[]).length>12)return'That message has too many invisible characters.'
if((c.match(/\p{Extended_Pictographic}/gu)||[]).length>40)return'Too many emoji in one message.'
if(c.length>1200&&(c.match(/\n/g)||[]).length>60)return'That message is too long.'
if((c.match(/[̀-ͯ]/g)||[]).length>30)return'That message has too many combining marks.'
return''
}
const GRAB=/(?:^|[\/.@])(grabify\.link|iplogger\.(?:org|com|ru|co)|2no\.co|yip\.su|ipgrabber\.ru|iplogger\.info|blasze\.(?:com|tk)|leancoding\.co|stopify\.co|freegiftcards\.co|joinmy\.site|curiouscat\.club|gyazos\.com|lovebird\.guru|ps3cfw\.com|bmwforum\.co|spottyfly\.com|quickmessage\.us|datauth\.xyz|dateing\.club|xn--80ak6aa92e\.com)(?:[\/:?#]|$)/i
export function grabCheck(c,content){
if(c.user.admin)return
for(const m of String(content||'').matchAll(/https?:\/\/[^\s<>"')]+/gi)){
let h='';try{h=new URL(m[0]).hostname}catch{continue}
if(GRAB.test('/'+h+'/')||/^\d{1,3}(\.\d{1,3}){3}$/.test(h)&&/\.(php|png|jpg|gif)\b|[?&](id|ref|uid)=/i.test(m[0]))fail(422,'That link was blocked. It looks like an IP logger.')
}
}
export async function antispam(c,rr,content,hasFiles){
grabCheck(c,content)
if(c.user.is_bot||c.user.admin)return
if(rr.kind==='channel'&&(rr.perms&(P.MANAGE_MESSAGES|P.MODERATE)))return
if(rr.kind==='channel'&&rr.m&&rr.m.server&&rr.m.server.owner_id===c.user.id)return
const t=now()
const st=strikeOf(c.user.id,t)
if(st.until>t)fail(429,`Auto-moderation paused your messages. Try again in ${Math.ceil((st.until-t)/1000)}s.`)
const mem=R.get(c.user.id)||[]
const needDb=!mem.length&&(content.length>200||URL_RE.test(content)||INVITE.test(content))
URL_RE.lastIndex=0
const recent=(needDb?(await c.env.DB.prepare('select content,room,created_at from messages where author_id=? and created_at>? and deleted_at is null order by id desc limit 8').bind(c.user.id,t-120000).all()).results:mem.filter(m=>t-m.created_at<120000))
const why=verdict(content,recent,rr.room,t,hasFiles,t-(c.user.created_at||0))
remember(c.user.id,{content:String(content||'').slice(0,300),room:rr.room,created_at:t})
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
