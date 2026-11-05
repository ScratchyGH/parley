const NS='http://www.w3.org/2000/svg'
export const sv=(t,a,...k)=>{const e=document.createElementNS(NS,t);for(const[n,v]of Object.entries(a||{}))e.setAttribute(n,v);for(const c of k)e.append(c);return e}
const COL={fox:['#ff8a3d','#fff'],owl:['#9a7bff','#ffe9b8'],cat:['#6c7a99','#fff'],bear:['#b9774a','#f3d3b0'],frog:['#3ed6a0','#e6fff5'],panda:['#f2f2f2','#fff'],whale:['#3aa0ff','#e0f2ff'],bunny:['#ff9ec4','#fff']}
export const AVS=Object.keys(COL)
export function face(name,size){
const[c,f]=COL[name]||COL.fox
const g=[]
const ear=x=>name==='bunny'?sv('ellipse',{cx:x,cy:14,rx:9,ry:20,fill:c}):name==='owl'||name==='cat'||name==='fox'?sv('path',{d:'M'+(x-12)+' 36 L'+x+' 4 L'+(x+12)+' 36Z',fill:c}):sv('circle',{cx:x,cy:20,r:name==='whale'?0:12,fill:name==='panda'?'#222':c})
g.push(ear(24),ear(76))
g.push(sv('circle',{cx:50,cy:56,r:38,fill:c}))
g.push(sv('ellipse',{cx:50,cy:66,rx:24,ry:18,fill:f}))
if(name==='panda')g.push(sv('ellipse',{cx:36,cy:50,rx:9,ry:12,fill:'#222'}),sv('ellipse',{cx:64,cy:50,rx:9,ry:12,fill:'#222'}))
for(const x of[36,64])g.push(sv('circle',{cx:x,cy:50,r:6,fill:'#fff'}),sv('circle',{cx:x,cy:51,r:3.4,fill:'#17254d'}))
g.push(sv('path',{d:'M42 66 Q50 74 58 66',stroke:'#17254d','stroke-width':3,fill:'none','stroke-linecap':'round'}))
if(name==='fox'||name==='cat')g.push(sv('circle',{cx:50,cy:62,r:3.5,fill:'#17254d'}))
return sv('svg',{viewBox:'0 0 100 100',width:size||100,height:size||100,'aria-hidden':'true'},...g)
}
const IC={chat:'M4 6a3 3 0 013-3h10a3 3 0 013 3v8a3 3 0 01-3 3h-5l-5 4v-4a3 3 0 01-3-3z',users:'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 20c0-3.3 3-5.5 7-5.5s7 2.2 7 5.5M17 4.5a3.5 3.5 0 010 6.5M19 14.8c1.8.7 3 2.2 3 4.2',plus:'M12 5v14M5 12h14',back:'M15 5l-7 7 7 7',copy:'M9 9h10v10H9zM5 15V5h10',game:'M6 6h12a4 4 0 014 4v4a3 3 0 01-5.2 2L14 14h-4l-1.8 2A3 3 0 013 14v-4a4 4 0 014-4zM8 9v4M6 11h4M16 11h.01M18.5 9.5h.01',shop:'M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2',server:'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',send:'M4 12l16-8-6 16-3-7z',check:'M5 12l5 5 9-10',x:'M6 6l12 12M18 6L6 18',hash:'M5 9h14M5 15h14M10 4L8 20M16 4l-2 16',more:'M5 12h.01M12 12h.01M19 12h.01'}
export const ic=(n,s)=>sv('svg',{viewBox:'0 0 24 24',width:s||22,height:s||22,fill:'none',stroke:'currentColor','stroke-width':2.4,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'},sv('path',{d:IC[n]}))
export const coin=s=>sv('svg',{viewBox:'0 0 24 24',width:s||18,height:s||18,'aria-hidden':'true'},sv('circle',{cx:12,cy:12,r:10.5,fill:'#ffd23f',stroke:'#15123b','stroke-width':2}),sv('path',{d:'M9.5 17V7h3.2a2.8 2.8 0 010 5.6H9.5',fill:'none',stroke:'#15123b','stroke-width':2.2,'stroke-linecap':'round','stroke-linejoin':'round'}))
const parse=e=>{if(!e)return{};if(typeof e==='string'){try{return JSON.parse(e)}catch{return{}}}return e}
export function pav(name,eq,cls){
const q=parse(eq)
const e=document.createElement('span')
e.className='pav'+(q.frame?' '+q.frame:'')+(q.bg?' '+q.bg:'')+(cls?' '+cls:'')
e.append(face(name))
return e
}
export const ncls=eq=>{const q=parse(eq);return q.name||''}
