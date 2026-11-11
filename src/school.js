import{sessionUser}from'./auth.js'
import{fail,body,sha,safeEq,limit,json}from'./util.js'
const PIN='9ns8'
const passFor=async d=>sha('school-pin:'+PIN+':'+d)
const dayKey=()=>{const c=clock(new Date());return c.y+'-'+c.m+'-'+c.d}
const cookieOf=req=>{const m=/(?:^|;\s*)sk=([a-f0-9]{64})/.exec(req.headers.get('cookie')||'');return m?m[1]:''}
const HOME=[34.9496,-81.932]
const MILES=15
const TOWNS=new Set(['spartanburg','boiling springs','duncan','lyman','wellford','inman','moore','roebuck','pacolet','reidville','woodruff','landrum','chesnee','cowpens','campobello','fingerville','enoree','startex','mayo'])
const KEY='school_block'
const DEF={on:true,start:'07:30',end:'15:30',off:[]}
let cache=null,at=0
async function config(env){
if(cache&&Date.now()-at<60000)return cache
let v=null
try{const r=await env.DB.prepare('select v from app_settings where k=?').bind(KEY).first();v=r?JSON.parse(r.v):null}catch{}
cache={...DEF,...(v&&typeof v==='object'?v:{})}
at=Date.now()
return cache
}
const rad=x=>x*Math.PI/180
function miles(la,lo){
const a=Math.sin(rad(la-HOME[0])/2)**2+Math.cos(rad(HOME[0]))*Math.cos(rad(la))*Math.sin(rad(lo-HOME[1])/2)**2
return 3958.8*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}
function inArea(cf){
if(!cf||cf.country!=='US'||cf.regionCode!=='SC')return false
if(TOWNS.has(String(cf.city||'').toLowerCase()))return true
const la=Number(cf.latitude),lo=Number(cf.longitude)
return Number.isFinite(la)&&Number.isFinite(lo)&&miles(la,lo)<=MILES
}
const FMT=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hourCycle:'h23',year:'numeric',month:'numeric',day:'numeric',weekday:'short',hour:'numeric',minute:'numeric'})
function clock(d){
const o={}
for(const p of FMT.formatToParts(d))o[p.type]=p.value
return{y:+o.year,m:+o.month,d:+o.day,wd:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(o.weekday),min:+o.hour*60+ +o.minute}
}
const mins=t=>{const m=/^(\d{1,2}):(\d{2})$/.exec(String(t));return m?+m[1]*60+ +m[2]:null}
const iso=(y,m,d)=>y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0')
function onBreak(c,cfg){
if(c.m===6||c.m===7||(c.m===8&&c.d<10))return true
if((c.m===12&&c.d>=21)||(c.m===1&&c.d<=3))return true
if(c.m===11){
const first=new Date(Date.UTC(c.y,10,1)).getUTCDay()
const thu=1+((4-first+7)%7)+21
if(c.d>=thu-3&&c.d<=thu+1)return true
}
const today=iso(c.y,c.m,c.d)
for(const e of cfg.off||[]){
const[a,b]=String(e).split('..')
if(b?(today>=a&&today<=b):today===a)return true
}
return false
}
export function schoolState(cfg,cf,date){
if(!cfg.on||!inArea(cf))return null
const c=clock(date||new Date())
if(c.wd<1||c.wd>5||onBreak(c,cfg))return null
const s=mins(cfg.start),e=mins(cfg.end)
if(s==null||e==null||c.min<s||c.min>=e)return null
const h=Math.floor(e/60),m=e%60
return{reopen:(h%12||12)+':'+String(m).padStart(2,'0')+(h<12?' AM':' PM')}
}
const ALLOW=/^\/(support(\/|$)|api\/support(\/|$)|api\/health$|api\/school\/unlock$|closed$)/
const page=t=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Parley is closed for school</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0d0d10;color:#ececf1;font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;padding:24px}main{max-width:460px}h1{font-size:30px;line-height:1.15;margin:0 0 12px}p{color:#a5a5b3;margin:0 0 14px}b{color:#ececf1}form{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:22px}label{color:#a5a5b3}input{width:96px;background:#16161b;border:1px solid #2c2c35;border-radius:8px;color:#ececf1;font:20px ui-monospace,Menlo,Consolas,monospace;letter-spacing:.3em;text-align:center;padding:8px}input:focus{outline:2px solid #e0728f}button{background:#e0728f;color:#1a0610;border:0;border-radius:8px;padding:10px 16px;font:700 15px system-ui;cursor:pointer}i{flex-basis:100%;color:#f0806a;font-style:normal;min-height:1.2em}small{display:block;margin-top:28px;color:#6f6f7c}a{color:#e0728f}</style></head><body><main><h1>Parley is closed during school hours</h1><p>It is school time in Spartanburg, so Parley is switched off. It opens again at <b>${t}</b>, Eastern.</p><p>Go learn something. The servers will still be here.</p><form id=f autocomplete=off><label for=p>Have a PIN?</label><input id=p maxlength=4 size=4 inputmode=text autocomplete=off autocapitalize=none spellcheck=false aria-label=PIN><button>Open</button><i id=e></i></form><script>const f=document.getElementById('f'),p=document.getElementById('p'),e=document.getElementById('e');async function go(){e.textContent='';try{const r=await fetch('/api/school/unlock',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify({pin:p.value})});if(r.ok){location.replace('/');return}const j=await r.json().catch(()=>({}));e.textContent=j.error||'Wrong PIN';p.value='';p.focus()}catch{e.textContent='Network error'}}f.onsubmit=ev=>{ev.preventDefault();go()};p.oninput=()=>{if(p.value.length===4)go()};p.focus()</script><small>Not in Spartanburg? Your connection may look like it is. <a href="/support/">Tell support</a>.</small></main></body></html>`
export async function schoolGate(env,req,url){
const cf=req.cf
if(!cf||cf.regionCode!=='SC')return null
const cfg=await config(env)
const st=schoolState(cfg,cf)
const p=url.pathname
if(!st){
if(p==='/closed')return new Response(null,{status:302,headers:{location:'/'}})
return null
}
if(ALLOW.test(p)&&p!=='/closed')return null
if(cookieOf(req)&&safeEq(cookieOf(req),await passFor(dayKey())))return null
if(/(?:^|;\s*)sid=/.test(req.headers.get('cookie')||'')){
try{const u=await sessionUser(env,req);if(u&&u.admin)return null}catch{}
}
const h={'cache-control':'no-store'}
if(p.startsWith('/api/')||p==='/ws')return new Response(JSON.stringify({error:'Parley is closed during school hours in Spartanburg. It opens at '+st.reopen+' Eastern.',schoolHours:true}),{status:403,headers:{...h,'content-type':'application/json'}})
return new Response(page(st.reopen),{status:423,headers:{...h,'content-type':'text/html;charset=utf-8','x-frame-options':'DENY'}})
}
export default function(r){
r.add('POST','/api/school/unlock',async c=>{
limit('sp:'+(c.req.headers.get('cf-connecting-ip')||'local'),10,600000)
const b=await body(c.req,200)
if(String(b.pin||'').trim().toLowerCase()!==PIN)fail(403,'Wrong PIN')
const sec=c.url.protocol==='https:'?'; Secure':''
return json({ok:true},200,{'set-cookie':'sk='+await passFor(dayKey())+'; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200'+sec})
},{auth:false})
r.add('GET','/api/admin/school-block',async c=>{
if(!c.user.admin)fail(404,'Not found')
return await config(c.env)
})
r.add('POST','/api/admin/school-block',async c=>{
if(!c.user.admin)fail(404,'Not found')
const b=await body(c.req)
const v={on:b.on!==false,start:mins(b.start)==null?DEF.start:b.start,end:mins(b.end)==null?DEF.end:b.end,off:(Array.isArray(b.off)?b.off:[]).map(x=>String(x).trim()).filter(x=>/^\d{4}-\d{2}-\d{2}(\.\.\d{4}-\d{2}-\d{2})?$/.test(x)).slice(0,60)}
await c.env.DB.prepare('insert into app_settings(k,v) values(?,?) on conflict(k) do update set v=excluded.v').bind(KEY,JSON.stringify(v)).run()
cache=null
return v
})
}
