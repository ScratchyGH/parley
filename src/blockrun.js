import{fail}from'./util.js'
export const TYPES={
msg:{out:['next'],trigger:true},
cmd:{out:['next'],trigger:true},
if:{out:['yes','no']},
chance:{out:['yes','no']},
say:{out:['next']},
react:{out:['next']},
pick:{out:['next']},
set:{out:['next']},
count:{out:['next']}
}
const SPEC={
msg:{mode:['any','contains','equals','starts'],text:100,ci:['1','0']},
cmd:{prefix:3,name:32},
if:{left:200,op:['contains','equals','starts','ends','gt','lt','empty','notempty'],right:200},
chance:{percent:3},
say:{text:1500,reply:['0','1']},
react:{emoji:40},
pick:{name:24,options:1500},
set:{name:24,value:300},
count:{name:24,by:4}
}
const DEF={msg:{mode:'contains',text:'',ci:'1'},cmd:{prefix:'!',name:'ping'},if:{left:'{text}',op:'contains',right:''},chance:{percent:'50'},say:{text:'',reply:'0'},react:{emoji:'👍'},pick:{name:'choice',options:''},set:{name:'',value:''},count:{name:'count',by:'1'}}
export const MAX_NODES=60
const bad=m=>fail(400,m)
export function cleanGraph(g){
if(g===null)return null
if(!g||typeof g!=='object'||!Array.isArray(g.nodes)||!Array.isArray(g.edges))bad('Invalid blocks')
if(g.nodes.length>MAX_NODES)bad('A bot can have up to '+MAX_NODES+' blocks')
const ids=new Set(),nodes=[]
for(const n of g.nodes){
if(!n||typeof n.id!=='string'||!/^[a-z0-9_-]{1,20}$/.test(n.id)||ids.has(n.id))bad('Invalid block id')
if(!TYPES[n.type])bad('Unknown block type')
ids.add(n.id)
const p={...DEF[n.type]}
for(const[k,spec]of Object.entries(SPEC[n.type])){
let v=n.p&&n.p[k]
if(v===undefined||v===null)continue
v=String(v)
if(Array.isArray(spec)){if(!spec.includes(v))bad('Invalid value for '+k);p[k]=v}
else{if(v.length>spec)bad(k+' is too long');p[k]=v}
}
if(n.type==='cmd'&&!/^[a-z0-9_]{1,32}$/i.test(p.name))bad('Command names use letters, numbers and underscores')
if(n.type==='chance'||n.type==='count'){const x=Number(n.type==='chance'?p.percent:p.by);if(!Number.isFinite(x))bad('Enter a number');p[n.type==='chance'?'percent':'by']=String(Math.max(n.type==='chance'?0:-100,Math.min(100,Math.round(x))))}
if((n.type==='set'||n.type==='pick'||n.type==='count')&&p.name&&!/^[a-z0-9_]{1,24}$/i.test(p.name))bad('Variable names use letters, numbers and underscores')
nodes.push({id:n.id,type:n.type,x:Math.max(-5000,Math.min(5000,Math.round(Number(n.x)||0))),y:Math.max(-5000,Math.min(5000,Math.round(Number(n.y)||0))),p})
}
const by=new Map(nodes.map(n=>[n.id,n]))
const seen=new Set(),edges=[]
for(const e of g.edges){
if(!e||!by.has(e.f)||!by.has(e.t))bad('Invalid connection')
if(!TYPES[by.get(e.f).type].out.includes(e.o))bad('Invalid connection')
if(TYPES[by.get(e.t).type].trigger)bad('Nothing can lead into a trigger')
const k=e.f+':'+e.o
if(seen.has(k))continue
seen.add(k)
edges.push({f:e.f,o:e.o,t:e.t})
}
return{nodes,edges}
}
const clip=(s,n)=>String(s).slice(0,n)
const strip=s=>s.replace(/<@everyone>|<@&[a-z0-9_]+>/g,'@​everyone')
export const render=(s,vars)=>strip(String(s).replace(/\{([a-z0-9_]{1,24})\}/gi,(_,k)=>vars[k.toLowerCase()]??'')).slice(0,2000)
function test(op,l,r){
const a=String(l),b=String(r)
switch(op){
case'contains':return a.toLowerCase().includes(b.toLowerCase())
case'equals':return a.toLowerCase()===b.toLowerCase()
case'starts':return a.toLowerCase().startsWith(b.toLowerCase())
case'ends':return a.toLowerCase().endsWith(b.toLowerCase())
case'gt':return Number(a)>Number(b)
case'lt':return Number(a)<Number(b)
case'empty':return a.trim()===''
case'notempty':return a.trim()!==''
}
return false
}
const triggered=(n,text)=>{
const t=text.trim()
if(n.type==='msg'){
const a=n.p.ci==='0'?t:t.toLowerCase(),b=n.p.ci==='0'?n.p.text:n.p.text.toLowerCase()
if(n.p.mode==='any')return true
if(!b)return false
return n.p.mode==='equals'?a===b:n.p.mode==='starts'?a.startsWith(b):a.includes(b)
}
if(n.type==='cmd'){
const pre=n.p.prefix+n.p.name
const l=t.toLowerCase(),p=pre.toLowerCase()
return l===p||l.startsWith(p+' ')
}
return false
}
export async function execute(graph,ctx,io,rnd=Math.random){
const by=new Map(graph.nodes.map(n=>[n.id,n]))
const next=(id,o)=>graph.edges.find(e=>e.f===id&&e.o===o)?.t
const vars={user:ctx.user.display_name,username:ctx.user.username,mention:'<@'+ctx.user.id+'>',channel:ctx.channel,server:ctx.server,text:clip(ctx.text,500)}
const m=ctx.text.trim().split(/\s+/)
vars.args=m.slice(1).join(' ');m.slice(1,4).forEach((x,i)=>{vars['arg'+(i+1)]=x})
const log=[]
let steps=0,sends=0
for(const trig of graph.nodes.filter(n=>TYPES[n.type].trigger&&triggered(n,ctx.text))){
log.push({id:trig.id,did:'start'})
let cur=next(trig.id,'next')
while(cur&&steps<40){
steps++
const n=by.get(cur)
if(!n)break
const P=n.p
if(n.type==='if'){const ok=test(P.op,render(P.left,vars),render(P.right,vars));log.push({id:n.id,did:ok?'yes':'no'});cur=next(n.id,ok?'yes':'no');continue}
if(n.type==='chance'){const ok=rnd()*100<Number(P.percent);log.push({id:n.id,did:ok?'yes':'no'});cur=next(n.id,ok?'yes':'no');continue}
if(n.type==='say'){
const text=render(P.text,vars).trim()
if(text&&sends<4){sends++;await io.send(text,P.reply==='1');log.push({id:n.id,did:'say',text})}
}else if(n.type==='react'){
if(P.emoji&&sends<8){sends++;await io.react(P.emoji);log.push({id:n.id,did:'react',emoji:P.emoji})}
}else if(n.type==='pick'){
const opts=P.options.split('\n').map(x=>x.trim()).filter(Boolean)
if(opts.length&&P.name){vars[P.name.toLowerCase()]=render(opts[Math.floor(rnd()*opts.length)],vars);log.push({id:n.id,did:'pick',value:vars[P.name.toLowerCase()]})}
}else if(n.type==='set'){
if(P.name){vars[P.name.toLowerCase()]=render(P.value,vars);log.push({id:n.id,did:'set',value:vars[P.name.toLowerCase()]})}
}else if(n.type==='count'){
if(P.name){vars[P.name.toLowerCase()]=String(await io.count(P.name.toLowerCase(),Number(P.by)||0));log.push({id:n.id,did:'count',value:vars[P.name.toLowerCase()]})}
}
cur=next(n.id,'next')
}
}
return log
}
