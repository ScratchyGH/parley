import{h,mount,icon,POST,PATCH,fail,toast,dialog,field,toggle,fileUrl,coverBg}from'./util.js'
import{render}from'./md.js'
import{S,loadServer}from'./state.js'
import{go}from'./nav.js'
const seen=new Set()
const SAFE=1|2|32|1024|4096|8192
export function maybeOnboard(sid){
const d=S.sdata[sid]
const o=d?.server.onboarding
if(!o||!o.on||d.server.onboarded||seen.has(sid))return
seen.add(sid)
onboardDialog(sid)
}
export function onboardDialog(sid,preview){
const d=S.sdata[sid]
const s=d.server
const o={...(s.onboarding||{}),...(preview||{})}
const steps=['welcome']
if(s.rules)steps.push('rules')
;(o.pages||[]).forEach((_,k)=>steps.push('page'+k))
if((o.roles||[]).length)steps.push('roles')
if((o.channels||[]).length)steps.push('channels')
const chosen=new Set(d.me.role_ids.filter(id=>(o.roles||[]).some(r=>r.id===id)))
let i=0,agreed=!s.rules,dlg
const body=h('div',{class:'bd onb'})
const bar=h('i',{class:'onb-bar-i'})
const back=h('button',{class:'btn',on:{click:()=>{i--;draw(-1)}}},'Back')
const next=h('button',{class:'btn pri onb-next',on:{click:()=>step()}},'Next')
const skip=o.skip?h('button',{class:'btn onb-skip',on:{click:()=>finish()}},'Skip'):null
const dots=h('div',{class:'onb-dots','aria-hidden':'true'})
async function finish(){
next.disabled=true
try{
if(!preview){
await POST(`/api/servers/${sid}/onboarding`,{roles:[...chosen]})
await loadServer(sid)
}
dlg.close()
toast(preview?'That is how new members see it':'Welcome to '+s.name,'ok')
}catch(e){next.disabled=false;fail(e)}
}
async function step(){
if(i<steps.length-1){i++;draw(1);return}
finish()
}
const mk=(t,...k)=>[h('h2',{class:'onb-h'},t),...k]
function draw(dir){
const k=steps[i]
const last=i===steps.length-1
next.textContent=last?(o.finish||'Finish'):'Next'
next.disabled=k==='rules'&&!agreed
back.style.visibility=i?'visible':'hidden'
bar.style.width=((i+1)/steps.length*100)+'%'
mount(dots,steps.map((_,j)=>h('i',{class:j===i?'on':''})))
let kids
if(k==='welcome')kids=mk(o.title||'Welcome to '+s.name,o.text?h('p',{class:'onb-t'},o.text):null,s.welcome?h('div',{class:'mb'},render(s.welcome,{})):null,!o.text&&!s.welcome&&s.description?h('p',{class:'onb-t'},s.description):null)
else if(k==='rules'){
const cb=h('input',{type:'checkbox',id:'onb-ag',checked:agreed,on:{change:e=>{agreed=e.target.checked;next.disabled=!agreed}}})
kids=mk('Server rules',h('div',{class:'mb onb-rules'},render(s.rules,{})),h('label',{class:'onb-agree',for:'onb-ag'},cb,'I have read and agree to the rules'))
}
else if(k.startsWith('page')){const pg=o.pages[+k.slice(4)];kids=mk(pg.title||'',pg.text?h('div',{class:'mb'},render(pg.text,{})):null)}
else if(k==='roles')kids=mk('Pick your roles',h('p',{class:'onb-t'},'Choose any that fit. You can change these later by following the server onboarding again from Server info.'),h('div',{class:'onb-roles'},o.roles.map(r=>{
const role=d.roles.find(x=>x.id===r.id)
if(!role)return null
const on=chosen.has(r.id)
return h('button',{type:'button',class:'onb-role'+(on?' on':''),'aria-pressed':String(on),style:role.color?{'--rc':role.color}:{},on:{click:e=>{if(chosen.has(r.id))chosen.delete(r.id);else chosen.add(r.id);e.currentTarget.classList.toggle('on',chosen.has(r.id));e.currentTarget.setAttribute('aria-pressed',String(chosen.has(r.id)))}}},h('span',{class:'onb-tick','aria-hidden':'true'},icon('check','s')),h('b',null,r.label||role.name),r.desc?h('span',{class:'hint',style:{margin:0}},r.desc):null)
})))
else kids=mk('Good places to start',h('div',{class:'onb-chs'},o.channels.map(id=>{
const c=d.channels.find(x=>x.id===id)
if(!c)return null
return h('button',{class:'onb-ch',on:{click:async()=>{if(!preview){try{await POST(`/api/servers/${sid}/onboarding`,{roles:[...chosen]});await loadServer(sid)}catch(e){return fail(e)}}dlg.close();go(`/s/${sid}/${id}`)}}},h('span',{class:'onb-hash'},icon('hash','s')),h('span',{class:'onb-cn'},h('b',null,c.name),h('span',{class:'hint',style:{margin:0}},c.topic||'')))
})))
mount(body,...kids)
body.className='bd onb '+(dir>0?'fwd':dir<0?'bwd':'')
}
const col=o.accent||s.accent||''
const ico=s.icon_id?h('img',{class:'onb-ic',src:fileUrl(s.icon_id),alt:''}):h('span',{class:'onb-ic onb-ic0'},(s.name||'?').slice(0,1).toUpperCase())
const hero=h('div',{class:'onb-hero'+(o.hero===0?' flat':'')},o.hero!==0&&s.banner_id?coverBg(h('div',{class:'onb-ban'}),s.banner_id,'linear-gradient(transparent 35%,rgba(0,0,0,.55))'):h('div',{class:'onb-ban'}),ico,h('div',{class:'onb-sn'},h('b',null,s.name),h('span',null,(s.member_count?s.member_count+' members':'New member welcome'))))
draw(0)
dlg=dialog(s.name,h('div',{class:'onb-wrap',style:col?{'--ob':col}:{}},hero,h('div',{class:'onb-bar'},bar),body,h('div',{class:'onb-foot'},skip||h('span'),dots,h('div',{class:'row',style:{gap:'8px'}},back,next))),{sticky:true,bare:true,cls:'onb-dlg',onclose:()=>{}})
}
export function onboardEditor(pg,sid){
const d=S.sdata[sid]
const o=d.server.onboarding||{on:0,title:'',text:'',roles:[],channels:[]}
let on=!!o.on,hero=o.hero!==0,skipOn=!!o.skip
const accent=h('input',{type:'color',value:o.accent||d.server.accent||'#5b8def','aria-label':'Accent colour'});let accOn=!!o.accent
accent.addEventListener('input',()=>{accOn=true})
const finishL=h('input',{class:'inp',maxLength:24,value:o.finish||'',placeholder:'Finish'})
const pageRows=[0,1,2].map(k=>{const p=(o.pages||[])[k]||{};const t=h('input',{class:'inp',maxLength:60,value:p.title||'',placeholder:'Page title','aria-label':'Page '+(k+1)+' title'});const x=h('textarea',{class:'inp',rows:3,maxLength:800,placeholder:'Page text, supports markdown','aria-label':'Page '+(k+1)+' text'},p.text||'');return{t,x,el:h('div',{style:{marginBottom:'10px'}},t,h('div',{style:{height:'6px'}}),x)}})
const title=h('input',{class:'inp',maxLength:60,value:o.title||'',placeholder:'Welcome to '+d.server.name})
const text=h('textarea',{class:'inp',rows:3,maxLength:600},o.text||'')
const picked=new Map(o.roles.map(r=>[r.id,r]))
const chans=new Set(o.channels)
const safeRoles=d.roles.filter(r=>!r.is_everyone&&!(r.perms&~SAFE))
const roleRows=safeRoles.map(r=>{
const cur=picked.get(r.id)
const cb=h('input',{type:'checkbox',checked:!!cur,'aria-label':'Offer '+r.name})
const lab=h('input',{class:'inp',maxLength:32,value:cur?.label||'',placeholder:r.name,'aria-label':'Label for '+r.name,style:{flex:'1'}})
const desc=h('input',{class:'inp',maxLength:80,value:cur?.desc||'',placeholder:'Short description','aria-label':'Description for '+r.name,style:{flex:'2'}})
return{r,cb,lab,desc,el:h('div',{class:'row',style:{gap:'8px',marginBottom:'6px'}},cb,h('b',{style:{minWidth:'90px',color:r.color||'inherit'}},r.name),lab,desc)}
})
const chanRows=[...d.channels].filter(c=>c.type==='text'||c.type==='announce'||c.type==='forum'||c.type==='rules').sort((a,b)=>a.position-b.position).map(c=>{
const cb=h('input',{type:'checkbox',checked:chans.has(c.id),id:'ob-'+c.id})
return{c,cb,el:h('label',{class:'row',for:'ob-'+c.id,style:{gap:'8px',marginBottom:'4px'}},cb,'#'+c.name)}
})
const collect=()=>({accent:accOn?accent.value:'',hero:hero?1:0,skip:skipOn?1:0,finish:finishL.value.trim(),pages:pageRows.map(x=>({title:x.t.value.trim(),text:x.x.value.trim()})).filter(x=>x.title||x.text),on:on?1:0,title:title.value.trim(),text:text.value.trim(),roles:roleRows.filter(x=>x.cb.checked).slice(0,10).map(x=>({id:x.r.id,label:x.lab.value.trim(),desc:x.desc.value.trim()})),channels:chanRows.filter(x=>x.cb.checked).slice(0,8).map(x=>x.c.id)})
mount(pg,h('h3',null,'Onboarding'),h('p',{class:'hint'},'New members walk through a short welcome when they first open the server: a greeting, your rules, roles they can pick for themselves, and channels to start in. People who joined before you turned this on are not asked.'),
h('div',{class:'perm',style:{marginTop:'12px'}},toggle(on,v=>{on=v},'Onboarding on'),h('span',null,'Show onboarding to new members')),
field('Title',title),field('Welcome text',text,'Shown first, above the server welcome message. Rules come from Overview.'),
h('h4',{style:{margin:'18px 0 6px'}},'Look'),
h('div',{class:'row',style:{gap:'10px',flexWrap:'wrap'}},h('label',{class:'row',style:{gap:'8px'}},accent,'Accent colour'),h('button',{type:'button',class:'btn sm',on:{click:()=>{accOn=false;accent.value=d.server.accent||'#5b8def'}}},'Use server accent')),
h('div',{class:'perm',style:{marginTop:'8px'}},toggle(hero,v=>{hero=v},'Show server banner'),h('span',null,'Show the server banner at the top')),
h('div',{class:'perm'},toggle(skipOn,v=>{skipOn=v},'Allow skipping'),h('span',null,'Let members skip the walkthrough')),
field('Finish button',finishL,'Text on the last step. Defaults to Finish.'),
h('h4',{style:{margin:'18px 0 6px'}},'Extra pages'),h('p',{class:'hint'},'Up to three custom pages shown after the rules. Leave empty to skip a page.'),h('div',null,pageRows.map(x=>x.el)),
h('h4',{style:{margin:'18px 0 6px'}},'Self-assignable roles'),
safeRoles.length?h('div',null,...roleRows.map(x=>x.el),h('p',{class:'hint'},'Only roles without moderation or management permissions can be offered.')):h('p',{class:'hint'},'Create a role without moderation permissions first, then offer it here.'),
h('h4',{style:{margin:'18px 0 6px'}},'Start here channels'),
h('div',null,chanRows.map(x=>x.el)),
h('div',{class:'row',style:{marginTop:'16px',gap:'8px'}},
h('button',{class:'btn pri',on:{click:async()=>{try{await PATCH('/api/servers/'+sid,{onboarding:collect()});await loadServer(sid);toast('Saved','ok');onboardEditor(pg,sid)}catch(e){fail(e)}}}},'Save changes'),
h('button',{class:'btn',on:{click:()=>onboardDialog(sid,collect())}},'Preview')))
}
