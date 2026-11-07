import{h,GET,avatar,coverBg}from'./util.js'
export const LC=/\[\[lc:([A-Za-z0-9_-]{8,300})\]\]/
export function lcardNode(key){
const box=h('div',{class:'lcard lcard-load','aria-label':'Level card',on:{contextmenu:e=>e.preventDefault()}})
GET('/api/lc/'+key).then(d=>{
box.classList.remove('lcard-load')
const st=d.style||{},lay=st.layout||'banner',pf=st.pfp||'left'
box.classList.add('lcl-'+lay,'lcp-'+pf,'lcb-'+(st.bar||'round'))
if(st.textcolor)box.style.setProperty('--lc-text',st.textcolor)
if(st.barcolor)box.style.setProperty('--lc-bar',st.barcolor)
const bg=h('div',{class:'lc-ban'})
const pic=lay==='custom'?st.bg:lay==='full'||lay==='blur'||lay==='banner'||lay==='split'?d.banner_id:null
if(lay==='blur'&&d.avatar_id)coverBg(bg,d.avatar_id,'')
else if(pic)coverBg(bg,pic,lay==='full'||lay==='custom'?'linear-gradient(0deg,rgba(10,10,16,.78),rgba(10,10,16,.35))':'')
else if(d.accent)bg.style.background='linear-gradient(135deg,'+d.accent+',#171720)'
const pct=Math.max(0,Math.min(100,Math.round(d.cur/d.max*100)))
const fill=h('i',{class:'lc-fill'});fill.style.width=Math.max(4,pct)+'%'
const av=pf==='hidden'?null:h('div',{class:'lc-av'},avatar({id:d.id,name:d.name,display_name:d.name,avatar_id:d.avatar_id,accent:d.accent,frame:d.frame},pf==='center'?'xl':'lg'))
const main=h('div',{class:'lc-main'},h('div',{class:'lc-top'},h('b',{class:'lc-name'},d.name),h('span',{class:'lc-lv'},'Level '+d.level)),h('div',{class:'lc-bar'},fill),h('div',{class:'lc-sub'},h('span',null,d.cur+' / '+d.max+' XP'),h('span',null,'Rank #'+d.rank)))
box.append(bg,h('div',{class:'lc-body'},av,main))
}).catch(()=>{box.classList.remove('lcard-load');box.append(h('div',{class:'lc-body'},'Level card unavailable'))})
return box
}
