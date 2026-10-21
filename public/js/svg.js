const NS='http://www.w3.org/2000/svg'
export const sv=(tag,attrs,...kids)=>{
const e=document.createElementNS(NS,tag)
if(attrs)for(const[k,v]of Object.entries(attrs))if(v!=null)e.setAttribute(k,v)
for(const k of kids.flat())if(k)e.append(k)
return e
}
export const svg=(size,vb,...kids)=>sv('svg',{width:size,height:size,viewBox:vb,'aria-hidden':'true'},...kids)
const grad=(id,a,b)=>sv('linearGradient',{id,x1:'0',y1:'0',x2:'1',y2:'1'},sv('stop',{offset:'0','stop-color':a}),sv('stop',{offset:'1','stop-color':b}))
export function expLogo(size=88){
const piece=(id,rot)=>sv('path',{d:'M48 8 C58 8 66 16 70 28 L56 46 L40 46 L26 28 C30 16 38 8 48 8 Z',fill:'url(#'+id+')',transform:'rotate('+rot+' 48 52)'})
return svg(size,'0 0 96 96',
sv('defs',null,grad('xa','#fb7185','#be123c'),grad('xb','#2dd4bf','#0f766e'),grad('xc','#fbbf24','#b45309')),
piece('xa',0),piece('xb',120),piece('xc',240),
sv('circle',{cx:'48',cy:'52',r:'9',fill:'#0f1115',stroke:'#fff','stroke-opacity':'.85','stroke-width':'2.5'}),
sv('circle',{cx:'48',cy:'52',r:'3',fill:'#fff'}))
}
export function providerLogo(id,size=34){
if(id==='pollinations'){
const pet=r=>sv('ellipse',{cx:'20',cy:'11',rx:'4.6',ry:'8',fill:'#f9a8d4',transform:'rotate('+r+' 20 20)'})
return svg(size,'0 0 40 40',pet(0),pet(72),pet(144),pet(216),pet(288),sv('circle',{cx:'20',cy:'20',r:'4.5',fill:'#facc15'}))
}
if(id==='chat')return svg(size,'0 0 40 40',sv('path',{d:'M6 8h28a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H19l-8 7v-7H6a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3z',fill:'#38bdf8'}),sv('path',{d:'M11 15h18M11 21h11',stroke:'#082f49','stroke-width':'3','stroke-linecap':'round',fill:'none'}))
if(id==='openrouter')return svg(size,'0 0 40 40',sv('path',{d:'M4 24h8c5 0 6-8 12-8h8M4 16h8c5 0 6 8 12 8h8',stroke:'#a78bfa','stroke-width':'3.4','stroke-linecap':'round',fill:'none'}),sv('path',{d:'M29 10l6 6-6 6M29 18l6 6-6 6',stroke:'#a78bfa','stroke-width':'3.4','stroke-linecap':'round','stroke-linejoin':'round',fill:'none'}))
return svg(size,'0 0 40 40',sv('rect',{x:'5',y:'8',width:'30',height:'24',rx:'5',fill:'none',stroke:'#94a3b8','stroke-width':'3'}),sv('path',{d:'M12 16l5 4-5 4M21 25h8',stroke:'#94a3b8','stroke-width':'3','stroke-linecap':'round','stroke-linejoin':'round',fill:'none'}))
}
