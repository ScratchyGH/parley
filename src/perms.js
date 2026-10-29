import{fail,now}from'./util.js'
export const P={VIEW:1,SEND:2,MANAGE_MESSAGES:4,MANAGE_CHANNELS:8,MANAGE_ROLES:16,CREATE_INVITE:32,KICK:64,BAN:128,MANAGE_SERVER:256,MODERATE:512,CONNECT:1024,MANAGE_VOICE:2048,ATTACH:4096,REACT:8192,MENTION_ALL:16384,ADMIN:32768}
export const ALL=65535
export const DEFAULT=P.VIEW|P.SEND|P.CREATE_INVITE|P.CONNECT|P.ATTACH|P.REACT
export const PERM_NAMES=Object.keys(P)

export async function loadMember(env,serverId,userId){
const[row,rr]=await Promise.all([env.DB.prepare('select s.*,m.nickname,m.timeout_until from servers s join members m on m.server_id=s.id and m.user_id=? where s.id=?').bind(userId,serverId).first(),env.DB.prepare('select id,perms,position,is_everyone from roles where server_id=? and (is_everyone=1 or id in (select role_id from member_roles where server_id=? and user_id=?))').bind(serverId,serverId,userId).all()])
if(!row)return null
const roles=rr.results
const owner=row.owner_id===userId
let base=0,top=0,everyone=null
const roleIds=[]
for(const r of roles){
base|=r.perms
if(r.is_everyone)everyone=r.id
else{roleIds.push(r.id);if(r.position>top)top=r.position}
}
const admin=owner||(base&P.ADMIN)!==0
return{server:row,userId,owner,admin,base:admin?ALL:base,top:owner?Infinity:top,everyone,roleIds,timeout_until:row.timeout_until,nickname:row.nickname}
}

export function chanPerms(m,ch,ovs){
if(m.admin)return ALL
let p=m.base
const ev=ovs.find(o=>o.target_type==='role'&&o.target_id===m.everyone)
if(ev)p=(p&~ev.deny)|ev.allow
let allow=0,deny=0
for(const o of ovs)if(o.target_type==='role'&&o.target_id!==m.everyone&&m.roleIds.includes(o.target_id)){allow|=o.allow;deny|=o.deny}
p=(p&~deny)|allow
const u=ovs.find(o=>o.target_type==='user'&&o.target_id===m.userId)
if(u)p=(p&~u.deny)|u.allow
if(!(p&P.VIEW))return 0
if(ch.locked&&!(p&P.MANAGE_CHANNELS))p&=~(P.SEND|P.REACT)
if((ch.type==='announce'||ch.type==='forum'||ch.readonly)&&!(p&P.MANAGE_MESSAGES))p&=~P.SEND
if(m.timeout_until>now())p&=P.VIEW
return p
}

export async function channelAccess(env,m,chId){
const ch=await env.DB.prepare('select * from channels where id=? and server_id=?').bind(chId,m.server.id).first()
if(!ch)return null
const ovs=(await env.DB.prepare('select target_type,target_id,allow,deny from overrides where channel_id=?').bind(chId).all()).results
return{ch,perms:chanPerms(m,ch,ovs)}
}

export async function visibleChannels(env,m){
const[a,b]=await Promise.all([env.DB.prepare('select * from channels where server_id=? order by position,created_at').bind(m.server.id).all(),env.DB.prepare('select o.* from overrides o join channels c on c.id=o.channel_id where c.server_id=?').bind(m.server.id).all()])
const chs=a.results,ovs=b.results
const by={}
for(const o of ovs)(by[o.channel_id]||=[]).push(o)
const out=[]
for(const ch of chs){const perms=chanPerms(m,ch,by[ch.id]||[]);if(perms&P.VIEW)out.push({ch,perms})}
return out
}

export const need=(perms,bit,msg='You do not have permission to do that')=>{if(!(perms&bit))fail(403,msg)}

export async function resolveRoom(env,room,userId){
if(typeof room!=='string')fail(400,'Invalid room')
if(room.startsWith('ch_')){
const ch=await env.DB.prepare('select * from channels where id=?').bind(room).first()
if(!ch)fail(404,'Channel not found')
const[m,ovr]=await Promise.all([loadMember(env,ch.server_id,userId),env.DB.prepare('select target_type,target_id,allow,deny from overrides where channel_id=?').bind(room).all()])
if(!m)fail(404,'Channel not found')
const ovs=ovr.results
const perms=chanPerms(m,ch,ovs)
if(!(perms&P.VIEW))fail(404,'Channel not found')
return{kind:'channel',room,ch,m,perms,ovs,serverId:ch.server_id,hub:'s_'+ch.server_id}
}
if(room.startsWith('cv_')){
const conv=await env.DB.prepare('select c.*,cm.accepted from conversations c join conv_members cm on cm.conv_id=c.id and cm.user_id=? where c.id=?').bind(userId,room).first()
if(!conv)fail(404,'Conversation not found')
let perms=P.VIEW|P.SEND|P.ATTACH|P.REACT|P.CONNECT
if(conv.type==='dm'){
const other=await env.DB.prepare('select user_id from conv_members where conv_id=? and user_id!=?').bind(room,userId).first()
if(other){
const blk=await env.DB.prepare('select 1 x from blocks where (user_id=? and blocked_id=?) or (user_id=? and blocked_id=?)').bind(userId,other.user_id,other.user_id,userId).first()
if(blk)perms=P.VIEW
conv.other_id=other.user_id
}
}
return{kind:'dm',room,conv,perms,hub:room}
}
if(room.startsWith('th_')){
const t=await env.DB.prepare('select * from threads where id=?').bind(room).first()
if(!t)fail(404,'Thread not found')
const ch=await env.DB.prepare('select * from channels where id=?').bind(t.channel_id).first()
if(!ch)fail(404,'Thread not found')
const m=await loadMember(env,ch.server_id,userId)
if(!m)fail(404,'Thread not found')
const ovs=(await env.DB.prepare('select target_type,target_id,allow,deny from overrides where channel_id=?').bind(ch.id).all()).results
let perms=chanPerms(m,ch.type==='forum'?{...ch,type:'text'}:ch,ovs)
if(!(perms&P.VIEW))fail(404,'Thread not found')
if((t.archived||t.locked)&&!(perms&P.MANAGE_MESSAGES))perms&=~(P.SEND|P.REACT)
return{kind:'channel',room,thread:t,ch:{...ch,name:t.name,slowmode:ch.type==='forum'?0:ch.slowmode},m,perms,ovs,serverId:ch.server_id,hub:'s_'+ch.server_id,gate:ch.id}
}
fail(400,'Invalid room')
}
