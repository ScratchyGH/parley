import{h,mount,icon,GET,POST,PATCH,DEL,toast,fail,field,dialog,confirmBox,copyText,fmtRel,fmtDate,debounce,avatar}from'./util.js'
import{S,P,can,loadServer}from'./state.js'
import{go}from'./nav.js'
import{topBar}from'./shell.js'
import{render}from'./md.js'
import{LICENSES,TAGS,licenseName,licenseUrl}from'./licenses.js'
import{pickCropped}from'./cropper.js'
import{uploadImage}from'./dialogs.js'
import{blocksEditor}from'./blocks.js'

const hue=s=>{let x=0;for(const c of String(s))x=(x*31+c.charCodeAt(0))%360;return x}
const tone=s=>`hsl(${hue(s)} 40% 44%)`
const tagLabel=t=>t.replace('-',' ')
const plural=(n,w)=>n+' '+w+(n===1?'':'s')
const chips=(tags)=>h('div',{class:'bh-tags'},(tags||[]).map(t=>h('span',{class:'bh-tag'},tagLabel(t))))
const pill=v=>h('span',{class:'bh-pill '+v},v==='public'?'Listed':v==='unlisted'?'Link only':'Private')

function botIcon(p,size){
const box=h('div',{class:'bh-ic '+(size||''),style:{'--tone':tone(p.id)}})
if(p.avatar_id)box.append(h('img',{src:'/api/files/'+p.avatar_id,alt:'',loading:'lazy',decoding:'async'}))
else box.append(h('span',null,p.name.trim().slice(0,2).toUpperCase()))
return box
}

function row(p){
return h('a',{class:'bh-row',href:'/bots/'+p.slug,style:{'--tone':tone(p.id)}},
botIcon(p),
h('div',{class:'bh-main'},
h('div',{class:'bh-t'},h('b',null,p.name),p.owner?h('span',null,'by '+p.owner.name):null),
h('p',null,p.summary||'No summary yet.'),
chips(p.tags)),
h('div',{class:'bh-side'},
h('div',{class:'bh-stat'},h('b',null,String(p.installs)),h('span',null,p.installs===1?'server':'servers')),
h('span',{class:'bh-upd'},'Updated '+fmtRel(p.updated_at)),
p.license&&p.license!=='ARR'?h('span',{class:'bh-lic'},p.license):null))
}

export function installDialog(p){
const body=h('div',{class:'bd'},h('div',{class:'hint'},'Loading your servers…'))
const d=dialog('Add '+p.name+' to a server',body,{})
;(async()=>{
await Promise.all(S.servers.filter(s=>!S.sdata[s.id]).map(s=>loadServer(s.id).catch(()=>{})))
const ok=S.servers.filter(s=>s.owner_id===S.me.id||can(s.id,P.MANAGE_SERVER))
if(!ok.length){mount(body,h('div',{class:'empty'},'You need the Manage server permission in a server to add bots. Create a server first, or ask an admin.'));return}
mount(body,h('p',{class:'hint',style:{marginTop:0}},'The bot joins as a member. Give it a role to control what it can see and do.'),h('div',{class:'list'},ok.map(s=>{
const b=h('button',{class:'btn sm pri',on:{click:async()=>{
b.disabled=true
try{await POST(`/api/bothub/${p.id}/install`,{server_id:s.id});toast(p.name+' added to '+s.name,'ok');p.installs++;d.close();go('/s/'+s.id)}catch(e){fail(e);b.disabled=false}
}}},'Add')
return h('div',{class:'li'},avatar({id:s.id,name:s.name,icon_id:s.icon_id,display_name:s.name},'sm'),h('div',{class:'grow'},h('b',null,s.name)),b)
})))
})().catch(e=>mount(body,h('div',{class:'err'},e.message)))
}

function browse(){
const st={q:'',tag:'',license:'',sort:'installs',offset:0}
const list=h('div',{class:'bh-list','aria-live':'polite'})
const more=h('button',{class:'btn',hidden:true},'Show more')
const count=h('div',{class:'hint',style:{margin:'0 0 8px'}})
const q=h('input',{class:'inp',type:'search',placeholder:'Search bots',maxLength:60,'aria-label':'Search bots'})
const sort=h('select',{class:'sel','aria-label':'Sort by',style:{width:'auto'}},[['installs','Most added'],['new','Newest'],['updated','Recently updated']].map(([v,l])=>h('option',{value:v},l)))
const lic=h('select',{class:'sel','aria-label':'License'},h('option',{value:''},'Any license'),LICENSES.map(l=>h('option',{value:l[0]},l[1])))
const tagBox=h('div',{class:'bh-filter'})
function drawTags(){
mount(tagBox,TAGS.map(t=>h('button',{class:st.tag===t?'on':'','aria-pressed':String(st.tag===t),on:{click:()=>{st.tag=st.tag===t?'':t;drawTags();run()}}},tagLabel(t))))
}
let gen=0
async function run(append){
const my=++gen
if(!append){st.offset=0;mount(list,[1,2,3].map(()=>h('div',{class:'bh-row sk'})))}
try{
const d=await GET(`/api/bothub?limit=20&offset=${st.offset}&q=${encodeURIComponent(st.q)}&tag=${st.tag}&license=${st.license}&sort=${st.sort}`)
if(my!==gen)return
if(!append)mount(list)
for(const p of d.projects)list.append(row(p))
st.offset+=d.projects.length
more.hidden=!d.more
if(!list.children.length)mount(list,h('div',{class:'empty'},h('div',null,h('b',{style:{color:'var(--strong)'}},'No bots match'),h('p',null,st.q||st.tag||st.license?'Try clearing a filter.':'Nobody has listed a bot yet. Yours could be the first.'))))
}catch(e){if(my===gen)mount(list,h('div',{class:'err'},e.message))}
}
q.addEventListener('input',debounce(()=>{st.q=q.value.trim();run()},250))
sort.addEventListener('change',()=>{st.sort=sort.value;run()})
lic.addEventListener('change',()=>{st.license=lic.value;run()})
more.addEventListener('click',()=>run(true))
drawTags()
run()
const side=h('aside',{class:'bh-fside'},h('h4',null,'Category'),tagBox,h('h4',null,'License'),lic)
const mainCol=h('div',{class:'bh-col'},h('div',{class:'bh-bar'},q,sort),count,list,h('div',{class:'row',style:{justifyContent:'center',margin:'12px 0'}},more))
count.remove()
return h('div',{class:'bh-wrap'},side,mainCol)
}

function botTabs(p,active){
return h('div',{class:'bh-tabs bh-etabs',role:'tablist'},
h('button',{type:'button',role:'tab','aria-selected':String(active==='d'),class:active==='d'?'on':'',on:{click:()=>go(p?'/lab/'+p.slug+'/edit':'/lab/new')}},'Details'),
h('button',{type:'button',role:'tab','aria-selected':String(active==='c'),class:active==='c'?'on':'',disabled:!p,title:p?'':'Create the bot first',on:{click:()=>go('/lab/'+p.slug+'/blocks')}},'Code blocks'),
p?null:h('span',{class:'hint',style:{alignSelf:'center'}},'Create the bot to unlock the code blocks'))
}
async function blocksPage(slug){
let p
try{p=(await GET('/api/bothub/'+encodeURIComponent(slug))).project}catch(e){return h('div',{class:'empty'},e.message)}
if(!p.mine)return h('div',{class:'empty'},'Only the author can edit this bot.')
return h('div',null,botTabs(p,'c'),await blocksEditor(p))
}
async function mineView(){
const box=h('div',{class:'bh-wrap one'})
try{
const d=await GET('/api/bothub/mine')
if(!d.projects.length){mount(box,h('div',{class:'empty'},h('div',null,h('h2',{style:{color:'var(--strong)'}},'Build your first bot'),h('p',null,'Create a bot account, write its page, pick a license, then keep it private or list it for everyone.'),h('button',{class:'btn pri',on:{click:()=>go('/lab/new')}},icon('plus','s'),'New bot'))));return box}
mount(box,h('div',{class:'bh-col'},d.projects.map(p=>h('div',{class:'bh-row mine',style:{'--tone':tone(p.id)}},botIcon(p),
h('div',{class:'bh-main'},h('div',{class:'bh-t'},h('b',null,p.name),pill(p.visibility)),h('p',null,p.summary||'No summary yet.'),chips(p.tags)),
h('div',{class:'bh-side'},h('div',{class:'bh-stat'},h('b',null,String(p.installs)),h('span',null,p.installs===1?'server':'servers')),
h('div',{class:'row'},h('button',{class:'btn sm',on:{click:()=>go('/bots/'+p.slug)}},'View'),h('button',{class:'btn sm',on:{click:()=>go('/lab/'+p.slug+'/blocks')}},'Blocks'),h('button',{class:'btn sm pri',on:{click:()=>go('/lab/'+p.slug+'/edit')}},'Edit')))))))
}catch(e){mount(box,h('div',{class:'err'},e.message))}
return box
}

function snippet(slug){
return `curl -X POST ${location.origin}/api/rooms/CHANNEL_ID/messages \\
  -H "Authorization: Bot YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"content":"Hello from ${slug}"}'`
}

async function projectView(slug,tab){
const box=h('div',{class:'bh-proj'})
let p
try{p=(await GET('/api/bothub/'+encodeURIComponent(slug))).project}catch(e){mount(box,h('div',{class:'empty'},e.status===404?'That bot does not exist, or it is private.':e.message));return{node:box,title:'Bots'}}
const tabs=[['','About'],['releases','Releases ('+p.releases.length+')'],['build','Build with it']]
const content=h('div',{class:'bh-body'})
if(tab==='releases')mount(content,p.releases.length?p.releases.map(r=>h('article',{class:'bh-rel'},h('div',{class:'row'},h('b',null,'v'+r.version),h('span',{class:'hint',style:{margin:0}},fmtDate(r.created_at))),r.changelog?h('div',{class:'mb'},render(r.changelog)):h('div',{class:'hint'},'No notes.'))):h('div',{class:'empty'},'No releases published yet.'))
else if(tab==='build')mount(content,h('div',{class:'mb'},h('p',null,'Bots on Parley use the REST API with a bot token. They can read and send messages in channels they can see, upload files and use stickers. They do not hold a realtime connection, so poll the messages endpoint or use webhooks.'),h('pre',null,h('code',null,snippet(p.slug))),h('p',{class:'hint'},p.mine?'Your token is shown once on creation. Open the editor to generate a new one.':'The owner of this bot holds its token. Adding it to your server only gives the account membership.')))
else mount(content,p.readme.trim()?h('div',{class:'mb bh-md'},render(p.readme)):h('div',{class:'hint'},'The author has not written a description yet.'))
const lu=licenseUrl(p.license,p.license_url)
const link=(l,u)=>u?h('a',{href:u,target:'_blank',rel:'noopener noreferrer nofollow'},l):null
const spec=(k,v)=>v?h('div',{class:'bh-kv'},h('span',null,k),h('b',null,v)):null
const head=h('header',{class:'bh-head',style:{'--tone':tone(p.id)}},
botIcon(p,'xl'),
h('div',{class:'bh-hm'},h('h1',null,p.name),h('p',null,p.summary),h('div',{class:'row',style:{flexWrap:'wrap',gap:'12px'}},h('span',{class:'bh-chip'},icon('plus','s'),plural(p.installs,'server')),h('span',{class:'bh-chip'},icon('clock','s'),'Updated '+fmtRel(p.updated_at)),p.mine?pill(p.visibility):null)),
h('div',{class:'bh-act'},
p.visibility!=='private'||p.mine?h('button',{class:'btn pri',on:{click:()=>installDialog(p)}},icon('plus','s'),'Add to server'):null,
p.mine?h('button',{class:'btn',on:{click:()=>go('/lab/'+p.slug+'/edit')}},icon('edit','s'),'Edit'):null,
h('button',{class:'btn',title:'Copy link','aria-label':'Copy link',on:{click:()=>copyText(location.origin+'/bots/'+p.slug)}},icon('link','s'))))
const nav=h('div',{class:'bh-tabs',role:'tablist'},tabs.map(([k,l])=>h('button',{role:'tab','aria-selected':String((tab||'')===k),class:(tab||'')===k?'on':'',on:{click:()=>go('/bots/'+p.slug+(k?'/'+k:''))}},l)))
const side=h('aside',{class:'bh-spec'},h('h4',null,'Details'),
spec('License',p.license==='ARR'?'All rights reserved':licenseName(p.license)),
lu?h('div',{class:'bh-kv'},h('span',null,'Terms'),link('Read license',lu)):null,
p.owner?h('div',{class:'bh-kv'},h('span',null,'Author'),h('b',null,p.owner.name)):null,
spec('Published',fmtDate(p.created_at)),
p.tags.length?h('div',{class:'bh-kv col'},h('span',null,'Tags'),chips(p.tags)):null,
(p.source_url||p.website_url||p.support_url)?h('div',{class:'bh-kv col'},h('span',null,'Links'),h('div',{class:'bh-links'},link('Source code',p.source_url),link('Website',p.website_url),link('Support',p.support_url))):null)
mount(box,head,h('div',{class:'bh-cols'},h('div',{class:'bh-colmain'},nav,content),side))
return{node:box,title:p.name}
}

async function editor(slug){
let p=null
if(slug){
try{p=(await GET('/api/bothub/'+encodeURIComponent(slug))).project}catch(e){return h('div',{class:'empty'},e.message)}
if(!p.mine)return h('div',{class:'empty'},'Only the author can edit this bot.')
}
const d=p?{name:p.name,summary:p.summary,readme:p.readme,license:p.license,license_url:p.license_url,source_url:p.source_url,website_url:p.website_url,support_url:p.support_url,visibility:p.visibility,tags:[...p.tags],avatar_id:p.avatar_id,slug:p.slug}:{name:'',summary:'',readme:'',license:'MIT',license_url:'',source_url:'',website_url:'',support_url:'',visibility:'private',tags:[],avatar_id:null,slug:''}
const err=h('div',{class:'err',role:'alert'})
const preview=h('div',{class:'bh-prev'})
const drawPrev=()=>mount(preview,h('h4',null,'Listing preview'),row({id:p?p.id:'preview',slug:d.slug||'preview',name:d.name||'Your bot',summary:d.summary||'A short summary appears here.',avatar_id:d.avatar_id,tags:d.tags,installs:p?p.installs:0,updated_at:Date.now(),license:d.license,owner:{name:S.me.display_name}}))
const bind=(k,inp)=>{inp.addEventListener('input',()=>{d[k]=inp.value;drawPrev()});return inp}
const name=bind('name',h('input',{class:'inp',maxLength:32,value:d.name,placeholder:'Tunebox',autofocus:!p}))
const summary=bind('summary',h('input',{class:'inp',maxLength:160,value:d.summary,placeholder:'One line about what it does'}))
const avatarRow=h('div',{class:'row'})
const drawAv=()=>mount(avatarRow,botIcon({id:p?p.id:'preview',name:d.name||'Bot',avatar_id:d.avatar_id},'lg'),h('button',{class:'btn',type:'button',on:{click:async()=>{
const f=await pickCropped({aspect:1,round:false,width:512,title:'Crop bot icon'});if(!f)return
try{const up=await uploadImage('avatar',{},f);d.avatar_id=up.id;drawAv();drawPrev()}catch(e){fail(e)}
}}},d.avatar_id?'Change icon':'Upload icon'),d.avatar_id?h('button',{class:'btn',type:'button',on:{click:()=>{d.avatar_id=null;drawAv();drawPrev()}}},'Remove'):null)
const tagBox=h('div',{class:'bh-filter wrap'})
const drawTags=()=>mount(tagBox,TAGS.map(t=>{const on_=d.tags.includes(t);return h('button',{type:'button',class:on_?'on':'','aria-pressed':String(on_),on:{click:()=>{if(on_)d.tags=d.tags.filter(x=>x!==t);else if(d.tags.length>=5)return toast('Pick up to 5 tags','err');else d.tags=[...d.tags,t];drawTags();drawPrev()}}},tagLabel(t))}))
const readme=bind('readme',h('textarea',{class:'inp bh-ta',rows:14,maxLength:20000,value:d.readme,placeholder:'Describe commands, setup and permissions. Markdown works here.'}))
const rdPrev=h('div',{class:'mb bh-md inp',hidden:true})
let showPrev=false
const rdTabs=h('div',{class:'bh-tabs small'})
const drawRd=()=>{
readme.hidden=showPrev;rdPrev.hidden=!showPrev
if(showPrev)mount(rdPrev,d.readme.trim()?render(d.readme):h('div',{class:'hint'},'Nothing to preview yet.'))
mount(rdTabs,[['Write',false],['Preview',true]].map(([l,v])=>h('button',{type:'button',class:showPrev===v?'on':'',on:{click:()=>{showPrev=v;drawRd()}}},l)))
}
const licBox=h('div',{class:'bh-radios'})
const licUrl=bind('license_url',h('input',{class:'inp',value:d.license_url,placeholder:'https://example.com/license',maxLength:200}))
const licUrlF=field('Link to your license terms',licUrl)
const drawLic=()=>{
licUrlF.hidden=d.license!=='Custom'
mount(licBox,LICENSES.map(l=>h('label',{class:'bh-radio'+(d.license===l[0]?' on':'')},h('input',{type:'radio',name:'lic',value:l[0],checked:d.license===l[0],on:{change:()=>{d.license=l[0];drawLic();drawPrev()}}}),h('b',null,l[1]),h('small',null,l[2]))))
}
const visBox=h('div',{class:'bh-radios'})
const VIS=[['private','Private','Only you can see and add it. Good while you build.'],['unlisted','Link only','Anyone with the link can read the page and add the bot. It is not listed.'],['public','Listed','Appears on the Bots page for everyone. Needs a summary.']]
const drawVis=()=>mount(visBox,VIS.map(v=>h('label',{class:'bh-radio'+(d.visibility===v[0]?' on':'')},h('input',{type:'radio',name:'vis',value:v[0],checked:d.visibility===v[0],on:{change:()=>{d.visibility=v[0];drawVis()}}}),h('b',null,v[1]),h('small',null,v[2]))))
const url=(k,l,ph)=>field(l,bind(k,h('input',{class:'inp',value:d[k],placeholder:ph,maxLength:200,type:'url'})))
const slugIn=p?bind('slug',h('input',{class:'inp',value:d.slug,maxLength:40})):null
const save=h('button',{class:'btn pri',type:'button'},p?'Save changes':'Create bot')
const secs=[]
const sec=(id,title,...kids)=>{const s=h('section',{class:'bh-sec',id:'sec-'+id},h('h3',null,title),...kids);secs.push([id,title]);return s}
const body=[
sec('basics','Basics',field('Name',name,'2 to 32 characters. This is also the bot account name.'),field('Icon',avatarRow),field('Summary',summary,'One line shown in search results. Needed to list publicly.'),h('label',{class:'f'},'Tags (up to 5)'),tagBox),
sec('story','Description',rdTabs,readme,rdPrev),
sec('license','License',h('p',{class:'hint',style:{marginTop:0}},'Tells people what they may do with your bot’s code or content. Pick the one that matches how you share it.'),licBox,licUrlF),
sec('links','Links',url('source_url','Source code','https://github.com/you/bot'),url('website_url','Website','https://'),url('support_url','Support','https://')),
sec('visibility','Visibility',visBox)
]
if(p){
const rel=h('div',{class:'list'})
const ver=h('input',{class:'inp',placeholder:'1.0.0',maxLength:24,'aria-label':'Version'})
const log=h('textarea',{class:'inp',rows:3,maxLength:4000,placeholder:'What changed? Markdown works.','aria-label':'Changelog'})
const drawRel=()=>mount(rel,p.releases.map(r=>h('div',{class:'li'},h('div',{class:'grow'},h('b',null,'v'+r.version),h('small',null,fmtDate(r.created_at))),h('button',{class:'btn sm dng',type:'button',on:{click:async()=>{try{await DEL(`/api/bothub/${p.id}/releases/${r.id}`);p.releases=p.releases.filter(x=>x.id!==r.id);drawRel()}catch(e){fail(e)}}}},'Delete'))))
drawRel()
body.push(sec('releases','Releases',h('p',{class:'hint',style:{marginTop:0}},'Release notes are for people who run the bot. Publishing one marks the page as updated.'),rel,h('div',{class:'row',style:{alignItems:'flex-start',marginTop:'8px'}},h('div',{style:{width:'140px'}},ver),h('div',{class:'grow'},log),h('button',{class:'btn',type:'button',on:{click:async()=>{
try{const r=await POST(`/api/bothub/${p.id}/releases`,{version:ver.value.trim(),changelog:log.value});p.releases.unshift(r.release);ver.value='';log.value='';drawRel();toast('Release published','ok')}catch(e){fail(e)}
}}},'Publish'))))
const tokOut=h('div')
body.push(sec('access','Access',field('Page address',slugIn,'parley link: /bots/'+d.slug),h('p',{class:'hint'},'Bot account ID: '+p.bot_id),h('button',{class:'btn',type:'button',on:{click:async()=>{
if(!await confirmBox('Generate a new token?','The old token stops working immediately.','Generate',true))return
try{const t=await POST(`/api/bothub/${p.id}/token`,{});mount(tokOut,tokenBox(t.token))}catch(e){fail(e)}
}}},icon('refresh','s'),'Generate new token'),tokOut))
body.push(sec('danger','Delete',h('p',{class:'hint',style:{marginTop:0}},'Removes the page, the bot account and its token, and takes the bot out of every server.'),h('button',{class:'btn dng',type:'button',on:{click:async()=>{
if(!await confirmBox('Delete '+p.name+'?','This cannot be undone.','Delete bot',true))return
try{await DEL('/api/bothub/'+p.id);toast('Bot deleted','ok');go('/lab')}catch(e){fail(e)}
}}},'Delete bot')))
}
save.addEventListener('click',async()=>{
err.textContent=''
save.disabled=true
const payload={name:d.name.trim(),summary:d.summary.trim(),readme:d.readme,license:d.license,license_url:d.license==='Custom'?d.license_url.trim():'',source_url:d.source_url.trim(),website_url:d.website_url.trim(),support_url:d.support_url.trim(),visibility:d.visibility,tags:d.tags,avatar_id:d.avatar_id}
try{
if(p){
if(d.slug!==p.slug)payload.slug=d.slug
await PATCH('/api/bothub/'+p.id,payload)
toast('Saved','ok')
go('/lab/'+(payload.slug||p.slug)+'/edit',true)
}else{
const r=await POST('/api/bothub',payload)
tokenDialog(payload.name,r.token)
go('/lab/'+r.slug+'/edit',true)
}
}catch(e){err.textContent=e.message;save.disabled=false;inPage(err)}
})
drawAv();drawTags();drawRd();drawLic();drawVis();drawPrev()
const toc=h('nav',{class:'bh-toc','aria-label':'Sections'},secs.map(([id,t])=>h('a',{href:'#sec-'+id,on:{click:e=>{e.preventDefault();inPage(document.getElementById('sec-'+id))}}},t)))
const bar=h('div',{class:'bh-savebar'},err,h('div',{class:'grow'}),p?h('button',{class:'btn',type:'button',on:{click:()=>go('/lab/'+p.slug+'/blocks')}},'Block builder'):null,p?h('button',{class:'btn',type:'button',on:{click:()=>go('/bots/'+p.slug)}},'View page'):null,save)
return h('div',null,botTabs(p,'d'),h('div',{class:'bh-edit'},h('div',{class:'bh-ecol'},toc),h('div',{class:'bh-emain'},body,bar),h('div',{class:'bh-ecol r'},preview)))
}

function inPage(el){
if(!el)return
let p=el.parentElement
while(p&&p.scrollHeight<=p.clientHeight+1)p=p.parentElement
if(!p||p===document.body||p===document.documentElement)return
const top=el.getBoundingClientRect().top-p.getBoundingClientRect().top+p.scrollTop-12
p.scrollTo({top,behavior:'smooth'})
}

function tokenBox(token){
return h('div',{class:'bh-token'},h('p',{class:'hint',style:{margin:'0 0 6px'}},'Copy this token now. It is not shown again.'),h('code',null,token),h('button',{class:'btn sm',type:'button',on:{click:()=>copyText(token)}},icon('copy','s'),'Copy'))
}
function tokenDialog(name,token){
dialog(name+' is ready',h('div',{class:'bd'},tokenBox(token),h('p',{class:'hint'},'Send requests with the header Authorization: Bot <token>. Keep it secret. You can generate a new one from the editor.'),h('pre',{class:'mb'},h('code',null,snippet('bot')))),{footer:close=>h('button',{class:'btn pri',on:{click:close}},'Done'),sticky:true})
}

export function botsPage(r){
const title=r.view==='project'?'Bot':'Bots'
const nav=h('button',{class:'btn sm pri',on:{click:()=>go('/lab')}},icon('flask','s'),'Open Bot Lab')
const bar=topBar({lead:icon('bot'),title:'Bots',topic:r.view==='browse'?'Add bots to your servers':'',actions:nav})
const scroller=h('div',{class:'pgh bh-page'})
const res={nodes:[bar,scroller],title:title+' • Parley',cleanup:null}
const fill=async()=>{
if(r.view==='browse')mount(scroller,browse())
else{const v=await projectView(r.slug,r.tab);mount(scroller,v.node);if(v.title)document.title=v.title+' • Parley'}
}
res.ready=fill().catch(e=>mount(scroller,h('div',{class:'err',style:{padding:'24px'}},e.message)))
return res
}

export function labPage(r){
const title=r.view==='new'?'New bot':r.view==='edit'?'Edit bot':r.view==='blocks'?'Block builder':'Bot Lab'
const nav=h('div',{class:'row',style:{gap:'4px'}},
h('button',{class:'btn sm'+(r.view==='mine'?' pri':''),on:{click:()=>go('/lab')}},'My bots'),
h('button',{class:'btn sm'+(r.view==='new'?' pri':''),on:{click:()=>go('/lab/new')}},icon('plus','s'),'New bot'),
h('button',{class:'btn sm',on:{click:()=>go('/bots')}},'Bot hub'))
const bar=topBar({lead:icon('flask'),title:'Bot Lab',topic:r.view==='mine'?'Build, test and publish your bots':'',actions:nav})
const scroller=h('div',{class:'pgh bh-page'})
const res={nodes:[bar,scroller],title:title+' • Parley',cleanup:null}
const fill=async()=>{
if(r.view==='mine')mount(scroller,await mineView())
else if(r.view==='new')mount(scroller,await editor(null))
else if(r.view==='edit')mount(scroller,await editor(r.slug))
else mount(scroller,await blocksPage(r.slug))
}
res.ready=fill().catch(e=>mount(scroller,h('div',{class:'err',style:{padding:'24px'}},e.message)))
return res
}
