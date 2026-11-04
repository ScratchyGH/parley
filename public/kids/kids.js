import{h,api,mount,ls}from'/kids/ui.js'
const root=document.getElementById('app')
const DB='pk-device',ST='k'
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(ST);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})
const kget=async k=>{const d=await idb();return new Promise((res,rej)=>{const q=d.transaction(ST).objectStore(ST).get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
const kset=async(k,v)=>{const d=await idb();return new Promise((res,rej)=>{const q=d.transaction(ST,'readwrite').objectStore(ST).put(v,k);q.onsuccess=()=>res();q.onerror=()=>rej(q.error)})}
const kclear=async()=>{const d=await idb();return new Promise(res=>{const q=d.transaction(ST,'readwrite').objectStore(ST).clear();q.onsuccess=q.onerror=()=>res()})}
const b64=buf=>btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
const sign=async(key,msg)=>b64(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,new TextEncoder().encode(msg)))
const NS='http://www.w3.org/2000/svg'
const sv=(t,a,...k)=>{const e=document.createElementNS(NS,t);for(const[n,v]of Object.entries(a||{}))e.setAttribute(n,v);for(const c of k)e.append(c);return e}
const COL={fox:['#ff8a3d','#fff'],owl:['#9a7bff','#ffe9b8'],cat:['#6c7a99','#fff'],bear:['#b9774a','#f3d3b0'],frog:['#3ed6a0','#e6fff5'],panda:['#f2f2f2','#fff'],whale:['#3aa0ff','#e0f2ff'],bunny:['#ff9ec4','#fff']}
export const AVS=Object.keys(COL)
function face(name,size){
const[c,f]=COL[name]
const g=[]
const ear=(x,tall)=>name==='bunny'?sv('ellipse',{cx:x,cy:14,rx:9,ry:20,fill:c}):name==='owl'||name==='cat'||name==='fox'?sv('path',{d:'M'+(x-12)+' 36 L'+x+' 4 L'+(x+12)+' 36Z',fill:c}):sv('circle',{cx:x,cy:20,r:name==='whale'?0:12,fill:name==='panda'?'#222':c})
g.push(ear(24),ear(76))
g.push(sv('circle',{cx:50,cy:56,r:38,fill:c}))
g.push(sv('ellipse',{cx:50,cy:66,rx:24,ry:18,fill:f}))
if(name==='panda'){g.push(sv('ellipse',{cx:36,cy:50,rx:9,ry:12,fill:'#222'}),sv('ellipse',{cx:64,cy:50,rx:9,ry:12,fill:'#222'}))}
for(const x of[36,64]){g.push(sv('circle',{cx:x,cy:50,r:6,fill:'#fff'}),sv('circle',{cx:x,cy:51,r:3.4,fill:'#17254d'}))}
g.push(sv('path',{d:'M42 66 Q50 74 58 66',stroke:'#17254d','stroke-width':3,fill:'none','stroke-linecap':'round'}))
if(name==='fox'||name==='cat')g.push(sv('circle',{cx:50,cy:62,r:3.5,fill:'#17254d'}))
return sv('svg',{viewBox:'0 0 100 100',width:size||100,height:size||100,'aria-hidden':'true'},...g)
}
const logo=()=>h('div',{class:'brand'},h('i',null,sv('svg',{viewBox:'0 0 24 24'},sv('path',{d:'M4 6a3 3 0 013-3h10a3 3 0 013 3v8a3 3 0 01-3 3h-5l-5 4v-4a3 3 0 01-3-3z',fill:'#fff'}))),'Parley Kids')
const shell=(...k)=>mount(root,h('main',{class:'wrap'},logo(),...k,h('a',{class:'pv',href:'/kids/privacy.html',target:'_blank',rel:'noopener'},'Privacy notice for parents')))
const waiting=(t)=>h('div',{class:'dots','aria-label':t||'Waiting'},h('i'),h('i'),h('i'))
const wipe=async()=>{await kclear();ls.del('pk.dev');ls.del('pk.tok');ls.del('pk.pair');boot()}
let timer=0
const later=(f,ms)=>{clearTimeout(timer);timer=setTimeout(f,ms)}
async function getKeys(){
let k=await kget('keys')
if(!k){
const p=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},false,['sign','verify'])
const pub=await crypto.subtle.exportKey('jwk',p.publicKey)
k={priv:p.privateKey,pub:{kty:pub.kty,crv:pub.crv,x:pub.x,y:pub.y}}
await kset('keys',k)
}
return k
}
const nonce=id=>api('/api/kids/device/challenge',{id}).then(r=>r.nonce)
async function login(id,k){
const n=await nonce(id)
const r=await api('/api/kids/device/login',{id,sig:await sign(k.priv,'parley-kids|login|'+id+'|'+n)})
ls.set('pk.tok',r.token)
return r.token
}
function locked(msg){
shell(h('section',{class:'card'},h('h2',null,'This device is locked'),h('p',null,msg||'A parent removed this device from Parley Kids.'),h('p',null,'To use Parley Kids here again, ask a parent to add this device in PK Connect.'),h('button',{class:'btn alt',type:'button',on:{click:wipe}},'Set this device up again')))
}
async function boot(){
clearTimeout(timer)
if(!window.crypto||!crypto.subtle||!window.indexedDB){shell(h('section',{class:'card'},h('h2',null,'This browser cannot run Parley Kids'),h('p',null,'Open Parley Kids in an up to date browser or use the Parley Kids app.')));return}
let keys
try{keys=await getKeys()}catch{shell(h('section',{class:'card'},h('h2',null,'This device cannot keep Parley Kids safe'),h('p',null,'Private browsing blocks the secure storage Parley Kids needs. Open it in a normal window.')));return}
const id=ls.get('pk.dev')
if(!id)return register(keys)
let st
try{st=await api('/api/kids/device/status',{id})}catch{shell(h('section',{class:'card'},h('h2',null,'Cannot connect'),h('p',null,'Check your internet and try again.'),h('button',{class:'btn',type:'button',on:{click:boot}},'Try again')));later(boot,5000);return}
if(st.status==='unknown'||st.status==='expired'){await kclear();ls.del('pk.dev');ls.del('pk.tok');return boot()}
if(st.status==='revoked')return locked()
if(st.status==='new')return pairing(id)
if(st.status==='paired')return enter(id,keys)
let tok=ls.get('pk.tok')
if(tok){try{return home(id,tok,keys,await api('/api/kids/me',undefined,tok))}catch(e){if(e.status!==401&&e.status!==403)throw e}}
try{tok=await login(id,keys);home(id,tok,keys,await api('/api/kids/me',undefined,tok))}catch(e){e.status===403?locked(e.message):shell(h('section',{class:'card'},h('h2',null,'Cannot sign in'),h('p',null,e.message),h('button',{class:'btn',type:'button',on:{click:boot}},'Try again')))}
}
async function register(keys){
shell(h('section',{class:'card'},h('h2',null,'Getting ready'),waiting()))
try{
const r=await api('/api/kids/device',{pub:keys.pub})
ls.set('pk.dev',r.id)
ls.set('pk.pair',r.pair)
boot()
}catch(e){shell(h('section',{class:'card'},h('h2',null,'Cannot get ready'),h('div',{class:'err'},e.message),h('button',{class:'btn',type:'button',on:{click:boot}},'Try again')))}
}
function pairing(id){
let pair=''
pair=ls.get('pk.pair')||''
shell(h('section',{class:'card'},h('h1',null,'Ask a grown-up'),h('p',null,'A parent or guardian has to say yes before you can use Parley Kids. There is no way to skip this.'),pair?h('div',{class:'big'},pair):h('p',null,'Close and reopen Parley Kids to get a new device ID.'),h('ol',{class:'steps'},h('li',null,'Your parent opens PK Connect.'),h('li',null,'They choose Add child device.'),h('li',null,'They type the ID above.')),waiting('Waiting for your parent')))
later(boot,3000)
}
function enter(id,keys){
const inp=h('input',{class:'code',maxlength:'9',autocomplete:'off',autocapitalize:'characters',spellcheck:'false','aria-label':'Activation code',placeholder:'XXXX-XXXX'})
const err=h('div',{class:'err',hidden:true})
const go=h('button',{class:'btn',type:'button'},'Unlock')
const run=async()=>{
const code=inp.value.toUpperCase().replace(/[^A-Z0-9]/g,'')
if(code.length!==8){err.hidden=false;err.textContent='The code has 8 letters and numbers.';return}
go.disabled=true;err.hidden=true
try{
const n=await nonce(id)
const r=await api('/api/kids/device/activate',{id,code,sig:await sign(keys.priv,'parley-kids|activate|'+id+'|'+n+'|'+code)})
ls.set('pk.tok',r.token)
boot()
}catch(e){err.hidden=false;err.textContent=e.message;go.disabled=false}
}
go.addEventListener('click',run)
inp.addEventListener('keydown',e=>{if(e.key==='Enter')run()})
shell(h('section',{class:'card'},h('h1',null,'Enter the code'),h('p',null,'Your parent made a code for this device in PK Connect. Type it here.'),inp,err,go))
inp.focus()
later(async()=>{try{const s=await api('/api/kids/device/status',{id});if(s.status==='revoked')boot()}catch{}},10000)
}
function home(id,tok,keys,me){
document.documentElement.dataset.theme=me.theme||'normal'
const c=me.child
if(!c||c.status==='rejected')return create(id,tok,c&&c.status==='rejected')
if(c.status==='pending'){
shell(h('section',{class:'card'},h('h1',null,'Almost there'),h('p',null,'Your parent needs to look at your new account and say yes.'),h('div',{class:'me'},h('div',{class:'av'},face(c.avatar)),h('div',null,h('h2',null,c.display_name),h('p',null,'@'+c.username))),waiting('Waiting for your parent')))
later(async()=>{try{home(id,tok,keys,await api('/api/kids/me',undefined,tok))}catch{boot()}},4000)
return
}
chatApp(id,tok,keys,c)
}
const IC={chat:'M4 6a3 3 0 013-3h10a3 3 0 013 3v8a3 3 0 01-3 3h-5l-5 4v-4a3 3 0 01-3-3z',users:'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 20c0-3.3 3-5.5 7-5.5s7 2.2 7 5.5M17 4.5a3.5 3.5 0 010 6.5M19 14.8c1.8.7 3 2.2 3 4.2',plus:'M12 5v14M5 12h14',back:'M15 5l-7 7 7 7',copy:'M9 9h10v10H9zM5 15V5h10'}
const ic=n=>sv('svg',{viewBox:'0 0 24 24',width:22,height:22,fill:'none',stroke:'currentColor','stroke-width':2.2,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'},sv('path',{d:IC[n]}))
const tm=t=>new Date(t).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})
function chatApp(id,tok,keys,c){
let fr=[],cur=null,last=0,msgs=[],code='',off=false,tab='all',view='chat',pre=new URLSearchParams(location.search).get('f')||''
if(pre){view='add';tab='add';history.replaceState(null,'','/kids/')}
const call=(p,b)=>api(p,b,tok)
const rail=h('nav',{class:'kr','aria-label':'Parley Kids'}),ctx=h('aside',{class:'kc'}),main=h('section',{class:'km'})
const app=h('div',{class:'kapp'},rail,ctx,main)
const flash=h('div',{class:'err',hidden:true,role:'alert'})
const say=t=>{flash.hidden=false;flash.textContent=t;setTimeout(()=>{flash.hidden=true},6000)}
const act=fr2=>fr2.filter(f=>f.status==='active'),pend=()=>fr.filter(f=>f.status==='pending')
const drawRail=()=>rail.replaceChildren(
h('div',{class:'kl','aria-hidden':'true'},sv('svg',{viewBox:'0 0 24 24',width:26,height:26},sv('path',{d:IC.chat,fill:'#fff'}))),
...[['chat','Chats',()=>{tab='all';view='chat';app.classList.remove('in');drawAll()}],['users','Friends',()=>{tab=pend().length?'pending':'all';view='friends';drawAll()}],['plus','Add',()=>{tab='add';view='add';app.classList.add('in');drawAll()}]].map(([n,l,f])=>h('button',{class:'rb',type:'button','aria-label':l,title:l,'aria-current':(n==='chat'&&view==='chat')||(n==='users'&&view==='friends')||(n==='plus'&&view==='add')?'true':undefined,on:{click:f}},ic(n),pend().length&&n==='users'?h('b',null,String(pend().length)):null)))
const row=f=>h('button',{class:'fi',type:'button','aria-current':cur&&cur.id===f.id&&view==='chat'?'true':undefined,disabled:f.status!=='active',on:{click:()=>{cur=f;last=0;msgs=[];view='chat';app.classList.add('in');drawAll();poll()}}},h('i',{class:'av sm'},face(f.avatar)),h('span',null,f.display_name,h('small',null,'@'+f.username)),h('em',{class:'on'}))
const prow=f=>h('div',{class:'fi pr'},h('i',{class:'av sm'},face(f.avatar)),h('span',null,f.display_name,h('small',null,f.mine?'Waiting for your parents':'Wants to be friends. Your parents will check.')),f.mine?h('button',{class:'btn alt sm',type:'button',on:{click:async()=>{try{await call('/api/kids/friends/'+f.id+'/cancel',{});load()}catch(e){say(e.message)}}}},'Cancel'):null)
const drawCtx=()=>{
const a=act(fr),p=pend()
const tabs=h('div',{class:'kt',role:'tablist'},[['all','All',a.length],['pending','Pending',p.length]].map(([k,l,n])=>h('button',{type:'button',role:'tab','aria-selected':String(tab===k&&view!=='add'),on:{click:()=>{tab=k;if(view==='add')view='chat';drawAll()}}},l+(n?' '+n:''))))
const body=h('div',{class:'fl'},tab==='pending'?(p.length?p.map(prow):h('p',{class:'em'},'No requests right now.')):(a.length?a.map(row):h('p',{class:'em'},'No friends yet. Tap Add to invite someone.')))
ctx.replaceChildren(h('div',{class:'kch'},h('h2',null,'Friends'),h('button',{class:'rb sm',type:'button','aria-label':'Add a friend',on:{click:()=>{tab='add';view='add';app.classList.add('in');drawAll()}}},ic('plus'))),tabs,body,
h('div',{class:'ku'},h('i',{class:'av sm'},face(c.avatar)),h('span',null,h('b',null,c.display_name),h('small',null,'@'+c.username))),
h('a',{class:'pv',href:'/kids/privacy.html',target:'_blank',rel:'noopener'},'Privacy notice for parents'))
}
const link=()=>location.origin+'/kids/?f='+code
const cp=async t=>{try{await navigator.clipboard.writeText(t);say('Copied')}catch{say(t)}}
const drawAdd=()=>{
const inp=h('input',{maxlength:'20',autocomplete:'off',autocapitalize:'none',placeholder:'Friend code or username','aria-label':'Friend code or username',value:pre})
pre=''
const add=async()=>{const v=inp.value.trim();if(!v)return;try{await call('/api/kids/friends',{code:v});inp.value='';say('Sent. Your parents both have to say yes.');load()}catch(e){say(e.message)}}
inp.addEventListener('keydown',e=>{if(e.key==='Enter')add()})
main.replaceChildren(h('div',{class:'kh'},h('button',{class:'rb sm kb',type:'button','aria-label':'Back',on:{click:()=>{view='chat';app.classList.remove('in');drawAll()}}},ic('back')),h('b',null,'Add a friend')),
h('div',{class:'kb2'},h('section',{class:'card'},h('h2',null,'Add a friend'),h('p',null,'Type their friend code or username. Both of your parents have to say yes before you can chat.'),h('div',{class:'af'},inp,h('button',{class:'btn',type:'button',on:{click:add}},'Send request')),flash),
h('section',{class:'card'},h('h2',null,'Your friend code'),h('div',{class:'big'},code||'...'),h('div',{class:'row2'},h('button',{class:'btn alt sm',type:'button',on:{click:()=>cp(code)}},ic('copy'),'Copy code'),h('button',{class:'btn alt sm',type:'button',on:{click:()=>cp(link())}},ic('copy'),'Copy invite link')))))
if(pre===''&&inp.value==='')inp.focus()
}
const drawFriends=()=>main.replaceChildren(h('div',{class:'kh'},h('button',{class:'rb sm kb',type:'button','aria-label':'Back',on:{click:()=>{view='chat';app.classList.remove('in');drawAll()}}},ic('back')),h('b',null,'Friends')),
h('div',{class:'kb2'},h('section',{class:'card'},h('h2',null,'Requests'),pend().length?pend().map(prow):h('p',{class:'em'},'Nothing waiting.')),h('section',{class:'card'},h('h2',null,'All friends ('+act(fr).length+')'),act(fr).length?act(fr).map(row):h('p',{class:'em'},'No friends yet.'))))
const drawChat=()=>{
if(!cur){main.replaceChildren(h('div',{class:'ph'},h('h2',null,'Hi '+c.display_name+'!'),h('p',null,off?'Chat is paused. Ask your parent.':'Pick a friend on the left to chat. You can only chat with friends your parents said yes to.'),h('button',{class:'btn',type:'button',on:{click:()=>{tab='add';view='add';app.classList.add('in');drawAll()}}},'Add a friend')));return}
let prev=null
const box=h('div',{class:'ms',role:'log','aria-live':'polite'},msgs.map(m=>{
const who=m.mine?c:cur,first=!prev||prev.mine!==m.mine||m.at-prev.at>300000
prev=m
return h('div',{class:'mg'+(first?' f':'')},first?h('i',{class:'av sm'},face(who.avatar)):h('i',{class:'av sm sp'}),h('div',{class:'mt'},first?h('b',null,who.display_name,h('time',null,tm(m.at))):null,h('span',null,m.body)),m.mine?null:h('button',{class:'rp',type:'button',title:'Report this message',on:{click:async()=>{if(!confirm('Report this message and block this friend?'))return;try{await call('/api/kids/report',{msg:m.id});cur=null;load()}catch(e){say(e.message)}}}},'Report'))}))
const inp=h('input',{maxlength:'300',autocomplete:'off',placeholder:'Message '+cur.display_name,'aria-label':'Message',disabled:off})
const send=async()=>{const t=inp.value.trim();if(!t)return;inp.disabled=true;try{await call('/api/kids/chat/'+cur.id,{text:t});inp.value='';await poll()}catch(e){say(e.message)}inp.disabled=false;inp.focus()}
inp.addEventListener('keydown',e=>{if(e.key==='Enter')send()})
const blk=h('button',{class:'btn alt sm',type:'button',on:{click:async()=>{if(!confirm('Block '+cur.display_name+'?'))return;try{await call('/api/kids/friends/'+cur.id+'/block',{});cur=null;app.classList.remove('in');load()}catch(e){say(e.message)}}}},'Block')
main.replaceChildren(h('div',{class:'kh'},h('button',{class:'rb sm kb',type:'button','aria-label':'Back to friends',on:{click:()=>{app.classList.remove('in')}}},ic('back')),h('i',{class:'av sm'},face(cur.avatar)),h('b',null,cur.display_name),blk),box,flash,h('div',{class:'sd'},inp,h('button',{class:'btn',type:'button',on:{click:send}},'Send')))
box.scrollTop=box.scrollHeight
}
const drawAll=()=>{drawRail();drawCtx();view==='add'?drawAdd():view==='friends'?drawFriends():drawChat()}
const load=async()=>{
try{const r=await call('/api/kids/friends');fr=r.friends;code=r.code;off=!r.chat;if(cur&&!fr.find(f=>f.id===cur.id&&f.status==='active')){cur=null;app.classList.remove('in')}const keep=document.activeElement&&main.contains(document.activeElement)&&document.activeElement.tagName==='INPUT'
drawRail();drawCtx();if(!keep)view==='add'?drawAdd():view==='friends'?drawFriends():drawChat()}catch(e){if(e.status===401||e.status===403)boot()}
}
const poll=async()=>{
if(!cur||document.hidden)return
try{const r=await call('/api/kids/chat/'+cur.id+(last?'?after='+last:''));if(r.messages.length){if(!last)msgs=[];msgs.push(...r.messages);last=msgs[msgs.length-1].id;if(view==='chat')drawChat()}else if(!last&&msgs.length){msgs=[];if(view==='chat')drawChat()}}catch{}
}
mount(root,h('main',{class:'kmain'},app))
drawAll()
load()
const t1=setInterval(()=>{if(!document.getElementById('app').contains(app)){clearInterval(t1);clearInterval(t2);clearInterval(t3)}},2000)
const t2=setInterval(poll,3000)
const t3=setInterval(()=>{if(!document.hidden)load()},15000)
}
function create(id,tok,again){
let av='fox'
const un=h('input',{maxlength:'16',autocomplete:'off',autocapitalize:'none',spellcheck:'false','aria-label':'Username'})
const dn=h('input',{maxlength:'20',autocomplete:'off','aria-label':'Name'})
const err=h('div',{class:'err',hidden:true})
const btns=AVS.map(a=>h('button',{class:'av',type:'button','aria-label':a,'aria-pressed':String(a===av),on:{click:()=>{av=a;for(const b of btns)b.setAttribute('aria-pressed',String(b===btns[AVS.indexOf(a)]))}}},face(a)))
const go=h('button',{class:'btn',type:'button'},'Ask my parent')
go.addEventListener('click',async()=>{
go.disabled=true;err.hidden=true
try{await api('/api/kids/account',{username:un.value.trim(),display_name:dn.value.trim(),avatar:av},tok);boot()}catch(e){err.hidden=false;err.textContent=e.message;go.disabled=false}
})
shell(h('section',{class:'card'},h('h1',null,again?'Try again':'Make your account'),h('p',null,again?'Your parent asked for a change. Pick new details.':'Pick a name and a friend to be your picture. Your parent will check it before it starts.'),h('label',null,'Your name',dn),h('label',null,'Username (letters, numbers, _)',un),h('div',{class:'avs',role:'group','aria-label':'Pick a picture'},btns),err,go))
}
boot()
