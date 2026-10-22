import{h,tzo}from'./util.js'
import{clearUrl}from'./tweaks.js'

const KW={
js:'async await break case catch class const continue debugger default delete do else export extends finally for from function if import in instanceof let new of return static super switch this throw try typeof var void while with yield true false null undefined interface type enum implements public private protected readonly as',
py:'and as assert async await break class continue def del elif else except finally for from global if import in is lambda None nonlocal not or pass raise return try while with yield True False self',
sh:'if then else elif fi for while do done case esac function in return export local echo cd ls cat grep sed awk sudo exit set unset source',
sql:'select from where insert into values update set delete create table drop alter index join left right inner outer on group by order having limit offset as and or not null is in like primary key foreign references unique default distinct union all case when then else end',
go:'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var true false nil',
rust:'as break const continue crate else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while async await dyn',
c:'auto break case char const continue default do double else enum extern float for goto if inline int long register return short signed sizeof static struct switch typedef union unsigned void volatile while class public private protected new delete template namespace using bool true false null nullptr this try catch throw final abstract interface implements extends package import string',
css:'important',
rb:'alias and begin break case class def defined do else elsif end ensure false for if in module next nil not or redo rescue retry return self super then true undef unless until when while yield require include attr_accessor puts',
lua:'and break do else elseif end false for function goto if in local nil not or repeat return then true until while',
yaml:'true false null yes no on off',
ps:'begin break catch class continue data do dynamicparam else elseif end exit filter finally for foreach from function if in param process return switch throw trap try until using var while true false null',
hs:'case class data deriving do else if import in infix infixl infixr instance let module newtype of then type where True False Nothing Just',
ex:'after alias and case catch cond def defmodule defp do else end false fn for if import in nil not or quote raise receive require rescue true try unless use when with',
dart:'abstract as assert async await break case catch class const continue covariant default deferred do dynamic else enum export extends extension external factory false final finally for Function get hide if implements import in interface is late library mixin new null on operator part required rethrow return set show static super switch sync this throw true try typedef var void while with yield',
r:'if else repeat while function for in next break TRUE FALSE NULL NA Inf NaN library return',
scala:'abstract case catch class def do else extends false final finally for forSome if implicit import lazy match new null object override package private protected return sealed super this throw trait true try type val var while with yield given using enum',
diff:''
}
const FAM={js:'js',javascript:'js',ts:'js',typescript:'js',jsx:'js',tsx:'js',json:'js',mjs:'js',py:'py',python:'py',sh:'sh',bash:'sh',zsh:'sh',shell:'sh',sql:'sql',go:'go',golang:'go',rust:'rust',rs:'rust',c:'c',cpp:'c',h:'c',java:'c',cs:'c',csharp:'c',kt:'c',swift:'c',php:'c',css:'css',scss:'css',html:'html',xml:'html',svg:'html',rb:'rb',ruby:'rb',lua:'lua',yaml:'yaml',yml:'yaml',toml:'yaml',ini:'yaml',powershell:'ps',ps1:'ps',pwsh:'ps',haskell:'hs',hs:'hs',elixir:'ex',ex:'ex',exs:'ex',dart:'dart',r:'r',scala:'scala',kotlin:'c',kts:'c',zig:'rust',dockerfile:'sh',makefile:'sh',vue:'html',jsonc:'js',cc:'c',hpp:'c',objc:'c',perl:'sh',pl:'sh'}
const SETS={}
for(const[k,v]of Object.entries(KW))SETS[k]=new Set(v.split(' '))
const CMT={js:'\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/',py:'#[^\\n]*',sh:'#[^\\n]*',sql:'--[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/',go:'\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/',rust:'\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/',c:'\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/',css:'\\/\\*[\\s\\S]*?\\*\\/',html:'<!--[\\s\\S]*?-->',rb:'#[^\\n]*',lua:'--\\[\\[[\\s\\S]*?\\]\\]|--[^\\n]*',yaml:'#[^\\n]*',ps:'#[^\\n]*|<#[\\s\\S]*?#>',hs:'--[^\\n]*|\\{-[\\s\\S]*?-\\}',ex:'#[^\\n]*',dart:'\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/',r:'#[^\\n]*',scala:'\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/'}
const CACHE={}
function re(fam){
if(CACHE[fam])return CACHE[fam]
const str='"(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'|`(?:\\\\.|[^`\\\\])*`'
const src=`(${CMT[fam]})|(${str})|(\\b\\d[\\d_.]*(?:e[+-]?\\d+)?\\b|0x[0-9a-fA-F]+)|([A-Za-z_$][\\w$]*)`
return CACHE[fam]=new RegExp(src,fam==='sql'?'gi':'g')
}
export function highlight(code,lang){
const fam=FAM[String(lang||'').toLowerCase()]
if(!fam||code.length>20000)return document.createTextNode(code)
const frag=document.createDocumentFragment()
const r=re(fam)
const set=SETS[fam==='html'?'js':fam]||SETS.js
let last=0,m
r.lastIndex=0
const push=(t,c)=>{if(!t)return;frag.append(c?h('span',{class:c},t):document.createTextNode(t))}
while((m=r.exec(code))){
if(m.index>last)push(code.slice(last,m.index))
if(m[1])push(m[0],'tk-c')
else if(m[2])push(m[0],'tk-s')
else if(m[3])push(m[0],'tk-n')
else if(m[4]){
const w=fam==='sql'?m[4].toLowerCase():m[4]
if(fam!=='html'&&set.has(w))push(m[0],'tk-k')
else push(m[0])
}
last=r.lastIndex
if(m[0].length===0)r.lastIndex++
}
push(code.slice(last))
return frag
}

const INLINE=[
['escape',/\\([\\`*_~|\[\]()>#+.!-])/],
['code',/`([^`\n]+)`/],
['link',/\[([^\]\n]{1,200})\]\((https?:\/\/[^\s)]{1,2000})\)/],
['bold',/\*\*([\s\S]+?)\*\*/],
['spoiler',/\|\|([\s\S]+?)\|\|/],
['strike',/~~([\s\S]+?)~~/],
['underline',/__([^_\n]+?)__/],
['mark',/==([^=\n]+?)==/],
['ins',/\+\+([^+\n]+?)\+\+/],
['fx',/\[(rainbow|glow|shake|wave|pulse|big|small|flip|caps|mono|blur)\]([\s\S]+?)\[\/\1\]/],
['color',/\[color=(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|red|orange|yellow|green|teal|blue|purple|pink|gray)\]([\s\S]+?)\[\/color\]/],
['kbd',/\[\[([^\]\n]{1,20})\]\]/],
['sup',/\^\(([^)\n]{1,40})\)|\^([A-Za-z0-9]{1,12})/],
['sub',/(?<!~)~([^~\n\s][^~\n]{0,40}?)~(?!~)/],
['time',/<t:(\d{1,12})(?::([tTdDfFR]))?>/],
['italic',/(?<![\w*])\*([^*\n]+?)\*(?!\*)|(?<!\w)_([^_\n]+?)_(?!\w)/],
['url',/https?:\/\/[^\s<>()]{1,2000}[^\s<>().,;:!?'"*_]/],
['mention',/<@(everyone|u_[a-z0-9]{16}|&r_[a-z0-9]{16})>/],
['chan',/<#(ch_[a-z0-9]{16})>/],
['cemoji',/<:([a-zA-Z0-9_]{2,32}):(f_[a-z0-9]{16})>/]
]

function safeHref(u){
try{
const x=new URL(u)
if(x.protocol!=='http:'&&x.protocol!=='https:')return null
if(x.username||x.password)return null
return x.href
}catch{return null}
}

function stamp(sec,f){
const d=new Date(sec*1000)
if(isNaN(d))return document.createTextNode('invalid time')
const L=(o)=>d.toLocaleString(undefined,Object.assign({},o,tzo()))
let t
if(f==='t')t=L({hour:'numeric',minute:'2-digit'})
else if(f==='T')t=L({hour:'numeric',minute:'2-digit',second:'2-digit'})
else if(f==='d')t=L({dateStyle:'short'})
else if(f==='D')t=L({dateStyle:'long'})
else if(f==='F')t=L({dateStyle:'full',timeStyle:'short'})
else if(f==='R'){
const diff=Math.round((d-Date.now())/1000),a=Math.abs(diff)
const u=a<60?[1,'second']:a<3600?[60,'minute']:a<86400?[3600,'hour']:a<2592000?[86400,'day']:a<31536000?[2592000,'month']:[31536000,'year']
t=new Intl.RelativeTimeFormat(undefined,{numeric:'auto'}).format(Math.round(diff/u[0]),u[1])
}else t=L({dateStyle:'long',timeStyle:'short'})
return h('time',{class:'ts',datetime:d.toISOString(),title:d.toLocaleString(undefined,Object.assign({dateStyle:'full',timeStyle:'medium'},tzo()))},t)
}
function inline(text,ctx,depth){
const out=[]
let rest=text
while(rest){
let best=null
for(const[name,r]of INLINE){
if(depth>=3&&name!=='code'&&name!=='url'&&name!=='mention'&&name!=='chan')continue
const m=r.exec(rest)
if(m&&(!best||m.index<best.m.index))best={name,m}
}
if(!best){out.push(rest);break}
const{name,m}=best
if(m.index>0)out.push(rest.slice(0,m.index))
if(name==='escape')out.push(m[1])
else if(name==='code')out.push(h('code',null,m[1]))
else if(name==='link'){
const href=safeHref(m[2])
if(href)out.push(h('a',{href,target:'_blank',rel:'noopener noreferrer nofollow',title:href},inline(m[1],ctx,depth+1)))
else out.push(m[0])
}
else if(name==='url'){
const href0=safeHref(m[0])
const href=href0&&clearUrl(href0)
if(href){ctx?.urls?.push(href);out.push(h('a',{href,target:'_blank',rel:'noopener noreferrer nofollow'},m[0]))}
else out.push(m[0])
}
else if(name==='bold')out.push(h('strong',null,inline(m[1],ctx,depth+1)))
else if(name==='strike')out.push(h('s',null,inline(m[1],ctx,depth+1)))
else if(name==='underline')out.push(h('u',null,inline(m[1],ctx,depth+1)))
else if(name==='mark')out.push(h('mark',null,inline(m[1],ctx,depth+1)))
else if(name==='ins')out.push(h('ins',null,inline(m[1],ctx,depth+1)))
else if(name==='fx')out.push(h('span',{class:'fx fx-'+m[1]},inline(m[2],ctx,depth+1)))
else if(name==='color'){
const el=h('span',{class:m[1][0]==='#'?'fx':'fx fc-'+m[1]},inline(m[2],ctx,depth+1))
if(m[1][0]==='#')el.style.color=m[1]
out.push(el)
}
else if(name==='kbd')out.push(h('kbd',null,m[1]))
else if(name==='sup')out.push(h('sup',null,m[1]??m[2]))
else if(name==='sub')out.push(h('sub',null,m[1]))
else if(name==='time')out.push(stamp(+m[1],m[2]||'f'))
else if(name==='italic')out.push(h('em',null,inline(m[1]??m[2],ctx,depth+1)))
else if(name==='spoiler'){
const s=h('span',{class:'sp',tabindex:'0',role:'button','aria-label':'Spoiler, activate to reveal'},inline(m[1],ctx,depth+1))
const reveal=()=>s.classList.add('rv')
s.addEventListener('click',reveal)
s.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();reveal()}})
out.push(s)
}
else if(name==='mention'){
const t=m[1]
const w=ctx&&ctx.who?ctx.who(t):null
const el=h('span',{class:'mn'+(t==='everyone'?' all':'')+(t[0]==='&'?' role':''),tabindex:'0'},w?w.label:(t==='everyone'?'@everyone':'@unknown'))
if(w&&w.color)el.style.color=w.color
if(t[0]==='u'&&ctx&&ctx.onMention)el.addEventListener('click',()=>ctx.onMention(t))
out.push(el)
}
else if(name==='chan'){
const w=ctx&&ctx.chan?ctx.chan(m[1]):null
const el=h('span',{class:'mn chan',tabindex:'0',role:w&&w.go?'link':null},w?w.label:'#unknown-channel')
if(w&&w.go){el.addEventListener('click',w.go);el.addEventListener('keydown',e=>{if(e.key==='Enter')w.go()})}
out.push(el)
}
else if(name==='cemoji')out.push(h('img',{class:'cemoji',src:'/api/files/'+m[2],alt:':'+m[1]+':',title:':'+m[1]+':',loading:'lazy'}))
rest=rest.slice(m.index+m[0].length)
}
return out
}

export function render(text,ctx){
const frag=document.createDocumentFragment()
const lines=String(text||'').split('\n')
let i=0
let para=[]
const flush=()=>{
if(!para.length)return
frag.append(h('p',null,inline(para.join('\n'),ctx,0)))
para=[]
}
while(i<lines.length){
const ln=lines[i]
const f=ln.match(/^```\s*([\w+-]*)\s*$/)
if(f){
flush()
const buf=[]
i++
while(i<lines.length&&!/^```\s*$/.test(lines[i])){buf.push(lines[i]);i++}
i++
const code=buf.join('\n')
const c=h('code',null,highlight(code,f[1]))
if(f[1])c.dataset.lang=f[1].toLowerCase()
const pre=h('pre',null,c)
frag.append(pre)
continue
}
if(/^>>>\s?/.test(ln)){
flush()
const buf=[ln.replace(/^>>>\s?/,'')]
i++
while(i<lines.length){buf.push(lines[i]);i++}
frag.append(h('blockquote',null,inline(buf.join('\n'),ctx,0)))
continue
}
if(/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(ln)&&!para.length){
flush()
frag.append(h('hr'))
i++
continue
}
if(/^-#\s+/.test(ln)){
flush()
frag.append(h('p',{class:'subtext'},inline(ln.replace(/^-#\s+/,''),ctx,0)))
i++
continue
}
if(/^\|.+\|\s*$/.test(ln)&&i+1<lines.length&&/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i+1])){
flush()
const cells=r=>r.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim())
const head=cells(ln),al=cells(lines[i+1]).map(x=>/^:-+:$/.test(x)?'center':/-:$/.test(x)?'right':'left')
i+=2
const rows=[]
while(i<lines.length&&/^\|.+\|\s*$/.test(lines[i])&&rows.length<30){rows.push(cells(lines[i]));i++}
frag.append(h('div',{class:'mtw'},h('table',{class:'mt'},h('thead',null,h('tr',null,head.map((c,k)=>h('th',{style:{textAlign:al[k]||'left'}},inline(c,ctx,1))))),h('tbody',null,rows.map(r=>h('tr',null,head.map((_,k)=>h('td',{style:{textAlign:al[k]||'left'}},inline(r[k]||'',ctx,1)))))))))
continue
}
if(/^>\s?/.test(ln)){
flush()
const buf=[]
while(i<lines.length&&/^>\s?/.test(lines[i])){buf.push(lines[i].replace(/^>\s?/,''));i++}
const co=buf[0].match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|DANGER|SUCCESS)\]\s*(.*)$/i)
if(co){
const k=co[1].toLowerCase()
const rest=[co[2],...buf.slice(1)].filter((x,j)=>j>0||x).join('\n')
frag.append(h('div',{class:'callout co-'+k},h('b',{class:'co-t'},k[0].toUpperCase()+k.slice(1)),rest?h('div',null,inline(rest,ctx,0)):null))
}else frag.append(h('blockquote',null,inline(buf.join('\n'),ctx,0)))
continue
}
if(/^\+\+\+\s+\S/.test(ln)){
const end=lines.findIndex((x,j)=>j>i&&/^\+\+\+\s*$/.test(x))
if(end>i){
flush()
const dt=h('details',{class:'mdet'},h('summary',null,inline(ln.replace(/^\+\+\+\s+/,''),ctx,1)),h('div',null,inline(lines.slice(i+1,end).join('\n'),ctx,0)))
frag.append(dt)
i=end+1
continue
}
}
const ce=ln.match(/^->\s+(.+?)\s+<-$/)
if(ce){
flush()
frag.append(h('p',{class:'mcenter'},inline(ce[1],ctx,0)))
i++
continue
}
const li=ln.match(/^\s{0,3}([-*]|\d{1,3}\.)\s+(.*)$/)
if(li){
flush()
const ordered=/\d/.test(li[1])
const items=[]
while(i<lines.length){
const m=lines[i].match(/^\s{0,3}([-*]|\d{1,3}\.)\s+(.*)$/)
if(!m||/\d/.test(m[1])!==ordered)break
const tk=m[2].match(/^\[([ xX])\]\s+(.*)$/)
items.push(tk?h('li',{class:'task'},h('input',{type:'checkbox',disabled:true,checked:tk[1]!==' ','aria-label':tk[1]!==' '?'Done':'Not done'}),inline(tk[2],ctx,0)):h('li',null,inline(m[2],ctx,0)))
i++
}
const first=ordered?parseInt(li[1]):1
frag.append(h(ordered?'ol':'ul',ordered&&first>1?{start:first}:null,items))
continue
}
const hd=ln.match(/^(#{1,3})\s+(.+)$/)
if(hd){
flush()
frag.append(h('h'+(hd[1].length+1),{class:'mh'},inline(hd[2],ctx,0)))
i++
continue
}
para.push(ln)
i++
}
flush()
return frag
}

export function plain(text,max=140){
return String(text||'').replace(/<:([a-zA-Z0-9_]{2,32}):f_[a-z0-9]{16}>/g,':$1:').replace(/<#ch_[a-z0-9]+>/g,'#channel').replace(/<@&?[a-z0-9_]+>/g,'@mention').replace(/```[\s\S]*?```/g,' [code] ').replace(/\|\|([\s\S]+?)\|\|/g,'[spoiler]').replace(/[*_~`>]/g,'').replace(/\s+/g,' ').trim().slice(0,max)
}
