import{h,mount,GET,fail}from'./util.js'
const px=u=>u?'/api/partube/img?u='+encodeURIComponent(u):''
const best=(a,w)=>{if(!a||!a.length)return'';const s=[...a].sort((x,y)=>Math.abs((x.width||0)-w)-Math.abs((y.width||0)-w));return s[0].url}
const thumb=it=>px(best(it.thumbnails,360)||(it.type==='video'||!it.type?'https://i.ytimg.com/vi/'+it.id+'/hqdefault.jpg':''))
const num=n=>n==null?'':n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n)
const api=(p,q={})=>{const u=new URLSearchParams({p});for(const[k,v]of Object.entries(q))if(v!=null&&v!=='')u.set(k,v);return GET('/api/partube?'+u)}
export function partube(){
const root=h('div',{class:'ptb'})
const stack=[]
const inp=h('input',{class:'inp',type:'search',placeholder:'Search YouTube or paste a link',maxLength:300,'aria-label':'Search'})
const kind=h('select',{class:'inp','aria-label':'Type'},...[['video','Videos'],['shorts','Shorts'],['channel','Channels'],['playlist','Playlists']].map(([v,l])=>h('option',{value:v},l)))
const body=h('div',{class:'ptb-body'})
const show=(fn)=>{stack.push(fn);fn()}
const back=()=>{if(stack.length>1){stack.pop();stack[stack.length-1]()}}
const err=e=>mount(body,h('div',{class:'err'},e.message||'Something went wrong'),stack.length>1?h('button',{class:'btn sm',type:'button',on:{click:back}},'Back'):null)
const busy=()=>mount(body,h('div',{class:'hint'},'Loading…'))
const card=it=>{
const open=()=>it.type==='channel'?show(()=>channelView(it.id)):it.type==='playlist'?show(()=>listView(it.id,it.title)):show(()=>videoView(it.id))
const t=thumb(it)
const meta=it.type==='channel'?[it.handle?'@'+it.handle:'',it.subscribersText].filter(Boolean).join(' · '):it.type==='playlist'?[it.channel&&it.channel.name,it.videoCountText].filter(Boolean).join(' · '):[it.channel&&it.channel.name,it.viewsText,it.publishedText].filter(Boolean).join(' · ')
return h('button',{class:'ptb-card'+(it.type==='channel'?' ch':''),type:'button',on:{click:open}},
h('div',{class:'ptb-th'},t?h('img',{src:t,alt:'',loading:'lazy'}):null,it.duration&&it.duration.text?h('span',{class:'ptb-dur'},it.duration.text):null,it.isLive?h('span',{class:'ptb-dur live'},'LIVE'):null),
h('div',{class:'ptb-t'},it.title||it.name||''),h('small',null,meta))
}
const grid=(first,more)=>{
const g=h('div',{class:'ptb-grid'}),wrap=h('div',null,g)
let tok=first.nextPageToken
const add=l=>{for(const it of l||[])if(it.id)g.append(card(it))}
add(first.items)
if(!first.items||!first.items.length)wrap.append(h('div',{class:'hint'},'Nothing found'))
const btn=h('button',{class:'btn',type:'button',on:{click:async()=>{btn.disabled=true;try{const d=await more(tok);tok=d.nextPageToken;add(d.items);if(!tok)btn.remove();else btn.disabled=false}catch(e){fail(e);btn.disabled=false}}}},'Load more')
if(tok)wrap.append(btn)
return wrap
}
async function search(q){
q=q.trim()
if(!q)return
busy()
try{
if(/(youtu\.be\/|youtube\.com\/|^@|^[\w-]{11}$)/.test(q)&&!/\s/.test(q)){
const r=await api('resolve',{url:q})
if(r.videoId)return show(()=>videoView(r.videoId))
if(r.playlistId)return show(()=>listView(r.playlistId,'Playlist'))
if(r.channelId||r.handle)return show(()=>channelView(r.channelId||'@'+String(r.handle).replace(/^@/,'')))
}
const t=kind.value
const p=t==='shorts'?'shorts/search':'search'
const q0=t==='shorts'?{q}:{q,type:t}
const d=await api(p,q0)
mount(body,h('h4',null,'Results for “'+q+'”'),grid(d,tok=>api(p,{...q0,pageToken:tok})))
stack.length=0
stack.push(()=>search(q))
}catch(e){err(e)}
}
async function channelView(id){
busy()
try{
const[c,v]=await Promise.all([api('channel/'+encodeURIComponent(id)),api('channel/'+encodeURIComponent(id)+'/videos')])
const cid=c.id
mount(body,h('button',{class:'btn sm',type:'button',on:{click:back}},'Back'),
h('div',{class:'ptb-chead'},c.avatar&&c.avatar.length?h('img',{src:px(best(c.avatar,160)),alt:''}):null,h('div',null,h('h3',null,c.name),h('small',null,[c.handle?'@'+c.handle:'',c.subscribersText,c.videoCountText].filter(Boolean).join(' · ')))),
h('div',{class:'row',style:{gap:'8px',margin:'10px 0'}},h('button',{class:'btn sm',type:'button',on:{click:()=>show(()=>chPlaylists(cid,c.name))}},'Playlists')),
grid(v,tok=>api('channel/'+encodeURIComponent(cid)+'/videos',{pageToken:tok})))
}catch(e){err(e)}
}
async function chPlaylists(id,name){
busy()
try{
const d=await api('channel/'+encodeURIComponent(id)+'/playlists')
mount(body,h('button',{class:'btn sm',type:'button',on:{click:back}},'Back'),h('h4',null,name+' · Playlists'),grid({...d,items:(d.items||[]).map(x=>({type:'playlist',...x}))},tok=>api('channel/'+encodeURIComponent(id)+'/playlists',{pageToken:tok}).then(r=>({...r,items:(r.items||[]).map(x=>({type:'playlist',...x}))}))))
}catch(e){err(e)}
}
async function listView(id,title){
busy()
try{
const d=await api('playlist/'+id+'/videos')
mount(body,h('button',{class:'btn sm',type:'button',on:{click:back}},'Back'),h('h4',null,title||'Playlist'),grid(d,tok=>api('playlist/'+id+'/videos',{pageToken:tok})))
}catch(e){err(e)}
}
async function videoView(id){
busy()
try{
const v=await api('video/'+id)
const s=v.statistics||{}
const frame=h('iframe',{class:'ptb-frame',src:'https://www.youtube-nocookie.com/embed/'+id+'?rel=0',allow:'accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen',allowFullscreen:true,referrerPolicy:'strict-origin-when-cross-origin',title:v.title||'Video'})
const pane=h('div',{class:'ptb-pane'})
const tabs=h('div',{class:'tabs',role:'tablist',style:{margin:'12px 0',flexWrap:'wrap'}})
const T={
comments:async(p)=>{const d=await api('video/'+id+'/comments',{limit:30});list(p,d.items,x=>h('div',{class:'ptb-cm'},x.author&&x.author.thumbnails&&x.author.thumbnails.length?h('img',{src:px(best(x.author.thumbnails,88)),alt:''}):h('span'),h('div',null,h('b',null,x.author?x.author.name:''),h('small',null,' '+(x.publishedText||'')),h('p',null,x.text),h('small',null,[x.likes!=null?'♥ '+(x.likesText||x.likes):'',x.replyCount?x.replyCount+' replies':''].filter(Boolean).join(' · ')))),'No comments')},
related:async(p)=>{const d=await api('video/'+id+'/related',{limit:30});mount(p,grid(d,tok=>api('video/'+id+'/related',{limit:30,pageToken:tok})))},
transcript:async(p)=>{const d=await api('video/'+id+'/transcript');const t=d.segments||d.items||d.lines||[];if(!t.length)return mount(p,h('div',{class:'hint'},d.text||'No transcript'));list(p,t,x=>h('div',{class:'ptb-tr'},h('small',null,x.start!=null?String(x.start):x.startText||''),h('span',null,x.text)),'No transcript')}
}
const list=(p,a,f,empty)=>mount(p,...(a&&a.length?a.map(f):[h('div',{class:'hint'},empty)]))
let cur=''
const go=async k=>{cur=k;mount(tabs,...Object.keys(T).map(n=>h('button',{type:'button',role:'tab','aria-selected':String(n===k),class:n===k?'on':'',on:{click:()=>go(n)}},n[0].toUpperCase()+n.slice(1))));mount(pane,h('div',{class:'hint'},'Loading…'));try{await T[k](pane)}catch(e){if(cur===k)mount(pane,h('div',{class:'err'},e.message))}}
const ch=v.channel
mount(body,h('button',{class:'btn sm',type:'button',on:{click:back}},'Back'),
h('div',{class:'ptb-player'},frame),
h('h3',{class:'ptb-title'},v.title),
h('div',{class:'ptb-sub'},ch?h('button',{class:'btn sm',type:'button',on:{click:()=>show(()=>channelView(ch.id))}},ch.name+(v.subscriberCountText?' · '+v.subscriberCountText:'')):null,h('small',null,[s.views!=null?num(s.views)+' views':'',s.likes!=null?num(s.likes)+' likes':'',v.uploadDate?v.uploadDate.slice(0,10):'',v.category].filter(Boolean).join(' · '))),
v.description?h('details',{class:'ptb-desc'},h('summary',null,'Description'),h('p',null,v.description)):null,
tabs,pane)
go('related')
}catch(e){err(e)}
}
const form=h('form',{class:'row ptb-bar',on:{submit:e=>{e.preventDefault();stack.length=0;stack.push(()=>search(inp.value));search(inp.value)}}},inp,kind,h('button',{class:'btn pri',type:'submit'},'Search'))
root.append(h('h4',null,'ParTube'),h('p',{class:'hint'},'Admin only. Search and watch YouTube through the YTDirect API. Everything is fetched by the Parley server, so your browser only talks to Parley.'),form,body)
mount(body,h('div',{class:'hint'},'Search for something or paste a YouTube link.'))
return root
}
