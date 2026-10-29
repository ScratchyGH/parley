const MORSE={a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.','.':'.-.-.-',',':'--..--','?':'..--..','!':'-.-.--','/':'-..-.','@':'.--.-.','-':'-....-'}
const UNMORSE=Object.fromEntries(Object.entries(MORSE).map(([k,v])=>[v,k]))
const NATO={a:'Alfa',b:'Bravo',c:'Charlie',d:'Delta',e:'Echo',f:'Foxtrot',g:'Golf',h:'Hotel',i:'India',j:'Juliett',k:'Kilo',l:'Lima',m:'Mike',n:'November',o:'Oscar',p:'Papa',q:'Quebec',r:'Romeo',s:'Sierra',t:'Tango',u:'Uniform',v:'Victor',w:'Whiskey',x:'X-ray',y:'Yankee',z:'Zulu',0:'Zero',1:'One',2:'Two',3:'Three',4:'Four',5:'Five',6:'Six',7:'Seven',8:'Eight',9:'Nine'}
const ROM=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]
export const morse=(s,mode)=>mode==='decode'?s.trim().split(/\s*\/\s*|\s{3,}/).map(w=>w.trim().split(/\s+/).map(c=>UNMORSE[c]||'').join('')).join(' '):s.toLowerCase().split('').map(c=>c===' '?'/':MORSE[c]||'').filter(Boolean).join(' ')
export const nato=s=>s.toLowerCase().split('').map(c=>NATO[c]||'').filter(Boolean).join(' ')
export const roman=(s,mode)=>{
if(mode==='tonumber'){const t=s.trim().toUpperCase();if(!/^[MDCLXVI]{1,15}$/.test(t))return'';let n=0;for(let i=0;i<t.length;i++){const a=ROM.find(r=>r[1]===t[i])[0],b=(ROM.find(r=>r[1]===t[i+1])||[0])[0];n+=a<b?-a:a}return String(n)}
let n=Math.floor(Number(s));if(!Number.isFinite(n)||n<1||n>3999)return''
let o='';for(const[v,r]of ROM)while(n>=v){o+=r;n-=v}
return o
}
export const caesar=(s,k)=>{const n=((Math.round(Number(k))||0)%26+26)%26;return s.replace(/[a-z]/gi,c=>{const b=c<='Z'?65:97;return String.fromCharCode((c.charCodeAt(0)-b+n)%26+b)})}
export const binary=(s,mode)=>{
if(mode==='decode'){const b=s.trim().split(/\s+/).filter(x=>/^[01]{8}$/.test(x)).map(x=>parseInt(x,2));try{return new TextDecoder('utf-8',{fatal:true}).decode(new Uint8Array(b))}catch{return''}}
return[...new TextEncoder().encode(s)].map(x=>x.toString(2).padStart(8,'0')).join(' ')
}
export function convert(v,from,to,UN){
const x=Number(v),a=UN[from],b=UN[to]
if(!Number.isFinite(x)||!a||!b||a[0]!==b[0])return''
if(a[0]==='t'){const k=from==='c'?x+273.15:from==='f'?(x-32)*5/9+273.15:x;const r=to==='c'?k-273.15:to==='f'?(k-273.15)*9/5+32:k;return String(Math.round(r*1e4)/1e4)}
const r=x*a[1]/b[1]
return String(Math.round(r*1e6)/1e6)
}
export function color(s){
const t=s.trim().replace(/^#/,'')
let r,g,b
if(/^[0-9a-f]{3}$/i.test(t)){[r,g,b]=t.split('').map(c=>parseInt(c+c,16))}
else if(/^[0-9a-f]{6}$/i.test(t)){r=parseInt(t.slice(0,2),16);g=parseInt(t.slice(2,4),16);b=parseInt(t.slice(4,6),16)}
else{const m=t.match(/^(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})$/);if(!m)return null;[r,g,b]=[m[1],m[2],m[3]].map(Number);if(r>255||g>255||b>255)return null}
const R=r/255,G=g/255,B=b/255,mx=Math.max(R,G,B),mn=Math.min(R,G,B),l=(mx+mn)/2,d=mx-mn
let h=0,sa=0
if(d){sa=d/(1-Math.abs(2*l-1));h=mx===R?((G-B)/d+(G<B?6:0)):mx===G?(B-R)/d+2:(R-G)/d+4;h*=60}
return{hex:'#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase(),rgb:r+','+g+','+b,hsl:Math.round(h)+','+Math.round(sa*100)+'%,'+Math.round(l*100)+'%'}
}
export function moon(at){
const age=(((at-Date.UTC(2000,0,6,18,14))/86400000)%29.530588853+29.530588853)%29.530588853
const n=age<1.85?'New Moon':age<5.54?'Waxing Crescent':age<9.22?'First Quarter':age<12.91?'Waxing Gibbous':age<16.61?'Full Moon':age<20.3?'Waning Gibbous':age<24?'Last Quarter':age<27.7?'Waning Crescent':'New Moon'
return{name:n,illum:Math.round((1-Math.cos(2*Math.PI*age/29.530588853))/2*100),age:age.toFixed(1)}
}
export function haversine(a,b,c,d,unit){
const r=x=>x*Math.PI/180,R=unit==='mi'?3958.8:6371,dl=r(c-a),dn=r(d-b)
const q=Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dn/2)**2
return Math.round(2*R*Math.asin(Math.sqrt(q))*10)/10
}
export async function hash(algo,s){
const d=await crypto.subtle.digest({sha256:'SHA-256',sha1:'SHA-1',sha512:'SHA-512'}[algo]||'SHA-256',new TextEncoder().encode(s))
return[...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,128)
}
export function style(s,k){
const t=s.slice(0,1800)
switch(k){
case'bold':return'**'+t+'**'
case'italic':return'*'+t+'*'
case'bolditalic':return'***'+t+'***'
case'underline':return'__'+t+'__'
case'strike':return'~~'+t+'~~'
case'spoiler':return'||'+t+'||'
case'code':return'`'+t.replace(/`/g,"'")+'`'
case'codeblock':return'```\n'+t.replace(/```/g,"'''")+'\n```'
case'quote':return t.split('\n').map(x=>'> '+x).join('\n')
case'h1':return'# '+t
case'h2':return'## '+t
case'h3':return'### '+t
case'subtext':return'-# '+t
case'nolink':return t.replace(/https?:\/\/[^\s<>]+/g,u=>'<'+u+'>')
}
return t
}
export function flake(s){
let id
try{id=BigInt(String(s).trim())}catch{return null}
if(id<0n||id>(1n<<63n))return null
const ms=Number((id>>22n)+1420070400000n)
return{unix:Math.floor(ms/1000),date:new Date(ms).toISOString().slice(0,10),days:Math.floor((Date.now()-ms)/86400000),avatar:'https://cdn.discordapp.com/embed/avatars/'+Number((id>>22n)%6n)+'.png'}
}
