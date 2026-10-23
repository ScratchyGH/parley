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
['joke','Random joke'],['catfact','Cat fact'],['catpic','Cat picture'],['dogpic','Dog picture'],['advice','Random advice'],['quote','Inspiring quote'],['fact','Random fact'],['trivia','Trivia question'],['weather','Weather for a city'],['define','Define a word'],['wiki','Wikipedia summary'],['crypto','Crypto price in USD'],['pokemon','Pokémon info'],['time','Time in a time zone'],['xkcd','Latest xkcd comic'],['country','Country facts'],['github','GitHub user'],['npm','npm package'],['mcserver','Minecraft server status'],['mcuser','Minecraft player'],['exchange','Exchange rate'],['dadjoke','Dad joke'],['chuck','Chuck Norris joke'],['kanye','Kanye quote'],['fox','Fox picture'],['meal','Random meal'],['cocktail','Random cocktail']
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
xkcd:async()=>{const d=await getJson('https://xkcd.com/info.0.json');return d&&d.img?{text:cap(d.safe_title+' '+d.img),extra:{title:cap(d.safe_title),image:d.img,alt:cap(d.alt)}}:null},
country:async i=>{if(!i)return null;const d=await getJson('https://restcountries.com/v3.1/name/'+enc(i)+'?fields=name,capital,population,region');const c=d&&d[0];return c?{text:cap(`${c.name.common}: capital ${(c.capital||['none'])[0]}, ${c.region}, population ${c.population}`),extra:{capital:cap((c.capital||[''])[0],60),population:String(c.population),region:cap(c.region,40)}}:null},
github:async i=>{const u=String(i||'').trim().replace(/[^A-Za-z0-9-]/g,'').slice(0,39);if(!u)return null;const d=await getJson('https://api.github.com/users/'+u);return d&&d.login?{text:cap(`${d.login}: ${d.public_repos} repos, ${d.followers} followers${d.bio?', '+d.bio:''}`),extra:{repos:String(d.public_repos),followers:String(d.followers),url:d.html_url}}:null},
npm:async i=>{const n=String(i||'').trim().toLowerCase().replace(/[^a-z0-9@/._-]/g,'').slice(0,80);if(!n)return null;const d=await getJson('https://registry.npmjs.org/'+n.replace('/','%2F')+'/latest');return d&&d.version?{text:cap(`${d.name} ${d.version}: ${d.description||''}`),extra:{version:String(d.version)}}:null},
mcserver:async i=>{const h=String(i||'').trim().toLowerCase().replace(/[^a-z0-9.:-]/g,'').slice(0,80);if(!h)return null;const d=await getJson('https://api.mcsrvstat.us/3/'+h);if(!d)return null;return d.online?{text:cap(`${h} is online: ${d.players?d.players.online:0}/${d.players?d.players.max:0} players, ${d.version||'unknown version'}`),extra:{online:'yes',players:String(d.players?d.players.online:0),max:String(d.players?d.players.max:0),motd:cap(d.motd&&d.motd.clean?d.motd.clean.join(' '):'',100)}}:{text:h+' is offline',extra:{online:'no',players:'0'}}},
mcuser:async i=>{const u=String(i||'').trim().replace(/[^A-Za-z0-9_]/g,'').slice(0,16);if(!u)return null;const d=await getJson('https://playerdb.co/api/player/minecraft/'+u);const p=d&&d.data&&d.data.player;return p?{text:cap(`${p.username} (${p.id})`),extra:{username:p.username,uuid:p.id,avatar:p.avatar}}:null},
exchange:async i=>{const m=String(i||'USD EUR').toUpperCase().match(/([A-Z]{3})\W+([A-Z]{3})/);if(!m)return null;const d=await getJson('https://open.er-api.com/v6/latest/'+m[1]);const r=d&&d.rates&&d.rates[m[2]];return r?{text:`1 ${m[1]} = ${r} ${m[2]}`,extra:{rate:String(r)}}:null},
dadjoke:async()=>{const d=await getJson('https://icanhazdadjoke.com/');return d&&d.joke?{text:cap(d.joke)}:null},
chuck:async()=>{const d=await getJson('https://api.chucknorris.io/jokes/random');return d&&d.value?{text:cap(d.value)}:null},
kanye:async()=>{const d=await getJson('https://api.kanye.rest/');return d&&d.quote?{text:cap(d.quote)}:null},
fox:async()=>{const d=await getJson('https://randomfox.ca/floof/');return d&&d.image?{text:d.image}:null},
meal:async()=>{const d=await getJson('https://www.themealdb.com/api/json/v1/1/random.php');const m=d&&d.meals&&d.meals[0];return m?{text:cap(`${m.strMeal} (${m.strCategory}, ${m.strArea})`),extra:{name:cap(m.strMeal,80),image:m.strMealThumb}}:null},
cocktail:async()=>{const d=await getJson('https://www.thecocktaildb.com/api/json/v1/1/random.php');const m=d&&d.drinks&&d.drinks[0];return m?{text:cap(`${m.strDrink} (${m.strCategory})`),extra:{name:cap(m.strDrink,80),image:m.strDrinkThumb}}:null},
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
export const pathGet=(d,p)=>{
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
