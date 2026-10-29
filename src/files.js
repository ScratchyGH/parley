import{hashBlocked}from'./legal.js'
import{boostMb}from'./pars.js'
import{fail,now,newId,limit,str,clamp,body,hex,json}from'./util.js'
import{resolveRoom,loadMember,P,need}from'./perms.js'
import{place}from'./store.js'
import{imageExplicit,filterOn,explicitText}from'./safety.js'

const IMG={png:'image/png',apng:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',avif:'image/avif',jxl:'image/jxl',heic:'image/heic',heif:'image/heif',bmp:'image/bmp',tif:'image/tiff',tiff:'image/tiff',ico:'image/x-icon'}
const INLINE_MEDIA={mp3:'audio/mpeg',weba:'audio/webm',mid:'audio/midi',midi:'audio/midi',aif:'audio/aiff',aiff:'audio/aiff',m4b:'audio/mp4',ogg:'audio/ogg',oga:'audio/ogg',wav:'audio/wav',m4a:'audio/mp4',flac:'audio/flac',mp4:'video/mp4',m4v:'video/mp4',ogv:'video/ogg','3gp':'video/3gpp',webm:'video/webm',mov:'video/quicktime',mkv:'video/x-matroska',opus:'audio/ogg',aac:'audio/aac',pdf:'application/pdf'}
const DOWNLOAD={doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',ppt:'application/vnd.ms-powerpoint',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',odt:'application/vnd.oasis.opendocument.text',ods:'application/vnd.oasis.opendocument.spreadsheet',odp:'application/vnd.oasis.opendocument.presentation',rtf:'application/rtf',epub:'application/epub+zip',zip:'application/zip',rar:'application/vnd.rar','7z':'application/x-7z-compressed',tar:'application/x-tar',gz:'application/gzip',tgz:'application/gzip',bz2:'application/x-bzip2',xz:'application/x-xz',zst:'application/zstd',ttf:'font/ttf',otf:'font/otf',woff:'font/woff',woff2:'font/woff2',stl:'model/stl',glb:'model/gltf-binary',gltf:'model/gltf+json',obj:'model/obj','3mf':'model/3mf',wma:'audio/x-ms-wma',avi:'video/x-msvideo',wmv:'video/x-ms-wmv',psd:'image/vnd.adobe.photoshop',sqlite:'application/vnd.sqlite3',db:'application/octet-stream',iso:'application/x-iso9660-image',dmg:'application/x-apple-diskimage',torrent:'application/x-bittorrent',mcpack:'application/zip',mcworld:'application/zip',mrpack:'application/zip'}
const BLOCKED=new Set(['svg','html','htm','xhtml','xml'])
const PUBLIC_KINDS=new Set(['avatar','banner','server_icon','server_banner','server_bg','conv_icon','emoji','sticker'])
const KINDS=['attachment','avatar','banner','server_icon','server_banner','server_bg','conv_icon','emoji','sticker']
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
if(type==='audio/mpeg')return at(0,'ID3')||(u[0]===0xff&&(u[1]&0xe0)===0xe0)
if(type==='audio/ogg'||type==='video/ogg')return at(0,'OggS')
if(type==='audio/wav')return at(0,'RIFF')&&at(8,'WAVE')
if(type==='audio/flac')return at(0,'fLaC')
if(type==='audio/midi')return at(0,'MThd')
if(type==='application/zip')return at(0,'PK')
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
let lim=kind==='attachment'?(multi?bigMb:maxMb):(kind==='emoji'?1:kind==='sticker'?2:10)
if(!len||len<1)fail(411,'File size required')
let room=null,serverId=null,scan=false
if(kind==='attachment'){
const rr=await resolveRoom(c.env,roomQ,c.user.id)
need(rr.perms,P.ATTACH,'You cannot attach files here')
room=rr.room
scan=rr.kind==='channel'&&filterOn(rr.m.server)
lim+=await boostMb(c.env,c.user.id,rr.serverId||null)
}else if(kind==='server_icon'||kind==='server_banner'||kind==='server_bg'||kind==='emoji'||(kind==='sticker'&&serverQ)){
serverId=serverQ
const m=await loadMember(c.env,serverId||'',c.user.id)
if(!m)fail(404,'Server not found')
if(!(m.base&P.MANAGE_SERVER)&&!m.admin)fail(403,'You cannot change this server')
}else if(kind==='conv_icon'){
room=roomQ
const rr=await resolveRoom(c.env,room,c.user.id)
if(rr.kind!=='dm'||rr.conv.type!=='group')fail(400,'Not a group conversation')
}
if(len>lim*1048576)fail(413,`File is larger than the ${lim} MB limit`)
const quota=(parseInt(c.env.USER_QUOTA_MB)||1024)*1048576
const used=await c.env.DB.prepare('select coalesce((select sum(size) from files where owner_id=?1),0)+coalesce((select sum(size) from uploads where owner_id=?1),0) s').bind(c.user.id).first()
if(used.s+len>quota)fail(413,'You have reached your storage quota. Delete some uploads to free space.')
let mime='application/octet-stream'
if(IMG[e])mime=IMG[e]
else if(kind!=='attachment')fail(415,'Only images are allowed here')
else if(INLINE_MEDIA[e])mime=INLINE_MEDIA[e]
else if(TEXT.includes(e))mime='text/plain; charset=utf-8'
else if(DOWNLOAD[e])mime=DOWNLOAD[e]
return{name,mime,room,serverId,scan,typed:!!(IMG[e]||INLINE_MEDIA[e])}
}
const TEXT=['txt','md','json','csv','tsv','log','js','mjs','cjs','ts','jsx','tsx','vue','svelte','py','java','c','cpp','h','hpp','rs','go','css','scss','yml','yaml','toml','ini','cfg','conf','sql','kt','lua','rb','php','cs','swift','dart','scala','hs','ex','exs','clj','r','jl','nix','tex','bib','diff','patch','srt','vtt','ass','lrc','ipynb','graphql','proto','gradle','dockerfile','properties','mcfunction']
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
const look=p.scan&&p.mime.startsWith('image/')&&len>=1500&&len<=3145728
if(look&&explicitText(p.name))fail(422,'This image was blocked by the explicit content filter')
const scanP=look?imageExplicit(c.env,new Uint8Array(buf)):Promise.resolve(false)
const id=newId('f')
const key=place(c.env,`u/${c.user.id}/${id}`,len)
const opts={httpMetadata:{contentType:p.mime}}
if(want)opts.sha256=want
let obj
try{obj=await c.env.FILES.put(key,buf,opts)}catch(x){fail(400,'Checksum mismatch or storage error')}
if(await scanP){await c.env.FILES.delete(key);fail(422,'This image was blocked by the explicit content filter')}
const sum=want||(obj&&obj.checksums&&obj.checksums.sha256?hex(obj.checksums.sha256):null)
if(await hashBlocked(c.env,sum)){await c.env.FILES.delete(key);fail(422,'This file is not allowed on Parley')}
await c.env.DB.prepare('insert into files(id,owner_id,kind,room,server_id,r2_key,name,mime,size,sha256,verified,created_at,scanned) values(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,c.user.id,kind,p.room,p.serverId,key,p.name,p.mime,buf.byteLength,sum,want?1:0,now(),look?1:0).run()
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
const key=place(c.env,`u/${c.user.id}/${id}`,size)
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
try{obj=await mp.complete(list,u.size)}catch(x){fail(400,'Could not assemble the upload. Retry the failed parts.')}
const bad=async m=>{await c.env.FILES.delete(u.r2_key);await c.env.DB.prepare('delete from uploads where id=?').bind(u.id).run();fail(415,m)}
if(obj.size!==u.size)await bad('Uploaded size does not match')
let sum=obj.checksums&&obj.checksums.sha256?hex(obj.checksums.sha256):null
const typed=IMG[ext(u.name)]||INLINE_MEDIA[ext(u.name)]
if(typed){
const head=await c.env.FILES.get(u.r2_key,{range:{offset:0,length:16},size:u.size})
if(head&&!sniff(await head.arrayBuffer(),u.mime))await bad('File content does not match its type')
}
const id=newId('f')
if(await hashBlocked(c.env,sum||u.sha256))await bad('This file is not allowed on Parley')
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
const obj=await c.env.FILES.get(f.r2_key,range?{range:c.req.headers,size:f.size}:{size:f.size})
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

r.add('GET','/api/yt-thumb/:id',async c=>{
limit('yt:'+c.user.id,120,60000)
if(!/^[A-Za-z0-9_-]{11}$/.test(c.p.id))fail(400,'Invalid video id')
const key=new Request('https://yt.cache/'+c.p.id)
const hit=await caches.default.match(key)
if(hit)return hit
const res=await fetch('https://i.ytimg.com/vi/'+c.p.id+'/mqdefault.jpg',{cf:{cacheTtl:86400}})
if(!res.ok||!(res.headers.get('content-type')||'').startsWith('image/jpeg'))fail(404,'No thumbnail')
const buf=await res.arrayBuffer()
if(buf.byteLength>400000)fail(404,'No thumbnail')
const out=new Response(buf,{headers:{'content-type':'image/jpeg','cache-control':'private, max-age=86400','x-content-type-options':'nosniff'}})
c.ec.waitUntil(caches.default.put(key,out.clone()))
return out
})

r.add('GET','/api/unfurl-img',async c=>{
limit('uimg:'+c.user.id,120,60000)
let u
try{u=new URL(str(c.url.searchParams.get('url'),8,2000,'URL'))}catch{fail(400,'Invalid URL')}
const host=u.hostname.toLowerCase()
if(u.protocol!=='https:'||u.username||u.password||host==='localhost'||host.endsWith('.local')||host.endsWith('.internal')||/^(\d+\.){3}\d+$/.test(host)||host.includes(':')||!host.includes('.'))fail(400,'URL not allowed')
const key=new Request('https://uimg.cache/'+encodeURIComponent(u.href))
const hit=await caches.default.match(key)
if(hit)return hit
const res=await fetch(u.href,{redirect:'follow',headers:{'user-agent':'ParleyLinkPreview/1.0',accept:'image/*'},cf:{cacheTtl:86400}})
const ct=(res.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()
if(!res.ok||!/^image\/(png|jpeg|webp|gif|avif)$/.test(ct))fail(404,'No image')
const buf=await res.arrayBuffer()
if(buf.byteLength>6000000)fail(404,'Image too large')
const out=new Response(buf,{headers:{'content-type':ct,'cache-control':'private, max-age=86400','x-content-type-options':'nosniff'}})
c.ec.waitUntil(caches.default.put(key,out.clone()))
return out
})

r.add('GET','/api/unfurl',async c=>{
limit('unf:'+c.user.id,30,60000)
let u
try{u=new URL(str(c.url.searchParams.get('url'),8,2000,'URL'))}catch{fail(400,'Invalid URL')}
if(!['http:','https:'].includes(u.protocol)||u.username||u.password)fail(400,'Invalid URL')
const host=u.hostname.toLowerCase()
if(host==='localhost'||host.endsWith('.local')||host.endsWith('.internal')||/^(\d+\.){3}\d+$/.test(host)||host.includes(':')||!host.includes('.'))fail(400,'URL not allowed')
const cacheKey=new Request('https://unfurl4.cache/'+encodeURIComponent(u.href))
const hit=await caches.default.match(cacheKey)
if(hit)return hit
const ctl=new AbortController()
const timer=setTimeout(()=>ctl.abort(),8000)
let out={url:u.href,title:'',description:'',site:host}
const grab=async ua=>{
const res=await fetch(u.href,{signal:ctl.signal,redirect:'follow',headers:{'user-agent':ua,'accept':'text/html,application/xhtml+xml','accept-language':'en-US,en;q=0.9'}})
const ct=res.headers.get('content-type')||''
if(res.ok&&ct.includes('text/html')){
const reader=res.body.getReader()
let html='',n=0
const dec=new TextDecoder()
const itch=/(^|\.)itch\.io$/.test(host)
while(n<(itch?160000:200000)){const{done,value}=await reader.read();if(done)break;n+=value.length;html+=dec.decode(value,{stream:true});if(itch?/itch\.zone\/html\/[\w\-\/.]+/.test(html):html.includes('</head>'))break}
reader.cancel().catch(()=>{})
const meta=(k)=>{const m=html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']*)["']`,'i'))||html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${k}["']`,'i'));return m?m[1]:''}
const t=html.match(/<title[^>]*>([^<]*)<\/title>/i)
const dec2=s=>s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").slice(0,300)
out.title=dec2(meta('og:title')||(t?t[1].trim():''))
out.description=dec2(meta('og:description')||meta('description'))
out.site=dec2(meta('og:site_name')||host)
const im=meta('og:image')||meta('twitter:image')
if(im)try{const iu=new URL(dec2(im),u.href);if(iu.protocol==='https:'&&iu.hostname.includes('.')&&!/^(\d+\.){3}\d+$/.test(iu.hostname))out.image=iu.href}catch{}
if(itch){const pm=html.match(/https:\/\/[a-z-]+\.itch\.zone\/html\/[\w\-\/.]+/);if(pm)out.play=pm[0]}
}
}
try{
await grab('ParleyLinkPreview/1.0')
if(!out.title)await grab('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36')
if(!out.title&&/(^|\.)(youtube\.com|youtu\.be)$/.test(host)){
const o=await(await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent(u.href),{signal:ctl.signal})).json()
out.title=String(o.title||'').slice(0,300);out.description=String(o.author_name||'').slice(0,300);out.site='YouTube'
}
}catch{}finally{clearTimeout(timer)}
const resp=new Response(JSON.stringify(out),{headers:{'content-type':'application/json','cache-control':'public, max-age='+(out.title?3600:60)}})
c.ec.waitUntil(caches.default.put(cacheKey,resp.clone()))
return resp
})
}
