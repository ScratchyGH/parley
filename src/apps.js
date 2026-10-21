let cache={at:0,v:null}
const REPO='ScratchyGH/parley'
export default function(r){
r.add('GET','/api/app/downloads',async c=>{
if(cache.v&&Date.now()-cache.at<600000)return cache.v
let out={windows:null,android:null}
try{
const res=await fetch('https://api.github.com/repos/'+REPO+'/releases/tags/apps',{headers:{accept:'application/vnd.github+json','user-agent':'parley'},signal:AbortSignal.timeout(8000)})
if(res.ok){
const j=await res.json()
for(const a of j.assets||[]){
const info={url:a.browser_download_url,size:a.size,updated:a.updated_at}
if(a.name==='Parley-Setup.exe')out.windows=info
if(a.name==='Parley.apk')out.android=info
}
}
}catch{}
cache={at:Date.now(),v:out}
return out
})
}
