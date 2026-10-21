const norm=g=>({nodes:Array.isArray(g?.nodes)?g.nodes:[],edges:Array.isArray(g?.edges)?g.edges:[]})
const ek=e=>e.f+':'+e.o
const nmap=g=>new Map(g.nodes.map(n=>[n.id,n]))
const emap=g=>new Map(g.edges.map(e=>[ek(e),e.t]))
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b)
export function diffSummary(a,b){
a=norm(a);b=norm(b)
const A=nmap(a),B=nmap(b)
let add=0,del=0,chg=0
for(const[id,n]of B){if(!A.has(id))add++;else if(!same(A.get(id),n))chg++}
for(const id of A.keys())if(!B.has(id))del++
const EA=emap(a),EB=emap(b)
let wires=0
for(const[k,t]of EB)if(EA.get(k)!==t)wires++
for(const k of EA.keys())if(!EB.has(k))wires++
const parts=[]
if(add)parts.push(add+' added')
if(del)parts.push(del+' removed')
if(chg)parts.push(chg+' changed')
if(wires)parts.push(wires+' connection'+(wires===1?'':'s'))
return parts.length?parts.join(', '):'No changes'
}
export function mergeGraphs(base,mine,theirs,pick={}){
base=norm(base);mine=norm(mine);theirs=norm(theirs)
const B=nmap(base),M=nmap(mine),T=nmap(theirs)
const conflicts=[]
const nodes=[]
const ids=[...new Set([...B.keys(),...M.keys(),...T.keys()])]
for(const id of ids){
const b=B.get(id),m=M.get(id),t=T.get(id)
let out
if(same(m,t))out=m
else if(same(m,b))out=t
else if(same(t,b))out=m
else{
const p=pick[id]
if(!p)conflicts.push({kind:'node',id,base:b,mine:m,theirs:t})
out=p==='theirs'?t:m
}
if(out)nodes.push(out)
}
const alive=new Set(nodes.map(n=>n.id))
const EB=emap(base),EM=emap(mine),ET=emap(theirs)
const edges=[]
for(const k of new Set([...EB.keys(),...EM.keys(),...ET.keys()])){
const b=EB.get(k),m=EM.get(k),t=ET.get(k)
let out
if(m===t)out=m
else if(m===b)out=t
else if(t===b)out=m
else{
const p=pick['e:'+k]
if(!p)conflicts.push({kind:'edge',id:'e:'+k,base:b,mine:m,theirs:t})
out=p==='theirs'?t:m
}
const[f,o]=k.split(':')
if(out&&alive.has(f)&&alive.has(out))edges.push({f,o,t:out})
}
return{graph:{nodes,edges},conflicts}
}
