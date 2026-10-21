import{h,GET,dialog,toast}from'./util.js'
import{providerLogo}from'./svg.js'

const KEY='parley:ai-provider'
const INFO=[
['pollinations','Pollinations','Free, no key'],
['chat','Ch.at','Free, no key'],
['openrouter','OpenRouter','Free models, key needed']
]
let meta=null
const last=()=>{try{return localStorage.getItem(KEY)||''}catch{return ''}}
const remember=v=>{try{localStorage.setItem(KEY,v)}catch{}}
function fall(el,done){
const r=el.getBoundingClientRect()
let y=0,vy=0,rot=0,x=0
const spin=(Math.random()<0.5?-1:1)*(0.7+Math.random()*0.5)
const tilt=18+Math.random()*10
el.style.transformOrigin='50% 100%'
let t0=performance.now()
const step=t=>{
const dt=Math.min(0.04,(t-t0)/1000)
t0=t
vy+=2600*dt
y+=vy*dt
rot=Math.min(tilt,rot+spin*220*dt*(1+y/400))
x+=spin*60*dt
el.style.transform=`translate(${x}px,${y}px) rotate(${spin<0?-Math.abs(rot):Math.abs(rot)}deg)`
if(r.top+y<innerHeight+200)requestAnimationFrame(step)
else done()
}
requestAnimationFrame(step)
}
export async function chooseProvider(){
if(!meta)meta=await GET('/api/ai/providers').catch(()=>({openrouter:{server_key:false}}))
return new Promise(resolve=>{
let sel=INFO.some(x=>x[0]===last())?last():'',settled=false
const key=h('input',{class:'inp',type:'password',autocomplete:'off',placeholder:'OpenRouter API key (used for this request only)'})
const model=h('input',{class:'inp',placeholder:'Model (optional)',maxLength:80})
const url=h('input',{class:'inp',placeholder:'Custom: https://example.com/v1',on:{input:()=>pick('custom')}})
const cmodel=h('input',{class:'inp',placeholder:'Custom model name',maxLength:80})
const ckey=h('input',{class:'inp',type:'password',autocomplete:'off',placeholder:'Custom API key (optional)'})
const extra=h('div',{class:'pc-extra'})
const cont=h('button',{class:'btn pri',disabled:true,on:{click:()=>finish(true)}},'Continue')
const boxes=INFO.map(([id,name,sub])=>h('button',{class:'pc-box',type:'button',role:'radio','aria-checked':'false',on:{click:()=>pick(id)}},providerLogo(id,38),h('b',null,name),h('small',null,sub)))
function pick(id){
sel=id
boxes.forEach((b,i)=>{const on=INFO[i][0]===id;b.classList.toggle('on',on);b.setAttribute('aria-checked',String(on))})
cwrap.classList.toggle('on',id==='custom')
extra.replaceChildren(...(id==='openrouter'?[meta.openrouter&&meta.openrouter.server_key?h('div',{class:'hint'},'This server has an OpenRouter key. Add your own below to use it instead.'):null,key,model]:id==='custom'?[cmodel,ckey]:id==='pollinations'||id==='chat'?[model]:[]).filter(Boolean))
cont.disabled=false
}
const cwrap=h('div',{class:'pc-custom'},h('span',{class:'pc-ico'},providerLogo('custom',24)),url)
const body=h('div',{class:'pc'},h('div',{class:'pc-row',role:'radiogroup','aria-label':'AI provider'},boxes),cwrap,extra,h('div',{class:'hint'},'Keys are sent with this request only and are never saved. Pollinations and Ch.at are free services run by third parties and can be slow or busy.'),h('div',{class:'row',style:{justifyContent:'flex-end',marginTop:'10px'}},h('button',{class:'btn',on:{click:()=>finish(false)}},'Nevermind'),cont))
const d=dialog('Provider Chooser',body,{sticky:true,onclose:()=>{if(!settled){settled=true;resolve(null)}}})
function finish(ok){
if(settled)return
if(!ok){
settled=true
d.el.style.pointerEvents='none'
fall(d.el,()=>{d.close();resolve(null)})
return
}
const out={provider:sel}
if(sel==='openrouter'){if(key.value.trim())out.key=key.value.trim();if(model.value.trim())out.model=model.value.trim()}
else if(sel==='custom'){
if(!/^https:\/\//i.test(url.value.trim())){toast('Custom endpoints must start with https://','err');return}
if(!cmodel.value.trim()){toast('Enter a model name for your custom provider','err');return}
out.url=url.value.trim();out.model=cmodel.value.trim()
if(ckey.value.trim())out.key=ckey.value.trim()
}else if(model.value.trim())out.model=model.value.trim()
settled=true
remember(sel==='custom'?'':sel)
d.close()
resolve(out)
}
if(sel)pick(sel)
})
}
