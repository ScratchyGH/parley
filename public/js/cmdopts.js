const NM=/^[a-z][a-z0-9_]{0,19}$/
export function parseOpts(src){
const out=[]
for(const l of String(src||'').split('\n').slice(0,12)){
const p=l.split('|').map(x=>x.trim())
const name=(p[0]||'').toLowerCase().replace(/\s+/g,'_')
if(!NM.test(name)||out.some(o=>o.name===name))continue
const t=(p[1]||'text').toLowerCase()
const o={name,type:'text',choices:[],desc:(p[2]||'').slice(0,60)}
if(t==='number'||t==='yesno')o.type=t
else if(t.includes(',')){o.type='choice';o.choices=(p[1]||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,12).map(x=>x.slice(0,25))}
out.push(o)
if(out.length>=6)break
}
return out
}
export function tokens(rest){
const out=[]
const re=/"((?:[^"\\]|\\.)*)"|(\S+)/g
let m
while((m=re.exec(rest))&&out.length<20)out.push(m[1]!==undefined?m[1].replace(/\\(.)/g,'$1'):m[2])
return out
}
export function parseArgs(opts,rest){
const t=tokens(rest),v={}
for(let i=0;i<opts.length;i++){
const o=opts[i]
let x=t[i]
if(o.type==='text'&&i===opts.length-1&&t.length>i)x=t.slice(i).join(' ')
if(x===undefined){v[o.name]='';continue}
if(o.type==='number'){if(!Number.isFinite(Number(x)))return{error:o.name+' must be a number'};x=String(Number(x))}
else if(o.type==='yesno'){const l=x.toLowerCase();if(!['yes','no','true','false','on','off'].includes(l))return{error:o.name+' must be yes or no'};x=['yes','true','on'].includes(l)?'yes':'no'}
else if(o.type==='choice'){const f=o.choices.find(c=>c.toLowerCase()===x.toLowerCase());if(!f)return{error:o.name+' must be one of '+o.choices.join(', ')};x=f}
v[o.name]=x.slice(0,500)
}
return{v}
}
export const quote=s=>'"'+String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"'
