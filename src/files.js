import{fail,now,newId,limit,str,clamp,body,hex,json}from'./util.js'
import{resolveRoom,loadMember,P,need}from'./perms.js'

const IMG={png:'image/png',apng:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',avif:'image/avif',jxl:'image/jxl',heic:'image/heic',heif:'image/heif',bmp:'image/bmp',tif:'image/tiff',tiff:'image/tiff',ico:'image/x-icon'}
const INLINE_MEDIA={mp3:'audio/mpeg',ogg:'audio/ogg',oga:'audio/ogg',wav:'audio/wav',m4a:'audio/mp4',flac:'audio/flac',mp4:'video/mp4',webm:'video/webm',mov:'video/quicktime',mkv:'video/x-matroska',opus:'audio/ogg',aac:'audio/aac',pdf:'application/pdf'}
const BLOCKED=new Set(['exe','msi','bat','cmd','com','scr','dll','ps1','vbs','jar','apk','svg','html','htm','xhtml','xml','hta','lnk','reg','sh'])
const PUBLIC_KINDS=new Set(['avatar','banner','server_icon','server_banner','conv_icon','emoji','sticker'])
const KINDS=['attachment','avatar','banner','server_icon','server_banner','conv_icon','emoji','sticker']
const PART=16*1048576

function sniff(b,type){
const u=new Uint8Array(b.slice(0,16))
const at=(o,s)=>[...s].every((ch,i)=>u[o+i]===ch.charCodeAt(0))
if(type==='image/png')return u[0]===0x89&&at(1,'PNG')
if(type==='image/jpeg')return u[0]===0xff&&u[1]===0xd8&&u[2]===0xff
if(type==='image/gif')return at(0,'GIF8')
if(type==='image/webp')return at(0,'RIFF')&&at(8,'WEBP')
if(type==='image/avif')return at(4,'ftyp')
if(type==='image/jxl')return(u[0]===0xff&&u[1]===0x0a)||(u[0]===0&&u[1]===0&&u[2]===0&&u[3]===0x0c&&at(4,'JXL '))
if(type==='image/heic'||type==='image/heif')return at(4,'ftyp')
if(type==='image/bmp')return at(0,'BM')
if(type==='image/tiff')return(at(0,'II')&&u[2]===42&&u[3]===0)||(at(0,'MM')&&u[2]===0&&u[3]===42)
if(type==='image/x-icon')return u[0]===0&&u[1]===0&&u[2]===1&&u[3]===0
if(type==='video/x-matroska'||type==='video/webm')return u[0]===0x1a&&u[1]===0x45&&u[2]===0xdf&&u[3]===0xa3
if(type==='video/mp4'||type==='video/quicktime')return at(4,'ftyp')||at(4,'moov')||at(4,'mdat')||at(4,'free')||at(4,'wide')
if(type==='application/pdf')return at(0,'%PDF')
return true
}

const ext=n=>(n.split('.').pop()||'').toLowerCase()
const safeName=n=>n.replace(/[\u0000-\u001f\\/:*?"<>|]/g,'_').slice(0,120)||'file'

async function plan(c,kind,rawName,len,roomQ,serverQ,multi){
if(!KINDS.includes(kind))fail(400,'Invalid upload kind')
const name=safeName(rawName||'file')
const e=ext(name)
if(BLOCKED.has(e))fail(415,'This file type is not allowed')
const maxMb=parseInt(c.env.MAX_UPLOAD_MB)||100
const bigMb=parseInt(c.env.MAX_FILE_MB)||1024
const lim=kind==='attachment'?(multi?bigMb:maxMb):(kind==='emoji'?1:kind==='sticker'?2:10)
if(!len||len<1)fail(411,'File size required')
if(len>lim*1048576)fail(413,`File is larger than the ${lim} MB limit`)
let room=null,serverId=null
if(kind==='attachment'){
const rr=await resolveRoom(c.env,roomQ,c.user.id)
need(rr.perms,P.ATTACH,'You cannot attach files here')
room=rr.room
}else if(kind==='server_icon'||kind==='server_banner'||kind==='emoji'||(kind==='sticker'&&serverQ)){
serverId=serverQ
const m=await loadMember(c.env,serverId||'',c.user.id)
if(!m)fail(404,'Server not found')
if(!(m.base&P.MANAGE_SERVER)&&!m.admin)fail(403,'You cannot change this server')
}else if(kind==='conv_icon'){
room=roomQ
const rr=await resolveRoom(c.env,room,c.user.id)
if(rr.kind!=='dm'||rr.conv.type!=='group')fail(400,'Not a group conversation')
}
const quota=(parseInt(c.env.USER_QUOTA_MB)||1024)*1048576
const used=await c.env.DB.prepare('select coalesce((select sum(size) from files where owner_id=?1),0)+coalesce((select sum(size) from uploads where owner_id=?1),0) s').bind(c.user.id).first()
if(used.s+len>quota)fail(413,'You have reached your storage quota. Delete some uploads to free space.')
let mime='application/octet-stream'
if(IMG[e])mime=IMG[e]
else if(kind!=='attachment')fail(415,'Only images are allowed here')
else if(INLINE_MEDIA[e])mime=INLINE_MEDIA[e]
else if(TEXT.includes(e))mime='text/plain; charset=utf-8'
return{name,mime,room,serverId,typed:!!(IMG[e]||INLINE_MEDIA[e])}
}
const TEXT=['txt','md','json','csv','log','js','ts','py','java','c','cpp','h','rs','go','css','yml','yaml','toml','sql','kt','lua','rb','php','cs','swift']
const okSha=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v)

export default function(r){
r.add('POST','/api/upload',async c=>{
limit('up:'+c.user.id,60,600000)
const kind=c.url.searchParams.get('kind')||'attachment'
const hdr=c.req.headers.get('x-filename')
const len=parseInt(c.req.headers.get('content-length')||'0')
const p=await plan(c,kind,hdr?decodeURIComponent(hdr):'file',len,c.url.searchParams.get('room'),c.url.searchParams.get('server'),false)
const want=c.req.headers.get('x-sha256')
if(want&&!okSha(want))fail(400,'Invalid checksum')
const buf=await c.req.arrayBuffer()
if(buf.byteLength!==len)fail(400,'Body size does not match Content-Length')
if(p.typed&&!sniff(buf,p.mime))fail(415,'File content does not match its type')
const id=newId('f')
const key=`u/${c.user.id}/${id}`
const opts={httpMetadata:{contentType:p.mime}}
if(want)opts.sha256=want
let obj
try{obj=await c.env.FILES.put(key,buf,opts)}catch(x){fail(400,'Checksum mismatch or storage error')}
const sum=want||(obj&&obj.checksums&&obj.checksums.sha256?hex(obj.checksums.sha256):null)
await c.env.DB.prepare('insert into files(id,owner_id,kind,room,server_id,r2_key,name,mime,size,sha256,verified,created_at) values(?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,c.user.id,kind,p.room,p.serverId,key,p.name,p.mime,buf.byteLength,sum,want?1:0,now()).run()
return json({id,name:p.name,mime:p.mime,size:buf.byteLength,kind,sha256:sum},201)
})

r.add('POST','/api/upload/init',async c=>{
limit('upi:'+c.user.id,40,600000)
const b=await body(c.req,20000)
const kind=b.kind||'attachment'
if(kind!=='attachment')fail(400,'Multipart is for attachments only')
const size=parseInt(b.size)
const p=await plan(c,kind,str(b.name,1,200,'name'),size,b.room,null,true)
if(b.sha256&&!okSha(b.sha256))fail(400,'Invalid checksum')
const open=await c.env.DB.prepare('select count(*) n from uploads where owner_id=?').bind(c.user.id).first()
if(open.n>=8)fail(429,'Too many unfinished uploads. Finish or cancel some first.')
const id=newId('up')
const key=`u/${c.user.id}/${id}`
const mp=await c.env.FILES.createMultipartUpload(key,{httpMetadata:{contentType:p.mime}})
const parts=Math.ceil(size/PART)
if(parts>1000)fail(413,'Too many parts')
await c.env.DB.prepare('insert into uploads(id,owner_id,kind,room,server_id,name,mime,size,sha256,r2_key,upload_id,part_size,created_at) values(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,c.user.id,kind,p.room,p.serverId,p.name,p.mime,size,b.sha256||null,key,mp.uploadId,PART,now()).run()
return json({id,part_size:PART,parts},201)
})

async function pending(c){
const u=await c.env.DB.prepare('select * from uploads where id=? and owner_id=?').bind(c.p.id,c.user.id).first()
if(!u)fail(404,'Upload not found')
return u
}

r.add('PUT','/api/upload/:id/part/:n',async c=>{
const u=await pending(c)
const n=parseInt(c.p.n)
const parts=Math.ceil(u.size/u.part_size)
if(!(n>=1&&n<=parts))fail(400,'Invalid part number')
const len=parseInt(c.req.headers.get('content-length')||'0')
const expect=n<parts?u.part_size:u.size-u.part_size*(parts-1)
if(len!==expect)fail(400,`Part ${n} must be ${expect} bytes`)
if(!c.req.body)fail(400,'Empty body')
const mp=c.env.FILES.resumeMultipartUpload(u.r2_key,u.upload_id)
let part
try{part=await mp.uploadPart(n,c.req.body)}catch(x){fail(502,'Storage rejected the part. Retry it.')}
return json({n,etag:part.etag})
})

r.add('POST','/api/upload/:id/complete',async c=>{
const u=await pending(c)
const b=await body(c.req,20000)
const parts=Math.ceil(u.size/u.part_size)
if(!Array.isArray(b.parts)||b.parts.length!==parts)fail(400,'Missing parts')
const list=b.parts.map(p=>({partNumber:parseInt(p.n),etag:String(p.etag)})).sort((a,z)=>a.partNumber-z.partNumber)
if(list.some((p,i)=>p.partNumber!==i+1))fail(400,'Part numbers must be contiguous')
const mp=c.env.FILES.resumeMultipartUpload(u.r2_key,u.upload_id)
let obj
try{obj=await mp.complete(list)}catch(x){fail(400,'Could not assemble the upload. Retry the failed parts.')}
const bad=async m=>{await c.env.FILES.delete(u.r2_key);await c.env.DB.prepare('delete from uploads where id=?').bind(u.id).run();fail(415,m)}
if(obj.size!==u.size)await bad('Uploaded size does not match')
let sum=obj.checksums&&obj.checksums.sha256?hex(obj.checksums.sha256):null
const typed=IMG[ext(u.name)]||INLINE_MEDIA[ext(u.name)]
if(typed){
const head=await c.env.FILES.get(u.r2_key,{range:{offset:0,length:16}})
if(head&&!sniff(await head.arrayBuffer(),u.mime))await bad('File content does not match its type')
}
const id=newId('f')
const claim=u.sha256&&sum&&u.sha256!==sum
if(claim)await bad('Checksum mismatch')
await c.env.DB.batch([
c.env.DB.prepare('insert into files(id,owner_id,kind,room,server_id,r2_key,name,mime,size,sha256,verified,created_at) values(?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,u.owner_id,u.kind,u.room,u.server_id,u.r2_key,u.name,u.mime,u.size,u.sha256||sum,u.sha256&&sum?1:0,now()),
c.env.DB.prepare('delete from uploads where id=?').bind(u.id)
])
return json({id,name:u.name,mime:u.mime,size:u.size,kind:u.kind,sha256:u.sha256||sum},201)
})

r.add('DELETE','/api/upload/:id',async c=>{
const u=await pending(c)
try{await c.env.FILES.resumeMultipartUpload(u.r2_key,u.upload_id).abort()}catch(x){}
await c.env.DB.prepare('delete from uploads where id=?').bind(u.id).run()
return json({ok:true})
})

r.add('GET','/api/files/:id',async c=>{
const f=await c.env.DB.prepare('select * from files where id=?').bind(c.p.id).first()
if(!f)fail(404,'File not found')
let cache='public, max-age=604800, immutable'
if(!PUBLIC_KINDS.has(f.kind)){
const{sessionUser}=await import('./auth.js')
const u=c.user||await sessionUser(c.env,c.req)
if(!u)fail(401,'Not signed in')
if(f.kind==='attachment'){
await resolveRoom(c.env,f.room,u.id)
if(f.message_id){
const m=await c.env.DB.prepare('select deleted_at from messages where id=?').bind(f.message_id).first()
if(!m||m.deleted_at)fail(404,'File not found')
}else if(f.owner_id!==u.id)fail(404,'File not found')
}else if(f.owner_id!==u.id)fail(404,'File not found')
cache='private, max-age=3600'
}
const range=c.req.headers.get('range')
const obj=await c.env.FILES.get(f.r2_key,range?{range:c.req.headers}:undefined)
if(!obj)fail(404,'File not found')
const inline=f.mime.startsWith('image/')||f.mime.startsWith('audio/')||f.mime.startsWith('video/')||f.mime==='application/pdf'
const h={'content-type':f.mime,'cache-control':cache,'accept-ranges':'bytes','x-content-type-options':'nosniff','content-security-policy':"sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:",'content-disposition':`${inline?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(f.name)}`,'cross-origin-resource-policy':'same-origin'}
if(obj.range&&range){
const o=obj.range.offset??0
const l=obj.range.length??f.size-o
h['content-range']=`bytes ${o}-${o+l-1}/${f.size}`
h['content-length']=String(l)
return new Response(obj.body,{status:206,headers:h})
}
h['content-length']=String(f.size)
return new Response(obj.body,{headers:h})
},{auth:false})

r.add('DELETE','/api/files/:id',async c=>{
const f=await c.env.DB.prepare('select * from files where id=?').bind(c.p.id).first()
if(!f)fail(404,'File not found')
let allowed=f.owner_id===c.user.id
if(!allowed&&f.kind==='attachment'){
const rr=await resolveRoom(c.env,f.room,c.user.id)
allowed=rr.kind==='channel'&&!!(rr.perms&P.MANAGE_MESSAGES)
}
if(!allowed)fail(403,'You cannot delete this file')
await c.env.FILES.delete(f.r2_key)
await c.env.DB.prepare('delete from files where id=?').bind(f.id).run()
if(f.message_id&&f.room){
const hub=f.room.startsWith('ch_')?'s_'+(await c.env.DB.prepare('select server_id from channels where id=?').bind(f.room).first())?.server_id:null
if(hub)c.pub(hub,{t:'att.delete',room:f.room,message_id:f.message_id,file_id:f.id},{ch:f.room})
}
return{ok:true}
})

r.add('GET','/api/rooms/:room/files',async c=>{
const rr=await resolveRoom(c.env,c.p.room,c.user.id)
const before=clamp(c.url.searchParams.get('before'),9e15,0,9e15)
const rows=(await c.env.DB.prepare("select f.id,f.name,f.mime,f.size,f.created_at,f.message_id,f.owner_id from files f join messages m on m.id=f.message_id and m.deleted_at is null where f.room=? and f.kind='attachment' and f.created_at<? order by f.created_at desc limit ?").bind(rr.room,before,clamp(c.url.searchParams.get('limit'),30,1,100)).all()).results
return{files:rows}
})

r.add('GET','/api/unfurl',async c=>{
limit('unf:'+c.user.id,30,60000)
let u
try{u=new URL(str(c.url.searchParams.get('url'),8,2000,'URL'))}catch{fail(400,'Invalid URL')}
if(!['http:','https:'].includes(u.protocol)||u.username||u.password)fail(400,'Invalid URL')
const host=u.hostname.toLowerCase()
if(host==='localhost'||host.endsWith('.local')||host.endsWith('.internal')||/^(\d+\.){3}\d+$/.test(host)||host.includes(':')||!host.includes('.'))fail(400,'URL not allowed')
const cacheKey=new Request('https://unfurl.cache/'+encodeURIComponent(u.href))
const hit=await caches.default.match(cacheKey)
if(hit)return hit
const ctl=new AbortController()
const timer=setTimeout(()=>ctl.abort(),4000)
let out={url:u.href,title:'',description:'',site:host}
try{
const res=await fetch(u.href,{signal:ctl.signal,redirect:'follow',headers:{'user-agent':'ParleyLinkPreview/1.0','accept':'text/html'}})
const ct=res.headers.get('content-type')||''
if(res.ok&&ct.includes('text/html')){
const reader=res.body.getReader()
let html='',n=0
const dec=new TextDecoder()
while(n<200000){const{done,value}=await reader.read();if(done)break;n+=value.length;html+=dec.decode(value,{stream:true});if(html.includes('</head>'))break}
reader.cancel().catch(()=>{})
const meta=(k)=>{const m=html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']*)["']`,'i'))||html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${k}["']`,'i'));return m?m[1]:''}
const t=html.match(/<title[^>]*>([^<]*)<\/title>/i)
const dec2=s=>s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").slice(0,300)
out.title=dec2(meta('og:title')||(t?t[1].trim():''))
out.description=dec2(meta('og:description')||meta('description'))
out.site=dec2(meta('og:site_name')||host)
}
}catch{}finally{clearTimeout(timer)}
const resp=new Response(JSON.stringify(out),{headers:{'content-type':'application/json','cache-control':'public, max-age=3600'}})
c.ec.waitUntil(caches.default.put(cacheKey,resp.clone()))
return resp
})
}
