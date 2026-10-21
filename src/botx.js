import{fail,now,newId,str,limit,body,json,randHex,clamp}from'./util.js'
import{cleanGraph}from'./blockrun.js'
import{validateGraph}from'./botcheck.js'
import{runHook}from'./blocks.js'
import{mergeGraphs}from'../public/js/gmerge.js'
import{mine,roleOf,writeBlocks,freeSlug,slugOf,mint,MAXP,cols,withTags,shape}from'./botlab.js'
import{LISTED}from'./screen.js'

const COPYLEFT=new Set(['MPL-2.0','LGPL-3.0-only','GPL-2.0-only','GPL-3.0-only','AGPL-3.0-only','CC-BY-SA-4.0'])
const ROLES=['viewer','editor','maintainer']
const N=(id,type,x,y,p)=>({id,type,x,y,p})
const E=(f,o,t)=>({f,o,t})
const TEMPLATES=[
{id:'welcome',name:'Welcome and rules',summary:'Greets new members and answers !rules.',blocks:{nodes:[N('a','join',40,40,{}),N('b','sayto',340,40,{channel:'general',text:'Welcome to {server}, {mention}! Type !rules to see the rules.'}),N('c','cmd',40,260,{prefix:'!',name:'rules'}),N('d','say',340,260,{text:'1. Be kind. 2. No spam. 3. Have fun.',reply:'1'})],edges:[E('a','next','b'),E('c','next','d')]}},
{id:'faq',name:'FAQ with branches',summary:'!faq <topic> answers different questions with a switch block.',blocks:{nodes:[N('a','cmd',40,40,{prefix:'!',name:'faq'}),N('b','switch',340,40,{input:'{arg1}',v1:'rules',v2:'invite',v3:'staff',v4:'',}),N('c','say',700,0,{text:'Read the rules channel.',reply:'1'}),N('d','say',700,140,{text:'Ask a moderator for an invite link.',reply:'1'}),N('e','say',700,280,{text:'Staff are listed in the member panel.',reply:'1'}),N('f','say',700,420,{text:'Try !faq rules, !faq invite or !faq staff.',reply:'1'})],edges:[E('a','next','b'),E('b','c1','c'),E('b','c2','d'),E('b','c3','e'),E('b','else','f')]}},
{id:'streak',name:'Daily streak',summary:'!daily once a day with a personal streak counter.',blocks:{nodes:[N('a','cmd',40,40,{prefix:'!',name:'daily'}),N('b','cooldown',340,40,{seconds:'86400',scope:'user'}),N('c','call',660,0,{name:'celebrate'}),N('d','say',660,220,{text:'Come back tomorrow, {user}.',reply:'1'}),N('e','sub',40,300,{name:'celebrate'}),N('f','count',340,300,{name:'streak',by:'1',scope:'user'}),N('g','say',660,300,{text:'Daily claimed! Streak: {streak}',reply:'1'})],edges:[E('a','next','b'),E('b','yes','c'),E('b','no','d'),E('e','next','f'),E('f','next','g')]}},
{id:'linkguard',name:'Link guard',summary:'Deletes links from members without the Trusted role.',blocks:{nodes:[N('a','link',40,40,{}),N('b','hasrole',340,40,{role:'Trusted'}),N('c','delete',640,170,{}),N('d','say',940,170,{text:'{mention} links need the Trusted role.',reply:'0'})],edges:[E('a','next','b'),E('b','no','c'),E('c','next','d')]}},
{id:'announce',name:'Webhook announcer',summary:'Posts whatever an outside service sends to its hook URL.',blocks:{nodes:[N('a','hook',40,40,{name:'alert'}),N('b','sayto',340,40,{channel:'general',text:'Alert: {text}'})],edges:[E('a','next','b')]}},
{id:'roller',name:'Dice and 8-ball',summary:'!roll and !8ball in one bot.',blocks:{nodes:[N('a','cmd',40,40,{prefix:'!',name:'roll'}),N('b','randnum',340,40,{name:'dice',min:'1',max:'20'}),N('c','say',640,40,{text:'{mention} rolled a {dice}.',reply:'0'}),N('d','cmd',40,260,{prefix:'!',name:'8ball'}),N('e','pick',340,260,{name:'answer',options:'Yes\nNo\nAsk again later\nDefinitely\nNot a chance'}),N('f','say',640,260,{text:'The ball says: {answer}',reply:'1'})],edges:[E('a','next','b'),E('b','next','c'),E('d','next','e'),E('e','next','f')]}},
{id:'switch',name:'On/off feature',summary:'A gate block you can flip to turn a reply on or off without rewiring.',blocks:{nodes:[N('a','cmd',40,40,{prefix:'!',name:'promo'}),N('b','gate',340,40,{on:'1'}),N('c','say',640,40,{text:'Today: free cookies!',reply:'1'}),N('d','note',40,240,{text:'Set the gate to off to silence !promo.'})],edges:[E('a','next','b'),E('b','yes','c')]}}
]

async function memberRows(env,pid){
return(await env.DB.prepare("select m.user_id,m.role,m.status,u.username,u.display_name,u.avatar_id from bot_members m join users u on u.id=m.user_id where m.project_id=? order by m.created_at").bind(pid).all()).results
}
const parse=s=>{try{return s?JSON.parse(s):null}catch{return null}}

export default function botxRoutes(r){
r.add('GET','/api/bothub/templates',async c=>({templates:TEMPLATES.map(t=>({...t,blocks:cleanGraph(t.blocks)}))}))

r.add('GET','/api/bothub/invites',async c=>{
const rows=(await c.env.DB.prepare("select m.project_id id,m.role,p.name,p.slug,u.username invited_by from bot_members m join bot_projects p on p.id=m.project_id left join users u on u.id=m.invited_by where m.user_id=? and m.status='invited' order by m.created_at desc limit 50").bind(c.user.id).all()).results
return{invites:rows}
})
r.add('POST','/api/bothub/invites/:pid/:act',async c=>{
if(!['accept','decline'].includes(c.p.act))fail(404,'Not found')
const m=await c.env.DB.prepare("select 1 x from bot_members where project_id=? and user_id=? and status='invited'").bind(c.p.pid,c.user.id).first()
if(!m)fail(404,'Invitation not found')
if(c.p.act==='accept')await c.env.DB.prepare("update bot_members set status='active' where project_id=? and user_id=?").bind(c.p.pid,c.user.id).run()
else await c.env.DB.prepare('delete from bot_members where project_id=? and user_id=?').bind(c.p.pid,c.user.id).run()
return{ok:true}
})

r.add('GET','/api/bothub/:id/members',async c=>{
const p=await mine(c,c.p.id,'viewer')
const o=await c.env.DB.prepare('select id,username,display_name,avatar_id from users where id=?').bind(p.owner_id).first()
return{owner:o,members:await memberRows(c.env,p.id),role:p.role}
})
r.add('POST','/api/bothub/:id/members',async c=>{
const p=await mine(c,c.p.id,'maintainer')
limit('botinv:'+c.user.id,30,3600000)
const b=await body(c.req)
if(!ROLES.includes(b.role))fail(400,'Choose viewer, editor or maintainer')
const u=await c.env.DB.prepare('select id,username from users where username=? and deleted_at is null and is_bot=0 and suspended=0').bind(String(b.username||'').trim().toLowerCase()).first()
if(!u)fail(404,'No person with that username')
if(u.id===p.owner_id)fail(400,'That person owns the project')
if(b.role==='maintainer'&&p.role!=='owner')fail(403,'Only the owner can add maintainers')
const n=await c.env.DB.prepare('select count(*) n from bot_members where project_id=?').bind(p.id).first()
if(n.n>=20)fail(409,'A project can have up to 20 collaborators')
const ex=await c.env.DB.prepare('select role,status from bot_members where project_id=? and user_id=?').bind(p.id,u.id).first()
if(ex&&ex.role==='maintainer'&&p.role!=='owner')fail(403,'Only the owner can change a maintainer')
await c.env.DB.prepare("insert into bot_members(project_id,user_id,role,status,invited_by,created_at) values(?,?,?,?,?,?) on conflict(project_id,user_id) do update set role=excluded.role").bind(p.id,u.id,b.role,'invited',c.user.id,now()).run()
c.pub('u_'+u.id,{t:'notice',text:c.user.display_name+' invited you to work on the bot '+p.name+' as '+b.role+'. Open Bot Lab to accept.'})
return json({ok:true},201)
})
r.add('DELETE','/api/bothub/:id/members/:uid',async c=>{
const p=await c.env.DB.prepare('select * from bot_projects where id=?').bind(c.p.id).first()
if(!p)fail(404,'Project not found')
const role=await roleOf(c.env,p,c.user.id)
if(!role)fail(404,'Project not found')
if(c.p.uid===p.owner_id)fail(403,'The owner cannot be removed. Transfer ownership first.')
if(c.p.uid!==c.user.id){
const t=await c.env.DB.prepare('select role from bot_members where project_id=? and user_id=?').bind(p.id,c.p.uid).first()
if(!t)fail(404,'Not a collaborator')
if(role!=='owner'&&!(role==='maintainer'&&t.role!=='maintainer'))fail(403,'You cannot remove that person')
}
await c.env.DB.prepare('delete from bot_members where project_id=? and user_id=?').bind(p.id,c.p.uid).run()
return{ok:true}
})
r.add('POST','/api/bothub/:id/transfer',async c=>{
const p=await mine(c,c.p.id,'owner')
const b=await body(c.req)
const u=await c.env.DB.prepare("select u.id from users u join bot_members m on m.user_id=u.id and m.project_id=? and m.status='active' where u.username=? and u.deleted_at is null").bind(p.id,String(b.username||'').toLowerCase()).first()
if(!u)fail(404,'Choose an active collaborator')
const cnt=await c.env.DB.prepare('select count(*) n from users where bot_owner=? and deleted_at is null').bind(u.id).first()
if(cnt.n>=MAXP)fail(409,'They already own the maximum number of bots')
await c.env.DB.batch([
c.env.DB.prepare('update bot_projects set owner_id=?,updated_at=? where id=?').bind(u.id,now(),p.id),
c.env.DB.prepare('update users set bot_owner=? where id=?').bind(u.id,p.bot_id),
c.env.DB.prepare('delete from bot_members where project_id=? and user_id=?').bind(p.id,u.id),
c.env.DB.prepare("insert or replace into bot_members(project_id,user_id,role,status,invited_by,created_at) values(?,?,?,?,?,?)").bind(p.id,c.user.id,'maintainer','active',c.user.id,now())
])
return{ok:true}
})

r.add('GET','/api/bothub/:id/versions',async c=>{
const p=await mine(c,c.p.id,'viewer')
const rows=(await c.env.DB.prepare('select v.id,v.rev,v.summary,v.created_at,u.display_name author from bot_versions v left join users u on u.id=v.author_id where v.project_id=? order by v.created_at desc,v.rev desc limit 60').bind(p.id).all()).results
return{versions:rows,rev:p.rev||0}
})
r.add('GET','/api/bothub/:id/versions/:vid',async c=>{
const p=await mine(c,c.p.id,'viewer')
const v=await c.env.DB.prepare('select id,rev,summary,blocks,created_at from bot_versions where id=? and project_id=?').bind(c.p.vid,p.id).first()
if(!v)fail(404,'Version not found')
return{version:{...v,blocks:parse(v.blocks)}}
})
r.add('POST','/api/bothub/:id/versions/:vid/restore',async c=>{
const p=await mine(c,c.p.id,'editor')
const v=await c.env.DB.prepare('select rev,blocks from bot_versions where id=? and project_id=?').bind(c.p.vid,p.id).first()
if(!v)fail(404,'Version not found')
const g=cleanGraph(parse(v.blocks))
const rev=await writeBlocks(c,p,g,'Restored version '+v.rev,null)
if(rev===null)fail(409,'Someone else saved changes first. Try again.')
return{ok:true,blocks:g,rev}
})

r.add('GET','/api/bothub/:id/branches',async c=>{
const p=await mine(c,c.p.id,'viewer')
const rows=(await c.env.DB.prepare('select b.id,b.name,b.base_rev,b.updated_at,u.display_name author from bot_branches b left join users u on u.id=b.author_id where b.project_id=? order by b.updated_at desc').bind(p.id).all()).results
return{branches:rows,rev:p.rev||0}
})
r.add('POST','/api/bothub/:id/branches',async c=>{
const p=await mine(c,c.p.id,'editor')
limit('botbr:'+c.user.id,30,3600000)
const b=await body(c.req)
const name=str(b.name,1,30,'Branch name')
if(!/^[a-z0-9][a-z0-9-_ ]*$/i.test(name))fail(400,'Branch names use letters, numbers, spaces, dashes and underscores')
const n=await c.env.DB.prepare('select count(*) n from bot_branches where project_id=?').bind(p.id).first()
if(n.n>=10)fail(409,'A project can have up to 10 branches')
const id=newId('bb'),t=now()
try{await c.env.DB.prepare('insert into bot_branches(id,project_id,name,base_blocks,blocks,base_rev,author_id,created_at,updated_at) values(?,?,?,?,?,?,?,?,?)').bind(id,p.id,name,p.blocks,p.blocks,p.rev||0,c.user.id,t,t).run()}catch(e){if(String(e.message).includes('UNIQUE'))fail(409,'A branch with that name exists');throw e}
return json({id,name,blocks:parse(p.blocks)},201)
})
r.add('GET','/api/bothub/:id/branches/:bid',async c=>{
const p=await mine(c,c.p.id,'viewer')
const b=await c.env.DB.prepare('select id,name,blocks,base_rev from bot_branches where id=? and project_id=?').bind(c.p.bid,p.id).first()
if(!b)fail(404,'Branch not found')
return{branch:{id:b.id,name:b.name,base_rev:b.base_rev,blocks:parse(b.blocks)}}
})
r.add('PUT','/api/bothub/:id/branches/:bid',async c=>{
const p=await mine(c,c.p.id,'editor')
limit('botbr2:'+c.user.id,600,3600000)
const b=await body(c.req,60000)
const g=cleanGraph(b.blocks)
const x=await c.env.DB.prepare('update bot_branches set blocks=?,updated_at=? where id=? and project_id=?').bind(g?JSON.stringify(g):null,now(),c.p.bid,p.id).run()
if(!x.meta.changes)fail(404,'Branch not found')
return{ok:true,blocks:g}
})
r.add('POST','/api/bothub/:id/branches/:bid/merge',async c=>{
const p=await mine(c,c.p.id,'editor')
const b=await body(c.req,20000)
const br=await c.env.DB.prepare('select * from bot_branches where id=? and project_id=?').bind(c.p.bid,p.id).first()
if(!br)fail(404,'Branch not found')
const pick={}
if(b.pick&&typeof b.pick==='object')for(const[k,v]of Object.entries(b.pick).slice(0,300))if(v==='mine'||v==='theirs')pick[String(k).slice(0,60)]=v
const res=mergeGraphs(parse(br.base_blocks),parse(br.blocks),parse(p.blocks),pick)
if(res.conflicts.length)return json({error:'Some blocks were changed on both sides',conflicts:res.conflicts},409)
const g=cleanGraph(res.graph.nodes.length?res.graph:null)
const rev=await writeBlocks(c,p,g,'Merged branch '+br.name,null)
if(rev===null)fail(409,'Someone else saved changes first. Try again.')
await c.env.DB.prepare('delete from bot_branches where id=?').bind(br.id).run()
return{ok:true,blocks:g,rev}
})
r.add('DELETE','/api/bothub/:id/branches/:bid',async c=>{
const p=await mine(c,c.p.id,'editor')
await c.env.DB.prepare('delete from bot_branches where id=? and project_id=?').bind(c.p.bid,p.id).run()
return{ok:true}
})

r.add('POST','/api/bothub/:id/blocks/validate',async c=>{
const p=await mine(c,c.p.id,'viewer')
const b=await body(c.req,60000)
let g
try{g=cleanGraph(b.blocks)}catch(e){return{warnings:[{level:'error',msg:e.message}]}}
return{warnings:validateGraph(g)}
})
r.add('GET','/api/bothub/:id/export',async c=>{
const p=await mine(c,c.p.id,'viewer')
const o=await c.env.DB.prepare('select username from users where id=?').bind(p.owner_id).first()
return{format:'parley-bot-blocks',version:1,name:p.name,license:p.license,license_url:p.license_url,author:o?.username||'',forked_from:p.fork_note||'',exported_at:now(),blocks:parse(p.blocks)}
})

r.add('POST','/api/bothub/:id/fork',async c=>{
if(c.user.is_bot)fail(403,'Bots cannot fork')
limit('botfork:'+c.user.id,10,3600000)
const b=await body(c.req)
const src=await c.env.DB.prepare('select p.*,u.username owner_username from bot_projects p join users u on u.id=p.owner_id where p.id=?').bind(c.p.id).first()
if(!src)fail(404,'Bot not found')
const role=await roleOf(c.env,src,c.user.id)
const listed=src.visibility!=='private'&&(src.visibility==='unlisted'||['approved','legacy'].includes(src.screen_status))
if(!role&&!listed)fail(404,'Bot not found')
if(!role){
if(src.license==='ARR')fail(403,'The author has reserved all rights, so this bot cannot be copied.')
if(src.license==='Custom'&&b.accept_license!==true)return json({error:'This bot uses a custom license. Read it and confirm to continue.',license_url:src.license_url,needs_accept:true},409)
}
const cnt=await c.env.DB.prepare('select count(*) n from users where bot_owner=? and deleted_at is null').bind(c.user.id).first()
if(cnt.n>=MAXP)fail(409,`You can have up to ${MAXP} bots`)
let lic=src.license,lu=src.license_url
if(!role&&b.license&&b.license!==src.license){
if(COPYLEFT.has(src.license))fail(400,'This license requires forks to keep the same license ('+src.license+')')
}
if(role&&b.license)lic=String(b.license)
const name=str(b.name||src.name+' (fork)',2,32,'Name')
const slug=await freeSlug(c.env,slugOf(name))
const pid=newId('bp'),bid=newId('u'),t=now()
const note='Forked from '+src.name+' by @'+src.owner_username+' ('+src.license+')'
const readme=(note+'.\n\n')+(src.readme||'')
await c.env.DB.batch([
c.env.DB.prepare('insert into users(id,username,display_name,pass_hash,pass_salt,pass_iters,is_bot,bot_owner,avatar_id,created_at) values(?,?,?,?,?,?,1,?,?,?)').bind(bid,'bot_'+randHex(8),name,'!','!',1,c.user.id,null,t),
c.env.DB.prepare("insert into bot_projects(id,owner_id,bot_id,slug,name,summary,readme,license,license_url,source_url,visibility,blocks,forked_from,fork_note,created_at,updated_at) values(?,?,?,?,?,?,?,?,?,?,'private',?,?,?,?,?)").bind(pid,c.user.id,bid,slug,name,src.summary,readme.slice(0,20000),lic,lu,'',src.blocks,src.id,note,t,t),
c.env.DB.prepare('update bot_projects set forks=forks+1 where id=?').bind(src.id)
])
return json({id:pid,slug,bot_id:bid,fork_note:note,token:await mint(c.env,bid)},201)
})

r.add('POST','/api/bothub/:id/rating',async c=>{
limit('botrate:'+c.user.id,30,3600000)
const b=await body(c.req)
const stars=Number.isInteger(b.stars)?b.stars:0
if(stars<1||stars>5)fail(400,'Pick 1 to 5 stars')
const review=String(b.review||'').trim().slice(0,500)
const p=await c.env.DB.prepare('select id,owner_id,visibility,screen_status from bot_projects where id=?').bind(c.p.id).first()
if(!p||p.visibility==='private'||(p.visibility==='public'&&!['approved','legacy'].includes(p.screen_status)))fail(404,'Bot not found')
if(await roleOf(c.env,p,c.user.id))fail(403,'You cannot rate a bot you work on')
await c.env.DB.batch([
c.env.DB.prepare('insert into bot_ratings(project_id,user_id,stars,review,created_at) values(?,?,?,?,?) on conflict(project_id,user_id) do update set stars=excluded.stars,review=excluded.review,created_at=excluded.created_at').bind(p.id,c.user.id,stars,review,now()),
c.env.DB.prepare('update bot_projects set rating_sum=(select coalesce(sum(stars),0) from bot_ratings where project_id=?1),rating_n=(select count(*) from bot_ratings where project_id=?1) where id=?1').bind(p.id)
])
const t=await c.env.DB.prepare('select rating_sum,rating_n from bot_projects where id=?').bind(p.id).first()
return{ok:true,rating:Math.round(t.rating_sum/t.rating_n*10)/10,ratings:t.rating_n}
})
r.add('GET','/api/bothub/:id/ratings',async c=>{
const p=await c.env.DB.prepare('select id,visibility,screen_status,owner_id from bot_projects where id=?').bind(c.p.id).first()
if(!p||(p.visibility==='private'&&!await roleOf(c.env,p,c.user.id)))fail(404,'Bot not found')
const rows=(await c.env.DB.prepare('select r.stars,r.review,r.created_at,u.display_name,u.username from bot_ratings r join users u on u.id=r.user_id where r.project_id=? order by r.created_at desc limit 30').bind(p.id).all()).results
const mineR=await c.env.DB.prepare('select stars,review from bot_ratings where project_id=? and user_id=?').bind(p.id,c.user.id).first()
return{ratings:rows,mine:mineR||null}
})

r.add('GET','/api/bothub/:id/hook',async c=>{
const p=await mine(c,c.p.id,'maintainer')
return{key:p.hook_key||null}
})
r.add('POST','/api/bothub/:id/hook',async c=>{
const p=await mine(c,c.p.id,'maintainer')
limit('bothook:'+c.user.id,10,3600000)
const key='hk_'+randHex(20)
await c.env.DB.prepare('update bot_projects set hook_key=? where id=?').bind(key,p.id).run()
return{key}
})
r.add('POST','/api/hooks/bot/:id/:name',async c=>{
limit('hook:'+c.p.id,60,60000)
const p=await c.env.DB.prepare('select * from bot_projects where id=?').bind(c.p.id).first()
const key=c.url.searchParams.get('key')||c.req.headers.get('x-hook-key')||''
if(!p||!p.hook_key||key!==p.hook_key)fail(404,'Not found')
if(!/^[a-z0-9_]{1,24}$/i.test(c.p.name))fail(400,'Invalid hook name')
const b=await body(c.req,4000)
const ran=await runHook(c,p,c.p.name,String(b.text||'').slice(0,500),b.user?String(b.user).slice(0,32):'')
return{ok:true,servers:ran}
},{auth:false})
}
