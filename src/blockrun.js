import{fail}from'./util.js'
import{pathGet,hookUrl}from'./apiblock.js'
import*as L from'./labfx.js'
import{LAB}from'./labmore.js'
import{TRIG}from'./labmore2.js'
import{parseOpts,parseArgs}from'../public/js/cmdopts.js'
const OPS=['contains','notcontains','equals','neq','starts','ends','oneof','gt','lt','empty','notempty']
const FNS=['upper','lower','title','trim','length','reverse','first','last','replace','words','capital','nospaces','digits','letters','left','right','repeat','slug']
const MATH=['+','-','*','/','%','max','min','pow','floor','ceil','round','abs']
const YN=['yes','no']
const NX=['next']
const SC=['server','user']
const DAYS=['sun','mon','tue','wed','thu','fri','sat','weekdays','weekend']
const CASES=['c1','c2','c3','c4','else']
const ZONES=['UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Anchorage','Pacific/Honolulu','America/Toronto','America/Mexico_City','America/Sao_Paulo','Europe/London','Europe/Paris','Europe/Berlin','Europe/Moscow','Africa/Cairo','Africa/Lagos','Asia/Dubai','Asia/Kolkata','Asia/Bangkok','Asia/Shanghai','Asia/Tokyo','Asia/Seoul','Australia/Sydney','Pacific/Auckland']
const WD={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}
export function parseClock(s,end){
const m=String(s).trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/)
if(!m)return null
let h=Number(m[1]),mi=m[2]===undefined?null:Number(m[2])
if(m[3]){if(h<1||h>12)return null;h=h%12+(m[3]==='pm'?12:0)}else if(h>23)return null
if(mi!==null&&mi>59)return null
return h*60+(mi===null?(end?59:0):mi)
}
const FMT=new Map()
function wall(at,tz){
let f=FMT.get(tz)
if(!f){try{f=new Intl.DateTimeFormat('en-US',{timeZone:tz,hourCycle:'h23',year:'numeric',month:'numeric',day:'numeric',weekday:'short',hour:'numeric',minute:'numeric'})}catch{f=new Intl.DateTimeFormat('en-US',{timeZone:'UTC',hourCycle:'h23',year:'numeric',month:'numeric',day:'numeric',weekday:'short',hour:'numeric',minute:'numeric'})}FMT.set(tz,f)}
const o={}
for(const x of f.formatToParts(new Date(at)))o[x.type]=x.value
return{h:Number(o.hour)%24,mi:Number(o.minute),d:Number(o.day),mo:Number(o.month),y:Number(o.year),wd:WD[o.weekday]??0}
}
const UN={m:['l',1],km:['l',1000],cm:['l',.01],mm:['l',.001],mi:['l',1609.344],yd:['l',.9144],ft:['l',.3048],in:['l',.0254],kg:['w',1],g:['w',.001],lb:['w',.45359237],oz:['w',.028349523125],mps:['s',1],kmh:['s',1/3.6],mph:['s',.44704],knot:['s',.514444],l:['v',1],ml:['v',.001],gal:['v',3.785411784],cup:['v',.2365882365],c:['t'],f:['t'],k:['t'],b:['d',1],kb:['d',1e3],mb:['d',1e6],gb:['d',1e9],tb:['d',1e12],sec:['T',1],min:['T',60],hr:['T',3600],day:['T',86400]}
export const TYPES={
msg:{out:NX,trigger:true,spec:{mode:['any','contains','equals','starts'],text:100,ci:['1','0']},def:{mode:'contains',text:'',ci:'1'}},
cmd:{out:NX,trigger:true,spec:{prefix:3,name:32,desc:100,options:600},def:{prefix:'!',name:'ping',desc:'',options:''}},
mention:{out:NX,trigger:true,spec:{},def:{}},
join:{out:NX,trigger:true,spec:{},def:{}},
link:{out:NX,trigger:true,spec:{},def:{}},
image:{out:NX,trigger:true,spec:{},def:{}},
if:{out:YN,spec:{left:200,op:OPS,right:200},def:{left:'{text}',op:'contains',right:''}},
chance:{out:YN,spec:{percent:3},def:{percent:'50'}},
ismod:{out:YN,spec:{},def:{}},
hasrole:{out:YN,spec:{role:40},def:{role:''}},
time:{out:YN,spec:{from:12,to:12,tz:40},def:{from:'9:00 AM',to:'5:00 PM',tz:'UTC'}},
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
weekday:{out:YN,spec:{day:DAYS,tz:40},def:{day:'weekdays',tz:'UTC'}},
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
clock:{out:NX,spec:{name:24,what:['unix','date','time','hour','minute','day','month','monthname','year','weekday'],tz:40},def:{name:'now',what:'unix',tz:'UTC'}},
userinfo:{out:NX,spec:{name:24,what:['nickname','joined_days','roles','role_count']},def:{name:'info',what:'joined_days'}},
serverinfo:{out:NX,spec:{name:24,what:['members','channels','roles','name']},def:{name:'info',what:'members'}},
api:{out:NX,spec:{kind:['joke','catfact','catpic','dogpic','advice','quote','fact','trivia','weather','define','wiki','crypto','pokemon','time','xkcd','country','github','npm','mcserver','mcuser','exchange','dadjoke','chuck','kanye','fox','meal','cocktail','bored','agify','nationalize','zip','spacex','rickmorty','dnd','meowfact','dogfact','hn','ghrepo','pypi','crates','wikirandom','rhyme','synonym','coinprice','progjoke','bible','anime','tv','song','chess','lichess','wayback','trending','feargreed','stoic','affirmation','ronswanson','riddle','mtg','yugioh','duck','brewery','spacenews','uuid'],input:60,name:24,fallback:100},def:{kind:'joke',input:'',name:'api',fallback:'The service did not answer.'}},
jsonget:{out:NX,spec:{name:24,input:500,path:100},def:{name:'value',input:'{data}',path:''}},
item:{out:NX,spec:{name:24,input:500,op:['nth','random','count','last'],n:3},def:{name:'item',input:'{args}',op:'nth',n:'1'}},
http:{out:NX,spec:{url:300,path:100,name:24,fallback:100},def:{url:'https://',path:'',name:'data',fallback:'No data.'}},
question:{out:NX,trigger:true,spec:{},def:{}},
shortmsg:{out:NX,trigger:true,spec:{chars:4},def:{chars:'5'}},
codeblock:{out:NX,trigger:true,spec:{},def:{}},
hasnumber:{out:NX,trigger:true,spec:{},def:{}},
mediaurl:{out:NX,trigger:true,spec:{},def:{}},
random3:{out:['c1','c2','c3'],spec:{},def:{}},
between:{out:YN,spec:{value:100,min:30,max:30},def:{value:'{arg1}',min:'1',max:'10'}},
evenodd:{out:YN,spec:{value:100},def:{value:'{arg1}'}},
lengthcheck:{out:YN,spec:{input:300,min:4,max:4},def:{input:'{text}',min:'1',max:'100'}},
hasargs:{out:YN,spec:{min:2},def:{min:'1'}},
isnumber:{out:YN,spec:{input:100},def:{input:'{arg1}'}},
substr:{out:NX,spec:{name:24,input:300,from:4,len:4},def:{name:'part',input:'{text}',from:'1',len:'10'}},
percent:{out:NX,spec:{name:24,a:100,b:100,decimals:1},def:{name:'percent',a:'1',b:'4',decimals:'0'}},
stats:{out:NX,spec:{name:24,input:500,what:['sum','average','min','max','median','count']},def:{name:'result',input:'{args}',what:'sum'}},
sortlist:{out:NX,spec:{name:24,input:500,how:['az','za','num','numdesc','shuffle']},def:{name:'sorted',input:'{args}',how:'az'}},
joinlist:{out:NX,spec:{name:24,input:500,sep:20},def:{name:'joined',input:'{args}',sep:' | '}},
unique:{out:NX,spec:{name:24,input:500},def:{name:'unique',input:'{args}'}},
occurs:{out:NX,spec:{name:24,input:300,find:100},def:{name:'found',input:'{text}',find:'a'}},
dateadd:{out:NX,spec:{name:24,days:6,tz:40},def:{name:'when',days:'7',tz:'UTC'}},
daysuntil:{out:NX,spec:{name:24,date:20},def:{name:'days',date:'2027-01-01'}},
dice:{out:NX,spec:{name:24,notation:14},def:{name:'roll',notation:'2d6'}},
bar:{out:NX,spec:{name:24,value:30,max:30,width:2},def:{name:'bar',value:'3',max:'10',width:'10'}},
ordinal:{out:NX,spec:{name:24,input:30},def:{name:'ordinal',input:'{arg1}'}},
numformat:{out:NX,spec:{name:24,input:30},def:{name:'number',input:'{arg1}'}},
base:{out:NX,spec:{name:24,input:30,to:['bin','hex','oct','dec']},def:{name:'converted',input:'{arg1}',to:'bin'}},
urlenc:{out:NX,spec:{name:24,input:300},def:{name:'encoded',input:'{args}'}},
hashnum:{out:NX,spec:{name:24,input:200,max:9},def:{name:'score',input:'{args}',max:'100'}},
rps:{out:NX,spec:{name:24,input:30},def:{name:'result',input:'{arg1}'}},
dd:{out:NX,spec:{name:24,kind:['invite','widget','template','app','status','stickers'],input:100,fallback:100},def:{name:'discord',kind:'invite',input:'{arg1}',fallback:'Discord did not answer.'}},
ddwebhook:{out:NX,spec:{name:24,url:200,user:80,avatar:300,text:1900},def:{name:'sent',url:'https://discord.com/api/webhooks/',user:'',avatar:'',text:''}},
ddembed:{out:NX,spec:{name:24,url:200,user:80,title:200,text:1500,color:7,image:300,footer:100},def:{name:'sent',url:'https://discord.com/api/webhooks/',user:'',title:'',text:'',color:'5865F2',image:'',footer:''}},
ddformat:{out:NX,spec:{name:24,input:500,fmt:['bold','italic','bolditalic','underline','strike','spoiler','code','codeblock','quote','h1','h2','h3','subtext','nolink']},def:{name:'styled',input:'{text}',fmt:'bold'}},
ddtime:{out:NX,spec:{name:24,input:20,fmt:['t','T','d','D','f','F','R']},def:{name:'stamp',input:'',fmt:'R'}},
ddsnowflake:{out:NX,spec:{name:24,input:30},def:{name:'flake',input:'{arg1}'}},
ddmention:{out:NX,spec:{name:24,kind:['user','channel','role'],id:30},def:{name:'ping',kind:'user',id:'{userid}'}},
ddinvitecode:{out:NX,spec:{name:24,input:500},def:{name:'invite',input:'{text}'}},
ddemoji:{out:NX,spec:{name:24,label:32,id:30,animated:['0','1']},def:{name:'emoji',label:'emoji',id:'',animated:'0'}},
ddlink:{out:NX,spec:{name:24,kind:['message','channel','user','invite','server'],a:30,b:30,c:30},def:{name:'link',kind:'invite',a:'',b:'',c:''}},
world:{out:NX,spec:{name:24,kind:['geo','forecast','sun','air','quake','iss','holiday','launch','uv','wind','elevation','onthisday','book','poem','art','colorname'],input:60,fallback:100},def:{name:'world',kind:'forecast',input:'{args}',fallback:'No data for that.'}},
moonphase:{out:NX,spec:{name:24,date:20},def:{name:'moon',date:''}},
distance:{out:NX,spec:{name:24,lat1:12,lon1:12,lat2:12,lon2:12,unit:['km','mi']},def:{name:'distance',lat1:'',lon1:'',lat2:'',lon2:'',unit:'km'}},
unitconv:{out:NX,spec:{name:24,value:30,from:Object.keys(UN),to:Object.keys(UN)},def:{name:'converted',value:'{arg1}',from:'km',to:'mi'}},
colorconv:{out:NX,spec:{name:24,input:30},def:{name:'color',input:'{arg1}'}},
morse:{out:NX,spec:{name:24,input:200,mode:['encode','decode']},def:{name:'morse',input:'{args}',mode:'encode'}},
roman:{out:NX,spec:{name:24,input:20,mode:['toroman','tonumber']},def:{name:'roman',input:'{arg1}',mode:'toroman'}},
caesar:{out:NX,spec:{name:24,input:300,shift:3},def:{name:'cipher',input:'{args}',shift:'3'}},
hashtext:{out:NX,spec:{name:24,input:300,algo:['sha256','sha1','sha512']},def:{name:'hash',input:'{args}',algo:'sha256'}},
uuid:{out:NX,spec:{name:24},def:{name:'uuid'}},
nato:{out:NX,spec:{name:24,input:100},def:{name:'spelled',input:'{args}'}},
binarytext:{out:NX,spec:{name:24,input:200,mode:['encode','decode']},def:{name:'binary',input:'{args}',mode:'encode'}},
foreach:{out:['each','done'],spec:{name:24,input:500},def:{name:'item',input:'{args}'}},
devvibrate:{out:NX,spec:{pattern:40},def:{pattern:'200,100,200'}},
devspeak:{out:NX,spec:{text:300},def:{text:'{text}'}},
devtone:{out:NX,spec:{freq:5,ms:5},def:{freq:'440',ms:'400'}},
devflash:{out:NX,spec:{color:7,ms:5},def:{color:'FFFFFF',ms:'400'}},
devnotify:{out:NX,spec:{title:60,body:200},def:{title:'{server}',body:'{text}'}},
devcopy:{out:NX,spec:{text:500},def:{text:'{text}'}},
devopen:{out:NX,spec:{url:300},def:{url:'https://'}},
devshare:{out:NX,spec:{text:300},def:{text:'{text}'}},
devwake:{out:NX,spec:{seconds:3},def:{seconds:'30'}},
devbattery:{out:NX,spec:{},def:{}},
devnet:{out:NX,spec:{},def:{}},
btscan:{out:NX,spec:{prefix:30},def:{prefix:''}},
btbattery:{out:NX,spec:{prefix:30},def:{prefix:''}},
btheart:{out:NX,spec:{seconds:3},def:{seconds:'15'}},
btread:{out:NX,spec:{prefix:30,service:40,char:40,as:['text','hex','number']},def:{prefix:'',service:'battery_service',char:'battery_level',as:'number'}},
devmorse:{out:NX,spec:{text:40},def:{text:'SOS'}},
devmelody:{out:NX,spec:{notes:120},def:{notes:'C4 E4 G4 C5'}},
devtimer:{out:NX,spec:{seconds:5,label:60},def:{seconds:'60',label:'Time is up'}},
devemoji:{out:NX,spec:{emoji:8,count:2},def:{emoji:'🎉',count:'20'}},
devinfo:{out:NX,spec:{},def:{}},
devfull:{out:NX,spec:{},def:{}},
devrumble:{out:NX,spec:{ms:4},def:{ms:'500'}},
btinfo:{out:NX,spec:{prefix:30},def:{prefix:''}},
btnotify:{out:NX,spec:{prefix:30,service:40,char:40,seconds:3,as:['number','text','hex']},def:{prefix:'',service:'ffe0',char:'ffe1',seconds:'15',as:'text'}},
btwritetext:{out:NX,spec:{prefix:30,service:40,char:40,text:20},def:{prefix:'',service:'ffe0',char:'ffe1',text:'go'}},
serialsend:{out:NX,spec:{baud:6,text:200,newline:['1','0']},def:{baud:'9600',text:'LED ON',newline:'1'}},
serialread:{out:NX,spec:{baud:6,seconds:3},def:{baud:'9600',seconds:'10'}},
usbinfo:{out:NX,spec:{},def:{}},
nfcread:{out:NX,spec:{seconds:3},def:{seconds:'15'}},
nfcwrite:{out:NX,spec:{text:200},def:{text:'Hello from Parley'}},
btwrite:{out:NX,spec:{prefix:30,service:40,char:40,hex:64},def:{prefix:'',service:'ffe0',char:'ffe1',hex:'01'}}
}
for(const[k,v]of Object.entries(LAB))TYPES[k]={out:v.out||NX,spec:v.spec,def:v.def}
for(const[k,v]of Object.entries(TRIG))TYPES[k]={out:NX,trigger:true,spec:v.spec,def:v.def}
TYPES.feed={out:NX,spec:{url:300,item:['1','2','3','4','5'],part:['title','link','both'],name:24,fallback:100},def:{url:'https://',item:'1',part:'title',name:'feed',fallback:'The feed did not answer.'}}
TYPES.preview={out:NX,spec:{url:300,part:['title','description','image','site'],name:24,fallback:100},def:{url:'{arg1}',part:'title',name:'preview',fallback:'No preview found.'}}
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
if(n.type==='time'&&(parseClock(p.from)===null||parseClock(p.to)===null))bad('Use times like 9:00 PM or 21:30')
if(T.spec.tz!==undefined){try{new Intl.DateTimeFormat('en-US',{timeZone:p.tz})}catch{p.tz='UTC'}}
if(n.type==='cooldown')p.seconds=num(p.seconds,1,86400,'Seconds')
if(n.type==='timeout')p.minutes=num(p.minutes,1,60,'Minutes')
if(n.type==='http'&&!/^https:\/\//i.test(p.url))bad('The URL must start with https://')
if((n.type==='feed'||n.type==='preview')&&!p.url.includes('{')&&!/^https:\/\//i.test(p.url))bad('The URL must start with https://')
if(n.type==='item')p.n=num(p.n,1,100,'Item number')
if(n.type==='randnum'){p.min=num(p.min,-1000000,1000000,'Minimum');p.max=num(p.max,-1000000,1000000,'Maximum')}
if(n.type==='caps'){p.percent=num(p.percent,1,100,'Percent');p.min=num(p.min,1,200,'Minimum letters')}
if(n.type==='shortmsg')p.chars=num(p.chars,1,500,'Characters')
if(n.type==='hasargs')p.min=num(p.min,0,50,'Arguments')
if(n.type==='lengthcheck'){p.min=num(p.min,0,2000,'Minimum');p.max=num(p.max,0,2000,'Maximum')}
if(n.type==='substr'){p.from=num(p.from,1,2000,'Start');p.len=num(p.len,0,500,'Length')}
if(n.type==='percent')p.decimals=num(p.decimals,0,4,'Decimals')
if(n.type==='dateadd')p.days=num(p.days,-36500,36500,'Days')
if(n.type==='bar')p.width=num(p.width,3,30,'Width')
if(n.type==='hashnum')p.max=num(p.max,1,1000000,'Highest')
if(n.type==='ddembed'&&p.color&&!/^#?[0-9a-f]{6}$/i.test(p.color))bad('Colors are six hex digits like 5865F2')
if((n.type==='ddwebhook'||n.type==='ddembed')&&!hookUrl(p.url)&&p.url!=='https://discord.com/api/webhooks/')bad('Use a Discord webhook URL that starts with https://discord.com/api/webhooks/')
if((n.type==='ddwebhook'||n.type==='ddembed')&&p.avatar&&!/^https:\/\//i.test(p.avatar))bad('The avatar link must start with https://')
if(n.type==='ddembed'&&p.image&&!/^https:\/\//i.test(p.image))bad('The image link must start with https://')
if(n.type==='caesar')p.shift=num(p.shift,-25,25,'Shift')
if(n.type==='devtone'){p.freq=num(p.freq,100,2000,'Pitch');p.ms=num(p.ms,50,2000,'Length')}
if(n.type==='devflash'){if(!/^#?[0-9a-f]{6}$/i.test(p.color))bad('Colors are six hex digits like FFFFFF');p.ms=num(p.ms,50,3000,'Length')}
if(n.type==='devvibrate'&&!/^\d{1,4}(,\d{1,4}){0,7}$/.test(p.pattern.replace(/\s/g,'')))bad('Vibration is a comma list of milliseconds like 200,100,200')
if(n.type==='devwake')p.seconds=num(p.seconds,1,300,'Seconds')
if(n.type==='btheart')p.seconds=num(p.seconds,3,60,'Seconds')
if(n.type==='devopen'&&!/^https:\/\//i.test(p.url))bad('The link must start with https://')
if((n.type==='btread'||n.type==='btwrite')&&(!/^([0-9a-f]{4}|[0-9a-f]{8}-[0-9a-f-]{27}|[a-z_]{3,40})$/i.test(p.service)||!/^([0-9a-f]{4}|[0-9a-f]{8}-[0-9a-f-]{27}|[a-z_]{3,40})$/i.test(p.char)))bad('Use a Bluetooth name like battery_service or a UUID')
if(n.type==='btwrite'&&!/^([0-9a-f]{2}){1,32}$/i.test(p.hex.replace(/\s/g,'')))bad('The value is hex bytes like 01FF')
if(n.type==='devmelody'&&!/^([A-G][#b]?[2-7]\s*){1,16}$/.test(p.notes.trim()+' '))bad('Notes look like C4 E4 G4 and go up to 16')
if(n.type==='devtimer')p.seconds=num(p.seconds,1,3600,'Seconds')
if(n.type==='devemoji')p.count=num(p.count,1,40,'Count')
if(n.type==='devrumble')p.ms=num(p.ms,50,2000,'Length')
if(n.type==='btnotify')p.seconds=num(p.seconds,3,60,'Seconds')
if(n.type==='btnotify'&&(!/^([0-9a-f]{4}|[0-9a-f]{8}-[0-9a-f-]{27}|[a-z_]{3,40})$/i.test(p.service)||!/^([0-9a-f]{4}|[0-9a-f]{8}-[0-9a-f-]{27}|[a-z_]{3,40})$/i.test(p.char)))bad('Use a Bluetooth name like heart_rate or a UUID')
if(n.type==='btwritetext'&&(!/^([0-9a-f]{4}|[0-9a-f]{8}-[0-9a-f-]{27}|[a-z_]{3,40})$/i.test(p.service)||!/^([0-9a-f]{4}|[0-9a-f]{8}-[0-9a-f-]{27}|[a-z_]{3,40})$/i.test(p.char)))bad('Use a Bluetooth name or a UUID')
if(n.type==='serialsend'||n.type==='serialread'){if(![1200,2400,4800,9600,19200,38400,57600,115200].includes(Number(p.baud)))bad('Baud rate must be a common speed like 9600 or 115200')}
if(n.type==='serialread')p.seconds=num(p.seconds,1,60,'Seconds')
if(n.type==='nfcread')p.seconds=num(p.seconds,3,60,'Seconds')
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
let xo=Number(n.xo);xo=Number.isInteger(xo)&&xo>0&&T.out.length?Math.min(3,xo):0
const xi=[]
if(Array.isArray(n.xi)&&n.type!=='note')for(const r of n.xi.slice(0,4)){if(!Array.isArray(r))continue;const k=String(r[0]||'').trim(),v=String(r[1]===undefined?'':r[1]);if(!/^[a-z0-9_]{1,24}$/i.test(k))bad('Extra input names use letters, numbers and underscores');if(v.length>200)bad('Extra input is too long');xi.push([k,v])}
const dd=typeof n.d==='string'?n.d.trim().slice(0,200):''
nodes.push({...(dd?{d:dd}:{}),...(xo?{xo}:{}),...(xi.length?{xi}:{}),id:n.id,type:n.type,x:Math.max(-5000,Math.min(5000,Math.round(Number(n.x)||0))),y:Math.max(-5000,Math.min(5000,Math.round(Number(n.y)||0))),p})
}
const by=new Map(nodes.map(n=>[n.id,n]))
const seen=new Set(),edges=[]
for(const e of g.edges){
if(!e||!by.has(e.f)||!by.has(e.t))bad('Invalid connection')
if(!TYPES[by.get(e.f).type].out.includes(e.o)&&!(/^x[1-3]$/.test(e.o)&&(by.get(e.f).xo||0)>=Number(e.o[1])))bad('Invalid connection')
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
if(n.type==='question')return/\?\s*$/.test(t)
if(n.type==='shortmsg')return t.length>0&&t.length<=Number(n.p.chars)
if(n.type==='codeblock')return t.includes('```')
if(n.type==='hasnumber')return/\d/.test(t)
if(n.type==='mediaurl')return/https?:\/\/\S+\.(png|jpe?g|gif|webp|mp4|webm|mov)(\?\S*)?(\s|$)|https?:\/\/(www\.)?(tenor|giphy)\.com\/\S+/i.test(t)
const Tg=TRIG[n.type];if(Tg)return Tg.test(n.p,t)
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
const sl='/'+n.p.name.toLowerCase();return l===p||l.startsWith(p+' ')||l===sl||l.startsWith(sl+' ')
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
const DEV=/^(dev|bt|serial|usb|nfc)/
const wsc=s=>String(s).replace(/\s/g,'')
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
const devs=[]
const setv=(name,v)=>{vars[name.toLowerCase()]=clip(v,500);return vars[name.toLowerCase()]}
async function chain(start,depth){
let cur=start
while(cur&&steps<60){
steps++
const n=by.get(cur)
if(!n)break
const P=n.p,R=s=>render(s,vars)
let branch=null,route=null
if(n.xi)for(const[xk,xv]of n.xi)setv(xk,R(xv))
switch(n.type){
case'if':branch=test(P.op,R(P.left),R(P.right));break
case'chance':branch=rnd()*100<Number(P.percent);break
case'ismod':branch=await io.isMod();break
case'hasrole':branch=P.role?await io.hasRole(R(P.role)):false;break
case'time':{const w=wall(ctx.at||Date.now(),P.tz||'UTC'),m=w.h*60+w.mi,a=parseClock(P.from,false),b=parseClock(P.to,true);branch=a===null||b===null?false:a<=b?m>=a&&m<=b:m>=a||m<=b;break}
case'cooldown':branch=await io.cooldown(n.id,Number(P.seconds),P.scope);break
case'once':branch=(await io.count('once_'+n.id,1,'user'))===1;break
case'stop':log.push({id:n.id,did:'stop'});return
case'gate':branch=P.on==='1';break
case'channelis':branch=ctx.channel.toLowerCase()===R(P.channel).replace(/^#/,'').toLowerCase();break
case'isowner':branch=await io.isOwner();break
case'newmember':{const d=await io.joinedDays();branch=d!==null&&d<Number(P.days);break}
case'weekday':{const d=wall(ctx.at||Date.now(),P.tz||'UTC').wd;branch=P.day==='weekdays'?d>=1&&d<=5:P.day==='weekend'?d===0||d===6:DAYS.indexOf(P.day)===d;break}
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
case'clock':if(P.name){const w=wall(ctx.at||Date.now(),P.tz||'UTC'),M=['January','February','March','April','May','June','July','August','September','October','November','December'],p2=x=>String(x).padStart(2,'0');const v={unix:String(Math.floor((ctx.at||Date.now())/1000)),date:w.y+'-'+p2(w.mo)+'-'+p2(w.d),time:p2(w.h)+':'+p2(w.mi),hour:String(w.h),minute:String(w.mi),day:String(w.d),month:String(w.mo),monthname:M[w.mo-1],year:String(w.y),weekday:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][w.wd]}[P.what]||'';log.push({id:n.id,did:'clock',value:setv(P.name,v)})}break
case'userinfo':if(P.name)log.push({id:n.id,did:'userinfo',value:setv(P.name,String(await io.memberInfo(P.what)))});break
case'serverinfo':if(P.name)log.push({id:n.id,did:'serverinfo',value:setv(P.name,String(await io.serverInfo(P.what)))});break
case'api':case'http':case'feed':case'preview':if(P.name&&calls<3){calls++;const r=n.type==='api'?await io.api(P.kind,R(P.input)):n.type==='http'?await io.http(R(P.url),R(P.path)):await io.http(R(P.url),n.type==='feed'?'@feed:'+P.item+'.'+P.part:'@page:'+P.part);const v=r&&r.text?r.text:R(P.fallback);log.push({id:n.id,did:n.type,value:setv(P.name,v)});if(r&&r.extra)for(const[k,x]of Object.entries(r.extra))setv(P.name+'_'+k,x)}break
case'jsonget':if(P.name){let v='';try{const j=JSON.parse(R(P.input));const r=P.path?pathGet(j,P.path):j;v=r===undefined?'':typeof r==='object'?JSON.stringify(r):String(r)}catch{}log.push({id:n.id,did:'jsonget',value:setv(P.name,v)})}break
case'item':if(P.name){const a=R(P.input).split(/[\n,]/).map(x=>x.trim()).filter(Boolean);const v=P.op==='count'?String(a.length):P.op==='random'?(a[Math.floor(rnd()*a.length)]||''):P.op==='last'?(a[a.length-1]||''):(a[Number(P.n)-1]||'');log.push({id:n.id,did:'item',value:setv(P.name,v)})}break
case'random3':route='c'+(1+Math.floor(rnd()*3));break
case'between':{const v=Number(R(P.value));branch=Number.isFinite(v)&&v>=Math.min(Number(R(P.min)),Number(R(P.max)))&&v<=Math.max(Number(R(P.min)),Number(R(P.max)));break}
case'evenodd':{const v=Number(R(P.value));branch=Number.isInteger(v)&&v%2===0;break}
case'lengthcheck':{const l=[...R(P.input)].length;branch=l>=Number(P.min)&&l<=Number(P.max);break}
case'hasargs':branch=(vars.args?vars.args.trim().split(/\s+/).length:0)>=Number(P.min);break
case'isnumber':{const v=R(P.input).trim();branch=v!==''&&Number.isFinite(Number(v));break}
case'substr':if(P.name)log.push({id:n.id,did:'substr',value:setv(P.name,[...R(P.input)].slice(Number(P.from)-1,Number(P.from)-1+Number(P.len)).join(''))});break
case'percent':if(P.name){const a=Number(R(P.a)),b=Number(R(P.b)),d=Number(P.decimals);log.push({id:n.id,did:'percent',value:setv(P.name,Number.isFinite(a)&&Number.isFinite(b)&&b!==0?(a/b*100).toFixed(d):'')})}break
case'stats':if(P.name){const a=R(P.input).split(/[\s,;]+/).filter(Boolean).map(Number).filter(Number.isFinite).slice(0,200),sm=a.reduce((x,y)=>x+y,0),so=[...a].sort((x,y)=>x-y);const v=!a.length?(P.what==='count'?'0':''):P.what==='sum'?sm:P.what==='average'?sm/a.length:P.what==='min'?so[0]:P.what==='max'?so[so.length-1]:P.what==='median'?(so.length%2?so[(so.length-1)/2]:(so[so.length/2-1]+so[so.length/2])/2):a.length;log.push({id:n.id,did:'stats',value:setv(P.name,String(typeof v==='number'?Math.round(v*1e6)/1e6:v))})}break
case'sortlist':if(P.name){const a=R(P.input).split(/[\n,]/).map(x=>x.trim()).filter(Boolean).slice(0,100);if(P.how==='shuffle'){for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}}else if(P.how==='num'||P.how==='numdesc')a.sort((x,y)=>(Number(x)-Number(y))*(P.how==='num'?1:-1));else{a.sort((x,y)=>x.localeCompare(y));if(P.how==='za')a.reverse()}log.push({id:n.id,did:'sortlist',value:setv(P.name,a.join(', '))})}break
case'joinlist':if(P.name)log.push({id:n.id,did:'joinlist',value:setv(P.name,R(P.input).split(/[\n,]/).map(x=>x.trim()).filter(Boolean).slice(0,100).join(R(P.sep)))});break
case'unique':if(P.name){const seen=new Set(),o=[];for(const x of R(P.input).split(/[\n,]/).map(x=>x.trim()).filter(Boolean).slice(0,100)){const k=x.toLowerCase();if(!seen.has(k)){seen.add(k);o.push(x)}}log.push({id:n.id,did:'unique',value:setv(P.name,o.join(', '))})}break
case'occurs':if(P.name){const f=R(P.find).toLowerCase(),t=R(P.input).toLowerCase();log.push({id:n.id,did:'occurs',value:setv(P.name,String(f?t.split(f).length-1:0))})}break
case'dateadd':if(P.name){const w=wall((ctx.at||Date.now())+Number(P.days)*86400000,P.tz||'UTC'),p2=x=>String(x).padStart(2,'0');log.push({id:n.id,did:'dateadd',value:setv(P.name,w.y+'-'+p2(w.mo)+'-'+p2(w.d))})}break
case'daysuntil':if(P.name){const m=R(P.date).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);let v='';if(m){const t=Date.UTC(Number(m[1]),Number(m[2])-1,Number(m[3])),c=ctx.at||Date.now();v=String(Math.ceil((t-c)/86400000))}log.push({id:n.id,did:'daysuntil',value:setv(P.name,v)})}break
case'dice':if(P.name){const m=R(P.notation).trim().toLowerCase().match(/^(\d{1,2})d(\d{1,4})([+-]\d{1,5})?$/);let v='';if(m&&Number(m[1])>0&&Number(m[2])>0&&Number(m[1])<=20){let sm=Number(m[3]||0);const r=[];for(let i=0;i<Number(m[1]);i++){const x=1+Math.floor(rnd()*Number(m[2]));r.push(x);sm+=x}v=String(sm);setv(P.name+'_rolls',r.join(', '))}log.push({id:n.id,did:'dice',value:setv(P.name,v)})}break
case'bar':if(P.name){const a=Number(R(P.value)),b=Number(R(P.max)),w=Number(P.width);let v='';if(Number.isFinite(a)&&Number.isFinite(b)&&b>0){const f=Math.max(0,Math.min(w,Math.round(a/b*w)));v='▰'.repeat(f)+'▱'.repeat(w-f)}log.push({id:n.id,did:'bar',value:setv(P.name,v)})}break
case'ordinal':if(P.name){const x=Number(R(P.input));let v='';if(Number.isInteger(x)){const a=Math.abs(x),s=a%100>=11&&a%100<=13?'th':['th','st','nd','rd'][a%10<4?a%10:0];v=x+s}log.push({id:n.id,did:'ordinal',value:setv(P.name,v)})}break
case'numformat':if(P.name){const x=Number(R(P.input));log.push({id:n.id,did:'numformat',value:setv(P.name,Number.isFinite(x)?x.toLocaleString('en-US',{maximumFractionDigits:6}):'')})}break
case'base':if(P.name){const x=Number(R(P.input));let v='';if(Number.isSafeInteger(x))v=P.to==='bin'?x.toString(2):P.to==='hex'?x.toString(16).toUpperCase():P.to==='oct'?x.toString(8):String(x);log.push({id:n.id,did:'base',value:setv(P.name,v)})}break
case'urlenc':if(P.name)log.push({id:n.id,did:'urlenc',value:setv(P.name,encodeURIComponent(R(P.input)))});break
case'hashnum':if(P.name){let hh=2166136261;for(const c of R(P.input).trim().toLowerCase()){hh^=c.codePointAt(0);hh=Math.imul(hh,16777619)>>>0}log.push({id:n.id,did:'hashnum',value:setv(P.name,String(hh%(Number(P.max)+1)))})}break
case'rps':if(P.name){const o=['rock','paper','scissors'],u=R(P.input).trim().toLowerCase(),b=o[Math.floor(rnd()*3)],i=o.indexOf(u);setv(P.name+'_bot',b);log.push({id:n.id,did:'rps',value:setv(P.name,i<0?'invalid':i===o.indexOf(b)?'tie':(i+1)%3===o.indexOf(b)?'lose':'win')})}break
case'dd':case'world':if(P.name&&calls<3){calls++;const r=await io.api((n.type==='dd'?'dd_':'w_')+P.kind,R(P.input));const v=r&&r.text?r.text:R(P.fallback);log.push({id:n.id,did:n.type,value:setv(P.name,v)});if(r&&r.extra)for(const[k,x]of Object.entries(r.extra))setv(P.name+'_'+k,x)}break
case'ddwebhook':case'ddembed':{const body=n.type==='ddwebhook'?{content:R(P.text).slice(0,1900)}:{embeds:[{title:R(P.title).slice(0,250)||undefined,description:R(P.text).slice(0,1900)||undefined,color:parseInt(P.color.replace('#','')||'5865F2',16),image:R(P.image).startsWith('https://')?{url:R(P.image)}:undefined,footer:R(P.footer)?{text:R(P.footer).slice(0,100)}:undefined}]}
if(P.user.trim())body.username=R(P.user).slice(0,80)
if(R(P.avatar).startsWith('https://'))body.avatar_url=R(P.avatar)
let ok=false
if(calls<3&&sends<4&&(body.content||body.embeds&&(body.embeds[0].title||body.embeds[0].description))){calls++;sends++;ok=ctx.dry?false:await io.webhook(P.url,body)}
log.push({id:n.id,did:n.type,value:P.name?setv(P.name,ctx.dry?'dry run':ok===true?'yes':'no'):''});break}
case'ddformat':if(P.name)log.push({id:n.id,did:'ddformat',value:setv(P.name,L.style(R(P.input),P.fmt))});break
case'ddtime':if(P.name){const u=R(P.input).trim()===''?Math.floor((ctx.at||Date.now())/1000):Math.floor(Number(R(P.input)));log.push({id:n.id,did:'ddtime',value:setv(P.name,Number.isFinite(u)?'<t:'+u+':'+P.fmt+'>':'')})}break
case'ddsnowflake':if(P.name){const f=L.flake(R(P.input));log.push({id:n.id,did:'ddsnowflake',value:setv(P.name,f?String(f.unix):'')});setv(P.name+'_date',f?f.date:'');setv(P.name+'_days',f?String(f.days):'');setv(P.name+'_avatar',f?f.avatar:'')}break
case'ddmention':if(P.name){const id=R(P.id).replace(/\D/g,'').slice(0,25);log.push({id:n.id,did:'ddmention',value:setv(P.name,id?(P.kind==='user'?'<@'+id+'>':P.kind==='channel'?'<#'+id+'>':'<@&'+id+'>'):'')})}break
case'ddinvitecode':if(P.name){const m=R(P.input).match(/(?:discord\.gg|discord(?:app)?\.com\/invite)\/([A-Za-z0-9-]{2,32})/i);log.push({id:n.id,did:'ddinvitecode',value:setv(P.name,m?m[1]:'')});setv(P.name+'_url',m?'https://discord.gg/'+m[1]:'')}break
case'ddemoji':if(P.name){const id=R(P.id).replace(/\D/g,'').slice(0,25),lb=R(P.label).replace(/[^A-Za-z0-9_]/g,'').slice(0,32)||'emoji',an=P.animated==='1';log.push({id:n.id,did:'ddemoji',value:setv(P.name,id?'https://cdn.discordapp.com/emojis/'+id+(an?'.gif':'.png'):'')});setv(P.name+'_markup',id?'<'+(an?'a':'')+':'+lb+':'+id+'>':'')}break
case'ddlink':if(P.name){const a=R(P.a).replace(/[^A-Za-z0-9@-]/g,''),b=R(P.b).replace(/\D/g,''),c=R(P.c).replace(/\D/g,'');const v=P.kind==='message'?(a&&b&&c?'https://discord.com/channels/'+a+'/'+b+'/'+c:''):P.kind==='channel'?(a&&b?'https://discord.com/channels/'+a+'/'+b:''):P.kind==='user'?(a?'https://discord.com/users/'+a:''):P.kind==='invite'?(a?'https://discord.gg/'+a:''):(a?'https://discord.com/channels/'+a:'');log.push({id:n.id,did:'ddlink',value:setv(P.name,v)})}break
case'moonphase':if(P.name){const t=R(P.date).trim(),at=t?Date.parse(t+'T12:00:00Z'):ctx.at||Date.now();const m=Number.isFinite(at)?L.moon(at):null;log.push({id:n.id,did:'moonphase',value:setv(P.name,m?m.name:'')});setv(P.name+'_illum',m?String(m.illum):'');setv(P.name+'_age',m?m.age:'')}break
case'distance':if(P.name){const v=[P.lat1,P.lon1,P.lat2,P.lon2].map(x=>Number(R(x)));log.push({id:n.id,did:'distance',value:setv(P.name,v.every(Number.isFinite)&&Math.abs(v[0])<=90&&Math.abs(v[2])<=90&&Math.abs(v[1])<=180&&Math.abs(v[3])<=180?String(L.haversine(...v,P.unit)):'')})}break
case'unitconv':if(P.name)log.push({id:n.id,did:'unitconv',value:setv(P.name,L.convert(R(P.value),P.from,P.to,UN))});break
case'colorconv':if(P.name){const c=L.color(R(P.input));log.push({id:n.id,did:'colorconv',value:setv(P.name,c?c.hex:'')});setv(P.name+'_rgb',c?c.rgb:'');setv(P.name+'_hsl',c?c.hsl:'')}break
case'morse':if(P.name)log.push({id:n.id,did:'morse',value:setv(P.name,L.morse(R(P.input),P.mode))});break
case'roman':if(P.name)log.push({id:n.id,did:'roman',value:setv(P.name,L.roman(R(P.input),P.mode))});break
case'caesar':if(P.name)log.push({id:n.id,did:'caesar',value:setv(P.name,L.caesar(R(P.input),P.shift))});break
case'hashtext':if(P.name)log.push({id:n.id,did:'hashtext',value:setv(P.name,await L.hash(P.algo,R(P.input)))});break
case'uuid':if(P.name)log.push({id:n.id,did:'uuid',value:setv(P.name,crypto.randomUUID())});break
case'nato':if(P.name)log.push({id:n.id,did:'nato',value:setv(P.name,L.nato(R(P.input)))});break
case'binarytext':if(P.name)log.push({id:n.id,did:'binarytext',value:setv(P.name,L.binary(R(P.input),P.mode))});break
case'foreach':{const a=R(P.input).split(/[\n,]/).map(x=>x.trim()).filter(Boolean).slice(0,10);if(depth<5){for(let i=0;i<a.length&&steps<60;i++){setv(P.name||'item',a[i]);setv((P.name||'item')+'_index',String(i+1));const f=next(n.id,'each');if(f)await chain(f,depth+1)}}log.push({id:n.id,did:'foreach',value:String(a.length)});route='done';break}
case'pick':{const o=P.options.split('\n').map(x=>x.trim()).filter(Boolean);if(o.length&&P.name)log.push({id:n.id,did:'pick',value:setv(P.name,R(o[Math.floor(rnd()*o.length)]))});break}
case'set':if(P.name)log.push({id:n.id,did:'set',value:setv(P.name,R(P.value))});break
case'count':if(P.name)log.push({id:n.id,did:'count',value:setv(P.name,String(await io.count(P.name.toLowerCase(),Number(P.by)||0,P.scope)))});break
case'setcount':if(P.name)log.push({id:n.id,did:'setcount',value:setv(P.name,String(await io.setCount(P.name.toLowerCase(),Number(P.value)||0,P.scope)))});break
case'math':if(P.name)log.push({id:n.id,did:'math',value:setv(P.name,calc(R(P.a),P.op,R(P.b)))});break
case'text':if(P.name)log.push({id:n.id,did:'text',value:setv(P.name,xform(P.fn,R(P.input),P.arg))});break
case'randnum':if(P.name){const a=Number(P.min),b=Number(P.max),lo=Math.min(a,b),hi=Math.max(a,b);log.push({id:n.id,did:'randnum',value:setv(P.name,String(lo+Math.floor(rnd()*(hi-lo+1))))})}break
case'map':if(P.name){const k=R(P.input).trim().toLowerCase();let out=null;for(const line of P.table.split('\n')){const i=line.indexOf('=');if(i>0&&line.slice(0,i).trim().toLowerCase()===k){out=line.slice(i+1).trim();break}}log.push({id:n.id,did:'map',value:setv(P.name,out===null?R(P.fallback):R(out))})}break
default:{const Lb=LAB[n.type];if(Lb){const r=Lb.fn(P,R,ctx.at||Date.now(),rnd);if(typeof r==='boolean')branch=r;else{const v=r&&typeof r==='object'?r.v:r;if(P.name)log.push({id:n.id,did:n.type,value:setv(P.name,String(v))});if(r&&r.x&&P.name)for(const[k,x]of Object.entries(r.x))setv(P.name+'_'+k,String(x))}}else if(DEV.test(n.type)&&devs.length<5){const a={};for(const[k,v]of Object.entries(P))a[k]=R(v).slice(0,500);devs.push({k:n.type,a});log.push({id:n.id,did:'device',kind:n.type})}}
}
if(n.xo&&depth<6)for(let xn=1;xn<=n.xo;xn++){const xs=next(n.id,'x'+xn);if(xs)await chain(xs,depth+1)}
if(route!==null){log.push({id:n.id,did:route});cur=next(n.id,route)}
else if(branch!==null){log.push({id:n.id,did:branch?'yes':'no'});cur=next(n.id,branch?'yes':'no')}
else cur=next(n.id,'next')
}
}
for(const trig of graph.nodes.filter(n=>TYPES[n.type].trigger&&triggered(n,ctx))){
log.push({id:trig.id,did:'start'})
if(trig.xi)for(const[xk,xv]of trig.xi)setv(xk,render(xv,vars))
for(let xn=1;xn<=(trig.xo||0);xn++){const xs=next(trig.id,'x'+xn);if(xs)await chain(xs,1)}
if(trig.type==='cmd'&&trig.p.options){const o=parseOpts(trig.p.options),rest=ctx.text.trim().replace(/^\S+\s*/,''),a=parseArgs(o,rest);if(a.v)for(const[k,x]of Object.entries(a.v))setv(k,x)}
await chain(next(trig.id,'next'),0)
}
if(devs.length&&io.device)await io.device(devs)
return log
}
