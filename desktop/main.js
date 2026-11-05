const{app,BrowserWindow,shell,session,desktopCapturer,ipcMain}=require('electron')
if(process.platform==='linux'){app.commandLine.appendSwitch('enable-features','WebRTCPipeWireCapturer');app.commandLine.appendSwitch('ozone-platform-hint','auto');app.commandLine.appendSwitch('password-store','basic');app.commandLine.appendSwitch('disable-features','HardwareMediaKeyHandling')}
const U='https://parley.heavengtwashere.workers.dev/?web=1'
const O='https://parley.heavengtwashere.workers.dev'
if(!app.requestSingleInstanceLock())app.quit()
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))
const pick=(parent,sources)=>new Promise(res=>{
const p=new BrowserWindow({width:760,height:520,parent,modal:true,show:false,autoHideMenuBar:true,backgroundColor:'#0a0a09',title:'Choose what to share',webPreferences:{contextIsolation:true,sandbox:true,preload:__dirname+'/picker.js'}})
const html='<!doctype html><meta charset=utf-8><style>body{margin:0;background:#0a0a09;color:#eee;font:13px system-ui;padding:14px}h1{font-size:16px;margin:0 0 12px}div{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px}button{background:#17171a;border:2px solid #2a2a30;border-radius:10px;color:#eee;padding:8px;cursor:pointer;text-align:left}button:hover{border-color:#8a8aa0}img{width:100%;border-radius:6px;display:block;margin-bottom:6px}span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}</style><h1>Choose what to share</h1><div>'+sources.map(s=>'<button data-id="'+esc(s.id)+'"><img src="'+s.thumbnail.toDataURL()+'"><span>'+esc(s.name)+'</span></button>').join('')+'</div><script>document.querySelectorAll("button").forEach(b=>b.onclick=()=>window.pickSource(b.dataset.id))</script>'
let done=false
const fin=id=>{if(done)return;done=true;ipcMain.removeListener('pick-source',h);if(!p.isDestroyed())p.destroy();res(id)}
const h=(e,id)=>{if(e.sender===p.webContents)fin(id)}
ipcMain.on('pick-source',h)
p.on('closed',()=>fin(null))
p.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(html))
p.once('ready-to-show',()=>p.show())
})
app.whenReady().then(()=>{
const w=new BrowserWindow({width:1280,height:800,backgroundColor:'#0a0a09',autoHideMenuBar:true,icon:__dirname+'/icon.png',webPreferences:{contextIsolation:true,sandbox:true,backgroundThrottling:false}})
const ses=w.webContents.session
ses.setPermissionRequestHandler((wc,perm,cb,d)=>cb(['media','notifications','fullscreen','clipboard-sanitized-write','clipboard-read'].includes(perm)&&(d.requestingUrl||'').startsWith(O)))
ses.setPermissionCheckHandler((wc,perm,origin)=>origin.startsWith(O)&&['media','notifications','fullscreen','clipboard-sanitized-write'].includes(perm))
ses.setDisplayMediaRequestHandler(async(req,cb)=>{
try{
if(!req.userGesture||!(req.frame?.url||'').startsWith(O))return cb({})
const src=await desktopCapturer.getSources({types:process.platform==='linux'?['screen']:['screen','window'],thumbnailSize:process.platform==='linux'?{width:0,height:0}:{width:420,height:260}})
if(!src.length)return cb({})
const id=process.platform==='linux'?src[0].id:await pick(w,src)
const s=src.find(x=>x.id===id)
if(!s)return cb({})
const r={video:s}
if(req.audioRequested&&process.platform==='win32')r.audio='loopback'
cb(r)
}catch{cb({})}
})
w.loadURL(U)
w.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith(O))return{action:'allow'};shell.openExternal(url);return{action:'deny'}})
})
app.on('window-all-closed',()=>app.quit())
