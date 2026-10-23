import{h,icon,toast}from'./util.js'
const PICK=['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4']
const SEG=300000,MAXSEG=24
export function recorderButton(onFile){
const btn=h('button',{type:'button',class:'ib',title:'Record a voice clip','aria-label':'Record a voice clip'},icon('mic'))
let mr=null,stream=null,timer=null,t0=0,files=[],ending=false,segStart=0,n=0,type=''
const reset=()=>{clearInterval(timer);timer=null;btn.classList.remove('rec');btn.title='Record a voice clip';if(stream)for(const t of stream.getTracks())t.stop();stream=null;mr=null;ending=false}
function seg(){
const chunks=[],rec=new MediaRecorder(stream,type?{mimeType:type,audioBitsPerSecond:24000}:{audioBitsPerSecond:24000})
mr=rec;segStart=Date.now()
rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)}
rec.onstop=()=>{
const mime=rec.mimeType||type||'audio/webm',ms=Date.now()-segStart
const blob=new Blob(chunks,{type:mime.split(';')[0]})
const ext=/mp4/.test(mime)?'m4a':/ogg/.test(mime)?'ogg':'weba'
if(blob.size&&ms>=800)files.push(new File([blob],'voice-clip-'+t0+'-'+String(++n).padStart(3,'0')+'.'+ext,{type:blob.type}))
if(ending||n>=MAXSEG){
const out=files;reset();files=[]
if(!out.length){toast('That clip was too short','err');return}
onFile(out);return
}
seg()
}
rec.start(1000)
}
const finish=()=>{ending=true;if(mr&&mr.state!=='inactive')mr.stop()}
btn.addEventListener('click',async()=>{
if(mr){finish();return}
if(!navigator.mediaDevices||!window.MediaRecorder){toast('Voice clips are not supported in this browser','err');return}
try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}})}catch{toast('Allow microphone access to record','err');return}
type=PICK.find(t=>MediaRecorder.isTypeSupported(t))||''
files=[];n=0;ending=false;t0=Date.now()
seg()
btn.classList.add('rec')
timer=setInterval(()=>{
const s=Math.floor((Date.now()-t0)/1000)
btn.title='Recording '+Math.floor(s/60)+':'+String(s%60).padStart(2,'0')+' - click to stop'
if(mr&&mr.state==='recording'&&Date.now()-segStart>=SEG)mr.stop()
},500)
})
return btn
}
