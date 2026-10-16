import{h,mount,icon,GET,POST,avatar,fail,fmtRel,coverBg}from'./util.js'
import{S,on,loadServers,serverUnread,dmUnread,unreadOf,convTitle,convOther}from'./state.js'
import{go}from'./nav.js'
import{createServerDialog,newDmDialog}from'./dialogs.js'
import{topBar}from'./shell.js'

const hello=()=>{const hr=new Date().getHours();return hr<5?'Still up':hr<12?'Good morning':hr<18?'Good afternoon':'Good evening'}
const plural=(n,w)=>n+' '+w+(n===1?'':'s')

function tile(ic,title,sub,fn){
return h('button',{class:'htile',on:{click:fn}},h('span',{class:'tico'},icon(ic)),h('b',null,title),h('small',null,sub))
}

export function homePage(){
const body=h('div',{class:'home'})
const bar=topBar({lead:icon('chat'),title:'Home',topic:'',actions:null})
let found=null
function draw(){
const dm=dmUnread()
const reqs=S.fr.incoming.length
const bits=[]
if(dm)bits.push(plural(dm.count||dm.mentions,'unread message'))
if(reqs)bits.push(plural(reqs,'friend request'))
const unread=S.servers.filter(s=>serverUnread(s.id))
if(unread.length)bits.push(plural(unread.length,'server')+' with news')
const hero=h('section',{class:'hh'},
h('div',{class:'hh-t'},h('img',{class:'hh-m',src:'/mascot.webp',alt:'',width:96,height:96,decoding:'async'}),h('h1',null,hello()+', ',h('span',null,S.me.display_name)),h('p',null,bits.length?bits.join('. ')+'.':'You are all caught up.')),
h('div',{class:'hh-a'},
tile('plus','Start a server','Make a space for your people',()=>createServerDialog()),
tile('compass','Find a community','Browse public servers',()=>go('/discover')),
tile('useradd','Add a friend','Send a request by username',()=>go('/friends/add')),
tile('bot','Bot hub','Share and install bots',()=>go('/bots'))))
const servers=S.servers.length?h('section',{class:'hsec'},h('h2',null,'Your servers'),h('div',{class:'sgrid'},S.servers.map(s=>{
const u=serverUnread(s.id)
return h('button',{class:'scard'+(u?' un':''),style:s.accent?{'--c':s.accent}:{},on:{click:()=>go('/s/'+s.id)}},
s.banner_id?coverBg(h('span',{class:'sbanner'}),s.banner_id,''):h('span',{class:'sbanner'}),
h('span',{class:'sico'},avatar({id:s.id,name:s.name,icon_id:s.icon_id,display_name:s.name},'lg')),
h('b',null,s.name),
h('small',null,u?(u.mentions?plural(u.mentions,'mention'):'New messages'):'Up to date'),
u&&u.mentions?h('span',{class:'bdg'},u.mentions):null)
}))):h('section',{class:'hsec'},h('h2',null,'Your servers'),h('div',{class:'hempty'},h('b',null,'No servers yet'),h('p',null,'Create one, join with an invite link, or browse what is public.'),h('div',{class:'row',style:{gap:'8px',flexWrap:'wrap'}},h('button',{class:'btn pri',on:{click:()=>createServerDialog()}},'Create a server'),h('button',{class:'btn',on:{click:()=>go('/discover')}},'Browse Discover'))))
const recent=S.convs.filter(c=>c.accepted).slice(0,6)
const chats=h('section',{class:'hsec'},h('div',{class:'row sp'},h('h2',null,'Conversations'),h('button',{class:'btn sm',on:{click:()=>newDmDialog()}},icon('plus','s'),'New message')),
recent.length?h('div',{class:'clist'},recent.map(c=>{
const o=convOther(c)
const u=unreadOf(c.id)
return h('button',{class:'hrow'+(u?' un':''),on:{click:()=>go('/dm/'+c.id)}},c.type==='group'?h('span',{class:'gico'},icon('users')):avatar(o||{},'',S.pres[o?.id]||null),h('span',{class:'grow'},h('b',null,convTitle(c)),h('small',null,c.last_message_at?fmtRel(c.last_message_at):'No messages yet')),u?h('span',{class:'bdg'},u.mentions||u.count):null)
})):h('div',{class:'hempty'},h('b',null,'Nothing here yet'),h('p',null,'Message a friend to start a conversation.')))
const disc=found&&found.length?h('section',{class:'hsec'},h('div',{class:'row sp'},h('h2',null,'Worth a look'),h('button',{class:'btn sm',on:{click:()=>go('/discover')}},'See all')),h('div',{class:'dgrid'},found.map(s=>{
const joined=S.servers.some(x=>x.id===s.id)
return h('div',{class:'dcard'},avatar({id:s.id,name:s.name,icon_id:s.icon_id,display_name:s.name}),h('div',{class:'grow'},h('b',null,s.name),h('small',null,plural(s.members,'member')+(s.category?' in '+s.category:''))),
h('button',{class:'btn sm'+(joined?'':' pri'),on:{click:async e=>{
if(joined){go('/s/'+s.id);return}
e.currentTarget.disabled=true
try{await POST(`/api/servers/${s.id}/join`,{});await loadServers();go('/s/'+s.id)}catch(x){fail(x);e.target.disabled=false}
}}},joined?'Open':'Join'))
}))):null
mount(body,hero,servers,h('div',{class:'hcols'},chats,disc))
}
GET('/api/discover?limit=4').then(d=>{found=d.servers;draw()}).catch(()=>{})
const offs=['servers','convs','friends','unread','settings'].map(e=>on(e,draw))
draw()
return{nodes:[bar,body],cleanup:()=>offs.forEach(f=>f())}
}
