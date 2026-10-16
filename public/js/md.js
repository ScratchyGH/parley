import{h}from'./util.js'

const KW={
js:'async await break case catch class const continue debugger default delete do else export extends finally for from function if import in instanceof let new of return static super switch this throw try typeof var void while with yield true false null undefined interface type enum implements public private protected readonly as',
py:'and as assert async await break class continue def del elif else except finally for from global if import in is lambda None nonlocal not or pass raise return try while with yield True False self',
sh:'if then else elif fi for while do done case esac function in return export local echo cd ls cat grep sed awk sudo exit set unset source',
sql:'select from where insert into values update set delete create table drop alter index join left right inner outer on group by order having limit offset as and or not null is in like primary key foreign references unique default distinct union all case when then else end',
go:'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var true false nil',
rust:'as break const continue crate else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while async await dyn',
c:'auto break case char const continue default do double else enum extern float for goto if inline int long register return short signed sizeof static struct switch typedef union unsigned void volatile while class public private protected new delete template namespace using bool true false null nullptr this try catch throw final abstract interface implements extends package import string',
css:'important'
}
const FAM={js:'js',javascript:'js',ts:'js',typescript:'js',jsx:'js',tsx:'js',json:'js',mjs:'js',py:'py',python:'py',sh:'sh',bash:'sh',zsh:'sh',shell:'sh',sql:'sql',go:'go',golang:'go',rust:'rust',rs:'rust',c:'c',cpp:'c',h:'c',java:'c',cs:'c',csharp:'c',kt:'c',swift:'c',php:'c',css:'css',scss:'css',html:'html',xml:'html',svg:'html'}
const SETS={}
for(const[k,v]of Object.entries(KW))SETS[k]=new Set(v.split(' '))
const CMT={js:'\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/',py:'#[^\\n]*',sh:'#[^\\n]*',sql:'--[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/',go:'\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/',rust:'\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/',c:'\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/',css:'\\/\\*[\\s\\S]*?\\*\\/',html:'<!--[\\s\\S]*?-->'}
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
['code',/`([^`\n]+)`/],
['link',/\[([^\]\n]{1,200})\]\((https?:\/\/[^\s)]{1,2000})\)/],
['bold',/\*\*([\s\S]+?)\*\*/],
['spoiler',/\|\|([\s\S]+?)\|\|/],
['strike',/~~([\s\S]+?)~~/],
['italic',/(?<![\w*])\*([^*\n]+?)\*(?!\*)|(?<!\w)_([^_\n]+?)_(?!\w)/],
['url',/https?:\/\/[^\s<>()]{1,2000}[^\s<>().,;:!?'"*_]/],
['mention',/<@(everyone|u_[a-z0-9]{16}|&r_[a-z0-9]{16})>/],
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

function inline(text,ctx,depth){
const out=[]
let rest=text
while(rest){
let best=null
for(const[name,r]of INLINE){
if(depth>=3&&name!=='code'&&name!=='url'&&name!=='mention')continue
const m=r.exec(rest)
if(m&&(!best||m.index<best.m.index))best={name,m}
}
if(!best){out.push(rest);break}
const{name,m}=best
if(m.index>0)out.push(rest.slice(0,m.index))
if(name==='code')out.push(h('code',null,m[1]))
else if(name==='link'){
const href=safeHref(m[2])
if(href)out.push(h('a',{href,target:'_blank',rel:'noopener noreferrer nofollow',title:href},inline(m[1],ctx,depth+1)))
else out.push(m[0])
}
else if(name==='url'){
const href=safeHref(m[0])
if(href){ctx?.urls?.push(href);out.push(h('a',{href,target:'_blank',rel:'noopener noreferrer nofollow'},m[0]))}
else out.push(m[0])
}
else if(name==='bold')out.push(h('strong',null,inline(m[1],ctx,depth+1)))
else if(name==='strike')out.push(h('s',null,inline(m[1],ctx,depth+1)))
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
if(/^>\s?/.test(ln)){
flush()
const buf=[]
while(i<lines.length&&/^>\s?/.test(lines[i])){buf.push(lines[i].replace(/^>\s?/,''));i++}
frag.append(h('blockquote',null,inline(buf.join('\n'),ctx,0)))
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
items.push(h('li',null,inline(m[2],ctx,0)))
i++
}
frag.append(h(ordered?'ol':'ul',null,items))
continue
}
const hd=ln.match(/^(#{1,3})\s+(.+)$/)
if(hd){
flush()
frag.append(h('p',null,h('strong',null,inline(hd[2],ctx,0))))
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
return String(text||'').replace(/<:([a-zA-Z0-9_]{2,32}):f_[a-z0-9]{16}>/g,':$1:').replace(/<@&?[a-z0-9_]+>/g,'@mention').replace(/```[\s\S]*?```/g,' [code] ').replace(/\|\|([\s\S]+?)\|\|/g,'[spoiler]').replace(/[*_~`>]/g,'').replace(/\s+/g,' ').trim().slice(0,max)
}
