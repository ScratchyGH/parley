export const h=(t,a,...k)=>{
const e=document.createElement(t)
if(a)for(const[n,v]of Object.entries(a)){
if(n==='on')for(const[ev,f]of Object.entries(v))e.addEventListener(ev,f)
else if(n==='class')e.className=v
else if(v===true)e.setAttribute(n,'')
else if(v!==false&&v!=null)e.setAttribute(n,v)
}
for(const c of k.flat())if(c!=null&&c!==false)e.append(c.nodeType?c:document.createTextNode(c))
return e
}
export const api=async(path,body,tok,method)=>{
const r=await fetch(path,{method:method||(body===undefined?'GET':'POST'),headers:{...(body!==undefined?{'content-type':'application/json'}:{}),...(tok?{authorization:'Bearer '+tok}:{})},body:body!==undefined?JSON.stringify(body):undefined})
let j=null
try{j=await r.json()}catch{}
if(!r.ok){const e=new Error((j&&(j.error||j.message))||'Something went wrong');e.status=r.status;throw e}
return j
}
export const mount=(root,...k)=>root.replaceChildren(...k.flat().filter(Boolean))
export const ls={
get(k){try{return localStorage.getItem(k)}catch{return null}},
set(k,v){try{localStorage.setItem(k,v)}catch{}},
del(k){try{localStorage.removeItem(k)}catch{}}
}
