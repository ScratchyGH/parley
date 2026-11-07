import{h,GET,avatar,coverBg}from'./util.js'
export const FONTS=[['Sans','system-ui,-apple-system,Segoe UI,sans-serif'],['Serif','Georgia,Times New Roman,serif'],['Mono','ui-monospace,Consolas,monospace'],['Display','var(--disp),system-ui,sans-serif'],['Rounded','Trebuchet MS,Verdana,sans-serif'],['Impact','Impact,Arial Narrow,sans-serif'],['Script','Brush Script MT,Segoe Script,cursive'],['Typewriter','Courier New,monospace']]
export const DEFD={n:[24,22,20,0,10,'ffffff',0],l:[24,46,15,0,10,'35d0ff',0],x:[24,63,12,0,0,'b4b4c4',0],k:[76,8,13,0,10,'ffffff',0],a:[4,18,64,0,0,'7c5cff',0],b:[24,82,72,12,0,'7c5cff',0,'2a2a35',6],d:35}
export const encDesign=d=>btoa(JSON.stringify(d)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
export const decDesign=s=>{try{const j=JSON.parse(atob(String(s).replace(/-/g,'+').replace(/_/g,'/')));return j&&typeof j==='object'?j:null}catch{return null}}
const u=n=>`calc(${n} * 100cqw / 420)`
export function lcDraw(box,des,data,o={}){
box.classList.add('lcd')
const D={...DEFD,...des},els={}
const base=(k,el,a)=>{
el.dataset.k=k
el.style.left=a[0]+'%';el.style.top=a[1]+'%'
el.style.transform='rotate('+(k==='b'?a[4]:a[3])+'deg)'
if(a[6])el.classList.add(o.edit?'lcd-off':'lcd-hide')
els[k]=el
box.append(el)
return el
}
for(const[k,t]of[['n',data.name],['l','Level '+data.level],['x',data.cur+' / '+data.max+' XP'],['k','Rank #'+data.rank]]){
const a=D[k]||DEFD[k],f=a[4]||0
const el=h('div',{class:'lcd-e lcd-t'},t)
el.style.fontSize=u(a[2]);el.style.fontFamily=FONTS[f%10]?FONTS[f%10][1]:FONTS[0][1];el.style.fontWeight=f>=10?'800':'400';el.style.color='#'+(a[5]||'ffffff')
base(k,el,a)
}
{const a=D.a||DEFD.a,el=h('div',{class:'lcd-e lcd-av lcd-av'+(a[4]|0)},o.avatar?o.avatar():null)
el.style.width=el.style.height=u(a[2]);el.style.setProperty('--ring','#'+(a[5]||'7c5cff'))
base('a',el,a)}
{const a=D.b||DEFD.b,fill=h('i',{class:'lcd-fill'}),el=h('div',{class:'lcd-e lcd-bar'},fill)
const pct=Math.max(4,Math.min(100,Math.round(data.cur/Math.max(1,data.max)*100)))
fill.style.width=pct+'%';fill.style.background='#'+(a[5]||'7c5cff')
el.style.width=a[2]+'%';el.style.height=u(a[3]);el.style.borderRadius=u(a[8]);el.style.background='#'+(a[7]||'2a2a35')
base('b',el,a)}
return els
}
export const LC=/\[\[lc:([A-Za-z0-9_-]{8,1500})\]\]/
export function lcardNode(key){
const box=h('div',{class:'lcard lcard-load','aria-label':'Level card',on:{contextmenu:e=>e.preventDefault()}})
GET('/api/lc/'+key).then(d=>{
box.classList.remove('lcard-load')
const st=d.style||{},lay=st.layout||'banner',pf=st.pfp||'left'
if(!d.design)box.classList.add('lcl-'+lay,'lcp-'+pf,'lcb-'+(st.bar||'round'))
if(st.textcolor)box.style.setProperty('--lc-text',st.textcolor)
if(st.barcolor)box.style.setProperty('--lc-bar',st.barcolor)
const bg=h('div',{class:'lc-ban'})
if(d.design){
const pic0=lay==='custom'?st.bg:lay==='blur'?d.avatar_id:d.banner_id
const dim=(d.design.d??35)/100,over='linear-gradient(rgba(10,10,16,'+dim+'),rgba(10,10,16,'+dim+'))'
if(pic0)coverBg(bg,pic0,over);else bg.style.background=d.accent?'linear-gradient(135deg,'+d.accent+',#171720)':'#15151b'
if(lay==='blur')bg.classList.add('lcd-blur')
box.append(bg)
lcDraw(box,d.design,d,{avatar:()=>avatar({id:d.id,name:d.name,display_name:d.name,avatar_id:d.avatar_id,accent:d.accent,frame:d.frame},'lg')})
return
}
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
