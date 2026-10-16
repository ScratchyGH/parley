const KEY='parley:prefs'
const DEF={p2p:false,p2pHistory:false,p2pFiles:true,p2pServe:true,p2pRelay:false,cacheMb:256,optimize:'off',optQuality:80,optMaxDim:2560,fastDl:true}
let cur=null
function load(){
if(cur)return cur
let o={}
try{o=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}
cur={...DEF,...o}
return cur
}
export const pref=k=>load()[k]
export function setPref(k,v){
load()[k]=v
try{localStorage.setItem(KEY,JSON.stringify(cur))}catch{}
for(const f of subs)try{f(k,v)}catch{}
}
const subs=new Set()
export const onPref=f=>{subs.add(f);return()=>subs.delete(f)}
