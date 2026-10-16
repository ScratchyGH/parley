import{h,mount,icon,GET,POST,DEL,dialog,toast,fail,debounce}from'./util.js'

const media=u=>'/api/gifs/media?u='+encodeURIComponent(u)
let status=null
const ready=async()=>status||(status=await GET('/api/gifs/status'))

export async function importGif(item,kind,room){
const t=toast('Saving GIF…')
try{return await POST('/api/gifs/import',{url:item.url,kind,room})}finally{t.remove()}
}

export function gifPicker({title,query,onPick}){
let tab=query?'search':'trending'
let pos='',busy=false,gen=0
const grid=h('div',{class:'gifgrid'})
const note=h('div',{class:'hint',style:{textAlign:'center',margin:'12px 0'}})
const more=h('button',{class:'btn',type:'button',hidden:true},'Show more')
const q=h('input',{class:'inp',type:'search',maxLength:60,placeholder:'Search for a GIF','aria-label':'Search for a GIF',value:query||''})
const tabs=h('div',{class:'tabs'})
const favs=new Map()
let close=()=>{}
const cell=g=>{
const star=h('button',{type:'button',class:'gstar'+(favs.has(g.id)?' on':''),title:favs.has(g.id)?'Remove from saved':'Save for later','aria-label':favs.has(g.id)?'Remove from saved GIFs':'Save this GIF',on:{click:async e=>{
e.stopPropagation()
try{
if(favs.has(g.id)){await DEL('/api/gifs/favs/'+encodeURIComponent(g.id));favs.delete(g.id)}
else{await POST('/api/gifs/favs',g);favs.set(g.id,g)}
star.classList.toggle('on',favs.has(g.id))
if(tab==='saved')run()
}catch(x){fail(x)}
}}},icon('star','s'))
return h('div',{class:'gif'},h('button',{type:'button',class:'gpick',title:g.title||'GIF','aria-label':g.title||'GIF',on:{click:()=>{close();onPick(g)}}},h('img',{src:media(g.preview),alt:g.title||'',loading:'lazy',decoding:'async'})),star)
}
async function run(append){
const my=++gen
busy=true
more.hidden=true
if(!append){pos='';mount(grid);note.textContent='Loading…'}
try{
let items=[]
if(tab==='saved'){
items=(await GET('/api/gifs/favs')).results
favs.clear()
for(const g of items)favs.set(g.id,g)
pos=''
}else{
const st=await ready()
if(!st.enabled){if(my===gen)note.textContent='GIF search is not set up on this server. '+st.note;busy=false;return}
const d=await GET('/api/gifs/search?q='+encodeURIComponent(tab==='search'?q.value.trim():'')+(pos?'&pos='+encodeURIComponent(pos):''))
items=d.results
pos=d.next||''
}
if(my!==gen)return
for(const g of items)grid.append(cell(g))
note.textContent=grid.children.length?'':(tab==='saved'?'No saved GIFs yet. Press the star on any GIF to keep it here.':'No GIFs found.')
more.hidden=!pos
}catch(e){if(my===gen)note.textContent=e.message}
busy=false
}
const drawTabs=()=>mount(tabs,[['trending','Trending'],['search','Search'],['saved','Saved']].map(([k,l])=>h('button',{type:'button',class:tab===k?'on':'',on:{click:()=>{tab=k;drawTabs();if(k==='search')q.focus();run()}}},l)))
q.addEventListener('input',debounce(()=>{if(tab!=='search'){tab='search';drawTabs()}run()},350))
more.addEventListener('click',()=>{if(!busy)run(true)})
GET('/api/gifs/favs').then(d=>{for(const g of d.results)favs.set(g.id,g)}).catch(()=>{})
const d=dialog(title||'Choose a GIF',h('div',{class:'bd gifbd'},tabs,q,grid,note,h('div',{class:'row',style:{justifyContent:'center'}},more)),{cls:'gifdlg'})
close=d.close
drawTabs()
run()
return d
}
