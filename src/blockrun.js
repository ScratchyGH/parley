import{fail}from'./util.js'
const OPS=['contains','notcontains','equals','neq','starts','ends','oneof','gt','lt','empty','notempty']
const FNS=['upper','lower','title','trim','length','reverse','first','last','replace','words','capital','nospaces','digits','letters','left','right','repeat','slug']
const MATH=['+','-','*','/','%','max','min','pow','floor','ceil','round','abs']
const YN=['yes','no']
const NX=['next']
const SC=['server','user']
const DAYS=['sun','mon','tue','wed','thu','fri','sat','weekdays','weekend']
const CASES=['c1','c2','c3','c4','else']
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
map:{out:NX,spec:{name:24,input:200,table:1500,fallback:200},def:{name:'result',input:'{arg1}',table:'',fallback:''}},
gate:{out:YN,spec:{on:['1','0']},def:{on:'1'}},
switch:{out:CASES,spec:{input:200,v1:60,v2:60,v3:60,v4:60},def:{input:'{arg1}',v1:'',v2:'',v3:'',v4:''}},
sub:{out:NX,entry:true,spec:{name:24},def:{name:'shared'}},
call:{out:NX,spec:{name:24},def:{name:'shared'}},
note:{out:[],entry:true,spec:{text:300},def:{text:''}},
hook:{out:NX,trigger:true,spec:{name:24},def:{name:'alert'}},
reply:{out:NX,trigger:true,spec:{},def:{}},
everyone:{out:NX,trigger:true,spec:{},def:{}},
usermention:{out:NX,trigger:true,spec:{},def:{}},
invite:{out:NX,trigger:true,spec:{},def:{}},
caps:{out:NX,trigger:true,spec:{percent:3,min:3},def:{percent:'70',min:'8'}},
longmsg:{out:NX,trigger:true,spec:{chars:4},def:{chars:'500'}},
badword:{out:NX,trigger:true,spec:{words:1500},def:{words:''}},
emojispam:{out:NX,trigger:true,spec:{count:2},def:{count:'6'}},
mentionspam:{out:NX,trigger:true,spec:{count:2},def:{count:'5'}},
channelis:{out:YN,spec:{channel:40},def:{channel:'general'}},
isowner:{out:YN,spec:{},def:{}},
newmember:{out:YN,spec:{days:3},def:{days:'7'}},
weekday:{out:YN,spec:{day:DAYS},def:{day:'weekdays'}},
wordlist:{out:YN,spec:{input:200,words:1500},def:{input:'{text}',words:''}},
if2:{out:YN,spec:{left:200,op:OPS,right:200,join:['and','or'],left2:200,op2:OPS,right2:200},def:{left:'{text}',op:'contains',right:'',join:'and',left2:'{text}',op2:'contains',right2:''}},
notice:{out:NX,spec:{text:300},def:{text:''}},
unpin:{out:NX,spec:{},def:{}},
slowmode:{out:NX,spec:{seconds:5},def:{seconds:'10'}},
setnick:{out:NX,spec:{nick:32},def:{nick:''}},
untimeout:{out:NX,spec:{},def:{}},
kick:{out:NX,spec:{reason:200},def:{reason:'Removed by bot'}},
ban:{out:NX,spec:{reason:200},def:{reason:'Banned by bot'}},
purge:{out:NX,spec:{count:2},def:{count:'5'}},
warn:{out:NX,spec:{name:24,reason:200},def:{name:'warns',reason:'Warning from bot'}},
log:{out:NX,spec:{channel:40,text:1500},def:{channel:'mod-log',text:''}},
wait:{out:NX,spec:{seconds:1},def:{seconds:'2'}},
save:{out:NX,spec:{key:24,value:300,scope:SC},def:{key:'note',value:'',scope:'server'}},
load:{out:NX,spec:{name:24,key:24,scope:SC,fallback:200},def:{name:'note',key:'note',scope:'server',fallback:''}},
getcount:{out:NX,spec:{name:24,counter:24,scope:SC},def:{name:'value',counter:'count',scope:'server'}},
word:{out:NX,spec:{name:24,input:300,n:2},def:{name:'word',input:'{text}',n:'1'}},
combine:{out:NX,spec:{name:24,a:200,sep:20,b:200},def:{name:'joined',a:'',sep:' ',b:''}},
clock:{out:NX,spec:{name:24,what:['unix','date','time','hour','minute','day','month','monthname','year','weekday']},def:{name:'now',what:'unix'}},
userinfo:{out:NX,spec:{name:24,what:['nickname','joined_days','roles','role_count']},def:{name:'info',what:'joined_days'}},
serverinfo:{out:NX,spec:{name:24,what:['members','channels','roles','name']},def:{name:'info',what:'members'}},
api:{out:NX,spec:{kind:['joke','catfact','catpic','dogpic','advice','quote','fact','trivia','weather','define','wiki','crypto','pokemon','time'],input:60,name:24,fallback:100},def:{kind:'joke',input:'',name:'api',fallback:'The service did not answer.'}},
http:{out:NX,spec:{url:300,path:100,name:24,fallback:100},def:{url:'https://',path:'',name:'data',fallback:'No data.'}}
}
export const MAX_NODES=200
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
if((n.type==='sub'||n.type==='call'||n.type==='hook')&&!/^[a-z0-9_]{1,24}$/i.test(p.name))bad('Names use letters, numbers and underscores')
if(n.type==='cmd'&&!/^[a-z0-9_]{1,32}$/i.test(p.name))bad('Command names use letters, numbers and underscores')
if(n.type==='chance')p.percent=num(p.percent,0,100,'Percent')
if(n.type==='count')p.by=num(p.by,-1000,1000,'Add')
if(n.type==='setcount')p.value=num(p.value,-1000000,1000000,'Value')
if(n.type==='time'){p.from=num(p.from,0,23,'Hour');p.to=num(p.to,0,23,'Hour')}
if(n.type==='cooldown')p.seconds=num(p.seconds,1,86400,'Seconds')
if(n.type==='timeout')p.minutes=num(p.minutes,1,60,'Minutes')
if(n.type==='http'&&!/^https:\/\//i.test(p.url))bad('The URL must start with https://')
if(n.type==='randnum'){p.min=num(p.min,-1000000,1000000,'Minimum');p.max=num(p.max,-1000000,1000000,'Maximum')}
if(n.type==='caps'){p.percent=num(p.percent,1,100,'Percent');p.min=num(p.min,1,200,'Minimum letters')}
if(n.type==='longmsg')p.chars=num(p.chars,10,2000,'Characters')
if(n.type==='emojispam'||n.type==='mentionspam')p.count=num(p.count,1,50,'Count')
if(n.type==='newmember')p.days=num(p.days,1,365,'Days')
if(n.type==='slowmode')p.seconds=num(p.seconds,0,21600,'Seconds')
if(n.type==='purge')p.count=num(p.count,1,10,'Messages')
if(n.type==='wait')p.seconds=num(p.seconds,1,5,'Seconds')
if(n.type==='word')p.n=num(p.n,1,50,'Word number')
if((n.type==='save'||n.type==='load')&&!/^[a-z0-9_]{1,24}$/i.test(p.key))bad('Keys use letters, numbers and underscores')
if(n.type==='getcount'&&!/^[a-z0-9_]{1,24}$/i.test(p.counter))bad('Counter names use letters, numbers and underscores')
if((n.type==='log'||n.type==='channelis')&&!/^[a-z0-9_-]{1,40}$/i.test(p.channel.replace(/^#/,'')))bad('Channel names use letters, numbers, dashes and underscores')
if(n.type==='sayto'&&!/^[a-z0-9_-]{1,40}$/i.test(p.channel.replace(/^#/,'')))bad('Channel names use letters, numbers, dashes and underscores')
if(T.spec.name!==undefined&&p.name&&!/^[a-z0-9_]{1,24}$/i.test(p.name))bad('Variable names use letters, numbers and underscores')
const dd=typeof n.d==='string'?n.d.trim().slice(0,200):''
nodes.push({...(dd?{d:dd}:{}),id:n.id,type:n.type,x:Math.max(-5000,Math.min(5000,Math.round(Number(n.x)||0))),y:Math.max(-5000,Math.min(5000,Math.round(Number(n.y)||0))),p})
}
const by=new Map(nodes.map(n=>[n.id,n]))
const seen=new Set(),edges=[]
for(const e of g.edges){
if(!e||!by.has(e.f)||!by.has(e.t))bad('Invalid connection')
if(!TYPES[by.get(e.f).type].out.includes(e.o))bad('Invalid connection')
if(TYPES[by.get(e.t).type].trigger||TYPES[by.get(e.t).type].entry)bad('Nothing can lead into a trigger, subflow start or note')
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
if(n.type==='hook')return ctx.event==='hook'&&String(ctx.hook||'').toLowerCase()===n.p.name.toLowerCase()
if(ctx.event)return false
if(n.type==='mention')return!!ctx.mentioned
if(n.type==='reply')return!!ctx.replied
if(n.type==='everyone')return/@everyone|@here/i.test(t)
if(n.type==='usermention')return/<@[a-z0-9_]+>/i.test(t)
if(n.type==='invite')return/(discord\.(gg|com\/invite)|\/invite\/[a-z0-9]+)/i.test(t)
if(n.type==='caps'){const L=t.replace(/[^a-z]/gi,'');if(L.length<Number(n.p.min))return false;return L.replace(/[^A-Z]/g,'').length*100/L.length>=Number(n.p.percent)}
if(n.type==='longmsg')return t.length>=Number(n.p.chars)
if(n.type==='badword'){const w=n.p.words.split('\n').map(x=>x.trim().toLowerCase()).filter(Boolean),l=t.toLowerCase();return w.some(x=>l.includes(x))}
if(n.type==='emojispam')return(t.match(/\p{Extended_Pictographic}/gu)||[]).length>=Number(n.p.count)
if(n.type==='mentionspam')return(t.match(/<@[a-z0-9_]+>/gi)||[]).length>=Number(n.p.count)
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
if(['floor','ceil','round','abs'].includes(op)){if(!Number.isFinite(x))return'';return String(op==='floor'?Math.floor(x):op==='ceil'?Math.ceil(x):op==='round'?Math.round(x):Math.abs(x))}
if(!Number.isFinite(x)||!Number.isFinite(y))return''
if(op==='pow'){const r=Math.pow(x,Math.max(-20,Math.min(20,y)));return Number.isFinite(r)&&Math.abs(r)<1e15?String(Math.round(r*1e6)/1e6):''}
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
case'words':return String(s.trim()?s.trim().split(/\s+/).length:0)
case'reverse':return[...s].reverse().join('')
case'first':return s.trim().split(/\s+/)[0]||''
case'last':return s.trim().split(/\s+/).pop()||''
case'capital':return s.charAt(0).toUpperCase()+s.slice(1)
case'nospaces':return s.replace(/\s+/g,'')
case'digits':return s.replace(/\D/g,'')
case'letters':return s.replace(/[^\p{L}]/gu,'')
case'left':return[...s].slice(0,Math.max(0,Math.min(500,Number(arg)||0))).join('')
case'right':{const a=[...s],n=Math.max(0,Math.min(500,Number(arg)||0));return n?a.slice(-n).join(''):''}
case'repeat':return s.repeat(Math.max(0,Math.min(20,Number(arg)||0))).slice(0,500)
case'slug':return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
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
let steps=0,sends=0,acts=0,heavy=0,waited=0,calls=0
const setv=(name,v)=>{vars[name.toLowerCase()]=clip(v,500);return vars[name.toLowerCase()]}
async function chain(start,depth){
let cur=start
while(cur&&steps<60){
steps++
const n=by.get(cur)
if(!n)break
const P=n.p,R=s=>render(s,vars)
let branch=null,route=null
switch(n.type){
case'if':branch=test(P.op,R(P.left),R(P.right));break
case'chance':branch=rnd()*100<Number(P.percent);break
case'ismod':branch=await io.isMod();break
case'hasrole':branch=P.role?await io.hasRole(R(P.role)):false;break
case'time':{const h=new Date(ctx.at||Date.now()).getUTCHours(),a=Number(P.from),b=Number(P.to);branch=a<=b?h>=a&&h<=b:h>=a||h<=b;break}
case'cooldown':branch=await io.cooldown(n.id,Number(P.seconds),P.scope);break
case'once':branch=(await io.count('once_'+n.id,1,'user'))===1;break
case'stop':log.push({id:n.id,did:'stop'});return
case'gate':branch=P.on==='1';break
case'channelis':branch=ctx.channel.toLowerCase()===R(P.channel).replace(/^#/,'').toLowerCase();break
case'isowner':branch=await io.isOwner();break
case'newmember':{const d=await io.joinedDays();branch=d!==null&&d<Number(P.days);break}
case'weekday':{const d=new Date(ctx.at||Date.now()).getUTCDay();branch=P.day==='weekdays'?d>=1&&d<=5:P.day==='weekend'?d===0||d===6:DAYS.indexOf(P.day)===d;break}
case'wordlist':{const l=R(P.input).toLowerCase();branch=P.words.split('\n').map(x=>x.trim().toLowerCase()).filter(Boolean).some(x=>l.includes(x));break}
case'if2':{const a=test(P.op,R(P.left),R(P.right)),b=test(P.op2,R(P.left2),R(P.right2));branch=P.join==='or'?a||b:a&&b;break}
case'switch':{const v=R(P.input).trim().toLowerCase();route='else';for(const k of['1','2','3','4']){const c=P['v'+k].trim().toLowerCase();if(c&&c===v){route='c'+k;break}}break}
case'call':{if(depth<4){const sb=graph.nodes.find(x=>x.type==='sub'&&x.p.name.toLowerCase()===P.name.toLowerCase());if(sb){log.push({id:n.id,did:'call',name:P.name});await chain(next(sb.id,'next'),depth+1)}}break}
case'say':{const t=R(P.text).trim();if(t&&sends<4){sends++;await io.send(t,P.reply==='1');log.push({id:n.id,did:'say',text:t})}break}
case'sayto':{const t=R(P.text).trim();if(t&&sends<4){sends++;await io.sendTo(R(P.channel).replace(/^#/,''),t);log.push({id:n.id,did:'sayto',text:t})}break}
case'react':if(P.emoji&&acts<8){acts++;await io.react(P.emoji);log.push({id:n.id,did:'react',emoji:P.emoji})}break
case'delete':if(acts<8){acts++;await io.del();log.push({id:n.id,did:'delete'})}break
case'pin':if(acts<8){acts++;await io.pin();log.push({id:n.id,did:'pin'})}break
case'timeout':if(acts<8){acts++;await io.timeout(Number(P.minutes));log.push({id:n.id,did:'timeout',minutes:P.minutes})}break
case'addrole':case'removerole':if(P.role&&acts<8){acts++;await io.role(R(P.role),n.type==='addrole');log.push({id:n.id,did:n.type,role:P.role})}break
case'notice':{const t=R(P.text).trim().slice(0,300);if(t&&acts<8){acts++;await io.notice(t);log.push({id:n.id,did:'notice',text:t})}break}
case'unpin':if(acts<8){acts++;await io.unpin();log.push({id:n.id,did:'unpin'})}break
case'slowmode':if(acts<8){acts++;await io.slowmode(Number(P.seconds));log.push({id:n.id,did:'slowmode',seconds:P.seconds})}break
case'setnick':if(acts<8){acts++;await io.setNick(R(P.nick).trim().slice(0,32));log.push({id:n.id,did:'setnick'})}break
case'untimeout':if(acts<8){acts++;await io.untimeout();log.push({id:n.id,did:'untimeout'})}break
case'kick':case'ban':if(acts<8&&heavy<1){acts++;heavy++;await io[n.type](R(P.reason).slice(0,200));log.push({id:n.id,did:n.type})}break
case'purge':if(acts<8){acts++;await io.purge(Number(P.count));log.push({id:n.id,did:'purge',count:P.count})}break
case'warn':if(acts<8){acts++;const w=await io.warn(R(P.reason).slice(0,200));log.push({id:n.id,did:'warn',value:setv(P.name||'warns',String(w))})}break
case'log':{const t=R(P.text).trim();if(t&&sends<4){sends++;await io.sendTo(R(P.channel).replace(/^#/,''),t);log.push({id:n.id,did:'log',text:t})}break}
case'wait':{const ms=Math.min(5000,Number(P.seconds)*1000),left=8000-waited;if(!ctx.dry&&left>0){const w=Math.min(ms,left);waited+=w;await new Promise(r=>setTimeout(r,w))}log.push({id:n.id,did:'wait'});break}
case'save':if(P.key){await io.save(P.key.toLowerCase(),R(P.value).slice(0,300),P.scope);log.push({id:n.id,did:'save'})}break
case'load':if(P.name){const v=await io.load(P.key.toLowerCase(),P.scope);log.push({id:n.id,did:'load',value:setv(P.name,v===null?R(P.fallback):String(v))})}break
case'getcount':if(P.name)log.push({id:n.id,did:'getcount',value:setv(P.name,String(await io.getCount(P.counter.toLowerCase(),P.scope)))});break
case'word':if(P.name){const w=R(P.input).trim().split(/\s+/).filter(Boolean);log.push({id:n.id,did:'word',value:setv(P.name,w[Number(P.n)-1]||'')})}break
case'combine':if(P.name)log.push({id:n.id,did:'combine',value:setv(P.name,R(P.a)+R(P.sep)+R(P.b))});break
case'clock':if(P.name){const d=new Date(ctx.at||Date.now()),M=['January','February','March','April','May','June','July','August','September','October','November','December'];const v={unix:String(Math.floor(d.getTime()/1000)),date:vars.date,time:vars.time,hour:String(d.getUTCHours()),minute:String(d.getUTCMinutes()),day:String(d.getUTCDate()),month:String(d.getUTCMonth()+1),monthname:M[d.getUTCMonth()],year:String(d.getUTCFullYear()),weekday:vars.weekday}[P.what]||'';log.push({id:n.id,did:'clock',value:setv(P.name,v)})}break
case'userinfo':if(P.name)log.push({id:n.id,did:'userinfo',value:setv(P.name,String(await io.memberInfo(P.what)))});break
case'serverinfo':if(P.name)log.push({id:n.id,did:'serverinfo',value:setv(P.name,String(await io.serverInfo(P.what)))});break
case'api':case'http':if(P.name&&calls<3){calls++;const r=n.type==='api'?await io.api(P.kind,R(P.input)):await io.http(R(P.url),R(P.path));const v=r&&r.text?r.text:R(P.fallback);log.push({id:n.id,did:n.type,value:setv(P.name,v)});if(r&&r.extra)for(const[k,x]of Object.entries(r.extra))setv(P.name+'_'+k,x)}break
case'pick':{const o=P.options.split('\n').map(x=>x.trim()).filter(Boolean);if(o.length&&P.name)log.push({id:n.id,did:'pick',value:setv(P.name,R(o[Math.floor(rnd()*o.length)]))});break}
case'set':if(P.name)log.push({id:n.id,did:'set',value:setv(P.name,R(P.value))});break
case'count':if(P.name)log.push({id:n.id,did:'count',value:setv(P.name,String(await io.count(P.name.toLowerCase(),Number(P.by)||0,P.scope)))});break
case'setcount':if(P.name)log.push({id:n.id,did:'setcount',value:setv(P.name,String(await io.setCount(P.name.toLowerCase(),Number(P.value)||0,P.scope)))});break
case'math':if(P.name)log.push({id:n.id,did:'math',value:setv(P.name,calc(R(P.a),P.op,R(P.b)))});break
case'text':if(P.name)log.push({id:n.id,did:'text',value:setv(P.name,xform(P.fn,R(P.input),P.arg))});break
case'randnum':if(P.name){const a=Number(P.min),b=Number(P.max),lo=Math.min(a,b),hi=Math.max(a,b);log.push({id:n.id,did:'randnum',value:setv(P.name,String(lo+Math.floor(rnd()*(hi-lo+1))))})}break
case'map':if(P.name){const k=R(P.input).trim().toLowerCase();let out=null;for(const line of P.table.split('\n')){const i=line.indexOf('=');if(i>0&&line.slice(0,i).trim().toLowerCase()===k){out=line.slice(i+1).trim();break}}log.push({id:n.id,did:'map',value:setv(P.name,out===null?R(P.fallback):R(out))})}break
}
if(route!==null){log.push({id:n.id,did:route});cur=next(n.id,route)}
else if(branch!==null){log.push({id:n.id,did:branch?'yes':'no'});cur=next(n.id,branch?'yes':'no')}
else cur=next(n.id,'next')
}
}
for(const trig of graph.nodes.filter(n=>TYPES[n.type].trigger&&triggered(n,ctx))){
log.push({id:trig.id,did:'start'})
await chain(next(trig.id,'next'),0)
}
return log
}
