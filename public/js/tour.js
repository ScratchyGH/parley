import{h}from'./util.js'
import{S}from'./state.js'
const key=()=>'parley.tour.'+(S.me?.id||'')
const done=()=>{try{return localStorage.getItem(key())==='1'}catch{return true}}
const mark=()=>{try{localStorage.setItem(key(),'1')}catch{}}
const still=()=>matchMedia('(prefers-reduced-motion:reduce)').matches
const STEPS=[
{t:'Welcome to Parley',b:'This is a quick guide to everything on screen. Anything you are not looking at gets blurred, so it is always clear where to look. Use the arrow keys or the buttons, and skip any time.'},
{s:'.ws',t:'The server rail',b:'Every place you chat lives in this column. Home and direct messages sit at the top, then each server you join, then tools.',side:'right'},
{s:'.ws .wbtn[aria-label^="Home"]',t:'Home and direct messages',b:'Your starting point. Friends, direct messages and group chats open from here, and unread counts show up as a badge.',side:'right'},
{s:'.ws .wbtn[title^="Create"]',t:'Create or join a server',b:'Start a community of your own, or paste an invite link to join one. Servers have channels, roles, emoji and their own theme.',side:'right'},
{s:'.ws .wbtn[title^="Discover"]',t:'Discover',b:'Browse public servers by category and join the ones that look fun.',side:'right'},
{s:'.ws .wbtn[title="Bot Lab"]',t:'Bot Lab',b:'Build and test your own bots right inside Parley, with a workspace, variables and live logs.',side:'right'},
{s:'.ws .wbtn[title="Bots"]',t:'Bots',b:'Find bots you can add to your servers to moderate, play music, run games and more.',side:'right'},
{s:'.ctx .qs',t:'Find anything',b:'Jump to any conversation, channel or person by typing a few letters. Press Ctrl K from anywhere to open it.',side:'right'},
{s:'.ctx-b',t:'Your conversations',b:'Direct messages, group chats and the channels of whichever server you opened are listed here. Right click an item for more options.',side:'right'},
{x:['.ctx .ci','Friends'],t:'Friends',b:'See who is online, send requests and start a conversation in one click.',side:'right'},
{x:['.ctx .ci','Pars shop'],t:'Pars shop',b:'Pars are the currency you earn by being around. Spend them on avatar frames, effects, nameplates, bundles and seasonal drops.',side:'right'},
{x:['.ctx .ci','Saved messages'],t:'Saved messages',b:'A private space that only you can see. Keep links, notes and files you want to find again.',side:'right'},
{s:'.ctx .ib[aria-label="New message"],.ctx .ib[title="New message"]',t:'Start a conversation',b:'Begin a direct message or a group chat with anyone on your friends list.',side:'right'},
{s:'.ctx .me .who',t:'You',b:'Click your name to change your status, edit your profile, switch accounts, or replay this guide.',side:'right'},
{s:'.ctx .me .ib[aria-label="Inbox"],.ctx .me .ib[title="Inbox"]',t:'Inbox',b:'Mentions, replies, friend requests and gifts collect here so nothing slips by.',side:'right'},
{s:'.ctx .me .ib[aria-label="User settings"],.ctx .me .ib[title="User settings"]',t:'Settings',b:'Themes, fonts, density, notifications, privacy, security, tweaks and your Pars shop loadout all live in settings. Press Ctrl , to open it quickly.',side:'right'},
{s:'.home .hh',t:'Your home page',b:'A summary of what is happening: your servers, recent conversations and things worth a look.',side:'bottom'},
{s:'.comp .cbox',t:'Say something',b:'Type here to send a message. Attach files, add emoji, GIFs and stickers, or begin with / to use a slash command.',side:'top'},
{s:'.msgs',t:'Messages',b:'Hover a message to react, reply, edit, pin or forward it. Right click for everything else.',side:'left'},
{t:'You are all set',b:'That is the tour. Replay it any time from your status menu by clicking your name, then Guide through Parley. Have fun.'}
]
const pick=st=>{
if(st.x){const[sel,tx]=st.x;return[...document.querySelectorAll(sel)].find(e=>e.textContent.includes(tx))||null}
if(!st.s)return null
return document.querySelector(st.s)
}
let cur=null
export function startTour(force){
if(cur)return
if(!force&&done())return
const list=STEPS.filter(s=>{if(!s.s&&!s.x)return true;const e=pick(s);if(!e)return false;const r=e.getBoundingClientRect();return r.width>8&&r.height>8})
if(list.length<2)return
const q=still()?'':' tr'
const root=h('div',{class:'tour'+q,role:'dialog','aria-modal':'true','aria-label':'Guide through Parley'})
const P=['t','b','l','r'].map(k=>h('i',{class:'tp tp-'+k}))
const ring=h('i',{class:'tring'})
const dots=h('div',{class:'tdots','aria-hidden':'true'})
const count=h('span',{class:'tc'})
const title=h('b',{class:'tt'})
const body=h('p',{class:'tb'})
const back=h('button',{class:'btn',on:{click:()=>go(i-1)}},'Back')
const next=h('button',{class:'btn pri',on:{click:()=>i>=list.length-1?finish():go(i+1)}},'Next')
const skip=h('button',{class:'btn tskip',on:{click:()=>finish()}},'Skip')
const card=h('div',{class:'tcard'},count,title,body,dots,h('div',{class:'row tact'},skip,h('span',{style:{flex:1}}),back,next))
root.append(...P,ring,card)
document.body.append(root)
let i=0
const place=()=>{
const st=list[i]
const W=innerWidth,H=innerHeight
let r={left:W/2,top:H/2,width:0,height:0}
let e=null
if(st.s||st.x){e=pick(st);if(e){const b=e.getBoundingClientRect();const pad=6;r={left:Math.max(0,b.left-pad),top:Math.max(0,b.top-pad),width:Math.min(W,b.width+pad*2),height:Math.min(H,b.height+pad*2)}}}
const R=r.left+r.width,B=r.top+r.height
const sty=(el,l,t,w,hh)=>{el.style.left=l+'px';el.style.top=t+'px';el.style.width=Math.max(0,w)+'px';el.style.height=Math.max(0,hh)+'px'}
sty(P[0],0,0,W,r.top);sty(P[1],0,B,W,H-B);sty(P[2],0,r.top,r.left,r.height);sty(P[3],R,r.top,W-R,r.height)
sty(ring,r.left,r.top,r.width,r.height)
ring.style.opacity=e?'1':'0'
const cw=Math.min(460,W-24)
card.style.width=cw+'px'
const ch=card.offsetHeight
let x,y
if(!e){x=(W-cw)/2;y=(H-ch)/2}
else if(st.side==='right'&&R+cw+16<=W){x=R+14;y=Math.min(Math.max(12,r.top+r.height/2-ch/2),H-ch-12)}
else if(st.side==='top'&&r.top-ch-14>=12){x=Math.min(Math.max(12,r.left+r.width/2-cw/2),W-cw-12);y=r.top-ch-14}
else if(st.side==='left'&&r.left-cw-16>=12){x=r.left-cw-14;y=Math.min(Math.max(12,r.top+Math.min(r.height,300)/2-ch/2),H-ch-12)}
else if(B+ch+14<=H){x=Math.min(Math.max(12,r.left),W-cw-12);y=B+14}
else{x=Math.min(Math.max(12,r.left),W-cw-12);y=Math.max(12,r.top-ch-14)}
card.style.left=x+'px';card.style.top=y+'px'
}
const draw=()=>{
const st=list[i]
title.textContent=st.t;body.textContent=st.b;count.textContent=(i+1)+' of '+list.length
next.textContent=i>=list.length-1?'Done':'Next'
back.style.visibility=i?'visible':'hidden'
dots.replaceChildren(...list.map((_,j)=>h('i',{class:j===i?'on':''})))
place()
next.focus({preventScroll:true})
}
const go=n=>{i=Math.max(0,Math.min(list.length-1,n));draw()}
const key=e=>{
if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish()}
else if(e.key==='ArrowRight'||e.key==='Enter'&&document.activeElement!==back&&document.activeElement!==skip){e.preventDefault();e.stopPropagation();i>=list.length-1?finish():go(i+1)}
else if(e.key==='ArrowLeft'){e.preventDefault();e.stopPropagation();go(i-1)}
else if(e.key==='Tab'){e.preventDefault();const f=[skip,back,next].filter(x=>x.style.visibility!=='hidden');const n=f.indexOf(document.activeElement);f[(n+(e.shiftKey?-1:1)+f.length)%f.length].focus()}
}
const re=()=>place()
const finish=()=>{
mark()
removeEventListener('keydown',key,true);removeEventListener('resize',re)
root.classList.add('out')
setTimeout(()=>{root.remove();cur=null},still()?0:250)
}
cur=root
addEventListener('keydown',key,true);addEventListener('resize',re)
requestAnimationFrame(()=>{draw();root.classList.add('in')})
}
export function maybeTour(tries=0){
if(!S.me||done())return
const created=(S.me.created_at||0)
const t=created<1e12?created*1000:created
if(Date.now()-t>7*864e5)return
if(document.querySelector('.scrim,.gx,#rvlay')||!document.querySelector('.ctx-b')){if(tries<20)setTimeout(()=>maybeTour(tries+1),1000);return}
startTour()
}
