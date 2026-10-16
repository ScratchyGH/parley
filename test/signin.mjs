import http from'node:http'
import crypto from'node:crypto'
const BASE=process.env.BASE||'http://127.0.0.1:8787'
const HOST=new URL(BASE).hostname
const run=Math.random().toString(36).slice(2,8)
let pass=0,bad=0
const ok=(c,n)=>{if(c){pass++;console.log('  ok  '+n)}else{bad++;console.log('FAIL  '+n)}}
const eq=(a,b,n)=>ok(JSON.stringify(a)===JSON.stringify(b),n+(JSON.stringify(a)===JSON.stringify(b)?'':` (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`))
const base=Math.floor(Math.random()*1e9)
let subject=String(base),login='octo'+run,tokenOk=true
const fake=http.createServer((q,s)=>{
if(q.url.startsWith('/token')){s.setHeader('content-type','application/json');s.end(JSON.stringify(tokenOk?{access_token:'t'}:{error:'bad'}))}
else if(q.url.startsWith('/user')){s.setHeader('content-type','application/json');s.end(JSON.stringify({id:Number(subject),login}))}
else{s.statusCode=404;s.end()}
}).listen(8799)
const ip=()=>`10.${Math.floor(Math.random()*250)}.${Math.floor(Math.random()*250)}.${Math.floor(Math.random()*250)}`
class C{
constructor(){this.ip=ip();this.cookies={}}
hdr(){return{'cf-connecting-ip':this.ip,cookie:Object.entries(this.cookies).map(([k,v])=>k+'='+v).join('; ')}}
eat(r){for(const sc of r.headers.getSetCookie()){const m=sc.match(/^([^=]+)=([^;]*)/);if(m){if(m[2]==='')delete this.cookies[m[1]];else this.cookies[m[1]]=m[2]}}}
async go(method,path,body){
const h=this.hdr()
let b
if(body!==undefined){h['content-type']='application/json';b=JSON.stringify(body)}
const r=await fetch(BASE+path,{method,headers:h,body:b,redirect:'manual'})
this.eat(r)
let j=null
if((r.headers.get('content-type')||'').includes('json'))j=await r.json().catch(()=>null)
return{s:r.status,j,loc:r.headers.get('location')||''}
}
}
async function oauthLogin(c,mode){
const st=await c.go('GET','/api/auth/oauth/github/start'+(mode?'?mode='+mode:''))
const u=new URL(st.loc)
const state=u.searchParams.get('state')
return{st,u,cb:await c.go('GET','/api/auth/oauth/github/callback?code=abc&state='+state)}
}
function cborBytes(b){return b.length<24?Buffer.concat([Buffer.from([0x40+b.length]),b]):Buffer.concat([Buffer.from([0x58,b.length]),b])}
const b64u=b=>Buffer.from(b).toString('base64url')
async function main(){
let a=new C()
let r=await a.go('GET','/api/auth/providers')
eq(r.j.oauth.map(x=>x.id),['github'],'only configured providers listed')
ok(r.j.passkeys,'passkeys advertised')
r=await a.go('GET','/api/auth/oauth/google/start')
ok(r.loc.includes('autherror'),'unconfigured provider redirects with error')
r=await a.go('GET','/api/auth/oauth/github/start')
const u=new URL(r.loc)
eq(u.origin+u.pathname,'http://127.0.0.1:8799/authorize','start redirects to provider')
eq(u.searchParams.get('client_id'),'test-id','client id sent')
ok(u.searchParams.get('redirect_uri').endsWith('/api/auth/oauth/github/callback'),'redirect uri set')
ok(!!a.cookies.oas,'state cookie set')
r=await a.go('GET','/api/auth/oauth/github/callback?code=abc&state='+'0'.repeat(32))
ok(r.loc.includes('autherror'),'wrong state rejected')
ok(!a.cookies.sid,'no session after bad state')
a=new C()
let o=await oauthLogin(a)
eq(o.cb.s,302,'callback redirects')
eq(o.cb.loc,'/','callback lands on app')
ok(!!a.cookies.sid&&!a.cookies.oas,'session set and state cleared')
r=await a.go('GET','/api/me')
eq(r.s,200,'oauth session works')
ok(r.j.user.username.startsWith('octo'),'username derived from provider')
const uid=r.j.user.id
let b=new C()
o=await oauthLogin(b)
eq((await b.go('GET','/api/me')).j.user.id,uid,'same provider account signs into same user')
tokenOk=false
b=new C()
o=await oauthLogin(b)
ok(o.cb.loc.includes('autherror'),'failed token exchange reported')
tokenOk=true
r=await a.go('GET','/api/me/security')
eq(r.j.identities.length,1,'identity listed');eq(r.j.has_password,false,'oauth-only account has no password')
eq((await a.go('DELETE','/api/me/identities/github')).s,409,'cannot remove the only sign-in method')
r=await a.go('POST','/api/me/setpassword',{password:'short'});eq(r.s,400,'short password refused')
r=await a.go('POST','/api/me/setpassword',{password:'correct horse battery'});eq(r.s,200,'set password');ok(!!r.j.recovery_code,'recovery code issued')
eq((await a.go('POST','/api/me/setpassword',{password:'correct horse battery'})).s,409,'password set only once')
const un=(await a.go('GET','/api/me')).j.user.username
b=new C()
r=await b.go('POST','/api/auth/login',{username:un,password:'correct horse battery'});eq(r.s,200,'password login after set')
eq((await a.go('DELETE','/api/me/identities/github')).s,200,'can unlink when password exists')
b=new C()
o=await oauthLogin(b)
ok((await b.go('GET','/api/me')).j.user.id!==uid,'unlinked provider account creates a new user')
subject=String(base+1);login='other'+run
const d=new C()
r=await d.go('POST','/api/auth/register',{username:'linker'+run,password:'correct horse battery'});eq(r.s,201,'register password user')
r=await d.go('GET','/api/auth/oauth/github/start?mode=link');ok(r.loc.startsWith('http://127.0.0.1:8799'),'link start with session')
const state=new URL(r.loc).searchParams.get('state')
r=await d.go('GET','/api/auth/oauth/github/callback?code=abc&state='+state);eq(r.loc,'/','link succeeds')
eq((await d.go('GET','/api/me/security')).j.identities.length,1,'linked identity listed')
const f=new C()
r=await f.go('GET','/api/auth/oauth/github/start?mode=link');ok(r.loc.includes('autherror'),'link start needs a session')
const e=new C()
await e.go('POST','/api/auth/register',{username:'linker2'+run,password:'correct horse battery'})
r=await e.go('GET','/api/auth/oauth/github/start?mode=link')
r=await e.go('GET','/api/auth/oauth/github/callback?code=abc&state='+new URL(r.loc).searchParams.get('state'))
ok(r.loc.includes('autherror'),'identity linked elsewhere cannot be stolen')
const g=new C()
o=await oauthLogin(g)
eq((await g.go('GET','/api/me')).j.user.id,(await d.go('GET','/api/me')).j.user.id,'linked identity signs into the linking account')

const kp=crypto.generateKeyPairSync('ec',{namedCurve:'P-256'})
const jwk=kp.publicKey.export({format:'jwk'})
const credId=crypto.randomBytes(32)
const rp=crypto.createHash('sha256').update(HOST).digest()
const cdj=(type,ch)=>Buffer.from(JSON.stringify({type,challenge:ch,origin:BASE}))
r=await d.go('POST','/api/me/passkeys/options',{})
eq(r.s,200,'passkey registration options');eq(r.j.publicKey.rp.id,HOST,'rp id is host')
const cose=Buffer.concat([Buffer.from([0xa5,0x01,0x02,0x03,0x26,0x20,0x01,0x21,0x58,0x20]),Buffer.from(jwk.x,'base64url'),Buffer.from([0x22,0x58,0x20]),Buffer.from(jwk.y,'base64url')])
const ad=Buffer.concat([rp,Buffer.from([0x45,0,0,0,0]),Buffer.alloc(16),Buffer.from([0,credId.length]),credId,cose])
const att=Buffer.concat([Buffer.from([0xa3,0x63]),Buffer.from('fmt'),Buffer.from([0x64]),Buffer.from('none'),Buffer.from([0x67]),Buffer.from('attStmt'),Buffer.from([0xa0,0x68]),Buffer.from('authData'),cborBytes(ad)])
const regBody=ch=>({clientDataJSON:b64u(cdj('webauthn.create',ch)),attestationObject:b64u(att),name:'Test key'})
eq((await d.go('POST','/api/me/passkeys',regBody('bogus'))).s,400,'unknown challenge rejected')
r=await d.go('POST','/api/me/passkeys/options',{})
const evil=Buffer.from(JSON.stringify({type:'webauthn.create',challenge:r.j.publicKey.challenge,origin:'https://evil.test'}))
eq((await d.go('POST','/api/me/passkeys',{clientDataJSON:b64u(evil),attestationObject:b64u(att)})).s,400,'wrong origin rejected')
r=await d.go('POST','/api/me/passkeys/options',{})
r=await d.go('POST','/api/me/passkeys',regBody(r.j.publicKey.challenge));eq(r.s,201,'register passkey')
eq((await d.go('GET','/api/me/security')).j.passkeys.length,1,'passkey listed')
r=await d.go('POST','/api/me/passkeys/options',{})
const again=await d.go('POST','/api/me/passkeys',regBody(r.j.publicKey.challenge));eq(again.s,409,'duplicate credential refused')
const sign=async(counter,tamper)=>{
const o=await new C().go('POST','/api/auth/passkey/options',{})
const ch=o.j.publicKey.challenge
const cd=cdj('webauthn.get',ch)
const cb=Buffer.alloc(4);cb.writeUInt32BE(counter)
const auth=Buffer.concat([rp,Buffer.from([0x05]),cb])
const sig=crypto.sign('sha256',Buffer.concat([auth,crypto.createHash('sha256').update(tamper?Buffer.from('x'):cd).digest()]),kp.privateKey)
const c=new C()
const res=await c.go('POST','/api/auth/passkey/login',{id:b64u(credId),clientDataJSON:b64u(cd),authenticatorData:b64u(auth),signature:b64u(sig)})
return{c,res}
}
let p=await sign(1)
eq(p.res.s,200,'passkey sign-in');ok(!!p.c.cookies.sid,'passkey session cookie')
eq((await p.c.go('GET','/api/me')).j.user.id,(await d.go('GET','/api/me')).j.user.id,'passkey signs into the right user')
p=await sign(1);eq(p.res.s,401,'replayed counter rejected')
p=await sign(2,true);eq(p.res.s,401,'bad signature rejected')
p=await sign(3);eq(p.res.s,200,'counter advances')
r=await d.go('POST','/api/auth/passkey/login',{id:b64u(credId),clientDataJSON:b64u(cdj('webauthn.get','nope')),authenticatorData:b64u(Buffer.alloc(40)),signature:b64u(Buffer.alloc(8))});eq(r.s,400,'unknown challenge rejected at login')
eq((await d.go('DELETE','/api/me/passkeys/'+b64u(credId))).s,200,'remove passkey')
p=await sign(9);eq(p.res.s,401,'removed passkey no longer works')
fake.close()
console.log(`\n${pass} passed, ${bad} failed`)
process.exit(bad?1:0)
}
main().catch(e=>{console.error('crashed',e);fake.close();process.exit(2)})
