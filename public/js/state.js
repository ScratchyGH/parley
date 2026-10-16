import{GET}from'./util.js'

export const P={VIEW:1,SEND:2,MANAGE_MESSAGES:4,MANAGE_CHANNELS:8,MANAGE_ROLES:16,CREATE_INVITE:32,KICK:64,BAN:128,MANAGE_SERVER:256,MODERATE:512,CONNECT:1024,MANAGE_VOICE:2048,ATTACH:4096,REACT:8192,MENTION_ALL:16384,ADMIN:32768}
export const PERM_INFO=[
['VIEW','View channels','See channels and read history'],
['SEND','Send messages','Post in text channels'],
['ATTACH','Attach files','Upload files to messages'],
['REACT','Add reactions','React to messages'],
['MENTION_ALL','Mention everyone','Use @everyone and @here'],
['CONNECT','Connect to voice','Join voice channels and calls'],
['CREATE_INVITE','Create invites','Create invite links'],
['MANAGE_MESSAGES','Manage messages','Delete and pin anyone’s messages'],
['MANAGE_CHANNELS','Manage channels','Create, edit and delete channels'],
['MANAGE_ROLES','Manage roles','Create roles and assign them below your own'],
['KICK','Kick members','Remove members from the server'],
['BAN','Ban members','Ban and unban members'],
['MODERATE','Moderate members','Time out members and handle reports'],
['MANAGE_VOICE','Manage voice','Reserved for voice moderation'],
['MANAGE_SERVER','Manage server','Edit server settings, view invites and audit log'],
['ADMIN','Administrator','Bypasses every permission check']
]

export const S={
me:null,
servers:[],
sdata:{},
convs:[],
fr:{friends:[],incoming:[],outgoing:[],blocked:[]},
unread:{},
pres:{},
typing:{},
voice:{},
notifN:0,
nav:{kind:'home',sid:null,room:null,page:'friends'},
users:new Map(),
threads:{},
ready:{}
}

const subs={}
export const on=(e,fn)=>{(subs[e]||=new Set()).add(fn);return()=>subs[e].delete(fn)}
export const emit=(e,d)=>{if(subs[e])for(const fn of [...subs[e]])try{fn(d)}catch(err){console.error(err)}}

export function cacheUser(u){
if(!u||!u.id)return u
const old=S.users.get(u.id)
S.users.set(u.id,old?{...old,...u}:u)
return S.users.get(u.id)
}
export const user=id=>S.users.get(id)
export const nameOf=id=>{
if(id===S.me?.id)return S.me.display_name
return S.users.get(id)?.display_name||'Unknown'
}

export const isDm=room=>typeof room==='string'&&room.startsWith('cv_')
export function chanInfo(id){
if(typeof id==='string'&&id.startsWith('th_')){
const t=S.threads[id]
if(!t)return null
const p=S.sdata[t.sid]?.channels.find(x=>x.id===t.channel_id)
if(!p)return null
const perms=p.type==='forum'?p.perms|P.SEND|P.ATTACH|P.REACT:p.perms
return{ch:{...p,id,name:t.name,type:'text',topic:'',slowmode:0,readonly:0,locked:t.locked||t.archived?1:0,perms:t.locked||t.archived?(perms&~(P.SEND|P.REACT)):perms},sid:t.sid,srv:S.sdata[t.sid],thread:t,parent:p}
}
for(const sid of Object.keys(S.sdata)){
const c=S.sdata[sid].channels.find(x=>x.id===id)
if(c)return{ch:c,sid,srv:S.sdata[sid]}
}
return null
}
export const conv=id=>S.convs.find(x=>x.id===id)
export function convTitle(c){
if(!c)return 'Conversation'
if(c.type==='group')return c.name||c.members.filter(m=>m.id!==S.me.id).map(m=>m.display_name).join(', ')||'Group'
const o=c.members.find(m=>m.id!==S.me.id)
return o?o.display_name:'Direct message'
}
export const convOther=c=>c?.type==='dm'?c.members.find(m=>m.id!==S.me.id):null

export const can=(sid,bit)=>{
const d=S.sdata[sid]
if(!d)return false
return !!(d.me.perms&P.ADMIN)||d.me.owner||!!(d.me.perms&bit)
}
export const chanCan=(chId,bit)=>{
const i=chanInfo(chId)
if(!i)return false
return !!(i.ch.perms&bit)
}
export const roomPerms=room=>{
if(isDm(room)){
const c=conv(room)
return c?.perms??(P.VIEW|P.SEND|P.ATTACH|P.REACT|P.CONNECT)
}
return chanInfo(room)?.ch.perms||0
}

export const setting=(k,d)=>{
const v=S.me?.settings?.[k]
return v===undefined?d:v
}
export const muteLevel=id=>S.me?.settings?.mute?.[id]||'all'

export async function loadServers(){
const d=await GET('/api/servers')
S.servers=d.servers
emit('servers')
return d.servers
}
export async function loadServer(sid){
const d=await GET('/api/servers/'+sid)
S.sdata[sid]={...d,members_loaded:false}
emit('server',sid)
return S.sdata[sid]
}
export async function loadConvs(){
const d=await GET('/api/conversations')
S.convs=d.conversations
for(const c of S.convs)for(const m of c.members)cacheUser(m)
emit('convs')
return S.convs
}
export async function loadFriends(){
const d=await GET('/api/friends')
S.fr=d
for(const k of['friends','incoming','outgoing','blocked'])for(const u of d[k])cacheUser(u)
emit('friends')
return d
}
export async function loadUnread(){
const d=await GET('/api/unread')
const next={}
for(const x of d.unread)next[x.room]={count:x.count,mentions:x.mentions,sid:x.server_id}
S.unread=next
emit('unread')
}
export async function loadNotifCount(){
const d=await GET('/api/notifications')
S.notifN=d.unread
emit('notifn')
return d
}

export function unreadOf(room){
const u=S.unread[room]
if(!u)return null
const lvl=muteLevel(room)
if(lvl==='none')return null
if(lvl==='mentions')return u.mentions?{count:0,mentions:u.mentions}:null
return u
}
export function serverUnread(sid){
const d=S.sdata[sid]
let count=0,mentions=0
const lvlS=muteLevel(sid)
if(lvlS==='none')return null
const rooms=d?d.channels.map(c=>c.id):Object.keys(S.unread).filter(r=>S.unread[r].sid===sid)
for(const r of rooms){
const u=unreadOf(r)
if(u){count+=u.count;mentions+=u.mentions}
}
if(lvlS==='mentions')return mentions?{count:0,mentions}:null
return count||mentions?{count,mentions}:null
}
export function dmUnread(){
let count=0,mentions=0
for(const c of S.convs){
const u=unreadOf(c.id)
if(u){count+=u.count;mentions+=u.mentions}
}
return count||mentions?{count,mentions}:null
}

export function applySettings(){
const s=S.me?.settings||{}
const root=document.documentElement
root.dataset.theme=s.theme||'dimmed'
root.dataset.density=s.density||'comfortable'
root.style.setProperty('--fs',(s.font_size||15)+'px')
const rm=s.reduced_motion===undefined?matchMedia('(prefers-reduced-motion: reduce)').matches:s.reduced_motion
root.classList.toggle('rm',!!rm)
const col={dimmed:'#1c2128',silver:'#242a30',light:'#f6f8fa',contrast:'#010409'}
document.querySelector('meta[name=theme-color]')?.setAttribute('content',col[s.theme||'dimmed'])
}

export const hubOf=room=>{
if(isDm(room))return room
const i=chanInfo(room)
return i?'s_'+i.sid:null
}
export async function loadMembers(sid,force){
const d=S.sdata[sid]
if(!d)return[]
if(d.memberList&&!force)return d.memberList
if(d.memberLoading)return d.memberLoading
d.memberLoading=(async()=>{
let all=[],after=''
for(let i=0;i<5;i++){
const r=await GET('/api/servers/'+sid+'/members?limit=100'+(after?'&after='+encodeURIComponent(after):''))
all=all.concat(r.members)
if(!r.next)break
after=r.next
}
for(const m of all)cacheUser({id:m.id,username:m.username,display_name:m.display_name,avatar_id:m.avatar_id,accent:m.accent})
d.memberList=all
d.memberLoading=null
emit('members',sid)
return all
})()
return d.memberLoading
}

export async function ensureThread(id,sid){
if(S.threads[id])return S.threads[id]
const d=await GET('/api/threads/'+id)
S.threads[id]={...d.thread,sid:d.server_id}
return S.threads[id]
}
export function noteThread(t,sid){
S.threads[t.id]={...(S.threads[t.id]||{}),...t,sid}
return S.threads[t.id]
}
