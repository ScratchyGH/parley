import{h,toast,POST,avatar}from'./util.js'
import{S,loadFriends}from'./state.js'
import{gameBar}from'./gamebar.js'
import{connectParty}from'./tunet.js'
import{buildArt}from'./rushart.js'
const MODES=[['Solos',1,'Go in alone'],['Duos',2,'You and one friend'],['Trios',3,'Full squad of three']]
const MODES2=[['rush','Gourd Rush','Candlelit hollow, pumpkin horde, bright lanterns'],['terror','Night Terror','Pitch black, heartbeat, mimics, red eyes in the dark']]
const DIFFS=[['I dont wanna die','Easy mode'],['Im a man','Neutral'],['I CAN FUCKING TAKE IT','Hard'],['GIVE ME ALL YOU GOT','Extreme']]
const LENS=[['1 min',1],['5 min',5],['10 min',10],['30 min',30],['1 hr',60],['Infinite',0]]
const PHYS=[['Off','No props, no knockback'],['Normal','Barrels, crates, knockback'],['Chaos','Everything flies']]
const gfxGet=()=>{try{return Object.assign({light:2,shake:1},JSON.parse(localStorage.getItem('tu.gfx')||'{}'))}catch{return{light:2,shake:1}}}
const gfxSet=g=>{try{localStorage.setItem('tu.gfx',JSON.stringify(g))}catch{}}
const COL=['#ff9d2e','#6ec1ff','#9be564']
const AL='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const mkCode=()=>Array.from({length:6},()=>AL[Math.floor(Math.random()*AL.length)]).join('')
let active=null,art=null
const css=()=>{
if(!document.getElementById('hwcss2'))document.head.append(h('link',{id:'hwcss2',rel:'stylesheet',href:'/hollow.css'}))
if(!document.getElementById('tucss'))document.head.append(h('link',{id:'tucss',rel:'stylesheet',href:'/teamup.css?v=13'}))
if(!document.getElementById('rscss'))document.head.append(h('link',{id:'rscss',rel:'stylesheet',href:'/rush.css'}))
}
const sprite=(i,dim)=>{
if(!art)art=buildArt(4)
const s=art.player[0],c=document.createElement('canvas')
c.width=s.c.width;c.height=s.c.height
c.getContext('2d').drawImage(s.c,0,0)
c.className='tu-spr'+(dim?' tu-sil':'')
if(!dim)c.style.filter=i===0?'none':i===1?'hue-rotate(160deg)':'hue-rotate(70deg)'
return c
}
const mascot=(cls,k)=>{
if(!art)art=buildArt(4)
const s=(k||art.boss)[0],c=document.createElement('canvas')
c.width=s.c.width;c.height=s.c.height
c.getContext('2d').drawImage(s.c,0,0)
c.className=cls||'tu-mascot'
return c
}
export function showInvite(m){
const code=String(m.code||'')
if(!/^[A-Z0-9]{6}$/.test(code))return
document.querySelector('.tu-inv')?.remove()
const el=h('div',{class:'tu-inv',role:'alert'},h('b',null,String(m.from||'A friend')),' invited you to Gourd Rush: Teamup',h('div',{class:'row'},h('button',{class:'btn pri sm',type:'button',on:{click:()=>{el.remove();openTeamup(code)}}},'Join'),h('button',{class:'btn sm',type:'button',on:{click:()=>el.remove()}},'Not now')))
document.body.append(el)
setTimeout(()=>el.remove(),30000)
}
export async function openTeamup(join){
if(active){toast('You are already in a party');return}
css()
const code=join||mkCode()
const myName=S.me.display_name||S.me.username
let rl={mode:'rush',diff:1,len:5,phys:1},custom=false,gfx=gfxGet(),isHost=!join,hostUid=isHost?S.me.id:null,mode=0,roster=[{u:S.me.id,n:myName,un:S.me.username}],phase='lobby',game=null,net=null,joinTimer=null,closed=false,online=false,status=join?'Joining':'Connecting'
const box=h('div',{class:'hw-gamebox tu-box'})
const root=h('div',{class:'hw-game tu',role:'dialog','aria-modal':'true','aria-label':'Gourd Rush: Teamup'},box)
document.body.append(root)
active=root
const send=(d,to)=>{if(net)net.send(d,to)}
const close=()=>{
if(closed)return
closed=true
clearInterval(joinTimer)
try{game&&game.stop()}catch{}
try{net&&net.close()}catch{}
root.remove()
active=null
}
const bcast=()=>send({k:'ros',list:roster,mode,rules:rl})
const nrm=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/ᴄ/g,'c').replace(/ᴀ/g,'a').replace(/ɴ/g,'n').replace(/ᴅ/g,'d').replace(/ʏ/g,'y').replace(/[^a-z]/g,'')
const cmRules=()=>{const o={};for(const m of roster){const k=nrm(m.un)||nrm(m.n);if(k==='candyyy')o.kan=m.u;if(k==='parleyofficial')o.brt=m.u}return o}
const addUser=(f,n,un)=>{
if(roster.some(x=>x.u===f))return true
if(phase!=='lobby'){send({k:'busy'},f);return false}
if(roster.length>=MODES[mode][1]){send({k:'full'},f);return false}
roster.push({u:f,n:String(n||'Player').slice(0,24),un:String(un||'').slice(0,40)})
return true
}
const seg=(items,cur,set,dis,cls)=>h('div',{class:'tu-seg '+(cls||'')},items.map((it,i)=>h('button',{type:'button',class:i===cur?'on':'',disabled:dis,on:{click:()=>set(i)}},h('b',null,it[0]),it[1]&&typeof it[1]==='string'?h('span',null,it[1]):null)))
const lobby=()=>{
if(phase!=='lobby')return
const cap=MODES[mode][1]
const link=location.origin+'/?tu='+code
const slots=Array.from({length:3},(_,i)=>{
const m=roster[i]
if(m)return h('div',{class:'tu-slot on',style:{'--c':COL[i]}},sprite(i),h('b',null,m.n),h('span',null,m.u===hostUid?'Host':'Ready'))
if(i<cap)return h('div',{class:'tu-slot open',style:{'--c':COL[i]}},sprite(i,1),h('b',null,'Open seat'),h('span',null,'Invite a friend'))
return h('div',{class:'tu-slot locked'},sprite(i,1),h('b',null,'Locked'),h('span',null,i===1?'Pick Duos':'Pick Trios'))
})
const hs=!isHost
const upd=()=>{bcast();lobby()}
const sq=h('div',{class:'tu-seg'},MODES.map((m,i)=>h('button',{type:'button',class:i===mode?'on':'',disabled:hs||m[1]<roster.length,on:{click:()=>{mode=i;upd()}}},h('b',null,m[0]),h('span',null,m[2]))))
const modeCards=h('div',{class:'tu-cards2'},MODES2.map(m=>h('button',{type:'button',class:'tu-mc '+m[0]+(rl.mode===m[0]?' on':''),disabled:hs,on:{click:()=>{rl.mode=m[0];upd()}}},h('b',null,m[1]),h('span',null,m[2]))))
const diffs=h('div',{class:'tu-diffs'},DIFFS.map((d,i)=>h('button',{type:'button',class:'tu-d d'+i+(rl.diff===i?' on':''),disabled:hs,on:{click:()=>{rl.diff=i;upd()}}},h('b',null,d[0]),h('span',null,d[1]))))
const lenCur=custom?-1:LENS.findIndex(l=>l[1]===rl.len)
const lens=h('div',{class:'tu-seg tu-lens'},LENS.map((l,i)=>h('button',{type:'button',class:i===lenCur?'on':'',disabled:hs,on:{click:()=>{custom=false;rl.len=l[1];upd()}}},h('b',null,l[0]))),h('button',{type:'button',class:custom?'on':'',disabled:hs,on:{click:()=>{custom=true;upd()}}},h('b',null,'Custom')))
const cin=custom?h('label',{class:'tu-cin'},'Minutes',h('input',{type:'number',min:1,max:600,value:rl.len||5,disabled:hs,on:{change:e=>{rl.len=Math.max(1,Math.min(600,Math.floor(+e.target.value)||5));upd()}}})):null
const phys=seg(PHYS,rl.phys,i=>{rl.phys=i;upd()},hs)
const gl=seg([['High'],['Medium'],['Low']],2-gfx.light,i=>{gfx.light=2-i;gfxSet(gfx);lobby()},false)
const gs=seg([['Shake on'],['Shake off']],gfx.shake?0:1,i=>{gfx.shake=i?0:1;gfxSet(gfx);lobby()},false)
const fr=(S.fr?.friends||[]).slice().sort((a,b)=>(S.pres[b.id]&&S.pres[b.id]!=='offline')-(S.pres[a.id]&&S.pres[a.id]!=='offline'))
const frl=h('div',{class:'tu-fr'},fr.length?fr.slice(0,40).map(u=>h('button',{type:'button',class:'tu-f',disabled:!online||!isHost,title:'Invite '+u.display_name,on:{click:async e=>{const b=e.currentTarget;b.disabled=true;try{await POST('/api/teamup/invite',{code,username:u.username});toast('Invite sent to '+u.display_name,'ok')}catch(x){toast(x.message||'Could not invite','err');b.disabled=false}}}},avatar(u,'sm',S.pres[u.id]),h('span',null,u.display_name),h('em',null,S.pres[u.id]&&S.pres[u.id]!=='offline'?'Online':'Offline'))):h('p',{class:'hint'},'Add friends to invite them here.'))
const start=h('button',{class:'tu-go',type:'button',disabled:!isHost,on:{click:()=>{
phase='game'
send({k:'go',list:roster,mode,rules:Object.assign({},rl,cmRules())})
launch(roster,Object.assign({},rl,cmRules()))
}}},h('span',{class:'tu-gt'},isHost?(roster.length>1?'Start match':'Start solo'):'Waiting for host'),h('span',{class:'tu-gs'},MODES2.find(m=>m[0]===rl.mode)[1]+' / '+DIFFS[rl.diff][1]+' / '+(rl.len?rl.len+' min':'Infinite')),(art||(art=buildArt(4)),mascot('tu-gi',art.player)))
box.replaceChildren(h('div',{class:'tu-lobby'},
h('div',{class:'tu-moon'}),
h('div',{class:'tu-head'},h('h2',null,'Gourd Rush'),h('b',null,'Teamup'),h('p',null,'Hold the hollow until dawn. Board up doors, throw candy bombs, revive your squad.')),
h('div',{class:'tu-main'},
h('div',{class:'tu-left'},
h('div',{class:'tu-startrow'},start,h('div',{class:'tu-stack'},h('h4',null,'Squad size'),sq,h('button',{class:'tu-pill',type:'button',on:{click:close}},'Leave'),S.me.admin&&isHost&&roster.length===1?h('button',{class:'tu-pill',type:'button',on:{click:()=>{phase='game';launch(roster,null,1)}}},'Blackhole test'):null,S.me.admin&&isHost&&roster.length===1?h('button',{class:'tu-pill',type:'button',on:{click:()=>{phase='game';launch(roster,null,2)}}},'Tesvin test'):null)),
h('div',{class:'jag'},h('div',{class:'tu-slots'},slots))),
h('div',{class:'tu-mid jag'},h('h4',null,'Mode'),modeCards,h('h4',null,'Difficulty'),diffs,h('h4',null,'Length'),lens,cin,h('h4',null,'Physics'),phys,h('h4',null,'Graphics'),h('div',{class:'tu-two'},gl,gs)),
h('div',{class:'tu-right'},
h('div',{class:'tu-code jag'},mascot('tu-logo',art.player),h('span',null,online?'Party code':status),h('b',null,code),h('button',{class:'tu-pill',type:'button',on:{click:()=>navigator.clipboard?.writeText(link).then(()=>toast('Invite link copied','ok'),()=>toast(link))}},'Copy invite link')),
h('div',{class:'jag'},h('h4',null,'Friends'),frl)))))
}
const launch=(list,rr,tst)=>{
if(rr)rl=rr
phase='game'
box.replaceChildren()
import('/js/tugame.js').then(({playTeamup})=>{
if(closed)return
game=playTeamup({box,me:S.me.id,list:list.map(m=>({u:m.u,n:m.n})),host:isHost,hostUid,send,rules:Object.assign({},rl,{gfx},{},tst?{test:tst,mode:'terror'}:{}),onEnd:()=>{
try{game.stop()}catch{}
game=null
phase='lobby'
if(isHost)bcast()
lobby()
}})
box.append(h('button',{class:'btn sm hw-gx',type:'button',on:{click:close}},'Leave match'))
gameBar(root,'gourd-rush-teamup')
})
}
const onMsg=(f,d)=>{
if(isHost){
if(d.k==='hi'){if(addUser(f,d.n,d.un)){bcast();lobby()}}
else if(game)game.msg(f,d)
return
}
if(d.k==='ros'){
clearInterval(joinTimer)
hostUid=f;roster=d.list;mode=d.mode;if(d.rules)rl=d.rules
if(!roster.some(x=>x.u===S.me.id)){toast('You were removed from the party','err');close();return}
if(phase==='lobby')lobby()
}else if(d.k==='full'){toast('That party is full','err');close()}
else if(d.k==='busy'){toast('That match already started','err');close()}
else if(d.k==='go'&&f===hostUid){roster=d.list;launch(roster,d.rules)}
else if(game)game.msg(f,d)
}
net=connectParty({code,create:isHost,me:S.me.id,on:{
open(){
online=true;status='Party code'
if(isHost){lobby();return}
let hn=0
const hi=()=>send({k:'hi',n:myName,un:S.me.username})
hi()
joinTimer=setInterval(()=>{hn++;if(hn>8){clearInterval(joinTimer);toast('That party is not open','err');close()}else hi()},2000)
},
fail(t){
if(isHost){online=false;status='Offline, solo only';net=null;toast(t,'err');lobby();return}
toast(t,'err');close()
},
close(){
if(closed)return
if(isHost){online=false;status='Offline';net=null;if(phase==='lobby')lobby();return}
toast('Lost connection to the party','err');close()
},
left(u){
if(isHost){const n=roster.length;roster=roster.filter(x=>x.u!==u);if(roster.length!==n){game&&game.left(u);bcast();if(phase==='lobby')lobby()}}
else if(u===hostUid){if(game)game.left(u);else{toast('The host closed the party','err');close()}}
},
msg:onMsg
}})
if(isHost)lobby();else box.replaceChildren(h('p',{class:'tu-wait'},'Joining the party'))
loadFriends().then(()=>{if(phase==='lobby'&&!closed&&box.querySelector('.tu-lobby'))lobby()}).catch(()=>{})
}
