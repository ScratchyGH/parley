const KEEP=['id','room','author','content','created_at','edited_at','sig','attachments','reply','thread','pinned']
export function histAddon(o){
const{store,verify}=o
const stats={pages:0,msgs:0,served:0,rejected:0}
let serve=o.serve!==false
const clean=m=>{const x={};for(const k of KEEP)if(k in m)x[k]=m[k];x.reactions=[];x.p2p=true;return x}
const api={
stats,
setServe(v){serve=!!v},
async record(room,msgs,seg){
const ok=msgs.filter(m=>m&&m.sig&&!m.pending&&!m.failed)
await store.putMsgs(room,ok.map(m=>({...m,reactions:[],poll:m.poll?{}:null})),seg)
},
async remove(room,id){await store.delMsg(room,id)},
async page(engine,room,before,limit=50){
const peers=engine.best(3,p=>p.caps.hist&&engine.canServe(p,room)&&p.bad<3)
if(!peers.length)return null
const attempt=async p=>{
const r=await p.request('hist.page',{room,before,limit},4000)
if(!r||!Array.isArray(r.msgs)||!r.msgs.length||r.msgs.length>limit)throw new Error('empty')
let prev=''
for(const m of r.msgs){
if(m.room!==room||!(m.id<before)||m.id<=prev)throw new Error('bad order')
prev=m.id
if(!await verify(m)){p.bad++;stats.rejected++;throw new Error('bad signature')}
}
return{msgs:r.msgs.map(m=>({...m,reactions:[],p2p:true,poll:null})),lo:String(r.lo||''),end:!!r.end,complete:!!r.complete,from:p.uid}
}
try{
const res=await Promise.any(peers.map(attempt))
stats.pages++;stats.msgs+=res.msgs.length
return res
}catch{return null}
}
}
return{
name:'hist',version:1,api,
handlers:{
'hist.page':async(peer,d)=>{
if(!serve)throw new Error('disabled')
const eng=api.engine
if(!d||typeof d.room!=='string'||typeof d.before!=='string'||!eng.canServe(peer,d.room))throw new Error('denied')
const limit=Math.min(100,Math.max(1,parseInt(d.limit)||50))
const pg=await store.pageBefore(d.room,d.before,limit)
if(!pg)throw new Error('not cached')
let msgs=pg.msgs
let complete=pg.complete,end=pg.end
const cut=[...msgs].reverse().findIndex(m=>m.poll)
if(cut>=0){msgs=msgs.slice(msgs.length-cut);complete=false;end=false}
if(!msgs.length)throw new Error('not cached')
stats.served++
return{msgs:msgs.map(clean),lo:pg.lo,end,complete}
}
},
init(engine){api.engine=engine}
}
}
