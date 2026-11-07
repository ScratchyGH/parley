import{h,mount,GET,toast,fail,confirmBox,dialog,menu,avatar}from'./util.js'
import{S}from'./state.js'
import{render}from'./md.js'
import{whatsNew,updatesBoard,previewRelease}from'./whatsnew.js'
import{RELEASES}from'./changelog.js'
import{previewUpdate,buildInfo,checkUpdate}from'./update.js'
import{previewGift}from'./giftreveal.js'
import{banhammerHit,birthdayCake}from'./banhammerfx.js'
import{throwCake}from'./cakefx.js'
import{startTour}from'./tour.js'
import{tosGate,privacyDialog,termsDialog,shortTerms}from'./legal.js'
import{installDialog}from'./botspage.js'
import{playIntro}from'./intro.js'
import{chooseProvider}from'./provider.js'
import{bootError}from'./errscreens.js'
import{renderAppeal}from'./auth.js'

const SAMPLE='# Heading\n## Smaller heading\n-# small print\n**bold** *italic* __underline__ ~~strike~~ ==highlight== x^2 H~2~O ||spoiler||\n> quote\n>>> multi\nline quote\n- bullet\n- [x] done task\n- [ ] open task\n1. first\n2. second\n---\n| Name | Score |\n|:--|--:|\n| Ada | 10 |\n| Bo | 7 |\n```js\nconst a=1\n```\nTime: <t:1893456000:F> and <t:1893456000:R>\n[a link](https://example.com)'
function fullScreen(node,keep){
const w=h('div',{style:{position:'fixed',inset:'0',zIndex:'2147483000',background:'var(--bg)',overflow:'auto'}},node,h('button',{class:'btn',style:{position:'fixed',top:'12px',right:'12px'},on:{click:()=>w.remove()}},'Close preview'))
document.body.append(w)
}
function draftBox(){
const r0=RELEASES[0]
const ta=h('textarea',{class:'inp',rows:12,style:{fontFamily:'var(--mono)',width:'100%'}},JSON.stringify({v:'2026.12.01',date:'December 1, 2026',title:'Title of the update',summary:'One line about what is new.',sections:[['New',[['Feature name','What it does.']]],['Fixes',[['Thing fixed','What changed.']]]]},null,1))
const go=h('button',{type:'button',class:'btn pri',on:{click:()=>{try{const r=JSON.parse(ta.value);if(!r||!r.title||!Array.isArray(r.sections))throw new Error('Needs a title and a sections list');previewRelease({v:r.v||'draft',date:r.date||'',title:r.title,summary:r.summary||'',sections:r.sections})}catch(e){toast(e.message||'That is not valid JSON','err')}}}},'Preview this update')
return h('div',{style:{width:'100%'}},h('p',{class:'hint'},'Write the release notes here and see exactly how members will see them. Nothing is published.'),ta,h('div',{class:'row',style:{marginTop:'8px'}},go))
}
export function guiPreview(){
const box=h('div')
const btn=(l,fn)=>h('button',{type:'button',class:'btn',on:{click:fn}},l)
const group=(t,...k)=>h('section',{class:'bh-sec',style:{marginBottom:'18px'}},h('h4',{style:{margin:'0 0 8px'}},t),h('div',{class:'row',style:{flexWrap:'wrap',gap:'8px'}},...k))
const ta=h('textarea',{class:'inp',rows:10,style:{fontFamily:'var(--mono)'}},SAMPLE)
const out=h('div',{class:'mb',style:{border:'1px solid var(--border)',borderRadius:'12px',padding:'10px 14px',minHeight:'120px'}})
const drawMd=()=>mount(out,render(ta.value,{}))
ta.addEventListener('input',drawMd)
drawMd()
const gal=h('div',{class:'hint'},'Loading cosmetics…')
GET('/api/pars').then(d=>{
const np=d.items.filter(i=>i.kind==='nameplate'),ef=d.items.filter(i=>i.kind==='effect')
mount(gal,h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:'10px'}},np.map(i=>h('div',{class:'card'},h('span',{class:'np '+i.id},S.me.display_name),h('div',{class:'hint',style:{margin:'6px 0 0'}},i.name))),ef.map(i=>h('div',{class:'card'},avatar({...S.me,effect:i.id},'lg'),h('div',{class:'hint',style:{margin:'6px 0 0'}},i.name)))))
}).catch(e=>mount(gal,h('div',{class:'err'},e.message)))
mount(box,h('p',{class:'hint'},'Everything here opens in preview mode. Nothing is saved, sent or changed.'),
group('Popups',btn('What\'s new',()=>whatsNew(true)),btn('Updates board',updatesBoard),btn('Terms gate',()=>tosGate(true)),btn('Short terms',shortTerms),btn('Privacy policy',privacyDialog),btn('Terms of service',termsDialog)),
group('Dialogs',btn('Confirm',()=>confirmBox('Delete this thing?','This is how a confirmation looks.','Delete',false)),btn('Confirm, danger',()=>confirmBox('Delete this thing?','This is how a dangerous confirmation looks.','Delete',true)),btn('Plain dialog',()=>dialog('Example dialog',h('div',{class:'bd'},h('p',null,'Body text goes here.')),{footer:c=>[h('button',{class:'btn',on:{click:c}},'Cancel'),h('button',{class:'btn pri',on:{click:c}},'Save')]})),btn('Add bot to server',()=>installDialog({id:'preview',name:'Sample bot',installs:0}))),
group('More dialogs',btn('Provider chooser',()=>chooseProvider()),btn('Server picker',()=>confirmBox('Leave server','You will stop receiving messages from this server.','Leave',true)),btn('Long text',()=>dialog('Long dialog',h('div',{class:'bd'},...Array.from({length:30},(_,i)=>h('p',null,'Line '+(i+1)+' of a long dialog, to check scrolling and the footer.'))),{footer:c=>[h('button',{class:'btn pri',on:{click:c}},'Done')]}))),
group('Full screens',...[['Maintenance (503)',{status:503,message:''}],['Server unreachable',{status:0,message:'Failed to fetch'}]].map(([l,e])=>btn(l,()=>fullScreen(bootError(e)))),btn('Suspension appeal',()=>{const r=h('div');fullScreen(r,true);renderAppeal(r,()=>{},{u:'preview',p:''})})),
group('Error codes',...[[400,'That text is not allowed on Parley'],[401,'You are signed out'],[403,'You do not have permission to do that'],[404,'Not found'],[409,'That username is taken or too similar to an existing or previously used one'],[413,'That file is too large'],[429,'Too many requests. Try again in a moment'],[500,'Something went wrong on our side'],[502,'The server did not answer'],[503,'Parley is in maintenance mode. Please try again shortly.']].map(([c,m])=>btn(String(c),()=>fail(Object.assign(new Error(m),{status:c}))))),
group('Animations',btn('Intro animation',()=>playIntro(true)),
btn('Gift: single item',()=>previewGift({from_name:'Parley',kind:'badge',item_id:'bd_leaf',label:'Maple leaf pin'})),
btn('Gift: Pars',()=>previewGift({from_name:'Parley',kind:'pars',label:'500 Pars',amount:500})),
btn('Gift: six items',()=>previewGift({from_name:'Parley',kind:'multi',item_id:'',label:'Rewards',items:[['bd_leaf','badge','Maple leaf pin'],['bd_feather','badge','Feather pin'],['ti_grateful','title','Grateful title'],['bb_hearth','bubble','Hearth message style'],['np_pie','nameplate','Pumpkin pie nameplate'],['nf_gold_leaf','namefx','Gold leaf name']].map(([id,kind,name])=>({id,kind,name}))})),
btn('Gift: bundle',()=>previewGift({from_name:S.me.display_name,kind:'bundle',label:'Bundle'})),
btn('Ban hammer',()=>banhammerHit(S.me.id,'An admin')),
btn('Birthday cake',()=>birthdayCake(S.me.id,'A friend')),
btn('Throw cake',e=>throwCake(e.currentTarget)),
btn('Guided tour',()=>startTour(true))),
group('Update tester',btn('Banner: restart countdown',()=>previewUpdate('count')),btn('Banner: waiting for call',()=>previewUpdate('call')),btn('Banner: waiting for game',()=>previewUpdate('game')),btn('Banner: waiting for block save',()=>previewUpdate('blocks')),btn('Check for a new build',async()=>{await checkUpdate();const i=await buildInfo();toast(i?(i.loaded===i.live?'Up to date. Build '+i.live:'New build live: '+i.live+' (this tab has '+i.loaded+')'):'Could not reach the server',i&&i.loaded!==i.live?'ok':undefined)}),btn('Release notes: latest',()=>whatsNew(true)),...RELEASES.slice(0,6).map((r,i)=>btn('v'+r.v,()=>updatesBoard(i)))),
group('Draft release',draftBox()),
group('Toasts',btn('Success',()=>toast('Saved','ok')),btn('Error',()=>toast('Something went wrong','err')),btn('Info',()=>toast('Heads up'))),
group('Menus',btn('Menu',e=>{const r=e.currentTarget.getBoundingClientRect();menu([{head:'Example'},{label:'Copy',icon:'copy',fn:()=>{}},{label:'Edit',icon:'edit',fn:()=>{}},'-',{label:'Delete',icon:'trash',danger:true,fn:()=>{}}],r.left,r.bottom+4)})),
h('h4',{style:{margin:'0 0 8px'}},'Message syntax'),h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'10px',marginBottom:'18px'}},ta,out),
h('h4',{style:{margin:'0 0 8px'}},'Nameplates and avatar effects'),gal)
return box
}
