import{fail,now,randHex,sha,pbkdf2,safeEq,str,limit,body,json}from'./util.js'
import{checkSecondFactor}from'./totp.js'
import{iters,ip}from'./auth.js'
const RE=/^[^\s@]{1,64}@[^\s@.]+(\.[^\s@.]+)+$/
const mask=e=>{const[a,b]=e.split('@');return a.slice(0,2)+'***@'+b}
const six=()=>String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,'0')
export const mailOn=env=>!!env.RESEND_API_KEY
const esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
function view(m){
const text=[m.title,'',...m.lines,...(m.code?['','Your code: '+m.code]:[]),...(m.note?['',m.note]:[]),'','Parley'].join('\n')
const p=t=>`<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#374151">${esc(t)}</p>`
const html=`<!doctype html><html><body style="margin:0;padding:0;background:#f3f4f6"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 12px"><tr><td align="center"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;font-family:Helvetica,Arial,sans-serif"><tr><td style="padding:24px 32px;border-bottom:1px solid #e5e7eb;font-size:18px;font-weight:700;letter-spacing:.3px;color:#111827">Parley</td></tr><tr><td style="padding:32px"><h1 style="margin:0 0 16px;font-size:20px;line-height:28px;color:#111827">${esc(m.title)}</h1>${m.lines.map(p).join('')}${m.code?`<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;padding:14px 24px;font-family:Consolas,Menlo,monospace;font-size:28px;letter-spacing:8px;font-weight:700;color:#111827">${esc(m.code)}</td></tr></table>`:''}${m.note?`<p style="margin:0;font-size:13px;line-height:20px;color:#6b7280">${esc(m.note)}</p>`:''}</td></tr><tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;font-size:12px;line-height:18px;color:#9ca3af">You received this because of activity on your Parley account. Parley will never ask for your password by email.</td></tr></table></td></tr></table></body></html>`
return{text,html}
}
export async function sendMail(env,to,subject,msg){
if(!env.RESEND_API_KEY)return false
const{text,html}=view(msg)
const ctl=new AbortController()
const t=setTimeout(()=>ctl.abort(),6000)
try{
const r=await fetch('https://api.resend.com/emails',{method:'POST',signal:ctl.signal,headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json'},body:JSON.stringify({from:env.MAIL_FROM||'Parley <onboarding@resend.dev>',to:[to],subject,text,html})})
return r.ok
}catch{return false}finally{clearTimeout(t)}
}
export async function alertUser(env,userId,subject,text){
const u=await env.DB.prepare('select email,email_verified from users where id=?').bind(userId).first()
if(u&&u.email&&u.email_verified)await sendMail(env,u.email,subject,{title:subject,lines:[text],note:'If this was not you, sign in and change your password, or reset it with this email address.'})
}
async function issue(env,userId,kind,email){
const code=six()
await env.DB.prepare('insert or replace into email_codes(user_id,kind,email,code_hash,tries,expires_at) values(?,?,?,?,0,?)').bind(userId,kind,email,await sha(code+':'+userId+':'+kind),now()+900000).run()
return code
}
async function check(env,userId,kind,code){
const row=await env.DB.prepare('select * from email_codes where user_id=? and kind=?').bind(userId,kind).first()
if(!row||row.expires_at<now()||row.tries>=5)return null
if(!safeEq(await sha(String(code).trim()+':'+userId+':'+kind),row.code_hash)){await env.DB.prepare('update email_codes set tries=tries+1 where user_id=? and kind=?').bind(userId,kind).run();return null}
await env.DB.prepare('delete from email_codes where user_id=? and kind=?').bind(userId,kind).run()
return row
}
export default function(r){
r.add('GET','/api/me/email',async c=>{
const u=await c.env.DB.prepare('select email,email_verified from users where id=?').bind(c.user.id).first()
return{enabled:mailOn(c.env),email:u&&u.email?mask(u.email):null,verified:!!(u&&u.email_verified)}
})
r.add('POST','/api/me/email',async c=>{
limit('em:'+c.user.id,6,3600000)
if(!mailOn(c.env))fail(503,'Email is not set up on this server yet')
const b=await body(c.req)
const email=str(b.email,3,120,'Email').trim().toLowerCase()
if(!RE.test(email))fail(400,'Enter a valid email address')
const pw=str(b.password,1,200,'Password')
if(!safeEq(await pbkdf2(pw,c.user.pass_salt,c.user.pass_iters),c.user.pass_hash))fail(403,'Password is incorrect')
const taken=await c.env.DB.prepare('select 1 x from users where lower(email)=? and email_verified=1 and id!=?').bind(email,c.user.id).first()
if(taken)fail(409,'That email is already used by another account')
await c.env.DB.prepare('update users set email=?,email_verified=0 where id=?').bind(email,c.user.id).run()
const code=await issue(c.env,c.user.id,'verify',email)
if(!await sendMail(c.env,email,'Confirm your email for Parley',{title:'Confirm your email',lines:['Enter this code in Parley settings to confirm this email address.'],code,note:'The code expires in 15 minutes. If you did not request it, you can ignore this email.'}))fail(502,'Could not send the email. Try again later.')
return{ok:true,email:mask(email)}
})
r.add('POST','/api/me/email/verify',async c=>{
limit('emv:'+c.user.id,20,3600000)
const b=await body(c.req)
const row=await check(c.env,c.user.id,'verify',str(b.code,4,10,'Code'))
if(!row)fail(400,'That code is wrong or expired')
const u=await c.env.DB.prepare('select email from users where id=?').bind(c.user.id).first()
if(!u||u.email!==row.email)fail(400,'That code is for a different email')
try{await c.env.DB.prepare('update users set email_verified=1 where id=?').bind(c.user.id).run()}catch{fail(409,'That email is already used by another account')}
await sendMail(c.env,row.email,'Email confirmed for Parley',{title:'Email confirmed',lines:['This email can now reset your password and will receive security alerts for your account.']})
return{ok:true}
})
r.add('POST','/api/me/email/remove',async c=>{
limit('emr:'+c.user.id,10,3600000)
const b=await body(c.req)
if(!safeEq(await pbkdf2(str(b.password,1,200,'Password'),c.user.pass_salt,c.user.pass_iters),c.user.pass_hash))fail(403,'Password is incorrect')
await alertUser(c.env,c.user.id,'Email removed from Parley','The email on your Parley account was removed.')
await c.env.DB.batch([c.env.DB.prepare('update users set email=null,email_verified=0 where id=?').bind(c.user.id),c.env.DB.prepare('delete from email_codes where user_id=?').bind(c.user.id)])
return{ok:true}
})
r.add('POST','/api/auth/forgot',async c=>{
limit('fg:'+ip(c),6,3600000)
const b=await body(c.req)
const email=str(b.email,3,120,'Email').trim().toLowerCase()
if(RE.test(email)&&mailOn(c.env)){
limit('fge:'+email,3,3600000)
const u=await c.env.DB.prepare('select id,suspended from users where lower(email)=? and email_verified=1 and deleted_at is null').bind(email).first()
if(u&&!u.suspended){const code=await issue(c.env,u.id,'reset',email);await sendMail(c.env,email,'Reset your Parley password',{title:'Reset your password',lines:['We received a request to reset the password on your account. Enter this code on the reset page to continue.'],code,note:'The code expires in 15 minutes. If you did not request this, ignore this email and your password will stay the same.'})}
}
return{ok:true}
},{auth:false})
r.add('POST','/api/auth/reset',async c=>{
limit('rs:'+ip(c),10,3600000)
const b=await body(c.req)
const email=str(b.email,3,120,'Email').trim().toLowerCase()
const pw=str(b.password,10,200,'Password')
const u=await c.env.DB.prepare('select * from users where lower(email)=? and email_verified=1 and deleted_at is null').bind(email).first()
const row=u&&await check(c.env,u.id,'reset',str(b.code,4,10,'Code'))
if(!u||!row)fail(400,'That code is wrong or expired')
if(u.totp_on&&!await checkSecondFactor(c.env,u,String(b.totp||'')))fail(401,'Enter your two-factor code too')
const salt=randHex(16),n=iters(c.env)
await c.env.DB.batch([c.env.DB.prepare('update users set pass_hash=?,pass_salt=?,pass_iters=? where id=?').bind(await pbkdf2(pw,salt,n),salt,n,u.id),c.env.DB.prepare('delete from sessions where user_id=?').bind(u.id)])
await sendMail(c.env,email,'Your Parley password was reset',{title:'Your password was reset',lines:['The password on your Parley account was just reset and every device was signed out.'],note:'If this was not you, contact support right away.'})
return json({ok:true})
},{auth:false})
}
