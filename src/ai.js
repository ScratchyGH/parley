import{fail}from'./util.js'

export const PROVIDERS=['pollinations','chat','openrouter','custom']
const ERRTXT=/reached its budget|raise the key budget|api key|rate limit|too many requests|unauthorized|quota/i
const modelOk=m=>typeof m==='string'&&/^[a-zA-Z0-9._:\/-]{1,80}$/.test(m)
const keyOk=k=>typeof k==='string'&&/^[A-Za-z0-9_.\-]{8,300}$/.test(k)
function safeUrl(u){
let x
try{x=new URL(String(u))}catch{fail(400,'Custom endpoint is not a valid URL')}
if(x.protocol!=='https:')fail(400,'Custom endpoints must use https')
const h=x.hostname.toLowerCase()
if(x.username||x.password||h==='localhost'||/^\d+\.\d+\.\d+\.\d+$/.test(h)||h.includes(':')||h.endsWith('.local')||h.endsWith('.internal')||!h.includes('.'))fail(400,'Custom endpoints must be a public hostname')
let p=x.pathname.replace(/\/+$/,'')
if(!/\/chat\/completions$/.test(p))p+='/chat/completions'
return x.origin+p
}
async function openai(url,headers,payload,label,ms){
let res
try{res=await fetch(url,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(payload),signal:AbortSignal.timeout(ms)})}
catch{fail(504,label+' did not answer in time')}
if(res.status===429)fail(429,label+' is busy. Wait a moment and try again')
if(res.status===401||res.status===403)fail(502,label+' rejected the request. Check the key')
if(!res.ok)fail(502,label+' returned an error ('+res.status+')')
const j=await res.json().catch(()=>null)
const t=j&&j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content
if(typeof t!=='string'||!t.trim())fail(502,label+' returned nothing')
if(t.length<400&&ERRTXT.test(t))fail(502,label+' returned an error instead of an answer')
return t
}
export async function freeOpenRouter(){
try{
const r=await fetch('https://openrouter.ai/api/v1/models',{signal:AbortSignal.timeout(10000)})
const j=await r.json()
return(j.data||[]).filter(m=>m&&modelOk(m.id)&&m.pricing&&Number(m.pricing.prompt)===0&&Number(m.pricing.completion)===0&&!/embed|guard|vision|-vl|image|audio|moderation|lyria|router/i.test(m.id)&&(m.context_length||0)>=16000).map(m=>m.id).slice(0,40)
}catch{return[]}
}
export async function aiAsk(env,o){
const p=o.provider||'pollinations'
if(!PROVIDERS.includes(p))fail(400,'Choose an AI provider')
const msgs=[{role:'system',content:o.system},{role:'user',content:o.user}]
const ms=o.ms||40000
if(p==='pollinations'){
const model=modelOk(o.model)?o.model:'openai'
try{return await openai('https://text.pollinations.ai/openai',{},{model,messages:msgs},'Pollinations',ms)}
catch(e){
if(o.user.length>5500)throw e
let res
try{res=await fetch('https://text.pollinations.ai/'+encodeURIComponent(o.user)+'?system='+encodeURIComponent(o.system)+'&model='+encodeURIComponent(model),{signal:AbortSignal.timeout(ms)})}catch{throw e}
const t=res.ok?await res.text():''
if(!t.trim()||(t.length<400&&ERRTXT.test(t)))throw e
return t
}
}
if(p==='chat')return openai('https://ch.at/v1/chat/completions',{},{model:modelOk(o.model)?o.model:'gpt-4o',messages:msgs},'Ch.at',ms)
if(p==='openrouter'){
const key=keyOk(o.key)?o.key:env.OPENROUTER_API_KEY
if(!key)fail(400,'OpenRouter needs an API key. Paste yours in the key box (it is used for this request only) or ask the operator to set OPENROUTER_API_KEY')
const models=modelOk(o.model)?[o.model]:(env.OPENROUTER_MODEL?[env.OPENROUTER_MODEL]:(await freeOpenRouter()).slice(0,3))
if(!models.length)fail(502,'OpenRouter did not list any free models right now')
const run=m=>openai('https://openrouter.ai/api/v1/chat/completions',{authorization:'Bearer '+key,'x-title':'Parley'},{model:m,messages:msgs,max_tokens:o.max||4500,temperature:0.7},'OpenRouter ('+m+')',ms)
try{return await Promise.any(models.map(run))}catch(e){throw e.errors&&e.errors[0]||e}
}
const url=safeUrl(o.url)
if(!modelOk(o.model))fail(400,'Custom providers need a model name')
return openai(url,keyOk(o.key)?{authorization:'Bearer '+o.key}:{},{model:o.model,messages:msgs,max_tokens:o.max||4500},'Custom provider',ms)
}
export const pick=b=>({provider:b&&b.provider,model:b&&b.model,key:b&&b.key,url:b&&b.url})
export default function(r){
r.add('GET','/api/ai/providers',async c=>({providers:PROVIDERS,openrouter:{server_key:!!c.env.OPENROUTER_API_KEY},pollinations:{key:false},chat:{key:false}}))
}
