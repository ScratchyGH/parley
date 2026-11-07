import{h,toast,dialog,GET}from'./util.js'
const P=()=>window.Capacitor?.Plugins?.Updater
let shown=false,last=0
export function appUpdateDialog(d,preview){
const body=h('div',{class:'bd'},h('p',null,'A new version of the Parley app is ready. It downloads here and installs in one tap.'),h('p',{class:'hint'},'Version '+(d.code||'new')+(preview?' (preview only, nothing is downloaded)':'')))
return dialog('Parley app update',body,{footer:close=>[
h('button',{class:'btn',type:'button',on:{click:close}},'Later'),
h('button',{class:'btn pri',type:'button',on:{click:async()=>{
if(preview){close();toast('Preview only','ok');return}
close()
const u=P()
if(!u){open(d.url,'_system');return}
toast('Downloading the update…')
try{await u.install({url:d.url})}catch(e){const m=String(e?.message||e);toast(m==='allow'?'Allow installs from Parley, then tap Update again':'Update failed. Try again later.','err')}
}}},'Update now')]})
}
export async function checkAppUpdate(force){
const u=P()
if(!u||(shown&&!force)||Date.now()-last<600000&&!force)return
last=Date.now()
try{
const[me,d]=await Promise.all([u.info(),GET('/api/app/downloads')])
const a=d.android
if(a&&d.androidCode&&Number(me.code)<d.androidCode){shown=true;appUpdateDialog({code:d.androidCode,url:a.url})}
}catch{}
}
