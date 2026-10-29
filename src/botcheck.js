import{TYPES}from'./blockrun.js'
import{LAB}from'./labmore.js'
import{parseOpts}from'../public/js/cmdopts.js'
const BUILTIN=new Set(['user','username','userid','mention','channel','server','text','time','hour','date','weekday','args','arg1','arg2','arg3'])
export function validateGraph(g){
const out=[]
if(!g||!g.nodes.length)return out
const by=new Map(g.nodes.map(n=>[n.id,n]))
const trig=g.nodes.filter(n=>TYPES[n.type].trigger)
if(!trig.length)out.push({level:'error',msg:'Add a trigger block so the bot knows when to run.'})
const next=new Map()
for(const e of g.edges){(next.get(e.f)||next.set(e.f,[]).get(e.f)).push(e.t)}
const subs=new Map(g.nodes.filter(n=>n.type==='sub').map(n=>[n.p.name.toLowerCase(),n]))
const reach=new Set()
const walk=id=>{if(reach.has(id))return;reach.add(id);const n=by.get(id);if(n?.type==='call'){const s=subs.get(n.p.name.toLowerCase());if(s)walk(s.id)}for(const t of next.get(id)||[])walk(t)}
for(const n of g.nodes)if(TYPES[n.type].trigger)walk(n.id)
const set=new Set()
for(const n of g.nodes){
if(n.p.name&&(LAB[n.type]||['pick','set','count','setcount','math','text','randnum','map','warn','load','getcount','word','combine','clock','userinfo','serverinfo','api','http','feed','preview','jsonget','item','dd','world','ddwebhook','ddembed','ddformat','ddtime','ddsnowflake','ddmention','ddinvitecode','ddemoji','ddlink','moonphase','distance','unitconv','colorconv','morse','roman','caesar','hashtext','uuid','nato','binarytext','foreach'].includes(n.type)))set.add(n.p.name.toLowerCase())
for(const r of n.xi||[])set.add(r[0].toLowerCase())
if(n.type==='cmd'&&n.p.options)for(const o of parseOpts(n.p.options))set.add(o.name)
}
const cmds=new Map()
for(const n of g.nodes){
const T=TYPES[n.type]
if(!T.trigger&&!T.entry&&!reach.has(n.id))out.push({id:n.id,level:'warn',msg:'This block is not connected to any trigger, so it never runs.'})
if(T.trigger&&!(next.get(n.id)||[]).length)out.push({id:n.id,level:'warn',msg:'This trigger has nothing after it yet.'})
if((n.type==='say'||n.type==='sayto')&&!n.p.text.trim())out.push({id:n.id,level:'warn',msg:'The message is empty, so nothing will be sent.'})
if(['say','sayto','if','if2','switch','log','notice','save','combine','warn'].includes(n.type)){
for(const v of Object.values(n.p))for(const m of String(v).matchAll(/\{([a-z0-9_]{1,24})\}/gi)){const k=m[1].toLowerCase();if(!BUILTIN.has(k)&&!set.has(k)&&![...set].some(x=>k.startsWith(x+"_")))out.push({id:n.id,level:'warn',msg:'{'+m[1]+'} is not set by any block, so it will be empty.'})}
}
if(n.type==='call'&&!subs.has(n.p.name.toLowerCase()))out.push({id:n.id,level:'error',msg:'No subflow is named "'+n.p.name+'".'})
if(n.type==='sub'&&!g.nodes.some(x=>x.type==='call'&&x.p.name.toLowerCase()===n.p.name.toLowerCase()))out.push({id:n.id,level:'warn',msg:'Nothing calls this subflow.'})
if(n.type==='api'||n.type==='http'||n.type==='feed'||n.type==='preview'||n.type==='dd'||n.type==='world'||n.type==='ddwebhook'||n.type==='ddembed')out.push({id:n.id,level:'info',msg:'Calls an outside service. A bot can make up to 3 calls per run and 20 per minute, so add a cooldown on busy commands.'})
if(/^(dev|bt|serial|usb|nfc)/.test(n.type))out.push({id:n.id,level:'info',msg:'Runs on the member\'s own device after they tap Allow. It needs a supported browser or app, and Bluetooth blocks need Chrome, Edge or the desktop and Android apps.'})
if(n.type==='ddwebhook'||n.type==='ddembed')out.push({id:n.id,level:'warn',msg:'Anyone who can edit this bot can see its webhook link, so use a webhook made only for this bot.'})
if(n.type==='cmd'){const k=n.p.prefix+n.p.name.toLowerCase();if(cmds.has(k))out.push({id:n.id,level:'warn',msg:'Another block already listens for '+k+'.'});cmds.set(k,n.id)}
if(['delete','timeout','addrole','removerole','unpin','slowmode','setnick','untimeout','kick','ban','purge'].includes(n.type))out.push({id:n.id,level:'info',msg:'Needs the matching permission for the bot in each server, and a role above the member.'})
}
const color=new Map()
let cyc=null
const dfs=id=>{if(cyc)return;color.set(id,1);for(const t of next.get(id)||[]){if(color.get(t)===1){cyc=t;return}if(!color.has(t))dfs(t)}color.set(id,2)}
for(const n of g.nodes)if(!color.has(n.id))dfs(n.id)
if(cyc)out.push({id:cyc,level:'warn',msg:'Blocks loop back on themselves. Each run stops after 60 steps.'})
return out
}
