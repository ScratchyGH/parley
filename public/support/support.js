const $=s=>document.querySelector(s)
const KEY='parley.tickets'
const post=async(p,b)=>{const r=await fetch(p,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||d.message||'Something went wrong');return d}
const fd=f=>Object.fromEntries(new FormData(f))
const mk=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!==undefined)e.textContent=x;return e}
const saved=()=>{try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch{return[]}}
const store=a=>{try{localStorage.setItem(KEY,JSON.stringify(a.slice(0,30)))}catch{}}
const remember=t=>{const a=saved().filter(x=>x.id!==t.id);a.unshift(t);store(a);drawMine()}
let cur=null
function drawMine(){
const a=saved(),box=$('#minelist')
$('#mine').hidden=!a.length
box.textContent=''
for(const t of a){
const row=mk('div','trow')
const b=mk('button','lnk',t.id+' · '+(t.kind||'ticket')+' · '+new Date(t.at).toLocaleDateString())
b.type='button'
b.onclick=()=>open(t.id,t.key)
const x=mk('button','lnk dim','Forget')
x.type='button'
x.onclick=()=>{store(saved().filter(y=>y.id!==t.id));drawMine()}
row.append(b,x)
box.append(row)
}
}
function draw(d){
$('#view').hidden=false
$('#vh').textContent='Ticket '+d.id+' · '+d.status
const th=$('#thread')
th.textContent=''
for(const m of d.thread){
const e=mk('div','msg '+(m.from==='staff'?'staff':'you'))
e.append(mk('b','',m.from==='staff'?'Parley support':'You'),mk('span','dim',' '+new Date(m.at).toLocaleString()),mk('p','',m.text))
th.append(e)
}
$('#fu').hidden=d.status==='closed'
$('#view').scrollIntoView()
}
async function open(id,key){
try{const d=await post('/api/support/status',{id,key});cur={id,key};remember({id,key,kind:d.kind,at:d.at});draw(d)}
catch(x){alert(x.message)}
}
$('#f').addEventListener('submit',async e=>{
e.preventDefault()
const b=e.target.querySelector('button'),er=$('#err')
er.textContent='';b.disabled=true
try{const body=fd(e.target),d=await post('/api/support',body);remember({id:d.id,key:d.key,kind:body.kind,at:Date.now()});$('#tk').textContent='Ticket '+d.id+'\nKey '+d.key;$('#tk').style.whiteSpace='pre';$('#done').hidden=false;e.target.hidden=true;$('#tips').hidden=true;$('#done').scrollIntoView()}
catch(x){er.textContent=x.message;b.disabled=false}
})
$('#s').addEventListener('submit',async e=>{
e.preventDefault()
const v=fd(e.target)
await open(v.id.trim(),v.key.trim())
})
$('#fu').addEventListener('submit',async e=>{
e.preventDefault()
$('#ferr').textContent=''
if(!cur)return
try{const d=await post('/api/support/followup',{...cur,message:fd(e.target).message});e.target.reset();draw(d)}
catch(x){$('#ferr').textContent=x.message}
})
async function staff(){
try{
const r=await fetch('/api/admin/support',{credentials:'same-origin'})
if(!r.ok)return
const d=await r.json()
$('#staff').hidden=false
const q=$('#queue')
q.textContent=''
if(!d.tickets.length)q.append(mk('p','dim','No tickets'))
for(const t of d.tickets){
const e=mk('div','tk')
e.append(mk('b','',t.id+' · '+t.kind+' · '+t.status+(t.user?' · @'+t.user:'')),mk('div','dim',(t.contact||'no contact')+' · '+new Date(t.at).toLocaleString()))
for(const m of t.thread){const x=mk('div','msg '+(m.from==='staff'?'staff':'you'));x.append(mk('b','',m.from==='staff'?'Staff':'Person'),mk('p','',m.text));e.append(x)}
const ta=mk('textarea');ta.rows=2;ta.maxLength=1500;ta.placeholder='Reply'
const go=mk('button','','Reply');go.type='button'
const cl=mk('button','dim','Close');cl.type='button'
const act=async st=>{try{await post('/api/admin/support/'+t.id,{reply:ta.value,status:st});staff()}catch(x){alert(x.message)}}
go.onclick=()=>act()
cl.onclick=()=>act('closed')
e.append(ta,go,cl)
q.append(e)
}
}catch{}
}
drawMine()
staff()
