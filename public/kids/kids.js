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
const c=me.child
if(!c||c.status==='rejected')return create(id,tok,c&&c.status==='rejected')
if(c.status==='pending'){
shell(h('section',{class:'card'},h('h1',null,'Almost there'),h('p',null,'Your parent needs to look at your new account and say yes.'),h('div',{class:'me'},h('div',{class:'av'},face(c.avatar)),h('div',null,h('h2',null,c.display_name),h('p',null,'@'+c.username))),waiting('Waiting for your parent')))
later(async()=>{try{home(id,tok,keys,await api('/api/kids/me',undefined,tok))}catch{boot()}},4000)
return
}
shell(h('section',{class:'card'},h('span',{class:'tag'},'Approved by your parent'),h('div',{class:'me'},h('div',{class:'av'},face(c.avatar)),h('div',null,h('h1',null,'Hi '+c.display_name+'!'),h('p',null,'@'+c.username))),h('p',null,'Your account is ready and this device is unlocked. Chatting with friends and joining servers is not open yet. It will show up here when it is.')))
later(async()=>{try{home(id,tok,keys,await api('/api/kids/me',undefined,tok))}catch{boot()}},30000)
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
