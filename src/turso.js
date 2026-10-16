const b64=u8=>{let s='';for(let i=0;i<u8.length;i+=32768)s+=String.fromCharCode.apply(null,u8.subarray(i,i+32768));return btoa(s)}
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0))
function arg(v){
if(v===null||v===undefined)return{type:'null'}
if(typeof v==='boolean')return{type:'integer',value:v?'1':'0'}
if(typeof v==='number')return Number.isInteger(v)?{type:'integer',value:String(v)}:{type:'float',value:v}
if(typeof v==='bigint')return{type:'integer',value:String(v)}
if(v instanceof ArrayBuffer)return{type:'blob',base64:b64(new Uint8Array(v))}
if(ArrayBuffer.isView(v))return{type:'blob',base64:b64(new Uint8Array(v.buffer,v.byteOffset,v.byteLength))}
return{type:'text',value:String(v)}
}
function val(c){
if(c.type==='null')return null
if(c.type==='integer')return Number(c.value)
if(c.type==='float')return Number(c.value)
if(c.type==='blob')return unb64(c.base64).buffer
return c.value
}
function rows(r){
const names=r.cols.map(c=>c.name)
return r.rows.map(row=>{const o={};for(let i=0;i<names.length;i++)o[names[i]]=val(row[i]);return o})
}
export function tursoDb(env){
const base=env.TURSO_URL.replace(/^libsql:\/\//,'https://').replace(/\/$/,'')
async function pipe(reqs){
const res=await fetch(base+'/v2/pipeline',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+env.TURSO_TOKEN},body:JSON.stringify({requests:[...reqs,{type:'close'}]})})
if(!res.ok)throw new Error('turso '+res.status+' '+(await res.text()).slice(0,200))
const j=await res.json()
return j.results
}
function fault(r){
const m=r.error&&r.error.message||'turso error'
return new Error(m)
}
async function one(sql,args){
const out=await pipe([{type:'execute',stmt:{sql,args:args.map(arg),want_rows:true}}])
if(out[0].type!=='ok')throw fault(out[0])
return out[0].response.result
}
function stmt(sql,args=[]){
const o={
bind(...a){return stmt(sql,a)},
sql,args,
async first(col){
const r=rows(await one(sql,args))[0]
if(!r)return null
return col?r[col]:r
},
async all(){
const r=await one(sql,args)
return{results:rows(r),success:true,meta:{changes:r.affected_row_count||0,last_row_id:r.last_insert_rowid?Number(r.last_insert_rowid):0,rows_read:r.rows_read||0,rows_written:r.rows_written||0}}
},
async run(){
const r=await one(sql,args)
return{results:[],success:true,meta:{changes:r.affected_row_count||0,last_row_id:r.last_insert_rowid?Number(r.last_insert_rowid):0}}
},
async raw(){
const r=await one(sql,args)
return r.rows.map(row=>row.map(val))
}
}
return o
}
return{
prepare:sql=>stmt(sql),
async exec(sql){
const out=await pipe([{type:'sequence',sql}])
if(out[0].type!=='ok')throw fault(out[0])
return{count:1,duration:0}
},
async batch(list){
if(!list.length)return[]
const steps=[{stmt:{sql:'BEGIN',args:[]}}]
list.forEach((s,i)=>steps.push({condition:{type:'ok',step:i},stmt:{sql:s.sql,args:s.args.map(arg),want_rows:true}}))
steps.push({condition:{type:'ok',step:list.length},stmt:{sql:'COMMIT',args:[]}})
steps.push({condition:{type:'not',cond:{type:'ok',step:list.length+1}},stmt:{sql:'ROLLBACK',args:[]}})
const out=await pipe([{type:'batch',batch:{steps}}])
if(out[0].type!=='ok')throw fault(out[0])
const r=out[0].response.result
for(let i=1;i<=list.length;i++)if(r.step_errors&&r.step_errors[i])throw new Error(r.step_errors[i].message)
return list.map((s,i)=>{const x=r.step_results[i+1];return{results:rows(x),success:true,meta:{changes:x.affected_row_count||0,last_row_id:x.last_insert_rowid?Number(x.last_insert_rowid):0}}})
}
}
}
