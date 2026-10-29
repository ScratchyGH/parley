import{h,GET}from'./util.js'
import{COMMANDS}from'./slash.js'
import{parseOpts,quote}from'./cmdopts.js'
const cache=new Map()
const builtin=COMMANDS.map(([u,d])=>({cmd:true,username:u.slice(1).split(' ')[0],display_name:d+'  '+u,opts:[],builtin:true}))
export async function slashItems(sid){
if(!sid)return builtin
const c=cache.get(sid)
if(c&&Date.now()-c.t<60000)return c.v
let bots=[]
try{bots=(await GET('/api/servers/'+sid+'/commands')).commands.map(x=>({cmd:true,username:x.name,display_name:x.desc||'Command from '+x.bot.name,opts:parseOpts(x.options),bot:{id:x.bot.id,avatar_id:x.bot.avatar_id,display_name:x.bot.name,username:x.bot.name}}))}catch{}
const v=[...bots,...builtin]
cache.set(sid,{t:Date.now(),v})
return v
}
export function optionForm(item,onSend,onCancel){
const val={},els=[]
const rows=item.opts.map(o=>{
let ctl
if(o.type==='choice'||o.type==='yesno'){
const ch=o.type==='yesno'?['yes','no']:o.choices
const btns=ch.map(c=>h('button',{type:'button',class:'slc',on:{click:()=>{val[o.name]=c;btns.forEach(b=>b.classList.toggle('on',b===btns[ch.indexOf(c)]))}}},c))
ctl=h('div',{class:'slcs'},...btns)
}else{
ctl=h('input',{class:'inp',type:o.type==='number'?'number':'text',maxLength:500,placeholder:o.type==='number'?'a number':'text','aria-label':o.name,on:{input:e=>{val[o.name]=e.target.value}}})
els.push(ctl)
}
return h('label',{class:'slr'},h('span',{class:'slh'},o.name),h('span',{class:'hint'},o.desc),ctl)
})
const go=()=>{
const parts=item.opts.map(o=>{const v=(val[o.name]||'').trim();return o.type==='text'?quote(v):v})
if(item.opts.some(o=>!(val[o.name]||'').trim())){els[0]?.focus();return}
onSend('/'+item.username+' '+parts.join(' '))
}
const f=h('form',{class:'slf',on:{submit:e=>{e.preventDefault();go()},keydown:e=>{if(e.key==='Escape'){e.preventDefault();onCancel()}}}},h('div',{class:'slt'},h('b',null,'/'+item.username),h('span',{class:'hint'},item.display_name)),...rows,h('div',{class:'row'},h('button',{class:'btn pri sm',type:'submit'},'Send'),h('button',{class:'btn sm',type:'button',on:{click:onCancel}},'Cancel')))
setTimeout(()=>els[0]?.focus(),0)
return f
}
