import{fail}from'./util.js'
const OPS=['contains','notcontains','equals','neq','starts','ends','oneof','gt','lt','empty','notempty']
const FNS=['upper','lower','title','trim','length','reverse','first','last','replace']
const MATH=['+','-','*','/','%','max','min']
const YN=['yes','no']
const NX=['next']
export const TYPES={
msg:{out:NX,trigger:true,spec:{mode:['any','contains','equals','starts'],text:100,ci:['1','0']},def:{mode:'contains',text:'',ci:'1'}},
cmd:{out:NX,trigger:true,spec:{prefix:3,name:32},def:{prefix:'!',name:'ping'}},
mention:{out:NX,trigger:true,spec:{},def:{}},
join:{out:NX,trigger:true,spec:{},def:{}},
link:{out:NX,trigger:true,spec:{},def:{}},
image:{out:NX,trigger:true,spec:{},def:{}},
if:{out:YN,spec:{left:200,op:OPS,right:200},def:{left:'{text}',op:'contains',right:''}},
chance:{out:YN,spec:{percent:3},def:{percent:'50'}},
ismod:{out:YN,spec:{},def:{}},
hasrole:{out:YN,spec:{role:40},def:{role:''}},
time:{out:YN,spec:{from:2,to:2},def:{from:'0',to:'23'}},
cooldown:{out:YN,spec:{seconds:5,scope:['user','server']},def:{seconds:'30',scope:'user'}},
once:{out:YN,spec:{},def:{}},
say:{out:NX,spec:{text:1500,reply:['0','1']},def:{text:'',reply:'0'}},
sayto:{out:NX,spec:{channel:40,text:1500},def:{channel:'general',text:''}},
react:{out:NX,spec:{emoji:40},def:{emoji:'👍'}},
delete:{out:NX,spec:{},def:{}},
pin:{out:NX,spec:{},def:{}},
timeout:{out:NX,spec:{minutes:3},def:{minutes:'5'}},
addrole:{out:NX,spec:{role:40},def:{role:''}},
removerole:{out:NX,spec:{role:40},def:{role:''}},
stop:{out:[],spec:{},def:{}},
pick:{out:NX,spec:{name:24,options:1500},def:{name:'choice',options:''}},
set:{out:NX,spec:{name:24,value:300},def:{name:'',value:''}},
count:{out:NX,spec:{name:24,by:4,scope:['server','user']},def:{name:'count',by:'1',scope:'server'}},
setcount:{out:NX,spec:{name:24,value:8,scope:['server','user']},def:{name:'count',value:'0',scope:'server'}},
math:{out:NX,spec:{name:24,a:100,op:MATH,b:100},def:{name:'result',a:'1',op:'+',b:'1'}},
text:{out:NX,spec:{name:24,input:300,fn:FNS,arg:100},def:{name:'result',input:'{text}',fn:'upper',arg:''}},
randnum:{out:NX,spec:{name:24,min:9,max:9},def:{name:'roll',min:'1',max:'6'}},
map:{out:NX,spec:{name:24,input:200,table:1500,fallback:200},def:{name:'result',input:'{arg1}',table:'',fallback:''}}
}
export const MAX_NODES=100
const NAMEF=['name']
const bad=m=>fail(400,m)
const num=(v,lo,hi,label)=>{const x=Number(v);if(!Number.isFinite(x))bad(label+' must be a number');return String(Math.max(lo,Math.min(hi,Math.round(x))))}
export function cleanGraph(g){
if(g===null)return null
if(!g||typeof g!=='object'||!Array.isArray(g.nodes)||!Array.isArray(g.edges))bad('Invalid blocks')
if(g.nodes.length>MAX_NODES)bad('A bot can have up to '+MAX_NODES+' blocks')
const ids=new Set(),nodes=[]
for(const n of g.nodes){
if(!n||typeof n.id!=='string'||!/^[a-z0-9_-]{1,20}$/.test(n.id)||ids.has(n.id))bad('Invalid block id')
const T=TYPES[n.type]
if(!T)bad('Unknown block type')
ids.add(n.id)
const p={...T.def}
for(const[k,spec]of Object.entries(T.spec)){
let v=n.p&&n.p[k]
if(v===undefined||v===null)continue
v=String(v)
if(Array.isArray(spec)){if(!spec.includes(v))bad('Invalid value for '+k);p[k]=v}
else{if(v.length>spec)bad(k+' is too long');p[k]=v}
}
if(n.type==='cmd'&&!/^[a-z0-9_]{1,32}$/i.test(p.name))bad('Command names use letters, numbers and underscores')
if(n.type==='chance')p.percent=num(p.percent,0,100,'Percent')
if(n.type==='count')p.by=num(p.by,-1000,1000,'Add')
if(n.type==='setcount')p.value=num(p.value,-1000000,1000000,'Value')
if(n.type==='time'){p.from=num(p.from,0,23,'Hour');p.to=num(p.to,0,23,'Hour')}
if(n.type==='cooldown')p.seconds=num(p.seconds,1,86400,'Seconds')
if(n.type==='timeout')p.minutes=num(p.minutes,1,60,'Minutes')
if(n.type==='randnum'){p.min=num(p.min,-1000000,1000000,'Minimum');p.max=num(p.max,-1000000,1000000,'Maximum')}
if(n.type==='sayto'&&!/^[a-z0-9_-]{1,40}$/i.test(p.channel.replace(/^#/,'')))bad('Channel names use letters, numbers, dashes and underscores')
if(T.spec.name!==undefined&&p.name&&!/^[a-z0-9_]{1,24}$/i.test(p.name))bad('Variable names use letters, numbers and underscores')
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
const a=String(l),b=String(r),la=a.toLowerCase(),lb=b.toLowerCase()
switch(op){
case'contains':return la.includes(lb)
case'notcontains':return!la.includes(lb)
case'equals':return la===lb
case'neq':return la!==lb
case'starts':return la.startsWith(lb)
case'ends':return la.endsWith(lb)
case'oneof':return b.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean).includes(la.trim())
case'gt':return Number(a)>Number(b)
case'lt':return Number(a)<Number(b)
case'empty':return a.trim()===''
case'notempty':return a.trim()!==''
}
return false
}
const triggered=(n,ctx)=>{
const t=ctx.text.trim()
if(n.type==='join')return ctx.event==='join'
if(ctx.event==='join')return false
if(n.type==='mention')return!!ctx.mentioned
if(n.type==='link')return/https?:\/\//i.test(t)
if(n.type==='image')return(ctx.attachments||0)>0
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
const titleCase=s=>s.toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase())
function calc(a,op,b){
const x=Number(a),y=Number(b)
if(!Number.isFinite(x)||!Number.isFinite(y))return''
const r=op==='+'?x+y:op==='-'?x-y:op==='*'?x*y:op==='/'?(y===0?NaN:x/y):op==='%'?(y===0?NaN:x%y):op==='max'?Math.max(x,y):Math.min(x,y)
return Number.isFinite(r)?String(Math.round(r*1e6)/1e6):''
}
function xform(fn,s,arg){
switch(fn){
case'upper':return s.toUpperCase()
case'lower':return s.toLowerCase()
case'title':return titleCase(s)
case'trim':return s.trim()
case'length':return String(s.length)
case'reverse':return[...s].reverse().join('')
case'first':return s.trim().split(/\s+/)[0]||''
case'last':return s.trim().split(/\s+/).pop()||''
case'replace':{const i=arg.indexOf('|');if(i<0)return s;return s.split(arg.slice(0,i)).join(arg.slice(i+1))}
}
return s
}
export function baseVars(ctx,rnd){
const d=new Date(ctx.at||Date.now())
const p2=n=>String(n).padStart(2,'0')
const vars={user:ctx.user.display_name,username:ctx.user.username,userid:ctx.user.id,mention:'<@'+ctx.user.id+'>',channel:ctx.channel,server:ctx.server,text:clip(ctx.text,500),
time:p2(d.getUTCHours())+':'+p2(d.getUTCMinutes()),hour:String(d.getUTCHours()),date:d.getUTCFullYear()+'-'+p2(d.getUTCMonth()+1)+'-'+p2(d.getUTCDate()),weekday:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getUTCDay()],rand:String(1+Math.floor(rnd()*100))}
const m=ctx.text.trim().split(/\s+/)
vars.args=m.slice(1).join(' ');m.slice(1,4).forEach((x,i)=>{vars['arg'+(i+1)]=x})
return vars
}
export async function execute(graph,ctx,io,rnd=Math.random){
const by=new Map(graph.nodes.map(n=>[n.id,n]))
const next=(id,o)=>graph.edges.find(e=>e.f===id&&e.o===o)?.t
const vars=baseVars(ctx,rnd)
const log=[]
let steps=0,sends=0,acts=0
const setv=(name,v)=>{vars[name.toLowerCase()]=clip(v,500);return vars[name.toLowerCase()]}
for(const trig of graph.nodes.filter(n=>TYPES[n.type].trigger&&triggered(n,ctx))){
log.push({id:trig.id,did:'start'})
let cur=next(trig.id,'next')
while(cur&&steps<60){
steps++
const n=by.get(cur)
if(!n)break
const P=n.p,R=s=>render(s,vars)
let branch=null
switch(n.type){
case'if':branch=test(P.op,R(P.left),R(P.right));break
case'chance':branch=rnd()*100<Number(P.percent);break
case'ismod':branch=await io.isMod();break
case'hasrole':branch=P.role?await io.hasRole(R(P.role)):false;break
case'time':{const h=new Date(ctx.at||Date.now()).getUTCHours(),a=Number(P.from),b=Number(P.to);branch=a<=b?h>=a&&h<=b:h>=a||h<=b;break}
case'cooldown':branch=await io.cooldown(n.id,Number(P.seconds),P.scope);break
case'once':branch=(await io.count('once_'+n.id,1,'user'))===1;break
case'stop':log.push({id:n.id,did:'stop'});cur=null;continue
case'say':{const t=R(P.text).trim();if(t&&sends<4){sends++;await io.send(t,P.reply==='1');log.push({id:n.id,did:'say',text:t})}break}
case'sayto':{const t=R(P.text).trim();if(t&&sends<4){sends++;await io.sendTo(R(P.channel).replace(/^#/,''),t);log.push({id:n.id,did:'sayto',text:t})}break}
case'react':if(P.emoji&&acts<8){acts++;await io.react(P.emoji);log.push({id:n.id,did:'react',emoji:P.emoji})}break
case'delete':if(acts<8){acts++;await io.del();log.push({id:n.id,did:'delete'})}break
case'pin':if(acts<8){acts++;await io.pin();log.push({id:n.id,did:'pin'})}break
case'timeout':if(acts<8){acts++;await io.timeout(Number(P.minutes));log.push({id:n.id,did:'timeout',minutes:P.minutes})}break
case'addrole':case'removerole':if(P.role&&acts<8){acts++;await io.role(R(P.role),n.type==='addrole');log.push({id:n.id,did:n.type,role:P.role})}break
case'pick':{const o=P.options.split('\n').map(x=>x.trim()).filter(Boolean);if(o.length&&P.name)log.push({id:n.id,did:'pick',value:setv(P.name,R(o[Math.floor(rnd()*o.length)]))});break}
case'set':if(P.name)log.push({id:n.id,did:'set',value:setv(P.name,R(P.value))});break
case'count':if(P.name)log.push({id:n.id,did:'count',value:setv(P.name,String(await io.count(P.name.toLowerCase(),Number(P.by)||0,P.scope)))});break
case'setcount':if(P.name)log.push({id:n.id,did:'setcount',value:setv(P.name,String(await io.setCount(P.name.toLowerCase(),Number(P.value)||0,P.scope)))});break
case'math':if(P.name)log.push({id:n.id,did:'math',value:setv(P.name,calc(R(P.a),P.op,R(P.b)))});break
case'text':if(P.name)log.push({id:n.id,did:'text',value:setv(P.name,xform(P.fn,R(P.input),P.arg))});break
case'randnum':if(P.name){const a=Number(P.min),b=Number(P.max),lo=Math.min(a,b),hi=Math.max(a,b);log.push({id:n.id,did:'randnum',value:setv(P.name,String(lo+Math.floor(rnd()*(hi-lo+1))))})}break
case'map':if(P.name){const k=R(P.input).trim().toLowerCase();let out=null;for(const line of P.table.split('\n')){const i=line.indexOf('=');if(i>0&&line.slice(0,i).trim().toLowerCase()===k){out=line.slice(i+1).trim();break}}log.push({id:n.id,did:'map',value:setv(P.name,out===null?R(P.fallback):R(out))})}break
}
if(branch!==null){log.push({id:n.id,did:branch?'yes':'no'});cur=next(n.id,branch?'yes':'no')}
else cur=next(n.id,'next')
}
}
return log
}
