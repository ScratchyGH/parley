import{enc,fail,str,body,json,randHex,sha,safeEq,pbkdf2,limit}from'./util.js'
const B32='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
export function newSecret(){
const b=crypto.getRandomValues(new Uint8Array(20))
let bits='',out=''
for(const x of b)bits+=x.toString(2).padStart(8,'0')
for(let i=0;i<bits.length;i+=5)out+=B32[parseInt(bits.slice(i,i+5),2)]
return out
}
function unb32(s){
let bits=''
for(const ch of s){const v=B32.indexOf(ch);if(v<0)return null;bits+=v.toString(2).padStart(5,'0')}
const out=new Uint8Array(Math.floor(bits.length/8))
for(let i=0;i<out.length;i++)out[i]=parseInt(bits.slice(i*8,i*8+8),2)
return out
}
async function code(secret,step){
const k=await crypto.subtle.importKey('raw',unb32(secret),{name:'HMAC',hash:'SHA-1'},false,['sign'])
const msg=new Uint8Array(8)
new DataView(msg.buffer).setUint32(4,step)
const h=new Uint8Array(await crypto.subtle.sign('HMAC',k,msg))
const o=h[19]&15
const n=((h[o]&0x7f)<<24)|(h[o+1]<<16)|(h[o+2]<<8)|h[o+3]
return String(n%1000000).padStart(6,'0')
}
export async function verifyTotp(secret,input,t=Date.now()){
if(!secret||!/^\d{6}$/.test(input))return false
const step=Math.floor(t/30000)
let ok=false
for(const d of[-1,0,1])if(safeEq(await code(secret,step+d),input))ok=true
return ok
}
export const genCode=code
const backupCodes=()=>Array.from({length:8},()=>randHex(4).replace(/(.{4})(.{4})/,'$1-$2'))

export async function checkSecondFactor(env,u,input){
if(typeof input!=='string')return false
const t=input.trim().toLowerCase()
if(await verifyTotp(u.totp_secret,t))return true
if(/^[0-9a-f]{4}-[0-9a-f]{4}$/.test(t)&&u.backup_hashes){
const list=JSON.parse(u.backup_hashes)
const h=await sha(t)
const i=list.indexOf(h)
if(i>=0){list.splice(i,1);await env.DB.prepare('update users set backup_hashes=? where id=?').bind(JSON.stringify(list),u.id).run();return true}
}
return false
}

export default function(r){
const pwOk=async(c,pw)=>safeEq(await pbkdf2(str(pw,1,200,'Password'),c.user.pass_salt,c.user.pass_iters),c.user.pass_hash)
r.add('POST','/api/me/2fa/setup',async c=>{
limit('2fa:'+c.user.id,10,600000)
const b=await body(c.req)
if(!await pwOk(c,b.password))fail(403,'Password is incorrect')
if(c.user.totp_on)fail(409,'Two-factor authentication is already on')
const secret=newSecret()
await c.env.DB.prepare('update users set totp_secret=? where id=?').bind(secret,c.user.id).run()
return{secret,uri:`otpauth://totp/Parley:${encodeURIComponent(c.user.username)}?secret=${secret}&issuer=Parley&algorithm=SHA1&digits=6&period=30`}
})
r.add('POST','/api/me/2fa/enable',async c=>{
limit('2fa:'+c.user.id,10,600000)
const b=await body(c.req)
if(c.user.totp_on)fail(409,'Two-factor authentication is already on')
if(!c.user.totp_secret)fail(400,'Start setup first')
if(!await verifyTotp(c.user.totp_secret,String(b.code||'')))fail(400,'That code is not valid. Check your authenticator app clock and try again.')
const codes=backupCodes()
await c.env.DB.prepare('update users set totp_on=1,backup_hashes=? where id=?').bind(JSON.stringify(await Promise.all(codes.map(x=>sha(x)))),c.user.id).run()
return{backup_codes:codes}
})
r.add('POST','/api/me/2fa/disable',async c=>{
limit('2fa:'+c.user.id,10,600000)
const b=await body(c.req)
if(!await pwOk(c,b.password))fail(403,'Password is incorrect')
if(!c.user.totp_on)fail(409,'Two-factor authentication is off')
if(!await checkSecondFactor(c.env,c.user,String(b.code||'')))fail(403,'That code is not valid')
await c.env.DB.prepare('update users set totp_on=0,totp_secret=null,backup_hashes=null where id=?').bind(c.user.id).run()
return{ok:true}
})
}
