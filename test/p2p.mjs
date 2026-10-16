import{webcrypto,createHash,randomBytes}from'node:crypto'
import{IDBFactory,IDBKeyRange}from'fake-indexeddb'
globalThis.IDBKeyRange=IDBKeyRange
import{Engine}from'../public/js/p2p/core.js'
import{MemoryStore,IdbStore}from'../public/js/p2p/store.js'
import{histAddon}from'../public/js/p2p/hist.js'
import{swarmAddon}from'../public/js/p2p/swarm.js'
import{makeVerifier,canon}from'../public/js/p2p/verify.js'
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
let pass=0,failn=0
const ok=(c,n)=>{if(c)pass++;else failn++;console.log((c?'  ok  ':'FAIL  ')+n)}
const b64u=b=>Buffer.from(b).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
const kp=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify'])
const jwk=await webcrypto.subtle.exportKey('jwk',kp.publicKey)
const verify=await makeVerifier(jwk.x)
const signed=async(room,i,content)=>{
const m={id:'0abc'+String(i).padStart(5,'0')+'xxxxxxxx',room,author:{id:'u_a',username:'a',display_name:'A'},content:content??'message number '+i,created_at:1700000000000+i,edited_at:null}
m.sig=b64u(await webcrypto.subtle.sign('Ed25519',kp.privateKey,Buffer.from(canon(m))))
return m
}
function link(){return{onmessage:null,peer:null,send(u){const p=this.peer;const c=u.slice();setTimeout(()=>p.onmessage&&p.onmessage(c),0)},buffered:()=>0,drain:()=>Promise.resolve(),close(){}}}
function pairLinks(){const a=link(),b=link();a.peer=b;b.peer=a;return[a,b]}
class Net{
constructor(){this.rv=new Map();this.clients=new Map();this.n=0;this.members=new Map()}
client(uid,allowed){
const cid='c'+(++this.n)
const net=this
const c={cid,uid,engine:null,joined:new Set()}
c.sendHub=m=>{
setTimeout(()=>{
if(m.t==='p2p.join'){
if(!allowed.includes(m.ch))return
c.joined.add(m.ch)
const peers=[...net.clients.values()].filter(x=>x!==c&&x.joined.has(m.ch)).map(x=>({cid:x.cid,uid:x.uid}))
c.engine.onHub({t:'p2p.peers',ch:m.ch,peers})
for(const x of net.clients.values())if(x!==c&&x.joined.has(m.ch))x.engine.onHub({t:'p2p.peer',ch:m.ch,cid,uid,up:true})
}else if(m.t==='p2p.leave'){
c.joined.delete(m.ch)
for(const x of net.clients.values())if(x!==c&&x.joined.has(m.ch))x.engine.onHub({t:'p2p.peer',ch:m.ch,cid,uid,up:false})
}else if(m.t==='p2p.sig'){
if(!c.joined.has(m.ch))return
const to=net.clients.get(m.to)
if(to&&to.joined.has(m.ch))to.engine.onHub({t:'p2p.sig',ch:m.ch,from:cid,uid,data:m.data})
}
},1)
}
net.clients.set(cid,c)
return c
}
connectFor(c){
return(info,{initiator,signal})=>{
const key=[c.cid,info.cid].sort().join('|')
let r=this.rv.get(key)
if(!r){const[c0,c1]=pairLinks();const[b0,b1]=pairLinks();const[b2,b3]=pairLinks();r={ctl:[c0,c1],bulk:[[b0,b2],[b1,b3]],open:[null,null],opened:[null,null]};this.rv.set(key,r)}
const side=initiator?0:1
const opened=new Promise(res=>{r.open[side]=res})
const tr={ctl:r.ctl[side],bulk:r.bulk[side],opened,onclose:null,close(){},signal:d=>{
if(d.offer){signal({answer:1});r.open[side]()}
if(d.answer)r.open[side]()
}}
if(initiator)signal({offer:1})
return tr
}
}
}
async function node(net,uid,allowed,cfg){
const c=net.client(uid,allowed)
const store=new MemoryStore()
const e=new Engine({me:{uid,cid:c.cid},sendHub:c.sendHub,connect:net.connectFor(c),cfg})
c.engine=e
const hist=histAddon({store,verify})
const sw=swarmAddon({store})
e.use(hist).use(sw)
e.start()
return{c,e,store,hist:hist.api,sw:sw.api}
}
const net=new Net()
const A=await node(net,'ua',['ch_x']),B=await node(net,'ub',['ch_x']),C=await node(net,'uc',['ch_x']),D=await node(net,'ud',['ch_y'])
for(const n of[A,B,C])n.e.join('ch_x')
D.e.join('ch_y')
await sleep(120)
ok(A.e.ready().length===2&&B.e.ready().length===2&&C.e.ready().length===2,'three peers form a full mesh and complete the hello handshake')
ok(D.e.ready().length===0,'peer in another channel is not connected')
ok(A.e.ready()[0].caps.hist===1&&A.e.ready()[0].caps.swarm===1&&A.e.ready()[0].caps.zip===1,'addon capabilities negotiated')
D.e.join('ch_x')
await sleep(60)
ok(D.e.ready().length===0,'hub-denied join yields no peers')
const room='ch_x'
const msgs=[];for(let i=1;i<=120;i++)msgs.push(await signed(room,i))
await A.hist.record(room,msgs,[msgs[0].id,msgs[119].id])
const pg=await B.hist.page(B.e,room,msgs[100].id,50)
ok(pg&&pg.msgs.length===50&&pg.msgs[49].id===msgs[99].id&&pg.msgs[0].id===msgs[50].id,'history page served by a peer, newest-first window, ascending order')
ok(pg.complete&&pg.from==='ua','page marked complete and attributed to the serving peer')
ok(B.hist.stats.pages===1,'stats count the peer page')
const pg2=await B.hist.page(B.e,room,msgs[30].id,50)
ok(pg2&&pg2.msgs.length===30&&!pg2.complete&&pg2.msgs[0].id===msgs[0].id,'partial page returned at segment edge')
ok(await B.hist.page(B.e,room,msgs[0].id,50)===null,'no page when before is at/below the covered range')
ok(await B.hist.page(B.e,'ch_other',msgs[100].id,50)===null,'room outside shared channels is refused')
await C.hist.record(room,msgs.map((m,i)=>i===60?{...m,content:'forged'}:m),[msgs[0].id,msgs[119].id])
await A.store.clear()
const pg3=await B.hist.page(B.e,room,msgs[100].id,50)
ok(pg3===null,'a page containing a forged message is rejected')
ok(B.e.ready().find(p=>p.uid==='uc').bad>=1&&B.hist.stats.rejected>=1,'forging peer is flagged')
await A.hist.record(room,msgs,[msgs[0].id,msgs[119].id])
const pg4=await B.hist.page(B.e,room,msgs[100].id,50)
ok(pg4&&pg4.msgs.every(m=>m.content!=='forged'),'honest peer still wins when another peer forges')
const withPoll=msgs.map((m,i)=>i===80?{...m,poll:{question:'q'}}:m)
await A.store.clear();await A.hist.record(room,withPoll,[msgs[0].id,msgs[119].id])
const pg5=await B.hist.page(B.e,room,msgs[100].id,50)
ok(pg5&&pg5.msgs[0].id===msgs[81].id&&!pg5.complete,'peer page stops before poll messages so tallies are never faked')
await A.hist.remove(room,msgs[90].id)
await A.hist.record(room,[],[msgs[0].id,msgs[119].id])
const pg6=await B.hist.page(B.e,room,msgs[100].id,50)
ok(!pg6||!pg6.msgs.some(m=>m.id===msgs[90].id),'deleted message is dropped from the served cache')

for(const n of[A,B,C])for(const p of n.e.ready())p.bad=0
const size=3*1048576+12345
const data=randomBytes(size)
const sha=createHash('sha256').update(data).digest('hex')
const meta={id:'f_1',room,name:'x.bin',mime:'application/octet-stream',size,sha256:sha}
await A.store.putBlob(meta,new Blob([data]))
let srvBytes=0
const server=async(a,b)=>{srvBytes+=b-a;await sleep(30);return new Uint8Array(data.subarray(a,b))}
let prog=0
const r1=await B.sw.download(meta,{server,onProgress:p=>prog=p})
ok(Buffer.from(await r1.blob.arrayBuffer()).equals(data),'swarm download reassembles the exact bytes')
ok(r1.peerBytes>0&&r1.peerBytes+r1.serverBytes===size,'peer contributed bytes: '+r1.peerBytes+' of '+size+' (server '+r1.serverBytes+')')
ok(prog===1,'progress reaches 100%')
ok(A.sw.stats.served>0,'seeder counted served bytes')
await sleep(30)
const r2=await B.sw.download(meta,{server})
ok(r2.source==='cache','second download is served from the local cache')
const evil=new Uint8Array(data);for(let o=1000;o<size;o+=1048576)evil[o]^=0xff
const meta2={...meta,id:'f_2'}
await A.store.clear();await C.store.putBlob(meta2,new Blob([evil]))
srvBytes=0
const r3=await B.sw.download(meta2,{server:async(a,b)=>{srvBytes+=b-a;await sleep(300);return new Uint8Array(data.subarray(a,b))}})
ok(Buffer.from(await r3.blob.arrayBuffer()).equals(data),'corrupted peer data is detected and the correct file is fetched from the server')
ok(B.sw.stats.mismatch===1&&B.sw.stats.fallbacks===1&&srvBytes>=size,'mismatch triggers a full server fallback')
const meta3={...meta,id:'f_3',room:'ch_other'}
await C.store.putBlob(meta3,new Blob([data]))
const r4=await B.sw.download(meta3,{server})
ok(r4.peerBytes===0,'blobs from rooms the requester does not share are never served')
const small={...meta,id:'f_4',size:1000,sha256:createHash('sha256').update(data.subarray(0,1000)).digest('hex')}
const r5=await B.sw.download(small,{server})
ok(r5.blob.size===1000,'small file downloads from server')
const noHash={...meta,id:'f_5',sha256:null}
await A.store.putBlob({...noHash,sha256:'x'},new Blob([data]))
const r6=await B.sw.download(noHash,{server})
ok(r6.peerBytes===0,'files without a recorded hash never use peers')
const ac=new AbortController()
const meta7={...meta,id:'f_7'}
await A.store.putBlob(meta7,new Blob([data]))
const pr=B.sw.download(meta7,{server:async(a,b)=>{await sleep(50);return new Uint8Array(data.subarray(a,b))},signal:ac.signal,usePeers:false})
setTimeout(()=>ac.abort(),20)
let aborted=false;try{await pr}catch{aborted=true}
ok(aborted,'download can be cancelled')
A.e.stop()
await sleep(60)
ok(B.e.ready().length===1,'peer removed after the other side leaves')

for(const[name,mk]of[['memory',()=>new MemoryStore(1000000)],['indexeddb',()=>new IdbStore(new IDBFactory(),'t'+Math.random(),1000000)]]){
const s=mk()
const ms=[];for(let i=1;i<=60;i++)ms.push(await signed('r1',i))
await s.putMsgs('r1',ms.slice(10,50),[ms[10].id,ms[49].id])
await s.putMsgs('r1',ms.slice(40,60),[ms[40].id,ms[59].id])
const sg=await s.segs('r1')
ok(sg.length===1&&sg[0][0]===ms[10].id&&sg[0][1]===ms[59].id,name+': overlapping segments merge')
const p=await s.pageBefore('r1',ms[55].id,20)
ok(p.msgs.length===20&&p.msgs[19].id===ms[54].id&&p.complete,name+': page within merged segment')
ok(await s.pageBefore('r1',ms[5].id,20)===null,name+': uncovered range returns null')
const p2=await s.pageBefore('r1',ms[20].id,20)
ok(p2.msgs.length===10&&!p2.complete&&!p2.end,name+': partial page at segment lo')
await s.putMsgs('r1',[ms[0]],['', ms[0].id])
const p3=await s.pageBefore('r1',ms[5].id,20)
ok(p3===null,name+': segment from start with no messages below returns null')
await s.putMsgs('r2',ms.slice(0,5),['',ms[4].id])
const p4=await s.pageBefore('r2',ms[4].id,20)
ok(p4&&p4.msgs.length===4&&p4.end&&p4.complete,name+': reaching start of history is flagged')
await s.delMsg('r1',ms[30].id)
ok((await s.segs('r1')).length===3,name+': delete splits coverage so the hole is never served')
await s.putBlob({id:'a',room:'r1',size:600000},new Blob([new Uint8Array(600000)]))
await s.putBlob({id:'b',room:'r1',size:600000},new Blob([new Uint8Array(600000)]))
ok(!(await s.hasBlob('a'))&&(await s.hasBlob('b')),name+': oldest blob evicted over quota')
ok((await s.roomOfBlob('b'))==='r1',name+': blob room lookup')
const st=await s.stats()
ok(st.files===1&&st.messages>0,name+': stats')
await s.clear()
ok((await s.stats()).files===0,name+': clear')
}
console.log(`\n${pass} passed, ${failn} failed`)
process.exit(failn?1:0)
