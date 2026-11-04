const $=s=>document.querySelector(s)
const post=async(p,b)=>{const r=await fetch(p,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||d.message||'Something went wrong');return d}
const fd=f=>Object.fromEntries(new FormData(f))
$('#f').addEventListener('submit',async e=>{
e.preventDefault()
const b=e.target.querySelector('button'),er=$('#err')
er.textContent='';b.disabled=true
try{const d=await post('/api/support',fd(e.target));$('#tk').textContent='Ticket '+d.id+'\nKey '+d.key;$('#tk').style.whiteSpace='pre';$('#done').hidden=false;e.target.hidden=true;$('#tips').hidden=true;$('#done').scrollIntoView()}
catch(x){er.textContent=x.message;b.disabled=false}
})
$('#s').addEventListener('submit',async e=>{
e.preventDefault()
const r=$('#res')
try{const d=await post('/api/support/status',fd(e.target));r.textContent='Status: '+d.status+(d.reply?'\n\n'+d.reply:'\n\nNo reply yet.')}
catch(x){r.textContent=x.message}
})
