import{h,toast}from'./util.js'
import{RELEASES}from'./changelog.js'
import{previewRelease}from'./whatsnew.js'
import{appUpdateDialog}from'./appupd.js'
import{openCardDesigner}from'./lcdesign.js'
import{previewGift}from'./giftreveal.js'
const K='parley_test'
export const testMode=()=>{try{return localStorage.getItem(K)==='1'}catch{return false}}
const setMode=v=>{try{localStorage.setItem(K,v?'1':'0')}catch{}}
export const UPCOMING=[
{id:'appupd',title:'App update prompt',text:'The dialog Android app users see when a newer app version exists.',run:()=>appUpdateDialog({code:RELEASES.length,url:''},true)},
{id:'notes',title:'Next release notes',text:'The newest release notes exactly as members will see them.',run:()=>{const r=RELEASES[0];previewRelease(r)}},
{id:'lcd',title:'Level card designer',text:'Drag, rotate and restyle a level card.',run:()=>openCardDesigner({design:'',bgid:'',onSave:()=>toast('Preview only, nothing saved','ok')})},
{id:'gift',title:'Gift opening',text:'The 3D gift box with several items.',run:()=>previewGift({from_name:'Parley',kind:'multi',item_id:'',label:'Rewards',items:[['bd_leaf','badge','Maple leaf pin'],['bd_feather','badge','Feather pin']]})}
]
export function testUpdates(){
const on=h('input',{type:'checkbox',checked:testMode(),on:{change:e=>{setMode(e.target.checked);toast(e.target.checked?'Test mode on for this browser':'Test mode off','ok')}}})
return h('div',{style:{width:'100%'}},
h('p',{class:'hint'},'Try upcoming changes before members see them. Everything opens in preview mode. Nothing is saved, sent or changed.'),
h('label',{class:'bk-check'},on,'Test mode (this browser only)'),
h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'10px',marginTop:'12px'}},UPCOMING.map(u=>h('div',{class:'card'},h('b',null,u.title),h('p',{class:'hint'},u.text),h('button',{type:'button',class:'btn pri',on:{click:()=>{try{u.run()}catch(e){toast(e.message||'Could not open','err')}}}},'Test it')))))
}
