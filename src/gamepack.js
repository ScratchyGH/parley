import{fail,now,newId,body,limit}from'./util.js'
import{seasonWindow}from'./seasons.js'
const PACKS={hollow:{name:'Haunted Hollow games',price:25,season:'hollow',desc:'Gourd Rush, Terror Night, Hollow Siege and Gourd Rush: Teamup. Yours to play in the app any time, and a single file you can download and play offline.',files:['/js/rush.js','/js/rushart.js','/js/rushterror.js','/g3d/doom3d.js'],css:['/rush.css']}}
const owned=(env,uid,id)=>env.DB.prepare('select 1 x from game_unlocks where user_id=? and pack=?').bind(uid,id).first()
const RUN=`const S=JSON.parse(document.getElementById('s').textContent),U={},A=document.getElementById('a')
const mk=k=>{if(U[k])return U[k];let t=S[k];t=t.replace(/((?:from|import)\\s*\\(?\\s*)(['"])([^'"]+)\\2/g,(m,a,q,p)=>{if(p[0]!=='.'&&p[0]!=='/')return m;const key=new URL(p,'http://x'+k).pathname;return S[key]?a+q+mk(key)+q:m});return U[k]=URL.createObjectURL(new Blob([t],{type:'text/javascript'}))}
const run=async(kind,n)=>{const root=document.createElement('div');root.className='g';const box=document.createElement('div');box.className='gb';const x=document.createElement('button');x.textContent='Leave';let stop;x.onclick=()=>{try{stop&&stop()}catch{};root.remove()};root.append(box,x);document.body.append(root)
if(kind==='night'){const m=await import(mk('/g3d/doom3d.js'));stop=m.playNight(n,box,()=>setTimeout(()=>root.remove(),800))}else{const m=await import(mk('/js/rush.js'));stop=m.playRush(box,()=>setTimeout(()=>root.remove(),600),kind)}}
const add=(t,f)=>{const b=document.createElement('button');b.textContent=t;b.onclick=f;A.append(b)}
add('Gourd Rush',()=>run('rush'));add('Terror Night',()=>run('terror'));for(let i=1;i<=5;i++)add('Hollow Siege, night '+i,()=>run('night',i))`
export default function(r){
r.add('GET','/api/games/packs',async c=>{
const u=await c.env.DB.prepare('select pars from users where id=?').bind(c.user.id).first()
const packs=[]
for(const[id,p]of Object.entries(PACKS)){
const w=seasonWindow(p.season)
packs.push({id,name:p.name,price:p.price,desc:p.desc,owned:!!(await owned(c.env,c.user.id,id)),live:!!(w&&w.live)})
}
return{pars:u?.pars||0,packs}
})
r.add('POST','/api/games/buy',async c=>{
limit('gp:buy:'+c.user.id,10,60000)
const b=await body(c.req,200)
const id=String(b.pack||'')
const p=PACKS[id]
if(!p)fail(404,'No such game pack')
if(await owned(c.env,c.user.id,id))fail(409,'You already own this pack')
const t=now()
await c.env.DB.batch([
c.env.DB.prepare('insert into game_unlocks(user_id,pack,created_at) select ?1,?2,?3 where (select pars from users where id=?1)>=?4').bind(c.user.id,id,t,p.price),
c.env.DB.prepare('update users set pars=pars-?2 where id=?1 and pars>=?2 and exists(select 1 from game_unlocks where user_id=?1 and pack=?3 and created_at=?4)').bind(c.user.id,p.price,id,t),
c.env.DB.prepare('insert into par_tx(id,user_id,delta,kind,ref,note,created_at) select ?1,?2,?3,?4,?5,?6,?7 where exists(select 1 from game_unlocks where user_id=?2 and pack=?5 and created_at=?7)').bind(newId('pt'),c.user.id,-p.price,'game_pack',id,p.name,t)
])
if(!(await owned(c.env,c.user.id,id)))fail(402,'You need '+p.price+' Pars to unlock this pack')
const u=await c.env.DB.prepare('select pars from users where id=?').bind(c.user.id).first()
return{ok:true,pars:u?.pars||0}
})
r.add('GET','/api/games/download',async c=>{
const id=String(c.url.searchParams.get('pack')||'')
const p=PACKS[id]
if(!p)fail(404,'No such game pack')
if(!(await owned(c.env,c.user.id,id)))fail(403,'Unlock this pack first')
limit('gp:dl:'+c.user.id,6,60000)
const get=async path=>{const res=await c.env.ASSETS.fetch(new Request(c.url.origin+path));if(!res.ok)fail(502,'Could not read '+path);return res.text()}
const src={}
for(const f of p.files)src[f]=await get(f)
let css=''
for(const f of p.css)css+=await get(f)
const data=JSON.stringify(src).replace(/</g,'\\u003c')
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${p.name}</title><style>${css}
html,body{margin:0;background:#0c0913;color:#f1e6ff;font:16px system-ui,sans-serif;min-height:100%}main{max-width:520px;margin:0 auto;padding:40px 20px}h1{margin:0 0 6px}p{color:#bdb2dc}#a{display:grid;gap:10px;margin-top:20px}#a button,.g button{background:#2a1a3a;border:1px solid #5a3a7a;color:#fff;padding:14px;font:700 15px system-ui,sans-serif;cursor:pointer;border-radius:8px}#a button:hover{border-color:#ff9a2e}.g{position:fixed;inset:0;z-index:9;background:#020403}.gb{position:absolute;inset:0}.g>button{position:absolute;top:12px;right:12px;z-index:6;padding:8px 14px}</style></head><body><main><h1>${p.name}</h1><p>Offline copy. Unlocked with Parley Pars.</p><div id="a"></div></main><script id="s" type="application/json">${data}</script><script type="module">${RUN}</script></body></html>`
return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','content-disposition':'attachment; filename="parley-games-'+id+'.html"','cache-control':'private,no-store'}})
})
}
