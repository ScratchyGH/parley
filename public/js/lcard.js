import{h,GET,avatar,coverBg}from'./util.js'
export const LC=/\[\[lc:([A-Za-z0-9_-]{8,300})\]\]/
export function lcardNode(key){
const box=h('div',{class:'lcard lcard-load','aria-label':'Level card',on:{contextmenu:e=>e.preventDefault()}})
GET('/api/lc/'+key).then(d=>{
box.classList.remove('lcard-load')
const ban=h('div',{class:'lc-ban'})
if(d.banner_id)coverBg(ban,d.banner_id,'')
else if(d.accent)ban.style.background='linear-gradient(135deg,'+d.accent+',#171720)'
const pct=Math.max(0,Math.min(100,Math.round(d.cur/d.max*100)))
const fill=h('i',{class:'lc-fill'});fill.style.width=Math.max(4,pct)+'%'
box.append(ban,h('div',{class:'lc-body'},h('div',{class:'lc-av'},avatar({id:d.id,name:d.name,display_name:d.name,avatar_id:d.avatar_id,accent:d.accent,frame:d.frame},'lg')),h('div',{class:'lc-main'},h('div',{class:'lc-top'},h('b',{class:'lc-name'},d.name),h('span',{class:'lc-lv'},'Level '+d.level)),h('div',{class:'lc-bar'},fill),h('div',{class:'lc-sub'},h('span',null,d.cur+' / '+d.max+' XP'),h('span',null,'Rank #'+d.rank)))))
}).catch(()=>{box.classList.remove('lcard-load');box.append(h('div',{class:'lc-body'},'Level card unavailable'))})
return box
}
