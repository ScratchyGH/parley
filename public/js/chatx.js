import{h,icon,POST,fileUrl,fmtSize,lightbox,saveBlob,toast,fail,fmtRel}from'./util.js'
import{S,noteThread}from'./state.js'
import{displayUrl,displayBlob}from'./codec.js'
import{pref}from'./prefs.js'
import{canSwarm,downloadFile}from'./p2p/index.js'
import{go}from'./nav.js'

const metaOf=(f,m)=>({id:f.id,room:m.room,name:f.name,mime:f.mime,size:f.size,sha256:f.sha256||null})
async function setImg(img,f,m){
const u=fileUrl(f.id)
try{
if(f.size>=1048576&&pref('p2p')&&pref('p2pFiles')&&canSwarm(f)){
const r=await downloadFile(metaOf(f,m))
img.src=await displayBlob(r.blob,f.mime)
return
}
img.src=await displayUrl(u,f.mime)
}catch{
img.src=u
}
}
function fileLink(f,m){
const u=fileUrl(f.id)
const a=h('a',{class:'file',href:u,download:f.name,rel:'noopener'},icon('file'),h('div',{class:'grow'},h('div',null,f.name),h('small',null,fmtSize(f.size))),icon('download','s'))
const prog=a.querySelector('small')
a.addEventListener('click',async e=>{
if(!(f.size>=8388608||pref('p2p')&&pref('p2pFiles'))||!canSwarm(f)||a.dataset.busy)return
e.preventDefault()
a.dataset.busy='1'
try{
const r=await downloadFile(metaOf(f,m),{onProgress:(p,s)=>{prog.textContent=`${Math.round(p*100)}%${s.peerBytes?` · ${fmtSize(s.peerBytes)} from peers`:''}`}})
saveBlob(r.blob,f.name)
prog.textContent=fmtSize(f.size)+(r.peerBytes?` · ${fmtSize(r.peerBytes)} from peers`:'')
}catch(x){
prog.textContent=fmtSize(f.size)
toast(x.message,'err')
location.href=u
}finally{delete a.dataset.busy}
})
return a
}
function textFile(f,m){
const box=h('div',{class:'tfile'})
const pre=h('pre',{class:'tprev',hidden:true})
const btn=h('button',{class:'btn sm',type:'button','aria-expanded':'false',on:{click:async()=>{
if(!pre.hidden){pre.hidden=true;btn.textContent='Preview';btn.setAttribute('aria-expanded','false');return}
btn.disabled=true
try{
if(!pre.dataset.done){
const r=await fetch(fileUrl(f.id),{credentials:'same-origin'})
if(!r.ok)throw new Error('Could not load the file')
pre.textContent=(await r.text()).slice(0,60000)
pre.dataset.done='1'
}
pre.hidden=false
btn.textContent='Hide'
btn.setAttribute('aria-expanded','true')
}catch(e){fail(e)}
btn.disabled=false
}}},'Preview')
box.append(h('div',{class:'row'},fileLink(f,m),btn),pre)
return box
}
export function renderAttachments(m){
const a=h('div',{class:'att'})
for(const f of m.attachments){
const u=fileUrl(f.id)
if(f.mime.startsWith('image/')&&f.mime!=='image/svg+xml'){
const img=h('img',{alt:f.name,loading:'lazy',decoding:'async',title:f.name,on:{click:()=>lightbox(img.currentSrc||img.src)}})
setImg(img,f,m)
a.append(img)
}
else if(f.mime.startsWith('video/'))a.append(h('video',{src:u,controls:true,preload:'metadata','aria-label':f.name}))
else if(f.mime.startsWith('audio/')){const vc=/^voice-clip/i.test(f.name);a.append(h('div',{class:vc?'vclip':null},vc?null:h('div',{class:'hint'},f.name),h('audio',{src:u,controls:true,preload:vc?'metadata':'none'}),vc?h('div',{class:'vsub','aria-label':'Subtitles'},f.transcript||'Transcribing…'):null))}
else if(f.mime.startsWith('text/plain')&&f.size<=262144)a.append(textFile(f,m))
else a.append(fileLink(f,m))
}
return a
}
export function renderPoll(m,onChange){
const p=m.poll
if(!p)return null
const closed=p.closed||(p.closes_at&&p.closes_at<Date.now())
const box=h('div',{class:'poll'})
box.append(h('div',{class:'hint',style:{margin:'0 0 6px'}},icon('list','s'),' Poll',p.multi?' · choose any':' · choose one',closed?' · closed':p.closes_at?' · closes '+fmtRel(p.closes_at):''))
const pick=async idx=>{
let next
if(p.multi)next=p.mine.includes(idx)?p.mine.filter(x=>x!==idx):[...p.mine,idx]
else next=p.mine.includes(idx)?[]:[idx]
try{
const d=await POST(`/api/rooms/${m.room}/messages/${m.id}/vote`,{options:next})
m.poll=d.poll
onChange(m)
}catch(e){fail(e)}
}
for(const o of p.options){
const pct=p.total?Math.round(o.votes/p.total*100):0
const mine=p.mine.includes(o.idx)
const b=h('button',{class:'popt'+(mine?' me':''),disabled:closed,'aria-pressed':String(mine),on:{click:()=>pick(o.idx)}},
h('span',{class:'pbar',style:{width:pct+'%'}}),
h('span',{class:'ptxt'},(mine?'✓ ':'')+o.text),
h('span',{class:'pct'},`${pct}% · ${o.votes}`))
box.append(b)
}
box.append(h('div',{class:'hint',style:{margin:'4px 0 0'}},`${p.total} vote${p.total===1?'':'s'}`,(!closed&&(m.author.id===S.me.id))?[' · ',h('button',{class:'btn sm',on:{click:async()=>{try{const d=await POST(`/api/rooms/${m.room}/messages/${m.id}/poll/close`,{});m.poll=d.poll;onChange(m)}catch(e){fail(e)}}}},'Close poll')]:null))
return box
}
export function threadChip(m,sid){
const t=m.thread
if(!t)return null
noteThread({id:t.id,channel_id:m.room,name:t.name,count:t.count},sid)
return h('button',{class:'tchip',on:{click:()=>go(`/s/${sid}/${t.id}`)}},icon('chat','s'),h('b',null,t.name),h('span',null,`${t.count} ${t.count===1?'reply':'replies'}`),icon('right','s'))
}
const CE=/^e:(f_[a-z0-9]{16})$/
export function reactionFace(emoji){
const m=CE.exec(emoji)
if(m)return h('img',{class:'cemoji',src:'/api/files/'+m[1],alt:'custom emoji',loading:'lazy'})
return emoji
}
export const isCustomReaction=e=>CE.test(e)

export function renderSticker(m){
return h('img',{class:'sticker',src:fileUrl(m.sticker.file_id),alt:m.sticker.name,title:m.sticker.name,loading:'lazy',decoding:'async'})
}
