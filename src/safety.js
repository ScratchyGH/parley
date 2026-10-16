const LEET={'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','@':'a','$':'s','!':'i','|':'i','+':'t'}
const SEP='[._\\-*+|~\'`^]?'
const STRONG=['porn','pornhub','porno','pornography','hentai','xvideos','xnxx','xhamster','redtube','youporn','rule34','camgirl','camgirls','cumshot','creampie','gangbang','blowjob','handjob','bukkake','futanari','ahegao','lolicon','shotacon','onlyfansleaks','nudeleaks','sexcam','sextape','erotica','incest','deepthroat','threesome','nsfwart','pornstar','jerkoff','masturbat','cumslut','hornyhub','spankbang','chaturbate','stripchat','livejasmin','brazzers','bangbros','nhentai','rule34xxx','fakku']
const TOKEN=['sex','xxx','cum','tits','boobs','pussy','nudes','nude','fap','fapping','milf','anal','orgy','slut','sluts','horny','thots','lewds','lewd','loli','shota','jav','hentais','nsfw18','sexting','nudez']
const fold=s=>s.normalize('NFKD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[​-‏⁠﻿]/g,'').replace(/[0134578@$!|+]/g,m=>LEET[m]||m)
const loose=w=>new RegExp(fold(w).split('').join(SEP))
const STRONG_RE=STRONG.map(w=>loose(w))
const SQUASH_RE=new RegExp(STRONG.filter(w=>w.length>=6).map(fold).join('|'))
const TOKEN_RE=new RegExp('(?:^|[^a-z])(?:'+TOKEN.join('|')+')(?![a-z])')
export function explicitText(s){
if(!s||typeof s!=='string')return false
const f=fold(s)
if(STRONG_RE.some(r=>r.test(f)))return true
if(SQUASH_RE.test(f.replace(/[^a-z]/g,'')))return true
return TOKEN_RE.test(f.replace(/[_\-.*~']+/g,' ')) 
}
export const BLOCK_HOSTS='pornhub.com,xvideos.com,xnxx.com,xhamster.com,redtube.com,youporn.com,spankbang.com,chaturbate.com,stripchat.com,livejasmin.com,brazzers.com,bangbros.com,nhentai.net,hentaihaven.xxx,hanime.tv,e621.net,rule34.xxx,rule34.paheal.net,gelbooru.com,fakku.net,eporner.com,tnaflix.com,porn.com,beeg.com,motherless.com,onlyfans.com,fansly.com,thothub.org,erome.com,cam4.com,bongacams.com,myfreecams.com,literotica.com,sex.com,pornpics.com,4chan.org/b'.split(',')
export function badHost(host){
host=host.toLowerCase().replace(/^www\./,'')
if(/\.(xxx|porn|sex|adult)$/.test(host))return true
return BLOCK_HOSTS.some(b=>{const h=b.split('/')[0];return host===h||host.endsWith('.'+h)})
}
export function urlsIn(text){
return[...new Set((String(text||'').match(/https?:\/\/[^\s<>"')]+/gi)||[]).slice(0,3))]
}
function okTarget(u){
if(!['http:','https:'].includes(u.protocol)||u.username||u.password)return false
const h=u.hostname.toLowerCase()
return!(h==='localhost'||h.endsWith('.local')||h.endsWith('.internal')||/^(\d+\.){3}\d+$/.test(h)||h.includes(':')||!h.includes('.'))
}
export async function imageExplicit(env,bytes){
if(!env.AI||!bytes||!bytes.length||bytes.length>4*1024*1024)return false
try{
const out=await env.AI.run('@cf/llava-hf/llava-1.5-7b-hf',{image:[...bytes],prompt:'Does this image contain pornography, sexually explicit acts, or exposed genitals or nipples? Answer only YES or NO.',max_tokens:4})
return/^\s*yes/i.test(String(out&&(out.description||out.response)||''))
}catch{return false}
}
export async function inspectLink(env,href){
let u
try{u=new URL(href)}catch{return false}
for(let hop=0;hop<5;hop++){
if(!okTarget(u))return false
if(badHost(u.hostname))return true
const ctl=new AbortController()
const timer=setTimeout(()=>ctl.abort(),4000)
try{
const res=await fetch(u.href,{signal:ctl.signal,redirect:'manual',headers:{'user-agent':'ParleyLinkCheck/1.0','accept':'text/html,image/*'}})
if(res.status>=300&&res.status<400){
const loc=res.headers.get('location')
if(!loc)return false
u=new URL(loc,u)
continue
}
const ct=res.headers.get('content-type')||''
if(ct.startsWith('image/')){
const buf=new Uint8Array(await res.arrayBuffer())
return await imageExplicit(env,buf)
}
if(!ct.includes('text/html'))return false
const reader=res.body.getReader()
let html='',n=0
const dec=new TextDecoder()
while(n<120000){const{done,value}=await reader.read();if(done)break;n+=value.length;html+=dec.decode(value,{stream:true});if(html.includes('</head>'))break}
reader.cancel().catch(()=>{})
const head=html.slice(0,html.indexOf('</head>')>0?html.indexOf('</head>'):html.length)
if(/rta-5042-1996-1400-1577-rta/i.test(head))return true
if(/<meta[^>]+name=["']rating["'][^>]+content=["'](?:adult|mature|rta)/i.test(head))return true
const bits=[(head.match(/<title[^>]*>([^<]*)</i)||[])[1],...[...head.matchAll(/<meta[^>]+(?:name|property)=["'](?:description|keywords|og:title|og:description)["'][^>]*content=["']([^"']*)/gi)].map(m=>m[1])]
return explicitText(bits.filter(Boolean).join(' '))
}catch{return false}finally{clearTimeout(timer)}
}
return false
}
export function serverText(s){
return[s.name,s.description,s.welcome,s.rules,s.vanity].filter(Boolean).join(' ')
}

const AMBIG=new Set(['sex','anal','cum','jav','nude','loli','shota'])
const TOKEN_MSG_RE=new RegExp('(?:^|[^a-z])(?:'+TOKEN.filter(t=>!AMBIG.has(t)).join('|')+')(?![a-z])')
export function messageExplicit(s){
if(!s||typeof s!=='string')return false
const f=fold(s)
if(STRONG_RE.some(r=>r.test(f)))return true
if(SQUASH_RE.test(f.replace(/[^a-z]/g,'')))return true
if(urlsIn(s).some(u=>{try{return badHost(new URL(u).hostname)}catch{return false}}))return true
return TOKEN_MSG_RE.test(f.replace(/[_\-.*~']+/g,' '))
}
export const filterOn=server=>!!server&&(!server.age_restricted||!!server.scan_explicit)
export function wordHit(text,word){
const f=fold(String(text||'')),w=fold(String(word||'')).trim()
if(!w)return false
const esc=w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')
if(w.replace(/[^a-z0-9]/g,'').length<4)return new RegExp('(?:^|[^a-z0-9])'+esc.replace(/\s+/g,'\\s+')+'(?![a-z0-9])').test(f)
if(f.includes(w))return true
const sq=w.replace(/[^a-z0-9]/g,'')
return f.replace(/[^a-z0-9]/g,'').includes(sq)
}
