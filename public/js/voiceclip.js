import{h,icon,toast}from'./util.js'
const PICK=['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4']
export function recorderButton(onFile){
const btn=h('button',{type:'button',class:'ib',title:'Record a voice clip','aria-label':'Record a voice clip'},icon('mic'))
let mr=null,chunks=[],stream=null,timer=null,t0=0
const reset=()=>{clearInterval(timer);timer=null;btn.classList.remove('rec');btn.title='Record a voice clip';if(stream)for(const t of stream.getTracks())t.stop();stream=null;mr=null}
const stop=()=>{if(mr&&mr.state!=='inactive')mr.stop()}
btn.addEventListener('click',async()=>{
if(mr){stop();return}
if(!navigator.mediaDevices||!window.MediaRecorder){toast('Voice clips are not supported in this browser','err');return}
try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}})}catch{toast('Allow microphone access to record','err');return}
const type=PICK.find(t=>MediaRecorder.isTypeSupported(t))||''
mr=new MediaRecorder(stream,type?{mimeType:type,audioBitsPerSecond:32000}:{audioBitsPerSecond:32000})
chunks=[]
mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)}
mr.onstop=()=>{
const ms=Date.now()-t0,mime=(mr&&mr.mimeType)||type||'audio/webm'
const blob=new Blob(chunks,{type:mime.split(';')[0]})
reset()
if(ms<800||!blob.size){toast('That clip was too short','err');return}
const ext=/mp4/.test(mime)?'m4a':/ogg/.test(mime)?'ogg':'weba'
onFile([new File([blob],'voice-clip-'+Date.now()+'.'+ext,{type:blob.type})])
}
t0=Date.now()
mr.start(250)
btn.classList.add('rec')
btn.title='Stop and attach (max 2 minutes)'
timer=setInterval(()=>{
const s=Math.floor((Date.now()-t0)/1000)
btn.title='Recording '+Math.floor(s/60)+':'+String(s%60).padStart(2,'0')+' - click to stop'
if(s>=120)stop()
},500)
})
return btn
}
