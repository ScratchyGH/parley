let cache={at:0,v:null,ok:false}
const REPO='ScratchyGH/parley'
export default function(r){
r.add('GET','/api/app/downloads',async c=>{
if(cache.v&&Date.now()-cache.at<(cache.ok?600000:60000))return cache.v
let out={windows:null,portable:null,deb:null,mac:null,linux:null,android:null,ubuntutouch:null}
let ok=false
try{
const res=await fetch('https://api.github.com/repos/'+REPO+'/releases/tags/apps',{headers:{accept:'application/vnd.github+json','user-agent':'parley'},signal:AbortSignal.timeout(8000)})
if(res.ok){
ok=true
const j=await res.json()
for(const a of j.assets||[]){
const info={url:a.browser_download_url,size:a.size,updated:a.updated_at}
if(a.name==='Parley-Setup.exe')out.windows=info
if(a.name==='Parley-Portable.exe')out.portable=info
if(a.name==='Parley.deb')out.deb=info
if(a.name==='Parley.dmg')out.mac=info
if(a.name==='Parley.AppImage')out.linux=info
if(a.name==='Parley.click')out.ubuntutouch=info
if(a.name==='Parley.apk')out.android=info
}
}
}catch{}
if(!ok){
const B='https://github.com/'+REPO+'/releases/download/apps/'
out={windows:{url:B+'Parley-Setup.exe',size:0},portable:{url:B+'Parley-Portable.exe',size:0},deb:{url:B+'Parley.deb',size:0},mac:{url:B+'Parley.dmg',size:0},ubuntutouch:{url:B+'Parley.click',size:0},linux:{url:B+'Parley.AppImage',size:0},android:{url:B+'Parley.apk',size:0}}
}
cache={at:Date.now(),v:out,ok}
return out
})
}
