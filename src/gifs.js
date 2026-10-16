import{fail,now,newId,limit,str,body,hex,json}from'./util.js'
import{resolveRoom,need,P}from'./perms.js'
import{place}from'./store.js'
import{explicitText}from'./safety.js'

const MAX=10*1048576
const base=env=>(env.GIF_API_BASE||(env.TENOR_API_KEY?'https://tenor.googleapis.com/v2':'')).replace(/\/+$/,'')
const key=env=>env.GIF_API_KEY||env.TENOR_API_KEY||''
const hosts=env=>(env.GIF_MEDIA_HOSTS||'tenor.com,klipy.com,giphy.com,cdn.otakugifs.xyz,upload.wikimedia.org').toLowerCase().split(',').map(s=>s.trim()).filter(Boolean)

export function mediaUrl(env,v){
let u
try{u=new URL(String(v))}catch{fail(400,'Invalid GIF address')}
if(u.protocol!=='https:'||u.username||u.password||u.port||u.href.length>500)fail(400,'Invalid GIF address')
const h=u.hostname.toLowerCase()
if(!hosts(env).some(x=>h===x||h.endsWith('.'+x)))fail(400,'That GIF host is not allowed')
return u
}

function fmt(m){
const f=m&&m.media_formats||{}
const big=f.mediumgif||f.gif||f.tinygif
const small=f.tinygif||f.nanogif||f.mediumgif||f.gif
if(!big||!small||!big.url||!small.url)return null
const d=big.dims||small.dims||[]
return{id:String(m.id).slice(0,80),title:String(m.content_description||m.title||'').slice(0,120),preview:small.url,url:big.url,w:d[0]||0,h:d[1]||0}
}

const REACTIONS=['hug','happy','laugh','dance','cry','wave','clap','facepalm','cheers','thumbsup','wink','smile','shrug','sleep','celebrate','cool','confused','no','nervous','blush','pat','poke','highfive','handhold','nom','smug','sad','mad','think','yes']
const UA={'user-agent':'ParleyGifSearch/1.0 (https://github.com/scratchygh/parley)',accept:'application/json'}
const BANNED=new Set(['lick','nosebleed','kiss','bite','drool','airkiss','cuddle','nuzzle'])
async function reaction(name){
try{
const r=await fetch('https://api.otakugifs.xyz/gif?reaction='+encodeURIComponent(name),{headers:UA})
if(!r.ok)return null
const d=await r.json()
if(!d.url)return null
return{id:'o:'+d.url.split('/').pop().replace(/\.gif$/,''),title:name,preview:d.url,url:d.url,w:0,h:0}
}catch{return null}
}
async function commons(q){
try{
const u=new URL('https://commons.wikimedia.org/w/api.php')
for(const[k,v]of Object.entries({action:'query',generator:'search',gsrsearch:q+' filetype:bitmap',gsrnamespace:'6',gsrlimit:'30',prop:'imageinfo',iiprop:'url|mime|size',format:'json',origin:'*'}))u.searchParams.set(k,v)
const r=await fetch(u,{headers:UA})
if(!r.ok)return[]
const d=await r.json()
return Object.values(d.query?.pages||{}).map(p=>{
const i=(p.imageinfo||[])[0]
if(!i||i.mime!=='image/gif'||i.size>3000000||!i.url)return null
return{id:'w:'+p.pageid,title:String(p.title||'').replace(/^File:/,'').replace(/\.gif$/i,'').slice(0,120),preview:i.url,url:i.url,w:i.width||0,h:i.height||0}
}).filter(Boolean)
}catch{return[]}
}
async function keyless(q){
const pool=REACTIONS.filter(x=>!BANNED.has(x))
const t=q.toLowerCase()
const hit=pool.filter(x=>t&&(x.includes(t)||t.includes(x)))
let names
if(!t)names=[...pool].sort(()=>Math.random()-.5).slice(0,12)
else if(hit.length)names=hit.flatMap(x=>[x,x,x,x]).slice(0,8)
else names=[]
const[a,w]=await Promise.all([Promise.all(names.map(reaction)),t?commons(t):Promise.resolve([])])
const seen=new Set()
const items=[...a.filter(Boolean),...w].filter(x=>!explicitText(x.title)&&!seen.has(x.id)&&seen.add(x.id))
return{results:items,next:''}
}

async function upstream(c,path,params){
const b=base(c.env)
if(!b)return keyless(params.q||'')
const u=new URL(b+path)
u.searchParams.set('key',key(c.env))
u.searchParams.set('client_key','parley')
u.searchParams.set('media_filter','tinygif,mediumgif,gif')
u.searchParams.set('contentfilter','medium')
u.searchParams.set('limit','24')
for(const[k,v]of Object.entries(params))if(v)u.searchParams.set(k,v)
let res
try{res=await fetch(u,{headers:{accept:'application/json'}})}catch{fail(502,'The GIF service could not be reached')}
if(!res.ok)fail(502,res.status===401||res.status===403?'The GIF service rejected the API key':'The GIF service is not available right now ('+res.status+')')
let d
try{d=await res.json()}catch{fail(502,'The GIF service sent an unreadable answer')}
const items=(d.results||[]).map(fmt).filter(x=>x&&!explicitText(x.title))
return{results:items,next:String(d.next||'')}
}

async function pull(c,url){
const u=mediaUrl(c.env,url)
let res
try{res=await fetch(u,{redirect:'manual'})}catch{fail(502,'Could not download that GIF')}
if(!res.ok)fail(502,'Could not download that GIF')
const type=(res.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()
if(!['image/gif','image/webp','image/png','image/jpeg'].includes(type))fail(415,'That is not an image')
const len=parseInt(res.headers.get('content-length')||'0')
if(len>MAX)fail(413,'That GIF is larger than 10 MB')
const buf=await res.arrayBuffer()
if(buf.byteLength>MAX||buf.byteLength<8)fail(413,'That GIF is larger than 10 MB')
return{buf,type}
}

export default function(r){
r.add('GET','/api/gifs/status',async c=>({enabled:true,note:base(c.env)?'':'Built-in search: reaction GIFs from otakugifs.xyz and GIFs from Wikimedia Commons. No API key needed.'}))

r.add('GET','/api/gifs/search',async c=>{
limit('gif:'+c.user.id,60,60000)
const q=(c.url.searchParams.get('q')||'').trim().slice(0,60)
if(q&&explicitText(q))fail(400,'That search is not allowed')
const pos=(c.url.searchParams.get('pos')||'').slice(0,80)
return upstream(c,q?'/search':'/featured',{q,pos})
})

r.add('GET','/api/gifs/media',async c=>{
limit('gifm:'+c.user.id,600,60000)
const u=mediaUrl(c.env,c.url.searchParams.get('u'))
let res
try{res=await fetch(u,{redirect:'manual'})}catch{fail(502,'Could not load that GIF')}
if(!res.ok)fail(502,'Could not load that GIF')
const type=(res.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()
if(!['image/gif','image/webp','image/png','image/jpeg'].includes(type))fail(415,'That is not an image')
if(parseInt(res.headers.get('content-length')||'0')>MAX)fail(413,'Too large')
return new Response(res.body,{headers:{'content-type':type,'cache-control':'private, max-age=86400','x-content-type-options':'nosniff','content-security-policy':"sandbox; default-src 'none'",'cross-origin-resource-policy':'same-origin'}})
})

r.add('POST','/api/gifs/import',async c=>{
limit('gifi:'+c.user.id,40,600000)
const b=await body(c.req,2000)
const kind=b.kind||'attachment'
if(!['attachment','avatar','banner'].includes(kind))fail(400,'Invalid kind')
let room=null
if(kind==='attachment'){
const rr=await resolveRoom(c.env,String(b.room||''),c.user.id)
need(rr.perms,P.ATTACH,'You cannot attach files here')
room=rr.room
}
const{buf,type}=await pull(c,b.url)
const quota=(parseInt(c.env.USER_QUOTA_MB)||1024)*1048576
const used=await c.env.DB.prepare('select coalesce((select sum(size) from files where owner_id=?1),0)+coalesce((select sum(size) from uploads where owner_id=?1),0) s').bind(c.user.id).first()
if(used.s+buf.byteLength>quota)fail(413,'You have reached your storage quota. Delete some uploads to free space.')
const id=newId('f')
const k=place(c.env,`u/${c.user.id}/${id}`,buf.byteLength)
const ext=type==='image/gif'?'gif':type==='image/webp'?'webp':type==='image/png'?'png':'jpg'
const name='gif-'+id.slice(2,10)+'.'+ext
await c.env.FILES.put(k,buf,{httpMetadata:{contentType:type}})
await c.env.DB.prepare('insert into files(id,owner_id,kind,room,server_id,r2_key,name,mime,size,sha256,verified,created_at) values(?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,c.user.id,kind,room,null,k,name,type,buf.byteLength,hex(await crypto.subtle.digest('SHA-256',buf)),0,now()).run()
return json({id,name,mime:type,size:buf.byteLength,kind},201)
})

r.add('GET','/api/gifs/favs',async c=>{
const rows=(await c.env.DB.prepare('select gif_id id,title,preview,url from gif_favs where user_id=? order by created_at desc limit 100').bind(c.user.id).all()).results
return{results:rows}
})

r.add('POST','/api/gifs/favs',async c=>{
const b=await body(c.req,3000)
const id=str(String(b.id||''),1,80,'GIF id')
const title=String(b.title||'').slice(0,120)
const preview=mediaUrl(c.env,b.preview).href
const url=mediaUrl(c.env,b.url).href
const n=await c.env.DB.prepare('select count(*) n from gif_favs where user_id=?').bind(c.user.id).first()
if(n.n>=100)fail(400,'You can save up to 100 GIFs')
await c.env.DB.prepare('insert into gif_favs(user_id,gif_id,title,preview,url,created_at) values(?,?,?,?,?,?) on conflict(user_id,gif_id) do update set created_at=excluded.created_at').bind(c.user.id,id,title,preview,url,now()).run()
return{ok:true}
})

r.add('DELETE','/api/gifs/favs/:id',async c=>{
await c.env.DB.prepare('delete from gif_favs where user_id=? and gif_id=?').bind(c.user.id,c.p.id).run()
return{ok:true}
})
}
