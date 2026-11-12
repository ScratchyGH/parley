import{fail,limit}from'./util.js'
const OK=/^(search|search\/suggestions|resolve|videos|video\/[\w-]{11}|video\/[\w-]{11}\/(related|comments|comments\/summary|transcript|chapters)|channel\/[^/]+|channel\/[^/]+\/(videos|playlists|search)|playlist\/[\w-]+|playlist\/[\w-]+\/videos|shorts\/search|hashtag\/[^/]+)$/
export default function(r){
r.add('GET','/api/partube',async c=>{
if(!c.user.admin)fail(404,'Not found')
limit('partube:'+c.user.id,120,60000)
const p=String(c.url.searchParams.get('p')||'').replace(/^\/+|\/+$/g,'')
if(!OK.test(p))fail(400,'Unsupported ParTube request')
const base=(c.env.YTDIRECT_BASE||'https://ytdirect-api.netlify.app').replace(/\/+$/,'')
const u=new URL(base+'/api/v1/'+p.split('/').map(encodeURIComponent).join('/'))
for(const[k,v]of c.url.searchParams)if(k!=='p'&&/^[\w]{1,24}$/.test(k))u.searchParams.set(k,v.slice(0,600))
let res
try{res=await fetch(u,{headers:{accept:'application/json'},cf:{cacheTtl:60,cacheEverything:true}})}catch{fail(502,'ParTube could not reach the YTDirect API')}
let j
try{j=await res.json()}catch{fail(502,'YTDirect sent an unreadable reply')}
if(!j.success)fail(res.status>=400&&res.status<600?res.status:502,j.error?.message||'YTDirect error')
return j.data
})
r.add('GET','/api/partube/img',async c=>{
if(!c.user.admin)fail(404,'Not found')
limit('partubei:'+c.user.id,600,60000)
let u
try{u=new URL(c.url.searchParams.get('u')||'')}catch{fail(400,'Bad image')}
if(u.protocol!=='https:'||!/^(i\.ytimg\.com|i9\.ytimg\.com|yt3\.ggpht\.com|yt3\.googleusercontent\.com)$/.test(u.hostname))fail(400,'Image host not allowed')
const res=await fetch(u,{cf:{cacheTtl:86400,cacheEverything:true}})
const t=res.headers.get('content-type')||''
if(!res.ok||!/^image\//.test(t))fail(404,'No image')
return new Response(res.body,{headers:{'content-type':t,'cache-control':'private, max-age=86400','x-content-type-options':'nosniff'}})
})
}
