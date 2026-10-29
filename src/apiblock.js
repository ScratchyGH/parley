import{badHost}from'./safety.js'
import{parseFeed,parsePage}from'./labmore2.js'
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
async function getText(url){
const ctl=new AbortController()
const t=setTimeout(()=>ctl.abort(),3500)
try{
const r=await fetch(url,{signal:ctl.signal,redirect:'error',headers:{'user-agent':'ParleyBot/1.0','accept':'text/html,application/xml,application/rss+xml,application/atom+xml'}})
if(!r.ok||!r.body)return null
const rd=r.body.getReader(),dec=new TextDecoder()
let s='',n=0
while(n<300000){const{done,value}=await rd.read();if(done)break;n+=value.length;s+=dec.decode(value,{stream:true})}
rd.cancel().catch(()=>{})
return s
}catch{return null}finally{clearTimeout(t)}
}
async function place(i){
if(!i)return null
const g=await getJson('https://geocoding-api.open-meteo.com/v1/search?count=1&name='+enc(i))
return g&&g.results&&g.results[0]||null
}
export const PRESETS=[
['joke','Random joke'],['catfact','Cat fact'],['catpic','Cat picture'],['dogpic','Dog picture'],['advice','Random advice'],['quote','Inspiring quote'],['fact','Random fact'],['trivia','Trivia question'],['weather','Weather for a city'],['define','Define a word'],['wiki','Wikipedia summary'],['crypto','Crypto price in USD'],['pokemon','Pokémon info'],['time','Time in a time zone'],['xkcd','Latest xkcd comic'],['country','Country facts'],['github','GitHub user'],['npm','npm package'],['mcserver','Minecraft server status'],['mcuser','Minecraft player'],['exchange','Exchange rate'],['dadjoke','Dad joke'],['chuck','Chuck Norris joke'],['kanye','Kanye quote'],['fox','Fox picture'],['meal','Random meal'],['cocktail','Random cocktail'],['bored','Something to do'],['agify','Guess an age from a name'],['nationalize','Guess a country from a name'],['zip','Look up a zip code'],['spacex','Latest SpaceX launch'],['rickmorty','Random Rick and Morty character'],['dnd','D&D monster stats'],['meowfact','More cat facts'],['dogfact','Dog fact'],['hn','Hacker News top story'],['ghrepo','GitHub repo stats (owner/name)'],['pypi','Python package version'],['crates','Rust crate version'],['wikirandom','Random Wikipedia article'],['rhyme','Words that rhyme'],['synonym','Synonyms of a word'],['coinprice','Crypto price in USD (BTC, ETH)'],['progjoke','Programming joke'],['bible','Bible verse (john 3:16)'],['anime','Anime lookup or random'],['tv','TV show lookup'],['song','Song lookup'],['chess','Chess.com ratings'],['lichess','Lichess ratings'],['wayback','Wayback Machine snapshot'],['trending','Trending coins'],['feargreed','Crypto fear and greed'],['stoic','Stoic quote'],['affirmation','Affirmation'],['ronswanson','Ron Swanson quote'],['riddle','Random riddle'],['mtg','Magic card (or random)'],['yugioh','Yu-Gi-Oh card'],['duck','Duck picture'],['brewery','Random brewery'],['spacenews','Latest space news'],['uuid','Random UUID']
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
dd_invite:async i=>{const c=String(i||'').trim().replace(/[?#].*$/,'').split('/').pop().replace(/[^A-Za-z0-9-]/g,'').slice(0,32);if(!c)return null;const d=await getJson('https://discord.com/api/v10/invites/'+c+'?with_counts=true');if(!d||!d.guild)return null;const g=d.guild;return{text:cap(`${g.name}: ${d.approximate_member_count||0} members, ${d.approximate_presence_count||0} online`),extra:{server:cap(g.name,100),members:String(d.approximate_member_count||0),online:String(d.approximate_presence_count||0),id:String(g.id),code:c,channel:cap(d.channel&&d.channel.name,60),about:cap(g.description,200),inviter:cap(d.inviter&&(d.inviter.global_name||d.inviter.username),60)}}},
dd_widget:async i=>{const id=String(i||'').replace(/\D/g,'').slice(0,20);if(!id)return null;const d=await getJson('https://discord.com/api/guilds/'+id+'/widget.json');if(!d||!d.name)return null;return{text:cap(`${d.name}: ${d.presence_count} online`),extra:{server:cap(d.name,100),online:String(d.presence_count),invite:cap(d.instant_invite,100),people:cap((d.members||[]).slice(0,10).map(m=>m.username).join(', '),300)}}},
dd_template:async i=>{const c=String(i||'').trim().replace(/[?#].*$/,'').split('/').pop().replace(/[^A-Za-z0-9-]/g,'').slice(0,32);if(!c)return null;const d=await getJson('https://discord.com/api/v10/guilds/templates/'+c);return d&&d.name?{text:cap(`${d.name}: used ${d.usage_count} times`+(d.description?', '+d.description:'')),extra:{name:cap(d.name,100),uses:String(d.usage_count),about:cap(d.description,200),creator:cap(d.creator&&(d.creator.global_name||d.creator.username),60)}}:null},
dd_app:async i=>{const id=String(i||'').replace(/\D/g,'').slice(0,20);if(!id)return null;const d=await getJson('https://discord.com/api/v10/applications/'+id+'/rpc');return d&&d.name?{text:cap(d.name+(d.description?': '+d.description:''),300),extra:{name:cap(d.name,100),about:cap(d.description,250),bot_public:String(!!d.bot_public)}}:null},
dd_status:async()=>{const d=await getJson('https://discordstatus.com/api/v2/summary.json');if(!d||!d.status)return null;const inc=(d.incidents||[])[0];return{text:cap('Discord: '+d.status.description+(inc?'. Latest issue: '+inc.name:'')),extra:{level:cap(d.status.indicator,20),state:cap(d.status.description,100),issue:cap(inc?inc.name:'None',150),issues:String((d.incidents||[]).length)}}},
dd_stickers:async()=>{const d=await getJson('https://discord.com/api/v10/sticker-packs');const a=d&&d.sticker_packs;if(!a||!a.length)return null;return{text:cap(`${a.length} sticker packs, like ${a.slice(0,4).map(x=>x.name).join(', ')}`),extra:{count:String(a.length),first:cap(a[0].name,60),names:cap(a.map(x=>x.name).join(', '),300)}}},
w_uv:async i=>{const p=await place(i);if(!p)return null;const w=await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&daily=uv_index_max&timezone=auto&forecast_days=1`);const u=w&&w.daily&&w.daily.uv_index_max&&w.daily.uv_index_max[0];if(u==null)return null;const l=u<3?'low':u<6?'moderate':u<8?'high':u<11?'very high':'extreme';return{text:`${p.name}: UV index ${u} today (${l})`,extra:{uv:String(u),level:l}}},
w_wind:async i=>{const p=await place(i);if(!p)return null;const w=await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&current=wind_speed_10m,wind_gusts_10m,wind_direction_10m`);const c=w&&w.current;if(!c)return null;const dirs=['N','NE','E','SE','S','SW','W','NW'],d=dirs[Math.round(c.wind_direction_10m/45)%8];return{text:`${p.name}: wind ${c.wind_speed_10m} km/h from the ${d}, gusts ${c.wind_gusts_10m} km/h`,extra:{speed:String(c.wind_speed_10m),gust:String(c.wind_gusts_10m),direction:d}}},
w_elevation:async i=>{const p=await place(i);if(!p)return null;const w=await getJson(`https://api.open-meteo.com/v1/elevation?latitude=${p.latitude}&longitude=${p.longitude}`);const e=w&&w.elevation&&w.elevation[0];return e!=null?{text:`${p.name} is ${Math.round(e)} m (${Math.round(e*3.28084)} ft) above sea level`,extra:{meters:String(Math.round(e)),feet:String(Math.round(e*3.28084))}}:null},
w_onthisday:async()=>{const n=new Date(),m=String(n.getUTCMonth()+1).padStart(2,'0'),dd=String(n.getUTCDate()).padStart(2,'0');const d=await getJson(`https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/events/${m}/${dd}`);const a=d&&d.events;if(!a||!a.length)return null;const e=a[Math.floor(Math.random()*a.length)];return{text:cap(`${e.year}: ${e.text}`,400),extra:{year:String(e.year),event:cap(e.text,300)}}},
w_book:async i=>{if(!i)return null;const d=await getJson('https://openlibrary.org/search.json?limit=1&fields=title,author_name,first_publish_year&q='+enc(i));const b=d&&d.docs&&d.docs[0];return b?{text:cap(`${b.title} by ${(b.author_name||['unknown'])[0]}${b.first_publish_year?' ('+b.first_publish_year+')':''}`),extra:{title:cap(b.title,100),author:cap((b.author_name||[''])[0],80),year:String(b.first_publish_year||'')}}:null},
w_poem:async()=>{const d=await getJson('https://poetrydb.org/random');const p=d&&d[0];return p&&p.lines?{text:cap(`${p.title} by ${p.author}: ${p.lines.slice(0,4).join(' / ')}`,400),extra:{title:cap(p.title,100),author:cap(p.author,80)}}:null},
w_art:async i=>{const d=await getJson('https://api.artic.edu/api/v1/artworks/search?limit=1&fields=title,artist_display,date_display&q='+enc(i||'landscape'));const a=d&&d.data&&d.data[0];return a?{text:cap(`${a.title}, ${a.artist_display||'unknown artist'}${a.date_display?' ('+a.date_display+')':''}`,300),extra:{title:cap(a.title,100),artist:cap(a.artist_display,100)}}:null},
w_colorname:async i=>{const h=String(i||'').trim().replace('#','').toLowerCase();if(!/^[0-9a-f]{6}$/.test(h))return null;const d=await getJson('https://www.thecolorapi.com/id?hex='+h);return d&&d.name?{text:cap(`#${h.toUpperCase()} is ${d.name.value}`),extra:{name:cap(d.name.value,60),hex:'#'+h.toUpperCase()}}:null},
w_geo:async i=>{const p=await place(i);return p?{text:cap(`${p.name}, ${p.country||''}: ${p.latitude}, ${p.longitude}, ${p.timezone||''}`),extra:{city:cap(p.name,60),country:cap(p.country,60),lat:String(p.latitude),lon:String(p.longitude),zone:cap(p.timezone,40),population:String(p.population||0),elevation:String(p.elevation==null?'':p.elevation)}}:null},
w_forecast:async i=>{const p=await place(i);if(!p)return null;const w=await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=3`);const d=w&&w.daily;if(!d||!d.time)return null;const day=k=>new Date(d.time[k]+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'short',timeZone:'UTC'});const ln=d.time.map((_,k)=>`${day(k)} ${Math.round(d.temperature_2m_min[k])} to ${Math.round(d.temperature_2m_max[k])}°C, rain ${d.precipitation_sum[k]} mm`);return{text:cap(p.name+': '+ln.join('; '),400),extra:{today:cap(ln[0],100),tomorrow:cap(ln[1]||'',100),high:String(Math.round(d.temperature_2m_max[0])),low:String(Math.round(d.temperature_2m_min[0]))}}},
w_sun:async i=>{const p=await place(i);if(!p)return null;const w=await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&daily=sunrise,sunset&timezone=auto&forecast_days=1`);const d=w&&w.daily;if(!d||!d.sunrise)return null;const a=d.sunrise[0].slice(11),b=d.sunset[0].slice(11);return{text:`${p.name}: sunrise ${a}, sunset ${b} (local time)`,extra:{sunrise:a,sunset:b}}},
w_air:async i=>{const p=await place(i);if(!p)return null;const w=await getJson(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${p.latitude}&longitude=${p.longitude}&current=us_aqi,pm2_5`);const c=w&&w.current;if(!c||c.us_aqi==null)return null;const a=c.us_aqi,l=a<=50?'good':a<=100?'moderate':a<=150?'unhealthy for sensitive groups':a<=200?'unhealthy':a<=300?'very unhealthy':'hazardous';return{text:`${p.name}: air quality index ${a} (${l}), PM2.5 ${c.pm2_5}`,extra:{aqi:String(a),level:l,pm25:String(c.pm2_5)}}},
w_quake:async()=>{const d=await getJson('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson');if(!d||!d.features)return null;const f=d.features[0];if(!f)return{text:'No earthquakes of magnitude 4.5 or more in the last day.',extra:{count:'0'}};const p=f.properties;return{text:cap(`Latest: magnitude ${p.mag} ${p.place}. ${d.features.length} of magnitude 4.5 or more in the last day.`),extra:{mag:String(p.mag),place:cap(p.place,100),count:String(d.features.length),url:cap(p.url,150)}}},
w_iss:async()=>{const d=await getJson('https://api.wheretheiss.at/v1/satellites/25544');return d&&d.latitude!=null?{text:`The ISS is at ${d.latitude.toFixed(2)}, ${d.longitude.toFixed(2)}, ${Math.round(d.altitude)} km up, moving ${Math.round(d.velocity)} km/h.`,extra:{lat:d.latitude.toFixed(3),lon:d.longitude.toFixed(3),altitude:String(Math.round(d.altitude)),speed:String(Math.round(d.velocity))}}:null},
w_holiday:async i=>{const c=String(i||'US').trim().toUpperCase().replace(/[^A-Z]/g,'').slice(0,2)||'US';const d=await getJson('https://date.nager.at/api/v3/NextPublicHolidays/'+c);const f=d&&d[0];return f?{text:`${f.name} on ${f.date} (${c})`,extra:{name:cap(f.name,80),date:f.date}}:null},
w_launch:async()=>{const d=await getJson('https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=1&mode=list');const f=d&&d.results&&d.results[0];return f?{text:cap(`${f.name} at ${f.net}`+(f.status&&f.status.name?' ('+f.status.name+')':'')),extra:{name:cap(f.name,100),when:cap(f.net,40),state:cap(f.status&&f.status.name,40)}}:null},
bored:async()=>{const d=await getJson('https://bored-api.appbrewery.com/random');return d&&d.activity?{text:cap(d.activity+' ('+d.type+', '+d.participants+' person'+(d.participants==1?'':'s')+')'),extra:{type:cap(d.type,30),people:String(d.participants)}}:null},
agify:async i=>{if(!i)return null;const d=await getJson('https://api.agify.io/?name='+enc(i.split(/\s+/)[0]));return d&&d.age!=null?{text:`The name ${cap(d.name,30)} averages age ${d.age} in the data.`,extra:{age:String(d.age)}}:null},
nationalize:async i=>{if(!i)return null;const d=await getJson('https://api.nationalize.io/?name='+enc(i.split(/\s+/)[0]));const c=d&&d.country&&d.country[0];return c?{text:`The name ${cap(d.name,30)} is most common in ${c.country_id} (${Math.round(c.probability*100)}%).`,extra:{country:c.country_id}}:null},
zip:async i=>{const m=String(i||'').trim().match(/^(?:([a-z]{2})\s+)?(\d{3,10})$/i);if(!m)return null;const c=(m[1]||'us').toLowerCase();const d=await getJson(`https://api.zippopotam.us/${c}/${m[2]}`);const p=d&&d.places&&d.places[0];return p?{text:cap(`${p['place name']}, ${p.state} (${d.country})`),extra:{city:cap(p['place name'],60),state:cap(p.state,60),lat:String(p.latitude),lon:String(p.longitude)}}:null},
spacex:async()=>{const d=await getJson('https://api.spacexdata.com/v5/launches/latest');return d&&d.name?{text:cap(`${d.name} on ${String(d.date_utc).slice(0,10)}: ${d.success?'success':'failed'}`),extra:{name:cap(d.name,80),date:String(d.date_utc).slice(0,10)}}:null},
rickmorty:async()=>{const d=await getJson('https://rickandmortyapi.com/api/character/'+(1+Math.floor(Math.random()*826)));return d&&d.name?{text:cap(`${d.name}: ${d.status} ${d.species} from ${d.origin&&d.origin.name}`),extra:{name:cap(d.name,60),image:d.image||''}}:null},
dnd:async i=>{const s=String(i||'goblin').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'goblin';const d=await getJson('https://www.dnd5eapi.co/api/monsters/'+s);return d&&d.name?{text:cap(`${d.name}: ${d.size} ${d.type}, ${d.hit_points} HP, AC ${d.armor_class&&d.armor_class[0]&&d.armor_class[0].value}, challenge ${d.challenge_rating}`),extra:{hp:String(d.hit_points),cr:String(d.challenge_rating)}}:null},
meowfact:async()=>{const d=await getJson('https://meowfacts.herokuapp.com/');return d&&d.data&&d.data[0]?{text:cap(d.data[0])}:null},
dogfact:async()=>{const d=await getJson('https://dogapi.dog/api/v2/facts');const f=d&&d.data&&d.data[0]&&d.data[0].attributes;return f&&f.body?{text:cap(f.body)}:null},
hn:async()=>{const l=await getJson('https://hacker-news.firebaseio.com/v0/topstories.json');if(!Array.isArray(l)||!l.length)return null;const d=await getJson('https://hacker-news.firebaseio.com/v0/item/'+l[Math.floor(Math.random()*Math.min(10,l.length))]+'.json');return d&&d.title?{text:cap(`${d.title} (${d.score} points)`),extra:{title:cap(d.title,150),link:d.url||'https://news.ycombinator.com/item?id='+d.id,score:String(d.score)}}:null},
ghrepo:async i=>{const m=String(i||'').trim().match(/^([\w.-]{1,39})\/([\w.-]{1,100})$/);if(!m)return null;const d=await getJson(`https://api.github.com/repos/${m[1]}/${m[2]}`);return d&&d.full_name?{text:cap(`${d.full_name}: ${d.stargazers_count} stars, ${d.forks_count} forks, ${d.language||'no language'}. ${d.description||''}`),extra:{stars:String(d.stargazers_count),forks:String(d.forks_count),issues:String(d.open_issues_count),language:cap(d.language||'',30)}}:null},
pypi:async i=>{const s=String(i||'').trim().replace(/[^\w.-]/g,'').slice(0,60);if(!s)return null;const d=await getJson('https://pypi.org/pypi/'+s+'/json');return d&&d.info?{text:cap(`${d.info.name} ${d.info.version}: ${d.info.summary||''}`),extra:{version:cap(d.info.version,30)}}:null},
crates:async i=>{const s=String(i||'').trim().replace(/[^\w-]/g,'').slice(0,60);if(!s)return null;const d=await getJson('https://crates.io/api/v1/crates/'+s);const c=d&&d.crate;return c?{text:cap(`${c.name} ${c.max_version}: ${c.description||''} (${c.downloads} downloads)`),extra:{version:cap(c.max_version,30),downloads:String(c.downloads)}}:null},
wikirandom:async()=>{const d=await getJson('https://en.wikipedia.org/api/rest_v1/page/random/summary');return d&&d.extract?{text:cap(d.title+': '+d.extract,400),extra:{title:cap(d.title,100)}}:null},
rhyme:async i=>{if(!i)return null;const d=await getJson('https://api.datamuse.com/words?max=8&rel_rhy='+enc(i.split(/\s+/)[0]));return Array.isArray(d)&&d.length?{text:cap(d.map(x=>x.word).join(', '))}:null},
synonym:async i=>{if(!i)return null;const d=await getJson('https://api.datamuse.com/words?max=8&rel_syn='+enc(i.split(/\s+/)[0]));return Array.isArray(d)&&d.length?{text:cap(d.map(x=>x.word).join(', '))}:null},
coinprice:async i=>{const s=String(i||'BTC').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,10)||'BTC';const d=await getJson(`https://api.coinbase.com/v2/prices/${s}-USD/spot`);return d&&d.data&&d.data.amount?{text:`${s} is $${d.data.amount}`,extra:{price:String(d.data.amount)}}:null},
progjoke:async()=>{const d=await getJson('https://v2.jokeapi.dev/joke/Programming?safe-mode');return d&&(d.joke||d.setup)?{text:cap(d.joke||d.setup+' '+d.delivery)}:null},
bible:async i=>{const s=String(i||'john 3:16').trim().replace(/[^\w :.,;-]/g,'').slice(0,40);const d=await getJson('https://bible-api.com/'+encodeURIComponent(s));return d&&d.text?{text:cap(d.reference+': '+d.text,500),extra:{reference:cap(d.reference,60)}}:null},
anime:async i=>{const d=i?await getJson('https://api.jikan.moe/v4/anime?limit=1&q='+enc(i)):await getJson('https://api.jikan.moe/v4/random/anime');const a=i?d&&d.data&&d.data[0]:d&&d.data;return a&&a.title?{text:cap(`${a.title}${a.score?' ('+a.score+'/10)':''}: ${a.synopsis||''}`,400),extra:{title:cap(a.title,100),score:String(a.score||''),link:a.url||''}}:null},
tv:async i=>{if(!i)return null;const d=await getJson('https://api.tvmaze.com/singlesearch/shows?q='+enc(i));return d&&d.name?{text:cap(`${d.name} (${d.status}${d.rating&&d.rating.average?', '+d.rating.average+'/10':''}): ${String(d.summary||'').replace(/<[^>]+>/g,'')}`,400),extra:{name:cap(d.name,80),status:cap(d.status,30),rating:String(d.rating&&d.rating.average||'')}}:null},
song:async i=>{if(!i)return null;const d=await getJson('https://itunes.apple.com/search?media=music&entity=song&limit=1&term='+enc(i));const r=d&&d.results&&d.results[0];return r?{text:cap(`${r.trackName} by ${r.artistName}, from ${r.collectionName}`),extra:{track:cap(r.trackName,100),artist:cap(r.artistName,100),link:r.trackViewUrl||''}}:null},
chess:async i=>{const u=String(i||'').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,30);if(!u)return null;const d=await getJson('https://api.chess.com/pub/player/'+u+'/stats');if(!d)return null;const g=k=>d[k]&&d[k].last?d[k].last.rating:'none';return{text:`${u}: rapid ${g('chess_rapid')}, blitz ${g('chess_blitz')}, bullet ${g('chess_bullet')}`,extra:{rapid:String(g('chess_rapid')),blitz:String(g('chess_blitz')),bullet:String(g('chess_bullet'))}}},
lichess:async i=>{const u=String(i||'').trim().replace(/[^\w-]/g,'').slice(0,30);if(!u)return null;const d=await getJson('https://lichess.org/api/user/'+u);if(!d||!d.username)return null;const g=k=>d.perfs&&d.perfs[k]?d.perfs[k].rating:'none';return{text:`${d.username}: rapid ${g('rapid')}, blitz ${g('blitz')}, bullet ${g('bullet')}, ${d.count&&d.count.all||0} games`,extra:{rapid:String(g('rapid')),blitz:String(g('blitz')),games:String(d.count&&d.count.all||0)}}},
wayback:async i=>{const s=String(i||'').trim().replace(/^https?:\/\//i,'').replace(/[^\w.\/%:~#?&=+-]/g,'').slice(0,60);if(!s||!s.includes('.'))return null;const d=await getJson('https://archive.org/wayback/available?url='+encodeURIComponent(s));const c=d&&d.archived_snapshots&&d.archived_snapshots.closest;return c&&c.url?{text:cap(c.url.replace(/^http:/,'https:')),extra:{when:cap(c.timestamp,20)}}:null},
trending:async()=>{const d=await getJson('https://api.coingecko.com/api/v3/search/trending');const c=d&&d.coins;return c&&c.length?{text:cap('Trending coins: '+c.slice(0,5).map(x=>x.item.name).join(', '))}:null},
feargreed:async()=>{const d=await getJson('https://api.alternative.me/fng/');const f=d&&d.data&&d.data[0];return f?{text:`Crypto fear and greed index: ${f.value} (${f.value_classification})`,extra:{value:String(f.value),mood:cap(f.value_classification,30)}}:null},
stoic:async()=>{const d=await getJson('https://stoic-quotes.com/api/quote');return d&&d.text?{text:cap(d.text+' - '+d.author),extra:{author:cap(d.author,60)}}:null},
affirmation:async()=>{const d=await getJson('https://www.affirmations.dev/');return d&&d.affirmation?{text:cap(d.affirmation)}:null},
ronswanson:async()=>{const d=await getJson('https://ron-swanson-quotes.herokuapp.com/v2/quotes');return Array.isArray(d)&&d[0]?{text:cap(d[0])}:null},
riddle:async()=>{const d=await getJson('https://riddles-api.vercel.app/random');return d&&d.riddle?{text:cap(d.riddle),extra:{answer:cap(d.answer,100)}}:null},
mtg:async i=>{const d=await getJson(i?'https://api.scryfall.com/cards/named?fuzzy='+enc(i):'https://api.scryfall.com/cards/random');return d&&d.name?{text:cap(`${d.name} ${d.mana_cost||''} - ${d.type_line}. ${d.oracle_text||''}`,400),extra:{name:cap(d.name,80),image:d.image_uris&&d.image_uris.normal||''}}:null},
yugioh:async i=>{if(!i)return null;const d=await getJson('https://db.ygoprodeck.com/api/v7/cardinfo.php?name='+enc(i));const c=d&&d.data&&d.data[0];return c?{text:cap(`${c.name} (${c.type}): ${c.desc}`,400),extra:{name:cap(c.name,80),image:c.card_images&&c.card_images[0]&&c.card_images[0].image_url||''}}:null},
duck:async()=>{const d=await getJson('https://random-d.uk/api/v2/random');return d&&d.url?{text:d.url}:null},
brewery:async()=>{const d=await getJson('https://api.openbrewerydb.org/v1/breweries/random');const b=d&&d[0];return b?{text:cap(`${b.name}: ${b.brewery_type} brewery in ${b.city}, ${b.state_province||b.country}`),extra:{name:cap(b.name,80),city:cap(b.city,60)}}:null},
spacenews:async()=>{const d=await getJson('https://api.spaceflightnewsapi.net/v4/articles/?limit=1');const a=d&&d.results&&d.results[0];return a?{text:cap(a.title),extra:{link:a.url||'',site:cap(a.news_site,60)}}:null},
uuid:async()=>({text:crypto.randomUUID()}),
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
if(path&&path[0]==='@'){
const s=await getText(u.href)
if(!s)return null
const[k,a]=path.slice(1).split(':')
if(k==='feed'){const[i,part]=a.split('.'),it=parseFeed(s)[Math.max(0,Number(i)-1)];return it?{text:cap(part==='link'?it.link:part==='both'?it.title+' '+it.link:it.title),extra:{title:cap(it.title,200),link:cap(it.link,300)}}:null}
const pg=parsePage(s),v=pg[a]
return v?{text:cap(v),extra:{title:cap(pg.title,200),description:cap(pg.description,300),image:cap(pg.image,300),site:cap(pg.site,100)}}:null
}
const d=await getJson(u.href)
if(d==null)return null
const v=path?pathGet(d,path):d
if(v===undefined)return null
return{text:cap(typeof v==='object'?JSON.stringify(v):v)}
}
export async function runWebhook(key,href,body){
if(!allow(key))return false
if(!/^https:\/\/(discord|discordapp)\.com\/api(\/v\d+)?\/webhooks\/\d{5,25}\/[\w-]{20,100}$/.test(href))return false
const ctl=new AbortController()
const t=setTimeout(()=>ctl.abort(),4000)
try{
const r=await fetch(href,{method:'POST',signal:ctl.signal,redirect:'error',headers:{'content-type':'application/json','user-agent':'ParleyBot/1.0'},body:JSON.stringify({...body,allowed_mentions:{parse:[]}})})
return r.ok
}catch{return false}finally{clearTimeout(t)}
}
