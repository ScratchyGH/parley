import{badHost}from'./safety.js'
const CALLS=new Map()
const ent=s=>String(s).replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&eacute;/g,'é').replace(/&ldquo;|&rdquo;/g,'"').replace(/&rsquo;/g,"'")
const enc=s=>encodeURIComponent(String(s||'').trim().slice(0,60))
const cap=(s,n=500)=>String(s==null?'':s).replace(/\s+/g,' ').trim().slice(0,n)
async function getJson(url){
const ctl=new AbortController()
const t=setTimeout(()=>ctl.abort(),3500)
try{
const r=await fetch(url,{signal:ctl.signal,redirect:'error',headers:{'user-agent':'ParleyBot/1.0','accept':'application/json'}})
if(!r.ok||!r.body)return null
const rd=r.body.getReader(),dec=new TextDecoder()
let s='',n=0
while(n<200000){const{done,value}=await rd.read();if(done)break;n+=value.length;s+=dec.decode(value,{stream:true})}
rd.cancel().catch(()=>{})
return JSON.parse(s)
}catch{return null}finally{clearTimeout(t)}
}
export const PRESETS=[
['joke','Random joke'],['catfact','Cat fact'],['catpic','Cat picture'],['dogpic','Dog picture'],['advice','Random advice'],['quote','Inspiring quote'],['fact','Random fact'],['trivia','Trivia question'],['weather','Weather for a city'],['define','Define a word'],['wiki','Wikipedia summary'],['crypto','Crypto price in USD'],['pokemon','Pokémon info'],['time','Time in a time zone']
]
const RUN={
joke:async()=>{const d=await getJson('https://official-joke-api.appspot.com/random_joke');return d&&d.setup?{text:cap(d.setup+' '+d.punchline),extra:{setup:cap(d.setup),punchline:cap(d.punchline)}}:null},
catfact:async()=>{const d=await getJson('https://catfact.ninja/fact');return d&&d.fact?{text:cap(d.fact)}:null},
catpic:async()=>{const d=await getJson('https://api.thecatapi.com/v1/images/search');return d&&d[0]&&d[0].url?{text:d[0].url}:null},
dogpic:async()=>{const d=await getJson('https://dog.ceo/api/breeds/image/random');return d&&d.message?{text:d.message}:null},
advice:async()=>{const d=await getJson('https://api.adviceslip.com/advice');return d&&d.slip?{text:cap(d.slip.advice)}:null},
quote:async()=>{const d=await getJson('https://zenquotes.io/api/random');return d&&d[0]&&d[0].q?{text:cap(d[0].q+' - '+d[0].a),extra:{author:cap(d[0].a)}}:null},
fact:async()=>{const d=await getJson('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');return d&&d.text?{text:cap(d.text)}:null},
trivia:async()=>{const d=await getJson('https://opentdb.com/api.php?amount=1&type=boolean');const q=d&&d.results&&d.results[0];return q?{text:cap(ent(q.question)+' True or false?'),extra:{answer:q.correct_answer.toLowerCase()}}:null},
weather:async i=>{
if(!i)return null
const g=await getJson('https://geocoding-api.open-meteo.com/v1/search?count=1&name='+enc(i))
const p=g&&g.results&&g.results[0]
if(!p)return null
const w=await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&current=temperature_2m,wind_speed_10m,relative_humidity_2m`)
const c=w&&w.current
return c?{text:cap(`${p.name}: ${c.temperature_2m}°C, wind ${c.wind_speed_10m} km/h, humidity ${c.relative_humidity_2m}%`),extra:{temp:String(c.temperature_2m),wind:String(c.wind_speed_10m),humidity:String(c.relative_humidity_2m),city:cap(p.name)}}:null
},
define:async i=>{
if(!i)return null
const d=await getJson('https://api.dictionaryapi.dev/api/v2/entries/en/'+enc(i.split(/\s+/)[0]))
const m=d&&d[0]&&d[0].meanings&&d[0].meanings[0]
const f=m&&m.definitions&&m.definitions[0]
return f?{text:cap(f.definition),extra:{kind:cap(m.partOfSpeech,40)}}:null
},
wiki:async i=>{
if(!i)return null
const d=await getJson('https://en.wikipedia.org/api/rest_v1/page/summary/'+enc(i.replace(/\s+/g,'_')))
return d&&d.extract?{text:cap(d.extract,400),extra:{title:cap(d.title,100)}}:null
},
crypto:async i=>{
const id=String(i||'bitcoin').trim().toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,40)||'bitcoin'
const d=await getJson('https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids='+id)
const v=d&&d[id]&&d[id].usd
return v!=null?{text:'$'+v,extra:{price:String(v)}}:null
},
pokemon:async i=>{
const n=String(i||'pikachu').trim().toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,40)||'pikachu'
const d=await getJson('https://pokeapi.co/api/v2/pokemon/'+n)
return d&&d.name?{text:cap(`${d.name}: ${d.types.map(t=>t.type.name).join('/')}, height ${d.height/10} m, weight ${d.weight/10} kg`),extra:{pokemon:d.name,type:d.types.map(t=>t.type.name).join('/')}}:null
},
time:async i=>{
const z=String(i||'UTC').trim().replace(/[^A-Za-z0-9_\/+-]/g,'').slice(0,40)||'UTC'
try{return{text:new Intl.DateTimeFormat('en-US',{timeZone:z,dateStyle:'medium',timeStyle:'short'}).format(new Date())}}catch{return null}
}
}
function allow(key){
const t=Date.now(),r=CALLS.get(key)
if(!r||t-r.t>60000){CALLS.set(key,{t,n:1});if(CALLS.size>500)CALLS.delete(CALLS.keys().next().value);return true}
return++r.n<=20
}
export async function runApi(key,kind,input){
if(!allow(key))return null
const f=RUN[kind]
return f?f(cap(input,60)):null
}
const pathGet=(d,p)=>{
let v=d
for(const k of String(p).split('.').map(x=>x.trim()).filter(Boolean)){
if(v==null||typeof v!=='object')return undefined
v=Array.isArray(v)?v[Number(k)]:v[k]
}
return v
}
export async function runHttp(key,href,path){
if(!allow(key))return null
let u
try{u=new URL(href)}catch{return null}
const h=u.hostname.toLowerCase()
if(u.protocol!=='https:'||u.username||u.password||u.port||h==='localhost'||h.endsWith('.local')||h.endsWith('.internal')||/^[\d.]+$/.test(h)||h.includes(':')||!h.includes('.')||badHost(h))return null
const d=await getJson(u.href)
if(d==null)return null
const v=path?pathGet(d,path):d
if(v===undefined)return null
return{text:cap(typeof v==='object'?JSON.stringify(v):v)}
}
