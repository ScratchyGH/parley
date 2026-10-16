import http from'node:http'
import{DatabaseSync}from'node:sqlite'
import crypto from'node:crypto'
import fs from'node:fs'
const port=parseInt(process.argv[2]||'8788')
const db=new DatabaseSync(':memory:')
db.exec('pragma foreign_keys=on')
const b64=u=>Buffer.from(u).toString('base64')
const toArg=a=>a.type==='null'?null:a.type==='integer'?Number(a.value):a.type==='float'?Number(a.value):a.type==='blob'?new Uint8Array(Buffer.from(a.base64,'base64')):a.value
const toVal=v=>v===null?{type:'null'}:typeof v==='bigint'?{type:'integer',value:String(v)}:typeof v==='number'?(Number.isInteger(v)?{type:'integer',value:String(v)}:{type:'float',value:v}):v instanceof Uint8Array?{type:'blob',base64:b64(v)}:{type:'text',value:String(v)}
function exec(stmt){
const q=db.prepare(stmt.sql)
const rows=q.all(...(stmt.args||[]).map(toArg))
const ch=db.prepare('select changes() c,last_insert_rowid() r').get()
const cols=rows.length?Object.keys(rows[0]).map(name=>({name})):[]
return{cols,rows:rows.map(r=>cols.map(c=>toVal(r[c.name]))),affected_row_count:Number(ch.c),last_insert_rowid:String(ch.r)}
}
const ok=(r,t)=>({type:'ok',response:{type:t,result:r}})
const bad=e=>({type:'error',error:{message:String(e.message)}})
function cond(c,res,errs){
if(!c)return true
if(c.type==='ok')return res[c.step]!==null&&res[c.step]!==undefined
if(c.type==='error')return!!errs[c.step]
if(c.type==='not')return!cond(c.cond,res,errs)
return true
}
function pipeline(reqs){
const out=[]
for(const r of reqs){
try{
if(r.type==='execute')out.push(ok(exec(r.stmt),'execute'))
else if(r.type==='sequence'){db.exec(r.sql);out.push({type:'ok',response:{type:'sequence'}})}
else if(r.type==='batch'){
const res=[],errs=[]
r.batch.steps.forEach((s,i)=>{
if(!cond(s.condition,res,errs)){res.push(null);errs.push(null);return}
try{res.push(exec(s.stmt));errs.push(null)}catch(e){res.push(null);errs.push({message:e.message})}
})
out.push({type:'ok',response:{type:'batch',result:{step_results:res,step_errors:errs}}})
}else out.push({type:'ok',response:{type:'close'}})
}catch(e){out.push(bad(e))}
}
return out
}
const objs=new Map()
const docs=new Map()
const{privateKey,publicKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048})
const pubPem=publicKey.export({type:'spki',format:'pem'})
let authed=0
const read=req=>new Promise(r=>{const a=[];req.on('data',d=>a.push(d));req.on('end',()=>r(Buffer.concat(a)))})
http.createServer(async(req,res)=>{
const u=new URL(req.url,'http://x')
const body=await read(req)
const send=(s,o,h={})=>{res.writeHead(s,{'content-type':'application/json',...h});res.end(o===undefined?'':Buffer.isBuffer(o)?o:JSON.stringify(o))}
try{
if(u.pathname==='/t/v2/pipeline'){
if(req.headers.authorization!=='Bearer turso-test')return send(401,{error:'auth'})
return send(200,{results:pipeline(JSON.parse(body).requests)})
}
if(u.pathname.startsWith('/sb/storage/v1/object/')){
if(req.headers.authorization!=='Bearer sb-test')return send(401,{error:'auth'})
let p=decodeURIComponent(u.pathname.slice('/sb/storage/v1/object/'.length))
const authedGet=p.startsWith('authenticated/')
if(authedGet)p=p.slice(14)
if(req.method==='POST'||req.method==='PUT'){objs.set(p,body);return send(200,{Key:p})}
if(req.method==='DELETE'){objs.delete(p);return send(200,{})}
if(req.method==='GET'&&authedGet){
const o=objs.get(p)
if(!o)return send(404,{error:'not found'})
const m=/^bytes=(\d+)-(\d+)$/.exec(req.headers.range||'')
if(m){const a=+m[1],b=Math.min(+m[2],o.length-1);return send(206,o.subarray(a,b+1),{'content-type':'application/octet-stream'})}
return send(200,o,{'content-type':'application/octet-stream'})
}
}
if(u.pathname==='/token'){
const f=new URLSearchParams(body.toString())
const[h,c,s]=f.get('assertion').split('.')
const v=crypto.verify('RSA-SHA256',Buffer.from(h+'.'+c),publicKey,Buffer.from(s,'base64url'))
if(!v)return send(401,{error:'bad jwt'})
authed++
return send(200,{access_token:'fb-test',expires_in:3600})
}
if(u.pathname.startsWith('/fs/v1/')){
if(req.headers.authorization!=='Bearer fb-test')return send(401,{error:'auth'})
const rest=decodeURIComponent(u.pathname.slice(7))
if(rest.endsWith(':commit')){
for(const w of JSON.parse(body).writes){
if(w.update)docs.set(w.update.name,w.update.fields)
if(w.delete)docs.delete(w.delete)
}
return send(200,{writeResults:[]})
}
if(rest.endsWith(':batchGet')){
return send(200,JSON.parse(body).documents.map(n=>docs.has(n)?{found:{name:n,fields:docs.get(n)}}:{missing:n}))
}
if(req.method==='GET'){
const d=docs.get(rest)
return d?send(200,{name:rest,fields:d}):send(404,{error:'nf'})
}
}
send(404,{error:'no route '+u.pathname})
}catch(e){send(500,{error:String(e.message)})}
}).listen(port,'127.0.0.1',()=>{
fs.writeFileSync(process.argv[3]||'/tmp/fakes.key',privateKey.export({type:'pkcs8',format:'pem'}))
console.log('fakes up',port)
})
process.on('SIGTERM',()=>{console.log('stats docs',docs.size,'objs',objs.size,'tokens',authed);process.exit(0)})
