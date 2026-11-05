import{h,api,mount}from'/kids/ui.js'
import{sv,ic,pav,ncls,coin}from'/kids/art.js'
const tm=t=>new Date(t).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})
const GAMES=[['dash','Turkey Dash','Sprint, jump the logs, grab the pies.','#ff8a3d','#ffd23f'],['stack','Pie Stack','Stack the pies as high as you can.','#c4472b','#ffb36b'],['match','Harvest Match','Flip cards and match the feast.','#1f9d62','#b8f2c4'],['catch','Cornucopia Catch','Catch good food, dodge the rotten.','#7a4bd6','#d9c2ff'],['forage','Thicket Survivors','Hold the clearing against the foxes.','#d2342f','#ffb3a6']]
const COLS={blue:'#2a63ff',pink:'#ff4f8b',sun:'#ffb800',mint:'#18c08f',violet:'#8a5cff',coral:'#ff6a4d'}
const TABS=[['frame','Rings'],['bg','Backdrops'],['name','Names']]
export function chatApp(root,tok,boot,c){
let view='chat',fr=[],cur=null,last=0,msgs=[],code='',off=false,svs=[],scur=null,sd=null,chn=null,slast=0,smsgs=[],mem=false,shopTab='frame',pre=new URLSearchParams(location.search).get('f')||''
let P={pars:0,eq:{},owned:[],items:[],bonus:false,earned:0,cap:200}
if(pre){view='friends';history.replaceState(null,'','/kids/')}
const call=(p,b)=>api(p,b,tok)
const rail=h('nav',{class:'kr','aria-label':'Parley Kids'}),list=h('aside',{class:'kc'}),main=h('section',{class:'km'})
const app=h('div',{class:'kapp'},rail,list,main)
const tst=h('div',{class:'tst',role:'status','aria-live':'polite',hidden:true})
let tt=0
const say=t=>{tst.hidden=false;tst.textContent=t;clearTimeout(tt);tt=setTimeout(()=>{tst.hidden=true},5000)}
const fail=e=>{if(e&&(e.status===401||e.status===403)&&/device|signed|authorized/i.test(e.message))return boot();say(e.message||'Something went wrong')}
const go=v=>{view=v;app.classList.remove('in');drawAll()}
const act=fr2=>fr2.filter(f=>f.status==='active')
const inc=()=>fr.filter(f=>f.incoming)
const invs=()=>svs.filter(s=>s.status==='invited')
const nm=(n,eq)=>h('b',{class:'nm '+ncls(eq)},n)
const dot=on=>h('em',{class:'dot'+(on?' on':'')})
const rb=(n,l,v,bad)=>h('button',{class:'rb',type:'button','aria-current':String(view===v),on:{click:()=>go(v)}},ic(n),h('span',null,l),bad?h('i',{class:'bd'},String(bad)):null)
const drawRail=()=>rail.replaceChildren(
h('div',{class:'kl','aria-hidden':'true'},ic('chat',24)),
rb('chat','Chats','chat'),rb('server','Servers','server',invs().length),rb('game','Games','game'),rb('shop','Shop','shop'),rb('users','Friends','friends',inc().length),
h('div',{class:'rs'}),
h('button',{class:'pc',type:'button',title:'Your Pars',on:{click:()=>go('shop')}},coin(20),h('b',null,String(P.pars))),
h('div',{class:'me2',title:c.display_name},pav(c.avatar,P.eq)))
const hd=(t,...k)=>h('div',{class:'kch'},h('h2',null,t),...k)
const empty=(t,b)=>h('div',{class:'em2'},h('p',null,t),b||null)
const row=(f,on,sel)=>h('button',{class:'fi',type:'button','aria-current':String(!!sel),on:{click:on}},pav(f.avatar,f.eq,'sm'),h('span',null,nm(f.display_name,f.eq),h('small',null,f.online?'Online':'Away')),dot(f.online))
const back=()=>h('button',{class:'ib kb',type:'button','aria-label':'Back',on:{click:()=>app.classList.remove('in')}},ic('back'))
const drawList=()=>{
if(view==='chat'){
const a=act(fr)
list.replaceChildren(hd('Chats'),h('div',{class:'fl'},a.length?a.map(f=>row(f,()=>{cur=f;last=0;msgs=[];app.classList.add('in');drawAll();poll()},cur&&cur.id===f.id)):empty('No friends to chat with yet.',h('button',{class:'btn sm',type:'button',on:{click:()=>go('friends')}},'Find friends'))))
}else if(view==='server'){
const iv=invs(),ok=svs.filter(s=>s.status==='active'),rv=svs.filter(s=>s.status==='review')
list.replaceChildren(hd('Servers',h('button',{class:'ib',type:'button','aria-label':'Make a server',on:{click:()=>{scur=null;sd=null;app.classList.add('in');drawMain()}}},ic('plus'))),h('div',{class:'fl'},
...iv.map(s=>h('div',{class:'inv'},h('i',{class:'sq'},s.name[0].toUpperCase()),h('span',null,h('b',null,s.name),h('small',null,s.by_name?'Invited by '+s.by_name:'Invite')),h('div',{class:'ac'},h('button',{class:'btn sm',type:'button',on:{click:async()=>{try{await call('/api/kids/servers/'+s.id+'/join',{accept:true});say('Your parent has to say yes before you can join');await load()}catch(e){fail(e)}}}},'Join'),h('button',{class:'btn alt sm',type:'button',on:{click:async()=>{try{await call('/api/kids/servers/'+s.id+'/join',{accept:false});await load()}catch(e){fail(e)}}}},'No')))),
...rv.map(s=>h('div',{class:'fi pr'},h('i',{class:'sq'},s.name[0].toUpperCase()),h('span',null,h('b',null,s.name),h('small',null,'Waiting for your parent')))),
...ok.map(s=>h('button',{class:'fi',type:'button','aria-current':String(scur===s.id),on:{click:()=>openServer(s.id)}},sqEl(s),h('span',null,h('b',null,s.name),h('small',null,s.n+' member'+(s.n===1?'':'s'))))),
!svs.length?empty('You are not in any servers yet.'):null))
}else list.replaceChildren()
}
const sqEl=s=>{const e=h('i',{class:'sq'},s.name[0].toUpperCase());e.style.setProperty('--c',COLS[s.color]||COLS.blue);return e}
const mrow=m=>h('div',{class:'mgr'},h('div',{class:'mg'+(m.first?' f':'')},m.first?pav(m.avatar,m.eq,'sm'):h('i',{class:'sp'}),h('div',{class:'mt'},m.first?h('div',{class:'mh'},nm(m.name,m.eq),h('time',null,tm(m.at))):null,h('span',null,m.body)),m.mine?null:h('button',{class:'rp',type:'button',title:'Report this message',on:{click:()=>m.report(m)}},'Report')))
const feed=(ms,rep)=>{
let prev=null
const box=h('div',{class:'ms',role:'log','aria-live':'polite'},ms.length?ms.map(m=>{const x={...m,first:!prev||prev.mine!==m.mine||prev.name!==m.name||m.at-prev.at>300000,report:rep};prev=m;return mrow(x)}):h('p',{class:'em'},'No messages yet. Say hi.'))
setTimeout(()=>{box.scrollTop=box.scrollHeight})
return box
}
const composer=(ph,send)=>{
const inp=h('input',{maxlength:'300',autocomplete:'off',placeholder:ph,'aria-label':'Message',disabled:off})
const go2=async()=>{const t=inp.value.trim();if(!t)return;inp.disabled=true;try{await send(t);inp.value=''}catch(e){fail(e)}inp.disabled=false;inp.focus()}
inp.addEventListener('keydown',e=>{if(e.key==='Enter')go2()})
return h('div',{class:'sd'},inp,h('button',{class:'btn',type:'button','aria-label':'Send',on:{click:go2}},ic('send',20)))
}
const keep=fn=>{
const a=document.activeElement
const on=a&&a.tagName==='INPUT'&&main.contains(a)&&a.closest('.sd')
const v=on?a.value:null
fn()
if(on){const n=main.querySelector('.sd input');if(n&&!n.disabled){n.value=v;n.focus()}}
}
const drawChat=()=>{
if(!cur){main.replaceChildren(h('div',{class:'ph'},h('div',{class:'big-ic'},ic('chat',44)),h('h2',null,'Hi '+c.display_name+'!'),h('p',null,off?'Chat is paused. Ask your parent.':'Pick a friend to chat. You can only chat with friends your parents said yes to.'),h('button',{class:'btn',type:'button',on:{click:()=>go('friends')}},'Find friends')));return}
const dm=msgs.map(m=>({id:m.id,mine:m.mine,name:m.mine?c.display_name:cur.display_name,avatar:m.mine?c.avatar:cur.avatar,eq:m.mine?P.eq:cur.eq,body:m.body,at:m.at}))
const rep=async m=>{if(!confirm('Report this message and block this friend?'))return;try{await call('/api/kids/report',{msg:m.id});cur=null;app.classList.remove('in');say('Reported. Your parent was told.');load()}catch(e){fail(e)}}
const blk=h('button',{class:'btn alt sm',type:'button',on:{click:async()=>{if(!confirm('Block '+cur.display_name+'?'))return;try{await call('/api/kids/friends/'+cur.id+'/block',{});cur=null;app.classList.remove('in');load()}catch(e){fail(e)}}}},'Block')
main.replaceChildren(h('div',{class:'kh'},back(),pav(cur.avatar,cur.eq,'sm'),h('div',{class:'ht'},nm(cur.display_name,cur.eq),h('small',null,cur.online?'Online':'Away')),blk),feed(dm,rep),composer('Message '+cur.display_name,async t=>{await call('/api/kids/chat/'+cur.id,{text:t});await poll()}))
}
const mkServer=()=>{
const inp=h('input',{maxlength:'24',autocomplete:'off',placeholder:'Server name','aria-label':'Server name'})
let col='blue'
const sw=Object.entries(COLS).map(([k,v])=>{const b=h('button',{class:'cs',type:'button','aria-label':k,'aria-pressed':String(k===col),on:{click:()=>{col=k;sw.forEach(x=>x.setAttribute('aria-pressed',String(x===b)))}}});b.style.setProperty('--c',v);return b})
const go2=async()=>{try{const r=await call('/api/kids/servers',{name:inp.value,color:col});await load();openServer(r.id)}catch(e){fail(e)}}
inp.addEventListener('keydown',e=>{if(e.key==='Enter')go2()})
main.replaceChildren(h('div',{class:'kh'},back(),h('div',{class:'ht'},h('b',null,'Make a server'))),h('div',{class:'kb2'},h('section',{class:'card'},h('h2',null,'Your own server'),h('p',null,'Invite your friends. Their parents have to say yes before they can join, and every message is checked.'),h('label',null,'Name',inp),h('div',{class:'cw',role:'group','aria-label':'Color'},sw),h('button',{class:'btn',type:'button',on:{click:go2}},'Create server'))))
}
const openServer=async id=>{
scur=id
try{sd=await call('/api/kids/servers/'+id);chn=sd.channels[0]&&sd.channels[0].id;slast=0;smsgs=[];mem=false;app.classList.add('in');drawAll();spoll()}catch(e){scur=null;sd=null;fail(e)}
}
const drawServer=()=>{
if(!scur||!sd){mkServer();return}
const own=sd.role==='owner',chs=sd.channels
const pills=h('div',{class:'chs',role:'tablist'},chs.map(x=>h('button',{type:'button',role:'tab','aria-selected':String(x.id===chn),on:{click:()=>{chn=x.id;slast=0;smsgs=[];drawServer();spoll()}}},ic('hash',14),x.name)))
const rep=async m=>{if(!confirm('Report this message?'))return;try{await call('/api/kids/servers/'+scur+'/report',{msg:m.id});say('Reported. Your parent was told.')}catch(e){fail(e)}}
const ms=smsgs.map(m=>({id:m.id,mine:m.mine,name:m.name,avatar:m.avatar,eq:m.eq,body:m.body,at:m.at}))
const leave=h('button',{class:'btn alt sm',type:'button',on:{click:async()=>{if(!confirm(own?'Delete this server for everyone?':'Leave this server?'))return;try{await call('/api/kids/servers/'+scur+'/leave',{});scur=null;sd=null;await load();drawAll()}catch(e){fail(e)}}}},own?'Delete':'Leave')
const side=mem?memberPanel():null
main.replaceChildren(h('div',{class:'kh'},back(),sqEl({name:sd.server.name,color:sd.server.color}),h('div',{class:'ht'},h('b',null,sd.server.name),h('small',null,sd.members.filter(x=>x.status==='active').length+' members')),h('button',{class:'btn alt sm',type:'button',on:{click:()=>{mem=!mem;drawServer()}}},ic('users',16),'Members'),leave),pills,h('div',{class:'split'},h('div',{class:'cv'},feed(ms,rep),composer('Message #'+((chs.find(x=>x.id===chn)||{}).name||''),async t=>{await call('/api/kids/servers/'+scur+'/c/'+chn,{text:t});await spoll()})),side))
}
const memberPanel=()=>{
const own=sd.role==='owner'
const inS=new Set(sd.members.map(x=>x.id))
const cand=own?act(fr).filter(f=>!inS.has(f.cid)):[]
const nc=h('input',{maxlength:'16',placeholder:'new-channel','aria-label':'Channel name'})
return h('aside',{class:'mp'},h('h3',null,'Members'),...sd.members.map(m=>h('div',{class:'fi pr'},pav(m.avatar,m.eq,'sm'),h('span',null,nm(m.display_name,m.eq),h('small',null,m.status==='invited'?'Invited':m.status==='review'?'Waiting for parent':m.role==='owner'?'Owner':m.online?'Online':'Away')),own&&m.role!=='owner'?h('button',{class:'btn alt sm',type:'button',on:{click:async()=>{if(!confirm('Remove '+m.display_name+'?'))return;try{await call('/api/kids/servers/'+scur+'/kick',{child:m.id});await refreshServer()}catch(e){fail(e)}}}},'Remove'):null)),
own?h('h3',null,'Invite a friend'):null,...cand.map(f=>h('div',{class:'fi pr'},pav(f.avatar,f.eq,'sm'),h('span',null,nm(f.display_name,f.eq)),h('button',{class:'btn sm',type:'button',on:{click:async()=>{try{await call('/api/kids/servers/'+scur+'/invite',{child:f.cid});say('Invite sent');await refreshServer()}catch(e){fail(e)}}}},'Invite'))),
own&&!cand.length?h('p',{class:'em'},'All your friends are already here.'):null,
own?h('h3',null,'Add a channel'):null,own?h('div',{class:'af'},nc,h('button',{class:'btn sm',type:'button',on:{click:async()=>{try{await call('/api/kids/servers/'+scur+'/channels',{name:nc.value});nc.value='';await refreshServer()}catch(e){fail(e)}}}},'Add')):null)
}
const refreshServer=async()=>{try{sd=await call('/api/kids/servers/'+scur);drawServer()}catch(e){fail(e)}}
const play=async id=>{
const g=GAMES.find(x=>x[0]===id)
try{
const{openTk}=await import('/js/tkshell.js')
openTk(id,{finish:async(score,secs)=>{
try{const r=await call('/api/kids/games/finish',{game:id,score,secs});if(r.pars>0)P.pars+=r.pars,P.earned+=r.pars;if(r.capped)say('That is the most Pars for today');drawRail();if(view==='game')drawGames();return r}catch(e){fail(e);return{pars:0}}
}})
}catch(e){say('Could not load '+g[1])}
}
const art=g=>{const e=h('div',{class:'ga'},ic('game',40));e.style.setProperty('--a',g[3]);e.style.setProperty('--b',g[4]);return e}
const drawGames=()=>{
const pct=Math.min(100,Math.round(P.earned/P.cap*100))
main.replaceChildren(h('div',{class:'kh'},h('div',{class:'ht'},h('b',null,'Games'))),h('div',{class:'kb2 wide'},
h('section',{class:'card hero'},h('div',{class:'hl'},h('h2',null,'Win Pars by playing'),h('p',null,'Play at least 15 seconds in a game to earn Pars. Spend them in the Shop.')),h('div',{class:'meter'},h('div',{class:'mt2'},coin(18),h('b',null,P.earned+' / '+P.cap),h('span',null,'earned today')),h('div',{class:'bar'},(()=>{const i=h('i');i.style.width=pct+'%';return i})())),P.bonus?h('button',{class:'btn pop',type:'button',on:{click:async()=>{try{await call('/api/kids/pars/bonus',{});P.pars+=15;P.bonus=false;say('+15 Pars');drawRail();drawGames()}catch(e){fail(e)}}}},'Claim +15 daily Pars'):null),
h('div',{class:'gg'},GAMES.map(g=>h('button',{class:'gc',type:'button',on:{click:()=>play(g[0])}},art(g),h('b',null,g[1]),h('span',null,g[2]),h('em',null,'Play'))))))
}
const buy=async it=>{try{await call('/api/kids/shop/buy',{item:it.id});P.pars-=it.price;P.owned.push(it.id);say('Bought '+it.name);drawRail();drawShop()}catch(e){fail(e)}}
const equip=async(it,kind)=>{try{const r=await call('/api/kids/shop/equip',{kind,item:it?it.id:null});P.eq=r.eq;drawRail();drawShop()}catch(e){fail(e)}}
const drawShop=()=>{
const list2=P.items.filter(i=>i.kind===shopTab)
const prevEq=(it)=>({...P.eq,[it.kind]:it.id})
const tile=it=>{
const own=P.owned.includes(it.id),on=P.eq[it.kind]===it.id,cant=P.pars<it.price
const pv=it.kind==='name'?h('div',{class:'pn'},nm(c.display_name,prevEq(it))):pav(c.avatar,prevEq(it),'lg')
return h('div',{class:'si'+(on?' eq':'')},h('div',{class:'sp2'},pv),h('b',null,it.name),own?h('button',{class:'btn sm'+(on?' alt':''),type:'button',on:{click:()=>equip(on?null:it,it.kind)}},on?'Remove':'Use'):h('button',{class:'btn sm pop',type:'button',disabled:cant,title:cant?'You need '+(it.price-P.pars)+' more Pars':'',on:{click:()=>buy(it)}},coin(16),String(it.price)))
}
main.replaceChildren(h('div',{class:'kh'},h('div',{class:'ht'},h('b',null,'Shop')),h('div',{class:'pcb'},coin(20),h('b',null,String(P.pars)))),h('div',{class:'kb2 wide'},
h('section',{class:'card mirror'},pav(c.avatar,P.eq,'xl'),h('div',null,nm(c.display_name,P.eq),h('p',null,'Earn Pars in Games, then dress up your profile.'))),
h('div',{class:'kt',role:'tablist'},TABS.map(([k,l])=>h('button',{type:'button',role:'tab','aria-selected':String(shopTab===k),on:{click:()=>{shopTab=k;drawShop()}}},l))),
h('div',{class:'sg'},list2.map(tile))))
}
const frow=(f)=>h('div',{class:'fi pr'},pav(f.avatar,f.eq,'sm'),h('span',null,nm(f.display_name,f.eq),h('small',null,'@'+f.username)),dot(f.online))
const drawFriends=()=>{
const inp=h('input',{maxlength:'20',autocomplete:'off',autocapitalize:'none',placeholder:'Friend code or username','aria-label':'Friend code or username',value:pre})
pre=''
const add=async()=>{const v=inp.value.trim();if(!v)return;try{await call('/api/kids/friends',{code:v});inp.value='';say('Sent. They have to accept, then both parents say yes.');load()}catch(e){fail(e)}}
inp.addEventListener('keydown',e=>{if(e.key==='Enter')add()})
const copy=async t=>{try{await navigator.clipboard.writeText(t);say('Copied')}catch{say(t)}}
const out=fr.filter(f=>f.status==='pending'&&!f.incoming),a=act(fr)
main.replaceChildren(h('div',{class:'kh'},h('div',{class:'ht'},h('b',null,'Friends'))),h('div',{class:'kb2 wide'},
h('section',{class:'card'},h('h2',null,'Add a friend'),h('p',null,'Type their friend code or username. They accept, then both parents say yes.'),h('div',{class:'af'},inp,h('button',{class:'btn',type:'button',on:{click:add}},'Send request'))),
inc().length?h('section',{class:'card hi'},h('h2',null,'Wants to be your friend'),inc().map(f=>h('div',{class:'fi pr'},pav(f.avatar,f.eq,'sm'),h('span',null,nm(f.display_name,f.eq),h('small',null,'@'+f.username)),h('div',{class:'ac'},h('button',{class:'btn sm',type:'button',on:{click:async()=>{try{await call('/api/kids/friends/'+f.id+'/accept',{});say('Accepted. Your parents will check it.');load()}catch(e){fail(e)}}}},'Accept'),h('button',{class:'btn alt sm',type:'button',on:{click:async()=>{try{await call('/api/kids/friends/'+f.id+'/decline',{});load()}catch(e){fail(e)}}}},'No thanks'))))):null,
out.length?h('section',{class:'card'},h('h2',null,'Sent requests'),out.map(f=>h('div',{class:'fi pr'},pav(f.avatar,f.eq,'sm'),h('span',null,nm(f.display_name,f.eq),h('small',null,'Waiting for them and your parents')),h('button',{class:'btn alt sm',type:'button',on:{click:async()=>{try{await call('/api/kids/friends/'+f.id+'/cancel',{});load()}catch(e){fail(e)}}}},'Cancel')))):null,
h('section',{class:'card'},h('h2',null,'Your friends ('+a.length+')'),a.length?a.map(f=>h('div',{class:'fi pr'},pav(f.avatar,f.eq,'sm'),h('span',null,nm(f.display_name,f.eq),h('small',null,f.online?'Online':'Away')),dot(f.online),h('div',{class:'ac'},h('button',{class:'btn sm',type:'button',on:{click:()=>{cur=f;last=0;msgs=[];view='chat';app.classList.add('in');drawAll();poll()}}},'Chat'),h('button',{class:'btn alt sm',type:'button',on:{click:async()=>{if(!confirm('Remove '+f.display_name+' from your friends?'))return;try{await call('/api/kids/friends/'+f.id+'/remove',{});if(cur&&cur.id===f.id)cur=null;load()}catch(e){fail(e)}}}},'Remove')))):h('p',{class:'em'},'No friends yet. Share your code below.')),
h('section',{class:'card'},h('h2',null,'Your friend code'),h('div',{class:'big'},code||'...'),h('div',{class:'row2'},h('button',{class:'btn alt sm',type:'button',on:{click:()=>copy(code)}},ic('copy',16),'Copy code'),h('button',{class:'btn alt sm',type:'button',on:{click:()=>copy(location.origin+'/kids/?f='+code)}},ic('copy',16),'Copy invite link')))))
if(inp.value)inp.focus()
}
const drawMain=()=>view==='chat'?drawChat():view==='server'?drawServer():view==='game'?drawGames():view==='shop'?drawShop():drawFriends()
const drawAll=()=>{app.dataset.v=view;drawRail();drawList();drawMain()}
const loadPars=async()=>{try{P=await call('/api/kids/pars')}catch(e){fail(e)}}
const load=async()=>{
try{
const[r,s]=await Promise.all([call('/api/kids/friends'),call('/api/kids/servers')])
fr=r.friends;code=r.code;off=!r.chat;svs=s.servers
if(cur&&!fr.find(f=>f.id===cur.id&&f.status==='active')){cur=null;app.classList.remove('in')}
if(scur&&!svs.find(x=>x.id===scur&&x.status==='active')){scur=null;sd=null}
const typing=document.activeElement&&main.contains(document.activeElement)&&document.activeElement.tagName==='INPUT'
drawRail();drawList();if(!typing)drawMain()
}catch(e){fail(e)}
}
const poll=async()=>{
if(!cur||document.hidden||view!=='chat')return
try{const r=await call('/api/kids/chat/'+cur.id+(last?'?after='+last:''));if(r.messages.length){if(!last)msgs=[];msgs.push(...r.messages);last=msgs[msgs.length-1].id;keep(drawChat)}else if(!last&&msgs.length){msgs=[];keep(drawChat)}}catch{}
}
const spoll=async()=>{
if(!scur||!chn||document.hidden||view!=='server')return
try{const r=await call('/api/kids/servers/'+scur+'/c/'+chn+(slast?'?after='+slast:''));if(r.messages.length){if(!slast)smsgs=[];smsgs.push(...r.messages);slast=smsgs[smsgs.length-1].id;keep(drawServer)}}catch{}
}
mount(root,h('main',{class:'kmain'},app,tst))
drawAll()
loadPars().then(()=>{drawRail();if(view==='game')drawGames();if(view==='shop')drawShop()})
load()
const t1=setInterval(()=>{if(!document.getElementById('app').contains(app)){clearInterval(t1);clearInterval(t2);clearInterval(t3)}},2000)
const t2=setInterval(()=>{poll();spoll()},3000)
const t3=setInterval(()=>{if(!document.hidden){load();loadPars().then(drawRail)}},15000)
}
